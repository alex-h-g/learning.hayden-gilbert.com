/**
 * Game engine for Pick a Pair. Pure state transitions, no timers, no DOM.
 * Every transition returns the next state plus an optional event that the UI
 * forwards to the learning-history store.
 */
import { getFormula } from '../data/formulas';
import type { Round } from './rounds';
import type { Outcome } from './historyTypes';

export interface Attempt {
  questionId: string;
  chosenId: string;
  correct: boolean;
  /** 1-based order of submission in this round. */
  order: number;
  at: string;
}

export type Feedback =
  | { kind: 'selected'; questionId: string }
  | { kind: 'need-question' }
  | { kind: 'correct'; questionId: string }
  | { kind: 'incorrect'; questionId: string; chosenId: string };

export interface GameState {
  round: Round;
  selected: string | null;
  /** Question IDs matched, in the order they were matched. */
  matched: string[];
  attempts: Attempt[];
  feedback: Feedback | null;
  status: 'playing' | 'complete' | 'abandoned';
}

export type GameEvent =
  | { type: 'incorrect'; questionId: string; chosenId: string; order: number; at: string }
  | { type: 'matched'; questionId: string; firstTry: boolean }
  | { type: 'complete' }
  | { type: 'abandoned'; unanswered: string[] };

export interface Transition {
  state: GameState;
  events: GameEvent[];
}

export function newGame(round: Round): GameState {
  return { round, selected: null, matched: [], attempts: [], feedback: null, status: 'playing' };
}

/** Select (or re-select) a question card on the left. Selecting never counts as an attempt. */
export function selectQuestion(state: GameState, questionId: string): Transition {
  if (state.status !== 'playing') return { state, events: [] };
  if (!state.round.questionIds.includes(questionId) || state.matched.includes(questionId)) return { state, events: [] };
  const selected = state.selected === questionId ? null : questionId;
  return {
    state: { ...state, selected, feedback: selected ? { kind: 'selected', questionId } : null },
    events: [],
  };
}

/** Submit a formula card on the right for the selected question. */
export function chooseOption(state: GameState, optionId: string, now: Date = new Date()): Transition {
  if (state.status !== 'playing') return { state, events: [] };
  if (!state.round.optionIds.includes(optionId)) return { state, events: [] };
  // A formula already used in a completed pair can't be used again.
  if (state.matched.includes(optionId)) return { state, events: [] };
  if (!state.selected) return { state: { ...state, feedback: { kind: 'need-question' } }, events: [] };

  const questionId = state.selected;
  const correct = isCorrect(questionId, optionId);
  const at = now.toISOString();
  const attempt: Attempt = { questionId, chosenId: optionId, correct, order: state.attempts.length + 1, at };
  const attempts = [...state.attempts, attempt];

  if (!correct) {
    return {
      // Keep the question selected so the player can try again straight away.
      state: { ...state, attempts, feedback: { kind: 'incorrect', questionId, chosenId: optionId } },
      events: [{ type: 'incorrect', questionId, chosenId: optionId, order: attempt.order, at }],
    };
  }

  const matched = [...state.matched, questionId];
  const firstTry = !state.attempts.some((a) => a.questionId === questionId && !a.correct);
  const complete = matched.length >= state.round.questionIds.length;
  const events: GameEvent[] = [{ type: 'matched', questionId, firstTry }];
  if (complete) events.push({ type: 'complete' });
  return {
    state: {
      ...state,
      attempts,
      matched,
      selected: null,
      feedback: { kind: 'correct', questionId },
      status: complete ? 'complete' : 'playing',
    },
    events,
  };
}

/** End the round early; unmatched questions are reported as unanswered. */
export function abandon(state: GameState): Transition {
  if (state.status !== 'playing') return { state, events: [] };
  const unanswered = state.round.questionIds.filter((id) => !state.matched.includes(id));
  return { state: { ...state, status: 'abandoned', selected: null, feedback: null }, events: [{ type: 'abandoned', unanswered }] };
}

/** The matching rule: compare stable IDs, never displayed text. */
export function isCorrect(questionId: string, optionId: string): boolean {
  return questionId === optionId && !!getFormula(questionId);
}

// ───────────────────────────── Review ─────────────────────────────

export interface ReviewRow {
  questionId: string;
  outcome: Outcome;
  /** Wrong formulas in the order chosen (duplicates kept). */
  incorrect: { chosenId: string; order: number }[];
}

export interface ReviewSummary {
  pairsCompleted: number;
  totalPairs: number;
  questionsCompleted: number;
  questionsFirstTry: number;
  questionsWithMistakes: number;
  questionsUnanswered: number;
  incorrectAttempts: number;
  perfect: boolean;
}

export function buildReview(state: GameState): { rows: ReviewRow[]; summary: ReviewSummary } {
  const rows: ReviewRow[] = state.round.questionIds.map((qid) => {
    const incorrect = state.attempts.filter((a) => a.questionId === qid && !a.correct).map((a) => ({ chosenId: a.chosenId, order: a.order }));
    const matched = state.matched.includes(qid);
    const outcome: Outcome = !matched ? 'unanswered' : incorrect.length ? 'after-mistakes' : 'first-try';
    return { questionId: qid, outcome, incorrect };
  });
  const incorrectAttempts = rows.reduce((n, r) => n + r.incorrect.length, 0);
  const summary: ReviewSummary = {
    pairsCompleted: state.matched.length,
    totalPairs: state.round.questionIds.length,
    questionsCompleted: rows.filter((r) => r.outcome !== 'unanswered').length,
    questionsFirstTry: rows.filter((r) => r.outcome === 'first-try').length,
    questionsWithMistakes: rows.filter((r) => r.incorrect.length > 0).length,
    questionsUnanswered: rows.filter((r) => r.outcome === 'unanswered').length,
    incorrectAttempts,
    perfect: incorrectAttempts === 0 && rows.every((r) => r.outcome === 'first-try'),
  };
  return { rows, summary };
}
