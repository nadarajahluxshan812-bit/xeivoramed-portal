/**
 * Priority 3 — Global Language Engine.
 *
 * The platform supports an open-ended set of languages. UI chrome ships fully
 * translated for EN/SI/TA (see messages.ts); every other language renders via the
 * concept layer (concepts.ts) + falls back to English for untranslated UI strings,
 * so adding a language never requires code changes — only data.
 */

export type AppLocale =
  | "EN" | "SI" | "TA" | "HI" | "AR" | "ZH" | "ES" | "FR" | "DE" | "JA" | "KO" | "RU";

export const SUPPORTED_LOCALES: { code: AppLocale; label: string; native: string; rtl?: boolean }[] = [
  { code: "EN", label: "English", native: "English" },
  { code: "SI", label: "Sinhala", native: "සිංහල" },
  { code: "TA", label: "Tamil", native: "தமிழ்" },
  { code: "HI", label: "Hindi", native: "हिन्दी" },
  { code: "AR", label: "Arabic", native: "العربية", rtl: true },
  { code: "ZH", label: "Mandarin", native: "中文" },
  { code: "ES", label: "Spanish", native: "Español" },
  { code: "FR", label: "French", native: "Français" },
  { code: "DE", label: "German", native: "Deutsch" },
  { code: "JA", label: "Japanese", native: "日本語" },
  { code: "KO", label: "Korean", native: "한국어" },
  { code: "RU", label: "Russian", native: "Русский" },
];

export function isRtl(code: string): boolean {
  return SUPPORTED_LOCALES.find((l) => l.code === code)?.rtl ?? false;
}

/** UI chrome is fully localized for these; others fall back to EN strings. */
export const FULL_UI_LOCALES: AppLocale[] = ["EN", "SI", "TA"];
