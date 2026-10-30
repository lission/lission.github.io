/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    fontFamily: {
      sans: ['Geist', 'LXGW WenKai', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
    },
    extend: {
      colors: {
        paper: '#fbfbfa',
        surface: '#ffffff',
        surfaceSoft: '#f3f3f1',
        ink: '#1c1c1e',
        muted: '#6b6b70',
        line: 'rgba(0, 0, 0, 0.09)',
        accent: '#2fb36d',
        accentInk: '#157f47',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 24px -12px rgba(20, 40, 80, 0.12)',
      },
    },
  },
  plugins: [],
};
