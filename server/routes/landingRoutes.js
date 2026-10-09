import express from "express";
import crypto from "crypto";
import fs from "fs";
import multer from "multer";
import LandingPage from "../models/LandingPage.js";
import Product from "../models/Product.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { fileURLToPath } from "url";

const router = express.Router();
const uploadDirectory = fileURLToPath(new URL("../uploads/", import.meta.url));
fs.mkdirSync(uploadDirectory, { recursive: true });
const videoTypes = new Map([["video/mp4", ".mp4"], ["video/webm", ".webm"]]);
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, done) => done(null, `${crypto.randomUUID()}${videoTypes.get(file.mimetype) || ".video"}`)
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, done) => videoTypes.has(file.mimetype) ? done(null, true) : done(new Error("Use an MP4 or WebM video"))
});

router.get("/", requireAuth, async (req, res, next) => {
  try { res.json(await LandingPage.find({ storeId: req.store._id }).sort({ createdAt: -1 })); }
  catch (e) { next(e); }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const page = await LandingPage.findOne({ storeId: req.store._id, slug: req.params.slug, status: "published" })
      .populate({ path: "productId", match: { storeId: req.store._id, status: "active" } });
    if (!page || !page.productId) return res.status(404).json({ message: "Landing page not found" });
    res.json(page);
  } catch (e) { next(e); }
});

router.post("/media", requireAuth, requireRole("owner", "manager"), (req, res) => {
  videoUpload.single("video")(req, res, error => {
    if (error) return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Video must be 50 MB or smaller" : error.message });
    if (!req.file) return res.status(400).json({ message: "Choose an MP4 or WebM video" });
    res.status(201).json({ url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`, name: req.file.originalname });
  });
});

router.post("/", requireAuth, requireRole("owner", "manager"), async (req, res, next) => {
  try {
    const { title, slug, productId, blocks = [], video } = req.body;
    if (!title?.trim() || !slug?.trim() || !productId) return res.status(400).json({ message: "Title, URL slug, and a store product are required" });
    if (!Array.isArray(blocks) || blocks.length > 40) return res.status(400).json({ message: "Landing pages support up to 40 sections" });
    if (video?.url && !/^https?:\/\//i.test(video.url) && !/^\/uploads\/[a-z\d-]+\.(mp4|webm)$/i.test(video.url)) {
      return res.status(400).json({ message: "Video must be an HTTP(S) URL or a video uploaded to this store" });
    }
    const product = await Product.findOne({ _id: productId, storeId: req.store._id, status: "active" }).select("_id");
    if (!product) return res.status(400).json({ message: "Choose an active product from this store" });
    const page = await LandingPage.create({ title: title.trim(), slug: slug.trim().toLowerCase(), productId: product._id, blocks, video, storeId: req.store._id });
    res.status(201).json(page);
  }
  catch (e) { next(e); }
});

router.put("/:id", requireAuth, requireRole("owner", "manager"), async (req, res, next) => {
  try {
    const { storeId, _id, ...updates } = req.body;
    if (updates.productId && !await Product.exists({ _id: updates.productId, storeId: req.store._id, status: "active" })) {
      return res.status(400).json({ message: "Choose an active product from this store" });
    }
    if (updates.blocks && (!Array.isArray(updates.blocks) || updates.blocks.length > 40)) {
      return res.status(400).json({ message: "Landing pages support up to 40 sections" });
    }
    const page = await LandingPage.findOneAndUpdate({ _id: req.params.id, storeId: req.store._id }, updates, { new: true, runValidators: true });
    if (!page) return res.status(404).json({ message: "Landing page not found" });
    res.json(page);
  }
  catch (e) { next(e); }
});

export default router;
