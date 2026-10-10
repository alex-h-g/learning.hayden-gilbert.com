/**
 * Central maths module for Geometry 2.
 *
 * Every question generator, every validator and every worked explanation calls
 * these functions, so the expected answer is always derived from the question
 * data by the same logic. Nothing in the app hard-codes an answer separately.
 */

// ───────────────────────── Angles and polygons ─────────────────────────

export const POLYGON_NAMES: Record<number, string> = {
  3: 'triangle',
  4: 'quadrilateral',
  5: 'pentagon',
  6: 'hexagon',
  7: 'heptagon',
  8: 'octagon',
  9: 'nonagon',
  10: 'decagon',
  11: 'hendecagon',
  12: 'dodecagon',
  15: 'pentadecagon',
  18: '18-sided polygon',
  20: 'icosagon',
  24: '24-sided polygon',
  30: '30-sided polygon',
  36: '36-sided polygon',
};

export function polygonName(n: number): string {
  return POLYGON_NAMES[n] ?? `${n}-sided polygon`;
}

function assertSides(n: number) {
  if (!Number.isInteger(n) || n < 3) throw new Error(`A polygon needs a whole number of sides ≥ 3 (got ${n})`);
}

/** Number of triangles a polygon splits into from one vertex. */
export function trianglesFromVertex(n: number): number {
  assertSides(n);
  return n - 2;
}

/** Sum of interior angles = (n − 2) × 180°. */
export function interiorAngleSum(n: number): number {
  assertSides(n);
  return (n - 2) * 180;
}

/** Each interior angle of a REGULAR polygon. */
export function regularInteriorAngle(n: number): number {
  return interiorAngleSum(n) / n;
}

/** Each exterior angle of a REGULAR polygon = 360° ÷ n. */
export function regularExteriorAngle(n: number): number {
  assertSides(n);
  return 360 / n;
}

/** Interior and exterior angle at a vertex lie on a straight line. */
export function interiorFromExterior(exterior: number): number {
  return 180 - exterior;
}

export function exteriorFromInterior(interior: number): number {
  return 180 - interior;
}

/** Sides of a regular polygon from one exterior angle; null if not a whole number. */
export function sidesFromExterior(exterior: number): number | null {
  if (exterior <= 0 || exterior >= 180) return null;
  const n = 360 / exterior;
  return Math.abs(n - Math.round(n)) < 1e-9 && Math.round(n) >= 3 ? Math.round(n) : null;
}

const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);

/** Missing exterior angle when the others are known (exterior angles sum to 360°). */
export function missingExteriorAngle(known: readonly number[]): number {
  const a = 360 - sum(known);
  if (a <= 0 || a >= 180) throw new Error(`Inconsistent exterior angles ${known.join(', ')}`);
  return a;
}

/** Missing interior angle of an n-gon when the other n − 1 are known. */
export function missingInteriorAngle(known: readonly number[]): number {
  const n = known.length + 1;
  const a = interiorAngleSum(n) - sum(known);
  if (a <= 0 || a >= 360) throw new Error(`Inconsistent interior angles ${known.join(', ')}`);
  return a;
}

/** Number of sides n such that (n − 2) × 180 = total, or null. */
export function sidesFromInteriorSum(total: number): number | null {
  const n = total / 180 + 2;
  return Number.isInteger(n) && n >= 3 ? n : null;
}

/**
 * Parallelogram PQRS (vertices in order) with side SR extended beyond R to T.
 * Given the interior angle at S, every other angle follows:
 * opposite angles are equal, adjacent (co-interior) angles add to 180°, and
 * ∠QRT lies on a straight line with ∠QRS.
 */
export function parallelogramAngles(angleS: number) {
  if (!(angleS > 0 && angleS < 180) || angleS === 90) throw new Error(`Bad parallelogram angle ${angleS}`);
  const S = angleS;
  const R = 180 - S; // ∠QRS, adjacent to S (co-interior, PQ ∥ SR… QR ∥ PS)
  const P = 180 - S; // ∠SPQ, adjacent to S
  const Q = S; // ∠PQR, opposite S
  const QRT = 180 - R; // straight line S–R–T
  return { P, Q, R, S, QRT };
}

