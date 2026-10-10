/* Susy the Subtractor — arithmetic & regrouping engine.
 * Pure logic, no DOM. Works in the browser (window.SusyEngine) and Node (require).
 * Column index 0 = units, 1 = tens, 2 = hundreds, 3 = thousands.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SusyEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PLACE = ['units', 'tens', 'hundreds', 'thousands', 'ten-thousands'];
  var ONE_OF = ['one', 'ten', 'hundred', 'thousand', 'ten-thousand'];
  var MANY_OF = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands'];

  function digitsOf(n) {
    return String(n).split('').reverse().map(Number);
  }

  function valueOf(cols) {
    var v = 0;
    for (var i = 0; i < cols.length; i++) v += cols[i] * Math.pow(10, i);
    return v;
  }

  /**
   * Solve top − bottom with the traditional column method.
   * Returns the full teaching script: every borrow and every column subtraction,
   * in the order a learner performs them, with the expected entry for each step.
   */
  function solve(top, bottom) {
    if (!Number.isInteger(top) || !Number.isInteger(bottom) || top < 0 || bottom < 0) {
      throw new Error('Operands must be non-negative integers');
    }
    if (bottom > top) throw new Error('Negative results are not supported');

    var t = digitsOf(top);
    var bottomLen = String(bottom).length;
    var b = digitsOf(bottom);
    var n = t.length;
    while (b.length < n) b.push(0);

    var work = t.slice();
    var history = t.map(function (d) { return [d]; });
    var steps = [];
    var borrowCols = [];
    var maxZeroChain = 0;
    var answerCols = new Array(n);

    for (var i = 0; i < n; i++) {
      if (work[i] < b[i]) {
        var j = i + 1;
        while (j < n && work[j] === 0) j++;
        if (j >= n) throw new Error('Nothing to borrow from (should be impossible)');
        maxZeroChain = Math.max(maxZeroChain, j - i - 1);
        borrowCols.push(i);
        steps.push({ type: 'needBorrow', kind: 'choice', guidedOnly: true, col: i, top: work[i], bottom: b[i], lender: j, zerosCrossed: j - i - 1,
          choices: [{ label: 'Yes, let\u2019s borrow!', correct: true }, { label: 'I\u2019m not sure', correct: false }] });
        for (var k = j; k > i; k--) {
          var fromBefore = work[k];
          work[k] -= 1;
          history[k].push(work[k]);
          var toBefore = work[k - 1];
          work[k - 1] += 10;
          history[k - 1].push(work[k - 1]);
          steps.push({
            type: 'borrow', kind: 'entry', from: k, to: k - 1, forCol: i, lender: j,
            fromBefore: fromBefore, fromAfter: work[k],
            toBefore: toBefore, toAfter: work[k - 1],
            expected: String(work[k]),
            first: k === j, last: k === i + 1
          });
          if (valueOf(work) !== top) throw new Error('Regrouping changed the value — engine bug');
        }
      }
      var d = work[i] - b[i];
      answerCols[i] = d;
      steps.push({ type: 'subtract', kind: 'entry', col: i, top: work[i], bottom: b[i], expected: String(d), value: d, hasBottom: i < bottomLen, originalTop: t[i] });
    }

    var answer = top - bottom;
    if (valueOf(answerCols) !== answer) throw new Error('Column answers disagree with the result — engine bug');

    // Leading zeros in the written answer (e.g. 58 − 49 → "09").
    var leadingZeros = 0;
    for (var z = n - 1; z > 0 && answerCols[z] === 0; z--) leadingZeros++;

    return {
      format: 'column', answerText: String(answer),
      top: top, bottom: bottom, answer: answer, n: n,
      topDigits: t, bottomDigits: b, bottomLen: bottomLen,
      steps: steps, finalWorking: work.slice(), history: history,
      answerCols: answerCols, leadingZeros: leadingZeros,
      borrowCols: borrowCols, borrowCount: borrowCols.length, maxZeroChain: maxZeroChain,
      needsBorrow: borrowCols.length > 0
    };
  }

  /** The classic mistake: in each column, take the smaller digit from the larger. */
  function smallerFromLarger(top, bottom) {
    var t = digitsOf(top), b = digitsOf(bottom), out = 0;
    for (var i = 0; i < t.length; i++) out += Math.abs(t[i] - (b[i] || 0)) * Math.pow(10, i);
    return out;
  }

  return {
    solve: solve,
    digitsOf: digitsOf,
    smallerFromLarger: smallerFromLarger,
    PLACE: PLACE, ONE_OF: ONE_OF, MANY_OF: MANY_OF
  };
});
