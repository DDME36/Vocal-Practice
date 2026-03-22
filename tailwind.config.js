/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6c5ce7',
          light: '#a78bfa',
          dark: '#5b4bc4',
        },
        accent: {
          DEFAULT: '#a78bfa',
          light: '#c4b5fd',
        },
        success: '#00b894',
        warning: '#fdcb6e',
        error: '#e84118',
      },
      fontFamily: {
        sans: ['Inter', 'Kanit', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease',
        bounce: 'bounce 1s ease infinite',
        spin: 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
}
