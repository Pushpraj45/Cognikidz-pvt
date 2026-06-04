/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    // Override default screens to add xs breakpoint
    screens: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        // New vibrant color palette
        primary: '#6366F1', // Indigo - vibrant and energetic
        secondary: '#8B5CF6', // Purple - creative and playful
        accent: '#F59E0B', // Amber - warm and motivating
        background: '#F8FAFC', // Light blueish-white - clean and fresh
        text: '#1E293B', // Slate - easy to read

        // Dark mode palette
        'dark-primary': '#818CF8', // Lighter Indigo for dark mode
        'dark-secondary': '#A78BFA', // Lighter Purple for dark mode
        'dark-accent': '#FBBF24', // Lighter Amber for dark mode
        'dark-background': '#0F172A', // Deep navy blue - cozy and calm
        'dark-text': '#E2E8F0', // Light slate - high contrast
        'dark-text-secondary': '#CBD5E1', // Light slate - secondary text
        'dark-accent-highlight': '#F97316', // Orange - for highlights

        // Extended color variants
        'primary-50': '#EEF2FF',
        'primary-100': '#E0E7FF',
        'primary-200': '#C7D2FE',
        'primary-300': '#A5B4FC',
        'primary-400': '#818CF8',
        'primary-500': '#6366F1',
        'primary-600': '#4F46E5',
        'primary-700': '#4338CA',
        'primary-800': '#3730A3',
        'primary-900': '#312E81',

        // Secondary extended variants
        'secondary-50': '#F5F3FF',
        'secondary-100': '#EDE9FE',
        'secondary-200': '#DDD6FE',
        'secondary-300': '#C4B5FD',
        'secondary-400': '#A78BFA',
        'secondary-500': '#8B5CF6',
        'secondary-600': '#7C3AED',
        'secondary-700': '#6D28D9',
        'secondary-800': '#5B21B6',
        'secondary-900': '#4C1D95',

        // Accent extended variants
        'accent-50': '#FFFBEB',
        'accent-100': '#FEF3C7',
        'accent-200': '#FDE68A',
        'accent-300': '#FCD34D',
        'accent-400': '#FBBF24',
        'accent-500': '#F59E0B',
        'accent-600': '#D97706',
        'accent-700': '#B45309',
        'accent-800': '#92400E',
        'accent-900': '#78350F',

        // Keep these as fallbacks for existing components
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        surface: '#F8FAFC', // Changed to match our background

        // Additional vibrant colors for children's content
        teal: '#0D9488',
        pink: '#EC4899',
        lime: '#84CC16',
        sky: '#0EA5E9',
        rose: '#F43F5E',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 10px 30px -3px rgba(0, 0, 0, 0.08)',
        'colored-lg': '0 10px 25px -5px rgba(99, 102, 241, 0.3)',
        'colored-md': '0 6px 16px -3px rgba(99, 102, 241, 0.25)',
        'colored-sm': '0 4px 10px -2px rgba(99, 102, 241, 0.2)',
        'colored-xs': '0 2px 6px -1px rgba(99, 102, 241, 0.15)',
        'accent-lg': '0 10px 25px -5px rgba(245, 158, 11, 0.3)',
        glow: '0 0 15px 2px rgba(99, 102, 241, 0.25)',
        'inner-glow': 'inset 0 0 5px 2px rgba(99, 102, 241, 0.1)',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.6s ease-out forwards',
        'fade-in-left': 'fade-in-left 0.6s ease-out forwards',
        'fade-in-right': 'fade-in-right 0.6s ease-out forwards',
        'pulse-gentle': 'pulse-gentle 1.5s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite linear',
        'bounce-soft': 'bounce-soft 3s infinite',
        'spin-slow': 'spin 8s linear infinite',
        wobble: 'wobble 1s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
      },
      transitionTimingFunction: {
        'ease-in-out-gentle': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-gentle': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
        800: '800ms',
        1200: '1200ms',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'gradient-diagonal': 'linear-gradient(45deg, var(--tw-gradient-stops))',
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
