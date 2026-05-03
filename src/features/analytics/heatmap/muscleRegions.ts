/**
 * Muscle group regions for the heatmap body silhouettes.
 *
 * Each region is one or more SVG primitives (ellipse, rect, or path). The
 * viewbox is 200×400 for both front and back views (1:2 aspect, head at top).
 *
 * Region IDs match the canonical muscle-id space used by the recruitment
 * model in `muscle_volume_v2_view` (primary_muscles[] / secondary_muscles[]
 * in the `exercises` table). MUSCLE_GROUP_TO_REGION maps the legacy
 * free-text `muscle_group` column onto the same space so the existing
 * single-muscle heatmap keeps working until the v2 hook lands.
 *
 * Visual style: low-detail anatomical silhouette. Pectorals as teardrops,
 * lats as sweeping V-taper paths, obliques as diagonals, quads/hams as
 * elongated ellipses with adductors split out. Designed to render readably
 * at ~140-180px tall in the existing anthracite/glass theme.
 */

export type MuscleId =
  // Upper body — front
  | 'chest'
  | 'front_delts'
  | 'side_delts'
  | 'biceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  // Upper body — back
  | 'traps'
  | 'rear_delts'
  | 'lats'
  | 'mid_back'
  | 'lower_back'
  | 'triceps'
  // Lower body
  | 'quads'
  | 'adductors'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

export type RegionShape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx?: number }
  | { kind: 'path'; d: string };

export type MuscleRegion = {
  id: MuscleId;
  label: string;
  /** Which view this region belongs to. */
  view: 'front' | 'back';
  /** SVG shapes that together form the region (typically left/right pairs). */
  shapes: RegionShape[];
};

/**
 * Maps the values that may appear in `exercises.muscle_group` (legacy free
 * text) onto the canonical MuscleId space. Compounds like "legs" or
 * "full-body" distribute across the regions they recruit so the legacy
 * heatmap doesn't overweight a single muscle. The v2 view bypasses this
 * map entirely — it reads primary_muscles[] / secondary_muscles[] direct.
 */
