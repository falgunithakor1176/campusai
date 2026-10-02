/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Color System ──────────────────────────────────────────────────
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          50:  '#F0EFFF',
          100: '#E0DEFF',
          200: '#C1BCFF',
          300: '#A29BFF',
          400: '#8479FF',
          500: '#6C63FF',
          600: '#5A51E0',
          700: '#4840BF',
          800: '#36309F',
          900: '#24207F',
          950: '#120F5F',
        },
        secondary: {
          DEFAULT: '#00D4AA',
          50:  '#E6FFF9',
          100: '#B3FFF0',
          200: '#80FFE6',
          300: '#4DFFDB',
          400: '#1AFFD1',
          500: '#00D4AA',
          600: '#00AA88',
          700: '#008066',
          800: '#005544',
          900: '#002B22',
          950: '#001511',
        },
        accent: {
          DEFAULT: '#FF6B6B',
          50:  '#FFF0F0',
          100: '#FFE0E0',
          200: '#FFC0C0',
          300: '#FFA0A0',
          400: '#FF8080',
          500: '#FF6B6B',
          600: '#E05555',
          700: '#BF3F3F',
          800: '#9F2929',
          900: '#7F1313',
          950: '#5F0000',
        },
        neutral: {
          50:  '#F5F5FA',
          100: '#E8E8F0',
          200: '#C5C5D5',
          300: '#9B9BB4',
          400: '#6B7090',
          500: '#3D4070',
          600: '#2E3050',
          700: '#252840',
          800: '#1A1D2E',
          900: '#0F1117',
          950: '#080A10',
        },
        // Status colors
        success: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#16A34A',
          bg: 'rgba(34, 197, 94, 0.1)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
          bg: 'rgba(245, 158, 11, 0.1)',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
          bg: 'rgba(239, 68, 68, 0.1)',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
          bg: 'rgba(59, 130, 246, 0.1)',
        },
      },

      // ─── Typography ────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['1rem',     { lineHeight: '1.5rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl': ['3rem',     { lineHeight: '1.16' }],
        '6xl': ['3.75rem',  { lineHeight: '1.1' }],
        '7xl': ['4.5rem',   { lineHeight: '1.05' }],
        '8xl': ['6rem',     { lineHeight: '1' }],
        '9xl': ['8rem',     { lineHeight: '1' }],
      },

      // ─── Spacing ───────────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
        '34':  '8.5rem',
        '38':  '9.5rem',
        '42':  '10.5rem',
        '46':  '11.5rem',
        '50':  '12.5rem',
        '54':  '13.5rem',
        '58':  '14.5rem',
        '62':  '15.5rem',
        '66':  '16.5rem',
        '70':  '17.5rem',
        '74':  '18.5rem',
        '78':  '19.5rem',
        '82':  '20.5rem',
        '86':  '21.5rem',
        '90':  '22.5rem',
        '94':  '23.5rem',
        '98':  '24.5rem',
      },

      // ─── Border Radius ─────────────────────────────────────────────────
      borderRadius: {
        'none':  '0',
        'xs':    '0.125rem',
        'sm':    '0.25rem',
        DEFAULT: '0.375rem',
        'md':    '0.5rem',
        'lg':    '0.75rem',
        'xl':    '1rem',
        '2xl':   '1.25rem',
        '3xl':   '1.5rem',
        '4xl':   '2rem',
        'full':  '9999px',
      },

      // ─── Box Shadows ───────────────────────────────────────────────────
      boxShadow: {
        'none':         'none',
        'xs':           '0 1px 2px rgba(0,0,0,0.3)',
        'sm':           '0 2px 8px rgba(0,0,0,0.4)',
        DEFAULT:        '0 4px 16px rgba(0,0,0,0.4)',
        'md':           '0 8px 24px rgba(0,0,0,0.4)',
        'lg':           '0 16px 40px rgba(0,0,0,0.5)',
        'xl':           '0 24px 64px rgba(0,0,0,0.5)',
        '2xl':          '0 32px 80px rgba(0,0,0,0.6)',
        'glow':         '0 0 20px rgba(108,99,255,0.4)',
        'glow-sm':      '0 0 10px rgba(108,99,255,0.3)',
        'glow-lg':      '0 0 40px rgba(108,99,255,0.5)',
        'glow-teal':    '0 0 20px rgba(0,212,170,0.4)',
        'glow-error':   '0 0 20px rgba(239,68,68,0.4)',
        'inner':        'inset 0 2px 8px rgba(0,0,0,0.3)',
        'glass':        '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      },

      // ─── Backdrop Blur ─────────────────────────────────────────────────
      backdropBlur: {
        'none':  '0',
        'xs':    '2px',
        'sm':    '4px',
        DEFAULT: '8px',
        'md':    '12px',
        'lg':    '16px',
        'xl':    '24px',
        '2xl':   '40px',
        '3xl':   '64px',
      },

      // ─── Animation Keyframes ───────────────────────────────────────────
      keyframes: {
        // Fade in from below
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Fade in from above
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Fade in scale
        fadeInScale: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Slide in from left
        slideIn: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        // Slide in from right
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        // Slide out to right
        slideOutRight: {
          '0%':   { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(20px)' },
        },
        // Slow pulse for glow effects
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        // Shimmer loading animation
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Blinking cursor for typing effect
        typing: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%':      { borderColor: 'currentColor' },
        },
        // Float animation for decorative elements
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        // Spin for loaders
        spin: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Bounce dot for chat indicators
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0' },
          '40%':           { transform: 'scale(1)', opacity: '1' },
        },
        // Gradient shift for animated backgrounds
        gradientShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        // Orbit for particle animations
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        // Progress bar fill
        progressFill: {
          '0%':   { width: '100%' },
          '100%': { width: '0%' },
        },
      },

      // ─── Animations ────────────────────────────────────────────────────
      animation: {
        'fade-in':         'fadeIn 0.4s ease-out both',
        'fade-in-down':    'fadeInDown 0.4s ease-out both',
        'fade-in-scale':   'fadeInScale 0.3s ease-out both',
        'slide-in':        'slideIn 0.3s ease-out both',
        'slide-in-right':  'slideInRight 0.3s ease-out both',
        'slide-out-right': 'slideOutRight 0.3s ease-in both',
        'pulse-slow':      'pulse-slow 3s ease-in-out infinite',
        'shimmer':         'shimmer 2s linear infinite',
        'typing':          'typing 1s ease-in-out infinite',
        'float':           'float 4s ease-in-out infinite',
        'spin':            'spin 0.8s linear infinite',
        'bounce-dot':      'bounceDot 1.4s ease-in-out infinite both',
        'gradient-shift':  'gradientShift 6s ease infinite',
        'progress-fill':   'progressFill linear both',
      },

      // ─── Transitions ───────────────────────────────────────────────────
      transitionDuration: {
        '0':   '0ms',
        '75':  '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000':'1000ms',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-expo':  'cubic-bezier(0.7, 0, 0.84, 0)',
        'bounce-soft':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ─── Gradients (via background-image) ─────────────────────────────
      backgroundImage: {
        'gradient-radial':      'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':       'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary':     'linear-gradient(135deg, #6C63FF 0%, #5A51E0 100%)',
        'gradient-secondary':   'linear-gradient(135deg, #00D4AA 0%, #00AA88 100%)',
        'gradient-hero':        'linear-gradient(135deg, #0F1117 0%, #1A1D2E 50%, #252840 100%)',
        'shimmer-gradient':     'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
      },

      // ─── Screen Sizes ──────────────────────────────────────────────────
      screens: {
        'xs':   '480px',
        'sm':   '640px',
        'md':   '768px',
        'lg':   '1024px',
        'xl':   '1280px',
        '2xl':  '1536px',
        '3xl':  '1920px',
      },

      // ─── Z-Index ───────────────────────────────────────────────────────
      zIndex: {
        '0':    '0',
        '10':   '10',
        '20':   '20',
        '30':   '30',
        '40':   '40',
        '50':   '50',
        '60':   '60',  // Sidebar
        '70':   '70',  // Navbar
        '80':   '80',  // Modals
        '90':   '90',  // Toasts
        '100':  '100', // Loaders
        'auto': 'auto',
      },
    },
  },
  plugins: [],
};
