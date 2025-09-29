const PDFDocument = require('pdfkit')
const sharp = require('sharp')

class SimplePDFService {
  constructor() {
    // Configuration des couleurs et styles (statiques, partagés)
    this.colors = {
      primary: '#2563eb', // Bleu professionnel
      secondary: '#64748b', // Gris moderne
      accent: '#059669', // Vert pour les totaux
      danger: '#dc2626', // Rouge pour les alertes
      light: '#f8fafc', // Gris très clair
      dark: '#1e293b', // Gris très foncé
    }

    this.fonts = {
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique',
    }

    // Configuration de la page (statique, partagée)
    this.pageConfig = {
      margin: 40,
      headerHeight: 130,
      footerHeight: 105, // Encore augmenté pour plus de sécurité
      contentAreaHeight: null, // Calculé dynamiquement
    }
  }

  async generateQuotePDF(quote, companySettings) {
    return new Promise((resolve, reject) => {
      ;(async () => {
        try {
          // Format A4 avec marges professionnelles
          const doc = new PDFDocument({
            size: 'A4',
            margin: this.pageConfig.margin,
            bufferPages: true,
            autoFirstPage: true,
          })

          // Calculer la zone de contenu disponible
          this.pageConfig.contentAreaHeight =
            doc.page.height -
            this.pageConfig.margin * 2 -
            this.pageConfig.headerHeight -
            this.pageConfig.footerHeight

          const chunks = []

          // Collecter les données du PDF
          doc.on('data', (chunk) => chunks.push(chunk))
          doc.on('end', () => resolve(Buffer.concat(chunks)))
          doc.on('error', reject)

          // Configuration des couleurs personnalisées
          const primaryColor =
            companySettings?.primary_color || this.colors.primary

          // Stocker les données communes pour toutes les pages (local à cette génération)
          this.commonData = {
            quote,
            companySettings,
            primaryColor,
            doc,
          }

          // Position de départ du contenu (après l'en-tête)
          doc.y = this.getContentStartY()

          // Structure du document
          this.addCompanyAndClientInfo(
            doc,
            quote,
            companySettings,
            false,
            primaryColor,
            this.commonData
          ) // false = devis
          this.addQuoteDetails(doc, quote, this.commonData)
          this.addItemsTable(doc, quote, primaryColor, this.commonData)
          this.addTotalsSection(doc, quote, primaryColor, this.commonData)

          // Ajouter les conditions sur la même page si possible, sinon nouvelle page
          const requiredHeightForConditions = 350
          if (this.needsNewPage(requiredHeightForConditions, this.commonData)) {
            this.addNewPage(this.commonData)
          } else {
            // Ajouter de l'espace avant les conditions si on reste sur la même page
            doc.y += 40
          }

          await this.addConditionsAndSignature(
            doc,
            quote,
            companySettings,
            primaryColor,
            this.commonData
          )

          // Appliquer les en-têtes et pieds de page sur toutes les pages
          await this.applyHeadersAndFooters()

          // Finaliser le document
          doc.end()
        } catch (error) {
          reject(error)
        }
      })()
    })
  }

  addNewPage(commonData) {
    const doc = commonData ? commonData.doc : this.commonData?.doc
    if (!doc) {
      throw new Error('Document not available in addNewPage')
    }
    doc.addPage()
    // Positionner le curseur après l'en-tête
    doc.y = this.getContentStartY()
  }

  hasContentOnCurrentPage(commonData) {
    const doc = commonData ? commonData.doc : this.commonData?.doc
    if (!doc) {
      throw new Error('Document not available in hasContentOnCurrentPage')
    }
    return doc.y > this.getContentStartY() + 50 // Si on a écrit plus de 50px de contenu
  }

  getContentStartY() {
    // Le contenu commence juste après la ligne de séparation du header
    return 150 // Ligne de séparation à y=125 + 5px d'espacement
  }

  getContentEndY(commonData) {
    const doc = commonData ? commonData.doc : this.commonData?.doc
    if (!doc) {
      throw new Error('Document not available in getContentEndY')
    }
    return (
      doc.page.height - this.pageConfig.margin - this.pageConfig.footerHeight
    )
  }

  needsNewPage(requiredHeight, commonData) {
    const doc = commonData ? commonData.doc : this.commonData?.doc
    if (!doc) {
      throw new Error('Document not available in needsNewPage')
    }
    // Marge de sécurité réduite pour optimiser l'utilisation de l'espace
    const safetyMargin = 5
    return (
      doc.y + requiredHeight + safetyMargin > this.getContentEndY(commonData)
    )
  }

  async addHeaderContent(
    doc,
    document,
    companySettings,
    primaryColor,
    _pageNumber
  ) {
    // Sauvegarder la position actuelle
    const currentY = doc.y

    // Aller à la position de l'en-tête
    doc.y = 0

    // Bande de couleur en haut
    doc.rect(0, 0, doc.page.width, 8).fillColor(primaryColor).fill()

    // Zone d'en-tête avec fond léger
    doc
      .rect(
        this.pageConfig.margin,
        20,
        doc.page.width - this.pageConfig.margin * 2,
        100
      )
      .fillColor(this.colors.light)
      .fill()
      .strokeColor('#e2e8f0')
      .stroke()

    // let logoWidth = 0; // Non utilisé
    let companyInfoX = 60
    let companyInfoTop = 35

    // Gestion du logo
    if (companySettings?.logo_base64) {
      try {
        // Nettoyer le base64 et détecter le format
        let logoData = companySettings.logo_base64
        let imageType = 'PNG'

        // Détection du format
        if (logoData.startsWith('data:')) {
          const matches = logoData.match(/^data:image\/([^;]+);base64,(.+)$/)
          if (matches) {
            imageType = matches[1].toUpperCase()
            logoData = matches[2]
            if (imageType.includes('SVG')) {
              imageType = 'SVG'
            }
          }
        } else if (logoData.startsWith('iVBORw0KGgo')) {
          imageType = 'PNG'
        } else if (logoData.startsWith('/9j/')) {
          imageType = 'JPEG'
        } else if (logoData.startsWith('R0lGOD')) {
          imageType = 'GIF'
        } else if (logoData.startsWith('UklGR')) {
          imageType = 'WEBP'
        }

        const logoBuffer = Buffer.from(logoData, 'base64')

        if (
          imageType === 'PNG' ||
          imageType === 'JPEG' ||
          imageType === 'JPG'
        ) {
          try {
            doc.image(logoBuffer, 48, 25, {
              width: 90,
              height: 90,
              fit: [90, 90],
            })
            // const logoWidth = 98; // Non utilisé
            companyInfoX = 156
            companyInfoTop = 28
          } catch (logoError) {
            console.error("Erreur lors de l'affichage du logo:", logoError)
          }
        } else if (imageType === 'SVG') {
          try {
            const pngBuffer = await sharp(logoBuffer)
              .resize(384, 384, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 },
                kernel: sharp.kernel.lanczos3,
              })
              .png({
                quality: 100,
                compressionLevel: 6,
                adaptiveFiltering: true,
              })
              .toBuffer()

            doc.image(pngBuffer, 48, 25, {
              width: 90,
              height: 90,
            })
            // const logoWidth = 98; // Non utilisé
            companyInfoX = 156
            companyInfoTop = 28
          } catch (conversionError) {
            console.error('Erreur lors de la conversion SVG:', conversionError)
            doc
              .font(this.fonts.bold)
              .fontSize(10)
              .fillColor(this.colors.secondary)
              .text('[LOGO]', 48, 50)
            // logoWidth = 72; // Non utilisé
            companyInfoX = 128
            companyInfoTop = 36
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du logo:', error)
      }
    }

    // Nom de l'entreprise
    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor(primaryColor)
      .text(
        companySettings?.company_name || 'ENTREPRISE',
        companyInfoX,
        companyInfoTop + 10,
        {
          width: 250,
          height: 20,
        }
      )

    // Sous-titre métier
    if (companySettings?.business_type || companySettings?.description) {
      doc
        .font(this.fonts.italic)
        .fontSize(10)
        .fillColor(this.colors.secondary)
        .text(
          companySettings?.business_type ||
            companySettings?.description ||
            'Artisan du bâtiment',
          companyInfoX,
          companyInfoTop + 25,
          {
            width: 250,
          }
        )
    }

    // Adresse entreprise
    const address = [
      companySettings?.address_line1,
      companySettings?.address_line2,
      `${companySettings?.postal_code || ''} ${companySettings?.city || ''}`.trim(),
      companySettings?.phone ? `Tél: ${companySettings.phone}` : '',
      companySettings?.email ? `Email: ${companySettings.email}` : '',
    ].filter(Boolean)

    if (address.length > 0) {
      doc
        .font(this.fonts.regular)
        .fontSize(9)
        .fillColor(this.colors.dark)
        .text(address.join('\n'), companyInfoX, companyInfoTop + 40, {
          width: 250,
        })
    }

    // Détecter le type de document
    const isInvoice = document.invoiceNumber !== undefined
    let documentType = isInvoice ? 'FACTURE' : 'DEVIS'
    const documentNumber = isInvoice
      ? document.invoiceNumber
      : document.quoteNumber
    const documentLabel = isInvoice ? 'Facturé le' : 'Établi le'

    // Gestion des types de factures et états
    if (isInvoice) {
      // Vérifier si la facture est acquittée
      const isPaid =
        document.status === 'paid' ||
        (document.paidAmount &&
          document.totalTtc &&
          document.paidAmount >= document.totalTtc)

      if (isPaid) {
        documentType = 'FACTURE ACQUITTÉE'
      } else if (document.invoice_type) {
        const invoiceTypeLabels = {
          acompte: 'FACTURE ACOMPTE',
          solde: 'FACTURE SOLDE',
          acquittee: 'FACTURE ACQUITTÉE',
          rappel1: '1er RAPPEL',
          rappel2: '2ème RAPPEL',
          rappel3: 'DERNIER RAPPEL',
        }
        documentType = invoiceTypeLabels[document.invoice_type] || 'FACTURE'
      }
    }

    // Bloc document à droite
    doc.rect(400, 30, 140, 85).fillColor(primaryColor).fill()

    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor('white')
      .text(documentType, 400, 44, { align: 'center', width: 140 })

    doc.fontSize(11).text(`N° ${documentNumber || ''}`, 400, 62, {
      align: 'center',
      width: 140,
    })

    // Date
    const date = document.createdAt
      ? new Date(document.createdAt).toLocaleDateString('fr-FR')
      : ''
    doc.fontSize(8).text(`${documentLabel} ${date}`, 400, 82, {
      align: 'center',
      width: 140,
    })

    // Ligne de séparation
    doc
      .moveTo(this.pageConfig.margin, 125)
      .lineTo(doc.page.width - this.pageConfig.margin, 125)
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .stroke()

    // Restaurer la position si elle était définie
    if (currentY > 0) {
      doc.y = currentY
    }
  }

