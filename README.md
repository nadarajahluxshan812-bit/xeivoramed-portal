# XeivoraMed 🇱🇰 — Patient Continuity Platform

A production-oriented web + mobile (PWA) healthcare platform for Sri Lanka. It helps
patients **never miss an appointment, medication, dialysis session or follow-up**, and
keeps their medical history and reports **securely accessible** in one place.

Built with **Next.js 15 · TypeScript · PostgreSQL · Prisma · TailwindCSS · Supabase Auth**,
with **Twilio (SMS + Voice)**, **WhatsApp Cloud API**, **Web Push**, and **AWS S3** for
encrypted document storage.

> **Demo mode:** the app runs out-of-the-box with **no external services**. When
> `DATABASE_URL` / Supabase env vars are missing, it serves seeded demo data so you can
> click through every dashboard. Configure env vars to switch to the real backend.

---

## Roles & feature coverage

| Role | Routes | Highlights |
|------|--------|-----------|
| **Patient** | `/dashboard/*` | Dashboard, appointments (book/reschedule/cancel), records (S3 upload + search), medications + adherence, dialysis schedule, health timeline, follow-ups |
| **Doctor** | `/doctor` | Today's & upcoming appointments, approvals, patient list, records, diagnoses, follow-up automation |
| **Clinic staff** | `/clinic` | Daily ops, **live queue** + check-in, missed appointments, staff view |
| **Admin** | `/admin` | System analytics, **SMS/WhatsApp campaign center**, announcements |

---

## Quick start (demo mode — 60 seconds)

```bash
npm install
npm run dev
# open http://localhost:3000  → click "View demo dashboard"
```

No database or keys required — you'll see the patient, doctor, clinic and admin dashboards
populated with realistic Sri Lankan demo data.

## Full setup (real backend)

```bash
cp .env.example .env          # fill in DB, Supabase, Twilio, WhatsApp, S3, VAPID
npm install
npm run prisma:generate
npm run prisma:migrate        # create the schema in Postgres
npm run db:seed               # load demo clinics/doctors/patients
npm run dev
```

Generate the secrets you'll need:

```bash
openssl rand -base64 32                 # RECORD_ENCRYPTION_KEY and CRON_SECRET
npx web-push generate-vapid-keys        # NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY
```

---

## Architecture

```
src/
  app/
    page.tsx                 Landing
    (auth)/login,register    Email / Google / Phone-OTP auth (Supabase)
    auth/callback            OAuth + JIT user provisioning
    dashboard/*              Patient PWA
    doctor / clinic / admin  Role dashboards
    api/
      auth/*                 register, logout
      appointments/*         book / list / reschedule / cancel / approve / complete
      records/*              presigned S3 upload-url + metadata + search
      announcements          admin SMS/WhatsApp campaigns
      push/subscribe         Web Push registration
      cron/reminders         scheduled reminder dispatcher (protected)
      health                 readiness + integration status
  lib/
    prisma, env, crypto      DB client, typed env, AES-256-GCM field encryption
    supabase/*               SSR + browser auth clients
    auth, rbac, audit        session resolution, permission matrix, audit logging
    s3                       presigned uploads/downloads (encrypted at rest)
    notifications/*          SMS (Twilio) · WhatsApp Cloud · Web Push · Voice + dispatcher
    reminders/*              templates (EN/SI/TA) · scheduler · cron worker
    consult/video            video-room provider (Daily) — interface + stub
    data/patient             dashboard aggregation (Prisma ↔ demo fallback)
    i18n/messages            English / Sinhala / Tamil strings
    demo                     seed-quality fixtures for demo mode
prisma/
  schema.prisma              full data model (every module)
  seed.ts                    realistic seed data
```

### How reminders work (the core of the product)

1. Booking an appointment / creating a med plan / dialysis session calls
   `scheduleReminders()`, which writes durable `Reminder` rows (one per opted-in channel)
   with a future `sendAt`, **pre-rendered in the patient's language**.
2. `/api/cron/reminders` runs every minute (Vercel Cron or external scheduler), calls
   `processDueReminders()` → dispatches via the channel provider → records the provider
   message id and delivery status, with bounded retries.
3. `flagMissedDialysis()` detects missed sessions and fires alert reminders.

This makes reminders **durable, auditable and retry-able**, not fire-and-forget.

---

## Security

See [`SECURITY.md`](./SECURITY.md). Summary: Supabase-managed auth, a role→permission
matrix (`lib/rbac.ts`), append-only **audit logging** of every PHI access, **AES-256-GCM**
field encryption for the most sensitive identifiers, S3 objects served only via short-lived
presigned URLs, and hardened HTTP security headers.

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for Vercel + Supabase + AWS, env wiring, cron setup,
and the production checklist.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run prisma:migrate` | Apply schema migrations (dev) |
| `npm run prisma:deploy` | Apply migrations (prod) |
| `npm run db:seed` | Seed demo data |
| `npm run cron:reminders` | Run the reminder dispatcher once (non-Vercel) |
| `npm run typecheck` | TypeScript check |

## Roadmap / extension points (interfaces in place)

- **Online consultation:** chat models + `consult/video.ts` provider interface (wire Daily/Agora).
- **Phone-call reminders:** Twilio Voice provider wired (`notifications/voice.ts`).
- **Future modules:** Pharmacy, Laboratory, Insurance, National Health Record — schema-ready.
- **Full i18n:** EN/SI/TA dictionary scaffold; expand keys + add a locale switcher.
