# Security — XeivoraMed

A HIPAA-inspired posture for handling Protected Health Information (PHI). This is an
engineering baseline, not legal/compliance certification — a production deployment in a
regulated context needs a formal risk assessment, BAAs with vendors, and a privacy review.

## Authentication
- **Supabase Auth** manages identities and sessions (email + password, Google OAuth, phone OTP).
- Sessions are refreshed at the edge in `src/middleware.ts`; protected route prefixes
  (`/dashboard`, `/doctor`, `/clinic`, `/admin`) redirect unauthenticated users to `/login`.
- Our `User` table links to Supabase via `supabaseId`; OAuth sign-ups are JIT-provisioned
  in `auth/callback`.

## Authorization (RBAC)
- A single source of truth in `src/lib/rbac.ts`: a `Role → Permission[]` matrix.
- Server actions and API routes call `can(role, permission)` / `requireRole()` /
  `requirePermission()` before any PHI read or mutation.
- Patients can only read/write their **own** data; clinicians need `*:any` capabilities.

## Audit logging
- `src/lib/audit.ts` writes append-only `AuditLog` rows capturing **actor, action,
  entity, the subject patient (whose PHI was touched), IP and user-agent**.
- Indexed by `subjectPatientId` so you can produce a per-patient access report — a core
  HIPAA access-accounting requirement.
- Logging never throws into the request path.

## Encryption
- **In transit:** HTTPS everywhere; HSTS preload header set in `next.config.ts`.
- **At rest (DB):** the most sensitive identifiers (e.g. NIC) use **AES-256-GCM** field
  encryption (`src/lib/crypto.ts`) with an authenticated tag; the key comes from
  `RECORD_ENCRYPTION_KEY`. Use your platform's full-disk/transparent DB encryption too.
- **At rest (documents):** S3 objects are uploaded with `ServerSideEncryption: AES256`.

## Document access
- Records are **never** public. Access is granted only via **5-minute presigned URLs**
  (`src/lib/s3.ts`), generated per request after an authorization + audit check.
- Direct-to-S3 presigned **uploads** keep large PHI files off the app server.

## Transport & headers
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, scoped `Permissions-Policy`, and HSTS.

## Secrets & cron
- Secrets live only in environment variables; the service-role key is server-only.
- `/api/cron/*` is protected by a bearer `CRON_SECRET`.

## Production checklist
- [ ] Rotate `RECORD_ENCRYPTION_KEY` via envelope encryption / KMS; never reuse across envs.
- [ ] Enable Postgres encryption at rest + automated encrypted backups + PITR.
- [ ] Restrict the S3 bucket (Block Public Access ON, bucket policy least-privilege, TLS-only).
- [ ] Turn on Supabase RLS for any tables accessed via the anon key.
- [ ] Sign BAAs with Twilio, Meta (WhatsApp), AWS where applicable.
- [ ] Add rate limiting / WAF in front of `/api/*`.
- [ ] Configure log retention + alerting on auth failures and audit anomalies.
- [ ] Penetration test before go-live.

## Responsible disclosure
Report vulnerabilities to **security@sehat.lk**. Please do not file public issues for
security problems.
