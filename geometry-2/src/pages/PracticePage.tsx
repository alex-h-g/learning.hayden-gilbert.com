import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LESSONS, TOPICS, lessonById, topicById } from '../content';
import type { Difficulty, LessonDef, Problem } from '../content/types';
import { GinaSays } from '../components/Gina';
import { ProblemRunner } from '../components/ProblemRunner';
import { Rich } from '../components/Rich';
import { BadgeToast } from '../components/Badges';
import { ProgressBar } from '../components/common';
import { seeded, shuffle, weightedSample } from '../lib/random';
import { freshSeed } from '../lib/fresh';
import { awardBadges, practiceWeight, recordOutcome, weakSkills, type Outcome } from '../lib/progress';
import { store, useStore } from '../lib/store';

type Mode = 'exam' | 'mistakes' | 'topic';
interface Item {
  lesson: LessonDef;
  seed: number;
  d: Difficulty;
}

/**
 * Builds the question list. Weaker skills are weighted to come up more often
 * (see practiceWeight). Mistakes: only skills that need work, weakest most.
 * Exam: at least one question per topic, the rest weighted towards weak skills.
 */
function buildQueue(mode: Mode, topic: string | null, weak: string[]): Item[] {
  const d = store.data;
  const item = (lesson: LessonDef, diff: Difficulty): Item => ({ lesson, d: diff, seed: freshSeed(lesson, diff) });
  if (mode === 'mistakes' && weak.length) {
    const ids = weak.slice(0, 6);
    const picks: string[] = [];
    // Every weak skill once (easier first), then weighted repeats of the weakest.
    ids.slice(0, 8).forEach((id) => picks.push(id));
    while (picks.length < 8) picks.push(weightedSample(ids, (id) => practiceWeight(d, id), 1)[0]);
    const seen = new Set<string>();
    return picks.map((id) => {
      const diff = (seen.has(id) ? 1 : 0) as Difficulty;
      seen.add(id);
      return item(lessonById(id)!, diff);
    });
  }
  if (mode === 'topic' && topic) {
    const ls = LESSONS.filter((l) => l.topic === topic && l.inExam !== false);
    const pool = ls.length ? ls : LESSONS.filter((l) => l.topic === topic);
    const picks = [...pool];
    while (picks.length < 8) picks.push(weightedSample(pool, (l) => practiceWeight(d, l.id), 1)[0]);
    return shuffle(picks.slice(0, 8)).map((l) => item(l, 1));
  }
  // Mixed exam: 10 questions, at least one from each topic, weighted towards weak skills.
  const exam = LESSONS.filter((l) => l.inExam);
  const perTopic = TOPICS.map((t) => weightedSample(exam.filter((l) => l.topic === t.id), (l) => practiceWeight(d, l.id), 1)[0]).filter(Boolean);
  const rest = weightedSample(exam.filter((l) => !perTopic.includes(l)), (l) => practiceWeight(d, l.id), 10 - perTopic.length);
  return shuffle([...perTopic, ...rest]).map((l) => item(l, 1));
}

