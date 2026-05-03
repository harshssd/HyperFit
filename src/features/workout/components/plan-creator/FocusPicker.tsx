import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { spacing } from '../../../../styles/theme';
import type { SessionFocus } from '../../../../types/workout';
import { chipStyle, chipActiveStyle, chipTextStyle, chipTextActiveStyle } from './styles';

const FOCUS_OPTIONS: { key: SessionFocus; label: string }[] = [
  { key: 'push',         label: 'PUSH' },
  { key: 'pull',         label: 'PULL' },
  { key: 'legs',         label: 'LEGS' },
  { key: 'upper',        label: 'UPPER' },
  { key: 'lower',        label: 'LOWER' },
  { key: 'full-body',    label: 'FULL' },
  { key: 'conditioning', label: 'COND' },
  { key: 'other',        label: 'OTHER' },
];

type FocusPickerProps = {
  selected: SessionFocus;
  onChange: (focus: SessionFocus) => void;
};

/**
 * Single-select chip row for a session's primary focus (push/pull/legs/etc).
 */
const FocusPicker = ({ selected, onChange }: FocusPickerProps) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
    {FOCUS_OPTIONS.map((f) => (
      <TouchableOpacity
        key={f.key}
        onPress={() => onChange(f.key)}
        style={[chipStyle, selected === f.key && chipActiveStyle]}
      >
        <Text style={[chipTextStyle, selected === f.key && chipTextActiveStyle]}>
          {f.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default FocusPicker;
