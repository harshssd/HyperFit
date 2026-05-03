import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * Custom Nutrition tab icon — fork + knife crossed.
 *
 * Lucide's `UtensilsCrossed` reads muddy at 24pt because every line is curved
 * and the blades collide visually. This version is built from straight lines
 * with clean geometric proportions, sized to read correctly at the same
 * 24pt nav slot as the other Lucide icons (Home, Dumbbell, History).
 *
 * Composition: two utensils sharing an origin at (12, 12), each tilted 22°
 * from vertical so the handles fan to the bottom corners and the heads to
 * the top corners. Knife on the left, fork on the right (matches Western
 * place-setting convention — small detail, but it's why it looks "right").
 */
export const ForkKnifeCrossed = ({
  size = 24,
  color = '#000',
  strokeWidth = 2,
}: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Knife — tilted -22° (top-left blade, bottom-right handle) */}
    <G
      transform="rotate(-22 12 12)"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Blade — long isosceles triangle, point at the top */}
      <Path d="M10.5 3 L13.5 3 L12 12 Z" fill={color} />
      {/* Handle — single line from blade base to bottom */}
      <Path d="M12 12 L12 21" />
    </G>

    {/* Fork — tilted +22° (top-right tines, bottom-left handle) */}
    <G
      transform="rotate(22 12 12)"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Three tines — short parallel lines at top */}
      <Path d="M9.5 3 L9.5 7" />
      <Path d="M12 3 L12 7" />
      <Path d="M14.5 3 L14.5 7" />
      {/* Yoke — small horizontal bar where tines meet */}
      <Path d="M9.5 7 L14.5 7" />
      {/* Handle — single line from yoke to bottom */}
      <Path d="M12 7 L12 21" />
    </G>
  </Svg>
);
