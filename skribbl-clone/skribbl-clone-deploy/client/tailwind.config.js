/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        skribbl: {
          blue: '#124da5',
          panel: 'rgba(12, 44, 150, 0.75)',
          green: '#53e237',
          greenHover: '#38c41c',
          greenActive: '#30aa19',
          btnBlue: '#2c8de7',
          btnBlueHover: '#1671c5',
          btnBlueActive: '#1361a9',
          guessed: '#5bdd4a',
          guessedOdd: '#48c737',
        }
      }
    },
  },
  plugins: [],
}
