/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        aftaar: {
          "primary": "#1e3a5f",
          "secondary": "#2d6a4f",
          "accent": "#e07a5f",
          "neutral": "#264653",
          "base-100": "#f8f9fa",
          "base-200": "#e9ecef",
          "base-300": "#dee2e6",
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
  },
}
