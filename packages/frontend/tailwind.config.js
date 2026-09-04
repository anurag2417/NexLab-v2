/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: {
          base: '#0D0F0F',
          surface: '#161A19',
          elevated: '#1E2322',
        },
        // Emerald Primary
        emerald: {
          DEFAULT: '#10B981',
          hover: '#34D399',
          active: '#059669',
          border: 'rgba(16,185,129,0.35)',
        },
        // Text
        text: {
          primary: '#EDEFEE',
          secondary: '#9CA3A0',
          muted: '#5C6360',
        },
        // Borders
        border: {
          DEFAULT: '#2A302E',
        },
        // Semantic States
        error: '#F87171',
        warning: '#FBBF24',
        info: '#60A5FA',
        // Dark Forest Colors
        dark: {
          50: '#D6F2DC',
          100: '#B5E0BF',
          200: '#94CEA2',
          300: '#73BC85',
          400: '#52AA68',
          500: '#31984B',
          600: '#1F3725',
          700: '#182D1E',
          800: '#132016',
          900: '#060B07',
        },
        forest: {
          600: '#2F6B44',
          700: '#244F33',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}