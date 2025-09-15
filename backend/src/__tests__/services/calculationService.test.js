const calculationService = require('../../services/calculationService')

describe('CalculationService', () => {
  describe('calculateItemTotals', () => {
    it('should calculate totals for a basic item', () => {
      const item = {
        quantity: 2,
        unitPriceHt: 100,
        vatRate: 20,
        discountPercent: 0,
        markupPercent: 0,
      }

      const result = calculationService.calculateItemTotals(item)

      expect(result.unitPriceNetHt).toBe(100)
      expect(result.unitPriceTtc).toBe(120)
      expect(result.totalHt).toBe(200)
      expect(result.totalVat).toBe(40)
      expect(result.totalTtc).toBe(240)
    })

    it('should apply discount correctly', () => {
      const item = {
        quantity: 1,
        unitPriceHt: 100,
        vatRate: 20,
        discountPercent: 10,
        markupPercent: 0,
      }

      const result = calculationService.calculateItemTotals(item)

      expect(result.unitPriceNetHt).toBe(90)
      expect(result.unitPriceTtc).toBe(108)
      expect(result.totalHt).toBe(90)
      expect(result.totalVat).toBe(18)
      expect(result.totalTtc).toBe(108)
    })

    it('should apply markup correctly', () => {
      const item = {
        quantity: 1,
        unitPriceHt: 100,
        vatRate: 20,
        discountPercent: 0,
        markupPercent: 15,
      }

      const result = calculationService.calculateItemTotals(item)

      expect(result.unitPriceNetHt).toBe(115)
      expect(result.unitPriceTtc).toBe(138)
      expect(result.totalHt).toBe(115)
      expect(result.totalVat).toBe(23)
      expect(result.totalTtc).toBe(138)
    })

    it('should apply both discount and markup correctly', () => {
      const item = {
        quantity: 1,
        unitPriceHt: 100,
        vatRate: 20,
        discountPercent: 10,
        markupPercent: 15,
      }

      const result = calculationService.calculateItemTotals(item)

      // 100 * (1 - 0.1) * (1 + 0.15) = 100 * 0.9 * 1.15 = 103.5
      expect(result.unitPriceNetHt).toBe(103.5)
      expect(result.unitPriceTtc).toBe(124.2)
      expect(result.totalHt).toBe(103.5)
      expect(result.totalVat).toBe(20.7)
      expect(result.totalTtc).toBe(124.2)
    })

    it('should handle zero values', () => {
      const item = {
        quantity: 0,
        unitPriceHt: 0,
        vatRate: 0,
        discountPercent: 0,
        markupPercent: 0,
      }

      const result = calculationService.calculateItemTotals(item)

      expect(result.unitPriceNetHt).toBe(0)
      expect(result.unitPriceTtc).toBe(0)
      expect(result.totalHt).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.totalTtc).toBe(0)
    })

    it('should handle invalid values gracefully', () => {
      const item = {
        quantity: 'invalid',
        unitPriceHt: 'invalid',
        vatRate: 'invalid',
        discountPercent: 'invalid',
        markupPercent: 'invalid',
      }

      const result = calculationService.calculateItemTotals(item)

      expect(result.unitPriceNetHt).toBe(0)
      expect(result.unitPriceTtc).toBe(0)
      expect(result.totalHt).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.totalTtc).toBe(0)
    })

    it('should clamp discount and markup percentages', () => {
      const item = {
        quantity: 1,
        unitPriceHt: 100,
        vatRate: 20,
        discountPercent: 150, // Should be clamped to 100
        markupPercent: -50, // Should be clamped to 0
      }

      const result = calculationService.calculateItemTotals(item)

      // 100 * (1 - 1) * (1 + 0) = 0
      expect(result.unitPriceNetHt).toBe(0)
      expect(result.unitPriceTtc).toBe(0)
      expect(result.totalHt).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.totalTtc).toBe(0)
    })

    it('should use surchargePercent as fallback for markupPercent', () => {
      const item = {
        quantity: 1,
        unitPriceHt: 100,
        vatRate: 20,
        discountPercent: 0,
        surchargePercent: 10, // Should be used instead of markupPercent
      }

      const result = calculationService.calculateItemTotals(item)

      expect(result.unitPriceNetHt).toBe(110)
      expect(result.unitPriceTtc).toBe(132)
      expect(result.totalHt).toBe(110)
      expect(result.totalVat).toBe(22)
      expect(result.totalTtc).toBe(132)
    })

    it('should round values to 2 decimal places', () => {
      const item = {
        quantity: 3,
        unitPriceHt: 33.333,
        vatRate: 20,
        discountPercent: 0,
        markupPercent: 0,
      }

      const result = calculationService.calculateItemTotals(item)

      expect(result.unitPriceNetHt).toBe(33.33)
      expect(result.unitPriceTtc).toBe(40)
      expect(result.totalHt).toBe(100) // 33.33 * 3 = 99.99, rounded to 100
      expect(result.totalVat).toBe(20)
      expect(result.totalTtc).toBe(120)
    })
  })

  describe('calculateTotals', () => {
    it('should calculate totals for multiple items', () => {
      const items = [
        {
          quantity: 2,
          unitPriceHt: 100,
          vatRate: 20,
          discountPercent: 0,
          markupPercent: 0,
        },
        {
          quantity: 1,
          unitPriceHt: 50,
          vatRate: 10,
          discountPercent: 0,
          markupPercent: 0,
        },
      ]

      const result = calculationService.calculateTotals(items)

      expect(result.items).toHaveLength(2)
      expect(result.subtotalHt).toBe(250)
      expect(result.totalVat).toBe(45)
      expect(result.totalTtc).toBe(295)
    })

    it('should return empty totals for empty array', () => {
      const result = calculationService.calculateTotals([])

      expect(result.items).toEqual([])
      expect(result.subtotalHt).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.totalTtc).toBe(0)
    })

    it('should return empty totals for null input', () => {
      const result = calculationService.calculateTotals(null)

      expect(result.items).toEqual([])
      expect(result.subtotalHt).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.totalTtc).toBe(0)
    })

    it('should return empty totals for undefined input', () => {
      const result = calculationService.calculateTotals(undefined)

      expect(result.items).toEqual([])
      expect(result.subtotalHt).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.totalTtc).toBe(0)
    })

    it('should return empty totals for non-array input', () => {
      const result = calculationService.calculateTotals('not an array')

      expect(result.items).toEqual([])
      expect(result.subtotalHt).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.totalTtc).toBe(0)
    })
  })

  describe('validateItem', () => {
    it('should validate a correct item', () => {
      const item = {
        description: 'Test item',
        quantity: 2,
        unitPriceHt: 100,
        vatRate: 20,
      }

      const result = calculationService.validateItem(item)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject item with missing description', () => {
      const item = {
        quantity: 2,
        unitPriceHt: 100,
        vatRate: 20,
      }

      const result = calculationService.validateItem(item)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La description est obligatoire')
    })

    it('should reject item with invalid quantity', () => {
      const item = {
        description: 'Test item',
        quantity: 0,
        unitPriceHt: 100,
        vatRate: 20,
      }

      const result = calculationService.validateItem(item)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La quantité doit être supérieure à 0')
    })

    it('should reject item with invalid unit price', () => {
      const item = {
        description: 'Test item',
        quantity: 2,
        unitPriceHt: -10,
        vatRate: 20,
      }

      const result = calculationService.validateItem(item)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Le prix unitaire HT doit être positif')
    })

    it('should reject item with invalid VAT rate', () => {
      const item = {
        description: 'Test item',
        quantity: 2,
        unitPriceHt: 100,
        vatRate: -5,
      }

      const result = calculationService.validateItem(item)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Le taux de TVA doit être défini et positif'
      )
    })

    it('should validate discount percent', () => {
      const item = {
        description: 'Test item',
        quantity: 2,
        unitPriceHt: 100,
        vatRate: 20,
        discountPercent: 150, // Invalid: > 100
      }

      const result = calculationService.validateItem(item)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'La remise (%) doit être comprise entre 0 et 100'
      )
    })

    it('should validate markup percent', () => {
      const item = {
        description: 'Test item',
        quantity: 2,
        unitPriceHt: 100,
        vatRate: 20,
        markupPercent: -10, // Invalid: < 0
      }

      const result = calculationService.validateItem(item)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'La majoration (%) doit être comprise entre 0 et 100'
      )
    })

    it('should validate surcharge percent', () => {
      const item = {
        description: 'Test item',
        quantity: 2,
        unitPriceHt: 100,
        vatRate: 20,
        surchargePercent: 150, // Invalid: > 100
      }

      const result = calculationService.validateItem(item)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'La majoration (%) doit être comprise entre 0 et 100'
      )
    })
  })

  describe('validateItems', () => {
    it('should validate multiple items successfully', () => {
      const items = [
        {
          description: 'Item 1',
          quantity: 2,
          unitPriceHt: 100,
          vatRate: 20,
        },
        {
          description: 'Item 2',
          quantity: 1,
          unitPriceHt: 50,
          vatRate: 10,
        },
      ]

      const result = calculationService.validateItems(items)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should return error for empty items array', () => {
      const result = calculationService.validateItems([])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Au moins un item est requis')
    })

    it('should return error for non-array input', () => {
      const result = calculationService.validateItems(null)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Au moins un item est requis')
    })

    it('should collect errors from multiple invalid items', () => {
      const items = [
        {
          description: '', // Invalid: empty description
          quantity: 2,
          unitPriceHt: 100,
          vatRate: 20,
        },
        {
          description: 'Item 2',
          quantity: 0, // Invalid: zero quantity
          unitPriceHt: 50,
          vatRate: 10,
        },
      ]

      const result = calculationService.validateItems(items)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Item 1: La description est obligatoire')
      expect(result.errors).toContain(
        'Item 2: La quantité doit être supérieure à 0'
      )
    })
  })

  describe('calculateRemainingAmount', () => {
    it('should calculate remaining amount correctly', () => {
      const invoice = {
        totalTtc: 1000,
        paidAmount: 300,
      }

      const result = calculationService.calculateRemainingAmount(invoice)

      expect(result).toBe(700)
    })

    it('should handle zero paid amount', () => {
      const invoice = {
        totalTtc: 1000,
        paidAmount: 0,
      }

      const result = calculationService.calculateRemainingAmount(invoice)

      expect(result).toBe(1000)
    })

    it('should handle overpayment', () => {
      const invoice = {
        totalTtc: 1000,
        paidAmount: 1200,
      }

      const result = calculationService.calculateRemainingAmount(invoice)

      expect(result).toBe(-200)
    })

    it('should handle missing values', () => {
      const invoice = {}

      const result = calculationService.calculateRemainingAmount(invoice)

      expect(result).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      const invoice = {
        totalTtc: 1000.123,
        paidAmount: 300.456,
      }

      const result = calculationService.calculateRemainingAmount(invoice)

      expect(result).toBe(699.67)
    })
  })

  describe('getPaymentStatus', () => {
    it('should return paid status', () => {
      const invoice = {
        totalTtc: 1000,
        paidAmount: 1000,
      }

      const result = calculationService.getPaymentStatus(invoice)

      expect(result).toBe('paid')
    })

    it('should return paid status for overpayment', () => {
      const invoice = {
        totalTtc: 1000,
        paidAmount: 1200,
      }

      const result = calculationService.getPaymentStatus(invoice)

      expect(result).toBe('paid')
    })

    it('should return partially_paid status', () => {
      const invoice = {
        totalTtc: 1000,
        paidAmount: 500,
      }

      const result = calculationService.getPaymentStatus(invoice)

      expect(result).toBe('partially_paid')
    })

    it('should return pending status', () => {
      const invoice = {
        totalTtc: 1000,
        paidAmount: 0,
      }

      const result = calculationService.getPaymentStatus(invoice)

      expect(result).toBe('pending')
    })

    it('should handle missing values', () => {
      const invoice = {}

      const result = calculationService.getPaymentStatus(invoice)

      expect(result).toBe('paid') // 0 - 0 = 0, so remaining <= 0
    })
  })

  describe('calculateQuoteTotals', () => {
    it('should calculate basic quote totals', () => {
      const quote = {
        items: [
          {
            quantity: 2,
            unitPriceHt: 100,
            vatRate: 20,
            discountPercent: 0,
            markupPercent: 0,
          },
        ],
      }

      const result = calculationService.calculateQuoteTotals(quote)

      expect(result.subtotalHt).toBe(200)
      expect(result.totalVat).toBe(40)
      expect(result.totalTtc).toBe(240)
      expect(result.items).toHaveLength(1)
    })

    it('should handle empty items', () => {
      const quote = {
        items: [],
      }

      const result = calculationService.calculateQuoteTotals(quote)

      expect(result.subtotalHt).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.totalTtc).toBe(0)
      expect(result.items).toEqual([])
    })
  })

  describe('calculateInvoiceTotals', () => {
    it('should calculate basic invoice totals', () => {
      const invoice = {
        items: [
          {
            quantity: 2,
            unitPriceHt: 100,
            vatRate: 20,
            discountPercent: 0,
            markupPercent: 0,
          },
        ],
      }

      const result = calculationService.calculateInvoiceTotals(invoice)

      expect(result.subtotalHt).toBe(200)
      expect(result.totalVat).toBe(40)
      expect(result.totalTtc).toBe(240)
      expect(result.items).toHaveLength(1)
    })

    it('should handle empty items', () => {
      const invoice = {
        items: [],
      }

      const result = calculationService.calculateInvoiceTotals(invoice)

      expect(result.subtotalHt).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.totalTtc).toBe(0)
      expect(result.items).toEqual([])
    })
  })
})
