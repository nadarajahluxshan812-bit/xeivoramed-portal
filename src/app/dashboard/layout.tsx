import {
  LayoutDashboard,
  CalendarDays,
  FolderHeart,
  Activity,
  Pill,
  IdCard,
  ShieldCheck,
  BrainCircuit,
  Wallet,
  Users,
  Droplet,
  Siren,
  History,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);

  // Primary: the Medical Passport is the product. Then documents, emergency
  // access and the access log. Everything else is grouped and de-emphasized.
  const nav = [
    { href: "/dashboard/passport", label: t(locale, "passport"), icon: <IdCard className="h-5 w-5" /> },
    { href: "/dashboard/records", label: "Documents", icon: <FolderHeart className="h-5 w-5" /> },
    { href: "/emergency-demo", label: t(locale, "emergencyAccess"), icon: <Siren className="h-5 w-5" /> },
    { href: "/dashboard/access", label: "Access Log", icon: <History className="h-5 w-5" /> },
    // Secondary day-to-day tools
    { href: "/dashboard", label: t(locale, "dashboard"), icon: <LayoutDashboard className="h-5 w-5" />, section: "More" },
    { href: "/dashboard/memory", label: t(locale, "healthMemory"), icon: <BrainCircuit className="h-5 w-5" /> },
    { href: "/dashboard/appointments", label: t(locale, "appointments"), icon: <CalendarDays className="h-5 w-5" /> },
    { href: "/dashboard/medications", label: t(locale, "medications"), icon: <Pill className="h-5 w-5" /> },
    { href: "/dashboard/timeline", label: t(locale, "timeline"), icon: <Activity className="h-5 w-5" /> },
    // Future features — present but not marketed
    { href: "/dashboard/wallet", label: t(locale, "wallet"), icon: <Wallet className="h-5 w-5" />, section: "Future features" },
    { href: "/dashboard/family", label: t(locale, "family"), icon: <Users className="h-5 w-5" /> },
    { href: "/dashboard/donor", label: t(locale, "donor"), icon: <Droplet className="h-5 w-5" /> },
  ];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel={t(locale, "patientRole")} locale={locale}>
      {children}
    </AppShell>
  );
}
