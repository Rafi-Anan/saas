import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", requireAuth, requireRole("owner", "manager", "analyst"), async (req, res, next) => {
  try {
    const orders = await Order.find({ storeId: req.store._id }).sort({ createdAt: -1 }).limit(5000);
    const revenue = orders
      .filter(o => !["Cancelled", "Returned", "Refunded"].includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);

    res.json({
      revenue,
      orders: orders.length,
      delivered: orders.filter(o => o.status === "Delivered").length,
      cancelled: orders.filter(o => o.status === "Cancelled").length,
      customers: await Customer.countDocuments({ storeId: req.store._id }),
      products: await Product.countDocuments({ storeId: req.store._id }),
      returned: orders.filter(order => order.status === "Returned").length,
      refunded: orders.filter(order => order.status === "Refunded").reduce((sum, order) => sum + order.total, 0),
      discounts: orders.reduce((sum, order) => sum + (order.discount || 0), 0),
      codSales: orders.filter(order => order.payment === "COD").reduce((sum, order) => sum + order.total, 0),
      prepaidSales: orders.filter(order => order.payment === "Prepaid").reduce((sum, order) => sum + order.total, 0)
    });
  } catch (e) { next(e); }
});

export default router;
