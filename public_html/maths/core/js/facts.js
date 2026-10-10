/* Arithmetic Gang — number facts (3 + 4, 6 × 7, 12 ÷ 3): engine, board and dialogue.
 * Used by Andy's level 1, Mandy's times tables and Danny's first two levels.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ArithFacts = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var SYM = { '+': '+', 'x': '×', '/': '÷' };

  function solveFact(op, a, b) {
    var ans;
    if (op === '+') ans = a + b;
    else if (op === 'x') ans = a * b;
    else if (op === '/') { if (b === 0 || a % b !== 0) throw new Error('Inexact division fact'); ans = a / b; }
    else throw new Error('Unknown op');
    return {
      format: 'fact', op: op, a: a, b: b, answer: ans, answerText: String(ans), key: a + op + b,
      steps: [{ kind: 'entry', type: 'fact', expected: String(ans) }]
    };
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function dots(n, cls) { var s = ''; for (var i = 0; i < n; i++) s += '<span class="dot ' + (cls || '') + '"></span>'; return s; }

  function visual(sol) {
    if (sol.op === '+' && sol.answer <= 20) {
      return '<div class="fact-visual" aria-hidden="true"><span class="dot-group">' + dots(sol.a, 'd1') + '</span><span class="vis-op">+</span><span class="dot-group">' + dots(sol.b, 'd2') + '</span></div>';
    }
    if (sol.op === '/' && sol.a <= 40) {
      var rows = '';
      for (var r = 0; r < sol.answer; r++) rows += '<span class="dot-row">' + dots(sol.b, r % 2 ? 'd2' : 'd1') + '</span>';
      return '<div class="fact-visual groups" aria-hidden="true">' + rows + '</div><p class="vis-cap">' + sol.a + ' dots in groups of ' + sol.b + '. How many groups?</p>';
    }
    if (sol.op === 'x' && sol.a <= 6 && sol.b <= 6) {
      var arr = '';
      for (var k = 0; k < sol.b; k++) arr += '<span class="dot-row">' + dots(sol.a, k % 2 ? 'd2' : 'd1') + '</span>';
      return '<div class="fact-visual groups" aria-hidden="true">' + arr + '</div><p class="vis-cap">' + sol.b + ' rows of ' + sol.a + '</p>';
    }
    return '';
  }

  function board(sol, view) {
    var done = view.done || view.applied >= 1;
    var slot = done ? '<span class="slot wide filled' + (view.freshStep ? ' pop' : '') + '">' + sol.answer + '</span>'
      : '<span class="slot wide active" aria-label="Answer">' + esc(view.entry || '') + '</span>';
    return '<div class="board fact-board" role="group" aria-label="' + sol.a + ' ' + words(sol.op) + ' ' + sol.b + '">' +
      '<div class="fact-line"><span class="fact-q">' + sol.a + ' ' + SYM[sol.op] + ' ' + sol.b + ' =</span>' + slot + '</div>' +
      (view.visual ? visual(sol) : '') + '</div>';
  }
  function words(op) { return op === '+' ? 'plus' : op === 'x' ? 'times' : 'divided by'; }

  function skip(n, times) { var o = []; for (var i = 1; i <= times; i++) o.push(n * i); return o.join(', '); }

  var D = {
    prompt: function (sol, guided) {
      var q = sol.a + ' ' + SYM[sol.op] + ' ' + sol.b;
      if (!guided) return 'What is ' + q + '?';
      if (sol.op === '+') return 'What is ' + q + '? Start at ' + Math.max(sol.a, sol.b) + ' and count on ' + Math.min(sol.a, sol.b) + '.';
      if (sol.op === 'x') return 'What is ' + q + '? That means ' + sol.b + ' lots of ' + sol.a + '.';
      return 'What is ' + q + '? How many groups of ' + sol.b + ' fit into ' + sol.a + '?';
    },
    hint: function (sol, lvl) {
      if (sol.op === '+') {
        var big = Math.max(sol.a, sol.b), small = Math.min(sol.a, sol.b);
        if (lvl === 1) return 'Start at ' + big + ' and count on ' + small + ' more.';
        var seq = []; for (var i = 1; i <= small; i++) seq.push(big + i);
        return 'Count on from ' + big + ': ' + seq.join(', ') + '. Where did you land?';
      }
      if (sol.op === 'x') {
        if (lvl === 1) return sol.a + ' × ' + sol.b + ' is ' + sol.b + ' lots of ' + sol.a + '. Try counting in ' + sol.a + 's.';
        return 'Count in ' + sol.a + 's, ' + sol.b + ' times: ' + skip(sol.a, sol.b - 1) + ', …';
      }
      if (lvl === 1) return 'Think of the times table: ' + sol.b + ' × what = ' + sol.a + '?';
      return 'Count in ' + sol.b + 's until you reach ' + sol.a + ': ' + skip(sol.b, Math.max(1, sol.answer - 1)) + ', … How many did you count?';
    },
    wrong: function (sol, entry) {
      var e = Number(entry);
      if (Math.abs(e - sol.answer) === 1) return 'So close! You’re just one out.';
      if (sol.op === 'x' && e === sol.a + sol.b) return 'That’s ' + sol.a + ' plus ' + sol.b + '. Times means ' + sol.b + ' groups of ' + sol.a + '.';
      if (sol.op === 'x' && (e === sol.a * (sol.b - 1) || e === sol.a * (sol.b + 1))) return 'Nearly! You’re one group of ' + sol.a + ' out.';
      if (sol.op === '/' && e * sol.b !== sol.a) return 'Let’s check: ' + sol.b + ' × ' + e + ' = ' + (sol.b * e) + ', not ' + sol.a + '.';
      return 'Not quite. You typed ' + entry + '.';
    },
    reveal: function (sol) { return sol.a + ' ' + SYM[sol.op] + ' ' + sol.b + ' = ' + sol.answer + '.'; },
    finish: function (sol) {
      var t = sol.a + ' ' + SYM[sol.op] + ' ' + sol.b + ' = ' + sol.answer + '.';
      if (sol.op === '/') t += ' That’s because ' + sol.b + ' × ' + sol.answer + ' = ' + sol.a + '.';
      return t;
    }
  };

  return { solveFact: solveFact, board: board, D: D, SYM: SYM };
});
