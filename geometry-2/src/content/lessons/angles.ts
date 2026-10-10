import * as M from '../../math/core';
import { deg, no, ok, opts, pick, pid, randInt, type Rng } from '../helpers';
import type { AnglePos, Difficulty, LessonDef, Problem, Step } from '../types';

const name = (n: number) => M.polygonName(n);
const an = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

// ───────────────────────── 1. Sum of interior angles ─────────────────────────

function interiorSumProblem(rng: Rng, n: number, opts_: { guided?: boolean; reverse?: boolean } = {}): Problem {
  const total = M.interiorAngleSum(n);
  const tri = M.trianglesFromVertex(n);
  if (opts_.reverse) {
    return {
      id: pid('interior-sum', rng),
      skill: 'interior-sum',
      intro: 'This time we know the total and need the number of sides. Let’s work backwards.',
      question: `The interior angles of a polygon add up to $${deg(total)}$. How many sides does it have?`,
      steps: [
        {
          id: 'triangles',
          kind: 'number',
          prompt: `Each triangle gives $${deg(180)}$. How many triangles make $${deg(total)}$?`,
          answer: { value: tri, tol: 0 },
          display: `$${total} \\div 180 = ${tri}$`,
          hints: ['Each triangle inside the polygon contributes $180^\\circ$.', `Divide the total by $180$.`, `$${total} \\div 180 = \\;?$`],
          explain: `$${total} \\div 180 = ${tri}$ triangles.`,
          guidedOnly: false,
        },
        {
          id: 'sides',
          kind: 'number',
          prompt: 'A polygon with $n$ sides splits into $n - 2$ triangles. So how many sides?',
          answer: { value: n, tol: 0 },
          display: `$n = ${tri} + 2 = ${n}$`,
          hints: ['The number of triangles is always 2 fewer than the number of sides.', `If $n - 2 = ${tri}$, what is $n$?`, `$n = ${tri} + 2$`],
          explain: `$n - 2 = ${tri}$, so $n = ${n}$. It’s ${an(name(n))} ${name(n)}.`,
        },
      ],
      summary: `$${total} \\div 180 = ${tri}$ triangles, and a polygon has 2 more sides than triangles, so it has ${n} sides.`,
      answer: `${n} sides`,
    };
  }
  const steps: Step[] = [
    {
      id: 'count',
      kind: 'number',
      prompt: 'Let’s start by inspecting the shape. How many sides does it have?',
      answer: { value: n, tol: 0 },
      display: `$n = ${n}$`,
      hints: ['Count the straight edges around the outside.', 'Put your finger on one corner and count each edge as you go round once.', `It’s called ${an(name(n))} ${name(n)} — the name gives a clue.`],
      explain: `${an(name(n)) === 'an' ? 'An' : 'A'} ${name(n)} has $n = ${n}$ sides.`,
      guidedOnly: true,
      pose: 'curious',
    },
    {
      id: 'triangles',
      kind: 'number',
      prompt: 'Look at the lines drawn from one corner. How many triangles do they make?',
      answer: { value: tri, tol: 0 },
      display: `$${n} - 2 = ${tri}$`,
      hints: ['Count the triangles inside the shape.', 'From one corner you can’t draw a line to itself or to its two neighbours.', `There are $n - 2 = ${n} - 2$ triangles.`],
      explain: `There are $${n} - 2 = ${tri}$ triangles.`,
      guidedOnly: true,
      highlight: ['triangles'],
    },
    {
      id: 'rule',
      kind: 'choice',
      prompt: 'Each triangle’s angles add to $180^\\circ$. Which calculation gives the total?',
      options: opts(rng, [
        ok('a', `$(${n} - 2) \\times 180^\\circ$`),
        no('b', `$${n} \\times 180^\\circ$`, `That would be ${n} triangles — but we only made ${tri}.`),
        no('c', `$360^\\circ \\div ${n}$`, 'That’s the exterior angle of a regular polygon — a different rule.'),
        no('d', `$(${n} + 2) \\times 180^\\circ$`, 'Count the triangles again — is it more or fewer than the sides?'),
      ]),
      hints: ['Which rule might help? Think about the triangles.', `How many triangles, and how many degrees in each?`, `${tri} triangles × $180^\\circ$ each.`],
      explain: `Sum of interior angles $= (n - 2) \\times 180^\\circ$.`,
      guidedOnly: true,
    },
    {
      id: 'total',
      kind: 'number',
      prompt: opts_.guided ? 'Now work it out. What is the sum of the interior angles?' : `What is the sum of the interior angles of ${an(name(n))} ${name(n)}?`,
      answer: { value: total, tol: 0 },
      unit: '°',
      display: `$${deg(total)}$`,
      hints: ['Sum of interior angles $= (n - 2) \\times 180^\\circ$.', `Here $n = ${n}$, so first work out $n - 2$.`, `$(${n} - 2) \\times 180 = ${tri} \\times 180$`],
      explain: `$(${n} - 2) \\times 180^\\circ = ${tri} \\times 180^\\circ = ${deg(total)}$`,
    },
  ];
  return {
    id: pid('interior-sum', rng),
    skill: 'interior-sum',
    intro: opts_.guided ? 'This is an octagon. Let’s show that its interior angles add up to $1080^\\circ$.' : `Here’s ${an(name(n))} ${name(n)}. Let’s find the total of its interior angles.`,
    question: `Find the sum of the interior angles of ${an(name(n))} ${name(n)}.`,
    diagram: { type: 'polygon', n, triangulate: true, irregular: !opts_.guided && rng() < 0.4, seed: Math.floor(rng() * 1e6) },
    steps,
    summary: `We split the ${name(n)} into $${tri}$ triangles from one corner. Each triangle adds $180^\\circ$, so the total is $${tri} \\times 180^\\circ = ${deg(total)}$. This works for any ${name(n)} — regular or not.`,
    answer: `$${deg(total)}$`,
  };
}

