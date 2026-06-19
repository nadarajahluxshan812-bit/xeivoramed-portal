import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { DemoModeBadge } from "./DemoBadge";
import { t, type Locale } from "@/lib/i18n/messages";

export type NavItem = { href: string; label: string; icon: ReactNode; section?: string };

/**
 * Responsive application shell: left sidebar on desktop, bottom tab bar on mobile.
 * Used by all four role dashboards for a consistent, accessible layout.
 */
export function AppShell({
  nav,
  userName,
  roleLabel,
  locale = "EN",
  children,
}: {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  locale?: Locale;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200/70 bg-white px-5 py-6 md:flex">
        <div className="flex items-center justify-between px-2">
          <Logo />
          <DemoModeBadge />
        </div>
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto" aria-label="Primary">
          {nav.map((item, i) => (
            <div key={`${item.href}-${i}`}>
              {item.section && (
                <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700"
              >
                <span className="text-slate-400">{item.icon}</span>
                {item.label}
              </Link>
            </div>
          ))}
        </nav>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="mb-3 px-1">
            <LanguageSwitcher current={locale} />
          </div>
          <div className="flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials(userName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="mt-3 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-50">
              {t(locale, "logout")}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <Logo />
          <DemoModeBadge />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher current={locale} />
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials(userName)}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="px-5 pb-24 pt-6 md:ml-64 md:px-12 md:pb-14 md:pt-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200/70 bg-white/95 backdrop-blur md:hidden" aria-label="Primary mobile">
        {nav.slice(0, 5).map((item, i) => (
          <Link
            key={`${item.href}-${i}`}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500"
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}
