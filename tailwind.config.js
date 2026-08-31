/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        muv: {
          roxo: '#8B6AA6',
          verde: '#6CB386',
          laranja: '#F29C52',
          teal: '#3BA896'
        }
      }
    },
  },
  plugins: [],
}