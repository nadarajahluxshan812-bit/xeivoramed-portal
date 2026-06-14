import { env } from "@/lib/env";
import { getPassportView } from "@/lib/global/data";

/**
 * Minimal emergency identity for a Medical Passport Pass. This is the ONLY data
 * placed on a wallet pass / QR card / printed card — never the full medical
 * history. The QR resolves to the controlled emergency passport page where
 * provider verification + audit logging still happen.
 */
export type PassData = {
  globalId: string;
  fullName: string;
  dateOfBirth: string | null;
  bloodGroup: string;
  /** Critical allergy flags only — short, life-saving. */
  criticalAllergies: string[];
  organDonor: boolean;
  /** Controlled emergency passport URL the QR encodes. */
  emergencyUrl: string;
  title: string;
  lastUpdated: string;
};

/** Absolute emergency access URL (token-gated controlled page). */
export function emergencyAccessUrl(globalId: string, token: string): string {
  const base = env.appUrl.replace(/\/$/, "");
  return `${base}/passport/${globalId}?t=${encodeURIComponent(token)}`;
}

export async function getPassData(patientProfileId: string): Promise<PassData | null> {
  const view = await getPassportView(patientProfileId);
  // Live mode: no generated passport yet → no pass (callers 404 / show create CTA).
  if (!view || !view.globalId) return null;
  const { globalId, passport } = view;
  return {
    globalId: globalId.globalId,
    fullName: passport.fullName,
    dateOfBirth: passport.dateOfBirth,
    bloodGroup: passport.bloodGroup,
    criticalAllergies: passport.allergies ?? [],
    organDonor: passport.organDonor ?? false,
    emergencyUrl: emergencyAccessUrl(globalId.globalId, globalId.emergencyToken),
    title: "Verified Emergency Medical Passport",
    lastUpdated: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  };
}
