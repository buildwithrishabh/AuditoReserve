/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: "#0a0a0f",
          surface: "#13131a",
          "surface-muted": "#1c1c26",
          text: "#e8e8ed",
          "text-muted": "#8b8b9e",
          primary: "#e8e8ed",
          "primary-hover": "#ffffff",
          accent: "#7c73e6",
          success: "#4b8bff",
          danger: "#ef4444",
          border: "#2a2a3a",
        }
      }
    },
  },
  plugins: [],
}
