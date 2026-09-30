/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#2563EB', light: '#3B82F6', dark: '#1D4ED8' },
        secondary: { DEFAULT: '#0F172A', light: '#1E293B' },
        accent:    { DEFAULT: '#06B6D4', light: '#22D3EE' },
        success:   '#22C55E',
        danger:    '#EF4444',
        bg:        '#F8FAFC',
        card:      '#FFFFFF',
        muted:     '#64748B',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
      },
      boxShadow: {
        'soft':   '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'medium': '0 4px 25px -5px rgba(0,0,0,0.1), 0 10px 30px -5px rgba(0,0,0,0.06)',
        'hard':   '0 20px 60px -12px rgba(0,0,0,0.25)',
        'glow':   '0 0 30px rgba(37, 99, 235, 0.3)',
        'card':   '0 1px 3px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in':     'fadeIn 0.6s ease-out',
        'slide-up':    'slideUp 0.6s ease-out',
        'slide-down':  'slideDown 0.6s ease-out',
        'scale-in':    'scaleIn 0.4s ease-out',
        'float':       'float 6s ease-in-out infinite',
        'pulse-soft':  'pulseSoft 3s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'gradient':    'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn:        { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:       { from: { opacity: 0, transform: 'translateY(30px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown:     { from: { opacity: 0, transform: 'translateY(-30px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:       { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        float:         { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } },
        pulseSoft:     { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
        shimmer:       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        gradientShift: { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
      },
      transitionDuration: { '400': '400ms' },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
