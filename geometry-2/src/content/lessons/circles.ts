import * as M from '../../math/core';
import { piTol } from '../../math/validate';
import { no, ok, opts, pick, pid, randInt, type Rng } from '../helpers';
import type { Difficulty, LessonDef, NumberStep, Problem } from '../types';

const PI_NOTE = 'Give your answer to 2 decimal places, or in terms of $\\pi$.';
const f = (x: number) => M.fmt(x, 4);

/** Number step for an answer that is a multiple of π (plus an optional rational part). */
function piAnswer(id: string, prompt: string, e: M.PiExpr, unit: string, hints: string[], explain: string, label?: string): NumberStep {
  const v = M.piValue(e);
  return {
    id,
    kind: 'number',
    prompt: `${prompt} ${PI_NOTE}`,
    label,
    answer: { value: v, tol: piTol(v), allowExact: true, rounding: 'to 2 decimal places' },
    unit,
    keys: ['pi'],
    display: `$${M.piTex(e)} \\approx ${M.fixed(v, 2)}$ ${unit}`,
    hints,
    explain,
  };
}

/** A random radius: whole numbers, or simple decimals for stretch questions. */
function randomRadius(rng: Rng, d: Difficulty): number {
  // Always a whole number, so the diameter is even and the radius never a fraction.
  if (d === 0) return randInt(rng, 2, 10);
  if (d === 1) return randInt(rng, 2, 15);
  return randInt(rng, 8, 25);
}

// ───────────────────────── 1. Radius and diameter ─────────────────────────

function rdProblem(rng: Rng, given: 'radius' | 'diameter', value: number, context?: string): Problem {
  const r = given === 'radius' ? value : M.radiusFromDiameter(value);
  const d = M.diameterFromRadius(r);
  const want = given === 'radius' ? 'diameter' : 'radius';
  const ans = want === 'radius' ? r : d;
  return {
    id: pid('radius-diameter', rng),
    skill: 'radius-diameter',
    intro: context ?? `This circle’s ${given} is $${f(value)}$ cm. Let’s find its ${want}.`,
    question: `A circle has ${given} $${f(value)}$ cm. What is its ${want}?`,
    diagram: { type: 'circle', show: given, label: `${f(value)} cm` },
    steps: [
      {
        id: 'which',
        kind: 'choice',
        prompt: `Is the ${want} longer or shorter than the ${given}?`,
        options: opts(rng, [
          want === 'diameter' ? ok('l', 'Longer — twice as long') : ok('s', 'Shorter — half as long'),
          want === 'diameter' ? no('s', 'Shorter', 'The diameter goes all the way across, through the centre. The radius only goes halfway.') : no('l', 'Longer', 'The radius only goes from the centre to the edge — half of the way across.'),
          no('same', 'The same length', 'The diameter goes right across; the radius goes from the centre to the edge.'),
        ]),
        hints: ['The diameter passes through the centre, from edge to edge.', 'The radius goes from the centre to the edge.', 'Two radii make one diameter.'],
        explain: 'The diameter is twice the radius: $d = 2r$, and $r = d \\div 2$.',
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'answer',
        kind: 'number',
        prompt: `What is the ${want}?`,
        label: want === 'radius' ? '$r =$' : '$d =$',
        answer: { value: ans, tol: 0 },
        unit: 'cm',
        display: `$${f(ans)}$ cm`,
        hints: [want === 'radius' ? '$r = d \\div 2$' : '$d = 2r$', want === 'radius' ? 'Halve the diameter.' : 'Double the radius.', want === 'radius' ? `$${f(value)} \\div 2$` : `$2 \\times ${f(value)}$`],
        explain: want === 'radius' ? `$r = ${f(value)} \\div 2 = ${f(ans)}$ cm` : `$d = 2 \\times ${f(value)} = ${f(ans)}$ cm`,
        highlight: [want],
      },
    ],
    summary: `The diameter is twice the radius. Here $r = ${f(r)}$ cm and $d = ${f(d)}$ cm.`,
    answer: `${want} $= ${f(ans)}$ cm`,
  };
}

