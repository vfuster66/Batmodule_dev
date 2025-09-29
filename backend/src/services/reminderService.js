const { Pool } = require('pg')
const nodemailer = require('nodemailer')
const PDFService = require('./pdfServiceSimple')
const { query } = require('../config/database')

class ReminderService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  // Créer un transporteur email
  createMailTransport() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Récupérer les factures en retard
  async getOverdueInvoices() {
    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT 
          i.*,
          c.first_name, c.last_name, c.company_name, c.email,
          u.company_name as user_company_name, u.email as user_email
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        JOIN users u ON i.user_id = u.id
        WHERE i.status = 'pending' 
        AND i.due_date < CURRENT_DATE
        AND i.invoice_type IN ('acompte', 'solde')
        ORDER BY i.due_date ASC
      `)
      return result.rows
    } finally {
      client.release()
    }
  }

  // Déterminer le type de rappel
  getReminderType(invoice, dueDate) {
    const daysOverdue = Math.floor(
      (new Date() - dueDate) / (1000 * 60 * 60 * 24)
    )

    if (daysOverdue <= 7) return 'rappel1'
    if (daysOverdue <= 30) return 'rappel2'
    return 'rappel3'
  }

  // Créer une facture de rappel
  async createReminderInvoice(originalInvoice) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Déterminer le type de rappel
      const dueDate = new Date(originalInvoice.due_date)
      const reminderType = this.getReminderType(originalInvoice, dueDate)

      // Créer la facture de rappel
      const reminderResult = await client.query(
        `
        INSERT INTO invoices (
          user_id, client_id, quote_id, invoice_number, title, description,
          status, subtotal_ht, total_vat, total_ttc, paid_amount, due_date,
          notes, invoice_type, parent_invoice_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, 0, $10, $11, $12, $13)
        RETURNING *
      `,
        [
          originalInvoice.user_id,
          originalInvoice.client_id,
          originalInvoice.quote_id,
          originalInvoice.invoice_number, // Même numéro
          `${originalInvoice.title} - ${reminderType === 'rappel1' ? '1er Rappel' : reminderType === 'rappel2' ? '2ème Rappel' : 'Dernier Rappel'}`,
          originalInvoice.description,
          originalInvoice.subtotal_ht,
          originalInvoice.total_vat,
          originalInvoice.total_ttc,
          new Date(), // Nouvelle échéance
          `Facture de rappel - ${reminderType}`,
          reminderType, // invoice_type
          originalInvoice.id, // parent_invoice_id
        ]
      )

      // Créer les lignes de facture (même contenu que l'original)
      const originalItems = await client.query(
        `
        SELECT * FROM invoice_items WHERE invoice_id = $1
      `,
        [originalInvoice.id]
      )

      for (const item of originalItems.rows) {
        await client.query(
          `
          INSERT INTO invoice_items (
            invoice_id, description, quantity, unit_price_ht, unit_price_ttc, vat_rate, total_ht, total_ttc
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [
            reminderResult.rows[0].id,
            item.description,
            item.quantity,
            item.unit_price_ht,
            item.unit_price_ttc,
            item.vat_rate,
            item.total_ht,
            item.total_ttc,
          ]
        )
      }

      await client.query('COMMIT')
      return reminderResult.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  // Récupérer la facture complète avec client et items
  async getFullInvoiceData(invoiceId) {
    const client = await this.pool.connect()
    try {
      // Récupérer la facture avec les données du client
      const invoiceResult = await client.query(
        `
        SELECT 
          i.*,
          c.first_name, c.last_name, c.company_name, c.email as client_email,
          c.address, c.address_line1, c.address_line2, c.city, c.postal_code, c.country, c.phone,
          c.is_company, c.siret, c.vat_number
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.id = $1
        `,
        [invoiceId]
      )

      if (invoiceResult.rows.length === 0) {
        throw new Error('Facture non trouvée')
      }

      const invoice = invoiceResult.rows[0]

      // Récupérer les items de la facture
      const itemsResult = await client.query(
        `
        SELECT 
          ii.*,
          s.name as service_name,
          s.description as service_description
        FROM invoice_items ii
        LEFT JOIN services s ON ii.service_id = s.id
        WHERE ii.invoice_id = $1
        ORDER BY ii.sort_order, ii.created_at
        `,
        [invoiceId]
      )

      // Récupérer les sections si elles existent
      const sectionsResult = await client.query(
        `
        SELECT DISTINCT 
          s.id, s.title, s.description, s.sort_order
        FROM invoice_items ii
        LEFT JOIN services s ON ii.service_id = s.id
        WHERE ii.invoice_id = $1 AND s.id IS NOT NULL
        ORDER BY s.sort_order, s.created_at
        `,
        [invoiceId]
      )

      // Utiliser la fonction utilitaire pour le mapping
      const { mapInvoiceToCamelCase } = require('../utils/invoiceMapper')
      return mapInvoiceToCamelCase(
        invoice,
        itemsResult.rows,
        sectionsResult.rows
      )
    } finally {
      client.release()
    }
  }

  // Envoyer un rappel par email
  async sendReminderEmail(reminderInvoice, companySettings) {
    try {
      // Récupérer l'email du client
      const clientResult = await query(
        'SELECT email FROM clients WHERE id = $1',
        [reminderInvoice.client_id]
      )

      if (!clientResult.rows[0]?.email) {
        throw new Error('Email du client non trouvé')
      }

      const clientEmail = clientResult.rows[0].email

      // Recharger la facture complète avec client et items pour le PDF
      const fullInvoice = await this.getFullInvoiceData(reminderInvoice.id)

      // Générer le PDF
      const pdfService = new PDFService()
      const pdfBuffer = await pdfService.generateInvoicePDF(
        fullInvoice,
        companySettings
      )

      // Créer le transporteur email
      const transporter = this.createMailTransport()

      // Contenu de l'email selon le type de rappel
      const reminderType = reminderInvoice.invoice_type
      let subject, htmlContent

      switch (reminderType) {
        case 'rappel1':
          subject = `Rappel de paiement - ${reminderInvoice.invoice_number}`
          htmlContent = `
            <p>Bonjour,</p>
            <p>Nous vous rappelons que la facture <strong>${reminderInvoice.invoice_number}</strong> 
            était due le ${new Date(reminderInvoice.due_date).toLocaleDateString('fr-FR')}.</p>
            <p>Nous vous remercions de bien vouloir procéder au règlement dans les plus brefs délais.</p>
            <p>Cordialement,<br>${companySettings.company_name}</p>
          `
          break
        case 'rappel2':
          subject = `2ème Rappel de paiement - ${reminderInvoice.invoice_number}`
          htmlContent = `
            <p>Bonjour,</p>
            <p>Nous vous rappelons une nouvelle fois que la facture <strong>${reminderInvoice.invoice_number}</strong> 
            était due le ${new Date(reminderInvoice.due_date).toLocaleDateString('fr-FR')}.</p>
            <p>En cas de non-paiement, des frais de recouvrement pourraient être appliqués.</p>
            <p>Cordialement,<br>${companySettings.company_name}</p>
          `
          break
        case 'rappel3':
          subject = `Dernier Rappel - ${reminderInvoice.invoice_number} - Mise en recouvrement`
          htmlContent = `
            <p>Bonjour,</p>
            <p>Malgré nos précédents rappels, la facture <strong>${reminderInvoice.invoice_number}</strong> 
            n'a toujours pas été réglée.</p>
            <p>Cette facture est maintenant transmise à notre service de recouvrement.</p>
            <p>Des frais de recouvrement de 40€ seront appliqués conformément à la législation française.</p>
            <p>Cordialement,<br>${companySettings.company_name}</p>
          `
          break
      }

      // Envoyer l'email
      await transporter.sendMail({
        from: `"${companySettings.company_name}" <${companySettings.email}>`,
        to: clientEmail,
        subject,
        html: htmlContent,
        attachments: [
          {
            filename: `facture-${reminderInvoice.invoice_number}-${reminderType}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      })

      return true
    } catch (error) {
      console.error("Erreur lors de l'envoi du rappel:", error)
      throw error
    }
  }

  // Traiter tous les rappels
  async processReminders() {
    try {
      const overdueInvoices = await this.getOverdueInvoices()
      console.log(
        `📧 Traitement de ${overdueInvoices.length} factures en retard`
      )

      for (const invoice of overdueInvoices) {
        try {
          // Vérifier si un rappel n'a pas déjà été envoyé récemment
          const existingReminder = await this.checkExistingReminder(invoice.id)
          if (existingReminder) {
            console.log(
              `⚠️ Rappel déjà envoyé pour la facture ${invoice.invoice_number}`
            )
            continue
          }

          // Créer la facture de rappel
          const reminderInvoice = await this.createReminderInvoice(invoice)

          // Récupérer les paramètres de l'entreprise
          const companySettings = await this.getCompanySettings(invoice.user_id)

          // Envoyer l'email
          await this.sendReminderEmail(reminderInvoice, companySettings)
        } catch (error) {
          console.error(
            `❌ Erreur pour la facture ${invoice.invoice_number}:`,
            error.message
          )
        }
      }
    } catch (error) {
      console.error('Erreur lors du traitement des rappels:', error)
      throw error
    }
  }

  // Vérifier si un rappel existe déjà
  async checkExistingReminder(invoiceId) {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        `
        SELECT * FROM invoices 
        WHERE parent_invoice_id = $1 
        AND invoice_type IN ('rappel1', 'rappel2', 'rappel3')
        AND created_at > CURRENT_DATE - INTERVAL '7 days'
      `,
        [invoiceId]
      )
      return result.rows.length > 0
    } finally {
      client.release()
    }
  }

  // Récupérer les paramètres de l'entreprise
  async getCompanySettings(userId) {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        `
        SELECT * FROM company_settings WHERE user_id = $1
      `,
        [userId]
      )
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  /**
   * Mappe les données d'une facture du format snake_case vers camelCase
   * @param {Object} invoice - Données de la facture en snake_case
   * @param {Array} items - Items de la facture
   * @param {Array} sections - Sections de la facture
   * @returns {Object} - Données mappées en camelCase
   */
  static mapInvoiceToCamelCase(invoice, items = [], sections = []) {
    return {
      ...invoice,
      // Mapper les champs principaux de la facture
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      subtotalHt: parseFloat(invoice.subtotal_ht) || 0,
      totalVat: parseFloat(invoice.total_vat) || 0,
      totalTtc: parseFloat(invoice.total_ttc) || 0,
      items: items.map((item) => ({
        id: item.id,
        serviceId: item.service_id,
        serviceName: item.service_name,
        serviceDescription: item.service_description,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unitPriceHt: parseFloat(item.unit_price_ht) || 0,
        unitPriceTtc: parseFloat(item.unit_price_ttc) || 0,
        vatRate: parseFloat(item.vat_rate) || 0,
        unit: item.unit,
        discountPercent: item.discount_percent
          ? parseFloat(item.discount_percent)
          : 0,
        markupPercent: item.markup_percent
          ? parseFloat(item.markup_percent)
          : 0,
        totalHt: parseFloat(item.total_ht) || 0,
        totalTtc: parseFloat(item.total_ttc) || 0,
        sortOrder: item.sort_order,
      })),
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        sortOrder: section.sort_order,
      })),
      client: {
        id: invoice.client_id,
        firstName: invoice.first_name,
        lastName: invoice.last_name,
        companyName: invoice.company_name,
        email: invoice.client_email,
        address: invoice.address,
        addressLine1: invoice.address_line1,
        addressLine2: invoice.address_line2,
        city: invoice.city,
        postalCode: invoice.postal_code,
        country: invoice.country,
        phone: invoice.phone,
        isCompany: invoice.is_company,
        siret: invoice.siret,
        vatNumber: invoice.vat_number,
      },
    }
  }
}

module.exports = new ReminderService()
