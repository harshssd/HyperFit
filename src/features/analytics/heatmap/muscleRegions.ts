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
 * Outline of the body silhouette behind the muscle regions. Single Path so the
 * silhouette can be rendered in one stroke.
 */
export const FRONT_OUTLINE =
  'M 100 25 ' +
  'C 88 25, 80 35, 80 50 ' + // head left
  'C 80 65, 88 75, 100 75 ' + // head bottom
  'C 112 75, 120 65, 120 50 ' + // head right
  'C 120 35, 112 25, 100 25 Z'; // close head
// Body outline drawn as separate path for clarity.
export const FRONT_BODY_OUTLINE =
  'M 80 90 ' +
  'L 50 100 L 32 145 L 22 195 L 22 230 L 32 240 ' + // left arm
  'L 70 165 L 70 220 L 65 310 L 65 380 L 105 380 L 105 310 ' + // left leg
  'L 130 165 L 130 220 L 135 310 L 135 380 L 105 380 ' + // right leg
  'L 168 240 L 178 230 L 178 195 L 168 145 L 150 100 L 120 90 Z';
export const BACK_OUTLINE = FRONT_OUTLINE; // symmetric for our simplified silhouette
export const BACK_BODY_OUTLINE = FRONT_BODY_OUTLINE;

export const VIEWBOX_WIDTH = 200;
export const VIEWBOX_HEIGHT = 400;
