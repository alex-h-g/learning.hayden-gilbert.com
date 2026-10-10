import { useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AreaConverter } from '../components/AreaConverter';
import { DownloadButton, PageHeader } from '../components/common';
import { Math } from '../components/Math';
import { ShapeIllustration } from '../components/ShapeIllustration';
import { getFormula, PI } from '../data/formulas';
import { CATEGORIES, getShape, SHAPES } from '../data/shapes';
import type { CalcInput, CalcResult, Formula, Shape } from '../data/types';
import { convert, formatNumber, LENGTH_UNITS, parseNumber, texNumber, unitLabel, type LengthUnit } from '../lib/units';

export function CalculatorPage() {
  const [params, setParams] = useSearchParams();
  const shape = getShape(params.get('shape') ?? '') ?? SHAPES.find((s) => s.id === 'circle')!;
  const requested = params.get('formula');
  const formula = getFormula(shape.formulaIds.includes(requested ?? '') ? requested! : shape.formulaIds[0])!;

  const choose = (shapeId: string, formulaId?: string) => {
    const next: Record<string, string> = { shape: shapeId };
    if (formulaId) next.formula = formulaId;
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Formula Calculator"
        intro="Select a shape, enter its measurements and calculate the area, perimeter, circumference, volume or surface area — with the working shown."
        actions={<DownloadButton compact />}
      />
      <div className="calc-layout">
        <nav className="card calc-shapes" aria-label="Shapes">
          {(['2d', '3d'] as const).map((dim) => (
            <div key={dim}>
              <h2 className="calc-group">{dim === '2d' ? '2D shapes' : '3D shapes'}</h2>
              <ul>
                {SHAPES.filter((s) => s.dimension === dim).map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`shape-btn ${s.id === shape.id ? 'is-current' : ''}`}
                      aria-current={s.id === shape.id ? 'true' : undefined}
                      onClick={() => choose(s.id)}
                    >
                      <ShapeIllustration shape={s.id} className="shape-btn-icon" />
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {/* key resets inputs when the shape changes */}
        <ShapeCalculator key={shape.id} shape={shape} formula={formula} onFormula={(id) => choose(shape.id, id)} />
      </div>
      <AreaConverter />
    </>
  );
}

type FieldState = { raw: string; unit: LengthUnit };

function ShapeCalculator({ shape, formula, onFormula }: { shape: Shape; formula: Formula; onFormula: (id: string) => void }) {
  const id = useId();
  const [fields, setFields] = useState<Record<string, FieldState>>({});
  const [resultUnit, setResultUnit] = useState<LengthUnit>('cm');
  const [decimals, setDecimals] = useState(2);
  const [submitted, setSubmitted] = useState(false);
  const category = CATEGORIES[formula.category];
  const inputs = formula.calculation.inputs;

  const field = (k: string): FieldState => fields[k] ?? { raw: '', unit: resultUnit };
  const setField = (k: string, patch: Partial<FieldState>) => {
    setFields((f) => ({ ...f, [k]: { ...(f[k] ?? { raw: '', unit: resultUnit }), ...patch } }));
    setSubmitted(false);
  };

  // Validate every input.
  const errors: Record<string, string> = {};
  const values: Record<string, number> = {};
  const conversions: string[] = [];
  for (const inp of inputs) {
    const fs = field(inp.key);
    const n = parseNumber(fs.raw);
    if (fs.raw.trim() === '') errors[inp.key] = `Enter the ${inp.label.toLowerCase()}.`;
    else if (n === null) errors[inp.key] = 'Enter a number, for example 4 or 2.5.';
    else if (n < 0) errors[inp.key] = 'Measurements can’t be negative.';
    else if (n === 0) errors[inp.key] = 'Measurements must be greater than zero.';
    else {
      const power = inp.kind === 'area' ? 2 : 1;
      values[inp.key] = convert(n, fs.unit, resultUnit, power);
      if (fs.unit !== resultUnit) {
        conversions.push(`${inp.symbol} = ${texNumber(n)}\\,${texUnit(fs.unit, power)} = ${texNumber(values[inp.key], 6)}\\,${texUnit(resultUnit, power)}`);
      }
    }
  }
  const fieldsOk = Object.keys(errors).length === 0;
  const shapeError = fieldsOk ? formula.calculation.validate?.(values) ?? null : null;
  let result: CalcResult | null = null;
  if (submitted && fieldsOk && !shapeError) {
    result = formula.calculation.compute(values, (n) => texNumber(n, 4));
  }
  const unit = unitLabel(resultUnit, category.unitPower);

  const reset = () => {
    setFields({});
    setSubmitted(false);
  };

  return (
    <section className="card calc-panel" aria-labelledby={`${id}-h`}>
      <div className="calc-panel-head">
        <h2 id={`${id}-h`}>{shape.name}</h2>
        <div className="tabs" role="group" aria-label="Calculation">
          {shape.formulaIds.map((fid) => {
            const f = getFormula(fid)!;
            return (
              <button
                key={fid}
                type="button"
                className={`tab ${fid === formula.id ? 'is-current' : ''}`}
                aria-pressed={fid === formula.id}
                onClick={() => {
                  onFormula(fid);
                  setSubmitted(false);
                }}
              >
                {CATEGORIES[f.category].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="calc-body">
        <figure className="calc-figure">
          <ShapeIllustration shape={shape.id} labelled formulaId={formula.id} title={`${shape.name} diagram`} className="calc-svg" />
          <figcaption className="small muted">{shape.note}</figcaption>
        </figure>

        <div className="calc-form">
          <div className="formula-box">
            <span className="formula-box-label">Formula</span>
            <Math tex={formula.tex} display label={formula.plain} />
            <ul className="var-list">
              {formula.variables.map((v) => (
                <li key={v.symbol}>
                  <Math tex={v.symbol} /> = {v.meaning}
                </li>
              ))}
            </ul>
          </div>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            {inputs.map((inp) => (
              <InputRow
                key={inp.key}
                id={`${id}-${inp.key}`}
                input={inp}
                state={field(inp.key)}
                error={submitted ? errors[inp.key] : undefined}
                onChange={(patch) => setField(inp.key, patch)}
              />
            ))}

            <div className="calc-options">
              <label>
                Answer in
                <select value={resultUnit} onChange={(e) => { setResultUnit(e.target.value as LengthUnit); }}>
                  {LENGTH_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {unitLabel(u.id, category.unitPower)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Round to
                <select value={decimals} onChange={(e) => setDecimals(Number(e.target.value))}>
                  {[0, 1, 2, 3, 4].map((d) => (
                    <option key={d} value={d}>
                      {d} decimal place{d === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="calc-actions">
              <button type="submit" className="btn btn-primary btn-lg">
                Calculate {category.label.toLowerCase()}
              </button>
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Reset
              </button>
            </div>
          </form>

          <div aria-live="polite">
            {submitted && !fieldsOk && (
              <p className="field-error" role="alert">
                Please fix the highlighted measurement{Object.keys(errors).length > 1 ? 's' : ''}.
              </p>
            )}
            {submitted && shapeError && (
              <p className="alert alert-error" role="alert">
                {shapeError}
              </p>
            )}
            {result && (
              <div className="result-box">
                {conversions.length > 0 && (
                  <div className="working">
                    <span className="working-label">Convert to {unitLabel(resultUnit, 1)} first</span>
                    {conversions.map((t) => (
                      <Math key={t} tex={t} display />
                    ))}
                  </div>
                )}
                {result.steps.map((s) => (
                  <div className="working" key={s.tex}>
                    {s.note && <span className="working-label">{s.note}</span>}
                    <Math tex={s.tex} display />
                  </div>
                ))}
                <div className="working">
                  <span className="working-label">Substitute</span>
                  <Math tex={result.substitution} display />
                </div>
                <p className="result-value">
                  {category.label} ≈ <strong>{formatNumber(round(result.value, decimals), decimals)}</strong> {unit}
                </p>
                <p className="small muted">
                  {formula.tex.includes('\\pi') ? `Using π ≈ ${PI}. ` : ''}
                  {category.label} is measured in {category.unitPower === 1 ? 'linear' : category.unitPower === 2 ? 'square' : 'cubic'} units ({unit}).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const texUnit = (u: LengthUnit, power: number) => `\\text{${u}}${power > 1 ? `^${power}` : ''}`;

const round = (n: number, d: number) => {
  const f = 10 ** d;
  return Math_round(n * f) / f;
};
const Math_round = globalThis.Math.round;

function InputRow({ id, input, state, error, onChange }: { id: string; input: CalcInput; state: FieldState; error?: string; onChange: (p: Partial<FieldState>) => void }) {
  const power = input.kind === 'area' ? 2 : 1;
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  return (
    <div className={`input-row ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {input.label} (<Math tex={input.symbol} />)
      </label>
      <div className="input-unit">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="e.g. 5"
          value={state.raw}
          onChange={(e) => onChange({ raw: e.target.value })}
          aria-invalid={!!error}
          aria-describedby={[input.help ? helpId : '', error ? errId : ''].filter(Boolean).join(' ') || undefined}
        />
        <select aria-label={`Unit for ${input.label.toLowerCase()}`} value={state.unit} onChange={(e) => onChange({ unit: e.target.value as LengthUnit })}>
          {LENGTH_UNITS.map((u) => (
            <option key={u.id} value={u.id}>
              {unitLabel(u.id, power)}
            </option>
          ))}
        </select>
      </div>
      {input.help && (
        <p id={helpId} className="small muted">
          {input.help}
        </p>
      )}
      {error && (
        <p id={errId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
