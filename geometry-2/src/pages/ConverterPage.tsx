import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { GinaSays } from '../components/Gina';
import { Math as TeX } from '../components/Math';
import * as M from '../math/core';

interface U {
  id: string;
  name: string;
  power: number; // power of ten of the base unit
}
type Kind = 'mass' | 'length' | 'prefix';

const MASS: U[] = [
  { id: 't', name: 'tonnes', power: 6 },
  { id: 'kg', name: 'kilograms', power: 3 },
  { id: 'g', name: 'grams', power: 0 },
  { id: 'mg', name: 'milligrams', power: -3 },
  { id: 'μg', name: 'micrograms', power: -6 },
];
const LENGTH: U[] = [
  { id: 'km', name: 'kilometres', power: 3 },
  { id: 'm', name: 'metres', power: 0 },
  { id: 'cm', name: 'centimetres', power: -2 },
  { id: 'mm', name: 'millimetres', power: -3 },
  { id: 'μm', name: 'micrometres', power: -6 },
  { id: 'nm', name: 'nanometres', power: -9 },
];
const BASES = [
  { id: 'm', name: 'metre' },
  { id: 'g', name: 'gram' },
  { id: 'L', name: 'litre' },
];
const prefixUnits = (base: string): U[] => M.PREFIXES.map((p) => ({ id: `${p.symbol}${base}`, name: p.name === 'base unit' ? `${BASES.find((b) => b.id === base)!.name}s` : `${p.name}${BASES.find((b) => b.id === base)!.name}s`, power: p.power }));

const sfTex = (d: M.Dec) => {
  if (M.isZero(d)) return '0';
  const sf = M.toStandardForm(d);
  return `${M.decToString(sf.coef)} \\times 10^{${sf.exp}}`;
};
const grouped = (d: M.Dec) => M.decToString(d, true);

