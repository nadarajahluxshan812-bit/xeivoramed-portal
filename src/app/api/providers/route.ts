import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { demoProviders } from "@/lib/global/demo";

const registerSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["HOSPITAL", "CLINIC", "LABORATORY", "PHARMACY", "EMERGENCY_CENTER"]),
  country: z.string().default("LK"),
  city: z.string().optional(),
  licenseNumber: z.string().optional(),
  registrationEmail: z.string().email().optional(),
  registrationPhone: z.string().optional(),
});

/** Module 4 — list providers (admin view of the registry). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isDemoMode) return NextResponse.json({ providers: demoProviders, demo: true });

  const providers = await prisma.provider.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ providers });
}

/**
 * Module 4 — provider self-registration (status starts at REGISTERED).
 * Open registration is allowed; an admin then verifies → approves.
 */
export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten() }, { status: 400 });

  if (isDemoMode) return NextResponse.json({ ok: true, demo: true, status: "REGISTERED" }, { status: 201 });

  const provider = await prisma.provider.create({
    data: { ...parsed.data, status: "REGISTERED" },
  });

  await audit({ action: "PROVIDER_REGISTER", entityType: "Provider", entityId: provider.id, metadata: { type: provider.type } });
  return NextResponse.json({ provider }, { status: 201 });
}
