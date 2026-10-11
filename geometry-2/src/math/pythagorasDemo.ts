/**
 * Geometry and tile layout for the "Why Pythagoras works" demonstration.
 *
 * Everything is computed from real coordinates (units, maths axes: y up):
 *   right angle R = (0, 0), side a = 3 up the y-axis to A = (0, 3),
 *   side b = 4 along the x-axis to B = (4, 0), hypotenuse c = AB = 5.
 * Squares are built outward on each side; each is split into unit cells.
 *
 * The hypotenuse square's 25 cells are filled deterministically:
 *   the 16 orange cells move across as one 4 × 4 block (cells i < 4 and j < 4),
 *   the 9 blue cells are rearranged one by one into the L-shaped strip that's left.
 * Every target cell is used exactly once, so there are no gaps or overlaps.
 */

export type V = { x: number; y: number };
export type Colour = 'blue' | 'orange' | 'green';

export const SIDE_A = 3;
export const SIDE_B = 4;
export const SIDE_C = 5;

const add = (p: V, q: V): V => ({ x: p.x + q.x, y: p.y + q.y });
const mul = (p: V, k: number): V => ({ x: p.x * k, y: p.y * k });
const sub = (p: V, q: V): V => ({ x: p.x - q.x, y: p.y - q.y });

export interface Cell {
  /** Grid position within its square: i along the first edge, j outward. */
  i: number;
  j: number;
  centre: V;
  /** Corners in order. */
  corners: V[];
  /** Rotation of the cell (degrees, maths convention: anticlockwise). */
  angle: number;
}

export interface SquareOnSide {
  id: 'a' | 'b' | 'c';
  colour: Colour;
  side: number;
  /** The square's four corners: start, end of the triangle side, then outward. */
  corners: V[];
  cells: Cell[];
  centre: V;
}

/** Builds the square on the edge P→Q, on the side away from the point `away`, split into n × n cells. */
function squareOn(id: SquareOnSide['id'], colour: Colour, P: V, Q: V, away: V, n: number): SquareOnSide {
  const u = sub(Q, P); // along the side, length n
  let v: V = { x: -u.y, y: u.x }; // perpendicular, same length
  // Point v away from the triangle.
  const mid = mul(add(P, Q), 0.5);
  if ((away.x - mid.x) * v.x + (away.y - mid.y) * v.y > 0) v = mul(v, -1);
  const corners = [P, Q, add(Q, v), add(P, v)];
  const angle = (Math.atan2(u.y, u.x) * 180) / Math.PI;
  const cells: Cell[] = [];
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const at = (s: number, t: number) => add(P, add(mul(u, s / n), mul(v, t / n)));
      cells.push({
        i,
        j,
        centre: at(i + 0.5, j + 0.5),
        corners: [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)],
        angle,
      });
    }
  return { id, colour, side: n, corners, cells, centre: mul(add(P, add(Q, v)), 0.5) };
}

export interface DemoGeometry {
  R: V;
  A: V;
  B: V;
  squares: { a: SquareOnSide; b: SquareOnSide; c: SquareOnSide };
}

export function demoGeometry(): DemoGeometry {
  const R = { x: 0, y: 0 };
  const A = { x: 0, y: SIDE_A };
  const B = { x: SIDE_B, y: 0 };
  return {
    R,
    A,
    B,
    squares: {
      a: squareOn('a', 'blue', R, A, B, SIDE_A),
      b: squareOn('b', 'orange', B, R, A, SIDE_B),
      c: squareOn('c', 'green', A, B, R, SIDE_C),
    },
  };
}

export interface Tile {
  key: string;
  colour: 'blue' | 'orange';
  from: { centre: V; angle: number };
  to: { centre: V; angle: number };
  /** Index of the target cell in the hypotenuse square. */
  target: number;
  /** When this tile starts and ends its move, as fractions of the whole animation. */
  start: number;
  end: number;
  /** Set for tiles that move together as one rigid block: turn about the block's centre while it slides. */
  block?: { from: V; to: V; turn: number };
}

const rot = (p: V, deg: number): V => {
  const r = (deg * Math.PI) / 180;
  return { x: p.x * Math.cos(r) - p.y * Math.sin(r), y: p.x * Math.sin(r) + p.y * Math.cos(r) };
};
const mean = (ps: V[]): V => mul(ps.reduce(add, { x: 0, y: 0 }), 1 / ps.length);

