import Store from "../models/Store.js";

export default async function resolveTenant(req, res, next) {
  try {
    const hostname = (req.hostname || "").toLowerCase();
    const requestedSlug = String(req.get("x-store-slug") || process.env.DEFAULT_STORE_SLUG || "demo").toLowerCase();
    const store = await Store.findOne({
      status: "active",
      $or: [{ domains: hostname }, { slug: requestedSlug }]
    }).select("_id name slug domains currency timezone banners navigationLinks settings");

    if (!store) return res.status(404).json({ message: "Store not found" });
    req.store = store;
    next();
  } catch (error) {
    next(error);
  }
}