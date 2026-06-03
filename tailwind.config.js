/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'rev-red': '#E63946',
        'rev-orange': '#F4A261',
        'rev-dark': '#0D0D0D',
        'rev-charcoal': '#1A1A2E',
      },
    },
  },
  plugins: [],
}
