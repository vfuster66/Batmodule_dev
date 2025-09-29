const express = require('express')
const { query } = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId

    const [
      clientsRes,
      sentQuotesRes,
      acceptedQuotesRes,
      monthlyRevenueRes,
      yearlyRevenueRes,
      sentInvoicesRes,
      paidInvoicesRes,
      followUpsNeededRes,
      overdueInvoicesRes,
    ] = await Promise.all([
      // 1. Nombre total de clients
      query('SELECT COUNT(*)::int AS c FROM clients WHERE user_id = $1', [
        userId,
      ]),

      // 2. Devis envoyés
      query(
        "SELECT COUNT(*)::int AS c FROM quotes WHERE user_id = $1 AND status = 'sent'",
        [userId]
      ),

      // 3. Devis acceptés
      query(
        "SELECT COUNT(*)::int AS c FROM quotes WHERE user_id = $1 AND status = 'accepted'",
        [userId]
      ),

      // 4. CA mensuel (paiements reçus ce mois)
      query(
        `SELECT COALESCE(SUM(p.amount),0)::numeric AS sum
                 FROM payments p
                 JOIN invoices i ON p.invoice_id = i.id
                 WHERE i.user_id = $1 AND DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', CURRENT_DATE)`,
        [userId]
      ),

      // 5. CA annuel (paiements reçus cette année)
      query(
        `SELECT COALESCE(SUM(p.amount),0)::numeric AS sum
                 FROM payments p
                 JOIN invoices i ON p.invoice_id = i.id
                 WHERE i.user_id = $1 AND DATE_TRUNC('year', p.payment_date) = DATE_TRUNC('year', CURRENT_DATE)`,
        [userId]
      ),

      // 6. Factures envoyées
      query(
        "SELECT COUNT(*)::int AS c FROM invoices WHERE user_id = $1 AND status IN ('sent', 'pending', 'overdue')",
        [userId]
      ),

      // 7. Factures payées
      query(
        "SELECT COUNT(*)::int AS c FROM invoices WHERE user_id = $1 AND status = 'paid'",
        [userId]
      ),

      // 8. Relances à effectuer (factures en retard d'échéance)
      query(
        `SELECT COUNT(*)::int AS c 
                 FROM invoices 
                 WHERE user_id = $1 AND status = 'pending' AND due_date < CURRENT_DATE`,
        [userId]
      ),

      // 9. Factures hors délai de paiement
      query(
        "SELECT COUNT(*)::int AS c FROM invoices WHERE user_id = $1 AND status = 'overdue'",
        [userId]
      ),
    ])

    res.json({
      clients: clientsRes.rows[0].c,
      sentQuotes: sentQuotesRes.rows[0].c,
      acceptedQuotes: acceptedQuotesRes.rows[0].c,
      monthlyRevenue: parseFloat(monthlyRevenueRes.rows[0].sum),
      yearlyRevenue: parseFloat(yearlyRevenueRes.rows[0].sum),
      sentInvoices: sentInvoicesRes.rows[0].c,
      paidInvoices: paidInvoicesRes.rows[0].c,
      followUpsNeeded: followUpsNeededRes.rows[0].c,
      overdueInvoices: overdueInvoicesRes.rows[0].c,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/dashboard/recent-activity
router.get('/recent-activity', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId
    const activities = []

    const [clients, quotes, invoices] = await Promise.all([
      query(
        `SELECT 'client' AS type, id, 
                COALESCE(
                  NULLIF(TRIM(first_name || ' ' || last_name), ''),
                  company_name,
                  'Client sans nom'
                ) AS label, 
                created_at 
         FROM clients WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [userId]
      ),
      query(
        `SELECT 'quote' AS type, id, COALESCE(NULLIF(TRIM(quote_number), ''), 'Devis non numéroté') AS label, created_at FROM quotes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [userId]
      ),
      query(
        `SELECT 'invoice' AS type, id, COALESCE(NULLIF(TRIM(invoice_number), ''), 'Facture non numérotée') AS label, created_at FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [userId]
      ),
    ])

    for (const row of clients.rows)
      activities.push({
        type: row.type,
        id: row.id,
        label: row.label,
        createdAt: row.created_at,
      })
    for (const row of quotes.rows)
      activities.push({
        type: row.type,
        id: row.id,
        label: row.label,
        createdAt: row.created_at,
      })
    for (const row of invoices.rows)
      activities.push({
        type: row.type,
        id: row.id,
        label: row.label,
        createdAt: row.created_at,
      })

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json({ activities: activities.slice(0, 10) })
  } catch (error) {
    next(error)
  }
})

// GET /api/dashboard/urgent-invoices - Factures urgentes
router.get('/urgent-invoices', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId

    const result = await query(
      `SELECT i.id, i.invoice_number, i.total_ttc, i.due_date,
              COALESCE(
                NULLIF(TRIM(c.first_name || ' ' || c.last_name), ''),
                c.company_name,
                'Client sans nom'
              ) AS client_name
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       WHERE i.user_id = $1 AND i.status IN ('pending', 'overdue') AND i.due_date < CURRENT_DATE
       ORDER BY i.due_date ASC
       LIMIT 10`,
      [userId]
    )

    res.json({ invoices: result.rows })
  } catch (error) {
    console.error('Erreur lors du chargement des factures urgentes:', error)
    next(error)
  }
})

// GET /api/dashboard/pending-quotes - Devis en attente
router.get('/pending-quotes', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId

    // Sanitisation et validation du paramètre days
    const daysParam = parseInt(req.query.days) || 7
    const days = Math.max(1, Math.min(90, daysParam)) // Borner entre 1 et 90 jours

    const result = await query(
      `SELECT q.id, q.quote_number, q.total_ttc, q.created_at,
              COALESCE(
                NULLIF(TRIM(c.first_name || ' ' || c.last_name), ''),
                c.company_name,
                'Client sans nom'
              ) AS client_name
       FROM quotes q
       JOIN clients c ON q.client_id = c.id
       WHERE q.user_id = $1 AND q.status = 'sent' 
       AND q.created_at < NOW() - make_interval(days => $2)
       ORDER BY q.created_at ASC
       LIMIT 10`,
      [userId, days]
    )

    res.json({ quotes: result.rows })
  } catch (error) {
    console.error('Erreur lors du chargement des devis en attente:', error)
    next(error)
  }
})

// ====== ANALYTICS ======
// GET /api/dashboard/analytics - séries pour graphiques et listes top
router.get('/analytics', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId

    // Requête optimisée qui mutualise les CTE et utilise Promise.all
    const [
      revenueByMonthRes,
      quotesMonthlyRes,
      topClients90Res,
      outstandingBucketsRes,
      pipelineSentRes,
    ] = await Promise.all([
      // Revenus par mois (basé sur les paiements)
      query(
        `
            WITH months AS (
                SELECT DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * g) AS month
                FROM generate_series(0, 11) AS g
            )
            SELECT TO_CHAR(m.month, 'YYYY-MM') AS label,
                   COALESCE(SUM(CASE WHEN i.user_id = $1 THEN p.amount ELSE 0 END), 0)::numeric AS value
            FROM months m
            LEFT JOIN payments p
              ON p.payment_date >= m.month
             AND p.payment_date < m.month + INTERVAL '1 month'
            LEFT JOIN invoices i ON p.invoice_id = i.id
            GROUP BY m.month
            ORDER BY m.month
        `,
        [userId]
      ),

      // Devis par mois (acceptés/envoyés)
      query(
        `
            WITH months AS (
                SELECT DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * g) AS month
                FROM generate_series(0, 11) AS g
            )
            SELECT TO_CHAR(m.month, 'YYYY-MM') AS label,
                   COALESCE(SUM(CASE WHEN q.status = 'accepted' THEN 1 ELSE 0 END),0)::int AS accepted,
                   COALESCE(SUM(CASE WHEN q.status = 'sent' THEN 1 ELSE 0 END),0)::int AS sent
            FROM months m
            LEFT JOIN quotes q
              ON q.user_id = $1
             AND DATE_TRUNC('month', q.created_at) = m.month
            GROUP BY m.month
            ORDER BY m.month
        `,
        [userId]
      ),

      // Top clients 90 jours
      query(
        `
            SELECT c.id, 
                   COALESCE(NULLIF(TRIM(c.first_name || ' ' || c.last_name), ''), c.company_name, 'Client sans nom') AS client_name,
                   c.company_name,
                   COALESCE(SUM(p.amount),0)::numeric AS total
            FROM payments p
            JOIN invoices i ON p.invoice_id = i.id
            JOIN clients c ON i.client_id = c.id
            WHERE i.user_id = $1 AND p.payment_date >= NOW() - INTERVAL '90 days'
            GROUP BY c.id, c.first_name, c.last_name, c.company_name
            ORDER BY total DESC
            LIMIT 5
        `,
        [userId]
      ),

      // Aging des encours
      query(
        `
            SELECT 
                COALESCE(SUM(CASE WHEN due_date < NOW() AND NOW() - due_date <= INTERVAL '30 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS o0_30,
                COALESCE(SUM(CASE WHEN due_date < NOW() AND NOW() - due_date > INTERVAL '30 days' AND NOW() - due_date <= INTERVAL '60 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS o31_60,
                COALESCE(SUM(CASE WHEN due_date < NOW() AND NOW() - due_date > INTERVAL '60 days' AND NOW() - due_date <= INTERVAL '90 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS o61_90,
                COALESCE(SUM(CASE WHEN due_date < NOW() AND NOW() - due_date > INTERVAL '90 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS o90_plus,
                COALESCE(SUM(CASE WHEN due_date >= NOW() AND due_date <= NOW() + INTERVAL '30 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS due_soon
            FROM invoices
            WHERE user_id = $1 AND status IN ('pending','overdue')
        `,
        [userId]
      ),

      // Pipeline devis envoyés sur 12 mois
      query(
        `
            WITH months AS (
                SELECT DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * g) AS month
                FROM generate_series(0, 11) AS g
            )
            SELECT TO_CHAR(m.month, 'YYYY-MM') AS label,
                   COALESCE(SUM(q.total_ttc),0)::numeric AS value
            FROM months m
            LEFT JOIN quotes q
              ON q.user_id = $1
             AND q.status = 'sent'
             AND DATE_TRUNC('month', q.created_at) = m.month
            GROUP BY m.month
            ORDER BY m.month
        `,
        [userId]
      ),
    ])

    res.json({
      revenueByMonth: revenueByMonthRes.rows.map((r) => ({
        label: r.label,
        value: parseFloat(r.value),
      })),
      quotesMonthly: quotesMonthlyRes.rows.map((r) => ({
        label: r.label,
        accepted: r.accepted,
        sent: r.sent,
      })),
      pipelineSentByMonth: pipelineSentRes.rows.map((r) => ({
        label: r.label,
        value: parseFloat(r.value),
      })),
      topClients90: topClients90Res.rows.map((r) => ({
        id: r.id,
        name: r.client_name,
        company: r.company_name,
        total: parseFloat(r.total),
      })),
      outstandingAging: {
        o0_30: parseFloat(outstandingBucketsRes.rows[0].o0_30),
        o31_60: parseFloat(outstandingBucketsRes.rows[0].o31_60),
        o61_90: parseFloat(outstandingBucketsRes.rows[0].o61_90),
        o90_plus: parseFloat(outstandingBucketsRes.rows[0].o90_plus),
        dueSoon: parseFloat(outstandingBucketsRes.rows[0].due_soon),
      },
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
