import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Pose } from '../content/types';
import { DEMO } from '../content/demoDialogue';
import { demoGeometry, tileAt, tilePlan, type SquareOnSide, type V } from '../math/pythagorasDemo';
import { parseAnswer } from '../math/parse';
import { updateDemo } from '../lib/progress';
import { GinaSays } from './Gina';
import { Math as TeX } from './Math';
import { Rich } from './Rich';

const DEMO_ID = 'pythagoras-squares';

type Screen = 'intro' | 'spot' | 'squared' | 'squares' | 'explore' | 'combine' | 'discover' | 'formula';
const SCREENS: { id: Screen; label: string }[] = [
  { id: 'intro', label: 'The formula' },
  { id: 'spot', label: 'Spot the hypotenuse' },
  { id: 'squared', label: 'What is “squared”?' },
  { id: 'squares', label: 'Three squares' },
  { id: 'explore', label: 'Count the tiles' },
  { id: 'combine', label: 'Put them together' },
  { id: 'discover', label: 'What do you notice?' },
  { id: 'formula', label: 'Back to the formula' },
];

type SqId = 'a' | 'b' | 'c';
const SQ_NAME: Record<SqId, string> = { a: 'blue', b: 'orange', c: 'green' };
const SQ_N: Record<SqId, number> = { a: 9, b: 16, c: 25 };

/** Animation stages for the central demonstration. */
type Stage = 'ready' | 'blue' | 'orange' | 'count' | 'move' | 'done';
const STAGE_ORDER: Stage[] = ['ready', 'blue', 'orange', 'count', 'move', 'done'];
const STAGE_MS: Partial<Record<Stage, number>> = { blue: 1400, orange: 1400, count: 1600 };
const MOVE_MS = 6500;

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

// ───────────────────────── Drawing ─────────────────────────

const S = 40; // px per unit
const OX = 4; // unit offsets so every square fits on the board
const OY = 8;
const VIEW = { w: 12 * S, h: 13 * S };
const P = (v: V) => ({ x: (v.x + OX) * S, y: (OY - v.y) * S });
const pts = (vs: V[]) => vs.map((v) => `${P(v).x},${P(v).y}`).join(' ');

interface BoardProps {
  showSquares: boolean;
  sideLabels: 'numbers' | 'letters';
  /** Which square's tiles are lit up. */
  lit: SqId | null;
  /** Numbered cells for counting mode: square and how many are numbered so far. */
  counting: { sq: SqId; n: number } | null;
  /** Moving tiles: overall progress 0–1, or null when not shown. */
  progress: number | null;
  /** Fade the blue and orange squares once their tiles have been copied across. */
  fadeSources: boolean;
  /** Show the green square as 25 empty cells waiting to be filled. */
  greenEmpty?: boolean;
  onSquare?: (sq: SqId) => void;
  onSide?: (side: 'a' | 'b' | 'c') => void;
  sideState?: Partial<Record<'a' | 'b' | 'c', 'right' | 'wrong'>>;
  showSquareLabels: boolean;
}

