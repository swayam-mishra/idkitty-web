/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orange: '#FF6B2B',
        yellow: '#FFE500',
        lavender: '#C084FC',
        mint: '#00FF94',
        'hot-pink': '#FF2D78',
        'electric-blue': '#0066FF',
        bg: '#0a0a0a',
        'bg-raised': '#141414',
        'bg-terminal': '#0d1117',
      },
      fontFamily: {
        grotesk: ['Space Grotesk', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
