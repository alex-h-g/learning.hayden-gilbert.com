/**
 * Parses a learner's typed answer into a number.
 *
 * Accepts plain numbers ("73.13", "64,800", "-7"), exact forms using π and
 * square roots ("48 + 8π", "8pi+48", "14π", "√63", "3√7", "sqrt(63)"), simple
 * arithmetic (× x * / ÷ ^ ² ³ and brackets) and an optional trailing unit
 * ("13 cm", "135°", "25.13 cm²"), which is ignored.
 *
 * The whole input must parse: "abc 12" or "1212" for 12 never count as correct.
 */

export interface Parsed {
  value: number;
  /** Uses π or √ — an exact form rather than a rounded decimal. */
  exact: boolean;
  usesPi: boolean;
  usesRoot: boolean;
  /** Most decimal places typed in any number (for rounding feedback). */
  maxDp: number;
}

export type ParseResult = { ok: true; parsed: Parsed } | { ok: false; reason: 'empty' | 'invalid' };

type Tok =
  | { t: 'num'; v: number; dp: number }
  | { t: 'pi' }
  | { t: 'root' }
  | { t: 'op'; v: '+' | '-' | '*' | '/' | '^' }
  | { t: 'sup'; v: number }
  | { t: '(' }
  | { t: ')' };

// Units we strip from the end (longest first).
const UNITS = ['cm²', 'cm2', 'cm^2', 'm²', 'm2', 'mm²', 'km²', 'cm³', 'cm', 'mm', 'km', 'kg', 'mg', 'nm', 'μm', 'um', 'm', 'g', 't', 'tonnes', 'tonne', 'degrees', 'degree', 'deg', '°'];

function stripUnit(s: string): string {
  let out = s.trim();
  for (let changed = true; changed; ) {
    changed = false;
    for (const u of UNITS.slice().sort((a, b) => b.length - a.length)) {
      if (out.toLowerCase().endsWith(u.toLowerCase())) {
        const rest = out.slice(0, out.length - u.length);
        // Only strip a unit that follows a digit, π, ) or space — never eat part of "pi"/"sqrt".
        if (/[\d)πi²³\s]$/.test(rest) && rest.trim()) {
          out = rest.trim();
          changed = true;
          break;
        }
      }
    }
  }
  return out;
}

function tokenize(src: string): Tok[] | null {
  const s = src
    .replace(/[−–—]/g, '-') // minus signs
    .replace(/[·⋅∙]/g, '*')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/ | /g, ' ');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') {
      i++;
      continue;
    }
    // Number, allowing comma thousands separators ("64,800" but not "3,5").
    const num = /^(\d{1,3}(?:,\d{3})+|\d+)(\.\d*)?|^\.\d+/.exec(s.slice(i));
    if (num) {
      const raw = num[0];
      const clean = raw.replace(/,/g, '');
      const v = Number(clean);
      if (!Number.isFinite(v)) return null;
      const dp = clean.includes('.') ? clean.split('.')[1].length : 0;
      out.push({ t: 'num', v, dp });
      i += raw.length;
      // A comma straight after a number that was not a thousands group is ambiguous → reject.
      if (s[i] === ',') return null;
      continue;
    }
    if (c === 'π') {
      out.push({ t: 'pi' });
      i++;
      continue;
    }
    if (/^pi/i.test(s.slice(i))) {
      out.push({ t: 'pi' });
      i += 2;
      continue;
    }
    if (c === '√') {
      out.push({ t: 'root' });
      i++;
      continue;
    }
    const sq = /^(sqrt|root)/i.exec(s.slice(i));
    if (sq) {
      out.push({ t: 'root' });
      i += sq[0].length;
      continue;
    }
    if (c === '²' || c === '³') {
      out.push({ t: 'sup', v: c === '²' ? 2 : 3 });
      i++;
      continue;
    }
    if (c === 'x' || c === 'X') {
      out.push({ t: 'op', v: '*' });
      i++;
      continue;
    }
    if ('+-*/^'.includes(c)) {
      out.push({ t: 'op', v: c as '+' });
      i++;
      continue;
    }
    if (c === '(' || c === '[') {
      out.push({ t: '(' });
      i++;
      continue;
    }
    if (c === ')' || c === ']') {
      out.push({ t: ')' });
      i++;
      continue;
    }
    return null;
  }
  return out;
}

