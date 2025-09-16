const { query } = require('../config/database')
const PDFService = require('./pdfService')

class VATAttestationService {
  /**
   * Génère une attestation TVA réduite
   * @param {Object} attestationData - Données de l'attestation
   * @returns {Object} - Attestation générée
   */
  async generateVATAttestation(attestationData) {
    try {
      const {
        userId,
        invoiceId,
        clientId,
        vatRate,
        justification,
        propertyType,
        workType,
        workDescription,
        propertyAddress,
        clientSignature,
        clientName,
        clientDate,
      } = attestationData

      // Générer le PDF de l'attestation
      const pdfBuffer = await this.generateAttestationPDF({
        vatRate,
        justification,
        propertyType,
        workType,
        workDescription,
        propertyAddress,
        clientSignature,
        clientName,
        clientDate,
      })

      // Sauvegarder l'attestation en base
      const result = await query(
        `INSERT INTO vat_attestations 
                 (user_id, invoice_id, client_id, vat_rate, justification, 
                  property_type, work_type, work_description, property_address,
                  client_signature, client_name, client_date, pdf_data)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 RETURNING *`,
        [
          userId,
          invoiceId,
          clientId,
          vatRate,
          justification,
          propertyType,
          workType,
          workDescription,
          propertyAddress,
          clientSignature,
          clientName,
          clientDate,
          pdfBuffer,
        ]
      )

      return {
        success: true,
        attestation: result.rows[0],
        pdfBuffer,
      }
    } catch (error) {
      console.error("Erreur lors de la génération de l'attestation TVA:", error)
      throw new Error("Échec de la génération de l'attestation TVA")
    }
  }

