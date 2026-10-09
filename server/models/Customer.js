import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  name: String,
  phone: { type: String, required: true, trim: true },
  email: String,
  addresses: [{ label: String, recipient: String, phone: String, address: String, city: String, postalCode: String, isDefault: Boolean }],
  address: String,
  orders: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  cancelled: { type: Number, default: 0 },
  returned: { type: Number, default: 0 },
  refunded: { type: Number, default: 0 },
  lastIpAddress: String,
  lastUserAgent: String,
  riskScore: { type: Number, default: 0 }
}, { timestamps: true });

customerSchema.index({ storeId: 1, phone: 1 }, { unique: true });

export default mongoose.model("Customer", customerSchema);
