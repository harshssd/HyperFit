import type { ComponentType } from 'react';
import { Home, Dumbbell, History, Apple } from 'lucide-react-native';

export type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type NavItemId = 'home' | 'gym' | 'nutrition' | 'history';

export type NavItemConfig = {
  id: NavItemId;
  label: string;
  icon: IconType;
};

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'nutrition', label: 'Fuel', icon: Apple },
  { id: 'history', label: 'History', icon: History },
];
