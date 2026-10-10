import * as M from '../../math/core';
import { ALL_PLANES, SYMMETRY_PLANES, TRICK_PLANES, isSymmetryPlane, planeById } from '../../math/cube';
import { no, ok, opts, pick, pid, randInt, type Rng } from '../helpers';
import type { Difficulty, LessonDef, Problem, Step } from '../types';

const fmtCm = (x: number) => M.fmt(x, 1);

// ───────────────────────── Constructing a triangle (SSS) ─────────────────────────

/** Three integer sides 4–11 cm that make a clear triangle (no near-flat ones). */
export function randomTriangle(rng: Rng): [number, number, number] {
  for (let i = 0; i < 1000; i++) {
    const s = [randInt(rng, 4, 11), randInt(rng, 4, 11), randInt(rng, 4, 11)].sort((a, b) => a - b);
    // Strictly valid, and the apex angle isn't too flat for a compass drawing.
    if (M.isValidTriangle(s[0], s[1], s[2]) && s[0] + s[1] >= s[2] + 2 && !(s[0] === s[1] && s[1] === s[2])) return [s[0], s[1], s[2]];
  }
  return [5, 8, 9];
}

function inequalityStep(rng: Rng): Step {
  const valid = rng() < 0.5;
  let a: number;
  let b: number;
  let c: number;
  if (valid) [a, b, c] = randomTriangle(rng);
  else {
    a = randInt(rng, 2, 5);
    b = randInt(rng, 2, 5);
    c = a + b + randInt(rng, 0, 3); // a + b ≤ c: impossible
  }
  if (M.isValidTriangle(a, b, c) !== valid) throw new Error('triangle inequality self-check failed');
  return {
    id: 'inequality',
    kind: 'choice',
    prompt: `Could you construct a triangle with sides $${a}$ cm, $${b}$ cm and $${c}$ cm?`,
    options: opts(rng, [
      valid ? ok('yes', `Yes — $${a} + ${b} > ${c}$`) : no('yes', 'Yes', `Try it: the two short arcs, $${a}$ cm and $${b}$ cm, together only reach $${a + b}$ cm — not far enough to meet across a $${c}$ cm base.`),
      valid ? no('no', 'No', `Check: $${a} + ${b} = ${a + b}$, which is longer than $${c}$, so the arcs do meet.`) : ok('no', `No — $${a} + ${b}$ is not more than $${c}$`),
    ]),
    hints: ['The two shorter sides must stretch far enough to meet.', 'Add the two shorter sides and compare with the longest.', `$${a} + ${b} = ${a + b}$. Is that more than $${c}$?`],
    explain: valid
      ? `$${a} + ${b} = ${a + b} > ${c}$, so the two arcs cross and the triangle exists.`
      : `$${a} + ${b} = ${a + b}$, which is not more than $${c}$. The arcs never cross, so no triangle can be made.`,
  };
}

function constructTriangleProblem(rng: Rng, sides: [number, number, number], guided = false): Problem {
  const [s1, s2, base] = sides; // base is the longest
  // Randomly decide which end gets which arc.
  const left = guided ? s1 : rng() < 0.5 ? s1 : s2;
  const right = left === s1 ? s2 : s1;
  return {
    id: pid('construct-triangle', rng),
    skill: 'construct-triangle',
    intro: guided ? 'Let’s construct the worksheet triangle: sides 5 cm, 8 cm and 9 cm. You’ll use a ruler and compasses.' : `Time to construct a triangle with sides ${sides.join(' cm, ')} cm.`,
    question: `Make an accurate drawing of a triangle with sides $${s1}$ cm, $${s2}$ cm and $${base}$ cm.`,
    steps: [
      {
        id: 'construct',
        kind: 'widget',
        widget: { type: 'construct-triangle', base, left, right },
        prompt: 'Follow the steps on the drawing board.',
        hints: ['Start with the longest side as the base.', 'Each arc shows every point that’s the right distance from one end.', 'Where the two arcs cross is exactly the right distance from both ends.'],
        explain: `Base $${base}$ cm; arcs of radius $${left}$ cm and $${right}$ cm from the two ends cross at the third corner.`,
      },
      inequalityStep(rng),
    ],
    summary: `We drew the $${base}$ cm base, then compass arcs of $${left}$ cm and $${right}$ cm from its ends. The arcs cross at the only point that is the right distance from both ends — the third corner. Joining up gives the triangle.`,
    answer: `Triangle with sides $${s1}$, $${s2}$ and $${base}$ cm`,
  };
}

