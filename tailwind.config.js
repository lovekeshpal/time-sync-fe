/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: "#3490dc",
        "primary-dark": "#2779bd",
        secondary: "#ffed4a",
        text: "#333",
        "text-light": "#fff",
        "bg-light": "#f8fafc",
        "bg-dark": "#1a202c",
        "input-light": "#f8fafc",
        "input-dark": "#1a202c",
        "input-border-light": "#d1d5db",
        "input-border-dark": "#4b5563",
        "input-text-light": "#333",
        "input-text-dark": "#d1d5db",
      },
    },
  },
  plugins: [],
  darkMode: "class", // Enable dark mode
};
