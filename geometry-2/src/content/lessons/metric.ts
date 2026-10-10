import * as M from '../../math/core';
import { no, ok, opts, pick, pid, randInt, texNum, type Rng } from '../helpers';
import type { Difficulty, LessonDef, Problem, Step } from '../types';

const dec = (s: string) => M.parseDec(s)!;
const show = (d: M.Dec) => M.decToString(d, true);
const powTex = (p: number) => `10^{${p}}`;

// ───────────────────────── Metric prefixes ─────────────────────────

function prefixProblem(rng: Rng, d: Difficulty): Problem {
  const pool = d === 0 ? ['kilo', 'centi', 'milli'] : d === 1 ? ['kilo', 'centi', 'milli', 'micro', 'nano', 'mega'] : ['giga', 'mega', 'kilo', 'hecto', 'deka', 'deci', 'centi', 'milli', 'micro', 'nano'];
  const p = M.prefixByName(pick(rng, pool));
  const others = M.PREFIXES.filter((x) => x.power !== p.power && x.power !== 0);
  const near = [...others].sort((a, b) => Math.abs(a.power - p.power) - Math.abs(b.power - p.power) || rng() - 0.5);
  const wrongPow = near.slice(0, 3);
  const symbolMix = M.PREFIXES.filter((x) => x.symbol && x.symbol !== p.symbol);
  // Prefer the classic confusions (m/M, μ/m, d/da) as distractors.
  const confusable: Record<string, string[]> = { m: ['M', 'μ'], M: ['m', 'G'], 'μ': ['m', 'n'], n: ['μ', 'm'], k: ['K', 'h'], d: ['da', 'c'], da: ['d', 'D'], c: ['d', 'm'], h: ['k', 'H'], G: ['M', 'g'] };
  const symWrong = (confusable[p.symbol] ?? symbolMix.slice(0, 2).map((x) => x.symbol)).slice(0, 2);
  const steps: Step[] = [
    {
      id: 'symbol',
      kind: 'choice',
      prompt: `What is the symbol for the prefix **${p.name}**?`,
      options: opts(rng, [ok('ok', p.symbol), ...symWrong.map((w) => no(`s${w}`, w, w === 'K' || w === 'D' || w === 'H' ? 'Careful with capitals: this one isn’t a real prefix symbol.' : `${w} is ${M.PREFIXES.find((x) => x.symbol === w)?.name ?? 'not a prefix'}. Capitals matter!`))]),
      hints: ['Look at the prefix table.', 'Capital and small letters mean different things: M is mega, m is milli.', `${p.name} → ${p.symbol}`],
      explain: `${p.name} has the symbol **${p.symbol}**.`,
      pose: 'curious',
    },
    {
      id: 'power',
      kind: 'choice',
      prompt: `What does **${p.name}** (${p.symbol}) mean?`,
      options: opts(rng, [ok('ok', `$\\times ${texNum(M.prefixFactorString(p))}$ (that is, $${powTex(p.power)}$)`), ...wrongPow.map((w) => no(w.name, `$\\times ${texNum(M.prefixFactorString(w))}$ (that is, $${powTex(w.power)}$)`, `That’s ${w.name}. Check the prefix table.`))]),
      hints: [p.power > 0 ? 'This prefix makes a unit bigger.' : 'This prefix makes a unit smaller.', 'kilo $= 1000$, milli $= 0.001$, micro $= 0.000\\,001$, nano $= 0.000\\,000\\,001$.', `${p.name} $= ${powTex(p.power)}$`],
      explain: `${p.name} (${p.symbol}) means $\\times ${texNum(M.prefixFactorString(p))} = ${powTex(p.power)}$.`,
    },
  ];
  return {
    id: pid('prefixes', rng),
    skill: 'prefixes',
    intro: 'Let’s read the prefix table.',
    question: `The prefix ${p.name}: what is its symbol and what does it mean?`,
    diagram: { type: 'prefix-scale' },
    steps,
    summary: `${p.name} (${p.symbol}) means $${powTex(p.power)}$. The prefix goes in front of the unit symbol — for example ${p.symbol}m or ${p.symbol}g.`,
    answer: `${p.name}: ${p.symbol}, $${powTex(p.power)}$`,
  };
}

