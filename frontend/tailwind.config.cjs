/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Palette BatModule - 9 bleus modulaires
        'blue-night': '#011627',
        'blue-mineral': '#023E7D',
        'blue-cobalt': '#004AAD',
        'blue-sapphire': '#0F52BA',
        'blue-cyan': '#00A1D6',
        'blue-azure': '#28C2FF',
        'blue-glacier': '#63A4F4',
        'blue-powder': '#A3C8F0',
        'blue-frost': '#DEF3FA',

        // Couleurs système
        'text-dark': '#1E1E1E',
        'text-light': '#FFFFFF',
        'gray-neutral': '#4A4A4A',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
