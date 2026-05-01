import { StyleSheet } from 'react-native';
import { palette, text, accent, spacing, radii } from './theme';

const loginStyles = StyleSheet.create({
  // Honest-mirror login. Surface card on the bg, hairline border, no shadow.
  // Logo punches palette.bg out of accent.lift — same instrument-panel feel
  // as the primary button.
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loginCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  loginLogo: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: accent.lift,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: text.primary,
    letterSpacing: -0.4,
  },
  loginTitleAccent: {
    color: accent.lift,
  },
  loginSubtitle: {
    fontSize: 11,
    color: text.quaternary,
    fontFamily: 'monospace',
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  loginForm: {
    width: '100%',
    gap: spacing.lg,
  },
  loginLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: text.quaternary,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  loginInput: {
    width: '100%',
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    color: text.primary,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
  },
  loginFooter: {
    fontSize: 10,
    color: text.disabled,
    fontFamily: 'monospace',
    letterSpacing: 1.6,
    marginTop: spacing.xl,
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loginError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.30)',
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  loginErrorText: {
    color: accent.regression,
    fontSize: 12,
    flex: 1,
  },
  loginToggle: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  loginToggleText: {
    color: text.tertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  loginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  loginDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.borderStrong,
  },
  loginDividerText: {
    color: text.quaternary,
    fontSize: 11,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  googleButton: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
  },
  googleButtonDisabled: {
    opacity: 0.4,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: text.primary,
    color: palette.bg,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
  },
  googleButtonText: {
    color: text.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

export default loginStyles;
