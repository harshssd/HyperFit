import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import HistoryAnalyticsView from '../features/history/HistoryAnalyticsView';
import { ScreenLayout } from '../components/ScreenLayout';
import { palette, text, spacing } from '../styles/theme';

// History is now a modal launched from Home insight tiles. The close header
// mirrors the (former) CalendarScreen pattern so all transient surfaces
// share the same dismissal affordance.
export const HistoryScreen = () => {
  const navigation = useNavigation();
  return (
    <ScreenLayout scroll={false} errorLabel="Error in History">
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
          History & Analytics
        </Text>
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
