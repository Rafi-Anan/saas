import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 120 },
  subtitle: { type: String, trim: true, maxlength: 240 },
  mediaType: { type: String, enum: ["image", "video"], default: "image" },
  mediaUrl: { type: String, trim: true },
  image: { type: String, trim: true },
  link: { type: String, default: "/shop" },
  buttonLabel: { type: String, default: "Shop now", maxlength: 40 },
  active: { type: Boolean, default: true },
  position: { type: Number, default: 0 }
}, { _id: true });

const navigationLinkSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true, maxlength: 40 },
  href: { type: String, required: true, trim: true, maxlength: 240 },
  active: { type: Boolean, default: true },
  position: { type: Number, default: 0 }
}, { _id: true });

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true, trim: true },
  domains: [{ type: String, lowercase: true, trim: true }],
  currency: { type: String, default: "BDT" },
  timezone: { type: String, default: "Asia/Dhaka" },
  banners: { type: [bannerSchema], default: [] },
  navigationLinks: { type: [navigationLinkSchema], default: [] },
  courierIntegrations: [{
    provider: { type: String, enum: ["steadfast", "pathao", "redx", "paperfly", "ecourier"] },
    enabled: { type: Boolean, default: false },
    credentialsEncrypted: String,
    updatedAt: Date
  }],
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ["active", "suspended"], default: "active" }
}, { timestamps: true });

storeSchema.index({ slug:  1 }, { unique: true });
storeSchema.index({ domains: 1 }, { unique: true, sparse: true });

export default mongoose.model("Store", storeSchema);