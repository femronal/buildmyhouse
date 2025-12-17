/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: '#FFFFFF',
        primary: '#000000',
        success: '#000000',
        charcoal: '#000000',
        sage: '#000000',
        white: '#FFFFFF',
        black: '#000000',
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        'poppins': ['Poppins_700Bold'],
        'poppins-medium': ['Poppins_500Medium'],
        'poppins-regular': ['Poppins_400Regular'],
        'poppins-semibold': ['Poppins_600SemiBold'],
        'poppins-bold': ['Poppins_700Bold'],
        'poppins-extrabold': ['Poppins_800ExtraBold'],
        'mono': ['JetBrainsMono_500Medium'],
      },
      fontSize: {
        'xs': '14px',      // Small text - increased from 12px
        'sm': '16px',      // Small - increased from 14px
        'base': '18px',    // Base - increased from 16px
        'lg': '20px',      // Large - increased from 18px
        'xl': '24px',      // Extra large - increased from 20px
        '2xl': '28px',     // 2XL - increased from 24px
        '3xl': '32px',     // 3XL - increased from 30px
        '4xl': '36px',     // 4XL - increased from 36px
        '5xl': '48px',     // 5XL - increased from 48px
        '6xl': '60px',     // 6XL - increased from 60px
      },
    },
  },
  plugins: [],
};
