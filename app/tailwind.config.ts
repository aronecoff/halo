import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        halo: {
          50: '#f3f0ff', 100: '#e9e3ff', 200: '#d4c9ff', 300: '#b5a0ff',
          400: '#9171ff', 500: '#7c3aed', 600: '#6d28d9', 700: '#5b21b6',
          800: '#4c1d95', 900: '#2e1065', 950: '#1a0a3e',
        },
        aurora: {
          purple: '#a78bfa', blue: '#60a5fa', teal: '#2dd4bf',
          cyan: '#22d3ee', pink: '#f472b6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'neural-pulse': 'neuralPulse 2s ease-in-out infinite',
        'glow-shift': 'glowShift 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.1)' },
          '100%': { boxShadow: '0 0 30px rgba(124,58,237,0.5), 0 0 90px rgba(124,58,237,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        neuralPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        glowShift: {
          '0%': { boxShadow: '0 0 30px rgba(167,139,250,0.2)' },
          '33%': { boxShadow: '0 0 30px rgba(96,165,250,0.2)' },
          '66%': { boxShadow: '0 0 30px rgba(45,212,191,0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(167,139,250,0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
