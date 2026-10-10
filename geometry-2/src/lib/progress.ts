import { LESSONS, TOPICS, lessonById } from '../content';
import type { TopicId } from '../content/types';
import { emptyLesson, emptySkill, store, type Data, type LessonProgress, type SkillStats } from './store';

export interface Outcome {
  skill: string;
  /** All shown steps right first time with no hints. */
  firstTry: boolean;
  /** Needed the full working shown on at least one step. */
  revealed: boolean;
  wrong: number;
  hints: number;
  wrongAnswers: string[];
}

export const outcomeScore = (o: Outcome) => (o.revealed ? 0 : o.firstTry ? 1 : 0.5);

/** 0..1 estimate, or null if never practised. Recent results count most; few attempts lower the estimate. */
export function confidence(s: SkillStats | undefined): number | null {
  if (!s || s.attempted === 0 || s.recent.length === 0) return null;
  const r = s.recent.slice(-6);
  let w = 0;
  let t = 0;
  r.forEach((x, i) => {
    const wi = i + 1;
    w += wi;
    t += wi * x;
  });
  return (t / w) * Math.min(1, s.attempted / 4);
}

export type Status = 'not-started' | 'learning' | 'practising' | 'confident';
export const STATUS_LABEL: Record<Status, string> = { 'not-started': 'Not started', learning: 'Learning', practising: 'Practising', confident: 'Confident' };

export function lessonStatus(d: Data, id: string): Status {
  const l = d.lessons[id];
  const s = d.skills[id];
  const c = confidence(s);
  if (l?.masteryPassed && (c ?? 0) >= 0.6) return 'confident';
  if (s && s.attempted > 0) return 'practising';
  if (l?.opened) return 'learning';
  return 'not-started';
}

export function topicStatus(d: Data, t: TopicId): Status {
  const ids = TOPICS.find((x) => x.id === t)!.lessons;
  const st = ids.map((id) => lessonStatus(d, id));
  if (st.every((s) => s === 'confident')) return 'confident';
  if (st.some((s) => s === 'practising' || s === 'confident')) return 'practising';
  if (st.some((s) => s === 'learning')) return 'learning';
  return 'not-started';
}

/**
 * How often a skill should come up in mixed practice. Untried = 1; the weaker
 * the recent results, the higher the weight (up to 6), so weak skills repeat
 * more and more until they're answered right first time consistently.
 */
export function practiceWeight(d: Data, id: string): number {
  const s = d.skills[id];
  const c = confidence(s);
  if (c === null) return 1;
  const lastWasShown = s.recent[s.recent.length - 1] === 0 ? 1 : 0;
  return 0.6 + 4 * (1 - c) + lastWasShown;
}

/** Skills going well: practised enough and mostly right first time. */
export function strongSkills(d: Data): { id: string; conf: number }[] {
  return Object.entries(d.skills)
    .filter(([id, s]) => lessonById(id) && s.attempted >= 2)
    .map(([id, s]) => ({ id, conf: confidence(s) ?? 0 }))
    .filter((x) => x.conf >= 0.7)
    .sort((a, b) => b.conf - a.conf);
}

/** Skills that need more practice, weakest first. */
export function weakSkills(d: Data): { id: string; conf: number }[] {
  return Object.entries(d.skills)
    .filter(([id, s]) => lessonById(id) && s.attempted > 0)
    .map(([id, s]) => ({ id, conf: confidence(s) ?? 0, s }))
    .filter((x) => x.conf < 0.7 || x.s.recent.slice(-3).some((r) => r === 0))
    .sort((a, b) => a.conf - b.conf)
    .map(({ id, conf }) => ({ id, conf }));
}

export function totalAnswered(d: Data) {
  return Object.values(d.skills).reduce((n, s) => n + s.attempted, 0);
}

/** Next lesson to suggest: first in course order not yet confident, respecting prerequisites where possible. */
export function suggestedLesson(d: Data): string {
  for (const l of LESSONS) {
    if (lessonStatus(d, l.id) === 'confident') continue;
    const unmetPrereq = (l.prereq ?? []).find((p) => lessonStatus(d, p) === 'not-started');
    return unmetPrereq ?? l.id;
  }
  return weakSkills(d)[0]?.id ?? LESSONS[0].id;
}

export function lessonP(d: Data, id: string): LessonProgress {
  return d.lessons[id] ?? emptyLesson();
}

export function updateLesson(id: string, fn: (l: LessonProgress) => void) {
  store.update((d) => {
    const l = d.lessons[id] ?? emptyLesson();
    fn(l);
    d.lessons[id] = l;
    d.lastLesson = id;
  });
}

