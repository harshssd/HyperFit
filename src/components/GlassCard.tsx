import React from 'react';
import { TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { cardsStyles } from '../styles';

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
      cardsStyles.glassCard,
      noPadding && cardsStyles.glassCardNoPadding,
      style,
    ]}
  >
    {children}
  </TouchableOpacity>
);

export default GlassCard;

