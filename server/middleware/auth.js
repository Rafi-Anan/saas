import crypto from "crypto";
import AdminUser from "../models/AdminUser.js";

const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { passwordHash, passwordSalt: salt };
}

function sign(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode(payload);
  const content = `${header}.${body}`;
  const signature = crypto.createHmac("sha256", secret).update(content).digest("base64url");
  return `${content}.${signature}`;
}

function verify(token) {
  const [header, body, signature] = String(token).split(".");
  if (!header || !body || !signature) return null;
  const expected = crypto.createHmac("sha256", process.env.JWT_SECRET || "").update(`${header}.${body}`).digest();
  let supplied;
  try { supplied = Buffer.from(signature, "base64url"); } catch { return null; }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}

export function createSession(user) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ sub: String(user._id), storeId: String(user.storeId), role: user.role, iat: now, exp: now + 60 * 60 * 8 });
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
    const payload = token && verify(token);
    if (!payload || payload.storeId !== String(req.store._id)) return res.status(401).json({ message: "Authentication required" });
    const user = await AdminUser.findOne({ _id: payload.sub, storeId: req.store._id, status: "active" }).select("name email role storeId");
    if (!user) return res.status(401).json({ message: "Session is no longer valid" });
    req.user = user;
    res.on("finish", () => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        import("../models/ActivityLog.js").then(({ default: ActivityLog }) => ActivityLog.create({
          storeId: req.store._id,
          userId: user._id,
          action: `${req.method} ${req.baseUrl}${req.path}`,
          statusCode: res.statusCode,
          ipAddress: req.ip
        })).catch(error => console.error("Activity log failed:", error.message));
      }
    });
    next();
  } catch (error) { next(error); }
}

export function requireRole(...roles) {
  return (req, res, next) => req.user?.role === "admin" || roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to perform this action" });
}

export function verifyPassword(password, user) {
  const actual = Buffer.from(hashPassword(password, user.passwordSalt).passwordHash, "hex");
  const expected = Buffer.from(user.passwordHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export { sign };