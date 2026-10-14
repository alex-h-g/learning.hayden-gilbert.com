// Run: node tests/times-tables.test.js — Mandy's Times Tables (Chant Along, Flashcards, Game) logic and storage.
'use strict';
const assert = require('assert');
const TT = require('../public_html/multiplication/times-tables/js/tt-core.js');
const Store = require('../public_html/multiplication/times-tables/js/tt-store.js');
let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.error('FAIL', name); throw e; } };

function seeded(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function memStorage(init) {
  const m = Object.assign({}, init || {});
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m };
}

/* ── tables, chant, flashcards ── */
t('tables 1–10 are correct', () => {
  for (let a = 1; a <= 10; a++) {
    const tab = TT.table(a);
    assert.strictEqual(tab.length, 10);
    tab.forEach((f, i) => { assert.strictEqual(f.a, a); assert.strictEqual(f.b, i + 1); assert.strictEqual(f.answer, a * (i + 1)); });
  }
});
t('number words', () => {
  assert.deepStrictEqual([0, 1, 13, 20, 21, 42, 99, 100].map(TT.words), ['zero', 'one', 'thirteen', 'twenty', 'twenty-one', 'forty-two', 'ninety-nine', 'one hundred']);
  assert.throws(() => TT.words(101));
});
t('chant lines for the 3 times table', () => {
  const L = TT.chantLines(3);
  assert.strictEqual(L[0].spoken, 'Three times one equals three.');
  assert.strictEqual(L[1].spoken, 'Three times two equals six.');
  assert.strictEqual(L[9].spoken, 'Three times ten equals thirty.');
  assert.strictEqual(L[5].display, '3 × 6 = 18');
  assert.deepStrictEqual(L.map(l => l.longPause), [false, false, false, false, true, false, false, false, false, true]);
});
t('every chant line is mathematically right in figures and words', () => {
  const back = {}; for (let i = 0; i <= 100; i++) back[TT.words(i)] = i;
  for (let a = 1; a <= 10; a++) TT.chantLines(a).forEach(l => {
    const m = /^(\S+) times (\S+) equals (.+)\.$/.exec(l.spoken);
    assert.ok(m, l.spoken);
    assert.strictEqual(back[m[1].toLowerCase()] * back[m[2]], back[m[3]]);
    assert.strictEqual(back[m[3]], a * l.b);
  });
});
t('flashcards sequential and random', () => {
  assert.deepStrictEqual(TT.flashcardDeck(7, 'sequential').map(c => c.b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const r = TT.flashcardDeck(7, 'random', seeded(3));
  assert.deepStrictEqual(r.map(c => c.b).sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.notDeepStrictEqual(r.map(c => c.b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  r.forEach(c => assert.strictEqual(c.answer, 7 * c.b));
});

/* ── distractors: exhaustive over 1×1 … 10×10, many seeds ── */
t('choices: exactly three, one correct, distinct, positive, plausible', () => {
  for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) for (let s = 1; s <= 40; s++) {
    const c = TT.choicesFor(a, b, seeded(s * 101 + a * 7 + b));
    const p = a * b;
    assert.strictEqual(c.length, 3, `${a}x${b}`);
    assert.strictEqual(c.filter(x => x.correct).length, 1);
    assert.strictEqual(c.find(x => x.correct).value, p);
    assert.strictEqual(new Set(c.map(x => x.value)).size, 3, `dupes ${a}x${b}`);
    c.forEach(x => { assert.ok(Number.isInteger(x.value) && x.value > 0); });
    c.filter(x => !x.correct).forEach(x => {
      // plausible: within one "lot" (±max(a,b)·2) or a small slip near the answer
      assert.ok(Math.abs(x.value - p) <= 2 * Math.max(a, b, 2), `${a}x${b} implausible ${x.value}`);
    });
  }
});
t('7×6 offers neighbouring facts like 36 / 42 / 48 / 35 / 49', () => {
  const pool = TT.candidatePool(7, 6).tier1.sort((x, y) => x - y);
  assert.deepStrictEqual(pool, [35, 36, 48, 49]);
  for (let s = 1; s < 50; s++) TT.distractors(7, 6, seeded(s)).forEach(d => assert.ok([35, 36, 48, 49].includes(d)));
});
t('boundary: 1×1, 1×n, n×1 and ×10', () => {
  assert.deepStrictEqual(TT.distractors(1, 1, seeded(1)).sort((x, y) => x - y), [2, 3]);
  for (let s = 1; s < 30; s++) {
    TT.distractors(1, 5, seeded(s)).forEach(d => assert.ok([4, 6, 10].includes(d), 'got ' + d));
    TT.distractors(10, 10, seeded(s)).forEach(d => assert.ok([90, 110].includes(d), 'got ' + d));
    TT.distractors(10, 1, seeded(s)).forEach(d => assert.ok([9, 11, 20].includes(d), 'got ' + d));
  }
});
t('correct answer position varies', () => {
  const pos = new Set();
  for (let s = 1; s < 60; s++) pos.add(TT.choicesFor(6, 7, seeded(s)).findIndex(c => c.correct));
  assert.deepStrictEqual([...pos].sort(), [0, 1, 2]);
});
t('fallback still gives two distinct wrong answers', () => {
  // force the fallback path by testing the pure generator on every fact with a constant rng
  for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
    const d = TT.distractors(a, b, () => 0);
    assert.strictEqual(d.length, 2); assert.notStrictEqual(d[0], d[1]); d.forEach(x => assert.ok(x > 0 && x !== a * b));
  }
});

/* ── rounds respect both limits ── */
t('range facts are independent (A up to 7, B up to 3)', () => {
  const r = TT.rangeFacts(7, 3);
  assert.strictEqual(r.length, 21);
  r.forEach(f => assert.ok(f.a <= 7 && f.b <= 3));
  assert.ok(r.some(f => f.key === '7x1') && r.some(f => f.key === '4x3'));
  assert.ok(!r.some(f => f.key === '8x2') && !r.some(f => f.key === '3x4'));
});
t('practise rounds: count, limits, order', () => {
  for (const [A, B] of [[1, 1], [5, 4], [7, 3], [10, 10], [2, 9]]) for (const count of [10, 20, 30]) for (const order of ['random', 'sequential']) {
    const q = TT.buildRound({ settings: { maxA: A, maxB: B, count, order }, rng: seeded(A * 31 + B + count) });
    assert.strictEqual(q.length, count);
    q.forEach(x => { assert.ok(x.a >= 1 && x.a <= A && x.b >= 1 && x.b <= B, `${x.a}x${x.b} outside ${A}x${B}`); assert.strictEqual(x.answer, x.a * x.b); });
    if (order === 'random' && A * B > 1) for (let i = 1; i < q.length; i++) assert.notStrictEqual(q[i].key, q[i - 1].key, 'back-to-back repeat');
  }
  const seq = TT.buildRound({ settings: { maxA: 2, maxB: 3, count: 10, order: 'sequential' } }).map(x => x.key);
  assert.deepStrictEqual(seq, ['1x1', '1x2', '1x3', '2x1', '2x2', '2x3', '1x1', '1x2', '1x3', '2x1']);
});
t('settings are sanitised with a beginner default', () => {
  assert.deepStrictEqual(TT.sanitizeSettings(null), { maxA: 5, maxB: 5, count: 10, order: 'random' });
  assert.deepStrictEqual(TT.sanitizeSettings({ maxA: 99, maxB: -3, count: 7, order: 'x' }), { maxA: 10, maxB: 1, count: 10, order: 'random' });
});

/* ── game round state machine ── */
t('wrong then right: wrong option disabled, cannot inflate attempts, locked after correct', () => {
  const qs = TT.buildRound({ settings: { maxA: 7, maxB: 6, count: 10 }, rng: seeded(9) });
  const r = TT.createRound(qs, 'R1');
  const q = r.current(), wrongI = q.choices.findIndex(c => !c.correct), rightI = q.choices.findIndex(c => c.correct);
  assert.strictEqual(r.choose(wrongI).result, 'wrong');
  assert.strictEqual(r.choose(wrongI).result, 'ignored');
  assert.strictEqual(q.tries, 1);
  assert.ok(q.choices[wrongI].disabled);
  assert.deepStrictEqual(r.choose(rightI), { result: 'correct', tries: 2 });
  assert.strictEqual(r.choose(rightI).result, 'ignored');
  assert.strictEqual(q.tries, 2);
  assert.strictEqual(r.index, 0); r.next(); assert.strictEqual(r.index, 1);
});
t('cannot skip an unsolved question', () => {
  const r = TT.createRound(TT.buildRound({ settings: { count: 10 }, rng: seeded(2) }));
  r.next(); assert.strictEqual(r.index, 0);
});
t('round summary reflects actual attempts', () => {
  const r = TT.createRound(TT.buildRound({ settings: { maxA: 10, maxB: 10, count: 10 }, rng: seeded(5) }), 'R');
  const plan = [1, 2, 1, 3, 1, 1, 2, 1, 1, 1];
  plan.forEach(tries => {
    const q = r.current();
    const wrong = q.choices.map((c, i) => c.correct ? -1 : i).filter(i => i >= 0);
    for (let k = 0; k < tries - 1; k++) r.choose(wrong[k]);
    r.choose(q.choices.findIndex(c => c.correct)); r.next();
  });
  assert.ok(r.done);
  const s = r.summary();
  assert.strictEqual(s.completed, 10); assert.strictEqual(s.firstTry, 7); assert.strictEqual(s.neededAnotherTry, 3);
  assert.ok(s.tricky.length >= 1 && s.tricky.length <= 3);
});

/* ── revision rule ── */
t('one slip flags until the next first-time success', () => {
  let s = TT.recordAttempt(null, 1, 'r1');
  s = TT.recordAttempt(s, 2, 'r2');
  assert.strictEqual(TT.assess(s).status, 'practise');
  s = TT.recordAttempt(s, 1, 'r3');
  assert.strictEqual(TT.assess(s).needsRevision, false);
  assert.strictEqual(TT.assess(s).status, 'learning');
});
t('recurring difficulty stays until three separate first-time rounds', () => {
  let s = null;
  s = TT.recordAttempt(s, 2, 'r1'); s = TT.recordAttempt(s, 3, 'r2');
  const hi = TT.assess(s); assert.ok(hi.recurring && hi.needsRevision);
  s = TT.recordAttempt(s, 1, 'r3'); assert.ok(TT.assess(s).needsRevision);
  s = TT.recordAttempt(s, 1, 'r3'); assert.strictEqual(s.streak, 1, 'same round does not grow the streak');
  s = TT.recordAttempt(s, 1, 'r4'); assert.ok(TT.assess(s).needsRevision);
  const before = TT.assess(s).priority;
  s = TT.recordAttempt(s, 1, 'r5');
  assert.strictEqual(TT.assess(s).needsRevision, false);
  assert.strictEqual(TT.assess(s).status, 'strong');
  assert.ok(before >= 1);
});
t('repeatedly difficult facts outrank single slips; first-time successes lower priority', () => {
  const once = TT.recordAttempt(null, 2, 'a');
  let many = TT.recordAttempt(null, 2, 'a'); many = TT.recordAttempt(many, 3, 'b'); many = TT.recordAttempt(many, 2, 'c');
  assert.ok(TT.assess(many).priority > TT.assess(once).priority);
  const p0 = TT.assess(many).priority;
  const better = TT.recordAttempt(many, 1, 'd');
  assert.ok(TT.assess(better).priority < p0);
});
t('not "strong" after one correct answer', () => {
  assert.strictEqual(TT.assess(TT.recordAttempt(null, 1, 'x')).status, 'learning');
  let s = TT.recordAttempt(null, 1, 'x'); s = TT.recordAttempt(s, 1, 'y');
  assert.strictEqual(TT.assess(s).status, 'learning');
  s = TT.recordAttempt(s, 1, 'z');
  assert.strictEqual(TT.assess(s).status, 'strong');
});
t('revision rounds respect the range and priority', () => {
  const stats = {};
  const miss = (k, n) => { for (let i = 0; i < n; i++) stats[k] = TT.recordAttempt(stats[k], 3, 'r' + i); };
  miss('7x8', 3); miss('2x3', 1); miss('4x4', 3); miss('5x4', 2);
  stats['3x3'] = TT.recordAttempt(null, 1, 'r');
  const rev = TT.revisionFacts(stats, 5, 4).map(f => f.key);
  assert.deepStrictEqual(rev, ['4x4', '5x4', '2x3']);
  const r = TT.buildRound({ kind: 'revise', stats, settings: { maxA: 5, maxB: 4, count: 10, order: 'sequential' } });
  assert.deepStrictEqual(r.map(q => q.key), ['4x4', '5x4', '2x3']);
  const mix = TT.buildRound({ kind: 'mix', stats, settings: { maxA: 5, maxB: 4, count: 10 }, rng: seeded(4) });
  assert.strictEqual(mix.length, 10);
  mix.forEach(q => assert.ok(q.a <= 5 && q.b <= 4));
  ['4x4', '5x4', '2x3'].forEach(k => assert.ok(mix.some(q => q.key === k)));
  const focus = TT.buildRound({ kind: 'focus', focus: ['7x8', '4x3', '4x3', 'junk'], settings: { maxA: 5, maxB: 4 } });
  assert.deepStrictEqual(focus.map(q => q.key), ['4x3']);
});
t('malformed stats never crash', () => {
  assert.deepStrictEqual(TT.assess({ seen: 'x' }).status, 'new');
  const s = TT.sanitizeStat({ seen: 2, firstTry: 9, misses: -4, lastSeen: 5 });
  assert.strictEqual(s.firstTry, 2); assert.strictEqual(s.misses, 0); assert.strictEqual(s.lastSeen, null);
  assert.deepStrictEqual(TT.revisionFacts({ 'bad': {}, '11x2': { seen: 3, misses: 3, lastTries: 2 } }, 10, 10), []);
});

/* ── storage: profiles, separation, reset, privacy of other keys ── */
t('create, select, same-name students stay separate', () => {
  const st = memStorage();
  const S = Store.create(st);
  assert.strictEqual(S.createStudent('   '), null);
  const a1 = S.createStudent('  Alex  ');
  assert.strictEqual(a1.name, 'Alex');
  assert.deepStrictEqual(S.findByName('alex').map(x => x.id), [a1.id]);
  const a2 = S.createStudent('Alex');
  assert.notStrictEqual(a1.id, a2.id);
  S.recordAttempt(6, 7, 3, 'r1', a1.id);
  assert.ok(S.facts(a1.id)['6x7']); assert.ok(!S.facts(a2.id)['6x7']);
  assert.strictEqual(S.activeId, a2.id);
  const S2 = Store.create(st); // page refresh
  assert.strictEqual(S2.students().length, 2);
  assert.strictEqual(S2.facts(a1.id)['6x7'].wrong, 2);
  assert.strictEqual(S2.active().id, a2.id);
});
t('switching students keeps everyone’s progress', () => {
  const st = memStorage(); const S = Store.create(st);
  const a = S.createStudent('Ana'), b = S.createStudent('Ben');
  S.select(a.id); S.recordAttempt(3, 4, 2, 'x');
  S.select(b.id); S.recordAttempt(9, 9, 1, 'y');
  S.clearActive(); assert.strictEqual(S.active(), null);
  S.select(a.id);
  assert.deepStrictEqual(Object.keys(S.facts()), ['3x4']);
  assert.deepStrictEqual(Object.keys(S.facts(b.id)), ['9x9']);
});
t('reset clears only that student; remove deletes profile; other apps untouched', () => {
  const st = memStorage({ 'arith-multiplication:progress:v1': '{"v":1}', 'arithmetic:profile:v1': '{"v":1,"name":"Gang Kid"}', other: 'keep' });
  const S = Store.create(st);
  const a = S.createStudent('Ana'), b = S.createStudent('Ben');
  S.setSettings({ maxA: 8 }, a.id);
  S.recordAttempt(3, 4, 2, 'x', a.id); S.recordAttempt(5, 5, 3, 'x', b.id);
  S.resetProgress(a.id);
  assert.deepStrictEqual(S.facts(a.id), {});
  assert.strictEqual(S.settings(a.id).maxA, 8, 'settings survive reset');
  assert.ok(S.facts(b.id)['5x5']);
  S.removeStudent(b.id);
  assert.deepStrictEqual(S.students().map(x => x.name), ['Ana']);
  assert.ok(!JSON.parse(st._m[Store.KEY]).progress[b.id]);
  assert.strictEqual(st._m.other, 'keep');
  assert.strictEqual(st._m['arith-multiplication:progress:v1'], '{"v":1}');
  assert.strictEqual(st._m['arithmetic:profile:v1'], '{"v":1,"name":"Gang Kid"}');
  assert.strictEqual(S.gangName(), 'Gang Kid');
  assert.deepStrictEqual(Object.keys(st._m).sort(), ['arith-multiplication:progress:v1', 'arithmetic:profile:v1', Store.KEY, 'other'].sort());
});
t('malformed or unavailable storage', () => {
  for (const bad of ['not json', '[]', '{"v":2}', '{"v":1,"students":"x","progress":5}', '{"v":1,"students":[{"id":"<x>","name":"A"},{"id":"ok","name":""},{"id":"s1","name":"Zed"}],"active":"nope","progress":{"s1":{"facts":{"zz":1,"3x3":{"seen":"y"}},"settings":{"maxA":40}}}}']) {
    const S = Store.create(memStorage({ [Store.KEY]: bad }));
    assert.ok(Array.isArray(S.students()));
    S.students().forEach(s => { assert.ok(S.settings(s.id).maxA <= 10); Object.keys(S.facts(s.id)).forEach(k => assert.ok(TT.parseKey(k))); });
  }
  const S = Store.create(memStorage({ [Store.KEY]: '{"v":1,"students":[{"id":"<x>","name":"A"},{"id":"s1","name":"Zed"}],"active":"nope"}' }));
  assert.deepStrictEqual(S.students().map(s => s.name), ['Zed']); assert.strictEqual(S.active(), null);
  const throwing = { getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); }, removeItem() {} };
  const T = Store.create(throwing); const x = T.createStudent('Mo'); assert.ok(x); T.recordAttempt(2, 2, 1, 'r');
  const N = Store.create(null); assert.strictEqual(N.persistent, false); assert.ok(N.createStudent('Mo'));
});
t('chant speed is clamped and saved', () => {
  const st = memStorage(); const S = Store.create(st);
  assert.strictEqual(S.rate, Store.RATE_DEFAULT);
  S.setRate(5); assert.strictEqual(Store.create(st).rate, Store.RATE_MAX);
  S.setRate('x'); assert.strictEqual(S.rate, Store.RATE_DEFAULT);
});

console.log(`times-tables: ${n} tests passed`);
