// Run: node subtraction/tests/curriculum.test.js
'use strict';
const assert = require('assert');
const C = require('../public_html/subtraction/js/curriculum.js');
const E = require('../public_html/subtraction/js/engine.js');

let checks = 0;
assert.strictEqual(C.LEVELS.length, 14);

for (const L of C.LEVELS) {
  // Every teaching example is valid for its level (except mixed, which accepts any profile)
  for (const q of C.exampleSet(L)) {
    assert.ok(L.profiles.some(p => C.matches(q, p)) || (q.answer === 0), `L${L.id} example ${q.key} fits no profile`);
    checks++;
  }
  // Generate lots of questions per profile and verify
  for (const p of L.profiles) {
    const seen = new Set();
    for (let i = 0; i < 400; i++) {
      const q = C.generate(p);
      assert.ok(C.matches(q, p), `L${L.id} ${p.label} ${q.key}`);
      assert.strictEqual(String(q.top).length, p.top);
      assert.strictEqual(String(q.bottom).length, p.bottom);
      assert.ok(q.answer > 0 && q.answer === q.top - q.bottom);
      if (p.borrow === 'none') assert.strictEqual(q.borrowCount, 0, `L${L.id} no-borrow produced borrow ${q.key}`);
      if (p.borrow === 'some') assert.ok(q.borrowCount > 0);
      if (p.zero === true) assert.ok(q.maxZeroChain >= 1);
      if (p.minZeroChain) assert.ok(q.maxZeroChain >= p.minZeroChain, `${q.key}`);
      seen.add(q.key);
      checks++;
    }
    assert.ok(seen.size > 20, `L${L.id} ${p.label}: only ${seen.size} distinct questions`);
  }
  // Sets cover all profiles and avoid duplicates
  const set = C.buildSet(L, Math.max(5, L.profiles.length));
  assert.strictEqual(new Set(set.map(q => q.key)).size, set.length, `L${L.id} duplicate in set`);
  const labels = new Set(set.map(q => q.profile.label));
  for (const p of L.profiles) if (!L.mixed) assert.ok(labels.has(p.label), `L${L.id} set missing ${p.label}`);
  // Focused practice targets the requested skill more often
  if (L.profiles.length > 1 && !L.mixed) {
    const focus = L.profiles[L.profiles.length - 1].label;
    const fs = C.buildSet(L, 10, { focus });
    assert.ok(fs.filter(q => q.profile.label === focus).length >= 4, `L${L.id} focus not targeted`);
  }
}

// Level 7 & 9 & 13 include borrowing across zero; Level 13 crosses multiple zeros
assert.ok(C.getLevel(7).profiles.some(p => p.zero === true));
assert.ok(C.getLevel(9).profiles.some(p => p.zero === true));
assert.ok(C.getLevel(13).profiles.some(p => p.minZeroChain >= 2));
// Next-level chain
for (let i = 0; i < 13; i++) assert.strictEqual(C.LEVELS[i].next, C.LEVELS[i + 1].id);
assert.strictEqual(C.LEVELS[13].next, null);

console.log(`curriculum: ${checks} checks passed`);
