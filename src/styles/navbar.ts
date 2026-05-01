import { StyleSheet } from 'react-native';
import { accent, palette, spacing } from './theme';

const navbarStyles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    // Anthracite glass — the only place blur survives at full intensity is
    // the rest dock; nav is solid-with-alpha for context separation.
    backgroundColor: 'rgba(10, 10, 10, 0.92)',
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    paddingTop: spacing.sm,
    // paddingBottom is set dynamically from useSafeAreaInsets in NavBar.tsx
    // (was Platform.OS === 'ios' ? 0 : spacing.sm — caused icons to sit
    // under the home indicator on iPhones).
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
    backgroundColor: accent.lift,
  },
});

export default navbarStyles;
