import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { buildRecordKey, presignUpload } from "@/lib/s3";
import { isConfigured } from "@/lib/env";

const schema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

/**
 * POST /api/records/upload-url
 * Returns a short-lived presigned S3 PUT URL so the browser uploads the file directly,
 * keeping large documents off our server. The returned `key` is then sent to
 * POST /api/records to persist metadata.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !user.patientProfileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isConfigured.s3) return NextResponse.json({ error: "S3 not configured" }, { status: 503 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const key = buildRecordKey(user.patientProfileId, parsed.data.filename);
  const presigned = await presignUpload(key, parsed.data.contentType);
  return NextResponse.json(presigned);
}
