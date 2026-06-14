import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  contactName: z.string().min(1),
  role: z.string().optional(),
  organisation: z.string().min(1),
  district: z.string().optional(),
  phone: z.string().min(5),
  email: z.string().email(),
  notes: z.string().optional(),
});

/**
 * POST /api/pilot — clinic/doctor pilot request (lead capture).
 * Intentionally lightweight: no new DB model or external service. The request is
 * logged for ops follow-up; wire this to email/CRM later if desired. Always
 * redirects to a thank-you so the flow works with or without a backend.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(form));

  if (!parsed.success) {
    return NextResponse.redirect(`${origin}/pilot?error=invalid`, { status: 303 });
  }

  // Ops sink — replace with email (SES/Resend) or a CRM webhook in production.
  console.info("[pilot-request]", JSON.stringify(parsed.data));

  return NextResponse.redirect(`${origin}/pilot?submitted=1`, { status: 303 });
}
