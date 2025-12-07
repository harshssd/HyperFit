import type { ComponentType } from 'react';
import { Home, Swords, Dumbbell, BarChart2, Footprints } from 'lucide-react-native';

export type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type NavItemId = 'home' | 'challenges' | 'gym' | 'stats' | 'steps';

export type NavItemConfig = {
  id: NavItemId;
  label: string;
  icon: IconType;
};

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'challenges', label: 'Challenges', icon: Swords },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'steps', label: 'Steps', icon: Footprints },
];

