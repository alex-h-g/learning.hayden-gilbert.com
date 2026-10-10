/**
 * Planes through a cube centred at the origin with vertices (±1, ±1, ±1).
 * A plane is n · p = d (n need not be unit length).
 */
export interface Plane {
  id: string;
  n: [number, number, number];
  d: number;
  /** Learner-facing description. */
  label: string;
  family: 'face' | 'edge' | 'not';
  /** Why it is or isn't a plane of symmetry. */
  why: string;
}

export const SYMMETRY_PLANES: readonly Plane[] = [
  { id: 'x', n: [1, 0, 0], d: 0, family: 'face', label: 'A vertical cut halfway between the left and right faces', why: 'Halfway between left and right, parallel to both: each half is a mirror image of the other.' },
  { id: 'y', n: [0, 1, 0], d: 0, family: 'face', label: 'A horizontal cut halfway up', why: 'Halfway up, parallel to the top and bottom faces: the top half reflects onto the bottom half.' },
  { id: 'z', n: [0, 0, 1], d: 0, family: 'face', label: 'A cut halfway between the front and back faces', why: 'Halfway between front and back, parallel to both: the halves are mirror images.' },
  { id: 'xy', n: [1, -1, 0], d: 0, family: 'edge', label: 'A diagonal cut through two opposite edges', why: 'It passes through two opposite edges and the diagonals of two faces. Each half is a mirror image.' },
  { id: 'x+y', n: [1, 1, 0], d: 0, family: 'edge', label: 'The other diagonal cut through two opposite edges', why: 'It passes through two opposite edges and the diagonals of two faces. Each half is a mirror image.' },
  { id: 'yz', n: [0, 1, -1], d: 0, family: 'edge', label: 'A diagonal cut through two opposite edges', why: 'It passes through two opposite edges and the diagonals of two faces. Each half is a mirror image.' },
  { id: 'y+z', n: [0, 1, 1], d: 0, family: 'edge', label: 'A diagonal cut through two opposite edges', why: 'It passes through two opposite edges and the diagonals of two faces. Each half is a mirror image.' },
  { id: 'xz', n: [1, 0, -1], d: 0, family: 'edge', label: 'A diagonal cut through two opposite edges', why: 'It passes through two opposite edges and the diagonals of two faces. Each half is a mirror image.' },
  { id: 'x+z', n: [1, 0, 1], d: 0, family: 'edge', label: 'A diagonal cut through two opposite edges', why: 'It passes through two opposite edges and the diagonals of two faces. Each half is a mirror image.' },
];

/** Planes that look tempting but are NOT planes of symmetry. */
export const TRICK_PLANES: readonly Plane[] = [
  { id: 'off-x', n: [1, 0, 0], d: 0.45, family: 'not', label: 'A cut parallel to a face, but not halfway', why: 'The two pieces are different sizes, so one can’t be the mirror image of the other.' },
  { id: 'off-y', n: [0, 1, 0], d: -0.5, family: 'not', label: 'A horizontal cut below halfway', why: 'The two pieces are different sizes, so they aren’t mirror images.' },
  { id: 'corner', n: [1, 1, 1], d: 1, family: 'not', label: 'A cut slicing off one corner', why: 'It just chops off a small corner — the pieces are completely different.' },
  { id: 'hex', n: [1, 1, 1], d: 0, family: 'not', label: 'A slanted cut through the centre, making a hexagon', why: 'It goes through the centre, but reflect a corner in it and you don’t land on a corner. The halves match by turning, not by mirroring.' },
  { id: 'tilt', n: [2, 1, 0], d: 0, family: 'not', label: 'A slightly tilted cut through the centre', why: 'Its tilt doesn’t match the cube’s edges or diagonals, so the reflection of a corner doesn’t land on a corner.' },
];

export const ALL_PLANES = [...SYMMETRY_PLANES, ...TRICK_PLANES];
export const planeById = (id: string) => ALL_PLANES.find((p) => p.id === id);

export type V3 = [number, number, number];

export const CUBE_VERTICES: V3[] = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) CUBE_VERTICES.push([x, y, z]);

export const CUBE_EDGES: [number, number][] = [];
for (let i = 0; i < 8; i++)
  for (let j = i + 1; j < 8; j++) {
    const a = CUBE_VERTICES[i];
    const b = CUBE_VERTICES[j];
    if (a.filter((v, k) => v !== b[k]).length === 1) CUBE_EDGES.push([i, j]);
  }

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Reflects a point in the plane n · p = d. */
export function reflect(p: V3, pl: Plane): V3 {
  const nn = dot(pl.n, pl.n);
  const k = (2 * (dot(pl.n, p) - pl.d)) / nn;
  return [p[0] - k * pl.n[0], p[1] - k * pl.n[1], p[2] - k * pl.n[2]];
}

/** True if reflecting every vertex lands on a vertex (the definition of a plane of symmetry). */
export function isSymmetryPlane(pl: Plane): boolean {
  return CUBE_VERTICES.every((v) => {
    const r = reflect(v, pl);
    return CUBE_VERTICES.some((w) => Math.abs(w[0] - r[0]) + Math.abs(w[1] - r[1]) + Math.abs(w[2] - r[2]) < 1e-9);
  });
}

/** Polygon where the plane cuts the cube, vertices in order (empty if it misses). */
export function planeSection(pl: Plane): V3[] {
  const pts: V3[] = [];
  const add = (p: V3) => {
    if (!pts.some((q) => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) + Math.abs(q[2] - p[2]) < 1e-9)) pts.push(p);
  };
  for (const [i, j] of CUBE_EDGES) {
    const a = CUBE_VERTICES[i];
    const b = CUBE_VERTICES[j];
    const fa = dot(pl.n, a) - pl.d;
    const fb = dot(pl.n, b) - pl.d;
    if (Math.abs(fa) < 1e-9) add(a);
    if (Math.abs(fb) < 1e-9) add(b);
    if (fa * fb < -1e-18) {
      const t = fa / (fa - fb);
      add([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])]);
    }
  }
  if (pts.length < 3) return [];
  const c: V3 = [0, 1, 2].map((k) => pts.reduce((s, p) => s + p[k], 0) / pts.length) as V3;
  // Basis in the plane.
  const n = pl.n;
  const u0: V3 = Math.abs(n[0]) < 0.9 ? [0, n[2], -n[1]] : [n[2], 0, -n[0]];
  const lu = Math.hypot(...u0);
  const u: V3 = [u0[0] / lu, u0[1] / lu, u0[2] / lu];
  const w: V3 = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  return pts
    .map((p) => {
      const d: V3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
      return { p, a: Math.atan2(dot(d, w), dot(d, u)) };
    })
    .sort((x, y) => x.a - y.a)
    .map((x) => x.p);
}
