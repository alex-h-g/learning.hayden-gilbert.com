import { shuffle, type Rng } from '../lib/random';
import type { Option } from './types';

export type { Rng };

export const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
export const pick = <T>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];

/** Shuffle answer options so the right answer isn't always in the same place. */
export function opts(rng: Rng, options: Option[]): Option[] {
  // Drop duplicate labels (e.g. 360 ÷ 4 twice for a square), always keeping the correct option.
  const seen = new Set(options.filter((o) => o.correct).map((o) => o.label));
  const unique = options.filter((o) => o.correct || (!seen.has(o.label) && (seen.add(o.label), true)));
  return shuffle(unique, rng);
}

/** Option builder: ok("label") / no("label", "feedback"). */
export const ok = (id: string, label: string, feedback?: string): Option => ({ id, label, correct: true, feedback });
export const no = (id: string, label: string, feedback?: string, highlight?: string): Option => ({ id, label, correct: false, feedback, highlight });

/** Degrees in LaTeX, e.g. deg(70) → "70^\circ". */
export const deg = (x: number | string) => `${x}^\\circ`;

/** Number with thin-space thousands separators for LaTeX. */
export const texNum = (s: string | number) => String(s).replace(/,/g, '{,}');

/** Distinct wrong numeric values near the answer, for multiple choice. */
export function distractors(rng: Rng, answer: number, candidates: number[], n = 3): number[] {
  const seen = new Set<number>([answer]);
  const out: number[] = [];
  for (const c of shuffle(candidates, rng)) {
    if (out.length >= n) break;
    if (!Number.isFinite(c) || c <= 0 || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

/** Seeded id for a generated problem. */
export const pid = (lesson: string, rng: Rng) => `${lesson}-${Math.floor(rng() * 1e9).toString(36)}`;
