import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0B0E14",
        surface: "#12151C",
        surface2: "#181C25",
        border: "#232833",
        ink: "#E6E9EF",
        muted: "#8B93A3",
        accent: "#5EEAD4",
        get: "#3B82F6",
        post: "#22C55E",
        put: "#F59E0B",
        patch: "#A855F7",
        del: "#F43F5E",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
