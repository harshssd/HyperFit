import { StyleSheet } from 'react-native';
import { palette, accent, spacing, radii } from './theme';

const cardsStyles = StyleSheet.create({
  // Flat surface card. The previous "glass" treatment (heavy shadow, blur,
  // orange-on-press border) competed with the hero gradient and stole
  // attention from the data inside. Per DESIGN.md "honest mirror" direction:
  // hairline border, no shadow, surface fill — let typography carry hierarchy.
  glassCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  glassCardNoPadding: {
    padding: 0,
  },
  glassCardPressable: {
    // Subtle pressable affordance — no orange border, no glow. The pressable
    // state is communicated by activeOpacity (set on the TouchableOpacity).
    backgroundColor: palette.surface,
  },

  // Error banner — used by ErrorBanner / inline error rows.
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.30)',
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: accent.regression,
    fontSize: 12,
    flex: 1,
  },
  errorBannerRetry: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: accent.lift,
  },
  errorBannerRetryText: {
    color: accent.lift,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default cardsStyles;
