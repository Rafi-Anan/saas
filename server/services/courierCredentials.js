import crypto from "crypto";

function encryptionKey(storeId) {
  const secret = process.env.COURIER_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("A 32-character COURIER_ENCRYPTION_KEY or JWT_SECRET is required");
  return crypto.scryptSync(secret, String(storeId), 32);
}

export function encryptCredentials(credentials, storeId) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(storeId), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(credentials), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString("base64url")).join(".");
}

export function hasEncryptedCredentials(value) {
  return typeof value === "string" && value.split(".").length === 3;
}