import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { lessonById, topicById } from '../content';
import { StatusChip } from '../components/common';
import { GinaSays } from '../components/Gina';
import { TopicIcon } from '../components/TopicIcon';
import { lessonStatus } from '../lib/progress';
import { useStore } from '../lib/store';
import { NotFoundPage } from './NotFoundPage';

export function TopicPage() {
  const { id } = useParams();
  const t = id ? topicById(id) : undefined;
  const { data } = useStore();
  useEffect(() => {
    if (t) document.title = `${t.title} · Geometry 2`;
  }, [t]);
  if (!t) return <NotFoundPage />;
  return (
    <div style={{ ['--accent' as string]: t.colour, ['--tint' as string]: t.tint }}>
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> › <span aria-current="page">{t.title}</span></nav>
      <div className="topic-header">
        <TopicIcon id={t.id} colour={t.colour} />
        <div>
          <h1>{t.title}</h1>
          <p className="lead">{t.blurb}</p>
        </div>
      </div>
      <GinaSays pose="curious" text="Work through the lessons in order, or jump to the one you need. Each lesson has a worked example, practice and a mastery check." />
      <ol className="lesson-list">
        {t.lessons.map((lid, i) => {
          const l = lessonById(lid)!;
          const st = lessonStatus(data, lid);
          return (
            <li key={lid} className="card lesson-row">
              <span className="lesson-num" aria-hidden="true">{i + 1}</span>
              <div className="lesson-info">
                <h2><Link to={`/lesson/${lid}`}>{l.title}</Link></h2>
                <p>{l.blurb}</p>
                {l.prereq && <p className="small muted">Builds on: {l.prereq.map((p) => lessonById(p)!.title).join(', ')}</p>}
              </div>
              <StatusChip status={st} />
              <Link className="btn btn-primary" to={`/lesson/${lid}`} aria-label={`${st === 'not-started' ? 'Start' : 'Continue'} ${l.title}`}>{st === 'not-started' ? 'Start' : 'Continue'}</Link>
            </li>
          );
        })}
      </ol>
      <div className="btn-row">
        <Link className="btn btn-secondary" to={`/practice?mode=topic&topic=${t.id}`}>Practise this whole topic</Link>
        <Link className="btn btn-ghost" to="/reference">Formula reference</Link>
      </div>
    </div>
  );
}
