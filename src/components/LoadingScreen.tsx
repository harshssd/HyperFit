import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { layoutStyles } from '../styles';
import { accent } from '../styles/theme';

type LoadingScreenProps = {
  message?: string;
};

const LoadingScreen = ({ message = 'Loading...' }: LoadingScreenProps) => {
  return (
    <View style={layoutStyles.loadingContainer}>
      <ActivityIndicator size="large" color={accent.lift} />
      <Text style={layoutStyles.loadingText}>{message}</Text>
    </View>
  );
};

export default LoadingScreen;

