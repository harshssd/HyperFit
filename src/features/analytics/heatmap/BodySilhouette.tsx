import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Ellipse as SvgEllipse, Rect as SvgRect, Path } from 'react-native-svg';
import {
  BACK_BODY_OUTLINE,
  BACK_REGIONS,
  FRONT_BODY_OUTLINE,
  FRONT_REGIONS,
  MuscleId,
  MuscleRegion,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
} from './muscleRegions';
import { palette } from '../../../styles/theme';

const AnimatedEllipse = Animated.createAnimatedComponent(SvgEllipse);
const AnimatedRect = Animated.createAnimatedComponent(SvgRect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  view: 'front' | 'back';
  /** Map of MuscleId -> intensity in [0, 1]. Missing keys default to 0. */
  intensities: Partial<Record<MuscleId, number>>;
  /** Called when a region is tapped. */
  onPressRegion?: (id: MuscleId) => void;
  /** Pixel width of the rendered SVG (height scales 2x). */
  size?: number;
};

// Heatmap palette — strava-orange for lift signal, per DESIGN.md "honest mirror".
// Hue carries intensity (Light vs Heavy reads at a glance) rather than opacity
// alone. Stroke ramps in lockstep so every active muscle gets a defined rim.
const SILHOUETTE_FILL = '#0a0a0a';                  // matches anthracite bg
const SILHOUETTE_STROKE = palette.textQuaternary;   // body outline (#71717a)
const REGION_BORDER_REST = palette.surfaceAlt;      // untouched region rim
const REGION_BORDER_LIGHT = '#7a2400';              // dark-orange rim at light load
const REGION_BORDER_HEAVY = '#ff6a2b';              // bright primary rim at heavy load
const FILL_UNTOUCHED = palette.surface;             // #18181b — same as legend "None"
const FILL_LIGHT = '#3a1d0a';                       // dim ember (just-trained)
const FILL_MID = '#a13208';                         // mid load — saturated burnt orange
const FILL_HEAVY = palette.liftActive;              // #fc4c02 — full strava orange

/** Renders one region's shapes. Animates both fill color and opacity. */
const Region = ({
  region,
  intensity,
  onPress,
}: {
  region: MuscleRegion;
  intensity: number;
  onPress?: () => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(intensity)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: intensity,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [intensity, fadeAnim]);

  // Fill ramps through 4 stops — untouched grey, dim ember (Light), burnt
  // orange (Mid), bright strava (Heavy). Letting hue carry intensity makes
  // Light vs Heavy distinguishable at a glance, not just "more opaque white".
  const fill = fadeAnim.interpolate({
    inputRange: [0, 0.001, 0.5, 1],
    outputRange: [FILL_UNTOUCHED, FILL_LIGHT, FILL_MID, FILL_HEAVY],
  });
  // Stroke ramps in lockstep so every lit muscle gets a defined rim — without
  // it, the active fills bleed into the silhouette outline.
  const stroke = fadeAnim.interpolate({
    inputRange: [0, 0.001, 1],
    outputRange: [REGION_BORDER_REST, REGION_BORDER_LIGHT, REGION_BORDER_HEAVY],
  });

  return (
    <>
      {region.shapes.map((shape, i) => {
        if (shape.kind === 'ellipse') {
          return (
            <AnimatedEllipse
              key={`${region.id}-${i}`}
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.25}
              onPress={onPress}
            />
          );
        }
        if (shape.kind === 'rect') {
          return (
            <AnimatedRect
              key={`${region.id}-${i}`}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              rx={shape.rx ?? 6}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.25}
              onPress={onPress}
            />
          );
        }
        return (
          <AnimatedPath
            key={`${region.id}-${i}`}
            d={shape.d}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.25}
            onPress={onPress}
          />
        );
      })}
    </>
  );
};

export const BodySilhouette = ({ view, intensities, onPressRegion, size = 180 }: Props) => {
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;
  const outline = view === 'front' ? FRONT_BODY_OUTLINE : BACK_BODY_OUTLINE;
  const height = (size * VIEWBOX_HEIGHT) / VIEWBOX_WIDTH;

  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
      {/* Body outline (head + torso + limbs) — slightly heavier stroke so the
          silhouette frames the heatmap rather than disappearing behind it. */}
      <Path d={outline} fill={SILHOUETTE_FILL} stroke={SILHOUETTE_STROKE} strokeWidth={2} />
      {/* Heatmap regions on top */}
      {regions.map(region => (
        <Region
          key={region.id}
          region={region}
          intensity={intensities[region.id] ?? 0}
          onPress={onPressRegion ? () => onPressRegion(region.id) : undefined}
        />
      ))}
    </Svg>
  );
};
