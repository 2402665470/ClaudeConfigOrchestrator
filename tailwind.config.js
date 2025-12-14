/** @type {import('tailwindcss').Config} */
export default {
  content: ['index.html', 'src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}
