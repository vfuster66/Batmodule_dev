const express = require('express');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const insuranceService = require('../services/insuranceService');

const router = express.Router();

// Schémas de validation
const createInsuranceSchema = Joi.object({
    certificateType: Joi.string().valid('decennale', 'rc_pro', 'garantie', 'multirisque').required(),
    certificateNumber: Joi.string().max(100).required(),
    insuranceCompany: Joi.string().max(255).required(),
    policyNumber: Joi.string().max(100).optional(),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
    coverageAmount: Joi.number().min(0).optional(),
    deductible: Joi.number().min(0).optional(),
    notes: Joi.string().max(1000).optional(),
    documentUrl: Joi.string().uri().optional()
});

const updateInsuranceSchema = Joi.object({
    certificateType: Joi.string().valid('decennale', 'rc_pro', 'garantie', 'multirisque').optional(),
    certificateNumber: Joi.string().max(100).optional(),
    insuranceCompany: Joi.string().max(255).optional(),
    policyNumber: Joi.string().max(100).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    coverageAmount: Joi.number().min(0).optional(),
    deductible: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional(),
    notes: Joi.string().max(1000).optional(),
    documentUrl: Joi.string().uri().optional()
});

// Route pour récupérer toutes les assurances
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type } = req.query;
        const insurances = await insuranceService.getInsurances(req.user.userId, type);

        res.json({
            success: true,
            data: insurances,
            count: insurances.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des assurances:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des assurances' });
    }
});

// Route pour récupérer une assurance par ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const insurance = await insuranceService.getInsuranceById(id, req.user.userId);

        res.json({
            success: true,
            data: insurance
        });
    } catch (error) {
        if (error.message === 'Assurance non trouvée') {
            return res.status(404).json({ error: 'Assurance non trouvée' });
        }
        console.error('Erreur lors de la récupération de l\'assurance:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'assurance' });
    }
});

// Route pour créer une nouvelle assurance
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error, value } = createInsuranceSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const insuranceData = {
            ...value,
            userId: req.user.userId
        };

        const insurance = await insuranceService.createInsurance(insuranceData);

        res.status(201).json({
            success: true,
            message: 'Assurance créée avec succès',
            data: insurance
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'assurance:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'assurance' });
    }
});

// Route pour mettre à jour une assurance
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateInsuranceSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const insurance = await insuranceService.updateInsurance(id, req.user.userId, value);

        res.json({
            success: true,
            message: 'Assurance mise à jour avec succès',
            data: insurance
        });
    } catch (error) {
        if (error.message === 'Assurance non trouvée') {
            return res.status(404).json({ error: 'Assurance non trouvée' });
        }
        console.error('Erreur lors de la mise à jour de l\'assurance:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'assurance' });
    }
});

// Route pour supprimer une assurance
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await insuranceService.deleteInsurance(id, req.user.userId);

        if (!deleted) {
            return res.status(404).json({ error: 'Assurance non trouvée' });
        }

        res.json({
            success: true,
            message: 'Assurance supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'assurance:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'assurance' });
    }
});

// Route pour récupérer les assurances expirant bientôt
router.get('/alerts/expiring', authenticateToken, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const expiringInsurances = await insuranceService.getExpiringInsurances(
            req.user.userId,
            parseInt(days)
        );

        res.json({
            success: true,
            data: expiringInsurances,
            count: expiringInsurances.length,
            days: parseInt(days)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des assurances expirantes:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des assurances expirantes' });
    }
});

// Route pour vérifier la conformité des assurances
router.get('/compliance/check', authenticateToken, async (req, res) => {
    try {
        const compliance = await insuranceService.checkInsuranceCompliance(req.user.userId);

        res.json({
            success: true,
            data: compliance
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de conformité:', error);
        res.status(500).json({ error: 'Erreur lors de la vérification de conformité' });
    }
});

// Route pour générer un rapport d'assurances
router.get('/reports/generate', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Dates de début et de fin requises',
                message: 'Veuillez fournir startDate et endDate'
            });
        }

        const report = await insuranceService.generateInsuranceReport(
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

// Route pour obtenir les types d'assurances
router.get('/types/info', authenticateToken, async (req, res) => {
    try {
        const insuranceTypes = {
            decennale: {
                name: 'Assurance Décennale',
                description: 'Obligatoire pour les entreprises du bâtiment',
                coverage: 'Dommages affectant la solidité de l\'ouvrage',
                duration: '10 ans après réception des travaux',
                legalBasis: 'Article 1792 du Code civil',
                minAmount: '1 000 000€ par sinistre'
            },
            rc_pro: {
                name: 'Assurance Responsabilité Civile Professionnelle',
                description: 'Protection contre les dommages causés aux tiers',
                coverage: 'Dommages corporels, matériels et immatériels',
                duration: 'Pendant la durée de l\'activité',
                legalBasis: 'Code des assurances',
                minAmount: '1 000 000€ par sinistre'
            },
            garantie: {
                name: 'Garantie Financière',
                description: 'Garantie des sommes versées par les clients',
                coverage: 'Remboursement des acomptes en cas de défaillance',
                duration: 'Pendant la durée des travaux',
                legalBasis: 'Article L. 111-33 du Code de la construction',
                minAmount: 'Variable selon le CA'
            },
            multirisque: {
                name: 'Multirisque Professionnelle',
                description: 'Protection complète de l\'entreprise',
                coverage: 'Bâtiments, matériel, perte d\'exploitation',
                duration: 'Annuelle avec tacite reconduction',
                legalBasis: 'Code des assurances',
                minAmount: 'Variable selon les besoins'
            }
        };

        res.json({
            success: true,
            data: insuranceTypes
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des types d\'assurances:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des types d\'assurances' });
    }
});

module.exports = router;
