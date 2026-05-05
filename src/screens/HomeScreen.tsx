import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeView from '../components/HomeView';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAppData } from '../contexts/AppDataContext';
import { calculateXP } from '../features/workout/helpers';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const tabIdToRoute: Record<string, keyof MainTabParamList> = {
  home: 'Home',
  gym: 'Plans',
  nutrition: 'Nutrition',
  calendar: 'Calendar',
};

export const HomeScreen = () => {
  const { data } = useAppData();
  const navigation = useNavigation<Nav>();

  // History + Analytics is a modal launched from any insight tile.
  const handleOpenHistory = () => {
    navigation.navigate('History');
  };

  // HomeView owns its own ScrollView; opt out of the layout wrapper so we
  // don't nest scroll surfaces.
  return (
    <ScreenLayout scroll={false} errorLabel="Error in Home">
      <HomeView
        data={data}
        streak={data.gymLogs.length}
        xp={calculateXP(data)}
        onChangeView={view => {
          const route = tabIdToRoute[view];
          if (route) navigation.navigate(route as never);
        }}
        onOpenHistory={handleOpenHistory}
      />
    </ScreenLayout>
  );
};