export const MUSCLE_GROUP_TO_REGION: Record<string, MuscleId[]> = {
  // Direct mappings
  chest: ['chest'],
  abs: ['abs'],
  core: ['abs', 'obliques'],
  obliques: ['obliques'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  traps: ['traps'],
  quads: ['quads'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
  adductors: ['adductors'],

  // Legacy aggregate terms — split across the muscles they actually recruit
  shoulders: ['front_delts', 'side_delts', 'rear_delts'],
  delts: ['front_delts', 'side_delts', 'rear_delts'],
  back: ['lats', 'mid_back'],
  lats: ['lats'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  'full-body': ['chest', 'lats', 'mid_back', 'side_delts', 'front_delts', 'abs', 'quads', 'glutes'],
};

// =============================================================================
// FRONT view regions
// =============================================================================

export const FRONT_REGIONS: MuscleRegion[] = [
  // Upper traps peeking around the neck
  {
    id: 'traps',
    label: 'Upper Traps',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 84, cy: 94, rx: 8, ry: 6 },
      { kind: 'ellipse', cx: 116, cy: 94, rx: 8, ry: 6 },
    ],
  },
  // Front deltoids — rounded caps on top of the shoulder
  {
    id: 'front_delts',
    label: 'Front Delts',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 60, cy: 108, rx: 14, ry: 13 },
      { kind: 'ellipse', cx: 140, cy: 108, rx: 14, ry: 13 },
    ],
  },
  // Side (lateral) delts — narrower outer caps
  {
    id: 'side_delts',
    label: 'Side Delts',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 44, cy: 116, rx: 9, ry: 13 },
      { kind: 'ellipse', cx: 156, cy: 116, rx: 9, ry: 13 },
    ],
  },
  // Pectorals — teardrop shape, wider toward the sternum
  {
    id: 'chest',
    label: 'Chest',
    view: 'front',
    shapes: [
      { kind: 'path', d: 'M 100 122 Q 78 120 70 134 Q 68 152 86 158 Q 100 158 100 144 Z' },
      { kind: 'path', d: 'M 100 122 Q 122 120 130 134 Q 132 152 114 158 Q 100 158 100 144 Z' },
    ],
  },
  // Biceps — long oval, slightly flexed
  {
    id: 'biceps',
    label: 'Biceps',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 40, cy: 148, rx: 10, ry: 22 },
      { kind: 'ellipse', cx: 160, cy: 148, rx: 10, ry: 22 },
    ],
  },
  // Forearms (front)
  {
    id: 'forearms',
    label: 'Forearms',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 30, cy: 195, rx: 9, ry: 24 },
      { kind: 'ellipse', cx: 170, cy: 195, rx: 9, ry: 24 },
    ],
  },
  // Rectus abdominis — narrow vertical block down the midline
  {
    id: 'abs',
    label: 'Abs',
    view: 'front',
    shapes: [{ kind: 'rect', x: 88, y: 162, width: 24, height: 60, rx: 6 }],
  },
  // Obliques — diagonal slabs flanking the abs
  {
    id: 'obliques',
    label: 'Obliques',
    view: 'front',
    shapes: [
      { kind: 'path', d: 'M 86 168 L 88 218 L 74 214 L 78 174 Z' },
      { kind: 'path', d: 'M 114 168 L 112 218 L 126 214 L 122 174 Z' },
    ],
  },
  // Quadriceps — long ovals, outer mass of the thigh
  {
    id: 'quads',
    label: 'Quads',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 82, cy: 278, rx: 16, ry: 40 },
      { kind: 'ellipse', cx: 118, cy: 278, rx: 16, ry: 40 },
    ],
  },
  // Adductors — inner thigh sliver between the quads
  {
    id: 'adductors',
    label: 'Adductors',
    view: 'front',
    shapes: [
      { kind: 'path', d: 'M 96 248 L 100 248 L 100 312 L 92 312 Z' },
      { kind: 'path', d: 'M 100 248 L 104 248 L 108 312 L 100 312 Z' },
    ],
  },
  // Calves (anterior — small slice; the meaty gastrocnemius is on the back)
  {
    id: 'calves',
    label: 'Calves',
    view: 'front',
    shapes: [
      { kind: 'ellipse', cx: 84, cy: 348, rx: 11, ry: 26 },
      { kind: 'ellipse', cx: 116, cy: 348, rx: 11, ry: 26 },
    ],
  },
];

// =============================================================================
// BACK view regions
// =============================================================================

