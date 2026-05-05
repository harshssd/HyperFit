import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import HistoryAnalyticsView from '../features/history/HistoryAnalyticsView';
import { palette, accent, text, spacing, radii, fonts } from '../styles/theme';

export const HistoryScreen = () => {
  const navigation = useNavigation();
  const handleClose = () => navigation.goBack();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: palette.bg }}
    >
      <View style={{ height: 2, backgroundColor: accent.lift }} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: Platform.OS === 'ios' ? spacing.sm : spacing.md,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: palette.borderStrong,
          backgroundColor: palette.bg,
        }}
      >
        <TouchableOpacity
          testID="history-close"
          accessibilityRole="button"
          accessibilityLabel="Dismiss history"
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: radii.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.borderStrong,
          }}
        >
          <ChevronDown size={18} color={text.secondary} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              color: text.primary,
              fontFamily: fonts.family.black,
              fontSize: 13,
              letterSpacing: 1.8,
            }}
          >
            HISTORY
          </Text>
          <Text
            style={{
              color: text.quaternary,
              fontSize: 10,
              fontFamily: fonts.family.mono,
              fontWeight: fonts.weight.bold as '700',
              letterSpacing: 1.2,
              marginTop: 2,
              textTransform: 'uppercase',
            }}
          >
            Sessions · Analytics
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <View style={{ flex: 1 }}>
        <HistoryAnalyticsView />
      </View>
    </SafeAreaView>
  );
};
