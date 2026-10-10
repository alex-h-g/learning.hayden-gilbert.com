import { useState } from 'react';
import type { Pose } from '../content/types';
import { asset } from '../lib/paths';
import { Rich } from './Rich';

export const POSES: Pose[] = ['waving', 'thinking', 'explaining', 'curious', 'encouraging', 'celebrating', 'cheering', 'reassuring', 'neutral'];
export const ginaSrc = (pose: Pose) => asset(`gina/gina-${pose}.webp`);

const ALT: Record<Pose, string> = {
  waving: 'Gina waving hello',
  thinking: 'Gina thinking, hand on chin',
  explaining: 'Gina pointing as she explains',
  curious: 'Gina looking curious with hands open',
  encouraging: 'Gina giving a thumbs up',
  celebrating: 'Gina celebrating with both fists up',
  cheering: 'Gina cheering',
  reassuring: 'Gina smiling kindly, hand on heart',
  neutral: 'Gina smiling',
};

/** Gina's picture. Falls back to a plain circle if the image can't load. */
export function GinaImg({ pose, size = 'md', className = '' }: { pose: Pose; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={`gina-img gina-${size} gina-fallback ${className}`} role="img" aria-label="Geometry Gina" />;
  return <img className={`gina-img gina-${size} ${className}`} src={ginaSrc(pose)} alt={ALT[pose]} onError={() => setFailed(true)} draggable={false} />;
}

/** Gina with a speech bubble. The bubble text is announced to screen readers. */
export function GinaSays({ pose, text, children, size = 'md', live = true }: { pose: Pose; text?: string; children?: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; live?: boolean }) {
  return (
    <div className={`gina-says gina-says-${size}`}>
      <GinaImg pose={pose} size={size} />
      <div className="bubble" aria-live={live ? 'polite' : undefined}>
        {text && <Rich text={text} as="div" />}
        {children}
      </div>
    </div>
  );
}

/** Preloads all poses so pose changes are instant. */
export function preloadGina() {
  if (typeof window === 'undefined') return;
  for (const p of POSES) {
    const i = new Image();
    i.src = ginaSrc(p);
  }
}