export const interiorSum: LessonDef = {
  id: 'interior-sum',
  topic: 'angles',
  title: 'Sum of interior angles',
  blurb: 'Why a polygon’s angles add up to (n − 2) × 180°.',
  objective: 'find the total of the interior angles of any polygon',
  intro: [
    { pose: 'waving', text: 'Let’s explore the angles inside polygons. A **polygon** is a flat shape with straight sides. Its **interior angles** are the angles inside each corner.', diagram: { type: 'polygon', n: 5, irregular: true, seed: 7, markAngle: 'interior' } },
    { pose: 'explaining', text: 'Here’s the clever trick: from one corner, draw lines to every other corner you can. The shape splits into triangles — and every triangle’s angles add up to $180^\\circ$.', diagram: { type: 'polygon', n: 6, triangulate: true } },
    { pose: 'explaining', text: 'A polygon with $n$ sides always splits into $n - 2$ triangles. So the interior angles add up to:', formula: '\\text{Sum} = (n - 2) \\times 180^\\circ', diagram: { type: 'polygon', n: 8, triangulate: true } },
    { pose: 'curious', text: 'Let’s try the worksheet question together: the octagon. I’ll ask you each step — have a go before you peek at a hint!' },
  ],
  guided: () => interiorSumProblem(() => 0.37, 8, { guided: true }),
  generate: (rng, d: Difficulty) => {
    if (d === 2 && rng() < 0.5) return interiorSumProblem(rng, randInt(rng, 7, 20), { reverse: true });
    const n = d === 0 ? randInt(rng, 4, 8) : d === 1 ? randInt(rng, 5, 12) : randInt(rng, 9, 20);
    return interiorSumProblem(rng, n);
  },
  inExam: true,
  guide: {
    rule: 'Sum of interior angles $= (n - 2) \\times 180^\\circ$',
    explanation: 'From one corner a polygon with $n$ sides splits into $n - 2$ triangles, and each triangle’s angles add to $180^\\circ$.',
    mistake: 'Multiplying the number of sides by $180^\\circ$. An octagon makes 6 triangles, not 8.',
  },
};

// ───────────────────────── 2. Interior angle of a regular polygon ─────────────────────────

const REGULAR_EASY = [3, 4, 6, 8];
const REGULAR_MID = [5, 8, 9, 10, 12];
const REGULAR_HARD = [15, 18, 20, 24, 36];

function regularInteriorProblem(rng: Rng, n: number, guided = false): Problem {
  const total = M.interiorAngleSum(n);
  const each = M.regularInteriorAngle(n);
  return {
    id: pid('regular-interior', rng),
    skill: 'regular-interior',
    intro: guided ? 'Now let’s find each interior angle of a **regular** octagon.' : `This is a regular ${name(n)}. Let’s find the size of one interior angle.`,
    question: `Work out the interior angle of a regular ${name(n)}.`,
    diagram: { type: 'polygon', n, markAngle: 'interior' },
    steps: [
      {
        id: 'regular',
        kind: 'choice',
        prompt: 'What does **regular** tell us about this polygon?',
        options: opts(rng, [
          ok('a', 'All its sides are equal and all its angles are equal.'),
          no('b', 'It’s a common, everyday shape.', 'In maths, “regular” has a special meaning about sides and angles.'),
          no('c', 'Its angles add up to $360^\\circ$.', 'That’s true of every quadrilateral — regular or not.'),
          no('d', 'It has an even number of sides.', 'A regular pentagon has 5 sides, so that can’t be it.'),
        ]),
        hints: ['Look at the sides and the corners of the shape.', 'Are any sides longer than the others? Any corners sharper?', 'Regular means everything is equal: sides and angles.'],
        explain: 'A **regular** polygon has equal sides and equal angles. An **irregular** polygon doesn’t — so we can’t share the total equally for those!',
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'total',
        kind: 'number',
        prompt: 'First, what do all the interior angles add up to?',
        answer: { value: total, tol: 0 },
        unit: '°',
        display: `$${deg(total)}$`,
        hints: ['Use the rule from the last lesson: $(n - 2) \\times 180^\\circ$.', `Here $n = ${n}$.`, `$(${n} - 2) \\times 180 = ${n - 2} \\times 180$`],
        explain: `$(${n} - 2) \\times 180^\\circ = ${deg(total)}$`,
        guidedOnly: true,
      },
      {
        id: 'op',
        kind: 'choice',
        prompt: `There are ${n} equal angles sharing $${deg(total)}$. What should we do?`,
        options: opts(rng, [
          ok('a', `$${total} \\div ${n}$`),
          no('b', `$${total} \\times ${n}$`, 'Multiplying makes it bigger — but one angle must be smaller than the total.'),
          no('c', `$360 \\div ${n}$`, 'That gives the **exterior** angle. We want the interior one.'),
          no('d', `$${total} - ${n}$`, 'We’re sharing the total equally between the angles.'),
        ]),
        hints: ['The total is shared equally between all the angles.', 'Sharing equally means dividing.', `Divide $${total}$ by the number of angles, ${n}.`],
        explain: `Each angle $= \\text{Sum} \\div n$.`,
        guidedOnly: true,
      },
      {
        id: 'each',
        kind: 'number',
        prompt: guided ? 'Work it out: how big is each interior angle?' : `How big is each interior angle of a regular ${name(n)}?`,
        answer: { value: each, tol: 0 },
        unit: '°',
        display: `$${deg(each)}$`,
        hints: ['Each interior angle $= \\dfrac{(n - 2) \\times 180^\\circ}{n}$.', `The total is $${deg(total)}$; share it between ${n} angles.`, `$${total} \\div ${n} = \\;?$`],
        explain: `$${total}^\\circ \\div ${n} = ${deg(each)}$`,
      },
    ],
    summary: `A regular ${name(n)} has ${n} equal angles. They add up to $${deg(total)}$, so each one is $${total} \\div ${n} = ${deg(each)}$.`,
    answer: `$${deg(each)}$`,
  };
}

