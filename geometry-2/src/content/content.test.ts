import { describe, expect, it } from 'vitest';
import { seeded } from '../lib/random';
import * as M from '../math/core';
import { ALL_PLANES, SYMMETRY_PLANES, TRICK_PLANES, isSymmetryPlane, planeSection } from '../math/cube';
import { checkExactDecimal, checkNumber, checkStandardForm } from '../math/validate';
import { LESSONS, TOPICS } from './index';
import type { Difficulty, Problem } from './types';
import routes from '../../scripts/routes.json';

function checkProblem(p: Problem) {
  expect(p.steps.length).toBeGreaterThan(0);
  const visible = p.steps.filter((s) => !s.guidedOnly);
  expect(visible.length, `${p.id} has no practice steps`).toBeGreaterThan(0);
  for (const s of p.steps) {
    expect(s.hints.length, `${p.id}/${s.id} hints`).toBeGreaterThanOrEqual(2);
    expect(s.explain.length).toBeGreaterThan(0);
    // No unbalanced $…$ in learner text.
    for (const t of [s.prompt, s.explain, ...s.hints]) expect((t.match(/\$/g) ?? []).length % 2, `${p.id}/${s.id}: ${t}`).toBe(0);
    switch (s.kind) {
      case 'choice':
        expect(s.options.filter((o) => o.correct).length, `${p.id}/${s.id}`).toBe(1);
        expect(new Set(s.options.map((o) => o.label)).size).toBe(s.options.length);
        break;
      case 'multi':
        expect(s.options.some((o) => o.correct)).toBe(true);
        break;
      case 'number': {
        expect(Number.isFinite(s.answer.value)).toBe(true);
        // The validator accepts the true value, typed as a decimal.
        const typed = s.answer.tol > 0 ? M.fixed(s.answer.value, 2) : String(M.roundTo(s.answer.value, 6));
        expect(checkNumber(typed, s.answer).status, `${p.id}/${s.id} typed ${typed}`).toBe('correct');
        // …and rejects a clearly wrong one.
        expect(checkNumber(String(s.answer.value + 7), s.answer).status).not.toBe('correct');
        break;
      }
      case 'decimal':
        expect(checkExactDecimal(s.target, M.parseDec(s.target)!).status).toBe('correct');
        break;
      case 'sf': {
        const c = M.parseDec(s.target.coef)!;
        expect(M.isValidCoefficient(c), `${p.id} coef ${s.target.coef}`).toBe(true);
        expect(checkStandardForm(s.target.coef, String(s.target.exp), M.toStandardForm(M.shiftDec(c, s.target.exp))).status).toBe('correct');
        break;
      }
      case 'widget':
        if (s.widget.type === 'construct-triangle') expect(M.isValidTriangle(s.widget.base, s.widget.left, s.widget.right)).toBe(true);
        break;
    }
  }
}

describe('every lesson', () => {
  it('has a topic', () => {
    for (const l of LESSONS) expect(TOPICS.find((t) => t.id === l.topic)?.lessons).toContain(l.id);
  });
  for (const l of LESSONS) {
    it(`${l.id}: guided example is valid`, () => {
      checkProblem(l.guided());
      for (const g of l.moreGuided ?? []) checkProblem(g());
    });
    it(`${l.id}: 600 generated questions are valid and varied`, () => {
      const rng = seeded(l.id.length * 7919);
      const qs = new Set<string>();
      for (let i = 0; i < 600; i++) {
        const p = l.generate(rng, (i % 3) as Difficulty);
        checkProblem(p);
        qs.add(p.question + JSON.stringify(p.diagram ?? {}));
      }
      expect(qs.size, `${l.id} variety`).toBeGreaterThanOrEqual(6);
    });
  }
});

describe('worksheet answers', () => {
  const final = (id: string, i = -1) => {
    const p = LESSONS.find((l) => l.id === id)!.guided();
    return p.steps.at(i)!;
  };
  it('match the worksheet', () => {
    expect((final('interior-sum') as { answer: { value: number } }).answer.value).toBe(1080);
    expect((final('regular-interior') as { answer: { value: number } }).answer.value).toBe(135);
    expect((final('irregular') as { answer: { value: number } }).answer.value).toBe(95);
    expect((final('find-short') as { answer: { value: number } }).answer.value).toBe(12);
    expect((final('rect-diagonal') as { answer: { value: number } }).answer.value).toBe(13);
    expect((final('compound') as { answer: { value: number } }).answer.value).toBeCloseTo(48 + 8 * Math.PI, 12);
    expect((final('mass') as { target: string }).target).toBe('64800');
    expect((final('units-sf') as { target: { coef: string; exp: number } }).target).toEqual({ coef: '3.5', exp: -7 });
    expect((final('cube-symmetry') as { answer: { value: number } }).answer.value).toBe(9);
    const ws2 = LESSONS.find((l) => l.id === 'find-short')!.moreGuided![0]();
    expect((ws2.steps.at(-1) as { answer: { value: number } }).answer.value).toBeCloseTo(Math.sqrt(63), 12);
  });
});