export const radiusDiameter: LessonDef = {
  id: 'radius-diameter',
  topic: 'circles',
  title: 'Radius and diameter',
  blurb: 'Half-way across, or all the way across.',
  objective: 'convert between the radius and diameter of a circle',
  intro: [
    { pose: 'waving', text: 'The **radius** $r$ goes from the centre to the edge. The **diameter** $d$ goes all the way across, through the centre.', diagram: { type: 'circle', show: 'both', label: '' } },
    { pose: 'explaining', text: 'A diameter is two radii end to end:', formula: 'd = 2r \\qquad r = d \\div 2' },
  ],
  guided: () => rdProblem(() => 0.5, 'diameter', 14, 'The worksheet garden has a diameter of $14$ cm. What is its radius?'),
  generate: (rng, d) => {
    const given = rng() < 0.5 ? 'radius' : 'diameter';
    const r = randomRadius(rng, d);
    return rdProblem(rng, given, given === 'radius' ? r : 2 * r);
  },
  inExam: true,
  guide: {
    rule: '$d = 2r$ and $r = d \\div 2$',
    explanation: 'The radius goes from the centre to the edge; the diameter goes across through the centre, so it’s twice as long.',
    mistake: 'Using the diameter in a formula that needs the radius (like $A = \\pi r^2$).',
  },
};

// ───────────────────────── 2 & 3. Circumference and area ─────────────────────────

