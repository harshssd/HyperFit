import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ViewStyle,
  StyleProp,
  AccessibilityProps,
} from 'react-native';
import { buttonStyles } from '../styles';

type NeonButtonProps = AccessibilityProps & {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const NeonButton = ({
  children,
  onPress,
  variant = 'primary',
  style,
  disabled,
  ...a11y
}: NeonButtonProps) => {
  const baseStyle = [buttonStyles.neonButton, buttonStyles.neonButtonBase];
  const variants: Record<string, any> = {
    primary: buttonStyles.neonButtonPrimary,
    secondary: buttonStyles.neonButtonSecondary,
    danger: buttonStyles.neonButtonDanger,
    ghost: buttonStyles.neonButtonGhost,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[baseStyle, variants[variant], disabled && buttonStyles.neonButtonDisabled, style]}
      activeOpacity={0.8}
      accessibilityRole="button"
      {...a11y}
    >
      <View style={buttonStyles.neonButtonContent}>
        {typeof children === 'string' ? (
          <Text style={[buttonStyles.neonButtonText, variant === 'primary' && buttonStyles.neonButtonTextPrimary]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </TouchableOpacity>
  );
};

export default NeonButton;

