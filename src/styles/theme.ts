import type { TextStyle } from 'react-native';

// Design system tokens — see DESIGN.md for the full system.
//
// "Honest mirror" direction (Strava × Robinhood hybrid): anthracite base,
// strava-orange for active/lift signals, robinhood-green for session-volume
// improvement. Mono numerics with tabular-nums on every readout.
//
// Existing colors / spacing / radii / fonts / shadows / gradients keys are
// preserved (back-compat with ~35 call sites) but their VALUES have been
// remapped to the new palette. Surface-level structure (hero gradient,
// last-session rule, 4-column set grid) lives in feature components.

// -----------------------------------------------------------------------------
// New structured tokens — prefer these in new code
// -----------------------------------------------------------------------------

export const palette = {
  // Surfaces
  bg:           '#0a0a0a',  // app background
  bgHeroTint:   '#1a0f0a',  // hero gradient bottom-tint (radial orange origin)
  surface:      '#18181b',  // card / surface
  surfaceAlt:   '#27272a',  // elevated surface, hover/pressed
  borderSubtle: '#18181b',  // hairline between rows / sets / last-rule
  borderStrong: '#27272a',  // card outline, divider between exercises

  // Text ramp
  textPrimary:    '#ffffff',
  textSecondary:  '#d4d4d8',
  textTertiary:   '#a1a1aa',
  textQuaternary: '#71717a',  // labels: "LAST", "SET 1", "REST"
  textDisabled:   '#3f3f46',  // pending sets, future targets

  // Accents (used sparingly — color is signal, not decoration)
  liftActive:   '#fc4c02',  // active set, PR chip, +delta on a single lift
  sessionUp:    '#00d68f',  // session-volume trending up vs prior session
  regression:   '#ef4444',  // session-volume trending down (reserved)
} as const;

export const accent = {
  lift:       palette.liftActive,
  sessionUp:  palette.sessionUp,
  regression: palette.regression,
} as const;

export const text = {
  primary:    palette.textPrimary,
  secondary:  palette.textSecondary,
  tertiary:   palette.textTertiary,
  quaternary: palette.textQuaternary,
  disabled:   palette.textDisabled,
} as const;

// -----------------------------------------------------------------------------
// Back-compat exports — values remapped to the new palette above
// -----------------------------------------------------------------------------

export const colors = {
  // Base / surfaces
  background:   palette.bg,
  overlay:      'rgba(10, 10, 10, 0.92)',
  glass:        'rgba(10, 10, 10, 0.85)',
  surface:      palette.surface,
  border:       palette.borderStrong,
  borderStrong: palette.surfaceAlt,
  muted:        palette.textQuaternary,
  mutedAlt:     palette.textTertiary,

  // Accents — primary remapped to strava-orange
  primary:       palette.liftActive,
  primaryBright: '#ff6a2b',
  // cyan retired — mapped to sessionUp green so existing call sites read as
  // "good signal" instead of a now-undefined accent. Surface refactors will
  // remove direct cyan usage.
  cyan: palette.sessionUp,

  // State
  success:       palette.sessionUp,
  successBright: '#22ec9f',
  danger:        palette.regression,

  // Utility
  divider:         palette.borderSubtle,
  inputBackground: palette.surface,
};

export const spacing = {
  // Existing keys preserved; surface refactors may use the extended scale below.
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

// Extended scale — 2px and 6px for dense rows; 40/56/64 for hero blocks.
export const space = {
  '2xs': 2,
  xs:    4,
  '2sm': 6,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
  '5xl': 64,
} as const;

export const radii = {
  // Hierarchical: chips/badges sm, inputs md, cards lg, modals xl.
  xs:   4,
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 999,
};

export const fonts = {
  family: {
    // 'System' resolves to SF Pro on iOS, Roboto on Android, system-ui on web.
    // The display direction wants Inter; loading Inter via expo-font is a
    // follow-up. Until then, system gets us 90% of the way on iOS.
    base: 'System',
    mono: 'monospace',  // SF Mono / Menlo / system mono fallback
  },
  weight: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    heavy:    '800',
    black:    '900',
  },
  // Use fontVariant: fonts.tabularNums on every numeric Text component.
  // RN's equivalent of CSS font-feature-settings: 'tnum'.
  tabularNums: ['tabular-nums'] as NonNullable<TextStyle['fontVariant']>,
};

export const shadows = {
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius:  10,
    elevation:     4,
  },
  glow: {
    // Active set / PR moments — orange glow, used sparingly.
    shadowColor:   palette.liftActive,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius:  16,
    elevation:     6,
  },
};

export const gradients = {
  // Hero gradient: radial orange (top-left) + radial green (bottom-right) +
  // linear bottom-fade. Implemented in components via expo-linear-gradient
  // and an absolute-positioned radial overlay. These arrays are the
  // simplified linear approximations for places where a radial isn't worth it.
  primary: [palette.liftActive, '#ff6a2b'],
  heroFade: ['transparent', palette.bg],
  glassOverlay: ['rgba(10, 10, 10, 0.4)', 'rgba(10, 10, 10, 0.92)'],
};

export const theme = {
  colors,
  palette,
  accent,
  text,
  spacing,
  space,
  radii,
  fonts,
  shadows,
  gradients,
};

export type Theme = typeof theme;