  addCompanyAndClientInfo(
    doc,
    document,
    companySettings,
    isInvoice = false,
    primaryColor,
    commonData
  ) {
    // Vérifier s'il faut une nouvelle page
    if (this.needsNewPage(150, commonData)) {
      this.addNewPage(commonData)
    }

    // Titre de section adapté au type de document
    const sectionTitle = isInvoice
      ? 'INFORMATIONS CLIENT ET FACTURATION'
      : 'INFORMATIONS CLIENT'

    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor(this.colors.dark)
      .text(sectionTitle, this.pageConfig.margin, doc.y)

    doc.y += 15

    // Deux colonnes pour les adresses
    const leftX = this.pageConfig.margin
    const rightX = 305
    const startY = doc.y

    // Adresse de facturation
    this.addAddressBlock(
      doc,
      'ADRESSE DE FACTURATION',
      {
        name: `${document.client?.firstName || ''} ${document.client?.lastName || ''}`.trim(),
        company: document.client?.companyName,
        address1: document.client?.addressLine1,
        address2: document.client?.addressLine2,
        postalCode: document.client?.postalCode,
        city: document.client?.city,
        email: document.client?.email,
        phone: document.client?.phone,
      },
      leftX,
      startY,
      primaryColor
    )

    // Adresse de chantier (pour les devis) ou informations de facturation (pour les factures)
    if (isInvoice) {
      // Pour les factures, afficher les informations de facturation
      const invoiceInfo = {
        name: `Facture N° ${document.invoiceNumber || ''}`,
        company: `Échéance: ${document.dueDate ? new Date(document.dueDate).toLocaleDateString('fr-FR') : '-'}`,
        address1: document.purchaseOrderNumber
          ? `Commande: ${document.purchaseOrderNumber}`
          : '',
        address2: document.paymentTerms
          ? `Conditions: ${document.paymentTerms}`
          : '',
        postalCode: '',
        city: '',
        email: '',
        phone: '',
      }
      this.addAddressBlock(
        doc,
        'INFORMATIONS FACTURATION',
        invoiceInfo,
        rightX,
        startY,
        primaryColor
      )
    } else {
      // Pour les devis, afficher l'adresse de chantier
      const siteInfo =
        document.siteAddress &&
        (document.siteAddress.addressLine1 || document.siteAddress.addressLine2)
          ? {
              name: `${document.client?.firstName || ''} ${document.client?.lastName || ''}`.trim(),
              company: document.client?.companyName,
              address1: document.siteAddress.addressLine1,
              address2: document.siteAddress.addressLine2,
              postalCode: document.siteAddress.postalCode,
              city: document.siteAddress.city,
            }
          : {
              name: `${document.client?.firstName || ''} ${document.client?.lastName || ''}`.trim(),
              company: document.client?.companyName,
              address1: document.client?.addressLine1,
              address2: document.client?.addressLine2,
              postalCode: document.client?.postalCode,
              city: document.client?.city,
            }

      this.addAddressBlock(
        doc,
        'ADRESSE DE CHANTIER',
        siteInfo,
        rightX,
        startY,
        primaryColor
      )
    }

    doc.y = startY + 120
  }

  addAddressBlock(doc, title, info, x, y, primaryColor) {
    const blockWidth = 250

    // Titre du bloc
    doc.rect(x, y, blockWidth, 25).fillColor(primaryColor).fill()

    doc
      .font(this.fonts.bold)
      .fontSize(10)
      .fillColor('white')
      .text(title, x + 10, y + 8, { width: blockWidth - 20 })

    // Contenu du bloc
    doc
      .rect(x, y + 25, blockWidth, 90)
      .fillColor(this.colors.light)
      .fill()
      .strokeColor('#e2e8f0')
      .stroke()

    const addressLines = [
      info.name,
      info.company,
      info.address1,
      info.address2,
      `${info.postalCode || ''} ${info.city || ''}`.trim(),
      info.email,
      info.phone,
    ].filter(Boolean)

    doc
      .font(this.fonts.regular)
      .fontSize(9)
      .fillColor(this.colors.dark)
      .text(addressLines.join('\n'), x + 10, y + 35, {
        width: blockWidth - 20,
        lineGap: 2,
      })
  }

  addQuoteDetails(doc, quote, commonData) {
    // Vérifier s'il faut une nouvelle page
    if (this.needsNewPage(100, commonData)) {
      this.addNewPage(commonData)
    }

    // Objet du devis si présent
    if (quote.title) {
      doc
        .font(this.fonts.bold)
        .fontSize(12)
        .fillColor(this.colors.dark)
        .text('OBJET DU DEVIS', this.pageConfig.margin, doc.y)

      doc
        .rect(
          this.pageConfig.margin,
          doc.y + 15,
          doc.page.width - this.pageConfig.margin * 2,
          30
        )
        .fillColor(this.colors.light)
        .fill()
        .strokeColor('#e2e8f0')
        .stroke()

      doc
        .font(this.fonts.regular)
        .fontSize(11)
        .fillColor(this.colors.dark)
        .text(quote.title, this.pageConfig.margin + 10, doc.y + 25)

      doc.y += 60
    }

    // Description si présente
    if (quote.description) {
      doc
        .font(this.fonts.regular)
        .fontSize(10)
        .fillColor(this.colors.secondary)
        .text(quote.description, this.pageConfig.margin, doc.y, {
          width: doc.page.width - this.pageConfig.margin * 2,
        })

      doc.y += 30
    }

    // Délai d'exécution prévu
    if (quote.estimatedDuration || quote.deliveryDate) {
      doc
        .font(this.fonts.bold)
        .fontSize(12)
        .fillColor(this.colors.dark)
        .text("DÉLAI D'EXÉCUTION PRÉVU", this.pageConfig.margin, doc.y)

      doc
        .rect(
          this.pageConfig.margin,
          doc.y + 15,
          doc.page.width - this.pageConfig.margin * 2,
          30
        )
        .fillColor(this.colors.light)
        .fill()
        .strokeColor('#e2e8f0')
        .stroke()

      let executionText = ''
      if (quote.estimatedDuration) {
        executionText = `Durée estimée : ${quote.estimatedDuration}`
      }
      if (quote.deliveryDate) {
        const deliveryDate = new Date(quote.deliveryDate).toLocaleDateString(
          'fr-FR'
        )
        executionText +=
          (executionText ? ' - ' : '') + `Livraison prévue le : ${deliveryDate}`
      }

      doc
        .font(this.fonts.regular)
        .fontSize(11)
        .fillColor(this.colors.dark)
        .text(executionText, this.pageConfig.margin + 10, doc.y + 25)

      doc.y += 60
    }
  }

