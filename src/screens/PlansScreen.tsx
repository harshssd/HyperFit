import React, { useCallback } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GymView } from '../features/workout';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAppData } from '../contexts/AppDataContext';
import { useUser } from '../contexts/UserContext';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PlansRoute = RouteProp<MainTabParamList, 'Plans'>;

export const PlansScreen = () => {
  const { user } = useUser();
  const { data, setData } = useAppData();
  const navigation = useNavigation<Nav>();
  const route = useRoute<PlansRoute>();
  const intent = route.params?.intent;

  // Clear the param so leaving and re-entering the tab won't re-open the
  // library. Stable callback keeps GymView's effect deps clean.
  const consumeIntent = useCallback(() => {
    if (intent !== undefined) {
      navigation.setParams({ intent: undefined } as never);
    }
  }, [intent, navigation]);

  // GymView still owns its own scroll views; opt out of the layout's wrapper.
  return (
    <ScreenLayout scroll={false} errorLabel="Error in Gym">
      <GymView
        data={data}
        updateData={setData}
        user={user}
        mode="planner"
        onOpenSession={() => navigation.navigate('ActiveWorkout')}
        initialAction={intent === 'pick' ? 'open-library-pick' : undefined}
        onConsumeInitialAction={consumeIntent}
      />
    </ScreenLayout>
  );
};