function circleProblem(rng: Rng, what: 'circumference' | 'area', given: 'radius' | 'diameter', value: number, garden = false): Problem {
  const r = given === 'radius' ? value : M.radiusFromDiameter(value);
  const d = M.diameterFromRadius(r);
  const isC = what === 'circumference';
  const exact: M.PiExpr = isC ? { rational: 0, piCoeff: d } : { rational: 0, piCoeff: r * r };
  const v = isC ? M.circumference(r) : M.circleArea(r);
  if (Math.abs(v - M.piValue(exact)) > 1e-9) throw new Error('circle self-check failed');
  const noun = garden ? 'the garden' : 'the circle';
  const steps = [
    {
      id: 'rd',
      kind: 'choice' as const,
      prompt: `We’re told $${f(value)}$ cm. Is that the radius or the diameter?`,
      options: opts(rng, [
        given === 'diameter' ? ok('d', 'The diameter — it goes all the way across') : ok('r', 'The radius — centre to edge'),
        given === 'diameter' ? no('r', 'The radius', 'Read the question again: it says diameter, the distance right across.') : no('d', 'The diameter', 'Read the question again: it says radius, from the centre to the edge.'),
      ]),
      hints: ['Read the question carefully.', 'Look at the diagram: does the line go through the centre and right across?', `It’s the ${given}.`],
      explain: `$${f(value)}$ cm is the **${given}**.`,
      guidedOnly: true,
      pose: 'curious' as const,
      highlight: [given],
    },
    ...(given === 'diameter' || !isC
      ? [
          {
            id: 'radius',
            kind: 'number' as const,
            prompt: given === 'diameter' ? 'Find the radius first.' : 'What is the radius?',
            label: '$r =$',
            answer: { value: r, tol: 0 },
            unit: 'cm',
            display: `$r = ${f(r)}$ cm`,
            hints: ['The radius is half the diameter.', '$r = d \\div 2$', `$${f(d)} \\div 2$`],
            explain: given === 'diameter' ? `$r = ${f(d)} \\div 2 = ${f(r)}$ cm` : `$r = ${f(r)}$ cm`,
            guidedOnly: true,
            highlight: ['radius'],
          },
        ]
      : []),
    {
      id: 'formula',
      kind: 'choice' as const,
      prompt: isC ? 'Circumference is the distance **around** the circle. Which calculation do we need?' : 'Area is the space **inside** the circle. Which calculation do we need?',
      options: opts(
        rng,
        isC
          ? [
              ok('a', `$C = \\pi \\times ${f(d)}$`, `Yes — $C = \\pi d$ (the same as $2\\pi r$).`),
              no('b', `$C = \\pi \\times ${f(r)}^2$`, 'That’s $\\pi r^2$ — the **area** formula. Circumference is the distance round the edge.'),
              no('c', `$C = 2 \\times ${f(d)}$`, 'We need $\\pi$ for anything to do with circles.'),
              no('d', `$C = \\pi \\times ${f(r)}$`, `$\\pi \\times r$ is only half way round. Use $\\pi d$ or $2\\pi r$.`),
            ]
          : [
              ok('a', `$A = \\pi \\times ${f(r)}^2$`),
              no('b', `$A = \\pi \\times ${f(d)}^2$`, 'Careful — the area formula uses the **radius**, not the diameter.'),
              no('c', `$A = 2 \\times \\pi \\times ${f(r)}$`, 'That’s $2\\pi r$ — the **circumference**, the distance round the edge.'),
              no('d', `$A = \\pi \\times ${f(d)}$`, 'That’s the circumference. Area needs the radius squared.'),
            ],
      ),
      hints: isC ? ['Which formula measures the distance around?', '$C = \\pi d$ or $C = 2\\pi r$.', `Here $d = ${f(d)}$.`] : ['Which formula measures the space inside?', '$A = \\pi r^2$', `Here $r = ${f(r)}$.`],
      explain: isC ? `$C = \\pi d = \\pi \\times ${f(d)}$` : `$A = \\pi r^2 = \\pi \\times ${f(r)}^2$`,
      guidedOnly: true,
    },
    piAnswer(
      'answer',
      isC ? `Find the circumference of ${noun}.` : `Find the area of ${noun}.`,
      exact,
      isC ? 'cm' : 'cm²',
      isC ? ['$C = \\pi d$', `$C = \\pi \\times ${f(d)} = ${f(d)}\\pi$`, `$${f(d)} \\times 3.14159… \\approx\\;?$`] : ['$A = \\pi r^2$ — square the radius first.', `$${f(r)}^2 = ${f(r * r)}$`, `$A = ${f(r * r)}\\pi \\approx ${f(r * r)} \\times 3.14159…$`],
      isC ? `$C = \\pi \\times ${f(d)} = ${f(d)}\\pi \\approx ${M.fixed(v, 2)}$ cm` : `$A = \\pi \\times ${f(r)}^2 = ${f(r * r)}\\pi \\approx ${M.fixed(v, 2)}$ cm²`,
    ),
  ];
  return {
    id: pid(what, rng),
    skill: what,
    intro: garden ? `A circular garden has a diameter of $14$ cm. Let’s find its ${what}.` : `Let’s find the ${what} of this circle.`,
    question: `A circle has ${given} $${f(value)}$ cm. Find its ${what}.`,
    diagram: { type: 'circle', show: given, label: `${f(value)} cm`, caption: garden ? 'Circular garden' : undefined },
    steps,
    summary: isC
      ? `Circumference is the distance round the edge: $C = \\pi d = ${f(d)}\\pi \\approx ${M.fixed(v, 2)}$ cm.`
      : `Area is the space inside: $A = \\pi r^2 = \\pi \\times ${f(r)}^2 = ${f(r * r)}\\pi \\approx ${M.fixed(v, 2)}$ cm². Area units are **squared**.`,
    answer: `$${M.piTex(exact)} \\approx ${M.fixed(v, 2)}$ ${isC ? 'cm' : 'cm²'}`,
  };
}

export const circumferenceLesson: LessonDef = {
  id: 'circumference',
  topic: 'circles',
  title: 'Circumference',
  blurb: 'The distance all the way round.',
  objective: 'calculate the circumference of a circle from its radius or diameter',
  prereq: ['radius-diameter'],
  intro: [
    { pose: 'explaining', text: 'The **circumference** is the distance all the way round a circle. Measure any circle and you’ll find it’s just over 3 times the diameter. That number is $\\pi \\approx 3.14159$.', diagram: { type: 'circle', show: 'diameter', label: 'd' }, formula: 'C = \\pi d = 2\\pi r' },
    { pose: 'thinking', text: 'You can leave an answer “in terms of $\\pi$” (like $14\\pi$), which is exact, or use a calculator for a decimal like $43.98$.' },
  ],
  guided: () => circleProblem(() => 0.5, 'circumference', 'diameter', 14, true),
  generate: (rng, d) => {
    const given = rng() < 0.5 ? 'radius' : 'diameter';
    const r = randomRadius(rng, d);
    return circleProblem(rng, 'circumference', given, given === 'radius' ? r : 2 * r);
  },
  inExam: true,
  guide: {
    rule: '$C = \\pi d = 2\\pi r$',
    explanation: 'Circumference is the distance around the circle — a length, measured in cm (not cm²).',
    mistake: 'Using $\\pi r^2$ (that’s the area) or multiplying the radius by $\\pi$ without doubling.',
  },
};

