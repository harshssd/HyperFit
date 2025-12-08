import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { numberControlStyles } from '../styles';

type NumberControlProps = {
  value: string | number;
  onChange: (value: string | number) => void;
  step?: number;
  label?: string;
  placeholder?: string;
};

const NumberControl = ({ value, onChange, step = 1, label, placeholder }: NumberControlProps) => {
  const safeValue = value === '' ? 0 : parseInt(String(value), 10);

  return (
    <View style={numberControlStyles.numberControl}>
      {label ? <Text style={numberControlStyles.numberControlLabel}>{label}</Text> : null}
      <View style={numberControlStyles.numberControlContainer}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(0, safeValue - step) === 0 ? '' : Math.max(0, safeValue - step))}
          style={numberControlStyles.numberControlButton}
        >
          <Minus size={16} color="#94a3b8" />
        </TouchableOpacity>
        <TextInput
          style={numberControlStyles.numberControlInput}
          value={String(value)}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          onChangeText={(text) => onChange(text)}
        />
        <TouchableOpacity
          onPress={() => onChange(safeValue + step)}
          style={numberControlStyles.numberControlButton}
        >
          <Plus size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NumberControl;

