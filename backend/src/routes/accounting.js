const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const accountingExportService = require('../services/accountingExportService');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Route pour générer l'export FEC
router.get('/fec', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Dates requises',
                message: 'Veuillez fournir startDate et endDate (format YYYY-MM-DD)'
            });
        }

        const result = await accountingExportService.generateFECExport(
            req.user.userId,
            new Date(startDate),
            new Date(endDate)
        );

        // Envoyer le fichier FEC
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

        const fileContent = fs.readFileSync(result.filepath, 'utf8');
        res.send(fileContent);

        // Nettoyer le fichier temporaire
        setTimeout(() => {
            try {
                fs.unlinkSync(result.filepath);
            } catch (error) {
                console.error('Erreur lors de la suppression du fichier temporaire:', error);
            }
        }, 5000);

    } catch (error) {
        console.error('Erreur lors de la génération de l\'export FEC:', error);
        res.status(500).json({ error: 'Erreur lors de la génération de l\'export FEC' });
    }
});

// Route pour générer l'export CSV des ventes
router.get('/sales-csv', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Dates requises',
                message: 'Veuillez fournir startDate et endDate (format YYYY-MM-DD)'
            });
        }

        const result = await accountingExportService.generateSalesCSV(
            req.user.userId,
            new Date(startDate),
            new Date(endDate)
        );

        // Envoyer le fichier CSV
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

        const fileContent = fs.readFileSync(result.filepath, 'utf8');
        res.send(fileContent);

        // Nettoyer le fichier temporaire
        setTimeout(() => {
            try {
                fs.unlinkSync(result.filepath);
            } catch (error) {
                console.error('Erreur lors de la suppression du fichier temporaire:', error);
            }
        }, 5000);

    } catch (error) {
        console.error('Erreur lors de la génération de l\'export CSV:', error);
        res.status(500).json({ error: 'Erreur lors de la génération de l\'export CSV' });
    }
});

// Route pour obtenir les statistiques comptables
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Dates requises',
                message: 'Veuillez fournir startDate et endDate (format YYYY-MM-DD)'
            });
        }

        // Récupérer les statistiques des ventes
        const { query } = require('../config/database');
        const statsResult = await query(
            `SELECT 
                COUNT(*) as total_invoices,
                SUM(total_amount) as total_revenue,
                SUM(vat_amount) as total_vat,
                SUM(paid_amount) as total_paid,
                AVG(total_amount) as average_invoice,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
                COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices
             FROM invoices 
             WHERE user_id = $1 
             AND invoice_date BETWEEN $2 AND $3`,
            [req.user.userId, startDate, endDate]
        );

        const stats = statsResult.rows[0];

        res.json({
            success: true,
            data: {
                period: { startDate, endDate },
                invoices: {
                    total: parseInt(stats.total_invoices),
                    paid: parseInt(stats.paid_invoices),
                    pending: parseInt(stats.pending_invoices),
                    overdue: parseInt(stats.overdue_invoices)
                },
                amounts: {
                    totalRevenue: parseFloat(stats.total_revenue || 0),
                    totalVAT: parseFloat(stats.total_vat || 0),
                    totalPaid: parseFloat(stats.total_paid || 0),
                    averageInvoice: parseFloat(stats.average_invoice || 0)
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

module.exports = router;
