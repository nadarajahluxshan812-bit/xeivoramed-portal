# XeivoraMed — architecture

> "One Patient. One Health Identity. Anywhere in the World."

This document covers the modules added on top of the existing XeivoraMed platform.
Everything is **additive** — no prior feature was removed. The modules degrade
gracefully in demo mode (no DB) so the whole experience is explorable offline.

---

## P1 — Global Health Memory Engine (`src/lib/global/memory.ts`)

Turns raw records into an **understood** journey:

- `deriveGraph(input)` → a **memory graph** of typed nodes (conditions, meds,
  procedures, surgeries, labs, allergies) and directed relationships
  (`TREATS`, `PROGRESSED_TO`, `PRESCRIBED_FOR`, `FOLLOWS`, …).
- `doctorBriefing(input)` → the "instead of 500 pages" one-glance summary.
- `riskSummary(input)` → AI risk flags (diabetes, CKD, polypharmacy, allergies…).
- `diseaseProgression(graph)` → ordered condition/lab trajectory.

Persisted in `MemoryNode` / `MemoryEdge`. UI: `/dashboard/memory`,
API: `GET /api/memory/graph`. Engine is deterministic (`rules-v1`); a graph DB +
LLM can replace `deriveGraph`/`riskSummary` behind the same interface.

## P2 — AI Specialist Medical Scribe (`src/lib/global/scribe.ts`)

Pipeline:

```
ambient audio → real-time STT (Whisper/Deepgram) → speaker diarization
   → specialty note generation (this layer) → human review → finalize → timeline
```

- 7 specialties, each with `focus` areas, `terminology` and an LLM `prompt`
  (`SPECIALTIES`).
- `generateNote(transcript, specialty, type)` produces SOAP / consultation /
  diagnosis / follow-up / referral / discharge notes from a diarized transcript.
- Persisted in `ScribeSession` / `ScribeNote` with `status` (RECORDING →
  TRANSCRIBED → DRAFTED → UNDER_REVIEW → FINALIZED) and `finalized`/reviewer for the
  **human-in-the-loop** requirement.

UI: `/doctor/scribe` (record/paste → generate → review/edit → finalize),
API: `POST /api/scribe/generate`. Real-time transcription + diarization are external
services wired at the STT boundary; the note layer is provider-agnostic.

## P3 — Global Language Engine (`src/lib/i18n/`)

- `locales.ts` — open-ended language set (12 shipped: EN, SI, TA, HI, AR, ZH, ES,
  FR, DE, JA, KO, RU) with RTL support.
- `concepts.ts` — clinical concepts stored by **coding system** (SNOMED / ICD-10 /
  RxNorm / LOINC) with per-language renderings; `renderConcept(label, locale)`
  renders any record in the patient's language without re-authoring.
- UI chrome ships fully for EN/SI/TA; other languages fall back to English chrome
  while **clinical terminology still translates**. Adding a language = adding data
  (`TerminologyConcept`), not code. The switcher sets document direction for RTL.

## P4 — Global Patient Identity

- `IdentityDocument` — multiple national IDs, passport, residence permit,
  vaccination passport (numbers AES-256-GCM encrypted at rest).
- `TravelHealthProfile` — emergency travel profile (blood group, conditions,
  vaccinations, destinations, notes).
- `FamilyMember` — guardian ↔ dependents (children / parents / elderly).

UI: `/dashboard/family`.

## P5 — Global Healthcare Network

`Provider` gained `trustScore` (0–100), `crossBorder`, `lastAuditAt`; new
`INSURANCE` provider type. Verification workflow + immutable provider/emergency
audit already exist (`/admin/providers`, `EmergencyAccessLog`).

## P6 — International Record Exchange (`src/lib/global/fhir.ts`)

`normalize(format, payload, origin)` now covers **FHIR R4 / CDA / NHS / PDF /
DICOM** → unified `StandardizedHealthEvent`. DICOM normalizes study-level header
tags (pixel data stays in PACS/S3). API: `POST /api/interop/import`.

## P7 — Emergency Access

Existing break-glass flow (immutable hash-chained `EmergencyAccessLog`, <3s
emergency view at `/passport/[healthId]`). Family alerting is a documented hook in
`/api/emergency/access` (fan out via the existing SMS/WhatsApp/push layer).

## P8 — Global Health Wallet

`WalletItem` (insurance, vaccinations, certificates, prescriptions, travel docs,
health passport, lab results). UI: `/dashboard/wallet`. Binaries in S3; structured
data optionally encrypted.

## P9 — Security

Encryption at rest (AES-256-GCM fields + S3 SSE) and in transit (HSTS); RBAC matrix
(`src/lib/rbac.ts`); append-only audit + hash-chained emergency log; consent
management; provider verification. **GDPR**: `POST /api/gdpr` handles export
(portability) and erasure-request (right to erasure with a review workflow for
legally-retained records). Zero-trust posture documented in `SECURITY.md`.

## P10 — UI/UX

Mobile-first responsive shell, accessible focus states, reduced-motion support,
new doctor scribe + family + wallet + memory workflows, 12-language switcher.

---

## Deployment

```bash
npm install                       # adds: qrcode (already), no new external services
npm run prisma:deploy             # applies prisma/migrations/*_healthlink_global
# or, on an existing DB:
npx prisma migrate dev --name healthlink_global
```

No new required env vars. The Memory/Scribe/Translation engines default to offline
`rules-v1`; to enable LLM generation, implement `llmSummarize` / `llmGenerate` and
add the provider key + a BAA. Smoke-test the new routes:
`/dashboard/memory`, `/dashboard/wallet`, `/dashboard/family`, `/doctor/scribe`,
`POST /api/memory/graph`, `POST /api/scribe/generate`, `POST /api/gdpr`.
