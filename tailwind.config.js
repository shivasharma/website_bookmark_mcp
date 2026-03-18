// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Zinc palette
        zinc: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        background: {
          light: '#fafafa', // zinc-50
          dark: '#09090b', // zinc-950
        },
        card: {
          light: '#fff',
          dark: '#18181b', // zinc-900
        },
        border: {
          light: '#e4e4e7', // zinc-200
          dark: '#27272a', // zinc-800
        },
        text: {
          primary: '#18181b', // zinc-900
          secondary: '#52525b', // zinc-600
          muted: '#a1a1aa', // zinc-400
        },
        accent: {
          DEFAULT: '#14161e',
        },
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
      },
      fontFamily: {
        sans: [
          'DM Sans',
          'Inter',
          'Segoe UI',
          'Arial',
          'sans-serif',
        ],
      },
      fontWeight: {
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      borderWidth: {
        1: '1px',
        3: '3px',
      },
      borderRadius: {
        md: '0.5rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
