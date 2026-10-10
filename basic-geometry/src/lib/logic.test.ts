import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { FORMULAS, getFormula, PI } from '../data/formulas';
import { LEVELS, PRACTICE_MODES } from '../data/levels';
import { SHAPES } from '../data/shapes';
import { abandon, buildReview, chooseOption, newGame, selectQuestion } from './game';
import { HistoryStore, parseHistory, STORAGE_KEY, BACKUP_KEY, type StorageLike } from './history';
import { generateRound, mistakeFormulaIds } from './rounds';
import { seeded } from './random';
import { convert, describeConversion, parseNumber, type LengthUnit } from './units';
import { explainMistake, formulaLetters, letterMismatch } from './explain';
import { needsPractice, summarise } from './progress';

const fmt = (n: number) => String(Math.round(n * 1e6) / 1e6);
const calc = (id: string, v: Record<string, number>) => getFormula(id)!.calculation.compute(v, fmt);

class MemStorage implements StorageLike {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('formula database coverage', () => {
  const twoD = SHAPES.filter((s) => s.dimension === '2d');
  const threeD = SHAPES.filter((s) => s.dimension === '3d');
  const cats = (shapeId: string) => FORMULAS.filter((f) => f.shapeId === shapeId).map((f) => f.category);

  it('every 2D shape has an area formula', () => twoD.forEach((s) => expect(cats(s.id)).toContain('area')));
  it('every 2D polygon has a perimeter formula', () =>
    twoD.filter((s) => s.id !== 'circle').forEach((s) => expect(cats(s.id)).toContain('perimeter')));
  it('the circle has a circumference formula', () => expect(cats('circle')).toContain('circumference'));
  it('every 3D shape has volume and surface area', () =>
    threeD.forEach((s) => expect(cats(s.id)).toEqual(expect.arrayContaining(['volume', 'surface-area']))));
  it('has all 26 specified formulas with unique ids and expressions', () => {
    expect(FORMULAS).toHaveLength(26);
    expect(new Set(FORMULAS.map((f) => f.id)).size).toBe(26);
    expect(new Set(FORMULAS.map((f) => f.tex.replace(/\s/g, ''))).size).toBe(26);
  });
  it('area and perimeter use different ids for the same shape', () => {
    expect(getFormula('square-area')!.id).not.toBe(getFormula('square-perimeter')!.id);
    expect(getFormula('circle-area')!.category).toBe('area');
    expect(getFormula('circle-circumference')!.category).toBe('circumference');
  });
  it('shape formulaIds reference real formulas', () =>
    SHAPES.forEach((s) => s.formulaIds.forEach((id) => expect(getFormula(id)?.shapeId).toBe(s.id))));
  it('every expression renders in KaTeX without error', () =>
    FORMULAS.forEach((f) => expect(() => katex.renderToString(f.tex, { throwOnError: true })).not.toThrow()));
  it('every formula has variables and an explanation', () =>
    FORMULAS.forEach((f) => {
      expect(f.variables.length).toBeGreaterThan(0);
      expect(f.explanation.length).toBeGreaterThan(10);
    }));
  it('level and mode pools reference real formulas', () => {
    LEVELS.forEach((l) => l.pool.forEach((id) => expect(getFormula(id)).toBeDefined()));
    expect(LEVELS).toHaveLength(3);
    expect(PRACTICE_MODES.map((m) => m.id)).toEqual(['area', 'perimeter', 'mixed-2d', '3d', 'mixed', 'mistakes']);
  });
});

describe('calculator', () => {
  const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);
  it('2D shapes', () => {
    close(calc('square-area', { s: 5 }).value, 25);
    close(calc('square-perimeter', { s: 5 }).value, 20);
    close(calc('rectangle-area', { l: 4, w: 2.5 }).value, 10);
    close(calc('rectangle-perimeter', { l: 4, w: 2.5 }).value, 13);
    close(calc('triangle-area', { b: 6, h: 4 }).value, 12);
    close(calc('triangle-perimeter', { a: 3, b: 4, c: 5 }).value, 12);
    close(calc('parallelogram-area', { b: 7, h: 3 }).value, 21);
    close(calc('parallelogram-perimeter', { a: 7, b: 4 }).value, 22);
    close(calc('trapezoid-area', { a: 4, b: 6, h: 3 }).value, 15);
    close(calc('trapezoid-perimeter', { a: 4, b: 6, c: 3, d: 3 }).value, 16);
  });
  it('circle area and circumference are distinct and use π = 3.14159', () => {
    close(calc('circle-area', { r: 5 }).value, 78.53975);
    close(calc('circle-circumference', { r: 5 }).value, 31.4159);
    expect(PI).toBe(3.14159);
  });
  it('3D shapes', () => {
    close(calc('cube-volume', { s: 3 }).value, 27);
    close(calc('cube-surface-area', { s: 3 }).value, 54);
    close(calc('rectangular-prism-volume', { l: 2, w: 3, h: 4 }).value, 24);
    close(calc('rectangular-prism-surface-area', { l: 2, w: 3, h: 4 }).value, 52);
    close(calc('prism-volume', { B: 10, h: 5 }).value, 50);
    close(calc('prism-surface-area', { B: 6, P: 12, h: 10 }).value, 132);
    close(calc('sphere-volume', { r: 3 }).value, (4 / 3) * PI * 27);
    close(calc('sphere-surface-area', { r: 3 }).value, 4 * PI * 9);
    close(calc('square-pyramid-volume', { s: 6, h: 4 }).value, 48);
  });
  it('cylinder volume and surface area are distinct', () => {
    const v = calc('cylinder-volume', { r: 2, h: 5 }).value;
    const sa = calc('cylinder-surface-area', { r: 2, h: 5 }).value;
    close(v, PI * 20);
    close(sa, 2 * PI * 4 + 2 * PI * 10);
    expect(v).not.toBeCloseTo(sa);
  });
  it('cone uses slant height l = √(r² + h²), not vertical height', () => {
    const r = calc('cone-surface-area', { r: 5, h: 12 });
    close(r.value, PI * 25 + PI * 5 * 13);
    expect(r.steps[0].tex).toContain('13');
    close(calc('cone-volume', { r: 5, h: 12 }).value, (PI * 25 * 12) / 3);
  });
  it('pyramid uses slant height l = √(h² + (s/2)²)', () => {
    const r = calc('square-pyramid-surface-area', { s: 6, h: 4 });
    close(r.value, 36 + 2 * 6 * 5);
    expect(r.steps[0].tex).toContain('5');
  });
  it('rejects impossible shapes', () => {
    expect(getFormula('triangle-perimeter')!.calculation.validate!({ a: 1, b: 2, c: 10 })).toMatch(/cannot make a triangle/);
    expect(getFormula('triangle-perimeter')!.calculation.validate!({ a: 3, b: 4, c: 5 })).toBeNull();
    expect(getFormula('trapezoid-perimeter')!.calculation.validate!({ a: 10, b: 2, c: 1, d: 1 })).toMatch(/cannot make a trapezoid/);
    expect(getFormula('prism-surface-area')!.calculation.validate!({ B: 100, P: 4, h: 1 })).toMatch(/impossible/);
  });
  it('parses numbers strictly', () => {
    expect(parseNumber('2.5')).toBe(2.5);
    expect(parseNumber('1,250')).toBe(1250);
    expect(parseNumber('.5')).toBe(0.5);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('5cm')).toBeNull();
    expect(parseNumber('-3')).toBe(-3); // negativity is rejected by the calculator's validation
  });
});

