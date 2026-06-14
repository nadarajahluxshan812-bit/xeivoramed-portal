# Deployment — XeivoraMed

Reference deployment: **Vercel** (app) + **Supabase** (Postgres + Auth) + **AWS S3**
(documents) + **Twilio** & **WhatsApp Cloud API** (messaging). Any Node host works; only
the cron wiring differs.

---

## 1. Provision services

### Supabase (database + auth)
1. Create a project. From **Project Settings → Database**, copy the **pooled** connection
   string → `DATABASE_URL`, and the **direct** connection string → `DIRECT_URL`.
2. From **Project Settings → API**: copy the project URL → `NEXT_PUBLIC_SUPABASE_URL`,
   the `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the `service_role` key →
   `SUPABASE_SERVICE_ROLE_KEY`.
3. **Auth → Providers:** enable Email, Google (add OAuth client + redirect
   `https://YOUR_DOMAIN/auth/callback`), and Phone (configure an SMS provider, e.g. Twilio).

### AWS S3 (documents)
1. Create a private bucket (e.g. `sehat-health-records`) in `ap-south-1` (Mumbai — lowest
   latency to Sri Lanka). **Block Public Access: ON.**
2. CORS (so browsers can PUT presigned uploads):
   ```json
   [{ "AllowedOrigins": ["https://YOUR_DOMAIN"], "AllowedMethods": ["PUT","GET"],
      "AllowedHeaders": ["*"], "MaxAgeSeconds": 3000 }]
   ```
3. Create an IAM user limited to `s3:PutObject`/`s3:GetObject`/`s3:DeleteObject` on the
   bucket → `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

### Twilio (SMS + optional Voice)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, an SMS-capable number → `TWILIO_SMS_FROM`
  (and `TWILIO_VOICE_FROM` for phone-call reminders).

### WhatsApp Cloud API (Meta)
- Create a Meta app → WhatsApp product. Copy the **Phone number ID** →
  `WHATSAPP_PHONE_NUMBER_ID` and a permanent **access token** → `WHATSAPP_ACCESS_TOKEN`.
- For proactive reminders outside the 24h window, submit message **templates** for approval
  and switch `notifications/whatsapp.ts` to `type: "template"`.

### Web Push
```bash
npx web-push generate-vapid-keys
```
→ `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.

### App secrets
```bash
openssl rand -base64 32   # RECORD_ENCRYPTION_KEY
openssl rand -hex 32      # CRON_SECRET
```

---

## 2. Database migrations

```bash
npm install
npm run prisma:generate
npm run prisma:deploy     # applies migrations to the production DB
npm run db:seed           # optional: load demo data
```

> First time, generate the migration locally with `npm run prisma:migrate -- --name init`,
> commit `prisma/migrations/`, then use `prisma:deploy` in CI/CD.

---

## 3. Deploy to Vercel

1. Import the repo in Vercel.
2. Add **all** environment variables from `.env.example` (Production + Preview).
3. Build command `npm run build` (runs `prisma generate`), output is automatic.
4. `vercel.json` already registers the reminder cron:
   ```json
   { "crons": [{ "path": "/api/cron/reminders", "schedule": "*/1 * * * *" }] }
   ```
   Set `CRON_SECRET`; Vercel Cron sends it as a bearer token automatically when configured,
   or call the endpoint with `?secret=...`.

### Non-Vercel hosting (Docker / VM / k8s)
- Run `npm run build && npm run start`.
- Schedule the dispatcher externally, e.g. crontab:
  ```
  * * * * * cd /app && npm run cron:reminders >> /var/log/sehat-reminders.log 2>&1
  ```
  or a Kubernetes `CronJob` running the same command.

---

## 4. Post-deploy verification

```bash
curl https://YOUR_DOMAIN/api/health
# → { status: "ok", demoMode: false, integrations: { database: true, supabase: true, ... } }
```

- Log in (email/Google/phone), book an appointment, confirm a `Reminder` row appears.
- Trigger the cron once and confirm an SMS/WhatsApp/push is delivered (or logged in dry-run).
- Upload a record and confirm it lands in S3 and opens via a presigned URL.

## 4b. Global Health Identity Network — deployment changes

The network modules are **purely additive**. To roll them out:

1. **Migrate** the new tables/enums:
   ```bash
   npm run prisma:deploy        # applies prisma/migrations/*_global_health_identity
   # or, generating from the schema diff on an existing DB:
   npx prisma migrate dev --name global_health_identity
   ```
2. **New dependency:** `qrcode` (pure-JS, no external service) — installed via `npm install`.
3. **New env (optional):** none required. The AI Continuity Engine defaults to the offline
   `rules-v1` engine. To use an LLM later, implement `llmSummarize` in
   `src/lib/global/ai-summary.ts` and add that provider's key + a BAA.
4. **Emergency passport URLs** are built from `NEXT_PUBLIC_APP_URL` — make sure it's set to the
   production origin so QR codes resolve correctly.
5. **Immutable audit:** `EmergencyAccessLog` is append-only + hash-chained at the app layer.
   For full immutability, add a DB policy denying `UPDATE`/`DELETE` on that table (or stream to
   WORM storage / an append-only log sink). `verifyChain(patientId)` detects tampering.
6. **New routes to smoke-test post-deploy:**
   - `/dashboard/passport`, `/dashboard/access` (patient)
   - `/passport/[healthId]?t=…` (emergency view — must render < 3s)
   - `/emergency` (provider break-glass), `/admin/providers` (verification workflow)
   - `POST /api/emergency/access`, `/api/global/consent`, `/api/providers/[id]/verify`,
     `/api/interop/import`, `/api/ai/summary`, `/api/global/export`

## 5. Go-live checklist
See the checklist in [`SECURITY.md`](./SECURITY.md) — RLS, KMS, backups, WAF/rate-limiting,
vendor BAAs, and a pen test before handling real patient data.
