import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ScreenLayout } from '../components/ScreenLayout';
import { NutritionView } from '../features/nutrition/NutritionView';
import type { MainTabParamList } from '../navigation/types';

type Nav = BottomTabNavigationProp<MainTabParamList, 'Nutrition'>;
type Route = RouteProp<MainTabParamList, 'Nutrition'>;

// NutritionView owns its own ScrollView; opt out of the layout wrapper so
// we don't nest scroll surfaces (matches Plans, History, Home).
//
// Route intent is a one-shot — we read it on focus, pass to NutritionView
// as `openAddMealOnMount`, and immediately clear the param so a tab revisit
// doesn't re-fire the modal. Same pattern as Plans → 'pick' / 'manual'.
export const NutritionScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [openAddMeal, setOpenAddMeal] = useState(false);
  // Stable identity so NutritionView's effect doesn't re-fire on every
  // render of this screen (the effect dep list includes this callback).
  const handleAddMealConsumed = useCallback(() => setOpenAddMeal(false), []);

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.intent === 'add-meal') {
        setOpenAddMeal(true);
        navigation.setParams({ intent: undefined } as never);
      }
    }, [route.params?.intent, navigation]),
  );

  return (
    <ScreenLayout scroll={false} errorLabel="Error in Nutrition">
      <NutritionView
        openAddMealOnMount={openAddMeal}
        onAddMealConsumed={handleAddMealConsumed}
      />
    </ScreenLayout>
  );
};
