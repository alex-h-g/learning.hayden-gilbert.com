// Run: node tests/curricula.test.js — every level of Andy, Mandy and Danny generates only questions that fit it.
'use strict';
const assert = require('assert');
const A = require('../public_html/addition/js/curriculum.js');
const M = require('../public_html/multiplication/js/curriculum.js');
const D = require('../public_html/division/js/curriculum.js');
const P = require('../public_html/maths/core/js/progress.js');
let checks = 0;

function sweep(C, name, per = 300) {
  for (const L of C.LEVELS) {
    for (const ex of C.exampleSet(L)) { assert.ok(L.profiles.some(p => C.matches(ex, p)), `${name} L${L.id} example ${ex.key} fits no profile`); checks++; }
    for (const p of L.profiles) {
      const keys = new Set();
      for (let i = 0; i < per; i++) {
        const q = C.generate(p);
        assert.ok(C.matches(q, p), `${name} L${L.id} ${p.label} ${q.key}`);
        assert.ok(q.steps.length > 0 && q.answerText);
        keys.add(q.key); checks++;
      }
      assert.ok(keys.size >= (p.len === 1 ? 4 : Math.min(10, per / 10)), `${name} L${L.id} ${p.label}: only ${keys.size} distinct`);
    }
    const set = C.buildSet(L, Math.max(5, L.profiles.length));
    assert.strictEqual(new Set(set.map(q => q.key)).size, set.length, `${name} L${L.id} duplicates`);
  }
}
sweep(A, 'add'); sweep(M, 'mul'); sweep(D, 'div');

// Addition rules
for (let i = 0; i < 500; i++) {
  assert.strictEqual(A.generate(A.getLevel(2).profiles[0]).carryCount, 0);
  assert.ok(A.generate(A.getLevel(3).profiles[0]).carryCount > 0);
  const f = A.generate(A.getLevel(1).profiles[0]); assert.ok(f.a <= 9 && f.b <= 9);
}
// Multiplication rules
for (let i = 0; i < 500; i++) {
  assert.strictEqual(M.generate(M.getLevel(2).profiles[0]).mulCarries, 0);
  assert.ok(M.generate(M.getLevel(3).profiles[0]).mulCarries > 0);
  assert.strictEqual(M.generate(M.getLevel(6).profiles[1]).partials.length, 3);
}
// Diagnostic: exactly three, both factors 1..9, no duplicates (including 3×4 vs 4×3), varies between runs
const seen = new Set();
for (let i = 0; i < 2000; i++) {
  const d = M.diagnostic();
  assert.strictEqual(d.length, 3);
  const keys = d.map(q => Math.min(q.a, q.b) + 'x' + Math.max(q.a, q.b));
  assert.strictEqual(new Set(keys).size, 3, 'duplicate in diagnostic');
  for (const q of d) { assert.ok(q.a >= 1 && q.a <= 9 && q.b >= 1 && q.b <= 9); assert.strictEqual(q.answer, q.a * q.b); }
  seen.add(keys.sort().join(','));
}
assert.ok(seen.size > 500, 'diagnostic not random enough');
// Times-table sets cover the chosen table
for (let n = 1; n <= 9; n++) M.tableSet(n, 10).forEach(q => assert.ok(q.a === n || q.b === n));

// Division ordering: exact before remainders before decimals
const modeOf = L => new Set(L.profiles.map(p => p.fact ? 'exact' : p.mode));
const firstLevel = mode => D.LEVELS.find(L => modeOf(L).has(mode) && !L.mixedFrom).id;
assert.ok(firstLevel('exact') < firstLevel('remainder'), 'remainders before exact');
assert.ok(firstLevel('remainder') < firstLevel('decimal'), 'decimals before remainders');
for (const L of D.LEVELS) if (L.id < firstLevel('remainder')) assert.ok(!modeOf(L).has('remainder') && !modeOf(L).has('decimal'));
for (let i = 0; i < 300; i++) {
  assert.strictEqual(D.generate(D.getLevel(5).profiles[1]).zeroInQuotient, true);
  const r = D.generate(D.getLevel(6).profiles[0]); assert.ok(r.remainder > 0 && r.remainder < r.divisor);
  const dq = D.generate(D.getLevel(9).profiles[0]); assert.ok(dq.dp >= 1 && dq.dp <= 3);
}

// Mastery scoring & unlocking (shared progress store)
function mem() { const s = {}; return { getItem: k => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = String(v); }, s }; }
for (const C of [A, M, D]) {
  const st = mem(), prog = P.create(st, 'k', C).load();
  assert.ok(prog.isUnlocked(1) && !prog.isUnlocked(2));
  prog.markPhase(1, 'learned'); prog.markPhase(1, 'practised');
  assert.ok(!prog.isUnlocked(2), 'clicking through lessons must not unlock');
  assert.strictEqual(prog.recordMastery(1, 3, 5), false); assert.ok(!prog.isUnlocked(2));
  assert.strictEqual(prog.recordMastery(1, 4, 4), false, 'fewer than 5 questions must not pass');
  assert.strictEqual(prog.recordMastery(1, 4, 5), true); assert.ok(prog.isUnlocked(2));
  assert.ok(prog.isUnlocked(1), 'completed level stays open');
  const again = P.create(st, 'k', C).load(); assert.ok(again.level(1).mastered, 'persists');
  st.setItem('k', '{"v":1,"levels":{"1":{"mastered":"yes","attempts":"lots"}}}');
  const bad = P.create(st, 'k', C).load(); assert.strictEqual(bad.level(1).mastered, false); assert.strictEqual(bad.level(1).attempts, 0);
  st.setItem('k', 'not json'); assert.strictEqual(P.create(st, 'k', C).load().totals().mastered, 0);
  checks += 10;
}
console.log(`curricula: ${checks} checks passed`);
