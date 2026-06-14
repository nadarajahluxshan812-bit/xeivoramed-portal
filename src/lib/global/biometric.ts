import { createHash, randomBytes } from "node:crypto";

/**
 * XeivoraMed — biometric-ready emergency verification (DEMONSTRATION ONLY).
 *
 * We NEVER store or transmit raw biometric data (faces, fingerprints, palm, iris).
 * Only an opaque, salted **template hash** is persisted. The demo "verification"
 * compares hashes; a real deployment would call a certified biometric SDK and
 * require explicit patient consent + jurisdiction-specific regulatory approval.
 */

export const BIOMETRIC_DISCLAIMER =
  "Biometric verification is demonstration-only and would require certified biometric providers, explicit consent, and jurisdiction-specific regulatory approval in production.";

export type VerificationMethod =
  | "QR_CODE" | "HEALTH_ID" | "PASSPORT" | "NATIONAL_ID"
  | "FACE" | "FINGERPRINT" | "PALM" | "IRIS";

export const METHODS: {
  key: VerificationMethod;
  label: string;
  group: "credential" | "biometric";
  status: "demo" | "future" | "live";
}[] = [
  { key: "QR_CODE", label: "Scan QR code", group: "credential", status: "live" },
  { key: "HEALTH_ID", label: "Enter Health ID", group: "credential", status: "live" },
  { key: "PASSPORT", label: "Passport verification", group: "credential", status: "demo" },
  { key: "NATIONAL_ID", label: "National ID verification", group: "credential", status: "demo" },
  { key: "FACE", label: "Face verification", group: "biometric", status: "demo" },
  { key: "FINGERPRINT", label: "Fingerprint verification", group: "biometric", status: "demo" },
  { key: "PALM", label: "Palm verification", group: "biometric", status: "future" },
  { key: "IRIS", label: "Iris verification", group: "biometric", status: "future" },
];

/**
 * Hash a biometric template. Input is ALREADY a non-reversible template/feature
 * vector from a capture SDK — never a raw image. We salt + SHA-256 it.
 */
export function hashTemplate(template: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString("hex");
  const digest = createHash("sha256").update(`${s}:${template}`).digest("hex");
  return `${s}.${digest}`;
}

/** Constant-ish demo verification: compares a presented template to a stored hash. */
export function verifyTemplate(presentedTemplate: string, storedHash: string): boolean {
  const [salt] = storedHash.split(".");
  return hashTemplate(presentedTemplate, salt) === storedHash;
}

/** Whether a method is usable in the demo (live + demo, not future). */
export function isMethodAvailable(method: VerificationMethod): boolean {
  const m = METHODS.find((x) => x.key === method);
  return m ? m.status !== "future" : false;
}
