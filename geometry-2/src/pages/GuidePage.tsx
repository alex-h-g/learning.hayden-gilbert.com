import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LESSONS, lessonById } from '../content';
import { GinaSays } from '../components/Gina';
import { Rich } from '../components/Rich';
import { Diagram } from '../diagrams/Diagram';
import { seeded } from '../lib/random';
import { totalAnswered, weakSkills } from '../lib/progress';
import { useStore } from '../lib/store';

/** Personalised revision guide, built from this learner's recorded answers. Printable / save as PDF. */
export function GuidePage() {
  const { data } = useStore();
  useEffect(() => {
    document.title = 'My Revision Guide · Geometry 2';
  }, []);
  const answered = totalAnswered(data);
  const weak = weakSkills(data);
  // Personal as soon as anything has been found tricky; otherwise a general guide.
  const personal = answered >= 1 && weak.length > 0;
  const ids = personal ? weak.slice(0, 6).map((w) => w.id) : LESSONS.map((l) => l.id);
  // One fixed practice question per skill for this visit (so print matches screen).
  const practice = useMemo(() => {
    const rng = seeded(Math.floor(Math.random() * 2 ** 31));
    return Object.fromEntries(ids.map((id) => [id, lessonById(id)!.generate(rng, 1)]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="guide">
      <div className="guide-head">
        <div>
          <h1>{personal ? `${data.name ? `${data.name}’s` : 'My'} Revision Guide` : 'Geometry 2 Revision Guide'}</h1>
          <p className="muted">{personal ? `Made on ${today} from the questions you found trickiest.` : 'A general guide covering every topic.'}</p>
        </div>
        <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>🖨 Print or save as PDF</button>
      </div>
      <div className="no-print">
        <GinaSays
          pose={personal ? 'encouraging' : 'explaining'}
          text={
            personal
              ? 'You’ve done some excellent work. Let’s review a couple of things that could use a little more practice. Each section has the rule, a worked example, one to try and a mistake to avoid.'
              : answered < 1
                ? 'Once you’ve answered a few questions, this guide will focus on the things you find trickiest. For now, here’s a guide to everything.'
                : 'Nothing is giving you trouble right now — brilliant! Here’s a guide to every topic for revision.'
          }
        />
        <p className="small muted">In the print dialog choose “Save as PDF” to keep a copy. Nothing is uploaded — the guide is made in your browser.</p>
      </div>
      {ids.map((id, n) => {
        const l = lessonById(id)!;
        const ex = l.guided();
        const pq = practice[id];
        const s = data.skills[id];
        return (
          <article key={id} className="card guide-item">
            <h2>{n + 1}. {l.title}</h2>
            {personal && s && <p className="small muted">You’ve answered {s.attempted}: {s.firstTry} first time, {s.afterHelp} with help{s.revealed ? `, ${s.revealed} worked through together` : ''}.</p>}
            <h3>The rule</h3>
            <div className="rule-box"><Rich text={l.guide.rule} as="div" /></div>
            <Rich text={l.guide.explanation} as="div" />
            <h3>Worked example</h3>
            <Rich text={ex.question} as="div" />
            {ex.diagram && ex.diagram.type !== 'cube3d' && <div className="guide-diagram"><Diagram spec={ex.diagram} /></div>}
            <ol className="guide-steps">
              {ex.steps.filter((st) => st.kind !== 'widget').map((st) => (
                <li key={st.id}><Rich text={st.explain} /></li>
              ))}
            </ol>
            <p><strong>Answer:</strong> <Rich text={ex.answer} /></p>
            <h3>Try one</h3>
            <Rich text={pq.question} as="div" />
            {pq.diagram && pq.diagram.type !== 'cube3d' && <div className="guide-diagram"><Diagram spec={pq.diagram} /></div>}
            <details className="guide-answer">
              <summary>Show answer</summary>
              <p><strong>Answer:</strong> <Rich text={pq.answer} /></p>
              <Rich text={pq.summary} as="div" />
            </details>
            <div className="mistake"><strong>⚠ Common mistake:</strong> <Rich text={l.guide.mistake} /></div>
            <p className="no-print"><Link to={`/lesson/${id}`}>Practise {l.title} →</Link></p>
          </article>
        );
      })}
    </div>
  );
}