export const regularInterior: LessonDef = {
  id: 'regular-interior',
  topic: 'angles',
  title: 'Regular polygon angles',
  blurb: 'Share the total equally when every angle is the same.',
  objective: 'work out each interior angle of a regular polygon',
  prereq: ['interior-sum'],
  intro: [
    { pose: 'waving', text: 'Some polygons are **regular**: every side is the same length and every angle is the same size.', diagram: { type: 'polygon', n: 6 } },
    { pose: 'explaining', text: 'An **irregular** polygon has sides or angles that differ. Its angles still add up to $(n - 2) \\times 180^\\circ$ — but they aren’t equal, so we can’t just share them out.', diagram: { type: 'polygon', n: 6, irregular: true, seed: 3 } },
    { pose: 'explaining', text: 'For a regular polygon, share the total equally:', formula: '\\text{Each interior angle} = \\dfrac{(n - 2) \\times 180^\\circ}{n}' },
  ],
  guided: () => regularInteriorProblem(() => 0.61, 8, true),
  generate: (rng, d) => regularInteriorProblem(rng, pick(rng, d === 0 ? REGULAR_EASY : d === 1 ? REGULAR_MID : REGULAR_HARD)),
  inExam: true,
  guide: {
    rule: 'Each interior angle of a regular polygon $= \\dfrac{(n - 2) \\times 180^\\circ}{n}$',
    explanation: 'Find the total with $(n - 2) \\times 180^\\circ$, then share it equally between the $n$ angles. Only works when the polygon is **regular**.',
    mistake: 'Dividing $360^\\circ$ by $n$ — that gives the exterior angle, not the interior one.',
  },
};

// ───────────────────────── 3. Exterior angles ─────────────────────────

const EXT_N = { 0: [4, 5, 6, 9, 10], 1: [8, 9, 10, 12, 15], 2: [15, 18, 20, 24, 30, 36] } as const;

function exteriorProblem(rng: Rng, n: number, variant: 'from-n' | 'n-from-ext' | 'n-from-int', guided = false): Problem {
  const ext = M.regularExteriorAngle(n);
  const int = M.regularInteriorAngle(n);
  if (variant === 'n-from-ext' || variant === 'n-from-int') {
    const fromInt = variant === 'n-from-int';
    const steps: Step[] = [];
    if (fromInt) {
      steps.push({
        id: 'ext',
        kind: 'number',
        prompt: 'Start with the exterior angle. Interior and exterior angles sit on a straight line. What is the exterior angle?',
        answer: { value: ext, tol: 0 },
        unit: '°',
        display: `$${deg(ext)}$`,
        hints: ['Interior + exterior $= 180^\\circ$.', `Subtract the interior angle from $180^\\circ$.`, `$180 - ${int} = \\;?$`],
        explain: `$180^\\circ - ${deg(int)} = ${deg(ext)}$`,
      });
    }
    steps.push({
      id: 'n',
      kind: 'number',
      prompt: `All the exterior angles add up to $360^\\circ$, and each one is $${deg(ext)}$. How many sides?`,
      answer: { value: n, tol: 0 },
      display: `$${n}$ sides`,
      hints: ['The exterior angles of any polygon add to $360^\\circ$.', `How many lots of $${deg(ext)}$ make $360^\\circ$?`, `$360 \\div ${ext} = \\;?$`],
      explain: `$n = 360^\\circ \\div ${deg(ext)} = ${n}$`,
    });
    return {
      id: pid('exterior', rng),
      skill: 'exterior',
      intro: 'Let’s work backwards from an angle to the number of sides.',
      question: fromInt ? `Each interior angle of a regular polygon is $${deg(int)}$. How many sides does it have?` : `Each exterior angle of a regular polygon is $${deg(ext)}$. How many sides does it have?`,
      diagram: { type: 'polygon', n: Math.min(n, 12), markAngle: 'exterior', caption: 'A regular polygon (not to scale)' },
      steps,
      summary: `${fromInt ? `The exterior angle is $180^\\circ - ${deg(int)} = ${deg(ext)}$. ` : ''}The exterior angles add to $360^\\circ$, so $n = 360 \\div ${ext} = ${n}$: ${an(name(n))} ${name(n)}.`,
      answer: `${n} sides`,
    };
  }
  return {
    id: pid('exterior', rng),
    skill: 'exterior',
    intro: guided ? 'A nonagon has 9 sides. Let’s find its exterior and interior angles.' : `Let’s find the angles of a regular ${name(n)}.`,
    question: `A regular ${name(n)} has ${n} sides. Work out (a) each exterior angle and (b) each interior angle.`,
    diagram: { type: 'polygon', n, markAngle: 'exterior' },
    steps: [
      {
        id: 'rule',
        kind: 'choice',
        prompt: 'If you walk all the way round any polygon, turning at each corner, how far do you turn altogether?',
        options: opts(rng, [
          ok('a', '$360^\\circ$ — one full turn'),
          no('b', '$180^\\circ$', 'Walk round once and you end up facing the same way you started. How far is that?'),
          no('c', `$(n - 2) \\times 180^\\circ$`, 'That’s the interior-angle total. The exterior angles are the turns.'),
          no('d', 'It depends on the shape', 'Surprisingly, it doesn’t! Every polygon gives the same answer.'),
        ]),
        hints: ['Each exterior angle is how far you turn at a corner.', 'After going all the way round, which way are you facing?', 'You’ve turned through one full turn.'],
        explain: 'The exterior angles of **any** polygon add up to $360^\\circ$.',
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'ext',
        kind: 'number',
        prompt: `What is each exterior angle of a regular ${name(n)}?`,
        answer: { value: ext, tol: 0 },
        unit: '°',
        display: `$${deg(ext)}$`,
        hints: ['The exterior angles add up to $360^\\circ$ and they’re all equal.', `Share $360^\\circ$ between ${n} corners.`, `$360 \\div ${n} = \\;?$`],
        explain: `Each exterior angle $= 360^\\circ \\div ${n} = ${deg(ext)}$`,
        highlight: ['exterior'],
      },
      {
        id: 'line',
        kind: 'choice',
        prompt: 'Look at one corner. The interior and exterior angles sit together on a straight line. What do they add up to?',
        options: opts(rng, [ok('a', '$180^\\circ$'), no('b', '$90^\\circ$', 'Look again — they make a straight line, not a right angle.'), no('c', '$360^\\circ$', 'That’s a full turn. A straight line is half a turn.'), no('d', `$${deg(ext)}$`, 'That’s just the exterior angle on its own.')]),
        hints: ['Which rule is about straight lines?', 'Angles on a straight line add up to …', 'Half a full turn.'],
        explain: 'Interior angle $+$ exterior angle $= 180^\\circ$ (angles on a straight line).',
        guidedOnly: true,
      },
      {
        id: 'int',
        kind: 'number',
        prompt: `So what is each interior angle?`,
        answer: { value: int, tol: 0 },
        unit: '°',
        display: `$${deg(int)}$`,
        hints: ['Interior $= 180^\\circ -$ exterior.', `The exterior angle is $${deg(ext)}$.`, `$180 - ${ext} = \\;?$`],
        explain: `$180^\\circ - ${deg(ext)} = ${deg(int)}$. (Check: $(${n} - 2) \\times 180 \\div ${n} = ${int}$ ✓)`,
        highlight: ['interior'],
      },
    ],
    summary: `Each exterior angle is $360^\\circ \\div ${n} = ${deg(ext)}$. Interior and exterior make a straight line, so each interior angle is $180^\\circ - ${deg(ext)} = ${deg(int)}$.`,
    answer: `Exterior $${deg(ext)}$, interior $${deg(int)}$`,
  };
}

