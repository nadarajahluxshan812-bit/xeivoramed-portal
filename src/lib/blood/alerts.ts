import type { ReminderChannel } from "@prisma/client";
import { sendMulti, type Recipient } from "@/lib/notifications";

/**
 * Emergency Blood Network — donor alerts (Part 4).
 * Sends a compact, actionable request over the patient's opted-in channels
 * (Push / SMS / WhatsApp). The Accept/Decline actions deep-link back into the app.
 */

export type DonorAlert = {
  bloodType: string;
  hospitalName: string;
  distanceKm: number | null;
  urgency: string;
  matchId: string;
  appUrl: string;
};

export function buildDonorAlertText(a: DonorAlert): string {
  const dist = a.distanceKm != null ? `${a.distanceKm} km away` : "nearby";
  return [
    "🩸 Emergency Blood Request",
    `Blood type: ${a.bloodType}`,
    `Hospital: ${a.hospitalName}`,
    `Distance: ${dist}`,
    `Urgency: ${a.urgency}`,
    "",
    "Can you donate?",
    `Accept: ${a.appUrl}/dashboard/donor?accept=${a.matchId}`,
    `Decline: ${a.appUrl}/dashboard/donor?decline=${a.matchId}`,
    "— XeivoraMed (you can opt out anytime)",
  ].join("\n");
}

/** Dispatch the alert across channels; returns per-channel results. */
export async function sendDonorAlert(
  to: Recipient,
  alert: DonorAlert,
  channels: ReminderChannel[] = ["PUSH", "WHATSAPP", "SMS"]
) {
  return sendMulti(channels, to, buildDonorAlertText(alert));
}
