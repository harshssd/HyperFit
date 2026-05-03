import React from 'react';
import { Apple } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { EmptyState } from '../components/StateView';
import { accent } from '../styles/theme';

export const NutritionScreen = () => (
  <ScreenLayout errorLabel="Error in Nutrition">
    <EmptyState
      testID="nutrition-coming-soon"
      icon={<Apple size={40} color={accent.lift} strokeWidth={1.6} />}
      title="Fuel — coming soon"
      message="Macros, food log, and weigh-ins land here next. Lifting + eating in one mirror."
    />
  </ScreenLayout>
);
