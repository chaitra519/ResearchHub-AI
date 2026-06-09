/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0816",
        darkCard: "rgba(18, 12, 38, 0.45)",
        brandPurple: {
          light: "#C084FC",
          DEFAULT: "#8B5CF6",
          dark: "#6D28D9",
        },
        brandCyan: "#22D3EE",
        textMain: "#F3F4F6",
        textMuted: "#9CA3AF"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        purpleGlow: "0 0 15px rgba(139, 92, 246, 0.3)"
      }
    },
  },
  plugins: [],
}
