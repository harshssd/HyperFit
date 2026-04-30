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

const SILHOUETTE_FILL = '#0f172a'; // matches background — body reads as a dark canvas
const SILHOUETTE_STROKE = colors.borderStrong;
const COLD = colors.cyan; // light intensity = cyan (cool)
const HOT = colors.primary; // heavy intensity = orange (warm)
const UNTOUCHED = colors.surface;

/**
 * Lerp two hex colors at a given t (0 .. 1).
 * Returns rgba(...) so SVG fill plus opacity can be applied via Animated.
 */
const lerpColor = (a: string, b: string, t: number): string => {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
};

const intensityToColor = (i: number): string => {
  if (i <= 0) return UNTOUCHED;
  if (i <= 0.5) return lerpColor(UNTOUCHED, COLD, i / 0.5);
  return lerpColor(COLD, HOT, (i - 0.5) / 0.5);
};

/** Renders one region's shapes. Animates fill via opacity crossfade. */
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

  const fill = intensityToColor(intensity);
  const opacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
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
