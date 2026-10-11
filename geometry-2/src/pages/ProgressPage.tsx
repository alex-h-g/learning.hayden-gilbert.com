import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { TOPICS, lessonById } from '../content';
import { BadgeGrid } from '../components/Badges';
import { GinaSays } from '../components/Gina';
import { ProgressBar, ResetProgressButton, StatusChip, Stars } from '../components/common';
import { confidence, lessonStatus, strongSkills, suggestedLesson, topicStatus, totalAnswered, weakSkills } from '../lib/progress';
import { store, useStore } from '../lib/store';

export function ProgressPage() {
  const { data } = useStore();
  const [name, setName] = useState(data.name ?? '');
  const [saved, setSaved] = useState(false);
  const nameId = useId();
  useEffect(() => {
    document.title = 'My Progress · Geometry 2';
  }, []);
  const answered = totalAnswered(data);
  const firstTry = Object.values(data.skills).reduce((n, s) => n + s.firstTry, 0);
  const weak = weakSkills(data);
  const strong = strongSkills(data).map((x) => x.id);
  const message =
    answered === 0
      ? 'You haven’t answered any questions yet. Start a lesson and I’ll keep track of how you’re getting on.'
      : `${strong.length ? `You’ve made great progress with **${lessonById(strong[0])!.title}**. ` : 'You’re making a good start. '}${weak.length ? `Let’s spend a little more time on **${lessonById(weak[0].id)!.title}**.` : 'Nothing needs extra practice right now — brilliant!'}`;
  const next = suggestedLesson(data);
  return (
    <div className="progress-page">
      <h1>My Progress</h1>
      <GinaSays pose="encouraging" text={message} />
      <section className="stat-row" aria-label="Summary">
        <div className="stat card"><span className="stat-num">{answered}</span><span>questions answered</span></div>
        <div className="stat card"><span className="stat-num">{answered ? Math.round((firstTry / answered) * 100) : 0}%</span><span>right first time</span></div>
        <div className="stat card"><span className="stat-num"><Stars n={data.stars} /></span><span>stars</span></div>
        <div className="stat card"><span className="stat-num">{data.examBest !== null ? `${Math.round(data.examBest * 100)}%` : '—'}</span><span>best mixed exam</span></div>
      </section>

      <div className="btn-row">
        <Link className="btn btn-primary" to={`/lesson/${next}`}>Suggested next: {lessonById(next)!.title}</Link>
        {weak.length > 0 && <Link className="btn btn-secondary" to="/practice?mode=mistakes">Practise my mistakes</Link>}
        <Link className="btn btn-secondary" to="/guide">My revision guide</Link>
      </div>

      {answered > 0 && (
        <div className="sw-grid">
          <section className="card sw sw-strong">
            <h2><span aria-hidden="true">💪</span> Your strengths</h2>
            {strong.length ? (
              <ul className="link-list">
                {strong.slice(0, 8).map((id) => {
                  const s = data.skills[id];
                  return (
                    <li key={id}>
                      <Link to={`/lesson/${id}`}>{lessonById(id)!.title}</Link>
                      <span className="muted small"> — {s.firstTry} of {s.attempted} right first time</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">Keep practising — skills appear here once you’ve got a few right first time in a row.</p>
            )}
          </section>
          <section className="card sw sw-weak">
            <h2><span aria-hidden="true">🎯</span> Needs more practice</h2>
            {weak.length ? (
              <>
                <ul className="link-list">
                  {weak.slice(0, 8).map((w) => {
                    const s = data.skills[w.id];
                    return (
                      <li key={w.id}>
                        <Link to={`/lesson/${w.id}`}>{lessonById(w.id)!.title}</Link>
                        <span className="muted small"> — {s.firstTry} of {s.attempted} first time{s.wrong.length ? `; recent answers to check: ${s.wrong.slice(-2).join(', ')}` : ''}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="small">These come up <strong>more often</strong> in Practise My Mistakes and in Mixed Exam Practice, until you’re getting them right first time.</p>
                <Link className="btn btn-primary" to="/practice?mode=mistakes">Practise these now</Link>
              </>
            ) : (
              <p className="muted">Nothing right now — brilliant!</p>
            )}
          </section>
        </div>
      )}

      <h2>Topics</h2>
      {TOPICS.map((t) => (
        <section key={t.id} className="card topic-progress" style={{ ['--accent' as string]: t.colour }}>
          <div className="tp-head">
            <h3><Link to={`/topic/${t.id}`}>{t.title}</Link></h3>
            <StatusChip status={topicStatus(data, t.id)} />
          </div>
          <table className="skill-table">
            <thead>
              <tr><th scope="col">Lesson</th><th scope="col">Status</th><th scope="col">Answered</th><th scope="col">First time</th><th scope="col">Hints</th><th scope="col">Confidence</th></tr>
            </thead>
            <tbody>
              {t.lessons.map((id) => {
                const s = data.skills[id];
                const c = confidence(s);
                return (
                  <tr key={id}>
                    <th scope="row"><Link to={`/lesson/${id}`}>{lessonById(id)!.title}</Link></th>
                    <td><StatusChip status={lessonStatus(data, id)} /></td>
                    <td>{s?.attempted ?? 0}</td>
                    <td>{s?.firstTry ?? 0}</td>
                    <td>{s?.hints ?? 0}</td>
                    <td>{c === null ? <span className="muted">—</span> : <><ProgressBar value={Math.round(c * 100)} max={100} label={`Confidence ${Math.round(c * 100)}%`} /><span className="sr-only">{Math.round(c * 100)}%</span></>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {t.id === 'pythagoras' && <DemoStatus />}
        </section>
      ))}

      <h2>Badges</h2>
      <BadgeGrid />

      <section className="card settings">
        <h2>Your name and saved progress</h2>
        <form
          className="name-form"
          onSubmit={(e) => {
            e.preventDefault();
            store.update((d) => (d.name = name.trim().slice(0, 30) || null));
            setSaved(true);
          }}
        >
          <label htmlFor={nameId}>Display name (optional)</label>
          <input id={nameId} type="text" maxLength={30} value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
          <button type="submit" className="btn btn-secondary">Save name</button>
          <span role="status">{saved ? '✓ Saved' : ''}</span>
        </form>
        <p className="small">Progress is stored only in this browser on this device. It isn’t uploaded anywhere and won’t transfer to another device or browser. Sharing a computer? Delete it so the next person starts fresh.</p>
        <ResetProgressButton />
      </section>
    </div>
  );
}

/** The squares demonstration is tracked separately: watching it isn't mastery. */
function DemoStatus() {
  const { data } = useStore();
  const d = data.demos['pythagoras-squares'];
  const tick = (b: boolean) => (b ? '✓' : '—');
  return (
    <div className="demo-status">
      <h4>“Why Pythagoras works” demonstration</h4>
      {!d?.started ? (
        <p className="small muted">Not tried yet. <Link to="/lesson/pythagoras-why?stage=learn">See the squares and tiles →</Link></p>
      ) : (
        <ul className="small">
          <li><span aria-hidden="true">{tick(d.completed)}</span> {d.completed ? 'Completed' : 'Started, not finished yet'}</li>
          <li><span aria-hidden="true">{tick(!!d.hypotenuse)}</span> Spotted the hypotenuse{d.hypotenuse === 'first' ? ' first time' : d.hypotenuse === 'help' ? ' with a little help' : ''}</li>
          <li><span aria-hidden="true">{tick(d.squaresUnderstood)}</span> Worked out 9 + 16 = 25 from the squares</li>
          <li><span aria-hidden="true">{tick(d.discoveryCorrect)}</span> Spotted that the smaller squares add up to the biggest</li>
          <li><span aria-hidden="true">{tick(d.transferDone)}</span> Used it on a new triangle (5, 12, 13)</li>
          <li>Hints used: {d.hints}</li>
        </ul>
      )}
    </div>
  );
}
