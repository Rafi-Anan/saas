import express from "express";
import AdminUser from "../models/AdminUser.js";
import { createSession, hashPassword, verifyPassword } from "../middleware/auth.js";

const router = express.Router();
const failedAttempts = new Map();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 10;

router.post("/register", async (req, res, next) => {
  try {
    const ip = req.ip;
    const attempt = failedAttempts.get(`register:${ip}`);
    if (attempt && attempt.expiresAt > Date.now() && attempt.count >= maxAttempts) {
      return res.status(429).json({ message: "Too many registration attempts. Try again later." });
    }
    failedAttempts.set(`register:${ip}`, { count: (attempt?.expiresAt > Date.now() ? attempt.count : 0) + 1, expiresAt: Date.now() + windowMs });
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid name and email address" });
    }
    if (password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 12 and 128 characters" });
    }
    if (await AdminUser.exists({ storeId: req.store._id, email })) {
      return res.status(409).json({ message: "An account with this email already exists for this store" });
    }
    const { passwordHash, passwordSalt } = hashPassword(password);
    await AdminUser.create({ storeId: req.store._id, name, email, passwordHash, passwordSalt, role: "pending", status: "active" });
    res.status(201).json({ message: "Registration complete. An administrator must approve your role before you can sign in." });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists for this store" });
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const ip = req.ip;
    const attempt = failedAttempts.get(ip);
    if (attempt && attempt.expiresAt > Date.now() && attempt.count >= maxAttempts) {
      return res.status(429).json({ message: "Too many login attempts. Try again later." });
    }
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password || password.length > 256) return res.status(400).json({ message: "Email and password are required" });
    const user = await AdminUser.findOne({ storeId: req.store._id, email, status: "active" });
    if (!user || !verifyPassword(password, user)) {
      failedAttempts.set(ip, { count: (attempt?.expiresAt > Date.now() ? attempt.count : 0) + 1, expiresAt: Date.now() + windowMs });
      return res.status(401).json({ message: "Email or password is incorrect" });
    }
    if (user.role === "pending") return res.status(403).json({ message: "Your account is awaiting administrator role approval" });
    failedAttempts.delete(ip);
    user.lastLoginAt = new Date();
    await user.save();
    res.json({ token: createSession(user), user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

export default router;