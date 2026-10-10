import { decEquals, isValidCoefficient, parseDec, toStandardForm, type Dec, type StandardForm } from './core';
import { parseAnswer } from './parse';

/** Expected numeric answer for a question step. */
export interface NumberAnswer {
  /** The true value (computed from the question data by src/math/core.ts). */
  value: number;
  /**
   * Accepted absolute difference for a typed decimal. 0 means the decimal must
   * be exact (e.g. 1080). Exact forms using π or √ are always compared exactly.
   */
  tol: number;
  /** How the answer should be given, shown in the prompt and in feedback, e.g. "to 2 decimal places". */
  rounding?: string;
  /** If true, an exact π/√ form is accepted; otherwise only a decimal (e.g. "how many sides"). */
  allowExact?: boolean;
}

export type CheckResult =
  | { status: 'empty' }
  | { status: 'invalid'; message: string }
  | { status: 'correct'; note?: string }
  | { status: 'close'; message: string }
  | { status: 'wrong'; given: number };

const EXACT_EPS = (v: number) => 1e-9 * Math.max(1, Math.abs(v));

/** Tolerance for "give your answer to dp decimal places" (a hair over half a unit, for typed rounding). */
export const dpTol = (dp: number) => 0.5 * 10 ** -dp + 1e-9;

/**
 * Tolerance for π answers to 2 dp. Also accepts working with π ≈ 3.14 within
 * 0.06% of the true value, which is common in schools.
 */
export const piTol = (v: number) => Math.max(dpTol(2) + 0.006, 0.0006 * Math.abs(v));

export function checkNumber(input: string, ans: NumberAnswer): CheckResult {
  const r = parseAnswer(input);
  if (!r.ok) {
    if (r.reason === 'empty') return { status: 'empty' };
    return {
      status: 'invalid',
      message: 'I couldn’t read that as a number. Try something like 12, 7.94, 14π or √63.',
    };
  }
  const p = r.parsed;
  const diff = Math.abs(p.value - ans.value);
  if (p.exact) {
    if (!ans.allowExact) {
      if (diff <= EXACT_EPS(ans.value)) return { status: 'close', message: 'That’s the right value — but this one needs an ordinary number, not π or √.' };
      return { status: 'wrong', given: p.value };
    }
    if (diff <= EXACT_EPS(ans.value)) return { status: 'correct', note: 'exact' };
    // e.g. "3.14 × 64": partly exact working — judge as a decimal below.
    if (!p.usesPi && !p.usesRoot) return { status: 'wrong', given: p.value };
  }
  if (diff <= EXACT_EPS(ans.value)) return { status: 'correct' };
  if (ans.tol > 0 && diff <= ans.tol) return { status: 'correct', note: 'rounded' };
  // Near-misses that look like a rounding slip.
  if (ans.tol > 0 && diff <= Math.max(ans.tol * 12, 0.06) && diff <= 0.02 * Math.abs(ans.value) + 0.06) {
    return { status: 'close', message: `Very close! Check your rounding${ans.rounding ? ` — ${ans.rounding}` : ''}.` };
  }
  return { status: 'wrong', given: p.value };
}

/** Learner's standard-form entry: coefficient text and exponent text. */
export function checkStandardForm(coefText: string, expText: string, target: StandardForm): CheckResult {
  if (!coefText.trim() && !expText.trim()) return { status: 'empty' };
  if (!coefText.trim()) return { status: 'invalid', message: 'Fill in the number in front of × 10.' };
  if (!expText.trim()) return { status: 'invalid', message: 'Fill in the power of ten.' };
  const coef = parseDec(coefText);
  const expStr = expText.replace(/[−–]/g, '-').trim();
  if (!coef) return { status: 'invalid', message: 'The first box needs a decimal number, like 3.5.' };
  if (!/^[+-]?\d+$/.test(expStr)) return { status: 'invalid', message: 'The power of ten must be a whole number, like 7 or −7.' };
  const exp = Number(expStr);
  // Value check: coef × 10^exp vs target, exactly.
  const asSF = toStandardForm(coef as Dec);
  const sameValue = decEquals(asSF.coef, target.coef) && asSF.exp + exp === target.exp;
  if (!sameValue) {
    if (decEquals(asSF.coef, target.coef) && asSF.exp + exp === -target.exp) {
      return { status: 'close', message: 'The digits are right, but check the sign of the power: is the number big (positive power) or small (negative power)?' };
    }
    return { status: 'wrong', given: Number(`${coefText}e${exp}`) };
  }
  if (!isValidCoefficient(coef)) {
    return { status: 'close', message: 'That has the right value, but in standard form the first number must be at least 1 and less than 10.' };
  }
  return { status: 'correct' };
}

/** Exact decimal answer (unit conversions): value must match exactly. */
export function checkExactDecimal(input: string, target: Dec): CheckResult {
  if (!input.trim()) return { status: 'empty' };
  const cleaned = input.trim().replace(/\s*(kg|mg|g|t|tonnes?|km|cm|mm|m|μm|nm)$/i, '');
  // Allow "6.48 × 10^4" style too, via the general parser.
  const d = parseDec(cleaned);
  if (!d) {
    const r = parseAnswer(cleaned);
    if (!r.ok) return { status: 'invalid', message: 'I couldn’t read that as a number. Try something like 64800 or 64,800.' };
    const t = Number(`${target.digits}e${target.exp}`) * (target.neg ? -1 : 1);
    return Math.abs(r.parsed.value - t) <= EXACT_EPS(t) ? { status: 'correct' } : { status: 'wrong', given: r.parsed.value };
  }
  if (decEquals(d, target)) return { status: 'correct' };
  const sfGiven = d.digits === '0' ? null : toStandardForm(d);
  const sfTarget = toStandardForm(target);
  if (sfGiven && decEquals(sfGiven.coef, sfTarget.coef)) {
    return { status: 'close', message: 'The digits are right, but the decimal point is in the wrong place. How many places should it move?' };
  }
  return { status: 'wrong', given: Number(`${d.digits}e${d.exp}`) };
}
