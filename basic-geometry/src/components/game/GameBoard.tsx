import { useEffect, useRef } from 'react';
import { getFormula } from '../../data/formulas';
import { LEVELS, modeTitle } from '../../data/levels';
import { CATEGORIES } from '../../data/shapes';
import { explainMistake } from '../../lib/explain';
import type { GameState } from '../../lib/game';
import { ProgressBar } from '../common';
import { Math } from '../Math';
import { ShapeIllustration } from '../ShapeIllustration';

interface Props {
  game: GameState;
  onSelect: (id: string) => void;
  onChoose: (id: string) => void;
  onEndEarly: () => void;
  onQuit: () => void;
}

const isNarrow = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 760px)').matches;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function GameBoard({ game, onSelect, onChoose, onEndEarly, onQuit }: Props) {
  const { round, selected, matched, feedback } = game;
  const total = round.questionIds.length;
  const optionsRef = useRef<HTMLElement>(null);
  const questionsRef = useRef<HTMLElement>(null);
  const title = round.mode === 'levels' ? 'Pick a Pair' : modeTitle(round.mode);
  const lastMatched = matched[matched.length - 1];

  // On phones the columns are stacked: bring the formulas into view after
  // choosing a question, and the questions back after a correct match.
  const prevSelected = useRef<string | null>(null);
  useEffect(() => {
    if (!isNarrow()) return;
    const behavior = reducedMotion() ? 'auto' : 'smooth';
    if (selected && selected !== prevSelected.current) optionsRef.current?.scrollIntoView({ behavior, block: 'start' });
    if (!selected && prevSelected.current && feedback?.kind === 'correct') questionsRef.current?.scrollIntoView({ behavior, block: 'start' });
    prevSelected.current = selected;
  }, [selected, feedback]);

  const selectedFormula = selected ? getFormula(selected) : undefined;

  let message: JSX.Element;
  let tone = 'info';
  if (feedback?.kind === 'incorrect') {
    tone = 'error';
    message = (
      <>
        <strong>✗ {explainMistake(feedback.questionId, feedback.chosenId).inGame}</strong> Try another formula.
      </>
    );
  } else if (feedback?.kind === 'correct') {
    tone = 'success';
    message = (
      <>
        <strong>✓ Correct!</strong> {getFormula(feedback.questionId)!.question} matched. {matched.length < total ? 'Choose the next shape or description.' : ''}
      </>
    );
  } else if (feedback?.kind === 'need-question') {
    tone = 'warn';
    message = <>Choose a shape or description on the left first, then pick its formula.</>;
  } else if (selectedFormula) {
    message = (
      <>
        Now choose the formula for: <strong>{selectedFormula.question}</strong>
      </>
    );
  } else {
    message = <>Step 1: choose a shape or description on the left. The correct formula uses the letters on its diagram.</>;
  }

  return (
    <div className="game">
      <section className="card matched-strip" aria-labelledby="matched-h">
        <h2 id="matched-h" className="matched-title">
          Matched pairs ({matched.length} / {total})
        </h2>
        <ol className="matched-slots">
          {round.questionIds.map((_, i) => {
            const id = matched[i];
            const f = id ? getFormula(id) : undefined;
            return (
              <li key={i} className={`matched-slot ${f ? 'filled' : ''} ${id && id === lastMatched ? 'just-matched' : ''}`}>
                {f ? (
                  <>
                    <ShapeIllustration shape={f.shapeId} className="slot-icon" />
                    <span className="slot-q">{f.question}</span>
                    <Math tex={f.tex} label={f.plain} className="slot-math" />
                  </>
                ) : (
                  <span className="sr-only">Empty</span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="game-head">
        <div>
          <h1>{title}</h1>
          <p className="lead">Match each shape or description with the correct formula, using the letters shown on its diagram.</p>
        </div>
        <div className="game-progress">
          <div className="game-progress-text">
            <span>{round.mode === 'levels' ? `Level ${round.level} of ${LEVELS.length}` : 'Practice round'}</span>
            <span>
              Matched pairs: {matched.length} / {total}
            </span>
          </div>
          <ProgressBar value={matched.length} max={total} label="Matched pairs" />
        </div>
      </div>

      <div className={`feedback feedback-${tone}`} role="status" aria-live="polite">
        {message}
      </div>

      <div className="board">
        <section ref={questionsRef} className="column column-questions" aria-labelledby="q-h">
          <h2 id="q-h" className="column-title">
            <span className="step">1</span> Shapes / descriptions
          </h2>
          <div className="card-grid questions">
            {round.questionIds.map((id) => {
              const f = getFormula(id)!;
              const isMatched = matched.includes(id);
              if (isMatched) {
                return (
                  <div key={id} className="tile tile-ghost" aria-label={`${f.question} — matched`}>
                    <span aria-hidden="true">✓ Matched</span>
                  </div>
                );
              }
              const isSelected = selected === id;
              const wrongNow = feedback?.kind === 'incorrect' && feedback.questionId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`tile tile-question ${isSelected ? 'is-selected' : ''} ${wrongNow ? 'shake' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(id)}
                >
                  <ShapeIllustration
                    shape={f.shapeId}
                    labelled
                    formulaId={f.id}
                    className="tile-diagram"
                    title={`${f.question}: diagram labelled ${f.variables.map((v) => v.symbol.replace('\\pi', 'π')).filter((x) => x !== 'π').join(', ')}`}
                  />
                  <span className="tile-text">
                    {f.question}
                    <span className="tile-cat">{CATEGORIES[f.category].label}</span>
                  </span>
                  {isSelected && <span className="tile-badge" aria-hidden="true">Selected</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section ref={optionsRef} className={`column column-options ${selected ? 'is-active' : ''}`} aria-labelledby="o-h">
          <h2 id="o-h" className="column-title">
            <span className="step">2</span> Formula options
          </h2>
          <div className="card-grid options">
            {round.optionIds.map((id) => {
              const f = getFormula(id)!;
              if (matched.includes(id)) {
                return <div key={id} className="tile tile-option tile-ghost" aria-hidden="true" />;
              }
              const wrong = feedback?.kind === 'incorrect' && feedback.chosenId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`tile tile-option ${wrong ? 'is-wrong' : ''}`}
                  onClick={() => onChoose(id)}
                  aria-label={`Formula: ${f.plain}${wrong ? ' — incorrect for this question' : ''}`}
                >
                  <Math tex={f.tex} className="option-math" />
                  {wrong && <span className="tile-x" aria-hidden="true">✗</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="game-footer">
        <button type="button" className="btn btn-ghost" onClick={onQuit}>
          ← Back to menu
        </button>
        <button type="button" className="btn btn-secondary" onClick={onEndEarly}>
          End round &amp; review
        </button>
      </div>
    </div>
  );
}
