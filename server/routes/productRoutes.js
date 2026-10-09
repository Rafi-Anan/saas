import express from "express";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import Product from "../models/Product.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
const uploadDirectory = fileURLToPath(new URL("../uploads/", import.meta.url));
fs.mkdirSync(uploadDirectory, { recursive: true });
const imageTypes = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/avif", ".avif"]]);
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, done) => done(null, `${crypto.randomUUID()}${imageTypes.get(file.mimetype) || ".img"}`)
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, done) => imageTypes.has(file.mimetype) ? done(null, true) : done(new Error("Use JPEG, PNG, WebP, or AVIF images"))
});

router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find({ storeId: req.store._id, status: "active" }).sort({ createdAt: -1 });
    res.json(products);
  } catch (e) { next(e); }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const product = await Product.findOne({ storeId: req.store._id, slug: req.params.slug, status: "active" });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (e) { next(e); }
});

router.post("/images", requireAuth, requireRole("owner", "manager"), (req, res, next) => {
  upload.array("images", 8)(req, res, error => {
    if (error) return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Each image must be 8 MB or smaller" : error.message });
    if (!req.files?.length) return res.status(400).json({ message: "Choose at least one image" });
    const origin = `${req.protocol}://${req.get("host")}`;
    res.status(201).json(req.files.map(file => ({ url: `${origin}/uploads/${file.filename}`, name: file.originalname, size: file.size })));
  });
});

router.post("/", requireAuth, requireRole("owner", "manager"), async (req, res, next) => {
  try {
    const { name, slug, price, image, type = "simple", variants = [], tags = [] } = req.body;
    if (!String(name || "").trim() || !String(slug || "").trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "Product title, URL slug, and a valid price are required" });
    }
    if (!String(image || "").trim()) return res.status(400).json({ message: "A primary product image is required" });
    if (!/^https?:\/\//i.test(String(image).trim())) return res.status(400).json({ message: "Primary image must use an HTTP or HTTPS URL" });
    if (!["simple", "virtual", "variable"].includes(type)) return res.status(400).json({ message: "Choose simple, virtual, or variable product type" });
    if (type === "variable" && (!Array.isArray(variants) || !variants.some(variant => variant.label === "Color" && variant.options?.length) || !variants.some(variant => variant.label === "Size" && variant.options?.length))) {
      return res.status(400).json({ message: "Variable products need at least one color and one size" });
    }
    const media = Array.isArray(req.body.media) ? req.body.media : [];
    if (media.some(item => !item?.url || !/^https?:\/\//i.test(String(item.url)))) {
      return res.status(400).json({ message: "Additional images must use HTTP or HTTPS URLs" });
    }
    const product = await Product.create({
      ...req.body,
      name: String(name).trim(),
      slug: String(slug).trim().toLowerCase(),
      price: Number(price),
      image: String(image).trim(),
      variants: type === "variable" ? variants : [],
      tags: Array.isArray(tags) ? [...new Set(tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean))].slice(0, 20) : [],
      media: [{ url: String(image).trim(), type: "image", alt: String(name).trim() }, ...media.filter(item => item?.url && item.url !== image)],
      storeId: req.store._id
    });
    res.status(201).json(product);
  } catch (e) { next(e); }
});

router.put("/:id", requireAuth, requireRole("owner", "manager"), async (req, res, next) => {
  try {
    const { storeId, _id, ...updates } = req.body;
    const product = await Product.findOneAndUpdate({ _id: req.params.id, storeId: req.store._id }, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (e) { next(e); }
});

router.delete("/:id", requireAuth, requireRole("owner", "manager"), async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, storeId: req.store._id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (e) { next(e); }
});

export default router;
