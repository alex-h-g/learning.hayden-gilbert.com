import * as M from '../../math/core';
import { dpTol } from '../../math/validate';
import { no, ok, opts, pick, pid, randInt, type Rng } from '../helpers';
import type { Difficulty, LessonDef, NumberStep, Problem, Step } from '../types';

/** "\sqrt{63} = 3\sqrt{7}", or just "\sqrt{51}" when it doesn't simplify. */
const surdChain = (n: number) => (M.surdTex(n) === `\\sqrt{${n}}` ? `\\sqrt{${n}}` : `\\sqrt{${n}} = ${M.surdTex(n)}`);

const ROUND_NOTE = 'Give your answer to 2 decimal places, or as an exact square root.';

/** Number step for a length that may be irrational. */
function lengthAnswer(id: string, prompt: string, letter: string, squared: number, unit: string, extraHints: string[]): NumberStep {
  const v = Math.sqrt(squared);
  const exact = M.isPerfectSquare(squared);
  const surd = M.surdTex(squared);
  const u = unit ? ` ${unit}` : '';
  return {
    id,
    kind: 'number',
    prompt: exact ? prompt : `${prompt} ${ROUND_NOTE}`,
    label: `$${letter} =$`,
    answer: exact ? { value: v, tol: 0 } : { value: v, tol: dpTol(2), allowExact: true, rounding: 'to 2 decimal places' },
    unit,
    keys: exact ? undefined : ['root'],
    display: exact ? `$${letter} = ${v}$${u}` : `$${letter} = \\sqrt{${squared}}${surd !== `\\sqrt{${squared}}` ? ` = ${surd}` : ''} \\approx ${M.fixed(v, 2)}$${u}`,
    hints: extraHints,
    explain: exact
      ? `$${letter} = \\sqrt{${squared}} = ${v}$${u}`
      : `$${letter} = \\sqrt{${squared}}${surd !== `\\sqrt{${squared}}` ? ` = ${surd}` : ''} \\approx ${M.fixed(v, 2)}$${u}. $${squared}$ isn’t a square number, so the answer isn’t a whole number — that’s fine!`,
  };
}

function letters(rng: Rng): [string, string, string] {
  return pick(rng, [
    ['a', 'b', 'c'],
    ['p', 'q', 'r'],
    ['x', 'y', 'z'],
    ['d', 'e', 'f'],
  ] as [string, string, string][]).slice() as [string, string, string];
}

// ───────────────────────── 0. Why it works (squares demonstration) ─────────────────────────
// The Learn stage is the interactive demo (src/components/PythagorasDemo.tsx).
// The questions below transfer the idea to new triangles, always with whole numbers.

/** Whole-number right-angled triangles (shorter, shorter, hypotenuse). */
export const WHY_TRIPLES: Record<Difficulty, [number, number, number][]> = {
  0: [[3, 4, 5], [6, 8, 10]],
  1: [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25]],
  2: [[5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [12, 16, 20], [20, 21, 29], [9, 40, 41]],
};

