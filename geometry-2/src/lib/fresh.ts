import type { Difficulty, LessonDef } from '../content/types';
import { seeded } from './random';

/**
 * Picks a seed whose question the learner hasn't seen recently, so repeated
 * practice never shows the exact same question twice in a row. Remembered for
 * this browser tab only (sessionStorage), never sent anywhere.
 */
const KEY = 'geometry-2:recent-questions';
const LIMIT = 80;
let recent: string[] = [];
try {
  recent = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
  if (!Array.isArray(recent)) recent = [];
} catch {
  recent = [];
}

const fingerprint = (lesson: LessonDef, seed: number, d: Difficulty) => {
  const p = lesson.generate(seeded(seed), d);
  // The wording is what a learner notices, so compare that (not the drawing).
  return `${lesson.id}|${p.question}`;
};

export function freshSeed(lesson: LessonDef, d: Difficulty): number {
  // Try several candidates; take an unseen one, otherwise the one seen longest ago.
  let best = { seed: 0, fp: '', age: -2 };
  for (let i = 0; i < 16; i++) {
    const seed = Math.floor(Math.random() * 2 ** 31);
    const fp = fingerprint(lesson, seed, d);
    const at = recent.lastIndexOf(fp);
    const age = at < 0 ? Infinity : recent.length - at;
    if (age > best.age) best = { seed, fp, age };
    if (age === Infinity) break;
  }
  remember(best.fp);
  return best.seed;
}

function remember(fp: string) {
  recent = [...recent, fp].slice(-LIMIT);
  try {
    sessionStorage.setItem(KEY, JSON.stringify(recent));
  } catch {
    /* storage unavailable: memory only */
  }
}
