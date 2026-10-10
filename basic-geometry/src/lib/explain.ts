/**
 * Review engine helpers: explanations for mistakes.
 * Explanations are generated from the formula database (shape, category,
 * units) plus a few hand-written contrasts for classic confusions, so every
 * mistake gets an explanation specific to the two formulas involved.
 */
import { getFormula } from '../data/formulas';
import { CATEGORIES, getShape } from '../data/shapes';
import type { Formula } from '../data/types';

const UNIT_WORD = { 1: 'linear units (e.g. cm)', 2: 'square units (e.g. cm²)', 3: 'cubic units (e.g. cm³)' } as const;

export function shapeName(f: Formula): string {
  return (getShape(f.shapeId)?.name ?? f.shapeId).toLowerCase();
}

const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

/** "the surface area of a cylinder" */
export function describe(f: Formula): string {
  const s = shapeName(f);
  return `the ${CATEGORIES[f.category].label.toLowerCase()} of ${article(s)} ${s}`;
}

/** Hand-written contrasts keyed "questionId|chosenId". Either order may be listed once. */
const CONTRASTS: Record<string, string> = {
  'circle-area|circle-circumference':
    'Area measures the space inside a circle (πr², square units). Circumference measures the distance around it (2πr, linear units).',
  'square-area|square-perimeter':
    'Area measures the surface enclosed by the square (s²). Perimeter measures the total distance around its boundary (4s).',
  'rectangle-area|rectangle-perimeter':
    'Area multiplies length by width to cover the inside. Perimeter adds the four edges around the outside.',
  'cylinder-volume|cylinder-surface-area':
    'Volume measures the space inside a cylinder. Total surface area is the combined area of its curved surface and two circular ends.',
  'cube-volume|cube-surface-area':
    'Volume (s³) counts the unit cubes inside. Surface area (6s²) adds the areas of the six square faces.',
  'sphere-volume|sphere-surface-area':
    'Volume (⁴⁄₃πr³, cubed) is the space inside the ball. Surface area (4πr², squared) is the area of its skin.',
  'cone-volume|cylinder-volume':
    'A cone holds only one third as much as a cylinder with the same base and height — look for the ⅓.',
  'square-pyramid-volume|cube-volume':
    'A pyramid holds one third of the prism with the same base and height, so its formula includes ⅓ and a separate height h.',
  'square-pyramid-volume|rectangular-prism-volume':
    'A pyramid holds one third of the prism with the same base and height — look for the ⅓.',
  'cone-surface-area|cylinder-surface-area':
    'A cone has only one circular face (πr²), and its curved side uses the slant height l (πrl).',
  'triangle-area|parallelogram-area':
    'A triangle is half of a parallelogram with the same base and height, so its area formula includes ½.',
  'triangle-area|rectangle-area':
    'A triangle is half of a rectangle with the same base and height, so its area formula includes ½.',
  'trapezoid-area|parallelogram-area':
    'A trapezoid has two different parallel sides, so the formula averages them: ½(a + b) × h.',
  'triangle-area|triangle-perimeter':
    'The area uses the base and perpendicular height. The perimeter adds the three side lengths instead.',
  'cone-volume|cone-surface-area':
    'Volume uses the vertical height h; surface area uses the slant height l along the sloping side.',
  'square-pyramid-volume|square-pyramid-surface-area':
    'Volume uses the vertical height h; surface area uses the slant height l of each triangular face.',
  'prism-volume|prism-surface-area':
    'Volume is base area × height (B × h). Surface area adds both ends (2B) and the sides (Ph).',
};

function contrast(a: string, b: string): string | undefined {
  return CONTRASTS[`${a}|${b}`] ?? CONTRASTS[`${b}|${a}`];
}

/** Letters a formula uses (π excluded), e.g. ["l", "w"]. */
export function formulaLetters(f: Formula): string[] {
  const out: string[] = [];
  for (const v of f.variables)
    for (const part of v.symbol.split(',')) {
      const t = part.trim();
      if (t && t !== '\\pi' && !out.includes(t)) out.push(t);
    }
  return out;
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** "The diagram labels this rectangle with l and w, but the selected formula uses a and b." — or null if letters fit. */
export function letterMismatch(q: Formula, c: Formula): string | null {
  const ql = formulaLetters(q);
  const extra = formulaLetters(c).filter((x) => !ql.includes(x));
  if (!extra.length) return null;
  return `The diagram labels this ${shapeName(q)} with ${list(ql)}, but the selected formula uses ${list(extra)}, which ${extra.length === 1 ? 'isn’t' : 'aren’t'} on the diagram.`;
}

export interface MistakeExplanation {
  /** What the wrongly chosen formula actually calculates. */
  chosenIs: string;
  /** Guidance shown during the game — never reveals the correct formula. */
  inGame: string;
  /** Full explanation shown on the review screen (correct formula shown separately). */
  review: string;
}

export function explainMistake(questionId: string, chosenId: string): MistakeExplanation {
  const q = getFormula(questionId);
  const c = getFormula(chosenId);
  if (!q || !c) {
    return { chosenIs: 'an unknown formula', inGame: 'That formula does not match. Try another.', review: 'That formula does not match this question.' };
  }
  const qCat = CATEGORIES[q.category];
  const cCat = CATEGORIES[c.category];
  const sameShape = q.shapeId === c.shapeId;
  const chosenIs = describe(c);

  const parts: string[] = [];
  if (sameShape) {
    parts.push(`The selected formula calculates ${chosenIs}, which measures ${cCat.measures}.`);
    parts.push(`${qCat.label} measures ${qCat.measures}.`);
  } else if (q.category === c.category) {
    parts.push(`The selected formula is the ${cCat.label.toLowerCase()} formula for ${article(shapeName(c))} ${shapeName(c)}, not ${article(shapeName(q))} ${shapeName(q)}.`);
  } else {
    parts.push(`The selected formula calculates ${chosenIs}.`);
  }
  if (qCat.unitPower !== cCat.unitPower) {
    parts.push(`Check the units: ${qCat.label.toLowerCase()} is measured in ${UNIT_WORD[qCat.unitPower]}, but the selected formula gives ${UNIT_WORD[cCat.unitPower]}.`);
  }
  const specific = contrast(q.id, c.id);

  const hint = q.hints?.[0];
  const letters = letterMismatch(q, c);
  const inGame = [
    `Not quite — that formula gives ${chosenIs}.`,
    letters ?? `You need ${describe(q)}.`,
    hint ? `Hint: ${hint}` : qCat.unitPower !== cCat.unitPower ? `Think about the units: ${UNIT_WORD[qCat.unitPower]}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const review = [letters, specific ?? parts.join(' '), q.explanation].filter(Boolean).join(' ');
  return { chosenIs, inGame, review };
}
