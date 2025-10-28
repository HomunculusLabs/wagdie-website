import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Gothic dark theme - Backgrounds
        abyss: '#0a0a0a',        // Deepest black
        shadow: '#1a1a1a',       // Card/panel backgrounds
        midnight: '#252525',     // Hover states, borders

        // Text colors
        bone: '#e8e8e8',         // Primary text (off-white)
        ash: '#b0b0b0',          // Secondary text
        mist: '#707070',         // Tertiary text, disabled

        // Accent colors - Gothic fantasy
        blood: '#8b2635',        // Primary accent (muted red)
        ember: '#c94a3a',        // Hover/active states
        gold: '#d4af37',         // Highlights, important
        poison: '#4a7c59',       // Success states (muted green)
        arcane: '#6a4c93',       // Links, info (muted purple)
      },
    },
  },
  plugins: [],
}
export default config
