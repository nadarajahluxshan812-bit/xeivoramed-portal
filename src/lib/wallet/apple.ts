import { env, isConfigured } from "@/lib/env";
import type { PassData } from "./passData";

/**
 * Apple Wallet (PassKit) — wallet-READY architecture.
 *
 * This builds the pass.json payload and validates configuration. It does NOT
 * ship a real signed .pkpass in demo: signing requires an Apple-issued Pass Type
 * ID certificate + key (APPLE_WALLET_CERT_PATH / APPLE_WALLET_KEY_PATH) and the
 * `passkit-generator` package. We never claim live integration without creds.
 *
 * To go live: configure the env vars below, add a signing lib, and have
 * `createAppleWalletPass()` zip + sign the payload into a .pkpass.
 */

export type AppleWalletConfigResult =
  | { ok: true }
  | { ok: false; error: string };

/** Returns ok only when all issuer credentials are present. */
export function validateAppleWalletConfig(): AppleWalletConfigResult {
  if (!isConfigured.appleWallet) {
    return { ok: false, error: "Apple Wallet issuer credentials not configured." };
  }
  return { ok: true };
}

/**
 * Build the PassKit `pass.json` payload from minimal emergency identity.
 * Generic/secondary fields only — no full medical history.
 */
export function generateApplePassPayload(data: PassData) {
  return {
    formatVersion: 1,
    passTypeIdentifier: env.appleWallet.passTypeIdentifier || "pass.lk.xeivoramed.passport",
    teamIdentifier: env.appleWallet.teamIdentifier || "TEAMID",
    organizationName: "XeivoraMed",
    description: data.title,
    serialNumber: data.globalId,
    logoText: "XeivoraMed",
    foregroundColor: "rgb(255,255,255)",
    backgroundColor: "rgb(26,102,230)",
    labelColor: "rgb(219,235,255)",
    // Barcode → controlled emergency passport URL (verification + audit happen there)
    barcodes: [{ format: "PKBarcodeFormatQR", message: data.emergencyUrl, messageEncoding: "iso-8859-1" }],
    generic: {
      headerFields: [{ key: "blood", label: "BLOOD", value: data.bloodGroup }],
      primaryFields: [{ key: "name", label: "PATIENT", value: data.fullName }],
      secondaryFields: [
        { key: "id", label: "XeivoraMed ID", value: data.globalId },
        { key: "dob", label: "DOB", value: data.dateOfBirth ?? "—" },
      ],
      auxiliaryFields: [
        {
          key: "allergies",
          label: "CRITICAL ALLERGIES",
          value: data.criticalAllergies.length ? data.criticalAllergies.join(", ") : "None known",
        },
      ],
      backFields: [
        { key: "title", label: "Pass", value: data.title },
        { key: "updated", label: "Last updated", value: data.lastUpdated },
        { key: "url", label: "Emergency access", value: data.emergencyUrl },
        {
          key: "notice",
          label: "Notice",
          value:
            "Scan the QR to open the emergency passport. For verified providers only. Research / pilot platform — verify clinical decisions with licensed professionals.",
        },
      ],
    },
  };
}

export type ApplePassResult =
  | { ok: true; payload: ReturnType<typeof generateApplePassPayload> }
  | { ok: false; status: number; error: string };

/**
 * Demo-safe entry point. Returns the payload when creds exist (a real impl would
 * sign it into a .pkpass here); otherwise a clear setup-required error.
 */
export function createAppleWalletPassStub(data: PassData): ApplePassResult {
  const cfg = validateAppleWalletConfig();
  if (!cfg.ok) {
    return { ok: false, status: 501, error: "Wallet integration ready — issuer setup required." };
  }
  return { ok: true, payload: generateApplePassPayload(data) };
}
