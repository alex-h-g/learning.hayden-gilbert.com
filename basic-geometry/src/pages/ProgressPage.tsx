import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, ResetProgressButton } from '../components/common';
import { Math } from '../components/Math';
import { getFormula } from '../data/formulas';
import { CATEGORIES } from '../data/shapes';
import { accuracy } from '../lib/historyTypes';
import { needsPractice, recentlyPractised, summarise, type SortKey } from '../lib/progress';
import { useHistory } from '../lib/useHistory';
import { Stat } from './HomePage';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'most-incorrect', label: 'Most incorrect attempts' },
  { id: 'lowest-accuracy', label: 'Lowest accuracy' },
  { id: 'most-recent', label: 'Most recently wrong' },
];

const dateFmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Only show a percentage once a formula has been asked a few times. */
const MIN_FOR_PERCENT = 3;

export function ProgressPage() {
  const snap = useHistory();
  const { data } = snap;
  const [sort, setSort] = useState<SortKey>('most-incorrect');
  const summary = summarise(data);
  const weak = needsPractice(data, sort);
  const recent = recentlyPractised(data);

  return (
    <>
      <PageHeader
        title="Your progress"
        intro="See which formulas need more practice. Progress is saved only in this browser on this device."
        actions={<ResetProgressButton className="btn btn-danger-outline" label="Clear saved history" />}
      />

      <div className="alert alert-info">
        <strong>Stored locally, not online.</strong> There’s no account: your history lives in this browser’s storage. It won’t follow you to
        another device or browser, isn’t backed up, and is removed if you clear your browser data or press “Clear saved history”.
        {!snap.persistent && ' Right now progress cannot be saved, so it will be lost when you close this page.'}
      </div>

      {!summary.hasData ? (
        <section className="card empty-state">
          <h2>No progress yet</h2>
          <p>Play a round of Pick a Pair and your results will appear here — including the formulas you mix up most often.</p>
          <Link to="/play" className="btn btn-primary">
            Start playing
          </Link>
        </section>
      ) : (
        <>
          <div className="stat-row card">
            <Stat label="Formulas practised" value={summary.formulasPractised} />
            <Stat label="Questions answered" value={summary.questionsAnswered} />
            <Stat label="Right first time" value={summary.questionsFirstTry} />
            <Stat label="Incorrect attempts" value={summary.incorrectAttempts} />
            <Stat label="Rounds played" value={summary.sessionsPlayed} />
          </div>
          <p className="small muted">
            “Questions answered” counts finished questions; “incorrect attempts” counts every wrong formula chosen, so one question can have several.
          </p>

          <section className="section card" aria-labelledby="weak-h">
            <div className="section-head">
              <h2 id="weak-h">Formulas that need more practice</h2>
              <label className="field-inline">
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {weak.length === 0 ? (
              <p className="alert alert-success">✓ No mistakes recorded — every formula you’ve tried was matched first time.</p>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Formula</th>
                        <th scope="col">Category</th>
                        <th scope="col">Incorrect attempts</th>
                        <th scope="col">Right first time</th>
                        <th scope="col">Rounds with mistakes</th>
                        <th scope="col">Last wrong</th>
                        <th scope="col">Latest result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weak.map((s) => {
                        const f = getFormula(s.id)!;
                        const acc = accuracy(s);
                        return (
                          <tr key={s.id}>
                            <th scope="row" data-label="Formula">
                              <div>{f.question}</div>
                              <Math tex={f.tex} label={f.plain} className="small-math" />
                            </th>
                            <td data-label="Category">{CATEGORIES[f.category].label}</td>
                            <td data-label="Incorrect attempts">{s.incorrectAttempts}</td>
                            <td data-label="Right first time">
                              {s.firstTryCorrect} of {s.timesTested}
                              {acc !== null && s.timesTested >= MIN_FOR_PERCENT && <span className="muted"> ({Math_round(acc * 100)}%)</span>}
                            </td>
                            <td data-label="Rounds with mistakes">{s.sessionsWithMistakes}</td>
                            <td data-label="Last wrong">{dateFmt(s.lastIncorrectAt)}</td>
                            <td data-label="Latest result">
                              {s.mostRecentOutcome === 'first-try' ? (
                                <span className="pill pill-good">✓ First time</span>
                              ) : s.mostRecentOutcome === 'after-mistakes' ? (
                                <span className="pill pill-mixed">✓ After mistakes</span>
                              ) : s.mostRecentOutcome === 'unanswered' ? (
                                <span className="pill pill-bad">– Unanswered</span>
                              ) : (
                                <span className="muted">In progress</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="small muted">Percentages appear once a formula has been asked at least {MIN_FOR_PERCENT} times.</p>
                <Link to="/play?mode=mistakes" className="btn btn-primary">
                  Practise my mistakes
                </Link>
              </>
            )}
          </section>

          <div className="two-col">
            <section className="card" aria-labelledby="cat-h">
              <h2 id="cat-h">Mistakes by category</h2>
              {summary.categoryMistakes.length === 0 ? (
                <p className="muted">No mistakes in any category.</p>
              ) : (
                <ul className="bar-list">
                  {summary.categoryMistakes.map((c) => (
                    <li key={c.category}>
                      <span>{CATEGORIES[c.category].label}</span>
                      <span className="bar" aria-hidden="true">
                        <span style={{ width: `${(c.incorrect / summary.categoryMistakes[0].incorrect) * 100}%` }} />
                      </span>
                      <span className="bar-n">
                        {c.incorrect} <span className="sr-only">incorrect attempts</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card" aria-labelledby="recent-h">
              <h2 id="recent-h">Recently practised</h2>
              <ul className="recent-list">
                {recent.map((s) => {
                  const f = getFormula(s.id)!;
                  return (
                    <li key={s.id}>
                      <span>{f.question}</span>
                      <span className="muted small">{dateFmt(s.lastPractisedAt)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}

const Math_round = globalThis.Math.round;
