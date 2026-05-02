import React from 'react';
import { TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { cardsStyles } from '../styles';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  noPadding?: boolean;
  testID?: string;
};

const GlassCard = ({ children, style, onPress, noPadding = false, testID }: GlassCardProps) => (
  <TouchableOpacity
    testID={testID}
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

