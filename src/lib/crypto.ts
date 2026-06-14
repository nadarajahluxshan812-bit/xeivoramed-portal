import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "./env";

/**
 * AES-256-GCM field encryption for the most sensitive PHI (e.g. NIC numbers).
 * Storage format: base64(iv).base64(authTag).base64(ciphertext)
 *
 * The key comes from RECORD_ENCRYPTION_KEY (a base64-encoded 32-byte value).
 * Generate one with: openssl rand -base64 32
 */

function getKey(): Buffer {
  const raw = env.recordEncryptionKey;
  if (!raw) {
    throw new Error("RECORD_ENCRYPTION_KEY is not set — cannot encrypt PHI.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("RECORD_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptField(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed ciphertext.");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** Best-effort masking for display (e.g. "•••••• 1234"). Never reverses encryption. */
export function maskTail(value: string, visible = 4): string {
  if (value.length <= visible) return value;
  return "•".repeat(Math.max(0, value.length - visible)) + value.slice(-visible);
}