  addInvoiceDetails(_doc, _invoice) {}

  addItemsTable(doc, quote, primaryColor, commonData) {
    // Vérifier s'il faut une nouvelle page
    if (this.needsNewPage(100, commonData)) {
      this.addNewPage(commonData)
    }

    // Titre de section
    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor(this.colors.dark)
      .text('DÉTAIL DES PRESTATIONS', this.pageConfig.margin, doc.y)

    doc.y += 15

    // Configuration du tableau
    const tableStartX = this.pageConfig.margin
    const tableWidth = doc.page.width - this.pageConfig.margin * 2

    const columns = [
      {
        title: 'DÉSIGNATION',
        width: Math.round(tableWidth * 0.35),
        align: 'left',
      },
      {
        title: 'QUANTITÉ',
        width: Math.round(tableWidth * 0.11),
        align: 'center',
      },
      { title: 'UNITÉ', width: Math.round(tableWidth * 0.1), align: 'center' },
      { title: 'PU HT', width: Math.round(tableWidth * 0.1), align: 'right' },
      { title: 'TVA', width: Math.round(tableWidth * 0.09), align: 'center' },
      {
        title: 'TOTAL HT',
        width: Math.round(tableWidth * 0.14),
        align: 'right',
      },
      {
        title: 'TOTAL TTC',
        width: Math.round(tableWidth * 0.14),
        align: 'right',
      },
    ]

    // Ajuster les largeurs pour qu'elles correspondent exactement à la largeur totale
    let totalWidth = columns.reduce((sum, col) => sum + col.width, 0)
    if (totalWidth !== tableWidth) {
      columns[0].width += tableWidth - totalWidth
    }

    let currentX = tableStartX
    columns.forEach((col) => {
      col.x = currentX
      currentX += col.width
    })

    // Fonction pour dessiner l'en-tête du tableau
    const drawTableHeader = (y) => {
      doc.rect(tableStartX, y, tableWidth, 25).fillColor(primaryColor).fill()

      doc.font(this.fonts.bold).fontSize(9).fillColor('white')

      columns.forEach((col) => {
        doc.text(col.title, col.x + 5, y + 8, {
          width: col.width - 10,
          align: col.align,
        })
      })

      return y + 25
    }

    // Dessiner l'en-tête initial
    let currentY = drawTableHeader(doc.y)
    doc.y = currentY

    // Rendu des sections et items
    if (Array.isArray(quote.sections) && quote.sections.length) {
      quote.sections.forEach((section, sectionIndex) => {
        // Vérifier si on a besoin d'une nouvelle page pour la section
        if (this.needsNewPage(50, commonData)) {
          this.addNewPage(commonData)
          currentY = drawTableHeader(doc.y)
          doc.y = currentY
        }

        // En-tête de section
        doc
          .rect(tableStartX, doc.y, tableWidth, 25)
          .fillColor('#f1f5f9')
          .fill()
          .strokeColor('#cbd5e1')
          .stroke()

        doc
          .font(this.fonts.bold)
          .fontSize(11)
          .fillColor(primaryColor)
          .text(
            `${sectionIndex + 1}. ${section.title || 'Section'}`,
            tableStartX + 10,
            doc.y + 8
          )

        doc.y += 15

        // Description de section si présente
        if (section.description) {
          if (this.needsNewPage(25, commonData)) {
            this.addNewPage(commonData)
            currentY = drawTableHeader(doc.y)
            doc.y = currentY
          }

          doc
            .font(this.fonts.italic)
            .fontSize(9)
            .fillColor(this.colors.secondary)
            .text(section.description, tableStartX + 10, doc.y + 5, {
              width: tableWidth - 20,
            })
          doc.y += 15
        }

        // Items de la section
        const sectionItems = (quote.items || []).filter(
          (item) => item.sectionId === section.id
        )

        sectionItems.forEach((item, itemIndex) => {
          const rowHeight = this.calculateRowHeight(doc, item, columns)

          if (this.needsNewPage(rowHeight, commonData)) {
            this.addNewPage(commonData)
            currentY = drawTableHeader(doc.y)
            doc.y = currentY
          }

          doc.y = this.addTableRow(
            doc,
            item,
            doc.y,
            columns,
            itemIndex % 2 === 0,
            tableStartX,
            tableWidth
          )
        })
      })
    } else {
      // Fallback: items sans sections
      ;(quote.items || []).forEach((item, itemIndex) => {
        const rowHeight = this.calculateRowHeight(doc, item, columns)

        if (this.needsNewPage(rowHeight, commonData)) {
          this.addNewPage(commonData)
          currentY = drawTableHeader(doc.y)
          doc.y = currentY
        }

        doc.y = this.addTableRow(
          doc,
          item,
          doc.y,
          columns,
          itemIndex % 2 === 0,
          tableStartX,
          tableWidth
        )
      })
    }

    doc.y += 20
  }

  calculateRowHeight(doc, item, columns) {
    doc.font(this.fonts.regular).fontSize(9)

    // Calculer la hauteur en fonction du contenu de la description
    const description = item.description || ''
    const descriptionWidth = columns[0].width - 10 // Largeur de la colonne description

    const textHeight = doc.heightOfString(description, {
      width: descriptionWidth,
      align: 'left',
    })

    return Math.max(20, textHeight + 12)
  }

  addTableRow(doc, item, y, columns, isEven, tableStartX, tableWidth) {
    const totalHt = item.totalHt || 0
    const vatRate = item.vatRate || 0
    const totalTtc = totalHt * (1 + vatRate / 100)

    const rowData = [
      item.description || '',
      (item.quantity || 0).toLocaleString('fr-FR'),
      item.unit || 'U',
      this.formatCurrency(item.unitPriceHt || 0),
      `${vatRate.toString().replace('.00', '').replace('.0', '')}%`,
      this.formatCurrency(totalHt),
      this.formatCurrency(totalTtc),
    ]

    const rowHeight = this.calculateRowHeight(doc, item, columns)

    // Fond alterné
    doc
      .rect(tableStartX, y, tableWidth, rowHeight)
      .fillColor(isEven ? '#f8fafc' : 'white')
      .fill()
      .strokeColor('#e2e8f0')
      .lineWidth(0.5)
      .stroke()

    doc.font(this.fonts.regular).fontSize(9).fillColor(this.colors.dark)

    columns.forEach((col, i) => {
      doc.text(rowData[i], col.x + 5, y + 8, {
        width: col.width - 10,
        align: col.align,
      })
    })

    return y + rowHeight
  }

