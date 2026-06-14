import twilio from "twilio";
import { env, isConfigured } from "@/lib/env";
import type { NotificationProvider, Recipient, SendResult } from "./types";

/** Twilio SMS provider. */
export const smsProvider: NotificationProvider = {
  channel: "SMS",
  isConfigured: isConfigured.twilioSms,

  async send(to: Recipient, message: string): Promise<SendResult> {
    if (!to.phone) return { ok: false, error: "No phone number", channel: "SMS" };
    if (!isConfigured.twilioSms) {
      // Dev/preview: log instead of sending so flows can be exercised end-to-end.
      console.info(`[SMS:dry-run] → ${to.phone}: ${message}`);
      return { ok: true, providerRef: "dry-run", channel: "SMS" };
    }
    try {
      const sdk = twilio(env.twilio.sid, env.twilio.token);
      const res = await sdk.messages.create({
        from: env.twilio.smsFrom,
        to: to.phone,
        body: message,
      });
      return { ok: true, providerRef: res.sid, channel: "SMS" };
    } catch (err) {
      return { ok: false, error: (err as Error).message, channel: "SMS" };
    }
  },
};
