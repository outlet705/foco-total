/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0a0f',
          900: '#111118',
          800: '#181822',
          700: '#232331',
          600: '#2f2f40',
        },
        accent: {
          500: '#7c5cff',
          400: '#9b82ff',
          600: '#6544ef',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,92,255,0.25), 0 8px 30px rgba(124,92,255,0.15)',
      },
    },
  },
  plugins: [],
};
