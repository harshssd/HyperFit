import { StyleSheet, Platform } from 'react-native';
import { colors, spacing } from './theme';

const navbarStyles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    position: 'relative',
  },
  navItemIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cyan,
  },
});

export default navbarStyles;