function Board({ showSquares, sideLabels, lit, counting, progress, fadeSources, greenEmpty = false, onSquare, onSide, sideState = {}, showSquareLabels }: BoardProps) {
  const g = useMemo(() => demoGeometry(), []);
  const plan = useMemo(() => tilePlan(g), [g]);
  const { R, A, B } = g;
  const sides: { id: 'a' | 'b' | 'c'; p: V; q: V; len: number; label: V }[] = [
    { id: 'a', p: R, q: A, len: 3, label: { x: 0, y: 1.5 } },
    { id: 'b', p: R, q: B, len: 4, label: { x: 2, y: 0 } },
    { id: 'c', p: A, q: B, len: 5, label: { x: 2, y: 1.5 } },
  ];
  // Square labels sit towards the outer edge, clear of the side labels.
  const labelAt = (sq: SquareOnSide): V => {
    if (sq.id === 'c') return sq.centre;
    const mid = { x: (sq.corners[0].x + sq.corners[1].x) / 2, y: (sq.corners[0].y + sq.corners[1].y) / 2 };
    return { x: sq.centre.x + (sq.centre.x - mid.x) * 0.3, y: sq.centre.y + (sq.centre.y - mid.y) * 0.3 };
  };
  const squareGroup = (sq: SquareOnSide, colour: string) => {
    const isLit = lit === sq.id;
    const faded = fadeSources && sq.id !== 'c';
    const neutral = sq.id === 'c' && (progress !== null || greenEmpty);
    const label = `${sq.id === 'a' ? 'Blue square on side a = 3: 3 by 3, 9 unit squares' : sq.id === 'b' ? 'Orange square on side b = 4: 4 by 4, 16 unit squares' : 'Green square on the hypotenuse c = 5: 5 by 5, 25 unit squares'}`;
    return (
      <g
        key={sq.id}
        className={`dsq dsq-${colour} ${isLit ? 'lit' : ''} ${faded ? 'faded' : ''} ${onSquare ? 'clickable' : ''}`}
        data-square={sq.id}
        role={onSquare ? 'button' : undefined}
        tabIndex={onSquare ? 0 : undefined}
        aria-label={onSquare ? `${label}. Select to count.` : undefined}
        onClick={onSquare ? () => onSquare(sq.id) : undefined}
        onKeyDown={
          onSquare
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSquare(sq.id);
                }
              }
            : undefined
        }
      >
        <polygon className="dsq-outline" points={pts(sq.corners)} />
        {sq.cells.map((cell, k) => (
          <polygon key={k} className={`dcell ${neutral ? 'neutral' : ''}`} data-cell={k} points={pts(cell.corners)} />
        ))}
        {showSquareLabels && (
          <g className="dsq-label" pointerEvents="none">
            <rect x={P(labelAt(sq)).x - 36} y={P(labelAt(sq)).y - 14} width={72} height={28} rx={14} />
            <text x={P(labelAt(sq)).x} y={P(labelAt(sq)).y} textAnchor="middle" dominantBaseline="central">
              {sq.id}² = {sq.side * sq.side}
            </text>
          </g>
        )}
      </g>
    );
  };
  const arrived = progress === null ? [] : plan.map((t) => tileAt(t, progress).arrived);
  return (
    <svg className="pyth-board" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={boardDescription(showSquares, progress, arrived)}>
      {showSquares && (
        <>
          {squareGroup(g.squares.a, 'blue')}
          {squareGroup(g.squares.b, 'orange')}
          {squareGroup(g.squares.c, 'green')}
        </>
      )}
      <polygon className="dtri" points={pts([R, A, B])} />
      <path className="dright" d={`M${P({ x: 0.35, y: 0 }).x},${P({ x: 0.35, y: 0 }).y} L${P({ x: 0.35, y: 0.35 }).x},${P({ x: 0.35, y: 0.35 }).y} L${P({ x: 0, y: 0.35 }).x},${P({ x: 0, y: 0.35 }).y}`} />
      {sides.map((s) => (
        <g key={s.id}>
          {onSide && (
            <line
              className={`dside-hit ${sideState[s.id] ?? ''}`}
              x1={P(s.p).x}
              y1={P(s.p).y}
              x2={P(s.q).x}
              y2={P(s.q).y}
              onClick={() => onSide(s.id)}
              data-side={s.id}
            />
          )}
          {sideState[s.id] && <line className={`dside-mark ${sideState[s.id]}`} x1={P(s.p).x} y1={P(s.p).y} x2={P(s.q).x} y2={P(s.q).y} />}
        </g>
      ))}
      {progress !== null &&
        plan.map((t, k) => {
          const at = tileAt(t, progress);
          const c = P(at.centre);
          return (
            <g
              key={t.key}
              className={`dtile dtile-${t.colour} ${arrived[k] ? 'arrived' : ''}`}
              data-tile={t.key}
              data-colour={t.colour}
              data-target={t.target}
              data-arrived={arrived[k] ? 'yes' : 'no'}
              transform={`translate(${c.x} ${c.y}) rotate(${-at.angle})`}
            >
              <rect x={-S * 0.46} y={-S * 0.46} width={S * 0.92} height={S * 0.92} rx={3} />
            </g>
          );
        })}
      {counting && (
        <g className="dcount-layer" pointerEvents="none">
          {g.squares[counting.sq].cells.slice(0, counting.n).map((cell, k) => (
            <text key={k} className="dcount" x={P(cell.centre).x} y={P(cell.centre).y} textAnchor="middle" dominantBaseline="central">
              {k + 1}
            </text>
          ))}
        </g>
      )}
      {sides.map((s) => (
        <g key={`pill-${s.id}`} className={`dside-pill side-${s.id}`} pointerEvents="none">
          <rect x={P(s.label).x - (sideLabels === 'letters' ? 29 : 18)} y={P(s.label).y - 14} width={sideLabels === 'letters' ? 58 : 36} height={28} rx={14} />
          <text x={P(s.label).x} y={P(s.label).y} textAnchor="middle" dominantBaseline="central">
            {sideLabels === 'letters' ? `${s.id} = ${s.len}` : s.len}
          </text>
        </g>
      ))}
    </svg>
  );
}

