import { StyleSheet } from 'react-native';
import { palette, text, accent, spacing, radii } from './theme';

const headerStyles = StyleSheet.create({
  // Honest-mirror header. No glass blur on the bg, no italic, no orange
  // logo block. Just clean type with a hairline divider below.
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: palette.bg,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: accent.lift,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: text.primary,
    letterSpacing: -0.4,
    // Italic was very 90s-fitness. Dropping it for tighter modern type.
  },
  headerTitleAccent: {
    color: accent.lift,
  },
  headerRank: {
    marginTop: spacing.xs,
  },
  headerRankText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    borderWidth: 1,
    // borderColor is set inline alongside `color` (RN doesn't support
    // CSS `currentColor` — must be passed explicitly).
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakContainer: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakText: {
    color: text.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  logoutButton: {
    padding: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: palette.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: accent.lift,
    borderRadius: 2,
  },
});

export default headerStyles;