export const constructTriangle: LessonDef = {
  id: 'construct-triangle',
  topic: 'constructions',
  title: 'Constructing a triangle',
  blurb: 'Ruler and compasses: a triangle from its three sides.',
  objective: 'construct a triangle accurately from three side lengths',
  intro: [
    { pose: 'waving', text: 'To **construct** a shape means to draw it accurately with a ruler and a pair of compasses — no guessing angles!', diagram: { type: 'triangle-sides', base: 9, left: 5, right: 8, unit: 'cm' } },
    { pose: 'explaining', text: 'The secret: a compass arc of radius $5$ cm shows **every** point that is exactly $5$ cm from its centre. Draw one arc from each end of the base, and where they cross is exactly the right distance from both ends.' },
    { pose: 'explaining', text: 'The steps: **1** draw the base, **2** arc from one end, **3** arc from the other end, **4** mark where they cross, **5** join up, **6** label the sides.' },
    { pose: 'thinking', text: 'One check before you start: the two shorter sides must add up to **more** than the longest side, or the arcs can never meet.', formula: 'a + b > c' },
  ],
  guided: () => constructTriangleProblem(() => 0.3, [5, 8, 9], true),
  generate: (rng) => constructTriangleProblem(rng, randomTriangle(rng)),
  practiceCount: 2,
  masteryCount: 2,
  inExam: false,
  guide: {
    rule: 'Base first, then arcs from each end with the other two lengths. A triangle exists only if the two shorter sides add to more than the longest.',
    explanation: 'An arc of radius $r$ marks every point $r$ cm from its centre, so the crossing point of two arcs is the right distance from both ends of the base.',
    mistake: 'Changing the compass width while drawing an arc, or measuring the arc from the wrong end.',
  },
};

// ───────────────────────── Perpendicular bisector ─────────────────────────

function bisectorProblem(rng: Rng, length: number, guided = false): Problem {
  const half = length / 2;
  return {
    id: pid('perp-bisector', rng),
    skill: 'perp-bisector',
    intro: guided ? 'Now let’s draw the perpendicular bisector of the longest side, $9$ cm.' : `Let’s bisect a line segment $${fmtCm(length)}$ cm long.`,
    question: `Draw the perpendicular bisector of a line segment $AB = ${fmtCm(length)}$ cm.`,
    steps: [
      {
        id: 'bisect',
        kind: 'widget',
        widget: { type: 'perp-bisector', length },
        prompt: 'Follow the steps on the drawing board.',
        hints: ['Use the same compass width from both ends.', `The width must be more than half of $${fmtCm(length)}$ cm, so the arcs meet.`, 'Join the two points where the arcs cross.'],
        explain: 'Equal arcs from $A$ and $B$ cross at two points that are the same distance from $A$ as from $B$. The line through them is the perpendicular bisector.',
      },
      {
        id: 'midpoint',
        kind: 'number',
        prompt: `The bisector crosses $AB$ at $M$. How long is $AM$?`,
        label: '$AM =$',
        answer: { value: half, tol: 0.01 },
        unit: 'cm',
        display: `$${fmtCm(half)}$ cm`,
        hints: ['“Bisect” means cut into two equal parts.', '$M$ is the midpoint of $AB$.', `$${fmtCm(length)} \\div 2$`],
        explain: `$M$ is the midpoint, so $AM = MB = ${fmtCm(length)} \\div 2 = ${fmtCm(half)}$ cm.`,
        highlight: ['halves'],
      },
      {
        id: 'angle',
        kind: 'number',
        prompt: 'What angle does the bisector make with $AB$?',
        answer: { value: 90, tol: 0 },
        unit: '°',
        display: '$90^\\circ$',
        hints: ['“Perpendicular” is a special word about angles.', 'Perpendicular lines meet at a right angle.', 'A right angle is … degrees.'],
        explain: 'Perpendicular means at right angles: $90^\\circ$.',
        highlight: ['right-angle'],
      },
    ],
    summary: `The perpendicular bisector passes through the midpoint $M$ (so $AM = MB = ${fmtCm(half)}$ cm) and meets $AB$ at $90^\\circ$. Every point on it is the same distance from $A$ as from $B$.`,
    answer: `Through the midpoint, at $90^\\circ$; $AM = MB = ${fmtCm(half)}$ cm`,
  };
}