export function ConverterPage() {
  const id = useId();
  const [kind, setKind] = useState<Kind>('mass');
  const [base, setBase] = useState('m');
  const units = kind === 'mass' ? MASS : kind === 'length' ? LENGTH : prefixUnits(base);
  const [raw, setRaw] = useState('64.8');
  const [from, setFrom] = useState('t');
  const [to, setTo] = useState('kg');
  useEffect(() => {
    document.title = 'Unit converter · Geometry 2';
  }, []);

  const pickKind = (k: Kind) => {
    setKind(k);
    if (k === 'mass') { setFrom('t'); setTo('kg'); setRaw('64.8'); }
    if (k === 'length') { setFrom('nm'); setTo('m'); setRaw('350'); }
    if (k === 'prefix') { setBase('m'); setFrom('km'); setTo('mm'); setRaw('2.5'); }
  };
  const pickBase = (b: string) => {
    const f = units.find((u) => u.id === from)!;
    const t = units.find((u) => u.id === to)!;
    const nu = prefixUnits(b);
    setBase(b);
    setFrom(nu.find((u) => u.power === f.power)!.id);
    setTo(nu.find((u) => u.power === t.power)!.id);
  };

  const F = units.find((u) => u.id === from) ?? units[0];
  const T = units.find((u) => u.id === to) ?? units[1];
  const value = M.parseDec(raw);
  const error = raw.trim() === '' ? null : !value ? 'Enter a number, for example 64.8 or 350.' : value.neg ? 'Measurements here can’t be negative.' : null;
  const result = value && !error ? M.convertPower(value, F.power, T.power) : null;
  const k = F.power - T.power;
  const factor = M.decToString({ neg: false, digits: '1', exp: Math.abs(k) }, true);
  const bigger = k < 0;
  const steps = Math.abs(k);

  return (
    <div className="converter-page">
      <h1>Unit converter</h1>
      <GinaSays
        pose="explaining"
        text="Type a number and choose the units — I’ll show the answer, **how** to get it, and the same answer in standard form. Watch which way the decimal point moves!"
      />
      <section className="card converter" aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`} className="sr-only">Convert</h2>
        <div className="seg kind-tabs" role="group" aria-label="What are you converting?">
          {(['mass', 'length', 'prefix'] as Kind[]).map((k2) => (
            <button key={k2} type="button" className={`btn btn-sm ${kind === k2 ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={kind === k2} onClick={() => pickKind(k2)}>
              {k2 === 'mass' ? 'Mass' : k2 === 'length' ? 'Length' : 'Any prefix'}
            </button>
          ))}
          {kind === 'prefix' && (
            <label className="base-pick">
              Base unit{' '}
              <select value={base} onChange={(e) => pickBase(e.target.value)}>
                {BASES.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="converter-row">
          <label className="field">
            <span>Amount</span>
            <input inputMode="decimal" autoComplete="off" value={raw} onChange={(e) => setRaw(e.target.value)} aria-invalid={!!error} />
          </label>
          <label className="field">
            <span>From</span>
            <select value={F.id} onChange={(e) => setFrom(e.target.value)}>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.id} — {u.name}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-secondary swap" onClick={() => { setFrom(T.id); setTo(F.id); }} aria-label="Swap units">⇄</button>
          <label className="field">
            <span>To</span>
            <select value={T.id} onChange={(e) => setTo(e.target.value)}>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.id} — {u.name}</option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="converter-result" aria-live="polite">
          {result && value ? (
            <>
              <p className="converter-answer">
                {grouped(value)} {F.id} = <strong>{grouped(result)} {T.id}</strong>
              </p>
              {k !== 0 ? (
                <>
                  <p>
                    <strong>Method:</strong> {T.name} are {bigger ? 'bigger' : 'smaller'} units, so you need {bigger ? 'fewer' : 'more'} of them:{' '}
                    <strong>{bigger ? 'divide' : 'multiply'} by {factor}</strong> <TeX tex={`(10^{${steps}})`} />.
                  </p>
                  <p>
                    <TeX tex={`1\\text{ ${bigger ? T.id : F.id}} = ${M.decToString({ neg: false, digits: '1', exp: steps }, true).replace(/,/g, '{,}')}\\text{ ${bigger ? F.id : T.id}}`} /> — the decimal point moves <strong>{steps} place{steps === 1 ? '' : 's'} to the {bigger ? 'left' : 'right'}</strong>.
                  </p>
                </>
              ) : (
                <p>Same unit — nothing to change.</p>
              )}
              {!M.isZero(result) && (
                <p>
                  <strong>In standard form:</strong> <TeX tex={`${sfTex(value)}\\text{ ${F.id}} = ${sfTex(result)}\\text{ ${T.id}}`} />
                </p>
              )}
            </>
          ) : (
            !error && <p className="muted">Enter an amount to convert.</p>
          )}
        </div>
        <ol className="unit-scale" aria-label="Units from biggest to smallest">
          {units.map((u) => (
            <li key={u.id} className={u.id === F.id ? 'from' : u.id === T.id ? 'to' : (u.power - T.power) * (u.power - F.power) < 0 ? 'between' : ''}>
              <span className="us-unit">{u.id}</span>
              <span className="us-pow"><TeX tex={`10^{${u.power}}`} /></span>
              {u.id === F.id && <span className="us-tag">from</span>}
              {u.id === T.id && <span className="us-tag">to</span>}
            </li>
          ))}
        </ol>
        <p className="small muted">Powers are relative to the base unit ({kind === 'mass' ? 'gram' : kind === 'length' ? 'metre' : BASES.find((b) => b.id === base)!.name}). A tonne is 1,000 kg = 10⁶ g.</p>
      </section>
      <p>
        Practise it: <Link to="/lesson/mass">Converting mass</Link> · <Link to="/lesson/prefixes">Metric prefixes</Link> · <Link to="/lesson/units-sf">Units in standard form</Link>
      </p>
    </div>
  );
}
