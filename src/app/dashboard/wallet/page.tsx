import { Wallet, ShieldCheck, Syringe, FileCheck2, Pill, Plane, IdCard, FlaskConical, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getWallet } from "@/lib/global/hlg-data";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Health Wallet · XeivoraMed" };

const icon: Record<string, React.ReactNode> = {
  INSURANCE: <ShieldCheck className="h-5 w-5" />,
  VACCINATION: <Syringe className="h-5 w-5" />,
  CERTIFICATE: <FileCheck2 className="h-5 w-5" />,
  PRESCRIPTION: <Pill className="h-5 w-5" />,
  TRAVEL_DOCUMENT: <Plane className="h-5 w-5" />,
  HEALTH_PASSPORT: <IdCard className="h-5 w-5" />,
  LAB_RESULT: <FlaskConical className="h-5 w-5" />,
};

export default async function WalletPage() {
  const user = await requireUser();
  const items = await getWallet(user.patientProfileId ?? "demo-patient-profile");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          <Wallet className="h-6 w-6 text-brand-600" /> Global Health Wallet
        </h1>
        <p className="text-sm text-slate-500">All your health documents in one secure, portable place.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((w) => (
          <Card key={w.id} className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              {icon[w.type] ?? <FileCheck2 className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-slate-900">{w.title}</p>
                {w.verified && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
              </div>
              {w.issuer && <p className="text-xs text-slate-500">{w.issuer}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{w.type.replace(/_/g, " ").toLowerCase()}</Badge>
                {w.validUntil && <span className="text-xs text-slate-400">valid to {formatDate(w.validUntil)}</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="rounded-xl bg-slate-100 p-4 text-xs text-slate-500">
        Documents are encrypted at rest and shared only via short-lived links or your consent in the
        Access Center. The wallet travels with your XeivoraMed ID.
      </p>
    </div>
  );
}