function boardDescription(showSquares: boolean, progress: number | null, arrived: boolean[]) {
  if (!showSquares) return 'A right-angled triangle with sides 3, 4 and 5. A small square marks the right angle between the sides of length 3 and 4.';
  const base = 'A right-angled triangle with sides 3, 4 and 5, and a square drawn outside each side: a blue 3 by 3 square (9 unit squares), an orange 4 by 4 square (16 unit squares) and a green 5 by 5 square on the hypotenuse (25 unit squares).';
  if (progress === null) return base;
  const n = arrived.filter(Boolean).length;
  return `${base} ${n} of 25 tiles have moved into the green square${n === 25 ? ': 16 orange tiles fill a 4 by 4 block and 9 blue tiles fill the L-shaped strip beside it, with no gaps or overlaps.' : '.'}`;
}

/** A plain n × n square of tiles for the "what does squared mean" step. */
function GridSquare({ n, colour }: { n: number; colour: 'blue' | 'orange' | 'green' }) {
  const s = 34;
  return (
    <svg className="sq-grid" viewBox={`0 0 ${n * s + 4} ${n * s + 4}`} width={Math.min(n * s + 4, 220)} role="img" aria-label={`A square ${n} tiles wide and ${n} tiles high: ${n * n} tiles.`}>
      {Array.from({ length: n * n }, (_, k) => (
        <rect key={k} className={`dtile-${colour}-fill`} x={2 + (k % n) * s} y={2 + Math.floor(k / n) * s} width={s - 2} height={s - 2} rx={3} />
      ))}
    </svg>
  );
}

// ───────────────────────── The demonstration ─────────────────────────

