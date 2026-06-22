import type { Config } from "tailwindcss";

/**
 * XeivoraMed brand palette — matched to the marketing site (xeivora.com).
 * Deep blue primary (#1B3A8F), coral accent, verified-green / self-reported-amber.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary deep blue. brand-600 is the brand primary (#1B3A8F); 700 = darker for hover/gradients.
        brand: {
          50: "#ECF0FB",
          100: "#DCE6F7",
          200: "#B9C8EC",
          300: "#8AA2DA",
          400: "#5470BC",
          500: "#2C4F9E",
          600: "#1B3A8F",
          700: "#142C6E",
          800: "#122456",
          900: "#101C42",
        },
        // Coral accent
        coral: { DEFAULT: "#FF6B5E", 600: "#F2604E" },
        // "All clear" / verified green
        accent: { 500: "#0E7C5A", 600: "#0B6A4D" },
        // Provenance tokens (match marketing): verified green, self-reported amber
        verified: "#0E7C5A",
        verifiedsoft: "#E6F4EE",
        selfr: "#9A6B00",
        selfsoft: "#F7EFDC",
        danger: { 500: "#E5484D", 600: "#CC3B40" },
        warn: { 500: "#F5A623", 600: "#D98E16" },
        ink: "#171E33",
        // Secondary body text
        slatebody: "#535B73",
        // Deep navy for the auth brand panel
        navy: { DEFAULT: "#11245C", 700: "#0E1F50" },
        // Hairline border used across cards / inputs
        line: "#E1E4EF",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16,24,40,0.04), 0 4px 16px -8px rgba(16,24,40,0.08)",
        "card-hover": "0 2px 4px 0 rgba(16,24,40,0.05), 0 14px 30px -12px rgba(16,24,40,0.14)",
        soft: "0 1px 3px rgba(16,24,40,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
