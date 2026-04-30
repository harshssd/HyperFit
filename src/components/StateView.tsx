import React, { ReactNode } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { colors, spacing, radii } from '../styles/theme';

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 320,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: '#0f172a',
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}>
    <ActivityIndicator color={colors.primary} />
    <Text style={styles.message}>{label}</Text>
  </View>
);

export const EmptyState = ({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: { label: string; onPress: () => void };
}) => (
  <View style={styles.container}>
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
    <AlertTriangle size={28} color={colors.danger} />
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.message}>{message ?? 'We couldn’t load this. Please try again.'}</Text>
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
