import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true },
  options: [{ type: String }]
}, { _id: false });

const productSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  compareAt: Number,
  category: String,
  type: { type: String, enum: ["simple", "virtual", "variable"], default: "simple" },
  stock: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["active", "draft"], default: "active" },
  image: { type: String, required: true },
  media: [{ url: String, type: { type: String, enum: ["image", "video"], default: "image" }, alt: String }],
  attributes: [{ name: String, values: [String] }],
  tags: [{ type: String, trim: true, maxlength: 40 }],
  variants: [variantSchema]
}, { timestamps: true });

productSchema.index({ storeId: 1, slug: 1 }, { unique: true });
productSchema.index({ storeId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Product", productSchema);