/** Records one question's outcome; returns any badges newly earned. */
export function recordOutcome(o: Outcome): string[] {
  const before = new Set(store.data.badges.map((b) => b.id));
  const prevRecent = store.data.skills[o.skill]?.recent ?? [];
  store.update((d) => {
    const s = d.skills[o.skill] ?? emptySkill();
    s.attempted += 1;
    if (o.revealed) s.revealed += 1;
    else if (o.firstTry) s.firstTry += 1;
    else s.afterHelp += 1;
    s.wrongAttempts += o.wrong;
    s.hints += o.hints;
    s.recent = [...s.recent, outcomeScore(o)].slice(-10);
    s.last = new Date().toISOString();
    s.wrong = [...s.wrong, ...o.wrongAnswers].slice(-5);
    d.skills[o.skill] = s;
    d.stars += o.revealed ? 0 : o.firstTry ? 2 : 1;
  });
  const extra: string[] = [];
  if (!o.revealed && o.hints >= 2) extra.push('careful-thinker');
  if (o.firstTry && prevRecent.length && prevRecent[prevRecent.length - 1] === 0) extra.push('comeback');
  return awardBadges(extra).filter((b) => !before.has(b));
}

/** Re-checks every badge rule (plus event badges passed in) and stores new ones. */
export function awardBadges(events: string[] = []): string[] {
  const d = store.data;
  const has = new Set(d.badges.map((b) => b.id));
  const earned = BADGES.filter((b) => !has.has(b.id) && (events.includes(b.id) || b.test(d))).map((b) => b.id);
  if (earned.length) store.update((x) => earned.forEach((id) => x.badges.push({ id, at: new Date().toISOString() })));
  return earned;
}

const mastered = (d: Data, ...ids: string[]) => ids.every((id) => d.lessons[id]?.masteryPassed);

export interface BadgeDef {
  id: string;
  name: string;
  how: string;
  icon: string;
  test: (d: Data) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: 'first-steps', name: 'First Steps', how: 'Answer your first question', icon: '👣', test: (d) => Object.values(d.skills).some((s) => s.attempted > 0) },
  { id: 'angle-explorer', name: 'Angle Explorer', how: 'Complete the first three angle lessons’ worked examples', icon: '📐', test: (d) => ['interior-sum', 'regular-interior', 'exterior'].every((id) => d.lessons[id]?.guidedDone) },
  { id: 'polygon-pro', name: 'Polygon Pro', how: 'Pass the mastery checks for interior, regular and exterior angles', icon: '⬟', test: (d) => mastered(d, 'interior-sum', 'regular-interior', 'exterior') },
  { id: 'construction-creator', name: 'Construction Creator', how: 'Construct a triangle and a perpendicular bisector', icon: '🧭', test: (d) => (d.skills['construct-triangle']?.attempted ?? 0) > 0 && (d.skills['perp-bisector']?.attempted ?? 0) > 0 },
  { id: 'symmetry-spotter', name: 'Symmetry Spotter', how: 'Pass the planes of symmetry mastery check', icon: '🧊', test: (d) => mastered(d, 'cube-symmetry') },
  { id: 'pythagoras-pro', name: 'Pythagoras Pro', how: 'Pass the mastery checks for finding the hypotenuse and a shorter side', icon: '📏', test: (d) => mastered(d, 'find-hyp', 'find-short') },
  { id: 'circle-detective', name: 'Circle Detective', how: 'Pass the circumference and area mastery checks', icon: '🔍', test: (d) => mastered(d, 'circumference', 'area') },
  { id: 'compound-champion', name: 'Compound Champion', how: 'Pass the compound shapes mastery check', icon: '🏆', test: (d) => mastered(d, 'compound') },
  { id: 'metric-master', name: 'Metric Master', how: 'Pass the mass conversion mastery check', icon: '⚖️', test: (d) => mastered(d, 'mass') },
  { id: 'standard-form-star', name: 'Standard Form Star', how: 'Pass both standard form mastery checks', icon: '⭐', test: (d) => mastered(d, 'standard-form', 'units-sf') },
  { id: 'careful-thinker', name: 'Careful Thinker', how: 'Solve a question after using hints', icon: '💡', test: () => false },
  { id: 'comeback', name: 'Comeback', how: 'Get a skill right first time after finding it tricky', icon: '🌱', test: () => false },
  { id: 'exam-ready', name: 'Exam Ready', how: 'Finish a Mixed Exam Practice', icon: '📝', test: (d) => d.examsDone > 0 },
  { id: 'all-rounder', name: 'All-Rounder', how: 'Reach “Confident” in every topic', icon: '🌟', test: (d) => TOPICS.every((t) => topicStatus(d, t.id) === 'confident') },
];

export const badgeById = (id: string) => BADGES.find((b) => b.id === id);
