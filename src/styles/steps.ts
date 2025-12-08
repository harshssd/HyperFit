import { StyleSheet } from 'react-native';
import { colors, spacing } from './theme';

const stepsStyles = StyleSheet.create({
  stepsView: {
    flex: 1,
  },
  stepsViewContent: {
    paddingBottom: spacing.xl,
  },
  stepsCard: {
    padding: 32,
    alignItems: 'center',
  },
  stepsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  stepsLabel: {
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
});

export default stepsStyles;

