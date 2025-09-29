const { query, transaction } = require('../config/database')
const calculationService = require('./calculationService')

class AdvanceInvoiceService {
  /**
   * Crée une facture d'acompte
   * @param {Object} params - Paramètres de la facture d'acompte
   * @param {string} params.userId - ID de l'utilisateur
   * @param {string} params.clientId - ID du client
   * @param {string} params.quoteId - ID du devis (optionnel)
   * @param {string} params.title - Titre de la facture
   * @param {string} params.description - Description
   * @param {number} params.advanceAmount - Montant de l'acompte
   * @param {number} params.totalAmount - Montant total du projet
   * @param {Date} params.dueDate - Date d'échéance
   * @param {string} params.notes - Notes
   * @param {string} params.purchaseOrderNumber - N° de bon de commande
   * @param {string} params.paymentMethod - Type de paiement (cash, check, transfer, card)
   * @param {Date} params.paymentDate - Date de paiement
   * @returns {Object} - Facture d'acompte créée
   */
  async createAdvanceInvoice(params) {
    const {
      userId,
      clientId,
      quoteId,
      title,
      description,
      advanceAmount,
      dueDate,
      notes,
      paymentMethod = 'cash',
      paymentDate = new Date(),
    } = params

    return await transaction(async (client) => {
      // Générer le numéro de facture d'acompte
      const year = new Date().getFullYear()
      const settingsRes = await client.query(
        'SELECT invoice_prefix, invoice_counter FROM company_settings WHERE user_id = $1 FOR UPDATE',
        [userId]
      )

      const prefix = settingsRes.rows[0]?.invoice_prefix || 'FAC'
      let counter = settingsRes.rows[0]?.invoice_counter ?? 0

      // Reset annuel si nécessaire
      const currentYearCountRes = await client.query(
        'SELECT COUNT(*) AS cnt FROM invoices WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2',
        [userId, year]
      )
      const hasAnyThisYear = parseInt(currentYearCountRes.rows[0].cnt, 10) > 0
      if (!hasAnyThisYear) {
        counter = 0
      }
      counter += 1

      // Mettre à jour le compteur
      await client.query(
        'UPDATE company_settings SET invoice_counter = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [counter, userId]
      )

      const invoiceNumber = `${prefix}-${year}-${String(counter).padStart(4, '0')}`

      // Calculer les totaux pour l'acompte
      const vatRate = 20.0 // Taux par défaut, peut être paramétrable
      const advanceAmountHt = advanceAmount / (1 + vatRate / 100)
      const vatAmount = advanceAmount - advanceAmountHt

      // Récupérer le total du devis pour le calcul du montant restant
      const quoteResult = await client.query(
        'SELECT total_ttc FROM quotes WHERE id = $1 AND user_id = $2',
        [quoteId, userId]
      )

      if (quoteResult.rows.length === 0) {
        throw new Error('Devis non trouvé')
      }

      const quoteTotalTtc = quoteResult.rows[0].total_ttc

      // Créer la facture d'acompte
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
                    user_id, client_id, quote_id, invoice_number, title, description, 
                    status, subtotal_ht, total_vat, total_ttc, paid_amount, due_date, 
                    notes, invoice_type, quote_total_ttc
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, 0, $10, $11, 'acompte', $12)
                RETURNING id, invoice_number, title, description, status, subtotal_ht, 
                         total_vat, total_ttc, paid_amount, due_date, notes, invoice_type, quote_total_ttc, created_at, updated_at`,
        [
          userId,
          clientId,
          quoteId,
          invoiceNumber,
          title,
          description,
          advanceAmountHt,
          vatAmount,
          advanceAmount,
          dueDate,
          notes,
          quoteTotalTtc,
        ]
      )

      const invoice = invoiceResult.rows[0]

      // Récupérer les items du devis d'origine pour les inclure dans la facture d'acompte
      const quoteItemsResult = await client.query(
        `SELECT description, quantity, unit, unit_price_ht, unit_price_ttc, vat_rate, 
                total_ht, total_ttc, sort_order, section_id
         FROM quote_items 
         WHERE quote_id = $1 
         ORDER BY sort_order, created_at`,
        [quoteId]
      )

      if (quoteItemsResult.rows.length > 0) {
        // Inclure tous les items du devis d'origine
        for (const item of quoteItemsResult.rows) {
          await client.query(
            `INSERT INTO invoice_items (
                        invoice_id, service_id, description, quantity, unit, unit_price_ht, unit_price_ttc, 
                        vat_rate, total_ht, total_ttc, sort_order, section_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              invoice.id,
              null, // service_id
              item.description,
              item.quantity,
              item.unit,
              item.unit_price_ht,
              item.unit_price_ttc,
              item.vat_rate,
              item.total_ht,
              item.total_ttc,
              item.sort_order,
              item.section_id, // section_id du devis d'origine
            ]
          )
        }
      } else {
        // Fallback: créer une ligne de facture pour l'acompte si pas d'items de devis
        await client.query(
          `INSERT INTO invoice_items (
                      invoice_id, description, quantity, unit_price_ht, unit_price_ttc, 
                      vat_rate, total_ht, total_ttc, sort_order
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            invoice.id,
            `Acompte sur ${title}`,
            1,
            advanceAmountHt,
            advanceAmount,
            vatRate,
            advanceAmountHt,
            advanceAmount,
            0,
          ]
        )
      }

      // Créer automatiquement un paiement pour l'acompte
      await client.query(
        `INSERT INTO payments (invoice_id, amount, payment_method, payment_date, reference, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          invoice.id,
          advanceAmount,
          paymentMethod,
          paymentDate,
          `Acompte ${invoice.invoice_number}`,
          `Paiement d'acompte pour ${title}`,
        ]
      )

      // Mettre à jour le montant payé de la facture
      await client.query(`UPDATE invoices SET paid_amount = $1 WHERE id = $2`, [
        advanceAmount,
        invoice.id,
      ])

      return invoice
    })
  }

  /**
   * Crée une facture de solde
   * @param {Object} params - Paramètres de la facture de solde
   * @param {string} params.userId - ID de l'utilisateur
   * @param {string} params.clientId - ID du client
   * @param {string} params.quoteId - ID du devis
   * @param {string} params.parentInvoiceId - ID de la facture d'acompte
   * @param {string} params.title - Titre de la facture
   * @param {string} params.description - Description
   * @param {Array} params.items - Lignes de la facture
   * @param {Date} params.dueDate - Date d'échéance
   * @param {string} params.notes - Notes
   * @param {string} params.purchaseOrderNumber - N° de bon de commande
   * @returns {Object} - Facture de solde créée
   */
  async createFinalInvoice(params) {
    const {
      userId,
      clientId,
      quoteId,
      parentInvoiceId,
      title,
      description,
      items,
      dueDate,
      notes,
    } = params

    return await transaction(async (client) => {
      // Récupérer la facture d'acompte pour calculer le solde
      const advanceInvoiceRes = await client.query(
        'SELECT total_ttc FROM invoices WHERE id = $1 AND user_id = $2',
        [parentInvoiceId, userId]
      )

      if (advanceInvoiceRes.rows.length === 0) {
        throw new Error("Facture d'acompte non trouvée")
      }

      const advanceInvoice = advanceInvoiceRes.rows[0]
      const advanceAmount = advanceInvoice.total_ttc

      // Calculer les totaux du projet complet
      const calculations = calculationService.calculateTotals(items)
      const totalProjectAmount = calculations.totalTtc
      const remainingAmount = totalProjectAmount - advanceAmount

      if (remainingAmount <= 0) {
        throw new Error(
          "Le montant de l'acompte est supérieur ou égal au montant total du projet"
        )
      }

      // Récupérer le numéro de la facture d'acompte parente
      const parentInvoiceRes = await client.query(
        'SELECT invoice_number FROM invoices WHERE id = $1 AND user_id = $2',
        [parentInvoiceId, userId]
      )

      if (parentInvoiceRes.rows.length === 0) {
        throw new Error("Facture d'acompte parente non trouvée")
      }

      // const parentInvoiceNumber = parentInvoiceRes.rows[0].invoice_number; // Non utilisé pour le moment

      // Générer un nouveau numéro pour la facture de solde (conformité BOI-TVA-DECLA-30-10-30)
      const year = new Date().getFullYear()
      const settingsRes = await client.query(
        'SELECT invoice_prefix, invoice_counter FROM company_settings WHERE user_id = $1 FOR UPDATE',
        [userId]
      )

      const prefix = settingsRes.rows[0]?.invoice_prefix || 'FAC'
      let counter = settingsRes.rows[0]?.invoice_counter ?? 0

      // Reset annuel si nécessaire
      const currentYearCountRes = await client.query(
        'SELECT COUNT(*) AS cnt FROM invoices WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2',
        [userId, year]
      )
      const hasAnyThisYear = parseInt(currentYearCountRes.rows[0].cnt, 10) > 0
      if (!hasAnyThisYear) {
        counter = 0
      }
      counter += 1

      // Mettre à jour le compteur
      await client.query(
        'UPDATE company_settings SET invoice_counter = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [counter, userId]
      )

      const invoiceNumber = `${prefix}-${year}-${String(counter).padStart(4, '0')}`

      // Récupérer le total du devis pour le calcul du montant restant
      const quoteResult = await client.query(
        'SELECT total_ttc FROM quotes WHERE id = $1 AND user_id = $2',
        [quoteId, userId]
      )

      if (quoteResult.rows.length === 0) {
        throw new Error('Devis non trouvé')
      }

      const quoteTotalTtc = quoteResult.rows[0].total_ttc

      // Créer la facture de solde
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
                    user_id, client_id, quote_id, invoice_number, title, description, 
                    status, subtotal_ht, total_vat, total_ttc, paid_amount, due_date, 
                    notes, invoice_type, quote_total_ttc, parent_invoice_id
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, 0, $10, $11, 'solde', $12, $13)
                RETURNING id, invoice_number, title, description, status, subtotal_ht, 
                         total_vat, total_ttc, paid_amount, due_date, notes, invoice_type, quote_total_ttc, parent_invoice_id, created_at, updated_at`,
        [
          userId,
          clientId,
          quoteId,
          invoiceNumber,
          title,
          description,
          calculations.subtotalHt,
          calculations.totalVat,
          remainingAmount,
          dueDate,
          notes,
          quoteTotalTtc,
          parentInvoiceId,
        ]
      )

      const invoice = invoiceResult.rows[0]

      // Créer les lignes de la facture de solde
      const invoiceItems = []
      for (let i = 0; i < calculations.items.length; i++) {
        const item = calculations.items[i]
        const itemResult = await client.query(
          `INSERT INTO invoice_items (
                        invoice_id, service_id, description, quantity, unit_price_ht, 
                        unit_price_ttc, vat_rate, total_ht, total_ttc, sort_order, section_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING id, service_id, description, quantity, unit_price_ht, 
                             unit_price_ttc, vat_rate, total_ht, total_ttc, sort_order, section_id`,
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
  }

  /**
   * Récupère les factures liées (acompte + solde)
   * @param {string} userId - ID de l'utilisateur
   * @param {string} parentInvoiceId - ID de la facture parent
   * @returns {Object} - Factures liées
   */
  async getRelatedInvoices(userId, parentInvoiceId) {
    const result = await query(
      `SELECT * FROM invoices 
             WHERE user_id = $1 AND (id = $2)
             ORDER BY created_at ASC`,
      [userId, parentInvoiceId]
    )

    const invoices = result.rows
    const advanceInvoice = invoices[0] // La facture d'acompte est la première

    return {
      advance: advanceInvoice,
      final: null, // Pas de facture de solde pour l'instant
      all: invoices,
    }
  }

  /**
   * Calcule le statut de paiement d'un projet avec acompte
   * @param {string} userId - ID de l'utilisateur
   * @param {string} parentInvoiceId - ID de la facture d'acompte
   * @returns {Object} - Statut de paiement
   */
  async getPaymentStatus(userId, parentInvoiceId) {
    const relatedInvoices = await this.getRelatedInvoices(
      userId,
      parentInvoiceId
    )

    if (!relatedInvoices.advance) {
      return { error: "Aucune facture d'acompte trouvée" }
    }

    const totalAmount = relatedInvoices.advance.total_ttc
    const paidAmount = relatedInvoices.advance.paid_amount
    const remainingAmount = totalAmount - paidAmount

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      advancePaid: relatedInvoices.advance.status === 'paid',
      finalPaid: false, // Pas de facture de solde pour l'instant
      fullyPaid: remainingAmount <= 0,
    }
  }
}

module.exports = new AdvanceInvoiceService()
