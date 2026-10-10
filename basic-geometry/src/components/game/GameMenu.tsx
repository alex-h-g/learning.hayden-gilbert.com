import { useState } from 'react';
import { LEVELS, PRACTICE_MODES, type ModeId } from '../../data/levels';
import { mistakeFormulaIds } from '../../lib/rounds';
import { useHistory } from '../../lib/useHistory';
import { DownloadButton, PageHeader, ResetProgressButton } from '../common';
import { ShapeIllustration } from '../ShapeIllustration';
import type { ShapeId } from '../../data/types';

const MODE_ICON: Record<string, ShapeId> = {
  area: 'square',
  perimeter: 'circle',
  'mixed-2d': 'trapezoid',
  '3d': 'cylinder',
  mixed: 'cone',
  mistakes: 'triangle',
};

export function GameMenu({ onStart }: { onStart: (mode: ModeId, level?: number) => void }) {
  const { data } = useHistory();
  const mistakeCount = mistakeFormulaIds(data.stats).length;
  const [fillLevel, setFillLevel] = useState(LEVELS.length);

  return (
    <>
      <PageHeader
        title="Pick a Pair"
        intro="Choose a shape or description on the left, then pick its formula on the right. Every wrong pick is recorded and explained at the end of the round."
        actions={<DownloadButton compact />}
      />

      <section aria-labelledby="levels-h" className="section">
        <h2 id="levels-h">Levels</h2>
        <div className="level-grid">
          {LEVELS.map((l) => (
            <div key={l.number} className="card level-card">
              <div className="level-num" aria-hidden="true">{l.number}</div>
              <div>
                <h3>
                  Level {l.number}: {l.title}
                </h3>
                <p>{l.description}</p>
                <p className="muted small">{l.pairs} pairs to match</p>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => onStart('levels', l.number)} aria-label={`Start level ${l.number}: ${l.title}`}>
                Start
              </button>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="practice-h" className="section">
        <h2 id="practice-h">Practice modes</h2>
        <div className="mode-grid">
          {PRACTICE_MODES.map((m) => {
            const isMistakes = m.id === 'mistakes';
            return (
              <div key={m.id} className={`card mode-card ${isMistakes ? 'mode-card-mistakes' : ''}`}>
                <ShapeIllustration shape={MODE_ICON[m.id]} className="mode-icon" />
                <h3>{m.title}</h3>
                <p>{m.description}</p>
                {isMistakes && (
                  <>
                    <p className="small muted">
                      {mistakeCount === 0
                        ? 'No mistakes recorded yet — you’ll get a mixed round for now.'
                        : `${mistakeCount} formula${mistakeCount === 1 ? '' : 's'} to work on.`}
                    </p>
                    <label className="small field-inline">
                      Extra questions from
                      <select value={fillLevel} onChange={(e) => setFillLevel(Number(e.target.value))}>
                        {LEVELS.map((l) => (
                          <option key={l.number} value={l.number}>
                            Level {l.number}{l.number < LEVELS.length ? ' and below' : ' (all)'}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <button
                  type="button"
                  className={`btn ${isMistakes ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => onStart(m.id, isMistakes ? fillLevel : undefined)}
                  aria-label={`Play ${m.title}`}
                >
                  Play
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="reset-h" className="section card reset-card">
        <div>
          <h2 id="reset-h">Sharing this computer?</h2>
          <p>
            Progress is saved in this browser so the game can focus on the formulas you find hardest. If someone else is about to play, reset it so
            they start fresh.
          </p>
        </div>
        <div className="reset-actions">
          <ResetProgressButton className="btn btn-danger-outline" label="Reset progress" />
        </div>
      </section>
    </>
  );
}
