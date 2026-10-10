import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Option, Pose, Problem, Step } from '../content/types';
import { Diagram } from '../diagrams/Diagram';
import { ConstructTriangle, PerpBisector } from '../diagrams/Construction';
import * as M from '../math/core';
import { checkExactDecimal, checkNumber, checkStandardForm, type CheckResult } from '../math/validate';
import { say } from '../lib/dialogue';
import type { Outcome } from '../lib/progress';
import { GinaSays } from './Gina';
import { Rich, plain } from './Rich';

export type Mode = 'guided' | 'practice' | 'mastery' | 'exam';

interface Props {
  problem: Problem;
  mode: Mode;
  onFinish: (o: Outcome) => void;
  finishLabel?: string;
  /** Shown above the question, e.g. "Question 2 of 4". */
  header?: ReactNode;
}

type Tone = 'ok' | 'bad' | 'info';
interface Done {
  step: Step;
  display: string;
  revealed: boolean;
}

const MAX_WRONG = 3;

function defaultPose(step: Step, mode: Mode): Pose {
  if (step.pose) return step.pose;
  if (mode === 'guided') return 'explaining';
  if (mode === 'mastery' || mode === 'exam') return 'thinking';
  return 'neutral';
}

function stepDisplay(step: Step): string {
  switch (step.kind) {
    case 'choice':
      return step.options.find((o) => o.correct)!.label;
    case 'multi':
      return step.options.filter((o) => o.correct).map((o) => o.label).join('; ');
    case 'number':
    case 'decimal':
    case 'sf':
      return step.display;
    case 'widget':
      return 'Construction complete';
  }
}

