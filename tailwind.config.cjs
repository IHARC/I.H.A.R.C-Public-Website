/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
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
      fontFamily: {
        heading: ['Poppins', 'Montserrat', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        full: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(32, 26, 25, 0.12), 0 1px 2px rgba(32, 26, 25, 0.08)',
        'red-glow': '0 4px 14px rgba(186, 26, 26, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'count-up': 'count-up 0.8s ease-out forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'count-up': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}