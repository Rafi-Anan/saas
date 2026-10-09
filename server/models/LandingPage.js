import mongoose from "mongoose";

const blockSchema = new mongoose.Schema({
  type: { type: String, required: true },
  props: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const landingPageSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, trim: true },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  video: { url: String, source: { type: String, enum: ["url", "device"] } },
  blocks: { type: [blockSchema], default: [] }
}, { timestamps: true });

landingPageSchema.index({ storeId: 1, slug: 1 }, { unique: true });

export default mongoose.model("LandingPage", landingPageSchema);
