const express = require('express')
const Joi = require('joi')
const { query, transaction } = require('../config/database')
const { authenticateToken } = require('../middleware/auth')
const pdfService = require('../services/pdfService')
const calculationService = require('../services/calculationService')
const archivingService = require('../services/archivingService')
const advanceInvoiceService = require('../services/advanceInvoiceService')

const router = express.Router()

// Schémas de validation
const invoiceItemSchema = Joi.object({
  serviceId: Joi.string().uuid().optional(),
  description: Joi.string().min(1).max(255).required(),
  quantity: Joi.number().positive().required(),
  unitPriceHt: Joi.number().positive().required(),
  vatRate: Joi.number().min(0).max(100).required(),
  sortOrder: Joi.number().integer().min(0).default(0),
})

const invoiceSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  quoteId: Joi.string().uuid().optional(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional(),
  dueDate: Joi.date().optional(),
  notes: Joi.string().optional(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
})

const paymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string()
    .valid('cash', 'check', 'transfer', 'card')
    .default('cash'),
  paymentDate: Joi.date().required(),
  reference: Joi.string().optional(),
  notes: Joi.string().optional(),
})

// Fonction pour générer le numéro de facture
async function generateInvoiceNumber(userId) {
  const result = await query(
    'SELECT COUNT(*) as count FROM invoices WHERE user_id = $1',
    [userId]
  )

  const count = parseInt(result.rows[0].count) + 1
  const year = new Date().getFullYear()
  return `FAC-${year}-${count.toString().padStart(4, '0')}`
}

