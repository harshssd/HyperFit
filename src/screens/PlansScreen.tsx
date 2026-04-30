import React from 'react';
import { GymView } from '../features/workout';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAppData } from '../contexts/AppDataContext';
import { useUser } from '../contexts/UserContext';

export const PlansScreen = () => {
  const { user } = useUser();
  const { data, setData } = useAppData();

  // GymView still owns its own scroll views; opt out of the layout's wrapper.
  return (
    <ScreenLayout scroll={false} errorLabel="Error in Gym">
      <GymView data={data} updateData={setData} user={user} />
    </ScreenLayout>
  );
};
