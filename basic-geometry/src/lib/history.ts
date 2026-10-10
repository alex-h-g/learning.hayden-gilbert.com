/**
 * Learning history: aggregate per-formula statistics + session records,
 * persisted to localStorage after every recorded attempt.
 *
 * - Works without storage (private mode / disabled): keeps data in memory and
 *   reports `persistent: false` so the UI can explain progress may not be saved.
 * - Malformed individual records are skipped (and reported), never crash the app.
 * - If the saved data can't be parsed at all, it is NOT overwritten: writes pause
 *   until the user chooses "Start fresh" (the raw data is backed up first).
 * - Nothing is ever sent anywhere; this is local to the current browser.
 */
import { isFormulaId } from '../data/formulas';
import type { ModeId } from '../data/levels';
import type { FormulaStats, HistoryData, Outcome, SessionQuestion, SessionRecord } from './historyTypes';

export const STORAGE_KEY = 'basic-geometry:history:v1';
export const BACKUP_KEY = 'basic-geometry:history:backup';
const MAX_SESSIONS = 100;
const MODES: ModeId[] = ['levels', 'area', 'perimeter', 'mixed-2d', '3d', 'mixed', 'mistakes'];

export interface HistorySnapshot {
  data: HistoryData;
  /** False when localStorage is unavailable or writes are paused. */
  persistent: boolean;
  storageAvailable: boolean;
  /** 'corrupt': saved data unreadable (writes paused). 'partial': some records skipped. */
  loadIssue: null | { kind: 'corrupt' | 'partial'; skipped: number };
  /** Last write failure (e.g. quota). */
  saveError: string | null;
}

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export const emptyData = (): HistoryData => ({ version: 1, stats: {}, sessions: [] });

export function emptyStats(id: string): FormulaStats {
  return {
    id,
    timesTested: 0,
    correctFinal: 0,
    firstTryCorrect: 0,
    incorrectAttempts: 0,
    sessionsWithMistakes: 0,
    lastIncorrectAt: null,
    lastPractisedAt: null,
    mostRecentOutcome: null,
  };
}

// ───────────────────────────── Validation ─────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isDateOrNull = (v: unknown) => v === null || (typeof v === 'string' && !Number.isNaN(Date.parse(v)));
const OUTCOMES = ['first-try', 'after-mistakes', 'unanswered'];

function validStats(id: string, v: unknown): FormulaStats | null {
  if (!isObj(v) || !isFormulaId(id) || v.id !== id) return null;
  const counts = ['timesTested', 'correctFinal', 'firstTryCorrect', 'incorrectAttempts', 'sessionsWithMistakes'] as const;
  if (!counts.every((k) => isCount(v[k]))) return null;
  if (!isDateOrNull(v.lastIncorrectAt) || !isDateOrNull(v.lastPractisedAt ?? null)) return null;
  if (v.mostRecentOutcome !== null && !OUTCOMES.includes(v.mostRecentOutcome as string)) return null;
  return {
    id,
    timesTested: v.timesTested as number,
    correctFinal: v.correctFinal as number,
    firstTryCorrect: Math.min(v.firstTryCorrect as number, v.timesTested as number),
    incorrectAttempts: v.incorrectAttempts as number,
    sessionsWithMistakes: v.sessionsWithMistakes as number,
    lastIncorrectAt: v.lastIncorrectAt as string | null,
    lastPractisedAt: (v.lastPractisedAt as string | null) ?? null,
    mostRecentOutcome: v.mostRecentOutcome as Outcome | null,
  };
}

