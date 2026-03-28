/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        white: '#F5F3E7',
        black: '#030404',
        grey: '#21242B',
        'accent-blue': '#25CFE6',
        success: '#5EC374',
        error: '#E74B4A',
      },
      fontFamily: {
        pixel: ['Press Start 2P', 'monospace'],
        mono: ['VT323', 'monospace'],
      },
    },
  },
  plugins: [],
}
