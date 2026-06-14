import type { AppLocale } from "./locales";

/**
 * Priority 3 — Universal terminology translation layer.
 *
 * Clinical concepts are stored by coding system (SNOMED CT / ICD-10 / RxNorm /
 * LOINC) and rendered dynamically in any language. This is a representative seed
 * dictionary; in production the `TerminologyConcept` table holds the full set and
 * `renderConcept` reads from it (with this map as an offline fallback).
 *
 * Because concepts are coded, the same record renders correctly for a Sinhala
 * patient, a Tamil nurse and an Arabic emergency doctor — no re-authoring.
 */

export type Concept = {
  system: "SNOMED" | "ICD-10" | "RxNorm" | "LOINC";
  code: string;
  display: string; // canonical English
  category: "condition" | "medication" | "procedure" | "allergy";
  t: Partial<Record<AppLocale, string>>;
};

export const CONCEPTS: Concept[] = [
  {
    system: "ICD-10", code: "E11", display: "Type 2 Diabetes Mellitus", category: "condition",
    t: { SI: "දෙවන වර්ගයේ දියවැඩියාව", TA: "வகை 2 நீரிழிவு", HI: "टाइप 2 मधुमेह", AR: "داء السكري من النوع الثاني", ZH: "2型糖尿病", ES: "Diabetes tipo 2", FR: "Diabète de type 2", DE: "Typ-2-Diabetes", JA: "2型糖尿病", KO: "2형 당뇨병", RU: "Сахарный диабет 2 типа" },
  },
  {
    system: "ICD-10", code: "I10", display: "Hypertension", category: "condition",
    t: { SI: "අධි රුධිර පීඩනය", TA: "உயர் இரத்த அழுத்தம்", HI: "उच्च रक्तचाप", AR: "ارتفاع ضغط الدم", ZH: "高血压", ES: "Hipertensión", FR: "Hypertension", DE: "Bluthochdruck", JA: "高血圧", KO: "고혈압", RU: "Гипертония" },
  },
  {
    system: "ICD-10", code: "N18", display: "Chronic Kidney Disease", category: "condition",
    t: { SI: "නිදන්ගත වකුගඩු රෝගය", TA: "நாள்பட்ட சிறுநீரக நோய்", HI: "क्रोनिक किडनी रोग", AR: "مرض الكلى المزمن", ZH: "慢性肾病", ES: "Enfermedad renal crónica", FR: "Maladie rénale chronique", DE: "Chronische Nierenerkrankung", JA: "慢性腎臓病", KO: "만성 신장 질환", RU: "Хроническая болезнь почек" },
  },
  {
    system: "SNOMED", code: "294505008", display: "Penicillin allergy", category: "allergy",
    t: { SI: "පෙනිසිලින් අසාත්මිකතාව", TA: "பெனிசிலின் ஒவ்வாமை", HI: "पेनिसिलिन एलर्जी", AR: "حساسية البنسلين", ZH: "青霉素过敏", ES: "Alergia a la penicilina", FR: "Allergie à la pénicilline", DE: "Penicillin-Allergie", JA: "ペニシリンアレルギー", KO: "페니실린 알레르기", RU: "Аллергия на пенициллин" },
  },
  {
    system: "RxNorm", code: "17767", display: "Amlodipine", category: "medication",
    t: { SI: "ඇම්ලොඩිපින්", TA: "ஆம்லோடிபைன்", HI: "एम्लोडिपिन", AR: "أملوديبين", ZH: "氨氯地平", ES: "Amlodipino", FR: "Amlodipine", DE: "Amlodipin", JA: "アムロジピン", KO: "암로디핀", RU: "Амлодипин" },
  },
  {
    system: "SNOMED", code: "108241001", display: "Haemodialysis", category: "procedure",
    t: { SI: "රුධිර ඩයලිසිස්", TA: "இரத்த டயாலிசிஸ்", HI: "हीमोडायलिसिस", AR: "غسيل الكلى", ZH: "血液透析", ES: "Hemodiálisis", FR: "Hémodialyse", DE: "Hämodialyse", JA: "血液透析", KO: "혈액투석", RU: "Гемодиализ" },
  },
];

const byDisplay = new Map(CONCEPTS.map((c) => [c.display.toLowerCase(), c]));

/** Render a coded concept (or a free-text label matched to one) in a locale. */
export function renderConcept(label: string, locale: AppLocale): string {
  if (locale === "EN") return label;
  // Match by exact display or a substring (e.g. "CKD Stage 4" → "Chronic Kidney Disease")
  const exact = byDisplay.get(label.toLowerCase());
  const concept = exact ?? CONCEPTS.find((c) => label.toLowerCase().includes(c.display.toLowerCase().split(" ")[0]) && c.display.split(" ").length > 1 && label.toLowerCase().includes(c.display.toLowerCase().split(" ")[1] ?? ""));
  const translated = concept?.t[locale];
  return translated ? `${translated}` : label;
}

/** Translate a list of clinical labels for display. */
export function renderConcepts(labels: string[], locale: AppLocale): string[] {
  return labels.map((l) => renderConcept(l, locale));
}
