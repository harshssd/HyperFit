import { StyleSheet } from 'react-native';
import { colors, spacing, radii } from './theme';

const homeStyles = StyleSheet.create({
  homeView: {
    flex: 1,
  },
  homeViewContent: {
    paddingBottom: spacing.xl,
  },
  homeCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  homeCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  homeCardSubtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  homeQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radii.lg,
  },
  homeQuickActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default homeStyles;