describe('metric conversion', () => {
  it('specified area examples', () => {
    expect(convert(2500, 'mm', 'cm', 2)).toBe(25);
    expect(convert(25, 'cm', 'mm', 2)).toBe(2500);
    expect(convert(3, 'm', 'cm', 2)).toBe(30000);
    expect(convert(30000, 'cm', 'm', 2)).toBe(3);
    expect(convert(5_000_000, 'mm', 'm', 2)).toBe(5);
  });
  it('every area source/destination combination round-trips', () => {
    const units: LengthUnit[] = ['mm', 'cm', 'm'];
    const factor: Record<string, number> = { mm: 1, cm: 100, m: 1_000_000 }; // in mm²
    for (const a of units)
      for (const b of units) {
        expect(convert(7, a, b, 2)).toBeCloseTo((7 * factor[a]) / factor[b], 10);
        expect(convert(convert(7, a, b, 2), b, a, 2)).toBeCloseTo(7, 10);
      }
  });
  it('length and volume use the right powers', () => {
    expect(convert(1, 'm', 'cm', 1)).toBe(100);
    expect(convert(1, 'cm', 'mm', 3)).toBe(1000);
    expect(convert(1, 'm', 'cm', 3)).toBe(1_000_000);
  });
  it('describes the method', () => {
    expect(describeConversion(2500, 'mm', 'cm', 2).text).toBe('2,500 mm² ÷ 100 = 25 cm²');
    expect(describeConversion(3, 'm', 'cm', 2).text).toBe('3 m² × 10,000 = 30,000 cm²');
    expect(describeConversion(1, 'cm', 'mm', 2).why).toContain('squared');
  });
});