export const areaLesson: LessonDef = {
  id: 'area',
  topic: 'circles',
  title: 'Area of a circle',
  blurb: 'The space inside: π r².',
  objective: 'calculate the area of a circle',
  prereq: ['radius-diameter'],
  intro: [
    { pose: 'explaining', text: 'The **area** is the space inside the circle. Square the radius, then multiply by $\\pi$.', diagram: { type: 'circle', show: 'radius', label: 'r' }, formula: 'A = \\pi r^2' },
    { pose: 'thinking', text: 'Watch out: if you’re given the diameter, halve it first. And area is measured in **square** units, like cm².' },
  ],
  guided: () => circleProblem(() => 0.5, 'area', 'diameter', 14, true),
  generate: (rng, d) => {
    const given = rng() < 0.5 ? 'radius' : 'diameter';
    const r = randomRadius(rng, d);
    return circleProblem(rng, 'area', given, given === 'radius' ? r : 2 * r);
  },
  inExam: true,
  guide: {
    rule: '$A = \\pi r^2$',
    explanation: 'Square the radius, then multiply by $\\pi$. If you’re given the diameter, halve it first.',
    mistake: 'Squaring the diameter instead of the radius — that gives an answer 4 times too big.',
  },
};

// ───────────────────────── 4. Compound shape: rectangle + semicircle ─────────────────────────

