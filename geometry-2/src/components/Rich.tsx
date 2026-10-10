import { Fragment, type ReactNode } from 'react';
import { Math } from './Math';

/** Renders text with **bold**, inline $LaTeX$ and paragraphs (blank line). */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const parts = text.split(/(\$[^$]+\$)/g);
  parts.forEach((part, i) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
      out.push(<Math key={`${key}-m${i}`} tex={part.slice(1, -1)} />);
    } else if (part) {
      part.split(/(\*\*[^*]+\*\*)/g).forEach((p, j) => {
        if (p.startsWith('**') && p.endsWith('**')) out.push(<strong key={`${key}-b${i}-${j}`}>{p.slice(2, -2)}</strong>);
        else if (p) out.push(<Fragment key={`${key}-t${i}-${j}`}>{p}</Fragment>);
      });
    }
  });
  return out;
}

export function Rich({ text, as = 'span', className }: { text: string; as?: 'span' | 'div'; className?: string }) {
  const paras = text.split(/\n\n+/);
  if (as === 'span' && paras.length === 1) return <span className={className}>{inline(text, 'r')}</span>;
  return (
    <div className={className}>
      {paras.map((p, i) => (
        <p key={i}>{inline(p, `p${i}`)}</p>
      ))}
    </div>
  );
}

/** Plain-text version of rich text (for aria-live and titles). */
export function plain(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\$([^$]+)\$/g, (_, t: string) =>
      t
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\^\\circ/g, '°')
        .replace(/\\pi/g, 'π')
        .replace(/\\sqrt\{([^}]*)\}/g, '√$1')
        .replace(/\\approx/g, '≈')
        .replace(/\\le/g, '≤')
        .replace(/\\angle\s*/g, '∠')
        .replace(/\\dfrac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
        .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
        .replace(/\^\{([^}]*)\}/g, '^$1')
        .replace(/\\text\{([^}]*)\}/g, '$1')
        .replace(/\{,\}/g, ',')
        .replace(/\\[a-z]+/gi, '')
        .replace(/[{}]/g, ''),
    );
}
