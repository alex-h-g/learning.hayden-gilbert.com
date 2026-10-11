import { describe, expect, it } from 'vitest';
import * as M from './core';
import { parseAnswer } from './parse';
import { checkExactDecimal, checkNumber, checkStandardForm, piTol, dpTol } from './validate';

describe('polygon angles', () => {
  it('interior sums', () => {
    expect(M.interiorAngleSum(3)).toBe(180);
    expect(M.interiorAngleSum(4)).toBe(360);
    expect(M.interiorAngleSum(8)).toBe(1080); // worksheet Q1a
    for (let n = 3; n <= 40; n++) expect(M.interiorAngleSum(n)).toBe(M.trianglesFromVertex(n) * 180);
  });
  it('regular polygons', () => {
    expect(M.regularInteriorAngle(8)).toBe(135); // Q1b
    expect(M.regularExteriorAngle(9)).toBe(40); // Q2
    expect(M.interiorFromExterior(40)).toBe(140); // Q2
    for (let n = 3; n <= 40; n++) {
      expect(M.regularInteriorAngle(n) + M.regularExteriorAngle(n)).toBeCloseTo(180, 9);
      expect(M.regularExteriorAngle(n) * n).toBeCloseTo(360, 9);
    }
    expect(M.sidesFromExterior(24)).toBe(15);
    expect(M.sidesFromExterior(25)).toBeNull();
  });
  it('irregular polygon exterior angles (Q3)', () => {
    expect(M.missingExteriorAngle([70, 48, 62, 85])).toBe(95);
    expect(() => M.missingExteriorAngle([200, 170])).toThrow();
    expect(M.missingInteriorAngle([100, 110, 120, 105])).toBe(540 - 435);
  });
  it('parallelogram (Q4, corrected)', () => {
    const a = M.parallelogramAngles(70);
    expect(a).toEqual({ P: 110, Q: 70, R: 110, S: 70, QRT: 70 });
    for (let s = 30; s < 150; s++) {
      if (s === 90) continue;
      const p = M.parallelogramAngles(s);
      expect(p.P + p.Q + p.R + p.S).toBe(360);
      expect(p.R + p.QRT).toBe(180);
    }
  });
  it('line, point, parallel lines', () => {
    expect(M.missingOnStraightLine([40, 65])).toBe(75);
    expect(M.missingAroundPoint([90, 120, 85])).toBe(65);
    expect(M.parallelLineAngle(70, 'co-interior')).toBe(110);
    expect(M.parallelLineAngle(70, 'alternate')).toBe(70);
  });
  it('builds a closed drawing from exterior angles', () => {
    const rng = (() => { let s = 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const pts = M.polygonFromExteriorAngles([70, 48, 62, 85, 95], rng)!;
    expect(pts).toHaveLength(5);
    // Turning angle at each vertex equals the exterior angle given.
    const n = pts.length;
    const heading = (a: M.Pt, b: M.Pt) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const ext = [70, 48, 62, 85, 95];
    for (let i = 0; i < n; i++) {
      const h1 = heading(pts[(i - 1 + n) % n], pts[i]);
      const h2 = heading(pts[i], pts[(i + 1) % n]);
      const turn = (((h2 - h1) % 360) + 360) % 360;
      expect(turn).toBeCloseTo(ext[(i - 1 + n) % n], 6);
    }
  });
});

describe('Pythagoras', () => {
  it('worksheet Q7 and Q8', () => {
    expect(M.shorterSide(20, 16)).toBe(12);
    expect(M.shorterSide(12, 9) ** 2).toBeCloseTo(63, 9);
    expect(M.fixed(M.shorterSide(12, 9), 2)).toBe('7.94');
    expect(M.simplifySurd(63)).toEqual({ k: 3, m: 7 });
    expect(M.surdTex(63)).toBe('3\\sqrt{7}');
    expect(M.rectangleDiagonal(12, 5)).toBe(13);
  });
  it('triples are right-angled', () => {
    for (const [a, b, c] of M.PYTHAGOREAN_TRIPLES) expect(M.isRightTriangle(a, b, c)).toBe(true);
  });
  it('rejects a hypotenuse that is not longest', () => {
    expect(() => M.shorterSide(5, 9)).toThrow();
  });
  it('surds', () => {
    expect(M.simplifySurd(72)).toEqual({ k: 6, m: 2 });
    expect(M.simplifySurd(17)).toEqual({ k: 1, m: 17 });
    expect(M.simplifySurd(144)).toEqual({ k: 12, m: 1 });
  });
});

describe('constructions', () => {
  it('triangle inequality', () => {
    expect(M.isValidTriangle(5, 8, 9)).toBe(true);
    expect(M.isValidTriangle(3, 4, 7)).toBe(false);
    expect(M.isValidTriangle(2, 3, 9)).toBe(false);
  });
  it('compass arcs meet at the third vertex (Q5)', () => {
    const A = { x: 0, y: 0 };
    const B = { x: 9, y: 0 };
    const [C] = M.circleIntersections(A, 5, B, 8);
    expect(M.dist(A, C)).toBeCloseTo(5, 9);
    expect(M.dist(B, C)).toBeCloseTo(8, 9);
  });
  it('perpendicular bisector through arc intersections', () => {
    const A = { x: 1, y: 2 };
    const B = { x: 10, y: 5 };
    const [P, Q] = M.circleIntersections(A, 6, B, 6);
    const X = M.lineCrossesSegment(P, Q, A, B)!;
    const mid = M.midpoint(A, B);
    expect(X.x).toBeCloseTo(mid.x, 9);
    expect(X.y).toBeCloseTo(mid.y, 9);
    expect(M.angleBetweenLines(P, Q, A, B)).toBeCloseTo(90, 9);
  });
});

describe('circles and compound shape', () => {
  it('Q9 garden d = 14', () => {
    const r = M.radiusFromDiameter(14);
    expect(r).toBe(7);
    expect(M.circumference(r)).toBeCloseTo(14 * Math.PI, 12);
    expect(M.fixed(M.circumference(r))).toBe('43.98');
    expect(M.fixed(M.circleArea(r))).toBe('153.94');
  });
  it('Q10 compound 8 × 6 + semicircle', () => {
    const c = M.compoundRectSemicircle(8, 6);
    expect(c.r).toBe(4);
    expect(c.rect).toBe(48);
    expect(c.semiExact).toEqual({ rational: 0, piCoeff: 8 });
    expect(c.semi).toBeCloseTo(c.fullCircle / 2, 12);
    expect(M.fixed(c.semi)).toBe('25.13');
    expect(M.fixed(c.total)).toBe('73.13');
    expect(M.piTex(c.totalExact)).toBe('48 + 8\\pi');
    expect(c.total).toBeCloseTo(c.rect + c.semi, 12);
  });
});

describe('exact decimals, units, standard form', () => {
  const d = (s: string) => M.parseDec(s)!;
  it('Q11 tonnes to kg', () => {
    expect(M.decToString(M.convertMass(d('64.8'), 't', 'kg'), true)).toBe('64,800');
    expect(M.decToString(M.convertMass(d('1'), 't', 'mg'))).toBe('1000000000');
    expect(M.decToString(M.convertMass(d('2.5'), 'mg', 'g'))).toBe('0.0025');
  });
  it('Q12 350 nm in metres', () => {
    const m = M.convertLength(d('350'), 'nm', 'm');
    expect(M.decToString(m)).toBe('0.00000035');
    const sf = M.toStandardForm(m);
    expect(M.decToString(sf.coef)).toBe('3.5');
    expect(sf.exp).toBe(-7);
  });
  it('standard form round trips', () => {
    for (const s of ['4800000', '0.00035', '7', '9.99', '12', '0.1', '1000000000']) {
      const sf = M.toStandardForm(d(s));
      expect(M.isValidCoefficient(sf.coef)).toBe(true);
      expect(M.decToNumber(sf.coef) * 10 ** sf.exp).toBeCloseTo(Number(s), 9);
    }
  });
  it('prefixes', () => {
    expect(M.prefixFactorString(M.prefixByName('kilo'))).toBe('1,000');
    expect(M.prefixFactorString(M.prefixByName('micro'))).toBe('0.000001');
    expect(M.prefixFactorString(M.prefixByName('giga'))).toBe('1,000,000,000');
    expect(M.PREFIXES.map((p) => p.power)).toEqual([9, 6, 3, 2, 1, 0, -1, -2, -3, -6, -9]);
  });
});

describe('answer parser', () => {
  const v = (s: string) => { const r = parseAnswer(s); return r.ok ? r.parsed.value : null; };
  it('numbers and units', () => {
    expect(v('1080')).toBe(1080);
    expect(v('1080°')).toBe(1080);
    expect(v('64,800 kg')).toBe(64800);
    expect(v('13 cm')).toBe(13);
    expect(v('25.13 cm²')).toBe(25.13);
    expect(v(' -7 ')).toBe(-7);
  });
  it('π and roots', () => {
    expect(v('14π')).toBeCloseTo(14 * Math.PI, 12);
    expect(v('48 + 8π')).toBeCloseTo(48 + 8 * Math.PI, 12);
    expect(v('8pi+48')).toBeCloseTo(48 + 8 * Math.PI, 12);
    expect(v('√63')).toBeCloseTo(Math.sqrt(63), 12);
    expect(v('3√7')).toBeCloseTo(Math.sqrt(63), 12);
    expect(v('sqrt(63)')).toBeCloseTo(Math.sqrt(63), 12);
    expect(v('π×7²')).toBeCloseTo(49 * Math.PI, 12);
    expect(v('16π/2')).toBeCloseTo(8 * Math.PI, 12);
  });
  it('rejects junk and digit-hunting', () => {
    expect(parseAnswer('').ok).toBe(false);
    expect(parseAnswer('   ').ok).toBe(false);
    expect(parseAnswer('abc 12').ok).toBe(false);
    expect(parseAnswer('12 12').ok).toBe(false);
    expect(parseAnswer('3,5').ok).toBe(false);
    expect(v('1212')).toBe(1212);
  });
});

describe('validators', () => {
  it('integers need exact values', () => {
    const a = { value: 1080, tol: 0 };
    expect(checkNumber('1080', a).status).toBe('correct');
    expect(checkNumber('1081', a).status).toBe('wrong');
    expect(checkNumber('', a).status).toBe('empty');
    expect(checkNumber('10 80', a).status).toBe('invalid');
  });
  it('π answers: exact or 2 dp', () => {
    const t = M.compoundRectSemicircle(8, 6).total;
    const a = { value: t, tol: piTol(t), allowExact: true };
    expect(checkNumber('48 + 8π', a).status).toBe('correct');
    expect(checkNumber('73.13', a).status).toBe('correct');
    expect(checkNumber('73.12', a).status).toBe('correct'); // π ≈ 3.14
    expect(checkNumber('73', a).status).not.toBe('correct');
    expect(checkNumber('48 + 16π', a).status).toBe('wrong');
    expect(checkNumber('80.57', a).status).toBe('wrong'); // added a full circle
  });
  it('surds', () => {
    const v = Math.sqrt(63);
    const a = { value: v, tol: dpTol(2), allowExact: true };
    for (const s of ['7.94', '√63', '3√7', '7.937']) expect(checkNumber(s, a).status).toBe('correct');
    expect(checkNumber('7.9', a).status).toBe('close');
    expect(checkNumber('8', a).status).not.toBe('correct');
  });
  it('exact forms not allowed for counts', () => {
    expect(checkNumber('2π', { value: 2 * Math.PI, tol: 0 }).status).toBe('close');
  });
  it('standard form', () => {
    const target = M.toStandardForm(M.parseDec('0.00000035')!);
    expect(checkStandardForm('3.5', '-7', target).status).toBe('correct');
    expect(checkStandardForm('3.5', '−7', target).status).toBe('correct');
    expect(checkStandardForm('35', '-8', target).status).toBe('close');
    expect(checkStandardForm('3.5', '7', target).status).toBe('close');
    expect(checkStandardForm('3.5', '-9', target).status).toBe('wrong');
    expect(checkStandardForm('', '', target).status).toBe('empty');
    expect(checkStandardForm('3.5', '2.5', target).status).toBe('invalid');
  });
  it('exact decimals', () => {
    const t = M.parseDec('64800')!;
    expect(checkExactDecimal('64800', t).status).toBe('correct');
    expect(checkExactDecimal('64,800 kg', t).status).toBe('correct');
    expect(checkExactDecimal('6480', t).status).toBe('close');
    expect(checkExactDecimal('65000', t).status).toBe('wrong');
  });
});

describe('unit converter arithmetic (exact)', () => {
  it('converts by powers of ten with no floating-point drift', () => {
    const c = (v: string, a: number, b: number) => M.decToString(M.convertPower(M.parseDec(v)!, a, b), true);
    expect(c('64.8', 6, 3)).toBe('64,800'); // t → kg
    expect(c('350', -9, 0)).toBe('0.00000035'); // nm → m
    expect(c('0.1', 0, -3)).toBe('100');
    expect(c('0.3', 3, 0)).toBe('300'); // 0.3 km = 300 m, not 299.99999
    expect(c('2.5', 3, -3)).toBe('2,500,000'); // km → mm
    expect(c('7', -3, 3)).toBe('0.000007');
  });
});

import { emptyDemo, sanitise } from '../lib/store';
describe('demonstration progress storage', () => {
  it('is sanitised and kept separate from mastery', () => {
    const d = sanitise({ demos: { 'pythagoras-squares': { completed: true, hypotenuse: 'first', hints: 2, squaresUnderstood: 'yes', junk: 1 }, bad: 5 } });
    expect(d.demos['pythagoras-squares']).toEqual({ ...emptyDemo(), completed: true, hypotenuse: 'first', hints: 2 });
    expect(d.demos.bad).toBeUndefined();
    expect(d.lessons['pythagoras-why']).toBeUndefined(); // watching never marks mastery
    expect(sanitise({ demos: 'nope' }).demos).toEqual({});
  });
});
