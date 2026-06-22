"use client";

import { useRouter } from "next/navigation";
import { User, Stethoscope, Building2, ShieldCheck } from "lucide-react";

/**
 * Demo role switch. Sets the `demo_role` cookie so the chosen role drives a
 * consistent demo session across pages AND API routes, then lands on that
 * role's home.
 */
const ROLES = [
  { role: "PATIENT", href: "/dashboard", icon: User },
  { role: "DOCTOR", href: "/doctor", icon: Stethoscope },
  { role: "CLINIC_STAFF", href: "/clinic", icon: Building2 },
  { role: "ADMIN", href: "/admin", icon: ShieldCheck },
] as const;

export function DemoRoleButtons({ labels }: { labels: Record<string, string> }) {
  const router = useRouter();

  function choose(role: string, href: string) {
    document.cookie = `demo_role=${role}; path=/; max-age=86400; samesite=lax`;
    router.push(href);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {ROLES.map((r) => (
        <button
          key={r.role}
          onClick={() => choose(r.role, r.href)}
          className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <span className="text-brand-600"><r.icon className="h-4 w-4" /></span>
          {labels[r.role]}
        </button>
      ))}
    </div>
  );
}
