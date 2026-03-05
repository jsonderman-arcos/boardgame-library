/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        'warm-gray': '#6B5D56',
        terracotta: {
          50: '#FDF5F3',
          100: '#FAEBE7',
          200: '#F5D7CF',
          300: '#EEBDAD',
          400: '#E59A83',
          500: '#D97757',
          600: '#C85A3A',
          700: '#A8452D',
          800: '#8B3A27',
          900: '#743325',
        },
        forest: {
          50: '#F3F6F4',
          100: '#E4EBE6',
          200: '#CAD7CE',
          300: '#A5BAAD',
          400: '#7A9786',
          500: '#5A7A67',
          600: '#456150',
          700: '#384E42',
          800: '#2F4037',
          900: '#28362F',
        },
        gold: {
          500: '#D4AF37',
          600: '#C09A2A',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        mono: ['DM Mono', 'monospace'],
        body: ['Jost', 'sans-serif'],
      },
      gap: {
        '0.5': '2px',
      },
    },
  },
  plugins: [],
};
