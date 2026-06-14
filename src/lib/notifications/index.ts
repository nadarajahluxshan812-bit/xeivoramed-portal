import type { ReminderChannel } from "@prisma/client";
import type { NotificationProvider, Recipient, SendResult } from "./types";
import { smsProvider } from "./sms";
import { whatsappProvider } from "./whatsapp";
import { pushProvider } from "./push";
import { voiceProvider } from "./voice";

const providers: Record<ReminderChannel, NotificationProvider | null> = {
  SMS: smsProvider,
  WHATSAPP: whatsappProvider,
  PUSH: pushProvider,
  PHONE_CALL: voiceProvider,
  EMAIL: null, // email reminders can be added with Resend/SES — left as an extension point
};

/** Dispatch a message over a single channel. */
export async function sendVia(
  channel: ReminderChannel,
  to: Recipient,
  message: string
): Promise<SendResult> {
  const provider = providers[channel];
  if (!provider) return { ok: false, error: `No provider for ${channel}`, channel };
  return provider.send(to, message);
}

/** Send across multiple channels (best-effort), returning each result. */
export async function sendMulti(
  channels: ReminderChannel[],
  to: Recipient,
  message: string
): Promise<SendResult[]> {
  return Promise.all(channels.map((c) => sendVia(c, to, message)));
}

export { providers };
export type { Recipient, SendResult } from "./types";
