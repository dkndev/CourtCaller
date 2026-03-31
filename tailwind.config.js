/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dijle-red': {
          50:  '#fff0f0',
          100: '#ffdddd',
          200: '#ffc1c1',
          300: '#ff9595',
          400: '#ff5959',
          500: '#ff2626',
          600: '#fc0606',
          700: '#c60000',
          800: '#af0505',
          900: '#900c0c',
          950: '#500000',
        },
      },
    },
  },
  plugins: [require('tailwindcss-primeui')],
}
