const { designTokens } = require('./src/styles/design-tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-', // Prevents conflicts with existing styles
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.primary,
        warm: designTokens.colors.warm,
        neutral: designTokens.colors.neutral,
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        error: designTokens.colors.error,
        info: designTokens.colors.info,
      },
      spacing: designTokens.spacing,
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // CRITICAL: Prevents CSS reset conflicts
  },
}

