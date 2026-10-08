// Aggregation expressions shared by products, dashboard and analytics.
// Total stock = sum of variant stock when the product has variants, otherwise the product's own stock.
export const TOTAL_STOCK = { $cond: [{ $gt: [{ $size: { $ifNull: ['$variants', []] } }, 0] }, { $sum: '$variants.stock' }, '$stock'] };
// Effective price: sale price only counts when it is a real discount.
export const PRICE = { $cond: [{ $and: [{ $gt: ['$salePrice', 0] }, { $lt: ['$salePrice', '$regularPrice'] }] }, '$salePrice', '$regularPrice'] };
