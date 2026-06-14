import { cookies } from "next/headers";
import type { Locale } from "./messages";
import type { AppLocale } from "./locales";
import { SUPPORTED_LOCALES, FULL_UI_LOCALES } from "./locales";

export const LOCALE_COOKIE = "sehat_locale";

function isLocale(v: string | undefined): v is Locale {
  return v === "EN" || v === "SI" || v === "TA";
}

/**
 * UI-chrome locale for `t()`. Only EN/SI/TA have full UI translations; any other
 * preferred language falls back to English chrome (clinical concepts still
 * translate via the concept layer).
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "EN";
}

/** The patient's full preferred language (any of the 12+), for concept rendering. */
export async function getPreferredLocale(): Promise<AppLocale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value as AppLocale | undefined;
  return SUPPORTED_LOCALES.some((l) => l.code === value) ? (value as AppLocale) : "EN";
}

export { FULL_UI_LOCALES };
