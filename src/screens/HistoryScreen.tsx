import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import HistoryAnalyticsView from '../features/history/HistoryAnalyticsView';
import { ScreenLayout } from '../components/ScreenLayout';
import { palette, text, spacing } from '../styles/theme';

// History is a modal launched from Home insight tiles. The close affordance
// mirrors the (former) CalendarScreen pattern so all transient surfaces
// share the same dismissal pattern. The internal History/Analytics segment
// toggle inside HistoryAnalyticsView already labels the surface — no extra
// page-level title needed.
export const HistoryScreen = () => {
  const navigation = useNavigation();
  return (
    <ScreenLayout scroll={false} errorLabel="Error in History">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: palette.bg,
        }}
      >
        <TouchableOpacity
          testID="history-close"
          accessibilityRole="button"
          accessibilityLabel="Close history"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={20} color={text.secondary} />
        </TouchableOpacity>
      </View>
      <HistoryAnalyticsView />
    </ScreenLayout>
  );
};