// GET /api/invoices - Récupérer toutes les factures
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      status,
      clientId,
      search,
      page = 1,
      limit = 20,
      sortBy,
      sortOrder,
    } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE i.user_id = $1'
    let queryParams = [req.user.userId]
    let paramCount = 1

    if (status) {
      paramCount++
      whereClause += ` AND i.status = $${paramCount}`
      queryParams.push(status)
    }

    if (clientId) {
      paramCount++
      whereClause += ` AND i.client_id = $${paramCount}`
      queryParams.push(clientId)
    }

    if (search) {
      paramCount++
      whereClause += ` AND (
                i.invoice_number ILIKE $${paramCount} OR 
                i.title ILIKE $${paramCount} OR 
                i.description ILIKE $${paramCount} OR
                c.first_name ILIKE $${paramCount} OR 
                c.last_name ILIKE $${paramCount} OR 
                c.company_name ILIKE $${paramCount}
            )`
      queryParams.push(`%${search}%`)
    }

    // Tri sécurisé
    const allowedSort = new Map([
      ['created_at', 'i.created_at'],
      ['updated_at', 'i.updated_at'],
      ['invoice_number', 'i.invoice_number'],
      ['total_ttc', 'i.total_ttc'],
      ['status', 'i.status'],
      ['due_date', 'i.due_date'],
    ])
    const orderCol =
      allowedSort.get(String(sortBy || '').toLowerCase()) || 'i.created_at'
    const orderDir =
      String(sortOrder || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    const result = await query(
      `SELECT i.id, i.client_id, i.quote_id, i.invoice_number, i.title, i.description, i.status, 
              i.subtotal_ht, i.total_vat, i.total_ttc, i.paid_amount, i.due_date, i.notes, i.created_at, i.updated_at,
              c.first_name, c.last_name, c.company_name
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       ${whereClause}
       ORDER BY ${orderCol} ${orderDir}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    )

    // Compter le total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM invoices i ${whereClause}`,
      queryParams
    )

    res.json({
      invoices: result.rows.map((invoice) => ({
        id: invoice.id,
        clientId: invoice.client_id,
        quoteId: invoice.quote_id,
        clientName: `${invoice.first_name} ${invoice.last_name}`,
        clientCompany: invoice.company_name,
        invoiceNumber: invoice.invoice_number,
        title: invoice.title,
        description: invoice.description,
        status: invoice.status,
        subtotalHt: parseFloat(invoice.subtotal_ht),
        totalVat: parseFloat(invoice.total_vat),
        totalTtc: parseFloat(invoice.total_ttc),
        paidAmount: parseFloat(invoice.paid_amount),
        dueDate: invoice.due_date,
        notes: invoice.notes,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/invoices/:id - Récupérer une facture spécifique avec ses lignes et paiements
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params

    // Récupérer la facture
    const invoiceResult = await query(
      `SELECT i.id, i.client_id, i.quote_id, i.invoice_number, i.title, i.description, i.status, 
              i.subtotal_ht, i.total_vat, i.total_ttc, i.paid_amount, i.due_date, i.notes, i.created_at, i.updated_at,
              c.first_name, c.last_name, c.company_name, c.email, c.phone, c.address_line1, c.address_line2, c.postal_code, c.city, c.country
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [id, req.user.userId]
    )

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Facture non trouvée',
      })
    }

    const invoice = invoiceResult.rows[0]

    // Récupérer les lignes de la facture
    const itemsResult = await query(
      `SELECT id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, total_ht, total_ttc, sort_order, section_id
       FROM invoice_items
       WHERE invoice_id = $1
       ORDER BY sort_order, created_at`,
      [id]
    )

    // Récupérer les paiements
    const paymentsResult = await query(
      `SELECT id, amount, payment_method, payment_date, reference, notes, created_at
       FROM payments
       WHERE invoice_id = $1
       ORDER BY payment_date DESC`,
      [id]
    )

    res.json({
      invoice: {
        id: invoice.id,
        clientId: invoice.client_id,
        quoteId: invoice.quote_id,
        client: {
          id: invoice.client_id,
          firstName: invoice.first_name,
          lastName: invoice.last_name,
          companyName: invoice.company_name,
          email: invoice.email,
          phone: invoice.phone,
          addressLine1: invoice.address_line1,
          addressLine2: invoice.address_line2,
          postalCode: invoice.postal_code,
          city: invoice.city,
          country: invoice.country,
        },
        invoiceNumber: invoice.invoice_number,
        title: invoice.title,
        description: invoice.description,
        status: invoice.status,
        subtotalHt: parseFloat(invoice.subtotal_ht),
        totalVat: parseFloat(invoice.total_vat),
        totalTtc: parseFloat(invoice.total_ttc),
        paidAmount: parseFloat(invoice.paid_amount),
        dueDate: invoice.due_date,
        notes: invoice.notes,
        items: itemsResult.rows.map((item) => ({
          id: item.id,
          serviceId: item.service_id,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPriceHt: parseFloat(item.unit_price_ht),
          unitPriceTtc: parseFloat(item.unit_price_ttc),
          vatRate: parseFloat(item.vat_rate),
          totalHt: parseFloat(item.total_ht),
          totalTtc: parseFloat(item.total_ttc),
          sortOrder: item.sort_order,
        })),
        payments: paymentsResult.rows.map((payment) => ({
          id: payment.id,
          amount: parseFloat(payment.amount),
          paymentMethod: payment.payment_method,
          paymentDate: payment.payment_date,
          reference: payment.reference,
          notes: payment.notes,
          createdAt: payment.created_at,
        })),
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/invoices - Créer une nouvelle facture
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = invoiceSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const { clientId, quoteId, title, description, dueDate, notes, items } =
      value

    // Valider les items
    const itemsValidation = calculationService.validateItems(items)
    if (!itemsValidation.isValid) {
      return res.status(400).json({
        error: 'Données des items invalides',
        details: itemsValidation.errors,
      })
    }

    // Vérifier que le client appartient à l'utilisateur
    const clientResult = await query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, req.user.userId]
    )

    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Client non trouvé',
      })
    }

    // Si quoteId est fourni, vérifier qu'il appartient à l'utilisateur
    if (quoteId) {
      const quoteResult = await query(
        'SELECT id FROM quotes WHERE id = $1 AND user_id = $2',
        [quoteId, req.user.userId]
      )

      if (quoteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Devis non trouvé',
        })
      }
    }

    const result = await transaction(async (client) => {
      // Générer le numéro de facture via company_settings (prefix + counter, reset annuel)
      const year = new Date().getFullYear()
      // Verrouiller les paramètres d'entreprise
      const settingsRes = await client.query(
        'SELECT invoice_prefix, invoice_counter FROM company_settings WHERE user_id = $1 FOR UPDATE',
        [req.user.userId]
      )
      const prefix = settingsRes.rows[0]?.invoice_prefix || 'FAC'
      let counter = settingsRes.rows[0]?.invoice_counter ?? 0

      const currentYearCountRes = await client.query(
        'SELECT COUNT(*) AS cnt FROM invoices WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2',
        [req.user.userId, year]
      )
      const hasAnyThisYear = parseInt(currentYearCountRes.rows[0].cnt, 10) > 0
      if (!hasAnyThisYear) {
        counter = 0
      }
      counter += 1

      await client.query(
        'UPDATE company_settings SET invoice_counter = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [counter, req.user.userId]
      )

      const invoiceNumber = `${prefix}-${year}-${String(counter).padStart(4, '0')}`

      // Calculer les totaux automatiquement
      const calculations = calculationService.calculateTotals(items)

      // Créer la facture
      const invoiceResult = await client.query(
        `INSERT INTO invoices (user_id, client_id, quote_id, invoice_number, title, description, status, subtotal_ht, total_vat, total_ttc, paid_amount, due_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, 0, $10, $11)
         RETURNING id, invoice_number, title, description, status, subtotal_ht, total_vat, total_ttc, paid_amount, due_date, notes, created_at, updated_at`,
        [
          req.user.userId,
          clientId,
          quoteId,
          invoiceNumber,
          title,
          description,
          calculations.subtotalHt,
          calculations.totalVat,
          calculations.totalTtc,
          dueDate,
          notes,
        ]
      )

      const invoice = invoiceResult.rows[0]

      // Créer les lignes de la facture avec les calculs automatiques
      const invoiceItems = []
      for (let i = 0; i < calculations.items.length; i++) {
        const item = calculations.items[i]
        const itemResult = await client.query(
          `INSERT INTO invoice_items (invoice_id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, total_ht, total_ttc, sort_order, section_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, total_ht, total_ttc, sort_order, section_id`,
          [
            invoice.id,
            item.serviceId,
            item.description,
            item.quantity,
            item.unitPriceHt,
            item.unitPriceTtc,
            item.vatRate,
            item.totalHt,
            item.totalTtc,
            item.sortOrder || i,
            item.sectionId || null,
          ]
        )
        invoiceItems.push(itemResult.rows[0])
      }

      return { invoice, items: invoiceItems }
    })

    res.status(201).json({
      message: 'Facture créée avec succès',
      invoice: {
        id: result.invoice.id,
        invoiceNumber: result.invoice.invoice_number,
        title: result.invoice.title,
        description: result.invoice.description,
        status: result.invoice.status,
        subtotalHt: parseFloat(result.invoice.subtotal_ht),
        totalVat: parseFloat(result.invoice.total_vat),
        totalTtc: parseFloat(result.invoice.total_ttc),
        paidAmount: parseFloat(result.invoice.paid_amount),
        dueDate: result.invoice.due_date,
        notes: result.invoice.notes,
        items: result.items.map((item) => ({
          id: item.id,
          serviceId: item.service_id,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPriceHt: parseFloat(item.unit_price_ht),
          unitPriceTtc: parseFloat(item.unit_price_ttc),
          vatRate: parseFloat(item.vat_rate),
          totalHt: parseFloat(item.total_ht),
          totalTtc: parseFloat(item.total_ttc),
          sortOrder: item.sort_order,
        })),
        createdAt: result.invoice.created_at,
        updatedAt: result.invoice.updated_at,
      },
    })

    // Audit
    try {
      await logAudit({
        userId: req.user.userId,
        entityType: 'invoice',
        entityId: result.invoice.id,
        action: 'create',
        metadata: { invoiceNumber: result.invoice.invoice_number },
      })
    } catch (_) {}
  } catch (error) {
    next(error)
  }
})

// POST /api/invoices/:id/payments - Ajouter un paiement
router.post('/:id/payments', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params
    const { error, value } = paymentSchema.validate(req.body)

    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const { amount, paymentMethod, paymentDate, reference, notes } = value

    // Vérifier les contraintes NF525 pour les paiements espèces
    if (paymentMethod === 'cash') {
      const nf525Result = await query(
        `SELECT 
                    cs.cash_payments_enabled, 
                    cs.cash_payment_limit,
                    cs.nf525_compliant,
                    i.is_b2c,
                    c.is_resident
                 FROM company_settings cs
                 LEFT JOIN invoices i ON i.user_id = cs.user_id AND i.id = $1
                 LEFT JOIN clients c ON c.id = i.client_id
                 WHERE cs.user_id = $2`,
        [id, req.user.userId]
      )

      if (nf525Result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Paramètres de l'entreprise non trouvés" })
      }

      const settings = nf525Result.rows[0]

      // Vérifier si les paiements espèces sont autorisés
      if (!settings.cash_payments_enabled) {
        return res.status(400).json({
          error: 'Paiements espèces non autorisés',
          message:
            'Les paiements en espèces sont désactivés pour cette entreprise',
        })
      }

      // Vérifier le plafond
      if (amount > settings.cash_payment_limit) {
        return res.status(400).json({
          error: 'Plafond espèces dépassé',
          message: `Le montant ${amount}€ dépasse le plafond autorisé de ${settings.cash_payment_limit}€`,
        })
      }

      // Journaliser le paiement espèces
      console.log(
        `[NF525] Paiement espèces: ${amount}€ - Facture: ${id} - Utilisateur: ${req.user.userId}`
      )
    }

    const result = await transaction(async (client) => {
      // Vérifier que la facture existe et appartient à l'utilisateur
      const invoiceResult = await query(
        'SELECT id, total_ttc, paid_amount, status FROM invoices WHERE id = $1 AND user_id = $2',
        [id, req.user.userId]
      )

      if (invoiceResult.rows.length === 0) {
        throw new Error('Facture non trouvée')
      }

      const invoice = invoiceResult.rows[0]
      if (invoice.status === 'paid') {
        throw new Error('Facture déjà payée')
      }
      const newPaidAmount = parseFloat(invoice.paid_amount) + amount
      const newStatus =
        newPaidAmount >= parseFloat(invoice.total_ttc) ? 'paid' : 'pending'

      // Ajouter le paiement
      const paymentResult = await query(
        `INSERT INTO payments (invoice_id, amount, payment_method, payment_date, reference, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, amount, payment_method, payment_date, reference, notes, created_at`,
        [id, amount, paymentMethod, paymentDate, reference, notes]
      )

      // Mettre à jour la facture
      await query(
        'UPDATE invoices SET paid_amount = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [newPaidAmount, newStatus, id]
      )

      return paymentResult.rows[0]
    })

    res.status(201).json({
      message: 'Paiement ajouté avec succès',
      payment: {
        id: result.id,
        amount: parseFloat(result.amount),
        paymentMethod: result.payment_method,
        paymentDate: result.payment_date,
        reference: result.reference,
        notes: result.notes,
        createdAt: result.created_at,
      },
    })
  } catch (error) {
    if (error.message === 'Facture non trouvée') {
      return res.status(404).json({
        error: 'Facture non trouvée',
      })
    }
    next(error)
  }
})

// PUT /api/invoices/:id/status - Mettre à jour le statut d'une facture
router.put('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Interdire 'cancelled' (conformité FR: pas d'annulation, utiliser un avoir)
    if (!['pending', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({
        error: 'Statut invalide',
        message:
          "Le statut doit être: pending, paid ou overdue (pas d'annulation)",
      })
    }

    const result = await query(
      `UPDATE invoices 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING id, status, updated_at`,
      [status, id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Facture non trouvée',
      })
    }

    res.json({
      message: 'Statut de la facture mis à jour avec succès',
      status: result.rows[0].status,
      updatedAt: result.rows[0].updated_at,
    })

    // Audit
    try {
      await logAudit({
        userId: req.user.userId,
        entityType: 'invoice',
        entityId: id,
        action: 'status',
        metadata: { status },
      })
    } catch (_) {}
  } catch (error) {
    next(error)
  }
})

// DELETE /api/invoices/:id - Supprimer une facture
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Conformité FR: interdire la suppression de factures
    return res.status(400).json({
      error: 'Suppression interdite',
      message: 'La suppression de factures est interdite. Utilisez un avoir.',
    })
  } catch (error) {
    next(error)
  }
})

// GET /:id/pdf - Générer le PDF de la facture
router.get('/:id/pdf', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params

    // Récupérer la facture avec les informations client
    const invoiceResult = await query(
      `SELECT i.id, i.client_id, i.quote_id, i.invoice_number, i.title, i.description, i.status, 
              i.subtotal_ht, i.total_vat, i.total_ttc, i.paid_amount, i.due_date, i.notes, i.created_at, i.updated_at,
              c.first_name, c.last_name, c.company_name, c.email, c.phone, c.address_line1, c.address_line2, c.postal_code, c.city, c.country
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [id, req.user.userId]
    )

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Facture non trouvée',
      })
    }

    const invoice = invoiceResult.rows[0]

    // Récupérer les lignes de la facture
    const itemsResult = await query(
      `SELECT id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, total_ht, total_ttc, sort_order, section_id
       FROM invoice_items
       WHERE invoice_id = $1
       ORDER BY sort_order, created_at`,
      [id]
    )

    // Récupérer les paramètres de l'entreprise
    const companyResult = await query(
      `SELECT * FROM company_settings WHERE user_id = $1`,
      [req.user.userId]
    )

    const companySettings = companyResult.rows[0] || {}

    // Si la facture provient d'un devis, charger les sections du devis et la correspondance des items
    let sections = []
    let sectionBySortOrder = new Map()
    let unitBySortOrder = new Map()
    let discountBySortOrder = new Map()
    let markupBySortOrder = new Map()
    if (invoice.quote_id) {
      try {
        const secRes = await query(
          `SELECT id, title, description, sort_order FROM quote_sections WHERE quote_id = $1 ORDER BY sort_order, created_at`,
          [invoice.quote_id]
        )
        sections = secRes.rows || []
        const qiRes = await query(
          `SELECT section_id, sort_order, unit, discount_percent, markup_percent FROM quote_items WHERE quote_id = $1`,
          [invoice.quote_id]
        )
        for (const r of qiRes.rows) {
          if (r && typeof r.sort_order === 'number') {
            sectionBySortOrder.set(r.sort_order, r.section_id)
            if (r.unit) unitBySortOrder.set(r.sort_order, r.unit)
            if (r.discount_percent != null)
              discountBySortOrder.set(
                r.sort_order,
                parseFloat(r.discount_percent)
              )
            if (r.markup_percent != null)
              markupBySortOrder.set(r.sort_order, parseFloat(r.markup_percent))
          }
        }
      } catch (_) {
        /* ignore */
      }
    }

    // Préparer les données de la facture
    // Récupérer l'adresse de chantier depuis le devis lié (si présent)
    let siteAddress = null
    if (invoice.quote_id) {
      try {
        const saRes = await query(
          `SELECT site_same_as_billing, site_address_line1, site_address_line2, site_postal_code, site_city, site_country
                     FROM quotes WHERE id = $1`,
          [invoice.quote_id]
        )
        if (saRes.rows.length) {
          const sa = saRes.rows[0]
          siteAddress = {
            sameAsBilling: !!sa.site_same_as_billing,
            addressLine1: sa.site_address_line1,
            addressLine2: sa.site_address_line2,
            postalCode: sa.site_postal_code,
            city: sa.site_city,
            country: sa.site_country,
          }
        }
      } catch (_) {
        /* ignore */
      }
    }
    const invoiceData = {
      id: invoice.id,
      clientId: invoice.client_id,
      quoteId: invoice.quote_id,
      client: {
        id: invoice.client_id,
        firstName: invoice.first_name,
        lastName: invoice.last_name,
        companyName: invoice.company_name,
        email: invoice.email,
        phone: invoice.phone,
        addressLine1: invoice.address_line1,
        addressLine2: invoice.address_line2,
        postalCode: invoice.postal_code,
        city: invoice.city,
        country: invoice.country,
      },
      invoiceNumber: invoice.invoice_number,
      title: invoice.title,
      description: invoice.description,
      status: invoice.status,
      subtotalHt: parseFloat(invoice.subtotal_ht),
      totalVat: parseFloat(invoice.total_vat),
      totalTtc: parseFloat(invoice.total_ttc),
      paidAmount: parseFloat(invoice.paid_amount),
      dueDate: invoice.due_date,
      notes: invoice.notes,
      items: itemsResult.rows.map((item) => ({
        id: item.id,
        serviceId: item.service_id,
        description: item.description,
        quantity: item.quantity,
        unitPriceHt: parseFloat(item.unit_price_ht),
        unitPriceTtc: parseFloat(item.unit_price_ttc),
        vatRate: parseFloat(item.vat_rate),
        totalHt: parseFloat(item.total_ht),
        totalTtc: parseFloat(item.total_ttc),
        sortOrder: item.sort_order,
        sectionId: sectionBySortOrder.get(item.sort_order) || null,
        unit: unitBySortOrder.get(item.sort_order) || null,
        discountPercent: discountBySortOrder.get(item.sort_order) || null,
        markupPercent: markupBySortOrder.get(item.sort_order) || null,
      })),
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        sortOrder: s.sort_order,
      })),
      siteAddress,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
    }

    // Générer le PDF
    const pdfBuffer = await pdfService.generateInvoicePDF(
      invoiceData,
      companySettings
    )

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="facture-${invoice.invoice_number}.pdf"`
    )
    res.setHeader('Content-Length', pdfBuffer.length)

    // Envoyer le PDF
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
})

// Conversion d'un devis en facture
router.post('/from-quote/:id', authenticateToken, async (req, res, next) => {
  const { id: quoteId } = req.params

  try {
    // Récupérer le devis avec ses lignes et le client
    const quoteQuery = `
            SELECT 
                q.*,
                c.id as client_id,
                c.first_name, c.last_name, c.company_name, c.email, c.phone,
                c.address_line1, c.address_line2, c.postal_code, c.city, c.country,
                c.is_company, c.siret, c.vat_number, c.legal_form, c.rcs_number, c.ape_code, c.capital_social
            FROM quotes q
            LEFT JOIN clients c ON q.client_id = c.id
            WHERE q.id = $1 AND q.user_id = $2
        `
    const quoteResult = await query(quoteQuery, [quoteId, req.user.userId])

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Devis non trouvé' })
    }

    const quote = quoteResult.rows[0]

    // Vérifier que le devis est accepté
    if (quote.status !== 'accepted') {
      return res.status(400).json({
        message: 'Seuls les devis acceptés peuvent être convertis en facture',
      })
    }

    // Utiliser une transaction atomique pour la conversion devis → facture
    const result = await transaction(async (client) => {
      // Récupérer les lignes du devis
      const itemsQuery = `
                SELECT 
                    service_id, description, quantity, unit_price_ht, unit_price_ttc, 
                    vat_rate, total_ht, total_ttc, sort_order, discount_percent, markup_percent, unit
                FROM quote_items 
                WHERE quote_id = $1
                ORDER BY sort_order, created_at
            `
      const itemsResult = await client.query(itemsQuery, [quoteId])

      // Générer le numéro de facture via company_settings
      const year = new Date().getFullYear()
      const settingsRes = await client.query(
        'SELECT invoice_prefix, invoice_counter FROM company_settings WHERE user_id = $1 FOR UPDATE',
        [req.user.userId]
      )
      const prefix = settingsRes.rows[0]?.invoice_prefix || 'FAC'
      let counter = settingsRes.rows[0]?.invoice_counter ?? 0

      const currentYearCountRes = await client.query(
        'SELECT COUNT(*) AS cnt FROM invoices WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2',
        [req.user.userId, year]
      )
      const hasAnyThisYear = parseInt(currentYearCountRes.rows[0].cnt, 10) > 0
      if (!hasAnyThisYear) {
        counter = 0
      }
      counter += 1

      await client.query(
        'UPDATE company_settings SET invoice_counter = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [counter, req.user.userId]
      )

      const invoiceNumber = `${prefix}-${year}-${String(counter).padStart(4, '0')}`

      // Calculer les totaux
      const calculations = calculationService.calculateTotals(
        itemsResult.rows.map((item) => ({
          quantity: parseFloat(item.quantity),
          unitPriceHt: parseFloat(item.unit_price_ht),
          vatRate: parseFloat(item.vat_rate),
          discountPercent: item.discount_percent
            ? parseFloat(item.discount_percent)
            : 0,
          markupPercent: item.markup_percent
            ? parseFloat(item.markup_percent)
            : 0,
        }))
      )

      // Créer la facture
      const invoiceQuery = `
                INSERT INTO invoices (
                    user_id, client_id, quote_id, invoice_number, title, description,
                    subtotal_ht, total_vat, total_ttc, due_date, notes, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30) // 30 jours par défaut

      const invoiceResult = await client.query(invoiceQuery, [
        req.user.userId,
        quote.client_id,
        quoteId,
        invoiceNumber,
        quote.title || `Facture ${invoiceNumber}`,
        quote.description || `Facture basée sur le devis ${quote.quote_number}`,
        calculations.subtotalHt,
        calculations.totalVat,
        calculations.totalTtc,
        dueDate,
        quote.notes,
        'pending',
      ])

      const invoice = invoiceResult.rows[0]

      // Créer les lignes de facture
      for (const item of itemsResult.rows) {
        const itemCalculations = calculationService.calculateTotals([
          {
            quantity: parseFloat(item.quantity),
            unitPriceHt: parseFloat(item.unit_price_ht),
            vatRate: parseFloat(item.vat_rate),
            discountPercent: item.discount_percent
              ? parseFloat(item.discount_percent)
              : 0,
            markupPercent: item.markup_percent
              ? parseFloat(item.markup_percent)
              : 0,
          },
        ])

        const itemQuery = `
                    INSERT INTO invoice_items (
                        invoice_id, service_id, description, quantity, unit_price_ht, unit_price_ttc,
                        vat_rate, total_ht, total_ttc, sort_order, section_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `

        await client.query(itemQuery, [
          invoice.id,
          item.service_id,
          item.description,
          item.quantity,
          item.unit_price_ht,
          itemCalculations.items[0].unitPriceTtc,
          item.vat_rate,
          itemCalculations.items[0].totalHt,
          itemCalculations.items[0].totalTtc,
          item.sort_order,
          item.section_id,
        ])
      }

      // Mettre à jour le statut du devis
      await client.query('UPDATE quotes SET status = $1 WHERE id = $2', [
        'converted',
        quoteId,
      ])

      return invoice
    })

    // Récupérer la facture complète avec le client
    const fullInvoiceQuery = `
            SELECT 
                i.*,
                c.first_name, c.last_name, c.company_name, c.email, c.phone,
                c.address_line1, c.address_line2, c.postal_code, c.city, c.country,
                c.is_company, c.siret, c.vat_number, c.legal_form, c.rcs_number, c.ape_code, c.capital_social
            FROM invoices i
            LEFT JOIN clients c ON i.client_id = c.id
            WHERE i.id = $1
        `
    const fullInvoiceResult = await query(fullInvoiceQuery, [result.id])
    const fullInvoice = fullInvoiceResult.rows[0]

    // Formater la réponse
    const response = {
      id: fullInvoice.id,
      invoiceNumber: fullInvoice.invoice_number,
      title: fullInvoice.title,
      description: fullInvoice.description,
      clientId: fullInvoice.client_id,
      quoteId: fullInvoice.quote_id,
      subtotalHt: parseFloat(fullInvoice.subtotal_ht),
      totalVat: parseFloat(fullInvoice.total_vat),
      totalTtc: parseFloat(fullInvoice.total_ttc),
      dueDate: fullInvoice.due_date,
      notes: fullInvoice.notes,
      status: fullInvoice.status,
      createdAt: fullInvoice.created_at,
      updatedAt: fullInvoice.updated_at,
      client: {
        id: fullInvoice.client_id,
        firstName: fullInvoice.first_name,
        lastName: fullInvoice.last_name,
        companyName: fullInvoice.company_name,
        email: fullInvoice.email,
        phone: fullInvoice.phone,
        addressLine1: fullInvoice.address_line1,
        addressLine2: fullInvoice.address_line2,
        postalCode: fullInvoice.postal_code,
        city: fullInvoice.city,
        country: fullInvoice.country,
        isCompany: fullInvoice.is_company,
        siret: fullInvoice.siret,
        vatNumber: fullInvoice.vat_number,
        legalForm: fullInvoice.legal_form,
        rcsNumber: fullInvoice.rcs_number,
        apeCode: fullInvoice.ape_code,
        capitalSocial: fullInvoice.capital_social,
      },
    }

    res.status(201).json({
      message: 'Facture créée avec succès à partir du devis',
      invoice: response,
    })
  } catch (error) {
    console.error('Erreur lors de la conversion devis → facture:', error)
    next(error)
  }
})

