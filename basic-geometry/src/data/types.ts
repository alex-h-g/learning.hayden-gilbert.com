/** Formula categories. Area and perimeter/circumference are always separate. */
export type Category = 'area' | 'perimeter' | 'circumference' | 'volume' | 'surface-area';

export type Dimension = '2d' | '3d';

export type ShapeId =
  | 'square'
  | 'rectangle'
  | 'triangle'
  | 'parallelogram'
  | 'trapezoid'
  | 'circle'
  | 'cube'
  | 'rectangular-prism'
  | 'prism'
  | 'cylinder'
  | 'cone'
  | 'square-pyramid'
  | 'sphere';

/** 1 = familiar, 2 = more variety, 3 = harder distinctions. */
export type Difficulty = 1 | 2 | 3;

export interface VariableDef {
  /** Symbol as LaTeX, e.g. "r" or "B". */
  symbol: string;
  /** Meaning in the context of this particular formula. */
  meaning: string;
}

/** Kind of measurement an input represents (decides which units it accepts). */
export type InputKind = 'length' | 'area';

export interface CalcInput {
  /** Key used in the values object passed to compute(). */
  key: string;
  label: string;
  /** Symbol (LaTeX) shown beside the label. */
  symbol: string;
  kind: InputKind;
  help?: string;
}

/** Values are already converted into the result unit system. */
export type CalcValues = Record<string, number>;

export interface CalcStep {
  /** LaTeX for an intermediate value, e.g. "l = \\sqrt{r^2 + h^2} = 13". */
  tex: string;
  note?: string;
}

export interface CalcResult {
  value: number;
  /** LaTeX showing the numbers substituted into the formula. */
  substitution: string;
  /** Extra derived values (e.g. slant height) shown before the result. */
  steps: CalcStep[];
}

export interface Calculation {
  inputs: CalcInput[];
  /** Returns an error message for impossible inputs, or null if valid. */
  validate?: (v: CalcValues) => string | null;
  compute: (v: CalcValues, fmt: (n: number) => string) => CalcResult;
}

export interface Formula {
  /** Stable unique ID, never derived from display text. */
  id: string;
  shapeId: ShapeId;
  category: Category;
  /** Question shown on the left-hand game card, e.g. "Area of a circle". */
  question: string;
  /** Mathematical expression in LaTeX (rendered by KaTeX, never shown raw). */
  tex: string;
  /** Plain-text reading for screen readers and fallbacks. */
  plain: string;
  variables: VariableDef[];
  difficulty: Difficulty;
  /** Why the formula works / what it measures. */
  explanation: string;
  hints?: string[];
  calculation: Calculation;
}

export interface Shape {
  id: ShapeId;
  name: string;
  dimension: Dimension;
  /** Short explanatory note for the reference page. */
  note: string;
  /** Formula IDs belonging to this shape, in display order. */
  formulaIds: string[];
}