/** Target cells in the 5 × 5 square: the 4 × 4 orange block, and the 9-cell blue L. */
export function targetColour(i: number, j: number): 'blue' | 'orange' {
  return i < SIDE_B && j < SIDE_B ? 'orange' : 'blue';
}

/**
 * The fixed plan for every moving tile. Orange first (as a block), then the
 * blue tiles one after another. Deterministic: the same every time.
 */
export function tilePlan(g: DemoGeometry = demoGeometry()): Tile[] {
  const { a, b, c } = g.squares;
  // A square looks the same after a quarter turn, so take the smallest rotation that lines it up.
  const nearest = (from: number, to: number) => {
    let d = to - from;
    while (d > 45) d -= 90;
    while (d <= -45) d += 90;
    return from + d;
  };
  const tiles: Tile[] = [];
  // Orange block: the whole 4 × 4 square slides and turns as one rigid piece onto the
  // 4 × 4 corner of the big square. Of the four quarter-turn choices, take the smallest turn.
  const blockTargets = c.cells.map((cell, idx) => ({ cell, idx })).filter(({ cell }) => targetColour(cell.i, cell.j) === 'orange');
  const from = mean(b.cells.map((x) => x.centre));
  const to = mean(blockTargets.map((x) => x.cell.centre));
  const base = c.cells[0].angle - b.cells[0].angle;
  const turns = [0, 1, 2, 3].map((k) => {
    let t = base + 90 * k;
    while (t > 180) t -= 360;
    while (t <= -180) t += 360;
    return t;
  });
  const turn = turns.sort((p, q) => Math.abs(p) - Math.abs(q))[0];
  for (const cell of b.cells) {
    const landed = add(to, rot(sub(cell.centre, from), turn));
    const hit = blockTargets.find((x) => Math.hypot(x.cell.centre.x - landed.x, x.cell.centre.y - landed.y) < 1e-9);
    if (!hit) throw new Error('orange block does not land on the grid');
    tiles.push({
      key: `o${cell.i}-${cell.j}`,
      colour: 'orange',
      from: { centre: cell.centre, angle: cell.angle },
      to: { centre: hit.cell.centre, angle: cell.angle + turn },
      target: hit.idx,
      start: 0,
      end: 0.45,
      block: { from, to, turn },
    });
  }
  // Blue: the 9 cells of the L-shape, in order along the strip.
  const lCells = c.cells.map((cell, idx) => ({ cell, idx })).filter(({ cell }) => targetColour(cell.i, cell.j) === 'blue');
  lCells.sort((p, q) => (p.cell.i === SIDE_B ? p.cell.j : 10 + p.cell.i) - (q.cell.i === SIDE_B ? q.cell.j : 10 + q.cell.i));
  a.cells.forEach((cell, k) => {
    const { idx } = lCells[k];
    const s = 0.5 + k * 0.045;
    tiles.push({
      key: `b${cell.i}-${cell.j}`,
      colour: 'blue',
      from: { centre: cell.centre, angle: cell.angle },
      to: { centre: c.cells[idx].centre, angle: nearest(cell.angle, c.cells[idx].angle) },
      target: idx,
      start: s,
      end: s + 0.1,
    });
  });
  return tiles;
}

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/** Where a tile is at overall animation progress p (0 = start, 1 = finished). */
export function tileAt(tile: Tile, p: number): { centre: V; angle: number; arrived: boolean } {
  const local = Math.max(0, Math.min(1, (p - tile.start) / (tile.end - tile.start)));
  const e = ease(local);
  if (tile.block) {
    const { from, to, turn } = tile.block;
    const centre = add(add(from, mul(sub(to, from), e)), rot(sub(tile.from.centre, from), turn * e));
    return { centre, angle: tile.from.angle + turn * e, arrived: local >= 1 };
  }
  return {
    centre: add(tile.from.centre, mul(sub(tile.to.centre, tile.from.centre), e)),
    angle: tile.from.angle + (tile.to.angle - tile.from.angle) * e,
    arrived: local >= 1,
  };
}
