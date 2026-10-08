import { Order } from '../models/Order.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { startOfDaysAgoBD, dateKeyBD, DAY } from '../utils/time.js';

// "Valid" orders count towards revenue. Cancelled / failed / returned do not.
const INVALID = ['cancelled', 'failed', 'returned'];
const pct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

// Everything here is calculated from real orders — there is no placeholder data.
// (Conversion rate needs visitor tracking, which does not exist, so it is deliberately not shown.)
export const analytics = asyncHandler(async (req, res) => {
  const days = { '7d': 7, '30d': 30, '90d': 90 }[req.query.range];
  const start = startOfDaysAgoBD(days - 1);
  const prevStart = new Date(start.getTime() - days * DAY);
  const valid = { orderStatus: { $nin: INVALID } };
  const cur = { createdAt: { $gte: start } };
  const prev = { createdAt: { $gte: prevStart, $lt: start } };
  const totals = (range) => Order.aggregate([{ $match: { ...range, ...valid } }, { $group: { _id: null, revenue: { $sum: '$total' }, n: { $sum: 1 } } }]);

  const [curT, prevT, placed, daily, byStatus, byPayment, byProduct, districts, newCustomers, repeatCustomers] = await Promise.all([
    totals(cur),
    totals(prev),
    Order.countDocuments(cur),
    Order.aggregate([
      { $match: { ...cur, ...valid } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+06:00' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([{ $match: cur }, { $group: { _id: '$orderStatus', n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...cur, ...valid } }, { $group: { _id: '$paymentMethod', n: { $sum: 1 }, revenue: { $sum: '$total' } } }, { $sort: { n: -1 } }]),
    Order.aggregate([
      { $match: { ...cur, ...valid } }, { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
      { $sort: { revenue: -1 } }, { $limit: 200 },
    ]),
    Order.aggregate([{ $match: { ...cur, ...valid } }, { $group: { _id: '$customer.district', n: { $sum: 1 }, revenue: { $sum: '$total' } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
    Customer.countDocuments({ createdAt: { $gte: start } }),
    Customer.countDocuments({ orderCount: { $gte: 2 } }),
  ]);

  // one point per Bangladesh calendar day, including days with no sales
  const dayMap = new Map(daily.map((d) => [d._id, d]));
  const series = Array.from({ length: days }, (_, i) => {
    const key = dateKeyBD(start.getTime() + i * DAY + 1);
    const d = dayMap.get(key);
    return { date: key, orders: d?.orders || 0, revenue: d?.revenue || 0 };
  });

  // categories: join the top products to their category
  const prods = await Product.find({ _id: { $in: byProduct.map((p) => p._id).filter(Boolean) } }).select('category');
  const catOf = new Map(prods.map((p) => [String(p._id), String(p.category)]));
  const catTotals = new Map();
  for (const p of byProduct) {
    const c = catOf.get(String(p._id));
    if (!c) continue;
    const t = catTotals.get(c) || { qty: 0, revenue: 0 };
    catTotals.set(c, { qty: t.qty + p.qty, revenue: t.revenue + p.revenue });
  }
  const cats = await Category.find({ _id: { $in: [...catTotals.keys()] } }).select('name');
  const topCategories = cats
    .map((c) => ({ id: c._id, name: c.name, ...catTotals.get(String(c._id)) }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const revenue = curT[0]?.revenue || 0;
  const validOrders = curT[0]?.n || 0;
  const prevRevenue = prevT[0]?.revenue || 0;
  const prevOrders = prevT[0]?.n || 0;

  res.json({
    success: true, message: 'OK',
    data: {
      range: req.query.range, days,
      kpis: {
        revenue, revenueDelta: pct(revenue, prevRevenue),
        orders: validOrders, ordersDelta: pct(validOrders, prevOrders),
        placed,
        aov: validOrders ? Math.round(revenue / validOrders) : 0,
        newCustomers, repeatCustomers,
      },
      series,
      byStatus: byStatus.map((s) => ({ status: s._id, n: s.n })),
      byPayment: byPayment.map((p) => ({ method: p._id, n: p.n, revenue: p.revenue })),
      topProducts: byProduct.slice(0, 5).map((p) => ({ id: p._id, name: p.name, qty: p.qty, revenue: p.revenue })),
      topCategories,
      districts: districts.map((d) => ({ district: d._id, n: d.n, revenue: d.revenue })),
    },
  });
});
