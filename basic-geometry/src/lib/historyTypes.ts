import type { ModeId } from '../data/levels';

export type Outcome = 'first-try' | 'after-mistakes' | 'unanswered';

/** Aggregate learning statistics for one formula (keyed by stable formula ID). */
export interface FormulaStats {
  id: string;
  /** Times this formula has been asked and the question finished (matched or left unanswered). */
  timesTested: number;
  /** Times the player eventually matched it. */
  correctFinal: number;
  /** Times matched with no incorrect attempt first. */
  firstTryCorrect: number;
  /** Every wrong formula submitted for this question. */
  incorrectAttempts: number;
  /** Number of sessions in which at least one mistake was made on this formula. */
  sessionsWithMistakes: number;
  lastIncorrectAt: string | null;
  lastPractisedAt: string | null;
  mostRecentOutcome: Outcome | null;
}

export interface IncorrectChoice {
  chosenId: string;
  at: string;
  /** Order of the attempt within the session (1-based, across all questions). */
  order: number;
}

export interface SessionQuestion {
  formulaId: string;
  incorrect: IncorrectChoice[];
  result: Outcome | 'pending';
}

export interface SessionRecord {
  id: string;
  mode: ModeId;
  level: number | null;
  startedAt: string;
  endedAt: string | null;
  status: 'in-progress' | 'complete' | 'abandoned';
  questions: SessionQuestion[];
}

export interface HistoryData {
  version: 1;
  stats: Record<string, FormulaStats>;
  sessions: SessionRecord[];
}

/** First-try accuracy, or null when there is not enough data to be meaningful. */
export function accuracy(s: FormulaStats | undefined): number | null {
  if (!s || s.timesTested === 0) return null;
  return s.firstTryCorrect / s.timesTested;
}
