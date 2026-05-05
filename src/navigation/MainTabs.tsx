import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CustomTabBar } from './CustomTabBar';
import type { MainTabParamList } from './types';

const Tabs = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => (
  <Tabs.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={props => <CustomTabBar {...props} />}
  >
    <Tabs.Screen name="Home" component={HomeScreen} />
    <Tabs.Screen name="Plans" component={PlansScreen} />
    <Tabs.Screen name="Nutrition" component={NutritionScreen} />
    <Tabs.Screen name="Calendar" component={CalendarScreen} />
  </Tabs.Navigator>
);
