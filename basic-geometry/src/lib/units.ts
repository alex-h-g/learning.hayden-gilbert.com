/**
 * Central metric unit conversion. Every component converts through here.
 *
 * Units are stored as a power of ten relative to the millimetre, so
 * conversions are exact integer powers of ten (no 0.001 floating drift):
 *   length factor  = 10^(Δexp)       (mm ↔ cm = 10)
 *   area factor    = 10^(2 × Δexp)   (mm² ↔ cm² = 100)
 *   volume factor  = 10^(3 × Δexp)   (mm³ ↔ cm³ = 1000)
 *
 * Add a new length unit (e.g. km = 6) to LENGTH_UNITS and every
 * conversion category picks it up automatically.
 */
export type LengthUnit = 'mm' | 'cm' | 'm';
export type Power = 1 | 2 | 3;

export const LENGTH_UNITS: { id: LengthUnit; name: string; exp: number }[] = [
  { id: 'mm', name: 'millimetres', exp: 0 },
  { id: 'cm', name: 'centimetres', exp: 1 },
  { id: 'm', name: 'metres', exp: 3 },
];

const expOf = (u: LengthUnit) => LENGTH_UNITS.find((x) => x.id === u)!.exp;

export function isLengthUnit(u: unknown): u is LengthUnit {
  return typeof u === 'string' && LENGTH_UNITS.some((x) => x.id === u);
}

const SUPER: Record<Power, string> = { 1: '', 2: '²', 3: '³' };

/** "cm", "cm²" or "cm³". */
export function unitLabel(u: LengthUnit, power: Power): string {
  return `${u}${SUPER[power]}`;
}

export function unitName(u: LengthUnit, power: Power): string {
  const n = LENGTH_UNITS.find((x) => x.id === u)!.name;
  return power === 1 ? n : `${power === 2 ? 'square' : 'cubic'} ${n}`;
}

/** Exponent k such that value_in_to = value_in_from × 10^k. */
export function conversionExponent(from: LengthUnit, to: LengthUnit, power: Power): number {
  return (expOf(from) - expOf(to)) * power;
}

/** Convert a length (power 1), area (2) or volume (3) between metric units. */
export function convert(value: number, from: LengthUnit, to: LengthUnit, power: Power): number {
  const k = conversionExponent(from, to, power);
  if (k === 0) return value;
  const f = 10 ** Math.abs(k);
  return k > 0 ? value * f : value / f;
}

export interface ConversionMethod {
  operator: '×' | '÷' | '=';
  factor: number;
  /** e.g. "2,500 mm² ÷ 100 = 25 cm²" */
  text: string;
  /** e.g. "1 cm² = 10 mm × 10 mm = 100 mm²" */
  why: string;
}

export function describeConversion(value: number, from: LengthUnit, to: LengthUnit, power: Power): ConversionMethod {
  const k = conversionExponent(from, to, power);
  const result = convert(value, from, to, power);
  const factor = 10 ** Math.abs(k);
  const op = k === 0 ? '=' : k > 0 ? '×' : '÷';
  const fl = unitLabel(from, power);
  const tl = unitLabel(to, power);
  const text =
    k === 0
      ? `${formatNumber(value)} ${fl} = ${formatNumber(result)} ${tl}`
      : `${formatNumber(value)} ${fl} ${op} ${formatNumber(factor)} = ${formatNumber(result)} ${tl}`;

  // Explain the squared/cubed factor from the length factor.
  const big = expOf(from) > expOf(to) ? from : to;
  const small = big === from ? to : from;
  const lf = 10 ** Math.abs(expOf(from) - expOf(to));
  let why = '';
  if (k !== 0) {
    const sides = Array.from({ length: power }, () => `${formatNumber(lf)} ${small}`).join(' × ');
    why =
      power === 1
        ? `1 ${big} = ${formatNumber(lf)} ${small}.`
        : `1 ${unitLabel(big, power)} = ${sides} = ${formatNumber(factor)} ${unitLabel(small, power)}. The length factor (${formatNumber(lf)}) is ${power === 2 ? 'squared' : 'cubed'}.`;
  }
  return { operator: op, factor, text, why };
}

/** Human-friendly number: thousands separators, trimmed decimals. */
export function formatNumber(n: number, maxDecimals = 4): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 10 ** -maxDecimals || abs >= 1e15)) {
    return n.toExponential(3).replace('e', ' × 10^').replace('^+', '^');
  }
  return n.toLocaleString('en-GB', { maximumFractionDigits: maxDecimals });
}

/** Number formatted for use inside LaTeX (thousands separators as {,}). */
export function texNumber(n: number, maxDecimals = 4): string {
  if (!Number.isFinite(n)) return '?';
  const s = n.toLocaleString('en-GB', { maximumFractionDigits: maxDecimals, useGrouping: true });
  return s.replace(/,/g, '{,}');
}

/** Parse user input; accepts "1,250.5" or "2.5". Returns null if invalid. */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/,/g, '').replace(/\s/g, '');
  if (s === '') return null;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
