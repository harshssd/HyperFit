import React from 'react';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CustomTabBar } from './CustomTabBar';
import { SwipeableScreen } from './SwipeableScreen';
import type { MainTabParamList } from './types';

const Tabs = createBottomTabNavigator<MainTabParamList>();

// Module-scope wrappers so the children function passed to <Tabs.Screen>
// is stable across re-renders (no fresh closure per MainTabs render).
const HomeWithSwipe = () => (
  <SwipeableScreen tab="Home"><HomeScreen /></SwipeableScreen>
);
const PlansWithSwipe = () => (
  <SwipeableScreen tab="Plans"><PlansScreen /></SwipeableScreen>
);
const NutritionWithSwipe = () => (
  <SwipeableScreen tab="Nutrition"><NutritionScreen /></SwipeableScreen>
);
const CalendarWithSwipe = () => (
  <SwipeableScreen tab="Calendar"><CalendarScreen /></SwipeableScreen>
);

const renderTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

// Each tab is wrapped in SwipeableScreen so users can swipe between tabs.
// Right swipe = next tab in order (Home → Plans → Nutrition → Calendar).
// Left swipe = previous. The gesture requires ≥18px horizontal travel and
// bails on vertical motion, so vertical scrolls and short horizontal
// scrollables (week strip, macro pills) win when they're scrollable.
export const MainTabs = () => (
  <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
    <Tabs.Screen name="Home" component={HomeWithSwipe} />
    <Tabs.Screen name="Plans" component={PlansWithSwipe} />
    <Tabs.Screen name="Nutrition" component={NutritionWithSwipe} />
    <Tabs.Screen name="Calendar" component={CalendarWithSwipe} />
  </Tabs.Navigator>
);
