/**
 * Learner progress, saved only in this browser (localStorage key below).
 * Nothing is ever sent anywhere. If storage is unavailable the app keeps
 * working for this visit with an in-memory copy.
 */
import { useSyncExternalStore } from 'react';

export const STORAGE_KEY = 'geometry-2:history:v1';

export interface SkillStats {
  attempted: number;
  firstTry: number;
  afterHelp: number;
  revealed: number;
  wrongAttempts: number;
  hints: number;
  /** Last 10 outcomes: 1 first try, 0.5 after help, 0 needed the answer shown. */
  recent: number[];
  last: string | null;
  /** Last few incorrect answers typed or chosen. */
  wrong: string[];
}

export interface LessonProgress {
  opened: boolean;
  introSeen: boolean;
  guidedDone: boolean;
  practiceDone: number;
  masteryBest: number; // 0..1
  masteryPassed: boolean;
}

export interface Badge {
  id: string;
  at: string;
}

export interface Data {
  v: 1;
  name: string | null;
  welcomed: boolean;
  stars: number;
  badges: Badge[];
  skills: Record<string, SkillStats>;
  lessons: Record<string, LessonProgress>;
  examBest: number | null; // fraction 0..1
  examsDone: number;
  lastLesson: string | null;
}

export const emptyData = (): Data => ({ v: 1, name: null, welcomed: false, stars: 0, badges: [], skills: {}, lessons: {}, examBest: null, examsDone: 0, lastLesson: null });

export const emptySkill = (): SkillStats => ({ attempted: 0, firstTry: 0, afterHelp: 0, revealed: 0, wrongAttempts: 0, hints: 0, recent: [], last: null, wrong: [] });
export const emptyLesson = (): LessonProgress => ({ opened: false, introSeen: false, guidedDone: false, practiceDone: 0, masteryBest: 0, masteryPassed: false });

const num = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : d);
const bool = (x: unknown) => x === true;
const str = (x: unknown) => (typeof x === 'string' ? x : null);

/** Sanitises anything read from storage; malformed data never crashes the app. */
export function sanitise(raw: unknown): Data {
  const d = emptyData();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  d.name = str(r.name)?.slice(0, 30) || null;
  d.welcomed = bool(r.welcomed);
  d.stars = Math.floor(num(r.stars));
  d.examBest = typeof r.examBest === 'number' && r.examBest >= 0 && r.examBest <= 1 ? r.examBest : null;
  d.examsDone = Math.floor(num(r.examsDone));
  d.lastLesson = str(r.lastLesson);
  if (Array.isArray(r.badges)) d.badges = r.badges.filter((b) => b && typeof b === 'object' && typeof b.id === 'string').map((b) => ({ id: b.id, at: str(b.at) ?? '' }));
  if (r.skills && typeof r.skills === 'object') {
    for (const [k, v] of Object.entries(r.skills as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue;
      const s = v as Record<string, unknown>;
      d.skills[k] = {
        attempted: num(s.attempted),
        firstTry: num(s.firstTry),
        afterHelp: num(s.afterHelp),
        revealed: num(s.revealed),
        wrongAttempts: num(s.wrongAttempts),
        hints: num(s.hints),
        recent: Array.isArray(s.recent) ? s.recent.filter((x) => x === 0 || x === 0.5 || x === 1).slice(-10) : [],
        last: str(s.last),
        wrong: Array.isArray(s.wrong) ? s.wrong.filter((x) => typeof x === 'string').slice(-5) : [],
      };
    }
  }
  if (r.lessons && typeof r.lessons === 'object') {
    for (const [k, v] of Object.entries(r.lessons as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue;
      const l = v as Record<string, unknown>;
      d.lessons[k] = { opened: bool(l.opened), introSeen: bool(l.introSeen), guidedDone: bool(l.guidedDone), practiceDone: num(l.practiceDone), masteryBest: Math.min(1, num(l.masteryBest)), masteryPassed: bool(l.masteryPassed) };
    }
  }
  return d;
}

function storageOk(): boolean {
  try {
    const k = '__g2test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

class Store {
  data: Data = emptyData();
  available = false;
  saveError = false;
  private listeners = new Set<() => void>();
  private snapshot: { data: Data; available: boolean; saveError: boolean } = { data: this.data, available: false, saveError: false };

  constructor() {
    this.available = typeof window !== 'undefined' && storageOk();
    if (this.available) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        this.data = raw ? sanitise(JSON.parse(raw)) : emptyData();
      } catch {
        this.data = emptyData();
      }
    }
    this.snap();
  }

  private snap() {
    this.snapshot = { data: this.data, available: this.available, saveError: this.saveError };
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  get = () => this.snapshot;

  update(fn: (d: Data) => void) {
    const next: Data = structuredCloneSafe(this.data);
    fn(next);
    this.data = next;
    if (this.available) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        this.saveError = false;
      } catch {
        this.saveError = true;
      }
    }
    this.snap();
    this.listeners.forEach((l) => l());
  }

  /** Deletes all saved progress in this browser. */
  clear() {
    if (this.available) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    this.data = emptyData();
    this.snap();
    this.listeners.forEach((l) => l());
  }
}

function structuredCloneSafe<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export const store = new Store();

export function useStore() {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
