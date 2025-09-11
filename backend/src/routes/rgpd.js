const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../middleware/auth');
const rgpdService = require('../services/rgpdService');

const router = express.Router();

// Route pour exporter les données personnelles d'un utilisateur
router.get('/export', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Exporter les données
        const exportData = await rgpdService.exportUserData(userId);

        // Sauvegarder dans un fichier
        const filePath = await rgpdService.saveExportToFile(userId, exportData);

        res.json({
            message: 'Export des données personnelles généré avec succès',
            downloadUrl: `/api/rgpd/download/${path.basename(filePath)}`,
            exportDate: exportData.exportMetadata.exportDate,
            dataTypes: exportData.exportMetadata.dataTypes
        });
    } catch (error) {
        console.error('Erreur lors de l\'export des données:', error);
        res.status(500).json({ error: 'Erreur lors de l\'export des données personnelles' });
    }
});

// Route pour télécharger un export
router.get('/download/:filename', authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const userId = req.user.userId;

        // Vérifier que le fichier appartient à l'utilisateur
        if (!filename.startsWith(`export_user_${userId}_`)) {
            return res.status(403).json({ error: 'Accès non autorisé à ce fichier' });
        }

        const filePath = path.join(rgpdService.exportDir, filename);

        // Vérifier que le fichier existe
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Fichier d\'export non trouvé' });
        }

        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Erreur lors du téléchargement:', err);
                res.status(500).json({ error: 'Erreur lors du téléchargement' });
            }
        });
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        res.status(500).json({ error: 'Erreur lors du téléchargement' });
    }
});

// Route pour supprimer les données personnelles d'un utilisateur
router.delete('/delete-data', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { keepAccountingData = true } = req.body;

        // Confirmation requise pour la suppression
        const { confirm } = req.body;
        if (!confirm) {
            return res.status(400).json({
                error: 'Confirmation requise',
                message: 'Vous devez confirmer la suppression de vos données personnelles'
            });
        }

        const result = await rgpdService.deleteUserData(userId, keepAccountingData);

        res.json({
            message: 'Données personnelles supprimées avec succès',
            result
        });
    } catch (error) {
        console.error('Erreur lors de la suppression des données:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression des données personnelles' });
    }
});

// Route pour purger les données selon la politique de rétention
router.post('/purge', authenticateToken, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est admin (à implémenter selon votre logique)
        const { retentionPolicy } = req.body;

        const result = await rgpdService.purgeDataByRetentionPolicy(retentionPolicy);

        res.json({
            message: 'Purge des données effectuée avec succès',
            result
        });
    } catch (error) {
        console.error('Erreur lors de la purge des données:', error);
        res.status(500).json({ error: 'Erreur lors de la purge des données' });
    }
});

// Route pour générer un rapport de conformité RGPD
router.get('/compliance-report', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const report = await rgpdService.generateRGPDComplianceReport(userId);

        res.json(report);
    } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du rapport de conformité' });
    }
});

// Route pour obtenir les informations sur les traitements de données
router.get('/data-processing-info', authenticateToken, async (req, res) => {
    try {
        const dataProcessingInfo = {
            purposes: [
                'Gestion des clients et prospects',
                'Émission de devis et factures',
                'Suivi des paiements',
                'Archivage légal des documents comptables',
                'Communication commerciale'
            ],
            legalBasis: [
                'Exécution du contrat (art. 6.1.b RGPD)',
                'Intérêt légitime (art. 6.1.f RGPD)',
                'Obligation légale (art. 6.1.c RGPD)'
            ],
            dataTypes: [
                'Données d\'identification (nom, prénom, email)',
                'Données de contact (téléphone, adresse)',
                'Données commerciales (devis, factures, paiements)',
                'Données de connexion (logs, IP)'
            ],
            retentionPeriods: {
                'Données de prospection': '3 ans',
                'Données comptables': '10 ans',
                'Logs de connexion': '1 an',
                'Données de facturation': '10 ans'
            },
            recipients: [
                'Prestataires de services (hébergement, email)',
                'Autorités compétentes (en cas d\'obligation légale)'
            ],
            rights: [
                'Droit d\'accès aux données',
                'Droit de rectification',
                'Droit d\'effacement',
                'Droit à la portabilité',
                'Droit d\'opposition',
                'Droit de limitation du traitement'
            ],
            contact: {
                email: 'dpo@votre-entreprise.com',
                phone: '+33 1 23 45 67 89',
                address: 'Adresse de votre entreprise'
            }
        };

        res.json(dataProcessingInfo);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des informations' });
    }
});

module.exports = router;
