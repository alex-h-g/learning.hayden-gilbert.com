import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LESSONS, lessonById, topicById } from '../content';
import type { Difficulty, LessonDef, Problem } from '../content/types';
import { GinaSays } from '../components/Gina';
import { ProblemRunner } from '../components/ProblemRunner';
import { Rich } from '../components/Rich';
import { Math as TeX } from '../components/Math';
import { BadgeToast } from '../components/Badges';
import { PythagorasDemo } from '../components/PythagorasDemo';
import { ProgressBar } from '../components/common';
import { Diagram } from '../diagrams/Diagram';
import { seeded } from '../lib/random';
import { freshSeed } from '../lib/fresh';
import { awardBadges, lessonP, lessonStatus, recordOutcome, suggestedLesson, updateDemo, updateLesson, type Outcome } from '../lib/progress';
import { useStore } from '../lib/store';
import { NotFoundPage } from './NotFoundPage';

type Stage = 'intro' | 'guided' | 'practice' | 'mastery' | 'review';
const STAGES: { id: Stage; label: string }[] = [
  { id: 'intro', label: 'Learn' },
  { id: 'guided', label: 'Worked example' },
  { id: 'practice', label: 'Practice' },
  { id: 'mastery', label: 'Mastery check' },
  { id: 'review', label: 'Review' },
];

export const PASS_MARK = 0.75;

export function LessonPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const lesson = id ? lessonById(id) : undefined;
  if (!lesson) return <NotFoundPage />;
  return <Lesson key={`${lesson.id}-${params.get('stage') ?? ''}`} lesson={lesson} />;
}