export function PracticePage() {
  const [params] = useSearchParams();
  const mode = (['exam', 'mistakes', 'topic'].includes(params.get('mode') ?? '') ? params.get('mode') : 'exam') as Mode;
  const topic = params.get('topic');
  const { data } = useStore();
  const weak = useMemo(() => weakSkills(store.data).map((w) => w.id), []);
  const [queue, setQueue] = useState<Item[]>(() => buildQueue(mode, topic, weak));
  const [n, setN] = useState(0);
  const [results, setResults] = useState<{ item: Item; problem: Problem; o: Outcome }[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const item = queue[n];
  const problem = useMemo(() => (item ? item.lesson.generate(seeded(item.seed), item.d) : null), [item]);

  const title = mode === 'exam' ? 'Mixed Exam Practice' : mode === 'mistakes' ? 'Practise My Mistakes' : `${topicById(topic ?? '')?.title ?? 'Topic'} practice`;
  const noMistakes = mode === 'mistakes' && weak.length === 0;

  if (noMistakes) {
    return (
      <div className="runner">
        <aside className="runner-gina"><GinaSays pose="encouraging" text={Object.keys(data.skills).length ? 'Nothing needs extra practice right now — brilliant! Try a mixed exam to keep everything fresh.' : 'Once you’ve answered some questions, I’ll gather the ones you found tricky here. Start with a lesson!'} /></aside>
        <div className="runner-main"><section className="card"><h1>{title}</h1><div className="btn-row"><Link className="btn btn-primary" to="/practice?mode=exam" reloadDocument>Mixed Exam Practice</Link><Link className="btn btn-secondary" to="/">Choose a topic</Link></div></section></div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="runner">
        <aside className="runner-gina">
          <GinaSays
            pose={mode === 'mistakes' ? 'reassuring' : 'encouraging'}
            text={
              mode === 'exam'
                ? `${queue.length} questions mixed from every topic, like a real exam. The numbers are new every time. Hints are there if you need them — I’ll note which topics to revisit.`
                : mode === 'mistakes'
                  ? `Let’s revisit the things you found tricky: ${weak.slice(0, 6).map((w) => lessonById(w)!.title).join(', ')}. We’ll start gently, and the trickiest come up more than once.`
                  : `${queue.length} fresh questions from this topic.`
            }
          />
        </aside>
        <div className="runner-main">
          <section className="card">
            <h1>{title}</h1>
            <p>Every question is newly generated, so you can do this as many times as you like.{mode === 'exam' && data.examBest !== null ? ` Your personal best: ${Math.round(data.examBest * 100)}% right first time.` : ''}</p>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setStarted(true)}>Start</button>
          </section>
        </div>
      </div>
    );
  }

  if (!item || !problem) {
    const first = results.filter((r) => r.o.firstTry).length;
    const total = results.length;
    const score = total ? first / total : 0;
    const prevBest = data.examBest;
    const toRevisit = [...new Set(results.filter((r) => !r.o.firstTry).map((r) => r.item.lesson.id))];
    return (
      <div className="runner">
        <aside className="runner-gina">
          <GinaSays
            pose={score >= 0.75 ? 'cheering' : 'encouraging'}
            text={`You’ve done some excellent work today. ${first} of ${total} right first time${mode === 'exam' && prevBest !== null && score >= prevBest ? ' — a personal best!' : '.'}${toRevisit.length ? '\n\nLet’s review a couple of things that could use a little more practice.' : ''}`}
          />
        </aside>
        <div className="runner-main">
          <BadgeToast ids={badges} onClose={() => setBadges([])} />
          <section className="card">
            <h1>{title}: results</h1>
            <ol className="results">
              {results.map((r, i) => (
                <li key={i} className={r.o.firstTry ? 'ok' : r.o.revealed ? 'shown' : 'help'}>
                  <span className="res-mark" aria-hidden="true">{r.o.firstTry ? '✓' : r.o.revealed ? '👀' : '½'}</span>
                  <div>
                    <strong>{r.item.lesson.title}</strong> — <span className="muted">{r.o.firstTry ? 'right first time' : r.o.revealed ? 'worked through together' : 'right with help'}</span>
                    <details>
                      <summary>Question and answer</summary>
                      <Rich text={r.problem.question} as="div" />
                      <p><strong>Answer:</strong> <Rich text={r.problem.answer} /></p>
                      <Rich text={r.problem.summary} as="div" className="muted" />
                    </details>
                  </div>
                </li>
              ))}
            </ol>
            {toRevisit.length > 0 && (
              <>
                <h2>Worth another look</h2>
                <ul className="link-list">
                  {toRevisit.map((id) => (
                    <li key={id}><Link to={`/lesson/${id}`}>{lessonById(id)!.title}</Link></li>
                  ))}
                </ul>
              </>
            )}
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={() => { setQueue(buildQueue(mode, topic, weakSkills(store.data).map((w) => w.id))); setN(0); setResults([]); }}>Another set</button>
              <Link className="btn btn-secondary" to="/guide">My revision guide</Link>
              <Link className="btn btn-ghost" to="/">Home</Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <>
      <BadgeToast ids={badges} onClose={() => setBadges([])} />
      <ProblemRunner
        key={`${n}-${item.seed}`}
        problem={problem}
        mode="exam"
        finishLabel={n + 1 >= queue.length ? 'See my results →' : 'Next question →'}
        header={
          <div className="set-head">
            <span>{title}: question {n + 1} of {queue.length} · <em>{item.lesson.title}</em></span>
            <ProgressBar value={n} max={queue.length} label="Progress" />
          </div>
        }
        onFinish={(o) => {
          const b = recordOutcome(o);
          const r = [...results, { item, problem, o }];
          setResults(r);
          if (n + 1 >= queue.length && mode === 'exam') {
            const score = r.filter((x) => x.o.firstTry).length / r.length;
            store.update((d) => {
              d.examsDone += 1;
              d.examBest = Math.max(d.examBest ?? 0, score);
            });
            b.push(...awardBadges());
          }
          if (b.length) setBadges((x) => [...x, ...b]);
          setN(n + 1);
          window.scrollTo(0, 0);
        }}
      />
    </>
  );
}
