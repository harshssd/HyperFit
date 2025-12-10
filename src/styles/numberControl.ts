import { StyleSheet } from 'react-native';
import { colors, spacing, radii } from './theme';

const numberControlStyles = StyleSheet.create({
  numberControl: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  numberControlLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  numberControlContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    padding: spacing.xs,
  },
  numberControlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
  },
  numberControlInput: {
    flex: 1,
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default numberControlStyles;


