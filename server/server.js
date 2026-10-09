import dotenv from "dotenv";
import { fileURLToPath } from "url";
dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });
import dns from "dns";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Store from "./models/Store.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Customer from "./models/Customer.js";
import LandingPage from "./models/LandingPage.js";
import AdminUser from "./models/AdminUser.js";
import { hashPassword } from "./middleware/auth.js";
import authRoutes from "./routes/authRoutes.js";
import storefrontRoutes from "./routes/storefrontRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import landingRoutes from "./routes/landingRoutes.js";
import courierRoutes from "./routes/courierRoutes.js";
import resolveTenant from "./middleware/tenant.js";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const PORT = process.env.PORT || 5000;
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map(origin => origin.trim());
app.use(cors({
  origin(origin, callback) {
    const localDevOrigin = process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
    callback(null, !origin || allowedOrigins.includes(origin) || localDevOrigin);
  },
  allowedHeaders: ["Content-Type", "Authorization", "X-Store-Slug"]
}));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(fileURLToPath(new URL("./uploads/", import.meta.url)), { maxAge: "1y", immutable: true }));

app.get("/api/health", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({ ok: databaseReady, database: databaseReady ? "connected" : "disconnected", service: "H2R Commerce API" });
});

app.use("/api", resolveTenant);
app.use("/api/auth", authRoutes);
app.use("/api/storefront", storefrontRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/landing-pages", landingRoutes);
app.use("/api/couriers", courierRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || (err.name === "ValidationError" ? 400 : 500)).json({ message: err.status ? err.message : err.name === "ValidationError" ? err.message : "Internal server error" });
});

async function bootstrapDefaultStore() {
  const slug = process.env.DEFAULT_STORE_SLUG || "demo";
  const store = await Store.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name: "H2R Demo Store", currency: "BDT", timezone: "Asia/Dhaka" } },
    { new: true, upsert: true }
  );

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existingAdmin = await AdminUser.exists({ storeId: store._id, email });
    if (!existingAdmin) {
      const { passwordHash, passwordSalt } = hashPassword(process.env.ADMIN_PASSWORD);
      await AdminUser.create({ storeId: store._id, name: process.env.ADMIN_NAME || "Store owner", email, passwordHash, passwordSalt, role: "owner" });
      console.log(`Initial store owner provisioned: ${email}`);
    }
  }

  await Promise.all([
    Product.collection.updateMany({ storeId: { $exists: false } }, { $set: { storeId: store._id } }),
    Customer.collection.updateMany({ storeId: { $exists: false } }, { $set: { storeId: store._id } }),
    LandingPage.collection.updateMany({ storeId: { $exists: false } }, { $set: { storeId: store._id } }),
    Order.collection.updateMany(
      { $or: [{ storeId: { $exists: false } }, { orderNumber: { $exists: false } }] },
      [{ $set: {
        storeId: { $ifNull: ["$storeId", store._id] },
        orderNumber: { $ifNull: ["$orderNumber", { $concat: ["LEGACY-", { $toString: "$_id" }] }] },
        subtotal: { $ifNull: ["$subtotal", { $ifNull: ["$total", 0] }] },
        statusHistory: { $ifNull: ["$statusHistory", []] }
      } }]
    )
  ]);

  for (const [collection, indexName] of [[Product.collection, "slug_1"], [Customer.collection, "phone_1"], [LandingPage.collection, "slug_1"]]) {
    try { await collection.dropIndex(indexName); }
    catch (error) { if (error.code !== 27 && error.codeName !== "IndexNotFound") throw error; }
  }
  console.log(`Default store ready: ${slug}`);
}

async function start() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must contain at least 32 characters. Update server/.env before starting the API.");
    }
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected");
      await bootstrapDefaultStore();
    } else {
      console.warn("MONGODB_URI is not configured. API will still start.");
    }
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

start();