function whyHypProblem(rng: Rng, a: number, b: number, guided = false): Problem {
  const c2 = a * a + b * b;
  const c = Math.sqrt(c2);
  if (!Number.isInteger(c)) throw new Error('why-hyp: not a whole-number triple');
  return {
    id: pid('pythagoras-why', rng),
    skill: 'pythagoras-why',
    intro: guided ? 'Now let’s use the squares idea on a brand-new triangle. Same rule, bigger numbers!' : 'Two shorter sides are known. Let’s find the hypotenuse.',
    question: `The two shorter sides of a right-angled triangle are $${a}$ and $${b}$. How long is the hypotenuse $c$?`,
    diagram: { type: 'right-triangle', a, b, labels: { a: String(a), b: String(b), c: 'c' }, rotation: guided ? 0 : pick(rng, [0, 90, 180, 270]), flip: !guided && rng() < 0.5 },
    steps: [
      {
        id: 'equation',
        kind: 'choice',
        prompt: 'Which equation do we need?',
        options: opts(rng, [
          ok('ok', `$${a}^2 + ${b}^2 = c^2$`),
          no('swap', `$${a}^2 + c^2 = ${b}^2$`, 'The squared side that stands on its own must be the hypotenuse, $c$ — the side opposite the right angle.'),
          no('plain', `$${a} + ${b} = c$`, 'Remember the tiles: it’s the **squares** of the sides that add up, not the sides themselves.'),
        ]),
        hints: ['Use $a^2 + b^2 = c^2$.', `The shorter sides are $${a}$ and $${b}$.`, `$${a}^2 + ${b}^2 = c^2$`],
        explain: `$a^2 + b^2 = c^2$ becomes $${a}^2 + ${b}^2 = c^2$.`,
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'asq',
        kind: 'number',
        prompt: `What is $${a}^2$? (Think of a square ${a} tiles wide.)`,
        label: `$${a}^2 =$`,
        answer: { value: a * a, tol: 0 },
        display: `$${a}^2 = ${a * a}$`,
        hints: ['Squaring means multiplying a number by itself.', `$${a}^2 = ${a} \\times ${a}$`, `$${a} \\times ${a} = \;?$`],
        explain: `$${a}^2 = ${a} \\times ${a} = ${a * a}$`,
        guidedOnly: true,
      },
      {
        id: 'bsq',
        kind: 'number',
        prompt: `And $${b}^2$?`,
        label: `$${b}^2 =$`,
        answer: { value: b * b, tol: 0 },
        display: `$${b}^2 = ${b * b}$`,
        hints: ['Multiply the number by itself.', `$${b}^2 = ${b} \\times ${b}$`, `$${b} \\times ${b} = \;?$`],
        explain: `$${b}^2 = ${b} \\times ${b} = ${b * b}$`,
        guidedOnly: true,
      },
      {
        id: 'csq',
        kind: 'number',
        prompt: `So $c^2 = ${a}^2 + ${b}^2 = \;?$`,
        label: '$c^2 =$',
        answer: { value: c2, tol: 0 },
        display: `$c^2 = ${a * a} + ${b * b} = ${c2}$`,
        hints: ['Add the two squares together — like putting the two groups of tiles together.', `$${a}^2 = ${a * a}$ and $${b}^2 = ${b * b}$.`, `$${a * a} + ${b * b} = \;?$`],
        explain: `$c^2 = ${a * a} + ${b * b} = ${c2}$`,
      },
      {
        id: 'c',
        kind: 'number',
        prompt: `$c^2 = ${c2}$. What number multiplied by itself gives $${c2}$?`,
        label: '$c =$',
        answer: { value: c, tol: 0 },
        display: `$c = \\sqrt{${c2}} = ${c}$`,
        hints: ['Undo the square with a square root.', `$c = \\sqrt{${c2}}$`, `Try $${c} \\times ${c}$.`],
        explain: `$c = \\sqrt{${c2}} = ${c}$, because $${c} \\times ${c} = ${c2}$.`,
      },
    ],
    summary: `$${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c2}$, so $c^2 = ${c2}$ and $c = \\sqrt{${c2}} = ${c}$. The square on the hypotenuse would hold $${c2}$ tiles — exactly the $${a * a}$ and $${b * b}$ tiles put together.`,
    answer: `$c = ${c}$`,
  };
}

function whyMissingProblem(rng: Rng, known: number, c: number, guided = false): Problem {
  const b2 = c * c - known * known;
  const b = Math.sqrt(b2);
  if (!Number.isInteger(b) || b <= 0) throw new Error('why-missing: not a whole-number triple');
  const letter = guided ? 'b' : pick(rng, ['a', 'b']);
  const eq = letter === 'a' ? `${letter}^2 + ${known}^2 = ${c}^2` : `${known}^2 + ${letter}^2 = ${c}^2`;
  const eqNum = letter === 'a' ? `${letter}^2 + ${known * known} = ${c * c}` : `${known * known} + ${letter}^2 = ${c * c}`;
  return {
    id: pid('pythagoras-why', rng),
    skill: 'pythagoras-why',
    intro: guided ? 'The theorem works backwards too. If we know the hypotenuse, we can find a missing shorter side.' : 'This time the hypotenuse is known. Let’s find a shorter side.',
    question: `A right-angled triangle has hypotenuse $${c}$ and one shorter side $${known}$. Find the other shorter side, $${letter}$.`,
    diagram: {
      type: 'right-triangle',
      a: letter === 'a' ? b : known,
      b: letter === 'a' ? known : b,
      labels: { a: letter === 'a' ? letter : String(known), b: letter === 'a' ? String(known) : letter, c: String(c) },
      rotation: guided ? 0 : pick(rng, [0, 90, 180, 270]),
      flip: !guided && rng() < 0.5,
    },
    steps: [
      {
        id: 'substitute',
        kind: 'choice',
        prompt: `Put the numbers into $a^2 + b^2 = c^2$. Which is right?`,
        options: opts(rng, [
          ok('ok', `$${eq}$`),
          no('swap', `$${known}^2 + ${c}^2 = ${letter}^2$`, `$${c}$ is the hypotenuse (opposite the right angle), so $${c}^2$ goes on its own.`),
          no('plain', `$${known} + ${letter} = ${c}$`, 'It’s the squares of the sides that add up, not the sides.'),
        ]),
        hints: [`The hypotenuse is $${c}$, so $c = ${c}$.`, `One shorter side is $${known}$; the other is $${letter}$.`, `$${eq}$`],
        explain: `$${eq}$, which is $${eqNum}$.`,
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'isolate',
        kind: 'choice',
        prompt: `$${eqNum}$. What should we do to get $${letter}^2$ on its own?`,
        options: opts(rng, [
          ok('sub', `Subtract $${known * known}$ from both sides`),
          no('add', `Add $${known * known}$ to both sides`, `That gives $${letter}^2 + ${2 * known * known}$ — further away! We want to remove the $${known * known}$.`),
          no('div', `Divide both sides by $${known * known}$`, `$${known * known}$ is added to $${letter}^2$, not multiplied, so dividing won’t remove it.`),
          no('root', 'Square-root everything straight away', `Not yet — square roots don’t split across a $+$. Get $${letter}^2$ alone first.`),
        ]),
        hints: [`$${known * known}$ is being added to $${letter}^2$.`, 'To undo adding, we subtract.', `Take $${known * known}$ away from both sides.`],
        explain: `Subtract $${known * known}$ from both sides: $${letter}^2 = ${c * c} - ${known * known}$.`,
        guidedOnly: true,
      },
      {
        id: 'sq',
        kind: 'number',
        prompt: `Work out $${letter}^2 = ${c}^2 - ${known}^2$.`,
        label: `$${letter}^2 =$`,
        answer: { value: b2, tol: 0 },
        display: `$${letter}^2 = ${c * c} - ${known * known} = ${b2}$`,
        hints: ['Square both numbers first.', `$${c}^2 = ${c * c}$ and $${known}^2 = ${known * known}$.`, `$${c * c} - ${known * known} = \;?$`],
        explain: `$${letter}^2 = ${c * c} - ${known * known} = ${b2}$`,
      },
      {
        id: 'side',
        kind: 'number',
        prompt: `What number multiplied by itself gives $${b2}$?`,
        label: `$${letter} =$`,
        answer: { value: b, tol: 0 },
        display: `$${letter} = \\sqrt{${b2}} = ${b}$`,
        hints: ['Undo the square with a square root.', `$${letter} = \\sqrt{${b2}}$`, `Try $${b} \\times ${b}$.`],
        explain: `$${letter} = \\sqrt{${b2}} = ${b}$, because $${b} \\times ${b} = ${b2}$.`,
      },
    ],
    summary:
      known === 3 && c === 5
        ? `$${letter}^2 = 25 - 9 = 16$, so $${letter} = 4$ — the very same $3$-$4$-$5$ triangle we built the squares on! Pythagoras’ theorem can check a triangle **and** find a missing side.`
        : `$${letter}^2 = ${c}^2 - ${known}^2 = ${b2}$, so $${letter} = ${b}$. Check: $${known}^2 + ${b}^2 = ${known * known} + ${b2} = ${c * c} = ${c}^2$ ✓`,
    answer: `$${letter} = ${b}$`,
  };
}

