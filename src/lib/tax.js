// International hotel tax handling: VAT/GST (percentage, can be
// tax-inclusive or exclusive of the quoted rate) + a separate city/tourism
// tax (common across much of Europe, charged per room-night, either a flat
// amount or a percentage — on top of VAT, not inside it).
//
// Property fields this reads (set in PropertySettings.jsx):
//   vat_rate: number (percent, e.g. 20 for 20%)
//   vat_inclusive: boolean — true if base_price already includes VAT
//   city_tax_type: 'none' | 'flat_per_night' | 'percent_per_night'
//   city_tax_amount: number (currency amount if flat, percent if percent)
//   tax_id: string — VAT/tax registration number, shown on invoices

export function calculateStayTax({ subtotal, nights, property }) {
  const vatRate = Number(property?.vat_rate) || 0;
  const vatInclusive = !!property?.vat_inclusive;
  const cityTaxType = property?.city_tax_type || 'none';
  const cityTaxAmount = Number(property?.city_tax_amount) || 0;

  // City/tourism tax is always additional, never folded into VAT.
  const cityTax = cityTaxType === 'flat_per_night'
    ? cityTaxAmount * (nights || 1)
    : cityTaxType === 'percent_per_night'
      ? subtotal * (cityTaxAmount / 100)
      : 0;

  let baseForVat = subtotal;
  let vat = 0;
  if (vatRate > 0) {
    if (vatInclusive) {
      // subtotal already includes VAT — back it out so we can show it
      // as a line item without changing the guest-facing total.
      baseForVat = subtotal / (1 + vatRate / 100);
      vat = subtotal - baseForVat;
    } else {
      vat = subtotal * (vatRate / 100);
    }
  }

  const total = vatInclusive
    ? subtotal + cityTax
    : subtotal + vat + cityTax;

  return {
    subtotal: vatInclusive ? baseForVat : subtotal,
    vat,
    vatRate,
    vatInclusive,
    cityTax,
    cityTaxType,
    total,
  };
}
