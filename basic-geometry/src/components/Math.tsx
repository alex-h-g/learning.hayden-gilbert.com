import katex from 'katex';
import { memo, useMemo } from 'react';

interface Props {
  tex: string;
  display?: boolean;
  className?: string;
  /** Accessible reading; KaTeX also emits MathML for screen readers. */
  label?: string;
}

/** Renders LaTeX with KaTeX. Raw LaTeX is never shown: on error, a plain fallback is used. */
export const Math = memo(function Math({ tex, display = false, className, label }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: display, throwOnError: true, output: 'htmlAndMathml', strict: 'ignore' });
    } catch {
      return null;
    }
  }, [tex, display]);
  if (html === null) {
    return <span className={className}>{label ?? 'formula unavailable'}</span>;
  }
  return <span className={`math ${className ?? ''}`} title={label} dangerouslySetInnerHTML={{ __html: html }} />;
});
