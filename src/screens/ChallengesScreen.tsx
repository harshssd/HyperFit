import React from 'react';
import ChallengesViewComponent from '../components/ChallengesView';
import { ScreenLayout } from '../components/ScreenLayout';

export const ChallengesScreen = () => (
  <ScreenLayout errorLabel="Error in Challenges">
    <ChallengesViewComponent />
  </ScreenLayout>
);
