import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle, StyleSheet } from 'react-native';
import { palette, radii } from '../styles/theme';

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.surfaceAlt,
    overflow: 'hidden',
  },
});

type SkeletonProps = {
  width?: number | `${number}%` | 'auto';
  height?: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
};

export const Skeleton = ({ width = '100%', height = 12, radius = radii.sm, style }: SkeletonProps) => {
  const pulse = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="loading"
      style={[styles.base, { width, height, borderRadius: radius, opacity: pulse }, style]}
    />
  );
};

export const SkeletonRow = ({ gap = 8, children }: { gap?: number; children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>{children}</View>
);

export const SkeletonStack = ({ gap = 8, children, style }: { gap?: number; children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[{ gap }, style]}>{children}</View>
);
