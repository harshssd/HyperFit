import type { ComponentType } from 'react';
import { Home, Dumbbell, Calendar, Salad } from 'lucide-react-native';

export type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type NavItemId = 'home' | 'gym' | 'nutrition' | 'calendar';

export type NavItemConfig = {
  id: NavItemId;
  label: string;
  icon: IconType;
};

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'nutrition', label: 'Fuel', icon: Salad },
  { id: 'calendar', label: 'Plan', icon: Calendar },
];
