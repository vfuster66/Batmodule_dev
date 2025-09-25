const express = require('express')
const Joi = require('joi')
const { query, transaction } = require('../config/database')
const { logAudit } = require('../services/auditService')
const { authenticateToken } = require('../middleware/auth')
const pdfService = require('../services/pdfServiceSimple')
const calculationService = require('../services/calculationService')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

const router = express.Router()

// S'assurer que le schéma des sections existe (environnement déjà en prod sans migration)
async function ensureQuoteSchema() {
  // Skip schema creation in test environment
  if (process.env.NODE_ENV === 'test') {
    return
  }

  try {
    await query(`CREATE TABLE IF NOT EXISTS quote_sections (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`)

    await query(
      'ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES quote_sections(id) ON DELETE SET NULL'
    )
    await query(
      'ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS unit VARCHAR(50)'
    )
    await query(
      'ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0'
    )
    await query(
      'ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS markup_percent DECIMAL(5,2) DEFAULT 0'
    )

    // Adresse de chantier (si pas de migrations en place)
    await query(
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS site_address_line1 TEXT'
    )
    await query(
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS site_address_line2 TEXT'
    )
    await query(
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS site_postal_code TEXT'
    )
    await query('ALTER TABLE quotes ADD COLUMN IF NOT EXISTS site_city TEXT')
    await query('ALTER TABLE quotes ADD COLUMN IF NOT EXISTS site_country TEXT')
    await query(
      'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS site_same_as_billing BOOLEAN DEFAULT false'
    )
  } catch (e) {
    // no-op: si l'utilisateur n'a pas de droits migration, laisser l'erreur normale remonter
  }
}

// Schémas annexes (emails, tokens, historique)
async function ensureQuoteAuxSchemas() {
  // Skip schema creation in test environment
  if (process.env.NODE_ENV === 'test') {
    return
  }

  try {
    await query(`CREATE TABLE IF NOT EXISTS email_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
            to_email TEXT NOT NULL,
            cc_email TEXT,
            subject TEXT,
            status TEXT NOT NULL DEFAULT 'queued',
            provider_id TEXT,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`)

    await query(`CREATE TABLE IF NOT EXISTS quote_tokens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            purpose TEXT NOT NULL, -- 'public', 'sign'
            expires_at TIMESTAMP WITH TIME ZONE,
            used_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`)

    await query(`CREATE TABLE IF NOT EXISTS quote_status_history (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL, -- 'created','sent','viewed','accepted','rejected'
            ip INET,
            user_agent TEXT,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`)
  } catch (e) {
    /* no-op */
  }
}

// Transport mail générique (SMTP) - faible coût / gratuit selon fournisseur
function createMailTransport() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    // Fallback: transport de log (ne fait qu'afficher en console)
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    })
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

function absolutePublicUrl(req, quoteId, token) {
  // Le lien public doit pointer vers le frontend, pas l'API
  const base = process.env.FRONTEND_URL || 'http://localhost:3000'
  return `${base}/quotes/${quoteId}/public?token=${encodeURIComponent(token)}`
}

// Schémas de validation
const quoteItemSchema = Joi.object({
  serviceId: Joi.string().uuid().optional(),
  sectionId: Joi.string().uuid().optional(),
  description: Joi.string().min(1).max(255).required(),
  unit: Joi.string().max(50).optional(),
  quantity: Joi.number().positive().required(),
  unitPriceHt: Joi.number().min(0).required(),
  vatRate: Joi.number().min(0).max(100).required(),
  discountPercent: Joi.number().min(0).max(100).optional(),
  markupPercent: Joi.number().min(0).max(100).optional(),
  sortOrder: Joi.number().integer().min(0).default(0),
})

const quoteSectionSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('').optional(),
  sortOrder: Joi.number().integer().min(0).default(0),
  items: Joi.array().items(quoteItemSchema).min(1).required(),
})

const quoteSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('').optional(),
  validUntil: Joi.date().optional(),
  notes: Joi.string().allow('').optional(),
  depositPercent: Joi.number().min(0).max(100).optional(),
  depositAmount: Joi.number().min(0).optional(),
  siteSameAsBilling: Joi.boolean().optional(),
  siteAddressLine1: Joi.string().allow('').optional(),
  siteAddressLine2: Joi.string().allow('').optional(),
  sitePostalCode: Joi.string().allow('').optional(),
  siteCity: Joi.string().allow('').optional(),
  siteCountry: Joi.string().allow('').optional(),
  items: Joi.array().items(quoteItemSchema).min(1).optional(),
  sections: Joi.array().items(quoteSectionSchema).min(1).optional(),
}).xor('items', 'sections')

