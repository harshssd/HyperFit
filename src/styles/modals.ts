import { StyleSheet } from 'react-native';
import { colors, spacing, radii } from './theme';

// Shared modal/overlay styles for full-screen or centered dialogs.
const modalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    zIndex: 1000,
    elevation: 12,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
});

export default modalStyles;