/** Is a triangle with these sides right-angled? (Sometimes not — so learners check rather than assume.) */
function whyCheckProblem(rng: Rng, p: number, q: number, r: number): Problem {
  const sumSq = p * p + q * q;
  const right = sumSq === r * r;
  return {
    id: pid('pythagoras-why', rng),
    skill: 'pythagoras-why',
    intro: 'Pythagoras can also tell us whether a triangle has a right angle. Let’s check.',
    question: `A triangle has sides $${p}$, $${q}$ and $${r}$. Is it a right-angled triangle?`,
    steps: [
      {
        id: 'sum',
        kind: 'number',
        prompt: `Square the two shorter sides and add: $${p}^2 + ${q}^2 = \;?$`,
        answer: { value: sumSq, tol: 0 },
        display: `$${p * p} + ${q * q} = ${sumSq}$`,
        hints: ['Square each shorter side first.', `$${p}^2 = ${p * p}$, $${q}^2 = ${q * q}$.`, `$${p * p} + ${q * q} = \;?$`],
        explain: `$${p}^2 + ${q}^2 = ${p * p} + ${q * q} = ${sumSq}$`,
      },
      {
        id: 'longest',
        kind: 'number',
        prompt: `Now square the longest side: $${r}^2 = \;?$`,
        answer: { value: r * r, tol: 0 },
        display: `$${r}^2 = ${r * r}$`,
        hints: ['Multiply the longest side by itself.', `$${r} \\times ${r}$`, `$${r} \\times ${r} = \;?$`],
        explain: `$${r}^2 = ${r * r}$`,
      },
      {
        id: 'verdict',
        kind: 'choice',
        prompt: `$${sumSq}$ and $${r * r}$: is the triangle right-angled?`,
        options: opts(rng, [
          right ? ok('yes', `Yes — $${sumSq} = ${r * r}$`) : no('yes', 'Yes', `The two smaller squares make $${sumSq}$ tiles, but the big square needs $${r * r}$. They don’t match.`),
          right ? no('no', 'No', `They match: $${sumSq} = ${r * r}$. When the squares add up exactly, there’s a right angle.`) : ok('no', `No — $${sumSq} \\ne ${r * r}$`),
        ]),
        hints: ['Pythagoras only works for right-angled triangles.', 'If the two smaller squares add up to the big square, it’s right-angled.', `Compare $${sumSq}$ with $${r * r}$.`],
        explain: right ? `$${sumSq} = ${r * r}$, so the squares fit exactly: it **is** right-angled.` : `$${sumSq} \\ne ${r * r}$, so it is **not** right-angled.`,
      },
    ],
    summary: right
      ? `$${p}^2 + ${q}^2 = ${sumSq} = ${r}^2$, so this triangle is right-angled.`
      : `$${p}^2 + ${q}^2 = ${sumSq}$ but $${r}^2 = ${r * r}$. They aren’t equal, so this triangle has no right angle.`,
    answer: right ? 'Yes, right-angled' : 'No, not right-angled',
  };
}

