import { StyleSheet } from 'react-native';
import { colors, spacing, radii } from './theme';

const alertsStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: radii.md,
  },
  bannerError: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  bannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  bannerText: {
    color: '#e2e8f0',
    fontSize: 12,
    flex: 1,
  },
  bannerAction: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  bannerActionText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});

export default alertsStyles;