  addTotalsSection(doc, quote, primaryColor, commonData) {
    const requiredHeight = 220
    if (this.needsNewPage(requiredHeight, commonData)) {
      this.addNewPage(commonData)
    }

    const asNumber = (value, fallback = 0) => {
      const num = Number(value)
      return Number.isFinite(num) ? num : fallback
    }

    doc.moveDown(2)

    // Configuration pour un tableau simple en 4 colonnes - encore plus large pour une meilleure lisibilité
    const blockWidth = 360
    const blockX = doc.page.width - this.pageConfig.margin - blockWidth
    const headerHeight = 30
    const rowHeight = 25
    const startY = doc.y

    const vatBreakdown = this.calculateVATBreakdown(quote.items || [])
    const computedVatTotal = vatBreakdown.reduce(
      (sum, entry) => sum + entry.vat,
      0
    )
    const explicitVatTotal = Number(quote.totalVat ?? 0)

    const isInvoice = quote.invoiceNumber !== undefined
    const isAdvanceInvoice =
      isInvoice &&
      (quote.invoiceType === 'acompte' || quote.invoice_type === 'acompte')

    const invoiceTotals = {
      subtotalHt: asNumber(quote.subtotalHt, 0),
      totalVat: asNumber(quote.totalVat, 0),
      totalTtc: asNumber(quote.totalTtc, 0),
    }

    const originalTotalsSource = quote.originalTotals || {}
    const originalTotals = {
      subtotalHt: asNumber(
        originalTotalsSource.subtotalHt ?? originalTotalsSource.subtotal_ht,
        invoiceTotals.subtotalHt
      ),
      totalVat: asNumber(
        originalTotalsSource.totalVat ?? originalTotalsSource.total_vat,
        invoiceTotals.totalVat
      ),
      totalTtc: asNumber(
        originalTotalsSource.totalTtc ?? originalTotalsSource.total_ttc,
        invoiceTotals.totalTtc
      ),
    }

    const paidAmount = asNumber(quote.paidAmount, 0)

    // Calculer les données pour le tableau en 4 colonnes
    let totalHt = 0
    let totalVat = 0
    let totalTtc = 0
    let acompteHt = 0
    let acompteVat = 0
    let acompteTtc = 0
    let soldeHt = 0
    let soldeVat = 0
    let soldeTtc = 0

    if (isAdvanceInvoice && originalTotals.totalTtc > 0) {
      // Pour les factures d'acompte
      totalHt = originalTotals.subtotalHt
      totalVat = originalTotals.totalVat
      totalTtc = originalTotals.totalTtc

      acompteHt = invoiceTotals.subtotalHt
      acompteVat = invoiceTotals.totalVat
      acompteTtc = invoiceTotals.totalTtc

      soldeHt = Math.max(totalHt - acompteHt, 0)
      soldeVat = Math.max(totalVat - acompteVat, 0)
      soldeTtc = Math.max(totalTtc - acompteTtc, 0)
    } else if (isInvoice) {
      // Pour les factures normales
      totalHt = invoiceTotals.subtotalHt
      totalVat = explicitVatTotal > 0 ? explicitVatTotal : computedVatTotal
      totalTtc = invoiceTotals.totalTtc

      if (paidAmount > 0) {
        const paidRatio = paidAmount / totalTtc
        acompteHt = totalHt * paidRatio
        acompteVat = totalVat * paidRatio
        acompteTtc = paidAmount

        soldeHt = Math.max(totalHt - acompteHt, 0)
        soldeVat = Math.max(totalVat - acompteVat, 0)
        soldeTtc = Math.max(totalTtc - acompteTtc, 0)
      } else {
        soldeHt = totalHt
        soldeVat = totalVat
        soldeTtc = totalTtc
      }
    } else {
      // Pour les devis
      totalHt = asNumber(quote.subtotalHt, 0)
      totalVat = asNumber(quote.totalVat, 0)
      totalTtc = asNumber(quote.totalTtc, 0)

      if (asNumber(quote.depositAmount, 0) > 0) {
        const depositAmount = asNumber(quote.depositAmount, 0)
        const depositRatio = depositAmount / totalTtc
        acompteHt = totalHt * depositRatio
        acompteVat = totalVat * depositRatio
        acompteTtc = depositAmount

        soldeHt = Math.max(totalHt - acompteHt, 0)
        soldeVat = Math.max(totalVat - acompteVat, 0)
        soldeTtc = Math.max(totalTtc - acompteTtc, 0)
      } else {
        soldeHt = totalHt
        soldeVat = totalVat
        soldeTtc = totalTtc
      }
    }

    // Calculer la hauteur du tableau (1 ligne d'en-tête + lignes par taux de TVA + Total, Acompte, Solde)
    const vatLinesCount = vatBreakdown.length
    const dataHeight = rowHeight * (3 + vatLinesCount) // 3 pour Total, Acompte, Solde + lignes TVA
    const blockHeight = headerHeight + dataHeight

    // Bloc récapitulatif simple sans coins arrondis
    doc
      .rect(blockX, startY, blockWidth, blockHeight)
      .fillColor('#ffffff')
      .strokeColor('#cbd5e1')
      .lineWidth(1)
      .stroke()

    // En-tête
    doc
      .rect(blockX, startY, blockWidth, headerHeight)
      .fillColor(primaryColor)
      .fill()

    // Titre simple
    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor('white')
      .text('RÉCAPITULATIF', blockX, startY + 8, {
        width: blockWidth,
        align: 'center',
      })

    // Définir les colonnes du tableau (séparation nette des intitulés et des montants)
    const columnConfig = [
      {
        width: Math.round(blockWidth * 0.25),
        align: 'left',
        headerAlign: 'left',
      },
      {
        width: Math.round(blockWidth * 0.19),
        align: 'right',
        headerAlign: 'right',
      },
      {
        width: Math.round(blockWidth * 0.19),
        align: 'center',
        headerAlign: 'center',
      },
      {
        width: Math.round(blockWidth * 0.19),
        align: 'right',
        headerAlign: 'right',
      },
      {
        width: Math.round(blockWidth * 0.19),
        align: 'right',
        headerAlign: 'right',
      },
    ]

    const declaredWidth = columnConfig.reduce((sum, col) => sum + col.width, 0)
    if (declaredWidth !== blockWidth) {
      columnConfig[columnConfig.length - 1].width += blockWidth - declaredWidth
    }

    columnConfig.forEach((col, index) => {
      col.x =
        index === 0
          ? blockX
          : columnConfig[index - 1].x + columnConfig[index - 1].width
    })

    const headerY = startY + headerHeight
    const headerLabels = [
      'Libellé',
      'Montant HT',
      'Type TVA',
      'Montant TVA',
      'Montant TTC',
    ]

    columnConfig.forEach((col, idx) => {
      doc
        .rect(col.x, headerY, col.width, rowHeight)
        .fillColor('#f8fafc')
        .fill()
        .strokeColor('#cbd5e1')
        .lineWidth(0.5)
        .stroke()

      doc
        .font(this.fonts.bold)
        .fontSize(9)
        .fillColor(this.colors.dark)
        .text(headerLabels[idx], col.x + 5, headerY + 8, {
          width: col.width - 10,
          align: col.headerAlign || col.align,
        })
    })

    const drawDataRow = (rowY, row) => {
      columnConfig.forEach((col) => {
        doc
          .rect(col.x, rowY, col.width, rowHeight)
          .fillColor(row.fillColor || '#ffffff')
          .fill()
          .strokeColor('#cbd5e1')
          .lineWidth(0.5)
          .stroke()
      })

      columnConfig.forEach((col, idx) => {
        const cell = row.values[idx] || {}
        doc
          .font(cell.font || this.fonts.regular)
          .fontSize(cell.fontSize || 10)
          .fillColor(cell.color || this.colors.dark)
          .text(cell.text || '', col.x + 5, rowY + 8, {
            width: col.width - 10,
            align: cell.align || col.align,
          })
      })
    }

    // Construire les lignes de données avec détail par taux de TVA
    const dataRows = []

    // Ajouter les lignes par taux de TVA
    vatBreakdown.forEach((vat, index) => {
      const isEven = index % 2 === 0
      dataRows.push({
        fillColor: isEven ? '#ffffff' : '#f8fafc',
        values: [
          { text: `TVA ${vat.rate}%`, font: this.fonts.regular },
          { text: this.formatCurrency(vat.ht), font: this.fonts.regular },
          { text: `${vat.rate}%`, align: 'center' },
          { text: this.formatCurrency(vat.vat), font: this.fonts.regular },
          { text: this.formatCurrency(vat.ttc), font: this.fonts.regular },
        ],
      })
    })

    // Ajouter les lignes de totaux
    dataRows.push(
      {
        fillColor: '#ffffff',
        values: [
          { text: 'Total', font: this.fonts.bold },
          { text: this.formatCurrency(totalHt), font: this.fonts.bold },
          { text: '', align: 'center' },
          { text: this.formatCurrency(totalVat), font: this.fonts.bold },
          { text: this.formatCurrency(totalTtc), font: this.fonts.bold },
        ],
      },
      {
        fillColor: '#f8fafc',
        values: [
          { text: 'Acompte', font: this.fonts.regular },
          { text: this.formatCurrency(acompteHt) },
          { text: '', align: 'center' },
          { text: this.formatCurrency(acompteVat) },
          { text: this.formatCurrency(acompteTtc) },
        ],
      },
      {
        fillColor: '#ffffff',
        values: [
          { text: 'Solde', font: this.fonts.bold, color: primaryColor },
          {
            text: this.formatCurrency(soldeHt),
            font: this.fonts.bold,
            color: primaryColor,
          },
          { text: '', align: 'center' },
          {
            text: this.formatCurrency(soldeVat),
            font: this.fonts.bold,
            color: primaryColor,
          },
          {
            text: this.formatCurrency(soldeTtc),
            font: this.fonts.bold,
            color: primaryColor,
          },
        ],
      }
    )

    dataRows.forEach((row, index) => {
      const rowY = headerY + rowHeight * (index + 1)
      drawDataRow(rowY, row)
    })

    // Informations de règlement à gauche
    const infoLines = []
    if (Number(quote.depositPercent || 0) > 0) {
      const percentLabel = Number(quote.depositPercent).toLocaleString(
        'fr-FR',
        {
          maximumFractionDigits: 2,
          minimumFractionDigits: Number(quote.depositPercent) % 1 === 0 ? 0 : 2,
        }
      )
      const amount =
        (Number(quote.totalTtc || 0) * Number(quote.depositPercent || 0)) / 100
      infoLines.push(
        `Acompte demandé: ${percentLabel}% (${this.formatCurrency(amount)})`
      )
    } else if (Number(quote.depositAmount || 0) > 0) {
      infoLines.push(
        `Acompte demandé: ${this.formatCurrency(quote.depositAmount)}`
      )
    }

    if (quote.validUntil) {
      infoLines.push(
        `Devis valable jusqu'au ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}`
      )
    }

    // Informations de règlement à gauche (design simple)
    if (infoLines.length) {
      const infoWidth = blockX - this.pageConfig.margin - 25
      const infoHeight = infoLines.length * 18 + 30

      // Bloc simple sans coins arrondis
      doc
        .rect(this.pageConfig.margin, startY, infoWidth, infoHeight)
        .fillColor('#f8fafc')
        .strokeColor('#cbd5e1')
        .lineWidth(1)
        .stroke()

      // En-tête
      doc
        .rect(this.pageConfig.margin, startY, infoWidth, 25)
        .fillColor(primaryColor)
        .fill()

      // Titre simple
      doc
        .font(this.fonts.bold)
        .fontSize(10)
        .fillColor('white')
        .text(
          'INFORMATIONS DE RÈGLEMENT',
          this.pageConfig.margin + 10,
          startY + 6,
          {
            width: infoWidth - 20,
            align: 'center',
          }
        )

      // Contenu avec puces
      const bulletPoints = infoLines.map((line) => '• ' + line)
      doc
        .font(this.fonts.regular)
        .fontSize(9)
        .fillColor(this.colors.dark)
        .text(
          bulletPoints.join('\n'),
          this.pageConfig.margin + 10,
          startY + 30,
          {
            width: infoWidth - 20,
            lineGap: 3,
          }
        )
    }

    // Position finale
    const infoBlockHeight = infoLines.length ? infoLines.length * 18 + 30 : 0
    const contentHeight = Math.max(blockHeight, infoBlockHeight)
    const separatorY = startY + contentHeight + 35

    doc
      .moveTo(this.pageConfig.margin, separatorY)
      .lineTo(doc.page.width - this.pageConfig.margin, separatorY)
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .stroke()

    doc.y = separatorY + 15
  }

