import { supabase } from './supabase';
import { upsertSettings } from './nutritionService';

export type Units = 'lb' | 'kg';
export type Goal = 'build' | 'cut' | 'maintain' | 'track';

export type Profile = {
  display_name?: string;
  units?: Units;
  goal?: Goal;
  onboarded_at?: string;
};

const updateMetadata = async (patch: Profile) => {
  const { error } = await supabase.auth.updateUser({ data: patch });
  if (error) throw error;
};

export const setDisplayName = (name: string) =>
  updateMetadata({ display_name: name.trim() });

export const setUnits = (units: Units) => updateMetadata({ units });

/**
 * Couples the weight unit (lb/kg) with the water unit (oz/ml) so the user
 * picks one mental model — "imperial" (lb + oz) or "metric" (kg + ml) — in
 * a single toggle. The nutrition GoalSetupSheet still exposes an
 * independent water-unit override for users who want to mix.
 */
export const setUnitsCoupled = async (units: Units, userId: string) => {
  await updateMetadata({ units });
  await upsertSettings(userId, { water_unit: units === 'lb' ? 'oz' : 'ml' });
};

export const setGoal = (goal: Goal) => updateMetadata({ goal });

export const markOnboarded = () =>
  updateMetadata({ onboarded_at: new Date().toISOString() });
