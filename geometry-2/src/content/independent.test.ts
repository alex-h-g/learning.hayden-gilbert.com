/**
 * Independent cross-check. Recomputes each generated question's final answer
 * WITHOUT using src/math/core.ts — from the diagram's own numbers, coordinate
 * geometry and plain arithmetic — so a bug shared by the generator and the
 * marking code can't hide.
 */
import { describe, expect, it } from 'vitest';
import { seeded } from '../lib/random';
import { LESSONS } from './index';
import type { Difficulty, NumberStep, Problem } from './types';

const lesson = (id: string) => LESSONS.find((l) => l.id === id)!;
const finalNumber = (p: Problem) => {
  const s = p.steps[p.steps.length - 1];
  if (s.kind !== 'number') throw new Error(`${p.id}: last step is ${s.kind}`);
  return (s as NumberStep).answer.value;
};
const numbersIn = (t: string) => (t.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
function each(id: string, n: number, fn: (p: Problem) => void) {
  const rng = seeded(id.length * 104729 + 17);
  for (let i = 0; i < n; i++) fn(lesson(id).generate(rng, (i % 3) as Difficulty));
  fn(lesson(id).guided());
  for (const g of lesson(id).moreGuided ?? []) fn(g());
}
/** Angle ABC in degrees from coordinates. */
const angle = (A: number[], B: number[], C: number[]) => {
  const u = [A[0] - B[0], A[1] - B[1]];
  const v = [C[0] - B[0], C[1] - B[1]];
  return (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]))) * 180) / Math.PI;
};

