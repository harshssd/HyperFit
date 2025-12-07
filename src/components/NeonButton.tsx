import React from 'react';
import { TouchableOpacity, View, Text, ViewStyle, StyleProp } from 'react-native';
import styles from '../styles/appStyles';

type NeonButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const NeonButton = ({ children, onPress, variant = 'primary', style, disabled }: NeonButtonProps) => {
  const baseStyle = [styles.neonButton, styles.neonButtonBase];
  const variants: Record<string, any> = {
    primary: styles.neonButtonPrimary,
    secondary: styles.neonButtonSecondary,
    danger: styles.neonButtonDanger,
    ghost: styles.neonButtonGhost,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[baseStyle, variants[variant], disabled && styles.neonButtonDisabled, style]}
      activeOpacity={0.8}
    >
      <View style={styles.neonButtonContent}>
        {typeof children === 'string' ? (
          <Text style={[styles.neonButtonText, variant === 'primary' && styles.neonButtonTextPrimary]}>
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

