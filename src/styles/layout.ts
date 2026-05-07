import { StyleSheet } from 'react-native';
import { colors, spacing } from './theme';

const layoutStyles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  appOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  // maxWidth lives at the call site (ScreenLayout) so it can read from
  // useContentMaxWidth() and respond to window resize / rotation.
  appContent: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  mainContent: {
    flex: 1,
  },
  mainContentContainer: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.cyan,
    fontFamily: 'monospace',
    marginTop: spacing.md,
  },
});

export default layoutStyles;



