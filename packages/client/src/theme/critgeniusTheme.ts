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

// Responsive typography configuration with fluid scaling optimized for gaming sessions
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

  // Fluid typography using clamp() for optimal readability across devices
  h1: {
    fontWeight: 700,
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', // 28px → 40px responsive scaling
    lineHeight: 'clamp(1.2, 1.25, 1.3)', // Responsive line height
    letterSpacing: '-0.01562em',
    color: colors.text.primary,
  },
  h2: {
    fontWeight: 600,
    fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', // 24px → 32px responsive scaling
    lineHeight: 'clamp(1.25, 1.3, 1.35)',
    letterSpacing: '-0.00833em',
    color: colors.text.primary,
  },
  h3: {
    fontWeight: 600,
    fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', // 20px → 28px responsive scaling
    lineHeight: 'clamp(1.3, 1.35, 1.4)',
    color: colors.text.primary,
  },
  h4: {
    fontWeight: 500,
    fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)', // 18px → 24px responsive scaling
    lineHeight: 'clamp(1.35, 1.4, 1.45)',
    color: colors.text.primary,
  },
  h5: {
    fontWeight: 500,
    fontSize: 'clamp(1rem, 2vw, 1.25rem)', // 16px → 20px responsive scaling
    lineHeight: 'clamp(1.4, 1.45, 1.5)',
    color: colors.text.primary,
  },
  h6: {
    fontWeight: 500,
    fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', // 14px → 16px responsive scaling
    lineHeight: 'clamp(1.45, 1.5, 1.55)',
    color: colors.text.primary,
  },

  // Body text optimized for transcript display with enhanced readability
  body1: {
    fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)', // 14px → 18px for transcript readability
    lineHeight: 'clamp(1.5, 1.6, 1.7)', // Enhanced line height for long reading sessions
    letterSpacing: '0.00938em',
    color: colors.text.primary,
  },
  body2: {
    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', // 12px → 14px for metadata
    lineHeight: 'clamp(1.4, 1.5, 1.6)',
    letterSpacing: '0.01071em',
    color: colors.text.secondary,
  },

  // Caption for metadata and timestamps with improved scaling
  caption: {
    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)', // 10px → 12px responsive scaling
    lineHeight: 'clamp(1.3, 1.4, 1.5)',
    letterSpacing: '0.03333em',
    color: colors.text.secondary,
    fontWeight: 400,
  },

  // Overline for section headers with responsive sizing
  overline: {
    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)', // 10px → 12px responsive scaling
    lineHeight: 'clamp(1.8, 2, 2.2)',
    letterSpacing: '0.08333em',
    color: colors.text.secondary,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
  },

  // Button text with touch-friendly scaling
  button: {
    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', // 12px → 14px for better touch targets
    lineHeight: 'clamp(1.6, 1.75, 1.9)',
    letterSpacing: '0.02857em',
    fontWeight: 500,
    textTransform: 'none' as const, // No uppercase for better readability
  },
} as const;

// Responsive typography utilities for component-level customization
const typographyUtilities = {
  // Fluid font sizes for specific use cases
  transcriptText: {
    fontSize: 'clamp(0.875rem, 2.8vw, 1.25rem)', // Enhanced for transcript readability
    lineHeight: 'clamp(1.6, 1.7, 1.8)',
    letterSpacing: '0.01em',
  },

  speakerLabel: {
    fontSize: 'clamp(0.75rem, 2vw, 1rem)', // Speaker identification labels
    lineHeight: 'clamp(1.4, 1.5, 1.6)',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },

  timestamp: {
    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)', // Session timestamps
    lineHeight: 'clamp(1.3, 1.4, 1.5)',
    fontWeight: 400,
    letterSpacing: '0.04em',
    fontVariantNumeric: 'tabular-nums' as const, // Monospace numbers for alignment
  },

  audioControls: {
    fontSize: 'clamp(0.875rem, 2.2vw, 1.125rem)', // Audio control labels
    lineHeight: 'clamp(1.5, 1.6, 1.7)',
    fontWeight: 500,
    letterSpacing: '0.01em',
  },

  characterName: {
    fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)', // D&D character names
    lineHeight: 'clamp(1.4, 1.5, 1.6)',
    fontWeight: 600,
    letterSpacing: '0.015em',
  },

  errorMessage: {
    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', // Error and warning messages
    lineHeight: 'clamp(1.4, 1.5, 1.6)',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
} as const;

// Accessibility-aware typography helpers
const typographyHelpers = {
  // Respect user font-size preferences while maintaining design integrity
  respectUserPreferences: (baseFontSize: string, scaleFactor: number = 1) => ({
    fontSize: `calc(${baseFontSize} * ${scaleFactor})`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none', // Disable transitions for reduced motion preference
    },
  }),

  // High contrast mode support
  highContrastMode: {
    '@media (prefers-contrast: high)': {
      fontWeight: 600, // Increase font weight for better readability
      textShadow: 'none', // Remove decorative shadows
    },
  },

  // Large text mode support
  largeTextMode: {
    '@media (min-resolution: 1.25dppx)': {
      fontSize: '110%', // Slight increase for high-DPI displays
    },
  },

  // Reading mode optimizations
  readingOptimization: {
    textRendering: 'optimizeLegibility' as const,
    fontSmooth: 'always' as const,
    WebkitFontSmoothing: 'antialiased' as const,
    MozOsxFontSmoothing: 'grayscale' as const,
  },
} as const;

