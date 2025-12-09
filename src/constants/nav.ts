import type { ComponentType } from 'react';
import { Home, Swords, Dumbbell, BarChart2, History } from 'lucide-react-native';

export type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type NavItemId = 'home' | 'challenges' | 'gym' | 'stats' | 'history';

export type NavItemConfig = {
  id: NavItemId;
  label: string;
  icon: IconType;
};

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'challenges', label: 'Challenges', icon: Swords },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'history', label: 'History', icon: History },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
];
