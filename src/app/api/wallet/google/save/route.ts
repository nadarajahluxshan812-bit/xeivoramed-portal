import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getPassData } from "@/lib/wallet/passData";
import { createGoogleWalletSaveUrlStub } from "@/lib/wallet/google";

/**
 * GET /api/wallet/google/save — Medical Passport Pass for Google Wallet.
 * Authenticated patient only. Returns a "Save to Google Wallet" URL when issuer
 * credentials exist; otherwise 501 with a setup-required message (no false claims).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.patientProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getPassData(user.patientProfileId);
  if (!data) return NextResponse.json({ error: "No passport found" }, { status: 404 });

  const result = createGoogleWalletSaveUrlStub(data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, setupRequired: true, provider: "google" },
      { status: result.status },
    );
  }

  await audit({
    actorId: user.id, actorRole: user.role, action: "WALLET_PASS_CREATED",
    entityType: "MedicalPassportPass", subjectPatientId: user.patientProfileId,
    metadata: { provider: "google" },
  });

  return NextResponse.json({ ok: true, provider: "google", saveUrl: result.saveUrl });
}
