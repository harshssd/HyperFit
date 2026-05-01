import type { ComponentType } from 'react';
import { Home, Calendar, Dumbbell, History } from 'lucide-react-native';

export type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type NavItemId = 'home' | 'calendar' | 'gym' | 'history';

export type NavItemConfig = {
  id: NavItemId;
  label: string;
  icon: IconType;
};

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'history', label: 'History', icon: History },
];