export const pythagorasWhy: LessonDef = {
  id: 'pythagoras-why',
  topic: 'pythagoras',
  title: 'Why Pythagoras works',
  blurb: 'See it with squares and tiles: 9 + 16 = 25.',
  objective: 'see why a² + b² = c² is true, then use it on new triangles',
  demo: 'pythagoras-squares',
  intro: [
    { pose: 'explaining', text: 'Draw a square on each side of a right-angled triangle. The two smaller squares together have exactly the same area as the square on the hypotenuse.', formula: 'a^2 + b^2 = c^2' },
  ],
  guided: () => whyHypProblem(() => 0.5, 5, 12, true),
  moreGuided: [() => whyMissingProblem(() => 0.5, 3, 5, true)],
  generate: (rng, d: Difficulty) => {
    const [x, y, z] = pick(rng, WHY_TRIPLES[d]);
    const [p, q] = rng() < 0.5 ? [x, y] : [y, x];
    const r = rng();
    if (d >= 1 && r < 0.2) {
      // A near-miss that is NOT right-angled, or a true triple.
      return rng() < 0.5 ? whyCheckProblem(rng, Math.min(p, q), Math.max(p, q), z + 1) : whyCheckProblem(rng, Math.min(p, q), Math.max(p, q), z);
    }
    return r < 0.6 ? whyHypProblem(rng, p, q) : whyMissingProblem(rng, p, z);
  },
  inExam: false,
  guide: {
    rule: 'The squares on the two shorter sides together have the same area as the square on the hypotenuse: $a^2 + b^2 = c^2$',
    explanation: 'For a $3$-$4$-$5$ triangle the squares hold $9$, $16$ and $25$ unit tiles, and $9 + 16 = 25$. It works for every right-angled triangle — even when the sides aren’t whole numbers.',
    mistake: 'Adding the sides instead of their squares: $3 + 4 = 7$, but the hypotenuse is $5$.',
  },
};

// ───────────────────────── 1. Identify the hypotenuse ─────────────────────────

function identifyProblem(rng: Rng): Problem {
  const [l1, l2, l3] = letters(rng);
  // Randomly assign which letter is the hypotenuse.
  const order = pick(rng, [
    [l1, l2, l3],
    [l3, l1, l2],
    [l2, l3, l1],
  ]);
  const [la, lb, lc] = order; // la, lb shorter sides; lc hypotenuse
  const a = randInt(rng, 3, 8);
  const b = randInt(rng, 3, 8);
  return {
    id: pid('hypotenuse', rng),
    skill: 'hypotenuse',
    intro: 'Here’s a right-angled triangle, turned round. Look for the little square first.',
    question: `Which side is the hypotenuse? Then write Pythagoras’ theorem for this triangle.`,
    diagram: { type: 'right-triangle', a, b, labels: { a: la, b: lb, c: lc }, rotation: randInt(rng, 0, 359), flip: rng() < 0.5 },
    steps: [
      {
        id: 'hyp',
        kind: 'choice',
        prompt: 'Which side is the **hypotenuse**?',
        options: opts(rng, [ok(lc, `$${lc}$`), no(la, `$${la}$`, `Side $${la}$ touches the right angle. The hypotenuse is **opposite** the right angle.`), no(lb, `$${lb}$`, `Side $${lb}$ touches the right angle. The hypotenuse is **opposite** the right angle.`)]),
        hints: ['Find the right angle — it’s marked with a small square.', 'The hypotenuse doesn’t touch the right angle at all.', 'It’s the side opposite the square — and always the longest side.'],
        explain: `$${lc}$ is opposite the right angle, so it’s the hypotenuse (and the longest side).`,
        pose: 'curious',
        highlight: ['right-angle'],
      },
      {
        id: 'equation',
        kind: 'choice',
        prompt: 'Which equation is true for this triangle?',
        options: opts(rng, [
          ok('a', `$${la}^2 + ${lb}^2 = ${lc}^2$`),
          no('b', `$${la}^2 + ${lc}^2 = ${lb}^2$`, `The squared side on its own must be the hypotenuse, $${lc}$.`),
          no('c', `$${lb}^2 + ${lc}^2 = ${la}^2$`, `The squared side on its own must be the hypotenuse, $${lc}$.`),
          no('d', `$${la} + ${lb} = ${lc}$`, 'Pythagoras is about the **squares** of the sides.'),
        ]),
        hints: ['The theorem is: (shorter side)$^2$ + (shorter side)$^2$ = (hypotenuse)$^2$.', `The hypotenuse is $${lc}$.`, `$${la}^2 + ${lb}^2 = \\;?^2$`],
        explain: `The two shorter sides squared add to the hypotenuse squared: $${la}^2 + ${lb}^2 = ${lc}^2$.`,
        highlight: ['hyp'],
      },
    ],
    summary: `The hypotenuse is always opposite the right angle — wherever the triangle is turned. Here it’s $${lc}$, so $${la}^2 + ${lb}^2 = ${lc}^2$.`,
    answer: `Hypotenuse $${lc}$; $${la}^2 + ${lb}^2 = ${lc}^2$`,
  };
}

