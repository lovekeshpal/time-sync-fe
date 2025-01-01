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
      },
    },
  },
  plugins: [],
  darkMode: "class", // Enable dark mode
};
