import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { arial: ['Arial', 'sans-serif'] },
      colors: {
        navy: '#154278',
        lightBlue: '#89B3E5',
        mediumBlue: '#2C6098',
        slate: '#6B8CAE',
        ghostBlue: '#EEF5FB',
      },
    },
  },
  plugins: [],
} satisfies Config;
