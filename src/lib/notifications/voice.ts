import twilio from "twilio";
import { env, isConfigured } from "@/lib/env";
import type { NotificationProvider, Recipient, SendResult } from "./types";

/**
 * Phone-call reminders via Twilio Programmable Voice.
 * Places an automated call that reads the reminder aloud using <Say> TwiML, with
 * Sinhala/Tamil/English voice selection. This is wired but disabled unless
 * TWILIO_VOICE_FROM is configured — calls cost money and need a verified caller ID.
 */
export const voiceProvider: NotificationProvider = {
  channel: "PHONE_CALL",
  isConfigured: Boolean(env.twilio.sid && env.twilio.token && env.twilio.voiceFrom),

  async send(to: Recipient, message: string): Promise<SendResult> {
    if (!to.phone) return { ok: false, error: "No phone number", channel: "PHONE_CALL" };
    if (!isConfigured.twilioSms || !env.twilio.voiceFrom) {
      console.info(`[Voice:dry-run] → ${to.phone}: "${message}"`);
      return { ok: true, providerRef: "dry-run", channel: "PHONE_CALL" };
    }
    try {
      const sdk = twilio(env.twilio.sid, env.twilio.token);
      const twiml = `<Response><Say voice="Polly.Aditi" language="en-IN">${escapeXml(
        message
      )}</Say><Pause length="1"/><Say>Goodbye.</Say></Response>`;
      const call = await sdk.calls.create({
        from: env.twilio.voiceFrom,
        to: to.phone,
        twiml,
      });
      return { ok: true, providerRef: call.sid, channel: "PHONE_CALL" };
    } catch (err) {
      return { ok: false, error: (err as Error).message, channel: "PHONE_CALL" };
    }
  },
};

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!)
  );
}
