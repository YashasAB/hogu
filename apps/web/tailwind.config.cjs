
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        accent: 'var(--accent)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        paper: 'var(--paper)',
        'paper-alt': 'var(--paper-alt)',
      },
      aspectRatio: {
        '3/2': '3 / 2',
      },
    },
  },
  plugins: [],
}
