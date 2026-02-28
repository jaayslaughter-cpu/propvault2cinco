/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        vault: { green: "#00d4aa", dark: "#0e1117", panel: "#111827" },
      },
    },
  },
  plugins: [],
};
