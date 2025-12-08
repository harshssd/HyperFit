// Centralized design tokens for colors, spacing, radii, typography, shadows, and gradients.
// Use these tokens when refactoring styles out of appStyles.ts to keep a consistent visual system.

export const colors = {
  // Base / surfaces
  background: '#0f172a',
  overlay: 'rgba(15, 23, 42, 0.9)',
  glass: 'rgba(15, 23, 42, 0.8)',
  surface: '#1e293b',
  border: '#334155',
  borderStrong: '#475569',
  muted: '#64748b',
  mutedAlt: '#94a3b8',

  // Accents
  primary: '#f97316',
  primaryBright: '#fb923c',
  cyan: '#22d3ee',

  // State
  success: '#10b981',
  successBright: '#34d399',
  danger: '#f87171',

  // Utility
  divider: '#1e293b',
  inputBackground: '#0f172a',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const fonts = {
  family: {
    base: 'System',
    mono: 'monospace',
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '900',
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const gradients = {
  primary: ['#f97316', '#fb923c'],
  glassOverlay: ['rgba(15, 23, 42, 0.6)', 'rgba(15, 23, 42, 0.9)'],
};

export const theme = {
  colors,
  spacing,
  radii,
  fonts,
  shadows,
  gradients,
};

export type Theme = typeof theme;

