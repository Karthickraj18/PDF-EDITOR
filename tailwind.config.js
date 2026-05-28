/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        card: "rgba(26, 26, 46, 0.6)",
        cardBorder: "rgba(0, 245, 255, 0.1)",
        primary: "#00F5FF",
        secondary: "#FFB347",
        text: {
          main: "#FFFFFF",
          muted: "#A1A1AA" // soft gray
        }
      },
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 15px rgba(0, 245, 255, 0.4)' },
          '50%': { opacity: .5, boxShadow: '0 0 5px rgba(0, 245, 255, 0.1)' },
        }
      }
    },
  },
  plugins: [],
}
