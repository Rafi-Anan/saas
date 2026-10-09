import express from "express";
import Store from "../models/Store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { encryptCredentials, hasEncryptedCredentials } from "../services/courierCredentials.js";

const router = express.Router();
export const courierProviders = [
  { id: "steadfast", name: "Steadfast" },
  { id: "pathao", name: "Pathao Courier" },
  { id: "redx", name: "RedX" },
  { id: "paperfly", name: "Paperfly" },
  { id: "ecourier", name: "eCourier" }
];

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const store = await Store.findById(req.store._id).select("courierIntegrations");
    res.json(courierProviders.map(provider => {
      const integration = store.courierIntegrations.find(item => item.provider === provider.id);
      return { ...provider, enabled: Boolean(integration?.enabled), configured: hasEncryptedCredentials(integration?.credentialsEncrypted) };
    }));
  } catch (error) { next(error); }
});

router.put("/:provider", requireAuth, requireRole("owner"), async (req, res, next) => {
  try {
    if (!courierProviders.some(provider => provider.id === req.params.provider)) return res.status(404).json({ message: "Courier provider not supported" });
    const store = await Store.findById(req.store._id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    let integration = store.courierIntegrations.find(item => item.provider === req.params.provider);
    if (!integration) {
      store.courierIntegrations.push({ provider: req.params.provider, enabled: false });
      integration = store.courierIntegrations[store.courierIntegrations.length - 1];
    }
    const enabled = req.body.enabled !== false;
    if (enabled) {
      const credentials = Object.fromEntries(["apiKey", "clientId", "clientSecret", "username", "password", "baseUrl"].map(key => [key, String(req.body[key] || "").trim()]).filter(([, value]) => value));
      if (!Object.keys(credentials).length && !hasEncryptedCredentials(integration.credentialsEncrypted)) {
        return res.status(400).json({ message: "Enter the courier API credentials before enabling this integration" });
      }
      if (Object.keys(credentials).length) integration.credentialsEncrypted = encryptCredentials(credentials, req.store._id);
    }
    integration.enabled = enabled;
    integration.updatedAt = new Date();
    await store.save();
    res.json({ provider: integration.provider, enabled: integration.enabled, configured: hasEncryptedCredentials(integration.credentialsEncrypted) });
  } catch (error) { next(error); }
});

export default router;