export const hypotenuseLesson: LessonDef = {
  id: 'hypotenuse',
  topic: 'pythagoras',
  title: 'Spotting the hypotenuse',
  blurb: 'The side opposite the right angle — wherever it is.',
  objective: 'identify the hypotenuse and write Pythagoras’ theorem for any right-angled triangle',
  intro: [
    { pose: 'waving', text: 'Pythagoras’ theorem works only for **right-angled** triangles. The right angle is marked with a small square.', diagram: { type: 'right-triangle', a: 4, b: 3, labels: { a: 'a', b: 'b', c: 'c' }, rotation: 0 } },
    { pose: 'explaining', text: 'The **hypotenuse** is the side **opposite** the right angle. It’s always the longest side. The theorem says:', formula: 'a^2 + b^2 = c^2 \\quad (c = \\text{hypotenuse})', diagram: { type: 'right-triangle', a: 4, b: 3, labels: { a: 'a', b: 'b', c: 'c' }, rotation: 0 } },
    { pose: 'thinking', text: 'Careful: when the triangle is turned, the hypotenuse might be at the bottom or on the side. Always find the right angle first.', diagram: { type: 'right-triangle', a: 4, b: 3, labels: { a: 'a', b: 'b', c: 'c' }, rotation: 150 } },
  ],
  guided: () => identifyProblem(() => 0.55),
  generate: (rng) => identifyProblem(rng),
  inExam: true,
  guide: {
    rule: '$a^2 + b^2 = c^2$, where $c$ is the hypotenuse (opposite the right angle)',
    explanation: 'Find the right-angle square first. The side that doesn’t touch it is the hypotenuse, and it’s the longest side.',
    mistake: 'Assuming the hypotenuse is the slanted side or the bottom side. It depends only on where the right angle is.',
  },
};

// ───────────────────────── 2. Finding the hypotenuse ─────────────────────────

function hypProblem(rng: Rng, a: number, b: number, unit: string, guided = false): Problem {
  const [la, lb, lc] = guided ? ['a', 'b', 'c'] : letters(rng);
  const c2 = a * a + b * b;
  const c = Math.sqrt(c2);
  const u = unit ? ` ${unit}` : '';
  const steps: Step[] = [
    {
      id: 'which',
      kind: 'choice',
      prompt: `We know $${a}$ and $${b}$. Is the missing side $${lc}$ the hypotenuse?`,
      options: opts(rng, [ok('yes', 'Yes — it’s opposite the right angle'), no('no', 'No', `Look again: which side is opposite the little square?`)]),
      hints: ['Find the right angle.', 'Which side doesn’t touch it?', `$${lc}$ is opposite the right angle.`],
      explain: `$${lc}$ is opposite the right angle, so we’re finding the **hypotenuse** — the longest side.`,
      guidedOnly: true,
      pose: 'curious',
      highlight: ['right-angle', 'hyp'],
    },
    {
      id: 'formula',
      kind: 'choice',
      prompt: 'Which version of the theorem do we need?',
      options: opts(rng, [
        ok('a', `$${lc} = \\sqrt{${la}^2 + ${lb}^2}$`),
        no('b', `$${lc} = \\sqrt{${la}^2 - ${lb}^2}$`, 'We subtract only when finding a **shorter** side. For the hypotenuse we add.'),
        no('c', `$${lc} = ${la} + ${lb}$`, 'Pythagoras works with the **squares** of the sides.'),
        no('d', `$${lc} = ${la}^2 + ${lb}^2$`, 'Close! That gives $' + lc + '^2$. One more step: take the square root.'),
      ]),
      hints: [`$${la}^2 + ${lb}^2 = ${lc}^2$`, `We want $${lc}$ on its own.`, 'Undo the square with a square root.'],
      explain: `$${lc} = \\sqrt{${la}^2 + ${lb}^2}$: add the squares, then square-root.`,
      guidedOnly: true,
    },
    {
      id: 'sumsq',
      kind: 'number',
      prompt: `Work out $${lc}^2 = ${a}^2 + ${b}^2$.`,
      label: `$${lc}^2 =$`,
      answer: { value: c2, tol: 0 },
      display: `$${a * a} + ${b * b} = ${c2}$`,
      hints: ['Square each side first.', `$${a}^2 = ${a} \\times ${a}$ and $${b}^2 = ${b} \\times ${b}$.`, `$${a * a} + ${b * b}$`],
      explain: `$${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c2}$`,
    },
    lengthAnswer('root', `Now find $${lc}$.`, lc, c2, unit, ['Take the square root of your last answer.', `$${lc} = \\sqrt{${c2}}$`, M.isPerfectSquare(c2) ? `Which number times itself makes $${c2}$?` : `Use the $\\sqrt{\\;}$ key: $\\sqrt{${c2}} \\approx ${M.fixed(c, 3)}$…`]),
  ];
  return {
    id: pid('find-hyp', rng),
    skill: 'find-hyp',
    intro: guided ? 'Let’s find the hypotenuse of this triangle together.' : 'Two shorter sides are known. Let’s find the longest side.',
    question: `Find the length of the hypotenuse $${lc}$ when the other sides are $${a}$${u} and $${b}$${u}.`,
    diagram: { type: 'right-triangle', a, b, labels: { a: String(a), b: String(b), c: lc }, rotation: guided ? 0 : pick(rng, [0, 90, 180, 270, 30, 200]), flip: !guided && rng() < 0.5, unit },
    steps,
    summary: `$${lc}^2 = ${a}^2 + ${b}^2 = ${c2}$, so $${lc} = \\sqrt{${c2}}${M.isPerfectSquare(c2) ? ` = ${c}` : ` \\approx ${M.fixed(c, 2)}`}$${u}. Check: the hypotenuse should be the longest side — and it is.`,
    answer: `$${lc} = ${M.isPerfectSquare(c2) ? c : `\\sqrt{${c2}} \\approx ${M.fixed(c, 2)}`}$${u}`,
  };
}

