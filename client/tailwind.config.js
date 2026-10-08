const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        primary: token('primary'),
        'primary-fg': token('primary-fg'),
        accent: token('accent'),
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
        info: token('info'),
      },
      fontFamily: {
        sans: ['"Hind Siliguri"', 'system-ui', 'sans-serif'],
        display: ['"Tiro Bangla"', '"Hind Siliguri"', 'serif'],
      },
      borderRadius: { card: '1.25rem', control: '0.75rem' },
      boxShadow: {
        soft: '0 8px 30px -12px rgb(var(--primary) / 0.25)',
      },
    },
  },
  plugins: [],
};