export const prefixes: LessonDef = {
  id: 'prefixes',
  topic: 'metric',
  title: 'Metric prefixes',
  blurb: 'Read the prefix table: symbols and powers of ten.',
  objective: 'read a metric prefix’s symbol and meaning from the table',
  intro: [
    { pose: 'waving', text: 'Metric units use **prefixes** in front of a base unit (metre, gram, litre…). Each prefix is a power of ten.', diagram: { type: 'prefix-scale' } },
    { pose: 'explaining', text: 'The **prefix symbol** (like k for kilo) goes in front of the **unit symbol** (like g for gram): kg. Careful: m on its own is metre, but m in front means milli — mm is a millimetre.' },
    { pose: 'thinking', text: 'You don’t need to memorise the table for the test — but you do need to read it: find the prefix, then read off its symbol and its power of ten.' },
  ],
  guided: () => prefixProblem(() => 0.2, 0),
  generate: prefixProblem,
  inExam: true,
  guide: {
    rule: 'G $10^9$ · M $10^6$ · k $10^3$ · h $10^2$ · da $10^1$ · base · d $10^{-1}$ · c $10^{-2}$ · m $10^{-3}$ · μ $10^{-6}$ · n $10^{-9}$',
    explanation: 'A prefix multiplies the base unit by its power of ten, e.g. kilo $= 10^3$, nano $= 10^{-9}$. Capitals matter: M (mega) is not m (milli).',
    mistake: 'Mixing up M (mega, a million) and m (milli, a thousandth).',
  },
};

// ───────────────────────── Mass conversions ─────────────────────────

type MU = M.MassUnit;
const UNITS: MU[] = ['t', 'kg', 'g', 'mg'];

function massProblem(rng: Rng, value: string, from: MU, to: MU, guided = false): Problem {
  const v = dec(value);
  const res = M.convertMass(v, from, to);
  const cf = M.conversionFactor(M.MASS_UNITS[from].power, M.MASS_UNITS[to].power);
  const mult = cf.op === 'multiply';
  const F = M.MASS_UNITS[from];
  const T = M.MASS_UNITS[to];
  const ship = guided ? 'A cargo ship has a mass of 64.8 tonnes.' : '';
  return {
    id: pid('mass', rng),
    skill: 'mass',
    intro: guided ? 'The worksheet cargo ship has a mass of $64.8$ tonnes. Let’s write it in kilograms.' : `Let’s convert ${show(v)} ${from} into ${T.name}.`,
    question: `${ship} Write $${texNum(show(v))}$ ${F.name} in ${T.name}.`.trim(),
    diagram: { type: 'mass-ladder', from, to },
    steps: [
      {
        id: 'direction',
        kind: 'choice',
        prompt: `Are ${T.name} bigger or smaller units than ${F.name}?`,
        options: opts(rng, [
          mult ? ok('s', `Smaller — so we need **more** of them: multiply`) : ok('b', 'Bigger — so we need **fewer** of them: divide'),
          mult ? no('b', 'Bigger — so divide', `A ${T.singular} is lighter than a ${F.singular}. Look at the ladder.`) : no('s', 'Smaller — so multiply', `A ${T.singular} is heavier than a ${F.singular}. Look at the ladder.`),
        ]),
        hints: ['Look at the conversion ladder: heaviest at the top.', 'Smaller units → more of them → multiply. Bigger units → fewer → divide.', mult ? `${T.name} are smaller.` : `${T.name} are bigger.`],
        explain: mult ? `${T.name} are smaller, so the number gets **bigger**: multiply.` : `${T.name} are bigger, so the number gets **smaller**: divide.`,
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'factor',
        kind: 'choice',
        prompt: 'By how much?',
        options: opts(rng, [
          ok('ok', `${mult ? '$\\times' : '$\\div'} ${texNum(cf.factor)}$`),
          ...[3, 6, 9]
            .filter((p) => p !== cf.power)
            .slice(0, 2)
            .map((p) => no(`p${p}`, `${mult ? '$\\times' : '$\\div'} ${texNum(M.decToString({ neg: false, digits: '1', exp: p }, true))}$`, 'Count the jumps on the ladder: each one is $\\times 1000$.')),
          no('wrongop', `${mult ? '$\\div' : '$\\times'} ${texNum(cf.factor)}$`, 'Right number, wrong direction. Are we going to bigger or smaller units?'),
        ]),
        hints: ['Each step on the ladder (t → kg → g → mg) is $\\times 1000$.', `How many steps from ${from} to ${to}?`, `${cf.power / 3} step${cf.power === 3 ? '' : 's'}.`],
        explain: `${from} → ${to} is ${cf.power / 3} step${cf.power === 3 ? '' : 's'} of $1000$: ${cf.op} by $${texNum(cf.factor)}$.`,
        guidedOnly: true,
      },
      {
        id: 'answer',
        kind: 'decimal',
        prompt: `Write $${texNum(show(v))}$ ${from} in ${T.name}.`,
        target: M.decToString(res),
        unit: to,
        display: `$${texNum(show(res))}$ ${to}`,
        hints: [`${mult ? 'Multiply' : 'Divide'} by $${texNum(cf.factor)}$.`, `${mult ? 'Multiplying' : 'Dividing'} by $10^{${cf.power}}$ moves the decimal point ${cf.power} places to the ${mult ? 'right' : 'left'}.`, `$${texNum(show(v))} ${mult ? '\\times' : '\\div'} ${texNum(cf.factor)}$`],
        explain: `$${texNum(show(v))} ${mult ? '\\times' : '\\div'} ${texNum(cf.factor)} = ${texNum(show(res))}$ ${to}`,
      },
    ],
    summary: `${T.name[0].toUpperCase() + T.name.slice(1)} are ${mult ? 'smaller' : 'bigger'} than ${F.name}, so we ${cf.op} by $${texNum(cf.factor)}$: $${texNum(show(v))}$ ${from} $= ${texNum(show(res))}$ ${to}.`,
    answer: `$${texNum(show(res))}$ ${to}`,
  };
}