/** Angles on a straight line add to 180°. */
export function missingOnStraightLine(known: readonly number[]): number {
  const a = 180 - sum(known);
  if (a <= 0) throw new Error('Angles on a line exceed 180°');
  return a;
}

/** Angles around a point add to 360°. */
export function missingAroundPoint(known: readonly number[]): number {
  const a = 360 - sum(known);
  if (a <= 0) throw new Error('Angles around a point exceed 360°');
  return a;
}

export type ParallelRelation = 'corresponding' | 'alternate' | 'co-interior' | 'vertically-opposite';

/** Angle related to a given angle at a transversal crossing two parallel lines. */
export function parallelLineAngle(given: number, relation: ParallelRelation): number {
  if (!(given > 0 && given < 180)) throw new Error('Bad angle');
  return relation === 'co-interior' ? 180 - given : given;
}

/**
 * Builds a closed polygon (for drawing) whose exterior turning angles are
 * `exteriors` (degrees, sum 360). Returns vertices, or null if no convex shape
 * with reasonable side lengths was found.
 */
export function polygonFromExteriorAngles(exteriors: readonly number[], rng: () => number = Math.random): { x: number; y: number }[] | null {
  const n = exteriors.length;
  if (Math.abs(sum(exteriors) - 360) > 1e-9 || exteriors.some((e) => e <= 0 || e >= 180)) return null;
  const headings: number[] = [];
  let h = 0;
  for (let i = 0; i < n; i++) {
    headings.push(h);
    h += exteriors[i];
  }
  const dir = headings.map((d) => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)]);
  for (let attempt = 0; attempt < 400; attempt++) {
    const L = Array.from({ length: n - 2 }, () => 0.8 + rng() * 0.6);
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < n - 2; i++) {
      sx += L[i] * dir[i][0];
      sy += L[i] * dir[i][1];
    }
    // Solve L_{n-2} d_{n-2} + L_{n-1} d_{n-1} = −(sx, sy)
    const [a1, a2] = dir[n - 2];
    const [b1, b2] = dir[n - 1];
    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-9) continue;
    const p = (-sx * b2 + sy * b1) / det;
    const q = (-sy * a1 + sx * a2) / det;
    if (p < 0.55 || q < 0.55 || p > 1.9 || q > 1.9) continue;
    const lens = [...L, p, q];
    const pts = [{ x: 0, y: 0 }];
    for (let i = 0; i < n - 1; i++) {
      const last = pts[pts.length - 1];
      pts.push({ x: last.x + lens[i] * dir[i][0], y: last.y + lens[i] * dir[i][1] });
    }
    return pts;
  }
  return null;
}

// ───────────────────────── Pythagoras ─────────────────────────

/** Simplifies √n to k√m with m square-free. */
export function simplifySurd(n: number): { k: number; m: number } {
  if (!Number.isInteger(n) || n < 0) throw new Error(`simplifySurd needs a non-negative integer (got ${n})`);
  let k = 1;
  let m = n;
  for (let f = 2; f * f <= m; f++) {
    while (m % (f * f) === 0) {
      m /= f * f;
      k *= f;
    }
  }
  return { k, m };
}

export function isPerfectSquare(n: number): boolean {
  if (n < 0) return false;
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}

/** Hypotenuse c = √(a² + b²). */
export function hypotenuse(a: number, b: number): number {
  if (a <= 0 || b <= 0) throw new Error('Sides must be positive');
  return Math.sqrt(a * a + b * b);
}

/** Shorter side = √(c² − b²); throws if c is not the longest side. */
export function shorterSide(c: number, b: number): number {
  if (!(c > b && b > 0)) throw new Error(`The hypotenuse (${c}) must be longer than the other side (${b})`);
  return Math.sqrt(c * c - b * b);
}

export function isRightTriangle(a: number, b: number, c: number): boolean {
  const [x, y, z] = [a, b, c].sort((p, q) => p - q);
  return Math.abs(x * x + y * y - z * z) < 1e-9 * Math.max(1, z * z);
}

/** Primitive Pythagorean triples with hypotenuse ≤ 65 (and scaled versions via generators). */
export const PYTHAGOREAN_TRIPLES: readonly [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [12, 35, 37],
  [9, 40, 41],
  [28, 45, 53],
  [11, 60, 61],
  [33, 56, 65],
];

