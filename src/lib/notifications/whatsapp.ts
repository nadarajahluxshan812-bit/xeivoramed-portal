import { env, isConfigured } from "@/lib/env";
import type { NotificationProvider, Recipient, SendResult } from "./types";

/**
 * WhatsApp Cloud API (Meta Graph API) provider.
 * Note: outside the 24h customer-service window you must use an approved template.
 * Here we send a free-form text body — swap to `type: "template"` for proactive reminders.
 */
export const whatsappProvider: NotificationProvider = {
  channel: "WHATSAPP",
  isConfigured: isConfigured.whatsapp,

  async send(to: Recipient, message: string): Promise<SendResult> {
    if (!to.phone) return { ok: false, error: "No phone number", channel: "WHATSAPP" };
    if (!isConfigured.whatsapp) {
      console.info(`[WhatsApp:dry-run] → ${to.phone}: ${message}`);
      return { ok: true, providerRef: "dry-run", channel: "WHATSAPP" };
    }
    try {
      const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.whatsapp.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.phone.replace(/^\+/, ""),
          type: "text",
          text: { body: message },
        }),
      });
      const data = (await res.json()) as { messages?: { id: string }[]; error?: { message: string } };
      if (!res.ok) return { ok: false, error: data.error?.message ?? "WhatsApp send failed", channel: "WHATSAPP" };
      return { ok: true, providerRef: data.messages?.[0]?.id, channel: "WHATSAPP" };
    } catch (err) {
      return { ok: false, error: (err as Error).message, channel: "WHATSAPP" };
    }
  },
};
