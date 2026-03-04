import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getConfig } from "../config.js";

function getKey(): Buffer {
  const secret = getConfig().tenantSecretKey;
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12);
  const key = getKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(encoded: string): string {
  const [ivRaw, authTagRaw, cipherTextRaw] = encoded.split(".");
  if (!ivRaw || !authTagRaw || !cipherTextRaw) {
    throw new Error("Invalid encrypted secret payload");
  }
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagRaw, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherTextRaw, "base64url")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}
