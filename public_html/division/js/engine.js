/* Danny the Divisor — long-division engine (one-digit divisors).
 * Produces every quotient digit, product, subtraction and bring-down in order, plus the layout the board needs.
 * mode: 'exact' (no remainder allowed), 'remainder' (answer "q r r"), 'decimal' (continue past the point, terminating only).
 * Pure logic. Positions p index the dividend digits left→right; decimal zeros are appended after the point.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DannyEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var MAX_DP = 3;

  function solve(dividend, divisor, mode) {
    if (!Number.isInteger(dividend) || !Number.isInteger(divisor) || dividend < 1 || divisor < 2 || divisor > 9) throw new Error('Whole dividend, divisor 2–9');
    mode = mode || 'remainder';
    var digits = String(dividend).split('').map(Number), intLen = digits.length;
    if (mode === 'exact' && dividend % divisor !== 0) throw new Error('Not exact');
    if (mode === 'decimal') {
      var r0 = dividend % divisor, dp = 0;
      while (r0 && dp <= MAX_DP) { r0 = (r0 * 10) % divisor; dp++; }
      if (r0) throw new Error('Does not terminate within ' + MAX_DP + ' places');
    }
    var steps = [], stages = [], q = [], cur = 0, started = false, p = 0, curStart = 0, rem = 0, extraZeros = 0, zeroQ = false, innerRem = false;
    var total = intLen; // grows when decimal zeros are added
    while (p < total) {
      var dig = p < intLen ? digits[p] : 0;
      cur = cur * 10 + dig;
      if (!started && cur < divisor && p < total - 1) {
        steps.push({ type: 'tooSmall', kind: 'choice', guidedOnly: true, p: p, cur: cur, d: divisor, next: digits[p + 1],
          choices: [{ label: 'No, we use the next digit too', correct: true }, { label: 'Yes, it fits', correct: false }] });
        q[p] = null;
        p++; continue;
      }
      var qd = Math.floor(cur / divisor), prod = qd * divisor, r = cur - prod;
      var stage = { p: p, cur: cur, start: curStart, q: qd, prod: prod, rem: r, decimal: p >= intLen, skip: started && qd === 0 };
      started = true;
      steps.push({ type: 'qdigit', kind: 'entry', p: p, cur: cur, d: divisor, expected: String(qd), value: qd, decimal: p >= intLen, stage: stages.length });
      q[p] = qd;
      if (qd === 0 && p > 0 && q.slice(0, p).some(function (x) { return x !== null && x !== undefined; })) zeroQ = true;
      if (!stage.skip) {
        steps.push({ type: 'product', kind: 'entry', p: p, cur: cur, d: divisor, q: qd, expected: String(prod), value: prod, stage: stages.length });
        steps.push({ type: 'subtract', kind: 'entry', p: p, cur: cur, prod: prod, expected: String(r), value: r, stage: stages.length });
      }
      stages.push(stage);
      rem = r; cur = r;
      var hasNext = p + 1 < total;
      if (hasNext) {
        if (r && p + 1 < intLen) innerRem = true;
        var nd = p + 1 < intLen ? digits[p + 1] : 0;
        steps.push({ type: 'bringDown', kind: 'choice', p: p + 1, digit: nd, rem: r, decimal: p + 1 >= intLen,
          choices: [{ label: 'Bring down the ' + nd, correct: true }] });
        curStart = p + 1 - (r ? String(r).length : 1) + 1; // where the current number now starts
      } else if (r && mode === 'decimal') {
        var first = extraZeros === 0;
        steps.push({ type: 'decimalPoint', kind: 'choice', p: p + 1, rem: r, first: first,
          choices: first ? [{ label: 'Add a decimal point and a 0', correct: true }, { label: 'Stop here with a remainder', correct: false }]
                         : [{ label: 'Add another 0 and keep going', correct: true }] });
        extraZeros++; total++;
        curStart = p + 1 - String(r).length + 1;
      }
      p++;
    }
    if (mode === 'exact' && rem !== 0) throw new Error('Not exact');
    if (mode === 'remainder' && rem !== 0) steps.push({ type: 'remainder', kind: 'entry', expected: String(rem), value: rem, d: divisor });
    if (mode === 'decimal' && rem !== 0) throw new Error('Decimal did not terminate');

    // Quotient as text
    var intPart = '', decPart = '';
    for (var k = 0; k < total; k++) {
      if (k < intLen) { if (q[k] !== null && q[k] !== undefined) intPart += q[k]; }
      else decPart += q[k];
    }
    intPart = intPart.replace(/^0+(?=\d)/, '') || '0';
    var quotient = Number(intPart + (decPart ? '.' + decPart : ''));
    var exactCheck = Math.abs(quotient * divisor + (mode === 'remainder' ? rem : 0) - dividend) < 1e-9;
    if (!exactCheck) throw new Error('Quotient check failed — engine bug');
    if (mode === 'remainder' && rem >= divisor) throw new Error('Invalid remainder — engine bug');
    var answerText = mode === 'remainder' && rem ? intPart + ' r ' + rem : intPart + (decPart ? '.' + decPart : '');
    return {
      format: 'long-div', dividend: dividend, divisor: divisor, mode: mode, digits: digits, intLen: intLen, totalLen: total, dp: extraZeros,
      quotientDigits: q, quotient: quotient, quotientText: intPart + (decPart ? '.' + decPart : ''), remainder: mode === 'remainder' ? rem : 0,
      answer: quotient, answerText: answerText, stages: stages, steps: steps,
      zeroInQuotient: zeroQ, innerRemainder: innerRem, quotientLen: intPart.length, key: dividend + '/' + divisor
    };
  }
  return { solve: solve, MAX_DP: MAX_DP };
});
