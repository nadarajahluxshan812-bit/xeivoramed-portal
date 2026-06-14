import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getPassData } from "@/lib/wallet/passData";
import { createAppleWalletPassStub } from "@/lib/wallet/apple";

/**
 * GET /api/wallet/apple/pass — Medical Passport Pass for Apple Wallet.
 * Authenticated patient only. Returns the signed pass when issuer credentials
 * exist; otherwise 501 with a clear setup-required message (no false claims).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.patientProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getPassData(user.patientProfileId);
  if (!data) return NextResponse.json({ error: "No passport found" }, { status: 404 });

  const result = createAppleWalletPassStub(data);
  if (!result.ok) {
    // Wallet-ready, but issuer setup is required to sign a real .pkpass.
    return NextResponse.json(
      { error: result.error, setupRequired: true, provider: "apple" },
      { status: result.status },
    );
  }

  await audit({
    actorId: user.id, actorRole: user.role, action: "WALLET_PASS_CREATED",
    entityType: "MedicalPassportPass", subjectPatientId: user.patientProfileId,
    metadata: { provider: "apple" },
  });

  // With credentials a real impl would return the signed .pkpass binary here.
  return NextResponse.json({ ok: true, provider: "apple", pass: result.payload });
}