export const perpBisector: LessonDef = {
  id: 'perp-bisector',
  topic: 'constructions',
  title: 'Perpendicular bisector',
  blurb: 'Cut a line exactly in half, at a right angle.',
  objective: 'construct the perpendicular bisector of a line segment',
  prereq: ['construct-triangle'],
  intro: [
    { pose: 'waving', text: 'A **perpendicular bisector** cuts a line segment into two **equal** halves (that’s “bisect”) and crosses it at a **right angle** (that’s “perpendicular”).' },
    { pose: 'explaining', text: 'Open your compasses to **more than half** the length. Draw arcs above and below the line from $A$, then — without changing the width — from $B$. Join the two crossing points.' },
    { pose: 'thinking', text: 'Why does it work? Both crossing points are the same distance from $A$ as from $B$. Every point on the line through them shares that property.' },
  ],
  guided: () => bisectorProblem(() => 0.5, 9, true),
  // Whole-number lengths; warm-ups are even so the halves are whole too.
  generate: (rng, d: Difficulty) => bisectorProblem(rng, d === 0 ? pick(rng, [6, 8, 10]) : randInt(rng, 6, 12)),
  practiceCount: 2,
  masteryCount: 2,
  inExam: false,
  guide: {
    rule: 'Equal arcs (radius more than half of $AB$) from both ends; join the two crossing points.',
    explanation: 'The bisector goes through the midpoint and meets the segment at $90^\\circ$.',
    mistake: 'Opening the compasses to less than half the segment — then the arcs never cross.',
  },
};

// ───────────────────────── Cube dimensions ─────────────────────────

function cubeProblem(rng: Rng, size: number, d: Difficulty, guided = false): Problem {
  const steps: Step[] = [
    {
      id: 'faces',
      kind: 'number',
      prompt: 'How many faces does a cube have?',
      answer: { value: 6, tol: 0 },
      display: '$6$ faces',
      hints: ['A face is a flat surface.', 'Think of a dice: count its sides.', 'Top, bottom, front, back, left, right.'],
      explain: 'A cube has $6$ square faces: top, bottom, front, back, left and right.',
      pose: 'curious',
    },
    {
      id: 'shape',
      kind: 'choice',
      prompt: 'What shape is each face?',
      options: opts(rng, [ok('sq', 'A square'), no('rect', 'A rectangle that isn’t square', 'All the edges of a cube are equal, so each face has four equal sides.'), no('tri', 'A triangle', 'Each face has four edges, not three.')]),
      hints: ['Look at one face. How many edges does it have?', 'Are those edges all the same length?', 'Four equal sides and four right angles.'],
      explain: 'Every face is a **square**: four equal edges and four right angles.',
      guidedOnly: !guided,
    },
    {
      id: 'edges',
      kind: 'number',
      prompt: 'How many edges does a cube have?',
      answer: { value: 12, tol: 0 },
      display: '$12$ edges',
      hints: ['An edge is where two faces meet.', 'Count the top square, the bottom square, then the uprights.', '$4 + 4 + 4$'],
      explain: '$4$ edges round the top, $4$ round the bottom and $4$ upright: $12$ edges.',
      highlight: ['edges'],
    },
    {
      id: 'length',
      kind: 'number',
      prompt: 'One edge is marked. How long is the edge marked $x$?',
      label: '$x =$',
      answer: { value: size, tol: 0 },
      unit: 'cm',
      display: `$${size}$ cm`,
      hints: ['What’s special about the edges of a cube?', 'All the edges of a cube are the same length.', `So $x$ is the same as the marked edge.`],
      explain: `All edges of a cube are equal, so $x = ${size}$ cm.`,
    },
  ];
  if (d >= 1 && !guided) {
    steps.push({
      id: 'area',
      kind: 'number',
      prompt: 'What is the area of one face?',
      answer: { value: size * size, tol: 0 },
      unit: 'cm²',
      display: `$${size * size}$ cm²`,
      hints: ['Each face is a square.', 'Area of a square $=$ side $\\times$ side.', `$${size} \\times ${size}$`],
      explain: `$${size} \\times ${size} = ${size * size}$ cm²`,
    });
  }
  if (d === 2 && !guided) {
    steps.push({
      id: 'total-edge',
      kind: 'number',
      prompt: 'What is the total length of all the edges?',
      answer: { value: 12 * size, tol: 0 },
      unit: 'cm',
      display: `$${12 * size}$ cm`,
      hints: ['How many edges are there?', 'Every edge is the same length.', `$12 \\times ${size}$`],
      explain: `$12 \\times ${size} = ${12 * size}$ cm`,
    });
  }
  return {
    id: pid('cube-dimensions', rng),
    skill: 'cube-dimensions',
    intro: guided ? 'Here’s a sketch of a cube with sides of $5$ cm. Let’s inspect it.' : `Here’s a cube with edges of $${size}$ cm.`,
    question: `A cube has edges of $${size}$ cm. Answer questions about its faces and edges.`,
    diagram: { type: 'cube', size: String(size), unit: 'cm', marks: 'one' },
    steps,
    summary: `A cube has $6$ square faces, $12$ equal edges (here $${size}$ cm each) and $8$ corners, and every corner of every face is a right angle.`,
    answer: `$6$ faces, $12$ edges of $${size}$ cm`,
  };
}