export function ProblemRunner({ problem, mode, onFinish, finishLabel = 'Continue', header }: Props) {
  const steps = useMemo(() => (mode === 'guided' ? problem.steps : problem.steps.filter((s) => !s.guidedOnly)), [problem, mode]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'ask' | 'solved' | 'complete'>('ask');
  const [stepWrong, setStepWrong] = useState(0);
  const [stepHints, setStepHints] = useState(0);
  const [done, setDone] = useState<Done[]>([]);
  const [totals, setTotals] = useState({ wrong: 0, hints: 0, revealed: false, answers: [] as string[] });
  const [pose, setPose] = useState<Pose>(mode === 'guided' ? 'explaining' : defaultPose(steps[0], mode));
  const [bubble, setBubble] = useState(`${problem.intro}\n\n${steps[0].prompt}`);
  const [feedback, setFeedback] = useState<{ tone: Tone; text: string } | null>(null);
  // inputs
  const [choice, setChoice] = useState<string | null>(null);
  const [multi, setMulti] = useState<Set<string>>(new Set());
  const [text, setText] = useState('');
  const [coef, setCoef] = useState('');
  const [exp, setExp] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const step = steps[idx];
  const last = idx === steps.length - 1;
  // A construction stays on screen after it's finished, so later steps can refer to it.
  const widgetIdx = steps.findIndex((s) => s.kind === 'widget');
  const widgetStep = widgetIdx >= 0 ? (steps[widgetIdx] as Extract<Step, { kind: 'widget' }>) : null;

  useEffect(() => {
    if (phase !== 'ask') nextRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const resetInputs = () => {
    setChoice(null);
    setMulti(new Set());
    setText('');
    setCoef('');
    setExp('');
    setFeedback(null);
  };

  const solve = (revealed: boolean, wrongHere = stepWrong, hintsHere = stepHints) => {
    const d: Done = { step, display: stepDisplay(step), revealed };
    setDone((x) => [...x, d]);
    setTotals((t) => ({ ...t, revealed: t.revealed || revealed }));
    if (last) {
      const first = totals.wrong === 0 && wrongHere === 0 && totals.hints === 0 && hintsHere === 0 && !totals.revealed && !revealed;
      setPhase('complete');
      setPose(revealed ? 'reassuring' : first ? 'celebrating' : mode === 'mastery' ? 'encouraging' : 'celebrating');
      setBubble(`${revealed ? say.revealed() : say.questionDone(first)}\n\n${problem.summary}`);
      setFeedback(revealed ? { tone: 'info', text: step.explain } : { tone: 'ok', text: `✓ ${step.explain}` });
      return;
    }
    setPhase('solved');
    if (revealed) {
      setPose('reassuring');
      setBubble(say.revealed());
      setFeedback({ tone: 'info', text: step.explain });
    } else {
      setPose(mode === 'mastery' || mode === 'exam' ? 'encouraging' : wrongHere === 0 && hintsHere === 0 ? 'encouraging' : 'celebrating');
      const praise = wrongHere > 0 ? say.correctAfterWrong() : hintsHere > 0 ? say.correctAfterHint() : say.correctStep();
      setBubble(praise);
      setFeedback({ tone: 'ok', text: `✓ ${step.explain}` });
    }
  };

  const showHint = (n: number) => {
    setStepHints(n);
    setTotals((t) => ({ ...t, hints: t.hints + 1 }));
    setPose('thinking');
    setBubble(`**Hint ${n} of ${step.hints.length}:** ${step.hints[n - 1]}`);
  };

  const wrongAnswer = (given: string, message?: string) => {
    const w = stepWrong + 1;
    setStepWrong(w);
    setTotals((t) => ({ ...t, wrong: t.wrong + 1, answers: [...t.answers, given].slice(-5) }));
    if (w >= MAX_WRONG) {
      // Never leave a learner stuck: show the working.
      setFeedback({ tone: 'bad', text: `✗ ${message ?? 'Not quite.'}` });
      solve(true, w);
      return;
    }
    setPose('reassuring');
    setFeedback({ tone: 'bad', text: `✗ ${message ?? 'Not quite — have another look.'}` });
    if (w === 2 && stepHints < step.hints.length) {
      const n = stepHints + 1;
      setStepHints(n);
      setTotals((t) => ({ ...t, hints: t.hints + 1 }));
      setBubble(`${say.wrongAgain()}\n\n**Hint ${n} of ${step.hints.length}:** ${step.hints[n - 1]}`);
    } else {
      setBubble(message ? `${say.wrong()}\n\n${message}` : say.wrong());
    }
  };

  const handleResult = (r: CheckResult, given: string) => {
    if (r.status === 'empty') return setFeedback({ tone: 'info', text: 'Type your answer first, then press Check.' });
    if (r.status === 'invalid') return setFeedback({ tone: 'info', text: r.message });
    if (r.status === 'correct') return solve(false);
    if (r.status === 'close') return wrongAnswer(given, r.message);
    wrongAnswer(given);
  };

  const check = () => {
    if (phase !== 'ask') return;
    switch (step.kind) {
      case 'choice': {
        if (!choice) return setFeedback({ tone: 'info', text: 'Choose an answer first, then press Check.' });
        const o = step.options.find((x) => x.id === choice)!;
        if (o.correct) return solve(false);
        return wrongAnswer(plain(o.label), o.feedback);
      }
      case 'multi': {
        if (multi.size === 0) return setFeedback({ tone: 'info', text: 'Select at least one answer, then press Check.' });
        const wrongPicked = step.options.filter((o) => !o.correct && multi.has(o.id));
        const missing = step.options.filter((o) => o.correct && !multi.has(o.id));
        if (wrongPicked.length === 0 && missing.length === 0) return solve(false);
        if (wrongPicked.length === 0) {
          // Partly right with nothing wrong: encourage, don't penalise.
          setPose('encouraging');
          setBubble(`Good so far — there ${missing.length === 1 ? 'is one more' : `are ${missing.length} more`} to find.`);
          return setFeedback({ tone: 'info', text: `✓ Everything you chose is right. Look again — ${missing.length === 1 ? 'one more' : `${missing.length} more`} to select.` });
        }
        return wrongAnswer(wrongPicked.map((o) => plain(o.label)).join(', '), wrongPicked[0].feedback);
      }
      case 'number':
        return handleResult(checkNumber(text, step.answer), text);
      case 'decimal':
        return handleResult(checkExactDecimal(text, M.parseDec(step.target)!), text);
      case 'sf': {
        const target = M.toStandardForm(M.shiftDec(M.parseDec(step.target.coef)!, step.target.exp));
        return handleResult(checkStandardForm(coef, exp, target), `${coef} × 10^${exp}`);
      }
      case 'widget':
        return;
    }
  };

  const next = () => {
    if (phase === 'complete') {
      const first = totals.wrong === 0 && totals.hints === 0 && !totals.revealed;
      onFinish({ skill: problem.skill, firstTry: first, revealed: totals.revealed, wrong: totals.wrong, hints: totals.hints, wrongAnswers: totals.answers });
      return;
    }
    const n = steps[idx + 1];
    setIdx(idx + 1);
    setPhase('ask');
    setStepWrong(0);
    setStepHints(0);
    resetInputs();
    setPose(defaultPose(n, mode));
    setBubble(n.prompt);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const onWidgetDone = (wrong: number) => {
    if (idx !== widgetIdx) return;
    setTotals((t) => ({ ...t, wrong: t.wrong + wrong }));
    setStepWrong(wrong);
    solve(false, wrong);
  };
  const widgetSay = (t: string, tone: 'ok' | 'bad' | 'info') => {
    setPose(tone === 'bad' ? 'reassuring' : tone === 'ok' ? 'encouraging' : 'neutral');
    setBubble(t);
  };

  const insert = (s: string) => {
    setText((t) => t + s);
    inputRef.current?.focus();
  };

  const highlight = phase === 'complete' ? ['rect', 'semi', 'unknown', 'hyp', 'right-angle', 'halves'] : [...(step.highlight ?? []), ...(step.kind === 'multi' ? step.options.filter((o) => multi.has(o.id) && o.highlight).map((o) => o.highlight!) : [])];

  const hintButton =
    phase === 'ask' && step.kind !== 'widget' ? (
      stepHints < step.hints.length ? (
        <button type="button" className="btn btn-hint" onClick={() => showHint(stepHints + 1)}>
          💡 Hint <span className="muted">({stepHints + 1} of {step.hints.length})</span>
        </button>
      ) : (
        <button type="button" className="btn btn-hint" onClick={() => solve(true)}>
          Show me the working
        </button>
      )
    ) : null;

  return (
    <div className="runner">
      <aside className="runner-gina">
        <GinaSays pose={pose} text={bubble} />
        {phase === 'ask' && step.kind === 'widget' && stepHints < step.hints.length && (
          <button type="button" className="btn btn-hint" onClick={() => showHint(stepHints + 1)}>
            💡 Hint ({stepHints + 1} of {step.hints.length})
          </button>
        )}
      </aside>
      <div className="runner-main">
        {header}
        <section className="card question-card" aria-label="Question">
          <div className="q-text">
            <Rich text={problem.question} as="div" />
          </div>
          {problem.diagram && (
            <div className="q-diagram">
              <Diagram spec={problem.diagram} highlight={highlight} />
            </div>
          )}
          {widgetIdx >= 0 && idx >= widgetIdx && widgetStep && (
            <div className="widget-box">
              {widgetStep.widget.type === 'construct-triangle' ? (
                <ConstructTriangle base={widgetStep.widget.base} left={widgetStep.widget.left} right={widgetStep.widget.right} onDone={(r) => onWidgetDone(r.wrong)} say={widgetSay} />
              ) : (
                <PerpBisector length={widgetStep.widget.length} onDone={(r) => onWidgetDone(r.wrong)} say={widgetSay} />
              )}
            </div>
          )}
          {done.length > 0 && (
            <ol className="working" aria-label="Working so far">
              {done.map((d, i) => (
                <li key={i} className={d.revealed ? 'revealed' : ''}>
                  <span className="working-q"><Rich text={d.step.prompt} /></span>
                  <span className="working-a">
                    <span aria-hidden="true">{d.revealed ? '👀' : '✓'}</span> <Rich text={d.display} />
                    {d.revealed && <span className="sr-only"> (shown by Gina)</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {phase === 'ask' && (
            <div className="step-box">
              <p className="step-count muted small">
                Step {idx + 1} of {steps.length}
              </p>
              <div className="step-prompt">
                <Rich text={step.prompt} as="div" />
              </div>
              <StepInput
                step={step}
                choice={choice}
                setChoice={(c) => { setChoice(c); setFeedback(null); }}
                multi={multi}
                setMulti={(m) => { setMulti(m); setFeedback(null); }}
                text={text}
                setText={setText}
                coef={coef}
                setCoef={setCoef}
                exp={exp}
                setExp={setExp}
                onEnter={check}
                inputRef={inputRef}
                insert={insert}
              />
              {step.kind !== 'widget' && (
                <div className="step-actions">
                  <button type="button" className="btn btn-primary" onClick={check}>Check</button>
                  {hintButton}
                </div>
              )}
            </div>
          )}
          <div className={`feedback ${feedback ? `fb-${feedback.tone}` : ''}`} role="status" aria-live="polite">
            {feedback && <Rich text={feedback.text} as="div" />}
          </div>
          {phase === 'complete' && (
            <div className="summary">
              <h3>The answer</h3>
              <p className="answer"><Rich text={problem.answer} /></p>
            </div>
          )}
          {phase !== 'ask' && (
            <div className="step-actions">
              <button ref={nextRef} type="button" className="btn btn-primary btn-lg" onClick={next}>
                {phase === 'complete' ? finishLabel : 'Next step →'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface InputProps {
  step: Step;
  choice: string | null;
  setChoice: (c: string) => void;
  multi: Set<string>;
  setMulti: (s: Set<string>) => void;
  text: string;
  setText: (t: string) => void;
  coef: string;
  setCoef: (t: string) => void;
  exp: string;
  setExp: (t: string) => void;
  onEnter: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  insert: (s: string) => void;
}

function OptionButton({ o, selected, onClick, multi }: { o: Option; selected: boolean; onClick: () => void; multi: boolean }) {
  return (
    <button type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={selected} className={`option ${selected ? 'selected' : ''}`} onClick={onClick}>
      <span className={`option-mark ${multi ? 'square' : ''}`} aria-hidden="true">{selected ? (multi ? '✓' : '●') : ''}</span>
      <Rich text={o.label} />
    </button>
  );
}

function StepInput(p: InputProps) {
  const { step } = p;
  const enter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      p.onEnter();
    }
  };
  switch (step.kind) {
    case 'choice':
      return (
        <div className="options" role="radiogroup" aria-label="Choose one answer">
          {step.options.map((o) => (
            <OptionButton key={o.id} o={o} multi={false} selected={p.choice === o.id} onClick={() => p.setChoice(o.id)} />
          ))}
        </div>
      );
    case 'multi':
      return (
        <div className="options" role="group" aria-label="Select all that apply">
          {step.options.map((o) => (
            <OptionButton
              key={o.id}
              o={o}
              multi
              selected={p.multi.has(o.id)}
              onClick={() => {
                const s = new Set(p.multi);
                if (s.has(o.id)) s.delete(o.id);
                else s.add(o.id);
                p.setMulti(s);
              }}
            />
          ))}
        </div>
      );
    case 'number':
    case 'decimal':
      return (
        <div className="answer-row">
          <label className="answer-input">
            {step.label ? <span className="answer-label"><Rich text={step.label} /></span> : <span className="sr-only">Your answer</span>}
            <input
              ref={p.inputRef}
              type="text"
              inputMode={step.kind === 'number' && step.keys?.length ? 'text' : 'decimal'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={p.text}
              onChange={(e) => p.setText(e.target.value)}
              onKeyDown={enter}
              aria-describedby="answer-help"
            />
            {step.unit && <span className="unit">{step.unit}</span>}
          </label>
          {step.kind === 'number' && step.keys && (
            <div className="keys" aria-label="Maths keys">
              {step.keys.includes('pi') && <button type="button" className="key" onClick={() => p.insert('π')} aria-label="Insert pi">π</button>}
              {step.keys.includes('root') && <button type="button" className="key" onClick={() => p.insert('√')} aria-label="Insert square root">√</button>}
              {step.keys.includes('squared') && <button type="button" className="key" onClick={() => p.insert('²')} aria-label="Insert squared">x²</button>}
            </div>
          )}
          <p id="answer-help" className="sr-only">Type a number. You can use π and √ where shown.</p>
        </div>
      );
    case 'sf':
      return (
        <div className="answer-row sf-row">
          <label className="sf-box">
            <span className="sr-only">Number between 1 and 10</span>
            <input ref={p.inputRef} type="text" inputMode="decimal" value={p.coef} onChange={(e) => p.setCoef(e.target.value)} onKeyDown={enter} autoComplete="off" />
          </label>
          <span className="sf-times" aria-hidden="true">× 10</span>
          <label className="sf-exp">
            <span className="sr-only">Power of ten</span>
            <input type="text" inputMode="numeric" value={p.exp} onChange={(e) => p.setExp(e.target.value)} onKeyDown={enter} autoComplete="off" />
          </label>
          {step.unit && <span className="unit">{step.unit}</span>}
          <button type="button" className="key" onClick={() => p.setExp(p.exp.startsWith('−') || p.exp.startsWith('-') ? p.exp.slice(1) : `−${p.exp}`)} aria-label="Make the power negative or positive">±</button>
        </div>
      );
    case 'widget':
      return <p className="small muted">Use the drawing board above. The steps are listed at the top of it.</p>;
  }
}