function compoundProblem(rng: Rng, w: number, h: number, guided = false): Problem {
  const c = M.compoundRectSemicircle(w, h);
  const unit = 'cm';
  const sq = 'cm²';
  if (Math.abs(c.total - (c.rect + c.semi)) > 1e-9 || Math.abs(c.semi * 2 - c.fullCircle) > 1e-9) throw new Error('compound self-check failed');
  return {
    id: pid('compound', rng),
    skill: 'compound',
    intro: guided ? 'This shape is made from simpler shapes. Let’s break it down together, one step at a time.' : 'Another compound shape! Break it into parts you know.',
    question: `Calculate the area of the compound shape: a rectangle $${f(w)}$ ${unit} wide and $${f(h)}$ ${unit} tall, with a semicircle on top.`,
    diagram: { type: 'compound', w, h, unit },
    steps: [
      {
        id: 'shapes',
        kind: 'multi',
        prompt: 'What shapes can you see in this picture? Select all that apply.',
        options: [
          { ...ok('rect', 'A rectangle'), highlight: 'rect' },
          { ...ok('semi', 'A semicircle'), highlight: 'semi' },
          no('circle', 'A full circle', 'Look closely at the top: only **half** a circle is there. Half a circle is a semicircle.', 'semi'),
          no('tri', 'A triangle', 'There are no triangles here — the top is curved.'),
        ],
        hints: ['Look at the bottom part and the top part separately.', 'The bottom has four straight sides and square corners. The top is curved.', 'The top is half of a circle.'],
        explain: 'It’s a **rectangle** with a **semicircle** (half a circle) on top.',
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'measures',
        kind: 'multi',
        prompt: 'Great. What measurements do we know? Select every one you can find on the diagram.',
        options: [
          { ...ok('width', `Rectangle width ($${f(w)}$ ${unit})`), highlight: 'width' },
          { ...ok('height', `Rectangle height ($${f(h)}$ ${unit})`), highlight: 'height' },
          { ...ok('diameter', `Semicircle diameter ($${f(w)}$ ${unit})`), highlight: 'diameter' },
        ],
        hints: ['Look at the labels on the diagram.', 'The bottom edge and the side edge are both labelled.', 'The semicircle sits exactly on the top of the rectangle — so its diameter is the same as the width.'],
        explain: `Width $${f(w)}$, height $${f(h)}$, and the semicircle’s diameter is the same as the width: $${f(w)}$ ${unit}.`,
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'formulas',
        kind: 'multi',
        prompt: 'Which formulas do we need to calculate the area of each part? Select all that apply.',
        options: [
          ok('rect', 'Area of a rectangle: $A = l \\times w$'),
          ok('semi', 'Area of a semicircle: $A = \\pi r^2 \\div 2$'),
          no('circle', 'Area of a circle: $A = \\pi r^2$', 'That’s for a **whole** circle. We only have half of one.'),
          no('tri', 'Area of a triangle: $A = \\frac{1}{2} b h$', 'There’s no triangle in this shape.'),
          no('circ', 'Circumference: $C = \\pi d$', 'Circumference measures the distance **around** a circle. This question asks for **area**, the space inside.'),
        ],
        hints: ['We need one formula for each part.', 'One part is a rectangle; the other is half a circle.', 'Rectangle area, and half of a circle’s area.'],
        explain: 'Rectangle: $A = l \\times w$. Semicircle: half of $\\pi r^2$.',
        guidedOnly: true,
      },
      {
        id: 'radius-how',
        kind: 'choice',
        prompt: `The diameter is $${f(w)}$ ${unit}. How do we find the radius?`,
        options: opts(rng, [
          ok('div', 'Divide by 2'),
          no('mul', 'Multiply by 2', 'That would make it bigger. The radius only goes from the centre to the edge — it’s shorter.'),
          no('sub', 'Subtract 2', 'The radius is a fraction of the diameter, not 2 less.'),
          no('sq', 'Square the diameter', 'Squaring comes later, in the area formula. First, how does the radius compare with the diameter?'),
        ]),
        hints: ['The radius goes from the centre to the edge.', 'Two radii make one diameter.', 'So the radius is half the diameter.'],
        explain: 'The radius is half the diameter: $r = d \\div 2$.',
        guidedOnly: true,
        highlight: ['diameter', 'radius'],
      },
      {
        id: 'radius',
        kind: 'number',
        prompt: 'What is the radius?',
        label: '$r =$',
        answer: { value: c.r, tol: 0 },
        unit,
        display: `$r = ${f(c.r)}$ ${unit}`,
        hints: ['$r = d \\div 2$', `The diameter is $${f(w)}$.`, `$${f(w)} \\div 2$`],
        explain: `$r = ${f(w)} \\div 2 = ${f(c.r)}$ ${unit}`,
        highlight: ['radius'],
      },
      {
        id: 'rect-formula',
        kind: 'choice',
        prompt: 'Now the rectangle. Which formula gives its area?',
        options: opts(rng, [ok('lw', '$A = l \\times w$'), no('per', '$A = 2(l + w)$', 'That’s the **perimeter** — the distance round the outside.'), no('sum', '$A = l + w$', 'Area needs us to multiply, not add.'), no('half', '$A = \\frac{1}{2} l w$', 'Halving is for triangles.')]),
        hints: ['Area means how many squares fit inside.', 'Rows times columns.', 'Length times width.'],
        explain: 'Area of a rectangle $= l \\times w$.',
        guidedOnly: true,
        highlight: ['rect'],
      },
      {
        id: 'rect',
        kind: 'number',
        prompt: 'Work out the area of the rectangle.',
        answer: { value: c.rect, tol: 0 },
        unit: sq,
        display: `$${f(w)} \\times ${f(h)} = ${f(c.rect)}$ ${sq}`,
        hints: ['$A = l \\times w$', `The rectangle is $${f(w)}$ by $${f(h)}$.`, `$${f(w)} \\times ${f(h)}$`],
        explain: `$A = ${f(w)} \\times ${f(h)} = ${f(c.rect)}$ ${sq}`,
        highlight: ['rect'],
      },
      piAnswer(
        'semi',
        'A semicircle is half of a full circle. Work out the area of the semicircle.',
        c.semiExact,
        sq,
        ['Full circle: $A = \\pi r^2$. A semicircle is half of that.', `$r = ${f(c.r)}$, so the full circle is $\\pi \\times ${f(c.r)}^2 = ${f(c.r * c.r)}\\pi$.`, `Half of $${f(c.r * c.r)}\\pi$ is $${f(c.semiExact.piCoeff)}\\pi$.`],
        `Full circle $\\pi \\times ${f(c.r)}^2 = ${f(c.r * c.r)}\\pi$. Half of it: $${f(c.semiExact.piCoeff)}\\pi \\approx ${M.fixed(c.semi, 2)}$ ${sq}`,
      ),
      {
        id: 'combine',
        kind: 'choice',
        prompt: 'Now we know the area of the rectangle and the semicircle. What should we do to find the total area?',
        options: opts(rng, [
          ok('add', 'Add the two areas'),
          no('sub', 'Subtract the two areas', 'Subtracting is for a shape with a piece cut **out**. Here both parts belong to the shape.'),
          no('mul', 'Multiply the two areas', 'Multiplying two areas doesn’t give an area. Think about putting the two parts together.'),
          no('div', 'Divide the rectangle area by the semicircle area', 'That tells us how many times bigger one part is — not the total.'),
        ]),
        hints: ['Both parts are inside the shape.', 'The total is the parts put together.', 'Put together means add.'],
        explain: 'Both parts belong to the shape, so we **add** them.',
        guidedOnly: true,
        highlight: ['rect', 'semi'],
      },
      piAnswer(
        'total',
        'What is the total area of the compound shape?',
        c.totalExact,
        sq,
        ['Total = rectangle + semicircle.', `$${f(c.rect)} + ${f(c.semiExact.piCoeff)}\\pi$`, `$${f(c.rect)} + ${M.fixed(c.semi, 2)}$`],
        `Total $= ${f(c.rect)} + ${f(c.semiExact.piCoeff)}\\pi \\approx ${f(c.rect)} + ${M.fixed(c.semi, 2)} = ${M.fixed(c.total, 2)}$ ${sq}`,
      ),
    ],
    summary: `We found the area of the rectangle: $${f(c.rect)}$ ${sq}. Then we found the area of half a circle: $${f(c.semiExact.piCoeff)}\\pi \\approx ${M.fixed(c.semi, 2)}$ ${sq}. Finally, we added the two areas because both parts belong to the compound shape: $${M.piTex(c.totalExact)} \\approx ${M.fixed(c.total, 2)}$ ${sq}.\n\nThe dashed line where the two parts join is inside the shape — it isn’t part of the outside edge, and it doesn’t add anything to the area.`,
    answer: `$${M.piTex(c.totalExact)} \\approx ${M.fixed(c.total, 2)}$ ${sq}`,
  };
}

