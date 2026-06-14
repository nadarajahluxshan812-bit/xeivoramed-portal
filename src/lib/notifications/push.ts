import webpush from "web-push";
import { env, isConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { NotificationProvider, Recipient, SendResult } from "./types";

let configured = false;
function ensureVapid() {
  if (!configured && isConfigured.push) {
    webpush.setVapidDetails(env.vapid.subject, env.vapid.publicKey, env.vapid.privateKey);
    configured = true;
  }
}

/**
 * Web Push provider. Fans out to every registered device of the user and prunes
 * subscriptions the browser has expired (410/404).
 */
export const pushProvider: NotificationProvider = {
  channel: "PUSH",
  isConfigured: isConfigured.push,

  async send(to: Recipient, message: string): Promise<SendResult> {
    if (!isConfigured.push) {
      console.info(`[Push:dry-run] → ${to.userId}: ${message}`);
      return { ok: true, providerRef: "dry-run", channel: "PUSH" };
    }
    ensureVapid();

    const subs = await prisma.pushSubscription.findMany({ where: { userId: to.userId } });
    if (subs.length === 0) return { ok: false, error: "No push subscriptions", channel: "PUSH" };

    const payload = JSON.stringify({ title: "XeivoraMed", body: message, url: "/dashboard" });
    let delivered = 0;

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
          delivered++;
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          }
        }
      })
    );

    return delivered > 0
      ? { ok: true, channel: "PUSH" }
      : { ok: false, error: "All push deliveries failed", channel: "PUSH" };
  },
};
