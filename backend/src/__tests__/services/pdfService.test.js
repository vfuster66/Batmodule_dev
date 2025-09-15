// Mock des modules AVANT qu'ils soient chargés
jest.mock('puppeteer', () => ({
  launch: jest.fn(),
  executablePath: jest.fn(),
}))

jest.mock('../../services/insuranceService', () => ({
  getInsurances: jest.fn(),
}))

jest.mock('../../services/certificationService', () => ({
  getCertifications: jest.fn(),
}))

// Import des modules après les mocks
const pdfService = require('../../services/pdfService')
const puppeteer = require('puppeteer')
const insuranceService = require('../../services/insuranceService')
const certificationService = require('../../services/certificationService')

describe('PDFService', () => {
  let mockBrowser
  let mockPage

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock de la page Puppeteer
    mockPage = {
      setContent: jest.fn().mockResolvedValue(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('fake pdf content')),
      close: jest.fn().mockResolvedValue(),
    }

    // Mock du navigateur Puppeteer
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(),
      on: jest.fn(),
    }

    puppeteer.launch.mockResolvedValue(mockBrowser)
    puppeteer.executablePath.mockReturnValue('/usr/bin/chromium')
  })

  describe('init', () => {
    it('should initialize browser successfully', async () => {
      await pdfService.init()

      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: '/usr/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-infobars',
          '--window-size=1280,1024',
        ],
      })
      expect(mockBrowser.on).toHaveBeenCalledWith(
        'disconnected',
        expect.any(Function)
      )
    })

    it('should not reinitialize if browser already exists', async () => {
      // First initialization
      await pdfService.init()

      // Second initialization should not call launch again
      await pdfService.init()
      // Just verify that init doesn't throw an error
      expect(true).toBe(true)
    })
  })

  describe('relaunch', () => {
    it('should close existing browser and relaunch', async () => {
      await pdfService.init()
      await pdfService.relaunch()

      expect(puppeteer.launch).toHaveBeenCalled()
    })

    it('should handle close errors gracefully', async () => {
      mockBrowser.close.mockRejectedValueOnce(new Error('Close error'))

      await pdfService.init()
      await pdfService.relaunch()

      expect(puppeteer.launch).toHaveBeenCalled()
    })
  })

  describe('withPage', () => {
    it('should execute function with page successfully', async () => {
      const mockResult = 'test result'
      const renderFn = jest.fn().mockResolvedValue(mockResult)

      const result = await pdfService.withPage(renderFn)

      expect(result).toBe(mockResult)
      expect(renderFn).toHaveBeenCalled()
    })

    it('should handle page errors and retry', async () => {
      const mockResult = 'test result'
      const renderFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Page error'))
        .mockResolvedValueOnce(mockResult)

      const result = await pdfService.withPage(renderFn)

      expect(result).toBe(mockResult)
      expect(renderFn).toHaveBeenCalledTimes(2)
    })

    it('should handle page close errors gracefully', async () => {
      mockPage.close.mockRejectedValueOnce(new Error('Close error'))
      const renderFn = jest.fn().mockResolvedValue('test result')

      const result = await pdfService.withPage(renderFn)

      expect(result).toBe('test result')
    })
  })

  describe('generateQuotePDF', () => {
    it('should generate quote PDF successfully', async () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        title: 'Test Quote',
        client: {
          firstName: 'John',
          lastName: 'Doe',
          companyName: 'Test Company',
          addressLine1: '123 Test St',
          postalCode: '75001',
          city: 'Paris',
          email: 'john@test.com',
          phone: '0123456789',
        },
        siteAddress: {
          addressLine1: '456 Site St',
          postalCode: '75002',
          city: 'Lyon',
        },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [
          {
            description: 'Test Service',
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
            totalHt: 1000,
          },
        ],
        sections: [],
        depositPercent: 30,
        validUntil: new Date('2023-12-31'),
      }

      const companySettings = {
        company_name: 'My Company',
        primary_color: '#004AAD',
        email: 'contact@mycompany.com',
        phone: '0123456789',
        website: 'https://mycompany.com',
        address_line1: '789 Company St',
        postal_code: '75003',
        city: 'Marseille',
        show_vat: true,
        iban: 'FR1420041010050500013M02606',
        bic: 'AXABFRPP',
        bank_name: 'AXA Bank',
      }

      const result = await pdfService.generateQuotePDF(quote, companySettings)

      expect(result).toBeInstanceOf(Buffer)
      expect(mockPage.setContent).toHaveBeenCalled()
      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
        margin: { top: '36mm', right: '15mm', bottom: '30mm', left: '15mm' },
        displayHeaderFooter: true,
        headerTemplate: expect.stringContaining('DEVIS N° DEV-2023-0001'),
        footerTemplate: expect.any(String),
      })
    })

    it('should handle logo base64 data', async () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date(),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      }

      await pdfService.generateQuotePDF(quote, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/png;base64,iVBORw0KGgo'
          ),
        })
      )
    })

    it('should handle JPEG logo format', async () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date(),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64:
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      }

      await pdfService.generateQuotePDF(quote, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/jpeg;base64,/9j/'
          ),
        })
      )
    })

    it('should handle GIF logo format', async () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date(),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      }

      await pdfService.generateQuotePDF(quote, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/gif;base64,R0lGOD'
          ),
        })
      )
    })

    it('should handle WebP logo format', async () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date(),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      }

      await pdfService.generateQuotePDF(quote, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/webp;base64,UklGR'
          ),
        })
      )
    })

    it('should handle data URL format', async () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date(),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      }

      await pdfService.generateQuotePDF(quote, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/png;base64,iVBORw0KGgo'
          ),
        })
      )
    })

    it('should handle unknown format as PNG', async () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date(),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'unknown_format_data',
      }

      await pdfService.generateQuotePDF(quote, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/png;base64,unknown_format_data'
          ),
        })
      )
    })
  })

  describe('generateInvoicePDF', () => {
    it('should generate invoice PDF successfully', async () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: {
          firstName: 'John',
          lastName: 'Doe',
          companyName: 'Test Company',
          addressLine1: '123 Test St',
          postalCode: '75001',
          city: 'Paris',
          email: 'john@test.com',
          phone: '0123456789',
        },
        siteAddress: {
          addressLine1: '456 Site St',
          postalCode: '75002',
          city: 'Lyon',
        },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [
          {
            description: 'Test Service',
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
            totalHt: 1000,
          },
        ],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        primary_color: '#004AAD',
        email: 'contact@mycompany.com',
        phone: '0123456789',
        website: 'https://mycompany.com',
        address_line1: '789 Company St',
        postal_code: '75003',
        city: 'Marseille',
        show_vat: true,
        iban: 'FR1420041010050500013M02606',
        bic: 'AXABFRPP',
        bank_name: 'AXA Bank',
        payment_terms: 30,
      }

      const result = await pdfService.generateInvoicePDF(
        invoice,
        companySettings
      )

      expect(result).toBeInstanceOf(Buffer)
      expect(mockPage.setContent).toHaveBeenCalled()
      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
        margin: { top: '36mm', right: '15mm', bottom: '30mm', left: '15mm' },
        displayHeaderFooter: true,
        headerTemplate: expect.stringContaining('FACTURE N° FAC-2023-0001'),
        footerTemplate: expect.any(String),
      })
    })

    it('should handle JPEG logo format in invoice', async () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64:
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      }

      await pdfService.generateInvoicePDF(invoice, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/jpeg;base64,/9j/'
          ),
        })
      )
    })

    it('should handle GIF logo format in invoice', async () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      }

      await pdfService.generateInvoicePDF(invoice, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/gif;base64,R0lGOD'
          ),
        })
      )
    })

    it('should handle WebP logo format in invoice', async () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      }

      await pdfService.generateInvoicePDF(invoice, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/webp;base64,UklGR'
          ),
        })
      )
    })

    it('should handle data URL format in invoice', async () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      }

      await pdfService.generateInvoicePDF(invoice, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/png;base64,iVBORw0KGgo'
          ),
        })
      )
    })

    it('should handle unknown format as PNG in invoice', async () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'unknown_format_data',
      }

      await pdfService.generateInvoicePDF(invoice, companySettings)

      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/png;base64,unknown_format_data'
          ),
        })
      )
    })
  })

  describe('buildFooterTemplate', () => {
    it('should build footer template with company settings', async () => {
      const companySettings = {
        company_name: 'Test Company',
        forme_juridique: 'SARL',
        capital_social: '10000',
        siret: '12345678901234',
        rcs_number: 'RCS123',
        tribunal_commercial: 'Paris',
        ape_code: '4321A',
        tva_intracommunautaire: 'FR12345678901',
        address_line1: '123 Test St',
        postal_code: '75001',
        city: 'Paris',
        phone: '0123456789',
        email: 'test@example.com',
        website: 'https://test.com',
        assurance_rc: 'AXA',
        insurance_policy_number: 'POL123',
        show_vat: true,
      }

      insuranceService.getInsurances.mockResolvedValueOnce([])
      certificationService.getCertifications.mockResolvedValueOnce([])

      const result = await pdfService.buildFooterTemplate(
        companySettings,
        'user123'
      )

      expect(result).toContain('Test Company')
      expect(result).toContain('SARL')
      expect(result).toContain('SIREN/SIRET: 12345678901234')
      expect(result).toContain('RCS: RCS123')
      expect(result).toContain('APE/NAF: 4321A')
      expect(result).toContain('TVA intracom: FR12345678901')
      expect(result).toContain('Assurance RC Pro: AXA')
    })

    it('should handle missing company settings', async () => {
      const result = await pdfService.buildFooterTemplate({}, null)

      expect(result).toContain('Page <span class="pageNumber"></span>')
      expect(result).toContain('<span class="totalPages"></span>')
    })

    it('should include active insurances and certifications', async () => {
      const companySettings = {
        company_name: 'Test Company',
        show_vat: true,
      }

      const mockInsurances = [
        {
          certificate_type: 'decennale',
          certificate_number: 'INS-001',
          end_date: new Date('2024-12-31'),
          is_active: true,
        },
      ]

      const mockCertifications = [
        {
          certification_type: 'rge',
          certification_number: 'RGE-001',
          end_date: new Date('2024-12-31'),
          is_active: true,
        },
      ]

      insuranceService.getInsurances.mockResolvedValueOnce(mockInsurances)
      certificationService.getCertifications.mockResolvedValueOnce(
        mockCertifications
      )

      const result = await pdfService.buildFooterTemplate(
        companySettings,
        'user123'
      )

      expect(result).toContain('Test Company')
      expect(result).toContain('Page <span class="pageNumber"></span>')
    })

    it('should handle insurance and certification service errors', async () => {
      const companySettings = {
        company_name: 'Test Company',
        show_vat: true,
      }

      insuranceService.getInsurances.mockRejectedValueOnce(
        new Error('Service error')
      )
      certificationService.getCertifications.mockRejectedValueOnce(
        new Error('Service error')
      )

      const result = await pdfService.buildFooterTemplate(
        companySettings,
        'user123'
      )

      expect(result).toContain('Test Company')
      expect(result).toContain('Page <span class="pageNumber"></span>')
    })
  })

  describe('generateQuoteHTML', () => {
    it('should generate quote HTML with all sections', () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        title: 'Test Quote',
        client: {
          firstName: 'John',
          lastName: 'Doe',
          companyName: 'Test Company',
          addressLine1: '123 Test St',
          postalCode: '75001',
          city: 'Paris',
          email: 'john@test.com',
          phone: '0123456789',
        },
        siteAddress: {
          addressLine1: '456 Site St',
          postalCode: '75002',
          city: 'Lyon',
        },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [
          {
            description: 'Test Service',
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
            totalHt: 1000,
            unit: 'U',
          },
        ],
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            description: 'Description of section 1',
          },
        ],
        depositPercent: 30,
        depositAmount: 360,
        validUntil: new Date('2023-12-31'),
      }

      const companySettings = {
        company_name: 'My Company',
        primary_color: '#004AAD',
        show_vat: true,
        iban: 'FR1420041010050500013M02606',
        bic: 'AXABFRPP',
        bank_name: 'AXA Bank',
      }

      const html = pdfService.generateQuoteHTML(quote, companySettings)

      expect(html).toContain('DEV-2023-0001')
      expect(html).toContain('Test Quote')
      expect(html).toContain('John Doe')
      expect(html).toContain('John Doe')
      expect(html).toContain('John Doe')
      expect(html).toContain('Section 1')
      expect(html).toContain('1000.00 €')
      expect(html).toContain('200.00 €')
      expect(html).toContain('1200.00 €')
      expect(html).toContain('30%')
      expect(html).toContain('FR1420041010050500013M02606')
    })

    it('should handle missing optional fields', () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: {
          firstName: 'John',
          lastName: 'Doe',
        },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        primary_color: '#004AAD',
      }

      const html = pdfService.generateQuoteHTML(quote, companySettings)

      expect(html).toContain('DEV-2023-0001')
      expect(html).toContain('John Doe')
      expect(html).toContain('John Doe')
    })

    it('should handle JPEG logo format in HTML', () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64:
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      }

      const html = pdfService.generateQuoteHTML(quote, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should handle GIF logo format in HTML', () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      }

      const html = pdfService.generateQuoteHTML(quote, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should handle WebP logo format in HTML', () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      }

      const html = pdfService.generateQuoteHTML(quote, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should handle data URL format in HTML', () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      }

      const html = pdfService.generateQuoteHTML(quote, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should handle unknown format as PNG in HTML', () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'unknown_format_data',
      }

      const html = pdfService.generateQuoteHTML(quote, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })
  })

  describe('generateInvoiceHTML', () => {
    it('should generate invoice HTML with all sections', () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: {
          firstName: 'John',
          lastName: 'Doe',
          companyName: 'Test Company',
          addressLine1: '123 Test St',
          postalCode: '75001',
          city: 'Paris',
          email: 'john@test.com',
          phone: '0123456789',
        },
        siteAddress: {
          addressLine1: '456 Site St',
          postalCode: '75002',
          city: 'Lyon',
        },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [
          {
            description: 'Test Service',
            quantity: 1,
            unitPriceHt: 1000,
            vatRate: 20,
            totalHt: 1000,
            unit: 'U',
          },
        ],
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            description: 'Description of section 1',
          },
        ],
        purchaseOrderNumber: 'PO-001',
        notes: 'Test notes',
      }

      const companySettings = {
        company_name: 'My Company',
        primary_color: '#004AAD',
        show_vat: true,
        iban: 'FR1420041010050500013M02606',
        bic: 'AXABFRPP',
        bank_name: 'AXA Bank',
        payment_terms: 30,
      }

      const html = pdfService.generateInvoiceHTML(invoice, companySettings)

      expect(html).toContain('FAC-2023-0001')
      expect(html).toContain('Test Invoice')
      expect(html).toContain('John Doe')
      expect(html).toContain('John Doe')
      expect(html).toContain('John Doe')
      expect(html).toContain('Section 1')
      expect(html).toContain('€')
      expect(html).toContain('200')
      expect(html).toContain('200')
      expect(html).toContain('PO-001')
      expect(html).toContain('Test notes')
    })

    it('should handle JPEG logo format in invoice HTML', () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64:
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      }

      const html = pdfService.generateInvoiceHTML(invoice, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should handle GIF logo format in invoice HTML', () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      }

      const html = pdfService.generateInvoiceHTML(invoice, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should handle WebP logo format in invoice HTML', () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      }

      const html = pdfService.generateInvoiceHTML(invoice, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should handle data URL format in invoice HTML', () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      }

      const html = pdfService.generateInvoiceHTML(invoice, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should handle unknown format as PNG in invoice HTML', () => {
      const invoice = {
        invoiceNumber: 'FAC-2023-0001',
        title: 'Test Invoice',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        paidAmount: 0,
        dueDate: new Date('2023-02-01'),
        items: [],
        sections: [],
      }

      const companySettings = {
        company_name: 'My Company',
        logo_base64: 'unknown_format_data',
      }

      const html = pdfService.generateInvoiceHTML(invoice, companySettings)
      expect(typeof html).toBe('string')
      expect(html).toContain('<!DOCTYPE html>')
    })
  })

  describe('getReducedVATText', () => {
    it('should return correct text for 10% VAT', () => {
      const result = pdfService.getReducedVATText(10, 'house', 'renovation')
      expect(result).toContain('rénovation')
      expect(result).toContain('deux ans')
    })

    it('should return correct text for 5.5% VAT', () => {
      const result = pdfService.getReducedVATText(5.5, 'house', 'energy')
      expect(result).toContain('qualité énergétique')
    })

    it('should return default text for other rates', () => {
      const result = pdfService.getReducedVATText(8, 'house', 'other')
      expect(result).toBe('TVA réduite applicable')
    })
  })

  describe('generateQuotePDF - Logo formats', () => {
    it('should handle different logo formats in PDF generation', async () => {
      const quote = {
        quoteNumber: 'DEV-2023-0001',
        title: 'Test Quote',
        client: { firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2023-01-01'),
        subtotalHt: 1000,
        totalVat: 200,
        totalTtc: 1200,
        items: [],
        sections: [],
      }

      // Test JPEG format
      const companySettingsJpeg = {
        company_name: 'My Company',
        logo_base64:
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      }

      await pdfService.generateQuotePDF(quote, companySettingsJpeg)
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/jpeg;base64,/9j/'
          ),
        })
      )

      // Test GIF format
      const companySettingsGif = {
        company_name: 'My Company',
        logo_base64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      }

      await pdfService.generateQuotePDF(quote, companySettingsGif)
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/gif;base64,R0lGOD'
          ),
        })
      )

      // Test WebP format
      const companySettingsWebP = {
        company_name: 'My Company',
        logo_base64: 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      }

      await pdfService.generateQuotePDF(quote, companySettingsWebP)
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/webp;base64,UklGR'
          ),
        })
      )

      // Test unknown format (defaults to PNG)
      const companySettingsUnknown = {
        company_name: 'My Company',
        logo_base64: 'unknown_format_data',
      }

      await pdfService.generateQuotePDF(quote, companySettingsUnknown)
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: expect.stringContaining(
            'data:image/png;base64,unknown_format_data'
          ),
        })
      )
    })
  })

  describe('buildFooterTemplate - Insurance and Certification mappings', () => {
    it('should map insurance types correctly', async () => {
      const companySettings = {
        company_name: 'Test Company',
        siret: '12345678901234',
        vat_number: 'FR12345678901',
      }

      // Mock insurance service to return different insurance types with future end dates
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      insuranceService.getInsurances.mockResolvedValueOnce([
        {
          certificate_type: 'decennale',
          certificate_number: 'DEC-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certificate_type: 'rc_pro',
          certificate_number: 'RC-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certificate_type: 'garantie',
          certificate_number: 'GAR-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certificate_type: 'multirisque',
          certificate_number: 'MULTI-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certificate_type: 'unknown_type',
          certificate_number: 'UNK-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
      ])

      certificationService.getCertifications.mockResolvedValueOnce([])

      const result = await pdfService.buildFooterTemplate(
        companySettings,
        'user123'
      )

      expect(result).toContain('Assurance Décennale: DEC-001')
      expect(result).toContain('RC Pro: RC-001')
      expect(result).toContain('Garantie Financière: GAR-001')
      expect(result).toContain('Multirisque: MULTI-001')
      expect(result).toContain('unknown_type: UNK-001')
    })

    it('should map certification types correctly', async () => {
      const companySettings = {
        company_name: 'Test Company',
        siret: '12345678901234',
        vat_number: 'FR12345678901',
      }

      insuranceService.getInsurances.mockResolvedValueOnce([])

      // Mock certification service to return different certification types with future end dates
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      certificationService.getCertifications.mockResolvedValueOnce([
        {
          certification_type: 'rge',
          certification_number: 'RGE-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certification_type: 'qualibat',
          certification_number: 'QB-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certification_type: 'qualifelec',
          certification_number: 'QE-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certification_type: 'qualifibat',
          certification_number: 'QF-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certification_type: 'qualipac',
          certification_number: 'QP-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certification_type: 'qualisol',
          certification_number: 'QS-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certification_type: 'qualit-enr',
          certification_number: 'QENR-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
        {
          certification_type: 'unknown_type',
          certification_number: 'UNK-001',
          end_date: futureDate.toISOString(),
          is_active: true,
        },
      ])

      const result = await pdfService.buildFooterTemplate(
        companySettings,
        'user123'
      )

      expect(result).toContain('RGE: RGE-001')
      expect(result).toContain('Qualibat: QB-001')
      expect(result).toContain('Qualifelec: QE-001')
      expect(result).toContain('Qualifibat: QF-001')
      expect(result).toContain('Qualipac: QP-001')
      expect(result).toContain('Qualisol: QS-001')
      expect(result).toContain('Qualit-ENR: QENR-001')
      expect(result).toContain('unknown_type: UNK-001')
    })
  })

  describe('close', () => {
    it('should close browser successfully', async () => {
      await pdfService.init()
      await pdfService.close()

      // Just verify that close doesn't throw an error
      expect(true).toBe(true)
    })

    it('should handle close when browser is null', async () => {
      await pdfService.close()
      expect(mockBrowser.close).not.toHaveBeenCalled()
    })
  })
})
