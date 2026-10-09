import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  orderNumber: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  customer: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: String,
  district: String,
  landingPageId: { type: mongoose.Schema.Types.ObjectId, ref: "LandingPage" },
  device: { userAgent: String, platform: String },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    quantity: Number,
    price: Number,
    options: mongoose.Schema.Types.Mixed
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  deliveryZone: { type: String, enum: ["inside-dhaka", "outside-dhaka"] },
  total: { type: Number, required: true },
  payment: { type: String, enum: ["COD", "Prepaid"], default: "COD" },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed", "Refunded"], default: "Pending" },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned", "Refunded"],
    default: "Pending"
  },
  statusHistory: [{ status: String, note: String, changedAt: { type: Date, default: Date.now } }],
  courier: { provider: String, trackingId: String, trackingUrl: String },
  ipAddress: String,
  source: { type: String, enum: ["storefront", "landing-page", "admin"], default: "storefront" }
}, { timestamps: true });

orderSchema.index({ storeId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ storeId: 1, status: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, phone: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
