/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#de5688',
          purple: '#b153c8',
          'pink-light': '#e87aa3',
          'purple-light': '#c474d6',
          'pink-dark': '#c44a75',
          'purple-dark': '#9a45ad',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #de5688, #b153c8)',
        'brand-gradient-hover': 'linear-gradient(to right, #c44a75, #9a45ad)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}