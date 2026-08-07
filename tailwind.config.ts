import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        'bg-deep': '#170410',
        'bg-mid': '#3a0a26',
        'bg-rose': '#6e1743',

        'accent-hot': '#ff3d81',
        'accent-soft': '#f2a6c6',

        'text-main': '#fbe8f0',
        'text-dim': 'rgba(251,232,240,.55)',

        'line-soft': 'rgba(242,166,198,.18)',
      },

      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        custom: ['var(--font-custom)', 'var(--font-display)'],
      },

      keyframes: {
        driftFade: {
          '0%': {
            opacity: '0',
            transform: 'translateY(22px) scale(.95)',
          },

          '18%': {
            opacity: 'var(--peak, .18)',
          },

          '55%': {
            opacity: 'var(--peak, .18)',
            transform: 'translateY(-10px) scale(1)',
          },

          '82%': {
            opacity: 'calc(var(--peak, .18) * .45)',
          },

          '100%': {
            opacity: '0',
            transform: 'translateY(-48px) scale(1.03)',
          },
        },
      },

      animation: {
        driftFade: 'driftFade linear infinite',
      },
    },
  },

  plugins: [],
};

export default config;