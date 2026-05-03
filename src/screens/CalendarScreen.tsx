import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import CalendarView from '../features/calendar/CalendarView';
import { ScreenLayout } from '../components/ScreenLayout';
import { palette, text, spacing } from '../styles/theme';

export const CalendarScreen = () => {
  const navigation = useNavigation();
  return (
    <ScreenLayout scroll={false} errorLabel="Error in Calendar">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: palette.bg,
        }}
      >
        <Text
          style={{
            color: text.quaternary,
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 1.6,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
          }}
        >
          Full Schedule
        </Text>
        <TouchableOpacity
          testID="calendar-close"
          accessibilityRole="button"
          accessibilityLabel="Close schedule"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={20} color={text.secondary} />
        </TouchableOpacity>
      </View>
      <CalendarView />
    </ScreenLayout>
  );
};
