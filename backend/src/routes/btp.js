const express = require('express');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const btpValidationService = require('../services/btpValidationService');

const router = express.Router();

// Schémas de validation
const reverseChargeBTPSchema = Joi.object({
    clientVatNumber: Joi.string().max(20).optional(),
    clientIsVatRegistered: Joi.boolean().required(),
    reverseChargeBtp: Joi.boolean().required()
});

const reducedVATSchema = Joi.object({
    propertyType: Joi.string().valid('residential', 'commercial', 'mixed').required(),
    propertyAgeYears: Joi.number().integer().min(0).required(),
    workType: Joi.string().valid('renovation', 'energy_improvement', 'maintenance').required(),
    reducedVatRate: Joi.number().valid(10, 5.5, 20).required()
});

const btpValidationSchema = Joi.object({
    reverseChargeBtp: Joi.boolean().default(false),
    clientVatNumber: Joi.string().max(20).optional(),
    clientIsVatRegistered: Joi.boolean().default(false),
    reducedVatApplied: Joi.boolean().default(false),
    propertyType: Joi.string().valid('residential', 'commercial', 'mixed').optional(),
    propertyAgeYears: Joi.number().integer().min(0).optional(),
    workType: Joi.string().valid('renovation', 'energy_improvement', 'maintenance').optional(),
    reducedVatRate: Joi.number().valid(10, 5.5, 20).optional(),
    workDescription: Joi.string().max(500).optional()
});

// Route pour valider l'autoliquidation BTP
router.post('/validate-reverse-charge', authenticateToken, async (req, res) => {
    try {
        const { error, value } = reverseChargeBTPSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const validation = await btpValidationService.validateReverseChargeBTP(value);

        res.json({
            validation,
            message: validation.is_valid ? 'Validation réussie' : 'Validation échouée'
        });
    } catch (error) {
        console.error('Erreur lors de la validation autoliquidation BTP:', error);
        res.status(500).json({ error: 'Erreur lors de la validation' });
    }
});

// Route pour valider la TVA réduite
router.post('/validate-reduced-vat', authenticateToken, async (req, res) => {
    try {
        const { error, value } = reducedVATSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const validation = await btpValidationService.validateReducedVAT(value);

        res.json({
            validation,
            message: validation.is_valid ? 'Validation réussie' : 'Validation échouée'
        });
    } catch (error) {
        console.error('Erreur lors de la validation TVA réduite:', error);
        res.status(500).json({ error: 'Erreur lors de la validation' });
    }
});

// Route pour valider toutes les conditions BTP
router.post('/validate-conditions', authenticateToken, async (req, res) => {
    try {
        const { error, value } = btpValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const validation = await btpValidationService.validateBTPConditions(value);

        res.json({
            validation,
            message: validation.isValid ? 'Toutes les validations sont réussies' : 'Certaines validations ont échoué'
        });
    } catch (error) {
        console.error('Erreur lors de la validation BTP:', error);
        res.status(500).json({ error: 'Erreur lors de la validation' });
    }
});

// Route pour calculer le taux de TVA applicable
router.post('/calculate-vat-rate', authenticateToken, async (req, res) => {
    try {
        const { error, value } = btpValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const vatCalculation = await btpValidationService.calculateApplicableVATRate(value);

        res.json({
            vatCalculation,
            message: 'Calcul du taux de TVA effectué'
        });
    } catch (error) {
        console.error('Erreur lors du calcul TVA:', error);
        res.status(500).json({ error: 'Erreur lors du calcul' });
    }
});

// Route pour récupérer les statistiques de validation BTP
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const stats = await btpValidationService.getBTPValidationStats(
            req.user.userId,
            startDate ? new Date(startDate) : null,
            endDate ? new Date(endDate) : null
        );

        res.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

// Route pour obtenir les informations sur les conditions BTP
router.get('/info', authenticateToken, async (req, res) => {
    try {
        const btpInfo = {
            reverseChargeBTP: {
                description: 'Autoliquidation TVA BTP (art. 283-2 CGI)',
                conditions: [
                    'Le client doit être assujetti à la TVA',
                    'Le client doit avoir un numéro de TVA valide',
                    'Travaux de construction, rénovation ou réparation',
                    'TVA à 0% sur la facture, mention obligatoire'
                ],
                requiredFields: ['clientVatNumber', 'clientIsVatRegistered'],
                legalBasis: 'Article 283-2 du Code Général des Impôts'
            },
            reducedVAT: {
                description: 'TVA réduite pour travaux de rénovation',
                rates: {
                    '10%': {
                        description: 'Travaux de rénovation dans des locaux à usage d\'habitation',
                        conditions: [
                            'Logement d\'habitation (pas commercial)',
                            'Achevés depuis plus de 2 ans',
                            'Travaux de rénovation, d\'amélioration ou d\'entretien'
                        ]
                    },
                    '5.5%': {
                        description: 'Travaux d\'amélioration de la qualité énergétique',
                        conditions: [
                            'Logement d\'habitation',
                            'Travaux d\'amélioration énergétique',
                            'Équipements et matériaux éligibles'
                        ]
                    }
                },
                requiredFields: ['propertyType', 'propertyAgeYears', 'workType'],
                legalBasis: 'Article 279 du Code Général des Impôts'
            },
            validation: {
                automatic: 'Validation automatique via triggers de base de données',
                manual: 'Validation manuelle via API pour vérification préalable',
                warnings: 'Génération d\'avertissements pour conditions limites'
            }
        };

        res.json(btpInfo);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations BTP:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des informations' });
    }
});

module.exports = router;
