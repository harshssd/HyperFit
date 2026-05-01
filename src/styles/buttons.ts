import { StyleSheet } from 'react-native';
import { palette, text, accent, spacing, radii } from './theme';

const buttonStyles = StyleSheet.create({
  // Honest-mirror buttons: flat surface, no glow, no gradient. Primary owns
  // the lift orange. Secondary is a hairline-bordered surface. Danger and
  // ghost stay restrained.
  neonButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  neonButtonBase: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 13,
  },
  neonButtonPrimary: {
    backgroundColor: accent.lift,
    // No border ring. Solid orange = action.
  },
  neonButtonSecondary: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  neonButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.30)',
  },
  neonButtonGhost: {
    backgroundColor: 'transparent',
  },
  neonButtonDisabled: {
    opacity: 0.4,
  },
  neonButtonText: {
    color: text.primary,
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  neonButtonTextPrimary: {
    // Page bg color punches out the orange button — high contrast,
    // reads as "instrument-panel button" not "iOS pill".
    color: palette.bg,
  },
  neonButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});

export default buttonStyles;
