const express = require('express')
const { query, transaction } = require('../config/database')
const { authenticateToken } = require('../middleware/auth')
const calculationService = require('../services/calculationService')

const router = express.Router()

async function ensureSchema() {
  // Ajouter colonnes de numérotation si manquantes
  await query(
    "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS credit_prefix VARCHAR(10) DEFAULT 'AVO'"
  )
  await query(
    'ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS credit_counter INTEGER DEFAULT 0'
  )

  // Créer tables avoirs si absentes
  await query(`CREATE TABLE IF NOT EXISTS credit_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
        credit_number VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subtotal_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_ttc DECIMAL(10,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, credit_number)
    )`)

  await query(`CREATE TABLE IF NOT EXISTS credit_note_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        credit_note_id UUID NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
        service_id UUID REFERENCES services(id) ON DELETE SET NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
        unit_price_ht DECIMAL(10,2) NOT NULL,
        unit_price_ttc DECIMAL(10,2) NOT NULL,
        vat_rate DECIMAL(5,2) NOT NULL,
        total_ht DECIMAL(10,2) NOT NULL,
        total_ttc DECIMAL(10,2) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`)
}

// POST /api/credits/from-invoice/:id - Créer un avoir à partir d'une facture
router.post('/from-invoice/:id', authenticateToken, async (req, res, next) => {
  try {
    await ensureSchema()
    const { id: invoiceId } = req.params

    const result = await transaction(async (client) => {
      // Charger la facture
      const invoiceRes = await client.query(
        `SELECT * FROM invoices WHERE id = $1 AND user_id = $2`,
        [invoiceId, req.user.userId]
      )
      if (invoiceRes.rows.length === 0) {
        return { error: 404 }
      }
      const invoice = invoiceRes.rows[0]

      // Charger les lignes
      const itemsRes = await client.query(
        `SELECT service_id, description, quantity, unit_price_ht, vat_rate, sort_order
                 FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order, created_at`,
        [invoiceId]
      )

      // Numérotation
      const year = new Date().getFullYear()
      const settingsRes = await client.query(
        'SELECT credit_prefix, credit_counter FROM company_settings WHERE user_id = $1 FOR UPDATE',
        [req.user.userId]
      )
      const prefix = settingsRes.rows[0]?.credit_prefix || 'AVO'
      let counter = settingsRes.rows[0]?.credit_counter ?? 0
      const cntYear = await client.query(
        'SELECT COUNT(*) AS cnt FROM credit_notes WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2',
        [req.user.userId, year]
      )
      if (parseInt(cntYear.rows[0].cnt, 10) === 0) counter = 0
      counter += 1
      await client.query(
        'UPDATE company_settings SET credit_counter = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [counter, req.user.userId]
      )
      const creditNumber = `${prefix}-${year}-${String(counter).padStart(4, '0')}`

      // Calculer totaux (quantités et montants négatifs)
      const itemsForCalc = itemsRes.rows.map((it) => ({
        quantity: -parseFloat(it.quantity),
        unitPriceHt: parseFloat(it.unit_price_ht),
        vatRate: parseFloat(it.vat_rate),
      }))
      const calcs = calculationService.calculateTotals(itemsForCalc)

      // Créer avoir
      const creditRes = await client.query(
        `INSERT INTO credit_notes (user_id, invoice_id, credit_number, title, description,
                 subtotal_ht, total_vat, total_ttc, notes)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          req.user.userId,
          invoiceId,
          creditNumber,
          invoice.title ? `Avoir - ${invoice.title}` : `Avoir ${creditNumber}`,
          invoice.description,
          calcs.subtotalHt,
          calcs.totalVat,
          calcs.totalTtc,
          `Avoir basé sur la facture ${invoice.invoice_number}`,
        ]
      )
      const credit = creditRes.rows[0]

      // Lignes d'avoir
      for (let i = 0; i < calcs.items.length; i++) {
        const src = itemsRes.rows[i]
        const it = calcs.items[i]
        await client.query(
          `INSERT INTO credit_note_items (credit_note_id, service_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, total_ht, total_ttc, sort_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            credit.id,
            src.service_id,
            src.description,
            it.quantity,
            it.unitPriceHt,
            it.unitPriceTtc,
            it.vatRate,
            it.totalHt,
            it.totalTtc,
            src.sort_order || i,
          ]
        )
      }

      return { credit }
    })

    if (result?.error === 404) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }

    const c = result.credit
    res.status(201).json({
      message: 'Avoir créé avec succès',
      credit: {
        id: c.id,
        creditNumber: c.credit_number,
        invoiceId: c.invoice_id,
        title: c.title,
        description: c.description,
        subtotalHt: parseFloat(c.subtotal_ht),
        totalVat: parseFloat(c.total_vat),
        totalTtc: parseFloat(c.total_ttc),
        notes: c.notes,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      },
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
