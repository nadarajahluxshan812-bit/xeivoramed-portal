import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  organisation: z.string().optional(),
  email: z.string().email(),
  country: z.string().optional(),
  interest: z.string().optional(),
});

/**
 * Waitlist / discovery lead capture for healthcare leaders.
 * Lightweight by design — no new module or DB model. Logged for follow-up; wire
 * to email/CRM in production. Always redirects to a thank-you so the flow works
 * with or without a backend.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(form));

  if (!parsed.success) {
    return NextResponse.redirect(`${origin}/for-healthcare-leaders?error=invalid`, { status: 303 });
  }

  console.info("[waitlist]", JSON.stringify(parsed.data));
  return NextResponse.redirect(`${origin}/for-healthcare-leaders?joined=1`, { status: 303 });
}
