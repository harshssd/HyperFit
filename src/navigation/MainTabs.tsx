import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
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
    <Tabs.Screen name="Calendar" component={CalendarScreen} />
    <Tabs.Screen name="History" component={HistoryScreen} />
  </Tabs.Navigator>
);
