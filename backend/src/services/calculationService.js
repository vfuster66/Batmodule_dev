class CalculationService {
  /**
   * Calcule les totaux pour un item de devis/facture
   * @param {Object} item - L'item à calculer
   * @returns {Object} - L'item avec les totaux calculés
   */
  calculateItemTotals(item) {
    const quantity = parseFloat(item.quantity) || 0
    const unitPriceHt = parseFloat(item.unitPriceHt) || 0
    const vatRate = parseFloat(item.vatRate) || 0
    const discountPercent =
      Math.max(0, Math.min(100, parseFloat(item.discountPercent ?? 0))) || 0
    const markupPercent =
      Math.max(
        0,
        Math.min(
          100,
          parseFloat(item.markupPercent ?? item.surchargePercent ?? 0)
        )
      ) || 0

    // Appliquer remise et/ou majoration sur le prix unitaire HT
    const unitPriceNetHt =
      unitPriceHt * (1 - discountPercent / 100) * (1 + markupPercent / 100)

    // Calcul du prix unitaire TTC
    const unitPriceTtc = unitPriceNetHt * (1 + vatRate / 100)

    // Calcul des totaux
    const totalHt = quantity * unitPriceNetHt
    const totalVat = totalHt * (vatRate / 100)
    const totalTtc = totalHt + totalVat

    return {
      ...item,
      unitPriceNetHt: Math.round(unitPriceNetHt * 100) / 100,
      unitPriceTtc: Math.round(unitPriceTtc * 100) / 100,
      totalHt: Math.round(totalHt * 100) / 100,
      totalVat: Math.round(totalVat * 100) / 100,
      totalTtc: Math.round(totalTtc * 100) / 100,
    }
  }

  /**
   * Calcule les totaux pour une liste d'items
   * @param {Array} items - Liste des items
   * @returns {Object} - Objet contenant les totaux et les items calculés
   */
  calculateTotals(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        items: [],
        subtotalHt: 0,
        totalVat: 0,
        totalTtc: 0,
      }
    }

    // Calculer les totaux pour chaque item
    const calculatedItems = items.map((item) => this.calculateItemTotals(item))

    // Calculer les totaux globaux
    const subtotalHt = calculatedItems.reduce(
      (sum, item) => sum + item.totalHt,
      0
    )
    const totalVat = calculatedItems.reduce(
      (sum, item) => sum + item.totalVat,
      0
    )
    const totalTtc = calculatedItems.reduce(
      (sum, item) => sum + item.totalTtc,
      0
    )

    return {
      items: calculatedItems,
      subtotalHt: Math.round(subtotalHt * 100) / 100,
      totalVat: Math.round(totalVat * 100) / 100,
      totalTtc: Math.round(totalTtc * 100) / 100,
    }
  }

  /**
   * Calcule les totaux pour un devis
   * @param {Object} quoteData - Données du devis
   * @returns {Object} - Devis avec les totaux calculés
   */
  calculateQuoteTotals(quoteData) {
    const calculations = this.calculateTotals(quoteData.items)

    return {
      ...quoteData,
      items: calculations.items,
      subtotalHt: calculations.subtotalHt,
      totalVat: calculations.totalVat,
      totalTtc: calculations.totalTtc,
    }
  }

  /**
   * Calcule les totaux pour une facture
   * @param {Object} invoiceData - Données de la facture
   * @returns {Object} - Facture avec les totaux calculés
   */
  calculateInvoiceTotals(invoiceData) {
    const calculations = this.calculateTotals(invoiceData.items)

    return {
      ...invoiceData,
      items: calculations.items,
      subtotalHt: calculations.subtotalHt,
      totalVat: calculations.totalVat,
      totalTtc: calculations.totalTtc,
    }
  }

  /**
   * Valide les données d'un item avant calcul
   * @param {Object} item - L'item à valider
   * @returns {Object} - Résultat de la validation
   */
  validateItem(item) {
    const errors = []

    if (!item.description || item.description.trim() === '') {
      errors.push('La description est obligatoire')
    }

    if (!item.quantity || parseFloat(item.quantity) <= 0) {
      errors.push('La quantité doit être supérieure à 0')
    }

    if (!item.unitPriceHt || parseFloat(item.unitPriceHt) < 0) {
      errors.push('Le prix unitaire HT doit être positif')
    }

    if (
      item.vatRate === undefined ||
      item.vatRate === null ||
      parseFloat(item.vatRate) < 0
    ) {
      errors.push('Le taux de TVA doit être défini et positif')
    }

    if (item.discountPercent !== undefined) {
      const d = parseFloat(item.discountPercent)
      if (isNaN(d) || d < 0 || d > 100) {
        errors.push('La remise (%) doit être comprise entre 0 et 100')
      }
    }

    if (
      item.markupPercent !== undefined ||
      item.surchargePercent !== undefined
    ) {
      const m = parseFloat(item.markupPercent ?? item.surchargePercent)
      if (isNaN(m) || m < 0 || m > 100) {
        errors.push('La majoration (%) doit être comprise entre 0 et 100')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Valide une liste d'items
   * @param {Array} items - Liste des items à valider
   * @returns {Object} - Résultat de la validation
   */
  validateItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        isValid: false,
        errors: ['Au moins un item est requis'],
      }
    }

    const allErrors = []
    items.forEach((item, index) => {
      const validation = this.validateItem(item)
      if (!validation.isValid) {
        validation.errors.forEach((error) => {
          allErrors.push(`Item ${index + 1}: ${error}`)
        })
      }
    })

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    }
  }

  /**
   * Calcule le montant restant à payer pour une facture
   * @param {Object} invoice - Données de la facture
   * @returns {number} - Montant restant à payer
   */
  calculateRemainingAmount(invoice) {
    const totalTtc = parseFloat(invoice.totalTtc) || 0
    const paidAmount = parseFloat(invoice.paidAmount) || 0
    return Math.round((totalTtc - paidAmount) * 100) / 100
  }

  /**
   * Détermine le statut de paiement d'une facture
   * @param {Object} invoice - Données de la facture
   * @returns {string} - Statut de paiement
   */
  getPaymentStatus(invoice) {
    const remainingAmount = this.calculateRemainingAmount(invoice)

    if (remainingAmount <= 0) {
      return 'paid'
    } else if (remainingAmount < parseFloat(invoice.totalTtc)) {
      return 'partially_paid'
    } else {
      return 'pending'
    }
  }
}

module.exports = new CalculationService()