  calculateVATBreakdown(items) {
    const vatMap = new Map()

    items.forEach((item) => {
      const rate = Number(item.vatRate || 20)
      const itemHt = Number(item.totalHt || 0)
      const vatAmount = (itemHt * rate) / 100
      const itemTtc = itemHt + vatAmount

      if (vatMap.has(rate)) {
        const existing = vatMap.get(rate)
        vatMap.set(rate, {
          ht: existing.ht + itemHt,
          vat: existing.vat + vatAmount,
          ttc: existing.ttc + itemTtc,
        })
      } else {
        vatMap.set(rate, {
          ht: itemHt,
          vat: vatAmount,
          ttc: itemTtc,
        })
      }
    })

    return Array.from(vatMap.entries())
      .map(([rate, amounts]) => ({
        rate,
        ht: amounts.ht,
        vat: amounts.vat,
        ttc: amounts.ttc,
      }))
      .sort((a, b) => a.rate - b.rate)
  }

  async addConditionsAndSignature(
    doc,
    quote,
    companySettings,
    primaryColor,
    commonData
  ) {
    // Vérifier si on a assez d'espace sur la page actuelle
    const requiredHeight = 350 // Estimation pour tout le contenu conditions
    const availableSpace = this.getContentEndY(commonData) - doc.y

    if (availableSpace < requiredHeight) {
      this.addNewPage(commonData)
    }

    // const startY = doc.y; // Non utilisé

    // Titre principal
    doc
      .font(this.fonts.bold)
      .fontSize(16)
      .fillColor(primaryColor)
      .text(
        'CONDITIONS GÉNÉRALES ET ACCEPTATION',
        this.pageConfig.margin,
        doc.y
      )

    doc.y += 20

    // Section conditions - Version compacte
    this.addPaymentConditions(doc, quote, companySettings, primaryColor)

    // Section signature - Version compacte
    await this.addSignatureSection(doc, primaryColor, companySettings)

    // Section informations importantes - Version compacte
    this.addImportantNotices(doc, companySettings)
  }

  addPaymentConditions(doc, quote, companySettings, _primaryColor) {
    // Titre de section
    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor(this.colors.dark)
      .text('CONDITIONS COMMERCIALES', this.pageConfig.margin, doc.y)

    doc.y += 12 // Espacement optimisé

    // Encadré conditions - Version compacte
    const conditionsY = doc.y
    const conditionsWidth = doc.page.width - this.pageConfig.margin * 2

    doc
      .rect(this.pageConfig.margin, conditionsY, conditionsWidth, 110) // Réduit de 140 à 110
      .fillColor(this.colors.light)
      .fill()
      .strokeColor('#cbd5e1')
      .stroke()

    // Contenu des conditions - Version condensée
    const conditions = [
      `• Validité : ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('fr-FR') : '30 jours'}`,
      `• Acompte : ${quote.depositPercent || 30}% TTC à la commande`,
      '• Solde : à la fin des travaux',
      '• Paiement : Chèque, virement, espèces (< 1000€)',
      companySettings?.iban ? `• IBAN : ${companySettings.iban}` : '',
      companySettings?.bic ? `• BIC : ${companySettings.bic}` : '',
      '• Rétractation : 14 jours (art. L221-18 Code consommation)',
      '• Assurances : RC Pro et décennale souscrites',
    ].filter(Boolean)

    doc
      .font(this.fonts.regular)
      .fontSize(9) // Réduit de 10 à 9
      .fillColor(this.colors.dark)
      .text(
        conditions.join('\n'),
        this.pageConfig.margin + 10,
        conditionsY + 10,
        {
          width: conditionsWidth - 20,
          lineGap: 2,
        }
      )

    doc.y = conditionsY + 125 // Ajusté en conséquence
    doc.y += 8 // Espacement avant la section signature
  }

