import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { TOPICS, lessonById } from '../content';
import { GinaSays } from '../components/Gina';
import { ProgressBar, StatusChip, Stars } from '../components/common';
import { TopicIcon } from '../components/TopicIcon';
import { lessonStatus, suggestedLesson, topicStatus, totalAnswered, weakSkills } from '../lib/progress';
import { store, useStore } from '../lib/store';

export function HomePage() {
  const { data } = useStore();
  useEffect(() => {
    document.title = 'Geometry 2 with Geometry Gina · Learning';
  }, []);
  return data.welcomed ? <Dashboard /> : <Welcome />;
}

function Welcome() {
  const [name, setName] = useState('');
  const id = useId();
  const go = (n: string | null) => store.update((d) => {
    d.name = n?.trim().slice(0, 30) || null;
    d.welcomed = true;
  });
  return (
    <section className="welcome card">
      <GinaSays pose="waving" size="xl" text={'**Hi there! I’m Geometry Gina.**\n\nWe’re going to explore angles, shapes, circles and some clever mathematical tricks together.\n\nWhat should I call you?'}>
        <form
          className="welcome-form"
          onSubmit={(e) => {
            e.preventDefault();
            go(name);
          }}
        >
          <label htmlFor={id}>Your first name or a nickname <span className="muted">(optional)</span></label>
          <input id={id} type="text" maxLength={30} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" />
          <button type="submit" className="btn btn-primary btn-lg">Let’s go! →</button>
          <button type="button" className="btn btn-link" onClick={() => go(null)}>Continue without a name</button>
          <p className="small muted">No sign-up. Your name and progress are saved only in this browser, on this device — they won’t follow you to another device.</p>
        </form>
      </GinaSays>
    </section>
  );
}

function Dashboard() {
  const { data } = useStore();
  const answered = totalAnswered(data);
  const next = suggestedLesson(data);
  const weak = weakSkills(data);
  const last = data.lastLesson && lessonById(data.lastLesson) ? data.lastLesson : null;
  const greeting = answered === 0 && !last
    ? `Lovely to meet you${data.name ? `, ${data.name}` : ''}.\n\nWe can practise angles, Pythagoras, circles, constructions and metric measurements. We’ll take things one step at a time.`
    : `Welcome back${data.name ? `, ${data.name}` : ''}! ${weak.length ? `Shall we have another look at **${lessonById(weak[0].id)!.title}**, or carry on?` : 'Pick up where you left off, or choose a topic.'}`;
  return (
    <div className="dashboard">
      <section className="dash-hero card">
        <GinaSays pose={answered === 0 ? 'waving' : 'encouraging'} size="lg" text={greeting} />
        <div className="dash-actions">
          <Link className="btn btn-primary btn-lg" to={`/lesson/${next}`}>{answered === 0 ? 'Start learning' : `Next: ${lessonById(next)!.title}`}</Link>
          {last && <Link className="btn btn-secondary" to={`/lesson/${last}`}>Continue: {lessonById(last)!.title}</Link>}
          <a className="btn btn-secondary" href="#topics">Choose a topic</a>
          <Link className="btn btn-secondary" to="/progress">Review my progress</Link>
          <Link className="btn btn-secondary" to="/practice?mode=mistakes">Practise my mistakes{weak.length ? ` (${weak.length})` : ''}</Link>
          <Link className="btn btn-secondary" to="/guide">My revision guide</Link>
          <Link className="btn btn-secondary" to="/converter">Unit converter</Link>
        </div>
        <p className="dash-stats small muted">
          <Stars n={data.stars} /> · {data.badges.length} badge{data.badges.length === 1 ? '' : 's'} · {answered} question{answered === 1 ? '' : 's'} answered
        </p>
      </section>

      <h2 id="topics" className="section-title">Choose a topic</h2>
      <ul className="topic-grid">
        {TOPICS.map((t) => {
          const st = topicStatus(data, t.id);
          const conf = t.lessons.filter((id) => lessonStatus(data, id) === 'confident').length;
          const started = t.lessons.some((id) => lessonStatus(data, id) !== 'not-started');
          const firstOpen = t.lessons.find((id) => lessonStatus(data, id) !== 'confident') ?? t.lessons[0];
          return (
            <li key={t.id} className="topic-card card" style={{ ['--accent' as string]: t.colour, ['--tint' as string]: t.tint }}>
              <div className="topic-top">
                <TopicIcon id={t.id} colour={t.colour} />
                <div>
                  <h3><Link to={`/topic/${t.id}`}>{t.title}</Link></h3>
                  <StatusChip status={st} />
                </div>
              </div>
              <p className="topic-blurb">{t.blurb}</p>
              <ProgressBar value={conf} max={t.lessons.length} label={`${t.title}: ${conf} of ${t.lessons.length} lessons confident`} />
              <p className="small muted">{conf} of {t.lessons.length} lessons confident</p>
              <div className="btn-row">
                <Link className="btn btn-primary" to={`/lesson/${firstOpen}`}>{started ? 'Continue' : 'Start'}</Link>
                <Link className="btn btn-ghost" to={`/topic/${t.id}`}>All lessons</Link>
              </div>
            </li>
          );
        })}
        <li className="topic-card card" style={{ ['--accent' as string]: '#b8860b', ['--tint' as string]: '#fff8e1' }}>
          <div className="topic-top">
            <TopicIcon id="exam" colour="#b8860b" />
            <div>
              <h3><Link to="/practice?mode=exam">Mixed Exam Practice</Link></h3>
              {data.examBest !== null && <span className="chip">Best: {Math.round(data.examBest * 100)}%</span>}
            </div>
          </div>
          <p className="topic-blurb">10 fresh questions from every topic, like the real exam.</p>
          <div className="btn-row"><Link className="btn btn-primary" to="/practice?mode=exam">Start</Link></div>
        </li>
        <li className="topic-card card" style={{ ['--accent' as string]: '#5f3dc4', ['--tint' as string]: '#f3f0ff' }}>
          <div className="topic-top">
            <TopicIcon id="progress" colour="#5f3dc4" />
            <div><h3><Link to="/progress">My Progress</Link></h3></div>
          </div>
          <p className="topic-blurb">Badges, strengths, and what to practise next.</p>
          <div className="btn-row"><Link className="btn btn-primary" to="/progress">View</Link></div>
        </li>
      </ul>
    </div>
  );
}
