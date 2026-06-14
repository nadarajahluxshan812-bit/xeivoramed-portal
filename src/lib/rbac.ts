import type { Role } from "@prisma/client";

/**
 * Role-based access control.
 * Permissions are coarse-grained capabilities; routes/actions check `can()`.
 */
export type Permission =
  | "appointment:read:own"
  | "appointment:read:any"
  | "appointment:write:own"
  | "appointment:approve"
  | "appointment:complete"
  | "record:read:own"
  | "record:read:any"
  | "record:write:own"
  | "record:write:any"
  | "patient:read:any"
  | "diagnosis:write"
  | "followup:write"
  | "queue:manage"
  | "staff:manage"
  | "analytics:read"
  | "announcement:send"
  | "audit:read"
  // ── Global Health Identity Network ──
  | "passport:manage:own" // patient edits their own Global Health Passport
  | "passport:read:emergency" // read critical emergency view (clinicians + break-glass)
  | "consent:manage:own" // patient approves/revokes providers
  | "consent:request" // provider requests access
  | "emergency:access" // provider performs break-glass access
  | "provider:register" // self-register a provider org
  | "provider:verify" // admin verifies/approves providers
  | "interop:import" // ingest FHIR/CDA/NHS/PDF records
  | "ai:summary:read" // view AI continuity briefings
  // ── XeivoraMed: AI Specialist Scribe ──
  | "scribe:use" // start a session + generate drafts
  | "scribe:review" // edit a generated draft
  | "scribe:finalize" // approve & attach to the record
  | "scribe:audit" // admin: read scribe usage logs only
  // ── Emergency Blood Network ──
  | "blood:request" // hospital/provider: create & manage blood requests, view matches
  | "blood:donor"; // patient: manage own donor profile & respond to alerts

const MATRIX: Record<Role, Permission[]> = {
  PATIENT: [
    "appointment:read:own",
    "appointment:write:own",
    "record:read:own",
    "record:write:own",
    // Patient owns and controls their global identity
    "passport:manage:own",
    "consent:manage:own",
    "ai:summary:read",
    // Patient may opt in as a blood donor and respond to alerts
    "blood:donor",
  ],
  DOCTOR: [
    "appointment:read:any",
    "appointment:approve",
    "appointment:complete",
    "record:read:any",
    "record:write:any",
    "patient:read:any",
    "diagnosis:write",
    "followup:write",
    // Clinicians can read emergency views, request consent, break-glass, import & read AI
    "passport:read:emergency",
    "consent:request",
    "emergency:access",
    "interop:import",
    "ai:summary:read",
    // AI Scribe — full clinician workflow
    "scribe:use",
    "scribe:review",
    "scribe:finalize",
    // Emergency Blood Network — request & match management
    "blood:request",
  ],
  CLINIC_STAFF: [
    "appointment:read:any",
    "appointment:approve",
    "appointment:complete",
    "record:read:any",
    "patient:read:any",
    "queue:manage",
    "staff:manage",
    "passport:read:emergency",
    "consent:request",
    "emergency:access",
    "interop:import",
    "ai:summary:read",
    // Provider / hospital staff get the full scribe workflow too
    "scribe:use",
    "scribe:review",
    "scribe:finalize",
    // Hospital staff run blood emergency requests
    "blood:request",
  ],
  ADMIN: [
    "appointment:read:any",
    "record:read:any",
    "patient:read:any",
    "analytics:read",
    "announcement:send",
    "audit:read",
    "staff:manage",
    // Admin runs the provider registry & verification workflow
    "provider:register",
    "provider:verify",
    "passport:read:emergency",
    "ai:summary:read",
    // Admin may audit scribe usage — but NOT use/review/finalize
    "scribe:audit",
    // Admin oversees blood network analytics & requests
    "blood:request",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  return MATRIX[role] ?? [];
}

/** Default landing route per role after login. */
export function homeForRole(role: Role): string {
  switch (role) {
    case "DOCTOR":
      return "/doctor";
    case "CLINIC_STAFF":
      return "/clinic";
    case "ADMIN":
      return "/admin";
    default:
      return "/dashboard";
  }
}