describe('independent check of every generated answer', () => {
  it('sum of interior angles: triangulate and add', () => {
    each('interior-sum', 400, (p) => {
      if (p.question.startsWith('The interior angles of a polygon add up to')) {
        const [total] = numbersIn(p.question);
        let n = 3;
        while (180 * (n - 2) < total) n++;
        expect(180 * (n - 2)).toBe(total);
        expect(finalNumber(p)).toBe(n);
      } else {
        const n = (p.diagram as { n: number }).n;
        let triangles = 0;
        for (let k = 2; k < n; k++) triangles++; // fan from one vertex
        expect(finalNumber(p)).toBe(triangles * 180);
      }
    });
  });
  it('regular interior angle: measure a real regular polygon', () => {
    each('regular-interior', 400, (p) => {
      const n = (p.diagram as { n: number }).n;
      const pt = (k: number) => [Math.cos((2 * Math.PI * k) / n), Math.sin((2 * Math.PI * k) / n)];
      expect(finalNumber(p)).toBeCloseTo(angle(pt(0), pt(1), pt(2)), 9);
    });
  });
  it('exterior angles: turning angle of a real regular polygon', () => {
    each('exterior', 400, (p) => {
      const nums = numbersIn(p.question);
      const ans = finalNumber(p);
      if (p.question.includes('How many sides')) {
        const given = nums[0];
        const isInterior = p.question.includes('interior angle');
        expect((isInterior ? 180 - given : given) * ans).toBe(360);
      } else {
        const n = nums[0];
        const ext = 360 / n;
        expect(ans).toBeCloseTo(180 - ext, 9);
        const extStep = p.steps.find((s) => s.id === 'ext') as NumberStep;
        expect(extStep.answer.value).toBeCloseTo(ext, 9);
      }
    });
  });
  it('irregular polygons: totals from the marked angles', () => {
    each('irregular', 400, (p) => {
      const d = p.diagram as { exteriors: number[]; unknownIndex: number; mode: string };
      const n = d.exteriors.length;
      const ext = d.exteriors[d.unknownIndex];
      const knownExt = d.exteriors.filter((_, i) => i !== d.unknownIndex).reduce((a, b) => a + b, 0);
      expect(knownExt + ext).toBe(360);
      if (d.mode === 'exterior') expect(finalNumber(p)).toBe(360 - knownExt);
      else {
        const knownInt = d.exteriors.filter((_, i) => i !== d.unknownIndex).reduce((a, b) => a + (180 - b), 0);
        expect(finalNumber(p)).toBe(180 * (n - 2) - knownInt);
      }
    });
  });
  it('parallelogram: measure angles on real coordinates', () => {
    each('parallelogram', 400, (p) => {
      const d = p.diagram as { angleS: number; labels: Record<string, string> };
      const a = (d.angleS * Math.PI) / 180;
      const S = [0, 0];
      const R = [7, 0];
      const P = [4 * Math.cos(a), 4 * Math.sin(a)];
      const Q = [P[0] + 7, P[1]];
      const T = [12, 0];
      const measured: Record<string, number> = { P: angle(S, P, Q), Q: angle(P, Q, R), R: angle(Q, R, S), QRT: angle(Q, R, T) };
      const vals = p.steps.filter((s) => s.id.startsWith('val-')) as NumberStep[];
      expect(vals.length).toBeGreaterThan(0);
      for (const v of vals) expect(v.answer.value).toBeCloseTo(measured[v.id.slice(4)], 9);
    });
  });
  it('lines, points and parallel lines', () => {
    each('angle-facts', 600, (p) => {
      const d = p.diagram!;
      if (d.type === 'straight-line' || d.type === 'around-point') {
        const total = d.type === 'straight-line' ? 180 : 360;
        const known = d.angles.filter((x) => !/^[a-z]$/.test(x.label)).reduce((s, x) => s + x.value, 0);
        expect(finalNumber(p)).toBe(total - known);
      } else if (d.type === 'parallel') {
        // Rays at a crossing: right 0°, transversal θ, left 180°, down 180+θ. Measure the marked angles.
        const th = (d.slope * Math.PI) / 180;
        const dir = (deg: number) => [Math.cos(deg), Math.sin(deg)];
        const rays = [dir(0), dir(th), dir(Math.PI), dir(Math.PI + th)];
        const quad: Record<string, [number, number]> = { tr: [0, 1], tl: [1, 2], bl: [2, 3], br: [3, 0] };
        const meas = (pos: string) => {
          const [i, j] = quad[pos.split('-')[1]];
          return angle(rays[i], [0, 0], rays[j]);
        };
        const g = Number(d.given.label.replace('^\\circ', ''));
        expect(g).toBeCloseTo(meas(d.given.pos), 9);
        expect(finalNumber(p)).toBeCloseTo(meas(d.unknown.pos), 9);
      } else throw new Error('unexpected diagram');
    });
  });
  it('Pythagoras: the three sides really form a right angle', () => {
    for (const id of ['find-hyp', 'find-short']) {
      each(id, 600, (p) => {
        const d = p.diagram as { a: number; b: number; labels: { a: string; b: string; c: string } };
        const ans = finalNumber(p);
        const known = [d.labels.a, d.labels.b, d.labels.c].filter((x) => /^\d/.test(x)).map(Number);
        if (id === 'find-hyp') {
          expect(Math.hypot(known[0], known[1])).toBeCloseTo(ans, 9);
          expect(ans).toBeGreaterThan(Math.max(...known));
        } else {
          const hyp = Number(d.labels.c);
          const leg = known.find((k) => k !== hyp) ?? known[0];
          expect(Math.sqrt(hyp * hyp - leg * leg)).toBeCloseTo(ans, 9);
          expect(ans).toBeLessThan(hyp);
          expect(ans * ans + leg * leg).toBeCloseTo(hyp * hyp, 6);
        }
      });
    }
    each('rect-diagonal', 600, (p) => {
      const d = p.diagram as { l: number; w: number };
      // Diagonal measured on coordinates of the rectangle's corners.
      expect(Math.hypot(d.l - 0, d.w - 0)).toBeCloseTo(finalNumber(p), 9);
    });
    each('hypotenuse', 300, (p) => {
      const d = p.diagram as { labels: { c: string } };
      const s = p.steps[0];
      expect(s.kind === 'choice' && s.options.find((o) => o.correct)!.label).toBe(`$${d.labels.c}$`);
    });
  });
  it('circles and the compound shape', () => {
    each('radius-diameter', 400, (p) => {
      const [v] = numbersIn(p.question);
      expect(finalNumber(p)).toBe(p.question.includes('What is its radius') ? v / 2 : v * 2);
    });
    for (const id of ['circumference', 'area']) {
      each(id, 400, (p) => {
        const [v] = numbersIn(p.question);
        const r = p.question.includes('has radius') ? v : v / 2;
        expect(finalNumber(p)).toBeCloseTo(id === 'area' ? 3.141592653589793 * r * r : 2 * 3.141592653589793 * r, 9);
      });
    }
    each('compound', 400, (p) => {
      const { w, h } = p.diagram as { w: number; h: number };
      // Numerical integration of the outline's area (independent of any formula).
      const N = 200000;
      let area = 0;
      for (let i = 0; i < N; i++) {
        const x = -w / 2 + ((i + 0.5) * w) / N;
        area += (h + Math.sqrt(Math.max(0, (w / 2) ** 2 - x * x))) * (w / N);
      }
      expect(finalNumber(p)).toBeCloseTo(area, 3);
    });
  });
  it('mass and standard form', () => {
    each('mass', 600, (p) => {
      const last = p.steps[p.steps.length - 1];
      if (last.kind !== 'decimal') throw new Error('mass last step');
      const m = /Write \$([\d{},.]+)\$ (tonnes|kilograms|grams|milligrams) in (tonnes|kilograms|grams|milligrams)/.exec(p.question)!;
      const v = Number(m[1].replace(/\{,\}/g, ''));
      const g: Record<string, number> = { tonnes: 1e6, kilograms: 1e3, grams: 1, milligrams: 1e-3 };
      const expected = (v * g[m[2]]) / g[m[3]];
      expect(Number(last.target)).toBeCloseTo(expected, 6);
    });
    each('units-sf', 400, (p) => {
      const last = p.steps[p.steps.length - 1];
      if (last.kind !== 'sf') throw new Error('sf last step');
      const m = /\$([\d.]+)\$ (nm|μm)\./.exec(p.question)!;
      const metres = Number(m[1]) * (m[2] === 'nm' ? 1e-9 : 1e-6);
      const c = Number(last.target.coef);
      expect(c >= 1 && c < 10).toBe(true);
      expect(c * 10 ** last.target.exp).toBeCloseTo(metres, 18);
      expect(Math.abs(c * 10 ** last.target.exp - metres) / metres).toBeLessThan(1e-12);
    });
    each('standard-form', 400, (p) => {
      const last = p.steps[p.steps.length - 1];
      if (last.kind !== 'sf') throw new Error('sf last step');
      const m = /Write \$([\d{},.]+)\$ in standard form/.exec(p.question)!;
      const v = Number(m[1].replace(/\{,\}/g, ''));
      const c = Number(last.target.coef);
      expect(c >= 1 && c < 10).toBe(true);
      expect(Math.abs(c * 10 ** last.target.exp - v) / v).toBeLessThan(1e-12);
    });
  });
  it('cube facts', () => {
    each('cube-dimensions', 300, (p) => {
      const size = Number((p.diagram as { size: string }).size);
      for (const s of p.steps) {
        if (s.kind !== 'number') continue;
        const expected: Record<string, number> = { faces: 6, edges: 12, length: size, area: size * size, 'total-edge': 12 * size };
        expect(s.answer.value).toBe(expected[s.id]);
      }
    });
  });
});