function validSession(v: unknown): SessionRecord | null {
  if (!isObj(v) || typeof v.id !== 'string' || !MODES.includes(v.mode as ModeId)) return null;
  if (typeof v.startedAt !== 'string' || !Array.isArray(v.questions)) return null;
  const questions: SessionQuestion[] = [];
  for (const q of v.questions) {
    if (!isObj(q) || !isFormulaId(q.formulaId) || !Array.isArray(q.incorrect)) continue; // skip bad/unknown question
    questions.push({
      formulaId: q.formulaId as string,
      incorrect: (q.incorrect as unknown[])
        .filter((c): c is Record<string, unknown> => isObj(c) && typeof c.chosenId === 'string' && typeof c.at === 'string')
        .map((c, i) => ({ chosenId: c.chosenId as string, at: c.at as string, order: isCount(c.order) ? (c.order as number) : i + 1 })),
      result: OUTCOMES.includes(q.result as string) || q.result === 'pending' ? (q.result as SessionQuestion['result']) : 'pending',
    });
  }
  return {
    id: v.id,
    mode: v.mode as ModeId,
    level: typeof v.level === 'number' ? v.level : null,
    startedAt: v.startedAt,
    endedAt: typeof v.endedAt === 'string' ? v.endedAt : null,
    status: v.status === 'complete' || v.status === 'abandoned' ? v.status : 'in-progress',
    questions,
  };
}

/** Parse saved JSON. Returns null when the whole blob is unusable. */
export function parseHistory(raw: string): { data: HistoryData; skipped: number } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(parsed) || parsed.version !== 1 || !isObj(parsed.stats) || !Array.isArray(parsed.sessions)) return null;
  let skipped = 0;
  const stats: Record<string, FormulaStats> = {};
  for (const [id, v] of Object.entries(parsed.stats)) {
    const s = validStats(id, v);
    if (s) stats[id] = s;
    else skipped++;
  }
  const sessions: SessionRecord[] = [];
  for (const v of parsed.sessions) {
    const s = validSession(v);
    if (s) sessions.push(s);
    else skipped++;
  }
  return { data: { version: 1, stats, sessions: sessions.slice(-MAX_SESSIONS) }, skipped };
}

// ───────────────────────────── Store ─────────────────────────────

function detectStorage(): StorageLike | null {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    const k = '__bg_probe__';
    ls.setItem(k, '1');
    ls.removeItem(k);
    return ls;
  } catch {
    return null;
  }
}

export class HistoryStore {
  private snapshot: HistorySnapshot;
  private listeners = new Set<() => void>();
  private writesPaused = false;
  private backedUp = false;

  constructor(private storage: StorageLike | null = detectStorage()) {
    this.snapshot = this.load();
  }

  private load(): HistorySnapshot {
    const base = { storageAvailable: !!this.storage, saveError: null };
    if (!this.storage) return { ...base, data: emptyData(), persistent: false, loadIssue: null };
    let raw: string | null = null;
    try {
      raw = this.storage.getItem(STORAGE_KEY);
    } catch {
      return { ...base, storageAvailable: false, data: emptyData(), persistent: false, loadIssue: null };
    }
    if (raw === null) return { ...base, data: emptyData(), persistent: true, loadIssue: null };
    const parsed = parseHistory(raw);
    if (!parsed) {
      this.writesPaused = true;
      return { ...base, data: emptyData(), persistent: false, loadIssue: { kind: 'corrupt', skipped: 0 } };
    }
    return { ...base, data: parsed.data, persistent: true, loadIssue: parsed.skipped ? { kind: 'partial', skipped: parsed.skipped } : null };
  }

  /** Re-read storage (e.g. another tab changed it). */
  reload(): void {
    this.writesPaused = false;
    this.snapshot = this.load();
    this.emit();
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): HistorySnapshot => this.snapshot;

  private emit() {
    for (const fn of this.listeners) fn();
  }

  private commit(data: HistoryData) {
    let saveError: string | null = null;
    if (this.storage && !this.writesPaused) {
      try {
        // Before rewriting data that had skipped records, keep one raw copy.
        if (this.snapshot.loadIssue?.kind === 'partial' && !this.backedUp) {
          const raw = this.storage.getItem(STORAGE_KEY);
          if (raw) this.storage.setItem(BACKUP_KEY, raw);
          this.backedUp = true;
        }
        this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        saveError = 'Your browser refused to save progress (storage may be full or disabled). This session still works, but progress may not be kept.';
      }
    }
    this.snapshot = { ...this.snapshot, data, saveError, persistent: !!this.storage && !this.writesPaused && !saveError };
    this.emit();
  }

