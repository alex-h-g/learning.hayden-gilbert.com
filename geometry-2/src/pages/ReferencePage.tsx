import { useEffect } from 'react';
import { Math as TeX } from '../components/Math';
import { PREFIXES, prefixFactorString } from '../math/core';

export const GROUPS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'Angles and polygons',
    rows: [
      ['Sum of interior angles ($n$ sides)', '(n - 2) \\times 180^\\circ'],
      ['Each interior angle (regular)', '\\dfrac{(n - 2) \\times 180^\\circ}{n}'],
      ['Sum of exterior angles (any polygon)', '360^\\circ'],
      ['Each exterior angle (regular)', '\\dfrac{360^\\circ}{n}'],
      ['Interior and exterior at one corner', '\\text{interior} + \\text{exterior} = 180^\\circ'],
      ['Angles on a straight line', '180^\\circ'],
      ['Angles around a point', '360^\\circ'],
      ['Parallelogram', '\\text{opposite angles equal; next-door angles add to } 180^\\circ'],
      ['Parallel lines', '\\text{corresponding (F) and alternate (Z) equal; co-interior (C) add to } 180^\\circ'],
    ],
  },
  {
    title: 'Pythagoras’ theorem ($c$ = hypotenuse, opposite the right angle)',
    rows: [
      ['The theorem', 'a^2 + b^2 = c^2'],
      ['Hypotenuse', 'c = \\sqrt{a^2 + b^2}'],
      ['Shorter side', 'a = \\sqrt{c^2 - b^2} \\qquad b = \\sqrt{c^2 - a^2}'],
      ['Diagonal of a rectangle ($l$ by $w$)', 'd = \\sqrt{l^2 + w^2}'],
    ],
  },
  {
    title: 'Circles ($r$ radius, $d$ diameter)',
    rows: [
      ['Diameter and radius', 'd = 2r \\qquad r = d \\div 2'],
      ['Circumference', 'C = 2\\pi r = \\pi d'],
      ['Area', 'A = \\pi r^2'],
      ['Semicircle area', 'A = \\pi r^2 \\div 2'],
      ['Rectangle area ($l$ by $w$)', 'A = l \\times w'],
    ],
  },
  {
    title: 'Mass and standard form',
    rows: [
      ['Mass', '1\\text{ t} = 1000\\text{ kg}, \\; 1\\text{ kg} = 1000\\text{ g}, \\; 1\\text{ g} = 1000\\text{ mg}'],
      ['So', '1\\text{ t} = 1\\,000\\,000\\text{ g} = 1\\,000\\,000\\,000\\text{ mg}'],
      ['Standard form', 'a \\times 10^n, \\quad 1 \\le |a| < 10'],
      ['Examples', '4\\,800\\,000 = 4.8 \\times 10^6 \\qquad 350\\text{ nm} = 3.5 \\times 10^{-7}\\text{ m}'],
    ],
  },
];

function Cell({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\$[^$]+\$)/g).map((p, i) => (p.startsWith('$') ? <TeX key={i} tex={p.slice(1, -1)} /> : <span key={i}>{p}</span>))}
    </>
  );
}

export function ReferencePage() {
  useEffect(() => {
    document.title = 'Formula Reference · Geometry 2';
  }, []);
  return (
    <div className="reference">
      <div className="guide-head">
        <h1>Formula reference</h1>
        <button type="button" className="btn btn-secondary no-print" onClick={() => window.print()}>🖨 Print</button>
      </div>
      {GROUPS.map((g) => (
        <section key={g.title} className="card">
          <h2><Cell text={g.title} /></h2>
          <table className="ref-table">
            <tbody>
              {g.rows.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row"><Cell text={k} /></th>
                  <td><TeX tex={v} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <section className="card">
        <h2>Metric prefixes</h2>
        <table className="ref-table prefix-table">
          <thead><tr><th scope="col">Prefix</th><th scope="col">Symbol</th><th scope="col">Meaning</th><th scope="col">Power of ten</th></tr></thead>
          <tbody>
            {PREFIXES.map((p) => (
              <tr key={p.name}>
                <th scope="row">{p.name}</th>
                <td>{p.symbol || '—'}</td>
                <td>{prefixFactorString(p)}</td>
                <td><TeX tex={`10^{${p.power}}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted">The prefix symbol goes in front of the unit symbol: k + g = kg (kilogram), m + m = mm (millimetre).</p>
      </section>
    </div>
  );
}