  async addSignatureSection(doc, primaryColor, companySettings) {
    // Titre de section
    doc.y += 18

    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor(this.colors.dark)
      .text('BON POUR ACCORD', this.pageConfig.margin, doc.y)

    doc.y += 15 // Espacement optimisé

    // Encadré signature - Version compacte
    const signatureY = doc.y
    const signatureWidth = doc.page.width - this.pageConfig.margin * 2

    doc
      .rect(this.pageConfig.margin, signatureY, signatureWidth, 200) // Augmenté pour la nouvelle disposition
      .fillColor(this.colors.light)
      .fill()
      .strokeColor(primaryColor)
      .lineWidth(2)
      .stroke()

    // Zones de signature - Disposition gauche/droite
    const leftX = this.pageConfig.margin + 15
    const rightX = doc.page.width - 250 // Aligné à droite
    const startY = signatureY + 15

    // === COLONNE GAUCHE ===
    let currentY = startY

    // Client
    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor(primaryColor)
      .text('CLIENT', leftX, currentY)
    currentY += 25

    // En acceptant ce devis, le client :
    doc
      .font(this.fonts.regular)
      .fontSize(8)
      .fillColor(this.colors.dark)
      .text('En acceptant ce devis, le client :', leftX, currentY)
    currentY += 20

    const acceptanceText = [
      '• Accepte les conditions générales',
      '• Reconnaît son droit de rétractation',
      '• Autorise le début des travaux',
    ]

    doc.fontSize(8).text(acceptanceText.join('\n'), leftX, currentY)
    currentY += 45

    // Mention manuscrite obligatoire
    doc
      .font(this.fonts.bold)
      .fontSize(8)
      .fillColor(primaryColor)
      .text('Mention manuscrite obligatoire :', leftX, currentY)
    currentY += 10

    doc
      .font(this.fonts.regular)
      .fontSize(8)
      .fillColor(primaryColor)
      .text(
        "« Devis reçu avant l'exécution des travaux, bon pour accord »",
        leftX,
        currentY
      )
    currentY += 25

    // Ligne de signature pour la mention manuscrite
    doc
      .moveTo(leftX, currentY)
      .lineTo(leftX + 250, currentY)
      .strokeColor(primaryColor)
      .lineWidth(1)
      .stroke()
    currentY += 25

    // Signature client
    doc
      .font(this.fonts.regular)
      .fontSize(8)
      .text('Nom, date et signature :', leftX, currentY)
    doc
      .moveTo(leftX, currentY + 30)
      .lineTo(leftX + 160, currentY + 30)
      .stroke()

    // === COLONNE DROITE ===
    // Entreprise
    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor(primaryColor)
      .text('ENTREPRISE', rightX, startY)

    // Gestion du cachet de l'entreprise
    if (companySettings?.stamp_base64) {
      // Vérifier si le fichier est trop volumineux (plus de 500KB)
      if (companySettings.stamp_base64.length > 500000) {
        console.warn('⚠️ Cachet trop volumineux, utilisation du fallback texte')
        // Utiliser le fallback texte au lieu de l'image, centré
        const fallbackY = startY + 30
        doc
          .font(this.fonts.regular)
          .fontSize(8)
          .text('Cachet et signature :', rightX + 50, fallbackY)
        doc
          .moveTo(rightX + 50, fallbackY + 40)
          .lineTo(rightX + 200, fallbackY + 40)
          .stroke()
        return // Sortir de la fonction
      }
      try {
        const stampData = companySettings.stamp_base64
        const match = stampData.match(/^data:image\/([^;]+);base64,(.+)$/)

        if (match) {
          const imageType = match[1].toUpperCase()
          const base64Data = match[2]
          const stampBuffer = Buffer.from(base64Data, 'base64')

          if (
            imageType === 'PNG' ||
            imageType === 'JPEG' ||
            imageType === 'JPG'
          ) {
            // Centrer le cachet sur la partie droite, plus gros et plus à gauche
            const stampWidth = 220
            const stampHeight = 150
            const centerX = rightX + (250 - stampWidth) / 2 - 20 // Centrer et décaler vers la gauche
            const centerY = startY + 30 // Position sous ENTREPRISE

            doc.image(stampBuffer, centerX, centerY, {
              width: stampWidth,
              height: stampHeight,
              fit: [stampWidth, stampHeight],
            })
          } else if (imageType === 'SVG') {
            const sharp = require('sharp')

            try {
              // Optimiser le SVG avant conversion
              const pngBuffer = await sharp(stampBuffer, {
                density: 72, // Réduire la densité pour optimiser
                limitInputPixels: false, // Permettre les gros fichiers
              })
                .resize(220, 150, {
                  fit: 'contain',
                  background: { r: 255, g: 255, b: 255, alpha: 0 },
                })
                .png({ quality: 80 }) // Réduire la qualité pour optimiser
                .toBuffer()

              // Centrer le cachet sur la partie droite, plus gros et plus à gauche
              const stampWidth = 220
              const stampHeight = 150
              const centerX = rightX + (250 - stampWidth) / 2 - 20 // Centrer et décaler vers la gauche
              const centerY = startY + 30 // Position sous ENTREPRISE

              doc.image(pngBuffer, centerX, centerY, {
                width: stampWidth,
                height: stampHeight,
              })
            } catch (sharpError) {
              console.error(
                '❌ Erreur Sharp lors de la conversion SVG:',
                sharpError.message
              )
              throw sharpError
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'affichage du cachet:", error)
        // Fallback centré en cas d'erreur
        const fallbackY = startY + 30
        doc
          .font(this.fonts.regular)
          .fontSize(8)
          .text('Cachet et signature :', rightX + 50, fallbackY)
        doc
          .moveTo(rightX + 50, fallbackY + 40)
          .lineTo(rightX + 200, fallbackY + 40)
          .stroke()
      }
    } else {
      // Pas de cachet - fallback centré
      const fallbackY = startY + 30
      doc
        .font(this.fonts.regular)
        .fontSize(8)
        .text('Cachet et signature :', rightX + 50, fallbackY)
      doc
        .moveTo(rightX + 50, fallbackY + 40)
        .lineTo(rightX + 200, fallbackY + 40)
        .stroke()
    }

    doc.y = signatureY + 200 // Ajusté pour la nouvelle hauteur de boîte
  }

  addImportantNotices(doc, _companySettings) {
    doc.y += 25 // Espacement optimisé après les signatures

    // Titre
    doc
      .font(this.fonts.bold)
      .fontSize(11)
      .fillColor(this.colors.danger)
      .text('INFORMATIONS IMPORTANTES', this.pageConfig.margin, doc.y)

    doc.y += 20 // Plus d'espace après le titre

    // Zone pour les informations importantes (sans encadré coloré)
    const noticeWidth = doc.page.width - this.pageConfig.margin * 2
    const noticeY = doc.y

    // Informations importantes reformulées et mieux structurées
    const notices = [
      "• Droit de rétractation : Vous disposez d'un délai de 14 jours pour renoncer à votre commande sans motif ni justification (art. L221-18 du Code de la consommation)",
      '• Médiation : En cas de litige, vous pouvez recourir à la médiation de la consommation (www.mediation-consommation.fr)',
      '• Assurances : Cette entreprise est couverte par une assurance responsabilité civile professionnelle et une garantie décennale obligatoire',
      '• Garanties légales : Garantie décennale sur les travaux de gros œuvre, garantie biennale sur les équipements',
    ]

    doc
      .font(this.fonts.regular)
      .fontSize(8) // Taille légèrement augmentée pour la lisibilité
      .fillColor(this.colors.dark)
      .text(notices.join('\n'), this.pageConfig.margin, noticeY, {
        width: noticeWidth,
        lineGap: 1, // Espace réduit entre les lignes
      })

    doc.y = noticeY + 70 // Position après le texte
  }

  async applyHeadersAndFooters() {
    const { doc, quote, invoice, companySettings, primaryColor } =
      this.commonData
    const document = quote || invoice // Support des devis et factures
    const pages = doc.bufferedPageRange()

    for (let i = 0; i < pages.count; i++) {
      const pageNumber = i + 1
      doc.switchToPage(i)

      // Vérifier si la page a du contenu avant d'appliquer header/footer
      // En vérifiant si il y a du texte ou des éléments dessinés sur cette page
      // const currentPage = doc.page;

      // Ajouter l'en-tête sur toutes les pages
      await this.addHeaderContent(
        doc,
        document,
        companySettings,
        primaryColor,
        pageNumber
      )

      // Ajouter le pied de page
      this.addFooterContent(doc, companySettings, pageNumber, pages.count)
    }
  }

  addFooterContent(
    doc,
    companySettings,
    primaryColorOrPageNumber,
    invoiceOrTotalPages = null
  ) {
    // Gérer les deux signatures :
    // 1. (doc, companySettings, pageNumber, totalPages) - pour les devis
    // 2. (doc, companySettings, primaryColor, invoice) - pour les factures
    const isInvoiceMode =
      typeof primaryColorOrPageNumber === 'string' &&
      primaryColorOrPageNumber.startsWith('#')

    if (isInvoiceMode) {
      // Mode facture - appeler les fonctions spécifiques aux factures
      const primaryColor = primaryColorOrPageNumber
      const invoice = invoiceOrTotalPages

      // Ajouter les conditions de paiement pour les factures
      this.addInvoicePaymentConditions(
        doc,
        invoice,
        companySettings,
        primaryColor,
        invoice?.client,
        this.commonData
      )

      // Ajouter les mentions légales pour les factures
      this.addInvoiceLegalNotices(doc, companySettings, invoice?.client)

      return
    }

    // Mode devis - logique existante
    const pageNumber = primaryColorOrPageNumber
    const totalPages = invoiceOrTotalPages

    // Position du footer - zone réservée en bas
    const footerStartY = doc.page.height - this.pageConfig.footerHeight

    // Ligne de séparation
    doc
      .moveTo(this.pageConfig.margin, footerStartY + 8)
      .lineTo(doc.page.width - this.pageConfig.margin, footerStartY + 8)
      .strokeColor('#e2e8f0')
      .lineWidth(0.5)
      .stroke()

    // Texte des mentions légales - Version simplifiée
    const legalText = this.buildSimpleLegalFooter(companySettings)

    // Position du texte avec plus de marge de sécurité
    const textY = footerStartY + 18
    const textWidth = doc.page.width - 2 * this.pageConfig.margin

    doc
      .font(this.fonts.regular)
      .fontSize(6.5)
      .fillColor(this.colors.secondary)
      .text(legalText, this.pageConfig.margin, textY, {
        width: textWidth,
        align: 'center',
        lineGap: 1,
      })

    // Numéro de page centré sous les mentions légales si plusieurs pages
    if (totalPages > 1) {
      // Position fixe pour la pagination, bien au-dessus du bas de page
      const pageY = doc.page.height - this.pageConfig.margin - 15 // 15px du bas de page

      doc
        .font(this.fonts.bold)
        .fontSize(8)
        .fillColor(this.colors.dark)
        .text(
          `Page ${pageNumber} sur ${totalPages}`,
          this.pageConfig.margin,
          pageY,
          {
            width: textWidth,
            align: 'center',
          }
        )
    }
  }

  buildSimpleLegalFooter(companySettings = {}) {
    // Version simplifiée et compacte pour éviter le débordement
    const parts = []

    // Ligne 1: Entreprise et siège
    const company = companySettings.company_name || ''
    const legalForm =
      companySettings.forme_juridique || companySettings.legal_form || ''
    const address = [
      companySettings.address_line1,
      companySettings.address_line2,
      `${companySettings.postal_code || ''} ${companySettings.city || ''}`.trim(),
    ]
      .filter(Boolean)
      .join(', ')

    if (company) {
      let line1 = legalForm ? `${company} — ${legalForm}` : company
      if (companySettings.capital_social || companySettings.share_capital) {
        const capital =
          companySettings.capital_social || companySettings.share_capital
        line1 += ` • Capital: ${capital}`
      }
      if (address) line1 += ` • Siège social: ${address}`
      parts.push(line1)
    }

    // Ligne 2: Numéros officiels
    const officials = []
    if (companySettings.siret) officials.push(`SIRET: ${companySettings.siret}`)
    if (companySettings.rcs_number || companySettings.numero_rcs) {
      const rcs = companySettings.rcs_number || companySettings.numero_rcs
      officials.push(`RCS: ${rcs}`)
    }
    if (companySettings.ape_code || companySettings.code_ape) {
      officials.push(
        `APE: ${companySettings.ape_code || companySettings.code_ape}`
      )
    }
    if (companySettings.vat_number || companySettings.tva_intracommunautaire) {
      officials.push(
        `TVA: ${companySettings.vat_number || companySettings.tva_intracommunautaire}`
      )
    }
    if (officials.length > 0) parts.push(officials.join(' • '))

    // Ligne 3: Assurances et contact
    const contacts = []
    if (companySettings.insurance_company || companySettings.assurance_rc) {
      const insurance =
        companySettings.insurance_company || companySettings.assurance_rc
      const policy =
        companySettings.insurance_policy_number ||
        companySettings.police_assurance
      contacts.push(`RC Pro: ${insurance}${policy ? ` ${policy}` : ''}`)
    }
    if (companySettings.phone) contacts.push(`Tél: ${companySettings.phone}`)
    if (companySettings.email) contacts.push(`Email: ${companySettings.email}`)
    if (companySettings.website)
      contacts.push(`Web: ${companySettings.website}`)
    if (contacts.length > 0) parts.push(contacts.join(' • '))

    return parts.join('\n')
  }

  buildCompleteLegalFooter(companySettings = {}) {
    // Informations obligatoires selon la législation française
    const company =
      companySettings.company_name || companySettings.legal_name || ''
    const legalForm =
      companySettings.forme_juridique || companySettings.legal_form || ''
    const capital = companySettings.capital_social
    const siret = companySettings.siret || ''
    const rcs = companySettings.rcs_number || companySettings.numero_rcs || ''
    const ape = companySettings.ape_code || companySettings.code_ape || ''
    const tva =
      companySettings.vat_number || companySettings.tva_intracommunautaire || ''
    const address = [
      companySettings.address_line1,
      companySettings.address_line2,
      `${companySettings.postal_code || ''} ${companySettings.city || ''}`.trim(),
    ]
      .filter(Boolean)
      .join(', ')

    // Construction des mentions légales - Version compacte pour le footer
    const legalParts = []

    // Ligne 1: Identification entreprise
    const identificationParts = []
    if (company && legalForm) {
      identificationParts.push(`${company} — ${legalForm}`)
    } else if (company) {
      identificationParts.push(company)
    }
    if (capital) {
      identificationParts.push(`Capital: ${capital}`)
    }

    if (address) {
      identificationParts.push(`Siège social: ${address}`)
    }

    if (identificationParts.length > 0) {
      legalParts.push(identificationParts.join(' • '))
    }

    // Ligne 2: Numéros officiels
    const officialNumbers = []
    if (siret) {
      officialNumbers.push(`SIREN/SIRET: ${siret}`)
    }
    if (rcs) {
      const tribunal = companySettings.tribunal_commercial || 'RCS'
      officialNumbers.push(`${tribunal}: ${rcs}`)
    }
    if (ape) {
      officialNumbers.push(`APE/NAF: ${ape}`)
    }
    if (tva) {
      officialNumbers.push(`TVA intracom: ${tva}`)
    } else {
      officialNumbers.push('TVA non applicable, art. 293 B du CGI')
    }

    if (officialNumbers.length > 0) {
      legalParts.push(officialNumbers.join(' • '))
    }

    // Ligne 3: Assurances
    const insuranceParts = []
    const insurance =
      companySettings.insurance_company || companySettings.assurance_rc || ''
    const policyNumber =
      companySettings.insurance_policy_number ||
      companySettings.police_assurance ||
      ''
    if (insurance) {
      insuranceParts.push(
        `Assurance RC Pro: ${insurance}${policyNumber ? ` — Police: ${policyNumber}` : ''}`
      )
    }

    const decennaleInsurance =
      companySettings.decennale_insurance ||
      companySettings.garantie_decennale ||
      ''
    if (decennaleInsurance) {
      insuranceParts.push(`Garantie décennale: ${decennaleInsurance}`)
    }

    if (insuranceParts.length > 0) {
      legalParts.push(insuranceParts.join(' • '))
    }

    // Ligne 4: Contact et médiation
    const contactParts = []
    if (companySettings.phone)
      contactParts.push(`Tél: ${companySettings.phone}`)
    if (companySettings.email)
      contactParts.push(`Email: ${companySettings.email}`)
    if (companySettings.website)
      contactParts.push(`Web: ${companySettings.website}`)

    const mediator = companySettings.mediator_name || ''
    const mediatorWebsite = companySettings.mediator_website || ''
    if (mediator) {
      contactParts.push(
        `Médiateur: ${mediator}${mediatorWebsite ? ` — ${mediatorWebsite}` : ''}`
      )
    }

    if (contactParts.length > 0) {
      legalParts.push(contactParts.join(' • '))
    }

    // Ligne 5: Mentions complémentaires si nécessaire
    const additionalParts = []
    if (companySettings.btp_compliance) {
      additionalParts.push(
        "Entreprise du BTP soumise aux dispositions de l'article L. 111-28 du Code de la construction"
      )
    }
    if (companySettings.rgpd_compliance) {
      additionalParts.push(
        'Traitement des données conforme au RGPD — Politique de confidentialité disponible sur demande'
      )
    }

    if (additionalParts.length > 0) {
      legalParts.push(additionalParts.join(' • '))
    }

    // Nettoyer et assembler
    const sanitizedParts = legalParts
      .map((part) => part.replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    return sanitizedParts.join('\n')
  }

  formatCurrency(amount) {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      useGrouping: true,
    }).format(Number(amount || 0))

    // Remplace les espaces insécables par des espaces normaux
    return formatted.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ')
  }

  addInvoicePaymentConditions(
    doc,
    invoice,
    companySettings,
    primaryColor,
    client = null,
    commonData = null
  ) {
    // Vérifier si on a assez d'espace sur la page actuelle
    const requiredHeight = 200 // Estimation pour tout le contenu conditions
    const availableSpace = this.getContentEndY(commonData) - doc.y

    if (availableSpace < requiredHeight) {
      this.addNewPage(commonData)
    }

    // const startY = doc.y; // Non utilisé

    // Titre principal
    doc
      .font(this.fonts.bold)
      .fontSize(16)
      .fillColor(primaryColor)
      .text('CONDITIONS DE PAIEMENT', this.pageConfig.margin, doc.y)

    doc.y += 20

    // Section conditions de paiement spécifiques aux factures
    doc
      .font(this.fonts.bold)
      .fontSize(12)
      .fillColor(this.colors.dark)
      .text('MODALITÉS DE RÈGLEMENT', this.pageConfig.margin, doc.y)

    doc.y += 12

    // Encadré conditions de paiement
    const conditionsY = doc.y
    const conditionsWidth = doc.page.width - this.pageConfig.margin * 2

    doc
      .rect(this.pageConfig.margin, conditionsY, conditionsWidth, 100)
      .fillColor(this.colors.light)
      .fill()
      .strokeColor('#cbd5e1')
      .stroke()

    // Contenu des conditions spécifiques aux factures
    const formatDate = (date) => {
      if (!date) return '-'
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('fr-FR')
    }

    const conditions = [
      `• Date d'échéance : ${formatDate(invoice.dueDate)}`,
      invoice.paymentTerms
        ? `• Conditions : ${invoice.paymentTerms}`
        : '• Paiement à réception de facture',
      '• Moyens de paiement : Chèque, virement bancaire, espèces (< 1000€)',
      companySettings?.iban ? `• IBAN : ${companySettings.iban}` : '',
      companySettings?.bic ? `• BIC : ${companySettings.bic}` : '',
      companySettings?.bank_name
        ? `• Banque : ${companySettings.bank_name}`
        : '',
      '• En cas de retard : pénalités de retard au taux légal en vigueur',
      // Indemnité forfaitaire uniquement pour les relations B2B
      client && (client.isCompany || client.is_company)
        ? '• Indemnité forfaitaire pour frais de recouvrement : 40€ (art. L441-10 C. com.)'
        : '',
    ].filter(Boolean)

    doc
      .font(this.fonts.regular)
      .fontSize(9)
      .fillColor(this.colors.dark)
      .text(
        conditions.join('\n'),
        this.pageConfig.margin + 10,
        conditionsY + 10,
        {
          width: conditionsWidth - 20,
          lineGap: 2,
        }
      )

    doc.y = conditionsY + 115
    doc.y += 8 // Espacement avant la section informations légales

    // Section informations légales spécifiques aux factures
    this.addInvoiceLegalNotices(doc, companySettings, invoice.client)
  }

  addInvoiceLegalNotices(doc, companySettings, client = null) {
    doc.y += 20

    // Titre
    doc
      .font(this.fonts.bold)
      .fontSize(11)
      .fillColor(this.colors.danger)
      .text('INFORMATIONS LÉGALES', this.pageConfig.margin, doc.y)

    doc.y += 15

    // Encadré pour les informations légales
    const noticeWidth = doc.page.width - this.pageConfig.margin * 2
    const noticeY = doc.y

    doc
      .rect(this.pageConfig.margin, noticeY, noticeWidth, 60)
      .fillColor('#fff5f5')
      .fill()
      .strokeColor('#fca5a5')
      .lineWidth(1)
      .stroke()

    // Informations légales conditionnelles selon le type de client
    const notices = [
      '• Facture conforme aux dispositions légales françaises',
      '• TVA : ' +
        (companySettings.vat_number || companySettings.tva_intracommunautaire
          ? `N° ${companySettings.vat_number || companySettings.tva_intracommunautaire}`
          : 'Non applicable, art. 293 B du CGI'),
    ]

    // Mentions spécifiques B2C (particuliers)
    if (client && !(client.isCompany || client.is_company)) {
      notices.push(
        '• Droit de rétractation : 14 jours à compter de la signature du devis (art. L221-28 du Code de la consommation)'
      )
      notices.push(
        '• En cas de litige : recours possible à la médiation de la consommation (www.mediation-consommation.fr)'
      )
    }

    // Mentions spécifiques B2B (entreprises)
    if (client && (client.isCompany || client.is_company)) {
      notices.push(
        '• Indemnité forfaitaire pour frais de recouvrement : 40€ (art. L441-10 C. com.)'
      )
      notices.push(
        '• En cas de litige : compétence des tribunaux du siège social'
      )
    }

    // Mentions communes
    notices.push('• Assurances : RC Pro et décennale souscrites')
    notices.push(
      '• Garanties légales : Garantie décennale sur les travaux de gros œuvre, garantie biennale sur les équipements'
    )

    doc
      .font(this.fonts.regular)
      .fontSize(8)
      .fillColor(this.colors.dark)
      .text(notices.join('\n'), this.pageConfig.margin + 10, noticeY + 8, {
        width: noticeWidth - 20,
        lineGap: 1,
      })

    doc.y = noticeY + 70
  }

  async generateInvoicePDF(invoice, companySettings) {
    return new Promise((resolve, reject) => {
      ;(async () => {
        try {
          // Format A4 avec marges professionnelles
          const doc = new PDFDocument({
            size: 'A4',
            margin: this.pageConfig.margin,
            bufferPages: true,
            autoFirstPage: true,
          })

          // Calculer la zone de contenu disponible
          this.pageConfig.contentAreaHeight =
            doc.page.height -
            this.pageConfig.margin * 2 -
            this.pageConfig.headerHeight -
            this.pageConfig.footerHeight

          const chunks = []
          doc.on('data', (chunk) => chunks.push(chunk))
          doc.on('end', () => resolve(Buffer.concat(chunks)))
          doc.on('error', reject)

          // Déterminer la couleur primaire
          const primaryColor =
            companySettings.primary_color || this.colors.primary

          // Stocker les données communes pour toutes les pages
          this.commonData = {
            invoice,
            companySettings,
            primaryColor,
            doc,
          }

          // Ajouter le contenu de la facture
          await this.addHeaderContent(
            doc,
            invoice,
            companySettings,
            primaryColor,
            1
          )
          await this.addCompanyAndClientInfo(
            doc,
            invoice,
            companySettings,
            true,
            primaryColor,
            this.commonData
          )
          this.addItemsTable(doc, invoice, primaryColor, this.commonData)
          await this.addTotalsSection(
            doc,
            invoice,
            primaryColor,
            this.commonData
          )

          // Ajouter un récapitulatif spécial pour les factures de solde
          if (invoice.invoice_type === 'solde') {
            await this.addBalanceSummary(doc, invoice, primaryColor)
          }

          await this.addFooterContent(
            doc,
            companySettings,
            primaryColor,
            invoice
          )

          doc.end()
        } catch (error) {
          reject(error)
        }
      })()
    })
  }

  async addBalanceSummary(doc, invoice, primaryColor) {
    const pageWidth = doc.page.width
    const margin = this.pageConfig.margin
    const contentWidth = pageWidth - margin * 2

    // Espacement depuis la section précédente
    const startY = doc.y + 30

    // Titre de la section
    doc
      .font(this.fonts.bold)
      .fontSize(14)
      .fillColor(primaryColor)
      .text('RÉCAPITULATIF ACOMPTE / SOLDE', margin, startY)

    const sectionY = startY + 25

    // Tableau récapitulatif
    const tableWidth = contentWidth * 0.7
    const tableX = margin + (contentWidth - tableWidth) / 2
    const rowHeight = 25
    const headerHeight = 30

    // En-tête du tableau
    doc
      .rect(tableX, sectionY, tableWidth, headerHeight)
      .fillColor('#f8fafc')
      .fill()
      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .stroke()

    doc
      .font(this.fonts.bold)
      .fontSize(10)
      .fillColor(this.colors.dark)
      .text('DÉTAIL', tableX + 10, sectionY + 10, {
        width: tableWidth - 20,
        align: 'center',
      })

    // Ligne 1: Total du devis original
    const row1Y = sectionY + headerHeight
    doc
      .rect(tableX, row1Y, tableWidth, rowHeight)
      .fillColor('#ffffff')
      .fill()
      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .stroke()

    doc
      .font(this.fonts.regular)
      .fontSize(10)
      .fillColor(this.colors.dark)
      .text('Total du devis original', tableX + 10, row1Y + 8)
      .text(
        this.formatCurrency(invoice.quote_total_ttc || 0),
        tableX + 10,
        row1Y + 8,
        {
          width: tableWidth - 20,
          align: 'right',
        }
      )

    // Ligne 2: Acompte déjà versé
    const row2Y = row1Y + rowHeight
    doc
      .rect(tableX, row2Y, tableWidth, rowHeight)
      .fillColor('#f0fdf4')
      .fill()
      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .stroke()

    doc
      .font(this.fonts.bold)
      .fontSize(10)
      .fillColor('#059669')
      .text('Acompte déjà versé', tableX + 10, row2Y + 8)
      .text(
        this.formatCurrency(
          (invoice.quote_total_ttc || 0) - (invoice.totalTtc || 0)
        ),
        tableX + 10,
        row2Y + 8,
        {
          width: tableWidth - 20,
          align: 'right',
        }
      )

    // Ligne 3: Solde restant dû
    const row3Y = row2Y + rowHeight
    doc
      .rect(tableX, row3Y, tableWidth, rowHeight)
      .fillColor('#fef2f2')
      .fill()
      .strokeColor('#dc2626')
      .lineWidth(1)
      .stroke()

    doc
      .font(this.fonts.bold)
      .fontSize(11)
      .fillColor('#dc2626')
      .text('SOLDE RESTANT DÛ', tableX + 10, row3Y + 7)
      .text(
        this.formatCurrency(invoice.totalTtc || 0),
        tableX + 10,
        row3Y + 7,
        {
          width: tableWidth - 20,
          align: 'right',
        }
      )

    // Note explicative
    const noteY = row3Y + rowHeight + 20
    doc
      .font(this.fonts.regular)
      .fontSize(9)
      .fillColor('#6b7280')
      .text(
        "Cette facture de solde fait suite à la facture d'acompte déjà réglée. Le montant indiqué ci-dessus correspond au solde restant dû.",
        margin,
        noteY,
        {
          width: contentWidth,
          align: 'justify',
        }
      )

    doc.y = noteY + 50
  }

  async close() {
    // Pas de nettoyage nécessaire avec PDFKit
  }
}

// Export de la classe pour créer une nouvelle instance à chaque utilisation
// Cela évite les problèmes de concurrence avec les propriétés partagées
module.exports = SimplePDFService
