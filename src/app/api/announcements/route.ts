import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { sendVia } from "@/lib/notifications";

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  channel: z.enum(["SMS", "WHATSAPP"]).default("SMS"),
  audience: z.string().default("ALL"),
});

/**
 * POST /api/announcements — admin SMS/WhatsApp campaign.
 * Targets ALL | DISTRICT:<name> | ROLE:<role>. Fans out best-effort and records counts.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  const origin = new URL(request.url).origin;
  if (!user || !can(user.role, "announcement:send")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const raw = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  if (isDemoMode) return NextResponse.redirect(`${origin}/admin?sent=demo`, { status: 303 });

  const { title, body, channel, audience } = parsed.data;

  // Resolve audience → recipients.
  const districtMatch = audience.match(/^DISTRICT:(.+)$/);
  const recipients = await prisma.user.findMany({
    where: {
      role: "PATIENT",
      isActive: true,
      ...(districtMatch ? { patient: { district: districtMatch[1] } } : {}),
    },
    select: { id: true, fullName: true, phone: true, email: true },
  });

  const announcement = await prisma.announcement.create({
    data: { authorId: user.id, title, body, channel, audience, sentAt: new Date() },
  });

  let sent = 0;
  await Promise.all(
    recipients.map(async (r) => {
      const res = await sendVia(channel, { userId: r.id, fullName: r.fullName, phone: r.phone, email: r.email }, body);
      if (res.ok) sent++;
    })
  );

  await prisma.announcement.update({ where: { id: announcement.id }, data: { sentCount: sent } });
  await audit({ actorId: user.id, actorRole: user.role, action: "ANNOUNCEMENT_SEND", entityType: "Announcement", entityId: announcement.id, metadata: { sent, audience } });

  if (contentType.includes("application/json")) return NextResponse.json({ ok: true, sent });
  return NextResponse.redirect(`${origin}/admin?sent=${sent}`, { status: 303 });
}
