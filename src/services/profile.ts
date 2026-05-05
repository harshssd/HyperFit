import { supabase } from './supabase';

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

export const setGoal = (goal: Goal) => updateMetadata({ goal });

export const markOnboarded = () =>
  updateMetadata({ onboarded_at: new Date().toISOString() });
