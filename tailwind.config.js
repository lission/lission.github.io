/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    fontFamily: {
      sans: ['Geist', 'LXGW WenKai', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
    },
    extend: {
      colors: {
        // Semantic colors are driven by CSS variables (see src/styles/index.css)
        // so the light/dark theme toggle can override them in one place.
        // RGB-channel form keeps Tailwind opacity modifiers (e.g. border-accent/40)
        // working.
        paper: 'rgb(var(--paper-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        surfaceSoft: 'rgb(var(--surface-soft-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
        line: 'var(--line)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        accentInk: 'rgb(var(--accent-ink-rgb) / <alpha-value>)',
        onAccent: 'rgb(var(--on-accent-rgb) / <alpha-value>)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 24px -12px rgba(20, 40, 80, 0.12)',
      },
    },
  },
  plugins: [],
};
