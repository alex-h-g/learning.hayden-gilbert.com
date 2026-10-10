import { ANGLE_LESSONS } from './lessons/angles';
import { CIRCLE_LESSONS } from './lessons/circles';
import { CONSTRUCTION_LESSONS } from './lessons/constructions';
import { METRIC_LESSONS, SF_LESSONS } from './lessons/metric';
import { PYTHAGORAS_LESSONS } from './lessons/pythagoras';
import type { LessonDef, TopicDef, TopicId } from './types';

export const TOPICS: TopicDef[] = [
  { id: 'angles', title: 'Angles and Polygons', blurb: 'Interior and exterior angles, regular polygons, parallelograms and angle facts.', colour: '#d6336c', tint: '#fdeef4', lessons: ANGLE_LESSONS.map((l) => l.id) },
  { id: 'constructions', title: 'Constructions and Symmetry', blurb: 'Construct triangles and bisectors with compasses; explore a cube.', colour: '#7048e8', tint: '#f1edfd', lessons: CONSTRUCTION_LESSONS.map((l) => l.id) },
  { id: 'pythagoras', title: 'Pythagoras’ Theorem', blurb: 'Find missing sides of right-angled triangles and rectangle diagonals.', colour: '#1c7ed6', tint: '#e8f3fd', lessons: PYTHAGORAS_LESSONS.map((l) => l.id) },
  { id: 'circles', title: 'Circles and Compound Shapes', blurb: 'Radius, diameter, circumference, area — and a rectangle with a semicircle.', colour: '#e8590c', tint: '#fff1e6', lessons: CIRCLE_LESSONS.map((l) => l.id) },
  { id: 'metric', title: 'Metric Units and Conversions', blurb: 'Prefixes from giga to nano; tonnes, kg, g and mg.', colour: '#2b8a3e', tint: '#ebf7ee', lessons: METRIC_LESSONS.map((l) => l.id) },
  { id: 'standard-form', title: 'Standard Form', blurb: 'Very big and very small numbers as a × 10ⁿ.', colour: '#0c8599', tint: '#e6f6f8', lessons: SF_LESSONS.map((l) => l.id) },
];

/** All lessons in recommended course order. */
export const LESSONS: LessonDef[] = [...ANGLE_LESSONS, ...CONSTRUCTION_LESSONS, ...PYTHAGORAS_LESSONS, ...CIRCLE_LESSONS, ...METRIC_LESSONS, ...SF_LESSONS];

const BY_ID = new Map(LESSONS.map((l) => [l.id, l]));
export const lessonById = (id: string) => BY_ID.get(id);
export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const lessonsOf = (t: TopicId) => LESSONS.filter((l) => l.topic === t);