/** Diagonal of a rectangle d = √(l² + w²). */
export function rectangleDiagonal(l: number, w: number): number {
  return hypotenuse(l, w);
}

// ───────────────────────── Triangles (construction) ─────────────────────────

/** Strict triangle inequality: a + b > c, a + c > b and b + c > a. */
export function isValidTriangle(a: number, b: number, c: number): boolean {
  return a > 0 && b > 0 && c > 0 && a + b > c && a + c > b && b + c > a;
}

export interface Pt {
  x: number;
  y: number;
}

export const dist = (p: Pt, q: Pt) => Math.hypot(p.x - q.x, p.y - q.y);
export const midpoint = (p: Pt, q: Pt): Pt => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });

/** Intersection points of two circles (0, 1 or 2 points). */
export function circleIntersections(c1: Pt, r1: number, c2: Pt, r2: number): Pt[] {
  const d = dist(c1, c2);
  if (d === 0 || d > r1 + r2 + 1e-9 || d < Math.abs(r1 - r2) - 1e-9) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a * a;
  const h = h2 > 0 ? Math.sqrt(h2) : 0;
  const mx = c1.x + (a * (c2.x - c1.x)) / d;
  const my = c1.y + (a * (c2.y - c1.y)) / d;
  if (h < 1e-9) return [{ x: mx, y: my }];
  const ox = (h * (c2.y - c1.y)) / d;
  const oy = (h * (c2.x - c1.x)) / d;
  return [
    { x: mx + ox, y: my - oy },
    { x: mx - ox, y: my + oy },
  ];
}

/** Angle at vertex B in triangle ABC, degrees (cosine rule). */
export function angleAt(a: Pt, b: Pt, c: Pt): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

/** Angle in degrees between two lines (0–90). */
export function angleBetweenLines(p1: Pt, p2: Pt, q1: Pt, q2: Pt): number {
  const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const b = Math.atan2(q2.y - q1.y, q2.x - q1.x);
  let d = Math.abs(((a - b) * 180) / Math.PI) % 180;
  if (d > 90) d = 180 - d;
  return d;
}

/** Distance from a point to the (infinite) line through a and b. */
export function pointLineDistance(p: Pt, a: Pt, b: Pt): number {
  return Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / dist(a, b);
}

/**
 * Where the line through p1, p2 crosses segment AB (as a point), or null if it
 * misses the segment.
 */
export function lineCrossesSegment(p1: Pt, p2: Pt, a: Pt, b: Pt): Pt | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = b.x - a.x;
  const d2y = b.y - a.y;
  const den = d1x * d2y - d1y * d2x;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((a.x - p1.x) * d2y - (a.y - p1.y) * d2x) / den;
  const u = ((a.x - p1.x) * d1y - (a.y - p1.y) * d1x) / den;
  if (u < -1e-9 || u > 1 + 1e-9) return null;
  return { x: p1.x + t * d1x, y: p1.y + t * d1y };
}

// ───────────────────────── Circles and compound shapes ─────────────────────────

export const radiusFromDiameter = (d: number) => d / 2;
export const diameterFromRadius = (r: number) => 2 * r;
export const circumference = (r: number) => 2 * Math.PI * r;
export const circleArea = (r: number) => Math.PI * r * r;
export const semicircleArea = (r: number) => circleArea(r) / 2;
export const rectangleArea = (l: number, w: number) => l * w;

/** Exact value written as rational + piCoeff·π (e.g. 48 + 8π). */
export interface PiExpr {
  rational: number;
  piCoeff: number;
}

export const piValue = (e: PiExpr) => e.rational + e.piCoeff * Math.PI;

/**
 * Rectangle (width w, height h) topped by a semicircle on the width.
 * The semicircle's diameter is the rectangle's width.
 */
export function compoundRectSemicircle(w: number, h: number) {
  if (!(w > 0 && h > 0)) throw new Error('Dimensions must be positive');
  const d = w;
  const r = d / 2;
  const rect = rectangleArea(w, h);
  const semiExact: PiExpr = { rational: 0, piCoeff: (r * r) / 2 };
  const totalExact: PiExpr = { rational: rect, piCoeff: (r * r) / 2 };
  return {
    d,
    r,
    rect,
    fullCircle: circleArea(r),
    semi: piValue(semiExact),
    total: piValue(totalExact),
    semiExact,
    totalExact,
  };
}

