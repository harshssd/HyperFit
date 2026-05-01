import React from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import NavBar from '../components/NavBar';
import { NAV_ITEMS } from '../constants/nav';

// nav id <-> route name map. NAV_ITEMS still uses "gym"; the route is "Plans".
const ID_TO_ROUTE: Record<string, string> = {
  home: 'Home',
  gym: 'Plans',
  calendar: 'Calendar',
  history: 'History',
};
const ROUTE_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ID_TO_ROUTE).map(([id, route]) => [route, id])
);

export const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const routeName = state.routes[state.index].name;
  const activeId = ROUTE_TO_ID[routeName];
  if (!activeId && __DEV__) {
    console.warn(`CustomTabBar: unknown route "${routeName}" — add to ROUTE_TO_ID map`);
  }

  return (
    <NavBar
      activeTab={activeId ?? ''}
      items={NAV_ITEMS}
      onChange={id => {
        const target = ID_TO_ROUTE[id];
        if (!target) {
          if (__DEV__) console.warn(`CustomTabBar: unknown nav id "${id}"`);
          return;
        }
        navigation.navigate(target as never);
      }}
    />
  );
};
