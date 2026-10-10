import type { Category, Shape, ShapeId } from './types';

export const SHAPES: Shape[] = [
  { id: 'square', name: 'Square', dimension: '2d', note: 'Four equal sides and four right angles.', formulaIds: ['square-area', 'square-perimeter'] },
  { id: 'rectangle', name: 'Rectangle', dimension: '2d', note: 'Opposite sides are equal; every angle is a right angle.', formulaIds: ['rectangle-area', 'rectangle-perimeter'] },
  { id: 'triangle', name: 'Triangle', dimension: '2d', note: 'The height (h) is perpendicular to the base (b) — not necessarily the length of a side.', formulaIds: ['triangle-area', 'triangle-perimeter'] },
  { id: 'parallelogram', name: 'Parallelogram', dimension: '2d', note: 'Opposite sides are parallel and equal. Area uses the perpendicular height, not the slanted side.', formulaIds: ['parallelogram-area', 'parallelogram-perimeter'] },
  { id: 'trapezoid', name: 'Trapezoid', dimension: '2d', note: 'Exactly one pair of parallel sides (a and b). Also called a trapezium in British English.', formulaIds: ['trapezoid-area', 'trapezoid-perimeter'] },
  { id: 'circle', name: 'Circle', dimension: '2d', note: 'Area is the space inside; circumference is the distance around. Diameter d = 2r, so C = πd too.', formulaIds: ['circle-area', 'circle-circumference'] },
  { id: 'cube', name: 'Cube', dimension: '3d', note: 'Six identical square faces.', formulaIds: ['cube-volume', 'cube-surface-area'] },
  { id: 'rectangular-prism', name: 'Rectangular prism', dimension: '3d', note: 'A box shape (cuboid) with six rectangular faces.', formulaIds: ['rectangular-prism-volume', 'rectangular-prism-surface-area'] },
  { id: 'prism', name: 'General prism', dimension: '3d', note: 'Any solid with the same cross-section all the way through. B = base area, P = base perimeter.', formulaIds: ['prism-volume', 'prism-surface-area'] },
  { id: 'cylinder', name: 'Cylinder', dimension: '3d', note: 'A prism with circular ends. The curved surface unrolls into a rectangle 2πr wide and h tall.', formulaIds: ['cylinder-volume', 'cylinder-surface-area'] },
  { id: 'cone', name: 'Cone', dimension: '3d', note: 'Vertical height h and slant height l are different: l = √(r² + h²).', formulaIds: ['cone-volume', 'cone-surface-area'] },
  { id: 'square-pyramid', name: 'Square pyramid', dimension: '3d', note: 'A square base and four triangular faces. Slant height l = √(h² + (s/2)²).', formulaIds: ['square-pyramid-volume', 'square-pyramid-surface-area'] },
  { id: 'sphere', name: 'Sphere', dimension: '3d', note: 'Every point on the surface is the same distance (r) from the centre.', formulaIds: ['sphere-volume', 'sphere-surface-area'] },
];

const shapeById = new Map(SHAPES.map((s) => [s.id, s]));

export function getShape(id: string): Shape | undefined {
  return shapeById.get(id as ShapeId);
}

export interface CategoryInfo {
  id: Category;
  label: string;
  /** Plain-language description used in explanations. */
  measures: string;
  /** Power of the length unit: 1 = linear, 2 = square, 3 = cubic. */
  unitPower: 1 | 2 | 3;
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  area: { id: 'area', label: 'Area', measures: 'the space inside a flat shape, in square units', unitPower: 2 },
  perimeter: { id: 'perimeter', label: 'Perimeter', measures: 'the total distance around the edge, in linear units', unitPower: 1 },
  circumference: { id: 'circumference', label: 'Circumference', measures: 'the distance around a circle, in linear units', unitPower: 1 },
  volume: { id: 'volume', label: 'Volume', measures: 'the space inside a solid, in cubic units', unitPower: 3 },
  'surface-area': { id: 'surface-area', label: 'Surface area', measures: 'the total area of every face of a solid, in square units', unitPower: 2 },
};

export const VARIABLE_LEGEND: { symbol: string; meaning: string }[] = [
  { symbol: 'r', meaning: 'Radius — from the centre to the edge' },
  { symbol: 'd', meaning: 'Diameter — straight across through the centre (d = 2r)' },
  { symbol: 'h', meaning: 'Height — always perpendicular (at 90°) to the base' },
  { symbol: 'b', meaning: 'Base length' },
  { symbol: 'l', meaning: 'Length (rectangles and boxes) or slant height (cones and pyramids), depending on the shape' },
  { symbol: 'w', meaning: 'Width' },
  { symbol: 's', meaning: 'Side length' },
  { symbol: 'B', meaning: 'Area of the base of a 3D solid' },
  { symbol: 'P', meaning: 'Perimeter of the base of a 3D solid' },
  { symbol: 'a, b, c, d', meaning: 'Side lengths, where a shape has sides of different lengths' },
  { symbol: '\\pi', meaning: 'Pi ≈ 3.14159 (the ratio of a circle’s circumference to its diameter)' },
];
