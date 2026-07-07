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
        /* Colori semplici: usano la CSS variable direttamente.
           Funzionano con bg-primary, text-primary, border-primary, ecc.
           NON supportano l'opacità (es. bg-primary/50). */
        'accent-hover': 'var(--color-accent-hover)',
        border:         'var(--color-border)',
        page:           'var(--color-page)',
        surface:        'var(--color-surface)',
        'on-surface':   'var(--color-on-surface)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted':   'var(--color-text-muted)',
        danger:         'var(--color-danger)',

        /* Colori con supporto opacità: usano la funzione rgba() con i canali RGB.
           Questo permette bg-accent/10, bg-accent/20, text-primary/70 ecc.
           Richiede che le variabili --color-*-rgb siano definite in main.css. */
        accent: ({ opacityValue }) =>
          opacityValue !== undefined
            ? `rgba(var(--color-accent-rgb), ${opacityValue})`
            : 'var(--color-accent)',

        primary: ({ opacityValue }) =>
          opacityValue !== undefined
            ? `rgba(var(--color-primary-rgb), ${opacityValue})`
            : 'var(--color-primary)',
      },
    },
  },
  plugins: [],
}
