import { StyleSheet } from 'react-native';
import { colors, spacing, radii } from './theme';

const buttonStyles = StyleSheet.create({
  neonButton: {
    borderRadius: radii.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  neonButtonBase: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 14,
  },
  neonButtonPrimary: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryBright,
  },
  neonButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  neonButtonDanger: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  neonButtonGhost: {
    backgroundColor: 'transparent',
  },
  neonButtonDisabled: {
    opacity: 0.5,
  },
  neonButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  neonButtonTextPrimary: {
    color: colors.background,
  },
  neonButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});

export default buttonStyles;


