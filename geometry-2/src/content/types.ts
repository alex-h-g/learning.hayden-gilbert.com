import type { NumberAnswer } from '../math/validate';

/** Gina's nine poses. File names: public/gina/gina-<pose>.webp */
export type Pose = 'waving' | 'thinking' | 'explaining' | 'curious' | 'encouraging' | 'celebrating' | 'cheering' | 'reassuring' | 'neutral';

export type TopicId = 'angles' | 'constructions' | 'pythagoras' | 'circles' | 'metric' | 'standard-form';

/**
 * Text fields are "rich": plain text with inline LaTeX between $…$,
 * e.g. "Sum $= (n - 2) \\times 180^\\circ$". Use \n\n for a new paragraph.
 */
export type Rich = string;

export interface Option {
  id: string;
  label: Rich;
  correct: boolean;
  /** What Gina says if this option is chosen (wrong options) or confirmed (right ones). */
  feedback?: Rich;
  /** Diagram part to highlight when this option is selected. */
  highlight?: string;
}

interface StepBase {
  id: string;
  prompt: Rich;
  /** Progressive hints: 1) the concept, 2) the next operation, 3) an explicit worked step. */
  hints: Rich[];
  /** The reasoning, shown after the step is answered (or revealed). */
  explain: Rich;
  /** Shown only in guided examples; practice and mastery skip it. */
  guidedOnly?: boolean;
  /** Diagram parts to highlight while this step is active. */
  highlight?: string[];
  pose?: Pose;
}

export interface ChoiceStep extends StepBase {
  kind: 'choice';
  options: Option[];
}

/** "Select all that apply". Correct when exactly the correct options are selected. */
export interface MultiStep extends StepBase {
  kind: 'multi';
  options: Option[];
}

export interface NumberStep extends StepBase {
  kind: 'number';
  answer: NumberAnswer;
  /** Shown before the box, e.g. "a =". */
  label?: Rich;
  unit?: string;
  /** Extra on-screen keys for touch devices. */
  keys?: ('pi' | 'root' | 'squared')[];
  /** The answer as it should be displayed in explanations, e.g. "$8\\pi \\approx 25.13$". */
  display: Rich;
}

/** Exact decimal answer (unit conversions): compared digit for digit. */
export interface DecimalStep extends StepBase {
  kind: 'decimal';
  target: string;
  unit?: string;
  label?: Rich;
  display: Rich;
}

/** Standard form a × 10ⁿ entry: coefficient and power. */
export interface StandardFormStep extends StepBase {
  kind: 'sf';
  target: { coef: string; exp: number };
  unit?: string;
  display: Rich;
}

export type WidgetSpec =
  | { type: 'construct-triangle'; base: number; left: number; right: number }
  | { type: 'perp-bisector'; length: number };

/** An interactive construction that reports its own attempts. */
export interface WidgetStep extends StepBase {
  kind: 'widget';
  widget: WidgetSpec;
}

export type Step = ChoiceStep | MultiStep | NumberStep | DecimalStep | StandardFormStep | WidgetStep;

export type CubePlaneId = string;

export type DiagramSpec =
  | { type: 'polygon'; n: number; triangulate?: boolean; caption?: string; irregular?: boolean; seed?: number; markAngle?: string }
  | {
      type: 'exterior-polygon';
      /** Exterior angles in order (sum 360); the unknown one is shown with `unknownLabel`. */
      exteriors: number[];
      unknownIndex: number;
      unknownLabel: string;
      /** Show exterior turning angles or interior angles. */
      mode: 'exterior' | 'interior';
      seed: number;
    }
  | { type: 'parallelogram'; angleS: number; labels: { S?: string; P?: string; Q?: string; R?: string; QRT?: string } }
  | { type: 'straight-line'; angles: { value: number; label: string }[] }
  | { type: 'around-point'; angles: { value: number; label: string }[] }
  | {
      type: 'parallel';
      /** Acute angle the transversal makes with the parallel lines (drawing only). */
      slope: number;
      given: { pos: AnglePos; label: string };
      unknown: { pos: AnglePos; label: string };
    }
  | {
      type: 'right-triangle';
      /** Lengths of the two shorter sides, for the drawing's proportions. */
      a: number;
      b: number;
      labels: { a: string; b: string; c: string };
      rotation: number; // degrees
      flip?: boolean;
      unit?: string;
    }
  | { type: 'rectangle'; l: number; w: number; labels: { l: string; w: string; d?: string }; unit?: string }
  | { type: 'circle'; show: 'radius' | 'diameter' | 'both'; label: string; caption?: string }
  | { type: 'compound'; w: number; h: number; unit: string }
  | { type: 'cube'; size: string; unit: string; marks?: 'one' | 'three' | 'all' }
  | { type: 'cube3d'; plane?: CubePlaneId; explore?: boolean }
  | { type: 'triangle-sides'; base: number; left: number; right: number; unit: string }
  | { type: 'prefix-scale' }
  | { type: 'mass-ladder'; from?: string; to?: string }
  | { type: 'sf-shift'; digits: string; places: number; direction: 'left' | 'right' };

/** Positions around the two crossings of a transversal with parallel lines. */
export type AnglePos = 'top-tl' | 'top-tr' | 'top-bl' | 'top-br' | 'bot-tl' | 'bot-tr' | 'bot-bl' | 'bot-br';

export interface Problem {
  /** Stable id for this generated question (seed-based), used in logs. */
  id: string;
  skill: string;
  /** What Gina says first. Never contains the answer. */
  intro: Rich;
  /** The question as it would appear on paper. */
  question: Rich;
  diagram?: DiagramSpec;
  steps: Step[];
  /** Gina's summary of the reasoning after the question is complete. */
  summary: Rich;
  /** The final answer, for reviews and revision guides. */
  answer: Rich;
}

export interface Slide {
  pose: Pose;
  text: Rich;
  diagram?: DiagramSpec;
  /** A key formula, LaTeX (no $). */
  formula?: string;
}

/** Difficulty for generated questions: 0 simpler, 1 standard, 2 stretch. */
export type Difficulty = 0 | 1 | 2;

export interface LessonDef {
  id: string;
  topic: TopicId;
  title: string;
  /** One-line summary for cards. */
  blurb: string;
  /** "By the end you'll be able to…" */
  objective: string;
  /** Lessons worth doing first (recommended, never enforced). */
  prereq?: string[];
  intro: Slide[];
  /** The worked example from the worksheet, taught step by step. */
  guided: () => Problem;
  /** Further worksheet examples, also taught step by step. */
  moreGuided?: (() => Problem)[];
  /** New questions every time. Must compute answers via src/math/core.ts. */
  generate: (rng: () => number, difficulty: Difficulty) => Problem;
  /** Default 3 practice and 4 mastery questions. */
  practiceCount?: number;
  masteryCount?: number;
  /** Included in Mixed Exam Practice (constructions use the canvas and are excluded). */
  inExam?: boolean;
  /** Revision-guide entry. */
  guide: {
    rule: Rich;
    explanation: Rich;
    mistake: Rich;
  };
}

export interface TopicDef {
  id: TopicId;
  title: string;
  blurb: string;
  /** Accent colour for the card. */
  colour: string;
  tint: string;
  lessons: string[];
}
