import { StyleSheet } from 'react-native';
import { colors, spacing, radii } from './theme';

const loginStyles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loginCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
  },
  loginTitleAccent: {
    color: colors.primary,
  },
  loginSubtitle: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'monospace',
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  loginForm: {
    width: '100%',
    gap: spacing.lg,
  },
  loginLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  loginInput: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#1e293b',
    color: '#fff',
    fontFamily: 'monospace',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  loginButton: {
    width: '100%',
  },
  loginFooter: {
    fontSize: 10,
    color: '#475569',
    fontFamily: 'monospace',
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
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  loginErrorText: {
    color: '#f87171',
    fontSize: 12,
    flex: 1,
  },
  loginToggle: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  loginToggleText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  loginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: spacing.md,
  },
  loginDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  loginDividerText: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleButton: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  googleButtonDisabled: {
    opacity: 0.5,
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
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default loginStyles;