export const cubeDimensions: LessonDef = {
  id: 'cube-dimensions',
  topic: 'constructions',
  title: 'Cube dimensions',
  blurb: 'Faces, edges and corners of a cube.',
  objective: 'sketch a cube and describe its faces, edges and lengths',
  intro: [
    { pose: 'waving', text: 'A **cube** is a 3D shape with $6$ square faces. All $12$ edges are the same length.', diagram: { type: 'cube', size: '5', unit: 'cm', marks: 'all' } },
    { pose: 'explaining', text: 'To sketch one: draw a square, draw a second square shifted up and across, then join the matching corners. Dashed lines show hidden edges.', diagram: { type: 'cube', size: '5', unit: 'cm', marks: 'three' } },
  ],
  guided: () => cubeProblem(() => 0.4, 5, 1, true),
  generate: (rng, d) => cubeProblem(rng, randInt(rng, 2, 12), d),
  inExam: true,
  guide: {
    rule: 'A cube has 6 square faces, 12 equal edges and 8 vertices',
    explanation: 'Every face is a square, every edge is the same length and every corner of a face is a right angle.',
    mistake: 'Counting only the edges you can see in a sketch — remember the hidden ones.',
  },
};

// ───────────────────────── Planes of symmetry ─────────────────────────

function predictProblem(rng: Rng, planeId: string): Problem {
  const plane = planeById(planeId)!;
  const isSym = isSymmetryPlane(plane);
  if (isSym !== (plane.family !== 'not')) throw new Error(`cube plane ${planeId} classified wrongly`);
  return {
    id: pid('cube-symmetry', rng),
    skill: 'cube-symmetry',
    intro: 'Here’s a cube with a cut through it. Turn it round to look from different sides.',
    question: 'Is the shaded plane a plane of symmetry of the cube?',
    diagram: { type: 'cube3d', plane: planeId },
    steps: [
      {
        id: 'predict',
        kind: 'choice',
        prompt: 'Predict: is the shaded plane a plane of symmetry?',
        options: [
          isSym ? ok('yes', 'Yes — the two halves are mirror images') : no('yes', 'Yes', plane.why),
          isSym ? no('no', 'No', plane.why) : ok('no', 'No — the halves aren’t mirror images'),
        ],
        hints: ['Imagine the plane is a mirror. Would one half reflect exactly onto the other?', 'Are the two pieces the same size and shape? Is every corner reflected onto a corner?', 'Planes of symmetry go through the very centre and line up with the faces or with opposite edges.'],
        explain: plane.why,
        pose: 'curious',
      },
    ],
    summary: `${isSym ? 'Yes' : 'No'}: ${plane.why} A cube has $9$ planes of symmetry: $3$ halfway between opposite faces and $6$ through opposite edges.`,
    answer: isSym ? 'Yes, a plane of symmetry' : 'Not a plane of symmetry',
  };
}