/** Recursive-descent evaluator with implicit multiplication (2π, 3√7, 2(3+4)). */
function evaluate(tokens: Tok[]): { v: number; pi: boolean; root: boolean; dp: number } | null {
  let pos = 0;
  let pi = false;
  let root = false;
  let dp = 0;
  const peek = () => tokens[pos];
  const isOp = (v: string) => {
    const t = peek();
    return t && t.t === 'op' && t.v === v;
  };

  function primary(): number | null {
    const t = peek();
    if (!t) return null;
    if (t.t === 'num') {
      pos++;
      dp = Math.max(dp, t.dp);
      return t.v;
    }
    if (t.t === 'pi') {
      pos++;
      pi = true;
      return Math.PI;
    }
    if (t.t === '(') {
      pos++;
      const v = expr();
      if (v === null || peek()?.t !== ')') return null;
      pos++;
      return v;
    }
    if (t.t === 'root') {
      pos++;
      root = true;
      const v = power();
      if (v === null || v < 0) return null;
      return Math.sqrt(v);
    }
    return null;
  }

  function power(): number | null {
    let base = primary();
    if (base === null) return null;
    for (;;) {
      const t = peek();
      if (t?.t === 'sup') {
        pos++;
        base = base ** t.v;
      } else if (t?.t === 'op' && t.v === '^') {
        pos++;
        const neg = isOp('-');
        if (neg) pos++;
        const e = primary();
        if (e === null) return null;
        base = base ** (neg ? -e : e);
      } else return base;
    }
  }

  function unary(): number | null {
    if (isOp('-')) {
      pos++;
      const v = unary();
      return v === null ? null : -v;
    }
    if (isOp('+')) {
      pos++;
      return unary();
    }
    return power();
  }

  function term(): number | null {
    let v = unary();
    if (v === null) return null;
    for (;;) {
      const t = peek();
      if (t?.t === 'op' && (t.v === '*' || t.v === '/')) {
        pos++;
        const r = unary();
        if (r === null) return null;
        if (t.v === '/') {
          if (r === 0) return null;
          v /= r;
        } else v *= r;
      } else if (t && (t.t === 'pi' || t.t === 'root' || t.t === '(' || t.t === 'num')) {
        // Implicit multiplication. "2 3" (two bare numbers) is not allowed.
        const prev = tokens[pos - 1];
        if (t.t === 'num' && prev && prev.t === 'num') return null;
        const r = power();
        if (r === null) return null;
        v *= r;
      } else return v;
    }
  }

  function expr(): number | null {
    let v = term();
    if (v === null) return null;
    while (isOp('+') || isOp('-')) {
      const op = (peek() as { v: string }).v;
      pos++;
      const r = term();
      if (r === null) return null;
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  const v = expr();
  if (v === null || pos !== tokens.length || !Number.isFinite(v)) return null;
  return { v, pi, root, dp };
}

export function parseAnswer(input: string): ParseResult {
  if (!input || !input.trim()) return { ok: false, reason: 'empty' };
  const body = stripUnit(input);
  if (!body) return { ok: false, reason: 'invalid' };
  const tokens = tokenize(body);
  if (!tokens || !tokens.length) return { ok: false, reason: 'invalid' };
  const r = evaluate(tokens);
  if (!r) return { ok: false, reason: 'invalid' };
  return { ok: true, parsed: { value: r.v, exact: r.pi || r.root, usesPi: r.pi, usesRoot: r.root, maxDp: r.dp } };
}
