/**
 * Practice engine: builds rounds (questions + formula choices) from data.
 * Pure functions — pass an Rng for deterministic tests.
 */
import { FORMULAS, getFormula } from '../data/formulas';
import { getLevel, getMode, LEVELS, poolForMode, type ModeId } from '../data/levels';
import { getShape } from '../data/shapes';
import type { Formula } from '../data/types';
import { accuracy, type FormulaStats } from './historyTypes';
import { shuffle, weightedSample, type Rng } from './random';

export interface Round {
  mode: ModeId;
  /** Level number for 'levels' mode; difficulty used for fill in 'mistakes'. */
  level: number | null;
  questionIds: string[];
  optionIds: string[];
  /** For 'mistakes' mode: how many questions came from recorded mistakes. */
  fromMistakes: number;
}

export interface RoundRequest {
  mode: ModeId;
  level?: number;
  stats?: Record<string, FormulaStats>;
  rng?: Rng;
  /** Question IDs from the previous round of the same mode — avoided where possible for variety. */
  avoid?: string[];
}

/** Choose n questions with distinct expressions, optionally preferring same-shape pairs. */
export function pickQuestions(pool: string[], n: number, preferSameShape: boolean, rng: Rng, avoid: string[] = []): string[] {
  const valid = unique(pool.filter((id) => getFormula(id)));
  // Prefer formulas not asked last round, but fall back if the pool is small.
  const fresh = valid.filter((id) => !avoid.includes(id));
  const base = fresh.length >= n ? fresh : valid;
  const chosen: string[] = [];

  if (preferSameShape) {
    const byShape = new Map<string, string[]>();
    for (const id of base) {
      const s = getFormula(id)!.shapeId;
      byShape.set(s, [...(byShape.get(s) ?? []), id]);
    }
    const pairShapes = shuffle([...byShape.values()].filter((ids) => ids.length >= 2), rng);
    // One or two same-shape pairs per round (e.g. cone volume AND cone surface area).
    const maxPairs = Math.min(Math.floor(n / 2), 1 + (rng() < 0.5 ? 1 : 0));
    for (const ids of pairShapes.slice(0, maxPairs)) {
      chosen.push(...shuffle(ids, rng).slice(0, 2));
    }
  }
  for (const id of shuffle(base, rng)) {
    if (chosen.length >= n) break;
    if (!chosen.includes(id) && !sameTex(id, chosen)) chosen.push(id);
  }
  // Top up from the full pool if the "fresh" subset was too small.
  for (const id of shuffle(valid, rng)) {
    if (chosen.length >= n) break;
    if (!chosen.includes(id) && !sameTex(id, chosen)) chosen.push(id);
  }
  return shuffle(chosen, rng);
}

/**
 * Add distractors: favour formulas easily confused with the questions —
 * the other formula for the same shape, then the same category for other
 * shapes — with some randomness so rounds vary. Every option is unique.
 */
export function pickOptions(questionIds: string[], optionCount: number, rng: Rng, candidatePool: Formula[] = FORMULAS): string[] {
  const qs = questionIds.map((id) => getFormula(id)!);
  const candidates = candidatePool.filter((f) => !questionIds.includes(f.id));
  const scored = candidates.map((f) => {
    let score = 0;
    if (qs.some((q) => q.shapeId === f.shapeId)) score += 3;
    if (qs.some((q) => q.category === f.category)) score += 2;
    if (qs.some((q) => getShape(q.shapeId)?.dimension === getShape(f.shapeId)?.dimension)) score += 1;
    return { id: f.id, score: score + rng() * 2.5 };
  });
  scored.sort((a, b) => b.score - a.score);
  const options = [...questionIds];
  for (const { id } of scored) {
    if (options.length >= Math.max(optionCount, questionIds.length)) break;
    if (!sameTex(id, options)) options.push(id);
  }
  return shuffle(options, rng);
}

/** Weight for 'Practise My Mistakes': weaker and more recent mistakes come up more often. */
export function mistakeWeight(s: FormulaStats, now = Date.now()): number {
  if (s.incorrectAttempts <= 0) return 0;
  const acc = accuracy(s) ?? 0;
  let w = 1 + s.incorrectAttempts + s.sessionsWithMistakes + (1 - acc) * 4;
  if (s.lastIncorrectAt) {
    const days = (now - Date.parse(s.lastIncorrectAt)) / 86_400_000;
    if (Number.isFinite(days)) w += Math.max(0, 3 - days / 3); // bonus fades over ~9 days
  }
  if (s.mostRecentOutcome === 'first-try') w *= 0.5; // recently got it right — still shows, less often
  return w;
}

export function mistakeFormulaIds(stats: Record<string, FormulaStats>): string[] {
  return Object.values(stats)
    .filter((s) => s.incorrectAttempts > 0 && getFormula(s.id))
    .map((s) => s.id);
}

export function generateRound(req: RoundRequest): Round {
  const rng = req.rng ?? Math.random;
  const avoid = req.avoid ?? [];

  if (req.mode === 'levels') {
    const level = getLevel(req.level ?? 1) ?? LEVELS[0];
    const questionIds = pickQuestions(level.pool, level.pairs, level.preferSameShapePairs, rng, avoid);
    return { mode: 'levels', level: level.number, questionIds, optionIds: pickOptions(questionIds, level.optionCount, rng), fromMistakes: 0 };
  }

  const mode = getMode(req.mode)!;

  if (req.mode === 'mistakes') {
    const level = getLevel(req.level ?? LEVELS.length) ?? LEVELS[LEVELS.length - 1];
    const stats = req.stats ?? {};
    const mistakes = mistakeFormulaIds(stats);
    // With only a few recorded mistakes, leave room for one fresh formula so the
    // round never repeats exactly; with many, sample by weight (no fixed top 4).
    const maxFromMistakes = mistakes.length <= mode.pairs ? Math.max(0, Math.min(mistakes.length, mode.pairs - 1)) : mode.pairs;
    const preferred = mistakes.filter((id) => !avoid.includes(id));
    const ordered = preferred.length >= maxFromMistakes ? preferred : mistakes;
    const picked = weightedSample(ordered, (id) => mistakeWeight(stats[id]), maxFromMistakes, rng);
    const fillPool = FORMULAS.filter((f) => f.difficulty <= level.number).map((f) => f.id);
    const fill = pickQuestions(fillPool.filter((id) => !picked.includes(id)), mode.pairs, false, rng, avoid)
      .filter((id) => !sameTex(id, picked));
    const questionIds = shuffle([...picked, ...fill].slice(0, mode.pairs), rng);
    return { mode: 'mistakes', level: level.number, questionIds, optionIds: pickOptions(questionIds, mode.optionCount, rng), fromMistakes: picked.length };
  }

  const pool = poolForMode(req.mode);
  const questionIds = pickQuestions(pool, mode.pairs, req.mode === '3d' || req.mode === 'mixed-2d', rng, avoid);
  // Keep distractors within the mode's own topic where possible (e.g. only 3D in 3D mode).
  const topical = FORMULAS.filter(mode.filter);
  const candidatePool = topical.length >= mode.optionCount ? topical : FORMULAS;
  return { mode: req.mode, level: null, questionIds, optionIds: pickOptions(questionIds, mode.optionCount, rng, candidatePool), fromMistakes: 0 };
}

function unique<T>(a: T[]): T[] {
  return [...new Set(a)];
}

function sameTex(id: string, others: string[]): boolean {
  const t = normalise(getFormula(id)?.tex ?? id);
  return others.some((o) => normalise(getFormula(o)?.tex ?? o) === t);
}

const normalise = (tex: string) => tex.replace(/\s+/g, '');
