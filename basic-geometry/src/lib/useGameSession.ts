/**
 * Connects the pure game engine to React and the learning-history store.
 * State lives in a ref as well as React state, so rapid double-clicks are
 * applied to the latest state (no stale closures, no timeouts).
 */
import { useCallback, useRef, useState } from 'react';
import type { ModeId } from '../data/levels';
import { abandon, chooseOption, newGame, selectQuestion, type GameState, type Transition } from './game';
import { historyStore } from './history';
import { generateRound } from './rounds';

export interface Session {
  game: GameState | null;
  start: (mode: ModeId, level?: number) => void;
  select: (questionId: string) => void;
  choose: (optionId: string) => void;
  endEarly: () => void;
  quit: () => void;
}

export function useGameSession(): Session {
  const [game, setGame] = useState<GameState | null>(null);
  const ref = useRef<GameState | null>(null);
  const sessionId = useRef<string | null>(null);
  const lastQuestions = useRef<Record<string, string[]>>({});

  const apply = useCallback((t: Transition) => {
    if (t.state === ref.current) return;
    ref.current = t.state;
    setGame(t.state);
    const sid = sessionId.current;
    if (!sid) return;
    for (const e of t.events) {
      switch (e.type) {
        case 'incorrect':
          historyStore.recordIncorrect(sid, e.questionId, e.chosenId, e.order, e.at);
          break;
        case 'matched':
          historyStore.recordOutcome(sid, e.questionId, e.firstTry ? 'first-try' : 'after-mistakes');
          break;
        case 'complete':
          historyStore.endSession(sid, 'complete');
          break;
        case 'abandoned':
          for (const q of e.unanswered) historyStore.recordOutcome(sid, q, 'unanswered');
          historyStore.endSession(sid, 'abandoned');
          break;
      }
    }
  }, []);

  const start = useCallback((mode: ModeId, level?: number) => {
    const key = `${mode}:${level ?? ''}`;
    const round = generateRound({ mode, level, stats: historyStore.getSnapshot().data.stats, avoid: lastQuestions.current[key] });
    lastQuestions.current[key] = round.questionIds;
    sessionId.current = historyStore.startSession(mode, round.level, round.questionIds);
    const g = newGame(round);
    ref.current = g;
    setGame(g);
  }, []);

  const select = useCallback((id: string) => ref.current && apply(selectQuestion(ref.current, id)), [apply]);
  const choose = useCallback((id: string) => ref.current && apply(chooseOption(ref.current, id)), [apply]);
  const endEarly = useCallback(() => ref.current && apply(abandon(ref.current)), [apply]);
  const quit = useCallback(() => {
    ref.current = null;
    sessionId.current = null;
    setGame(null);
  }, []);

  return { game, start, select, choose, endEarly, quit };
}
