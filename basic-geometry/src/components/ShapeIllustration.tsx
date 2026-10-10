import { getFormula } from '../data/formulas';
import type { ShapeId } from '../data/types';

interface Props {
  shape: ShapeId;
  /** Show dimension labels (r, h, l …) — used on the calculator, reference and review screens. */
  labelled?: boolean;
  /** Label the diagram for this formula's letters (e.g. parallelogram perimeter uses a and b, area uses b and h). */
  formulaId?: string;
  className?: string;
  title?: string;
}

const C = {
  square: { fill: '#5b9df9', stroke: '#2563c9' },
  rectangle: { fill: '#b7ebc6', stroke: '#3f9a5d' },
  triangle: { fill: '#f27ba1', stroke: '#c43c6c' },
  parallelogram: { fill: '#f7c948', stroke: '#b98a0d' },
  trapezoid: { fill: '#9fe2e3', stroke: '#2f9a9c' },
  circle: { fill: '#c6a8f8', stroke: '#7c4fd6' },
  cube: { fill: '#f58fa8', stroke: '#c43c6c' },
  'rectangular-prism': { fill: '#fdba74', stroke: '#c46a12' },
  prism: { fill: '#99e1c4', stroke: '#2f8f6a' },
  cylinder: { fill: '#7fb6fb', stroke: '#2563c9' },
  cone: { fill: '#fcb07e', stroke: '#c46a12' },
  'square-pyramid': { fill: '#f7d36b', stroke: '#b98a0d' },
  sphere: { fill: '#c6a8f8', stroke: '#7c4fd6' },
} as const;

/** Lighten a hex colour for 3D shading. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, ((n >> s) & 255) + amt));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function Label({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} className="shape-label" textAnchor="middle" dominantBaseline="middle">
      {children}
    </text>
  );
}

const dash = { strokeDasharray: '5 4', stroke: 'var(--ink-2)', strokeWidth: 1.6, fill: 'none' } as const;

function RightAngle({ x, y, dir = 1 }: { x: number; y: number; dir?: 1 | -1 }) {
  return <path d={`M${x + 9 * dir} ${y} L${x + 9 * dir} ${y - 9} L${x} ${y - 9}`} fill="none" stroke="var(--ink-2)" strokeWidth={1.4} />;
}

/** Letters used by a formula, e.g. {"a","b","h"}; null = show every label. */
function lettersFor(formulaId?: string): Set<string> | null {
  const f = formulaId ? getFormula(formulaId) : undefined;
  if (!f) return null;
  const out = new Set<string>();
  for (const v of f.variables) for (const part of v.symbol.split(',')) out.add(part.trim());
  return out;
}