// Route pour archiver une facture
router.post('/:id/archive', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Récupérer la facture
    const invoiceResult = await query(
      `SELECT i.*, c.*, cs.* 
             FROM invoices i
             LEFT JOIN clients c ON i.client_id = c.id
             LEFT JOIN company_settings cs ON i.user_id = cs.user_id
             WHERE i.id = $1 AND i.user_id = $2`,
      [id, req.user.userId]
    )

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }

    const invoice = invoiceResult.rows[0]

    // Générer le PDF
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice)

    // Archiver la facture
    const archiveInfo = await archivingService.archiveInvoice(
      invoice,
      pdfBuffer,
      invoice
    )

    res.json({
      message: 'Facture archivée avec succès',
      archiveInfo,
    })
  } catch (error) {
    console.error("Erreur lors de l'archivage:", error)
    res.status(500).json({ error: "Erreur lors de l'archivage de la facture" })
  }
})

// Route pour vérifier l'intégrité d'une facture
router.get('/:id/verify', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const verification = await archivingService.verifyInvoiceIntegrity(id)

    res.json({
      invoiceId: id,
      verification,
    })
  } catch (error) {
    console.error('Erreur lors de la vérification:', error)
    res
      .status(500)
      .json({ error: 'Erreur lors de la vérification de la facture' })
  }
})