describe('Pick a Pair game engine', () => {
  const round = generateRound({ mode: 'levels', level: 1, rng: seeded(1) });
  const [q1, q2, q3, q4] = round.questionIds;
  const wrongFor = (q: string) => round.optionIds.find((o) => o !== q)!;

  it('builds a valid round: 4 questions, unique options, every answer present', () => {
    expect(round.questionIds).toHaveLength(4);
    expect(new Set(round.optionIds).size).toBe(round.optionIds.length);
    round.questionIds.forEach((q) => expect(round.optionIds).toContain(q));
    expect(round.optionIds.length).toBe(LEVELS[0].optionCount);
  });

  it('accepts correct pairs, rejects incorrect pairs, records every attempt, allows recovery', () => {
    let s = newGame(round);
    // Choosing a formula without a question is not an attempt.
    let t = chooseOption(s, q1);
    expect(t.state.attempts).toHaveLength(0);
    expect(t.state.feedback).toEqual({ kind: 'need-question' });

    // Selecting a card is not an attempt.
    s = selectQuestion(s, q1).state;
    expect(s.selected).toBe(q1);
    expect(s.attempts).toHaveLength(0);

    t = chooseOption(s, wrongFor(q1));
    expect(t.state.matched).toHaveLength(0);
    expect(t.state.attempts).toHaveLength(1);
    expect(t.events[0].type).toBe('incorrect');
    expect(t.state.selected).toBe(q1); // still selected: can retry
    s = t.state;

    t = chooseOption(s, q1);
    expect(t.state.matched).toEqual([q1]);
    expect(t.events[0]).toEqual({ type: 'matched', questionId: q1, firstTry: false });
    s = t.state;

    // Matched cards can't be matched again.
    expect(selectQuestion(s, q1).state).toBe(s);
    s = selectQuestion(s, q2).state;
    expect(chooseOption(s, q1).state).toBe(s);

    // Rapid repeated selections: second click on the same option after a match does nothing.
    t = chooseOption(s, q2);
    const again = chooseOption(t.state, q2);
    expect(again.state.matched).toEqual([q1, q2]);
    expect(again.events).toHaveLength(0);
    s = t.state;

    for (const q of [q3, q4]) s = chooseOption(selectQuestion(s, q).state, q).state;
    expect(s.status).toBe('complete');

    const { rows, summary } = buildReview(s);
    expect(rows.map((r) => r.questionId)).toEqual(round.questionIds);
    expect(rows.find((r) => r.questionId === q1)!.outcome).toBe('after-mistakes');
    expect(rows.find((r) => r.questionId === q1)!.incorrect).toEqual([{ chosenId: wrongFor(q1), order: 1 }]);
    expect(summary).toMatchObject({ pairsCompleted: 4, questionsCompleted: 4, questionsWithMistakes: 1, incorrectAttempts: 1, perfect: false });
    // The game ignores input once complete.
    expect(chooseOption(s, q1).state).toBe(s);
  });

  it('reports unanswered questions when a round is ended early', () => {
    let s = newGame(round);
    s = chooseOption(selectQuestion(s, q1).state, q1).state;
    const t = abandon(s);
    expect(t.state.status).toBe('abandoned');
    const { rows, summary } = buildReview(t.state);
    expect(rows.filter((r) => r.outcome === 'unanswered')).toHaveLength(3);
    expect(summary.questionsUnanswered).toBe(3);
  });

  it('all levels and practice modes generate unambiguous rounds', () => {
    for (let seed = 1; seed < 200; seed++) {
      const rng = seeded(seed);
      for (const req of [
        ...LEVELS.map((l) => ({ mode: 'levels' as const, level: l.number })),
        ...PRACTICE_MODES.map((m) => ({ mode: m.id })),
      ]) {
        const r = generateRound({ ...req, rng });
        expect(r.questionIds).toHaveLength(4);
        expect(new Set(r.questionIds).size).toBe(4);
        r.questionIds.forEach((q) => expect(r.optionIds).toContain(q));
        const texes = r.optionIds.map((o) => getFormula(o)!.tex.replace(/\s/g, ''));
        expect(new Set(texes).size).toBe(texes.length);
      }
    }
  });

  it('practice modes select the appropriate categories', () => {
    for (let seed = 1; seed < 50; seed++) {
      const cat = (mode: 'area' | 'perimeter' | '3d' | 'mixed-2d') =>
        generateRound({ mode, rng: seeded(seed) }).questionIds.map((id) => getFormula(id)!);
      cat('area').forEach((f) => expect(f.category).toBe('area'));
      cat('perimeter').forEach((f) => expect(['perimeter', 'circumference']).toContain(f.category));
      cat('3d').forEach((f) => expect(['volume', 'surface-area']).toContain(f.category));
      cat('mixed-2d').forEach((f) => expect(['area', 'perimeter', 'circumference']).toContain(f.category));
    }
  });

  it('level 1 stays within its configured pool', () => {
    for (let seed = 1; seed < 50; seed++)
      generateRound({ mode: 'levels', level: 1, rng: seeded(seed) }).questionIds.forEach((id) => expect(LEVELS[0].pool).toContain(id));
  });
});

