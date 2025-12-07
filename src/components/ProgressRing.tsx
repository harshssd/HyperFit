import React from 'react';
import { View, Text } from 'react-native';

type ProgressRingProps = {
  radius: number;
  stroke: number;
  progress: number;
  color?: string;
};

const ProgressRing = ({ radius, stroke, progress, color = '#22d3ee' }: ProgressRingProps) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View
      style={{
        width: radius * 2,
        height: radius * 2,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: color, fontSize: 24, fontWeight: 'bold' }}>
        {Math.round(progress)}%
      </Text>
    </View>
  );
};

export default ProgressRing;

