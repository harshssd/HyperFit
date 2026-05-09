import React from 'react';
import { View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';

type TabName = keyof MainTabParamList;

// Left → right tab order. Right swipe = next tab in this list, left swipe = prev.
const TAB_ORDER: TabName[] = ['Home', 'Plans', 'Nutrition', 'Calendar'];

const SWIPE_TRIGGER_DISTANCE = 60;
const SWIPE_TRIGGER_VELOCITY = 500;

type Nav = BottomTabNavigationProp<MainTabParamList>;

export const SwipeableScreen = ({ tab, children }: { tab: TabName; children: React.ReactNode }) => {
  const navigation = useNavigation<Nav>();
  const currentIdx = TAB_ORDER.indexOf(tab);

  const goToTab = (next: TabName) => {
    // Cast keeps the navigator happy even though Plans/Nutrition accept
    // an intent param — we never pass one for swipe nav, so undefined is fine.
    navigation.navigate(next as never);
  };

  // activeOffsetX requires ≥18px horizontal travel before the gesture claims —
  // lets vertical scrolls and short horizontal scrollables (week strip, macro
  // pills) win when they're scrollable. failOffsetY bails the gesture entirely
  // once the user moves more than 18px vertically (clearly a scroll).
  const swipe = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-18, 18])
    .onEnd(evt => {
      const distanceTriggered = Math.abs(evt.translationX) > SWIPE_TRIGGER_DISTANCE;
      const velocityTriggered = Math.abs(evt.velocityX) > SWIPE_TRIGGER_VELOCITY;
      if (!distanceTriggered && !velocityTriggered) return;
      if (evt.translationX < 0 && currentIdx < TAB_ORDER.length - 1) {
        goToTab(TAB_ORDER[currentIdx + 1]);
      } else if (evt.translationX > 0 && currentIdx > 0) {
        goToTab(TAB_ORDER[currentIdx - 1]);
      }
    });

  return (
    <GestureDetector gesture={swipe}>
      <View style={{ flex: 1 }}>{children}</View>
    </GestureDetector>
  );
};
