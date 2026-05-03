import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { fonts, spacing } from '../../../../styles/theme';
import { labelStyle, inputStyle } from './styles';

type NumFieldProps = {
  label: string;
  value: number;
  onChange: (n: number) => void;
};

/**
 * Compact numeric input with a small uppercase label above it. Used in the
 * exercise row (sets / min reps / max reps / rest seconds).
 */
const NumField = ({ label, value, onChange }: NumFieldProps) => (
  <View style={{ flex: 1 }}>
    <Text style={[labelStyle, { fontSize: 9, marginBottom: 2 }]}>{label}</Text>
    <TextInput
      value={String(value)}
      onChangeText={(v) => {
        const n = parseInt(v, 10);
        onChange(Number.isFinite(n) && n >= 0 ? n : 0);
      }}
      keyboardType="number-pad"
      style={[inputStyle, {
        fontVariant: fonts.tabularNums,
        textAlign: 'center',
        marginBottom: 0,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.xs,
      }]}
    />
  </View>
);

export default NumField;
