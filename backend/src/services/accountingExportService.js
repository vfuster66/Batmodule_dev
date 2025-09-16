const { query } = require('../config/database')
const fs = require('fs')
const path = require('path')
const csv = require('csv-writer')

class AccountingExportService {
  /**
   * Génère un export comptable FEC (Fichier des Écritures Comptables)
   * @param {string} userId - ID de l'utilisateur
   * @param {Date} startDate - Date de début
   * @param {Date} endDate - Date de fin
   * @returns {Object} - Export FEC généré
   */
  async generateFECExport(userId, startDate, endDate) {
    try {
      // Récupérer les paramètres de l'entreprise
      const companyResult = await query(
        'SELECT * FROM company_settings WHERE user_id = $1',
        [userId]
      )

      if (companyResult.rows.length === 0) {
        throw new Error("Paramètres de l'entreprise non trouvés")
      }

      const company = companyResult.rows[0]

      // Récupérer les écritures comptables
      const entries = await this.getAccountingEntries(
        userId,
        startDate,
        endDate
      )

      // Générer le fichier FEC
      const fecContent = this.generateFECContent(
        company,
        entries,
        startDate,
        endDate
      )

      // Sauvegarder le fichier
      const filename = `FEC_${company.siret || 'UNKNOWN'}_${this.formatDateForFilename(startDate)}_${this.formatDateForFilename(endDate)}.txt`
      const filepath = path.join(
        process.env.EXPORT_DIR || './exports',
        filename
      )

      // Créer le dossier s'il n'existe pas
      const exportDir = path.dirname(filepath)
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true })
      }

      fs.writeFileSync(filepath, fecContent, 'utf8')

      return {
        success: true,
        filename,
        filepath,
        entryCount: entries.length,
        period: { startDate, endDate },
      }
    } catch (error) {
      console.error("Erreur lors de la génération de l'export FEC:", error)
      throw new Error("Échec de la génération de l'export FEC")
    }
  }

  /**
   * Récupère les écritures comptables
   * @param {string} userId - ID de l'utilisateur
   * @param {Date} startDate - Date de début
   * @param {Date} endDate - Date de fin
   * @returns {Array} - Écritures comptables
   */
  async getAccountingEntries(userId, startDate, endDate) {
    const entries = []

    // Récupérer les factures
    const invoicesResult = await query(
      `SELECT 
                'VENTE' as journal_code,
                'VTE' as journal_lib,
                invoice_number as piece_num,
                invoice_date as piece_date,
                'Facture ' || invoice_number as piece_lib,
                '411' as compte_num,
                COALESCE(c.company_name, c.first_name || ' ' || c.last_name) as compte_lib,
                'D' as sens,
                total_amount as debit,
                0 as credit,
                'Facture ' || invoice_number as ecriture_lib,
                'EUR' as currency_code,
                NULL as currency_rate,
                created_at as ecriture_date,
                'F' as valid_date,
                'F' as ecriture_let,
                'F' as date_let,
                'F' as ecriture_annee,
                'F' as ecriture_mois
             FROM invoices i
             LEFT JOIN clients c ON i.client_id = c.id
             WHERE i.user_id = $1 
             AND i.invoice_date BETWEEN $2 AND $3
             AND i.status != 'cancelled'
             ORDER BY i.invoice_date, i.invoice_number`,
      [userId, startDate, endDate]
    )

    // Ajouter les écritures de vente
    for (const invoice of invoicesResult.rows) {
      entries.push(invoice)

      // Écriture de TVA collectée
      if (invoice.debit > 0) {
        const vatAmount = invoice.debit * 0.2 // TVA 20% par défaut
        entries.push({
          ...invoice,
          compte_num: '44571',
          compte_lib: 'TVA collectée',
          sens: 'C',
          debit: 0,
          credit: vatAmount,
          ecriture_lib: 'TVA collectée - ' + invoice.ecriture_lib,
        })

        // Écriture de produit
        entries.push({
          ...invoice,
          compte_num: '701',
          compte_lib: 'Ventes de produits finis',
          sens: 'C',
          debit: 0,
          credit: invoice.debit - vatAmount,
          ecriture_lib: 'Produit - ' + invoice.ecriture_lib,
        })
      }
    }

    // Récupérer les paiements
    const paymentsResult = await query(
      `SELECT 
                'BANQUE' as journal_code,
                'BQ' as journal_lib,
                p.reference as piece_num,
                p.payment_date as piece_date,
                'Paiement ' || p.reference as piece_lib,
                CASE 
                    WHEN p.payment_method = 'bank_transfer' THEN '512'
                    WHEN p.payment_method = 'check' THEN '511'
                    WHEN p.payment_method = 'cash' THEN '531'
                    ELSE '512'
                END as compte_num,
                CASE 
                    WHEN p.payment_method = 'bank_transfer' THEN 'Banque'
                    WHEN p.payment_method = 'check' THEN 'Chèques à encaisser'
                    WHEN p.payment_method = 'cash' THEN 'Caisse'
                    ELSE 'Banque'
                END as compte_lib,
                'D' as sens,
                p.amount as debit,
                0 as credit,
                'Paiement ' || p.reference as ecriture_lib,
                'EUR' as currency_code,
                NULL as currency_rate,
                p.created_at as ecriture_date,
                'F' as valid_date,
                'F' as ecriture_let,
                'F' as date_let,
                'F' as ecriture_annee,
                'F' as ecriture_mois
             FROM payments p
             LEFT JOIN invoices i ON p.invoice_id = i.id
             WHERE i.user_id = $1 
             AND p.payment_date BETWEEN $2 AND $3
             ORDER BY p.payment_date, p.reference`,
      [userId, startDate, endDate]
    )

    // Ajouter les écritures de paiement
    for (const payment of paymentsResult.rows) {
      entries.push(payment)

      // Écriture de règlement client
      entries.push({
        ...payment,
        compte_num: '411',
        compte_lib: 'Clients',
        sens: 'C',
        debit: 0,
        credit: payment.debit,
        ecriture_lib: 'Règlement - ' + payment.ecriture_lib,
      })
    }

    return entries
  }

  /**
   * Génère le contenu FEC
   * @param {Object} company - Paramètres de l'entreprise
   * @param {Array} entries - Écritures comptables
   * @param {Date} startDate - Date de début
   * @param {Date} endDate - Date de fin
   * @returns {string} - Contenu FEC
   */
  generateFECContent(company, entries, startDate, endDate) {
    const lines = []

    // En-tête FEC
    lines.push('#FEC')
    lines.push(`#SIRET:${company.siret || ''}`)
    lines.push(`#SIREN:${company.siret ? company.siret.substring(0, 9) : ''}`)
    lines.push(
      `#PERIODE:${this.formatDateForFEC(startDate)}:${this.formatDateForFEC(endDate)}`
    )
    lines.push(`#DATE_EXPORT:${this.formatDateForFEC(new Date())}`)
    lines.push(`#SOFTWARE:BatModule v1.0`)
    lines.push(`#VERSION:1.0`)

    // Ligne d'en-tête des colonnes
    lines.push(
      'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise'
    )

    // Écritures comptables
    for (const entry of entries) {
      const line = [
        entry.journal_code || '',
        entry.journal_lib || '',
        entry.piece_num || '',
        this.formatDateForFEC(entry.piece_date),
        entry.compte_num || '',
        entry.compte_lib || '',
        '', // CompAuxNum
        '', // CompAuxLib
        entry.piece_num || '',
        this.formatDateForFEC(entry.piece_date),
        entry.ecriture_lib || '',
        this.formatAmount(entry.debit),
        this.formatAmount(entry.credit),
        entry.ecriture_let || '',
        this.formatDateForFEC(entry.date_let),
        this.formatDateForFEC(entry.valid_date),
        this.formatAmount(entry.debit || entry.credit),
        entry.currency_code || 'EUR',
      ].join('|')

      lines.push(line)
    }

    return lines.join('\n')
  }

  /**
   * Génère un export CSV des ventes
   * @param {string} userId - ID de l'utilisateur
   * @param {Date} startDate - Date de début
   * @param {Date} endDate - Date de fin
   * @returns {Object} - Export CSV généré
   */
  async generateSalesCSV(userId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT 
                    i.invoice_number,
                    i.invoice_date,
                    c.company_name as client_name,
                    c.first_name as client_first_name,
                    c.last_name as client_last_name,
                    i.subtotal,
                    i.vat_amount,
                    i.total_amount,
                    i.status,
                    i.payment_status,
                    i.created_at
                 FROM invoices i
                 LEFT JOIN clients c ON i.client_id = c.id
                 WHERE i.user_id = $1 
                 AND i.invoice_date BETWEEN $2 AND $3
                 ORDER BY i.invoice_date DESC`,
        [userId, startDate, endDate]
      )

      const filename = `ventes_${this.formatDateForFilename(startDate)}_${this.formatDateForFilename(endDate)}.csv`
      const filepath = path.join(
        process.env.EXPORT_DIR || './exports',
        filename
      )

      const csvWriter = csv.createObjectCsvWriter({
        path: filepath,
        header: [
          { id: 'invoice_number', title: 'N° Facture' },
          { id: 'invoice_date', title: 'Date Facture' },
          { id: 'client_name', title: 'Client' },
          { id: 'subtotal', title: 'HT' },
          { id: 'vat_amount', title: 'TVA' },
          { id: 'total_amount', title: 'TTC' },
          { id: 'status', title: 'Statut' },
          { id: 'payment_status', title: 'Paiement' },
        ],
      })

      await csvWriter.writeRecords(result.rows)

      return {
        success: true,
        filename,
        filepath,
        recordCount: result.rows.length,
        period: { startDate, endDate },
      }
    } catch (error) {
      console.error("Erreur lors de la génération de l'export CSV:", error)
      throw new Error("Échec de la génération de l'export CSV")
    }
  }

  /**
   * Formate une date pour le FEC (YYYYMMDD)
   * @param {Date} date - Date à formater
   * @returns {string} - Date formatée
   */
  formatDateForFEC(date) {
    if (!date) return ''
    const d = new Date(date)
    return (
      d.getFullYear().toString() +
      (d.getMonth() + 1).toString().padStart(2, '0') +
      d.getDate().toString().padStart(2, '0')
    )
  }

  /**
   * Formate une date pour le nom de fichier
   * @param {Date} date - Date à formater
   * @returns {string} - Date formatée
   */
  formatDateForFilename(date) {
    if (!date) return ''
    const d = new Date(date)
    return (
      d.getFullYear().toString() +
      (d.getMonth() + 1).toString().padStart(2, '0') +
      d.getDate().toString().padStart(2, '0')
    )
  }

  /**
   * Formate un montant pour le FEC
   * @param {number} amount - Montant à formater
   * @returns {string} - Montant formaté
   */
  formatAmount(amount) {
    if (!amount || amount === 0) return '0.00'
    return parseFloat(amount).toFixed(2).replace('.', ',')
  }
}

module.exports = new AccountingExportService()
