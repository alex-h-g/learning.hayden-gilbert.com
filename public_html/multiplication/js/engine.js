/* Mandy the Multiplier — long-multiplication engine.
 * Builds each partial product digit by digit (with carries and place-value zeros), then adds the partial
 * products with Andy's column-addition engine. Pure logic; column 0 = units.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../addition/js/engine.js'));
  else root.MandyEngine = factory(root.AndyEngine);
})(typeof self !== 'undefined' ? self : this, function (Add) {
  'use strict';
  var PLACE = Add.PLACE;
  function digitsOf(n) { return String(n).split('').reverse().map(Number); }

  function solve(a, b) {
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1) throw new Error('Positive integers only');
    var ad = digitsOf(a), bd = digitsOf(b);
    if (bd.some(function (d) { return d === 0; })) throw new Error('Multiplier digits must be non-zero in this version');
    var steps = [], partials = [], rows = [], mulCarries = 0;
    bd.forEach(function (d, j) {
      var row = { j: j, d: d, digits: {}, value: a * d * Math.pow(10, j) };
      for (var z = 0; z < j; z++) {
        steps.push({ type: 'placeholder', kind: 'entry', stage: 'mul', row: j, col: z, d: d, expected: '0', value: 0, first: z === 0 });
        row.digits[z] = 0;
      }
      var carry = 0;
      ad.forEach(function (x, i) {
        var prod = x * d, p = prod + carry, col = i + j, carryIn = carry;
        var base = { stage: 'mul', row: j, col: col, i: i, x: x, d: d, prod: prod, carryIn: carryIn, p: p, firstInRow: i === 0 && j === 0 };
        if (carryIn > 0) {
          steps.push(Object.assign({ type: 'times', kind: 'entry', guidedOnly: true, expected: String(prod) }, base));
          steps.push(Object.assign({ type: 'addCarry', kind: 'entry', guidedOnly: true, expected: String(p) }, base));
        } else if (p >= 10) {
          steps.push(Object.assign({ type: 'times', kind: 'entry', guidedOnly: true, expected: String(prod) }, base));
        }
        carry = Math.floor(p / 10);
        if (carry) mulCarries++;
        steps.push(Object.assign({ type: 'write', kind: 'entry', expected: String(p % 10), value: p % 10, carryOut: carry, rowStart: i === 0 && j > 0 }, base));
        row.digits[col] = p % 10;
      });
      var c = carry, col2 = ad.length + j;
      while (c > 0) {
        steps.push({ type: 'writeCarry', kind: 'entry', stage: 'mul', row: j, col: col2, d: d, carryIn: c, expected: String(c % 10), value: c % 10 });
        row.digits[col2] = c % 10; c = Math.floor(c / 10); col2++;
      }
      var check = Object.keys(row.digits).reduce(function (v, k) { return v + row.digits[k] * Math.pow(10, Number(k)); }, 0);
      if (check !== row.value) throw new Error('Partial product disagrees — engine bug');
      rows.push(row); partials.push(row.value);
    });
    var addSol = null;
    if (partials.length > 1) {
      addSol = Add.solve(partials);
      addSol.steps.forEach(function (s, k) { steps.push(Object.assign({}, s, { stage: 'add', firstAdd: k === 0 })); });
    }
    var answer = a * b;
    if (addSol && addSol.answer !== answer) throw new Error('Sum of partial products is wrong — engine bug');
    var width = Math.max(String(answer).length, String(a).length, String(b).length + 0);
    return {
      format: 'long-mult', a: a, b: b, ad: ad, bd: bd, rows: rows, partials: partials, add: addSol,
      answer: answer, answerText: String(answer), width: width, steps: steps,
      mulCarries: mulCarries, addCarries: addSol ? addSol.carryCount : 0, key: a + 'x' + b
    };
  }
  return { solve: solve, PLACE: PLACE, digitsOf: digitsOf };
});
