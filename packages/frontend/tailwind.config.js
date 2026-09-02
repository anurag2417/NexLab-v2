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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}