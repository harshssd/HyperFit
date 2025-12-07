import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import styles from '../styles/appStyles';

type LoadingScreenProps = {
  message?: string;
};

const LoadingScreen = ({ message = 'Loading...' }: LoadingScreenProps) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#22d3ee" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

export default LoadingScreen;

