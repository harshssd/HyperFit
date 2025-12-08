import { StyleSheet } from 'react-native';
import { colors, spacing } from './theme';

const statsStyles = StyleSheet.create({
  statsView: {
    flex: 1,
  },
  statsViewContent: {
    paddingBottom: spacing.xl,
  },
  statsCard: {
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  statsCardTitle: {
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  statsCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  chartContainer: {
    height: 160,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: spacing.lg,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  chartBarContainer: {
    width: '100%',
    height: 128,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    opacity: 0.8,
  },
  chartLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.muted,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartEmpty: {
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartEmptyText: {
    color: '#475569',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default statsStyles;

