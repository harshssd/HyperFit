import React from 'react';
import { ScreenLayout } from '../components/ScreenLayout';
import { NutritionView } from '../features/nutrition/NutritionView';

// NutritionView owns its own ScrollView; opt out of the layout wrapper so
// we don't nest scroll surfaces (matches Plans, History, Home).
export const NutritionScreen = () => (
  <ScreenLayout scroll={false} errorLabel="Error in Nutrition">
    <NutritionView />
  </ScreenLayout>
);