// GET /api/quotes - Récupérer tous les devis
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

    let whereClause = 'WHERE q.user_id = $1'
    let queryParams = [req.user.userId]
    let paramCount = 1

    if (status) {
      paramCount++
      whereClause += ` AND q.status = $${paramCount}`
      queryParams.push(status)
    }

    if (clientId) {
      paramCount++
      whereClause += ` AND q.client_id = $${paramCount}`
      queryParams.push(clientId)
    }

    if (search) {
      paramCount++
      const p = `$${paramCount}`
      whereClause += ` AND (
                q.quote_number ILIKE ${p} OR q.title ILIKE ${p} OR q.description ILIKE ${p} OR
                c.first_name ILIKE ${p} OR c.last_name ILIKE ${p} OR c.company_name ILIKE ${p} OR c.email ILIKE ${p}
            )`
      queryParams.push(`%${search}%`)
    }

    // Tri sécurisé
    const allowedSort = new Map([
      ['created_at', 'q.created_at'],
      ['updated_at', 'q.updated_at'],
      ['valid_until', 'q.valid_until'],
      ['quote_number', 'q.quote_number'],
      ['total_ttc', 'q.total_ttc'],
      ['status', 'q.status'],
    ])
    const orderCol =
      allowedSort.get(String(sortBy || '').toLowerCase()) || 'q.created_at'
    const orderDir =
      String(sortOrder || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    const result = await query(
      `SELECT q.id, q.client_id, q.quote_number, q.title, q.description, q.status, 
              q.subtotal_ht, q.total_vat, q.total_ttc, q.valid_until, q.notes, q.created_at, q.updated_at,
              c.first_name, c.last_name, c.company_name, c.email
       FROM quotes q
       JOIN clients c ON q.client_id = c.id
       ${whereClause}
       ORDER BY ${orderCol} ${orderDir}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    )

    // Compter le total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM quotes q JOIN clients c ON q.client_id = c.id ${whereClause}`,
      queryParams
    )

    res.json({
      quotes: result.rows.map((quote) => ({
        id: quote.id,
        clientId: quote.client_id,
        clientName: `${quote.first_name} ${quote.last_name}`,
        clientCompany: quote.company_name,
        clientEmail: quote.email,
        quoteNumber: quote.quote_number,
        title: quote.title,
        description: quote.description,
        status: quote.status,
        subtotalHt: parseFloat(quote.subtotal_ht),
        totalVat: parseFloat(quote.total_vat),
        totalTtc: parseFloat(quote.total_ttc),
        validUntil: quote.valid_until,
        notes: quote.notes,
        createdAt: quote.created_at,
        updatedAt: quote.updated_at,
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

// GET /api/quotes/:id - Récupérer un devis spécifique avec ses lignes
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    await ensureQuoteSchema()
    const { id } = req.params

    // Récupérer le devis
    const quoteResult = await query(
      `SELECT q.id, q.client_id, q.quote_number, q.title, q.description, q.status, 
              q.subtotal_ht, q.total_vat, q.total_ttc, q.valid_until, q.notes, q.created_at, q.updated_at,
              q.site_same_as_billing, q.site_address_line1, q.site_address_line2, q.site_postal_code, q.site_city, q.site_country,
              c.first_name, c.last_name, c.company_name, c.email, c.phone, c.address_line1, c.address_line2, c.postal_code, c.city, c.country
       FROM quotes q
       JOIN clients c ON q.client_id = c.id
       WHERE q.id = $1 AND q.user_id = $2`,
      [id, req.user.userId]
    )

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Devis non trouvé',
      })
    }

    const quote = quoteResult.rows[0]

    // Récupérer les lignes du devis
    const itemsResult = await query(
      `SELECT id, section_id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, unit, discount_percent, markup_percent, total_ht, total_ttc, sort_order
       FROM quote_items
       WHERE quote_id = $1
       ORDER BY sort_order, created_at`,
      [id]
    )

    // Récupérer les sections
    const sectionsResult = await query(
      `SELECT id, title, description, sort_order, created_at, updated_at
             FROM quote_sections WHERE quote_id = $1 ORDER BY sort_order, created_at`,
      [id]
    )

    res.json({
      quote: {
        id: quote.id,
        clientId: quote.client_id,
        client: {
          id: quote.client_id,
          firstName: quote.first_name,
          lastName: quote.last_name,
          companyName: quote.company_name,
          email: quote.email,
          phone: quote.phone,
          addressLine1: quote.address_line1,
          addressLine2: quote.address_line2,
          postalCode: quote.postal_code,
          city: quote.city,
          country: quote.country,
        },
        siteAddress: {
          sameAsBilling: !!quote.site_same_as_billing,
          addressLine1: quote.site_address_line1,
          addressLine2: quote.site_address_line2,
          postalCode: quote.site_postal_code,
          city: quote.site_city,
          country: quote.site_country,
        },
        quoteNumber: quote.quote_number,
        title: quote.title,
        description: quote.description,
        status: quote.status,
        subtotalHt: parseFloat(quote.subtotal_ht),
        totalVat: parseFloat(quote.total_vat),
        totalTtc: parseFloat(quote.total_ttc),
        validUntil: quote.valid_until,
        notes: quote.notes,
        items: itemsResult.rows.map((item) => ({
          id: item.id,
          serviceId: item.service_id,
          sectionId: item.section_id,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPriceHt: parseFloat(item.unit_price_ht),
          unitPriceTtc: parseFloat(item.unit_price_ttc),
          vatRate: parseFloat(item.vat_rate),
          unit: item.unit,
          discountPercent: item.discount_percent
            ? parseFloat(item.discount_percent)
            : 0,
          markupPercent: item.markup_percent
            ? parseFloat(item.markup_percent)
            : 0,
          totalHt: parseFloat(item.total_ht),
          totalTtc: parseFloat(item.total_ttc),
          sortOrder: item.sort_order,
        })),
        sections: sectionsResult.rows.map((sec) => ({
          id: sec.id,
          title: sec.title,
          description: sec.description,
          sortOrder: sec.sort_order,
          createdAt: sec.created_at,
          updatedAt: sec.updated_at,
        })),
        createdAt: quote.created_at,
        updatedAt: quote.updated_at,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/quotes - Créer un nouveau devis
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    await ensureQuoteSchema()

    const { error, value } = quoteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const {
      clientId,
      title,
      description,
      validUntil,
      notes,
      depositPercent,
      depositAmount,
      siteSameAsBilling,
      siteAddressLine1,
      siteAddressLine2,
      sitePostalCode,
      siteCity,
      siteCountry,
    } = value
    const hasSections =
      Array.isArray(value.sections) && value.sections.length > 0
    const flatItems = hasSections
      ? value.sections.flatMap((s, idx) =>
          (s.items || []).map((it) => ({
            ...it,
            sectionSortOrder: s.sortOrder ?? idx,
          }))
        )
      : value.items

    // Valider les items
    const itemsValidation = calculationService.validateItems(flatItems)
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

    const result = await transaction(async (client) => {
      // Générer le numéro de devis via company_settings (prefix + counter, reset annuel)
      const year = new Date().getFullYear()
      // Verrouiller les paramètres d'entreprise pour éviter les races
      const settingsRes = await client.query(
        'SELECT quote_prefix, quote_counter FROM company_settings WHERE user_id = $1 FOR UPDATE',
        [req.user.userId]
      )
      const prefix = settingsRes.rows[0]?.quote_prefix || 'DEV'
      let counter = settingsRes.rows[0]?.quote_counter ?? 0

      // Reset annuel si aucun devis pour l'année courante
      const currentYearCountRes = await client.query(
        'SELECT COUNT(*) AS cnt FROM quotes WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2',
        [req.user.userId, year]
      )
      const hasAnyThisYear = parseInt(currentYearCountRes.rows[0].cnt, 10) > 0
      if (!hasAnyThisYear) {
        counter = 0
      }
      counter += 1

      // Persister le nouveau compteur
      await client.query(
        'UPDATE company_settings SET quote_counter = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [counter, req.user.userId]
      )

      const quoteNumber = `${prefix}-${year}-${String(counter).padStart(4, '0')}`

      // Calculer les totaux automatiquement
      const calculations = calculationService.calculateTotals(flatItems)

      // Calculer le montant de l'acompte
      let finalDepositAmount = 0
      if (depositAmount && depositAmount > 0) {
        finalDepositAmount = depositAmount
      } else if (depositPercent && depositPercent > 0) {
        finalDepositAmount = (calculations.totalTtc * depositPercent) / 100
      }

      // Créer le devis
      const quoteResult = await client.query(
        `INSERT INTO quotes (user_id, client_id, quote_number, title, description, status, subtotal_ht, total_vat, total_ttc, valid_until, notes, deposit_amount, deposit_paid,
                                     site_same_as_billing, site_address_line1, site_address_line2, site_postal_code, site_city, site_country)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                 RETURNING id, quote_number, title, description, status, subtotal_ht, total_vat, total_ttc, valid_until, notes, deposit_amount, deposit_paid, site_same_as_billing, site_address_line1, site_address_line2, site_postal_code, site_city, site_country, created_at, updated_at`,
        [
          req.user.userId,
          clientId,
          quoteNumber,
          title,
          description,
          'draft',
          calculations.subtotalHt,
          calculations.totalVat,
          calculations.totalTtc,
          validUntil,
          notes,
          finalDepositAmount,
          false,
          siteSameAsBilling || false,
          siteAddressLine1 || null,
          siteAddressLine2 || null,
          sitePostalCode || null,
          siteCity || null,
          siteCountry || null,
        ]
      )

      const quote = quoteResult.rows[0]

      const quoteItems = []

      if (hasSections) {
        // Créer les sections puis leurs items
        const sections = []
        for (let si = 0; si < value.sections.length; si++) {
          const s = value.sections[si]
          const secRes = await client.query(
            `INSERT INTO quote_sections (quote_id, title, description, sort_order)
                         VALUES ($1, $2, $3, $4)
                         RETURNING id, title, description, sort_order`,
            [quote.id, s.title, s.description || null, s.sortOrder ?? si]
          )
          sections.push(secRes.rows[0])

          const itemsCalc = calculationService.calculateTotals(s.items)
          for (let i = 0; i < itemsCalc.items.length; i++) {
            const item = itemsCalc.items[i]
            const itemResult = await client.query(
              `INSERT INTO quote_items (quote_id, section_id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, unit, discount_percent, markup_percent, total_ht, total_ttc, sort_order)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                             RETURNING id, section_id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, unit, discount_percent, markup_percent, total_ht, total_ttc, sort_order`,
              [
                quote.id,
                secRes.rows[0].id,
                item.serviceId,
                item.description,
                item.quantity,
                item.unitPriceHt,
                item.unitPriceTtc,
                item.vatRate,
                item.unit || null,
                item.discountPercent || 0,
                item.markupPercent || item.surchargePercent || 0,
                item.totalHt,
                item.totalTtc,
                item.sortOrder || i,
              ]
            )
            quoteItems.push(itemResult.rows[0])
          }
        }
      } else {
        // Créer les lignes du devis sans sections
        for (let i = 0; i < calculations.items.length; i++) {
          const item = calculations.items[i]
          const itemResult = await client.query(
            `INSERT INTO quote_items (quote_id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, unit, discount_percent, markup_percent, total_ht, total_ttc, sort_order)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                         RETURNING id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, unit, discount_percent, markup_percent, total_ht, total_ttc, sort_order`,
            [
              quote.id,
              item.serviceId,
              item.description,
              item.quantity,
              item.unitPriceHt,
              item.unitPriceTtc,
              item.vatRate,
              item.unit || null,
              item.discountPercent || 0,
              item.markupPercent || item.surchargePercent || 0,
              item.totalHt,
              item.totalTtc,
              item.sortOrder || i,
            ]
          )
          quoteItems.push(itemResult.rows[0])
        }
      }

      return { quote, items: quoteItems }
    })

    res.status(201).json({
      message: 'Devis créé avec succès',
      quote: {
        id: result.quote.id,
        quoteNumber: result.quote.quote_number,
        title: result.quote.title,
        description: result.quote.description,
        status: result.quote.status,
        subtotalHt: parseFloat(result.quote.subtotal_ht),
        totalVat: parseFloat(result.quote.total_vat),
        totalTtc: parseFloat(result.quote.total_ttc),
        validUntil: result.quote.valid_until,
        notes: result.quote.notes,
        items: result.items.map((item) => ({
          id: item.id,
          serviceId: item.service_id,
          sectionId: item.section_id,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPriceHt: parseFloat(item.unit_price_ht),
          unitPriceTtc: parseFloat(item.unit_price_ttc),
          vatRate: parseFloat(item.vat_rate),
          unit: item.unit,
          discountPercent: item.discount_percent
            ? parseFloat(item.discount_percent)
            : 0,
          markupPercent: item.markup_percent
            ? parseFloat(item.markup_percent)
            : 0,
          totalHt: parseFloat(item.total_ht),
          totalTtc: parseFloat(item.total_ttc),
          sortOrder: item.sort_order,
        })),
        createdAt: result.quote.created_at,
        updatedAt: result.quote.updated_at,
      },
    })

    // Audit
    try {
      await logAudit({
        userId: req.user.userId,
        entityType: 'quote',
        entityId: result.quote.id,
        action: 'create',
        metadata: { quoteNumber: result.quote.quote_number },
      })
    } catch (_) {
      /* ignore audit failures */
    }
  } catch (error) {
    next(error)
  }
})

// PUT /api/quotes/:id/status - Mettre à jour le statut d'un devis
router.put('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['draft', 'sent', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Statut invalide',
        message: 'Le statut doit être: draft, sent, accepted ou rejected',
      })
    }

    const result = await query(
      `UPDATE quotes 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING id, status, updated_at`,
      [status, id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Devis non trouvé',
      })
    }

    res.json({
      message: 'Statut du devis mis à jour avec succès',
      status: result.rows[0].status,
      updatedAt: result.rows[0].updated_at,
    })

    // Audit
    try {
      await logAudit({
        userId: req.user.userId,
        entityType: 'quote',
        entityId: id,
        action: 'status',
        metadata: { status },
      })
    } catch (_) {
      // Ignorer les erreurs d'audit
    }
  } catch (error) {
    next(error)
  }
})