  private stat(data: HistoryData, id: string): FormulaStats {
    return { ...(data.stats[id] ?? emptyStats(id)) };
  }

  private withSession(data: HistoryData, sessionId: string, fn: (s: SessionRecord) => SessionRecord): SessionRecord[] {
    return data.sessions.map((s) => (s.id === sessionId ? fn(s) : s));
  }

  startSession(mode: ModeId, level: number | null, questionIds: string[], now = new Date()): string {
    const id = `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const session: SessionRecord = {
      id,
      mode,
      level,
      startedAt: now.toISOString(),
      endedAt: null,
      status: 'in-progress',
      questions: questionIds.filter(isFormulaId).map((formulaId) => ({ formulaId, incorrect: [], result: 'pending' })),
    };
    const d = this.snapshot.data;
    this.commit({ ...d, sessions: [...d.sessions, session].slice(-MAX_SESSIONS) });
    return id;
  }

  recordIncorrect(sessionId: string, formulaId: string, chosenId: string, order: number, at: string): void {
    if (!isFormulaId(formulaId)) return;
    const d = this.snapshot.data;
    const session = d.sessions.find((s) => s.id === sessionId);
    const firstMistakeThisSession = !session?.questions.find((q) => q.formulaId === formulaId)?.incorrect.length;
    const s = this.stat(d, formulaId);
    s.incorrectAttempts += 1;
    if (firstMistakeThisSession) s.sessionsWithMistakes += 1;
    s.lastIncorrectAt = at;
    s.lastPractisedAt = at;
    this.commit({
      ...d,
      stats: { ...d.stats, [formulaId]: s },
      sessions: this.withSession(d, sessionId, (ses) => ({
        ...ses,
        questions: ses.questions.map((q) => (q.formulaId === formulaId ? { ...q, incorrect: [...q.incorrect, { chosenId, at, order }] } : q)),
      })),
    });
  }

  /** A question finished: matched (first try or after mistakes) or left unanswered. */
  recordOutcome(sessionId: string, formulaId: string, outcome: Outcome, now = new Date()): void {
    if (!isFormulaId(formulaId)) return;
    const d = this.snapshot.data;
    const s = this.stat(d, formulaId);
    s.timesTested += 1;
    if (outcome !== 'unanswered') s.correctFinal += 1;
    if (outcome === 'first-try') s.firstTryCorrect += 1;
    s.mostRecentOutcome = outcome;
    s.lastPractisedAt = now.toISOString();
    this.commit({
      ...d,
      stats: { ...d.stats, [formulaId]: s },
      sessions: this.withSession(d, sessionId, (ses) => ({
        ...ses,
        questions: ses.questions.map((q) => (q.formulaId === formulaId ? { ...q, result: outcome } : q)),
      })),
    });
  }

  endSession(sessionId: string, status: 'complete' | 'abandoned', now = new Date()): void {
    const d = this.snapshot.data;
    this.commit({ ...d, sessions: this.withSession(d, sessionId, (s) => ({ ...s, status, endedAt: now.toISOString() })) });
  }

  /** Delete all saved learning history (Reset Progress). */
  clear(): void {
    if (this.storage) {
      try {
        this.storage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore — memory is cleared regardless */
      }
    }
    this.writesPaused = false;
    this.backedUp = false;
    this.snapshot = { ...this.snapshot, data: emptyData(), loadIssue: null, saveError: null, persistent: !!this.storage };
    this.emit();
  }

  /** Recovery for unreadable saved data: back up the raw text, then start fresh. */
  startFreshAfterCorruption(): void {
    if (this.storage) {
      try {
        const raw = this.storage.getItem(STORAGE_KEY);
        if (raw) this.storage.setItem(BACKUP_KEY, raw);
      } catch {
        /* ignore */
      }
    }
    this.clear();
  }
}

export const historyStore = new HistoryStore();

if (typeof window !== 'undefined') {
  // Keep tabs in sync: another tab's reset or progress shows up here.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) historyStore.reload();
  });
}