// Route pour récupérer l'historique d'une facture
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Vérifier que la facture appartient à l'utilisateur
    const invoiceResult = await query(
      'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    )

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }

    const history = await archivingService.getInvoiceHistory(id)

    res.json({
      invoiceId: id,
      history,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error)
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de l'historique" })
  }
})

// Route pour générer un rapport d'audit
router.get('/audit/report', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Dates de début et de fin requises',
      })
    }

    const report = await archivingService.generateAuditReport(
      new Date(startDate),
      new Date(endDate),
      req.user.userId
    )

    res.json(report)
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error)
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' })
  }
})

// Schéma de validation pour facture d'acompte
const advanceInvoiceSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  quoteId: Joi.string().uuid().optional(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  advanceAmount: Joi.number().positive().required(),
  totalAmount: Joi.number().positive().required(),
  dueDate: Joi.date().required(),
  notes: Joi.string().max(1000).optional(),
  purchaseOrderNumber: Joi.string().max(100).optional(),
})

// Schéma de validation pour facture de solde
const finalInvoiceSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  quoteId: Joi.string().uuid().optional(),
  parentInvoiceId: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  dueDate: Joi.date().required(),
  notes: Joi.string().max(1000).optional(),
  purchaseOrderNumber: Joi.string().max(100).optional(),
})

