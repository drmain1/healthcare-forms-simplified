export const designTokens = {
  colors: {
    // Primary colors (most used hardcoded values)
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3', // Light blue variant
      600: '#1e88e5',
      700: '#1976d2', // MUI default primary (most frequent)
      800: '#1565c0', // Primary hover state
      900: '#0d47a1',
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    
    // Surface colors (backgrounds, cards)
    surface: {
      white: '#ffffff',
      light: '#fafafa',
      gray: '#f8fafc',
      card: '#f5f5f5',
      border: '#e0e0e0',
    },

    // Warm healthcare theme colors
    warm: {
      beige: '#CEC5B4', // PublicFormFill beige
      cream: '#fffef7',
      sand: '#f4e9d9',
      taupe: '#d3c7b8',
    },

    // Text colors
    text: {
      primary: '#212121', // Dark text
      secondary: '#616161', // Text gray
      disabled: '#9e9e9e',
    },

    // Neutral grays (comprehensive scale)
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },

    // Semantic colors
    success: {
      light: '#81c784',
      main: '#4caf50',
      dark: '#388e3c',
    },
    warning: {
      light: '#ffb74d',
      main: '#ff9800', // Pain level orange
      dark: '#f57c00',
    },
    error: {
      light: '#e57373',
      main: '#f44336', // Pain level red
      dark: '#d32f2f',
    },
    info: {
      light: '#64b5f6',
      main: '#2196f3',
      dark: '#1976d2',
    },

    // Pain assessment colors (BodyPainDiagram)
    pain: {
      mild: '#FFC107', // Yellow
      moderate: '#FF9800', // Orange
      severe: '#F44336', // Red
    },

    // Button colors
    button: {
      primary: '#8e8e8e',
      hover: '#6e6e6e',
      active: '#5e5e5e',
    },
  },

  // Comprehensive spacing system
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px - replaces padding: '16px'
    5: '1.25rem',  // 20px - replaces margin-bottom: '20px'
    6: '1.5rem',   // 24px - replaces px: 3 (MUI × 2)
    8: '2rem',     // 32px - replaces py: 2 (MUI × 2) 
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    // Layout specific
    drawerWidth: '280px', // replaces drawerWidth = 280
  },

  // Typography system
  typography: {
    fontFamily: {
      primary: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      secondary: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '-0.011em',
      wide: '0.025em',
    },
  },

  // Border radius system
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },

  // Shadow system (replaces hardcoded box-shadow values)
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    // Replaces: '0 2px 4px rgba(0,0,0,0.1)'
    default: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    // Replaces: '0 1px 3px rgba(0,0,0,0.12)'
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    // Replaces: '0px 3px 6px rgba(0,0,0,0.16)'
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Transition system
  transitions: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};