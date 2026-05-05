import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../styles/theme';

type Tint = 'orange' | 'green' | 'blue';

const TINTS: Record<Tint, { from: string; to: string }> = {
  // Strava-orange — workout/lift surfaces (Home, Plans).
  // Reduced from 0.20 → 0.14 so body copy on orange surfaces stays legible.
  orange: { from: 'rgba(252, 76, 2, 0.14)', to: 'rgba(252, 76, 2, 0)' },
  // Robinhood-green — nutrition/water surfaces.
  green:  { from: 'rgba(0, 214, 143, 0.18)', to: 'rgba(0, 214, 143, 0)' },
  // Cool steel-blue — schedule/time surfaces (Calendar).
  blue:   { from: 'rgba(96, 165, 250, 0.18)', to: 'rgba(96, 165, 250, 0)' },
};

type Props = {
  tint?: Tint;
};

export const HeroGradient = ({ tint = 'orange' }: Props) => {
  const { from, to } = TINTS[tint];
  return (
    <>
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={['transparent', palette.surface]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </>
  );
};

export default HeroGradient;
