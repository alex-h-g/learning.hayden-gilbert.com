import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { seeded } from '../lib/random';
import { LESSONS } from './index';
import type { Difficulty, Problem } from './types';

/** Every piece of learner-facing text in a problem. */
function texts(p: Problem): string[] {
  const out = [p.intro, p.question, p.summary, p.answer];
  for (const s of p.steps) {
    out.push(s.prompt, s.explain, ...s.hints);
    if (s.kind === 'choice' || s.kind === 'multi') s.options.forEach((o) => out.push(o.label, o.feedback ?? ''));
    if (s.kind === 'number' || s.kind === 'decimal' || s.kind === 'sf') out.push(s.display);
    if ((s.kind === 'number' || s.kind === 'decimal') && s.label) out.push(s.label);
  }
  return out;
}

function checkText(t: string, where: string) {
  // No control characters (a mistyped "\t" in "\times" would become a tab).
  expect(/[\u0000-\u0009\u000b-\u001f]/.test(t), `${where}: control character in ${JSON.stringify(t)}`).toBe(false);
  expect(t.includes('imes') && !t.includes('\\times') && !/times/.test(t.replace(/\\times/g, '')), `${where}: broken \\times`).toBe(false);
  const parts = t.split('$');
  expect(parts.length % 2, `${where}: unbalanced $ in ${t}`).toBe(1);
  for (let i = 1; i < parts.length; i += 2) {
    const tex = parts[i];
    expect(() => katex.renderToString(tex, { throwOnError: true, strict: 'error' }), `${where}: KaTeX failed on ${tex}`).not.toThrow();
  }
}

describe('all learner-facing maths renders cleanly', () => {
  for (const l of LESSONS) {
    it(l.id, () => {
      const rng = seeded(l.id.length * 31 + 1);
      const ps = [l.guided(), ...(l.moreGuided ?? []).map((g) => g())];
      for (let i = 0; i < 150; i++) ps.push(l.generate(rng, (i % 3) as Difficulty));
      for (const p of ps) for (const t of texts(p)) checkText(t, `${l.id}/${p.id}`);
      for (const s of l.intro) {
        checkText(s.text, `${l.id} intro`);
        if (s.formula) expect(() => katex.renderToString(s.formula!, { throwOnError: true, strict: 'error' })).not.toThrow();
      }
      for (const t of Object.values(l.guide)) checkText(t, `${l.id} guide`);
    });
  }
});

import { GROUPS } from '../pages/ReferencePage';
describe('formula reference renders', () => {
  it('every formula', () => {
    for (const g of GROUPS) for (const [k, v] of g.rows) {
      checkText(k, 'reference');
      expect(() => katex.renderToString(v, { throwOnError: true, strict: 'error' }), v).not.toThrow();
      expect(/,\s*;/.test(v), 'stray punctuation in ' + v).toBe(false); // e.g. a lost backslash before ;
    }
  });
});
