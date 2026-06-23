import {
  LayoutDashboard,
  Megaphone,
  Users,
  Network,
  Hospital,
  Building2,
  FlaskConical,
  Pill,
  Ambulance,
  Globe,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getProviderRegistry } from "@/lib/global/data";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { Card, SectionTitle, Badge, StatTile, statusTone } from "@/components/ui";
import { ProviderVerifyControls } from "@/components/global/ProviderVerifyControls";

export const metadata = { title: "Provider Network · XeivoraMed" };

const typeIcon: Record<string, React.ReactNode> = {
  HOSPITAL: <Hospital className="h-5 w-5" />,
  CLINIC: <Building2 className="h-5 w-5" />,
  LABORATORY: <FlaskConical className="h-5 w-5" />,
  PHARMACY: <Pill className="h-5 w-5" />,
  EMERGENCY_CENTER: <Ambulance className="h-5 w-5" />,
};

export default async function ProviderRegistryPage() {
  const [user, locale, providers] = await Promise.all([
    requireRole("ADMIN"),
    getLocale(),
    getProviderRegistry(),
  ]);
  // Computed from real provider rows — no fabricated figures.
  const countries = new Set(providers.map((p) => p.country)).size;

  const nav = [
    { href: "/admin", label: t(locale, "analytics"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/admin/providers", label: t(locale, "providerNetwork"), icon: <Network className="h-5 w-5" /> },
    { href: "/admin", label: t(locale, "notifications"), icon: <Megaphone className="h-5 w-5" /> },
    { href: "/admin", label: t(locale, "users"), icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel={t(locale, "adminRole")} locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
            <Network className="h-6 w-6 text-brand-600" /> Global Provider Network
          </h1>
          <p className="text-sm text-slate-500">Registration → verification → approval → access permissions.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Providers" value={providers.length} icon={<Network className="h-5 w-5" />} />
          <StatTile label="Approved" value={providers.filter((p) => p.status === "APPROVED").length} tone="green" icon={<Hospital className="h-5 w-5" />} />
          <StatTile label="Pending" value={providers.filter((p) => ["REGISTERED", "PENDING_VERIFICATION", "VERIFIED"].includes(p.status)).length} tone="amber" icon={<FlaskConical className="h-5 w-5" />} />
          <StatTile label="Countries" value={countries} tone="brand" icon={<Globe className="h-5 w-5" />} />
        </div>

        <Card>
          <SectionTitle title="Provider registry" icon={<Network className="h-5 w-5 text-brand-600" />} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="py-2">Provider</th><th>Type</th><th>Country</th><th>License</th><th>Status</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{typeIcon[p.type]}</span>
                        <span className="font-medium text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-600">{p.type.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="text-slate-600">{p.city ? `${p.city}, ` : ""}{p.country}</td>
                    <td className="font-mono text-xs text-slate-500">{p.licenseNumber ?? "—"}</td>
                    <td><Badge tone={statusTone(p.status === "APPROVED" ? "CONFIRMED" : ["REGISTERED", "PENDING_VERIFICATION", "VERIFIED"].includes(p.status) ? "REQUESTED" : "CANCELLED")}>{p.status.replace(/_/g, " ").toLowerCase()}</Badge></td>
                    <td className="text-right"><ProviderVerifyControls providerId={p.id} status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