export const exterior: LessonDef = {
  id: 'exterior',
  topic: 'angles',
  title: 'Exterior angles',
  blurb: 'The turns round a polygon always add to 360°.',
  objective: 'find exterior and interior angles of regular polygons, and the number of sides',
  prereq: ['regular-interior'],
  intro: [
    { pose: 'waving', text: 'Extend one side of a polygon past a corner. The angle between the extension and the next side is an **exterior angle** — it’s how far you turn at that corner.', diagram: { type: 'polygon', n: 5, markAngle: 'exterior' } },
    { pose: 'explaining', text: 'Walk all the way round and you turn exactly once. So for **every** polygon:', formula: '\\text{Sum of exterior angles} = 360^\\circ' },
    { pose: 'explaining', text: 'For a regular polygon the turns are equal, and each interior angle sits on a straight line with its exterior angle:', formula: '\\text{Exterior} = \\dfrac{360^\\circ}{n} \\qquad \\text{Interior} = 180^\\circ - \\text{Exterior}', diagram: { type: 'polygon', n: 9, markAngle: 'exterior' } },
  ],
  guided: () => exteriorProblem(() => 0.42, 9, 'from-n', true),
  generate: (rng, d) => {
    const n = pick(rng, EXT_N[d]);
    if (d === 0) return exteriorProblem(rng, n, 'from-n');
    const r = rng();
    if (d === 1) return exteriorProblem(rng, n, r < 0.65 ? 'from-n' : 'n-from-ext');
    return exteriorProblem(rng, n, r < 0.3 ? 'from-n' : r < 0.6 ? 'n-from-ext' : 'n-from-int');
  },
  inExam: true,
  guide: {
    rule: 'Exterior angles add to $360^\\circ$. Regular: exterior $= 360^\\circ \\div n$, interior $= 180^\\circ -$ exterior.',
    explanation: 'An exterior angle is the turn at a corner. One trip round the shape is one full turn.',
    mistake: 'Mixing up interior and exterior angles. For a nonagon the exterior angle is $40^\\circ$ and the interior angle is $140^\\circ$.',
  },
};

// ───────────────────────── 4. Unknown angles in irregular polygons ─────────────────────────

/** n positive integer exterior angles (35°–110°) that add to 360°. */
export function randomExteriors(rng: Rng, n: number): number[] {
  for (let tries = 0; tries < 2000; tries++) {
    const xs = Array.from({ length: n - 1 }, () => randInt(rng, 36, Math.min(110, Math.floor(400 / n) + 30)));
    const last = 360 - xs.reduce((s, x) => s + x, 0);
    if (last >= 36 && last <= 110) return [...xs, last];
  }
  throw new Error('randomExteriors failed');
}

