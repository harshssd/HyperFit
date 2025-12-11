import { colors as palette } from './theme';

// Semantic color aliases to improve readability and consistency.
export const colors = {
  ...palette,
  textPrimary: '#ffffff',
  textMuted: palette.muted,
  textMutedAlt: palette.mutedAlt,
  surfaceAlt: palette.glass,
  surfaceStrong: palette.surface,
  panel: palette.glass,
  borderDefault: palette.border,
  borderStrong: palette.borderStrong,
  overlayHeavy: palette.overlay,
};

export type Colors = typeof colors;



