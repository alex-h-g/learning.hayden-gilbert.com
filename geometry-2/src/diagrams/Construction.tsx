import { useRef, useState, type ReactNode } from 'react';
import * as M from '../math/core';

/** Drawing board units are centimetres; 1 cm = K SVG units (drawn to scale on screen, not printed scale). */
const K = 40;
type P = M.Pt;
export interface WidgetResult {
  wrong: number;
}


function arcD(c: P, r: number, fromDeg: number, toDeg: number) {
  const a = (d: number) => ({ x: (c.x + r * Math.cos((d * Math.PI) / 180)) * K, y: (c.y - r * Math.sin((d * Math.PI) / 180)) * K });
  const s = a(fromDeg);
  const e = a(toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M${s.x},${s.y} A${r * K},${r * K} 0 ${large} 0 ${e.x},${e.y}`;
}

/** Board with ruler ticks, a movable crosshair (tap, drag, or arrow keys), and an aria-live message line. */
function Board({ w, h, children, cross, setCross, label, onTap }: { w: number; h: number; children: ReactNode; cross: P | null; setCross: (p: P) => void; label: string; onTap?: (p: P) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const toCm = (e: React.PointerEvent) => {
    const svg = ref.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const q = pt.matrixTransform(m.inverse());
    return { x: q.x / K, y: q.y / K };
  };
  const onDown = (e: React.PointerEvent) => {
    if (onTap) {
      const t = toCm(e);
      if (t) onTap(t);
      return;
    }
    if (!cross) return;
    const p = toCm(e);
    if (p) setCross({ x: Math.max(0, Math.min(w, p.x)), y: Math.max(0, Math.min(h, p.y)) });
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!cross) return;
    const d = e.shiftKey ? 0.5 : 0.1;
    const m: Record<string, P> = { ArrowLeft: { x: -d, y: 0 }, ArrowRight: { x: d, y: 0 }, ArrowUp: { x: 0, y: -d }, ArrowDown: { x: 0, y: d } };
    if (m[e.key]) {
      e.preventDefault();
      setCross({ x: cross.x + m[e.key].x, y: cross.y + m[e.key].y });
    }
  };
  return (
    <svg
      ref={ref}
      className="board"
      viewBox={`0 0 ${w * K} ${h * K}`}
      role="application"
      aria-label={label}
      tabIndex={cross ? 0 : -1}
      onPointerDown={onDown}
      onPointerMove={(e) => !onTap && e.buttons === 1 && onDown(e)}
      onKeyDown={onKey}
      style={{ touchAction: cross ? 'none' : 'auto' }}
    >
      <defs>
        <pattern id="grid" width={K} height={K} patternUnits="userSpaceOnUse">
          <path d={`M${K},0 L0,0 0,${K}`} fill="none" className="grid-line" />
        </pattern>
      </defs>
      <rect width={w * K} height={h * K} fill="url(#grid)" />
      {children}
      {cross && (
        <g className="crosshair" pointerEvents="none">
          <line x1={cross.x * K - 14} y1={cross.y * K} x2={cross.x * K + 14} y2={cross.y * K} />
          <line x1={cross.x * K} y1={cross.y * K - 14} x2={cross.x * K} y2={cross.y * K + 14} />
          <circle cx={cross.x * K} cy={cross.y * K} r={6} />
        </g>
      )}
    </svg>
  );
}

function Nudge({ cross, setCross }: { cross: P; setCross: (p: P) => void }) {
  const mv = (dx: number, dy: number) => setCross({ x: cross.x + dx, y: cross.y + dy });
  return (
    <div className="nudge" aria-label="Move the marker">
      <button type="button" className="btn btn-sm btn-secondary" onClick={() => mv(0, -0.1)} aria-label="Move marker up">↑</button>
      <button type="button" className="btn btn-sm btn-secondary" onClick={() => mv(-0.1, 0)} aria-label="Move marker left">←</button>
      <button type="button" className="btn btn-sm btn-secondary" onClick={() => mv(0.1, 0)} aria-label="Move marker right">→</button>
      <button type="button" className="btn btn-sm btn-secondary" onClick={() => mv(0, 0.1)} aria-label="Move marker down">↓</button>
    </div>
  );
}

function Slider({ label, value, set, min, max }: { label: string; value: number; set: (v: number) => void; min: number; max: number }) {
  return (
    <div className="slider">
      <label>
        <span>{label}: <strong>{value.toFixed(1)} cm</strong></span>
        <input type="range" min={min} max={max} step={0.1} value={value} onChange={(e) => set(Number(e.target.value))} />
      </label>
      <div className="slider-buttons">
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => set(Math.max(min, M.roundTo(value - 0.1, 1)))} aria-label={`${label}: 0.1 cm less`}>−</button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => set(Math.min(max, M.roundTo(value + 0.1, 1)))} aria-label={`${label}: 0.1 cm more`}>+</button>
      </div>
    </div>
  );
}

const STEP_NAMES = ['Choose the base', 'Arc from A', 'Arc from B', 'Mark where they cross', 'Join up'];

// ───────────────────────── Triangle from three sides ─────────────────────────

/**
 * Easier, tap-only construction. The three side lengths stay pinned above the
 * board and tick off as they're used. No sliders: the learner picks lengths.
 */
export function ConstructTriangle({ base, left, right, onDone, say }: { base: number; left: number; right: number; onDone: (r: WidgetResult) => void; say: (text: string, tone: 'ok' | 'bad' | 'info') => void }) {
  const W = 15;
  const H = 11;
  const Y = 9.6;
  const A: P = { x: (W - base) / 2, y: Y };
  const B: P = { x: A.x + base, y: Y };
  const sides = [left, right, base];
  const [stage, setStage] = useState(0);
  const [rA, setRA] = useState<number | null>(null);
  const [rB, setRB] = useState<number | null>(null);
  const [C, setC] = useState<P | null>(null);
  const [tap, setTap] = useState<P | null>(null);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState(0);
  const bad = (t: string) => {
    setWrong((w) => w + 1);
    say(t, 'bad');
  };
  const trueC = rA && rB ? M.circleIntersections(A, rA, B, rB).sort((p, q) => p.y - q.y)[0] : undefined;
  // Which of the three lengths have been used so far (by index, so equal lengths tick separately).
  const used = new Set<number>();
  if (stage >= 1) used.add(2);
  if (rA !== null) used.add(rA === left && !used.has(0) ? 0 : 1);
  if (rB !== null) used.add([0, 1].find((i) => !used.has(i))!);

  const chooseBase = (v: number) => {
    if (v !== base) return bad(`Use the longest length, ${base} cm, as the base. Then the other two arcs meet above it.`);
    say(`Base AB = ${base} cm. Now put the compass point on A. Which length do you open it to?`, 'ok');
    setStage(1);
  };
  const arcFromA = (v: number) => {
    setRA(v);
    say(`Arc from A with radius ${v} cm — every point on it is ${v} cm from A. Now put the point on B and use the other length.`, 'ok');
    setStage(2);
  };
  const arcFromB = (v: number) => {
    const other = rA === left ? right : left;
    if (v !== other) return bad(`You’ve already used ${rA} cm from A. From B, use the other length: ${other} cm.`);
    setRB(v);
    say('Both arcs drawn. Tap the point where the two arcs cross.', 'ok');
    setStage(3);
  };
  const onTap = (p: P) => {
    if (stage !== 3 || !trueC) return;
    setTap(p);
    if (M.dist(p, trueC) <= 1.0) {
      setC(trueC);
      setTap(null);
      say('That’s the third corner, C — it’s the right distance from both A and B. Now join it up.', 'ok');
      setStage(4);
    } else {
      setMisses((m) => m + 1);
      bad(misses >= 1 ? 'Look for the glowing ring — that’s where the two purple arcs cross. Tap inside it.' : 'Not quite. Find the spot where the two purple arcs cross each other, and tap there.');
    }
  };
  const joinUp = () => {
    say(`Triangle complete! AB = ${base} cm, AC = ${rA} cm, BC = ${rB} cm — exactly the three lengths we were given.`, 'ok');
    setStage(5);
    onDone({ wrong });
  };

  const S = (p: P) => ({ x: p.x * K, y: p.y * K });
  const arcLabel = (c: P, r: number, deg: number) => {
    const q = { x: c.x + r * Math.cos((deg * Math.PI) / 180), y: c.y - r * Math.sin((deg * Math.PI) / 180) };
    return S(q);
  };
  const desc = `Drawing board. Sides to use: ${base} cm, ${left} cm and ${right} cm. ${stage >= 1 ? `Base AB = ${base} cm drawn.` : ''} ${rA ? `Arc of radius ${rA} cm from A.` : ''} ${rB ? `Arc of radius ${rB} cm from B.` : ''} ${C ? 'Point C marked.' : ''} ${stage >= 5 ? 'Triangle joined.' : ''}`;
  const remaining = rA === null ? [left, right] : [rA === left ? right : left];

  return (
    <div className="construct">
      <div className="target-sides" aria-label="The three side lengths">
        <span className="ts-title">Your triangle:</span>
        {sides.map((v, i) => (
          <span key={i} className={`ts-chip ${used.has(i) ? 'used' : ''}`}>
            <span aria-hidden="true">{used.has(i) ? '✓ ' : ''}</span>
            {v} cm{i === 2 ? ' (longest)' : ''}
            {used.has(i) && <span className="sr-only"> (used)</span>}
          </span>
        ))}
      </div>
      <ol className="construct-steps" aria-label="Construction steps">
        {STEP_NAMES.map((n, i) => (
          <li key={n} className={i < stage ? 'done' : i === stage ? 'now' : ''}>
            <span aria-hidden="true">{i < stage ? '✓' : i + 1}</span> {n}
          </li>
        ))}
      </ol>
      <Board w={W} h={H} cross={null} setCross={() => {}} onTap={onTap} label={desc}>
        {stage >= 1 && (
          <>
            <line className="c-line" x1={S(A).x} y1={S(A).y} x2={S(B).x} y2={S(B).y} />
            {Array.from({ length: base + 1 }, (_, i) => (
              <g key={i}>
                <line className="tick" x1={(A.x + i) * K} y1={Y * K + 6} x2={(A.x + i) * K} y2={Y * K + 14} />
                <text className="tick-label" x={(A.x + i) * K} y={Y * K + 26} textAnchor="middle">{i}</text>
              </g>
            ))}
            <text className="c-measure" x={(S(A).x + S(B).x) / 2} y={Y * K - 10} textAnchor="middle">{base} cm</text>
          </>
        )}
        {rA && (
          <>
            <path className="c-arc" d={arcD(A, rA, 3, 97)} />
            <text className="c-arc-label" x={arcLabel(A, rA, 100).x} y={arcLabel(A, rA, 100).y - 6} textAnchor="middle">{rA} cm</text>
          </>
        )}
        {rB && (
          <>
            <path className="c-arc" d={arcD(B, rB, 83, 177)} />
            <text className="c-arc-label" x={arcLabel(B, rB, 80).x} y={arcLabel(B, rB, 80).y - 6} textAnchor="middle">{rB} cm</text>
          </>
        )}
        {stage === 3 && trueC && misses >= 1 && <circle className="c-hint-ring" cx={S(trueC).x} cy={S(trueC).y} r={1.0 * K} />}
        {tap && stage === 3 && <circle className="c-tap" cx={S(tap).x} cy={S(tap).y} r={7} />}
        {stage >= 5 && C && (
          <>
            <line className="c-line" x1={S(A).x} y1={S(A).y} x2={S(C).x} y2={S(C).y} />
            <line className="c-line" x1={S(B).x} y1={S(B).y} x2={S(C).x} y2={S(C).y} />
            <text className="c-measure" x={(S(A).x + S(C).x) / 2 - 14} y={(S(A).y + S(C).y) / 2} textAnchor="end">{rA} cm</text>
            <text className="c-measure" x={(S(B).x + S(C).x) / 2 + 14} y={(S(B).y + S(C).y) / 2}>{rB} cm</text>
          </>
        )}
        {C && <circle className="c-point" cx={S(C).x} cy={S(C).y} r={6} />}
        {C && <text className="c-label" x={S(C).x - 6} y={S(C).y - 16}>C</text>}
        <circle className="c-point" cx={S(A).x} cy={S(A).y} r={6} />
        <text className="c-label" x={S(A).x - 20} y={S(A).y + 6}>A</text>
        {stage >= 1 && <circle className="c-point" cx={S(B).x} cy={S(B).y} r={6} />}
        {stage >= 1 && <text className="c-label" x={S(B).x + 10} y={S(B).y + 6}>B</text>}
      </Board>
      <div className="construct-controls">
        {stage === 0 && (
          <div className="seg" role="group" aria-label="Which length is the base?">
            <span>Which length is the base?</span>
            {[...new Set(sides)].sort((x, y) => x - y).map((v) => (
              <button key={v} type="button" className="btn btn-secondary" onClick={() => chooseBase(v)}>{v} cm</button>
            ))}
          </div>
        )}
        {stage === 1 && (
          <div className="seg" role="group" aria-label="Compass width for the arc from A">
            <span>Compass point on A. Open it to:</span>
            {[...new Set(remaining)].map((v) => (
              <button key={v} type="button" className="btn btn-secondary" onClick={() => arcFromA(v)}>{v} cm</button>
            ))}
          </div>
        )}
        {stage === 2 && (
          <div className="seg" role="group" aria-label="Compass width for the arc from B">
            <span>Compass point on B. Open it to:</span>
            {[...new Set([left, right])].map((v) => (
              <button key={v} type="button" className="btn btn-secondary" onClick={() => arcFromB(v)}>{v} cm</button>
            ))}
          </div>
        )}
        {stage === 3 && (
          <>
            <p className="small">Tap where the two purple arcs cross.</p>
            {trueC && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onTap(trueC)}>
                Mark the crossing for me (keyboard)
              </button>
            )}
          </>
        )}
        {stage === 4 && <button type="button" className="btn btn-primary" onClick={joinUp}>Join C to A and to B</button>}
      </div>
    </div>
  );
}

// ───────────────────────── Perpendicular bisector ─────────────────────────

const BIS_STEPS = ['Arcs from A', 'Arcs from B', 'Mark the top crossing', 'Mark the bottom crossing', 'Draw the bisector'];

export function PerpBisector({ length, onDone, say }: { length: number; onDone: (r: WidgetResult) => void; say: (text: string, tone: 'ok' | 'bad' | 'info') => void }) {
  const W = 15;
  const H = 11;
  const Y = 5.5;
  const A: P = { x: (W - length) / 2, y: Y };
  const B: P = { x: A.x + length, y: Y };
  const half = length / 2;
  const [stage, setStage] = useState(0);
  const [radius, setRadius] = useState(M.roundTo(Math.max(1, half - 1.5), 1));
  const [rA, setRA] = useState<number | null>(null);
  const [rB, setRB] = useState<number | null>(null);
  const [cross, setCross] = useState<P | null>(null);
  const [pts, setPts] = useState<P[]>([]);
  const [wrong, setWrong] = useState(0);
  const bad = (t: string) => {
    setWrong((w) => w + 1);
    say(t, 'bad');
  };
  const crossings = rA && rB ? M.circleIntersections(A, rA, B, rB).sort((p, q) => p.y - q.y) : [];
  const phi = (r: number) => (r > half ? (Math.acos(half / r) * 180) / Math.PI : 60);

  const arcsFrom = (end: 'A' | 'B') => {
    const r = M.roundTo(radius, 1);
    if (end === 'A') {
      if (r <= half + 0.1) {
        setRA(r);
        return bad(`With ${r.toFixed(1)} cm the arcs from A and B can’t meet: half of ${M.fmt(length, 1)} cm is ${M.fmt(half, 2)} cm. Open the compasses wider, then draw again.`);
      }
      const maxR = Math.floor(Math.sqrt(half * half + (Y - 0.6) ** 2) * 10) / 10;
      if (r > maxR) return bad(`That works in real life, but the crossings would be off this board. Try a width between ${M.fmt(half, 2)} cm and ${maxR} cm.`);
      setRA(r);
      say(`Arcs above and below the line, ${r.toFixed(1)} cm from A. Keep the same width and draw from B.`, 'ok');
      setStage(1);
    } else {
      if (rA === null || Math.abs(r - rA) > 0.05) return bad(`Keep the compasses the same width as before (${rA?.toFixed(1)} cm), so both points are the same distance from A and B.`);
      setRB(r);
      say('The arcs cross in two places. Move the marker to the top crossing and mark it.', 'ok');
      setCross({ x: W / 2 + 1.5, y: 1.5 });
      setStage(2);
    }
  };
  const mark = () => {
    if (!cross) return;
    const target = crossings[stage === 2 ? 0 : 1];
    if (!target) return;
    const d = M.dist(cross, target);
    if (d > 0.35) return bad(d > 2 ? 'Find where an arc from A crosses an arc from B.' : 'Close! Move the marker exactly onto the crossing.');
    setPts([...pts, target]);
    if (stage === 2) {
      say('Now the bottom crossing.', 'ok');
      setCross({ x: W / 2 - 1.5, y: H - 1.5 });
      setStage(3);
    } else {
      setCross(null);
      say('Both crossings marked. Join them with a straight line.', 'ok');
      setStage(4);
    }
  };
  const drawLine = () => {
    const X = M.lineCrossesSegment(pts[0], pts[1], A, B);
    const angle = M.angleBetweenLines(pts[0], pts[1], A, B);
    if (!X || Math.abs(X.x - (A.x + B.x) / 2) > 1e-6 || Math.abs(angle - 90) > 1e-6) throw new Error('bisector self-check failed');
    say('Done! The line crosses AB at its midpoint M, at a right angle.', 'ok');
    setStage(5);
    onDone({ wrong });
  };
  const M_ = { x: (A.x + B.x) / 2, y: Y };
  const ext = (p: P, q: P, k: number) => ({ x: p.x + (p.x - q.x) * k, y: p.y + (p.y - q.y) * k });
  const desc = `Drawing board with line AB, ${M.fmt(length, 1)} cm long. ${rA ? `Arcs of ${rA} cm from A.` : ''} ${rB ? `Arcs of ${rB} cm from B.` : ''} ${pts.length} crossing points marked.`;
  return (
    <div className="construct">
      <ol className="construct-steps" aria-label="Construction steps">
        {BIS_STEPS.map((s, i) => (
          <li key={s} className={i < stage ? 'done' : i === stage ? 'now' : ''}>
            <span aria-hidden="true">{i < stage ? '✓' : i + 1}</span> {s}
          </li>
        ))}
      </ol>
      <Board w={W} h={H} cross={cross} setCross={setCross} label={desc}>
        <line className="c-line" x1={A.x * K} y1={Y * K} x2={B.x * K} y2={Y * K} />
        {rA && (
          <>
            <path className="c-arc" d={arcD(A, rA, phi(rA) - 28, phi(rA) + 28)} />
            <path className="c-arc" d={arcD(A, rA, -phi(rA) - 28, -phi(rA) + 28)} />
          </>
        )}
        {rB && (
          <>
            <path className="c-arc" d={arcD(B, rB, 180 - phi(rB) - 28, 180 - phi(rB) + 28)} />
            <path className="c-arc" d={arcD(B, rB, 180 + phi(rB) - 28, 180 + phi(rB) + 28)} />
          </>
        )}
        {pts.map((p, i) => (
          <circle key={i} className="c-point" cx={p.x * K} cy={p.y * K} r={5} />
        ))}
        {stage >= 5 && pts.length === 2 && (
          <>
            <line className="c-line c-bisector" x1={ext(pts[0], pts[1], 0.15).x * K} y1={ext(pts[0], pts[1], 0.15).y * K} x2={ext(pts[1], pts[0], 0.15).x * K} y2={ext(pts[1], pts[0], 0.15).y * K} />
            <path className="c-right" d={`M${M_.x * K + 12},${Y * K} L${M_.x * K + 12},${Y * K - 12} L${M_.x * K},${Y * K - 12}`} />
            <circle className="c-point" cx={M_.x * K} cy={Y * K} r={5} />
            <text className="c-label" x={M_.x * K - 22} y={Y * K + 22}>M</text>
            {[(A.x + M_.x) / 2, (M_.x + B.x) / 2].map((x, i) => (
              <line key={i} className="c-tick" x1={x * K} y1={Y * K - 7} x2={x * K} y2={Y * K + 7} />
            ))}
            <text className="c-measure" x={((A.x + M_.x) / 2) * K - 22} y={Y * K + 26}>{M.fmt(half, 2)} cm</text>
            <text className="c-measure" x={((M_.x + B.x) / 2) * K - 22} y={Y * K + 26}>{M.fmt(half, 2)} cm</text>
          </>
        )}
        <circle className="c-point" cx={A.x * K} cy={Y * K} r={5} />
        <circle className="c-point" cx={B.x * K} cy={Y * K} r={5} />
        <text className="c-label" x={A.x * K - 20} y={Y * K + 6}>A</text>
        <text className="c-label" x={B.x * K + 10} y={Y * K + 6}>B</text>
      </Board>
      <div className="construct-controls">
        {stage <= 1 && (
          <>
            <Slider label="Compass width" value={radius} set={setRadius} min={0.5} max={13} />
            <button type="button" className="btn btn-primary" onClick={() => arcsFrom(stage === 0 ? 'A' : 'B')}>Draw arcs from {stage === 0 ? 'A' : 'B'}</button>
          </>
        )}
        {(stage === 2 || stage === 3) && cross && (
          <>
            <p className="small muted">Tap or drag on the board, or use the arrows (arrow keys work too).</p>
            <Nudge cross={cross} setCross={setCross} />
            <button type="button" className="btn btn-primary" onClick={mark}>Mark {stage === 2 ? 'top' : 'bottom'} crossing</button>
          </>
        )}
        {stage === 4 && <button type="button" className="btn btn-primary" onClick={drawLine}>Draw line through both points</button>}
        {stage < 5 && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setStage(0);
              setRA(null);
              setRB(null);
              setPts([]);
              setCross(null);
              say('Cleared. Start again with arcs from A.', 'info');
            }}
          >
            ↺ Reset drawing
          </button>
        )}
      </div>
    </div>
  );
}
