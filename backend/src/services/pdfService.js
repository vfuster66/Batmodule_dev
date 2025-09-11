const puppeteer = require('puppeteer');
const path = require('path');

class PDFService {
    constructor() {
        this.browser = null;
        this.launchOptions = null;
    }

    async init() {
        if (this.browser) return;
        // Build launch options safely for containerized envs
        const executablePath = process.env.CHROMIUM_PATH || (puppeteer.executablePath ? puppeteer.executablePath() : undefined);
        this.launchOptions = {
            headless: true,
            executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-infobars',
                '--window-size=1280,1024'
            ]
        };

        this.browser = await puppeteer.launch(this.launchOptions);
        // Auto-reset on disconnect so next call relaunches
        this.browser.on('disconnected', () => { this.browser = null; });
    }

    async relaunch() {
        try { if (this.browser) { await this.browser.close(); } } catch (_) { /* ignore */ }
        this.browser = null;
        await this.init();
    }

    async withPage(renderFn) {
        await this.init();
        try {
            const page = await this.browser.newPage();
            try {
                return await renderFn(page);
            } finally {
                try { await page.close(); } catch (_) { /* ignore */ }
            }
        } catch (err) {
            // Retry once after relaunching Chromium (handles Target closed / setAutoAttach errors)
            await this.relaunch();
            const page = await this.browser.newPage();
            try {
                return await renderFn(page);
            } finally {
                try { await page.close(); } catch (_) { /* ignore */ }
            }
        }
    }

    async generateQuotePDF(quote, companySettings) {
        return this.withPage(async (page) => {
            const html = this.generateQuoteHTML(quote, companySettings);
            await page.setContent(html, { waitUntil: 'load' });

            const base64 = companySettings && companySettings.logo_base64;
            const logoDataUrl = (() => {
                if (!base64) return '';
                if (base64.startsWith && base64.startsWith('data:')) return base64;
                if (base64.startsWith && base64.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${base64}`;
                if (base64.startsWith && base64.startsWith('/9j/')) return `data:image/jpeg;base64,${base64}`;
                if (base64.startsWith && base64.startsWith('R0lGOD')) return `data:image/gif;base64,${base64}`;
                if (base64.startsWith && base64.startsWith('UklGR')) return `data:image/webp;base64,${base64}`;
                return `data:image/png;base64,${base64}`;
            })();

            const primary = companySettings?.primary_color || '#FF7F00';
            const companyName = companySettings?.company_name || '';
            const email = companySettings?.email || '';
            const phone = companySettings?.phone || '';
            const website = companySettings?.website || '';
            const addr = [companySettings?.address_line1, companySettings?.address_line2].filter(Boolean).join(' ');
            const cityLine = [companySettings?.postal_code, companySettings?.city].filter(Boolean).join(' ');
            return page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '36mm', right: '15mm', bottom: '30mm', left: '15mm' },
                displayHeaderFooter: true,
                headerTemplate: `
                  <div style="width:100%; padding:10px 10mm 8px; border-bottom:1px solid #e5e7eb; font-size:10px; color:#333;">
                    <table style="width:100%; border-collapse:collapse;">
                      <tr>
                        <td style="vertical-align:middle; padding-right:12px;">
                          <table style="border-collapse:collapse;"><tr>
                            <td style="vertical-align:middle; padding-right:12px;">
                              ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:96px; width:auto; object-fit:contain; display:block;" />` : ''}
                            </td>
                            <td style="vertical-align:middle;">
                              ${companyName ? `<div style=\"font-size:14px; font-weight:bold; color:${primary}; margin-bottom:4px;\">${companyName}</div>` : ''}
                              <div style=\"font-size:12px; line-height:1.35;\">
                                ${addr ? `<div style=\"color:${primary};\">${addr}</div>` : ''}
                                ${cityLine ? `<div style=\"color:${primary};\">${cityLine}</div>` : ''}
                                ${email ? `<div><a href=\"mailto:${email}\" style=\"color:#0ea5e9; text-decoration:none;\">${email}</a></div>` : ''}
                                ${phone ? `<div><a href=\"tel:${String(phone).replace(/\\s+/g, '')}\" style=\"color:${primary}; text-decoration:none; font-weight:bold;\">${phone}</a></div>` : ''}
                                ${website ? `<div><a href=\"${website}\" style=\"color:#0ea5e9; text-decoration:none;\" target=\"_blank\" rel=\"noopener\">${website.replace(/^https?:\/\//, '')}</a></div>` : ''}
                              </div>
                            </td>
                          </tr></table>
                        </td>
                        <td style="vertical-align:middle; text-align:right; white-space:nowrap;">
                          <div style="font-weight:800; color:${primary}; font-size:18px; letter-spacing:0.3px;">DEVIS N° ${quote.quoteNumber || ''}</div>
                        </td>
                      </tr>
                    </table>
                  </div>
                `,
                footerTemplate: await this.buildFooterTemplate(companySettings, quote.userId)
            });
        });
    }

    async generateInvoicePDF(invoice, companySettings) {
        return this.withPage(async (page) => {
            const html = this.generateInvoiceHTML(invoice, companySettings);
            await page.setContent(html, { waitUntil: 'load' });

            // Variables pour le header (identique aux devis)
            const primary = companySettings.primary_color || '#004AAD';
            const companyName = companySettings.company_name || '';
            const addr = [companySettings.address_line1, companySettings.address_line2].filter(Boolean).join(' ');
            const cityLine = [companySettings.postal_code, companySettings.city].filter(Boolean).join(' ');
            const email = companySettings.email || '';
            const phone = companySettings.phone || '';
            const website = companySettings.website || '';

            const base64 = companySettings && companySettings.logo_base64;
            const logoDataUrl = (() => {
                if (!base64) return '';
                if (base64.startsWith && base64.startsWith('data:')) return base64;
                if (base64.startsWith && base64.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${base64}`;
                if (base64.startsWith && base64.startsWith('/9j/')) return `data:image/jpeg;base64,${base64}`;
                if (base64.startsWith && base64.startsWith('R0lGOD')) return `data:image/gif;base64,${base64}`;
                if (base64.startsWith && base64.startsWith('UklGR')) return `data:image/webp;base64,${base64}`;
                return `data:image/png;base64,${base64}`;
            })();

            return page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '36mm', right: '15mm', bottom: '30mm', left: '15mm' },
                displayHeaderFooter: true,
                headerTemplate: `
                  <div style="width:100%; padding:10px 10mm 8px; border-bottom:1px solid #e5e7eb; font-size:10px; color:#333;">
                    <table style="width:100%; border-collapse:collapse;">
                      <tr>
                        <td style="vertical-align:middle; padding-right:12px;">
                          <table style="border-collapse:collapse;"><tr>
                            <td style="vertical-align:middle; padding-right:12px;">
                              ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:96px; width:auto; object-fit:contain; display:block;" />` : ''}
                            </td>
                            <td style="vertical-align:middle;">
                              ${companyName ? `<div style=\"font-size:14px; font-weight:bold; color:${primary}; margin-bottom:4px;\">${companyName}</div>` : ''}
                              <div style=\"font-size:12px; line-height:1.35;\">
                                ${addr ? `<div style=\"color:${primary};\">${addr}</div>` : ''}
                                ${cityLine ? `<div style=\"color:${primary};\">${cityLine}</div>` : ''}
                                ${email ? `<div><a href=\"mailto:${email}\" style=\"color:#0ea5e9; text-decoration:none;\">${email}</a></div>` : ''}
                                ${phone ? `<div><a href=\"tel:${String(phone).replace(/\\s+/g, '')}\" style=\"color:${primary}; text-decoration:none; font-weight:bold;\">${phone}</a></div>` : ''}
                                ${website ? `<div><a href=\"${website}\" style=\"color:#0ea5e9; text-decoration:none;\" target=\"_blank\" rel=\"noopener\">${website.replace(/^https?:\/\//, '')}</a></div>` : ''}
                              </div>
                            </td>
                          </tr></table>
                        </td>
                        <td style="vertical-align:middle; text-align:right; white-space:nowrap;">
                          <div style="font-weight:800; color:${primary}; font-size:18px; letter-spacing:0.3px;">FACTURE N° ${invoice.invoiceNumber || ''}</div>
                        </td>
                      </tr>
                    </table>
                  </div>
                `,
                footerTemplate: await this.buildFooterTemplate(companySettings, invoice.userId)
            });
        });
    }

    async buildFooterTemplate(companySettings = {}, userId = null) {
        const lc = (v) => (v || '').toString();
        const company = lc(companySettings.company_name || companySettings.legal_name || '');
        const forme = lc(companySettings.forme_juridique);
        const capital = lc(companySettings.capital_social);
        const siret = lc(companySettings.siret);
        const rcs = lc(companySettings.rcs_number || companySettings.numero_rcs);
        const tribunal = lc(companySettings.tribunal_commercial);
        const ape = lc(companySettings.ape_code || companySettings.code_ape);
        const tva = lc(companySettings.tva_intracommunautaire || companySettings.vat_number);
        const addr1 = lc(companySettings.address_line1);
        const addr2 = lc(companySettings.address_line2);
        const cp = lc(companySettings.postal_code);
        const city = lc(companySettings.city);
        const phone = lc(companySettings.phone);
        const email = lc(companySettings.email);
        const website = lc(companySettings.website);
        const assurance = lc(companySettings.assurance_rc || companySettings.insurance_company);
        const police = lc(companySettings.insurance_policy_number);
        const vatApplicable = companySettings.show_vat !== false && !!tva;

        // Récupérer les assurances actives si userId fourni
        let activeInsurances = [];
        let activeCertifications = [];

        if (userId) {
            try {
                const insuranceService = require('./insuranceService');
                const certificationService = require('./certificationService');

                activeInsurances = await insuranceService.getInsurances(userId);
                activeCertifications = await certificationService.getCertifications(userId);

                // Filtrer seulement les assurances et certifications actives
                activeInsurances = activeInsurances.filter(ins => ins.is_active && new Date(ins.end_date) > new Date());
                activeCertifications = activeCertifications.filter(cert => cert.is_active && new Date(cert.end_date) > new Date());
            } catch (error) {
                console.error('Erreur lors de la récupération des assurances/certifications:', error);
            }
        }

        const legalLines = [
            company ? `<strong>${company}</strong>${forme ? ' — ' + forme : ''}${capital ? ' — Capital: ' + capital : ''}` : '',
            (addr1 || addr2 || cp || city) ? [addr1, addr2, [cp, city].filter(Boolean).join(' ')].filter(Boolean).join(' — ') : '',
            siret ? `SIREN/SIRET: ${siret}` : '',
            rcs ? `RCS: ${rcs}${tribunal ? ' — ' + tribunal : ''}` : '',
            ape ? `APE/NAF: ${ape}` : '',
            vatApplicable ? `TVA intracom: ${tva}` : `TVA non applicable, art. 293 B du CGI`,
            assurance ? `Assurance RC Pro: ${assurance}${police ? ' — Police: ' + police : ''}` : '',
            [phone, email, website ? website.replace(/^https?:\/\//, '') : ''].filter(Boolean).join(' — ')
        ].filter(Boolean).join(' · ');

        // Ajouter les assurances actives
        const insuranceLines = activeInsurances.map(ins => {
            const typeNames = {
                'decennale': 'Assurance Décennale',
                'rc_pro': 'RC Pro',
                'garantie': 'Garantie Financière',
                'multirisque': 'Multirisque'
            };
            const typeName = typeNames[ins.certificate_type] || ins.certificate_type;
            const endDate = new Date(ins.end_date).toLocaleDateString('fr-FR');
            return `${typeName}: ${ins.certificate_number} (valide jusqu'au ${endDate})`;
        });

        // Ajouter les certifications actives
        const certificationLines = activeCertifications.map(cert => {
            const typeNames = {
                'rge': 'RGE',
                'qualibat': 'Qualibat',
                'qualifelec': 'Qualifelec',
                'qualifibat': 'Qualifibat',
                'qualipac': 'Qualipac',
                'qualisol': 'Qualisol',
                'qualit-enr': 'Qualit-ENR'
            };
            const typeName = typeNames[cert.certification_type] || cert.certification_type;
            const endDate = new Date(cert.end_date).toLocaleDateString('fr-FR');
            return `${typeName}: ${cert.certification_number} (valide jusqu'au ${endDate})`;
        });

        const allLines = [...legalLines.split(' · '), ...insuranceLines, ...certificationLines];

        return `
            <div style="font-size:8px; color:#666; width:100%; padding:6px 10mm; text-align:center; line-height:1.3;">
                <div>${allLines.join(' · ')}</div>
                <div style="margin-top:4px;">Page <span class=\"pageNumber\"></span> / <span class=\"totalPages\"></span></div>
            </div>
        `;
    }

    generateQuoteHTML(quote, companySettings) {
        const getLogoDataUrl = (base64) => {
            if (!base64) return '';
            if (base64.startsWith('data:')) return base64;
            if (base64.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${base64}`;
            if (base64.startsWith('/9j/')) return `data:image/jpeg;base64,${base64}`;
            if (base64.startsWith('R0lGOD')) return `data:image/gif;base64,${base64}`;
            if (base64.startsWith('UklGR')) return `data:image/webp;base64,${base64}`;
            return `data:image/png;base64,${base64}`;
        };

        const formatDate = (date) => {
            if (!date) return '-';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '-';
            return d.toLocaleDateString('fr-FR');
        };

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(amount);
        };

        const primaryColor = companySettings.primary_color || '#004AAD';
        // Regroupement TVA par taux
        const vatMap = new Map();
        (quote.items || []).forEach(it => {
            const rate = Number(it.vatRate || 0);
            const vatAmt = Number(it.totalTtc || 0) - Number(it.totalHt || 0);
            vatMap.set(rate, (vatMap.get(rate) || 0) + vatAmt);
        });

        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devis ${quote.quoteNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.5; color: #000; background: white; padding: 0; }
        @media print {
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
        }
        table, thead, tfoot, tr, td, th { page-break-inside: avoid; break-inside: avoid; }
        
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            gap: 20px;
        }
        
        .company-info {
            flex: 1;
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }
        
        .company-logo img {
            height: 60px;
            width: auto;
            object-fit: contain;
        }
        
        .company-details {
            flex: 1;
        }
        
        .company-name {
            font-size: 16px;
            font-weight: bold;
            color: ${primaryColor};
            margin-bottom: 3px;
        }
        
        .company-tagline {
            font-size: 10px;
            color: ${primaryColor};
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .company-address {
            font-size: 10px;
            color: #333;
            line-height: 1.3;
        }
        
        .quote-header {
            text-align: right;
            min-width: 200px;
        }
        
        .quote-number {
            font-size: 18px;
            font-weight: bold;
            color: ${primaryColor};
            margin-bottom: 15px;
        }
        
        .client-info {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-left: 4px solid ${primaryColor};
            border-radius: 6px;
            padding: 12px 14px;
            font-size: 12px;
            line-height: 1.5;
        }
        
        .client-name {
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .date-location {
            text-align: right;
            font-size: 10px;
            margin: 15px 0;
            color: #333;
        }
        
        .recipient-row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: stretch; /* cartes de même hauteur */
            margin: 16px 0 12px;
            width: 100%;
        }
        .recipient-row .client-info { 
            background: #f9fafb; 
            border: 1px solid #e5e7eb; 
            border-left: 4px solid ${primaryColor}; 
            border-radius: 6px; 
            padding: 12px 14px; 
            font-size: 12px; 
            line-height: 1.5;
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 120px; /* hauteur minimale pour uniformiser */
        }
        .client-card {
            background: #f9fafb; /* gris très léger comme le bloc paiement */
            border: 1px solid #e5e7eb;
            border-left: 4px solid ${primaryColor};
            border-radius: 6px; /* léger arrondi */
            padding: 12px 14px; /* padding cohérent avec paiement */
            padding-left: 18px; /* espace supplémentaire entre la barre et le texte */
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 120px; /* hauteur minimale pour uniformiser */
        }
        .recipient-row .client-card { 
            flex: 1; 
            min-width: 0; /* permet au contenu de se rétrécir si nécessaire */
            box-sizing: border-box;
        }
        .client-label { font-size: 10px; color:#6b7280; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
        .recipient-row .client-info .client-name { font-weight: bold; margin-bottom: 2px; }
        .recipient-row .date-block { text-align: right; font-size: 11px; color: #333; white-space: nowrap; }
        
        .object-line { margin: 8px 0 10px; font-size: 11px; }
        
        .object-line strong {
            font-weight: bold;
        }
        
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        
        .items-table th { background: #f3f4f6; color: #111; padding: 8px; font-size: 10px; font-weight: bold; text-align: center; border: 1px solid #ddd; border-bottom: 1px solid #ddd; text-transform: uppercase; }
        
        .items-table th.libelle {
            text-align: left;
            width: 45%;
        }
        
        .items-table th.qte {
            width: 8%;
        }
        
        .items-table th.unite {
            width: 6%;
        }
        
        .items-table th.pu {
            width: 12%;
        }
        
        .items-table th.tva {
            width: 8%;
        }
        
        .items-table th.total {
            width: 12%;
        }
        
        .items-table td { padding: 8px; font-size: 12px; border: 1px solid #ddd; vertical-align: top; }
        
        .items-table .libelle { text-align: left; line-height: 1.5; }
        
        .items-table .number {
            text-align: right;
        }
        
        .items-table .center {
            text-align: center;
        }
        
        .items-table tr:nth-child(even) { background: #fcfcfd; }
        
        .totals-section {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            width: 280px;
            border-collapse: collapse;
        }
        
        .totals-table td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #ddd; }
        
        .totals-table .label {
            text-align: left;
            font-weight: bold;
        }
        
        .totals-table .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .totals-table .total-row {
            background: ${primaryColor};
            color: white;
            font-weight: bold;
            font-size: 11px;
        }
        
        .signature-section { 
            margin-top: 26px; 
            border: 1px solid #e5e7eb; 
            padding: 14px; 
            border-radius: 4px; 
            page-break-inside: avoid; 
            break-inside: avoid;
            padding-top: 10mm; /* éviter le chevauchement si le bloc débute en haut d'une nouvelle page */
        }
        .signature-title { font-size: 10px; font-weight: bold; margin-bottom: 10px; color: ${primaryColor}; text-transform: uppercase; }
        .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: end; }
        .signature-field { display: flex; flex-direction: column; }
        .signature-label { font-size: 10px; color:#333; margin-bottom: 6px; }
        .signature-lines { height: 70px; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; }
        .signature-lines .line { border-bottom: 1px solid #999; }
        .payment-box { 
            margin-top: 16px; 
            padding: 12px 14px; 
            background: #f9fafb; 
            border: 1px solid #e5e7eb; 
            border-left: 4px solid ${primaryColor}; 
            border-radius: 4px; 
            font-size: 12px; 
            line-height: 1.5; 
            page-break-inside: avoid; 
            break-inside: avoid;
        }
        .payment-box .row { display:flex; gap: 10px; align-items:flex-start; margin: 4px 0; }
        .payment-box .label { min-width: 120px; font-weight: bold; color:#111; }
        .payment-box .value { flex: 1; color:#333; }
        
        .footer-legal {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 7px;
            color: #666;
            text-align: center;
            line-height: 1.3;
        }
    </style>
</head>
<body>
    <div class="header-section recipient-row">
        <div class="client-card client-info">
            <div class="client-label">Adresse de facturation</div>
            <div class="client-name">${quote.client.firstName} ${quote.client.lastName}</div>
            ${quote.client.companyName ? `${quote.client.companyName}<br>` : ''}
            ${quote.client.addressLine1 || ''}<br>
            ${(quote.client.postalCode || '') + (quote.client.city ? (' ' + quote.client.city) : '')}<br>
            ${quote.client.email ? `${quote.client.email}<br>` : ''}
            ${quote.client.phone || ''}
            <div style="flex-grow: 1;"></div>
            </div>
        <div class="client-card client-info">
            <div class="client-label">Adresse de chantier</div>
            <div class="client-name">${quote.client.firstName} ${quote.client.lastName}</div>
            ${quote.client.companyName ? `${quote.client.companyName}<br>` : ''}
            ${(quote.siteAddress && (quote.siteAddress.addressLine1 || quote.siteAddress.addressLine2))
                ? `${quote.siteAddress.addressLine1 || ''}<br>${quote.siteAddress.addressLine2 ? quote.siteAddress.addressLine2 + '<br>' : ''}`
                : `${quote.client.addressLine1 || ''}<br>${quote.client.addressLine2 ? quote.client.addressLine2 + '<br>' : ''}`}
            ${(quote.siteAddress && (quote.siteAddress.postalCode || quote.siteAddress.city))
                ? `${quote.siteAddress.postalCode || ''} ${quote.siteAddress.city || ''}`
                : `${quote.client.postalCode || ''} ${quote.client.city || ''}`}
            <div style="flex-grow: 1;"></div>
        </div>
            </div>
    <div class="date-location">Devis établi le: ${formatDate(quote.createdAt)}</div>

    

    ${quote.title ? `
        <div class="object-line">
            <strong>Objet :</strong> ${quote.title}
        </div>
    ` : ''}

            <table class="items-table">
        <colgroup>
            <col style="width:46%">
            <col style="width:10%">
            <col style="width:8%">
            <col style="width:14%">
            <col style="width:8%">
            <col style="width:7%">
            <col style="width:7%">
        </colgroup>
                <thead>
                    <tr>
                <th class="libelle">LIBELLÉ</th>
                <th class="qte">QUANTITÉ</th>
                <th class="unite">UNITÉ</th>
                <th class="pu">PRIX UNITAIRE HT</th>
                <th class="tva">TVA</th>
                <th class="ajust">Ajust.</th>
                <th class="total">TOTAL €</th>
                    </tr>
                </thead>
                <tbody>
            ${(() => {
                const rows = [];
                const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));
                const renderItem = (item) => {
                    const qty = Number(item.quantity || 0);
                    const pu = Number(item.unitPriceHt || 0);
                    const discount = Number(item.discountPercent || 0) / 100;
                    const markup = Number(item.markupPercent || 0) / 100;
                    const puNet = pu * (1 - discount) * (1 + markup);
                    const vatPct = (item.vatRate == null) ? '' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(item.vatRate)) + '%';
                    return `
                        <tr>
                            <td class="libelle">${item.description || ''}</td>
                            <td class="number">${qty.toLocaleString('fr-FR')}</td>
                            <td class="center">${item.unit || 'U'}</td>
                            <td class="number">${fmt(puNet)}</td>
                            <td class="number">${vatPct}</td>
                            <td class="center">${(item.discountPercent ? `-${Number(item.discountPercent)}%` : '')}${(item.discountPercent && item.markupPercent) ? ' / ' : ''}${(item.markupPercent ? `+${Number(item.markupPercent)}%` : '')}</td>
                            <td class="number">${fmt(item.totalHt)}</td>
                        </tr>`;
                };
                if (Array.isArray(quote.sections) && quote.sections.length) {
                    for (let i = 0; i < quote.sections.length; i++) {
                        const sec = quote.sections[i];
                        rows.push(`<tr><td colspan="7" style="font-weight:bold;color:#111;border-left:3px solid ${primaryColor};padding-left:8px;background:#f8f9fa;">${sec.title || ''}</td></tr>`);
                        if (sec.description) rows.push(`<tr><td colspan="7" style="color:#555;font-size:10px;padding-left:8px;">${sec.description}</td></tr>`);
                        // Rendre les lignes appartenant à cette section
                        const items = (quote.items || []).filter(it => it.sectionId === sec.id);
                        for (const it of items) rows.push(renderItem(it));
                    }
                } else {
                    // Fallback: utiliser les items directement si pas de sections
                    for (const it of (quote.items || [])) rows.push(renderItem(it));
                }
                return rows.join('');
            })()}
            </tbody>
        </table>

    <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td class="label">TOTAL HT</td>
                <td class="amount">${(quote.subtotalHt || 0).toFixed(2)} €</td>
            </tr>
            <tr>
                <td class="label">TVA 20,00%</td>
                <td class="amount">${(quote.totalVat || 0).toFixed(2)} €</td>
            </tr>
            ${companySettings.show_vat !== false ? '' : `
                <tr>
                    <td class="label">TVA 10,00%</td>
                    <td class="amount">0,00 €</td>
                </tr>
            `}
            <tr class="total-row">
                <td class="label">TOTAL TTC</td>
                <td class="amount">${(quote.totalTtc || 0).toFixed(2)} €</td>
            </tr>
        </table>
    </div>

    <div class="acceptance-container" style="break-before: page; page-break-before: always; margin-top: 12mm;">
    <div class="signature-section">
        <div class="signature-title">Bon pour accord</div>
        <div class="signature-grid">
            <div class="signature-field">
                <div class="signature-label">Nom et signature</div>
                <div class="signature-lines"><div class="line"></div><div class="line"></div></div>
        </div>
            <div class="signature-field">
                <div class="signature-label">Date</div>
                <div class="signature-lines"><div class="line"></div><div class="line"></div></div>
            </div>
        </div>
        <div class="payment-box">
            <div class="row"><div class="label">Acompte</div><div class="value">${quote.depositPercent || 30}% à régler avant le début des travaux${quote.depositAmount ? ' (montant: ' + formatCurrency(quote.depositAmount) + ')' : ''}.</div></div>
            <div class="row"><div class="label">Paiements</div><div class="value">Chèque, Virement.</div></div>
            ${companySettings.iban ? `<div class=\"row\"><div class=\"label\">IBAN</div><div class=\"value\">${companySettings.iban}</div></div>` : ''}
            ${(companySettings.bic || companySettings.bank_name) ? `<div class=\"row\"><div class=\"label\">Coordonnées</div><div class=\"value\">${companySettings.bic ? `<strong>BIC:</strong> ${companySettings.bic}` : ''}${companySettings.bank_name ? ` — <strong>Banque:</strong> ${companySettings.bank_name}` : ''}</div></div>` : ''}
            ${quote.validUntil ? `<div class="row"><div class="label">Validité</div><div class="value">${formatDate(quote.validUntil)}</div></div>` : ''}
        </div>
    </div>
    </div>

    ${(companySettings.show_vat === false) ? `
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
            TVA non applicable, article 293 B du CGI
    </div>
    ` : ''}
</body>
</html>`;
    }

    generateInvoiceHTML(invoice, companySettings) {
        // Conserver la logique existante pour les factures
        const getLogoDataUrl = (base64) => {
            if (!base64) return '';
            if (base64.startsWith('data:')) return base64;
            if (base64.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${base64}`;
            if (base64.startsWith('/9j/')) return `data:image/jpeg;base64,${base64}`;
            if (base64.startsWith('R0lGOD')) return `data:image/gif;base64,${base64}`;
            if (base64.startsWith('UklGR')) return `data:image/webp;base64,${base64}`;
            return `data:image/png;base64,${base64}`;
        };

        const formatDate = (date) => {
            if (!date) return '-';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '-';
            return d.toLocaleDateString('fr-FR');
        };

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(amount);
        };

        const primaryColor = companySettings.primary_color || '#004AAD';

        // Regroupement TVA par taux
        const vatMap = new Map();
        (invoice.items || []).forEach(it => {
            const rate = Number(it.vatRate || 0);
            const vatAmt = Number(it.totalTtc || 0) - Number(it.totalHt || 0);
            vatMap.set(rate, (vatMap.get(rate) || 0) + vatAmt);
        });

        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoice.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        
        .client-section {
            margin: 20px 0;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: ${primaryColor};
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .client-info {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-left: 4px solid ${primaryColor};
            border-radius: 6px;
            padding: 12px 14px;
            font-size: 12px;
            line-height: 1.5;
        }
        
        .recipient-row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: stretch;
            margin: 16px 0 12px;
            width: 100%;
        }
        .client-card { 
            background: #f9fafb; 
            border: 1px solid #e5e7eb; 
            border-left: 4px solid ${primaryColor}; 
            border-radius: 6px; 
            padding: 12px 14px; 
            font-size: 12px; 
            line-height: 1.5; 
            flex: 1;
            display: flex; 
            flex-direction: column; 
            min-height: 120px; 
        }
        .recipient-row .client-card { 
            flex: 1; 
            min-width: 0; 
            box-sizing: border-box;
        }
        .client-label { 
            font-size: 10px; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: .4px; 
            margin-bottom: 4px; 
        }
        .client-name { 
            font-weight: bold;
            margin-bottom: 2px; 
        }
        .date-location {
            font-size: 10px;
            margin: 15px 0;
            color: #333;
        }
        .info-grid { font-size: 12px; }
        .info-row { display:flex; justify-content: space-between; gap:12px; margin: 2px 0; }
        .info-row .label { color:#111; font-weight:bold; min-width: 110px; }
        .info-row .value { color:#333; flex:1; text-align:right; }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th,
        .items-table td {
            padding: 10px;
            font-size: 11px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .items-table th {
            background: #f3f4f6; 
            color: #111; 
            padding: 8px; 
            font-size: 10px; 
            font-weight: bold;
            text-align: center; 
            border: 1px solid #ddd; 
            border-bottom: 1px solid #ddd; 
            text-transform: uppercase; 
        }
        
        .items-table th.libelle {
            text-align: left;
            width: 45%;
        }
        
        .items-table th.qte {
            width: 8%;
        }
        
        .items-table th.unite {
            width: 6%;
        }
        
        .items-table th.pu {
            width: 12%;
        }
        
        .items-table th.tva {
            width: 8%;
        }
        
        .items-table th.total {
            width: 12%;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .items-table .libelle { text-align: left; line-height: 1.5; }
        
        .items-table .number {
            text-align: right;
            font-variant-numeric: tabular-nums;
        }
        
        .items-table .center { text-align: center; }
        
        .items-table tr:nth-child(even) { background: #fcfcfd; }
        
        .text-right {
            text-align: right;
        }
        
        .totals-section {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
        }
        
        .totals-table .total-row {
            font-weight: bold;
            background: ${companySettings.primary_color || '#004AAD'};
            color: white;
        }
        
        .payment-info {
            margin-top: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .notes-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header-section recipient-row">
        <div class="client-card client-info">
            <div class="client-label">Adresse de facturation</div>
            <div class="client-name">${invoice.client.firstName || ''} ${invoice.client.lastName || ''}</div>
            ${invoice.client.companyName ? `${invoice.client.companyName}<br>` : ''}
            ${invoice.client.addressLine1 || ''}<br>
            ${(invoice.client.postalCode || '') + (invoice.client.city ? (' ' + invoice.client.city) : '')}<br>
            ${invoice.client.email ? `${invoice.client.email}<br>` : ''}
            ${invoice.client.phone || ''}
            <div style="flex-grow: 1;"></div>
            </div>
        <div class="client-card client-info">
            <div class="client-label">Adresse de chantier</div>
            <div class="client-name">${invoice.client.firstName || ''} ${invoice.client.lastName || ''}</div>
            ${invoice.client.companyName ? `${invoice.client.companyName}<br>` : ''}
            ${invoice.siteAddress && (invoice.siteAddress.addressLine1 || invoice.siteAddress.addressLine2)
                ? `${invoice.siteAddress.addressLine1 || ''}<br>${invoice.siteAddress.addressLine2 ? invoice.siteAddress.addressLine2 + '<br>' : ''}`
                : `${invoice.client.addressLine1 || ''}<br>${invoice.client.addressLine2 ? invoice.client.addressLine2 + '<br>' : ''}`}
            ${(invoice.siteAddress && (invoice.siteAddress.postalCode || invoice.siteAddress.city))
                ? `${invoice.siteAddress.postalCode || ''} ${invoice.siteAddress.city || ''}`
                : `${invoice.client.postalCode || ''} ${invoice.client.city || ''}`}
            <div style="flex-grow: 1;"></div>
        </div>
            </div>
    <div class="date-location">Facture établie le: ${formatDate(invoice.createdAt)}</div>

    ${invoice.title ? `
        <div class="object-line">
            <strong>Objet :</strong> ${invoice.title}
        </div>
    ` : ''}

    <table class="items-table">
        <colgroup>
            <col style="width:46%">
            <col style="width:10%">
            <col style="width:8%">
            <col style="width:14%">
            <col style="width:8%">
            <col style="width:7%">
            <col style="width:7%">
        </colgroup>
        <thead>
            <tr>
                <th class="libelle">LIBELLÉ</th>
                <th class="qte">QUANTITÉ</th>
                <th class="unite">UNITÉ</th>
                <th class="pu">PRIX UNITAIRE HT</th>
                <th class="tva">TVA</th>
                <th class="ajust">Ajust.</th>
                <th class="total">TOTAL €</th>
            </tr>
        </thead>
        <tbody>
            ${(() => {
                const rows = [];
                const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));
                const renderItem = (item) => {
                    const qty = Number(item.quantity || 0);
                    const pu = Number(item.unitPriceHt || 0);
                    const discount = Number(item.discountPercent || 0) / 100;
                    const markup = Number(item.markupPercent || 0) / 100;
                    const puNet = pu * (1 - discount) * (1 + markup);
                    const vatPct = (item.vatRate == null) ? '' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(item.vatRate)) + '%';
                    return `
                        <tr>
                            <td class="libelle">${item.description || ''}</td>
                            <td class="number">${qty.toLocaleString('fr-FR')}</td>
                            <td class="center">${item.unit || 'U'}</td>
                            <td class="number">${fmt(puNet)}</td>
                            <td class="number">${vatPct}</td>
                            <td class="center">${(item.discountPercent ? `-${Number(item.discountPercent)}%` : '')}${(item.discountPercent && item.markupPercent) ? ' / ' : ''}${(item.markupPercent ? `+${Number(item.markupPercent)}%` : '')}</td>
                            <td class="number">${fmt(item.totalHt)}</td>
                        </tr>`;
                };
                if (Array.isArray(invoice.sections) && invoice.sections.length) {
                    for (let i = 0; i < invoice.sections.length; i++) {
                        const sec = invoice.sections[i];
                        rows.push(`<tr><td colspan="7" style="font-weight:bold;color:#111;border-left:3px solid ${primaryColor};padding-left:8px;background:#f8f9fa;">${sec.title || ''}</td></tr>`);
                        if (sec.description) rows.push(`<tr><td colspan="7" style="color:#555;font-size:10px;padding-left:8px;">${sec.description}</td></tr>`);
                        // Rendre les lignes appartenant à cette section
                        const items = (invoice.items || []).filter(it => it.sectionId === sec.id);
                        for (const it of items) rows.push(renderItem(it));
                    }
                } else {
                    // Fallback: utiliser les items directement si pas de sections
                    for (const it of (invoice.items || [])) rows.push(renderItem(it));
                }
                return rows.join('');
            })()}
        </tbody>
    </table>

    <div class="totals-section">
        <table class="totals-table">
            <tr><td>Sous-total HT:</td><td class="text-right">${formatCurrency(invoice.subtotalHt)}</td></tr>
            ${Array.from(vatMap.entries()).filter(([_, amt]) => amt > 0).sort((a, b) => a[0] - b[0]).map(([rate, amt]) => `<tr><td>TVA ${rate}%:</td><td class=\"text-right\">${formatCurrency(amt)}</td></tr>`).join('')}
            <tr><td><strong>TVA totale:</strong></td><td class="text-right"><strong>${formatCurrency(invoice.totalVat)}</strong></td></tr>
            ${Number(invoice.paidAmount || 0) > 0 ? `<tr><td>Montant déjà réglé:</td><td class=\"text-right\">-${formatCurrency(invoice.paidAmount)}</td></tr>` : ''}
            <tr class="total-row"><td>Total TTC${Number(invoice.paidAmount || 0) > 0 ? ' — Reste à payer' : ''}:</td><td class="text-right">${formatCurrency(Math.max(0, Number(invoice.totalTtc || 0) - Number(invoice.paidAmount || 0)))}</td></tr>
        </table>
    </div>

    <div class=\"payment-info\" style=\"break-before: page; page-break-before: always;\">
        <div class=\"section-title\">Conditions et Paiement</div>
        <p style=\"font-size:12px; color:#333\"><strong>Échéance:</strong> ${formatDate(invoice.dueDate)}${companySettings.payment_terms ? ` — Paiement à ${companySettings.payment_terms} jours` : ''}</p>
        ${invoice.purchaseOrderNumber ? `<p style=\"font-size:12px; color:#333\"><strong>N° de bon de commande:</strong> ${invoice.purchaseOrderNumber}</p>` : ''}
        <p style=\"font-size:12px; color:#333\">Moyens: Chèque, Virement${companySettings.iban ? ` — <strong>IBAN:</strong> ${companySettings.iban}` : ''}${companySettings.bic ? ` — <strong>BIC:</strong> ${companySettings.bic}` : ''}${companySettings.bank_name ? ` — <strong>Banque:</strong> ${companySettings.bank_name}` : ''}</p>
        ${companySettings.payment_instructions ? `<p style=\"font-size:12px; color:#333\"><strong>Modalités:</strong> ${companySettings.payment_instructions}</p>` : ''}
        <p style=\"font-size:11px; color:#555; margin-top:8px;\"><em>${companySettings.late_fee_description || 'En cas de retard de paiement, des pénalités sont exigibles au taux légal en vigueur, ainsi qu\'une indemnité forfaitaire pour frais de recouvrement de 40€ (art. L441‑10 C. com.).'}</em></p>
        ${(companySettings.show_vat === false) ? `<p style=\"font-size:11px; color:#555; margin-top:4px;\"><em>TVA non applicable, article 293 B du CGI.</em></p>` : ''}
        ${invoice.reverse_charge_btp ? `<p style=\"font-size:11px; color:#555; margin-top:4px;\"><em>TVA en sus, autoliquidation par le client (art. 283-2 CGI)${invoice.client_vat_number ? ' - N° TVA client: ' + invoice.client_vat_number : ''}</em></p>` : ''}
        ${invoice.reduced_vat_applied ? `<p style=\"font-size:11px; color:#555; margin-top:4px;\"><em>TVA ${invoice.reduced_vat_rate}% - ${invoice.reduced_vat_justification || this.getReducedVATText(invoice.reduced_vat_rate, invoice.property_type, invoice.work_type)}</em></p>` : ''}
        ${invoice.is_b2c && invoice.withdrawal_applicable ? `<p style=\"font-size:11px; color:#555; margin-top:4px;\"><em>Droit de rétractation: ${companySettings.withdrawal_period_days || 14} jours à compter de la réception de la facture. ${companySettings.withdrawal_text || 'Pour exercer ce droit, contactez-nous par email ou courrier.'}</em></p>` : ''}
        ${companySettings.mediator_name ? `<p style=\"font-size:11px; color:#555; margin-top:4px;\"><em>Médiateur de la consommation: ${companySettings.mediator_name}${companySettings.mediator_website ? ' - ' + companySettings.mediator_website : ''}</em></p>` : ''}
    </div>

    ${invoice.notes ? `
        <div class="notes-section">
            <div class="section-title">Notes</div>
            <p>${invoice.notes}</p>
        </div>
    ` : ''}

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center;">
        <p>Merci pour votre confiance !</p>
        ${companySettings.document_footer ? `<p>${companySettings.document_footer}</p>` : ''}
    </div>
</body>
</html>`;
    }

    /**
     * Génère le texte de justification TVA réduite
     * @param {number} rate - Taux de TVA
     * @param {string} propertyType - Type de propriété
     * @param {string} workType - Type de travaux
     * @returns {string} - Texte de justification
     */
    getReducedVATText(rate, propertyType, workType) {
        if (rate === 10) {
            return 'Travaux de rénovation dans des locaux à usage d\'habitation achevés depuis plus de deux ans';
        } else if (rate === 5.5) {
            return 'Travaux d\'amélioration de la qualité énergétique des locaux à usage d\'habitation';
        }
        return 'TVA réduite applicable';
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = new PDFService();
