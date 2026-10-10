import { useRef, useState, type ReactNode } from 'react';
import * as M from '../math/core';

/** Drawing board units are centimetres; 1 cm = K SVG units (drawn to scale on screen, not printed scale). */
const K = 40;
type P = M.Pt;
export interface WidgetResult {
  wrong: number;
}

const toSvg = (p: P) => ({ x: p.x * K, y: p.y * K });

function arcD(c: P, r: number, fromDeg: number, toDeg: number) {
  const a = (d: number) => ({ x: (c.x + r * Math.cos((d * Math.PI) / 180)) * K, y: (c.y - r * Math.sin((d * Math.PI) / 180)) * K });
  const s = a(fromDeg);
  const e = a(toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M${s.x},${s.y} A${r * K},${r * K} 0 ${large} 0 ${e.x},${e.y}`;
}

/** Board with ruler ticks, a movable crosshair (tap, drag, or arrow keys), and an aria-live message line. */
function Board({ w, h, children, cross, setCross, label }: { w: number; h: number; children: ReactNode; cross: P | null; setCross: (p: P) => void; label: string }) {
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
      onPointerMove={(e) => e.buttons === 1 && onDown(e)}
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

const STEP_NAMES = ['Draw the base', 'First arc', 'Second arc', 'Mark the crossing', 'Join up', 'Label the sides'];

// ───────────────────────── Triangle from three sides ─────────────────────────

export function ConstructTriangle({ base, left, right, onDone, say }: { base: number; left: number; right: number; onDone: (r: WidgetResult) => void; say: (text: string, tone: 'ok' | 'bad' | 'info') => void }) {
  const W = 15;
  const H = 11;
  const Y = 9.6;
  const A: P = { x: (W - base) / 2, y: Y };
  const B: P = { x: A.x + base, y: Y };
  const [stage, setStage] = useState(0);
  const [len, setLen] = useState(5);
  const [centre, setCentre] = useState<'A' | 'B'>('A');
  const [radius, setRadius] = useState(3);
  const [arcs, setArcs] = useState<{ c: 'A' | 'B'; r: number }[]>([]);
  const [cross, setCross] = useState<P | null>(null);
  const [C, setC] = useState<P | null>(null);
  const [joined, setJoined] = useState({ A: false, B: false });
  const [wrong, setWrong] = useState(0);
  const bad = (t: string) => {
    setWrong((w) => w + 1);
    say(t, 'bad');
  };

  const radiusFor = (c: 'A' | 'B') => arcs.find((a) => a.c === c)?.r;
  const rA = radiusFor('A');
  const rB = radiusFor('B');
  const trueC = rA && rB ? M.circleIntersections(A, rA, B, rB).sort((p, q) => p.y - q.y)[0] : undefined;

  const drawBase = () => {
    if (Math.abs(len - base) > 0.05) return bad(`That line would be ${len.toFixed(1)} cm. The base should be the longest side, ${base} cm.`);
    say(`A ${base} cm base. Now set your compasses to one of the other lengths.`, 'ok');
    setStage(1);
  };
  const drawArc = () => {
    const firstDone = arcs[0];
    if (firstDone && firstDone.c === centre) return bad(`You’ve already drawn an arc from ${centre}. The second arc goes from the other end.`);
    const needed = firstDone ? (Math.abs(firstDone.r - left) < 0.05 ? right : left) : null;
    const okR = needed !== null ? Math.abs(radius - needed) < 0.05 : Math.abs(radius - left) < 0.05 || Math.abs(radius - right) < 0.05;
    if (!okR) return bad(needed !== null ? `That’s ${radius.toFixed(1)} cm. This arc needs the other length: ${needed} cm.` : `That’s ${radius.toFixed(1)} cm. Set the compasses to ${left} cm or ${right} cm.`);
    const next = [...arcs, { c: centre, r: M.roundTo(radius, 1) }];
    setArcs(next);
    if (next.length === 1) {
      say(`Arc of ${radius.toFixed(1)} cm from ${centre}. Every point on it is exactly ${radius.toFixed(1)} cm from ${centre}. Now the other end.`, 'ok');
      setCentre(centre === 'A' ? 'B' : 'A');
      setStage(2);
    } else {
      say('Both arcs drawn. Where do they cross? Move the marker there and press “Mark point”.', 'ok');
      setCross({ x: W / 2, y: 3 });
      setStage(3);
    }
  };
  const mark = () => {
    if (!cross || !trueC) return;
    const d = M.dist(cross, trueC);
    if (d > 0.35) return bad(d > 2 ? 'Look for the spot where the two arcs cross each other.' : 'Close! Move the marker exactly onto the crossing point.');
    setC(trueC);
    setCross(null);
    say('That’s the third corner, C. Now join it to both ends of the base.', 'ok');
    setStage(4);
  };
  const join = (k: 'A' | 'B') => {
    const j = { ...joined, [k]: true };
    setJoined(j);
    if (j.A && j.B) {
      say(`Triangle complete! Now label it: which side is ${left} cm?`, 'ok');
      setStage(5);
    }
  };
  const label = (side: 'AC' | 'BC') => {
    const acLen = rA!;
    const correct = Math.abs((side === 'AC' ? acLen : rB!) - left) < 0.05;
    if (!correct) return bad(`Not quite — ${side} was drawn with the ${side === 'AC' ? acLen : rB} cm arc. Which arc was ${left} cm?`);
    say(`Yes: AC = ${rA} cm, BC = ${rB} cm, AB = ${base} cm. Every side matches!`, 'ok');
    setStage(6);
    onDone({ wrong });
  };

  const showBase = stage >= 1 ? B : { x: A.x + len, y: Y };
  const desc = `Drawing board. ${stage === 0 ? `A line from A, currently ${len.toFixed(1)} cm long.` : `Base AB = ${base} cm.`} ${arcs.map((a) => `Arc of radius ${a.r} cm from ${a.c}.`).join(' ')} ${C ? 'Point C marked.' : ''}`;
  return (
    <div className="construct">
      <ol className="construct-steps" aria-label="Construction steps">
        {STEP_NAMES.map((s, i) => (
          <li key={s} className={i < stage ? 'done' : i === stage ? 'now' : ''}>
            <span aria-hidden="true">{i < stage ? '✓' : i + 1}</span> {s}
          </li>
        ))}
      </ol>
      <Board w={W} h={H} cross={cross} setCross={setCross} label={desc}>
        <line className="c-line" x1={toSvg(A).x} y1={toSvg(A).y} x2={toSvg(showBase).x} y2={toSvg(showBase).y} strokeDasharray={stage === 0 ? '6 4' : undefined} />
        {/* ruler ticks under the base */}
        {Array.from({ length: Math.floor(stage === 0 ? len : base) + 1 }, (_, i) => (
          <g key={i}>
            <line className="tick" x1={(A.x + i) * K} y1={Y * K + 6} x2={(A.x + i) * K} y2={Y * K + 14} />
            <text className="tick-label" x={(A.x + i) * K} y={Y * K + 26} textAnchor="middle">{i}</text>
          </g>
        ))}
        {arcs.map((a, i) => (
          <path key={i} className="c-arc" d={a.c === 'A' ? arcD(A, a.r, 3, 97) : arcD(B, a.r, 83, 177)} />
        ))}
        {C && joined.A && <line className="c-line" x1={toSvg(A).x} y1={toSvg(A).y} x2={toSvg(C).x} y2={toSvg(C).y} />}
        {C && joined.B && <line className="c-line" x1={toSvg(B).x} y1={toSvg(B).y} x2={toSvg(C).x} y2={toSvg(C).y} />}
        {C && <circle className="c-point" cx={toSvg(C).x} cy={toSvg(C).y} r={5} />}
        <circle className="c-point" cx={toSvg(A).x} cy={toSvg(A).y} r={5} />
        <text className="c-label" x={toSvg(A).x - 18} y={toSvg(A).y + 6}>A</text>
        {stage >= 1 && <circle className="c-point" cx={toSvg(B).x} cy={toSvg(B).y} r={5} />}
        {stage >= 1 && <text className="c-label" x={toSvg(B).x + 10} y={toSvg(B).y + 6}>B</text>}
        {C && <text className="c-label" x={toSvg(C).x - 6} y={toSvg(C).y - 14}>C</text>}
        {stage >= 6 && C && (
          <>
            <text className="c-measure" x={(toSvg(A).x + toSvg(C).x) / 2 - 34} y={(toSvg(A).y + toSvg(C).y) / 2}>{rA} cm</text>
            <text className="c-measure" x={(toSvg(B).x + toSvg(C).x) / 2 + 10} y={(toSvg(B).y + toSvg(C).y) / 2}>{rB} cm</text>
            <text className="c-measure" x={(toSvg(A).x + toSvg(B).x) / 2 - 18} y={Y * K - 10}>{base} cm</text>
          </>
        )}
      </Board>
      <div className="construct-controls">
        {stage === 0 && (
          <>
            <Slider label="Line length" value={len} set={setLen} min={1} max={12} />
            <button type="button" className="btn btn-primary" onClick={drawBase}>Draw base line</button>
          </>
        )}
        {(stage === 1 || stage === 2) && (
          <>
            <div className="seg" role="group" aria-label="Compass point on">
              <span>Compass point on:</span>
              {(['A', 'B'] as const).map((c) => (
                <button key={c} type="button" className={`btn btn-sm ${centre === c ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={centre === c} onClick={() => setCentre(c)}>{c}</button>
              ))}
            </div>
            <Slider label="Compass width" value={radius} set={setRadius} min={0.5} max={12} />
            <button type="button" className="btn btn-primary" onClick={drawArc}>Draw arc</button>
          </>
        )}
        {stage === 3 && cross && (
          <>
            <p className="small muted">Tap or drag on the board, or use the arrows (arrow keys work too).</p>
            <Nudge cross={cross} setCross={setCross} />
            <button type="button" className="btn btn-primary" onClick={mark}>Mark point</button>
          </>
        )}
        {stage === 4 && (
          <div className="seg">
            <button type="button" className="btn btn-primary" disabled={joined.A} onClick={() => join('A')}>{joined.A ? '✓ ' : ''}Join C to A</button>
            <button type="button" className="btn btn-primary" disabled={joined.B} onClick={() => join('B')}>{joined.B ? '✓ ' : ''}Join C to B</button>
          </div>
        )}
        {stage === 5 && (
          <div className="seg" role="group" aria-label={`Which side is ${left} cm?`}>
            <span>Which side is {left} cm?</span>
            <button type="button" className="btn btn-secondary" onClick={() => label('AC')}>AC</button>
            <button type="button" className="btn btn-secondary" onClick={() => label('BC')}>BC</button>
          </div>
        )}
        {stage < 6 && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setStage(0);
              setArcs([]);
              setC(null);
              setCross(null);
              setJoined({ A: false, B: false });
              say('Cleared. Start again with the base line.', 'info');
            }}
          >
            ↺ Reset drawing
          </button>
        )}
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