// Enhanced breakpoints optimized for audio interface and D&D gaming sessions
const breakpoints = {
  values: {
    xs: 0, // Mobile portrait (phones) - minimal audio controls
    sm: 480, // Mobile landscape / small tablets - compact speaker mapping
    md: 768, // Tablet portrait - audio controls need adequate space
    lg: 1024, // Tablet landscape / small desktop - two-column layouts
    xl: 1440, // Desktop - optimal for speaker mapping UI
    xxl: 1920, // Large desktop - full feature display with sidebars
  },
} as const;

// Responsive spacing system with fluid scaling
const spacing = (factor: number) => `${8 * factor}px`; // Base 8px unit

// Custom spacing utilities for responsive design
const responsiveSpacing = {
  // Container padding that scales with screen size
  containerPadding: {
    xs: spacing(2), // 16px on mobile
    sm: spacing(3), // 24px on small tablets
    md: spacing(4), // 32px on tablets
    lg: spacing(5), // 40px on desktop
    xl: spacing(6), // 48px on large desktop
    xxl: spacing(8), // 64px on ultra-wide
  },

  // Section spacing for consistent layout rhythm
  sectionSpacing: {
    xs: spacing(3), // 24px between sections on mobile
    sm: spacing(4), // 32px on small tablets
    md: spacing(5), // 40px on tablets
    lg: spacing(6), // 48px on desktop
    xl: spacing(8), // 64px on large desktop
    xxl: spacing(10), // 80px on ultra-wide
  },

  // Component spacing for UI elements
  componentSpacing: {
    xs: spacing(1), // 8px tight spacing on mobile
    sm: spacing(1.5), // 12px
    md: spacing(2), // 16px standard spacing
    lg: spacing(2.5), // 20px
    xl: spacing(3), // 24px generous spacing on desktop
    xxl: spacing(4), // 32px ultra-wide spacing
  },

  // Touch target sizes for mobile optimization
  touchTargets: {
    minimum: spacing(6), // 48px minimum touch target
    comfortable: spacing(7), // 56px comfortable touch target
    large: spacing(8), // 64px large touch target for primary actions
  },

  // Audio interface specific spacing
  audioInterface: {
    controlSpacing: {
      xs: spacing(1), // Tight spacing on mobile
      sm: spacing(2), // 16px
      md: spacing(3), // 24px
      lg: spacing(4), // 32px generous desktop spacing
    },
    visualizerHeight: {
      xs: spacing(6), // 48px compact visualizer
      sm: spacing(8), // 64px
      md: spacing(10), // 80px
      lg: spacing(12), // 96px full-featured visualizer
    },
  },
} as const;

// Breakpoint helper utilities
const breakpointHelpers = {
  // Check if current screen is mobile (xs, sm)
  isMobile: (theme: { breakpoints: { down: (bp: string) => unknown } }) =>
    theme.breakpoints.down('md'),

  // Check if current screen is tablet (md, lg)
  isTablet: (theme: {
    breakpoints: { between: (a: string, b: string) => unknown };
  }) => theme.breakpoints.between('md', 'xl'),

  // Check if current screen is desktop (xl+)
  isDesktop: (theme: { breakpoints: { up: (bp: string) => unknown } }) =>
    theme.breakpoints.up('xl'),

  // Get responsive value based on breakpoint
  getResponsiveValue: (values: Record<string, unknown>, breakpoint: string) => {
    return (
      (values as Record<string, unknown>)[breakpoint] ||
      (values as Record<string, unknown>).md ||
      (values as Record<string, unknown>).xs
    );
  },

  // Generate media queries for custom breakpoints
  customMediaQuery: (minWidth: number, maxWidth?: number) => {
    if (maxWidth) {
      return `@media (min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
    }
    return `@media (min-width: ${minWidth}px)`;
  },

  // Touch-friendly sizing utilities
  touchTarget: {
    minimum: {
      minHeight: responsiveSpacing.touchTargets.minimum,
      minWidth: responsiveSpacing.touchTargets.minimum,
    },
    comfortable: {
      minHeight: responsiveSpacing.touchTargets.comfortable,
      minWidth: responsiveSpacing.touchTargets.comfortable,
    },
    large: {
      minHeight: responsiveSpacing.touchTargets.large,
      minWidth: responsiveSpacing.touchTargets.large,
    },
  },
} as const;

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
export {
  colors,
  responsiveSpacing,
  breakpointHelpers,
  typographyUtilities,
  typographyHelpers,
};
export type CritGeniusTheme = typeof critgeniusTheme;
export type ResponsiveSpacing = typeof responsiveSpacing;
export type BreakpointHelpers = typeof breakpointHelpers;
export type TypographyUtilities = typeof typographyUtilities;
export type TypographyHelpers = typeof typographyHelpers;

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