function irregularProblem(rng: Rng, exteriors: number[], unknownIndex: number, mode: 'exterior' | 'interior', guided = false): Problem {
  const n = exteriors.length;
  const letter = guided ? 'a' : pick(rng, ['a', 'x', 'y', 'b']);
  const seed = guided ? 11 : Math.floor(rng() * 1e6);
  if (mode === 'exterior') {
    const known = exteriors.filter((_, i) => i !== unknownIndex);
    const knownSum = known.reduce((s, x) => s + x, 0);
    const ans = M.missingExteriorAngle(known);
    if (ans !== exteriors[unknownIndex]) throw new Error('irregular exterior self-check failed');
    return {
      id: pid('irregular', rng),
      skill: 'irregular',
      intro: guided ? 'Here’s the irregular polygon from the worksheet. Let’s find angle $a$.' : `Let’s find angle $${letter}$.`,
      question: `The diagram shows the exterior angles of ${an(name(n))} ${name(n)}. Calculate angle $${letter}$.`,
      diagram: { type: 'exterior-polygon', exteriors, unknownIndex, unknownLabel: letter, mode, seed },
      steps: [
        {
          id: 'which',
          kind: 'choice',
          prompt: 'Look closely: are the marked angles inside the shape or outside it?',
          options: opts(rng, [
            ok('a', 'Outside — they’re **exterior** angles'),
            no('b', 'Inside — they’re interior angles', 'Look where each arc is drawn: between a side and the extension of the next side, outside the shape.'),
          ]),
          hints: ['Find one of the arcs. Is it inside the shape?', 'Each arc sits between a side and a line that sticks out past the corner.', 'Those are exterior angles.'],
          explain: 'They’re exterior angles: each one is the turn at a corner.',
          guidedOnly: true,
          pose: 'curious',
        },
        {
          id: 'rule',
          kind: 'choice',
          prompt: 'Which rule might help us here?',
          options: opts(rng, [
            ok('a', 'The exterior angles of a polygon add up to $360^\\circ$'),
            no('b', `The interior angles add up to $(n - 2) \\times 180^\\circ$`, 'True, but these are exterior angles — is there a simpler rule for those?'),
            no('c', 'Each exterior angle is $360^\\circ \\div n$', 'Only for **regular** polygons. These angles are all different.'),
            no('d', 'Angles on a straight line add up to $180^\\circ$', 'Close — but we need a rule that links all the exterior angles together.'),
          ]),
          hints: ['Think about walking all the way round the shape.', 'What do all the turns add up to?', 'One full turn: $360^\\circ$.'],
          explain: 'The exterior angles of **any** polygon add up to $360^\\circ$ — regular or not.',
          guidedOnly: true,
        },
        {
          id: 'known',
          kind: 'number',
          prompt: 'Add up the angles we know.',
          answer: { value: knownSum, tol: 0 },
          unit: '°',
          display: `$${known.join(' + ')} = ${deg(knownSum)}$`,
          hints: ['Add together every angle that has a number.', `There are ${known.length} of them.`, `$${known.join(' + ')}$`],
          explain: `$${known.join(' + ')} = ${deg(knownSum)}$`,
        },
        {
          id: 'answer',
          kind: 'number',
          prompt: `So what is angle $${letter}$?`,
          label: `$${letter} =$`,
          answer: { value: ans, tol: 0 },
          unit: '°',
          display: `$${letter} = ${deg(ans)}$`,
          hints: ['All the exterior angles together make $360^\\circ$.', `Subtract the known total from $360^\\circ$.`, `$360 - ${knownSum} = \\;?$`],
          explain: `$${letter} = 360^\\circ - ${deg(knownSum)} = ${deg(ans)}$`,
          highlight: ['unknown'],
        },
      ],
      summary: `The exterior angles of any polygon add to $360^\\circ$. The known angles total $${deg(knownSum)}$, so $${letter} = 360^\\circ - ${deg(knownSum)} = ${deg(ans)}$.`,
      answer: `$${letter} = ${deg(ans)}$`,
    };
  }
  const interiors = exteriors.map(M.interiorFromExterior);
  const known = interiors.filter((_, i) => i !== unknownIndex);
  const knownSum = known.reduce((s, x) => s + x, 0);
  const total = M.interiorAngleSum(n);
  const ans = M.missingInteriorAngle(known);
  if (ans !== interiors[unknownIndex]) throw new Error('irregular interior self-check failed');
  return {
    id: pid('irregular', rng),
    skill: 'irregular',
    intro: `This ${name(n)} is irregular, so its angles are all different. Let’s find angle $${letter}$.`,
    question: `The diagram shows the interior angles of ${an(name(n))} ${name(n)}. Calculate angle $${letter}$.`,
    diagram: { type: 'exterior-polygon', exteriors, unknownIndex, unknownLabel: letter, mode, seed },
    steps: [
      {
        id: 'total',
        kind: 'number',
        prompt: `First, what do the interior angles of ${an(name(n))} ${name(n)} add up to?`,
        answer: { value: total, tol: 0 },
        unit: '°',
        display: `$${deg(total)}$`,
        hints: ['Sum of interior angles $= (n - 2) \\times 180^\\circ$.', `A ${name(n)} has ${n} sides.`, `$(${n} - 2) \\times 180 = \\;?$`],
        explain: `$(${n} - 2) \\times 180^\\circ = ${deg(total)}$`,
      },
      {
        id: 'known',
        kind: 'number',
        prompt: 'Add up the angles we know.',
        answer: { value: knownSum, tol: 0 },
        unit: '°',
        display: `$${deg(knownSum)}$`,
        hints: ['Add every angle with a number.', `There are ${known.length} of them.`, `$${known.join(' + ')}$`],
        explain: `$${known.join(' + ')} = ${deg(knownSum)}$`,
      },
      {
        id: 'answer',
        kind: 'number',
        prompt: `So what is angle $${letter}$?`,
        label: `$${letter} =$`,
        answer: { value: ans, tol: 0 },
        unit: '°',
        display: `$${letter} = ${deg(ans)}$`,
        hints: ['The missing angle makes up the rest of the total.', 'Subtract the known angles from the total.', `$${total} - ${knownSum} = \\;?$`],
        explain: `$${letter} = ${deg(total)} - ${deg(knownSum)} = ${deg(ans)}$`,
        highlight: ['unknown'],
      },
    ],
    summary: `The interior angles of ${an(name(n))} ${name(n)} add to $${deg(total)}$. Take away the known $${deg(knownSum)}$ to get $${letter} = ${deg(ans)}$.`,
    answer: `$${letter} = ${deg(ans)}$`,
  };
}

export const irregular: LessonDef = {
  id: 'irregular',
  topic: 'angles',
  title: 'Unknown angles in irregular polygons',
  blurb: 'Use the angle totals to find a missing angle.',
  objective: 'find a missing exterior or interior angle when the polygon is irregular',
  prereq: ['exterior'],
  intro: [
    { pose: 'waving', text: 'In an **irregular** polygon the angles are all different, so we can’t share a total equally. But the totals still work!', diagram: { type: 'exterior-polygon', exteriors: [70, 48, 62, 85, 95], unknownIndex: 4, unknownLabel: 'a', mode: 'exterior', seed: 11 } },
    { pose: 'explaining', text: 'If the exterior angles are marked, use: exterior angles add up to $360^\\circ$. Add the ones you know, then subtract from $360^\\circ$.', formula: 'a = 360^\\circ - (\\text{sum of known exterior angles})' },
    { pose: 'explaining', text: 'If interior angles are marked, use the interior total $(n - 2) \\times 180^\\circ$ instead.' },
  ],
  guided: () => irregularProblem(() => 0.25, [70, 48, 62, 85, 95], 4, 'exterior', true),
  generate: (rng, d) => {
    const n = d === 0 ? 4 : d === 1 ? pick(rng, [5, 5, 6]) : pick(rng, [5, 6, 7]);
    const ex = randomExteriors(rng, n);
    const mode = d === 2 && rng() < 0.6 ? 'interior' : d === 1 && rng() < 0.3 ? 'interior' : 'exterior';
    return irregularProblem(rng, ex, randInt(rng, 0, n - 1), mode);
  },
  inExam: true,
  guide: {
    rule: 'Exterior angles add to $360^\\circ$; interior angles add to $(n - 2) \\times 180^\\circ$',
    explanation: 'Add the known angles and subtract from the right total. Check first whether the marked angles are inside (interior) or outside (exterior).',
    mistake: 'Using $360^\\circ \\div n$ for an irregular polygon — that only works when every angle is equal.',
  },
};

// ───────────────────────── 5. Parallelograms ─────────────────────────

type PKey = 'P' | 'Q' | 'R' | 'QRT';
const PDESC: Record<PKey, string> = { P: '\\angle SPQ', Q: '\\angle PQR', R: '\\angle QRS', QRT: '\\angle QRT' };