/**
 * Mass questions: always a single step on the ladder (t↔kg, kg↔g, g↔mg), so
 * it is always × or ÷ 1000, like the worksheet’s 64.8 t → 64,800 kg.
 * The answer is chosen first and the question value derived from it exactly:
 * warm-up and standard answers are whole numbers; stretch may be decimals.
 */
function randomMass(rng: Rng, d: Difficulty): Problem {
  const i = randInt(rng, 0, 2);
  const down = rng() < (d === 0 ? 0.7 : 0.55); // to the smaller unit (multiply)
  const from = down ? UNITS[i] : UNITS[i + 1];
  const to = down ? UNITS[i + 1] : UNITS[i];
  let answer: M.Dec;
  if (down) answer = d === 0 ? dec(String(randInt(rng, 2, 40) * 1000)) : d === 1 ? dec(String(randInt(rng, 11, 999) * 100)) : dec(String(randInt(rng, 101, 9999) * 10));
  else answer = d === 0 ? dec(String(randInt(rng, 2, 40))) : d === 1 ? dec(String(randInt(rng, 2, 95))) : dec(M.fmt(randInt(rng, 101, 9999) / 100, 2));
  const value = M.shiftDec(answer, down ? -3 : 3);
  if (!M.decEquals(M.convertMass(value, from, to), answer)) throw new Error('mass self-check failed');
  return massProblem(rng, M.decToString(value), from, to);
}

export const mass: LessonDef = {
  id: 'mass',
  topic: 'metric',
  title: 'Converting mass',
  blurb: 'Tonnes, kilograms, grams and milligrams.',
  objective: 'convert masses between tonnes, kg, g and mg',
  prereq: ['prefixes'],
  intro: [
    { pose: 'waving', text: 'Mass is measured in tonnes (t), kilograms (kg), grams (g) and milligrams (mg). Each step is $1000$ times the next.', diagram: { type: 'mass-ladder' } },
    { pose: 'explaining', text: 'Think about it: if the units get **smaller**, you need **more** of them, so **multiply**. If they get bigger, **divide**.', formula: '1\\text{ t} = 1000\\text{ kg} \\quad 1\\text{ kg} = 1000\\text{ g} \\quad 1\\text{ g} = 1000\\text{ mg}' },
    { pose: 'curious', text: 'Want to see conversions happen? Try the **Unit converter** (in the menu at the top): type a mass, pick the units, and watch the decimal point move.' },
    { pose: 'thinking', text: 'Each question moves one step on the ladder, so it’s always $\\times 1000$ or $\\div 1000$. These are masses — don’t mix them up with lengths like km and mm.' },
  ],
  guided: () => massProblem(() => 0.5, '64.8', 't', 'kg', true),
  generate: randomMass,
  inExam: true,
  guide: {
    rule: '1 t = 1000 kg; 1 kg = 1000 g; 1 g = 1000 mg',
    explanation: 'To smaller units, multiply (more of them). To bigger units, divide. Each step on the ladder is 1000.',
    mistake: 'Dividing when you should multiply: 64.8 tonnes is 64,800 kg, not 0.0648 kg.',
  },
};

