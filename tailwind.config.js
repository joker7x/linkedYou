/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /(bg|text|border)-(blue|emerald|rose|slate|indigo)-(50|100|400|500|600)/,
      variants: ['dark', 'hover', 'focus'],
    },
    {
      pattern: /bg-(blue|emerald|rose|slate|indigo)-500\/10/,
      variants: ['dark'],
    }
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',
          secondary: '#4f46e5',
          bg: '#f8fafc',
          surface: '#ffffff',
          text: '#1e293b',
          muted: '#64748b'
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '3rem',
      }
    },
  },
  plugins: [],
}