function parallelogramSteps(rng: Rng, angleS: number, key: PKey, letter: string, knownR: boolean): Step[] {
  const a = M.parallelogramAngles(angleS);
  const value = a[key];
  const ruleOpts = {
    opposite: 'Opposite angles of a parallelogram are equal',
    adjacent: 'Next-door (co-interior) angles of a parallelogram add up to $180^\\circ$',
    line: 'Angles on a straight line add up to $180^\\circ$',
    point: 'Angles around a point add up to $360^\\circ$',
    triangle: 'Angles in a triangle add up to $180^\\circ$',
  };
  let correctRule: keyof typeof ruleOpts;
  let working: string;
  if (key === 'Q') {
    correctRule = 'opposite';
    working = `$${letter} = ${PDESC.Q}$ is opposite $\\angle S$, so $${letter} = ${deg(angleS)}$.`;
  } else if (key === 'P' || key === 'R') {
    correctRule = 'adjacent';
    working = `$${letter}$ and $\\angle S$ are next to each other between parallel sides, so $${letter} = 180^\\circ - ${deg(angleS)} = ${deg(value)}$.`;
  } else {
    correctRule = 'line';
    working = knownR
      ? `$\\angle QRS$ and $${letter}$ lie on the straight line $SRT$, so $${letter} = 180^\\circ - ${deg(a.R)} = ${deg(value)}$.`
      : `$\\angle QRS = 180^\\circ - ${deg(angleS)} = ${deg(a.R)}$, and it lies on the straight line $SRT$ with $${letter}$, so $${letter} = 180^\\circ - ${deg(a.R)} = ${deg(value)}$.`;
  }
  const feedback: Record<keyof typeof ruleOpts, string> = {
    opposite: key === 'Q' ? '' : `Opposite angles are equal — but is $${letter}$ opposite $\\angle S$? Trace across the shape.`,
    adjacent: key === 'P' || key === 'R' ? '' : key === 'Q' ? `$${letter}$ isn’t next to $\\angle S$ — it’s across from it.` : `$${letter}$ is outside the parallelogram. Which line is it on?`,
    line: key === 'QRT' ? '' : `$${letter}$ is inside the parallelogram, not on a straight line with another marked angle.`,
    point: 'There’s no full turn round a point here.',
    triangle: 'There’s no triangle drawn in this diagram.',
  };
  const chosen = (['opposite', 'adjacent', 'line', 'point', 'triangle'] as const).filter((k) => k === correctRule || k !== 'triangle' || rng() < 0.5).slice(0, 4);
  if (!chosen.includes(correctRule)) chosen[0] = correctRule;
  return [
    {
      id: `rule-${key}`,
      kind: 'choice',
      prompt: `Let’s find $${letter} = ${PDESC[key]}$. Which angle rule applies?`,
      options: opts(
        rng,
        chosen.map((k) => (k === correctRule ? ok(k, ruleOpts[k]) : no(k, ruleOpts[k], feedback[k]))),
      ),
      hints: [
        'Look at where the angle is: opposite the marked angle, next to it, or outside the shape?',
        key === 'QRT' ? 'Points S, R and T are on one straight line.' : key === 'Q' ? `Draw a line from S across to Q. What do you notice?` : `$PQ$ is parallel to $SR$, and $PS$ is parallel to $QR$.`,
        key === 'QRT' ? 'Angles on a straight line add to $180^\\circ$.' : key === 'Q' ? 'Opposite angles are equal.' : 'Angles between a pair of parallel lines on the same side add to $180^\\circ$.',
      ],
      explain: ruleOpts[correctRule] + '.',
      guidedOnly: true,
      highlight: [key],
      pose: 'curious',
    },
    {
      id: `val-${key}`,
      kind: 'number',
      prompt: `So what is $${letter}$?`,
      label: `$${letter} =$`,
      answer: { value, tol: 0 },
      unit: '°',
      display: `$${letter} = ${deg(value)}$`,
      hints: [
        ruleOpts[correctRule] + '.',
        key === 'Q' ? 'It is the same as the angle at S.' : key === 'QRT' && !knownR ? 'First find $\\angle QRS = 180^\\circ - \\angle S$.' : 'Subtract from $180^\\circ$.',
        key === 'Q' ? `$${letter} = ${deg(angleS)}$` : key === 'QRT' ? `$180 - ${a.R}$` : `$180 - ${angleS}$`,
      ],
      explain: working,
      highlight: [key],
    },
  ];
}

function parallelogramProblem(rng: Rng, angleS: number, keys: PKey[], guided = false): Problem {
  const letters = ['x', 'y'];
  const labels: Record<string, string> = { S: deg(angleS) };
  keys.forEach((k, i) => (labels[k] = letters[i]));
  const a = M.parallelogramAngles(angleS);
  const steps: Step[] = [];
  keys.forEach((k, i) => steps.push(...parallelogramSteps(rng, angleS, k, letters[i], keys.slice(0, i).includes('R'))));
  const ans = keys.map((k, i) => `$${letters[i]} = ${deg(a[k])}$`).join(', ');
  return {
    id: pid('parallelogram', rng),
    skill: 'parallelogram',
    intro: guided
      ? '$PQRS$ is a parallelogram and $T$ is on the extension of $SR$. The angle at $S$ is $70^\\circ$. Let’s find $x$ and $y$.'
      : `$PQRS$ is a parallelogram. $T$ is on the line $SR$ extended. Let’s find the missing angle${keys.length > 1 ? 's' : ''}.`,
    question: `$PQRS$ is a parallelogram and $T$ lies on $SR$ extended. $\\angle PSR = ${deg(angleS)}$. Work out ${keys.map((_, i) => `$${letters[i]}$`).join(' and ')}.`,
    diagram: { type: 'parallelogram', angleS, labels },
    steps: [
      {
        id: 'parallel',
        kind: 'multi',
        prompt: 'Before we start: which pairs of sides are parallel? Select all that apply.',
        options: opts(rng, [
          ok('pq', '$PQ$ and $SR$'),
          ok('ps', '$PS$ and $QR$'),
          no('pr', '$PS$ and $SR$', 'Those meet at $S$, so they can’t be parallel.'),
          no('qr', '$PQ$ and $QR$', 'Those meet at $Q$, so they can’t be parallel.'),
        ]),
        hints: ['Parallel lines never meet.', 'In a parallelogram, opposite sides are parallel.', 'Top with bottom, left with right.'],
        explain: 'Opposite sides of a parallelogram are parallel: $PQ \\parallel SR$ and $PS \\parallel QR$.',
        guidedOnly: true,
        pose: 'curious',
      },
      ...steps,
    ],
    summary: `${keys.map((k, i) => `$${letters[i]} = ${deg(a[k])}$`).join(' and ')}. In a parallelogram, opposite angles are equal and next-door angles add to $180^\\circ$ because they sit between parallel sides. Check: $${angleS} + ${a.R} = 180$ ✓`,
    answer: ans,
  };
}

