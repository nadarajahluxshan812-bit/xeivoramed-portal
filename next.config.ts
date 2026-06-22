import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Served under xeivora.com/portal/* (Cloudflare Worker proxies that path to Railway).
  // basePath prefixes all _next assets, <Link>s, router pushes and redirects with /portal
  // so everything resolves correctly under the subpath. The app now lives at
  // <railway-url>/portal as well — the bare railway root returns 404 by design.
  basePath: "/portal",
  // Pin the workspace root so Next doesn't pick up a stray parent lockfile.
  outputFileTracingRoot: __dirname,
  // Security headers aligned with the HIPAA-inspired posture documented in SECURITY.md
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      // Supabase storage + S3 buckets used for avatars/report thumbnails
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default nextConfig;
