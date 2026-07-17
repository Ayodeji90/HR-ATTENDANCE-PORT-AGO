/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand red, sampled directly from the Port-Ago logo (#BD001E / #B90015).
        primary: {
          50: '#FDF2F3',
          100: '#FCE4E6',
          200: '#FACDD1',
          300: '#F5A7AE',
          400: '#EC7580',
          500: '#DC3545',
          600: '#C10726',
          700: '#9E0620',
          800: '#7D0A1E',
          900: '#5C0A19',
          950: '#38050F',
        },
        // Charcoal neutral, sampled from the logo wordmark (#303032 / #3C3C3E) —
        // used in place of default Tailwind gray/slate for a warmer, on-brand neutral.
        ink: {
          50: '#F7F7F8',
          100: '#EDEDEF',
          200: '#D9D9DC',
          300: '#B7B7BC',
          400: '#8E8E95',
          500: '#6B6B70',
          600: '#525256',
          700: '#3C3C3E',
          800: '#303032',
          900: '#1F1F21',
          950: '#131314',
        },
        success: {
          50: '#F0FBF4',
          100: '#DCF5E4',
          500: '#22A85E',
          600: '#178A4A',
          700: '#116B39',
        },
        warning: {
          50: '#FFF8ED',
          100: '#FEECC7',
          500: '#DB8A15',
          600: '#B36C0E',
          700: '#8A530C',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3576D6',
          600: '#265CAD',
          700: '#1E4785',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
