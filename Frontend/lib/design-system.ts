/**
 * DQMS Enterprise Design System
 * Based on 2025 UI/UX Research & Best Practices
 *
 * Research Sources:
 * - Enterprise Dashboard UI Trends 2025
 * - SaaS Admin Panel Best Practices
 * - Professional Color Psychology
 */

export const colors = {
  // Primary Brand Colors (Trust & Stability - Blue Spectrum)
  primary: {
    50: '#EFF6FF',   // Lightest
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',  // Main primary
    600: '#2563EB',  // Darker primary
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',  // Darkest
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },

  // Secondary (Innovation & Creativity - Purple Spectrum)
  secondary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',  // Main secondary
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },

  // Success (Positive Actions - Green Spectrum)
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',  // Main success
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Warning (Attention Required - Amber Spectrum)
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',  // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Danger (Critical Actions - Red Spectrum)
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Main danger
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Neutral (Professional Base - Gray Spectrum)
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Dark Theme Colors
  dark: {
    bg: {
      primary: '#0F172A',    // Main background
      secondary: '#1E293B',  // Card background
      tertiary: '#334155',   // Elevated surfaces
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
    },
  },

  // Light Theme Colors
  light: {
    bg: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#64748B',
    },
  },

  // Special Effects
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    aurora: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    emerald: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
}

export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
}

export const typography = {
  fonts: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace',
  },
  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
}

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',

  // Colored shadows for emphasis
  primaryGlow: '0 10px 40px -10px rgba(59, 130, 246, 0.5)',
  successGlow: '0 10px 40px -10px rgba(16, 185, 129, 0.5)',
  warningGlow: '0 10px 40px -10px rgba(245, 158, 11, 0.5)',
  dangerGlow: '0 10px 40px -10px rgba(239, 68, 68, 0.5)',
}

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
}

export const animations = {
  durations: {
    fast: '150ms',
    base: '300ms',
    slow: '500ms',
  },
  easings: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
}

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Status Colors for Queue States
export const statusColors = {
  active: colors.success[500],
  called: colors.warning[500],
  inService: colors.primary[500],
  completed: colors.neutral[400],
  cancelled: colors.danger[500],
  noShow: colors.danger[700],
  expired: colors.neutral[500],
}

// Component Variants
export const componentVariants = {
  button: {
    primary: {
      bg: colors.primary[600],
      hover: colors.primary[700],
      text: '#FFFFFF',
      shadow: shadows.primaryGlow,
    },
    secondary: {
      bg: colors.secondary[600],
      hover: colors.secondary[700],
      text: '#FFFFFF',
      shadow: shadows.md,
    },
    success: {
      bg: colors.success[600],
      hover: colors.success[700],
      text: '#FFFFFF',
      shadow: shadows.successGlow,
    },
    danger: {
      bg: colors.danger[600],
      hover: colors.danger[700],
      text: '#FFFFFF',
      shadow: shadows.dangerGlow,
    },
    ghost: {
      bg: 'transparent',
      hover: colors.neutral[100],
      text: colors.neutral[700],
      shadow: shadows.none,
    },
  },
  card: {
    elevated: {
      bg: colors.light.bg.primary,
      shadow: shadows.xl,
      border: colors.neutral[200],
    },
    flat: {
      bg: colors.light.bg.secondary,
      shadow: shadows.none,
      border: colors.neutral[200],
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.1)',
      backdrop: 'blur(10px)',
      border: 'rgba(255, 255, 255, 0.2)',
    },
  },
}

// Export default design system
export const designSystem = {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  animations,
  breakpoints,
  statusColors,
  componentVariants,
}

export default designSystem
