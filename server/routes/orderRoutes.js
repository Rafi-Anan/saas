import express from "express";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Store from "../models/Store.js";
import LandingPage from "../models/LandingPage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { districts } from "../constants/districts.js";
import { sendOrderReceipt } from "../services/orderEmail.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json(await Order.find({ storeId: req.store._id }).sort({ createdAt: -1 }).limit(500));
  } catch (e) { next(e); }
});

router.post("/track", async (req, res, next) => {
  try {
    const orderNumber = String(req.body.orderNumber || "").trim();
    const phone = String(req.body.phone || "").trim();
    if (!orderNumber || !phone) return res.status(400).json({ message: "Order number and phone are required" });
    const order = await Order.findOne({ storeId: req.store._id, orderNumber, phone }).select("orderNumber status statusHistory payment paymentStatus total subtotal deliveryFee deliveryZone customer phone email address district items createdAt");
    if (!order) return res.status(404).json({ message: "No matching order found" });
    res.json(order);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const { customer, phone, address, items, payment = "COD", deliveryZone, district, landingPageId } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!customer?.trim() || !phone?.trim() || !address?.trim() || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Name, phone, address and at least one item are required" });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
    if (!items.every(item => item.productId && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0)) {
      return res.status(400).json({ message: "Each item needs a product and a positive whole-number quantity" });
    }

    const products = await Product.find({
      storeId: req.store._id,
      _id: { $in: items.map(item => item.productId) },
      status: "active"
    });
    if (products.length !== new Set(items.map(item => String(item.productId))).size) {
      return res.status(400).json({ message: "One or more products are unavailable" });
    }
    const productById = new Map(products.map(product => [String(product._id), product]));
    const orderItems = items.map(item => {
      const product = productById.get(String(item.productId));
      if (product.type !== "virtual" && product.stock < Number(item.quantity)) throw Object.assign(new Error(`${product.name} is out of stock`), { status: 409 });
      return { productId: product._id, name: product.name, quantity: Number(item.quantity), price: product.price, options: item.options };
    });
    const requiresDelivery = products.some(product => product.type !== "virtual");
    if (requiresDelivery && !["inside-dhaka", "outside-dhaka"].includes(deliveryZone)) {
      return res.status(400).json({ message: "Choose Inside Dhaka or Outside Dhaka delivery" });
    }
    if (landingPageId && requiresDelivery && !districts.includes(district)) return res.status(400).json({ message: "Choose a valid delivery district" });
    if (landingPageId && requiresDelivery && ((district === "Dhaka") !== (deliveryZone === "inside-dhaka"))) {
      return res.status(400).json({ message: "Choose the delivery option that matches your district" });
    }
    if (landingPageId) {
      const landingPage = await LandingPage.findOne({ _id: landingPageId, storeId: req.store._id, status: "published" }).select("productId");
      if (!landingPage || !items.some(item => String(item.productId) === String(landingPage.productId))) {
        return res.status(400).json({ message: "Landing page order must include its selected product" });
      }
    }
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = !requiresDelivery ? 0 : deliveryZone === "inside-dhaka" ? 80 : 150;
    const clientIp = req.ip;
    const existingCustomer = await Customer.findOne({ storeId: req.store._id, phone });
    const order = await Order.create({
      storeId: req.store._id,
      orderNumber: `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      customerId: existingCustomer?._id,
      customer: customer.trim(), phone: phone.trim(), email, address: address.trim(), district,
      landingPageId,
      items: orderItems, subtotal, deliveryFee, deliveryZone, total: subtotal + deliveryFee, payment,
      statusHistory: [{ status: "Pending", note: "Order placed" }],
      ipAddress: clientIp,
      source: landingPageId ? "landing-page" : "storefront",
      device: { userAgent: req.get("user-agent"), platform: req.get("sec-ch-ua-platform") }
    });

    const customerRecord = await Customer.findOneAndUpdate(
      { storeId: req.store._id, phone: phone.trim() },
      {
        $set: { name: customer.trim(), email, address: address.trim(), lastIpAddress: clientIp, lastUserAgent: req.get("user-agent") },
        $inc: { orders: 1, spent: subtotal + deliveryFee },
        $setOnInsert: { storeId: req.store._id, phone: phone.trim() }
      },
      { new: true, upsert: true, runValidators: true }
    );
    order.customerId = customerRecord._id;
    await order.save();
    await Promise.all(orderItems.filter(item => productById.get(String(item.productId)).type !== "virtual").map(item => Product.updateOne({ _id: item.productId, storeId: req.store._id }, { $inc: { stock: -item.quantity } })));

    let emailSent = false;
    if (email) {
      try { emailSent = (await sendOrderReceipt(order)).sent; }
      catch (emailError) { console.error("Order receipt email failed:", emailError.message); }
    }
    res.status(201).json({ ...order.toObject(), emailSent });
  } catch (e) { next(e); }
});

router.patch("/:id/status", requireAuth, requireRole("owner", "manager", "fulfillment"), async (req, res, next) => {
  try {
    const allowedStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned", "Refunded"];
    if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ message: "Invalid order status" });
    const previousOrder = await Order.findOne({ _id: req.params.id, storeId: req.store._id });
    if (!previousOrder) return res.status(404).json({ message: "Order not found" });
    if (previousOrder.status === req.body.status) return res.json(previousOrder);
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, storeId: req.store._id, status: previousOrder.status },
      { $set: { status: req.body.status }, $push: { statusHistory: { status: req.body.status, note: req.body.note || "Status updated" } } },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(409).json({ message: "Order status changed by another request. Refresh and retry." });
    const delta = status => Number(req.body.status === status) - Number(previousOrder.status === status);
    await Customer.updateOne({ storeId: req.store._id, phone: order.phone }, { $inc: { delivered: delta("Delivered"), cancelled: delta("Cancelled"), returned: delta("Returned") } });
    res.json(order);
  } catch (e) { next(e); }
});

router.patch("/:id/courier", requireAuth, requireRole("owner", "manager", "fulfillment"), async (req, res, next) => {
  try {
    const provider = String(req.body.provider || "");
    const store = await Store.findById(req.store._id).select("courierIntegrations");
    const integration = store?.courierIntegrations.find(item => item.provider === provider && item.enabled && item.credentialsEncrypted);
    if (!integration) return res.status(400).json({ message: "Configure and enable this courier in Store settings first" });
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, storeId: req.store._id },
      { $set: { "courier.provider": provider } },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) { next(error); }
});

export default router;
