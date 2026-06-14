"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/locales";

const COOKIE = "sehat_locale";

/**
 * Global Language Engine switcher — all supported languages (open-ended set).
 * Persists the choice in a cookie, sets document direction for RTL languages, and
 * refreshes server components so localized strings + clinical concepts re-render.
 *
 * `current` seeds the initial value for SSR; the component then reads the cookie
 * directly so it reflects languages beyond the UI-chrome set (EN/SI/TA).
 */
export function LanguageSwitcher({
  current,
  variant = "segmented",
}: {
  current?: string;
  variant?: "segmented" | "compact";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<string>(current ?? "EN");

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)sehat_locale=([^;]+)/);
    if (m) setValue(m[1]);
  }, []);

  function choose(code: AppLocale) {
    setValue(code);
    document.cookie = `${COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
    const rtl = SUPPORTED_LOCALES.find((l) => l.code === code)?.rtl;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    startTransition(() => router.refresh());
  }

  return (
    <label className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs ${pending ? "opacity-60" : ""}`}>
      <Languages className="h-4 w-4 text-slate-400" aria-hidden />
      <span className="sr-only">Select language</span>
      <select
        value={value}
        onChange={(e) => choose(e.target.value as AppLocale)}
        className="cursor-pointer bg-transparent pr-1 font-semibold text-slate-700 outline-none"
        aria-label="Language"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {variant === "compact" ? l.native : `${l.native} · ${l.label}`}
          </option>
        ))}
      </select>
    </label>
  );
}
