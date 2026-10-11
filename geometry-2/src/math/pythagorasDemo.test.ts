import { describe, expect, it } from 'vitest';
import { demoGeometry, targetColour, tileAt, tilePlan, type V } from './pythagorasDemo';

const d = (p: V, q: V) => Math.hypot(p.x - q.x, p.y - q.y);
const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 9);

/** Is point p inside the convex polygon (corners in order)? */
function inside(p: V, poly: V[]) {
  let sign = 0;
  for (let k = 0; k < poly.length; k++) {
    const a = poly[k];
    const b = poly[(k + 1) % poly.length];
    const cr = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (Math.abs(cr) < 1e-12) continue;
    const s = Math.sign(cr);
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}
const area = (poly: V[]) => Math.abs(poly.reduce((s, p, k) => { const q = poly[(k + 1) % poly.length]; return s + p.x * q.y - q.x * p.y; }, 0)) / 2;

describe('3-4-5 triangle and its squares', () => {
  const g = demoGeometry();
  it('triangle has sides 3, 4, 5 and a right angle at R', () => {
    close(d(g.R, g.A), 3);
    close(d(g.R, g.B), 4);
    close(d(g.A, g.B), 5);
    const dot = (g.A.x - g.R.x) * (g.B.x - g.R.x) + (g.A.y - g.R.y) * (g.B.y - g.R.y);
    close(dot, 0);
  });
  it('hypotenuse is the side opposite the right angle and the longest', () => {
    expect(d(g.A, g.B)).toBeGreaterThan(d(g.R, g.A));
    expect(d(g.A, g.B)).toBeGreaterThan(d(g.R, g.B));
  });
  it('each square is a real square on its side, drawn outside the triangle', () => {
    const tri = [g.R, g.A, g.B];
    const triC = { x: (g.R.x + g.A.x + g.B.x) / 3, y: (g.R.y + g.A.y + g.B.y) / 3 };
    for (const [sq, n] of [[g.squares.a, 3], [g.squares.b, 4], [g.squares.c, 5]] as const) {
      const [p0, p1, p2, p3] = sq.corners;
      for (const [p, q] of [[p0, p1], [p1, p2], [p2, p3], [p3, p0]]) close(d(p, q), n);
      close(d(p0, p2), n * Math.SQRT2); // equal diagonals → square
      close(d(p1, p3), n * Math.SQRT2);
      close(area(sq.corners), n * n);
      expect(inside(sq.centre, tri)).toBe(false);
      expect(inside(triC, sq.corners)).toBe(false);
    }
    // Attached exactly to the sides.
    expect([g.squares.a.corners[0], g.squares.a.corners[1]]).toEqual([g.R, g.A]);
    expect([g.squares.c.corners[0], g.squares.c.corners[1]]).toEqual([g.A, g.B]);
  });
  it('cell counts: 9, 16 and 25 unit cells that exactly fill each square', () => {
    for (const [sq, n] of [[g.squares.a, 9], [g.squares.b, 16], [g.squares.c, 25]] as const) {
      expect(sq.cells).toHaveLength(n);
      let total = 0;
      for (const cell of sq.cells) {
        close(area(cell.corners), 1);
        total += area(cell.corners);
        expect(inside(cell.centre, sq.corners)).toBe(true);
      }
      close(total, sq.side * sq.side);
      // No two cells share a centre (no overlaps).
      const keys = new Set(sq.cells.map((c) => `${c.centre.x.toFixed(6)},${c.centre.y.toFixed(6)}`));
      expect(keys.size).toBe(n);
      // Neighbouring cell centres are exactly 1 unit apart → no gaps.
      for (const cell of sq.cells) {
        const nearest = Math.min(...sq.cells.filter((o) => o !== cell).map((o) => d(o.centre, cell.centre)));
        close(nearest, 1);
      }
    }
  });
});

describe('the tiles filling the hypotenuse square', () => {
  const g = demoGeometry();
  const plan = tilePlan(g);
  it('9 blue + 16 orange tiles = 25, one per target cell, no gaps or overlaps', () => {
    expect(plan.filter((t) => t.colour === 'blue')).toHaveLength(9);
    expect(plan.filter((t) => t.colour === 'orange')).toHaveLength(16);
    expect(plan).toHaveLength(25);
    const targets = plan.map((t) => t.target);
    expect(new Set(targets).size).toBe(25);
    expect(targets.every((t) => t >= 0 && t < 25)).toBe(true);
    expect(new Set(plan.map((t) => t.key)).size).toBe(25);
  });
  it('final grid has exactly 9 blue and 16 orange cells, matching the plan', () => {
    const colours = g.squares.c.cells.map((c) => targetColour(c.i, c.j));
    expect(colours.filter((c) => c === 'blue')).toHaveLength(9);
    expect(colours.filter((c) => c === 'orange')).toHaveLength(16);
    for (const t of plan) expect(t.colour).toBe(colours[t.target]);
  });
  it('tiles start on their own square and end exactly on their target cell', () => {
    for (const t of plan) {
      const src = t.colour === 'blue' ? g.squares.a : g.squares.b;
      const s = tileAt(t, 0);
      expect(src.cells.some((c) => d(c.centre, s.centre) < 1e-9)).toBe(true);
      const e = tileAt(t, 1);
      expect(d(e.centre, g.squares.c.cells[t.target].centre)).toBeLessThan(1e-9);
      expect(e.arrived).toBe(true);
      // Lined up with the big square's grid (a square repeats every 90°).
      const diff = (((e.angle - g.squares.c.cells[t.target].angle) % 90) + 90) % 90;
      expect(Math.min(diff, 90 - diff)).toBeLessThan(1e-9);
    }
  });
  it('the orange block moves together and keeps its shape', () => {
    const o = plan.filter((t) => t.colour === 'orange');
    for (const p of [0, 0.1, 0.25, 0.4, 1]) {
      const pos = o.map((t) => tileAt(t, p).centre);
      // Every pair keeps its distance → moved as one rigid block.
      for (let i = 0; i < pos.length; i++)
        for (let j = i + 1; j < pos.length; j++) close(d(pos[i], pos[j]), d(tileAt(o[i], 0).centre, tileAt(o[j], 0).centre));
    }
  });
  it('blue tiles move one after another, after the orange block arrives', () => {
    const o = plan.filter((t) => t.colour === 'orange');
    const b = plan.filter((t) => t.colour === 'blue');
    expect(Math.max(...o.map((t) => t.end))).toBeLessThanOrEqual(Math.min(...b.map((t) => t.start)));
    expect(Math.max(...b.map((t) => t.end))).toBeLessThanOrEqual(1);
  });
  it('the plan is deterministic (replay gives the same layout)', () => {
    expect(JSON.stringify(tilePlan())).toBe(JSON.stringify(plan));
  });
});
