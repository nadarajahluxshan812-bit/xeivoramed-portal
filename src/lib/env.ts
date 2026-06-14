/**
 * Centralised, type-safe environment access.
 * We intentionally do NOT hard-crash when optional integrations are missing so the
 * app can run in a "demo" mode for local/preview without Postgres, Supabase, Twilio, etc.
 */

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",

  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  recordEncryptionKey: process.env.RECORD_ENCRYPTION_KEY ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",

  twilio: {
    sid: process.env.TWILIO_ACCOUNT_SID ?? "",
    token: process.env.TWILIO_AUTH_TOKEN ?? "",
    smsFrom: process.env.TWILIO_SMS_FROM ?? "",
    voiceFrom: process.env.TWILIO_VOICE_FROM ?? "",
  },
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    apiVersion: process.env.WHATSAPP_API_VERSION ?? "v21.0",
  },
  vapid: {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
    subject: process.env.VAPID_SUBJECT ?? "mailto:ops@sehat.lk",
  },
  s3: {
    region: process.env.AWS_REGION ?? "ap-south-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.S3_BUCKET ?? "",
  },
  video: {
    provider: process.env.VIDEO_PROVIDER ?? "stub",
    dailyApiKey: process.env.DAILY_API_KEY ?? "",
  },
  // Apple Wallet (PassKit) issuer credentials — required for live pass signing.
  appleWallet: {
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER ?? "",
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER ?? "",
    certPath: process.env.APPLE_WALLET_CERT_PATH ?? "",
    keyPath: process.env.APPLE_WALLET_KEY_PATH ?? "",
    keyPassword: process.env.APPLE_WALLET_KEY_PASSWORD ?? "",
  },
  // Google Wallet issuer credentials — required for live save links.
  googleWallet: {
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID ?? "",
    classId: process.env.GOOGLE_WALLET_CLASS_ID ?? "",
    serviceAccountJson: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON ?? "",
  },
} as const;

/**
 * Demo mode — controls whether seeded demo fixtures are served.
 *
 *  - DEMO_MODE=true   → demo fixtures, demo role buttons, emergency demo enabled
 *  - DEMO_MODE=false  → LIVE mode: only real database data, empty states when none,
 *                       real auth required (needs DATABASE_URL + Supabase keys)
 *  - unset            → derived: demo when DB/Supabase are not configured
 */
const demoFlag = (process.env.DEMO_MODE ?? "").trim().toLowerCase();
export const isDemoMode =
  demoFlag === "true" ? true : demoFlag === "false" ? false : !env.databaseUrl || !env.supabaseUrl;

if (demoFlag === "false" && (!env.databaseUrl || !env.supabaseUrl)) {
  console.warn(
    "[env] DEMO_MODE=false but DATABASE_URL / Supabase keys are missing — live mode requires real credentials; data queries and auth will fail until they are set."
  );
}

export const isConfigured = {
  database: Boolean(env.databaseUrl),
  supabase: Boolean(env.supabaseUrl && env.supabaseAnonKey),
  twilioSms: Boolean(env.twilio.sid && env.twilio.token && env.twilio.smsFrom),
  whatsapp: Boolean(env.whatsapp.phoneNumberId && env.whatsapp.accessToken),
  push: Boolean(env.vapid.publicKey && env.vapid.privateKey),
  s3: Boolean(env.s3.accessKeyId && env.s3.secretAccessKey && env.s3.bucket),
  appleWallet: Boolean(
    env.appleWallet.passTypeIdentifier &&
      env.appleWallet.teamIdentifier &&
      env.appleWallet.certPath &&
      env.appleWallet.keyPath,
  ),
  googleWallet: Boolean(
    env.googleWallet.issuerId && env.googleWallet.classId && env.googleWallet.serviceAccountJson,
  ),
};
