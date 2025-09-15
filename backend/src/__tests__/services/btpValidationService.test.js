const btpValidationService = require('../../services/btpValidationService')
const { query } = require('../../config/database')

// Mock database
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}))

describe('BTP Validation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateReverseChargeBTP', () => {
    it('should validate reverse charge BTP conditions', async () => {
      const params = {
        clientVatNumber: 'FR12345678901',
        clientIsVatRegistered: true,
        reverseChargeBtp: true,
      }

      const mockResult = {
        is_valid: true,
        error_messages: [],
      }

      query.mockResolvedValueOnce({
        rows: [{ validation_result: mockResult }],
      })

      const result = await btpValidationService.validateReverseChargeBTP(params)

      expect(result).toEqual(mockResult)
      expect(query).toHaveBeenCalledWith(
        'SELECT validate_reverse_charge_btp($1, $2, $3) as validation_result',
        ['FR12345678901', true, true]
      )
    })

    it('should handle validation errors', async () => {
      const params = {
        clientVatNumber: 'INVALID',
        clientIsVatRegistered: false,
        reverseChargeBtp: true,
      }

      const mockResult = {
        is_valid: false,
        error_messages: ['Numéro de TVA invalide'],
      }

      query.mockResolvedValueOnce({
        rows: [{ validation_result: mockResult }],
      })

      const result = await btpValidationService.validateReverseChargeBTP(params)

      expect(result).toEqual(mockResult)
    })

    it('should handle database errors', async () => {
      const params = {
        clientVatNumber: 'FR12345678901',
        clientIsVatRegistered: true,
        reverseChargeBtp: true,
      }

      const error = new Error('Database error')
      query.mockRejectedValueOnce(error)

      await expect(
        btpValidationService.validateReverseChargeBTP(params)
      ).rejects.toThrow('Database error')
    })
  })

  describe('validateReducedVAT', () => {
    it('should validate reduced VAT conditions', async () => {
      const params = {
        propertyType: 'residential',
        propertyAgeYears: 5,
        workType: 'renovation',
        reducedVatRate: 10,
      }

      const mockResult = {
        is_valid: true,
        error_messages: [],
      }

      query.mockResolvedValueOnce({
        rows: [{ validation_result: mockResult }],
      })

      const result = await btpValidationService.validateReducedVAT(params)

      expect(result).toEqual(mockResult)
      expect(query).toHaveBeenCalledWith(
        'SELECT validate_reduced_vat_conditions($1, $2, $3, $4) as validation_result',
        ['residential', 5, 'renovation', 10]
      )
    })

    it('should handle invalid reduced VAT conditions', async () => {
      const params = {
        propertyType: 'commercial',
        propertyAgeYears: 1,
        workType: 'maintenance',
        reducedVatRate: 5.5,
      }

      const mockResult = {
        is_valid: false,
        error_messages: [
          'TVA réduite non applicable pour ce type de propriété',
        ],
      }

      query.mockResolvedValueOnce({
        rows: [{ validation_result: mockResult }],
      })

      const result = await btpValidationService.validateReducedVAT(params)

      expect(result).toEqual(mockResult)
    })
  })

  describe('validateBTPConditions', () => {
    it('should validate all BTP conditions when both validations are needed', async () => {
      const invoiceData = {
        reverseChargeBtp: true,
        clientVatNumber: 'FR12345678901',
        clientIsVatRegistered: true,
        reducedVatApplied: true,
        propertyType: 'residential',
        propertyAgeYears: 5,
        workType: 'renovation',
        reducedVatRate: 10,
      }

      const btpResult = { is_valid: true, error_messages: [] }
      const vatResult = { is_valid: true, error_messages: [] }

      query
        .mockResolvedValueOnce({ rows: [{ validation_result: btpResult }] })
        .mockResolvedValueOnce({ rows: [{ validation_result: vatResult }] })

      const result =
        await btpValidationService.validateBTPConditions(invoiceData)

      expect(result.isValid).toBe(true)
      expect(result.validations.btp).toEqual(btpResult)
      expect(result.validations.vat).toEqual(vatResult)
      expect(result.errors).toEqual([])
    })

    it('should only validate BTP when reverseChargeBtp is true', async () => {
      const invoiceData = {
        reverseChargeBtp: true,
        clientVatNumber: 'FR12345678901',
        clientIsVatRegistered: true,
        reducedVatApplied: false,
      }

      const btpResult = { is_valid: true, error_messages: [] }

      query.mockResolvedValueOnce({
        rows: [{ validation_result: btpResult }],
      })

      const result =
        await btpValidationService.validateBTPConditions(invoiceData)

      expect(result.validations.btp).toEqual(btpResult)
      expect(result.validations.vat).toBeUndefined()
    })

    it('should only validate VAT when reducedVatApplied is true', async () => {
      const invoiceData = {
        reverseChargeBtp: false,
        reducedVatApplied: true,
        propertyType: 'residential',
        propertyAgeYears: 5,
        workType: 'renovation',
        reducedVatRate: 10,
      }

      const vatResult = { is_valid: true, error_messages: [] }

      query.mockResolvedValueOnce({
        rows: [{ validation_result: vatResult }],
      })

      const result =
        await btpValidationService.validateBTPConditions(invoiceData)

      expect(result.validations.btp).toBeUndefined()
      expect(result.validations.vat).toEqual(vatResult)
    })

    it('should return invalid when any validation fails', async () => {
      const invoiceData = {
        reverseChargeBtp: true,
        clientVatNumber: 'INVALID',
        clientIsVatRegistered: true,
        reducedVatApplied: true,
        propertyType: 'commercial',
        propertyAgeYears: 1,
        workType: 'maintenance',
        reducedVatRate: 5.5,
      }

      const btpResult = {
        is_valid: false,
        error_messages: ['BTP validation failed'],
      }
      const vatResult = {
        is_valid: false,
        error_messages: ['VAT validation failed'],
      }

      query
        .mockResolvedValueOnce({ rows: [{ validation_result: btpResult }] })
        .mockResolvedValueOnce({ rows: [{ validation_result: vatResult }] })

      const result =
        await btpValidationService.validateBTPConditions(invoiceData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toEqual([
        'BTP validation failed',
        'VAT validation failed',
      ])
    })
  })

  describe('generateWarnings', () => {
    it('should generate warning for missing VAT number with BTP reverse charge', () => {
      const invoiceData = {
        reverseChargeBtp: true,
        clientVatNumber: null,
      }

      const warnings = btpValidationService.generateWarnings(invoiceData)

      expect(warnings).toContain(
        'Autoliquidation BTP activée mais numéro de TVA client manquant'
      )
    })

    it('should generate warning for commercial property with reduced VAT', () => {
      const invoiceData = {
        reducedVatApplied: true,
        propertyType: 'commercial',
      }

      const warnings = btpValidationService.generateWarnings(invoiceData)

      expect(warnings).toContain(
        'TVA réduite généralement non applicable aux locaux commerciaux'
      )
    })

    it('should generate warning for new property with reduced VAT', () => {
      const invoiceData = {
        reducedVatApplied: true,
        propertyAgeYears: 1,
        reducedVatRate: 10,
      }

      const warnings = btpValidationService.generateWarnings(invoiceData)

      expect(warnings).toContain(
        'TVA 10% : Vérifiez que le logement a plus de 2 ans'
      )
    })

    it('should not generate warnings for valid data', () => {
      const invoiceData = {
        reverseChargeBtp: true,
        clientVatNumber: 'FR12345678901',
        reducedVatApplied: true,
        propertyType: 'residential',
        propertyAgeYears: 5,
      }

      const warnings = btpValidationService.generateWarnings(invoiceData)

      expect(warnings).toEqual([])
    })
  })

  describe('calculateApplicableVATRate', () => {
    it('should calculate normal VAT rate by default', async () => {
      const invoiceData = {
        reverseChargeBtp: false,
        reducedVatApplied: false,
      }

      const result =
        await btpValidationService.calculateApplicableVATRate(invoiceData)

      expect(result.rate).toBe(20.0)
      expect(result.justification).toBe('TVA au taux normal (20%)')
      expect(result.isReverseCharge).toBe(false)
      expect(result.isReducedRate).toBe(false)
    })

    it('should calculate reverse charge VAT rate', async () => {
      const invoiceData = {
        reverseChargeBtp: true,
        clientVatNumber: 'FR12345678901',
        clientIsVatRegistered: true,
        reducedVatApplied: false,
      }

      const btpResult = { is_valid: true, error_messages: [] }
      query.mockResolvedValueOnce({ rows: [{ validation_result: btpResult }] })

      const result =
        await btpValidationService.calculateApplicableVATRate(invoiceData)

      expect(result.rate).toBe(0.0)
      expect(result.justification).toBe(
        'TVA en sus, autoliquidation par le client (art. 283-2 CGI)'
      )
      expect(result.isReverseCharge).toBe(true)
      expect(result.isReducedRate).toBe(false)
      expect(result.conditions).toContain('Client assujetti à la TVA')
      expect(result.conditions).toContain('Autoliquidation BTP activée')
    })

    it('should calculate reduced VAT rate for 10%', async () => {
      const invoiceData = {
        reverseChargeBtp: false,
        reducedVatApplied: true,
        propertyType: 'residential',
        propertyAgeYears: 5,
        workType: 'renovation',
        reducedVatRate: 10,
      }

      const vatResult = { is_valid: true, error_messages: [] }
      query.mockResolvedValueOnce({ rows: [{ validation_result: vatResult }] })

      const result =
        await btpValidationService.calculateApplicableVATRate(invoiceData)

      expect(result.rate).toBe(10)
      expect(result.justification).toContain('TVA 10% - Travaux de rénovation')
      expect(result.isReverseCharge).toBe(false)
      expect(result.isReducedRate).toBe(true)
      expect(result.conditions).toContain("Logement d'habitation")
      expect(result.conditions).toContain('Achevés depuis plus de 2 ans')
      expect(result.conditions).toContain('Travaux de rénovation')
    })

    it('should calculate reduced VAT rate for 5.5%', async () => {
      const invoiceData = {
        reverseChargeBtp: false,
        reducedVatApplied: true,
        propertyType: 'residential',
        propertyAgeYears: 5,
        workType: 'energy_improvement',
        reducedVatRate: 5.5,
      }

      const vatResult = { is_valid: true, error_messages: [] }
      query.mockResolvedValueOnce({ rows: [{ validation_result: vatResult }] })

      const result =
        await btpValidationService.calculateApplicableVATRate(invoiceData)

      expect(result.rate).toBe(5.5)
      expect(result.justification).toContain(
        "TVA 5,5% - Travaux d'amélioration de la qualité énergétique"
      )
      expect(result.isReverseCharge).toBe(false)
      expect(result.isReducedRate).toBe(true)
      expect(result.conditions).toContain("Logement d'habitation")
      expect(result.conditions).toContain("Travaux d'amélioration énergétique")
    })

    it('should prioritize reverse charge over reduced VAT', async () => {
      const invoiceData = {
        reverseChargeBtp: true,
        clientVatNumber: 'FR12345678901',
        clientIsVatRegistered: true,
        reducedVatApplied: true,
        propertyType: 'residential',
        propertyAgeYears: 5,
        workType: 'renovation',
        reducedVatRate: 10,
      }

      const btpResult = { is_valid: true, error_messages: [] }
      query.mockResolvedValueOnce({ rows: [{ validation_result: btpResult }] })

      const result =
        await btpValidationService.calculateApplicableVATRate(invoiceData)

      expect(result.rate).toBe(0.0)
      expect(result.isReverseCharge).toBe(true)
      expect(result.isReducedRate).toBe(false)
    })
  })

  describe('getBTPValidationStats', () => {
    it('should return BTP validation stats for user', async () => {
      const userId = 'user123'
      const mockStats = {
        total_invoices: '10',
        reverse_charge_count: '3',
        reduced_vat_count: '5',
        btp_validated_count: '8',
        vat_validated_count: '7',
        avg_vat_rate: '15.5',
      }

      query.mockResolvedValueOnce({ rows: [mockStats] })

      const result = await btpValidationService.getBTPValidationStats(userId)

      expect(result.totalInvoices).toBe(10)
      expect(result.reverseChargeInvoices).toBe(3)
      expect(result.reducedVATInvoices).toBe(5)
      expect(result.btpValidatedInvoices).toBe(8)
      expect(result.vatValidatedInvoices).toBe(7)
      expect(result.averageVATRate).toBe(15.5)
      expect(result.period).toEqual({ startDate: null, endDate: null })
    })

    it('should return BTP validation stats for date range', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      const mockStats = {
        total_invoices: '5',
        reverse_charge_count: '2',
        reduced_vat_count: '3',
        btp_validated_count: '4',
        vat_validated_count: '3',
        avg_vat_rate: '12.0',
      }

      query.mockResolvedValueOnce({ rows: [mockStats] })

      const result = await btpValidationService.getBTPValidationStats(
        userId,
        startDate,
        endDate
      )

      expect(result.totalInvoices).toBe(5)
      expect(result.period).toEqual({ startDate, endDate })
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND created_at BETWEEN $2 AND $3'),
        [userId, startDate, endDate]
      )
    })

    it('should handle empty stats', async () => {
      const userId = 'user123'
      const mockStats = {
        total_invoices: '0',
        reverse_charge_count: '0',
        reduced_vat_count: '0',
        btp_validated_count: '0',
        vat_validated_count: '0',
        avg_vat_rate: null,
      }

      query.mockResolvedValueOnce({ rows: [mockStats] })

      const result = await btpValidationService.getBTPValidationStats(userId)

      expect(result.totalInvoices).toBe(0)
      expect(result.averageVATRate).toBe(20.0) // Default value when null
    })
  })

  describe('module exports', () => {
    it('should export btpValidationService instance', () => {
      expect(btpValidationService).toBeDefined()
      expect(typeof btpValidationService).toBe('object')
    })
  })
})
