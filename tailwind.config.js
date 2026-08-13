/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A1F44",
          light: "#12295C",
        },
        brand: {
          red: "#E31E24",
          blue: "#2952E3",
        },
      },
    },
  },
  plugins: [],
};
