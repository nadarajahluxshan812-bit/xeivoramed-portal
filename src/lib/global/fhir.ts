/**
 * Module 6 — International record sharing / normalization engine.
 *
 * Converts inbound records from several standards into our internal
 * StandardizedHealthEvent shape. Supports:
 *   • HL7 FHIR R4 Bundles (JSON)
 *   • CDA documents (XML — section-level extraction)
 *   • NHS-style summary care records (JSON)
 *   • PDF uploads (metadata-only event; the file itself goes to S3)
 *
 * The goal is a single normalized timeline regardless of where a record came from.
 */

export type NormalizedEvent = {
  source: "HL7_FHIR" | "CDA" | "NHS" | "PDF_UPLOAD" | "INTERNAL" | "DICOM";
  type: "ENCOUNTER" | "CONDITION" | "MEDICATION" | "PROCEDURE" | "IMMUNIZATION" | "OBSERVATION" | "ALLERGY" | "SURGERY";
  codeSystem?: string;
  code?: string;
  title: string;
  description?: string;
  occurredAt: string; // ISO
  originName?: string;
  originCountry?: string;
  raw?: unknown;
};

const FHIR_TYPE_MAP: Record<string, NormalizedEvent["type"]> = {
  Encounter: "ENCOUNTER",
  Condition: "CONDITION",
  MedicationRequest: "MEDICATION",
  MedicationStatement: "MEDICATION",
  Procedure: "PROCEDURE",
  Immunization: "IMMUNIZATION",
  Observation: "OBSERVATION",
  AllergyIntolerance: "ALLERGY",
};

type FhirResource = {
  resourceType?: string;
  code?: { text?: string; coding?: { system?: string; code?: string; display?: string }[] };
  vaccineCode?: { text?: string; coding?: { system?: string; code?: string; display?: string }[] };
  effectiveDateTime?: string;
  occurrenceDateTime?: string;
  performedDateTime?: string;
  recordedDate?: string;
  authoredOn?: string;
  onsetDateTime?: string;
};

function pickDate(r: FhirResource): string {
  return (
    r.effectiveDateTime ||
    r.occurrenceDateTime ||
    r.performedDateTime ||
    r.recordedDate ||
    r.authoredOn ||
    r.onsetDateTime ||
    new Date().toISOString()
  );
}

function pickCode(r: FhirResource) {
  const c = (r.code ?? r.vaccineCode)?.coding?.[0];
  const title = (r.code ?? r.vaccineCode)?.text ?? c?.display ?? r.resourceType ?? "Health event";
  return { codeSystem: c?.system, code: c?.code, title };
}

/** Parse an HL7 FHIR R4 Bundle (or a single resource) into normalized events. */
export function normalizeFhir(bundle: unknown, origin?: { name?: string; country?: string }): NormalizedEvent[] {
  const entries: FhirResource[] = [];
  const b = bundle as { resourceType?: string; entry?: { resource?: FhirResource }[] };
  if (b?.resourceType === "Bundle" && Array.isArray(b.entry)) {
    for (const e of b.entry) if (e.resource) entries.push(e.resource);
  } else if (b?.resourceType) {
    entries.push(b as FhirResource);
  }

  return entries
    .filter((r) => r.resourceType && FHIR_TYPE_MAP[r.resourceType])
    .map((r) => {
      const { codeSystem, code, title } = pickCode(r);
      return {
        source: "HL7_FHIR" as const,
        type: FHIR_TYPE_MAP[r.resourceType!],
        codeSystem,
        code,
        title,
        occurredAt: pickDate(r),
        originName: origin?.name,
        originCountry: origin?.country,
        raw: r,
      };
    });
}

