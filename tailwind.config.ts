import type { Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/hooks/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/styles/**/*.{ts,tsx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        primary: '#BA1A1A',
        'primary-dark': '#93000A',
        'on-primary': '#FFFFFF',
        'primary-container': '#FFDAD6',
        'on-primary-container': '#410001',
        secondary: '#2C2C2C',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#E8E8E8',
        'on-secondary-container': '#121212',
        tertiary: '#8C1D18',
        'on-tertiary': '#FFFFFF',
        background: '#FFFBFF',
        'on-background': '#201A19',
        surface: '#FFFBFF',
        'surface-dim': '#F7E4E1',
        'surface-bright': '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#FFF5F1',
        'surface-container': '#FDEDEA',
        'surface-container-high': '#F7E4E1',
        'surface-container-highest': '#F1DCDA',
        'surface-variant': '#F3DDDA',
        'on-surface': '#201A19',
        'on-surface-variant': '#53433F',
        outline: '#857370',
        'outline-variant': '#D8C2BE',
        'inverse-surface': '#362F2E',
        'inverse-on-surface': '#FBEDEA',
        'inverse-primary': '#FFB4A9',
        scrim: 'rgba(0, 0, 0, 0.5)',
        shadow: '#000000',
        'neutral-black': '#121212',
        'neutral-white': '#FFFFFF',
        'neutral-gray': '#E6E0E0',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
