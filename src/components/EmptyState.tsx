import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles';

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: React.ReactNode;
};

const EmptyState = ({ title, message, icon }: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      {icon}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.subtitle}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default EmptyState;


