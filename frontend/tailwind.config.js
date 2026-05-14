/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edfcf5",
          100: "#d4f7e6",
          200: "#aceed2",
          300: "#76dfb8",
          400: "#3ec99a",
          500: "#1aad7e",
          600: "#0e8c66",
          700: "#0b7054",
          800: "#0c5944",
          900: "#0b4938",
          950: "#042920",
        },
        surface: {
          900: "#0f1117",
          800: "#161922",
          700: "#1e222e",
          600: "#272c3a",
          500: "#343a4d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
