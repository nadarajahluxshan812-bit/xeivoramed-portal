import Link from "next/link";
import { FileText, Phone, IdCard, QrCode, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPassportView } from "@/lib/global/data";
import { getPatientDashboard } from "@/lib/data/patient";
import { Card } from "@/components/ui";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import type { MessageKey } from "@/lib/i18n/messages";

export const metadata = { title: "Set up your passport · XeivoraMed" };
export const dynamic = "force-dynamic";

/**
 * Guided onboarding journey. Reflects the patient's *real* progress — documents
 * uploaded, contacts added, passport created, QR ready — and points to the next
 * action. No fabricated steps: each is a real capability the patient can complete.
 */
export default async function StartPage() {
  const user = await requireUser();
  const profileId = user.patientProfileId ?? "demo-patient-profile";
  const [view, dash] = await Promise.all([getPassportView(profileId), getPatientDashboard(profileId)]);
  const locale = await getLocale();

  const hasDocuments = dash.recentRecords.length > 0;
  const hasContacts = (view?.passport.emergencyContacts.length ?? 0) > 0;
  const hasPassport = Boolean(view?.globalId);

  const steps: {
    icon: typeof FileText;
    titleKey: MessageKey;
    bodyKey: MessageKey;
    ctaKey: MessageKey;
    href: string;
    done: boolean;
  }[] = [
    { icon: FileText, titleKey: "obStep1Title", bodyKey: "obStep1Body", ctaKey: "obStep1Cta", href: "/dashboard/records", done: hasDocuments },
    { icon: Phone, titleKey: "obStep2Title", bodyKey: "obStep2Body", ctaKey: "obStep2Cta", href: "/dashboard/passport", done: hasContacts },
    { icon: IdCard, titleKey: "obStep3Title", bodyKey: "obStep3Body", ctaKey: "obStep3Cta", href: "/dashboard/passport", done: hasPassport },
    { icon: QrCode, titleKey: "obStep4Title", bodyKey: "obStep4Body", ctaKey: "obStep4Cta", href: "/dashboard/passport/print", done: hasPassport },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  // The first not-yet-done step is the "current" one to highlight.
  const currentIndex = steps.findIndex((s) => !s.done);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <span className="badge bg-brand-50 text-brand-700">
          <ShieldCheck className="h-3.5 w-3.5" /> {t(locale, "emergencyPassport")}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{t(locale, "obTitle")}</h1>
        <p className="mt-1.5 text-slate-500">{t(locale, "obSubtitle")}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">
            {doneCount}/{steps.length} {t(locale, "obComplete")}
          </span>
          {!allDone && (
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">
              {t(locale, "obSkip")}
            </Link>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {allDone && (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Check className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{t(locale, "obAllDone")}</p>
              <p className="mt-1 text-sm text-slate-600">{t(locale, "obAllDoneBody")}</p>
              <Link href="/dashboard" className="btn-primary mt-3 text-sm">
                {t(locale, "obGoDashboard")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Steps */}
      <ol className="space-y-3">
        {steps.map((s, i) => {
          const isCurrent = i === currentIndex;
          return (
            <li key={s.titleKey}>
              <Card
                className={`flex items-center gap-4 ${isCurrent ? "ring-1 ring-brand-200" : ""} ${s.done ? "opacity-75" : ""}`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    s.done ? "bg-emerald-100 text-emerald-700" : isCurrent ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.done ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{t(locale, s.titleKey)}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{t(locale, s.bodyKey)}</p>
                </div>
                {s.done ? (
                  <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-emerald-600 sm:inline-flex">
                    <Check className="h-4 w-4" /> {t(locale, "obDone")}
                  </span>
                ) : (
                  <Link
                    href={s.href}
                    className={`shrink-0 ${isCurrent ? "btn-primary" : "btn-secondary"} text-sm`}
                  >
                    {t(locale, s.ctaKey)}
                  </Link>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
