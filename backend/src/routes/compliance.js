const express = require('express');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const complianceAlertService = require('../services/complianceAlertService');

const router = express.Router();

// Schémas de validation
const resolveAlertSchema = Joi.object({
    notes: Joi.string().max(1000).optional()
});

// Route pour récupérer le tableau de bord de conformité
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const dashboard = await complianceAlertService.getComplianceDashboard(req.user.userId);

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du tableau de bord:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du tableau de bord' });
    }
});

// Route pour récupérer les alertes
router.get('/alerts', authenticateToken, async (req, res) => {
    try {
        const { severity, unresolved = 'true' } = req.query;
        const alerts = await complianceAlertService.getAlerts(
            req.user.userId,
            severity,
            unresolved === 'true'
        );

        res.json({
            success: true,
            data: alerts,
            count: alerts.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des alertes:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
    }
});

// Route pour générer toutes les alertes
router.post('/alerts/generate', authenticateToken, async (req, res) => {
    try {
        const result = await complianceAlertService.generateAllAlerts(req.user.userId);

        res.json({
            success: true,
            message: 'Alertes générées avec succès',
            data: result
        });
    } catch (error) {
        console.error('Erreur lors de la génération des alertes:', error);
        res.status(500).json({ error: 'Erreur lors de la génération des alertes' });
    }
});

// Route pour résoudre une alerte
router.put('/alerts/:id/resolve', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = resolveAlertSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const alert = await complianceAlertService.resolveAlert(id, req.user.userId, value.notes);

        res.json({
            success: true,
            message: 'Alerte résolue avec succès',
            data: alert
        });
    } catch (error) {
        if (error.message === 'Alerte non trouvée') {
            return res.status(404).json({ error: 'Alerte non trouvée' });
        }
        console.error('Erreur lors de la résolution de l\'alerte:', error);
        res.status(500).json({ error: 'Erreur lors de la résolution de l\'alerte' });
    }
});

// Route pour supprimer une alerte
router.delete('/alerts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await complianceAlertService.deleteAlert(id, req.user.userId);

        if (!deleted) {
            return res.status(404).json({ error: 'Alerte non trouvée' });
        }

        res.json({
            success: true,
            message: 'Alerte supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'alerte:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'alerte' });
    }
});

// Route pour générer un rapport de conformité
router.get('/reports/generate', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Dates de début et de fin requises',
                message: 'Veuillez fournir startDate et endDate'
            });
        }

        const report = await complianceAlertService.generateComplianceReport(
            req.user.userId,
            new Date(startDate),
            new Date(endDate)
        );

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
    }
});

// Route pour obtenir les statistiques de conformité
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const dashboard = await complianceAlertService.getComplianceDashboard(req.user.userId);

        res.json({
            success: true,
            data: {
                complianceScore: dashboard.complianceScore,
                statistics: dashboard.statistics,
                recommendations: dashboard.recommendations
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

// Route pour obtenir les éléments expirant bientôt
router.get('/expiring', authenticateToken, async (req, res) => {
    try {
        const dashboard = await complianceAlertService.getComplianceDashboard(req.user.userId);

        res.json({
            success: true,
            data: dashboard.expiringSoon
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des éléments expirants:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des éléments expirants' });
    }
});

module.exports = router;
