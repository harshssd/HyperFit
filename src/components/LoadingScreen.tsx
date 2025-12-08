import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { layoutStyles } from '../styles';

type LoadingScreenProps = {
  message?: string;
};

const LoadingScreen = ({ message = 'Loading...' }: LoadingScreenProps) => {
  return (
    <View style={layoutStyles.loadingContainer}>
      <ActivityIndicator size="large" color="#22d3ee" />
      <Text style={layoutStyles.loadingText}>{message}</Text>
    </View>
  );
};

export default LoadingScreen;

