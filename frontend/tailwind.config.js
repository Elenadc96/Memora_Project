/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Usa questi nomi nei template Vue al posto degli hex hard-coded.
           Es: bg-page, text-primary, bg-accent, border-border, ecc.          */
        primary:      'var(--color-primary)',
        accent:       'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        border:       'var(--color-border)',
        page:         'var(--color-page)',
        surface:      'var(--color-surface)',
        'on-surface': 'var(--color-on-surface)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted':   'var(--color-text-muted)',
      },
    },
  },
  plugins: [],
}
