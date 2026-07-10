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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 1px 4px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-lift": "0 8px 24px 0 rgb(27 43 94 / 0.10)",
        "navy-sm": "0 1px 3px rgb(27 43 94 / 0.35)",
        "gold-sm": "0 1px 3px rgb(196 144 32 / 0.40)",
        focus: "0 0 0 3px rgb(27 43 94 / 0.10)",
      },
      animation: {
        "fade-in": "fadeSlideUp 0.22s ease-out both",
        float: "float 3.5s ease-in-out infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
      keyframes: {
        fadeSlideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
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
