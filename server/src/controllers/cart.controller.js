import { asyncHandler } from '../utils/asyncHandler.js';
import { priceCart } from '../services/pricing.service.js';

// Live prices + stock for the cart page/drawer. Read-only: nothing is reserved here.
export const quote = asyncHandler(async (req, res) => {
  const q = await priceCart(req.body);
  res.json({ success: true, message: 'OK', data: q });
});