export const BACK_REGIONS: MuscleRegion[] = [
  // Upper traps — broad diamond from neck out to shoulder line
  {
    id: 'traps',
    label: 'Traps',
    view: 'back',
    shapes: [
      {
        kind: 'path',
        d: 'M 100 86 L 132 102 L 124 138 L 100 146 L 76 138 L 68 102 Z',
      },
    ],
  },
  // Rear delts
  {
    id: 'rear_delts',
    label: 'Rear Delts',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 58, cy: 110, rx: 13, ry: 11 },
      { kind: 'ellipse', cx: 142, cy: 110, rx: 13, ry: 11 },
    ],
  },
  // Side delts visible from the back too
  {
    id: 'side_delts',
    label: 'Side Delts',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 42, cy: 116, rx: 9, ry: 13 },
      { kind: 'ellipse', cx: 158, cy: 116, rx: 9, ry: 13 },
    ],
  },
  // Lats — V-taper sweep from armpit down to lower ribs
  {
    id: 'lats',
    label: 'Lats',
    view: 'back',
    shapes: [
      { kind: 'path', d: 'M 70 132 Q 60 168 72 200 L 94 198 L 94 134 Z' },
      { kind: 'path', d: 'M 130 132 Q 140 168 128 200 L 106 198 L 106 134 Z' },
    ],
  },
  // Mid-back / rhomboids — central slab between the shoulder blades
  {
    id: 'mid_back',
    label: 'Mid Back',
    view: 'back',
    shapes: [{ kind: 'rect', x: 94, y: 138, width: 12, height: 60, rx: 4 }],
  },
  // Lower back / erectors — wide rounded slab below the lats
  {
    id: 'lower_back',
    label: 'Lower Back',
    view: 'back',
    shapes: [{ kind: 'rect', x: 78, y: 200, width: 44, height: 22, rx: 8 }],
  },
  // Triceps — long oval on the back of the upper arm
  {
    id: 'triceps',
    label: 'Triceps',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 40, cy: 152, rx: 11, ry: 24 },
      { kind: 'ellipse', cx: 160, cy: 152, rx: 11, ry: 24 },
    ],
  },
  // Forearms (back)
  {
    id: 'forearms',
    label: 'Forearms',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 30, cy: 198, rx: 9, ry: 24 },
      { kind: 'ellipse', cx: 170, cy: 198, rx: 9, ry: 24 },
    ],
  },
  // Glutes — two rounded halves
  {
    id: 'glutes',
    label: 'Glutes',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 86, cy: 234, rx: 16, ry: 18 },
      { kind: 'ellipse', cx: 114, cy: 234, rx: 16, ry: 18 },
    ],
  },
  // Hamstrings
  {
    id: 'hamstrings',
    label: 'Hamstrings',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 82, cy: 288, rx: 16, ry: 36 },
      { kind: 'ellipse', cx: 118, cy: 288, rx: 16, ry: 36 },
    ],
  },
  // Calves (gastrocnemius — the main calf mass)
  {
    id: 'calves',
    label: 'Calves',
    view: 'back',
    shapes: [
      { kind: 'ellipse', cx: 84, cy: 348, rx: 13, ry: 28 },
      { kind: 'ellipse', cx: 116, cy: 348, rx: 13, ry: 28 },
    ],
  },
];

/**
 * Body silhouette as a single closed path: head, neck, shoulder line, arms,
 * tapered torso, hips, legs. Traced clockwise from the top of the head.
 *
 * Tightened from the previous outline: pinched waist, more pronounced
 * shoulder shelf, slightly tapered calves into ankle. Same simplified
 * outline serves both front and back — the regions on top tell them apart.
 */
const BODY_SILHOUETTE_PATH =
  // Head (top, clockwise)
  'M 100 22 ' +
  'C 114 22, 122 34, 122 50 ' +
  'C 122 66, 114 80, 100 82 ' +
  // Right side of neck out to shoulder shelf
  'L 108 88 L 158 102 L 178 132 ' +
  // Right outer arm down to wrist
  'L 184 180 L 180 222 L 174 244 L 162 246 ' +
  // Inner forearm + biceps back up to torso
  'L 158 238 L 152 200 L 144 160 L 134 142 ' +
  // Right pec sweep into torso side, narrowing to waist
  'L 134 180 L 124 218 ' +
  // Right hip + outer thigh down to ankle
  'L 134 244 L 138 318 L 132 380 L 110 382 ' +
  // Inner ankle, up the inseam to crotch
  'L 106 318 L 102 244 L 98 244 L 94 318 L 90 382 ' +
  // Left ankle outer, up outer thigh + hip
  'L 68 380 L 62 318 L 66 244 L 76 218 ' +
  // Left waist back up the side
  'L 66 180 L 66 142 ' +
  // Left pec sweep + inner upper arm
  'L 56 160 L 48 200 L 42 238 L 38 246 ' +
  // Left wrist + outer arm back up to shoulder
  'L 26 244 L 20 222 L 16 180 L 22 132 L 42 102 L 92 88 L 100 82 ' +
  // Close the head
  'C 86 80, 78 66, 78 50 ' +
  'C 78 34, 86 22, 100 22 Z';

export const FRONT_BODY_OUTLINE = BODY_SILHOUETTE_PATH;
export const BACK_BODY_OUTLINE = BODY_SILHOUETTE_PATH;

export const VIEWBOX_WIDTH = 200;
export const VIEWBOX_HEIGHT = 400;
