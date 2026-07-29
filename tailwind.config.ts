import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        truth: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          glow: "rgba(16, 185, 129, 0.4)",
        },
        dare: {
          50: "#fff1f2",
          100: "#ffe4e6",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          glow: "rgba(244, 63, 94, 0.4)",
        },
        brand: {
          dark: "#0b0f19",
          card: "rgba(30, 41, 59, 0.7)",
          border: "rgba(255, 255, 255, 0.1)",
          accent: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
      animation: {
        "card-flip": "flip 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        flip: {
          "0%": { transform: "rotateY(90deg)", opacity: "0" },
          "100%": { transform: "rotateY(0deg)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
