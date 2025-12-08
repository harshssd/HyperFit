import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { cardsStyles } from '../styles';

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

const ErrorBanner = ({ message, onRetry }: ErrorBannerProps) => (
  <View style={cardsStyles.errorBanner}>
    <AlertTriangle size={16} color="#f97316" />
    <Text style={cardsStyles.errorBannerText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} style={cardsStyles.errorBannerRetry}>
        <Text style={cardsStyles.errorBannerRetryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default ErrorBanner;

