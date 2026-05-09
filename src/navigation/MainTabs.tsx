import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CustomTabBar } from './CustomTabBar';
import { SwipeableScreen } from './SwipeableScreen';
import type { MainTabParamList } from './types';

const Tabs = createBottomTabNavigator<MainTabParamList>();

// Each tab is wrapped in SwipeableScreen so users can swipe between tabs.
// Right swipe = next tab in order (Home → Plans → Nutrition → Calendar).
// Left swipe = previous. The gesture requires ≥18px horizontal travel and
// bails on vertical motion, so vertical scrolls and short horizontal
// scrollables (week strip, macro pills) win when they're scrollable.
export const MainTabs = () => (
  <Tabs.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={props => <CustomTabBar {...props} />}
  >
    <Tabs.Screen name="Home">
      {() => <SwipeableScreen tab="Home"><HomeScreen /></SwipeableScreen>}
    </Tabs.Screen>
    <Tabs.Screen name="Plans">
      {() => <SwipeableScreen tab="Plans"><PlansScreen /></SwipeableScreen>}
    </Tabs.Screen>
    <Tabs.Screen name="Nutrition">
      {() => <SwipeableScreen tab="Nutrition"><NutritionScreen /></SwipeableScreen>}
    </Tabs.Screen>
    <Tabs.Screen name="Calendar">
      {() => <SwipeableScreen tab="Calendar"><CalendarScreen /></SwipeableScreen>}
    </Tabs.Screen>
  </Tabs.Navigator>
);
