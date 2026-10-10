import { useRef, useState } from 'react';
import { CUBE_EDGES, CUBE_VERTICES, SYMMETRY_PLANES, planeById, planeSection, type Plane, type V3 } from '../math/cube';

const FACES: number[][] = [
  // vertex indices (x,y,z in {-1,1}; index = 4*(x>0) + 2*(y>0) + (z>0))
  [0, 1, 3, 2], // x = -1
  [4, 6, 7, 5], // x = +1
  [0, 4, 5, 1], // y = -1
  [2, 3, 7, 6], // y = +1
  [0, 2, 6, 4], // z = -1
  [1, 5, 7, 3], // z = +1
];
const FACE_NORMALS: V3[] = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]];
const PLANE_COLOURS = ['#e8590c', '#1c7ed6', '#2b8a3e', '#c2255c', '#7048e8', '#0c8599', '#e67700', '#5c940d', '#862e9c'];

function rotate(p: V3, yaw: number, pitch: number): V3 {
  const [x, y, z] = p;
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  return [x1, y2, z2];
}

/**
 * Rotatable cube showing planes. Drag to turn it, or use the buttons.
 * explore: step through the 9 planes of symmetry one at a time.
 * highlight 'face-planes' / 'edge-planes': show those groups together.
 */
export function Cube3D({ plane, explore, highlight = [] }: { plane?: string; explore?: boolean; highlight?: string[] }) {
  const [yaw, setYaw] = useState(-0.6);
  const [pitch, setPitch] = useState(0.45);
  const [idx, setIdx] = useState(0);
  const drag = useRef<{ x: number; y: number } | null>(null);

  let shown: Plane[] = [];
  if (explore) shown = [SYMMETRY_PLANES[idx]];
  else if (highlight.includes('face-planes')) shown = SYMMETRY_PLANES.filter((p) => p.family === 'face');
  else if (highlight.includes('edge-planes')) shown = SYMMETRY_PLANES.filter((p) => p.family === 'edge');
  else if (plane) shown = [planeById(plane)!].filter(Boolean);

  const S = 92;
  const C = { x: 200, y: 150 };
  const proj = (p: V3) => {
    const r = rotate(p, yaw, pitch);
    return { x: C.x + S * r[0], y: C.y - S * r[1], z: r[2] };
  };
  const V = CUBE_VERTICES.map(proj);
  const faceFront = FACE_NORMALS.map((n) => rotate(n, yaw, pitch)[2] > 0);
  const edgeHidden = CUBE_EDGES.map(([a, b]) => {
    const adj = FACES.map((f, i) => (f.includes(a) && f.includes(b) ? i : -1)).filter((i) => i >= 0);
    return adj.every((i) => !faceFront[i]);
  });

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setYaw((y) => y + dx * 0.012);
    setPitch((p) => Math.max(-1.4, Math.min(1.4, p + dy * 0.012)));
  };
  const onUp = () => (drag.current = null);

  const desc = explore
    ? `Cube showing plane of symmetry ${idx + 1} of 9: ${SYMMETRY_PLANES[idx].label}.`
    : shown.length > 1
      ? `Cube showing ${shown.length} planes of symmetry at once.`
      : shown[0]
        ? `Cube with a shaded plane: ${shown[0].label}.`
        : 'A cube.';

  return (
    <figure className="diagram cube3d">
      <svg
        className="diagram-svg cube-svg"
        viewBox="0 0 400 300"
        role="img"
        aria-label={desc}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ touchAction: 'none' }}
      >
        {CUBE_EDGES.map(([a, b], i) => edgeHidden[i] && <line key={`h${i}`} className="hidden-edge" x1={V[a].x} y1={V[a].y} x2={V[b].x} y2={V[b].y} />)}
        {shown.map((pl, i) => {
          const sec = planeSection(pl).map(proj);
          const col = shown.length > 1 ? PLANE_COLOURS[SYMMETRY_PLANES.indexOf(pl) % PLANE_COLOURS.length] : '#e8590c';
          return <polygon key={pl.id} points={sec.map((p) => `${p.x},${p.y}`).join(' ')} fill={col} fillOpacity={shown.length > 1 ? 0.22 : 0.38} stroke={col} strokeWidth={2} strokeDasharray={i % 2 ? '6 3' : undefined} />;
        })}
        {FACES.map((f, i) => faceFront[i] && <polygon key={`f${i}`} className="cube-face" points={f.map((k) => `${V[k].x},${V[k].y}`).join(' ')} />)}
        {CUBE_EDGES.map(([a, b], i) => !edgeHidden[i] && <line key={`e${i}`} className="edge" x1={V[a].x} y1={V[a].y} x2={V[b].x} y2={V[b].y} />)}
      </svg>
      <div className="cube-controls">
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setYaw((y) => y - 0.35)} aria-label="Turn cube left">⟲ Turn</button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setYaw((y) => y + 0.35)} aria-label="Turn cube right">Turn ⟳</button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setPitch((p) => Math.max(-1.4, p - 0.3))} aria-label="Tilt cube up">Tilt ↑</button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setPitch((p) => Math.min(1.4, p + 0.3))} aria-label="Tilt cube down">Tilt ↓</button>
      </div>
      {explore && (
        <div className="cube-explore">
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIdx((i) => (i + 8) % 9)} aria-label="Previous plane">◀</button>
          <p aria-live="polite">
            <strong>Plane {idx + 1} of 9</strong> — {SYMMETRY_PLANES[idx].family === 'face' ? 'halfway between opposite faces' : 'through a pair of opposite edges'}
          </p>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIdx((i) => (i + 1) % 9)} aria-label="Next plane">▶</button>
        </div>
      )}
      <figcaption>Drag the cube, or use the buttons, to look from different sides. Dashed lines are hidden edges.</figcaption>
    </figure>
  );
}