  /**
   * Génère le PDF de l'attestation TVA réduite
   * @param {Object} data - Données de l'attestation
   * @returns {Buffer} - PDF généré
   */
  async generateAttestationPDF(data) {
    const html = this.generateAttestationHTML(data)

    // Utiliser le service PDF existant
    const pdfService = new PDFService()
    return await pdfService.withPage(async (page) => {
      await page.setContent(html, { waitUntil: 'load' })
      return await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      })
    })
  }

  /**
   * Génère le HTML de l'attestation
   * @param {Object} data - Données de l'attestation
   * @returns {string} - HTML généré
   */
  generateAttestationHTML(data) {
    const {
      vatRate,
      justification,
      propertyType,
      workType,
      workDescription,
      propertyAddress,
      // clientSignature, // Variable non utilisée
      clientName,
      clientDate,
    } = data

    const propertyTypeText =
      {
        residential: "à usage d'habitation",
        commercial: 'à usage commercial',
        mixed: 'à usage mixte',
      }[propertyType] || "à usage d'habitation"

    const workTypeText =
      {
        renovation: 'de rénovation',
        energy_improvement: "d'amélioration de la qualité énergétique",
        maintenance: 'de maintenance',
      }[workType] || 'de rénovation'

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attestation TVA Réduite</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #004AAD;
            padding-bottom: 20px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            color: #004AAD;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 14px;
            color: #666;
        }
        .content {
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            color: #004AAD;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .field {
            margin-bottom: 8px;
        }
        .field-label {
            font-weight: bold;
            display: inline-block;
            width: 200px;
        }
        .field-value {
            display: inline-block;
        }
        .justification {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #004AAD;
            margin: 15px 0;
        }
        .signature-section {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            width: 300px;
            margin: 20px 0 5px 0;
        }
        .footer {
            margin-top: 40px;
            font-size: 10px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">ATTESTATION TVA RÉDUITE</div>
        <div class="subtitle">Taux de TVA ${vatRate}% - Travaux ${workTypeText}</div>
    </div>

    <div class="content">
        <div class="section">
            <div class="section-title">INFORMATIONS GÉNÉRALES</div>
            <div class="field">
                <span class="field-label">Taux de TVA appliqué :</span>
                <span class="field-value">${vatRate}%</span>
            </div>
            <div class="field">
                <span class="field-label">Type de propriété :</span>
                <span class="field-value">${propertyTypeText}</span>
            </div>
            <div class="field">
                <span class="field-label">Type de travaux :</span>
                <span class="field-value">${workTypeText}</span>
            </div>
            <div class="field">
                <span class="field-label">Adresse du bien :</span>
                <span class="field-value">${propertyAddress || 'Non spécifiée'}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">DESCRIPTION DES TRAVAUX</div>
            <div class="field-value">${workDescription || 'Travaux de peinture et rénovation'}</div>
        </div>

        <div class="section">
            <div class="section-title">JUSTIFICATION LÉGALE</div>
            <div class="justification">
                ${justification || this.getDefaultJustification(vatRate, propertyType, workType)}
            </div>
        </div>

        <div class="section">
            <div class="section-title">CONDITIONS D'APPLICATION</div>
            <ul>
                <li>Les travaux doivent être réalisés dans des locaux ${propertyTypeText}</li>
                <li>Les locaux doivent être achevés depuis plus de deux ans (pour la TVA 10%)</li>
                <li>Les travaux doivent respecter les conditions d'éligibilité aux aides publiques (pour la TVA 5,5%)</li>
                <li>Cette attestation doit être conservée pendant 10 ans</li>
            </ul>
        </div>
    </div>

    <div class="signature-section">
        <div class="section-title">SIGNATURE DU CLIENT</div>
        <p>Je soussigné(e) <strong>${clientName || '[Nom du client]'}</strong>, certifie sur l'honneur que les informations ci-dessus sont exactes et que les travaux concernent bien des locaux ${propertyTypeText} achevés depuis plus de deux ans.</p>
        
        <div style="margin-top: 30px;">
            <div class="signature-line"></div>
            <div style="text-align: center; margin-top: 5px;">
                Signature du client
            </div>
        </div>
        
        <div style="margin-top: 20px;">
            <div class="field">
                <span class="field-label">Date :</span>
                <span class="field-value">${clientDate || new Date().toLocaleDateString('fr-FR')}</span>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Important :</strong> Cette attestation est obligatoire pour l'application du taux de TVA réduit. Elle doit être conservée par l'entreprise et le client pendant 10 ans.</p>
        <p>En cas de contrôle fiscal, cette attestation devra être présentée aux services des impôts.</p>
    </div>
</body>
</html>`
  }

  /**
   * Génère la justification par défaut selon le taux et les conditions
   * @param {number} vatRate - Taux de TVA
   * @param {string} propertyType - Type de propriété
   * @param {string} workType - Type de travaux
   * @returns {string} - Justification par défaut
   */
  getDefaultJustification(vatRate, propertyType, workType) {
    if (vatRate === 10) {
      return `Conformément à l'article 279-0 bis du Code général des impôts, le taux de TVA de 10% s'applique aux travaux de rénovation dans des locaux à usage d'habitation achevés depuis plus de deux ans. Les travaux concernent des locaux ${propertyType === 'residential' ? "à usage d'habitation" : 'à usage mixte'} et portent sur des travaux de ${workType === 'renovation' ? 'rénovation' : 'maintenance'}.`
    } else if (vatRate === 5.5) {
      return `Conformément à l'article 279-0 bis du Code général des impôts, le taux de TVA de 5,5% s'applique aux travaux d'amélioration de la qualité énergétique des locaux à usage d'habitation. Les travaux concernent des locaux ${propertyType === 'residential' ? "à usage d'habitation" : 'à usage mixte'} et portent sur des travaux d'${workType === 'energy_improvement' ? 'amélioration de la qualité énergétique' : 'efficacité énergétique'}.`
    }
    return 'Taux de TVA réduit applicable conformément à la réglementation en vigueur.'
  }

  /**
   * Récupère les attestations d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} invoiceId - ID de la facture (optionnel)
   * @returns {Array} - Liste des attestations
   */
  async getAttestations(userId, invoiceId = null) {
    try {
      let whereClause = 'WHERE va.user_id = $1'
      let params = [userId]

      if (invoiceId) {
        whereClause += ' AND va.invoice_id = $2'
        params.push(invoiceId)
      }

      const result = await query(
        `SELECT 
                    va.*,
                    i.invoice_number,
                    c.first_name as client_first_name,
                    c.last_name as client_last_name,
                    c.company_name as client_company
                 FROM vat_attestations va
                 LEFT JOIN invoices i ON va.invoice_id = i.id
                 LEFT JOIN clients c ON va.client_id = c.id
                 ${whereClause}
                 ORDER BY va.created_at DESC`,
        params
      )

      return result.rows
    } catch (error) {
      console.error('Erreur lors de la récupération des attestations:', error)
      throw new Error('Échec de la récupération des attestations')
    }
  }

  /**
   * Récupère une attestation par ID
   * @param {string} attestationId - ID de l'attestation
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} - Attestation
   */
  async getAttestationById(attestationId, userId) {
    try {
      const result = await query(
        `SELECT 
                    va.*,
                    i.invoice_number,
                    c.first_name as client_first_name,
                    c.last_name as client_last_name,
                    c.company_name as client_company
                 FROM vat_attestations va
                 LEFT JOIN invoices i ON va.invoice_id = i.id
                 LEFT JOIN clients c ON va.client_id = c.id
                 WHERE va.id = $1 AND va.user_id = $2`,
        [attestationId, userId]
      )

      if (result.rows.length === 0) {
        throw new Error('Attestation non trouvée')
      }

      return result.rows[0]
    } catch (error) {
      console.error("Erreur lors de la récupération de l'attestation:", error)
      throw error
    }
  }
}

module.exports = new VATAttestationService()
