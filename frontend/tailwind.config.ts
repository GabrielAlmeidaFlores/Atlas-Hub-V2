import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1B2B5E",
          light: "#263f8a",
          dark: "#0f1a3a",
          50: "#f0f4ff",
          100: "#e0e7ff",
          200: "#c7d3ff",
        },
        gold: {
          DEFAULT: "#C49020",
          light: "#d9a830",
          dark: "#9a7218",
          50: "#fffbeb",
        },
        background: "#F4F6FA",
        foreground: "#0f172a",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        primary: {
          DEFAULT: "#1B2B5E",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#e8eef8",
          foreground: "#1B2B5E",
        },
        muted: {
          DEFAULT: "#eef1f6",
          foreground: "#64748b",
        },
        accent: {
          DEFAULT: "#C49020",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        border: "#e2e8f0",
        input: "#ffffff",
        ring: "#1B2B5E",
        sidebar: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
          border: "#e2e8f0",
          accent: "#f0f4ff",
        },
        status: {
          success: "#16a34a",
          "success-subtle": "#f0fdf4",
          "success-border": "#86efac",
          warning: "#d97706",
          "warning-subtle": "#fffbeb",
          "warning-border": "#fcd34d",
          danger: "#dc2626",
          "danger-subtle": "#fef2f2",
          "danger-border": "#fca5a5",
          info: "#2563eb",
          "info-subtle": "#eff6ff",
          "info-border": "#93c5fd",
        },
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "0",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        card: "none",
        "card-lift": "none",
        "navy-sm": "0 4px 14px rgb(27 43 94 / 0.28)",
        "gold-sm": "0 4px 14px rgb(196 144 32 / 0.28)",
        focus: "0 0 0 2px rgb(27 43 94 / 0.15)",
        lp: "0 8px 24px rgb(27 43 94 / 0.22)",
      },
      animation: {
        "fade-in": "fadeSlideUp 0.22s ease-out both",
        float: "lp-float 5s ease-in-out infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
      keyframes: {
        fadeSlideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
