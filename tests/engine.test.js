// Run: node subtraction/tests/engine.test.js
'use strict';
const assert = require('assert');
const E = require('../public_html/subtraction/js/engine.js');

let passed = 0;
function t(name, fn) { fn(); passed++; }

const table = [
  [24, 3, 21], [52, 8, 44], [86, 32, 54], [58, 49, 9], [458, 3, 455],
  [786, 42, 744], [402, 18, 384], [786, 243, 543], [731, 456, 275],
  [5834, 2, 5832], [5834, 321, 5513], [9876, 4321, 5555],
  [5832, 2764, 3068], [7002, 3487, 3515], [6000, 4321, 1679]
];
for (const [a, b, ans] of table) {
  t(`${a} - ${b}`, () => {
    const s = E.solve(a, b);
    assert.strictEqual(s.answer, ans);
    const fromCols = s.answerCols.reduce((v, d, i) => v + d * 10 ** i, 0);
    assert.strictEqual(fromCols, ans);
    for (const st of s.steps) if (st.type !== 'needBorrow') assert.ok(st.expected >= 0 && st.expected <= 9, `${a}-${b} step entry ${st.expected}`);
  });
}

// Intermediate states from the spec
t('58-49 working', () => {
  const s = E.solve(58, 49);
  const borrows = s.steps.filter(x => x.type === 'borrow');
  assert.deepStrictEqual(borrows.map(x => [x.fromBefore, x.fromAfter, x.toBefore, x.toAfter]), [[5, 4, 8, 18]]);
  assert.deepStrictEqual(s.steps.filter(x => x.type === 'subtract').map(x => [x.top, x.bottom, x.value]), [[18, 9, 9], [4, 4, 0]]);
  assert.strictEqual(s.leadingZeros, 1);
});
t('402-187 regroups to 3 | 9 | 12', () => {
  const s = E.solve(402, 187);
  assert.deepStrictEqual(s.finalWorking.slice().reverse(), [3, 9, 12]);
  assert.deepStrictEqual(s.history[1], [0, 10, 9]);
  assert.deepStrictEqual(s.history[0], [2, 12]);
  assert.deepStrictEqual(s.history[2], [4, 3]);
  assert.strictEqual(s.maxZeroChain, 1);
  const order = s.steps.filter(x => x.type === 'borrow').map(x => `${x.from}->${x.to}`);
  assert.deepStrictEqual(order, ['2->1', '1->0']);
  assert.strictEqual(s.answer, 215);
});
t('6000-4321 crosses two zeros', () => {
  const s = E.solve(6000, 4321);
  assert.strictEqual(s.maxZeroChain, 2);
  assert.deepStrictEqual(s.finalWorking.slice().reverse(), [5, 9, 9, 10]);
  assert.deepStrictEqual(s.history[2], [0, 10, 9]);
  assert.deepStrictEqual(s.history[1], [0, 10, 9]);
});
t('7002-3487', () => {
  const s = E.solve(7002, 3487);
  assert.deepStrictEqual(s.finalWorking.slice().reverse(), [6, 9, 9, 12]);
  // after units borrow, tens is 9 >= 8 and hundreds 9 >= 4: only one borrow event
  assert.strictEqual(s.borrowCount, 1);
});
t('5832-2764 multiple separate borrows', () => {
  const s = E.solve(5832, 2764);
  assert.deepStrictEqual(s.borrowCols, [0, 1]); assert.deepStrictEqual(s.finalWorking.slice().reverse(), [5, 7, 12, 12]);
});
t('no-borrow has no borrow steps', () => {
  assert.strictEqual(E.solve(9876, 4321).borrowCount, 0);
});
t('rejects negatives', () => { assert.throws(() => E.solve(3, 5)); });

// Exhaustive check for 2- and 3-digit, random for 4-digit: value invariant + answer
t('exhaustive 0..999', () => {
  for (let a = 0; a <= 999; a++) for (let b = 0; b <= a; b++) {
    const s = E.solve(a, b);
    if (s.answer !== a - b) throw new Error(`${a}-${b}`);
  }
});
t('random 4-digit', () => {
  for (let i = 0; i < 200000; i++) {
    const a = 1000 + Math.floor(Math.random() * 9000), b = Math.floor(Math.random() * (a + 1));
    if (E.solve(a, b).answer !== a - b) throw new Error(`${a}-${b}`);
  }
});

console.log(`engine: ${passed} tests passed`);
