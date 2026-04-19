/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./partials/**/*.html",
    "./components/**/*.js",
    "./admin.js",
    "./script.js",
    "./state.js",
    "./api.js",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary":        "#6366f1",
        "off-white":      "#f8fafc",
        "sky-blue":       "#0ea5e9",
        "gold":           "#eab308",
        "emerald":        "#10b981",
        "soft-purple":    "#8b5cf6",
        "vibrant-orange": "#f97316",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg":  "1rem",
        "xl":  "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
};