function tripleSides(rng: Rng, maxC: number): [number, number] {
  const options: [number, number][] = [];
  for (const [a, b, c] of M.PYTHAGOREAN_TRIPLES) for (let k = 1; k * c <= maxC; k++) options.push([a * k, b * k]);
  const [a, b] = pick(rng, options);
  return rng() < 0.5 ? [a, b] : [b, a];
}

function irrationalSides(rng: Rng): [number, number] {
  for (;;) {
    const a = randInt(rng, 2, 12);
    const b = randInt(rng, 2, 12);
    if (!M.isPerfectSquare(a * a + b * b)) return [a, b];
  }
}

export const findHyp: LessonDef = {
  id: 'find-hyp',
  topic: 'pythagoras',
  title: 'Finding the hypotenuse',
  blurb: 'Square, add, square-root.',
  objective: 'calculate the hypotenuse from the two shorter sides',
  prereq: ['hypotenuse'],
  intro: [
    { pose: 'explaining', text: 'To find the hypotenuse: **square** both shorter sides, **add** them, then take the **square root**.', formula: 'c = \\sqrt{a^2 + b^2}' },
    { pose: 'thinking', text: 'Sometimes the answer is a whole number (like $3, 4, 5$). Often it isn’t — then give it to 2 decimal places, or leave it as a square root.' },
  ],
  guided: () => hypProblem(() => 0.5, 6, 8, 'cm', true),
  generate: (rng, d: Difficulty) => {
    // Whole-number answers (Pythagorean triples) except half of the stretch questions.
    if (d === 0) return hypProblem(rng, ...tripleSides(rng, 30), 'cm');
    if (d === 1 || rng() < 0.5) return hypProblem(rng, ...tripleSides(rng, 65), pick(rng, ['cm', 'm']));
    return hypProblem(rng, ...irrationalSides(rng), pick(rng, ['cm', 'm', 'mm']));
  },
  inExam: true,
  guide: {
    rule: '$c = \\sqrt{a^2 + b^2}$',
    explanation: 'Square the two shorter sides, add them, then square-root to undo the squaring.',
    mistake: 'Forgetting the square root at the end — $c^2 = 100$ means $c = 10$, not $100$.',
  },
};

// ───────────────────────── 3. Finding a shorter side ─────────────────────────

