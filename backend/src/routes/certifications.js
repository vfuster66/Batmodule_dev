const express = require('express');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const certificationService = require('../services/certificationService');

const router = express.Router();

// Schémas de validation
const createCertificationSchema = Joi.object({
    certificationType: Joi.string().valid('rge', 'qualibat', 'qualifelec', 'qualifibat', 'qualipac', 'qualisol', 'qualit-enr').required(),
    certificationNumber: Joi.string().max(100).required(),
    issuingBody: Joi.string().max(255).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
    scope: Joi.string().max(1000).optional(),
    notes: Joi.string().max(1000).optional(),
    documentUrl: Joi.string().uri().optional()
});

const updateCertificationSchema = Joi.object({
    certificationType: Joi.string().valid('rge', 'qualibat', 'qualifelec', 'qualifibat', 'qualipac', 'qualisol', 'qualit-enr').optional(),
    certificationNumber: Joi.string().max(100).optional(),
    issuingBody: Joi.string().max(255).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    scope: Joi.string().max(1000).optional(),
    isActive: Joi.boolean().optional(),
    notes: Joi.string().max(1000).optional(),
    documentUrl: Joi.string().uri().optional()
});

// Route pour récupérer toutes les certifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type } = req.query;
        const certifications = await certificationService.getCertifications(req.user.userId, type);

        res.json({
            success: true,
            data: certifications,
            count: certifications.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des certifications:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des certifications' });
    }
});

// Route pour récupérer une certification par ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const certification = await certificationService.getCertificationById(id, req.user.userId);

        res.json({
            success: true,
            data: certification
        });
    } catch (error) {
        if (error.message === 'Certification non trouvée') {
            return res.status(404).json({ error: 'Certification non trouvée' });
        }
        console.error('Erreur lors de la récupération de la certification:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la certification' });
    }
});

// Route pour créer une nouvelle certification
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error, value } = createCertificationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const certificationData = {
            ...value,
            userId: req.user.userId
        };

        const certification = await certificationService.createCertification(certificationData);

        res.status(201).json({
            success: true,
            message: 'Certification créée avec succès',
            data: certification
        });
    } catch (error) {
        console.error('Erreur lors de la création de la certification:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la certification' });
    }
});

// Route pour mettre à jour une certification
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateCertificationSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const certification = await certificationService.updateCertification(id, req.user.userId, value);

        res.json({
            success: true,
            message: 'Certification mise à jour avec succès',
            data: certification
        });
    } catch (error) {
        if (error.message === 'Certification non trouvée') {
            return res.status(404).json({ error: 'Certification non trouvée' });
        }
        console.error('Erreur lors de la mise à jour de la certification:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la certification' });
    }
});

// Route pour supprimer une certification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await certificationService.deleteCertification(id, req.user.userId);

        if (!deleted) {
            return res.status(404).json({ error: 'Certification non trouvée' });
        }

        res.json({
            success: true,
            message: 'Certification supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la certification:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la certification' });
    }
});

// Route pour récupérer les certifications expirant bientôt
router.get('/alerts/expiring', authenticateToken, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const expiringCertifications = await certificationService.getExpiringCertifications(
            req.user.userId,
            parseInt(days)
        );

        res.json({
            success: true,
            data: expiringCertifications,
            count: expiringCertifications.length,
            days: parseInt(days)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des certifications expirantes:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des certifications expirantes' });
    }
});

// Route pour vérifier la conformité des certifications
router.get('/compliance/check', authenticateToken, async (req, res) => {
    try {
        const compliance = await certificationService.checkCertificationCompliance(req.user.userId);

        res.json({
            success: true,
            data: compliance
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de conformité:', error);
        res.status(500).json({ error: 'Erreur lors de la vérification de conformité' });
    }
});

// Route pour générer un rapport de certifications
router.get('/reports/generate', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Dates de début et de fin requises',
                message: 'Veuillez fournir startDate et endDate'
            });
        }

        const report = await certificationService.generateCertificationReport(
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

// Route pour obtenir les types de certifications
router.get('/types/info', authenticateToken, async (req, res) => {
    try {
        const certificationTypes = await certificationService.getCertificationTypes();

        res.json({
            success: true,
            data: certificationTypes
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des types de certifications:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des types de certifications' });
    }
});

module.exports = router;