describe('why Pythagoras works: transfer questions', () => {
  it('every generated answer is right (plain arithmetic, no app maths)', () => {
    each('pythagoras-why', 900, (p) => {
      const nums = numbersIn(p.question.replace(/\$/g, ' '));
      const last = p.steps[p.steps.length - 1];
      if (p.question.startsWith('The two shorter sides')) {
        const [a, b] = nums;
        let c = 1;
        while (c * c < a * a + b * b) c++;
        expect(c * c).toBe(a * a + b * b); // whole-number triple
        expect(finalNumber(p)).toBe(c);
      } else if (p.question.startsWith('A right-angled triangle has hypotenuse')) {
        const [c, k] = nums;
        let x = 1;
        while (x * x < c * c - k * k) x++;
        expect(x * x).toBe(c * c - k * k);
        expect(finalNumber(p)).toBe(x);
        expect(x * x + k * k).toBe(c * c);
      } else if (p.question.startsWith('A triangle has sides')) {
        const [x, y, z] = nums;
        const right = x * x + y * y === z * z;
        expect(last.kind).toBe('choice');
        if (last.kind === 'choice') expect(last.options.find((o) => o.correct)!.id).toBe(right ? 'yes' : 'no');
        expect(x + y > z).toBe(true); // a real triangle either way
      } else throw new Error(`unexpected question: ${p.question}`);
    });
  });
  it('worked examples are the 5-12-13 transfer and the 3-5 → 4 missing side', () => {
    const l = lesson('pythagoras-why');
    expect(finalNumber(l.guided())).toBe(13);
    expect(l.guided().question).toContain('$5$ and $12$');
    const m = l.moreGuided![0]();
    expect(finalNumber(m)).toBe(4);
    expect(m.question).toContain('hypotenuse $5$ and one shorter side $3$');
  });
});
