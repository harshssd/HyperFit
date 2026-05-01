/**
 * Muscle group regions for the heatmap body silhouettes.
 *
 * Each region is one or more SVG path/shape definitions. The viewbox is 200×400
 * for both front and back views (1:2 aspect, head at top).
 *
 * Regions are keyed by MuscleGroup so the heatmap can map workout_log rows
 * (joined to exercises.muscle_group) directly onto regions.
 *
 * Visual style: simplified anatomical silhouette using ellipses and rounded
 * rects. Designed to render readably at ~250px tall and look at home in the
 * existing neon/glass dark theme.
 */

export type MuscleId =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'forearms'
  | 'core'
  | 'quads'
  | 'calves'
  | 'back'
  | 'traps'
  | 'triceps'
  | 'glutes'
  | 'hamstrings';

export type RegionShape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx?: number };

export type MuscleRegion = {
  id: MuscleId;
  label: string;
  /** Which view this region belongs to. */
  view: 'front' | 'back';
  /** SVG shapes that together form the region (typically left/right pairs). */
  shapes: RegionShape[];
};

/**
 * Maps the various values that may appear in `exercises.muscle_group` to the
 * canonical MuscleId space. The values in the wild come from a free-text
 * column so we accept common spellings/aliases.
 */
export const MUSCLE_GROUP_TO_REGION: Record<string, MuscleId[]> = {
  chest: ['chest'],
  shoulders: ['shoulders'],
  delts: ['shoulders'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  core: ['core'],
  abs: ['core'],
  back: ['back'],
  lats: ['back'],
  traps: ['traps'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  quads: ['quads'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
  'full-body': ['chest', 'back', 'shoulders', 'core', 'quads', 'hamstrings'],
};

export const FRONT_REGIONS: MuscleRegion[] = [
  {
    id: 'shoulders',
    label: 'Shoulders',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 65, cy: 105, rx: 18, ry: 14 },
      { kind: 'ellipse', cx: 135, cy: 105, rx: 18, ry: 14 },
    ],
  },
  {
    id: 'chest',
    label: 'Chest',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 80, cy: 135, rx: 22, ry: 18 },
      { kind: 'ellipse', cx: 120, cy: 135, rx: 22, ry: 18 },
    ],
  },
  {
    id: 'biceps',
    label: 'Biceps',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 42, cy: 145, rx: 12, ry: 22 },
      { kind: 'ellipse', cx: 158, cy: 145, rx: 12, ry: 22 },
    ],
  },
  {
    id: 'forearms',
    label: 'Forearms',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 32, cy: 195, rx: 11, ry: 24 },
      { kind: 'ellipse', cx: 168, cy: 195, rx: 11, ry: 24 },
    ],
  },
  {
    id: 'core',
    label: 'Core',
    view: 'front',
    shapes: [{ kind: 'rect', x: 78, y: 165, width: 44, height: 60, rx: 12 }],
  },
  {
    id: 'quads',
    label: 'Quads',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 84, cy: 270, rx: 18, ry: 38 },
      { kind: 'ellipse', cx: 116, cy: 270, rx: 18, ry: 38 },
    ],
  },
  {
    id: 'calves',
    label: 'Calves',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 84, cy: 345, rx: 14, ry: 28 },
      { kind: 'ellipse', cx: 116, cy: 345, rx: 14, ry: 28 },
    ],
  },
];

export const BACK_REGIONS: MuscleRegion[] = [
  {
    id: 'traps',
    label: 'Traps',
    view: 'back',
    shapes: [{ kind: 'ellipse', cx: 100, cy: 110, rx: 28, ry: 14 }],
  },
  {
    id: 'shoulders',
    label: 'Rear Delts',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 65, cy: 110, rx: 16, ry: 12 },
      { kind: 'ellipse', cx: 135, cy: 110, rx: 16, ry: 12 },
    ],
  },
  {
    id: 'back',
    label: 'Back',
    view: 'back',
    shapes: [{ kind: 'rect', x: 70, y: 130, width: 60, height: 70, rx: 16 }],
  },
  {
    id: 'triceps',
    label: 'Triceps',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 42, cy: 150, rx: 12, ry: 22 },
      { kind: 'ellipse', cx: 158, cy: 150, rx: 12, ry: 22 },
    ],
  },
  {
    id: 'forearms',
    label: 'Forearms',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 32, cy: 200, rx: 11, ry: 24 },
      { kind: 'ellipse', cx: 168, cy: 200, rx: 11, ry: 24 },
    ],
  },
  {
    id: 'glutes',
    label: 'Glutes',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 86, cy: 215, rx: 16, ry: 16 },
      { kind: 'ellipse', cx: 114, cy: 215, rx: 16, ry: 16 },
    ],
  },
  {
    id: 'hamstrings',
    label: 'Hamstrings',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 84, cy: 275, rx: 17, ry: 36 },
      { kind: 'ellipse', cx: 116, cy: 275, rx: 17, ry: 36 },
    ],
  },
  {
    id: 'calves',
    label: 'Calves',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 84, cy: 345, rx: 14, ry: 28 },
      { kind: 'ellipse', cx: 116, cy: 345, rx: 14, ry: 28 },
    ],
  },
];

/**
 * Body silhouette as a single closed path: head + torso + arms + legs.
 * Traced clockwise from the top of the head so the path never self-intersects.
 * Front and back share the same simplified outline (the regions on top tell
 * them apart visually).
 */
const BODY_SILHOUETTE_PATH =
  // Head (clockwise from top)
  'M 100 25 ' +
  'C 112 25, 120 35, 120 50 ' +
  'C 120 65, 112 78, 100 80 ' +
  // Right shoulder out to right arm
  'L 150 95 L 168 130 L 178 180 L 178 225 L 168 240 ' +
  // Right arm down to wrist, then back up the inner edge to torso
  'L 158 230 L 150 180 L 140 140 L 130 160 ' +
  // Right side of torso down to hip
  'L 132 220 ' +
  // Right leg: outer edge down to ankle, around the foot, inner edge back up
  'L 138 310 L 135 380 L 108 380 L 105 310 L 100 230 ' +
  // Inseam crotch and into left leg
  'L 95 310 L 92 380 L 65 380 L 62 310 L 68 220 ' +
  // Left side of torso up to shoulder
  'L 70 160 L 60 140 L 50 180 L 42 230 L 32 240 ' +
  // Left arm back up to shoulder
  'L 22 225 L 22 180 L 32 130 L 50 95 ' +
  // Left shoulder back to head
  'L 80 80 ' +
  'C 88 78, 80 65, 80 50 ' +
  'C 80 35, 88 25, 100 25 Z';

export const FRONT_BODY_OUTLINE = BODY_SILHOUETTE_PATH;
export const BACK_BODY_OUTLINE = BODY_SILHOUETTE_PATH;

export const VIEWBOX_WIDTH = 200;
export const VIEWBOX_HEIGHT = 400;
