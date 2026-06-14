import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, Droplet, AlertTriangle, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPassportView } from "@/lib/global/data";
import { emergencyAccessUrl } from "@/lib/wallet/passData";
import { audit } from "@/lib/audit";
import { Logo } from "@/components/Logo";
import { PrintButton } from "./PrintButton";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export const metadata = { title: "Print Emergency Card · XeivoraMed" };
export const dynamic = "force-dynamic";

/**
 * Printable wallet-sized emergency card (front + back). Minimal emergency
 * identity only; the QR resolves to the controlled emergency passport page.
 */
export default async function PrintCardPage() {
  const user = await requireUser();
  const view = await getPassportView(user.patientProfileId ?? "demo-patient-profile");
  const locale = await getLocale();
  if (!view || !view.globalId) {
    return <p className="p-6 text-slate-500">{t(locale, "pcNoPassport")}</p>;
  }

  const { globalId, passport } = view;
  const url = emergencyAccessUrl(globalId.globalId, globalId.emergencyToken);
  const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 0, width: 240, color: { dark: "#0f172a", light: "#ffffff" } });
  const lastUpdated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  await audit({
    actorId: user.id, actorRole: user.role, action: "PRINT_CARD_VIEWED",
    entityType: "MedicalPassportPass", subjectPatientId: user.patientProfileId,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 print:space-y-4">
      {/* Controls — hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/passport" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> {t(locale, "pcBack")}
        </Link>
        <PrintButton />
      </div>
      <p className="text-sm text-slate-500 print:hidden">
        {t(locale, "pcInstructions")}
      </p>

      {/* FRONT */}
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="flex items-center justify-between bg-brand-600 px-4 py-2 text-white">
          <Logo showText className="[&_span]:text-white" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-100">{t(locale, "pcEmergencyCard")}</span>
        </div>
        <div className="flex gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-700">{t(locale, "pcVerifiedPassport")}</p>
            <p className="mt-2 truncate text-lg font-bold text-slate-900">{passport.fullName}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">{globalId.globalId}</p>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 font-bold text-red-600">
                <Droplet className="h-4 w-4" /> {passport.bloodGroup}
              </span>
              <span className="text-slate-500">{t(locale, "ppDob")} {passport.dateOfBirth ? new Date(passport.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Image src={qr} alt="Emergency QR" width={96} height={96} unoptimized className="rounded" />
            <span className="mt-1 text-[9px] text-slate-400">{t(locale, "pcScanForEmergency")}</span>
          </div>
        </div>
      </div>

      {/* BACK */}
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm print:break-before-page">
        <div className="bg-slate-900 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-white">
          {t(locale, "pcForProviders")}
        </div>
        <div className="space-y-3 p-4 text-sm">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" /> {t(locale, "pcCriticalAllergies")}
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {passport.allergies.length ? passport.allergies.join(", ") : t(locale, "cNoneKnown")}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <Phone className="h-3.5 w-3.5" /> {t(locale, "cEmergencyContacts")}
            </p>
            <ul className="mt-1 space-y-0.5">
              {passport.emergencyContacts.map((c) => (
                <li key={c.phone} className="text-slate-800">
                  {c.name} <span className="text-xs text-slate-400">({c.relationship})</span> · {c.phone}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
            <p className="font-medium">{t(locale, "pcScanInstr")}</p>
            <p>{t(locale, "pcForProvidersLogged")}</p>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400">
            {t(locale, "pcDisclaimer")} {lastUpdated}.
          </p>
        </div>
      </div>
    </div>
  );
}
