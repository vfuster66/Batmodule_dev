const express = require('express');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const wasteManagementService = require('../services/wasteManagementService');

const router = express.Router();

// Schémas de validation
const createWasteRecordSchema = Joi.object({
    projectId: Joi.string().uuid().optional(),
    wasteType: Joi.string().max(100).required(),
    wasteCode: Joi.string().max(20).optional(),
    quantity: Joi.number().min(0).required(),
    unit: Joi.string().max(20).default('kg'),
    collectionDate: Joi.date().required(),
    transporterName: Joi.string().max(255).optional(),
    transporterSiret: Joi.string().pattern(/^\d{14}$/).optional(),
    destinationFacility: Joi.string().max(255).optional(),
    facilitySiret: Joi.string().pattern(/^\d{14}$/).optional(),
    bsdNumber: Joi.string().max(50).optional(),
    disposalMethod: Joi.string().max(100).optional(),
    cost: Joi.number().min(0).optional(),
    notes: Joi.string().max(1000).optional()
});

const updateWasteRecordSchema = Joi.object({
    projectId: Joi.string().uuid().optional(),
    wasteType: Joi.string().max(100).optional(),
    wasteCode: Joi.string().max(20).optional(),
    quantity: Joi.number().min(0).optional(),
    unit: Joi.string().max(20).optional(),
    collectionDate: Joi.date().optional(),
    transporterName: Joi.string().max(255).optional(),
    transporterSiret: Joi.string().pattern(/^\d{14}$/).optional(),
    destinationFacility: Joi.string().max(255).optional(),
    facilitySiret: Joi.string().pattern(/^\d{14}$/).optional(),
    bsdNumber: Joi.string().max(50).optional(),
    disposalMethod: Joi.string().max(100).optional(),
    cost: Joi.number().min(0).optional(),
    notes: Joi.string().max(1000).optional()
});

// Route pour récupérer tous les enregistrements de déchets
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.query;
        const wasteRecords = await wasteManagementService.getWasteRecords(req.user.userId, projectId);

        res.json({
            success: true,
            data: wasteRecords,
            count: wasteRecords.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des déchets:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des déchets' });
    }
});

// Route pour récupérer un enregistrement de déchet par ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const wasteRecord = await wasteManagementService.getWasteRecordById(id, req.user.userId);

        res.json({
            success: true,
            data: wasteRecord
        });
    } catch (error) {
        if (error.message === 'Enregistrement de déchet non trouvé') {
            return res.status(404).json({ error: 'Enregistrement de déchet non trouvé' });
        }
        console.error('Erreur lors de la récupération du déchet:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du déchet' });
    }
});

// Route pour créer un nouvel enregistrement de déchet
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error, value } = createWasteRecordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const wasteData = {
            ...value,
            userId: req.user.userId
        };

        const wasteRecord = await wasteManagementService.createWasteRecord(wasteData);

        res.status(201).json({
            success: true,
            message: 'Enregistrement de déchet créé avec succès',
            data: wasteRecord
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'enregistrement de déchet:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'enregistrement de déchet' });
    }
});

// Route pour mettre à jour un enregistrement de déchet
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateWasteRecordSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const wasteRecord = await wasteManagementService.updateWasteRecord(id, req.user.userId, value);

        res.json({
            success: true,
            message: 'Enregistrement de déchet mis à jour avec succès',
            data: wasteRecord
        });
    } catch (error) {
        if (error.message === 'Enregistrement de déchet non trouvé') {
            return res.status(404).json({ error: 'Enregistrement de déchet non trouvé' });
        }
        console.error('Erreur lors de la mise à jour de l\'enregistrement de déchet:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'enregistrement de déchet' });
    }
});

// Route pour supprimer un enregistrement de déchet
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await wasteManagementService.deleteWasteRecord(id, req.user.userId);

        if (!deleted) {
            return res.status(404).json({ error: 'Enregistrement de déchet non trouvé' });
        }

        res.json({
            success: true,
            message: 'Enregistrement de déchet supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'enregistrement de déchet:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'enregistrement de déchet' });
    }
});

// Route pour récupérer les statistiques de déchets
router.get('/statistics/overview', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const statistics = await wasteManagementService.getWasteStatistics(
            req.user.userId,
            startDate ? new Date(startDate) : null,
            endDate ? new Date(endDate) : null
        );

        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

// Route pour générer un rapport de déchets
router.get('/reports/generate', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Dates de début et de fin requises',
                message: 'Veuillez fournir startDate et endDate'
            });
        }

        const report = await wasteManagementService.generateWasteReport(
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

// Route pour obtenir les types de déchets
router.get('/types/info', authenticateToken, async (req, res) => {
    try {
        const wasteTypes = await wasteManagementService.getWasteTypes();

        res.json({
            success: true,
            data: wasteTypes
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des types de déchets:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des types de déchets' });
    }
});

// Route pour vérifier la conformité des déchets
router.get('/compliance/check', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await wasteManagementService.generateWasteReport(
            req.user.userId,
            startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Dernière année
            endDate ? new Date(endDate) : new Date()
        );

        const compliance = {
            isCompliant: true,
            warnings: [],
            errors: [],
            summary: {
                totalRecords: report.summary.totalRecords,
                complianceRate: {
                    bsd: report.summary.compliance.hasBsd,
                    transporter: report.summary.compliance.hasTransporter,
                    destination: report.summary.compliance.hasDestination
                }
            }
        };

        // Vérifier la conformité
        if (compliance.summary.complianceRate.bsd < 80) {
            compliance.warnings.push('Taux de conformité BSD faible (< 80%)');
        }

        if (compliance.summary.complianceRate.transporter < 90) {
            compliance.warnings.push('Informations transporteur manquantes');
        }

        if (compliance.summary.complianceRate.destination < 90) {
            compliance.warnings.push('Informations destination manquantes');
        }

        if (compliance.summary.complianceRate.bsd < 50) {
            compliance.isCompliant = false;
            compliance.errors.push('Conformité BSD insuffisante (< 50%)');
        }

        res.json({
            success: true,
            data: compliance
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de conformité:', error);
        res.status(500).json({ error: 'Erreur lors de la vérification de conformité' });
    }
});

module.exports = router;
