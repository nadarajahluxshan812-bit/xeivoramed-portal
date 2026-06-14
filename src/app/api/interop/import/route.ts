import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { normalize } from "@/lib/global/fhir";

const schema = z.object({
  patientId: z.string().min(1),
  format: z.enum(["fhir", "cda", "nhs", "pdf", "dicom"]),
  // payload is the raw record (FHIR/NHS JSON object, CDA XML string, or PDF meta)
  payload: z.unknown(),
  origin: z.object({ name: z.string().optional(), country: z.string().optional() }).optional(),
});

/**
 * Module 6 — International record sharing / normalization.
 * Accepts FHIR / CDA / NHS / PDF records, normalizes them into
 * StandardizedHealthEvent rows, building one cross-border timeline.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "interop:import")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten() }, { status: 400 });
  const { patientId, format, payload, origin } = parsed.data;

  const events = normalize(format, payload, origin);
  if (events.length === 0) {
    return NextResponse.json({ error: "No recognisable health events in payload" }, { status: 422 });
  }

  if (isDemoMode) {
    return NextResponse.json({ ok: true, demo: true, normalized: events.length, events });
  }

  await prisma.standardizedHealthEvent.createMany({
    data: events.map((e) => ({
      patientId,
      source: e.source,
      type: e.type,
      codeSystem: e.codeSystem,
      code: e.code,
      title: e.title,
      description: e.description,
      occurredAt: new Date(e.occurredAt),
      originName: e.originName,
      originCountry: e.originCountry,
      raw: e.raw as object | undefined,
    })),
  });

  await audit({
    actorId: user.id, actorRole: user.role, action: "INTEROP_IMPORT",
    entityType: "StandardizedHealthEvent", subjectPatientId: patientId,
    metadata: { format, count: events.length },
  });

  return NextResponse.json({ ok: true, normalized: events.length });
}
