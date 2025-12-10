import { StyleSheet } from 'react-native';
import { colors, spacing, radii, shadows } from './theme';

const cardsStyles = StyleSheet.create({
  glassCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    ...shadows.card,
  },
  glassCardNoPadding: {
    padding: 0,
  },
  glassCardPressable: {
    borderColor: colors.primary,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: '#f87171',
    fontSize: 12,
    flex: 1,
  },
  errorBannerRetry: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  errorBannerRetryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default cardsStyles;