function Lesson({ lesson }: { lesson: LessonDef }) {
  const { data } = useStore();
  const lp = lessonP(data, lesson.id);
  const topic = topicById(lesson.topic)!;
  const [params] = useSearchParams();
  // ?stage=learn opens the Learn stage directly (e.g. "watch the demonstration again").
  const asked = params.get('stage') === 'learn' ? 'intro' : null;
  const startStage: Stage = asked ?? (!lp.introSeen ? 'intro' : !lp.guidedDone ? 'guided' : lp.practiceDone < (lesson.practiceCount ?? 3) ? 'practice' : lp.masteryPassed ? 'review' : 'mastery');
  const [stage, setStage] = useState<Stage>(startStage);
  const [slide, setSlide] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    updateLesson(lesson.id, (l) => (l.opened = true));
    document.title = `${lesson.title} · Geometry 2`;
  }, [lesson]);

  const go = (s: Stage) => {
    setStage(s);
    window.scrollTo(0, 0);
  };
  const addBadges = (b: string[]) => b.length && setNewBadges((x) => [...x, ...b]);

  const prereqTodo = (lesson.prereq ?? []).filter((p) => lessonStatus(data, p) === 'not-started');

  return (
    <div className="lesson">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> › <Link to={`/topic/${topic.id}`}>{topic.title}</Link> › <span aria-current="page">{lesson.title}</span>
      </nav>
      <div className="lesson-head" style={{ ['--accent' as string]: topic.colour, ['--tint' as string]: topic.tint }}>
        <h1>{lesson.title}</h1>
        <ol className="stage-tabs" aria-label="Lesson stages">
          {STAGES.map((s, i) => (
            <li key={s.id}>
              <button type="button" className={stage === s.id ? 'current' : ''} aria-current={stage === s.id ? 'step' : undefined} onClick={() => go(s.id)}>
                <span className="stage-num" aria-hidden="true">{i + 1}</span> {s.label}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <BadgeToast ids={newBadges} onClose={() => setNewBadges([])} />

      {stage === 'intro' && lesson.demo === 'pythagoras-squares' && (
        <PythagorasDemo
          onDone={() => {
            updateLesson(lesson.id, (l) => (l.introSeen = true));
            addBadges(awardBadges());
            go('guided');
          }}
        />
      )}
      {stage === 'intro' && !lesson.demo && (
        <Intro
          lesson={lesson}
          slide={slide}
          setSlide={setSlide}
          prereqTodo={prereqTodo}
          onDone={() => {
            updateLesson(lesson.id, (l) => (l.introSeen = true));
            go('guided');
          }}
        />
      )}
      {stage === 'guided' && (
        <Guided
          lesson={lesson}
          onDone={() => {
            updateLesson(lesson.id, (l) => (l.guidedDone = true));
            addBadges(awardBadges());
            go('practice');
          }}
        />
      )}
      {stage === 'practice' && (
        <QuestionSet
          key="practice"
          lesson={lesson}
          kind="practice"
          count={lesson.practiceCount ?? 3}
          onBadges={addBadges}
          onDone={() => go('mastery')}
        />
      )}
      {stage === 'mastery' && (
        <QuestionSet
          key="mastery"
          lesson={lesson}
          kind="mastery"
          count={lesson.masteryCount ?? 4}
          onBadges={addBadges}
          onDone={(results) => {
            const firstTries = results.filter((r) => r.firstTry).length;
            const score = firstTries / results.length;
            const pass = score >= PASS_MARK;
            updateLesson(lesson.id, (l) => {
              l.masteryBest = Math.max(l.masteryBest, score);
              if (pass) l.masteryPassed = true;
            });
            addBadges(awardBadges());
            setLastMastery({ score, firstTries, total: results.length, pass });
            go('review');
          }}
        />
      )}
      {stage === 'review' && <Review lesson={lesson} last={lastMastery} onRetry={() => go('mastery')} onPractice={() => go('practice')} />}
    </div>
  );
}

// Last mastery result shown on the review screen (module-level so it survives the stage switch).
let lastMasteryStore: { score: number; firstTries: number; total: number; pass: boolean } | null = null;
function setLastMastery(x: typeof lastMasteryStore) {
  lastMasteryStore = x;
}
const lastMastery = () => lastMasteryStore;

function Intro({ lesson, slide, setSlide, prereqTodo, onDone }: { lesson: LessonDef; slide: number; setSlide: (n: number) => void; prereqTodo: string[]; onDone: () => void }) {
  const s = lesson.intro[slide];
  const lastSlide = slide === lesson.intro.length - 1;
  return (
    <div className="intro-stage">
      <div className="runner">
        <aside className="runner-gina">
          <GinaSays pose={slide === 0 ? 'waving' : s.pose} text={slide === 0 ? `Let’s learn to ${lesson.objective}.\n\n${s.text}` : s.text} />
        </aside>
        <div className="runner-main">
          <section className="card slide-card" aria-label={`Slide ${slide + 1} of ${lesson.intro.length}`}>
            {prereqTodo.length > 0 && slide === 0 && (
              <p className="alert alert-info">
                Tip: this builds on {prereqTodo.map((p, i) => (
                  <span key={p}>{i > 0 && ' and '}<Link to={`/lesson/${p}`}>{lessonById(p)!.title}</Link></span>
                ))}. You can carry on here, or start there first.
              </p>
            )}
            {s.formula && (
              <div className="formula-box">
                <TeX tex={s.formula} display />
              </div>
            )}
            {s.diagram && <Diagram spec={s.diagram} />}
            {!s.formula && !s.diagram && <Rich text={s.text} as="div" className="slide-text" />}
            <div className="slide-nav">
              <button type="button" className="btn btn-secondary" disabled={slide === 0} onClick={() => setSlide(slide - 1)}>← Back</button>
              <span className="muted small" aria-live="polite">{slide + 1} / {lesson.intro.length}</span>
              {lastSlide ? (
                <button type="button" className="btn btn-primary" onClick={onDone}>Let’s try one together →</button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setSlide(slide + 1)}>Next →</button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Guided({ lesson, onDone }: { lesson: LessonDef; onDone: () => void }) {
  const examples = useMemo(() => [lesson.guided, ...(lesson.moreGuided ?? [])], [lesson]);
  const [i, setI] = useState(0);
  const problem = useMemo(() => examples[i](), [examples, i]);
  return (
    <ProblemRunner
      key={`g${i}`}
      problem={problem}
      mode="guided"
      header={
        <p className="stage-note">
          Worked example {examples.length > 1 ? `${i + 1} of ${examples.length}` : ''} — {lesson.demo ? 'use what you discovered on a new triangle' : 'from the revision worksheet'}. Have a go at each step; hints are free here.
        </p>
      }
      finishLabel={i < examples.length - 1 ? 'Next worked example →' : 'Now you try →'}
      onFinish={() => {
        // The worked example is teaching, so it isn't scored.
        if (i < examples.length - 1) setI(i + 1);
        else {
          if (lesson.demo) updateDemo(lesson.demo, (d) => (d.transferDone = true));
          onDone();
        }
      }}
    />
  );
}

function QuestionSet({ lesson, kind, count, onDone, onBadges }: { lesson: LessonDef; kind: 'practice' | 'mastery'; count: number; onDone: (r: Outcome[]) => void; onBadges: (b: string[]) => void }) {
  const [started, setStarted] = useState(kind === 'practice');
  const [n, setN] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(kind === 'mastery' ? 1 : 0);
  const [seed, setSeed] = useState(() => freshSeed(lesson, kind === 'mastery' ? 1 : 0));
  const [results, setResults] = useState<Outcome[]>([]);
  const [streak, setStreak] = useState(0);
  // The generated question is fixed by its seed, so re-renders never change the expected answer.
  const problem: Problem = useMemo(() => lesson.generate(seeded(seed), difficulty), [lesson, seed, difficulty]);

  if (!started) {
    return (
      <div className="runner">
        <aside className="runner-gina">
          <GinaSays pose="thinking" text={`Time for the mastery check: ${count} new questions. I’ll step back and let you work. A question counts towards mastery if you get every step right first time without a hint — you need ${Math.ceil(count * PASS_MARK)} of ${count}. Hints are still there if you need them.`} />
        </aside>
        <div className="runner-main">
          <section className="card">
            <h2>Mastery check</h2>
            <p>Take your time. If you don’t pass this time, practise a little more and try again — every attempt helps.</p>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setStarted(true)}>Start the mastery check</button>
          </section>
        </div>
      </div>
    );
  }

  const finish = (o: Outcome) => {
    const b = recordOutcome(o);
    onBadges(b);
    const r = [...results, o];
    setResults(r);
    let nd = difficulty;
    if (kind === 'practice') {
      updateLesson(lesson.id, (l) => (l.practiceDone += 1));
      // Adapt: a simpler one after a struggle, a harder one after two clean answers.
      const s = o.firstTry ? streak + 1 : 0;
      if (o.revealed) nd = 0;
      else if (s >= 2 && difficulty < 2) nd = (difficulty + 1) as Difficulty;
      else if (difficulty === 0 && o.firstTry) nd = 1;
      setStreak(nd !== difficulty ? 0 : s);
      setDifficulty(nd);
    }
    if (n + 1 >= count) {
      onDone(r);
      return;
    }
    setN(n + 1);
    setSeed(freshSeed(lesson, nd));
    window.scrollTo(0, 0);
  };

  const label = kind === 'practice' ? 'Practice' : 'Mastery check';
  return (
    <ProblemRunner
      key={`${kind}-${n}-${seed}`}
      problem={problem}
      mode={kind}
      finishLabel={n + 1 >= count ? (kind === 'practice' ? 'On to the mastery check →' : 'See my results →') : 'Next question →'}
      header={
        <div className="set-head">
          <span>{label}: question {n + 1} of {count}</span>
          <ProgressBar value={n} max={count} label={`${label} progress`} />
          {kind === 'practice' && <span className="muted small">{difficulty === 0 ? 'Warm-up' : difficulty === 1 ? 'Standard' : 'Stretch'} level</span>}
        </div>
      }
      onFinish={finish}
    />
  );
}

function Review({ lesson, last, onRetry, onPractice }: { lesson: LessonDef; last: () => typeof lastMasteryStore; onRetry: () => void; onPractice: () => void }) {
  const { data } = useStore();
  const lp = lessonP(data, lesson.id);
  const s = data.skills[lesson.id];
  const res = last();
  const nextId = suggestedLesson(data);
  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  const following = LESSONS[idx + 1];
  const passed = res ? res.pass : lp.masteryPassed;
  const text = passed
    ? `You’ve mastered **${lesson.title}**! You can ${lesson.objective}.`
    : res
      ? `You got ${res.firstTries} of ${res.total} right first time. You’re ${res.firstTries >= 1 ? 'getting there' : 'building up'} — a little more practice and you’ll have it. Mistakes are part of learning!`
      : `Here’s how you’re doing with **${lesson.title}**.`;
  return (
    <div className="runner">
      <aside className="runner-gina">
        <GinaSays pose={passed ? 'cheering' : 'encouraging'} text={text} />
      </aside>
      <div className="runner-main">
        <section className="card">
          <h2>Review</h2>
          <ul className="review-list">
            <li><strong>What you learned:</strong> how to {lesson.objective}.</li>
            <li><Rich text={`**The key rule:** ${lesson.guide.rule}`} /></li>
            {s && (
              <li>
                <strong>Your answers so far:</strong> {s.attempted} question{s.attempted === 1 ? '' : 's'} — {s.firstTry} right first time, {s.afterHelp} with a hint or a second try{s.revealed ? `, ${s.revealed} worked through together` : ''}.
              </li>
            )}
            {res && <li><strong>Mastery check:</strong> {res.firstTries} / {res.total} first time {res.pass ? '✓ passed' : '— not yet passed'}.</li>}
            <li><Rich text={`**Watch out for:** ${lesson.guide.mistake}`} /></li>
          </ul>
          <div className="btn-row">
            {!passed && <button type="button" className="btn btn-primary" onClick={onPractice}>Practise a bit more</button>}
            {!passed && <button type="button" className="btn btn-secondary" onClick={onRetry}>Try the mastery check again</button>}
            {!passed && lesson.topic === 'pythagoras' && <Link className="btn btn-secondary" to="/lesson/pythagoras-why?stage=learn">See why it works again (squares demo)</Link>}
            {passed && following && <Link className="btn btn-primary" to={`/lesson/${following.id}`}>Next lesson: {following.title} →</Link>}
            {passed && <button type="button" className="btn btn-secondary" onClick={onPractice}>Keep practising</button>}
            {nextId !== lesson.id && nextId !== following?.id && <Link className="btn btn-secondary" to={`/lesson/${nextId}`}>Suggested: {lessonById(nextId)!.title}</Link>}
            <Link className="btn btn-ghost" to={`/topic/${lesson.topic}`}>Back to topic</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

