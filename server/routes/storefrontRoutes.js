import express from "express";
import Store from "../models/Store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/banners", (req, res) => {
  const banners = (req.store.banners || []).filter(banner => banner.active).sort((a, b) => a.position - b.position);
  res.json(banners);
});

router.get("/navigation", (req, res) => {
  const links = (req.store.navigationLinks || []).filter(link => link.active).sort((a, b) => a.position - b.position);
  res.json(links);
});

router.get("/navigation/manage", requireAuth, requireRole("owner"), (req, res) => {
  res.json([...(req.store.navigationLinks || [])].sort((a, b) => a.position - b.position));
});

router.post("/navigation", requireAuth, requireRole("owner"), async (req, res, next) => {
  try {
    const label = String(req.body.label || "").trim();
    const href = String(req.body.href || "").trim();
    if (!label || !/^(\/|https?:\/\/)/i.test(href)) {
      return res.status(400).json({ message: "Each menu item needs a label and a local path or HTTP(S) URL" });
    }
    const store = await Store.findById(req.store._id);
    if (store.navigationLinks.length >= 12) return res.status(400).json({ message: "A store can have up to 12 menu items" });
    store.navigationLinks.push({ label, href, active: true, position: store.navigationLinks.length });
    await store.save();
    res.status(201).json(store.navigationLinks[store.navigationLinks.length - 1]);
  } catch (error) { next(error); }
});

router.patch("/navigation/:linkId", requireAuth, requireRole("owner"), async (req, res, next) => {
  try {
    const store = await Store.findById(req.store._id);
    const link = store?.navigationLinks.id(req.params.linkId);
    if (!link) return res.status(404).json({ message: "Menu item not found" });
    if (req.body.label !== undefined) link.label = String(req.body.label).trim();
    if (req.body.href !== undefined) link.href = String(req.body.href).trim();
    if (req.body.active !== undefined) link.active = req.body.active === true;
    if (!link.label || !/^(\/|https?:\/\/)/i.test(link.href)) {
      return res.status(400).json({ message: "Each menu item needs a label and a local path or HTTP(S) URL" });
    }
    await store.save();
    res.json(link);
  } catch (error) { next(error); }
});

router.delete("/navigation/:linkId", requireAuth, requireRole("owner"), async (req, res, next) => {
  try {
    const store = await Store.findById(req.store._id);
    const link = store?.navigationLinks.id(req.params.linkId);
    if (!link) return res.status(404).json({ message: "Menu item not found" });
    link.deleteOne();
    store.navigationLinks.forEach((item, position) => { item.position = position; });
    await store.save();
    res.json({ message: "Menu item deleted" });
  } catch (error) { next(error); }
});

router.put("/navigation", requireAuth, requireRole("owner"), async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.links) || req.body.links.length > 12) {
      return res.status(400).json({ message: "Provide up to 12 navigation links" });
    }
    const links = req.body.links.map((link, position) => ({
      label: String(link.label || "").trim(),
      href: String(link.href || "").trim(),
      active: link.active !== false,
      position
    }));
    if (links.some(link => !link.label || !(/^(\/|https?:\/\/)/i).test(link.href))) {
      return res.status(400).json({ message: "Each menu item needs a label and a local path or HTTP(S) URL" });
    }
    const store = await Store.findOneAndUpdate(
      { _id: req.store._id },
      { $set: { navigationLinks: links } },
      { new: true, runValidators: true }
    ).select("navigationLinks");
    res.json(store.navigationLinks);
  } catch (error) { next(error); }
});

router.get("/banners/manage", requireAuth, requireRole("owner"), (req, res) => {
  res.json([...(req.store.banners || [])].sort((a, b) => a.position - b.position));
});

router.put("/banners", requireAuth, requireRole("owner"), async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.banners) || req.body.banners.length > 10) {
      return res.status(400).json({ message: "Provide up to 10 banners" });
    }
    const banners = req.body.banners.map((banner, position) => ({
      title: String(banner.title || "").trim(),
      subtitle: String(banner.subtitle || "").trim(),
      mediaType: banner.mediaType === "video" ? "video" : "image",
      mediaUrl: String(banner.mediaUrl || banner.image || "").trim(),
      image: banner.mediaType === "video" ? "" : String(banner.mediaUrl || banner.image || "").trim(),
      link: String(banner.link || "/shop").trim(),
      buttonLabel: String(banner.buttonLabel || "Shop now").trim(),
      active: banner.active !== false,
      position
    }));
    if (banners.some(banner => !/^https?:\/\//i.test(banner.mediaUrl))) {
      return res.status(400).json({ message: "Each slider item needs an HTTP or HTTPS image/video URL" });
    }
    const store = await Store.findOneAndUpdate(
      { _id: req.store._id },
      { $set: { banners } },
      { new: true, runValidators: true }
    ).select("banners");
    res.json(store.banners);
  } catch (error) { next(error); }
});

export default router;