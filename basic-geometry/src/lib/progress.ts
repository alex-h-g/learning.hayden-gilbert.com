/** Derived statistics for the progress dashboard and homepage summary. */
import { getFormula } from '../data/formulas';
import type { Category } from '../data/types';
import { accuracy, type FormulaStats, type HistoryData } from './historyTypes';

export type SortKey = 'most-incorrect' | 'lowest-accuracy' | 'most-recent';

export interface ProgressSummary {
  formulasPractised: number;
  questionsAnswered: number;
  questionsFirstTry: number;
  incorrectAttempts: number;
  sessionsPlayed: number;
  categoryMistakes: { category: Category; incorrect: number }[];
  hasData: boolean;
}

/** Only formulas that still exist in the database are counted. */
export function knownStats(data: HistoryData): FormulaStats[] {
  return Object.values(data.stats).filter((s) => getFormula(s.id));
}

export function summarise(data: HistoryData): ProgressSummary {
  const stats = knownStats(data);
  const byCat = new Map<Category, number>();
  for (const s of stats) {
    const cat = getFormula(s.id)!.category;
    byCat.set(cat, (byCat.get(cat) ?? 0) + s.incorrectAttempts);
  }
  const practised = stats.filter((s) => s.timesTested > 0 || s.incorrectAttempts > 0);
  return {
    formulasPractised: practised.length,
    questionsAnswered: stats.reduce((n, s) => n + s.timesTested, 0),
    questionsFirstTry: stats.reduce((n, s) => n + s.firstTryCorrect, 0),
    incorrectAttempts: stats.reduce((n, s) => n + s.incorrectAttempts, 0),
    sessionsPlayed: data.sessions.filter((s) => s.status !== 'in-progress' || s.questions.some((q) => q.result !== 'pending' || q.incorrect.length)).length,
    categoryMistakes: [...byCat.entries()]
      .filter(([, n]) => n > 0)
      .map(([category, incorrect]) => ({ category, incorrect }))
      .sort((a, b) => b.incorrect - a.incorrect),
    hasData: practised.length > 0,
  };
}

/** Formulas needing practice (at least one mistake), sorted as requested. */
export function needsPractice(data: HistoryData, sort: SortKey): FormulaStats[] {
  const list = knownStats(data).filter((s) => s.incorrectAttempts > 0);
  const acc = (s: FormulaStats) => accuracy(s) ?? 0;
  const time = (s: FormulaStats) => (s.lastIncorrectAt ? Date.parse(s.lastIncorrectAt) : 0);
  const cmp: Record<SortKey, (a: FormulaStats, b: FormulaStats) => number> = {
    'most-incorrect': (a, b) => b.incorrectAttempts - a.incorrectAttempts || acc(a) - acc(b),
    'lowest-accuracy': (a, b) => acc(a) - acc(b) || b.incorrectAttempts - a.incorrectAttempts,
    'most-recent': (a, b) => time(b) - time(a),
  };
  return list.sort(cmp[sort]);
}

export function recentlyPractised(data: HistoryData, n = 6): FormulaStats[] {
  return knownStats(data)
    .filter((s) => s.lastPractisedAt)
    .sort((a, b) => Date.parse(b.lastPractisedAt!) - Date.parse(a.lastPractisedAt!))
    .slice(0, n);
}
