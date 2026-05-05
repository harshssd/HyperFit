import React from 'react';
import Svg, { Ellipse as SvgEllipse, Rect as SvgRect, Path } from 'react-native-svg';
import {
  BACK_BODY_OUTLINE,
  BACK_REGIONS,
  FRONT_BODY_OUTLINE,
  FRONT_REGIONS,
  MuscleId,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
} from './muscleRegions';
import { HEATMAP_FILL } from './BodySilhouette';

type Props = {
  view?: 'front' | 'back';
  intensities: Partial<Record<MuscleId, number>>;
  /** Pixel width — height scales with the body viewBox. */
  size?: number;
  /**
   * 'default' = filled dark anthracite body (Home, share cards).
   * 'ghost'   = transparent body, only the colored muscle regions show
   *             (calendar grid — keeps day numbers grid-aligned).
   */
  tone?: 'default' | 'ghost';
};

const SILHOUETTE_FILL = '#0a0a0a';

/**
 * Static (non-animated) micro-silhouette for calendar grids. Skips the
 * Animated.Value pipeline that BodySilhouette uses — at 42 grid cells × 18
 * regions per cell, animating each region pegs the JS thread on month
 * scroll. The visual ramp matches the full silhouette so the mini and
 * full versions read consistently.
 *
 * Thresholds align with BodySilhouette's interpolation stops
 * `[0, 0.001, 0.5, 1] → [none, light, mid, heavy]`: anything above 0 is at
 * least light, the visual midpoint sits at 0.5, and heavy is reserved for
 * the per-day peak muscle (which on per-day-normalized intensities is
 * always exactly 1.0).
 */
const intensityToFill = (n: number): string => {
  if (n <= 0) return HEATMAP_FILL.none;
  if (n < 0.5) return HEATMAP_FILL.light;
  if (n < 1) return HEATMAP_FILL.mid;
  return HEATMAP_FILL.heavy;
};

export const MiniSilhouette = ({
  view = 'front',
  intensities,
  size = 28,
  tone = 'default',
}: Props) => {
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;
  const outline = view === 'front' ? FRONT_BODY_OUTLINE : BACK_BODY_OUTLINE;
  const height = (size * VIEWBOX_HEIGHT) / VIEWBOX_WIDTH;
  const outlineFill = tone === 'ghost' ? 'transparent' : SILHOUETTE_FILL;

  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
      <Path d={outline} fill={outlineFill} />
      {regions.map(region => {
        const fill = intensityToFill(intensities[region.id] ?? 0);
        return region.shapes.map((shape, i) => {
          const key = `${region.id}-${i}`;
          if (shape.kind === 'ellipse') {
            return (
              <SvgEllipse
                key={key}
                cx={shape.cx}
                cy={shape.cy}
                rx={shape.rx}
                ry={shape.ry}
                fill={fill}
              />
            );
          }
          if (shape.kind === 'rect') {
            return (
              <SvgRect
                key={key}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                rx={shape.rx ?? 6}
                fill={fill}
              />
            );
          }
          return <Path key={key} d={shape.d} fill={fill} />;
        });
      })}
    </Svg>
  );
};

export default MiniSilhouette;
