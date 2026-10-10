import type { TopicId } from '../content/types';

/** Small illustration for each topic card. */
export function TopicIcon({ id, colour }: { id: TopicId | 'exam' | 'progress'; colour: string }) {
  const s = { fill: 'none', stroke: colour, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const f = { fill: colour, fillOpacity: 0.18 };
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
      {id === 'angles' && (
        <>
          <polygon points="32,6 56,22 50,52 14,52 8,22" {...f} {...s} />
          <path d="M14,52 L22,52 A8,8 0 0 0 16.5,44.4" {...s} strokeWidth={2} />
        </>
      )}
      {id === 'constructions' && (
        <>
          <path d="M32,8 L18,54 M32,8 L46,54" {...s} />
          <circle cx="32" cy="8" r="4" {...s} />
          <path d="M12,44 A24,24 0 0 1 52,44" {...s} strokeDasharray="4 4" strokeWidth={2} />
        </>
      )}
      {id === 'pythagoras' && (
        <>
          <polygon points="10,54 54,54 10,14" {...f} {...s} />
          <path d="M10,46 L18,46 L18,54" {...s} strokeWidth={2} />
        </>
      )}
      {id === 'circles' && (
        <>
          <path d="M14,30 A18,18 0 0 1 50,30 L50,56 L14,56 Z" {...f} {...s} />
          <line x1="14" y1="30" x2="50" y2="30" {...s} strokeDasharray="4 3" strokeWidth={2} />
        </>
      )}
      {id === 'metric' && (
        <>
          <path d="M18,24 L46,24 L54,54 L10,54 Z" {...f} {...s} />
          <circle cx="32" cy="16" r="6" {...s} />
          <text x="32" y="46" textAnchor="middle" fontSize="14" fontWeight="800" fill={colour}>kg</text>
        </>
      )}
      {id === 'standard-form' && (
        <text x="30" y="44" textAnchor="middle" fontSize="26" fontWeight="800" fill={colour}>
          10<tspan dy="-12" fontSize="16">n</tspan>
        </text>
      )}
      {id === 'exam' && (
        <>
          <rect x="14" y="8" width="36" height="48" rx="4" {...f} {...s} />
          <path d="M22,24 l4,4 l8,-8 M22,40 l4,4 l8,-8" {...s} strokeWidth={2.5} />
        </>
      )}
      {id === 'progress' && (
        <>
          <rect x="12" y="34" width="9" height="20" {...f} {...s} />
          <rect x="27" y="24" width="9" height="30" {...f} {...s} />
          <rect x="42" y="12" width="9" height="42" {...f} {...s} />
        </>
      )}
    </svg>
  );
}
