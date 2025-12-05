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
      fontFamily: {
        'wagdie': ['Wagdie Fraktur', 'serif'],
        'eskapade': ['Eskapade Fraktur', 'serif'],
        'display': ['Wagdie Fraktur', 'serif'],
        'serif': ['Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        // Standardized typography scale
        'h1': ['2.5rem', { lineHeight: '3rem', letterSpacing: '0.1em' }],      // 40px - Page titles
        'h2': ['2rem', { lineHeight: '2.5rem', letterSpacing: '0.08em' }],     // 32px - Section titles
        'h3': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.05em' }],     // 24px - Card titles
        'h4': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.03em' }], // 20px - Subsections
        'body': ['1rem', { lineHeight: '1.625rem' }],                          // 16px - Body text
        'body-sm': ['0.875rem', { lineHeight: '1.375rem' }],                   // 14px - Secondary text
        'caption': ['0.75rem', { lineHeight: '1rem' }],                        // 12px - Captions, labels
        'tiny': ['0.625rem', { lineHeight: '0.875rem' }],                      // 10px - Badges, status
      },
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

        // Soul colors for new components
        soul: {
          accent: '#c8aa6e',     // Golden accent
          blood: '#8b2635',      // Blood red selection
          900: '#1a1410',        // Dark soul background
          950: '#0d0a08',        // Darkest soul background
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
