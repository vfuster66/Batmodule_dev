/**
 * Utilitaires pour mapper les données de facture entre snake_case et camelCase
 */

/**
 * Mappe les données d'une facture du format snake_case vers camelCase
 * @param {Object} invoice - Données de la facture en snake_case
 * @param {Array} items - Items de la facture
 * @param {Array} sections - Sections de la facture
 * @returns {Object} - Données mappées en camelCase
 */
function mapInvoiceToCamelCase(invoice, items = [], sections = []) {
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
      markupPercent: item.markup_percent ? parseFloat(item.markup_percent) : 0,
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
      // Fallback : si address_line1 n'existe pas, utiliser address
      addressLine1: invoice.address_line1 || invoice.address,
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

module.exports = {
  mapInvoiceToCamelCase,
}
