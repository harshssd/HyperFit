import { StyleSheet } from 'react-native';
import { colors, spacing, radii } from './theme';

const challengesStyles = StyleSheet.create({
  challengesView: {
    flex: 1,
  },
  challengesViewContent: {
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.mutedAlt,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyCardText: {
    color: colors.muted,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  challengeDescription: {
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  challengeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: radii.sm,
  },
});

export default challengesStyles;


