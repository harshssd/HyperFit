import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import HomeView from '../components/HomeView';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAppData } from '../contexts/AppDataContext';
import { calculateXP } from '../features/workout/helpers';
import type { MainTabParamList } from '../navigation/types';

type Nav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const tabIdToRoute: Record<string, keyof MainTabParamList> = {
  home: 'Home',
  gym: 'Plans',
  calendar: 'Calendar',
  history: 'History',
  stats: 'History',
};

export const HomeScreen = () => {
  const { data } = useAppData();
  const navigation = useNavigation<Nav>();

  return (
    <ScreenLayout errorLabel="Error in Home">
      <HomeView
        data={data}
        streak={data.gymLogs.length}
        xp={calculateXP(data)}
        onChangeView={view => {
          const route = tabIdToRoute[view];
          if (route) navigation.navigate(route);
        }}
      />
    </ScreenLayout>
  );
};
