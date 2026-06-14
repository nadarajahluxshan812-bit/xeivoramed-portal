import { randomBytes, randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { env } from "@/lib/env";

/**
 * Module 1 — Global Health Identity helpers.
 * Generates the human-shareable Global Health ID, the opaque emergency token
 * embedded in the QR/break-glass flow, and the QR image (as a data URL).
 */

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // no I,L,O,U — unambiguous

function group(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CROCKFORD[bytes[i] % CROCKFORD.length];
  return out;
}

/** e.g. "HLX-LK-7F3A-9KQ2" — prefix, ISO country, two random groups. */
export function generateGlobalId(country = "LK"): string {
  return `HLX-${country.toUpperCase()}-${group(4)}-${group(4)}`;
}

/** High-entropy opaque token used to authorize emergency passport access. */
export function generateEmergencyToken(): string {
  return `${randomUUID()}.${randomBytes(16).toString("base64url")}`;
}

/** Absolute URL a responder lands on when scanning the QR. */
export function passportUrl(globalId: string, token: string): string {
  const base = env.appUrl.replace(/\/$/, "");
  return `${base}/passport/${globalId}?t=${encodeURIComponent(token)}`;
}

/** PNG data URL of the QR encoding the emergency passport URL. */
export async function qrDataUrl(globalId: string, token: string): Promise<string> {
  return QRCode.toDataURL(passportUrl(globalId, token), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
