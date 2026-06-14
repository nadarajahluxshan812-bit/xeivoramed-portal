import type { Config } from "tailwindcss";

/**
 * Healthcare-focused, NHS-inspired palette.
 * Primary blue mirrors the NHS digital service tone; calm, high-contrast, accessible.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ebff",
          200: "#bcdcff",
          300: "#8ec6ff",
          400: "#59a6ff",
          500: "#3385ff",
          600: "#1a66e6",
          700: "#1551b4",
          800: "#174694",
          900: "#193d79",
        },
        accent: {
          // Used for "all clear" / completed states
          500: "#0f9d6c",
          600: "#0b8159",
        },
        danger: {
          500: "#e5484d",
          600: "#cc3b40",
        },
        warn: {
          500: "#f5a623",
          600: "#d98e16",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Soft, layered shadows for a premium, medical-grade surface feel.
        card: "0 1px 2px 0 rgba(16,24,40,0.04), 0 4px 16px -8px rgba(16,24,40,0.08)",
        "card-hover": "0 2px 4px 0 rgba(16,24,40,0.05), 0 14px 30px -12px rgba(16,24,40,0.14)",
        soft: "0 1px 3px rgba(16,24,40,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
