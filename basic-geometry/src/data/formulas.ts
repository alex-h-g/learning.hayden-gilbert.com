/**
 * CENTRAL FORMULA DATABASE — the single source of truth.
 *
 * The game, practice modes, review screen, learning history, calculator and
 * reference page all read from here. Never hard-code a formula elsewhere.
 *
 * To add a formula: append an entry to FORMULAS with a new stable `id`, then
 * add that id to its shape's `formulaIds` in shapes.ts. See README.
 */
import type { Formula } from './types';

/** π used for every displayed calculation (as specified). */
export const PI = 3.14159;

const len = (key: string, label: string, symbol: string, help?: string) =>
  ({ key, label, symbol, kind: 'length' as const, help });

const positiveTriangle = (a: number, b: number, c: number) =>
  a + b > c && a + c > b && b + c > a;

export const FORMULAS: Formula[] = [
  // ───────────────────────────── 2D SHAPES ─────────────────────────────
  {
    id: 'square-area',
    shapeId: 'square',
    category: 'area',
    question: 'Area of a square',
    tex: 'A = s^2',
    plain: 'A equals s squared',
    variables: [{ symbol: 's', meaning: 'side length (all four sides are equal)' }],
    difficulty: 1,
    explanation: 'A square is s units wide and s units tall, so the space inside is s × s = s².',
    hints: ['Area counts the unit squares that fit inside the shape.'],
    calculation: {
      inputs: [len('s', 'Side length', 's')],
      compute: (v, f) => ({ value: v.s ** 2, substitution: `A = ${f(v.s)}^2`, steps: [] }),
    },
  },
  {
    id: 'square-perimeter',
    shapeId: 'square',
    category: 'perimeter',
    question: 'Perimeter of a square',
    tex: 'P = 4s',
    plain: 'P equals 4 s',
    variables: [{ symbol: 's', meaning: 'side length (all four sides are equal)' }],
    difficulty: 1,
    explanation: 'Perimeter is the distance around the boundary: four equal sides give s + s + s + s = 4s.',
    hints: ['Walk around the outside edge and add up every side.'],
    calculation: {
      inputs: [len('s', 'Side length', 's')],
      compute: (v, f) => ({ value: 4 * v.s, substitution: `P = 4 \\times ${f(v.s)}`, steps: [] }),
    },
  },
  {
    id: 'rectangle-area',
    shapeId: 'rectangle',
    category: 'area',
    question: 'Area of a rectangle',
    tex: 'A = l \\times w',
    plain: 'A equals l times w',
    variables: [
      { symbol: 'l', meaning: 'length' },
      { symbol: 'w', meaning: 'width' },
    ],
    difficulty: 1,
    explanation: 'Rows of w unit squares, l rows long: the area is length × width.',
    calculation: {
      inputs: [len('l', 'Length', 'l'), len('w', 'Width', 'w')],
      compute: (v, f) => ({ value: v.l * v.w, substitution: `A = ${f(v.l)} \\times ${f(v.w)}`, steps: [] }),
    },
  },
  {
    id: 'rectangle-perimeter',
    shapeId: 'rectangle',
    category: 'perimeter',
    question: 'Perimeter of a rectangle',
    tex: 'P = 2l + 2w',
    plain: 'P equals 2 l plus 2 w',
    variables: [
      { symbol: 'l', meaning: 'length' },
      { symbol: 'w', meaning: 'width' },
    ],
    difficulty: 1,
    explanation: 'A rectangle has two lengths and two widths around its edge, so P = 2l + 2w.',
    calculation: {
      inputs: [len('l', 'Length', 'l'), len('w', 'Width', 'w')],
      compute: (v, f) => ({
        value: 2 * v.l + 2 * v.w,
        substitution: `P = 2 \\times ${f(v.l)} + 2 \\times ${f(v.w)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'triangle-area',
    shapeId: 'triangle',
    category: 'area',
    question: 'Area of a triangle',
    tex: 'A = \\tfrac{1}{2}bh',
    plain: 'A equals one half b h',
    variables: [
      { symbol: 'b', meaning: 'base length' },
      { symbol: 'h', meaning: 'perpendicular height — measured at 90° to the base, not along a sloping side' },
    ],
    difficulty: 1,
    explanation:
      'A triangle is exactly half of a parallelogram with the same base and height, so A = ½ × base × height. The height must be perpendicular to the base.',
    hints: ['Think about half of a rectangle.'],
    calculation: {
      inputs: [
        len('b', 'Base', 'b'),
        len('h', 'Perpendicular height', 'h', 'Measured at a right angle to the base.'),
      ],
      compute: (v, f) => ({
        value: 0.5 * v.b * v.h,
        substitution: `A = \\tfrac{1}{2} \\times ${f(v.b)} \\times ${f(v.h)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'triangle-perimeter',
    shapeId: 'triangle',
    category: 'perimeter',
    question: 'Perimeter of a triangle',
    tex: 'P = a + b + c',
    plain: 'P equals a plus b plus c',
    variables: [{ symbol: 'a, b, c', meaning: 'the lengths of the three sides' }],
    difficulty: 2,
    explanation: 'Add the three side lengths. The perpendicular height is not part of the perimeter.',
    calculation: {
      inputs: [len('a', 'Side a', 'a'), len('b', 'Side b', 'b'), len('c', 'Side c', 'c')],
      validate: (v) =>
        positiveTriangle(v.a, v.b, v.c)
          ? null
          : 'These sides cannot make a triangle: any two sides together must be longer than the third side.',
      compute: (v, f) => ({
        value: v.a + v.b + v.c,
        substitution: `P = ${f(v.a)} + ${f(v.b)} + ${f(v.c)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'parallelogram-area',
    shapeId: 'parallelogram',
    category: 'area',
    question: 'Area of a parallelogram',
    tex: 'A = b \\times h',
    plain: 'A equals b times h',
    variables: [
      { symbol: 'b', meaning: 'base length' },
      { symbol: 'h', meaning: 'perpendicular height between the base and the opposite side (not the slanted side)' },
    ],
    difficulty: 2,
    explanation:
      'Cut the triangle off one end and slide it to the other: the parallelogram becomes a rectangle of base × perpendicular height.',
    hints: ['Use the perpendicular height, not the length of the slanted side.'],
    calculation: {
      inputs: [
        len('b', 'Base', 'b'),
        len('h', 'Perpendicular height', 'h', 'Measured at a right angle to the base.'),
      ],
      compute: (v, f) => ({ value: v.b * v.h, substitution: `A = ${f(v.b)} \\times ${f(v.h)}`, steps: [] }),
    },
  },
  {
    id: 'parallelogram-perimeter',
    shapeId: 'parallelogram',
    category: 'perimeter',
    question: 'Perimeter of a parallelogram',
    tex: 'P = 2a + 2b',
    plain: 'P equals 2 a plus 2 b',
    variables: [
      { symbol: 'a', meaning: 'length of the base' },
      { symbol: 'b', meaning: 'length of the adjacent (slanted) side' },
    ],
    difficulty: 2,
    explanation: 'Opposite sides of a parallelogram are equal, so there are two of each side length: P = 2a + 2b.',
    calculation: {
      inputs: [len('a', 'Base', 'a'), len('b', 'Adjacent side', 'b', 'The slanted side next to the base.')],
      compute: (v, f) => ({
        value: 2 * v.a + 2 * v.b,
        substitution: `P = 2 \\times ${f(v.a)} + 2 \\times ${f(v.b)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'trapezoid-area',
    shapeId: 'trapezoid',
    category: 'area',
    question: 'Area of a trapezoid',
    tex: 'A = \\tfrac{1}{2}(a + b)h',
    plain: 'A equals one half times a plus b, times h',
    variables: [
      { symbol: 'a, b', meaning: 'the two parallel sides (bases)' },
      { symbol: 'h', meaning: 'perpendicular height between the parallel sides' },
    ],
    difficulty: 2,
    explanation:
      'Average the two parallel sides, ½(a + b), then multiply by the perpendicular height between them.',
    hints: ['Only the two parallel sides are used, plus the height.'],
    calculation: {
      inputs: [
        len('a', 'Parallel side a', 'a'),
        len('b', 'Parallel side b', 'b'),
        len('h', 'Perpendicular height', 'h', 'Distance between the parallel sides, at a right angle.'),
      ],
      compute: (v, f) => ({
        value: 0.5 * (v.a + v.b) * v.h,
        substitution: `A = \\tfrac{1}{2}(${f(v.a)} + ${f(v.b)}) \\times ${f(v.h)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'trapezoid-perimeter',
    shapeId: 'trapezoid',
    category: 'perimeter',
    question: 'Perimeter of a trapezoid',
    tex: 'P = a + b + c + d',
    plain: 'P equals a plus b plus c plus d',
    variables: [
      { symbol: 'a, b', meaning: 'the two parallel sides' },
      { symbol: 'c, d', meaning: 'the two non-parallel sides (legs)' },
    ],
    difficulty: 3,
    explanation: 'Add all four sides. Unlike the area, the perimeter uses the slanted legs and not the height.',
    calculation: {
      inputs: [
        len('a', 'Parallel side a', 'a'),
        len('b', 'Parallel side b', 'b'),
        len('c', 'Leg c', 'c'),
        len('d', 'Leg d', 'd'),
      ],
      validate: (v) =>
        v.a !== v.b && v.c + v.d <= Math.abs(v.a - v.b)
          ? 'These sides cannot make a trapezoid: the two legs together must be longer than the difference between the parallel sides.'
          : null,
      compute: (v, f) => ({
        value: v.a + v.b + v.c + v.d,
        substitution: `P = ${f(v.a)} + ${f(v.b)} + ${f(v.c)} + ${f(v.d)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'circle-area',
    shapeId: 'circle',
    category: 'area',
    question: 'Area of a circle',
    tex: 'A = \\pi r^2',
    plain: 'A equals pi r squared',
    variables: [
      { symbol: 'r', meaning: 'radius — centre to edge (half the diameter)' },
      { symbol: '\\pi', meaning: 'pi ≈ 3.14159' },
    ],
    difficulty: 1,
    explanation: 'Area measures the space inside the circle: π × radius × radius. The radius is squared because area is in square units.',
    hints: ['Area is measured in square units — look for a squared term.'],
    calculation: {
      inputs: [len('r', 'Radius', 'r', 'Half the diameter.')],
      compute: (v, f) => ({ value: PI * v.r ** 2, substitution: `A = \\pi \\times ${f(v.r)}^2`, steps: [] }),
    },
  },
  {
    id: 'circle-circumference',
    shapeId: 'circle',
    category: 'circumference',
    question: 'Circumference of a circle',
    tex: 'C = 2\\pi r',
    plain: 'C equals 2 pi r',
    variables: [
      { symbol: 'r', meaning: 'radius (half the diameter)' },
      { symbol: '\\pi', meaning: 'pi ≈ 3.14159' },
    ],
    difficulty: 1,
    explanation: 'Circumference is the distance around a circle: π × diameter, which is 2πr. It is a length, so nothing is squared.',
    hints: ['A distance around the edge is a length, so nothing is squared.'],
    calculation: {
      inputs: [len('r', 'Radius', 'r', 'Half the diameter.')],
      compute: (v, f) => ({ value: 2 * PI * v.r, substitution: `C = 2 \\times \\pi \\times ${f(v.r)}`, steps: [] }),
    },
  },

  // ───────────────────────────── 3D SHAPES ─────────────────────────────
  {
    id: 'cube-volume',
    shapeId: 'cube',
    category: 'volume',
    question: 'Volume of a cube',
    tex: 'V = s^3',
    plain: 'V equals s cubed',
    variables: [{ symbol: 's', meaning: 'edge (side) length' }],
    difficulty: 1,
    explanation: 'Volume is length × width × height; for a cube all three are s, so V = s³ (cubic units).',
    calculation: {
      inputs: [len('s', 'Edge length', 's')],
      compute: (v, f) => ({ value: v.s ** 3, substitution: `V = ${f(v.s)}^3`, steps: [] }),
    },
  },
  {
    id: 'cube-surface-area',
    shapeId: 'cube',
    category: 'surface-area',
    question: 'Surface area of a cube',
    tex: '\\text{SA} = 6s^2',
    plain: 'S A equals 6 s squared',
    variables: [{ symbol: 's', meaning: 'edge (side) length' }],
    difficulty: 2,
    explanation: 'A cube has 6 identical square faces, each with area s², so SA = 6s² (square units).',
    hints: ['Count the faces of a dice.'],
    calculation: {
      inputs: [len('s', 'Edge length', 's')],
      compute: (v, f) => ({ value: 6 * v.s ** 2, substitution: `\\text{SA} = 6 \\times ${f(v.s)}^2`, steps: [] }),
    },
  },
  {
    id: 'rectangular-prism-volume',
    shapeId: 'rectangular-prism',
    category: 'volume',
    question: 'Volume of a rectangular prism',
    tex: 'V = l \\times w \\times h',
    plain: 'V equals l times w times h',
    variables: [
      { symbol: 'l', meaning: 'length' },
      { symbol: 'w', meaning: 'width' },
      { symbol: 'h', meaning: 'height' },
    ],
    difficulty: 2,
    explanation: 'Layers of l × w unit cubes, stacked h layers high: V = l × w × h.',
    calculation: {
      inputs: [len('l', 'Length', 'l'), len('w', 'Width', 'w'), len('h', 'Height', 'h')],
      compute: (v, f) => ({
        value: v.l * v.w * v.h,
        substitution: `V = ${f(v.l)} \\times ${f(v.w)} \\times ${f(v.h)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'rectangular-prism-surface-area',
    shapeId: 'rectangular-prism',
    category: 'surface-area',
    question: 'Surface area of a rectangular prism',
    tex: '\\text{SA} = 2lw + 2lh + 2wh',
    plain: 'S A equals 2 l w plus 2 l h plus 2 w h',
    variables: [
      { symbol: 'l', meaning: 'length' },
      { symbol: 'w', meaning: 'width' },
      { symbol: 'h', meaning: 'height' },
    ],
    difficulty: 2,
    explanation: 'A box has three pairs of matching rectangular faces: top & bottom (lw), front & back (lh), left & right (wh).',
    calculation: {
      inputs: [len('l', 'Length', 'l'), len('w', 'Width', 'w'), len('h', 'Height', 'h')],
      compute: (v, f) => ({
        value: 2 * v.l * v.w + 2 * v.l * v.h + 2 * v.w * v.h,
        substitution: `\\text{SA} = 2(${f(v.l)} \\times ${f(v.w)}) + 2(${f(v.l)} \\times ${f(v.h)}) + 2(${f(v.w)} \\times ${f(v.h)})`,
        steps: [],
      }),
    },
  },
  {
    id: 'prism-volume',
    shapeId: 'prism',
    category: 'volume',
    question: 'Volume of a general prism',
    tex: 'V = B \\times h',
    plain: 'V equals B times h',
    variables: [
      { symbol: 'B', meaning: 'area of the base (the cross-section)' },
      { symbol: 'h', meaning: 'height (length) of the prism' },
    ],
    difficulty: 3,
    explanation: 'Every prism has the same cross-section all the way through, so volume = base area × height.',
    calculation: {
      inputs: [
        { key: 'B', label: 'Base area', symbol: 'B', kind: 'area', help: 'The area of one end face.' },
        len('h', 'Prism height', 'h'),
      ],
      compute: (v, f) => ({ value: v.B * v.h, substitution: `V = ${f(v.B)} \\times ${f(v.h)}`, steps: [] }),
    },
  },
  {
    id: 'prism-surface-area',
    shapeId: 'prism',
    category: 'surface-area',
    question: 'Surface area of a general prism',
    tex: '\\text{SA} = 2B + Ph',
    plain: 'S A equals 2 B plus P h',
    variables: [
      { symbol: 'B', meaning: 'area of the base' },
      { symbol: 'P', meaning: 'perimeter of the base' },
      { symbol: 'h', meaning: 'height (length) of the prism' },
    ],
    difficulty: 3,
    explanation: 'Two end faces (2B) plus the side faces, which unfold into one rectangle of base perimeter × height (Ph).',
    calculation: {
      inputs: [
        { key: 'B', label: 'Base area', symbol: 'B', kind: 'area', help: 'The area of one end face.' },
        len('P', 'Base perimeter', 'P'),
        len('h', 'Prism height', 'h'),
      ],
      validate: (v) => prismCheck(v),
      compute: (v, f) => ({
        value: 2 * v.B + v.P * v.h,
        substitution: `\\text{SA} = 2 \\times ${f(v.B)} + ${f(v.P)} \\times ${f(v.h)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'cylinder-volume',
    shapeId: 'cylinder',
    category: 'volume',
    question: 'Volume of a cylinder',
    tex: 'V = \\pi r^2 h',
    plain: 'V equals pi r squared h',
    variables: [
      { symbol: 'r', meaning: 'radius of the circular base' },
      { symbol: 'h', meaning: 'vertical height' },
    ],
    difficulty: 2,
    explanation: 'A cylinder is a prism with a circular base: base area πr² × height.',
    hints: ['Volume = base area × height.'],
    calculation: {
      inputs: [len('r', 'Radius', 'r'), len('h', 'Vertical height', 'h')],
      compute: (v, f) => ({ value: PI * v.r ** 2 * v.h, substitution: `V = \\pi \\times ${f(v.r)}^2 \\times ${f(v.h)}`, steps: [] }),
    },
  },
  {
    id: 'cylinder-surface-area',
    shapeId: 'cylinder',
    category: 'surface-area',
    question: 'Surface area of a cylinder',
    tex: '\\text{SA} = 2\\pi r^2 + 2\\pi rh',
    plain: 'S A equals 2 pi r squared plus 2 pi r h',
    variables: [
      { symbol: 'r', meaning: 'radius of the circular ends' },
      { symbol: 'h', meaning: 'vertical height' },
    ],
    difficulty: 3,
    explanation:
      'Two circular ends (2πr²) plus the curved surface, which unrolls into a rectangle of circumference × height (2πrh).',
    hints: ['Picture the label of a tin can plus its lid and base.'],
    calculation: {
      inputs: [len('r', 'Radius', 'r'), len('h', 'Vertical height', 'h')],
      compute: (v, f) => ({
        value: 2 * PI * v.r ** 2 + 2 * PI * v.r * v.h,
        substitution: `\\text{SA} = 2\\pi \\times ${f(v.r)}^2 + 2\\pi \\times ${f(v.r)} \\times ${f(v.h)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'cone-volume',
    shapeId: 'cone',
    category: 'volume',
    question: 'Volume of a cone',
    tex: 'V = \\tfrac{1}{3}\\pi r^2 h',
    plain: 'V equals one third pi r squared h',
    variables: [
      { symbol: 'r', meaning: 'radius of the circular base' },
      { symbol: 'h', meaning: 'vertical height — from the tip straight down to the centre of the base (not the slant height)' },
    ],
    difficulty: 3,
    explanation: 'A cone holds exactly one third of a cylinder with the same base and height: ⅓πr²h.',
    hints: ['Compare it with a cylinder of the same base and height.'],
    calculation: {
      inputs: [len('r', 'Radius', 'r'), len('h', 'Vertical height', 'h', 'Straight up from the base, not along the slope.')],
      compute: (v, f) => ({
        value: (PI * v.r ** 2 * v.h) / 3,
        substitution: `V = \\tfrac{1}{3} \\times \\pi \\times ${f(v.r)}^2 \\times ${f(v.h)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'cone-surface-area',
    shapeId: 'cone',
    category: 'surface-area',
    question: 'Surface area of a cone',
    tex: '\\text{SA} = \\pi r^2 + \\pi rl',
    plain: 'S A equals pi r squared plus pi r l',
    variables: [
      { symbol: 'r', meaning: 'radius of the circular base' },
      { symbol: 'l', meaning: 'slant height — along the sloping side from tip to edge, l = √(r² + h²)' },
    ],
    difficulty: 3,
    explanation: 'The circular base (πr²) plus the curved side (πrl). The curved side uses the slant height l, not the vertical height.',
    hints: ['The curved surface uses the slant height.'],
    calculation: {
      inputs: [len('r', 'Radius', 'r'), len('h', 'Vertical height', 'h', 'The calculator works out the slant height for you.')],
      compute: (v, f) => {
        const l = Math.sqrt(v.r ** 2 + v.h ** 2);
        return {
          value: PI * v.r ** 2 + PI * v.r * l,
          substitution: `\\text{SA} = \\pi \\times ${f(v.r)}^2 + \\pi \\times ${f(v.r)} \\times ${f(l)}`,
          steps: [
            {
              tex: `l = \\sqrt{r^2 + h^2} = \\sqrt{${f(v.r)}^2 + ${f(v.h)}^2} \\approx ${f(l)}`,
              note: 'Slant height from the vertical height (Pythagoras).',
            },
          ],
        };
      },
    },
  },
  {
    id: 'square-pyramid-volume',
    shapeId: 'square-pyramid',
    category: 'volume',
    question: 'Volume of a square pyramid',
    tex: 'V = \\tfrac{1}{3}s^2 h',
    plain: 'V equals one third s squared h',
    variables: [
      { symbol: 's', meaning: 'side length of the square base' },
      { symbol: 'h', meaning: 'vertical height from the apex to the centre of the base' },
    ],
    difficulty: 3,
    explanation: 'A pyramid is one third of the prism with the same base and height: ⅓ × s² × h.',
    calculation: {
      inputs: [len('s', 'Base side length', 's'), len('h', 'Vertical height', 'h')],
      compute: (v, f) => ({
        value: (v.s ** 2 * v.h) / 3,
        substitution: `V = \\tfrac{1}{3} \\times ${f(v.s)}^2 \\times ${f(v.h)}`,
        steps: [],
      }),
    },
  },
  {
    id: 'square-pyramid-surface-area',
    shapeId: 'square-pyramid',
    category: 'surface-area',
    question: 'Surface area of a square pyramid',
    tex: '\\text{SA} = s^2 + 2sl',
    plain: 'S A equals s squared plus 2 s l',
    variables: [
      { symbol: 's', meaning: 'side length of the square base' },
      { symbol: 'l', meaning: 'slant height of each triangular face, l = √(h² + (s/2)²)' },
    ],
    difficulty: 3,
    explanation: 'The square base (s²) plus four triangles, each ½ × s × l, which add up to 2sl. Uses the slant height.',
    calculation: {
      inputs: [len('s', 'Base side length', 's'), len('h', 'Vertical height', 'h', 'The calculator works out the slant height for you.')],
      compute: (v, f) => {
        const l = Math.sqrt(v.h ** 2 + (v.s / 2) ** 2);
        return {
          value: v.s ** 2 + 2 * v.s * l,
          substitution: `\\text{SA} = ${f(v.s)}^2 + 2 \\times ${f(v.s)} \\times ${f(l)}`,
          steps: [
            {
              tex: `l = \\sqrt{h^2 + (s/2)^2} = \\sqrt{${f(v.h)}^2 + ${f(v.s / 2)}^2} \\approx ${f(l)}`,
              note: 'Slant height of a triangular face (Pythagoras).',
            },
          ],
        };
      },
    },
  },
  {
    id: 'sphere-volume',
    shapeId: 'sphere',
    category: 'volume',
    question: 'Volume of a sphere',
    tex: 'V = \\tfrac{4}{3}\\pi r^3',
    plain: 'V equals four thirds pi r cubed',
    variables: [{ symbol: 'r', meaning: 'radius (centre to surface)' }],
    difficulty: 2,
    explanation: 'The volume of a sphere is ⁴⁄₃πr³ — cubed because volume is in cubic units.',
    calculation: {
      inputs: [len('r', 'Radius', 'r')],
      compute: (v, f) => ({
        value: (4 / 3) * PI * v.r ** 3,
        substitution: `V = \\tfrac{4}{3} \\times \\pi \\times ${f(v.r)}^3`,
        steps: [],
      }),
    },
  },
  {
    id: 'sphere-surface-area',
    shapeId: 'sphere',
    category: 'surface-area',
    question: 'Surface area of a sphere',
    tex: '\\text{SA} = 4\\pi r^2',
    plain: 'S A equals 4 pi r squared',
    variables: [{ symbol: 'r', meaning: 'radius (centre to surface)' }],
    difficulty: 3,
    explanation: 'The surface of a sphere has exactly four times the area of a circle with the same radius: 4πr².',
    calculation: {
      inputs: [len('r', 'Radius', 'r')],
      compute: (v, f) => ({ value: 4 * PI * v.r ** 2, substitution: `\\text{SA} = 4 \\times \\pi \\times ${f(v.r)}^2`, steps: [] }),
    },
  },
];

/** Isoperimetric check: no flat shape with perimeter P can enclose more than P²/(4π). */
function prismCheck(v: Record<string, number>): string | null {
  if (v.P * v.P < 4 * Math.PI * v.B) {
    return 'That base is impossible: no shape with this perimeter can enclose this much area. Check the base area and base perimeter (and their units).';
  }
  return null;
}

const byId = new Map(FORMULAS.map((f) => [f.id, f]));

export function getFormula(id: string): Formula | undefined {
  return byId.get(id);
}

export function isFormulaId(id: unknown): id is string {
  return typeof id === 'string' && byId.has(id);
}