// Route pour créer une facture d'acompte
router.post('/advance', authenticateToken, async (req, res) => {
  try {
    const { error, value } = advanceInvoiceSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const invoice = await advanceInvoiceService.createAdvanceInvoice({
      ...value,
      userId: req.user.userId,
    })

    res.status(201).json({
      message: "Facture d'acompte créée avec succès",
      invoice,
    })
  } catch (error) {
    console.error("Erreur lors de la création de la facture d'acompte:", error)
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la facture d'acompte" })
  }
})

// Route pour créer une facture de solde
router.post('/final', authenticateToken, async (req, res) => {
  try {
    const { error, value } = finalInvoiceSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const result = await advanceInvoiceService.createFinalInvoice({
      ...value,
      userId: req.user.userId,
    })

    res.status(201).json({
      message: 'Facture de solde créée avec succès',
      invoice: result.invoice,
      items: result.items,
    })
  } catch (error) {
    console.error('Erreur lors de la création de la facture de solde:', error)
    res
      .status(500)
      .json({ error: 'Erreur lors de la création de la facture de solde' })
  }
})

// Route pour récupérer les factures liées
router.get('/:id/related', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Vérifier que la facture appartient à l'utilisateur
    const invoiceResult = await query(
      'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    )

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }

    const relatedInvoices = await advanceInvoiceService.getRelatedInvoices(
      req.user.userId,
      id
    )

    res.json(relatedInvoices)
  } catch (error) {
    console.error('Erreur lors de la récupération des factures liées:', error)
    res
      .status(500)
      .json({ error: 'Erreur lors de la récupération des factures liées' })
  }
})

// Route pour récupérer le statut de paiement d'un projet
router.get('/:id/payment-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Vérifier que la facture appartient à l'utilisateur
    const invoiceResult = await query(
      'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    )

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }

    const paymentStatus = await advanceInvoiceService.getPaymentStatus(
      req.user.userId,
      id
    )

    res.json(paymentStatus)
  } catch (error) {
    console.error(
      'Erreur lors de la récupération du statut de paiement:',
      error
    )
    res
      .status(500)
      .json({ error: 'Erreur lors de la récupération du statut de paiement' })
  }
})

module.exports = router
