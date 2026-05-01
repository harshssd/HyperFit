import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { cardsStyles } from '../styles';
import { accent } from '../styles/theme';

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

const ErrorBanner = ({ message, onRetry }: ErrorBannerProps) => (
  <View style={cardsStyles.errorBanner}>
    <AlertTriangle size={16} color={accent.regression} />
    <Text style={cardsStyles.errorBannerText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} style={cardsStyles.errorBannerRetry}>
        <Text style={cardsStyles.errorBannerRetryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default ErrorBanner;

