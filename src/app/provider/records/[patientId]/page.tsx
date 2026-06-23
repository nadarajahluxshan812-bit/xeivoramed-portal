import Link from "next/link";
import {
  ShieldCheck,
  FlaskConical,
  KeyRound,
  History,
  IdCard,
  Droplet,
  ArrowLeft,
  LayoutDashboard,
  Users,
  Mic,
  BadgeCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import {
  demoVerifiedItems,
  demoPassport,
  demoGlobalId,
  demoProviders,
  demoGrants,
  demoEmergencyLog,
} from "@/lib/global/demo";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { VerifiedItem, TrustBadge } from "@/components/global/TrustBadge";
import { DemoTag, NoData } from "@/components/DemoBadge";
import { formatDateTime } from "@/lib/format";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export const metadata = { title: "Patient record · Provider Portal · XeivoraMed" };

export default async function ProviderRecordPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const [user, locale] = await Promise.all([
    requireRole(["DOCTOR", "CLINIC_STAFF", "ADMIN"]),
    getLocale(),
  ]);
  await params; // patientId resolves to the demo patient below in DEMO_MODE

  const nav = [
    { href: "/doctor", label: t(locale, "dashboard"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/doctor", label: t(locale, "patients"), icon: <Users className="h-5 w-5" /> },
    { href: "/provider/scribe", label: t(locale, "scribe"), icon: <Mic className="h-5 w-5" /> },
  ];

  // DEMO_MODE: the fully-fleshed demo patient (Nimal Perera). Live mode → empty state.
  const hasRecord = isDemoMode;
  const verifiedSources = demoProviders.filter((p) => p.status === "APPROVED" || p.status === "VERIFIED");
  const grant = demoGrants.find((g) => g.status === "APPROVED") ?? demoGrants[0];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel="Provider portal" locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/doctor" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatebody hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to patients
        </Link>

        {!hasRecord ? (
          <Card>
            <NoData
              message="No verified record to show"
              hint="When a patient grants your clinic access, their verified record appears here."
            />
          </Card>
        ) : (
          <>
            {/* Identity header */}
            <Card className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/15">
                    <BadgeCheck className="h-3.5 w-3.5" /> Government-verified identity
                  </span>
                  <h1 className="mt-2 text-2xl font-semibold text-white">{demoPassport.fullName}</h1>
                  <p className="mt-0.5 text-sm text-brand-100">
                    {demoPassport.age}y · {demoPassport.district} · <span className="font-mono">{demoGlobalId.globalId}</span>
                  </p>
                </div>
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Droplet className="h-5 w-5 text-coral" />
                  <span className="text-lg font-bold">{demoPassport.bloodGroup}</span>
                </div>
              </div>
              {/* Consent + audit banner (visible to the provider) */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line bg-brand-50/60 px-6 py-3 text-xs text-slatebody">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <span>
                  You are viewing this record under patient consent
                  <span className="font-semibold text-ink"> (scope: {grant.scope.replace(/_/g, " ").toLowerCase()})</span>.
                  This access is recorded in the patient&rsquo;s tamper-evident audit log.
                </span>
                {isDemoMode && <DemoTag className="ml-auto" />}
              </div>
            </Card>

            {/* Three-way handshake — named, in-app */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Handshake
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Identity"
                body="Government-verified (NIC / passport) at onboarding."
                tag="Verified"
              />
              <Handshake
                icon={<FlaskConical className="h-5 w-5" />}
                title="Data"
                body={`From ${verifiedSources.length} certified labs & clinics — source shown on every value.`}
                tag="Certified"
              />
              <Handshake
                icon={<KeyRound className="h-5 w-5" />}
                title="Consent"
                body="Granted by the patient · per-provider · revocable anytime."
                tag="Granted"
              />
            </div>

            {/* The single verified record — provenance on EVERY value */}
            <Card>
              <SectionTitle
                title="Verified patient record"
                icon={<ShieldCheck className="h-5 w-5 text-brand-600" />}
                action={isDemoMode ? <DemoTag /> : undefined}
              />
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slatebody">
                <span>Every value shows its source and trust level:</span>
                <TrustBadge level="VERIFIED" />
                <TrustBadge level="DOCUMENT_VERIFIED" />
                <TrustBadge level="SELF_REPORTED" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {demoVerifiedItems.map((it, i) => (
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
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Certified data sources — the "data" leg */}
              <Card>
                <SectionTitle title="Certified data sources" icon={<FlaskConical className="h-5 w-5 text-brand-600" />} />
                <ul className="divide-y divide-slate-100">
                  {verifiedSources.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <FlaskConical className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                        <p className="truncate text-xs text-slatebody">
                          {p.city}, {p.country} · {p.type.replace(/_/g, " ").toLowerCase()} · lic. {p.licenseNumber}
                        </p>
                      </div>
                      <Badge tone="green">{p.status.toLowerCase()}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Consent basis — the "permission" leg, shown to the provider */}
              <Card>
                <SectionTitle title="Your access — consent basis" icon={<KeyRound className="h-5 w-5 text-brand-600" />} />
                <div className="rounded-xl border border-line bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{grant.provider.name}</p>
                    <Badge tone="green">{grant.status.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slatebody">
                    Scope: {grant.scope.replace(/_/g, " ").toLowerCase()} · granted by patient
                  </p>
                  <p className="mt-3 text-xs text-slatebody">
                    The patient can revoke this at any time from their Access Center. You only ever see what consent allows.
                  </p>
                </div>
              </Card>
            </div>

            {/* Audit — every access logged, shown to the provider too */}
            <Card>
              <SectionTitle
                title="Access audit log"
                icon={<History className="h-5 w-5 text-brand-600" />}
                action={<Badge tone="green">tamper-evident</Badge>}
              />
              <p className="mb-3 text-xs text-slatebody">
                Every access to this record — including yours — is hash-chained and visible to the patient.
              </p>
              <ol className="relative ml-3 space-y-4 border-l-2 border-slate-100 pl-6">
                {demoEmergencyLog.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-brand-50">
                      <ShieldCheck className="h-3 w-3 text-brand-600" />
                    </span>
                    <p className="text-sm font-medium text-ink">{e.actorName} · {e.provider}</p>
                    <p className="text-xs text-slatebody">
                      {e.reason.replace(/_/g, " ").toLowerCase()} · {e.location ?? "location n/a"} · {formatDateTime(e.createdAt)}
                    </p>
                    {e.verificationMethod && (
                      <p className="mt-0.5 text-[11px] font-medium text-brand-600">
                        verified via {e.verificationMethod.replace(/_/g, " ").toLowerCase()}
                      </p>
                    )}
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">hash {e.hash} ← {e.prevHash}</p>
                  </li>
                ))}
              </ol>
            </Card>

            <p className="flex items-center gap-2 rounded-xl bg-slate-100 p-4 text-xs text-slatebody">
              <IdCard className="h-4 w-4" />
              This is the patient&rsquo;s single verified record. Values are never shown equally — provenance is on every field, and the patient controls access.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Handshake({
  icon,
  title,
  body,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tag: string;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
        <Badge tone="green">{tag}</Badge>
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-slatebody">{body}</p>
    </Card>
  );
}
