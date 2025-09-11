const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [
            clientsRes,
            sentQuotesRes,
            acceptedQuotesRes,
            monthlyRevenueRes,
            yearlyRevenueRes,
            sentInvoicesRes,
            paidInvoicesRes,
            followUpsNeededRes,
            overdueInvoicesRes
        ] = await Promise.all([
            // 1. Nombre total de clients
            query('SELECT COUNT(*)::int AS c FROM clients WHERE user_id = $1', [userId]),

            // 2. Devis envoyés
            query("SELECT COUNT(*)::int AS c FROM quotes WHERE user_id = $1 AND status = 'sent'", [userId]),

            // 3. Devis acceptés
            query("SELECT COUNT(*)::int AS c FROM quotes WHERE user_id = $1 AND status = 'accepted'", [userId]),

            // 4. CA mensuel (factures payées ce mois)
            query(
                `SELECT COALESCE(SUM(total_ttc),0)::numeric AS sum
                 FROM invoices
                 WHERE user_id = $1 AND status = 'paid' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
                [userId]
            ),

            // 5. CA annuel (factures payées cette année)
            query(
                `SELECT COALESCE(SUM(total_ttc),0)::numeric AS sum
                 FROM invoices
                 WHERE user_id = $1 AND status = 'paid' AND DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE)`,
                [userId]
            ),

            // 6. Factures envoyées
            query("SELECT COUNT(*)::int AS c FROM invoices WHERE user_id = $1 AND status IN ('sent', 'pending', 'overdue')", [userId]),

            // 7. Factures payées
            query("SELECT COUNT(*)::int AS c FROM invoices WHERE user_id = $1 AND status = 'paid'", [userId]),

            // 8. Relances à effectuer (factures en attente depuis plus de 7 jours)
            query(
                `SELECT COUNT(*)::int AS c 
                 FROM invoices 
                 WHERE user_id = $1 AND status = 'pending' AND created_at < NOW() - INTERVAL '7 days'`,
                [userId]
            ),

            // 9. Factures hors délai de paiement
            query("SELECT COUNT(*)::int AS c FROM invoices WHERE user_id = $1 AND status = 'overdue'", [userId])
        ]);

        res.json({
            clients: clientsRes.rows[0].c,
            sentQuotes: sentQuotesRes.rows[0].c,
            acceptedQuotes: acceptedQuotesRes.rows[0].c,
            monthlyRevenue: parseFloat(monthlyRevenueRes.rows[0].sum),
            yearlyRevenue: parseFloat(yearlyRevenueRes.rows[0].sum),
            sentInvoices: sentInvoicesRes.rows[0].c,
            paidInvoices: paidInvoicesRes.rows[0].c,
            followUpsNeeded: followUpsNeededRes.rows[0].c,
            overdueInvoices: overdueInvoicesRes.rows[0].c
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const activities = [];

        const [clients, quotes, invoices] = await Promise.all([
            query(`SELECT 'client' AS type, id, first_name || ' ' || last_name AS label, created_at FROM clients WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`, [userId]),
            query(`SELECT 'quote' AS type, id, quote_number AS label, created_at FROM quotes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`, [userId]),
            query(`SELECT 'invoice' AS type, id, invoice_number AS label, created_at FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`, [userId])
        ]);

        for (const row of clients.rows) activities.push({ type: row.type, id: row.id, label: row.label, createdAt: row.created_at });
        for (const row of quotes.rows) activities.push({ type: row.type, id: row.id, label: row.label, createdAt: row.created_at });
        for (const row of invoices.rows) activities.push({ type: row.type, id: row.id, label: row.label, createdAt: row.created_at });

        activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ activities: activities.slice(0, 10) });
    } catch (error) {
        next(error);
    }
});

module.exports = router;


// ====== ANALYTICS ======
// GET /api/dashboard/analytics - séries pour graphiques et listes top
router.get('/analytics', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // 12 mois glissants à partir du début du mois courant - 11
        const revenueByMonthRes = await query(`
            WITH months AS (
                SELECT DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * g) AS month
                FROM generate_series(0, 11) AS g
            )
            SELECT TO_CHAR(m.month, 'YYYY-MM') AS label,
                   COALESCE(SUM(i.total_ttc), 0)::numeric AS value
            FROM months m
            LEFT JOIN invoices i
              ON i.user_id = $1
             AND i.status = 'paid'
             AND DATE_TRUNC('month', i.created_at) = m.month
            GROUP BY m.month
            ORDER BY m.month
        `, [userId]);

        const quotesMonthlyRes = await query(`
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
        `, [userId]);

        const topClients90Res = await query(`
            SELECT c.id, c.first_name, c.last_name, c.company_name,
                   COALESCE(SUM(i.total_ttc),0)::numeric AS total
            FROM invoices i
            JOIN clients c ON i.client_id = c.id
            WHERE i.user_id = $1 AND i.status = 'paid' AND i.created_at >= NOW() - INTERVAL '90 days'
            GROUP BY c.id, c.first_name, c.last_name, c.company_name
            ORDER BY total DESC
            LIMIT 5
        `, [userId]);

        const outstandingBucketsRes = await query(`
            SELECT 
                COALESCE(SUM(CASE WHEN due_date < NOW() AND NOW() - due_date <= INTERVAL '30 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS o0_30,
                COALESCE(SUM(CASE WHEN due_date < NOW() AND NOW() - due_date > INTERVAL '30 days' AND NOW() - due_date <= INTERVAL '60 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS o31_60,
                COALESCE(SUM(CASE WHEN due_date < NOW() AND NOW() - due_date > INTERVAL '60 days' AND NOW() - due_date <= INTERVAL '90 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS o61_90,
                COALESCE(SUM(CASE WHEN due_date < NOW() AND NOW() - due_date > INTERVAL '90 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS o90_plus,
                COALESCE(SUM(CASE WHEN due_date >= NOW() AND due_date <= NOW() + INTERVAL '30 days' THEN (total_ttc - COALESCE(paid_amount,0)) ELSE 0 END),0)::numeric AS due_soon
            FROM invoices
            WHERE user_id = $1 AND status IN ('pending','overdue')
        `, [userId]);

        // Pipeline devis envoyés sur 12 mois
        const pipelineSentRes = await query(`
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
        `, [userId]);

        res.json({
            revenueByMonth: revenueByMonthRes.rows.map(r => ({ label: r.label, value: parseFloat(r.value) })),
            quotesMonthly: quotesMonthlyRes.rows.map(r => ({ label: r.label, accepted: r.accepted, sent: r.sent })),
            pipelineSentByMonth: pipelineSentRes.rows.map(r => ({ label: r.label, value: parseFloat(r.value) })),
            topClients90: topClients90Res.rows.map(r => ({ id: r.id, name: `${r.first_name} ${r.last_name}`.trim(), company: r.company_name, total: parseFloat(r.total) })),
            outstandingAging: {
                o0_30: parseFloat(outstandingBucketsRes.rows[0].o0_30),
                o31_60: parseFloat(outstandingBucketsRes.rows[0].o31_60),
                o61_90: parseFloat(outstandingBucketsRes.rows[0].o61_90),
                o90_plus: parseFloat(outstandingBucketsRes.rows[0].o90_plus),
                dueSoon: parseFloat(outstandingBucketsRes.rows[0].due_soon)
            }
        });
    } catch (error) { next(error); }
});
