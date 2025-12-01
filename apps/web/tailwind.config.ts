import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          purple: {
            light: '#A78BFA',
            DEFAULT: '#7C3AED',
            dark: '#5B21B6',
            deeper: '#4C1D95',
          },
          gold: {
            light: '#F9D67A',
            DEFAULT: '#D4AF37',
            dark: '#B8941F',
          },
        },
        // Background colors
        bg: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        },
        // Text colors
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--text-tertiary) / <alpha-value>)',
          inverse: 'rgb(var(--text-inverse) / <alpha-value>)',
        },
        // Border colors
        border: {
          light: 'rgb(var(--border-light) / <alpha-value>)',
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          dark: 'rgb(var(--border-dark) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(212, 175, 55, 0.3)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.3)',
      },
      backgroundImage: {
        'gradient-radiant': 'linear-gradient(135deg, #D4AF37 0%, #7C3AED 50%, #5B21B6 100%)',
        'gradient-purple': 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F9D67A 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
