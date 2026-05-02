import React, { ReactNode } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { palette, text, accent, fonts, spacing, radii } from '../styles/theme';

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    color: text.primary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: -0.2,
  },
  message: {
    color: text.tertiary,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  loadingLabel: {
    color: text.quaternary,
    fontFamily: 'monospace',
    fontVariant: fonts.tabularNums,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: accent.lift,
  },
  retryText: {
    color: palette.bg,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontSize: 13,
  },
});

export const LoadingState = ({ label = 'Loading' }: { label?: string }) => (
  <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}>
    <ActivityIndicator color={accent.lift} />
    <Text style={styles.loadingLabel}>{label.toUpperCase()}</Text>
  </View>
);

export const EmptyState = ({
  title,
  message,
  icon,
  action,
  testID,
}: {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: { label: string; onPress: () => void };
  testID?: string;
}) => (
  <View testID={testID} style={styles.container}>
    {icon}
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {action ? (
      <TouchableOpacity
        style={styles.retryButton}
        onPress={action.onPress}
        accessibilityRole="button"
        accessibilityLabel={action.label}
      >
        <Text style={styles.retryText}>{action.label}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export const ErrorState = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <View style={styles.container}>
    <AlertTriangle size={28} color={accent.regression} />
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.message}>{message ?? "We couldn't load this. Please try again."}</Text>
    {onRetry ? (
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry"
      >
        <Text style={styles.retryText}>RETRY</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);
