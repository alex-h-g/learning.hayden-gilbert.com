// Run: node tests/engines.test.js — arithmetic engines for Andy, Mandy and Danny (Susy has engine.test.js).
'use strict';
const assert = require('assert');
const Add = require('../public_html/addition/js/engine.js');
const Mul = require('../public_html/multiplication/js/engine.js');
const Div = require('../public_html/division/js/engine.js');
const Facts = require('../public_html/maths/core/js/facts.js');
let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.error('FAIL', name); throw e; } };
const entries = s => s.steps.filter(x => x.kind === 'entry').map(x => x.type + ':' + x.expected);

// ── Addition ──
for (const [a, b, c] of [[23, 14, 37], [27, 18, 45], [347, 268, 615], [768, 584, 1352]]) t(`${a}+${b}`, () => assert.strictEqual(Add.solve([a, b]).answer, c));
t('23+14 no carry steps', () => assert.deepStrictEqual(entries(Add.solve([23, 14])), ['write:7', 'write:3']));
t('27+18 carry', () => {
  const s = Add.solve([27, 18]);
  assert.deepStrictEqual(entries(s), ['colSum:15', 'write:5', 'write:4']);
  assert.deepStrictEqual(s.carryCols, [0]);
});
t('768+584 carries into thousands', () => {
  const s = Add.solve([768, 584]);
  assert.deepStrictEqual(entries(s), ['colSum:12', 'write:2', 'colSum:15', 'write:5', 'colSum:13', 'write:3', 'carryDown:1']);
  assert.strictEqual(s.width, 4); assert.ok(s.carryOut);
});
t('different lengths 456+78', () => { const s = Add.solve([456, 78]); assert.strictEqual(s.answer, 534); assert.deepStrictEqual(s.answerCols, [4, 3, 5]); });
t('three addends', () => assert.strictEqual(Add.solve([492, 3690, 24600]).answer, 28782));
t('add exhaustive', () => { for (let a = 0; a < 1000; a++) for (let b = 0; b < 1000; b += 7) if (Add.solve([a, b]).answer !== a + b) throw new Error(a + '+' + b); });

// ── Multiplication ──
for (const [a, b, c] of [[23, 4, 92], [23, 12, 276], [123, 24, 2952], [123, 234, 28782]]) t(`${a}x${b}`, () => assert.strictEqual(Mul.solve(a, b).answer, c));
t('6x7 fact', () => assert.strictEqual(Facts.solveFact('x', 6, 7).answer, 42));
t('23x12 partial products and alignment', () => {
  const s = Mul.solve(23, 12);
  assert.deepStrictEqual(s.partials, [46, 230]);
  assert.deepStrictEqual(s.rows[1].digits, { 0: 0, 1: 3, 2: 2 }); // 230 with the place-value zero in the units column
  assert.deepStrictEqual(entries(s), ['write:6', 'write:4', 'placeholder:0', 'write:3', 'write:2', 'write:6', 'write:7', 'write:2']);
});
t('123x24 carries in partials and addition', () => {
  const s = Mul.solve(123, 24);
  assert.deepStrictEqual(s.partials, [492, 2460]);
  assert.ok(s.mulCarries >= 1 && s.addCarries >= 1);
});
t('123x234 three partial products', () => {
  const s = Mul.solve(123, 234);
  assert.deepStrictEqual(s.partials, [492, 3690, 24600]);
  assert.deepStrictEqual(s.rows[2].digits[0], 0); assert.deepStrictEqual(s.rows[2].digits[1], 0);
});
t('27x4 carry out', () => assert.deepStrictEqual(entries(Mul.solve(27, 4)), ['times:28', 'write:8', 'times:8', 'addCarry:10', 'write:0', 'writeCarry:1']));
t('mul exhaustive-ish', () => {
  for (let a = 1; a < 1000; a += 3) for (const b of [1, 7, 12, 39, 99, 123, 456, 999]) {
    const s = Mul.solve(a, b);
    if (s.answer !== a * b) throw new Error(a + 'x' + b);
    if (s.partials.reduce((x, y) => x + y, 0) !== a * b) throw new Error('partials ' + a + 'x' + b);
  }
});

// ── Division ──
const cases = [[27, 9, 'exact', '3'], [27, 3, 'exact', '9'], [84, 4, 'exact', '21'], [29, 8, 'remainder', '3 r 5'], [7, 2, 'decimal', '3.5'], [408, 4, 'exact', '102']];
for (const [a, b, m, ans] of cases) t(`${a}/${b}`, () => assert.strictEqual(Div.solve(a, b, m).answerText, ans));
t('27/9 and 27/3 facts', () => { assert.strictEqual(Facts.solveFact('/', 27, 9).answer, 3); assert.strictEqual(Facts.solveFact('/', 27, 3).answer, 9); });
t('29/8 steps', () => assert.deepStrictEqual(entries(Div.solve(29, 8, 'remainder')), ['qdigit:3', 'product:24', 'subtract:5', 'remainder:5']));
t('84/4 steps', () => assert.deepStrictEqual(entries(Div.solve(84, 4, 'exact')), ['qdigit:2', 'product:8', 'subtract:0', 'qdigit:1', 'product:4', 'subtract:0']));
t('408/4 zero in quotient, placed over the 0', () => {
  const s = Div.solve(408, 4, 'exact');
  assert.deepStrictEqual(s.quotientDigits, [1, 0, 2]);
  assert.ok(s.zeroInQuotient);
  assert.deepStrictEqual(entries(s), ['qdigit:1', 'product:4', 'subtract:0', 'qdigit:0', 'qdigit:2', 'product:8', 'subtract:0']);
});
t('7/2 decimal continuation', () => {
  const s = Div.solve(7, 2, 'decimal');
  assert.deepStrictEqual(entries(s), ['qdigit:3', 'product:6', 'subtract:1', 'qdigit:5', 'product:10', 'subtract:0']);
  assert.ok(s.steps.some(x => x.type === 'decimalPoint'));
  assert.strictEqual(s.dp, 1);
});
t('25/8 = 3.125', () => assert.strictEqual(Div.solve(25, 8, 'decimal').answerText, '3.125'));
t('remainder always smaller than divisor; decimals exact', () => {
  for (let a = 1; a <= 9999; a++) for (let b = 2; b <= 9; b++) {
    const s = Div.solve(a, b, 'remainder');
    if (s.remainder >= b || Number(s.quotientText) * b + s.remainder !== a) throw new Error(a + '/' + b);
    for (const st of s.steps) if (st.type === 'subtract' && (st.value < 0 || st.value >= b)) throw new Error('bad subtract ' + a + '/' + b);
    for (const st of s.steps) if (st.type === 'qdigit' && (st.value < 0 || st.value > 9)) throw new Error('bad qdigit ' + a + '/' + b);
    try { const d = Div.solve(a, b, 'decimal'); if (Math.abs(d.quotient * b - a) > 1e-9) throw new Error('dec ' + a + '/' + b); }
    catch (e) { if (!/terminate/.test(e.message)) throw e; }
  }
});
t('repeating decimals refused', () => assert.throws(() => Div.solve(10, 3, 'decimal'), /terminate/));
t('exact refuses inexact', () => assert.throws(() => Div.solve(29, 8, 'exact')));
t('inexact fact refused', () => assert.throws(() => Facts.solveFact('/', 29, 8)));

console.log(`engines: ${n} tests passed`);
