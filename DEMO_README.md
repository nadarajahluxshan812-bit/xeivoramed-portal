# XeivoraMed — demo guide

> **Verified Emergency Medical Passport**
> One patient. One verified medical passport. Anywhere.
> When a patient cannot speak, critical medical information should. Patients upload medical
> documents; XeivoraMed verifies identity and extracts emergency information; verified providers
> can access it when it matters most — every field labelled with its source and trust level, every
> access audited.

This is a **research / pilot platform**. It is not a certified medical or compliance product, and
makes no claim of HIPAA/GDPR certification at this stage. All figures shown are **demo data**.

---

## Product vision

The moment it matters most — a patient who can't speak for themselves — clinicians act on
incomplete information. XeivoraMed is a **Verified Emergency Medical Passport**: each patient builds
a passport from their own medical documents, where every fact carries a **trust level** —
**Verified** (hospital/lab/doctor), **Document Verified** (extracted from an uploaded report), or
**Self Reported** — so a clinician instantly knows what to trust. Access is gated to verified
providers and written to an **immutable audit trail** the patient controls.

**Roadmap:** 1) Passport (now) → 2) Provider Network → 3) Blood Network → 4) AI Scribe →
5) Healthcare Continuity Platform. These later modules exist in the codebase but are intentionally
de-emphasized — the product is the Passport.

---

## The 60-second demo flow

The story: **a patient becomes unconscious abroad. XeivoraMed enables verified providers to
access critical medical information in seconds while maintaining patient ownership, auditability,
and global continuity.** No login or setup — runs in **demo mode** with a realistic sample patient.

1. **Landing** (`/`) → **"Try Emergency Demo"**.
2. **Provider verification** (`/emergency-demo`) → choose a method: Scan QR, Enter Health ID,
   or a **biometric demo** (Face / Fingerprint; Palm / Iris shown as "future"). Enter a clinical
   reason → simulated verify.
3. **Emergency Health Passport** (`/passport/…?demo=1&via=FACE`) — blood group, **allergies first**,
   medications, conditions, dialysis status, contacts. Server-rendered in well under 3 seconds; a
   banner shows the verification method and notes the access was logged.
4. **Audit log** (`/dashboard/access`) — the patient's tamper-evident emergency-access log
   (who / when / why / where / **method**, hash-chained).

Also worth showing:
- **Provider break-glass console** (`/emergency`, as a doctor) — pick a verification method + reason.
- **AI Specialist Scribe** (`/doctor/scribe` or `/provider/scribe`) — clinician-only; draft → review → finalize.
- **Global Health Passport** (`/dashboard/passport`) — the patient's ID card + QR + AI briefing.
- **For Healthcare Leaders** (`/for-healthcare-leaders`) — problem framing, 5 discovery questions, waitlist.

### AI Scribe access control (verify in the demo)
Sign in via the login role buttons, then try `/doctor/scribe`:
- **Doctor / Provider staff** → full access (use · review · finalize).
- **Admin** → redirected from `/doctor/scribe`; can **audit** at `/admin/scribe` (read-only).
- **Patient / Public** → blocked (redirected to login).

Sample patient: **Nimal Perera, 58** · O+ · CKD Stage 4 + Hypertension · on dialysis 3×/week ·
allergies: Penicillin, Contrast dye · Global ID `HLX-LK-7F3A-9KQ2`.

---

## What is actually working

- Emergency passport view, token-gated, server-rendered < 3s, with real access logging.
- **Immutable, hash-chained** emergency audit log + chain verification (`lib/global/emergency.ts`).
- Patient consent center: approve / revoke providers; view audit trail (`/dashboard/access`).
- Provider registry + verification workflow (`/admin/providers`), RBAC enforced across pages **and** APIs.
- QR generation for the emergency passport (`qrcode`).
- Record interoperability/normalization for FHIR / CDA / NHS / PDF / DICOM → one model.
- Deterministic AI engines (continuity briefing, memory graph, risk summary, specialty scribe notes).
- Full Prisma schema + additive SQL migrations for every model.
- Demo mode that renders the entire product with no database or external keys.
- **Biometric-ready emergency verification** (architecture + demo): method selection (QR / Health ID /
  Passport / National ID / Face / Fingerprint), the chosen method recorded on the immutable audit
  entry, and `BiometricCredential` / `BiometricVerificationAttempt` models storing **only template hashes**.
- **AI Scribe RBAC**: `scribe:use/review/finalize` for doctors + provider staff; `scribe:audit` for
  admin; patients & public denied — enforced on pages **and** the API.

## What is mocked / stubbed (honest list)

- **Biometric verification is demonstration-only.** No camera/sensor data is read; matching is
  simulated. Production would require certified biometric providers, explicit consent, and
  jurisdiction-specific regulatory approval. We never store raw biometrics — only template hashes.

- **Demo mode** serves seeded fixtures (one sample patient) instead of a live Postgres/Supabase.
- **Provider verification** is a manual admin workflow; no real credential/regulator integration yet.
- **AI** runs an offline, deterministic `rules-v1` engine. Real LLM generation (Claude) is a wired
  extension point (`llmSummarize` / `llmGenerate`) — not enabled by default, so no PHI leaves the app.
- **Ambient scribe** accepts a transcript; real-time speech-to-text + speaker diarization are the
  documented integration boundary, not implemented.
- **Notifications** (SMS/WhatsApp/push) log in dry-run unless Twilio/WhatsApp/VAPID keys are set.
- **Family alert on emergency access** is a documented hook, not yet wired to the notification layer.
- **GDPR erase** records a request + deactivates; it does not hard-delete legally-retained records.

## Security assumptions

- Auth via Supabase; RBAC matrix in `lib/rbac.ts`; every PHI access audited.
- AES-256-GCM field encryption for sensitive identifiers; S3 objects encrypted at rest; HSTS in transit.
- Emergency access is **break-glass**: verified-provider-gated, reason-required, hash-chained, append-only.
- Documents served only via short-lived presigned URLs.
- **Not yet done:** third-party security audit, formal threat model, RLS on all anon-key tables,
  WORM storage for the audit log, vendor BAAs. See `SECURITY.md`.

## Roadmap

1. **Now:** validate the emergency-access model with EDs and travellers; design-partner pilots.
2. **Next:** real provider verification (regulator/credential checks); WORM audit storage; live STT for scribe.
3. **Later:** insurer + cross-border data exchange; LLM-backed summaries (with BAAs); national-ID integrations.

## What we need to validate next

- Will clinicians **trust and act** on an externally-sourced emergency summary? What's the minimum bar?
- What's the real-world **provider verification** path that hospitals will accept?
- Do patients want — and will they actually use — **consent + audit** controls?
- Which **wedge market** pulls hardest: medical tourism / travellers, dialysis & chronic patients,
  or emergency services?

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000  → "Try the Emergency Demo"
```

For the full backend (Postgres + Supabase + S3 + Twilio/WhatsApp), see `README.md`,
`DEPLOYMENT.md`, `SECURITY.md`, and `XEIVORAMED_ARCHITECTURE.md`.
