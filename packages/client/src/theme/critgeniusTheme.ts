/**
 * @fileoverview CritGenius: Listener Custom MUI Theme
 * Optimized for D&D gaming sessions with dark mode primary and accessibility features
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// CritGenius Color Palette - D&D/Gaming Aesthetic
const colors = {
  // Primary: Deep mystical purples for D&D aesthetic
  primary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#6A4C93', // Main brand color
    600: '#4A148C', // Darker for hover states
    700: '#38006B',
    800: '#230D3A',
    900: '#1A0B2E',
    main: '#6A4C93',
    dark: '#4A148C',
    light: '#AB47BC',
    contrastText: '#FFFFFF',
  },

  // Secondary: Gaming gold/amber for highlights
  secondary: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFB300', // Main secondary color
    600: '#FF8F00', // Darker amber
    700: '#FF6F00',
    800: '#E65100',
    900: '#BF360C',
    main: '#FFB300',
    dark: '#FF8F00',
    light: '#FFCA28',
    contrastText: '#000000',
  },

  // Background colors optimized for gaming environments
  background: {
    default: '#0D0D0D', // Deep black for minimal eye strain
    paper: '#1A1A1A', // Slightly lighter for cards/components
    surface: '#2C2C2C', // Elevated surfaces
    elevated: '#383838', // Higher elevation components
  },

  // Surface colors for components
  surface: {
    primary: '#121212',
    secondary: '#1E1E1E',
    tertiary: '#2A2A2A',
    accent: '#363636',
  },

  // Success: Forest green for recording states
  success: {
    main: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20',
    contrastText: '#FFFFFF',
  },

  // Warning: Amber for processing states
  warning: {
    main: '#FF8F00',
    light: '#FFB74D',
    dark: '#E65100',
    contrastText: '#000000',
  },

  // Error: Fantasy red for alerts
  error: {
    main: '#D32F2F',
    light: '#EF5350',
    dark: '#C62828',
    contrastText: '#FFFFFF',
  },

  // Info: Cool blue for informational states
  info: {
    main: '#1976D2',
    light: '#42A5F5',
    dark: '#1565C0',
    contrastText: '#FFFFFF',
  },

  // Text colors optimized for dark backgrounds
  text: {
    primary: '#FFFFFF',
    secondary: alpha('#FFFFFF', 0.7),
    disabled: alpha('#FFFFFF', 0.38),
    hint: alpha('#FFFFFF', 0.5),
  },

  // Divider colors
  divider: alpha('#FFFFFF', 0.12),

  // Audio visualization specific colors
  audio: {
    waveform: '#6A4C93',
    waveformActive: '#FFB300',
    frequency: alpha('#6A4C93', 0.6),
    recording: '#2E7D32',
    processing: '#FF8F00',
    error: '#D32F2F',
  },
} as const;

// Typography configuration optimized for gaming sessions
const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),

  // Optimized for readability during long sessions
  h1: {
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
    color: colors.text.primary,
  },
  h2: {
    fontWeight: 600,
    fontSize: '2rem',
    lineHeight: 1.3,
    letterSpacing: '-0.00833em',
    color: colors.text.primary,
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.75rem',
    lineHeight: 1.3,
    color: colors.text.primary,
  },
  h4: {
    fontWeight: 500,
    fontSize: '1.5rem',
    lineHeight: 1.4,
    color: colors.text.primary,
  },
  h5: {
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: 1.4,
    color: colors.text.primary,
  },
  h6: {
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.5,
    color: colors.text.primary,
  },

  // Body text optimized for transcript display
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    letterSpacing: '0.00938em',
    color: colors.text.primary,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    letterSpacing: '0.01071em',
    color: colors.text.secondary,
  },

  // Caption for metadata and timestamps
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    letterSpacing: '0.03333em',
    color: colors.text.secondary,
    fontWeight: 400,
  },

  // Overline for section headers
  overline: {
    fontSize: '0.75rem',
    lineHeight: 2,
    letterSpacing: '0.08333em',
    color: colors.text.secondary,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
  },

  // Button text
  button: {
    fontSize: '0.875rem',
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    fontWeight: 500,
    textTransform: 'none' as const, // No uppercase for better readability
  },
} as const;

// Breakpoints for responsive design
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
} as const;

// Spacing configuration
const spacing = 8; // 8px base unit

// Component overrides for CritGenius branding
const components = {
  // Button overrides for gaming aesthetic
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 8px ${alpha(colors.primary.main, 0.3)}`,
        },
      },
      contained: {
        background: `linear-gradient(45deg, ${colors.primary.main} 30%, ${colors.primary.light} 90%)`,
        boxShadow: `0 2px 4px ${alpha(colors.primary.main, 0.3)}`,
        '&:hover': {
          background: `linear-gradient(45deg, ${colors.primary.dark} 30%, ${colors.primary.main} 90%)`,
        },
      },
      outlined: {
        borderColor: colors.primary.main,
        color: colors.primary.light,
        '&:hover': {
          borderColor: colors.primary.light,
          backgroundColor: alpha(colors.primary.main, 0.08),
        },
      },
    },
  },

  // Card styling for components
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: colors.background.paper,
        backgroundImage: 'none',
        borderRadius: 12,
        border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
        boxShadow: `0 4px 12px ${alpha('#000000', 0.4)}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          borderColor: alpha(colors.primary.main, 0.4),
          boxShadow: `0 8px 24px ${alpha('#000000', 0.6)}`,
        },
      },
    },
  },

  // Paper component styling
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundColor: colors.background.paper,
        backgroundImage: 'none',
      },
    },
  },

  // Input field styling for forms
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          backgroundColor: colors.surface.secondary,
          borderRadius: 8,
          '& fieldset': {
            borderColor: alpha(colors.text.secondary, 0.3),
          },
          '&:hover fieldset': {
            borderColor: alpha(colors.primary.main, 0.5),
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.primary.main,
            boxShadow: `0 0 0 2px ${alpha(colors.primary.main, 0.2)}`,
          },
        },
        '& .MuiInputLabel-root': {
          color: colors.text.secondary,
          '&.Mui-focused': {
            color: colors.primary.light,
          },
        },
      },
    },
  },

  // List styling for transcript display
  MuiList: {
    styleOverrides: {
      root: {
        backgroundColor: 'transparent',
      },
    },
  },

  MuiListItem: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        marginBottom: 4,
        '&:hover': {
          backgroundColor: alpha(colors.primary.main, 0.08),
        },
      },
    },
  },

  // Icon button styling
  MuiIconButton: {
    styleOverrides: {
      root: {
        color: colors.text.secondary,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          color: colors.primary.light,
          backgroundColor: alpha(colors.primary.main, 0.08),
          transform: 'scale(1.1)',
        },
      },
    },
  },

  // Chip styling for speaker tags
  MuiChip: {
    styleOverrides: {
      root: {
        backgroundColor: alpha(colors.primary.main, 0.2),
        color: colors.primary.light,
        border: `1px solid ${alpha(colors.primary.main, 0.3)}`,
        '&:hover': {
          backgroundColor: alpha(colors.primary.main, 0.3),
        },
      },
      filled: {
        backgroundColor: colors.primary.main,
        color: colors.primary.contrastText,
        '&:hover': {
          backgroundColor: colors.primary.dark,
        },
      },
    },
  },

  // Progress indicators for processing states
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        backgroundColor: alpha(colors.primary.main, 0.2),
        borderRadius: 4,
        height: 6,
      },
      bar: {
        backgroundColor: colors.secondary.main,
        borderRadius: 4,
      },
    },
  },

  // Slider styling for audio controls
  MuiSlider: {
    styleOverrides: {
      root: {
        color: colors.primary.main,
        '& .MuiSlider-thumb': {
          backgroundColor: colors.secondary.main,
          border: `2px solid ${colors.primary.main}`,
          '&:hover': {
            boxShadow: `0 0 0 8px ${alpha(colors.primary.main, 0.16)}`,
          },
        },
        '& .MuiSlider-track': {
          backgroundColor: colors.primary.main,
          border: 'none',
        },
        '& .MuiSlider-rail': {
          backgroundColor: alpha(colors.text.secondary, 0.3),
        },
      },
    },
  },
} as const;

// Create the theme configuration
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    text: colors.text,
    divider: colors.divider,
  },
  typography,
  breakpoints,
  spacing,
  components,
  shape: {
    borderRadius: 8,
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
};

// Create and export the theme
export const critgeniusTheme = createTheme(themeOptions);

// Export additional theme utilities
export { colors };
export type CritGeniusTheme = typeof critgeniusTheme;

// Custom theme augmentation for TypeScript
declare module '@mui/material/styles' {
  interface Palette {
    surface?: {
      primary: string;
      secondary: string;
      tertiary: string;
      accent: string;
    };
    audio?: {
      waveform: string;
      waveformActive: string;
      frequency: string;
      recording: string;
      processing: string;
      error: string;
    };
  }

  interface PaletteOptions {
    surface?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
      accent?: string;
    };
    audio?: {
      waveform?: string;
      waveformActive?: string;
      frequency?: string;
      recording?: string;
      processing?: string;
      error?: string;
    };
  }
}