export function PythagorasDemo({ onDone }: { onDone: () => void }) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [pose, setPose] = useState<Pose>('explaining');
  const [bubble, setBubble] = useState(DEMO.intro);
  const reduced = useMemo(prefersReducedMotion, []);

  // Spot the hypotenuse
  const [sideState, setSideState] = useState<Partial<Record<'a' | 'b' | 'c', 'right' | 'wrong'>>>({});
  const [spotDone, setSpotDone] = useState(false);
  const spotTries = useRef(0);
  // Squared
  const [sqStep, setSqStep] = useState(0); // 0 ask, 1 = 3², 2 = 4², 3 = 5²
  const [sqPick, setSqPick] = useState<string | null>(null);
  // Explore
  const [seen, setSeen] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });
  const [sum, setSum] = useState('');
  const [sumDone, setSumDone] = useState(false);
  const sumTries = useRef(0);
  const [lit, setLit] = useState<SqId | null>(null);
  const [counter, setCounter] = useState<string>('');
  // Counting mode
  const [countingMode, setCountingMode] = useState(false);
  const [counting, setCounting] = useState<{ sq: SqId; n: number } | null>(null);
  // Combine animation
  const [stage, setStage] = useState<Stage>('ready');
  const [progress, setProgress] = useState<number | null>(null);
  const [everDone, setEverDone] = useState(false);
  const [runId, setRunId] = useState(0);
  // Discover + formula
  const [discoverPick, setDiscoverPick] = useState<string | null>(null);
  const [discoverDone, setDiscoverDone] = useState(false);
  const [formulaLine, setFormulaLine] = useState(1);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'bad' | 'info'; text: string } | null>(null);

  const say = (p: Pose, t: string) => {
    setPose(p);
    setBubble(t);
  };
  const hint = (t: string) => {
    updateDemo(DEMO_ID, (d) => (d.hints += 1));
    say('thinking', t);
  };

  useEffect(() => {
    updateDemo(DEMO_ID, (d) => (d.started = true));
  }, []);

  const go = (s: Screen) => {
    setScreen(s);
    setFeedback(null);
    setLit(null);
    setCounter('');
    setCounting(null);
    window.scrollTo(0, 0);
    switch (s) {
      case 'intro':
        say('explaining', DEMO.intro);
        break;
      case 'spot':
        say(spotDone ? 'encouraging' : 'curious', spotDone ? DEMO.spotRight : DEMO.spotAsk);
        break;
      case 'squared':
        say(sqStep === 0 ? 'curious' : 'explaining', [DEMO.squaredAsk, DEMO.squared3, DEMO.squared4, DEMO.squared5][sqStep]);
        break;
      case 'squares':
        say('explaining', DEMO.squaresOn);
        break;
      case 'explore':
        say('curious', sumDone ? DEMO.exploreRight : !seen.a ? DEMO.exploreBlue : !seen.b ? DEMO.exploreOrange : DEMO.exploreSum);
        break;
      case 'combine':
        say(stage === 'done' ? 'cheering' : 'encouraging', stage === 'done' ? DEMO.combineDone : DEMO.combineReady);
        break;
      case 'discover':
        say(discoverDone ? 'encouraging' : 'curious', discoverDone ? DEMO.discoverRight : DEMO.discoverAsk);
        break;
      case 'formula':
        say('explaining', DEMO.formula);
        break;
    }
  };

  // ── Counting (section 7): highlight a square's cells and optionally number them one by one.
  const countTimer = useRef<number | null>(null);
  useEffect(() => () => { if (countTimer.current) window.clearInterval(countTimer.current); }, []);
  const showCount = (sq: SqId) => {
    setLit(sq);
    const total = SQ_N[sq];
    const sizes: Record<SqId, string> = { a: '3 × 3', b: '4 × 4', c: '5 × 5' };
    if (countTimer.current) window.clearInterval(countTimer.current);
    if (countingMode && !reduced) {
      let n = 0;
      setCounting({ sq, n: 0 });
      setCounter(`Counting the ${SQ_NAME[sq]} square…`);
      countTimer.current = window.setInterval(() => {
        n += 1;
        setCounting({ sq, n });
        setCounter(n < total ? `${n}…` : `${sizes[sq]} = ${total} unit squares`);
        if (n >= total && countTimer.current) window.clearInterval(countTimer.current);
      }, 260);
    } else {
      setCounting(countingMode ? { sq, n: total } : null);
      setCounter(`${sizes[sq]} = ${total} unit squares`);
    }
  };

  // ── Central animation: a single timeline, so replaying never duplicates tiles.
  const raf = useRef<number | null>(null);
  const timer = useRef<number | null>(null);
  const stopTimers = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (timer.current) window.clearTimeout(timer.current);
    raf.current = null;
    timer.current = null;
  };
  useEffect(() => stopTimers, []);

  const enterStage = (s: Stage) => {
    setStage(s);
    switch (s) {
      case 'ready':
        setProgress(null);
        setLit(null);
        say('encouraging', DEMO.combineReady);
        break;
      case 'blue':
        setProgress(0);
        setLit('a');
        say('explaining', DEMO.combineBlue);
        break;
      case 'orange':
        setLit('b');
        say('explaining', DEMO.combineOrange);
        break;
      case 'count':
        setLit(null);
        say('explaining', DEMO.combineCount);
        break;
      case 'move':
        say('neutral', DEMO.combineMoveOrange);
        break;
      case 'done':
        setProgress(1);
        setEverDone(true);
        say('cheering', DEMO.combineDone);
        break;
    }
  };

  // Timed playback (skipped when the learner prefers reduced motion).
  useEffect(() => {
    if (reduced || screen !== 'combine') return;
    const next = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1];
    if (stage === 'blue' || stage === 'orange' || stage === 'count') {
      timer.current = window.setTimeout(() => enterStage(next), STAGE_MS[stage]);
    } else if (stage === 'move') {
      const t0 = performance.now();
      let saidBlue = false;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / MOVE_MS);
        setProgress(p);
        if (!saidBlue && p >= 0.47) {
          saidBlue = true;
          say('neutral', DEMO.combineMoveBlue);
        }
        if (p < 1) raf.current = requestAnimationFrame(tick);
        else enterStage('done');
      };
      raf.current = requestAnimationFrame(tick);
    }
    return stopTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, screen, reduced, runId]);

  /** Reduced motion: step through the same stages by hand, with instant changes. */
  const stepManually = () => {
    if (stage === 'move') {
      if ((progress ?? 0) < 0.45) {
        setProgress(0.46);
        say('neutral', DEMO.combineMoveBlue);
      } else enterStage('done');
      return;
    }
    const next = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1];
    if (next === 'move') {
      setStage('move');
      say('neutral', DEMO.combineMoveOrange);
      setProgress(0.46);
      return;
    }
    if (next) enterStage(next);
  };

  const play = () => {
    stopTimers();
    setRunId((r) => r + 1);
    enterStage('blue');
  };
  const resetAnim = () => {
    stopTimers();
    enterStage('ready');
  };

  // ── Answers
  const pickSide = (s: 'a' | 'b' | 'c') => {
    if (spotDone) return;
    spotTries.current += 1;
    if (s === 'c') {
      setSideState({ c: 'right' });
      setSpotDone(true);
      updateDemo(DEMO_ID, (d) => (d.hypotenuse = spotTries.current === 1 ? 'first' : 'help'));
      say('celebrating', DEMO.spotRight);
      setFeedback({ tone: 'ok', text: '✓ The hypotenuse is $c = 5$.' });
    } else {
      setSideState((x) => ({ ...x, [s]: 'wrong' }));
      setFeedback({ tone: 'bad', text: `✗ The side of length ${s === 'a' ? 3 : 4} touches the right angle, so it’s one of the shorter sides.` });
      hint(spotTries.current >= 2 ? DEMO.spotHint2 : DEMO.spotHint);
      setPose('reassuring');
    }
  };
  const explainSpot = () => {
    setSideState({ c: 'right' });
    setSpotDone(true);
    updateDemo(DEMO_ID, (d) => {
      d.hypotenuse = 'help';
      d.hints += 1;
    });
    say('explaining', DEMO.spotExplained);
    setFeedback({ tone: 'info', text: 'The hypotenuse is $c = 5$: opposite the right angle, and the longest side.' });
  };

  const checkSquared = () => {
    if (!sqPick) return setFeedback({ tone: 'info', text: 'Choose an answer first.' });
    if (sqPick === 'ok') {
      setSqStep(1);
      setFeedback({ tone: 'ok', text: '✓ $3^2 = 3 \\times 3 = 9$' });
      say('celebrating', DEMO.squared3);
    } else {
      setFeedback({ tone: 'bad', text: `✗ ${DEMO.squaredWrong[sqPick as keyof typeof DEMO.squaredWrong]}` });
      hint(DEMO.squaredWrong[sqPick as keyof typeof DEMO.squaredWrong]);
      setPose('reassuring');
    }
  };

  const tapExplore = (sq: SqId) => {
    showCount(sq);
    if (sq === 'a' || sq === 'b') setSeen((x) => ({ ...x, [sq]: true }));
  };
  useEffect(() => {
    if (screen !== 'explore' || sumDone) return;
    if (seen.a && seen.b) say('celebrating', DEMO.exploreSum);
    else if (seen.a) say('celebrating', DEMO.exploreOrange);
    else if (seen.b) say('curious', 'That’s the orange one: $4 \\times 4 = 16$. Now tap the **blue** square on the side of length $3$ too.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen.a, seen.b]);

  const checkSum = () => {
    const r = parseAnswer(sum);
    if (!r.ok) return setFeedback({ tone: 'info', text: r.reason === 'empty' ? 'Type your answer, then press Check.' : 'Type a number, like 20.' });
    if (Math.abs(r.parsed.value - 25) < 1e-9) {
      setSumDone(true);
      updateDemo(DEMO_ID, (d) => (d.squaresUnderstood = true));
      setFeedback({ tone: 'ok', text: '✓ $9 + 16 = 25$' });
      say('celebrating', DEMO.exploreRight);
    } else {
      sumTries.current += 1;
      setFeedback({ tone: 'bad', text: `✗ Not quite — ${r.parsed.value} isn’t 9 + 16.` });
      hint(sumTries.current >= 2 ? DEMO.exploreSumHint2 : DEMO.exploreSumHint);
      setPose('reassuring');
    }
  };

  const DISCOVER = [
    { id: 'A', text: 'Their areas add up to the area of the largest square.', ok: true },
    { id: 'B', text: 'Their areas are always equal.', ok: false, why: 'One has 9 tiles and the other has 16, so they aren’t equal.' },
    { id: 'C', text: 'Their areas must be subtracted.', ok: false, why: 'We didn’t take any tiles away — we put them together.' },
    { id: 'D', text: 'Their areas have nothing to do with the triangle.', ok: false, why: 'Each square is built on one of the triangle’s sides, so its area depends on that side.' },
  ];
  const checkDiscover = () => {
    if (!discoverPick) return setFeedback({ tone: 'info', text: 'Choose an answer first.' });
    const o = DISCOVER.find((x) => x.id === discoverPick)!;
    if (o.ok) {
      setDiscoverDone(true);
      updateDemo(DEMO_ID, (d) => (d.discoveryCorrect = true));
      setFeedback({ tone: 'ok', text: '✓ $a^2 + b^2 = c^2$' });
      say('celebrating', DEMO.discoverRight);
    } else {
      setFeedback({ tone: 'bad', text: `✗ ${o.why}` });
      hint(DEMO.discoverHint);
      setPose('reassuring');
    }
  };

  const finish = () => {
    updateDemo(DEMO_ID, (d) => (d.completed = true));
    onDone();
  };

  // ── Layout per screen
  const idx = SCREENS.findIndex((s) => s.id === screen);
  const canNext: Record<Screen, boolean> = {
    intro: true,
    spot: spotDone,
    squared: sqStep === 3,
    squares: true,
    explore: sumDone,
    combine: everDone,
    discover: discoverDone,
    formula: formulaLine >= 4,
  };
  const next = () => (idx < SCREENS.length - 1 ? go(SCREENS[idx + 1].id) : finish());

  const exploreTools = (
    <div className="demo-explore">
      <div className="demo-count-buttons" role="group" aria-label="Count the tiles in a square">
        <button type="button" className="btn btn-sm sq-btn sq-btn-blue" onClick={() => showCount('a')}>Blue square (a²)</button>
        <button type="button" className="btn btn-sm sq-btn sq-btn-orange" onClick={() => showCount('b')}>Orange square (b²)</button>
        <button type="button" className="btn btn-sm sq-btn sq-btn-green" onClick={() => showCount('c')}>Green square (c²)</button>
      </div>
      <label className="demo-toggle">
        <input type="checkbox" checked={countingMode} onChange={(e) => setCountingMode(e.target.checked)} /> Counting mode: number the tiles one by one
      </label>
      <p className="demo-counter" aria-live="polite">{counter}</p>
    </div>
  );

  let body: ReactNode = null;
  switch (screen) {
    case 'intro':
      body = (
        <>
          <div className="formula-box big-formula"><TeX tex="a^2 + b^2 = c^2" display /></div>
          <Rich text={DEMO.introLetters} as="div" />
          <Board showSquares={false} sideLabels="letters" lit={null} counting={null} progress={null} fadeSources={false} showSquareLabels={false} />
        </>
      );
      break;
    case 'spot':
      body = (
        <>
          <Board showSquares={false} sideLabels={spotDone ? 'letters' : 'numbers'} lit={null} counting={null} progress={null} fadeSources={false} onSide={spotDone ? undefined : pickSide} sideState={sideState} showSquareLabels={false} />
          {!spotDone && (
            <div className="demo-choices" role="group" aria-label="Which side is the hypotenuse?">
              <button type="button" className="btn btn-secondary" onClick={() => pickSide('a')}>Side 3</button>
              <button type="button" className="btn btn-secondary" onClick={() => pickSide('b')}>Side 4</button>
              <button type="button" className="btn btn-secondary" onClick={() => pickSide('c')}>Side 5</button>
              <button type="button" className="btn btn-hint" onClick={explainSpot}>Explain it to me</button>
            </div>
          )}
        </>
      );
      break;
    case 'squared':
      body =
        sqStep === 0 ? (
          <>
            <p className="demo-question"><Rich text="What does $3^2$ mean?" /></p>
            <div className="options" role="radiogroup" aria-label="What does 3 squared mean?">
              {[
                { id: 'times2', label: '$3 \\times 2$' },
                { id: 'ok', label: '$3 \\times 3$' },
                { id: 'plus', label: '$3 + 3$' },
                { id: 'digits', label: 'The number thirty-two' },
              ].map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={sqPick === o.id} className={`option ${sqPick === o.id ? 'selected' : ''}`} onClick={() => { setSqPick(o.id); setFeedback(null); }}>
                  <span className="option-mark" aria-hidden="true">{sqPick === o.id ? '●' : ''}</span>
                  <Rich text={o.label} />
                </button>
              ))}
            </div>
            <div className="step-actions">
              <button type="button" className="btn btn-primary" onClick={checkSquared}>Check</button>
              <button type="button" className="btn btn-hint" onClick={() => hint('Squaring means multiplying a number by **itself**.')}>💡 Hint</button>
            </div>
          </>
        ) : (
          <div className="sq-row">
            {[3, 4, 5].slice(0, sqStep).map((n, k) => (
              <figure key={n} className="sq-fig">
                <GridSquare n={n} colour={(['blue', 'orange', 'green'] as const)[k]} />
                <figcaption><TeX tex={`${n}^2 = ${n} \\times ${n} = ${n * n}`} /></figcaption>
              </figure>
            ))}
            {sqStep < 3 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const s = sqStep + 1;
                  setSqStep(s);
                  setFeedback(null);
                  say('explaining', s === 2 ? DEMO.squared4 : DEMO.squared5);
                }}
              >
                Show {sqStep === 1 ? '4²' : '5²'} →
              </button>
            )}
          </div>
        );
      break;
    case 'squares':
      body = <Board showSquares sideLabels="letters" lit={null} counting={null} progress={null} fadeSources={false} showSquareLabels />;
      break;
    case 'explore':
      body = (
        <>
          <Board showSquares sideLabels="letters" lit={lit} counting={counting} progress={null} fadeSources={false} onSquare={tapExplore} showSquareLabels={sumDone} />
          <div className="demo-count-buttons" role="group" aria-label="Choose a square">
            <button type="button" className="btn btn-sm sq-btn sq-btn-blue" onClick={() => tapExplore('a')}>{seen.a ? '✓ ' : ''}Blue square (side 3)</button>
            <button type="button" className="btn btn-sm sq-btn sq-btn-orange" onClick={() => tapExplore('b')}>{seen.b ? '✓ ' : ''}Orange square (side 4)</button>
          </div>
          <p className="demo-counter" aria-live="polite">{counter}</p>
          <label className="demo-toggle">
            <input type="checkbox" checked={countingMode} onChange={(e) => setCountingMode(e.target.checked)} /> Counting mode: number the tiles one by one
          </label>
          {seen.a && seen.b && (
            <div className="step-box">
              <p className="step-prompt"><Rich text="$9 + 16 = \;?$" /></p>
              <div className="answer-row">
                <label className="answer-input">
                  <span className="sr-only">9 plus 16 equals</span>
                  <input type="text" inputMode="numeric" value={sum} onChange={(e) => setSum(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkSum()} disabled={sumDone} />
                </label>
                {!sumDone && <button type="button" className="btn btn-primary" onClick={checkSum}>Check</button>}
                {!sumDone && <button type="button" className="btn btn-hint" onClick={() => hint(DEMO.exploreSumHint)}>💡 Hint</button>}
              </div>
            </div>
          )}
        </>
      );
      break;
    case 'combine': {
      const caption =
        stage === 'ready'
          ? 'The green square has 25 empty spaces.'
          : stage === 'blue'
            ? '9 blue tiles'
            : stage === 'orange'
              ? '9 blue tiles + 16 orange tiles'
              : stage === 'count'
                ? '9 + 16 = 25'
                : stage === 'move'
                  ? (progress ?? 0) < 0.46
                    ? 'Moving the 16 orange tiles as one block…'
                    : 'Rearranging the 9 blue tiles to fill the rest…'
                  : '9 blue + 16 orange = 25 tiles: the green square is full, with no gaps and no overlaps.';
      body = (
        <>
          <Board showSquares sideLabels="letters" lit={lit} counting={counting} progress={progress} greenEmpty fadeSources={progress !== null && stage !== 'blue' && stage !== 'orange'} onSquare={stage === 'done' || stage === 'ready' ? showCount : undefined} showSquareLabels={stage === 'done' || stage === 'ready'} />
          <p className={`demo-caption ${stage === 'done' ? 'done' : ''}`} aria-live="polite">{caption}</p>
          <div className="demo-anim-controls">
            {stage === 'ready' && (
              <button type="button" className="btn btn-primary btn-lg" onClick={play}>Let’s put the squares together</button>
            )}
            {reduced && stage !== 'ready' && stage !== 'done' && (
              <button type="button" className="btn btn-primary" onClick={stepManually}>Next step →</button>
            )}
            {stage !== 'ready' && (
              <>
                <button type="button" className="btn btn-secondary" onClick={play} aria-label="Replay the animation">↻ Replay</button>
                <button type="button" className="btn btn-ghost" onClick={resetAnim} aria-label="Reset the demonstration to the start">↺ Reset</button>
              </>
            )}
          </div>
          {stage === 'done' && (
            <div className="demo-result">
              <TeX tex="9 + 16 = 25" display />
              <TeX tex="3^2 + 4^2 = 5^2" display />
              <p className="small muted">We’re comparing <strong>areas</strong>: the tiles were moved and rearranged to show that the two smaller squares together cover exactly the same area as the big square.</p>
            </div>
          )}
          {(stage === 'done' || stage === 'ready') && exploreTools}
        </>
      );
      break;
    }
    case 'discover':
      body = (
        <>
          <p className="demo-question">What do you notice about the two smaller squares?</p>
          <div className="options" role="radiogroup" aria-label="What do you notice?">
            {DISCOVER.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={discoverPick === o.id} className={`option ${discoverPick === o.id ? 'selected' : ''}`} onClick={() => { setDiscoverPick(o.id); setFeedback(null); }} disabled={discoverDone}>
                <span className="option-mark" aria-hidden="true">{discoverPick === o.id ? '●' : ''}</span>
                <span><strong>{o.id}.</strong> {o.text}</span>
              </button>
            ))}
          </div>
          {!discoverDone && (
            <div className="step-actions">
              <button type="button" className="btn btn-primary" onClick={checkDiscover}>Check</button>
              <button type="button" className="btn btn-hint" onClick={() => hint(DEMO.discoverHint)}>💡 Hint</button>
            </div>
          )}
          {discoverDone && <div className="formula-box big-formula"><TeX tex="a^2 + b^2 = c^2" display /></div>}
        </>
      );
      break;
    case 'formula': {
      const lines = ['a^2 + b^2 = c^2', '3^2 + 4^2 = 5^2', '9 + 16 = 25', '25 = 25'];
      const notes = ['The theorem', 'Put in the sides of our triangle', 'Work out each square (count the tiles!)', 'Both sides match ✓'];
      body = (
        <>
          <ol className="formula-steps">
            {lines.slice(0, formulaLine).map((l, k) => (
              <li key={l}>
                <TeX tex={l} />
                <span className="muted small"> — {notes[k]}</span>
              </li>
            ))}
          </ol>
          {formulaLine < 4 ? (
            <button type="button" className="btn btn-primary" onClick={() => { setFormulaLine(formulaLine + 1); if (formulaLine + 1 === 4) say('encouraging', DEMO.formulaAll); }}>
              Next line →
            </button>
          ) : (
            <Rich text={DEMO.formulaAll} as="div" className="demo-note" />
          )}
        </>
      );
      break;
    }
  }

  return (
    <div className="runner demo">
      <aside className="runner-gina">
        <GinaSays pose={pose} text={bubble} />
      </aside>
      <div className="runner-main">
        <ol className="demo-progress" aria-label="Demonstration steps">
          {SCREENS.map((s, k) => (
            <li key={s.id} className={k < idx ? 'done' : k === idx ? 'now' : ''} aria-current={k === idx ? 'step' : undefined}>
              <span aria-hidden="true">{k < idx ? '✓' : k + 1}</span>
              <span className="demo-progress-label">{s.label}</span>
            </li>
          ))}
        </ol>
        <section className="card demo-card" aria-label={SCREENS[idx].label}>
          <h2 className="demo-title">{SCREENS[idx].label}</h2>
          {body}
          <div className={`feedback ${feedback ? `fb-${feedback.tone}` : ''}`} role="status" aria-live="polite">
            {feedback && <Rich text={feedback.text} as="div" />}
          </div>
          <div className="slide-nav">
            <button type="button" className="btn btn-secondary" disabled={idx === 0} onClick={() => go(SCREENS[idx - 1].id)}>← Back</button>
            <span className="muted small">{idx + 1} / {SCREENS.length}</span>
            <button type="button" className="btn btn-primary" disabled={!canNext[screen]} onClick={next}>
              {idx === SCREENS.length - 1 ? 'Now try a new triangle →' : 'Next →'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

