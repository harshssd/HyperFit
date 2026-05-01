import { StyleSheet } from 'react-native';
import { palette, text, accent, spacing, radii } from './theme';

const homeStyles = StyleSheet.create({
  homeView: {
    flex: 1,
  },
  homeViewContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  homeCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  homeCardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: text.primary,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  homeCardSubtitle: {
    fontSize: 14,
    color: text.tertiary,
  },
  homeQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: radii.lg,
  },
  homeQuickActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: accent.lift,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default homeStyles;



