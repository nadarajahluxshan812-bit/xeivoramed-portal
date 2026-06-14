import { env, isConfigured } from "@/lib/env";
import type { PassData } from "./passData";

/**
 * Google Wallet — wallet-READY architecture.
 *
 * Builds the Generic pass object and validates configuration. It does NOT mint a
 * real "Save to Google Wallet" JWT in demo: that requires a service account
 * (GOOGLE_WALLET_SERVICE_ACCOUNT_JSON) to RS256-sign the claims, plus a
 * registered issuer + class. We never claim live integration without creds.
 *
 * To go live: configure the env vars, sign the JWT with `google-auth-library`,
 * and return `https://pay.google.com/gp/v/save/<jwt>`.
 */

export type GoogleWalletConfigResult = { ok: true } | { ok: false; error: string };

export function validateGoogleWalletConfig(): GoogleWalletConfigResult {
  if (!isConfigured.googleWallet) {
    return { ok: false, error: "Google Wallet issuer credentials not configured." };
  }
  return { ok: true };
}

/** Build the Google Wallet Generic object from minimal emergency identity. */
export function generateGoogleWalletPayload(data: PassData) {
  const issuerId = env.googleWallet.issuerId || "0000000000000000000";
  const classId = env.googleWallet.classId || `${issuerId}.xeivoramed_passport`;
  return {
    iss: "service-account@xeivoramed.iam.gserviceaccount.com",
    aud: "google",
    typ: "savetowallet",
    payload: {
      genericObjects: [
        {
          id: `${issuerId}.${data.globalId}`,
          classId,
          state: "ACTIVE",
          cardTitle: { defaultValue: { language: "en", value: "XeivoraMed" } },
          header: { defaultValue: { language: "en", value: data.title } },
          subheader: { defaultValue: { language: "en", value: data.fullName } },
          textModulesData: [
            { id: "id", header: "XeivoraMed ID", body: data.globalId },
            { id: "blood", header: "Blood group", body: data.bloodGroup },
            { id: "dob", header: "Date of birth", body: data.dateOfBirth ?? "—" },
            {
              id: "allergies",
              header: "Critical allergies",
              body: data.criticalAllergies.length ? data.criticalAllergies.join(", ") : "None known",
            },
            { id: "updated", header: "Last updated", body: data.lastUpdated },
          ],
          barcode: { type: "QR_CODE", value: data.emergencyUrl, alternateText: data.globalId },
          hexBackgroundColor: "#1a66e6",
        },
      ],
    },
  };
}

export type GoogleSaveResult =
  | { ok: true; saveUrl: string }
  | { ok: false; status: number; error: string };

/**
 * Demo-safe entry point. A real impl would RS256-sign the payload into a JWT and
 * return the pay.google.com save URL. Without creds it returns setup-required.
 */
export function createGoogleWalletSaveUrlStub(data: PassData): GoogleSaveResult {
  const cfg = validateGoogleWalletConfig();
  if (!cfg.ok) {
    return { ok: false, status: 501, error: "Wallet integration ready — issuer setup required." };
  }
  // Placeholder: signed JWT must replace `unsigned-demo`. Build kept for parity.
  void generateGoogleWalletPayload(data);
  return { ok: true, saveUrl: `https://pay.google.com/gp/v/save/unsigned-demo` };
}
