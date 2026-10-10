import { useId, useState } from 'react';
import { convert, describeConversion, formatNumber, LENGTH_UNITS, parseNumber, unitLabel, unitName, type LengthUnit } from '../lib/units';

/** Area unit converter (mm² ↔ cm² ↔ m²). Updates live as you type. */
export function AreaConverter() {
  const id = useId();
  const [raw, setRaw] = useState('2500');
  const [from, setFrom] = useState<LengthUnit>('mm');
  const [to, setTo] = useState<LengthUnit>('cm');

  const value = parseNumber(raw);
  let error: string | null = null;
  if (raw.trim() === '') error = null;
  else if (value === null) error = 'Enter a number, for example 2500 or 2.5.';
  else if (value < 0) error = 'An area can’t be negative.';

  const ok = value !== null && !error;
  const result = ok ? convert(value, from, to, 2) : null;
  const method = ok ? describeConversion(value, from, to, 2) : null;

  return (
    <section className="card converter" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>Area unit converter</h2>
      <p className="muted">
        Area conversions use <strong>squared</strong> factors: 1 cm = 10 mm, so 1 cm² = 10 × 10 = 100 mm².
      </p>
      <div className="converter-row">
        <div className="field">
          <label htmlFor={`${id}-v`}>Area</label>
          <input
            id={`${id}-v`}
            inputMode="decimal"
            autoComplete="off"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-from`}>From</label>
          <select id={`${id}-from`} value={from} onChange={(e) => setFrom(e.target.value as LengthUnit)}>
            {LENGTH_UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {unitLabel(u.id, 2)} — {unitName(u.id, 2)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-secondary swap"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          aria-label="Swap units"
          title="Swap units"
        >
          ⇄
        </button>
        <div className="field">
          <label htmlFor={`${id}-to`}>To</label>
          <select id={`${id}-to`} value={to} onChange={(e) => setTo(e.target.value as LengthUnit)}>
            {LENGTH_UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {unitLabel(u.id, 2)} — {unitName(u.id, 2)}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setRaw('')}>
          Clear
        </button>
      </div>
      {error && (
        <p id={`${id}-err`} className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="converter-result" aria-live="polite">
        {result !== null && method ? (
          <>
            <p className="converter-answer">
              {formatNumber(value!, 6)} {unitLabel(from, 2)} = <strong>{formatNumber(result, 8)} {unitLabel(to, 2)}</strong>
            </p>
            <p className="converter-method">
              <span className="muted">Method: </span>
              {method.text}
            </p>
            {method.why && <p className="small muted">{method.why}</p>}
          </>
        ) : (
          <p className="muted">Enter an area to convert.</p>
        )}
      </div>
    </section>
  );
}
