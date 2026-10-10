/**
 * Level and practice-mode configuration. Everything here is data — the game
 * engine reads it; no UI component hard-codes which formulas appear.
 * Add a level by appending to LEVELS; add a mode by appending to PRACTICE_MODES.
 */
import { FORMULAS } from './formulas';
import { getShape } from './shapes';
import type { Formula } from './types';

export interface LevelConfig {
  number: number;
  title: string;
  description: string;
  /** Formula IDs that may be asked as questions in this level. */
  pool: string[];
  /** Pairs to match per round. */
  pairs: number;
  /** Total formula cards shown (correct answers + distractors). */
  optionCount: number;
  /** Prefer asking two formulas from the same shape (e.g. area AND circumference of a circle). */
  preferSameShapePairs: boolean;
}

export const LEVELS: LevelConfig[] = [
  {
    number: 1,
    title: 'Getting started',
    description: 'Familiar formulas for squares, rectangles, triangles, circles and cubes.',
    pool: ['square-area', 'square-perimeter', 'rectangle-area', 'rectangle-perimeter', 'triangle-area', 'circle-area', 'circle-circumference', 'cube-volume'],
    pairs: 4,
    optionCount: 8,
    preferSameShapePairs: false,
  },
  {
    number: 2,
    title: 'Building variety',
    description: 'More 2D shapes mixed with common 3D solids.',
    pool: [
      'triangle-perimeter', 'parallelogram-area', 'parallelogram-perimeter', 'trapezoid-area',
      'cube-surface-area', 'rectangular-prism-volume', 'rectangular-prism-surface-area', 'cylinder-volume', 'sphere-volume',
      'circle-area', 'circle-circumference',
    ],
    pairs: 4,
    optionCount: 10,
    preferSameShapePairs: false,
  },
  {
    number: 3,
    title: 'Tricky distinctions',
    description: 'Volume vs surface area, vertical vs slant height, and look-alike formulas.',
    pool: [
      'trapezoid-perimeter', 'prism-volume', 'prism-surface-area', 'cylinder-volume', 'cylinder-surface-area',
      'cone-volume', 'cone-surface-area', 'square-pyramid-volume', 'square-pyramid-surface-area',
      'sphere-volume', 'sphere-surface-area', 'cube-surface-area',
    ],
    pairs: 4,
    optionCount: 10,
    preferSameShapePairs: true,
  },
];

export type ModeId = 'levels' | 'area' | 'perimeter' | 'mixed-2d' | '3d' | 'mixed' | 'mistakes';

export interface PracticeMode {
  id: Exclude<ModeId, 'levels'>;
  title: string;
  description: string;
  /** Which formulas this mode draws from (ignored by 'mistakes', which uses history). */
  filter: (f: Formula) => boolean;
  pairs: number;
  optionCount: number;
}

const is2d = (f: Formula) => getShape(f.shapeId)?.dimension === '2d';

export const PRACTICE_MODES: PracticeMode[] = [
  { id: 'area', title: 'Area Practice', description: 'Area formulas for every 2D shape.', filter: (f) => f.category === 'area', pairs: 4, optionCount: 8 },
  { id: 'perimeter', title: 'Perimeter & Circumference', description: 'Distances around polygons and circles.', filter: (f) => f.category === 'perimeter' || f.category === 'circumference', pairs: 4, optionCount: 8 },
  { id: 'mixed-2d', title: 'Mixed 2D Geometry', description: 'Area and perimeter together — know which is which.', filter: is2d, pairs: 4, optionCount: 10 },
  { id: '3d', title: '3D Geometry', description: 'Volume and surface area of solids.', filter: (f) => !is2d(f), pairs: 4, optionCount: 10 },
  { id: 'mixed', title: 'Mixed Geometry', description: 'Everything, from squares to spheres.', filter: () => true, pairs: 4, optionCount: 10 },
  { id: 'mistakes', title: 'Practise My Mistakes', description: 'Focus on the formulas you have found hardest.', filter: () => true, pairs: 4, optionCount: 10 },
];

export function getLevel(n: number): LevelConfig | undefined {
  return LEVELS.find((l) => l.number === n);
}

export function getMode(id: string): PracticeMode | undefined {
  return PRACTICE_MODES.find((m) => m.id === id);
}

export function modeTitle(mode: ModeId, level?: number): string {
  if (mode === 'levels') return `Level ${level ?? 1} of ${LEVELS.length}`;
  return getMode(mode)?.title ?? 'Practice';
}

export function poolForMode(id: Exclude<ModeId, 'levels' | 'mistakes'>): string[] {
  const mode = getMode(id)!;
  return FORMULAS.filter(mode.filter).map((f) => f.id);
}
