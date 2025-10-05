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
        brand: '#CE2029',
        'brand-strong': '#A61A23',
        'brand-soft': '#FCE8E9',
        primary: '#CE2029',
        'primary-dark': '#A61A23',
        'on-primary': '#FFFFFF',
        'primary-container': '#FFD9DD',
        'on-primary-container': '#3F0006',
        secondary: '#1F1F1F',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#F2F2F2',
        'on-secondary-container': '#151515',
        tertiary: '#8C1D18',
        'on-tertiary': '#FFFFFF',
        background: '#FFFFFF',
        'on-background': '#111111',
        surface: '#FFFFFF',
        'surface-dim': '#F5F5F5',
        'surface-bright': '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#FAFAFA',
        'surface-container': '#F4F4F5',
        'surface-container-high': '#EEEEF0',
        'surface-container-highest': '#E8E8EA',
        'surface-variant': '#E6D6D6',
        'on-surface': '#1A1A1A',
        'on-surface-variant': '#514343',
        outline: '#9E8D8D',
        'outline-variant': '#D8C3C3',
        'inverse-surface': '#2B1F1F',
        'inverse-on-surface': '#FBEDEE',
        'inverse-primary': '#FFB3B8',
        scrim: 'rgba(0, 0, 0, 0.5)',
        shadow: '#000000',
        'neutral-black': '#111111',
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