// ───────────────────────── Standard form ─────────────────────────

function sfWriteProblem(rng: Rng, value: string): Problem {
  const v = dec(value);
  const sf = M.toStandardForm(v);
  const coef = M.decToString(sf.coef);
  const big = sf.exp >= 0;
  const places = Math.abs(sf.exp);
  return {
    id: pid('standard-form', rng),
    skill: 'standard-form',
    intro: big ? 'A big number! Let’s write it in standard form.' : 'A tiny number! Let’s write it in standard form.',
    question: `Write $${texNum(show(v))}$ in standard form.`,
    diagram: { type: 'sf-shift', digits: show(v), places, direction: big ? 'left' : 'right' },
    steps: [
      {
        id: 'coef',
        kind: 'number',
        prompt: 'Move the decimal point so there is exactly **one non-zero digit** in front of it. What number do you get?',
        answer: { value: M.decToNumber(sf.coef), tol: 0 },
        display: `$${coef}$`,
        hints: ['Standard form needs a number at least 1 and less than 10.', `The first non-zero digit is ${sf.coef.digits[0]}.`, `$${coef}$`],
        explain: `$${coef}$ is between $1$ and $10$ ✓`,
        guidedOnly: true,
        pose: 'curious',
      },
      {
        id: 'places',
        kind: 'number',
        prompt: 'How many places did the decimal point move?',
        answer: { value: places, tol: 0 },
        display: `$${places}$`,
        hints: ['Count the jumps from where the point was to where it is now.', big ? 'For a whole number, the point starts at the end.' : 'Count the jumps to just after the first non-zero digit.', `$${places}$ places.`],
        explain: `The point moved $${places}$ places to the ${big ? 'left' : 'right'}.`,
        guidedOnly: true,
        highlight: ['jumps'],
      },
      {
        id: 'sign',
        kind: 'choice',
        prompt: 'Will the power of ten be positive or negative?',
        options: opts(rng, [
          big ? ok('pos', 'Positive — it’s a big number') : ok('neg', 'Negative — it’s a small number (less than 1)'),
          big ? no('neg', 'Negative', 'Negative powers are for numbers smaller than 1. This is a big number.') : no('pos', 'Positive', 'Positive powers are for big numbers. This is less than 1.'),
        ]),
        hints: ['Is the original number bigger or smaller than 1?', 'Big numbers: positive powers. Small numbers: negative.', big ? 'Positive.' : 'Negative.'],
        explain: big ? 'Big number → positive power.' : 'Smaller than 1 → negative power.',
        guidedOnly: true,
      },
      {
        id: 'sf',
        kind: 'sf',
        prompt: `Write $${texNum(show(v))}$ in standard form.`,
        target: { coef, exp: sf.exp },
        display: `$${coef} \\times 10^{${sf.exp}}$`,
        hints: ['$a \\times 10^n$ with $1 \\le a < 10$.', `$a = ${coef}$. Now the power: ${places} places, ${big ? 'positive' : 'negative'}.`, `$${coef} \\times 10^{${sf.exp}}$`],
        explain: `$${texNum(show(v))} = ${coef} \\times 10^{${sf.exp}}$`,
      },
    ],
    summary: `Move the point to get $${coef}$ (between 1 and 10). It moved ${places} places, and the number is ${big ? 'big' : 'small'}, so the power is $${sf.exp}$: $${coef} \\times 10^{${sf.exp}}$.`,
    answer: `$${coef} \\times 10^{${sf.exp}}$`,
  };
}

function randomSfValue(rng: Rng, d: Difficulty): string {
  const sig = d === 0 ? String(randInt(rng, 2, 9)) : String(randInt(rng, 11, 99)).replace(/0$/, '5');
  const big = rng() < 0.5;
  const k = d === 0 ? randInt(rng, 2, 5) : randInt(rng, 3, 9);
  const v: M.Dec = { neg: false, digits: sig, exp: big ? k - (sig.length - 1) : -k - (sig.length - 1) };
  return M.decToString(v);
}

