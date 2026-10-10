/* Andy the Adder — column-addition engine (also used by Mandy to add partial products).
 * Pure logic. Column 0 = units. Supports two or more addends of different lengths.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AndyEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var PLACE = ['units', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions'];
  function digitsOf(n) { return String(n).split('').reverse().map(Number); }

  /** addends: array of non-negative integers. Returns the teaching script for column addition. */
  function solve(addends) {
    if (!Array.isArray(addends) || addends.length < 2) throw new Error('Need at least two numbers');
    addends.forEach(function (x) { if (!Number.isInteger(x) || x < 0) throw new Error('Non-negative integers only'); });
    var ds = addends.map(digitsOf);
    var n = Math.max.apply(null, ds.map(function (d) { return d.length; }));
    var steps = [], carries = [], carry = 0, answerCols = [], carryCols = [];
    for (var i = 0; i < n; i++) {
      var parts = ds.map(function (d) { return i < d.length ? d[i] : null; }).filter(function (x) { return x !== null; });
      var sum = parts.reduce(function (s, x) { return s + x; }, 0) + carry;
      var carryIn = carry;
      if (sum >= 10) steps.push({ type: 'colSum', kind: 'entry', guidedOnly: true, col: i, parts: parts, carryIn: carryIn, expected: String(sum), value: sum });
      carry = Math.floor(sum / 10);
      steps.push({ type: 'write', kind: 'entry', col: i, parts: parts, carryIn: carryIn, sum: sum, carryOut: carry, expected: String(sum % 10), value: sum % 10 });
      answerCols[i] = sum % 10;
      carries[i + 1] = carry;
      if (carry) carryCols.push(i);
    }
    var width = n;
    while (carry > 0) {
      steps.push({ type: 'carryDown', kind: 'entry', col: width, carryIn: carry, expected: String(carry % 10), value: carry % 10, sum: carry });
      answerCols[width] = carry % 10;
      carry = Math.floor(carry / 10);
      width++;
    }
    var answer = addends.reduce(function (s, x) { return s + x; }, 0);
    var check = answerCols.reduce(function (v, d, i) { return v + d * Math.pow(10, i); }, 0);
    if (check !== answer) throw new Error('Column answers disagree with the total — engine bug');
    return {
      format: 'column-add', addends: addends.slice(), digits: ds, n: n, width: width,
      answer: answer, answerText: String(answer), answerCols: answerCols, carries: carries,
      carryCols: carryCols, carryCount: carryCols.length, carryOut: width > n, steps: steps
    };
  }
  return { solve: solve, PLACE: PLACE, digitsOf: digitsOf };
});
