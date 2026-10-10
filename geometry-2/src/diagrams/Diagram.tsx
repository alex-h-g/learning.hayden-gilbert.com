import type { ReactNode } from 'react';
import * as M from '../math/core';
import { seeded } from '../lib/random';
import type { AnglePos, DiagramSpec } from '../content/types';
import { Math as TeX } from '../components/Math';
import { Cube3D } from './Cube3D';

type P = { x: number; y: number };
const W = 400;
const H = 300;

/** Arc for the angle at V between rays VP and VQ (the smaller angle), with a label. */
function Angle({ V, P, Q, r = 26, label, hl, right }: { V: P; P: P; Q: P; r?: number; label?: string; hl?: boolean; right?: boolean }) {
  const a1 = Math.atan2(P.y - V.y, P.x - V.x);
  const a2 = Math.atan2(Q.y - V.y, Q.x - V.x);
  let d = a2 - a1;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  const s = { x: V.x + r * Math.cos(a1), y: V.y + r * Math.sin(a1) };
  const e = { x: V.x + r * Math.cos(a2), y: V.y + r * Math.sin(a2) };
  const mid = a1 + d / 2;
  const lr = r + 16 + (label && label.length > 4 ? 8 : 0);
  const L = { x: V.x + lr * Math.cos(mid), y: V.y + lr * Math.sin(mid) };
  const cls = `angle ${hl ? 'hl' : ''}`;
  if (right) {
    const k = 12;
    const u1 = { x: Math.cos(a1), y: Math.sin(a1) };
    const u2 = { x: Math.cos(a2), y: Math.sin(a2) };
    return <path className={cls} d={`M${V.x + k * u1.x},${V.y + k * u1.y} L${V.x + k * (u1.x + u2.x)},${V.y + k * (u1.y + u2.y)} L${V.x + k * u2.x},${V.y + k * u2.y}`} fill="none" />;
  }
  return (
    <g>
      <path className={cls} d={`M${V.x},${V.y} L${s.x},${s.y} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${e.x},${e.y} Z`} />
      {label && <Label x={L.x} y={L.y} text={label} hl={hl} />}
    </g>
  );
}

/** A label; LaTeX-ish strings like "70^\circ" are shown as plain text with °. */
function Label({ x, y, text, hl, anchor = 'middle', size = 15 }: { x: number; y: number; text: string; hl?: boolean; anchor?: 'start' | 'middle' | 'end'; size?: number }) {
  const t = text.replace(/\^\\circ/g, '°').replace(/\\/g, '');
  const italic = /^[a-z]$/.test(t);
  return (
    <text x={x} y={y} className={`dlabel ${hl ? 'hl' : ''}`} textAnchor={anchor} dominantBaseline="middle" fontSize={size} fontStyle={italic ? 'italic' : undefined}>
      {t}
    </text>
  );
}

/** Scales points to fit the view box with padding. */
function fit(pts: P[], pad = 48, w = W, h = H) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const bw = Math.max(...xs) - minX || 1;
  const bh = Math.max(...ys) - minY || 1;
  const k = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh);
  const ox = (w - bw * k) / 2 - minX * k;
  const oy = (h - bh * k) / 2 - minY * k;
  return (p: P): P => ({ x: p.x * k + ox, y: p.y * k + oy });
}

const add = (a: P, b: P): P => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: P, b: P): P => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: P, k: number): P => ({ x: a.x * k, y: a.y * k });
const unit = (a: P): P => mul(a, 1 / Math.hypot(a.x, a.y));
const centroid = (ps: P[]): P => mul(ps.reduce(add, { x: 0, y: 0 }), 1 / ps.length);
const pts = (ps: P[]) => ps.map((p) => `${p.x},${p.y}`).join(' ');

/** Label just outside the midpoint of a side, pushed away from the shape's centre. */
function sideLabel(a: P, b: P, c: P, off = 18): P {
  const m = mul(add(a, b), 0.5);
  const n = unit({ x: -(b.y - a.y), y: b.x - a.x });
  const away = (m.x - c.x) * n.x + (m.y - c.y) * n.y >= 0 ? 1 : -1;
  return add(m, mul(n, off * away));
}

