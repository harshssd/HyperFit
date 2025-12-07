import React from 'react';
import { TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import styles from '../styles/appStyles';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  noPadding?: boolean;
};

const GlassCard = ({ children, style, onPress, noPadding = false }: GlassCardProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[
      styles.glassCard,
      noPadding && styles.glassCardNoPadding,
      onPress && styles.glassCardPressable,
      style,
    ]}
  >
    {children}
  </TouchableOpacity>
);

export default GlassCard;