describe('cube planes', () => {
  it('exactly the 9 symmetry planes are symmetries', () => {
    expect(SYMMETRY_PLANES).toHaveLength(9);
    for (const p of SYMMETRY_PLANES) expect(isSymmetryPlane(p), p.id).toBe(true);
    for (const p of TRICK_PLANES) expect(isSymmetryPlane(p), p.id).toBe(false);
    // Distinct planes.
    const key = (n: number[]) => { const m = Math.max(...n.map(Math.abs)); const s = n.find((x) => x !== 0)! > 0 ? 1 : -1; return n.map((x) => (s * x) / m).join(','); };
    expect(new Set(SYMMETRY_PLANES.map((p) => key(p.n))).size).toBe(9);
  });
  it('sections', () => {
    for (const p of ALL_PLANES) expect(planeSection(p).length).toBeGreaterThanOrEqual(3);
    expect(planeSection(SYMMETRY_PLANES[0])).toHaveLength(4);
    expect(planeSection(TRICK_PLANES.find((p) => p.id === 'hex')!)).toHaveLength(6);
  });
});

describe('routes', () => {
  it('postbuild route list covers every lesson and topic', () => {
    for (const l of LESSONS) expect(routes).toContain(`lesson/${l.id}`);
    for (const t of TOPICS) expect(routes).toContain(`topic/${t.id}`);
  });
});

describe('friendly numbers', () => {
  const finalValue = (p: Problem): number | null => {
    const s = p.steps.filter((x) => !x.guidedOnly).at(-1)!;
    if (s.kind === 'number') return s.answer.value;
    if (s.kind === 'decimal') return Number(s.target);
    return null;
  };
  const piBased = new Set(['circumference', 'area', 'compound']); // answers are whole multiples of π
  it('warm-up and standard questions have whole-number answers', () => {
    for (const l of LESSONS) {
      if (piBased.has(l.id) || l.id === 'standard-form' || l.id === 'units-sf') continue;
      const rng = seeded(99);
      for (let i = 0; i < 300; i++) {
        for (const d of [0, 1] as Difficulty[]) {
          const p = l.generate(rng, d);
          for (const s of p.steps) {
            if (s.kind === 'number') expect(Number.isInteger(s.answer.value) || (l.id === 'perp-bisector' && Number.isInteger(s.answer.value * 2)), `${l.id} d${d}: ${s.id} = ${s.answer.value}`).toBe(true);
            if (s.kind === 'decimal') expect(Number.isInteger(Number(s.target)), `${l.id} d${d}: ${s.target}`).toBe(true);
          }
          void finalValue;
        }
      }
    }
  });
  it('π answers are whole (or half) multiples of π with whole-number radii', () => {
    for (const id of piBased) {
      const l = LESSONS.find((x) => x.id === id)!;
      const rng = seeded(5);
      for (let i = 0; i < 300; i++) {
        const p = l.generate(rng, (i % 3) as Difficulty);
        for (const s of p.steps) if (s.kind === 'number' && s.id === 'radius') expect(Number.isInteger(s.answer.value)).toBe(true);
        const last = p.steps.at(-1)!;
        if (last.kind === 'number') {
          const piPart = id === 'compound' ? null : last.answer.value / Math.PI;
          if (piPart !== null) expect(Math.abs(piPart - Math.round(piPart))).toBeLessThan(1e-9);
        }
      }
    }
  });
});

describe('worksheet scope', () => {
  it('mass questions are always a single ×/÷ 1000 step', () => {
    const l = LESSONS.find((x) => x.id === 'mass')!;
    const rng = seeded(3);
    for (let i = 0; i < 600; i++) {
      const p = l.generate(rng, (i % 3) as Difficulty);
      const f = p.steps.find((s) => s.id === 'factor');
      expect(f && f.kind === 'choice' && f.options.find((o) => o.correct)!.label.includes('1{,}000')).toBe(true);
    }
  });
  it('units in standard form use only small lengths in metres', () => {
    const l = LESSONS.find((x) => x.id === 'units-sf')!;
    const rng = seeded(4);
    for (let i = 0; i < 300; i++) {
      const p = l.generate(rng, (i % 3) as Difficulty);
      expect(p.question).toMatch(/ (nm|μm)\. Write this in metres/);
      const last = p.steps.at(-1)!;
      expect(last.kind === 'sf' && last.target.exp < 0).toBe(true);
    }
  });
});