// ───────────────────────── Exact decimals (units, standard form) ─────────────────────────

/** A decimal number held exactly as sign · digits × 10^exp (digits has no leading zeros). */
export interface Dec {
  neg: boolean;
  digits: string; // e.g. "648"
  exp: number; // value = digits × 10^exp
}

/** Parses a plain decimal string like "64.8", "0.00035", "4800000", "-2.5". */
export function parseDec(s: string): Dec | null {
  const m = /^\s*(-)?(\d*)(?:\.(\d*))?\s*$/.exec(s.replace(/[ ,_]/g, '').replace(/ /g, ''));
  if (!m) return null;
  const intPart = m[2] ?? '';
  const frac = m[3] ?? '';
  if (!intPart && !frac) return null;
  let digits = (intPart + frac).replace(/^0+/, '');
  let exp = -frac.length;
  if (!digits) return { neg: false, digits: '0', exp: 0 };
  const trail = /0+$/.exec(digits);
  if (trail) {
    digits = digits.slice(0, -trail[0].length);
    exp += trail[0].length;
  }
  return { neg: !!m[1], digits, exp };
}

export function decFromNumber(n: number): Dec {
  if (!Number.isFinite(n)) throw new Error('decFromNumber: not finite');
  const s = n.toLocaleString('en-US', { useGrouping: false, maximumSignificantDigits: 15 });
  const d = parseDec(s);
  if (!d) throw new Error(`decFromNumber: cannot parse ${s}`);
  return d;
}

export const isZero = (d: Dec) => d.digits === '0';

/** Multiplies by 10^k exactly. */
export function shiftDec(d: Dec, k: number): Dec {
  return isZero(d) ? d : { ...d, exp: d.exp + k };
}

export function decEquals(a: Dec, b: Dec): boolean {
  if (isZero(a) && isZero(b)) return true;
  return a.neg === b.neg && a.digits === b.digits && a.exp === b.exp;
}

export function decToNumber(d: Dec): number {
  return (d.neg ? -1 : 1) * Number(`${d.digits}e${d.exp}`);
}

/** Plain decimal string, with optional thousands separators in the integer part. */
export function decToString(d: Dec, group = false): string {
  if (isZero(d)) return '0';
  let s: string;
  if (d.exp >= 0) s = d.digits + '0'.repeat(d.exp);
  else {
    const k = -d.exp;
    const padded = d.digits.padStart(k + 1, '0');
    s = `${padded.slice(0, padded.length - k)}.${padded.slice(padded.length - k)}`;
  }
  if (group) {
    const [ip, fp] = s.split('.');
    const g = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    s = fp !== undefined ? `${g}.${fp}` : g;
  }
  return (d.neg ? '-' : '') + s;
}

export interface StandardForm {
  coef: Dec; // 1 ≤ |coef| < 10
  exp: number;
}

/** Writes a non-zero exact decimal in standard form a × 10ⁿ with 1 ≤ |a| < 10. */
export function toStandardForm(d: Dec): StandardForm {
  if (isZero(d)) throw new Error('Zero has no standard form');
  const n = d.digits.length - 1 + d.exp; // power of ten of the leading digit
  return { coef: { neg: d.neg, digits: d.digits, exp: -(d.digits.length - 1) }, exp: n };
}

export function standardFormString(sf: StandardForm): string {
  return `${decToString(sf.coef)} × 10^${sf.exp}`;
}

/** Is 1 ≤ |a| < 10? */
export function isValidCoefficient(a: Dec): boolean {
  if (isZero(a)) return false;
  return a.digits.length - 1 + a.exp === 0;
}

/** How many places the decimal point moves to turn d into its standard-form coefficient (positive = moved left). */
export function decimalPlacesMoved(d: Dec): number {
  return toStandardForm(d).exp;
}

// ───────────────────────── Metric prefixes and mass ─────────────────────────

export interface Prefix {
  name: string;
  symbol: string;
  power: number;
}

