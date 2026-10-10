import { Link } from 'react-router-dom';
import { DownloadButton } from '../components/common';
import { ShapeIllustration } from '../components/ShapeIllustration';
import { getFormula } from '../data/formulas';
import { summarise, needsPractice } from '../lib/progress';
import { useHistory } from '../lib/useHistory';

export function HomePage() {
  const { data } = useHistory();
  const summary = summarise(data);
  const weakest = needsPractice(data, 'most-incorrect').slice(0, 3);

  return (
    <>
      <section className="hero card">
        <div className="hero-text">
          <p className="eyebrow">Free interactive maths resource</p>
          <h1>Basic Geometry</h1>
          <p className="lead">
            Learn, practise and remember the formulas you need for shapes and solids — with a matching game that explains your mistakes, a
            step-by-step calculator and a printable cheat sheet.
          </p>
          <ul className="learn-list">
            <li>Areas and perimeters of 2D shapes</li>
            <li>Circumference of circles</li>
            <li>Volumes of 3D shapes</li>
            <li>Surface areas of 3D shapes</li>
            <li>Metric measurement and area-unit conversion</li>
          </ul>
          <div className="hero-actions">
            <Link to="/play" className="btn btn-primary btn-lg">Start learning →</Link>
            <DownloadButton />
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          {(['circle', 'square', 'triangle', 'cylinder', 'cone', 'cube'] as const).map((s) => (
            <ShapeIllustration key={s} shape={s} className="hero-shape" />
          ))}
        </div>
      </section>

      <section aria-labelledby="explore" className="section">
        <h2 id="explore">Explore</h2>
        <div className="feature-grid">
          <FeatureCard to="/play" shape="square" title="Pick a Pair" text="Match each shape or description with its formula across three levels. Every wrong pick is explained." cta="Play" />
          <FeatureCard to="/calculator" shape="cylinder" title="Formula Calculator" text="Choose a shape, enter measurements in mm, cm or m, and see the formula worked through." cta="Calculate" />
          <FeatureCard to="/play?mode=mistakes" shape="triangle" title="Practise My Mistakes" text="Rounds built from the formulas you’ve found hardest, so revision goes where it’s needed." cta="Practise" />
          <FeatureCard to="/formulas" shape="sphere" title="Formula Reference" text="Every formula with diagrams, variable meanings and notes on common confusions." cta="Browse" />
        </div>
      </section>

      <section aria-labelledby="your-progress" className="section card progress-summary">
        <div className="progress-summary-head">
          <h2 id="your-progress">Your progress</h2>
          <Link to="/progress" className="btn btn-secondary btn-sm">View dashboard</Link>
        </div>
        {summary.hasData ? (
          <>
            <div className="stat-row">
              <Stat label="Formulas practised" value={summary.formulasPractised} />
              <Stat label="Questions answered" value={summary.questionsAnswered} />
              <Stat label="Right first time" value={summary.questionsFirstTry} />
              <Stat label="Incorrect attempts" value={summary.incorrectAttempts} />
            </div>
            {weakest.length > 0 && (
              <p className="muted">
                Worth another look:{' '}
                {weakest.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ', '}
                    {getFormula(s.id)!.question.toLowerCase()}
                  </span>
                ))}
                . <Link to="/play?mode=mistakes">Practise these →</Link>
              </p>
            )}
          </>
        ) : (
          <p className="muted">Your progress will appear here once you’ve played a round. It’s saved only in this browser — no account needed.</p>
        )}
      </section>
    </>
  );
}

function FeatureCard({ to, shape, title, text, cta }: { to: string; shape: Parameters<typeof ShapeIllustration>[0]['shape']; title: string; text: string; cta: string }) {
  return (
    <Link to={to} className="card feature-card">
      <ShapeIllustration shape={shape} className="feature-icon" />
      <h3>{title}</h3>
      <p>{text}</p>
      <span className="feature-cta">{cta} →</span>
    </Link>
  );
}

export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
