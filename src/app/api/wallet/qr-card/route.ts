import QRCode from "qrcode";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getPassData } from "@/lib/wallet/passData";

/**
 * GET /api/wallet/qr-card — downloadable emergency QR card (SVG).
 * Authenticated patient only. Branded card with minimal emergency identity and a
 * QR that resolves to the controlled emergency passport page. Works in demo.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.patientProfileId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await getPassData(user.patientProfileId);
  if (!data) return new Response("No passport found", { status: 404 });

  const qrDataUrl = await QRCode.toDataURL(data.emergencyUrl, {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 220,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  const esc = (s: string) =>
    s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
  const allergies = data.criticalAllergies.length ? data.criticalAllergies.join(", ") : "None known";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
  <rect width="640" height="400" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
  <rect width="640" height="64" rx="20" fill="#1a66e6"/>
  <rect y="44" width="640" height="20" fill="#1a66e6"/>
  <text x="28" y="40" fill="#ffffff" font-size="22" font-weight="700">XeivoraMed</text>
  <text x="612" y="40" fill="#dbeaff" font-size="13" text-anchor="end">Verified Emergency Medical Passport</text>

  <text x="28" y="110" fill="#64748b" font-size="12" letter-spacing="1">PATIENT</text>
  <text x="28" y="138" fill="#0f172a" font-size="26" font-weight="700">${esc(data.fullName)}</text>

  <text x="28" y="180" fill="#64748b" font-size="12" letter-spacing="1">XEIVORAMED ID</text>
  <text x="28" y="204" fill="#0f172a" font-size="18" font-weight="600" font-family="monospace">${esc(data.globalId)}</text>

  <text x="28" y="244" fill="#64748b" font-size="12" letter-spacing="1">DATE OF BIRTH</text>
  <text x="28" y="266" fill="#0f172a" font-size="16">${esc(data.dateOfBirth ?? "—")}</text>

  <g transform="translate(300,232)">
    <rect x="-12" y="-26" width="150" height="58" rx="12" fill="#fef2f2"/>
    <text x="0" y="-6" fill="#b91c1c" font-size="12" letter-spacing="1">BLOOD GROUP</text>
    <text x="0" y="22" fill="#dc2626" font-size="26" font-weight="800">${esc(data.bloodGroup)}</text>
  </g>

  <text x="28" y="312" fill="#b91c1c" font-size="12" font-weight="700" letter-spacing="1">⚠ CRITICAL ALLERGIES</text>
  <text x="28" y="334" fill="#0f172a" font-size="15" font-weight="600">${esc(allergies)}</text>

  <text x="28" y="372" fill="#94a3b8" font-size="11">Scan to open the emergency passport · For verified providers only</text>
  <text x="28" y="388" fill="#cbd5e1" font-size="10">Last updated ${esc(data.lastUpdated)} · Research / pilot platform · Demo data</text>

  <rect x="446" y="92" width="168" height="168" rx="12" fill="#ffffff" stroke="#e2e8f0"/>
  <image x="450" y="96" width="160" height="160" href="${qrDataUrl}"/>
  <text x="530" y="278" fill="#64748b" font-size="11" text-anchor="middle">Emergency QR</text>
</svg>`;

  await audit({
    actorId: user.id, actorRole: user.role, action: "QR_CARD_DOWNLOADED",
    entityType: "MedicalPassportPass", subjectPatientId: user.patientProfileId,
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="xeivoramed-emergency-card-${data.globalId}.svg"`,
      "Cache-Control": "no-store",
    },
  });
}