function countProblem(rng: Rng, guided = false): Problem {
  return {
    id: pid('cube-symmetry', rng),
    skill: 'cube-symmetry',
    intro: guided ? 'How many planes of symmetry does a cube have? Let’s count them in two groups.' : 'Let’s count the planes of symmetry of a cube.',
    question: 'How many planes of symmetry does a cube have?',
    diagram: { type: 'cube3d' },
    steps: [
      {
        id: 'meaning',
        kind: 'choice',
        prompt: 'First: what is a **plane** of symmetry?',
        options: opts(rng, [
          ok('a', 'A flat cut that splits a solid into two mirror-image halves'),
          no('b', 'A line that splits a flat shape into two mirror-image halves', 'That’s a **line** of symmetry, for 2D shapes. For a solid we need a flat surface — a plane.'),
          no('c', 'Any cut through the middle of a solid', 'Not any cut — the two halves must be mirror images.'),
        ]),
        hints: ['A plane is a flat surface, like a sheet of glass.', 'Imagine the plane is a mirror.', 'One half must reflect exactly onto the other.'],
        explain: 'A plane of symmetry is a flat surface that cuts a 3D shape into two halves that are mirror images.',
        guidedOnly: true,
      },
      {
        id: 'face-planes',
        kind: 'number',
        prompt: 'How many planes cut halfway between a pair of opposite faces? (The cube shows them.)',
        answer: { value: 3, tol: 0 },
        display: '$3$',
        hints: ['A cube has 3 pairs of opposite faces.', 'Top/bottom, front/back, left/right.', 'One plane for each pair.'],
        explain: 'One for each pair of opposite faces: top/bottom, front/back and left/right — $3$ planes.',
        highlight: ['face-planes'],
        guidedOnly: true,
      },
      {
        id: 'edge-planes',
        kind: 'number',
        prompt: 'How many diagonal planes pass through a pair of opposite edges?',
        answer: { value: 6, tol: 0 },
        display: '$6$',
        hints: ['A cube has 12 edges.', 'Each diagonal plane contains 2 opposite edges.', '$12 \\div 2$'],
        explain: 'There are $12$ edges in $6$ opposite pairs, giving $6$ diagonal planes.',
        highlight: ['edge-planes'],
        guidedOnly: true,
      },
      {
        id: 'total',
        kind: 'number',
        prompt: 'So how many planes of symmetry does a cube have altogether?',
        answer: { value: 9, tol: 0 },
        display: '$9$ planes',
        hints: ['There are two kinds of plane.', 'Some go between opposite faces, some through opposite edges.', '$3 + 6$'],
        explain: '$3 + 6 = 9$ planes of symmetry.',
      },
    ],
    summary: 'A cube has $9$ planes of symmetry: $3$ halfway between opposite faces and $6$ diagonal planes through opposite edges. Remember: planes for solids, lines for flat shapes.',
    answer: '$9$ planes of symmetry',
  };
}

export const cubeSymmetry: LessonDef = {
  id: 'cube-symmetry',
  topic: 'constructions',
  title: 'Planes of symmetry',
  blurb: 'Mirror planes of a cube — there are nine!',
  objective: 'identify the planes of symmetry of a cube',
  prereq: ['cube-dimensions'],
  intro: [
    { pose: 'waving', text: 'A flat shape has **lines** of symmetry. A solid has **planes** of symmetry: flat cuts where each half is the mirror image of the other.' },
    { pose: 'explaining', text: 'Explore the cube: use the arrows to step through its planes, and drag (or use the turn buttons) to rotate it.', diagram: { type: 'cube3d', explore: true } },
    { pose: 'thinking', text: 'Some cuts look symmetrical but aren’t. A plane of symmetry must go through the centre, and reflecting any corner must land on another corner.' },
  ],
  guided: () => countProblem(() => 0.5, true),
  generate: (rng, d) => {
    if (d === 2 && rng() < 0.35) {
      return countProblem(rng);
    }
    const useSym = rng() < 0.5;
    const plane = pick(rng, useSym ? SYMMETRY_PLANES : d === 0 ? TRICK_PLANES.filter((p) => p.id !== 'hex' && p.id !== 'tilt') : TRICK_PLANES);
    return predictProblem(rng, plane.id);
  },
  inExam: true,
  guide: {
    rule: 'A cube has 9 planes of symmetry',
    explanation: '3 planes halfway between pairs of opposite faces, and 6 diagonal planes each containing a pair of opposite edges.',
    mistake: 'Confusing planes (3D) with lines (2D) of symmetry, or forgetting the 6 diagonal planes.',
  },
};

export const CONSTRUCTION_LESSONS = [constructTriangle, perpBisector, cubeDimensions, cubeSymmetry];
// For tests.
export { ALL_PLANES };