function shortProblem(rng: Rng, c: number, known: number, missing: string, unit: string, guided: 'ws1' | 'ws2' | false = false): Problem {
  const s2 = c * c - known * known;
  if (s2 <= 0) throw new Error('shorter side self-check failed');
  const s = Math.sqrt(s2);
  if (Math.abs(s - M.shorterSide(c, known)) > 1e-12) throw new Error('shorter side mismatch');
  const u = unit ? ` ${unit}` : '';
  const steps: Step[] = [
    {
      id: 'hyp',
      kind: 'choice',
      prompt: 'Which length is the hypotenuse?',
      options: opts(rng, [ok('c', `$${c}$`), no('k', `$${known}$`, `$${known}$ touches the right angle — so it’s one of the shorter sides.`), no('m', `$${missing}$`, `$${missing}$ touches the right angle. The hypotenuse is opposite it.`)]),
      hints: ['Find the little square.', 'The hypotenuse is opposite the right angle.', 'It’s also the longest side.'],
      explain: `$${c}$ is opposite the right angle, so it’s the hypotenuse. The missing side $${missing}$ is a **shorter** side.`,
      guidedOnly: true,
      pose: 'curious',
      highlight: ['right-angle', 'hyp'],
    },
    {
      id: 'equation',
      kind: 'choice',
      prompt: 'Which equation is correct?',
      options: opts(rng, [
        ok('a', `$${missing}^2 + ${known}^2 = ${c}^2$`),
        no('b', `$${c}^2 + ${known}^2 = ${missing}^2$`, `That would make $${missing}$ the hypotenuse. But $${c}$ is opposite the right angle.`),
        no('c', `$${missing} + ${known} = ${c}$`, 'Pythagoras uses the **squares** of the sides.'),
      ]),
      hints: ['Shorter$^2$ + shorter$^2$ = hypotenuse$^2$.', `The hypotenuse is $${c}$, and it goes on its own.`, `$${missing}^2 + ${known}^2 = ${c}^2$`],
      explain: `$${missing}^2 + ${known}^2 = ${c}^2$, so $${missing}^2 = ${c}^2 - ${known}^2$: for a shorter side we **subtract**.`,
      guidedOnly: true,
    },
    {
      id: 'diff',
      kind: 'number',
      prompt: `Work out $${missing}^2 = ${c}^2 - ${known}^2$.`,
      label: `$${missing}^2 =$`,
      answer: { value: s2, tol: 0 },
      display: `$${c * c} - ${known * known} = ${s2}$`,
      hints: ['Square both known sides.', `$${c}^2 = ${c * c}$. What is $${known}^2$?`, `$${c * c} - ${known * known}$`],
      explain: `$${c}^2 - ${known}^2 = ${c * c} - ${known * known} = ${s2}$`,
    },
    lengthAnswer('root', `Now find $${missing}$.`, missing, s2, unit, ['Take the square root.', `$${missing} = \\sqrt{${s2}}$`, M.isPerfectSquare(s2) ? `Which number times itself is $${s2}$?` : `$\\sqrt{${s2}} \\approx ${M.fixed(s, 3)}$…`]),
  ];
  // Worksheet layouts: Q7a right angle bottom-left, base 16, height a; Q7b hyp 12, height 9, base b.
  const diagram =
    guided === 'ws1'
      ? { type: 'right-triangle' as const, a: 16, b: s, labels: { a: String(known), b: missing, c: String(c) }, rotation: 0, unit }
      : guided === 'ws2'
        ? { type: 'right-triangle' as const, a: s, b: known, labels: { a: missing, b: String(known), c: String(c) }, rotation: 0, flip: true, unit }
        : {
            type: 'right-triangle' as const,
            a: known,
            b: s,
            labels: { a: String(known), b: missing, c: String(c) },
            rotation: pick(rng, [0, 90, 180, 270, 45, 120, 300]),
            flip: rng() < 0.5,
            unit,
          };
  return {
    id: pid('find-short', rng),
    skill: 'find-short',
    intro: guided ? `Here’s a worksheet triangle. The hypotenuse is $${c}$ and one side is $${known}$. Let’s find $${missing}$.` : `Let’s find the missing side $${missing}$.`,
    question: `Solve for the missing side $${missing}$.`,
    diagram,
    steps,
    summary: `$${missing}^2 = ${c}^2 - ${known}^2 = ${s2}$, so $${missing} = ${M.isPerfectSquare(s2) ? s : `${surdChain(s2)} \\approx ${M.fixed(s, 2)}`}$${u}. Check: it’s shorter than the hypotenuse ✓`,
    answer: `$${missing} = ${M.isPerfectSquare(s2) ? s : `${M.surdTex(s2)} \\approx ${M.fixed(s, 2)}`}$${u}`,
  };
}

export const findShort: LessonDef = {
  id: 'find-short',
  topic: 'pythagoras',
  title: 'Finding a shorter side',
  blurb: 'Subtract the squares when the hypotenuse is known.',
  objective: 'calculate a missing shorter side of a right-angled triangle',
  prereq: ['find-hyp'],
  intro: [
    { pose: 'explaining', text: 'If you know the hypotenuse, rearrange the theorem: **square** both known sides, **subtract**, then **square-root**.', formula: 'a = \\sqrt{c^2 - b^2}' },
    { pose: 'thinking', text: 'Ask yourself: am I finding the longest side (add) or a shorter one (subtract)? The answer must be shorter than the hypotenuse.' },
    { pose: 'curious', text: 'The worksheet has two of these. Let’s do the first together: hypotenuse $20$, one side $16$.' },
  ],
  guided: () => shortProblem(() => 0.5, 20, 16, 'a', '', 'ws1'),
  moreGuided: [() => shortProblem(() => 0.7, 12, 9, 'b', '', 'ws2')],
  generate: (rng, d) => {
    const missing = pick(rng, ['a', 'b', 'x']);
    // Whole-number answers except half of the stretch questions (like worksheet 7b: √63).
    if (d < 2 || rng() < 0.5) {
      const [p, q] = tripleSides(rng, d === 0 ? 30 : 65);
      const c = Math.round(Math.hypot(p, q));
      return shortProblem(rng, c, p, missing, pick(rng, ['cm', 'm', '']));
    }
    for (;;) {
      const c = randInt(rng, 6, 20);
      const k = randInt(rng, 2, c - 1);
      if (!M.isPerfectSquare(c * c - k * k)) return shortProblem(rng, c, k, missing, pick(rng, ['cm', 'm', '']));
    }
  },
  inExam: true,
  guide: {
    rule: '$a = \\sqrt{c^2 - b^2}$ when $c$ (the hypotenuse) is known',
    explanation: 'Square both known sides and subtract the smaller from the larger. Example: $b^2 = 12^2 - 9^2 = 63$, so $b = \\sqrt{63} = 3\\sqrt{7} \\approx 7.94$.',
    mistake: 'Adding instead of subtracting. If you add, your “shorter” side comes out longer than the hypotenuse!',
  },
};

