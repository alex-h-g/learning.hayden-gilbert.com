import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaConverter } from '../components/AreaConverter';
import { DownloadButton, PageHeader } from '../components/common';
import { Math } from '../components/Math';
import { ShapeIllustration } from '../components/ShapeIllustration';
import { getFormula } from '../data/formulas';
import { CATEGORIES, SHAPES, VARIABLE_LEGEND } from '../data/shapes';
import type { Shape } from '../data/types';
import { LENGTH_UNITS, unitLabel, unitName } from '../lib/units';

const SECTIONS = [
  { id: 'shapes-2d', label: '2D shapes' },
  { id: 'shapes-3d', label: '3D shapes' },
  { id: 'variables', label: 'Variable legend' },
  { id: 'units', label: 'Metric units' },
  { id: 'conversion', label: 'Area unit conversion' },
];

export function FormulasPage() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = (s: Shape) =>
    !q ||
    s.name.toLowerCase().includes(q) ||
    s.formulaIds.some((id) => {
      const f = getFormula(id)!;
      return f.question.toLowerCase().includes(q) || CATEGORIES[f.category].label.toLowerCase().includes(q);
    });

  return (
    <>
      <PageHeader
        title="Formula reference"
        intro="Every formula used in Basic Geometry, with diagrams, what each letter means and notes on the usual mix-ups."
        actions={<DownloadButton compact />}
      />

      <div className="ref-toolbar card">
        <nav aria-label="Reference sections" className="ref-nav">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>
        <label className="ref-search">
          <span className="sr-only">Search formulas</span>
          <input type="search" placeholder="Search, e.g. cone or volume" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {(['2d', '3d'] as const).map((dim) => {
        const list = SHAPES.filter((s) => s.dimension === dim && matches(s));
        return (
          <section key={dim} id={dim === '2d' ? 'shapes-2d' : 'shapes-3d'} className="section" aria-labelledby={`h-${dim}`}>
            <h2 id={`h-${dim}`}>{dim === '2d' ? '2D shapes (plane geometry)' : '3D shapes (solid geometry)'}</h2>
            {list.length === 0 ? (
              <p className="muted">No {dim.toUpperCase()} shapes match “{query}”.</p>
            ) : (
              <div className="ref-grid">
                {list.map((s) => (
                  <ShapeEntry key={s.id} shape={s} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section id="variables" className="section card" aria-labelledby="h-vars">
        <h2 id="h-vars">Variable legend</h2>
        <dl className="legend">
          {VARIABLE_LEGEND.map((v) => (
            <div key={v.symbol}>
              <dt>
                <Math tex={v.symbol} />
              </dt>
              <dd>{v.meaning}</dd>
            </div>
          ))}
        </dl>
        <p className="small muted">
          Where a letter means different things in different shapes (for example <Math tex="l" /> is a length for a box but the slant height for a
          cone), each formula above explains it in context.
        </p>
      </section>

      <section id="units" className="section card" aria-labelledby="h-units">
        <h2 id="h-units">Metric units</h2>
        <div className="units-grid">
          {([1, 2, 3] as const).map((p) => (
            <div key={p}>
              <h3>{p === 1 ? 'Length' : p === 2 ? 'Area' : 'Volume'}</h3>
              <p className="small muted">{p === 1 ? 'Perimeter, circumference, side lengths' : p === 2 ? 'Area and surface area' : 'Volume'}</p>
              <ul>
                {LENGTH_UNITS.map((u) => (
                  <li key={u.id}>
                    <strong>{unitLabel(u.id, p)}</strong> — {unitName(u.id, p)}
                  </li>
                ))}
              </ul>
              <p className="small">
                {p === 1 && '1 cm = 10 mm · 1 m = 100 cm'}
                {p === 2 && '1 cm² = 100 mm² · 1 m² = 10,000 cm²'}
                {p === 3 && '1 cm³ = 1,000 mm³ · 1 m³ = 1,000,000 cm³'}
              </p>
            </div>
          ))}
        </div>
        <p className="small muted">Always convert every measurement to the same unit before using a formula.</p>
      </section>

      <div id="conversion" className="section">
        <AreaConverter />
      </div>

      <div className="section center">
        <DownloadButton />
      </div>
    </>
  );
}

function ShapeEntry({ shape }: { shape: Shape }) {
  return (
    <article className="card ref-card" aria-labelledby={`ref-${shape.id}`}>
      <div className="ref-card-head">
        <ShapeIllustration shape={shape.id} labelled title={`${shape.name} diagram`} className="ref-svg" />
        <div>
          <h3 id={`ref-${shape.id}`}>{shape.name}</h3>
          <p className="small muted">{shape.note}</p>
        </div>
      </div>
      {shape.formulaIds.map((id) => {
        const f = getFormula(id)!;
        return (
          <div key={id} className="ref-formula">
            <div className="ref-formula-top">
              <span className="cat-chip">{CATEGORIES[f.category].label}</span>
              <Math tex={f.tex} label={f.plain} className="ref-math" />
            </div>
            <ul className="var-list">
              {f.variables.map((v) => (
                <li key={v.symbol}>
                  <Math tex={v.symbol} /> = {v.meaning}
                </li>
              ))}
            </ul>
            <p className="small">{f.explanation}</p>
          </div>
        );
      })}
      <Link to={`/calculator?shape=${shape.id}`} className="btn btn-secondary btn-sm">
        Open in calculator →
      </Link>
    </article>
  );
}
