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
import { colors } from '../../../styles/theme';

const AnimatedEllipse = Animated.createAnimatedComponent(SvgEllipse);
const AnimatedRect = Animated.createAnimatedComponent(SvgRect);

type Props = {
  view: 'front' | 'back';
  /** Map of MuscleId -> intensity in [0, 1]. Missing keys default to 0. */
  intensities: Partial<Record<MuscleId, number>>;
  /** Called when a region is tapped. */
  onPressRegion?: (id: MuscleId) => void;
  /** Pixel width of the rendered SVG (height scales 2x). */
  size?: number;
};

// Monochrome heatmap — single hue (white) ramping in opacity. The heatmap
// communicates *cadence* (where you trained) rather than decorative intensity.
// See DESIGN.md "honest mirror" direction.
const SILHOUETTE_FILL = '#0a0a0a'; // matches anthracite background
const SILHOUETTE_STROKE = colors.borderStrong;
const COLD = '#ffffff'; // light intensity = same hue, lower opacity
const HOT = '#ffffff';  // heavy intensity = same hue, higher opacity (via fillOpacity below)
const UNTOUCHED = colors.surface;

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

  // Untouched regions stay surface-grey; trained regions fade in white as a
  // function of intensity. Single hue keeps the heatmap honest — "you trained"
  // is signalled by opacity, not by warm/cool color theatre.
  const fill = fadeAnim.interpolate({
    inputRange: [0, 0.001, 1],
    outputRange: [UNTOUCHED, COLD, HOT],
  });
  // Fill opacity encodes intensity: 0 = full untouched grey, 0.001 = barely
  // visible white, 1 = full white. The Animated.timing duration handles the
  // smooth fade-in.
  const opacity = fadeAnim.interpolate({
    inputRange: [0, 0.001, 1],
    outputRange: [1, 0.18, 1],
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
              fillOpacity={opacity}
              stroke={SILHOUETTE_STROKE}
              strokeWidth={1}
              onPress={onPress}
            />
          );
        }
        return (
          <AnimatedRect
            key={`${region.id}-${i}`}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rx={shape.rx ?? 6}
            fill={fill}
            fillOpacity={opacity}
            stroke={SILHOUETTE_STROKE}
            strokeWidth={1}
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
      {/* Body outline (head + torso + limbs) */}
      <Path d={outline} fill={SILHOUETTE_FILL} stroke={SILHOUETTE_STROKE} strokeWidth={1.5} />
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
