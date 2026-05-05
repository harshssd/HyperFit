import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../styles/theme';

const ORANGE_WASH_FROM = 'rgba(252, 76, 2, 0.20)';
const ORANGE_WASH_TO = 'rgba(252, 76, 2, 0)';

export const HeroGradient = () => (
  <>
    <LinearGradient
      colors={[ORANGE_WASH_FROM, ORANGE_WASH_TO]}
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

export default HeroGradient;
