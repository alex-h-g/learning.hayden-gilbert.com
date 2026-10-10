export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Weighted sampling without replacement. Items with weight ≤ 0 are skipped. */
export function weightedSample<T>(items: readonly T[], weight: (t: T) => number, n: number, rng: Rng = Math.random): T[] {
  const pool = items.map((item) => ({ item, w: Math.max(0, weight(item)) })).filter((x) => x.w > 0);
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, x) => s + x.w, 0);
    let r = rng() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].w;
      if (r < 0) {
        idx = i;
        break;
      }
    }
    out.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  return out;
}

/** Small deterministic PRNG for tests. */
export function seeded(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