export const PREFIXES: readonly Prefix[] = [
  { name: 'giga', symbol: 'G', power: 9 },
  { name: 'mega', symbol: 'M', power: 6 },
  { name: 'kilo', symbol: 'k', power: 3 },
  { name: 'hecto', symbol: 'h', power: 2 },
  { name: 'deka', symbol: 'da', power: 1 },
  { name: 'base unit', symbol: '', power: 0 },
  { name: 'deci', symbol: 'd', power: -1 },
  { name: 'centi', symbol: 'c', power: -2 },
  { name: 'milli', symbol: 'm', power: -3 },
  { name: 'micro', symbol: 'μ', power: -6 },
  { name: 'nano', symbol: 'n', power: -9 },
];

export function prefixByName(name: string): Prefix {
  const p = PREFIXES.find((x) => x.name === name);
  if (!p) throw new Error(`Unknown prefix ${name}`);
  return p;
}

/** Factor of a prefix as an exact decimal string, e.g. kilo → "1,000", micro → "0.000001". */
export function prefixFactorString(p: Prefix): string {
  return decToString({ neg: false, digits: '1', exp: p.power }, true);
}

/** Mass units as powers of ten of a gram. (1 tonne = 1,000 kg = 10⁶ g.) */
export const MASS_UNITS = {
  t: { name: 'tonnes', singular: 'tonne', power: 6 },
  kg: { name: 'kilograms', singular: 'kilogram', power: 3 },
  g: { name: 'grams', singular: 'gram', power: 0 },
  mg: { name: 'milligrams', singular: 'milligram', power: -3 },
} as const;
export type MassUnit = keyof typeof MASS_UNITS;

/** Length units as powers of ten of a metre. */
export const LENGTH_UNITS = {
  km: { name: 'kilometres', power: 3 },
  m: { name: 'metres', power: 0 },
  cm: { name: 'centimetres', power: -2 },
  mm: { name: 'millimetres', power: -3 },
  'μm': { name: 'micrometres', power: -6 },
  nm: { name: 'nanometres', power: -9 },
} as const;
export type LengthUnit = keyof typeof LENGTH_UNITS;

/** Converts an exact decimal between two units given as powers of ten. */
export function convertPower(value: Dec, fromPower: number, toPower: number): Dec {
  return shiftDec(value, fromPower - toPower);
}

export function convertMass(value: Dec, from: MassUnit, to: MassUnit): Dec {
  return convertPower(value, MASS_UNITS[from].power, MASS_UNITS[to].power);
}

export function convertLength(value: Dec, from: LengthUnit, to: LengthUnit): Dec {
  return convertPower(value, LENGTH_UNITS[from].power, LENGTH_UNITS[to].power);
}

/** "1,000" for factor 10³ — the number to multiply or divide by between two units. */
export function conversionFactor(fromPower: number, toPower: number): { op: 'multiply' | 'divide'; factor: string; power: number } {
  const k = fromPower - toPower;
  return {
    op: k >= 0 ? 'multiply' : 'divide',
    factor: decToString({ neg: false, digits: '1', exp: Math.abs(k) }, true),
    power: Math.abs(k),
  };
}

// ───────────────────────── Rounding / formatting ─────────────────────────

export function roundTo(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
}

/** Formats a number to at most dp decimal places without trailing zeros. */
export function fmt(x: number, dp = 2): string {
  const r = roundTo(x, dp);
  return Number.isInteger(r) ? String(r) : r.toFixed(dp).replace(/0+$/, '').replace(/\.$/, '');
}

/** Formats with exactly dp decimal places. */
export const fixed = (x: number, dp = 2) => roundTo(x, dp).toFixed(dp);

/** Exact π expression as LaTeX, e.g. {48, 8} → "48 + 8\pi". */
export function piTex(e: PiExpr): string {
  const coef = e.piCoeff === 1 ? '' : fmt(e.piCoeff, 6);
  const piPart = e.piCoeff === 0 ? '' : `${coef}\\pi`;
  if (!e.rational) return piPart || '0';
  if (!piPart) return fmt(e.rational, 6);
  return `${fmt(e.rational, 6)} + ${piPart}`;
}

/** Surd as LaTeX, e.g. 63 → "3\sqrt{7}". */
export function surdTex(n: number): string {
  const { k, m } = simplifySurd(n);
  if (m === 1) return String(k);
  return `${k === 1 ? '' : k}\\sqrt{${m}}`;
}
