import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Stethoscope,
  CalendarCheck,
  TrendingDown,
  Network,
  ArrowRight,
  History,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/env";
import { demoAdmin } from "@/lib/demo";
import { getAdminAnalytics } from "@/lib/analytics";
import { Card, SectionTitle, Badge, StatTile } from "@/components/ui";
import { DemoTag, NoData } from "@/components/DemoBadge";
import { formatDate } from "@/lib/format";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { DevReset } from "@/components/DevReset";

export const metadata = { title: "Admin · XeivoraMed" };

async function getRecentAnnouncements() {
  if (isDemoMode) return demoAdmin.recentAnnouncements;
  const rows = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 8 });
  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    channel: a.channel,
    audience: a.audience,
    sentCount: a.sentCount,
    sentAt: (a.sentAt ?? a.createdAt).toISOString(),
  }));
}

export default async function AdminDashboard() {
  const [user, locale, stats, announcements] = await Promise.all([
    requireRole("ADMIN"),
    getLocale(),
    getAdminAnalytics(),
    getRecentAnnouncements(),
  ]);

  const nav = [
    { href: "/admin", label: t(locale, "analytics"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/admin/providers", label: t(locale, "providerNetwork"), icon: <Network className="h-5 w-5" /> },
    { href: "/admin/scribe", label: t(locale, "scribe"), icon: <History className="h-5 w-5" /> },
    { href: "/admin", label: t(locale, "notifications"), icon: <Megaphone className="h-5 w-5" /> },
    { href: "/admin", label: t(locale, "users"), icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel={t(locale, "adminRole")} locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink">System analytics</h1>
          <DevReset />
        </div>

        {/* Provider network entry point */}
        <Link href="/admin/providers" className="flex items-center gap-3 rounded-2xl bg-brand-700 px-5 py-4 text-white transition hover:bg-brand-800">
          <Network className="h-6 w-6" />
          <div className="flex-1">
            <p className="font-semibold">Global Provider Network</p>
            <p className="text-sm text-brand-100">Verify and approve hospitals, labs, pharmacies & emergency centers.</p>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Link>

        {/* Usage — real counts only. No simulated growth, no random numbers. */}
        <Card>
          <SectionTitle
            title="Usage"
            icon={<LayoutDashboard className="h-5 w-5 text-brand-600" />}
            action={stats.demo ? <DemoTag /> : <span className="text-xs text-slate-400">Live · from database</span>}
          />
          {stats.hasData ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile label="Active patients" value={stats.activePatients.toLocaleString()} icon={<Users className="h-5 w-5" />} />
              <StatTile label="Active doctors" value={stats.activeDoctors.toLocaleString()} tone="green" icon={<Stethoscope className="h-5 w-5" />} />
              <StatTile label="Appointments this month" value={stats.appointmentsThisMonth.toLocaleString()} tone="brand" icon={<CalendarCheck className="h-5 w-5" />} />
              <StatTile
                label="Missed rate"
                value={stats.missedRatePct == null ? "—" : `${stats.missedRatePct}%`}
                sub={stats.missedRatePct == null ? "no completed visits yet" : undefined}
                tone="amber"
                icon={<TrendingDown className="h-5 w-5" />}
              />
            </div>
          ) : (
            <NoData message="No usage data available yet." hint="Metrics populate as patients, doctors and appointments are created." />
          )}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-sm">
            <StatTile label="Providers approved" value={stats.providersApproved} tone="green" icon={<CheckCircle2 className="h-5 w-5" />} />
            <StatTile label="Providers pending" value={stats.providersPending} tone="amber" icon={<Network className="h-5 w-5" />} />
          </div>
        </Card>

        {/* Notification center */}
        <Card>
          <SectionTitle title="Notification center" icon={<Megaphone className="h-5 w-5 text-brand-600" />} />
          <form action="/api/announcements" method="post" className="grid gap-3 sm:grid-cols-2">
            <input name="title" className="input sm:col-span-2" placeholder="Campaign title" />
            <textarea name="body" className="input sm:col-span-2" rows={3} placeholder="Message (SMS/WhatsApp)…" />
            <select name="channel" className="input">
              <option>SMS</option>
              <option>WHATSAPP</option>
            </select>
            <select name="audience" className="input">
              <option value="ALL">All patients</option>
              <option value="DISTRICT:Colombo">Colombo</option>
              <option value="DISTRICT:Jaffna">Jaffna</option>
            </select>
            <button className="btn-primary sm:col-span-2">Send campaign</button>
          </form>
        </Card>

        <Card>
          <SectionTitle
            title="Recent announcements"
            icon={<Megaphone className="h-5 w-5 text-brand-600" />}
            action={isDemoMode ? <DemoTag /> : undefined}
          />
          {announcements.length === 0 ? (
            <NoData message="No announcements sent yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {announcements.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.audience} · {formatDate(a.sentAt)}</p>
                  </div>
                  <Badge tone="brand">{a.channel}</Badge>
                  <span className="text-sm font-medium text-slate-600">{a.sentCount.toLocaleString()} sent</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
