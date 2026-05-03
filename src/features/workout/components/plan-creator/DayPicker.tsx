import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { spacing } from '../../../../styles/theme';
import type { DayOfWeek } from '../../../../types/workout';
import { dayChipStyle, dayChipActiveStyle, dayChipTextStyle, dayChipTextActiveStyle } from './styles';

const DAYS: { key: DayOfWeek; short: string }[] = [
  { key: 'monday',    short: 'M'  },
  { key: 'tuesday',   short: 'T'  },
  { key: 'wednesday', short: 'W'  },
  { key: 'thursday',  short: 'Th' },
  { key: 'friday',    short: 'F'  },
  { key: 'saturday',  short: 'Sa' },
  { key: 'sunday',    short: 'Su' },
];

type DayPickerProps = {
  selected: DayOfWeek[];
  onToggle: (day: DayOfWeek) => void;
  /** Optional testID prefix; appended with `-${day}`. */
  testIDPrefix?: string;
};

/**
 * Mon→Sun chip row used by the SlimPlanCreator session editor. Tap a chip
 * to toggle that day for the session being edited.
 */
const DayPicker = ({ selected, onToggle, testIDPrefix = 'plan-creator-day' }: DayPickerProps) => (
  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
    {DAYS.map((d) => {
      const on = selected.includes(d.key);
      return (
        <TouchableOpacity
          key={d.key}
          testID={`${testIDPrefix}-${d.key}`}
          onPress={() => onToggle(d.key)}
          style={[dayChipStyle, on && dayChipActiveStyle]}
          accessibilityLabel={`Toggle ${d.key}`}
        >
          <Text style={[dayChipTextStyle, on && dayChipTextActiveStyle]}>{d.short}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default DayPicker;
