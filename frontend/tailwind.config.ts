import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        dark: "#0F172A",
        card: "#1E293B",
        accent: "#6366F1",
        brand: {
          50: "#f4f8ff",
          100: "#dce8ff",
          200: "#b8ceff",
          300: "#86aafd",
          400: "#5f88f6",
          500: "#4069e8",
          600: "#3252c6",
          700: "#2c43a0",
          800: "#283b83",
          900: "#273668",
        },
        slatebase: {
          950: "#090d18",
          900: "#0f1627",
          850: "#141d33",
          800: "#1c2742",
          700: "#2a3860",
        },
      },
      boxShadow: {
        glow: "0 10px 35px rgba(64, 105, 232, 0.28)",
      },
      fontFamily: {
        title: ["'Sora'", "sans-serif"],
        body: ["'Space Grotesk'", "sans-serif"],
      },
      backgroundImage: {
        "mesh-dark":
          "radial-gradient(circle at 8% 0%, rgba(64, 105, 232, 0.2), transparent 40%), radial-gradient(circle at 85% 10%, rgba(56, 189, 248, 0.15), transparent 35%), linear-gradient(180deg, #090d18 0%, #0f1627 55%, #141d33 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
