import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import styles from '../styles/appStyles';

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

const ErrorBanner = ({ message, onRetry }: ErrorBannerProps) => (
  <View style={styles.errorBanner}>
    <AlertTriangle size={16} color="#f97316" />
    <Text style={styles.errorBannerText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} style={styles.errorBannerRetry}>
        <Text style={styles.errorBannerRetryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default ErrorBanner;

