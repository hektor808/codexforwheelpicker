import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#9333EA',
        secondary: '#0EA5E9',
        accent: '#22D3EE',
      },
    },
  },
  plugins: [],
} satisfies Config;