export const parallelogram: LessonDef = {
  id: 'parallelogram',
  topic: 'angles',
  title: 'Angles in a parallelogram',
  blurb: 'Opposite angles are equal; neighbours add to 180°.',
  objective: 'find missing angles in and around a parallelogram',
  intro: [
    { pose: 'waving', text: 'A **parallelogram** has two pairs of parallel sides. In $PQRS$, $PQ$ is parallel to $SR$ and $PS$ is parallel to $QR$.', diagram: { type: 'parallelogram', angleS: 70, labels: {} } },
    { pose: 'explaining', text: '**Opposite angles are equal.** **Next-door angles add up to $180^\\circ$**, because they sit between parallel lines (co-interior angles).', diagram: { type: 'parallelogram', angleS: 70, labels: { S: deg(70), Q: deg(70), P: deg(110), R: deg(110) } } },
    { pose: 'explaining', text: 'If a side is extended, the outside angle sits on a straight line with the inside angle, so together they make $180^\\circ$.', diagram: { type: 'parallelogram', angleS: 70, labels: { S: deg(70), R: deg(110), QRT: deg(70) } } },
  ],
  guided: () => parallelogramProblem(() => 0.5, 70, ['R', 'QRT'], true),
  generate: (rng, d) => {
    let s = randInt(rng, 40, 140);
    if (s === 90) s = 75;
    if (d === 0) s = pick(rng, [50, 60, 70, 80, 110, 120]);
    const pool: PKey[][] = d === 0 ? [['Q'], ['R'], ['P']] : d === 1 ? [['R', 'QRT'], ['Q', 'R'], ['P', 'Q'], ['QRT']] : [['QRT', 'Q'], ['QRT'], ['P', 'QRT']];
    return parallelogramProblem(rng, s, pick(rng, pool));
  },
  inExam: true,
  guide: {
    rule: 'Opposite angles of a parallelogram are equal; next-door angles add up to $180^\\circ$',
    explanation: 'Each pair of next-door angles lies between parallel sides (co-interior angles). An angle outside the shape on an extended side makes $180^\\circ$ with the inside angle.',
    mistake: 'Assuming every angle is the same. Only **opposite** angles are equal.',
  },
};

// ───────────────────────── 6. Angle facts: line, point, parallel lines ─────────────────────────

const VAL = (pos: AnglePos, theta: number) => (/tr$|bl$/.test(pos) ? theta : 180 - theta);

/** Angle pairs for each relationship (top crossing first). */
const PAIRS: Record<M.ParallelRelation, [AnglePos, AnglePos][]> = {
  corresponding: [['top-tl', 'bot-tl'], ['top-tr', 'bot-tr'], ['top-bl', 'bot-bl'], ['top-br', 'bot-br']],
  alternate: [['top-bl', 'bot-tr'], ['top-br', 'bot-tl']],
  'co-interior': [['top-bl', 'bot-tl'], ['top-br', 'bot-tr']],
  'vertically-opposite': [['top-tl', 'top-br'], ['top-tr', 'top-bl'], ['bot-tl', 'bot-br'], ['bot-tr', 'bot-bl']],
};

const RELATION_TEXT: Record<M.ParallelRelation, string> = {
  corresponding: 'Corresponding angles are equal (an F shape)',
  alternate: 'Alternate angles are equal (a Z shape)',
  'co-interior': 'Co-interior angles add up to $180^\\circ$ (a C shape)',
  'vertically-opposite': 'Vertically opposite angles are equal (an X shape)',
};

function parallelProblem(rng: Rng): Problem {
  const theta = randInt(rng, 40, 75);
  const rel = pick(rng, ['corresponding', 'alternate', 'co-interior', 'vertically-opposite'] as M.ParallelRelation[]);
  const pair = pick(rng, PAIRS[rel]);
  const [g, u] = rng() < 0.5 ? pair : ([pair[1], pair[0]] as [AnglePos, AnglePos]);
  const given = VAL(g, theta);
  const ans = M.parallelLineAngle(given, rel);
  if (ans !== VAL(u, theta)) throw new Error('parallel self-check failed');
  const letter = pick(rng, ['x', 'y', 'p']);
  const wrongRels = (Object.keys(RELATION_TEXT) as M.ParallelRelation[]).filter((r) => r !== rel);
  return {
    id: pid('angle-facts', rng),
    skill: 'angle-facts',
    intro: 'Two parallel lines are crossed by another line. Let’s spot the pattern.',
    question: `The two horizontal lines are parallel. Find angle $${letter}$.`,
    diagram: { type: 'parallel', slope: theta, given: { pos: g, label: deg(given) }, unknown: { pos: u, label: letter } },
    steps: [
      {
        id: 'rule',
        kind: 'choice',
        prompt: `How are $${deg(given)}$ and $${letter}$ related?`,
        options: opts(rng, [ok(rel, RELATION_TEXT[rel]), ...wrongRels.map((r) => no(r, RELATION_TEXT[r], 'Trace the shape the two angles make: an F, a Z, a C, or an X?'))]),
        hints: ['Look at the shape you can draw through both angles.', 'F = corresponding, Z = alternate, C = co-interior, X = vertically opposite.', `These two make ${rel === 'corresponding' ? 'an F' : rel === 'alternate' ? 'a Z' : rel === 'co-interior' ? 'a C' : 'an X'} shape.`],
        explain: RELATION_TEXT[rel] + '.',
        guidedOnly: true,
        pose: 'curious',
        highlight: ['pair'],
      },
      {
        id: 'answer',
        kind: 'number',
        prompt: `What is angle $${letter}$?`,
        label: `$${letter} =$`,
        answer: { value: ans, tol: 0 },
        unit: '°',
        display: `$${letter} = ${deg(ans)}$`,
        hints: [RELATION_TEXT[rel] + '.', rel === 'co-interior' ? 'Subtract from $180^\\circ$.' : 'They are the same size.', rel === 'co-interior' ? `$180 - ${given}$` : `$${letter} = ${deg(given)}$`],
        explain: rel === 'co-interior' ? `$${letter} = 180^\\circ - ${deg(given)} = ${deg(ans)}$ (co-interior angles).` : `$${letter} = ${deg(given)}$ (${rel.replace('-', ' ')} angles).`,
      },
    ],
    summary: `${RELATION_TEXT[rel]}, so $${letter} = ${deg(ans)}$.`,
    answer: `$${letter} = ${deg(ans)}$`,
  };
}

