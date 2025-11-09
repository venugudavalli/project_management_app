import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { 'box-shadow': '0 0 0 0 rgba(59, 130, 246, 0.4)' },
          '70%': { 'box-shadow': '0 0 0 10px rgba(59, 130, 246, 0)' },
          '100%': { 'box-shadow': '0 0 0 0 rgba(59, 130, 246, 0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
