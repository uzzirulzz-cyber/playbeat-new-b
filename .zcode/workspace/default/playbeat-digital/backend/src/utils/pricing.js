/**
 * Server-side pricing. The client NEVER sets prices: every total is computed
 * here from database product data, the applied coupon and tax settings.
 */
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * @param {Array<{unitPrice:number, qty:number}>} items
 * @param {object|null} coupon  Mongoose Coupon document (already validated)
 * @param {number} taxPercent
 */
const computeTotals = (items, coupon, taxPercent = 0) => {
  const subtotal = round2(items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0));

  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percent') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }
    discount = round2(Math.min(discount, subtotal));
  }

  const taxable = Math.max(subtotal - discount, 0);
  const tax = round2((taxable * (taxPercent || 0)) / 100);
  const total = round2(taxable + tax);

  return { subtotal, discount, tax, total };
};

module.exports = { computeTotals, round2 };
