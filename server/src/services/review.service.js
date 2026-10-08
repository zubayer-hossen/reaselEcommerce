import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';

export async function refreshProductRating(productId) {
  const [stats] = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { $set: { ratingAvg: stats ? Math.round(stats.avg * 10) / 10 : 0, ratingCount: stats?.count || 0 } }
  );
}

export async function refreshRatings(productIds) {
  for (const id of new Set(productIds.map(String))) await refreshProductRating(id);
}