describe('learning history', () => {
  it('records attempts against the correct formula, independently per formula', () => {
    const storage = new MemStorage();
    const h = new HistoryStore(storage);
    const sid = h.startSession('levels', 1, ['circle-area', 'circle-circumference']);
    h.recordIncorrect(sid, 'circle-area', 'circle-circumference', 1, new Date().toISOString());
    h.recordIncorrect(sid, 'circle-area', 'square-area', 2, new Date().toISOString());
    h.recordOutcome(sid, 'circle-area', 'after-mistakes');
    h.recordOutcome(sid, 'circle-circumference', 'first-try');
    const { stats } = h.getSnapshot().data;
    expect(stats['circle-area']).toMatchObject({ incorrectAttempts: 2, sessionsWithMistakes: 1, timesTested: 1, correctFinal: 1, firstTryCorrect: 0, mostRecentOutcome: 'after-mistakes' });
    expect(stats['circle-circumference']).toMatchObject({ incorrectAttempts: 0, firstTryCorrect: 1 });
    // The wrongly chosen formula is not penalised.
    expect(stats['square-area']).toBeUndefined();

    // Persists: a new store over the same storage (= page reload) sees the same data.
    const reloaded = new HistoryStore(storage);
    expect(reloaded.getSnapshot().data.stats['circle-area'].incorrectAttempts).toBe(2);
    expect(reloaded.getSnapshot().data.sessions[0].questions[0].incorrect).toHaveLength(2);
  });

  it('counts sessions with mistakes once per session', () => {
    const h = new HistoryStore(new MemStorage());
    for (let i = 0; i < 2; i++) {
      const sid = h.startSession('mixed', null, ['cone-volume']);
      h.recordIncorrect(sid, 'cone-volume', 'cylinder-volume', 1, new Date().toISOString());
      h.recordIncorrect(sid, 'cone-volume', 'sphere-volume', 2, new Date().toISOString());
    }
    expect(h.getSnapshot().data.stats['cone-volume']).toMatchObject({ incorrectAttempts: 4, sessionsWithMistakes: 2 });
  });

  it('clear() wipes progress (Reset Progress)', () => {
    const storage = new MemStorage();
    const h = new HistoryStore(storage);
    const sid = h.startSession('levels', 1, ['cube-volume']);
    h.recordIncorrect(sid, 'cube-volume', 'cube-surface-area', 1, new Date().toISOString());
    h.clear();
    expect(h.getSnapshot().data.stats).toEqual({});
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(summarise(h.getSnapshot().data).hasData).toBe(false);
  });

  it('works without storage (disabled localStorage)', () => {
    const h = new HistoryStore(null);
    const sid = h.startSession('levels', 1, ['cube-volume']);
    h.recordOutcome(sid, 'cube-volume', 'first-try');
    expect(h.getSnapshot().persistent).toBe(false);
    expect(h.getSnapshot().data.stats['cube-volume'].timesTested).toBe(1);
  });

  it('survives storage that throws on write', () => {
    const storage = new MemStorage();
    const h = new HistoryStore(storage);
    storage.setItem = () => { throw new Error('QuotaExceeded'); };
    expect(() => h.startSession('levels', 1, ['cube-volume'])).not.toThrow();
    expect(h.getSnapshot().saveError).toMatch(/refused/);
  });

  it('skips malformed records and unknown formula ids', () => {
    const raw = JSON.stringify({
      version: 1,
      stats: {
        'cube-volume': { id: 'cube-volume', timesTested: 2, correctFinal: 2, firstTryCorrect: 1, incorrectAttempts: 1, sessionsWithMistakes: 1, lastIncorrectAt: '2026-01-01T00:00:00Z', lastPractisedAt: null, mostRecentOutcome: 'first-try' },
        'circle-area': { id: 'circle-area', timesTested: 'lots' },
        'hexagon-area': { id: 'hexagon-area', timesTested: 1, correctFinal: 1, firstTryCorrect: 1, incorrectAttempts: 0, sessionsWithMistakes: 0, lastIncorrectAt: null, mostRecentOutcome: null },
      },
      sessions: [{ nope: true }],
    });
    const parsed = parseHistory(raw)!;
    expect(Object.keys(parsed.data.stats)).toEqual(['cube-volume']);
    expect(parsed.skipped).toBe(3);
  });

  it('never overwrites unreadable saved data until the user chooses to start fresh', () => {
    const storage = new MemStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    const h = new HistoryStore(storage);
    expect(h.getSnapshot().loadIssue?.kind).toBe('corrupt');
    const sid = h.startSession('levels', 1, ['cube-volume']);
    h.recordOutcome(sid, 'cube-volume', 'first-try');
    expect(storage.getItem(STORAGE_KEY)).toBe('{not json'); // untouched
    expect(h.getSnapshot().data.stats['cube-volume'].timesTested).toBe(1); // session still works
    h.startFreshAfterCorruption();
    expect(storage.getItem(BACKUP_KEY)).toBe('{not json');
    expect(h.getSnapshot().loadIssue).toBeNull();
  });
});

