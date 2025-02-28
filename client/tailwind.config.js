/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      rotate: {
        '1': '1deg',
        '2': '2deg',
        '3': '3deg',
        'y-2': '2deg',
        'x-2': '2deg',
      },
      translate: {
        'z-10': '10px',
      },
      perspective: {
        '1000': '1000px',
      },
      colors: {
        primary: {
          50: "#f3f8fa",
          100: "#e7f1f4",
          200: "#daeff4", // Main primary color - Soft blue
          300: "#c0e5ee",
          400: "#a6dae8",
          500: "#8ccfe2",
          600: "#73c4dc",
          700: "#59b9d6",
          800: "#3faed0",
          900: "#2593b5",
          950: "#1a7997",
        },
        secondary: {
          50: "#fcfdf9",
          100: "#fefae8", // Main secondary color - Cream
          200: "#fcf6d1",
          300: "#faf2ba",
          400: "#f8eda3",
          500: "#f6e98c",
          600: "#f4e475",
          700: "#f2e05e",
          800: "#f0db47",
          900: "#eed730",
          950: "#e3ca17",
        },
        accent: {
          50: "#f7f2f9",
          100: "#f0e5f3",
          200: "#e2d2e7", // Main accent color - Lavender
          300: "#d4bfdb",
          400: "#c6adcf",
          500: "#b89ac3",
          600: "#aa87b7",
          700: "#9c74ab",
          800: "#8e619f",
          900: "#804e93",
          950: "#723b87",
        },
        dark: {
          800: "#3d4663",
          900: "#2d3452",
          950: "#1f243a",
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Lexend"', 'sans-serif'],
      },
      boxShadow: {
        card: "0 4px 10px -1px rgba(0, 0, 0, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(48, 128, 255, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "slide-in-right": "slideInRight 0.6s ease-out forwards",
        "slide-in-left": "slideInLeft 0.6s ease-out forwards", 
        "scale-in": "scaleIn 0.5s ease-out forwards",
        "bounce-in": "bounceIn 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
        "float": "float 3s ease-in-out infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
        "3d-float": "threeD-float 6s ease-in-out infinite",
        "3d-rotate": "threeD-rotate 8s linear infinite",
        "3d-scale": "threeD-scale 4s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(15px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-20px)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        bounceIn: {
          "0%": { transform: "scale(0.8)", opacity: 0 },
          "70%": { transform: "scale(1.05)", opacity: 0.9 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "threeD-float": {
          "0%, 100%": { transform: "translateZ(0) translateY(0) rotateX(0)" },
          "25%": { transform: "translateZ(10px) translateY(-10px) rotateX(2deg)" },
          "50%": { transform: "translateZ(20px) translateY(-15px) rotateX(4deg)" },
          "75%": { transform: "translateZ(10px) translateY(-5px) rotateX(2deg)" },
        },
        "threeD-rotate": {
          "0%": { transform: "rotateY(0) rotateX(0)" },
          "25%": { transform: "rotateY(5deg) rotateX(2deg)" },
          "50%": { transform: "rotateY(0) rotateX(0)" },
          "75%": { transform: "rotateY(-5deg) rotateX(-2deg)" },
          "100%": { transform: "rotateY(0) rotateX(0)" },
        },
        "threeD-scale": {
          "0%, 100%": { transform: "scale3d(1, 1, 1)" },
          "50%": { transform: "scale3d(1.05, 1.05, 1.1)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};