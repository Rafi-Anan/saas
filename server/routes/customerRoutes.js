import express from "express";
import Customer from "../models/Customer.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const customers = await Customer.find({ storeId: req.store._id }).sort({ createdAt: -1 }).limit(500);
    res.json(customers.map(customer => {
      const success = customer.orders ? Math.round((customer.delivered / customer.orders) * 100) : 0;
      const risk = success >= 90 ? "Excellent" : success >= 70 ? "Good" : success >= 40 ? "Medium Risk" : "High Risk";
      return { ...customer.toObject(), success, risk };
    }));
  } catch (e) { next(e); }
});

export default router;