export const standardForm: LessonDef = {
  id: 'standard-form',
  topic: 'standard-form',
  title: 'Writing standard form',
  blurb: 'Huge and tiny numbers as a × 10ⁿ.',
  objective: 'write large and small numbers in standard form',
  intro: [
    { pose: 'waving', text: 'Standard form is a neat way to write very big or very small numbers:', formula: 'a \\times 10^n, \\quad 1 \\le a < 10' },
    { pose: 'explaining', text: 'Move the decimal point until one non-zero digit is in front of it. Count the places moved: that’s the power. **Big** numbers get a **positive** power; numbers **smaller than 1** get a **negative** power.', diagram: { type: 'sf-shift', digits: '4,800,000', places: 6, direction: 'left' } },
    { pose: 'thinking', text: 'Example: $0.00035 = 3.5 \\times 10^{-4}$ (the point moves 4 places right).', diagram: { type: 'sf-shift', digits: '0.00035', places: 4, direction: 'right' } },
  ],
  guided: () => sfWriteProblem(() => 0.5, '4800000'),
  moreGuided: [() => sfWriteProblem(() => 0.5, '0.00035')],
  generate: (rng, d) => sfWriteProblem(rng, randomSfValue(rng, d)),
  inExam: true,
  guide: {
    rule: '$a \\times 10^n$ where $1 \\le a < 10$ and $n$ is a whole number',
    explanation: 'Move the decimal point to make $a$; the number of places is $n$. Positive for big numbers, negative for numbers smaller than 1.',
    mistake: 'Writing $35 \\times 10^{-8}$: right value, but $a$ must be less than 10. It should be $3.5 \\times 10^{-7}$.',
  },
};

// ───────────────────────── Units into standard form ─────────────────────────

const SMALL_UNITS: { u: M.LengthUnit; ctx: string[] }[] = [
  { u: 'nm', ctx: ['The diameter of a bacterium is', 'A virus is', 'The wavelength of a light is', 'A transistor gate is'] },
  { u: 'μm', ctx: ['A human hair is', 'A red blood cell is', 'A dust particle is'] },
  { u: 'mm', ctx: ['A grain of sand is', 'An ant is'] },
];

function unitsSfProblem(rng: Rng, value: string, unit: M.LengthUnit, context: string, guided = false): Problem {
  const v = dec(value);
  const m = M.convertLength(v, unit, 'm');
  const sf = M.toStandardForm(m);
  const vsf = M.toStandardForm(v);
  const p = M.LENGTH_UNITS[unit].power;
  const coef = M.decToString(sf.coef);
  const vcoef = M.decToString(vsf.coef);
  if (vsf.exp + p !== sf.exp || !M.decEquals(vsf.coef, sf.coef)) throw new Error('units sf self-check failed');
  const unitName = M.LENGTH_UNITS[unit].name.replace(/s$/, '');
  const wrongPows = [-3, -6, -9, 9].filter((x) => x !== p).slice(0, 3);
  return {
    id: pid('units-sf', rng),
    skill: 'units-sf',
    intro: guided ? 'The worksheet bacterium is $350$ nm across. Let’s write that in metres, in standard form.' : 'Let’s change the units to metres and write the answer in standard form.',
    question: `${context} $${texNum(show(v))}$ ${unit}. Write this in metres in standard form.`,
    diagram: { type: 'prefix-scale' },
    steps: [
      {
        id: 'factor',
        kind: 'choice',
        prompt: `First: $1$ ${unit} $=$ how many metres?`,
        options: opts(rng, [ok('ok', `$10^{${p}}$ m`), ...wrongPows.map((w) => no(`w${w}`, `$10^{${w}}$ m`, `Check the prefix table: what is ${unitName.replace(/metre$/, '')}?`))]),
        hints: [`The prefix tells us: ${unitName}.`, 'nano $= 10^{-9}$, micro $= 10^{-6}$, milli $= 10^{-3}$, kilo $= 10^3$.', `$1$ ${unit} $= 10^{${p}}$ m`],
        explain: `$1$ ${unit} $= 10^{${p}}$ m, so $${texNum(show(v))}$ ${unit} $= ${texNum(show(v))} \\times 10^{${p}}$ m.`,
        pose: 'curious',
      },
      {
        id: 'value-sf',
        kind: 'sf',
        prompt: `Write $${texNum(show(v))}$ itself in standard form.`,
        target: { coef: vcoef, exp: vsf.exp },
        display: `$${vcoef} \\times 10^{${vsf.exp}}$`,
        hints: ['Move the point so one non-zero digit is in front.', `$a = ${vcoef}$`, `$${vcoef} \\times 10^{${vsf.exp}}$`],
        explain: `$${texNum(show(v))} = ${vcoef} \\times 10^{${vsf.exp}}$`,
        guidedOnly: true,
      },
      {
        id: 'add',
        kind: 'number',
        prompt: `Multiplying powers of ten: add the powers. What is $${vsf.exp} + (${p})$?`,
        answer: { value: sf.exp, tol: 0 },
        display: `$${sf.exp}$`,
        hints: ['$10^a \\times 10^b = 10^{a+b}$', 'Add the two powers (careful with the negative).', `$${vsf.exp} + (${p}) = ${sf.exp}$`],
        explain: `$10^{${vsf.exp}} \\times 10^{${p}} = 10^{${sf.exp}}$`,
        guidedOnly: true,
      },
      {
        id: 'final',
        kind: 'sf',
        prompt: `So what is $${texNum(show(v))}$ ${unit} in metres, in standard form?`,
        target: { coef, exp: sf.exp },
        unit: 'm',
        display: `$${coef} \\times 10^{${sf.exp}}$ m`,
        hints: [`$${texNum(show(v))}$ ${unit} $= ${texNum(show(v))} \\times 10^{${p}}$ m`, `$= ${vcoef} \\times 10^{${vsf.exp}} \\times 10^{${p}}$`, `Add the powers: $${vsf.exp} + (${p})$.`],
        explain: `$${texNum(show(v))} \\times 10^{${p}} = ${vcoef} \\times 10^{${vsf.exp}} \\times 10^{${p}} = ${coef} \\times 10^{${sf.exp}}$ m`,
      },
    ],
    summary: `$${texNum(show(v))}$ ${unit} $= ${texNum(show(v))} \\times 10^{${p}}$ m $= ${vcoef} \\times 10^{${vsf.exp}} \\times 10^{${p}} = ${coef} \\times 10^{${sf.exp}}$ m.`,
    answer: `$${coef} \\times 10^{${sf.exp}}$ m`,
  };
}