/** Very light CDA section extraction (clinical document title + entries). */
export function normalizeCda(xml: string, origin?: { name?: string; country?: string }): NormalizedEvent[] {
  const titleMatch = xml.match(/<title>([^<]+)<\/title>/i);
  const effective = xml.match(/<effectiveTime[^>]*value="(\d{8})/i);
  const occurredAt = effective
    ? new Date(`${effective[1].slice(0, 4)}-${effective[1].slice(4, 6)}-${effective[1].slice(6, 8)}`).toISOString()
    : new Date().toISOString();
  return [
    {
      source: "CDA",
      type: "ENCOUNTER",
      title: titleMatch?.[1]?.trim() || "CDA clinical document",
      occurredAt,
      originName: origin?.name,
      originCountry: origin?.country,
      raw: { length: xml.length },
    },
  ];
}

/** NHS-style summary care record (simplified JSON shape). */
export function normalizeNhs(doc: unknown, origin?: { name?: string; country?: string }): NormalizedEvent[] {
  const d = doc as { conditions?: string[]; medications?: string[]; allergies?: string[]; date?: string };
  const at = d?.date ?? new Date().toISOString();
  const out: NormalizedEvent[] = [];
  d?.conditions?.forEach((c) => out.push({ source: "NHS", type: "CONDITION", title: c, occurredAt: at, originName: origin?.name ?? "NHS", originCountry: origin?.country ?? "GB" }));
  d?.medications?.forEach((m) => out.push({ source: "NHS", type: "MEDICATION", title: m, occurredAt: at, originName: origin?.name ?? "NHS", originCountry: origin?.country ?? "GB" }));
  d?.allergies?.forEach((a) => out.push({ source: "NHS", type: "ALLERGY", title: a, occurredAt: at, originName: origin?.name ?? "NHS", originCountry: origin?.country ?? "GB" }));
  return out;
}

/**
 * DICOM imaging study → a PROCEDURE event from selected metadata tags.
 * (Pixel data stays in PACS/S3; we normalize the study-level header only.)
 */
export function normalizeDicom(
  tags: { Modality?: string; StudyDescription?: string; StudyDate?: string; InstitutionName?: string; BodyPartExamined?: string },
  origin?: { name?: string; country?: string }
): NormalizedEvent[] {
  const date = tags.StudyDate && /^\d{8}$/.test(tags.StudyDate)
    ? new Date(`${tags.StudyDate.slice(0, 4)}-${tags.StudyDate.slice(4, 6)}-${tags.StudyDate.slice(6, 8)}`).toISOString()
    : new Date().toISOString();
  const title = [tags.Modality, tags.StudyDescription || tags.BodyPartExamined].filter(Boolean).join(" — ") || "Imaging study";
  return [
    {
      source: "DICOM",
      type: "PROCEDURE",
      codeSystem: "DICOM",
      code: tags.Modality,
      title,
      occurredAt: date,
      originName: origin?.name ?? tags.InstitutionName,
      originCountry: origin?.country,
      raw: tags,
    },
  ];
}

/** A PDF upload becomes a single provenance event; the binary lives in S3. */
export function normalizePdf(meta: { title: string; occurredAt?: string; s3Key?: string; origin?: { name?: string; country?: string } }): NormalizedEvent[] {
  return [
    {
      source: "PDF_UPLOAD",
      type: "ENCOUNTER",
      title: meta.title,
      occurredAt: meta.occurredAt ?? new Date().toISOString(),
      originName: meta.origin?.name,
      originCountry: meta.origin?.country,
      raw: { s3Key: meta.s3Key },
    },
  ];
}

/** Single entry point used by the import API. */
export function normalize(
  format: "fhir" | "cda" | "nhs" | "pdf" | "dicom",
  payload: unknown,
  origin?: { name?: string; country?: string }
): NormalizedEvent[] {
  switch (format) {
    case "fhir":
      return normalizeFhir(payload, origin);
    case "cda":
      return normalizeCda(String(payload), origin);
    case "nhs":
      return normalizeNhs(payload, origin);
    case "pdf":
      return normalizePdf(payload as { title: string });
    case "dicom":
      return normalizeDicom(payload as Parameters<typeof normalizeDicom>[0], origin);
    default:
      return [];
  }
}
