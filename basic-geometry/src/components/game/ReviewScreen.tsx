import { useEffect, useRef } from 'react';
import { getFormula } from '../../data/formulas';
import { getLevel, LEVELS, modeTitle, type ModeId } from '../../data/levels';
import { CATEGORIES, getShape } from '../../data/shapes';
import type { Formula } from '../../data/types';
import { describe, explainMistake } from '../../lib/explain';
import { buildReview, type GameState, type ReviewRow } from '../../lib/game';
import { DownloadButton } from '../common';
import { Math } from '../Math';
import { ShapeIllustration } from '../ShapeIllustration';

interface Props {
  game: GameState;
  onStart: (mode: ModeId, level?: number) => void;
  onMenu: () => void;
}

/** A labelled diagram + formula + what each letter means, so letters like a and b are never a mystery. */
function FormulaFigure({ formula, kind, heading }: { formula: Formula; kind: 'wrong' | 'right'; heading: string }) {
  const shape = getShape(formula.shapeId);
  return (
    <figure className={`figure figure-${kind}`}>
      <figcaption className="figure-head">
        <span className="figure-mark" aria-hidden="true">{kind === 'wrong' ? '✗' : '✓'}</span> {heading}
      </figcaption>
      <div className="figure-body">
        <ShapeIllustration
          shape={formula.shapeId}
          labelled
          formulaId={formula.id}
          className="figure-svg"
          title={`${shape?.name ?? 'Shape'} with its measurements labelled`}
        />
        <div>
          <Math tex={formula.tex} label={formula.plain} className="figure-math" />
          <p className="figure-what">This is {describe(formula)}.</p>
          <ul className="var-list">
            {formula.variables.map((v) => (
              <li key={v.symbol}>
                <Math tex={v.symbol} /> = {v.meaning}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}

function ResultPill({ row }: { row: ReviewRow }) {
  if (row.outcome === 'first-try') return <span className="pill pill-good">✓ Correct first time</span>;
  if (row.outcome === 'after-mistakes')
    return (
      <span className="pill pill-mixed">
        ✓ Correct after {row.incorrect.length} mistake{row.incorrect.length === 1 ? '' : 's'}
      </span>
    );
  return <span className="pill pill-bad">– Not answered</span>;
}

export function ReviewScreen({ game, onStart, onMenu }: Props) {
  const { rows, summary } = buildReview(game);
  const { round } = game;
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  const nextLevel = round.mode === 'levels' && round.level ? getLevel(round.level + 1) : undefined;
  const heading =
    game.status === 'abandoned' ? 'Round ended' : round.mode === 'levels' ? `Level ${round.level} complete!` : `${modeTitle(round.mode)} complete!`;

  // One entry per (question, wrong formula) pair, in the order the mistakes were made.
  const toReview: { questionId: string; chosenId: string; times: number }[] = [];
  for (const r of rows)
    for (const m of r.incorrect) {
      const existing = toReview.find((x) => x.questionId === r.questionId && x.chosenId === m.chosenId);
      if (existing) existing.times++;
      else toReview.push({ questionId: r.questionId, chosenId: m.chosenId, times: 1 });
    }

  return (
    <div className="review">
      <div className="page-header">
        <div>
          <h1 ref={headingRef} tabIndex={-1}>
            {heading}
          </h1>
          <p className="lead">
            {summary.perfect
              ? 'Every pair matched on the first try — excellent work.'
              : 'Here is how the round went. Check the formulas you mixed up and why.'}
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" onClick={() => onStart(round.mode, round.level ?? undefined)}>
            Play again
          </button>
          {round.mode === 'levels' && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!nextLevel}
              onClick={() => nextLevel && onStart('levels', nextLevel.number)}
              title={nextLevel ? undefined : 'This is the last level'}
            >
              {nextLevel ? 'Next level →' : `Level ${LEVELS.length} is the last level`}
            </button>
          )}
        </div>
      </div>

      <div className="stat-row card">
        <div className="stat">
          <span className="stat-value">
            {summary.pairsCompleted} / {summary.totalPairs}
          </span>
          <span className="stat-label">Pairs completed</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.questionsFirstTry}</span>
          <span className="stat-label">Right first time</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.questionsWithMistakes}</span>
          <span className="stat-label">Questions with mistakes</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.incorrectAttempts}</span>
          <span className="stat-label">Incorrect attempts</span>
        </div>
        {summary.questionsUnanswered > 0 && (
          <div className="stat">
            <span className="stat-value">{summary.questionsUnanswered}</span>
            <span className="stat-label">Not answered</span>
          </div>
        )}
      </div>

      <section className="card table-card" aria-labelledby="review-table-h">
        <h2 id="review-table-h" className="sr-only">
          Answer review
        </h2>
        <table className="review-table">
          <thead>
            <tr>
              <th scope="col">Shape / requirement</th>
              <th scope="col">Category</th>
              <th scope="col">Incorrect selections</th>
              <th scope="col">Correct formula</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const f = getFormula(r.questionId)!;
              return (
                <tr key={r.questionId} className={`row-${r.outcome}`}>
                  <th scope="row" data-label="Question">
                    <span className="cell-shape">
                      <ShapeIllustration shape={f.shapeId} className="cell-icon" />
                      {f.question}
                    </span>
                  </th>
                  <td data-label="Category">{CATEGORIES[f.category].label}</td>
                  <td data-label="Incorrect selections">
                    {r.incorrect.length === 0 ? (
                      <span className="muted">None</span>
                    ) : (
                      <ul className="wrong-list">
                        {r.incorrect.map((m) => {
                          const w = getFormula(m.chosenId);
                          return (
                            <li key={m.order}>
                              <span className="wrong-mark" aria-hidden="true">✗</span>
                              <span className="wrong-item">
                                {w ? <Math tex={w.tex} label={w.plain} /> : 'Unknown formula'}
                                {w && <span className="wrong-caption">= {describe(w)}</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </td>
                  <td data-label="Correct formula">
                    <Math tex={f.tex} label={f.plain} />
                  </td>
                  <td data-label="Result">
                    <ResultPill row={r} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="section" aria-labelledby="to-review-h">
        <h2 id="to-review-h">Formulas to review</h2>
        {toReview.length === 0 ? (
          <div className="alert alert-success">
            <strong>✓ No mistakes recorded this round.</strong>{' '}
            {summary.questionsUnanswered > 0 ? 'Some questions were left unanswered — try them in the next round.' : 'Nice work!'}
          </div>
        ) : (
          <div className="review-list">
            {toReview.map(({ questionId, chosenId, times }) => {
              const q = getFormula(questionId)!;
              const c = getFormula(chosenId);
              return (
                <article key={`${questionId}-${chosenId}`} className="card review-item">
                  <p className="review-q">
                    <span className="review-q-label">Question</span> {q.question}
                  </p>
                  <div className="compare">
                    {c ? (
                      <FormulaFigure formula={c} kind="wrong" heading={`Your selection${times > 1 ? ` (chosen ${times} times)` : ''}`} />
                    ) : (
                      <div className="figure figure-wrong">Unknown formula</div>
                    )}
                    <FormulaFigure formula={q} kind="right" heading="Correct formula" />
                  </div>
                  <p className="explanation">
                    <strong>Why: </strong>
                    {explainMistake(questionId, chosenId).review}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="review-actions card">
        <button type="button" className="btn btn-primary" onClick={() => onStart(round.mode, round.level ?? undefined)}>
          Play again
        </button>
        {round.mode === 'levels' && (
          <button type="button" className="btn btn-secondary" disabled={!nextLevel} onClick={() => nextLevel && onStart('levels', nextLevel.number)}>
            Next level
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={() => onStart('mistakes', round.mode === 'levels' ? round.level ?? undefined : undefined)}>
          Practise my mistakes
        </button>
        <button type="button" className="btn btn-ghost" onClick={onMenu}>
          Return to menu
        </button>
        <DownloadButton compact />
      </div>
    </div>
  );
}