export const unitsSf: LessonDef = {
  id: 'units-sf',
  topic: 'standard-form',
  title: 'Units in standard form',
  blurb: 'Nanometres to metres, and back again.',
  objective: 'convert a measurement to metres and write it in standard form',
  prereq: ['standard-form', 'prefixes'],
  intro: [
    { pose: 'explaining', text: 'Prefixes are powers of ten — perfect for standard form. Replace the prefix with its power, then tidy up:', formula: '350\\text{ nm} = 350 \\times 10^{-9}\\text{ m} = 3.5 \\times 10^2 \\times 10^{-9} = 3.5 \\times 10^{-7}\\text{ m}' },
    { pose: 'thinking', text: 'When multiplying powers of ten, **add** the powers: $10^2 \\times 10^{-9} = 10^{-7}$.' },
  ],
  guided: () => unitsSfProblem(() => 0.5, '350', 'nm', 'The diameter of a bacterium is', true),
  generate: (rng, d) => {
    // Worksheet structure only: a small length (nm or μm) written in metres in standard form.
    const g = pick(rng, d === 0 ? SMALL_UNITS.slice(0, 1) : SMALL_UNITS.slice(0, 2));
    const val = d === 0 ? String(randInt(rng, 2, 9) * 10 ** randInt(rng, 1, 2)) : d === 1 ? String(randInt(rng, 12, 980)) : M.fmt(randInt(rng, 11, 999) / 10, 1);
    return unitsSfProblem(rng, val, g.u, pick(rng, g.ctx));
  },
  inExam: true,
  guide: {
    rule: 'Replace the prefix with its power of ten, then add the powers: $10^a \\times 10^b = 10^{a+b}$',
    explanation: '$350$ nm $= 350 \\times 10^{-9}$ m $= 3.5 \\times 10^{2} \\times 10^{-9}$ m $= 3.5 \\times 10^{-7}$ m.',
    mistake: 'Stopping at $350 \\times 10^{-9}$: that’s correct, but it isn’t standard form because $350$ isn’t between 1 and 10.',
  },
};

export const METRIC_LESSONS = [prefixes, mass];
export const SF_LESSONS = [standardForm, unitsSf];
