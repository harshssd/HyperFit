import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GymView } from '../features/workout';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAppData } from '../contexts/AppDataContext';
import { useUser } from '../contexts/UserContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const PlansScreen = () => {
  const { user } = useUser();
  const { data, setData } = useAppData();
  const navigation = useNavigation<Nav>();

  // GymView still owns its own scroll views; opt out of the layout's wrapper.
  return (
    <ScreenLayout scroll={false} errorLabel="Error in Gym">
      <GymView
        data={data}
        updateData={setData}
        user={user}
        mode="planner"
        onOpenSession={() => navigation.navigate('ActiveWorkout')}
      />
    </ScreenLayout>
  );
};
