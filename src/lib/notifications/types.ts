import type { ReminderChannel } from "@prisma/client";

export type SendResult =
  | { ok: true; providerRef?: string; channel: ReminderChannel }
  | { ok: false; error: string; channel: ReminderChannel };

export type Recipient = {
  userId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
};

export interface NotificationProvider {
  channel: ReminderChannel;
  isConfigured: boolean;
  send(to: Recipient, message: string): Promise<SendResult>;
}
