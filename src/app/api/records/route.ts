import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { presignDownload } from "@/lib/s3";

const createSchema = z.object({
  title: z.string().min(1),
  category: z.enum([
    "LAB_REPORT", "PRESCRIPTION", "SCAN", "DISCHARGE_SUMMARY",
    "REFERRAL", "VACCINATION", "CONSULTATION_NOTE", "INSURANCE", "OTHER",
  ]),
  s3Key: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.coerce.number().int().positive(),
  description: z.string().optional(),
  patientId: z.string().optional(), // doctors/staff uploading for a patient
});

/** GET /api/records — list records (own for patients; any for clinicians with a ?patientId). */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isDemoMode) return NextResponse.json({ records: [], demo: true });

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId") ?? user.patientProfileId;
  const category = url.searchParams.get("category") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;

  if (patientId !== user.patientProfileId && !can(user.role, "record:read:any")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const records = await prisma.medicalRecord.findMany({
    where: {
      patientId: patientId ?? undefined,
      category: category as never,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { recordDate: "desc" },
  });

  await audit({
    actorId: user.id, actorRole: user.role, action: "RECORD_LIST",
    entityType: "MedicalRecord", subjectPatientId: patientId,
  });

  // Issue short-lived view URLs.
  const withUrls = await Promise.all(
    records.map(async (r) => ({ ...r, viewUrl: await presignDownload(r.s3Key).catch(() => null) }))
  );
  return NextResponse.json({ records: withUrls });
}

/** POST /api/records — persist metadata after a direct-to-S3 upload. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const origin = new URL(request.url).origin;
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    // Form post from the demo UI — acknowledge.
    return NextResponse.redirect(`${origin}/dashboard/records?uploaded=demo`, { status: 303 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten() }, { status: 400 });

  const targetPatient = parsed.data.patientId ?? user.patientProfileId;
  if (!targetPatient) return NextResponse.json({ error: "No patient" }, { status: 400 });
  if (parsed.data.patientId && !can(user.role, "record:write:any")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: targetPatient,
      uploadedById: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      s3Key: parsed.data.s3Key,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
      description: parsed.data.description,
    },
  });

  await audit({
    actorId: user.id, actorRole: user.role, action: "RECORD_CREATE",
    entityType: "MedicalRecord", entityId: record.id, subjectPatientId: targetPatient,
  });

  return NextResponse.json({ record }, { status: 201 });
}