export const compound: LessonDef = {
  id: 'compound',
  topic: 'circles',
  title: 'Compound shapes',
  blurb: 'A rectangle topped with a semicircle.',
  objective: 'find the area of a shape made from a rectangle and a semicircle',
  prereq: ['area', 'radius-diameter'],
  intro: [
    { pose: 'waving', text: 'A **compound shape** is made by joining simpler shapes. This one is a rectangle with a semicircle sitting on top.', diagram: { type: 'compound', w: 8, h: 6, unit: 'cm' } },
    { pose: 'explaining', text: 'The plan: **split** it into parts, find the area of **each** part, then **add** them. A semicircle’s area is half a circle’s:', formula: 'A_{\\text{semicircle}} = \\dfrac{\\pi r^2}{2}' },
    { pose: 'curious', text: 'This is the worksheet shape (the worksheet uses inches; we’ll use centimetres — the maths is identical). I’ll guide you, but you do the thinking!' },
  ],
  guided: () => compoundProblem(() => 0.5, 8, 6, true),
  generate: (rng, d) => {
    // Even width, so the radius is a whole number; whole-number height.
    const w = d === 0 ? pick(rng, [4, 6, 8, 10]) : d === 1 ? 2 * randInt(rng, 2, 9) : 2 * randInt(rng, 5, 12);
    const h = d === 0 ? randInt(rng, 3, 10) : randInt(rng, 3, 15);
    return compoundProblem(rng, w, h);
  },
  inExam: true,
  guide: {
    rule: 'Total area $=$ rectangle $(l \\times w)$ $+$ semicircle $(\\pi r^2 \\div 2)$',
    explanation: 'Split the shape into familiar parts, find each area, then add. The semicircle’s diameter is the rectangle’s width, so $r = w \\div 2$.',
    mistake: 'Using the whole circle’s area, or using the diameter instead of the radius in $\\pi r^2$.',
  },
};

export const CIRCLE_LESSONS = [radiusDiameter, circumferenceLesson, areaLesson, compound];
