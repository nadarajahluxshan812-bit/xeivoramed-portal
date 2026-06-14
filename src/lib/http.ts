import { env } from "./env";

/**
 * Resolve the public-facing origin for server-side redirects.
 *
 * Behind the Cloudflare tunnel the Next server only sees `localhost:3000`, so
 * `new URL(request.url).origin` would send users to localhost. We instead trust
 * the proxy's forwarded host, and fall back to the configured public app URL
 * (NEXT_PUBLIC_APP_URL) — never the raw request origin.
 */
export function appOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return env.appUrl.replace(/\/$/, "");
}
