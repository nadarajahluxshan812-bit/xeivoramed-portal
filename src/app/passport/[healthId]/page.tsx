import Link from "next/link";
import { Droplet, AlertTriangle, Pill, HeartPulse, Scissors, Phone, ShieldAlert, Globe, Activity, History, ArrowRight } from "lucide-react";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { demoGlobalId, demoPassport, demoVerifiedItems } from "@/lib/global/demo";
import { recordEmergencyAccess } from "@/lib/global/emergency";
import { formatDate } from "@/lib/format";
import { LegalStrip } from "@/components/Disclaimers";
import { TrustBadge } from "@/components/global/TrustBadge";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export const metadata = { title: "Emergency Health Passport · XeivoraMed" };
// Always render fresh (emergency data must never be stale-cached).
export const dynamic = "force-dynamic";

/**
 * Module 2 — Emergency Health Passport (public, token-gated).
 * Authorized responders scan a QR → land here → see life-critical data instantly.
 * Every view appends an immutable emergency-access entry (Module 5).
 * Optimised to render server-side in well under 3 seconds.
 */
export default async function EmergencyPassportPage({
  params,
  searchParams,
}: {
  params: Promise<{ healthId: string }>;
  searchParams: Promise<{ t?: string; print?: string; demo?: string; via?: string }>;
}) {
  const { healthId } = await params;
  const { t: token, print, demo, via } = await searchParams;
  const isDemo = demo === "1";
  const methodLabel = via ? via.replace(/_/g, " ").toLowerCase() : null;
  const locale = await getLocale();

  const data = await loadEmergencyPassport(healthId, token);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 p-6 text-center text-white">
        <div>
          <ShieldAlert className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="mt-4 text-xl font-bold">{t(locale, "epNotFound")}</h1>
          <p className="mt-2 text-slate-300">{t(locale, "epNotFoundBody")}</p>
        </div>
      </main>
    );
  }

  const p = data.passport;
  const printMode = print === "1";

  return (
    <main className={printMode ? "bg-white p-8 text-slate-900" : "min-h-screen bg-slate-50"}>
      {/* Emergency banner */}
      {!printMode && (
        <div className="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
          {t(locale, "epBanner")}
        </div>
      )}

      {/* Demo guide ribbon */}
      {isDemo && !printMode && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          <span className="font-semibold">Demo · Step 3 of 4</span> — what a verified emergency provider sees
          {methodLabel ? <> after <span className="font-semibold">{methodLabel}</span> verification</> : " after scanning the ID"}. Sample patient; access has been logged.
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                <Globe className="h-4 w-4" /> {t(locale, "lpCardIdLabel")}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{p.fullName}</h1>
              <p className="text-sm text-slate-500">{data.globalId} · {t(locale, "ppDob")} {p.dateOfBirth ? formatDate(p.dateOfBirth) : "—"}{p.age ? ` · ${p.age}y` : ""}</p>
            </div>
            <div className="text-right">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-red-50">
                <Droplet className="h-6 w-6 text-red-500" />
                <span className="text-lg font-bold text-red-600">{p.bloodGroup}</span>
              </div>
              {p.organDonor && <p className="mt-1 text-xs font-medium text-emerald-600">{t(locale, "organDonor")}</p>}
            </div>
          </div>
          {/* Emergency Blood Network integration (Part 7) — one-click compatible-blood request */}
          {!printMode && p.bloodGroup && p.bloodGroup !== "—" && (
            <Link
              href={`/clinic/blood?need=${encodeURIComponent(p.bloodGroup)}`}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Droplet className="h-4 w-4" /> {t(locale, "epRequestBlood")} ({p.bloodGroup})
            </Link>
          )}
        </div>

        {/* Verified emergency information — trust level visible per item (demo) */}
        {isDemo && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
              <ShieldAlert className="h-5 w-5 text-brand-600" /> {t(locale, "epVerifiedInfo")}
            </h2>
            <ul className="space-y-2">
              {demoVerifiedItems.filter((it) => it.critical).map((it, i) => (
                <li key={`${it.value}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="min-w-0 text-sm">
                    <span className="text-slate-400">{it.label}: </span>
                    <span className="font-semibold text-slate-900">{it.value}</span>
                  </span>
                  <TrustBadge level={it.level} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-400">{t(locale, "epTrustNote")}</p>
          </div>
        )}

        {/* Allergies — most critical, first */}
        <Section title={t(locale, "cAllergies")} icon={<AlertTriangle className="h-5 w-5 text-red-500" />} danger>
          {p.allergies.length ? (
            <div className="flex flex-wrap gap-2">
              {p.allergies.map((a) => (
                <span key={a} className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700">{a}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t(locale, "epNoAllergies")}</p>
          )}
        </Section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Section title={t(locale, "cCurrentMedications")} icon={<Pill className="h-5 w-5 text-brand-600" />}>
            <ul className="space-y-1.5 text-sm">
              {p.medications.map((m) => (
                <li key={m.drugName} className="flex justify-between"><span className="font-medium">{m.drugName} {m.dosage}</span><span className="text-slate-400">{m.times?.join(", ")}</span></li>
              ))}
            </ul>
          </Section>

          <Section title={t(locale, "cChronicConditions")} icon={<HeartPulse className="h-5 w-5 text-brand-600" />}>
            <ul className="space-y-1 text-sm">
              {p.chronicConditions.map((c) => <li key={c} className="font-medium text-slate-800">• {c}</li>)}
            </ul>
            {p.dialysis && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <Activity className="mr-1 inline h-3.5 w-3.5" /> {t(locale, "epOnDialysis")} {p.dialysis.sessionsPerWeek}{t(locale, "dbPerWeek")} {t(locale, "epOnDialysisAt")} {p.dialysis.centerName}
              </p>
            )}
          </Section>

          <Section title={t(locale, "cRecentSurgeries")} icon={<Scissors className="h-5 w-5 text-brand-600" />}>
            <ul className="space-y-1 text-sm">
              {p.surgeries.slice(0, 3).map((s) => (
                <li key={s.name}><span className="font-medium text-slate-800">{s.name}</span> <span className="text-xs text-slate-400">{s.performedAt ? formatDate(s.performedAt) : ""}</span></li>
              ))}
            </ul>
          </Section>

          <Section title={t(locale, "cEmergencyContacts")} icon={<Phone className="h-5 w-5 text-brand-600" />}>
            <ul className="space-y-1.5 text-sm">
              {p.emergencyContacts.map((c) => (
                <li key={c.phone} className="flex justify-between"><span className="font-medium text-slate-800">{c.name} <span className="text-xs text-slate-400">({c.relationship})</span></span><a href={`tel:${c.phone}`} className="text-brand-700">{c.phone}</a></li>
              ))}
            </ul>
          </Section>
        </div>

        {/* Guided next step (demo) */}
        {isDemo && !printMode && (
          <Link
            href="/dashboard/access"
            className="flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-4 text-white transition hover:bg-slate-800"
          >
            <History className="h-6 w-6" />
            <div className="flex-1">
              <p className="font-semibold">Step 4 — See who accessed this record</p>
              <p className="text-sm text-slate-300">The patient and family can audit every emergency access — including the verification method used.</p>
            </div>
            <ArrowRight className="h-5 w-5" />
          </Link>
        )}

        <div className="rounded-xl bg-slate-100 p-3 text-center text-xs text-slate-500">
          {t(locale, "epAccessed")} {formatDate(new Date().toISOString())} · {t(locale, "epLogged")}
        </div>

        {!printMode && <LegalStrip className="px-2 text-center" />}
      </div>
    </main>
  );
}

function Section({ title, icon, children, danger }: { title: string; icon: React.ReactNode; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 ${danger ? "border-red-200" : "border-slate-200"}`}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">{icon}{title}</h2>
      {children}
    </div>
  );
}

/** Token-checked load + immutable emergency-access logging. */
async function loadEmergencyPassport(healthId: string, token?: string) {
  if (!token) return null;

  if (isDemoMode) {
    if (healthId !== demoGlobalId.globalId) return null;
    await recordEmergencyAccess({
      patientId: "demo-patient-profile",
      actorName: "Emergency responder (demo)",
      reason: "UNCONSCIOUS_PATIENT",
      scope: "EMERGENCY_ONLY",
    });
    return { globalId: demoGlobalId.globalId, passport: demoPassport };
  }

  const gid = await prisma.globalHealthId.findUnique({
    where: { globalId: healthId },
    include: {
      patient: {
        include: {
          user: true,
          emergencyContacts: true,
          surgeries: { orderBy: { performedAt: "desc" }, take: 5 },
          medications: { where: { isActive: true } },
          dialysisPlan: true,
        },
      },
    },
  });
  if (!gid || !gid.isActive || gid.emergencyToken !== token) return null;

  const prof = gid.patient;
  await recordEmergencyAccess({
    patientId: prof.id,
    actorName: "Emergency responder",
    reason: "UNCONSCIOUS_PATIENT",
    scope: "EMERGENCY_ONLY",
  });

  return {
    globalId: gid.globalId,
    passport: {
      fullName: prof.user.fullName,
      dateOfBirth: prof.dateOfBirth?.toISOString() ?? null,
      age: prof.dateOfBirth ? Math.floor((Date.now() - prof.dateOfBirth.getTime()) / 3.15576e10) : null,
      bloodGroup: prof.bloodGroup ?? "—",
      organDonor: gid.organDonor,
      allergies: prof.allergies,
      chronicConditions: prof.chronicConditions,
      medications: prof.medications.map((m) => ({ drugName: m.drugName, dosage: m.dosage, times: m.times })),
      surgeries: prof.surgeries.map((s) => ({ name: s.name, performedAt: s.performedAt?.toISOString() ?? null })),
      dialysis: prof.dialysisPlan ? { centerName: prof.dialysisPlan.centerName, sessionsPerWeek: prof.dialysisPlan.sessionsPerWeek } : null,
      emergencyContacts: prof.emergencyContacts.map((c) => ({ name: c.name, relationship: c.relationship, phone: c.phone })),
    },
  };
}
