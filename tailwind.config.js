/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        muv: {
          roxo: '#8C6E97',
          verde: '#63B887',
          laranja: '#E58B58',
          amarelo:'#F3BF73',
          teal: '#00A3A6'
        }
      }
    },
  },
  plugins: [],
}