describe('Practise My Mistakes', () => {
  const statsWith = (ids: string[]) => {
    const h = new HistoryStore(new MemStorage());
    const sid = h.startSession('mixed', null, ids);
    ids.forEach((id, i) => {
      h.recordIncorrect(sid, id, 'sphere-volume', i + 1, new Date().toISOString());
      h.recordOutcome(sid, id, 'after-mistakes');
    });
    return h.getSnapshot().data.stats;
  };

  it('prioritises recorded mistakes and fills the remainder', () => {
    const stats = statsWith(['cone-surface-area', 'triangle-area']);
    for (let seed = 1; seed < 30; seed++) {
      const r = generateRound({ mode: 'mistakes', level: 3, stats, rng: seeded(seed) });
      expect(r.questionIds).toHaveLength(4);
      expect(r.questionIds).toEqual(expect.arrayContaining(['cone-surface-area', 'triangle-area']));
      expect(r.fromMistakes).toBe(2);
    }
  });

  it('with no mistakes still produces a full round', () => {
    const r = generateRound({ mode: 'mistakes', level: 1, stats: {}, rng: seeded(3) });
    expect(r.questionIds).toHaveLength(4);
    r.questionIds.forEach((id) => expect(getFormula(id)!.difficulty).toBe(1));
  });

  it('does not get stuck on the same four questions', () => {
    const stats = statsWith(['cone-surface-area', 'triangle-area', 'circle-area', 'cube-volume']);
    expect(mistakeFormulaIds(stats)).toHaveLength(4);
    const seen = new Set<string>();
    for (let seed = 1; seed < 30; seed++) seen.add(generateRound({ mode: 'mistakes', stats, rng: seeded(seed) }).questionIds.slice().sort().join());
    expect(seen.size).toBeGreaterThan(3);
  });

  it('progress list sorts by the requested key', () => {
    const stats = statsWith(['cone-surface-area', 'triangle-area']);
    stats['triangle-area'].incorrectAttempts = 5;
    const data = { version: 1 as const, stats, sessions: [] };
    expect(needsPractice(data, 'most-incorrect')[0].id).toBe('triangle-area');
  });
});

