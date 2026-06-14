import type { Metadata, Viewport } from "next";
import "./globals.css";

const TITLE = "XeivoraMed — Verified Emergency Medical Passport";
const DESCRIPTION =
  "One patient. One verified medical passport. Anywhere. Patients upload medical documents; XeivoraMed verifies identity and extracts emergency medical information so providers can access verified emergency data when a patient cannot speak — every field labelled by trust level, every access audited.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: TITLE, template: "%s · XeivoraMed" },
  description: DESCRIPTION,
  applicationName: "XeivoraMed",
  keywords: [
    "verified emergency medical passport",
    "emergency medical access",
    "patient-controlled records",
    "medical document verification",
    "health passport",
    "emergency health data",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "XeivoraMed", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "XeivoraMed",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1a66e6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
