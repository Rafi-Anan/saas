import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  passwordSalt: { type: String, required: true },
  role: { type: String, enum: ["pending", "admin", "owner", "manager", "fulfillment", "analyst"], default: "pending" },
  status: { type: String, enum: ["active", "disabled"], default: "active" },
  lastLoginAt: Date
}, { timestamps: true });

adminUserSchema.index({ storeId: 1, email: 1 }, { unique: true });

export default mongoose.model("AdminUser", adminUserSchema);