// ───────────────────────── 4. Rectangle diagonals ─────────────────────────

function diagonalProblem(rng: Rng, l: number, w: number, unit: string, guided = false): Problem {
  const d2 = l * l + w * w;
  const d = M.rectangleDiagonal(l, w);
  const u = ` ${unit}`;
  return {
    id: pid('rect-diagonal', rng),
    skill: 'rect-diagonal',
    intro: guided ? 'Here’s the worksheet rectangle: $12$ cm by $5$ cm. Let’s find its diagonal.' : `A rectangle is $${l}$${u} by $${w}$${u}. Let’s find the diagonal.`,
    question: `Find the length of the diagonal of a rectangle $${l}$${u} long and $${w}$${u} wide.`,
    diagram: { type: 'rectangle', l, w, labels: { l: `${l}${u}`, w: `${w}${u}`, d: 'd' }, unit },
    steps: [
      {
        id: 'triangle',
        kind: 'choice',
        prompt: 'The diagonal cuts the rectangle into two triangles. What kind of triangles are they?',
        options: opts(rng, [ok('right', 'Right-angled triangles'), no('eq', 'Equilateral triangles', 'The sides aren’t all equal — look at the corners of the rectangle.'), no('iso', 'Isosceles triangles', 'Only if the rectangle were a square! Look at the corners.')]),
        hints: ['What are the corners of a rectangle?', 'Every corner of a rectangle is a right angle.', 'So each triangle has a right angle.'],
        explain: 'Each corner of a rectangle is $90^\\circ$, so the diagonal makes two **right-angled** triangles — and the diagonal is the hypotenuse.',
        guidedOnly: true,
        pose: 'curious',
        highlight: ['triangle'],
      },
      {
        id: 'sumsq',
        kind: 'number',
        prompt: `Work out $d^2 = ${l}^2 + ${w}^2$.`,
        label: '$d^2 =$',
        answer: { value: d2, tol: 0 },
        display: `$${l * l} + ${w * w} = ${d2}$`,
        hints: ['The diagonal is the hypotenuse, so add the squares.', `$${l}^2 = ${l * l}$. What is $${w}^2$?`, `$${l * l} + ${w * w}$`],
        explain: `$d^2 = ${l}^2 + ${w}^2 = ${l * l} + ${w * w} = ${d2}$`,
      },
      lengthAnswer('root', 'Now find $d$.', 'd', d2, unit, ['Take the square root.', `$d = \\sqrt{${d2}}$`, M.isPerfectSquare(d2) ? `Which number times itself is $${d2}$?` : `$\\sqrt{${d2}} \\approx ${M.fixed(d, 3)}$…`]),
    ],
    summary: `The diagonal is the hypotenuse of a right-angled triangle with sides $${l}$ and $${w}$. $d^2 = ${d2}$, so $d = ${M.isPerfectSquare(d2) ? d : `\\sqrt{${d2}} \\approx ${M.fixed(d, 2)}`}$${u}.`,
    answer: `$d = ${M.isPerfectSquare(d2) ? d : `\\sqrt{${d2}} \\approx ${M.fixed(d, 2)}`}$${u}`,
  };
}

export const rectDiagonal: LessonDef = {
  id: 'rect-diagonal',
  topic: 'pythagoras',
  title: 'Diagonal of a rectangle',
  blurb: 'A diagonal is a hidden hypotenuse.',
  objective: 'use Pythagoras to find the diagonal of a rectangle',
  prereq: ['find-hyp'],
  intro: [
    { pose: 'explaining', text: 'A rectangle’s diagonal splits it into two right-angled triangles. The diagonal is the **hypotenuse**.', diagram: { type: 'rectangle', l: 12, w: 5, labels: { l: '12 cm', w: '5 cm', d: 'd' }, unit: 'cm' }, formula: 'd = \\sqrt{l^2 + w^2}' },
  ],
  guided: () => diagonalProblem(() => 0.5, 12, 5, 'cm', true),
  generate: (rng, d) => {
    if (d === 0) {
      const [a, b] = tripleSides(rng, 30);
      return diagonalProblem(rng, Math.max(a, b), Math.min(a, b), 'cm');
    }
    if (d === 1 || rng() < 0.5) {
      const [a, b] = tripleSides(rng, 65);
      return diagonalProblem(rng, Math.max(a, b), Math.min(a, b), pick(rng, ['cm', 'm']));
    }
    const [a, b] = irrationalSides(rng);
    return diagonalProblem(rng, Math.max(a, b), Math.min(a, b), pick(rng, ['cm', 'm']));
  },
  inExam: true,
  guide: {
    rule: '$d = \\sqrt{l^2 + w^2}$',
    explanation: 'The diagonal and two sides of a rectangle form a right-angled triangle, with the diagonal as the hypotenuse.',
    mistake: 'Adding the length and width without squaring: $12 + 5 = 17$ is not the diagonal (it’s $13$).',
  },
};

export const PYTHAGORAS_LESSONS = [pythagorasWhy, hypotenuseLesson, findHyp, findShort, rectDiagonal];