function lineOrPointProblem(rng: Rng, kind: 'line' | 'point', fixed?: number[]): Problem {
  const total = kind === 'line' ? 180 : 360;
  const k = fixed ? fixed.length : kind === 'line' ? randInt(rng, 1, 2) : randInt(rng, 2, 3);
  let known: number[] = fixed ?? [];
  if (!fixed) {
    for (let tries = 0; tries < 500; tries++) {
      known = Array.from({ length: k }, () => randInt(rng, 25, kind === 'line' ? 110 : 140));
      const rest = total - known.reduce((s, x) => s + x, 0);
      if (rest >= 25 && rest <= (kind === 'line' ? 130 : 160)) break;
    }
  }
  const ans = kind === 'line' ? M.missingOnStraightLine(known) : M.missingAroundPoint(known);
  const letter = pick(rng, ['x', 'y', 'a', 'b']);
  const angles = [...known.map((v) => ({ value: v, label: deg(v) })), { value: ans, label: letter }];
  const sumKnown = known.reduce((s, x) => s + x, 0);
  return {
    id: pid('angle-facts', rng),
    skill: 'angle-facts',
    intro: kind === 'line' ? 'These angles sit together on a straight line.' : 'These angles go all the way round a point.',
    question: `Find angle $${letter}$.`,
    diagram: kind === 'line' ? { type: 'straight-line', angles } : { type: 'around-point', angles },
    steps: [
      {
        id: 'rule',
        kind: 'choice',
        prompt: 'Which rule might help us here?',
        options: opts(rng, [
          kind === 'line' ? ok('a', 'Angles on a straight line add up to $180^\\circ$') : ok('b', 'Angles around a point add up to $360^\\circ$'),
          kind === 'line' ? no('b', 'Angles around a point add up to $360^\\circ$', 'Look again: the angles only cover one side of the line.') : no('a', 'Angles on a straight line add up to $180^\\circ$', 'These angles go all the way round, not just along one side.'),
          no('c', 'Angles in a triangle add up to $180^\\circ$', 'There isn’t a triangle here.'),
        ]),
        hints: ['Do the angles fill half a turn or a full turn?', kind === 'line' ? 'They sit along a straight line — half a turn.' : 'They go all the way round — a full turn.', kind === 'line' ? 'Half a turn is $180^\\circ$.' : 'A full turn is $360^\\circ$.'],
        explain: kind === 'line' ? 'Angles on a straight line add up to $180^\\circ$.' : 'Angles around a point add up to $360^\\circ$.',
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'answer',
        kind: 'number',
        prompt: `What is angle $${letter}$?`,
        label: `$${letter} =$`,
        answer: { value: ans, tol: 0 },
        unit: '°',
        display: `$${letter} = ${deg(ans)}$`,
        hints: [kind === 'line' ? 'The angles add to $180^\\circ$.' : 'The angles add to $360^\\circ$.', `Add the known angles, then subtract from $${total}^\\circ$.`, `$${total} - (${known.join(' + ')}) = ${total} - ${sumKnown}$`],
        explain: `$${letter} = ${deg(total)} - ${deg(sumKnown)} = ${deg(ans)}$`,
      },
    ],
    summary: `${kind === 'line' ? 'On a straight line' : 'Around a point'} the angles add to $${deg(total)}$. The known angles make $${deg(sumKnown)}$, so $${letter} = ${deg(ans)}$.`,
    answer: `$${letter} = ${deg(ans)}$`,
  };
}

export const angleFacts: LessonDef = {
  id: 'angle-facts',
  topic: 'angles',
  title: 'Lines, points and parallel lines',
  blurb: 'Straight lines, full turns, and F, Z and C angles.',
  objective: 'use angles on a straight line, around a point and with parallel lines',
  intro: [
    { pose: 'waving', text: 'These angle facts help with every polygon question. **Angles on a straight line** add up to $180^\\circ$.', diagram: { type: 'straight-line', angles: [{ value: 115, label: deg(115) }, { value: 65, label: deg(65) }] } },
    { pose: 'explaining', text: '**Angles around a point** add up to $360^\\circ$ — one full turn.', diagram: { type: 'around-point', angles: [{ value: 100, label: deg(100) }, { value: 140, label: deg(140) }, { value: 120, label: deg(120) }] } },
    { pose: 'explaining', text: 'When a line crosses two **parallel** lines: corresponding angles (F) are equal, alternate angles (Z) are equal, and co-interior angles (C) add up to $180^\\circ$.', diagram: { type: 'parallel', slope: 60, given: { pos: 'top-tr', label: deg(60) }, unknown: { pos: 'bot-tr', label: deg(60) } } },
  ],
  guided: () => lineOrPointProblem(() => 0.3, 'line', [48, 67]),
  generate: (rng, d) => {
    const r = rng();
    if (d === 0) return lineOrPointProblem(rng, r < 0.5 ? 'line' : 'point');
    if (r < 0.25) return lineOrPointProblem(rng, 'line');
    if (r < 0.45) return lineOrPointProblem(rng, 'point');
    return parallelProblem(rng);
  },
  inExam: true,
  guide: {
    rule: 'Straight line $180^\\circ$; around a point $360^\\circ$; corresponding and alternate angles equal; co-interior angles add to $180^\\circ$',
    explanation: 'Look for the shape the two angles make: F (corresponding), Z (alternate), C (co-interior) or X (vertically opposite).',
    mistake: 'Thinking co-interior angles are equal. They add up to $180^\\circ$.',
  },
};

export const ANGLE_LESSONS = [interiorSum, regularInterior, exterior, irregular, parallelogram, angleFacts];
