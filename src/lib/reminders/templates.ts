import type { Locale } from "@/lib/i18n/messages";
import type { ReminderKind } from "@prisma/client";

/**
 * Localized reminder message templates. Patient-facing copy is rendered in the
 * patient's preferred language at the moment the reminder is scheduled.
 */
type Vars = { name: string; when: string; detail?: string };

const TEMPLATES: Record<ReminderKind, Record<Locale, (v: Vars) => string>> = {
  APPOINTMENT: {
    EN: (v) => `Hi ${v.name}, reminder: appointment ${v.detail ?? ""} on ${v.when}. Reply or open XeivoraMed to manage. — XeivoraMed`,
    SI: (v) => `${v.name}, සිහිකැඳවීම: ${v.when} දින ${v.detail ?? ""} හමුවීම. XeivoraMed හි කළමනාකරණය කරන්න.`,
    TA: (v) => `${v.name}, நினைவூட்டல்: ${v.when} அன்று ${v.detail ?? ""} சந்திப்பு. XeivoraMed இல் நிர்வகிக்கவும்.`,
  },
  MEDICATION: {
    EN: (v) => `Time for your medicine: ${v.detail ?? ""} (${v.when}). Stay well — XeivoraMed`,
    SI: (v) => `ඔබේ ඖෂධ ගැනීමට වේලාවයි: ${v.detail ?? ""} (${v.when}). — XeivoraMed`,
    TA: (v) => `உங்கள் மருந்து நேரம்: ${v.detail ?? ""} (${v.when}). — XeivoraMed`,
  },
  DIALYSIS: {
    EN: (v) => `Dialysis session reminder: ${v.when} at ${v.detail ?? "your center"}. Please don't miss it. — XeivoraMed`,
    SI: (v) => `ඩයලිසිස් සැසිය: ${v.when}, ${v.detail ?? "ඔබේ මධ්‍යස්ථානය"}. කරුණාකර මග නොහරින්න. — XeivoraMed`,
    TA: (v) => `டயாலிசிஸ் அமர்வு: ${v.when}, ${v.detail ?? "உங்கள் மையம்"}. தவறவிடாதீர்கள். — XeivoraMed`,
  },
  FOLLOW_UP: {
    EN: (v) => `Follow-up due: ${v.detail ?? "checkup"} around ${v.when}. Book now on XeivoraMed.`,
    SI: (v) => `පසු විපරම: ${v.when} පමණ ${v.detail ?? "පරීක්ෂණය"}. XeivoraMed හි වෙන්කරන්න.`,
    TA: (v) => `பின்தொடர்தல்: ${v.when} வாக்கில் ${v.detail ?? "பரிசோதனை"}. XeivoraMed இல் பதிவு செய்.`,
  },
  TREATMENT: {
    EN: (v) => `Treatment reminder: ${v.detail ?? ""} on ${v.when}. — XeivoraMed`,
    SI: (v) => `ප්‍රතිකාර සිහිකැඳවීම: ${v.when} දින ${v.detail ?? ""}. — XeivoraMed`,
    TA: (v) => `சிகிச்சை நினைவூட்டல்: ${v.when} அன்று ${v.detail ?? ""}. — XeivoraMed`,
  },
  ANNUAL_CHECKUP: {
    EN: (v) => `Annual health check due, ${v.name}. Schedule it on XeivoraMed to stay ahead.`,
    SI: (v) => `${v.name}, වාර්ෂික සෞඛ්‍ය පරීක්ෂණය නියමිතයි. XeivoraMed හි සැලසුම් කරන්න.`,
    TA: (v) => `${v.name}, ஆண்டு சுகாதார பரிசோதனை. XeivoraMed இல் திட்டமிடுங்கள்.`,
  },
  ANNOUNCEMENT: {
    EN: (v) => v.detail ?? "",
    SI: (v) => v.detail ?? "",
    TA: (v) => v.detail ?? "",
  },
};

export function renderReminder(
  kind: ReminderKind,
  locale: Locale,
  vars: Vars
): string {
  const byLocale = TEMPLATES[kind];
  const fn = byLocale[locale] ?? byLocale.EN;
  return fn(vars);
}