// PUT /api/quotes/:id - Mettre à jour un devis
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    await ensureQuoteSchema()
    const { id } = req.params

    // Verrou: on n'autorise la modification que si le devis est en draft
    const current = await query(
      'SELECT status FROM quotes WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    )
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Devis non trouvé' })
    }
    if (current.rows[0].status !== 'draft') {
      return res
        .status(400)
        .json({ error: 'Devis non modifiable (statut non draft)' })
    }

    // Schéma de validation pour la mise à jour (différent de la création)
    const quoteItemSchema = Joi.object({
      description: Joi.string().min(1).max(500).required(),
      unit: Joi.string().min(1).max(20).required(),
      quantity: Joi.number().min(0.01).required(),
      unitPriceHt: Joi.number().min(0).required(),
      vatRate: Joi.number().min(0).max(100).required(),
    })

    const quoteSectionSchema = Joi.object({
      id: Joi.string().uuid().optional(), // Permettre l'ID existant pour la mise à jour
      title: Joi.string().min(1).max(255).required(),
      description: Joi.string().allow('').optional(),
      items: Joi.array().items(quoteItemSchema).min(1).required(),
    })

    const updateQuoteSchema = Joi.object({
      title: Joi.string().min(1).max(255).required(),
      description: Joi.string().allow('').optional(),
      validUntil: Joi.date().optional(),
      notes: Joi.string().allow('').optional(),
      siteSameAsBilling: Joi.boolean().optional(),
      siteAddressLine1: Joi.string().allow('').optional(),
      siteAddressLine2: Joi.string().allow('').optional(),
      sitePostalCode: Joi.string().allow('').optional(),
      siteCity: Joi.string().allow('').optional(),
      siteCountry: Joi.string().allow('').optional(),
      sections: Joi.array().items(quoteSectionSchema).min(0).optional(),
    })

    // Validation du payload
    const { error, value } = updateQuoteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const {
      title,
      description,
      validUntil,
      notes,
      siteSameAsBilling,
      siteAddressLine1,
      siteAddressLine2,
      sitePostalCode,
      siteCity,
      siteCountry,
      sections,
    } = value
    const hasSections = Array.isArray(sections) && sections.length > 0
    const flatItems = hasSections
      ? sections.flatMap((s, idx) =>
          (s.items || []).map((it) => ({
            ...it,
            sectionSortOrder: s.sortOrder ?? idx,
          }))
        )
      : []

    // Valider les items
    const itemsValidation = calculationService.validateItems(flatItems)
    if (!itemsValidation.isValid) {
      return res.status(400).json({
        error: 'Données des items invalides',
        details: itemsValidation.errors,
      })
    }

    // Calculer les totaux
    const calculations = calculationService.calculateTotals(flatItems)

    // Mettre à jour le devis
    const quoteResult = await query(
      `UPDATE quotes SET 
                title = $1, description = $2, valid_until = $3, notes = $4,
                site_same_as_billing = $5, site_address_line1 = $6, site_address_line2 = $7, 
                site_postal_code = $8, site_city = $9, site_country = $10,
                subtotal_ht = $11, total_vat = $12, total_ttc = $13, updated_at = CURRENT_TIMESTAMP
            WHERE id = $14 AND user_id = $15
            RETURNING *`,
      [
        title,
        description,
        validUntil,
        notes,
        siteSameAsBilling || false,
        siteAddressLine1 || null,
        siteAddressLine2 || null,
        sitePostalCode || null,
        siteCity || null,
        siteCountry || null,
        calculations.subtotalHt,
        calculations.totalVat,
        calculations.totalTtc,
        id,
        req.user.userId,
      ]
    )

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Devis non trouvé',
      })
    }

    // Supprimer les anciens items et sections
    await query('DELETE FROM quote_items WHERE quote_id = $1', [id])
    await query('DELETE FROM quote_sections WHERE quote_id = $1', [id])

    // Recréer les sections et items
    if (hasSections) {
      for (let si = 0; si < sections.length; si++) {
        const section = sections[si]
        const sectionResult = await query(
          'INSERT INTO quote_sections (quote_id, title, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
          [id, section.title, section.description, si]
        )
        const sectionId = sectionResult.rows[0].id

        if (section.items && section.items.length > 0) {
          for (let ii = 0; ii < section.items.length; ii++) {
            const item = section.items[ii]
            const itemCalculations =
              calculationService.calculateItemTotals(item)
            await query(
              `INSERT INTO quote_items (quote_id, section_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, unit, total_ht, total_ttc, sort_order)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                id,
                sectionId,
                item.description,
                item.quantity,
                item.unitPriceHt,
                item.unitPriceTtc || itemCalculations.unitPriceTtc,
                item.vatRate,
                item.unit,
                itemCalculations.totalHt,
                itemCalculations.totalTtc,
                ii,
              ]
            )
          }
        }
      }
    }

    res.json({
      message: 'Devis mis à jour avec succès',
      quote: {
        id: quoteResult.rows[0].id,
        title: quoteResult.rows[0].title,
        description: quoteResult.rows[0].description,
        status: quoteResult.rows[0].status,
        validUntil: quoteResult.rows[0].valid_until,
        notes: quoteResult.rows[0].notes,
        subtotalHt: parseFloat(quoteResult.rows[0].subtotal_ht),
        totalVat: parseFloat(quoteResult.rows[0].total_vat),
        totalTtc: parseFloat(quoteResult.rows[0].total_ttc),
        updatedAt: quoteResult.rows[0].updated_at,
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/quotes/:id - Supprimer un devis
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await query(
      'DELETE FROM quotes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Devis non trouvé',
      })
    }

    res.json({
      message: 'Devis supprimé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// GET /:id/pdf - Générer le PDF du devis
router.get('/:id/pdf', authenticateToken, async (req, res, next) => {
  try {
    await ensureQuoteSchema()
    const { id } = req.params

    // Récupérer le devis avec les informations client
    const quoteResult = await query(
      `SELECT q.id, q.client_id, q.quote_number, q.title, q.description, q.status, 
              q.subtotal_ht, q.total_vat, q.total_ttc, q.valid_until, q.notes, q.created_at, q.updated_at,
              q.site_same_as_billing, q.site_address_line1, q.site_address_line2, q.site_postal_code, q.site_city, q.site_country,
              c.first_name, c.last_name, c.company_name, c.email, c.phone, c.address_line1, c.address_line2, c.postal_code, c.city, c.country
       FROM quotes q
       JOIN clients c ON q.client_id = c.id
       WHERE q.id = $1 AND q.user_id = $2`,
      [id, req.user.userId]
    )

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Devis non trouvé',
      })
    }

    const quote = quoteResult.rows[0]

    // Récupérer les sections et lignes du devis
    let sectionsRows = []
    try {
      const { rows } = await query(
        `SELECT id, title, description, sort_order
         FROM quote_sections
         WHERE quote_id = $1
         ORDER BY sort_order, created_at`,
        [id]
      )
      sectionsRows = rows
    } catch (error) {
      if (error.code === '42P01') {
        // Table des sections absente (anciennes bases) → ignorer et continuer sans sections
        sectionsRows = []
      } else {
        throw error
      }
    }

    let itemsRows = []
    try {
      const { rows } = await query(
        `SELECT *
         FROM quote_items
         WHERE quote_id = $1
         ORDER BY sort_order, created_at`,
        [id]
      )
      itemsRows = rows
    } catch (error) {
      if (error.code === '42703') {
        // Première tentative de repli sans sort_order
        try {
          const fallback = await query(
            `SELECT *
             FROM quote_items
             WHERE quote_id = $1
             ORDER BY created_at`,
            [id]
          )
          itemsRows = fallback.rows
        } catch (fallbackError) {
          if (fallbackError.code === '42703') {
            // Certaines très anciennes bases n'ont pas non plus created_at → dernier repli sur l'ID
            const legacy = await query(
              `SELECT *
               FROM quote_items
               WHERE quote_id = $1
               ORDER BY id`,
              [id]
            )
            itemsRows = legacy.rows
          } else {
            throw fallbackError
          }
        }
      } else if (error.code === '42P01') {
        // Table absente → aucun item
        itemsRows = []
      } else {
        throw error
      }
    }

    // Récupérer les paramètres de l'entreprise
    const companyResult = await query(
      `SELECT * FROM company_settings WHERE user_id = $1`,
      [req.user.userId]
    )

    const companySettings = companyResult.rows[0] || {}

    // Préparer les données du devis
    const quoteData = {
      id: quote.id,
      clientId: quote.client_id,
      client: {
        id: quote.client_id,
        firstName: quote.first_name,
        lastName: quote.last_name,
        companyName: quote.company_name,
        email: quote.email,
        phone: quote.phone,
        addressLine1: quote.address_line1,
        addressLine2: quote.address_line2,
        postalCode: quote.postal_code,
        city: quote.city,
        country: quote.country,
      },
      siteAddress: {
        sameAsBilling: !!quote.site_same_as_billing,
        addressLine1: quote.site_address_line1,
        addressLine2: quote.site_address_line2,
        postalCode: quote.site_postal_code,
        city: quote.site_city,
        country: quote.site_country,
      },
      quoteNumber: quote.quote_number,
      title: quote.title,
      description: quote.description,
      status: quote.status,
      subtotalHt: parseFloat(quote.subtotal_ht),
      totalVat: parseFloat(quote.total_vat),
      totalTtc: parseFloat(quote.total_ttc),
      validUntil: quote.valid_until,
      notes: quote.notes,
      sections: sectionsRows.map((sec) => ({
        id: sec.id,
        title: sec.title,
        description: sec.description,
        sortOrder: sec.sort_order || 0,
      })),
      createdAt: quote.created_at,
      updatedAt: quote.updated_at,
    }

    const mappedItems = itemsRows.map((item) => {
      const base = {
        quantity: Number(item.quantity) || 0,
        unitPriceHt: Number(
          item.unit_price_ht ?? item.price_ht ?? item.unitpriceht ?? 0
        ),
        vatRate: Number(item.vat_rate ?? item.vat ?? 0),
        discountPercent: Number(
          item.discount_percent ?? item.discount ?? item.discountpercent ?? 0
        ),
        markupPercent: Number(
          item.markup_percent ?? item.markup ?? item.surcharge_percent ?? 0
        ),
      }
      const calculated = calculationService.calculateItemTotals(base)

      return {
        id: item.id,
        serviceId: item.service_id,
        sectionId: item.section_id,
        description: item.description,
        quantity: calculated.quantity,
        unit: item.unit || item.unit_label || 'unité',
        unitPriceHt: calculated.unitPriceHt,
        unitPriceTtc:
          item.unit_price_ttc != null
            ? Number(item.unit_price_ttc)
            : calculated.unitPriceTtc,
        vatRate: calculated.vatRate,
        discountPercent: calculated.discountPercent,
        markupPercent: calculated.markupPercent,
        totalHt:
          item.total_ht != null ? Number(item.total_ht) : calculated.totalHt,
        totalTtc:
          item.total_ttc != null ? Number(item.total_ttc) : calculated.totalTtc,
        sortOrder: item.sort_order ?? 0,
      }
    })

    const totals = calculationService.calculateTotals(mappedItems)

    quoteData.items = totals.items
    quoteData.subtotalHt =
      quote.subtotal_ht != null && quote.subtotal_ht !== ''
        ? parseFloat(quote.subtotal_ht)
        : totals.subtotalHt
    quoteData.totalVat =
      quote.total_vat != null && quote.total_vat !== ''
        ? parseFloat(quote.total_vat)
        : totals.totalVat
    quoteData.totalTtc =
      quote.total_ttc != null && quote.total_ttc !== ''
        ? parseFloat(quote.total_ttc)
        : totals.totalTtc

    // Générer le PDF
    const pdfBuffer = await pdfService.generateQuotePDF(
      quoteData,
      companySettings
    )

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="devis-${quote.quote_number}.pdf"`
    )
    res.setHeader('Content-Length', pdfBuffer.length)

    // Envoyer le PDF
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
})

// POST /api/quotes/:id/send - envoyer le devis par email (SMTP)
router.post('/:id/send', authenticateToken, async (req, res, next) => {
  try {
    await ensureQuoteSchema()
    await ensureQuoteAuxSchemas()
    const { id } = req.params
    const { to, cc, subject } = req.body || {}

    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return res.status(400).json({ error: 'Adresse destinataire invalide' })
    }

    // Charger devis + items + client
    const quoteRes = await query(
      `SELECT q.id, q.user_id, q.client_id, q.quote_number, q.title, q.description, q.status,
                    q.subtotal_ht, q.total_vat, q.total_ttc, q.valid_until, q.notes, q.created_at, q.updated_at,
                    q.site_same_as_billing, q.site_address_line1, q.site_address_line2, q.site_postal_code, q.site_city, q.site_country,
                    c.first_name, c.last_name, c.company_name, c.email, c.phone,
                    c.address_line1, c.address_line2, c.postal_code, c.city, c.country
             FROM quotes q JOIN clients c ON q.client_id = c.id
             WHERE q.id = $1 AND q.user_id = $2`,
      [id, req.user.userId]
    )
    if (quoteRes.rows.length === 0)
      return res.status(404).json({ error: 'Devis non trouvé' })
    const q = quoteRes.rows[0]

    const itemsRes = await query(
      `SELECT id, section_id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, unit, discount_percent, markup_percent, total_ht, total_ttc, sort_order
             FROM quote_items WHERE quote_id = $1 ORDER BY sort_order, created_at`,
      [id]
    )
    const sectionsRes = await query(
      `SELECT id, title, description, sort_order FROM quote_sections WHERE quote_id = $1 ORDER BY sort_order, created_at`,
      [id]
    )
    const companyRes = await query(
      `SELECT * FROM company_settings WHERE user_id = $1`,
      [req.user.userId]
    )
    const company = companyRes.rows[0] || {}

    // Générer/Insérer un token public (30 jours)
    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await query(
      `INSERT INTO quote_tokens (quote_id, token, purpose, expires_at) VALUES ($1, $2, 'public', $3)`,
      [id, token, expiresAt]
    )
    const publicUrl = absolutePublicUrl(req, id, token)

    // Composition des données pour PDF
    const quoteData = {
      id: q.id,
      clientId: q.client_id,
      client: {
        id: q.client_id,
        firstName: q.first_name,
        lastName: q.last_name,
        companyName: q.company_name,
        email: q.email,
        phone: q.phone,
        addressLine1: q.address_line1,
        addressLine2: q.address_line2,
        postalCode: q.postal_code,
        city: q.city,
        country: q.country,
      },
      siteAddress: {
        sameAsBilling: !!q.site_same_as_billing,
        addressLine1: q.site_address_line1,
        addressLine2: q.site_address_line2,
        postalCode: q.site_postal_code,
        city: q.site_city,
        country: q.site_country,
      },
      quoteNumber: q.quote_number,
      title: q.title,
      description: q.description,
      status: q.status,
      subtotalHt: parseFloat(q.subtotal_ht),
      totalVat: parseFloat(q.total_vat),
      totalTtc: parseFloat(q.total_ttc),
      validUntil: q.valid_until,
      notes: q.notes,
      items: itemsRes.rows.map((it) => ({
        id: it.id,
        serviceId: it.service_id,
        sectionId: it.section_id,
        description: it.description,
        quantity: parseFloat(it.quantity),
        unitPriceHt: parseFloat(it.unit_price_ht),
        unitPriceTtc: parseFloat(it.unit_price_ttc),
        vatRate: parseFloat(it.vat_rate),
        unit: it.unit,
        discountPercent: it.discount_percent
          ? parseFloat(it.discount_percent)
          : 0,
        markupPercent: it.markup_percent ? parseFloat(it.markup_percent) : 0,
        totalHt: parseFloat(it.total_ht),
        totalTtc: parseFloat(it.total_ttc),
        sortOrder: it.sort_order,
      })),
      sections: sectionsRes.rows.map((sec) => ({
        id: sec.id,
        title: sec.title,
        description: sec.description,
        sortOrder: sec.sort_order,
      })),
      createdAt: q.created_at,
      updatedAt: q.updated_at,
    }

    // Générer le PDF en pièce jointe
    const pdfBuffer = await pdfService.generateQuotePDF(quoteData, company)

    // Construire et envoyer le mail
    const transport = createMailTransport()
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com'
    const mailSubject =
      subject ||
      `Votre devis n° ${q.quote_number} – ${company.company_name || 'Fuster Peinture'}`

    // Signature e-mail compacte et soignée (logo à gauche, infos à droite)
    const companyName = company.company_name || ''
    const addr = [company.address_line1, company.address_line2]
      .filter(Boolean)
      .join(' ')
    const cityLine = [company.postal_code, company.city]
      .filter(Boolean)
      .join(' ')
    const phoneLine = company.phone || ''
    const emailLine = company.email || ''
    const website = company.website || ''

    let logoImg = ''
    if (company.logo_base64) {
      if (company.logo_base64.startsWith('data:image/')) {
        logoImg = `<img src="${company.logo_base64}" alt="${companyName || 'Logo'}" style="height:96px; width:auto; display:block;" border="0">`
      } else {
        logoImg = `<img src="data:image/png;base64,${company.logo_base64}" alt="${companyName || 'Logo'}" style="height:96px; width:auto; display:block;" border="0">`
      }
    }

    const signatureBlock = `
            <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0; font-family:Arial,sans-serif;">
              <tr>
                ${logoImg ? `<td style="vertical-align:middle; padding-right:16px;">${logoImg}</td>` : ''}
                <td style="vertical-align:middle;">
                  ${companyName ? `<div style="font-size:16px; font-weight:bold; color:#111; margin-bottom:4px;">${companyName}</div>` : ''}
                  <div style="font-size:13px; color:#374151; line-height:1.4;">
                    ${emailLine ? `<div><a href="mailto:${emailLine}" style="color:#0ea5e9; text-decoration:none;">${emailLine}</a></div>` : ''}
                    ${phoneLine ? `<div><a href="tel:${phoneLine.replace(/\s+/g, '')}" style="color:#374151; text-decoration:none;">${phoneLine}</a></div>` : ''}
                    ${website ? `<div><a href="${website}" style="color:#0ea5e9; text-decoration:none;" target="_blank" rel="noopener">${website}</a></div>` : ''}
                    ${addr || cityLine ? `<div style="color:#6b7280; font-size:12px; margin-top:4px;">${[addr, cityLine].filter(Boolean).join(' — ')}</div>` : ''}
                  </div>
                </td>
              </tr>
            </table>
        `

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">Bonjour ${q.first_name || ''} ${q.last_name || ''},</p>
            <p style="margin: 0 0 20px 0; font-size: 16px;">Veuillez trouver ci-joint votre devis <strong>${q.quote_number}</strong>.</p>
            <p style="margin: 0 0 20px 0; font-size: 16px;">📋 <strong>Pour accepter ce devis, vous avez deux options :</strong></p>
            <ul style="margin: 15px 0; padding-left: 20px; font-size: 16px;">
                <li style="margin-bottom: 8px;">Cliquer sur le lien ci-dessous et accepter directement en ligne</li>
                <li style="margin-bottom: 8px;">Signer le PDF joint et le renvoyer par email à <a href="mailto:${emailLine || 'contact@example.com'}" style="color: #004AAD; text-decoration: none;">${emailLine || 'contact@example.com'}</a></li>
            </ul>
            <div style="margin: 30px 0; text-align: center;">
                <a href="${publicUrl}" style="background-color: #004AAD; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Consulter et répondre au devis
                </a>
            </div>
            <p style="margin: 20px 0; font-size: 16px;">Nous restons à votre disposition pour toute précision complémentaire.</p>
                <p style="margin: 20px 0; font-size: 16px;">Cordialement,</p>
                ${signatureBlock}
                <div style="margin-top: 24px; padding: 12px 14px; background-color: #f9fafb; border-left: 4px solid #004AAD; font-size: 14px; color: #6c757d;">
                    <p style="margin: 0; font-weight: bold;">📧 Important :</p>
                    <p style="margin: 5px 0 0 0;">Merci de ne pas répondre directement à cet email. Pour toute question, veuillez nous contacter à : <a href="mailto:${emailLine || 'contact@example.com'}" style="color: #004AAD; text-decoration: none;">${emailLine || 'contact@example.com'}</a></p>
                </div>
            </body>
            </html>
        `

    let info
    try {
      info = await transport.sendMail({
        from,
        to,
        cc: cc || undefined,
        subject: mailSubject,
        html,
        attachments: [
          { filename: `devis-${q.quote_number}.pdf`, content: pdfBuffer },
        ],
      })
    } catch (e) {
      // En cas de transport stream, récupérer le message dans e.message
      info = { messageId: null, error: e?.message }
    }

    await query(
      `INSERT INTO email_logs (user_id, quote_id, to_email, cc_email, subject, status, provider_id, error_message)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        req.user.userId,
        id,
        to,
        cc || null,
        mailSubject,
        info?.messageId ? 'sent' : 'queued',
        info?.messageId || null,
        info?.error || null,
      ]
    )

    // Historique + statut
    await query(
      `INSERT INTO quote_status_history (quote_id, event_type, metadata) VALUES ($1,'sent', $2)`,
      [id, JSON.stringify({ to, cc, providerId: info?.messageId || null })]
    )
    await query(
      `UPDATE quotes SET status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    )

    res.json({
      message: 'Devis envoyé',
      publicUrl,
      email: { messageId: info?.messageId || null },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/quotes/:id/public?token=... - page publique simple (visualisation + actions avec OTP)
router.get('/:id/public', async (req, res, next) => {
  try {
    await ensureQuoteSchema()
    await ensureQuoteAuxSchemas()
    const { id } = req.params
    const { token } = req.query
    if (!token) return res.status(400).send('Token manquant')

    // Valider le token
    const tokRes = await query(
      `SELECT * FROM quote_tokens WHERE quote_id = $1 AND token = $2 AND purpose = 'public'`,
      [id, token]
    )
    if (tokRes.rows.length === 0) return res.status(403).send('Token invalide')
    const t = tokRes.rows[0]
    if (t.expires_at && new Date(t.expires_at).getTime() < Date.now())
      return res.status(403).send('Token expiré')

    // Charger devis pour résumé
    const qRes = await query(
      `SELECT quote_number, title, subtotal_ht, total_vat, total_ttc, valid_until FROM quotes WHERE id = $1`,
      [id]
    )
    if (qRes.rows.length === 0) return res.status(404).send('Devis non trouvé')
    const q = qRes.rows[0]

    await query(
      `INSERT INTO quote_status_history (quote_id, event_type, ip, user_agent) VALUES ($1,'viewed',$2,$3)`,
      [id, req.ip, req.get('user-agent') || null]
    )

    const fmt = (n) =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(Number(n || 0))
    const d = (x) => (x ? new Date(x).toLocaleDateString('fr-FR') : '-')
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Devis ${q.quote_number}</title><style>body{font-family:Arial;padding:20px;max-width:800px;margin:auto} .box{border:1px solid #ddd;padding:16px;border-radius:8px;margin:12px 0} .btn{display:inline-block;padding:10px 14px;border-radius:6px;text-decoration:none;color:#fff} .ok{background:#16a34a} .ko{background:#dc2626} .muted{color:#555} input,button{font-size:16px;padding:8px}</style></head>
        <body><h1>Devis ${q.quote_number}</h1>
        <div class="box"><div><strong>${q.title || ''}</strong></div>
        <div class="muted">Total TTC: ${fmt(q.total_ttc)} | Valide jusqu'au: ${d(q.valid_until)}</div></div>
        <div class="box">Pour accepter ce devis, un code de validation (OTP) vous sera envoyé par e‑mail. Votre décision sera enregistrée avec votre adresse IP, votre navigateur et l'horodatage.</div>
        <div class="box">
          <form method="POST" action="/api/quotes/${id}/otp">
            <input type="hidden" name="token" value="${token}"/>
            <button class="btn ok" type="submit">Recevoir un code de validation</button>
          </form>
        </div>
        <div class="box">
          <form method="POST" action="/api/quotes/${id}/accept">
            <input type="hidden" name="token" value="${token}"/>
            <div style="margin-bottom:8px"><label for="otp">Code de validation reçu par e‑mail</label></div>
            <input id="otp" name="otp" type="text" maxlength="6" placeholder="123456" pattern="[0-9]{6}" required />
            <div style="margin-top:10px"><button class="btn ok" type="submit">Accepter le devis</button></div>
          </form>
          <form method="POST" action="/api/quotes/${id}/reject" style="margin-top:10px">
            <input type="hidden" name="token" value="${token}"/>
            <button class="btn ko" type="submit">Refuser le devis</button>
          </form>
        </div>
        </body></html>`
    res.set('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (error) {
    next(error)
  }
})

// GET /api/quotes/:id/public.json?token=... - données pour SPA publique
router.get('/:id/public.json', async (req, res, next) => {
  try {
    await ensureQuoteSchema()
    await ensureQuoteAuxSchemas()
    const { id } = req.params
    const { token } = req.query
    if (!token) return res.status(400).json({ error: 'Token manquant' })
    const tokRes = await query(
      `SELECT * FROM quote_tokens WHERE quote_id = $1 AND token = $2 AND purpose = 'public'`,
      [id, token]
    )
    if (tokRes.rows.length === 0)
      return res.status(403).json({ error: 'Token invalide' })
    const t = tokRes.rows[0]
    if (t.expires_at && new Date(t.expires_at).getTime() < Date.now())
      return res.status(403).json({ error: 'Token expiré' })

    // Récupérer le devis avec les informations client
    const quoteRes = await query(
      `SELECT q.id, q.client_id, q.quote_number, q.title, q.description, q.status, 
              q.subtotal_ht, q.total_vat, q.total_ttc, q.valid_until, q.notes, q.created_at, q.updated_at,
              c.first_name, c.last_name, c.company_name, c.email, c.phone, c.address_line1, c.address_line2, c.postal_code, c.city, c.country
       FROM quotes q
       JOIN clients c ON q.client_id = c.id
       WHERE q.id = $1`,
      [id]
    )
    if (quoteRes.rows.length === 0)
      return res.status(404).json({ error: 'Devis non trouvé' })
    const q = quoteRes.rows[0]

    // Récupérer les lignes du devis
    const itemsResult = await query(
      `SELECT id, section_id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, unit, discount_percent, markup_percent, total_ht, total_ttc, sort_order
       FROM quote_items
       WHERE quote_id = $1
       ORDER BY sort_order, created_at`,
      [id]
    )

    // Récupérer les sections
    const sectionsResult = await query(
      `SELECT id, title, description, sort_order
       FROM quote_sections
       WHERE quote_id = $1
       ORDER BY sort_order, created_at`,
      [id]
    )

    // Récupérer les informations de l'entreprise
    const companyResult = await query(
      `SELECT company_name, address_line1, address_line2, postal_code, city, country, 
              phone, email, siret, vat_number, logo_base64
       FROM company_settings
       WHERE user_id = (SELECT user_id FROM quotes WHERE id = $1)
       LIMIT 1`,
      [id]
    )

    await query(
      `INSERT INTO quote_status_history (quote_id, event_type, ip, user_agent) VALUES ($1,'viewed',$2,$3)`,
      [id, req.ip, req.get('user-agent') || null]
    )

    const company = companyResult.rows[0] || {}

    res.json({
      quote: {
        id: q.id,
        clientId: q.client_id,
        client: {
          id: q.client_id,
          firstName: q.first_name,
          lastName: q.last_name,
          companyName: q.company_name,
          email: q.email,
          phone: q.phone,
          addressLine1: q.address_line1,
          addressLine2: q.address_line2,
          postalCode: q.postal_code,
          city: q.city,
          country: q.country,
        },
        quoteNumber: q.quote_number,
        title: q.title,
        description: q.description,
        status: q.status,
        subtotalHt: parseFloat(q.subtotal_ht),
        totalVat: parseFloat(q.total_vat),
        totalTtc: parseFloat(q.total_ttc),
        validUntil: q.valid_until,
        notes: q.notes,
        items: itemsResult.rows.map((item) => ({
          id: item.id,
          serviceId: item.service_id,
          sectionId: item.section_id,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPriceHt: parseFloat(item.unit_price_ht),
          unitPriceTtc: parseFloat(item.unit_price_ttc),
          vatRate: parseFloat(item.vat_rate),
          unit: item.unit,
          discountPercent: item.discount_percent
            ? parseFloat(item.discount_percent)
            : 0,
          markupPercent: item.markup_percent
            ? parseFloat(item.markup_percent)
            : 0,
          totalHt: parseFloat(item.total_ht),
          totalTtc: parseFloat(item.total_ttc),
          sortOrder: item.sort_order,
        })),
        sections: sectionsResult.rows.map((section) => ({
          id: section.id,
          title: section.title,
          description: section.description,
          sortOrder: section.sort_order,
        })),
        company: {
          companyName: company.company_name,
          addressLine1: company.address_line1,
          addressLine2: company.address_line2,
          postalCode: company.postal_code,
          city: company.city,
          country: company.country,
          phone: company.phone,
          email: company.email,
          siret: company.siret,
          vatNumber: company.vat_number,
          logoBase64: company.logo_base64,
        },
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/quotes/:id/accept - public acceptation
router.post(
  '/:id/accept',
  express.json(),
  express.urlencoded({ extended: true }),
  async (req, res, next) => {
    try {
      await ensureQuoteAuxSchemas()
      const { id } = req.params
      const { token, otp } = req.body || {}
      if (!token) return res.status(400).send('Token manquant')
      const tokRes = await query(
        `SELECT * FROM quote_tokens WHERE quote_id = $1 AND token = $2 AND purpose = 'public'`,
        [id, token]
      )
      if (tokRes.rows.length === 0)
        return res.status(403).send('Token invalide')
      const t = tokRes.rows[0]
      if (t.expires_at && new Date(t.expires_at).getTime() < Date.now())
        return res.status(403).send('Token expiré')

      // Vérifier OTP (dernier OTP valide)
      if (!otp || !/^\d{6}$/.test(otp))
        return res.status(400).send('Code de validation requis')
      const otpRes = await query(
        `SELECT * FROM quote_tokens WHERE quote_id = $1 AND purpose = 'otp' ORDER BY created_at DESC LIMIT 1`,
        [id]
      )
      if (otpRes.rows.length === 0)
        return res
          .status(400)
          .send('Aucun code en cours, demandez un nouveau code.')
      const otpRow = otpRes.rows[0]
      if (
        otpRow.expires_at &&
        new Date(otpRow.expires_at).getTime() < Date.now()
      )
        return res.status(400).send('Code expiré, demandez un nouveau code.')
      // token champ contient "salt:hash"
      const [salt, storedHash] = String(otpRow.token).split(':')
      const checkHash = crypto
        .createHash('sha256')
        .update(`${salt}:${otp}`)
        .digest('hex')
      if (checkHash !== storedHash) {
        // historiser l'échec et limiter les tentatives
        await query(
          `INSERT INTO quote_status_history (quote_id, event_type, metadata, ip, user_agent) VALUES ($1,'otp_fail',$2,$3,$4)`,
          [
            id,
            JSON.stringify({ reason: 'mismatch' }),
            req.ip,
            req.get('user-agent') || null,
          ]
        )
        const fails = await query(
          `SELECT COUNT(*) AS c FROM quote_status_history WHERE quote_id = $1 AND event_type = 'otp_fail' AND created_at > NOW() - INTERVAL '30 minutes'`,
          [id]
        )
        const c = parseInt(fails.rows[0].c || '0', 10)
        if (c >= 5)
          return res
            .status(429)
            .send(
              'Trop de tentatives. Demandez un nouveau code et réessayez plus tard.'
            )
        return res.status(400).send('Code invalide.')
      }

      // Marquer OTP utilisé
      await query(
        `UPDATE quote_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [otpRow.id]
      )

      // Générer une empreinte du PDF accepté pour la preuve
      const quoteRes = await query(
        `SELECT q.id, q.user_id, q.client_id, q.quote_number, q.title, q.description, q.status,
                    q.subtotal_ht, q.total_vat, q.total_ttc, q.valid_until, q.notes, q.created_at, q.updated_at,
                    c.first_name, c.last_name, c.company_name, c.email, c.phone,
                    c.address_line1, c.address_line2, c.postal_code, c.city, c.country
             FROM quotes q JOIN clients c ON q.client_id = c.id WHERE q.id = $1`,
        [id]
      )
      const itemsRes = await query(
        `SELECT id, section_id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, unit, discount_percent, markup_percent, total_ht, total_ttc, sort_order FROM quote_items WHERE quote_id = $1 ORDER BY sort_order, created_at`,
        [id]
      )
      const sectionsRes = await query(
        `SELECT id, title, description, sort_order FROM quote_sections WHERE quote_id = $1 ORDER BY sort_order, created_at`,
        [id]
      )
      const companyRes = await query(
        `SELECT * FROM company_settings WHERE user_id = $1`,
        [quoteRes.rows[0].user_id]
      )
      const q = quoteRes.rows[0]
      const company = companyRes.rows[0] || {}
      const quoteData = {
        id: q.id,
        clientId: q.client_id,
        client: {
          id: q.client_id,
          firstName: q.first_name,
          lastName: q.last_name,
          companyName: q.company_name,
          email: q.email,
          phone: q.phone,
          addressLine1: q.address_line1,
          addressLine2: q.address_line2,
          postalCode: q.postal_code,
          city: q.city,
          country: q.country,
        },
        quoteNumber: q.quote_number,
        title: q.title,
        description: q.description,
        status: q.status,
        subtotalHt: parseFloat(q.subtotal_ht),
        totalVat: parseFloat(q.total_vat),
        totalTtc: parseFloat(q.total_ttc),
        validUntil: q.valid_until,
        notes: q.notes,
        items: itemsRes.rows.map((it) => ({
          id: it.id,
          serviceId: it.service_id,
          sectionId: it.section_id,
          description: it.description,
          quantity: parseFloat(it.quantity),
          unitPriceHt: parseFloat(it.unit_price_ht),
          unitPriceTtc: parseFloat(it.unit_price_ttc),
          vatRate: parseFloat(it.vat_rate),
          unit: it.unit,
          discountPercent: it.discount_percent
            ? parseFloat(it.discount_percent)
            : 0,
          markupPercent: it.markup_percent ? parseFloat(it.markup_percent) : 0,
          totalHt: parseFloat(it.total_ht),
          totalTtc: parseFloat(it.total_ttc),
          sortOrder: it.sort_order,
        })),
        sections: sectionsRes.rows.map((sec) => ({
          id: sec.id,
          title: sec.title,
          description: sec.description,
          sortOrder: sec.sort_order,
        })),
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      }
      const pdfBuffer = await pdfService.generateQuotePDF(quoteData, company)
      const pdfSha256 = crypto
        .createHash('sha256')
        .update(pdfBuffer)
        .digest('hex')

      await query(
        `UPDATE quotes SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      )
      await query(
        `INSERT INTO quote_status_history (quote_id, event_type, ip, user_agent, metadata) VALUES ($1,'accepted',$2,$3,$4)`,
        [
          id,
          req.ip,
          req.get('user-agent') || null,
          JSON.stringify({ pdfSha256 }),
        ]
      )

      // Générer un PDF spécial "accepté" avec validation électronique
      const acceptedPdfBuffer = await pdfService.generateAcceptedQuotePDF(
        quoteData,
        company,
        {
          acceptedAt: new Date(),
          clientIp: req.ip,
          clientUserAgent: req.get('user-agent') || null,
          pdfSha256: pdfSha256,
        }
      )

      // Accusé de réception par e‑mail (si possible)
      try {
        const transport = createMailTransport()
        const from =
          process.env.MAIL_FROM ||
          process.env.SMTP_USER ||
          'no-reply@example.com'
        const to = q.email // email client
        const subject = `Accusé de réception — Devis ${q.quote_number} accepté`
        const html = `<p>Bonjour ${q.first_name || ''} ${q.last_name || ''},</p>
                        <p>Nous accusons réception de l'acceptation du devis <strong>${q.quote_number}</strong>.</p>
                        <p>Date/heure: ${new Date().toLocaleString('fr-FR')}<br/>Empreinte du document (SHA‑256): <code>${pdfSha256}</code></p>
                        <p>En pièce jointe, le devis accepté avec validation électronique.</p>
                        <p>Cordialement,</p>`
        await transport.sendMail({
          from,
          to,
          subject,
          html,
          attachments: [
            {
              filename: `devis-${q.quote_number}-accepte.pdf`,
              content: acceptedPdfBuffer,
            },
          ],
        })
        await query(
          `INSERT INTO email_logs (user_id, quote_id, to_email, subject, status) VALUES ($1,$2,$3,$4,'sent')`,
          [q.user_id, id, to, subject]
        )
      } catch (_) {
        /* ignore SMTP failures */
      }

      res.send(
        '<html><body style="font-family:Arial;padding:20px"><h2>Merci, devis accepté.</h2><p>Votre décision a été enregistrée.</p></body></html>'
      )
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/quotes/:id/reject - public refus
router.post(
  '/:id/reject',
  express.json(),
  express.urlencoded({ extended: true }),
  async (req, res, next) => {
    try {
      await ensureQuoteAuxSchemas()
      const { id } = req.params
      const { token, reason } = req.body || {}
      if (!token) return res.status(400).send('Token manquant')
      const tokRes = await query(
        `SELECT * FROM quote_tokens WHERE quote_id = $1 AND token = $2 AND purpose = 'public'`,
        [id, token]
      )
      if (tokRes.rows.length === 0)
        return res.status(403).send('Token invalide')
      const t = tokRes.rows[0]
      if (t.expires_at && new Date(t.expires_at).getTime() < Date.now())
        return res.status(403).send('Token expiré')

      await query(
        `UPDATE quotes SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      )
      await query(
        `INSERT INTO quote_status_history (quote_id, event_type, ip, user_agent, metadata) VALUES ($1,'rejected',$2,$3,$4)`,
        [
          id,
          req.ip,
          req.get('user-agent') || null,
          JSON.stringify({ reason: reason || null }),
        ]
      )
      res.send(
        '<html><body style="font-family:Arial;padding:20px"><h2>Décision enregistrée.</h2><p>Vous avez refusé ce devis.</p></body></html>'
      )
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/quotes/:id/otp - demander l'envoi d'un OTP par e‑mail (public)
router.post(
  '/:id/otp',
  express.json(),
  express.urlencoded({ extended: true }),
  async (req, res, next) => {
    try {
      await ensureQuoteAuxSchemas()
      const { id } = req.params
      const { token } = req.body || {}
      if (!token) return res.status(400).send('Token manquant')
      const tokRes = await query(
        `SELECT * FROM quote_tokens WHERE quote_id = $1 AND token = $2 AND purpose = 'public'`,
        [id, token]
      )
      if (tokRes.rows.length === 0)
        return res.status(403).send('Token invalide')
      const t = tokRes.rows[0]
      if (t.expires_at && new Date(t.expires_at).getTime() < Date.now())
        return res.status(403).send('Token expiré')

      // Charger l'email du client
      const qRes = await query(
        `SELECT q.quote_number, c.email, c.first_name, c.last_name FROM quotes q JOIN clients c ON q.client_id = c.id WHERE q.id = $1`,
        [id]
      )
      if (qRes.rows.length === 0)
        return res.status(404).send('Devis non trouvé')
      const q = qRes.rows[0]
      if (!q.email)
        return res
          .status(400)
          .send('Aucune adresse e‑mail du client enregistrée.')

      // Throttle: pas plus d'un envoi par 60s
      const recent = await query(
        `SELECT COUNT(*) AS c FROM quote_status_history WHERE quote_id = $1 AND event_type = 'otp_sent' AND created_at > NOW() - INTERVAL '60 seconds'`,
        [id]
      )
      if (parseInt(recent.rows[0].c || '0', 10) > 0) {
        return res
          .status(429)
          .send('Veuillez patienter avant de demander un nouveau code.')
      }

      // Générer un OTP 6 chiffres, stocker hashé avec sel dans quote_tokens (purpose=otp)
      const code = String(Math.floor(100000 + Math.random() * 900000))
      const salt = crypto.randomBytes(8).toString('hex')
      const hash = crypto
        .createHash('sha256')
        .update(`${salt}:${code}`)
        .digest('hex')
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min
      // (optionnel) nettoyer anciens otp
      await query(
        `DELETE FROM quote_tokens WHERE quote_id = $1 AND purpose = 'otp'`,
        [id]
      )
      await query(
        `INSERT INTO quote_tokens (quote_id, token, purpose, expires_at) VALUES ($1,$2,'otp',$3)`,
        [id, `${salt}:${hash}`, expiresAt]
      )

      // Envoyer e‑mail
      const transport = createMailTransport()
      const from =
        process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com'
      const subject = `Code de validation pour votre devis ${q.quote_number}`
      const html = `<p>Bonjour ${q.first_name || ''} ${q.last_name || ''},</p>
                      <p>Votre code de validation est: <strong>${code}</strong></p>
                      <p>Ce code expire dans 10 minutes.</p>`
      try {
        await transport.sendMail({ from, to: q.email, subject, html })
      } catch (_) {
        /* ignore in dev stream */
      }

      await query(
        `INSERT INTO quote_status_history (quote_id, event_type, metadata) VALUES ($1,'otp_sent',$2)`,
        [id, JSON.stringify({ to: q.email })]
      )

      res.send(
        '<html><body style="font-family:Arial;padding:20px"><h2>Code envoyé.</h2><p>Un code à 6 chiffres a été envoyé par e‑mail. Entrez‑le pour accepter le devis.</p></body></html>'
      )
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
