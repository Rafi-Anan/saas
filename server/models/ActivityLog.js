import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  action: { type: String, required: true },
  resource: String,
  statusCode: Number,
  ipAddress: String
}, { timestamps: true });

activityLogSchema.index({ storeId: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);