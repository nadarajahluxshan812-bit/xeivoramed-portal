import Image from "next/image";
import {
  IdCard,
  Droplet,
  HeartPulse,
  Pill,
  Scissors,
  Syringe,
  Phone,
  ShieldCheck,
  Sparkles,
  Globe,
  Download,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPassportView } from "@/lib/global/data";
import { isDemoMode, isConfigured } from "@/lib/env";
import { demoVerifiedItems } from "@/lib/global/demo";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { DemoTag, NoData } from "@/components/DemoBadge";
import { VerifiedItem } from "@/components/global/TrustBadge";
import { WalletActions } from "@/components/global/WalletActions";
import { formatDate } from "@/lib/format";
import { PassportActions } from "@/components/global/PassportActions";
import { CreatePassportButton } from "@/components/global/CreatePassportButton";
import { Wallet } from "lucide-react";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export const metadata = { title: "Emergency Medical Passport · XeivoraMed" };

export default async function PassportPage() {
  const user = await requireUser();
  const view = await getPassportView(user.patientProfileId ?? "demo-patient-profile");
  const locale = await getLocale();
  if (!view) return <p className="p-6 text-slate-500">{t(locale, "ppNoProfile")}</p>;

  // Live mode: the patient hasn't generated a passport yet → create flow, no demo data.
  if (!view.globalId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
            <IdCard className="h-6 w-6 text-brand-600" /> {t(locale, "ppTitle")}
          </h1>
          <p className="text-sm text-slate-500">{t(locale, "ppSubtitle")}</p>
        </div>
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <IdCard className="h-7 w-7" />
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-900">{t(locale, "ppNoPassport")}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {t(locale, "ppNoPassportBody")}
            </p>
          </div>
          <CreatePassportButton />
        </Card>
      </div>
    );
  }

  const { globalId, passport, briefings, qr } = view;
  const passportLink = `/passport/${globalId.globalId}?t=${globalId.emergencyToken}`;
  // Per-item provenance (source / trust level / date verified) — demo data for now.
  const verifiedItems = isDemoMode ? demoVerifiedItems : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
            <IdCard className="h-6 w-6 text-brand-600" /> {t(locale, "ppTitle")}
          </h1>
          <p className="text-sm text-slate-500">{t(locale, "ppSubtitle")}</p>
        </div>
        <PassportActions globalId={globalId.globalId} passportLink={passportLink} />
      </div>

      {/* ID card + QR */}
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
          <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white">
            <div className="flex items-center gap-2 text-brand-100">
              <Globe className="h-4 w-4" /> <span className="text-xs font-semibold uppercase tracking-wider">{t(locale, "lpCardIdLabel")}</span>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold tracking-wide">{globalId.globalId}</p>
            <p className="mt-1 text-brand-100">{passport.fullName}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span><span className="text-brand-200">{t(locale, "ppDob")}</span> {passport.dateOfBirth ? formatDate(passport.dateOfBirth) : "—"}</span>
              <span><span className="text-brand-200">{t(locale, "ppBlood")}</span> {passport.bloodGroup}</span>
              {passport.organDonor && <span className="inline-flex items-center gap-1"><HeartPulse className="h-4 w-4" /> {t(locale, "organDonor")}</span>}
            </div>
            <p className="mt-4 text-xs text-brand-200">{t(locale, "ppPassportVersion")}{globalId.passportVersion} · {t(locale, "ppScanHint")}</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 p-6">
            {qr ? (
              <Image src={qr} alt="Emergency passport QR code" width={150} height={150} className="rounded-lg" unoptimized />
            ) : (
              <div className="flex h-[150px] w-[150px] items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">QR</div>
            )}
            <span className="text-xs text-slate-400">{t(locale, "ppEmergencyQr")}</span>
          </div>
        </div>
      </Card>

      {/* Add your Medical Passport — wallet-ready pass */}
      <Card>
        <SectionTitle title={t(locale, "ppAddTitle")} icon={<Wallet className="h-5 w-5 text-brand-600" />} />
        <p className="mb-3 text-sm text-slate-600">
          {t(locale, "ppAddBody")}
          <span className="mt-1 block text-xs text-slate-400">
            {t(locale, "ppAddBody2")}
          </span>
        </p>
        <WalletActions appleConfigured={isConfigured.appleWallet} googleConfigured={isConfigured.googleWallet} />
      </Card>

      {/* Verified emergency information — the core of the passport */}
      <Card>
        <SectionTitle
          title={t(locale, "ppVerifiedTitle")}
          icon={<ShieldCheck className="h-5 w-5 text-brand-600" />}
          action={isDemoMode ? <DemoTag /> : undefined}
        />
        {verifiedItems.length === 0 ? (
          <NoData message={t(locale, "ppNoVerified")} hint={t(locale, "ppNoVerifiedHint")} />
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-500">
              {t(locale, "ppVerifiedHelp")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {verifiedItems.map((it, i) => (
                <VerifiedItem
                  key={`${it.label}-${i}`}
                  label={it.label}
                  value={it.value}
                  level={it.level}
                  source={it.source}
                  dateVerified={it.dateVerified}
                  danger={it.label === "Allergy"}
                />
              ))}
            </div>
          </>
        )}
      </Card>

      {/* AI briefing */}
      <Card>
        <SectionTitle title={t(locale, "ppAiTitle")} icon={<Sparkles className="h-5 w-5 text-brand-600" />} action={<Badge tone="brand">{briefings[0]?.engine}</Badge>} />
        <div className="rounded-xl bg-brand-50 p-4 text-sm text-slate-800">{briefings.find((b) => b.kind === "EMERGENCY")?.content}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {briefings.filter((b) => b.kind !== "EMERGENCY").map((b) => (
            <div key={b.kind} className="rounded-xl border border-slate-100 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">{b.kind.replace(/_/g, " ").toLowerCase()}</p>
              <p className="whitespace-pre-line text-xs text-slate-600">{b.content}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Passport details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title={t(locale, "ppCriticalTitle")} icon={<Droplet className="h-5 w-5 text-danger-500" />} />
          <dl className="space-y-3 text-sm">
            <Row label={t(locale, "cBloodGroup")} value={passport.bloodGroup} />
            <Row label={t(locale, "cAllergies")} value={passport.allergies.length ? passport.allergies.join(", ") : t(locale, "cNoneKnown")} danger={passport.allergies.length > 0} />
            <Row label={t(locale, "cChronicConditions")} value={passport.chronicConditions.join(", ") || t(locale, "cNone")} />
            <Row label={t(locale, "ppImplants")} value={passport.implants.length ? passport.implants.join(", ") : t(locale, "cNone")} />
            <Row label={t(locale, "ppDialysis")} value={passport.dialysis ? `${passport.dialysis.centerName} · ${passport.dialysis.sessionsPerWeek}${t(locale, "dbPerWeek")}` : t(locale, "ppNo")} />
          </dl>
        </Card>

        <Card>
          <SectionTitle title={t(locale, "cCurrentMedications")} icon={<Pill className="h-5 w-5 text-brand-600" />} />
          <ul className="space-y-2 text-sm">
            {passport.medications.map((m) => (
              <li key={m.drugName} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">{m.drugName} {m.dosage}</span>
                <span className="text-xs text-slate-400">{m.times?.join(", ")}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle title={t(locale, "ppSurgicalTitle")} icon={<Scissors className="h-5 w-5 text-brand-600" />} />
          <ul className="space-y-2 text-sm">
            {passport.surgeries.map((s) => (
              <li key={s.name} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="font-medium text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-400">{s.performedAt ? formatDate(s.performedAt) : t(locale, "ppDateUnknown")}{s.hospital ? ` · ${s.hospital}` : ""}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle title={t(locale, "ppContactsInsuranceTitle")} icon={<Phone className="h-5 w-5 text-brand-600" />} />
          {passport.emergencyContacts.length === 0 && passport.insurance.length === 0 && (
            <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">{t(locale, "contactsEmpty")}</p>
          )}
          <ul className="space-y-2 text-sm">
            {passport.emergencyContacts.map((c) => (
              <li key={c.phone} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span><span className="font-medium text-slate-800">{c.name}</span> <span className="text-xs text-slate-400">({c.relationship})</span></span>
                <a href={`tel:${c.phone}`} className="text-brand-700">{c.phone}</a>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2">
            {passport.insurance.map((p) => (
              <div key={p.insurer} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-slate-800">{p.insurer}</span>
                <span className="text-xs text-slate-400">{p.policy} · {p.coverage}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-4 text-xs text-slate-500">
        <Syringe className="h-4 w-4" />
        {t(locale, "ppOwnedNote")}{" "}
        <a href="/dashboard/access" className="font-semibold text-brand-700">{t(locale, "accessCenter")}</a>.
        <a href={passportLink} target="_blank" className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-700">
          <Download className="h-3.5 w-3.5" /> {t(locale, "ppPreviewEmergency")}
        </a>
      </div>
    </div>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right font-medium ${danger ? "text-danger-600" : "text-slate-800"}`}>{value}</dd>
    </div>
  );
}