describe('explanations', () => {
  it('specific contrasts for classic confusions', () => {
    expect(explainMistake('cylinder-surface-area', 'cylinder-volume').review).toMatch(/curved surface and two circular ends/);
    expect(explainMistake('circle-area', 'circle-circumference').review).toMatch(/distance around/);
  });
  it('in-game feedback never reveals the correct formula', () => {
    for (const q of FORMULAS)
      for (const c of FORMULAS) {
        if (q.id === c.id) continue;
        const text = explainMistake(q.id, c.id).inGame;
        expect(text).not.toContain(q.tex);
        expect(text).toContain('Not quite');
      }
  });
  it('flags letters that are not on the question diagram', () => {
    expect(formulaLetters(getFormula('trapezoid-perimeter')!)).toEqual(['a', 'b', 'c', 'd']);
    expect(formulaLetters(getFormula('circle-area')!)).toEqual(['r']);
    expect(letterMismatch(getFormula('rectangle-perimeter')!, getFormula('parallelogram-perimeter')!)).toMatch(/labels this rectangle with l and w.*uses a and b/);
    expect(explainMistake('rectangle-perimeter', 'parallelogram-perimeter').inGame).toMatch(/aren’t on the diagram/);
    expect(letterMismatch(getFormula('cone-volume')!, getFormula('cylinder-volume')!)).toBeNull();
  });
  it('different mistakes get different explanations', () => {
    expect(explainMistake('cone-volume', 'cylinder-volume').review).not.toBe(explainMistake('cone-volume', 'cone-surface-area').review);
  });
});
