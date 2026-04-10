/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    fontFamily: {
      sans: ['Quicksand', 'Nunito', 'LXGW WenKai', 'sans-serif'],
      headline: ['Kalam', 'cursive'],
      handwriting: ['Kalam', 'cursive'],
    },
    extend: {
      colors: {
        ghibli: {
          blue: '#D4EAF7',
          green: '#C8E0C3',
          text: '#4A6A3B',
          accent: '#F4A261',
          tan: '#D9B48B',
          nav: '#7A6A5C',
          card: '#FFF9EF',
          hover: '#F4E8D8',
          header: '#3A5A2A',
          footer: '#5C4B3A',
          surface: '#fffbff',
          'surface-low': '#fff9e9',
          'surface-high': '#efe9cc',
          'surface-highest': '#efe9cc',
          primary: '#456e4a',
          'primary-container': '#c0eec1',
          secondary: '#4a6976',
          tertiary: '#905625',
          'tertiary-container': '#f5ab72',
          outline: '#bfba9f',
        },
      },
      borderRadius: {
        'ghibli': '28px',
        'ghibli-sm': '16px',
      },
      boxShadow: {
        'ghibli': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'ghibli-soft': '0 12px 32px rgba(59, 56, 37, 0.06)',
      },
    },
  },
  plugins: [],
};