export function ShapeIllustration({ shape, labelled = false, formulaId, className, title }: Props) {
  const letters = lettersFor(formulaId);
  const has = (ch: string) => labelled && (!letters || letters.has(ch));
  const { fill, stroke } = C[shape];
  const sw = 2.5;
  const common = { fill, stroke, strokeWidth: sw, strokeLinejoin: 'round' as const };
  let body: JSX.Element;

  switch (shape) {
    case 'square':
      body = (
        <>
          <rect x={52} y={22} width={96} height={96} rx={3} {...common} />
          {labelled && <Label x={100} y={134}>s</Label>}
        </>
      );
      break;
    case 'rectangle':
      body = (
        <>
          <rect x={28} y={36} width={144} height={80} rx={3} {...common} />
          {labelled && (
            <>
              <Label x={100} y={132}>l</Label>
              <Label x={186} y={76}>w</Label>
            </>
          )}
        </>
      );
      break;
    case 'triangle':
      body = (
        <>
          <polygon points="28,122 172,122 118,26" {...common} />
          {labelled && formulaId === 'triangle-perimeter' && (
            <>
              <Label x={100} y={138}>a</Label>
              <Label x={160} y={70}>b</Label>
              <Label x={62} y={66}>c</Label>
            </>
          )}
          {labelled && formulaId !== 'triangle-perimeter' && (
            <>
              <line x1={118} y1={26} x2={118} y2={122} {...dash} />
              <RightAngle x={118} y={122} />
              <Label x={100} y={138}>b</Label>
              <Label x={130} y={84}>h</Label>
            </>
          )}
        </>
      );
      break;
    case 'parallelogram':
      body = (
        <>
          <polygon points="24,118 140,118 176,38 60,38" {...common} />
          {labelled && formulaId === 'parallelogram-perimeter' && (
            <>
              {/* Perimeter: a = base, b = slanted side (two of each) */}
              <Label x={82} y={134}>a</Label>
              <Label x={118} y={24}>a</Label>
              <Label x={172} y={84}>b</Label>
              <Label x={28} y={74}>b</Label>
            </>
          )}
          {labelled && formulaId !== 'parallelogram-perimeter' && (
            <>
              <line x1={60} y1={38} x2={60} y2={118} {...dash} />
              <RightAngle x={60} y={118} />
              <Label x={82} y={134}>b</Label>
              <Label x={48} y={80}>h</Label>
            </>
          )}
        </>
      );
      break;
    case 'trapezoid':
      body = (
        <>
          <polygon points="24,118 176,118 140,40 62,40" {...common} />
          {has('h') && (
            <>
              <line x1={100} y1={40} x2={100} y2={118} {...dash} />
              <RightAngle x={100} y={118} />
              <Label x={112} y={80}>h</Label>
            </>
          )}
          {has('a') && <Label x={101} y={26}>a</Label>}
          {has('b') && <Label x={100} y={134}>b</Label>}
          {has('c') && <Label x={30} y={76}>c</Label>}
          {has('d') && <Label x={170} y={76}>d</Label>}
        </>
      );
      break;
    case 'circle':
      body = (
        <>
          <circle cx={100} cy={72} r={56} {...common} />
          <circle cx={100} cy={72} r={3} fill="var(--ink)" />
          {labelled && (
            <>
              <line x1={100} y1={72} x2={156} y2={72} {...dash} />
              <Label x={128} y={60}>r</Label>
            </>
          )}
        </>
      );
      break;
    case 'cube':
      body = (
        <>
          <polygon points="50,52 122,52 150,28 78,28" fill={shade(fill, 30)} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <polygon points="122,52 150,28 150,100 122,124" fill={shade(fill, -25)} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <rect x={50} y={52} width={72} height={72} {...common} />
          {labelled && <Label x={86} y={138}>s</Label>}
        </>
      );
      break;
    case 'rectangular-prism':
      body = (
        <>
          <polygon points="28,60 136,60 166,34 58,34" fill={shade(fill, 30)} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <polygon points="136,60 166,34 166,98 136,124" fill={shade(fill, -25)} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <rect x={28} y={60} width={108} height={64} {...common} />
          {labelled && (
            <>
              <Label x={82} y={138}>l</Label>
              <Label x={162} y={122}>w</Label>
              <Label x={16} y={92}>h</Label>
            </>
          )}
        </>
      );
      break;
    case 'prism':
      body = (
        <>
          <polygon points="58,40 158,40 182,112 82,112" fill={shade(fill, -20)} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <polygon points="18,112 82,112 58,40" fill={shade(fill, 25)} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          {has('B') && <Label x={52} y={92}>B</Label>}
          {has('P') && <Label x={24} y={70}>P</Label>}
          {has('h') && <Label x={132} y={128}>h</Label>}
        </>
      );
      break;
    case 'cylinder':
      body = (
        <>
          <path d="M56 34 L56 112 A44 13 0 0 0 144 112 L144 34" {...common} />
          <ellipse cx={100} cy={34} rx={44} ry={13} fill={shade(fill, 35)} stroke={stroke} strokeWidth={sw} />
          {labelled && (
            <>
              <line x1={100} y1={34} x2={144} y2={34} {...dash} />
              <Label x={122} y={24}>r</Label>
              <Label x={160} y={74}>h</Label>
            </>
          )}
        </>
      );
      break;
    case 'cone':
      body = (
        <>
          <path d="M100 18 L54 112 A46 14 0 0 0 146 112 Z" {...common} />
          <ellipse cx={100} cy={112} rx={46} ry={14} fill={shade(fill, 25)} stroke={stroke} strokeWidth={sw} />
          {has('h') && (
            <>
              <line x1={100} y1={18} x2={100} y2={112} {...dash} />
              <Label x={90} y={70}>h</Label>
            </>
          )}
          {has('r') && (
            <>
              <line x1={100} y1={112} x2={146} y2={112} {...dash} />
              <Label x={124} y={102}>r</Label>
            </>
          )}
          {has('l') && <Label x={136} y={60}>l</Label>}
        </>
      );
      break;
    case 'square-pyramid':
      body = (
        <>
          <polygon points="36,112 128,112 100,18" fill={shade(fill, 20)} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <polygon points="128,112 166,88 100,18" fill={shade(fill, -25)} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M36 112 L74 88 L166 88" fill="none" stroke={stroke} strokeWidth={1.4} strokeDasharray="4 4" />
          {has('h') && (
            <>
              <line x1={100} y1={18} x2={100} y2={100} {...dash} />
              <Label x={110} y={66}>h</Label>
            </>
          )}
          {has('l') && (
            <>
              <line x1={100} y1={18} x2={82} y2={112} stroke="var(--ink-2)" strokeWidth={1.6} />
              <Label x={78} y={66}>l</Label>
            </>
          )}
          {has('s') && <Label x={82} y={128}>s</Label>}
        </>
      );
      break;
    case 'sphere':
      body = (
        <>
          <defs>
            <radialGradient id="sphere-grad" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor={shade(fill, 55)} />
              <stop offset="100%" stopColor={fill} />
            </radialGradient>
          </defs>
          <circle cx={100} cy={72} r={56} fill="url(#sphere-grad)" stroke={stroke} strokeWidth={sw} />
          <ellipse cx={100} cy={72} rx={56} ry={15} fill="none" stroke={stroke} strokeWidth={1.4} strokeDasharray="4 4" />
          <circle cx={100} cy={72} r={3} fill="var(--ink)" />
          {labelled && (
            <>
              <line x1={100} y1={72} x2={156} y2={72} {...dash} />
              <Label x={128} y={60}>r</Label>
            </>
          )}
        </>
      );
      break;
  }

  return (
    <svg
      viewBox="0 0 200 145"
      className={className ?? 'shape-svg'}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {body}
    </svg>
  );
}