function polygonPoints(n: number, irregular: boolean, seed: number): P[] {
  const rng = seeded(seed);
  return Array.from({ length: n }, (_, i) => {
    const jitter = irregular ? (rng() - 0.5) * (Math.PI / n) * 0.7 : 0;
    const r = irregular ? 0.78 + rng() * 0.22 : 1;
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n + Math.PI / n + jitter;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });
}

function Svg({ children, label, w = W, h = H }: { children: ReactNode; label: string; w?: number; h?: number }) {
  return (
    <svg className="diagram-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {children}
    </svg>
  );
}

const POS_RAYS: Record<string, [number, number]> = { tr: [0, 1], tl: [1, 2], bl: [2, 3], br: [3, 0] };

export function Diagram({ spec, highlight = [] }: { spec: DiagramSpec; highlight?: string[] }) {
  const hl = (k: string) => highlight.includes(k);
  switch (spec.type) {
    case 'polygon': {
      const raw = polygonPoints(spec.n, !!spec.irregular, spec.seed ?? 1);
      const f = fit(raw, 46);
      const v = raw.map(f);
      const c = centroid(v);
      const tris = spec.triangulate ? v.slice(2, -1) : [];
      const desc = `${spec.irregular ? 'An irregular' : 'A regular'} ${M.polygonName(spec.n)} with ${spec.n} sides${spec.triangulate ? `, split into ${spec.n - 2} triangles by lines from one corner` : ''}.`;
      let mark: ReactNode = null;
      if (spec.markAngle === 'interior') mark = <Angle V={v[1]} P={v[0]} Q={v[2]} label="" hl={hl('interior')} />;
      if (spec.markAngle === 'exterior') {
        const E = add(v[1], mul(unit(sub(v[1], v[0])), 70));
        mark = (
          <g>
            <line className="ext-line" x1={v[1].x} y1={v[1].y} x2={E.x} y2={E.y} />
            <Angle V={v[1]} P={E} Q={v[2]} r={24} hl={hl('exterior')} label="ext" />
            <Angle V={v[1]} P={v[0]} Q={v[2]} r={18} hl={hl('interior')} label="" />
          </g>
        );
      }
      return (
        <figure className="diagram">
          <Svg label={desc}>
            {spec.triangulate &&
              v.slice(1, -1).map((_, i) => (
                <polygon key={`t${i}`} className={`tri tri-${i % 3} ${hl('triangles') ? 'hl' : ''}`} points={pts([v[0], v[i + 1], v[i + 2]])} />
              ))}
            <polygon className="shape" points={pts(v)} />
            {tris.map((pt, i) => (
              <line key={i} className="diag-line" x1={v[0].x} y1={v[0].y} x2={pt.x} y2={pt.y} />
            ))}
            {spec.triangulate && v.slice(1, -1).map((_, i) => {
              const cc = centroid([v[0], v[i + 1], v[i + 2]]);
              return <Label key={`n${i}`} x={cc.x} y={cc.y} text={String(i + 1)} size={13} />;
            })}
            {mark}
            {spec.n <= 12 && !spec.triangulate && <Label x={c.x} y={c.y} text={`${spec.n} sides`} size={14} />}
          </Svg>
          {spec.caption && <figcaption>{spec.caption}</figcaption>}
        </figure>
      );
    }
    case 'exterior-polygon': {
      const raw = M.polygonFromExteriorAngles(spec.exteriors, seeded(spec.seed)) ?? polygonPoints(spec.exteriors.length, false, 1);
      // Maths coordinates (y up) → screen (y down).
      const flipped = raw.map((p) => ({ x: p.x, y: -p.y }));
      const f = fit(flipped, 62);
      const v = flipped.map(f);
      const n = v.length;
      const interior = spec.exteriors.map(M.interiorFromExterior);
      const vals = spec.mode === 'exterior' ? spec.exteriors : interior;
      const desc = `An irregular polygon with ${n} sides. ${spec.mode === 'exterior' ? 'Exterior' : 'Interior'} angles marked: ${vals.map((x, i) => (i === spec.unknownIndex ? spec.unknownLabel : `${x}°`)).join(', ')}.`;
      return (
        <figure className="diagram">
          <Svg label={desc}>
            <polygon className="shape" points={pts(v)} />
            {spec.exteriors.map((_, k) => {
              const V = v[(k + 1) % n];
              const prev = v[k];
              const next = v[(k + 2) % n];
              const lab = k === spec.unknownIndex ? spec.unknownLabel : `${vals[k]}°`;
              const isU = k === spec.unknownIndex;
              if (spec.mode === 'exterior') {
                const E = add(V, mul(unit(sub(V, prev)), 52));
                return (
                  <g key={k}>
                    <line className="ext-line" x1={V.x} y1={V.y} x2={E.x} y2={E.y} />
                    <Angle V={V} P={E} Q={next} r={20} label={lab} hl={isU && hl('unknown')} />
                  </g>
                );
              }
              return <Angle key={k} V={V} P={prev} Q={next} r={20} label={lab} hl={isU && hl('unknown')} />;
            })}
          </Svg>
        </figure>
      );
    }
    case 'parallelogram': {
      const a = (spec.angleS * Math.PI) / 180;
      const S0 = { x: 0, y: 0 };
      const R0 = { x: 200, y: 0 };
      const P0 = { x: 130 * Math.cos(a), y: -130 * Math.sin(a) };
      const Q0 = add(P0, R0);
      const T0 = add(R0, { x: 110, y: 0 });
      const f = fit([S0, R0, P0, Q0, T0], 40);
      const [S, R, P, Q, T] = [S0, R0, P0, Q0, T0].map(f);
      const l = spec.labels;
      const desc = `Parallelogram PQRS, with SR extended to T. ${l.S ? `Angle at S is ${l.S.replace(/\^\\circ/, '°')}.` : ''} ${(['P', 'Q', 'R', 'QRT'] as const).filter((k) => l[k]).map((k) => `${k === 'QRT' ? 'Angle QRT' : `Angle at ${k}`} is ${l[k]!.replace(/\^\\circ/, '°')}`).join('. ')}`;
      const vlab = (p: P, t: string, dx: number, dy: number) => <Label x={p.x + dx} y={p.y + dy} text={t} size={16} />;
      return (
        <figure className="diagram">
          <Svg label={desc}>
            <polygon className="shape" points={pts([P, Q, R, S])} />
            <line className="ext-line" x1={R.x} y1={R.y} x2={T.x} y2={T.y} />
            {/* parallel marks */}
            {[mul(add(P, Q), 0.5), mul(add(S, R), 0.5)].map((m, i) => <path key={i} className="pmark" d={`M${m.x - 5},${m.y - 5} L${m.x + 2},${m.y} L${m.x - 5},${m.y + 5}`} />)}
            {[mul(add(P, S), 0.5), mul(add(Q, R), 0.5)].map((m, i) => {
              const u = unit(sub(P, S));
              return <path key={`b${i}`} className="pmark" d={`M${m.x - 6 * u.x - 5 * u.y},${m.y - 6 * u.y + 5 * u.x} L${m.x},${m.y} L${m.x - 6 * u.x + 5 * u.y},${m.y - 6 * u.y - 5 * u.x}`} />;
            })}
            {l.S && <Angle V={S} P={R} Q={P} label={l.S} hl={hl('S')} />}
            {l.P && <Angle V={P} P={S} Q={Q} label={l.P} hl={hl('P')} />}
            {l.Q && <Angle V={Q} P={P} Q={R} label={l.Q} hl={hl('Q')} />}
            {l.R && <Angle V={R} P={Q} Q={S} label={l.R} hl={hl('R')} r={22} />}
            {l.QRT && <Angle V={R} P={T} Q={Q} label={l.QRT} hl={hl('QRT')} r={30} />}
            {vlab(P, 'P', -6, -16)}
            {vlab(Q, 'Q', 8, -16)}
            {vlab(R, 'R', 0, 20)}
            {vlab(S, 'S', -8, 20)}
            {vlab(T, 'T', 0, 20)}
          </Svg>
        </figure>
      );
    }
    case 'straight-line':
    case 'around-point': {
      const O = { x: 200, y: spec.type === 'straight-line' ? 210 : 150 };
      const total = spec.type === 'straight-line' ? 180 : 360;
      const start = spec.type === 'straight-line' ? 0 : 20;
      let cum = start;
      const rays: number[] = [start];
      spec.angles.forEach((a) => {
        cum += a.value;
        rays.push(cum);
      });
      const pt = (deg: number, r: number) => ({ x: O.x + r * Math.cos((-deg * Math.PI) / 180), y: O.y + r * Math.sin((-deg * Math.PI) / 180) });
      const desc = `${spec.angles.length} angles ${spec.type === 'straight-line' ? 'on a straight line' : 'around a point'}: ${spec.angles.map((a) => a.label.replace(/\^\\circ/, '°')).join(', ')}. They add up to ${total}°.`;
      return (
        <figure className="diagram">
          <Svg label={desc}>
            {spec.type === 'straight-line' && <line className="shape-line" x1={20} y1={O.y} x2={380} y2={O.y} />}
            {rays.slice(0, spec.type === 'straight-line' ? rays.length : -1).map((d, i) => {
              if (spec.type === 'straight-line' && (i === 0 || i === rays.length - 1)) return null;
              const e = pt(d, spec.type === 'straight-line' ? 170 : 130);
              return <line key={i} className="shape-line" x1={O.x} y1={O.y} x2={e.x} y2={e.y} />;
            })}
            {spec.angles.map((a, i) => (
              <Angle key={i} V={O} P={pt(rays[i], 50)} Q={pt(rays[i + 1], 50)} r={30 + (i % 2) * 10} label={a.label} hl={/^[a-z]$/.test(a.label)} />
            ))}
            <circle cx={O.x} cy={O.y} r={3.5} className="dot" />
          </Svg>
        </figure>
      );
    }
    case 'parallel': {
      const th = (spec.slope * Math.PI) / 180;
      const y1 = 105;
      const y2 = 205;
      const dx = (y2 - y1) / Math.tan(th);
      const C1 = { x: 200 + dx / 2, y: y1 };
      const C2 = { x: 200 - dx / 2, y: y2 };
      const dir = unit(sub(C1, C2));
      const A = add(C1, mul(dir, 85));
      const B = add(C2, mul(dir, -85));
      const rayAt = (C: P) => [add(C, { x: 60, y: 0 }), add(C, mul(dir, 60)), add(C, { x: -60, y: 0 }), add(C, mul(dir, -60))];
      const angleAt = (pos: AnglePos, label: string, isUnknown: boolean) => {
        const [line, quad] = pos.split('-');
        const C = line === 'top' ? C1 : C2;
        const r = rayAt(C);
        const [i, j] = POS_RAYS[quad];
        return <Angle V={C} P={r[i]} Q={r[j]} r={24} label={label} hl={isUnknown || hl('pair')} />;
      };
      const desc = `Two parallel horizontal lines crossed by a slanted line. One angle is marked ${spec.given.label.replace(/\^\\circ/, '°')}; the angle to find is ${spec.unknown.label}.`;
      return (
        <figure className="diagram">
          <Svg label={desc}>
            <line className="shape-line" x1={20} y1={y1} x2={380} y2={y1} />
            <line className="shape-line" x1={20} y1={y2} x2={380} y2={y2} />
            {[y1, y2].map((y) => (
              <g key={y}>
                <path className="pmark" d={`M${55},${y - 6} L${63},${y} L${55},${y + 6}`} />
                <path className="pmark" d={`M${63},${y - 6} L${71},${y} L${63},${y + 6}`} />
              </g>
            ))}
            <line className="shape-line" x1={A.x} y1={A.y} x2={B.x} y2={B.y} />
            {angleAt(spec.given.pos, spec.given.label, false)}
            {angleAt(spec.unknown.pos, spec.unknown.label, true)}
          </Svg>
          <figcaption>The arrows show the two lines are parallel.</figcaption>
        </figure>
      );
    }
    case 'right-triangle': {
      const s = spec.flip ? -1 : 1;
      const r = (spec.rotation * Math.PI) / 180;
      const rot = (p: P): P => ({ x: p.x * Math.cos(r) - p.y * Math.sin(r), y: p.x * Math.sin(r) + p.y * Math.cos(r) });
      const raw = [{ x: 0, y: 0 }, { x: s * spec.a, y: 0 }, { x: 0, y: -spec.b }].map(rot);
      const f = fit(raw, 52);
      const [O, A, B] = raw.map(f);
      const c = centroid([O, A, B]);
      const u = spec.unit && /\d/.test(spec.labels.a) ? ` ${spec.unit}` : '';
      const lab = (t: string) => (/^\d/.test(t) && spec.unit ? `${t} ${spec.unit}` : t);
      const desc = `Right-angled triangle. The sides next to the right angle are ${lab(spec.labels.a)} and ${lab(spec.labels.b)}; the side opposite the right angle (the hypotenuse) is ${lab(spec.labels.c)}.`;
      void u;
      const la = sideLabel(O, A, c, 20);
      const lb = sideLabel(O, B, c, 20);
      const lc = sideLabel(A, B, c, 20);
      return (
        <figure className="diagram">
          <Svg label={desc}>
            <polygon className="shape" points={pts([O, A, B])} />
            {hl('hyp') && <line className="hl-line" x1={A.x} y1={A.y} x2={B.x} y2={B.y} />}
            <Angle V={O} P={A} Q={B} right hl={hl('right-angle')} />
            <Label x={la.x} y={la.y} text={lab(spec.labels.a)} />
            <Label x={lb.x} y={lb.y} text={lab(spec.labels.b)} />
            <Label x={lc.x} y={lc.y} text={lab(spec.labels.c)} hl={hl('hyp')} />
          </Svg>
        </figure>
      );
    }
    case 'rectangle': {
      const f = fit([{ x: 0, y: 0 }, { x: spec.l, y: spec.w }], 56);
      const [TL, BR] = [{ x: 0, y: 0 }, { x: spec.l, y: spec.w }].map(f);
      const TR = { x: BR.x, y: TL.y };
      const BL = { x: TL.x, y: BR.y };
      const c = centroid([TL, BR]);
      const desc = `Rectangle ${spec.labels.l} long and ${spec.labels.w} wide, with a diagonal ${spec.labels.d ?? ''} from corner to corner.`;
      const ld = sideLabel(BL, TR, { x: BR.x + 1000, y: BR.y + 1000 }, 14);
      return (
        <figure className="diagram">
          <Svg label={desc}>
            {hl('triangle') && <polygon className="fill-hl" points={pts([BL, BR, TR])} />}
            <rect className="shape" x={TL.x} y={TL.y} width={BR.x - TL.x} height={BR.y - TL.y} />
            <line className="hl-line" x1={BL.x} y1={BL.y} x2={TR.x} y2={TR.y} />
            <Angle V={BR} P={BL} Q={TR} right />
            <Angle V={TL} P={TR} Q={BL} right />
            <Label x={c.x} y={BR.y + 22} text={spec.labels.l} />
            <Label x={TL.x - 12} y={c.y} text={spec.labels.w} anchor="end" />
            {spec.labels.d && <Label x={ld.x} y={ld.y} text={spec.labels.d} hl />}
          </Svg>
        </figure>
      );
    }
    case 'circle': {
      const O = { x: 200, y: 150 };
      const r = 110;
      const desc = `A circle showing its ${spec.show === 'both' ? 'radius and diameter' : spec.show}${spec.label ? `, labelled ${spec.label}` : ''}.`;
      const diam = spec.show === 'diameter' || spec.show === 'both';
      const rad = spec.show === 'radius' || spec.show === 'both';
      return (
        <figure className="diagram">
          <Svg label={desc}>
            <circle className="shape circle-fill" cx={O.x} cy={O.y} r={r} />
            {diam && <line className={`dim ${hl('diameter') ? 'hl-line' : ''}`} x1={O.x - r} y1={O.y} x2={O.x + r} y2={O.y} />}
            {rad && <line className={`dim ${hl('radius') ? 'hl-line' : ''}`} x1={O.x} y1={O.y} x2={O.x + r * Math.cos(-0.9)} y2={O.y + r * Math.sin(-0.9)} />}
            <circle cx={O.x} cy={O.y} r={4} className="dot" />
            {diam && <Label x={O.x - 50} y={O.y + 18} text={spec.show === 'both' ? 'diameter' : spec.label} hl={hl('diameter')} />}
            {rad && <Label x={O.x + 68} y={O.y - 58} text={spec.show === 'both' ? 'radius' : spec.label} hl={hl('radius')} />}
            {spec.show === 'both' && <Label x={O.x} y={O.y - 14} text="centre" size={12} />}
          </Svg>
          {spec.caption && <figcaption>{spec.caption}</figcaption>}
        </figure>
      );
    }
    case 'compound': {
      const k = Math.min(220 / spec.w, 170 / (spec.h + spec.w / 2));
      const w = spec.w * k;
      const h = spec.h * k;
      const x0 = 200 - w / 2;
      const yTop = 40 + w / 2;
      const yBot = yTop + h;
      const cx = 200;
      const u = spec.unit;
      const fmt = (x: number) => M.fmt(x, 2);
      const desc = `Compound shape: a rectangle ${fmt(spec.w)} ${u} wide and ${fmt(spec.h)} ${u} tall, with a semicircle of diameter ${fmt(spec.w)} ${u} on top. A dashed line marks where the two parts join.`;
      return (
        <figure className="diagram">
          <Svg label={desc} h={Math.max(H, yBot + 40)}>
            <path className={`part ${hl('semi') ? 'part-hl semi-hl' : ''}`} d={`M${x0},${yTop} A${w / 2},${w / 2} 0 0 1 ${x0 + w},${yTop} Z`} />
            <rect className={`part ${hl('rect') ? 'part-hl rect-hl' : ''}`} x={x0} y={yTop} width={w} height={h} />
            <path className="shape-outline" d={`M${x0},${yTop} A${w / 2},${w / 2} 0 0 1 ${x0 + w},${yTop} L${x0 + w},${yBot} L${x0},${yBot} Z`} />
            <line className={`internal ${hl('diameter') ? 'hl-line' : ''}`} x1={x0} y1={yTop} x2={x0 + w} y2={yTop} />
            {hl('radius') && <line className="hl-line" x1={cx} y1={yTop} x2={cx + (w / 2) * Math.cos(-0.7)} y2={yTop + (w / 2) * Math.sin(-0.7)} />}
            {hl('radius') && <Label x={cx + 30} y={yTop - 40} text="r" hl />}
            <line className={`dimline ${hl('width') ? 'hl-line' : ''}`} x1={x0} y1={yBot + 18} x2={x0 + w} y2={yBot + 18} markerStart="url(#arr)" markerEnd="url(#arr)" />
            <Label x={cx} y={yBot + 34} text={`${fmt(spec.w)} ${u}`} hl={hl('width')} />
            <line className={`dimline ${hl('height') ? 'hl-line' : ''}`} x1={x0 + w + 18} y1={yTop} x2={x0 + w + 18} y2={yBot} markerStart="url(#arr)" markerEnd="url(#arr)" />
            <Label x={x0 + w + 26} y={(yTop + yBot) / 2} text={`${fmt(spec.h)} ${u}`} anchor="start" hl={hl('height')} />
            {hl('diameter') && <Label x={cx} y={yTop + 14} text={`d = ${fmt(spec.w)} ${u}`} hl size={13} />}
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="arrowhead" />
              </marker>
            </defs>
          </Svg>
          <figcaption>Dashed line: where the rectangle and semicircle join (inside the shape, not part of its edge).</figcaption>
        </figure>
      );
    }
    case 'cube': {
      const s = 130;
      const off = { x: 62, y: -48 };
      const F = [{ x: 90, y: 110 }, { x: 90 + s, y: 110 }, { x: 90 + s, y: 110 + s }, { x: 90, y: 110 + s }]; // TL TR BR BL
      const B = F.map((p) => add(p, off));
      const e = (a: P, b: P, hidden = false, key?: string) => <line key={key} className={`${hidden ? 'hidden-edge' : 'edge'} ${hl('edges') ? 'hl-line' : ''}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
      const size = `${spec.size} ${spec.unit}`;
      const desc = `Sketch of a cube with edges of ${size}. Dashed lines are hidden edges.`;
      return (
        <figure className="diagram">
          <Svg label={desc}>
            <polygon className="face" points={pts(F)} />
            <polygon className="face face-top" points={pts([F[0], F[1], B[1], B[0]])} />
            <polygon className="face face-side" points={pts([F[1], B[1], B[2], F[2]])} />
            {e(B[3], B[0], true, 'h1')}
            {e(B[3], B[2], true, 'h2')}
            {e(B[3], F[3], true, 'h3')}
            {[0, 1, 2, 3].map((i) => e(F[i], F[(i + 1) % 4], false, `f${i}`))}
            {e(F[0], B[0], false, 'a')}
            {e(F[1], B[1], false, 'b')}
            {e(F[2], B[2], false, 'c')}
            {e(B[0], B[1], false, 'd')}
            {e(B[1], B[2], false, 'g')}
            <Label x={90 + s / 2} y={110 + s + 20} text={size} />
            {spec.marks === 'one' && <Label x={F[2].x + off.x / 2 + 16} y={F[2].y + off.y / 2 + 6} text="x" hl anchor="start" />}
            {(spec.marks === 'three' || spec.marks === 'all') && (
              <>
                <Label x={70} y={110 + s / 2} text={size} anchor="end" />
                <Label x={F[2].x + off.x / 2 + 12} y={F[2].y + off.y / 2 + 8} text={size} anchor="start" />
              </>
            )}
            {spec.marks === 'all' && <Label x={B[0].x + s / 2} y={B[0].y - 14} text={size} />}
          </Svg>
        </figure>
      );
    }
    case 'cube3d':
      return <Cube3D plane={spec.plane} explore={spec.explore} highlight={highlight} />;
    case 'triangle-sides': {
      const A0 = { x: 0, y: 0 };
      const B0 = { x: spec.base, y: 0 };
      const [C0] = M.circleIntersections(A0, spec.left, B0, spec.right).sort((a, b) => a.y - b.y);
      const f = fit([A0, B0, C0], 50);
      const [A, Bp, C] = [A0, B0, C0].map(f);
      const c = centroid([A, Bp, C]);
      const l1 = sideLabel(A, Bp, c);
      const l2 = sideLabel(A, C, c);
      const l3 = sideLabel(Bp, C, c);
      return (
        <figure className="diagram">
          <Svg label={`Triangle with sides ${spec.base}, ${spec.left} and ${spec.right} ${spec.unit}.`}>
            <polygon className="shape" points={pts([A, Bp, C])} />
            <Label x={l1.x} y={l1.y} text={`${spec.base} ${spec.unit}`} />
            <Label x={l2.x} y={l2.y} text={`${spec.left} ${spec.unit}`} />
            <Label x={l3.x} y={l3.y} text={`${spec.right} ${spec.unit}`} />
          </Svg>
        </figure>
      );
    }
    case 'prefix-scale':
      return (
        <figure className="diagram diagram-html">
          <div className="prefix-scale" role="table" aria-label="Metric prefixes">
            <div role="rowgroup">
              {M.PREFIXES.map((p) => (
                <div key={p.name} role="row" className={`prefix-cell ${p.power > 0 ? 'big' : p.power < 0 ? 'small' : 'base'}`}>
                  <span role="cell" className="pname">{p.name}</span>
                  <span role="cell" className="psym">{p.symbol || '—'}</span>
                  <span role="cell" className="ppow"><TeX tex={`10^{${p.power}}`} /></span>
                </div>
              ))}
            </div>
          </div>
          <figcaption>Each prefix multiplies the base unit by a power of ten.</figcaption>
        </figure>
      );
    case 'mass-ladder': {
      const units = ['t', 'kg', 'g', 'mg'];
      const names: Record<string, string> = { t: 'tonnes', kg: 'kilograms', g: 'grams', mg: 'milligrams' };
      return (
        <figure className="diagram diagram-html">
          <ol className="ladder" aria-label="Mass units from heaviest to lightest; each step is 1000 times">
            {units.map((u, i) => (
              <li key={u} className={u === spec.from ? 'from' : u === spec.to ? 'to' : ''}>
                <span className="ladder-unit">{u}</span> <span className="ladder-name">{names[u]}</span>
                {u === spec.from && <span className="ladder-tag">from</span>}
                {u === spec.to && <span className="ladder-tag">to</span>}
                {i < 3 && <span className="ladder-step" aria-hidden="true">× 1000 ↓ · ↑ ÷ 1000</span>}
              </li>
            ))}
          </ol>
          <figcaption>Going down: multiply by 1000. Going up: divide by 1000.</figcaption>
        </figure>
      );
    }
    case 'sf-shift':
      return (
        <figure className="diagram diagram-html">
          <div className="sf-shift">
            <span className="sf-digits">{spec.digits}</span>
            {highlight.includes('jumps') && (
              <span className="sf-note">
                The decimal point moves {spec.places} place{spec.places === 1 ? '' : 's'} to the {spec.direction}.
              </span>
            )}
          </div>
          <figcaption>Move the decimal point until one non-zero digit is in front of it.</figcaption>
        </figure>
      );
  }
}
