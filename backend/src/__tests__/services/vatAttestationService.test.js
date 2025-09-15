// Mock des modules AVANT qu'ils soient chargés
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))

jest.mock('../../services/pdfService', () => {
  return jest.fn().mockImplementation(() => ({
    withPage: jest.fn(),
  }))
})

// Import des modules après les mocks
const vatAttestationService = require('../../services/vatAttestationService')
const { query } = require('../../config/database')
const PDFService = require('../../services/pdfService')

describe('VATAttestationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateVATAttestation', () => {
    it('should generate VAT attestation successfully', async () => {
      const attestationData = {
        userId: 'user123',
        invoiceId: 'invoice-1',
        clientId: 'client-1',
        vatRate: 10,
        justification:
          "Travaux de rénovation dans des locaux à usage d'habitation achevés depuis plus de deux ans",
        propertyType: 'residential',
        workType: 'renovation',
        workDescription: 'Travaux de peinture et rénovation',
        propertyAddress: '123 Test St, 75001 Paris',
        clientSignature: 'John Doe',
        clientName: 'John Doe',
        clientDate: '2023-01-15',
      }

      const mockAttestation = {
        id: 'attestation-1',
        user_id: 'user123',
        invoice_id: 'invoice-1',
        client_id: 'client-1',
        vat_rate: 10,
        justification:
          "Travaux de rénovation dans des locaux à usage d'habitation achevés depuis plus de deux ans",
        property_type: 'residential',
        work_type: 'renovation',
        work_description: 'Travaux de peinture et rénovation',
        property_address: '123 Test St, 75001 Paris',
        client_signature: 'John Doe',
        client_name: 'John Doe',
        client_date: '2023-01-15',
        created_at: new Date(),
      }

      const mockPdfBuffer = Buffer.from('fake pdf content')

      // Mock PDFService
      const mockPdfServiceInstance = {
        withPage: jest.fn().mockResolvedValue(mockPdfBuffer),
      }
      PDFService.mockReturnValue(mockPdfServiceInstance)

      query.mockResolvedValueOnce({ rows: [mockAttestation] })

      const result =
        await vatAttestationService.generateVATAttestation(attestationData)

      expect(result.success).toBe(true)
      expect(result.attestation).toMatchObject(mockAttestation)
      expect(result.pdfBuffer).toBe(mockPdfBuffer)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vat_attestations'),
        [
          'user123',
          'invoice-1',
          'client-1',
          10,
          "Travaux de rénovation dans des locaux à usage d'habitation achevés depuis plus de deux ans",
          'residential',
          'renovation',
          'Travaux de peinture et rénovation',
          '123 Test St, 75001 Paris',
          'John Doe',
          'John Doe',
          '2023-01-15',
          mockPdfBuffer,
        ]
      )
    })

    it('should handle database errors', async () => {
      const attestationData = {
        userId: 'user123',
        invoiceId: 'invoice-1',
        clientId: 'client-1',
        vatRate: 10,
        justification: 'Test justification',
        propertyType: 'residential',
        workType: 'renovation',
        workDescription: 'Test work',
        propertyAddress: 'Test address',
        clientSignature: 'John Doe',
        clientName: 'John Doe',
        clientDate: '2023-01-15',
      }

      const mockPdfBuffer = Buffer.from('fake pdf content')
      const mockPdfServiceInstance = {
        withPage: jest.fn().mockResolvedValue(mockPdfBuffer),
      }
      PDFService.mockReturnValue(mockPdfServiceInstance)

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        vatAttestationService.generateVATAttestation(attestationData)
      ).rejects.toThrow("Échec de la génération de l'attestation TVA")
    })
  })

  describe('generateAttestationPDF', () => {
    it('should generate attestation PDF successfully', async () => {
      const data = {
        vatRate: 10,
        justification: 'Test justification',
        propertyType: 'residential',
        workType: 'renovation',
        workDescription: 'Test work',
        propertyAddress: 'Test address',
        clientSignature: 'John Doe',
        clientName: 'John Doe',
        clientDate: '2023-01-15',
      }

      const mockPdfBuffer = Buffer.from('fake pdf content')
      const mockPage = {
        setContent: jest.fn().mockResolvedValue(),
        pdf: jest.fn().mockResolvedValue(mockPdfBuffer),
      }

      const mockPdfServiceInstance = {
        withPage: jest.fn().mockImplementation(async (callback) => {
          return await callback(mockPage)
        }),
      }
      PDFService.mockReturnValue(mockPdfServiceInstance)

      const result = await vatAttestationService.generateAttestationPDF(data)

      expect(result).toBe(mockPdfBuffer)
      expect(mockPage.setContent).toHaveBeenCalled()
      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      })
    })
  })

  describe('generateAttestationHTML', () => {
    it('should generate HTML for residential renovation', () => {
      const data = {
        vatRate: 10,
        justification: 'Test justification',
        propertyType: 'residential',
        workType: 'renovation',
        workDescription: 'Travaux de peinture et rénovation',
        propertyAddress: '123 Test St, 75001 Paris',
        clientSignature: 'John Doe',
        clientName: 'John Doe',
        clientDate: '2023-01-15',
      }

      const html = vatAttestationService.generateAttestationHTML(data)

      expect(html).toContain('ATTESTATION TVA RÉDUITE')
      expect(html).toContain('Taux de TVA 10%')
      expect(html).toContain('Travaux de rénovation')
      expect(html).toContain("à usage d'habitation")
      expect(html).toContain('Travaux de peinture et rénovation')
      expect(html).toContain('123 Test St, 75001 Paris')
      expect(html).toContain('John Doe')
      expect(html).toContain('2023-01-15')
    })

    it('should generate HTML for energy improvement', () => {
      const data = {
        vatRate: 5.5,
        justification: 'Test justification',
        propertyType: 'residential',
        workType: 'energy_improvement',
        workDescription: "Travaux d'isolation thermique",
        propertyAddress: '456 Energy St, 75002 Paris',
        clientSignature: 'Jane Smith',
        clientName: 'Jane Smith',
        clientDate: '2023-02-15',
      }

      const html = vatAttestationService.generateAttestationHTML(data)

      expect(html).toContain('Taux de TVA 5.5%')
      expect(html).toContain("d'amélioration de la qualité énergétique")
      expect(html).toContain("Travaux d'isolation thermique")
      expect(html).toContain('456 Energy St, 75002 Paris')
      expect(html).toContain('Jane Smith')
      expect(html).toContain('2023-02-15')
    })

    it('should handle missing optional fields', () => {
      const data = {
        vatRate: 10,
        justification: 'Test justification',
        propertyType: 'residential',
        workType: 'renovation',
        workDescription: null,
        propertyAddress: null,
        clientSignature: null,
        clientName: null,
        clientDate: null,
      }

      const html = vatAttestationService.generateAttestationHTML(data)

      expect(html).toContain('Taux de TVA 10%')
      expect(html).toContain('Non spécifiée')
      expect(html).toContain('Travaux de peinture et rénovation')
      expect(html).toContain('[Nom du client]')
    })

    it('should handle unknown property type', () => {
      const data = {
        vatRate: 10,
        justification: 'Test justification',
        propertyType: 'unknown_type',
        workType: 'renovation',
        workDescription: 'Test work',
        propertyAddress: 'Test address',
        clientSignature: 'John Doe',
        clientName: 'John Doe',
        clientDate: '2023-01-15',
      }

      const html = vatAttestationService.generateAttestationHTML(data)

      expect(html).toContain("à usage d'habitation") // Default fallback
    })

    it('should handle unknown work type', () => {
      const data = {
        vatRate: 10,
        justification: 'Test justification',
        propertyType: 'residential',
        workType: 'unknown_work',
        workDescription: 'Test work',
        propertyAddress: 'Test address',
        clientSignature: 'John Doe',
        clientName: 'John Doe',
        clientDate: '2023-01-15',
      }

      const html = vatAttestationService.generateAttestationHTML(data)

      expect(html).toContain('de rénovation') // Default fallback
    })

    it('should use default justification when none provided', () => {
      const data = {
        vatRate: 10,
        justification: null, // No justification provided
        propertyType: 'residential',
        workType: 'renovation',
        workDescription: 'Test work',
        propertyAddress: 'Test address',
        clientSignature: 'John Doe',
        clientName: 'John Doe',
        clientDate: '2023-01-15',
      }

      const html = vatAttestationService.generateAttestationHTML(data)

      expect(html).toContain("Conformément à l'article 279-0 bis") // Default justification
    })
  })

  describe('getDefaultJustification', () => {
    it('should return justification for 10% VAT', () => {
      const result = vatAttestationService.getDefaultJustification(
        10,
        'residential',
        'renovation'
      )
      expect(result).toContain('10%')
      expect(result).toContain('rénovation')
      expect(result).toContain("à usage d'habitation")
      expect(result).toContain('deux ans')
    })

    it('should return justification for 5.5% VAT', () => {
      const result = vatAttestationService.getDefaultJustification(
        5.5,
        'residential',
        'energy_improvement'
      )
      expect(result).toContain('5,5%')
      expect(result).toContain('qualité énergétique')
      expect(result).toContain("à usage d'habitation")
    })

    it('should return default justification for other rates', () => {
      const result = vatAttestationService.getDefaultJustification(
        8,
        'commercial',
        'maintenance'
      )
      expect(result).toBe(
        'Taux de TVA réduit applicable conformément à la réglementation en vigueur.'
      )
    })

    it('should handle commercial property type for 10% VAT', () => {
      const result = vatAttestationService.getDefaultJustification(
        10,
        'commercial',
        'renovation'
      )
      expect(result).toContain('à usage mixte')
      expect(result).toContain('rénovation')
    })

    it('should handle mixed property type for 10% VAT', () => {
      const result = vatAttestationService.getDefaultJustification(
        10,
        'mixed',
        'renovation'
      )
      expect(result).toContain('à usage mixte')
      expect(result).toContain('rénovation')
    })

    it('should handle maintenance work type for 10% VAT', () => {
      const result = vatAttestationService.getDefaultJustification(
        10,
        'residential',
        'maintenance'
      )
      expect(result).toContain("à usage d'habitation")
      expect(result).toContain('maintenance')
    })

    it('should handle commercial property type for 5.5% VAT', () => {
      const result = vatAttestationService.getDefaultJustification(
        5.5,
        'commercial',
        'energy_improvement'
      )
      expect(result).toContain('à usage mixte')
      expect(result).toContain('amélioration de la qualité énergétique')
    })

    it('should handle mixed property type for 5.5% VAT', () => {
      const result = vatAttestationService.getDefaultJustification(
        5.5,
        'mixed',
        'energy_improvement'
      )
      expect(result).toContain('à usage mixte')
      expect(result).toContain('amélioration de la qualité énergétique')
    })

    it('should handle other work type for 5.5% VAT', () => {
      const result = vatAttestationService.getDefaultJustification(
        5.5,
        'residential',
        'renovation'
      )
      expect(result).toContain("à usage d'habitation")
      expect(result).toContain('efficacité énergétique')
    })
  })

  describe('getAttestations', () => {
    it('should return all attestations for user', async () => {
      const userId = 'user123'
      const mockAttestations = [
        {
          id: 'attestation-1',
          user_id: userId,
          invoice_id: 'invoice-1',
          client_id: 'client-1',
          vat_rate: 10,
          property_type: 'residential',
          work_type: 'renovation',
          invoice_number: 'FAC-2023-0001',
          client_first_name: 'John',
          client_last_name: 'Doe',
          client_company: 'Test Company',
          created_at: new Date('2023-01-15'),
        },
        {
          id: 'attestation-2',
          user_id: userId,
          invoice_id: 'invoice-2',
          client_id: 'client-2',
          vat_rate: 5.5,
          property_type: 'residential',
          work_type: 'energy_improvement',
          invoice_number: 'FAC-2023-0002',
          client_first_name: 'Jane',
          client_last_name: 'Smith',
          client_company: 'Another Company',
          created_at: new Date('2023-02-15'),
        },
      ]

      query.mockResolvedValueOnce({ rows: mockAttestations })

      const result = await vatAttestationService.getAttestations(userId)

      expect(result).toHaveLength(2)
      expect(result[0].vat_rate).toBe(10)
      expect(result[1].vat_rate).toBe(5.5)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE va.user_id = $1'),
        [userId]
      )
    })

    it('should filter attestations by invoice ID', async () => {
      const userId = 'user123'
      const invoiceId = 'invoice-1'
      const mockAttestations = [
        {
          id: 'attestation-1',
          user_id: userId,
          invoice_id: invoiceId,
          client_id: 'client-1',
          vat_rate: 10,
          property_type: 'residential',
          work_type: 'renovation',
          invoice_number: 'FAC-2023-0001',
          client_first_name: 'John',
          client_last_name: 'Doe',
          client_company: 'Test Company',
          created_at: new Date('2023-01-15'),
        },
      ]

      query.mockResolvedValueOnce({ rows: mockAttestations })

      const result = await vatAttestationService.getAttestations(
        userId,
        invoiceId
      )

      expect(result).toHaveLength(1)
      expect(result[0].invoice_id).toBe(invoiceId)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND va.invoice_id = $2'),
        [userId, invoiceId]
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        vatAttestationService.getAttestations(userId)
      ).rejects.toThrow('Échec de la récupération des attestations')
    })
  })

  describe('getAttestationById', () => {
    it('should return attestation by ID', async () => {
      const attestationId = 'attestation-1'
      const userId = 'user123'
      const mockAttestation = {
        id: attestationId,
        user_id: userId,
        invoice_id: 'invoice-1',
        client_id: 'client-1',
        vat_rate: 10,
        property_type: 'residential',
        work_type: 'renovation',
        invoice_number: 'FAC-2023-0001',
        client_first_name: 'John',
        client_last_name: 'Doe',
        client_company: 'Test Company',
        created_at: new Date('2023-01-15'),
      }

      query.mockResolvedValueOnce({ rows: [mockAttestation] })

      const result = await vatAttestationService.getAttestationById(
        attestationId,
        userId
      )

      expect(result).toMatchObject(mockAttestation)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE va.id = $1 AND va.user_id = $2'),
        [attestationId, userId]
      )
    })

    it('should throw error if attestation not found', async () => {
      const attestationId = 'non-existent'
      const userId = 'user123'
      query.mockResolvedValueOnce({ rows: [] })

      await expect(
        vatAttestationService.getAttestationById(attestationId, userId)
      ).rejects.toThrow('Attestation non trouvée')
    })
  })
})
