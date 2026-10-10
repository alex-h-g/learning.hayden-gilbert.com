/* Mandy the Multiplier — long-multiplication board.
 * Rows: carries, multiplicand, × multiplier, partial products (with place-value zeros and a note of what each row means),
 * then the addition of the partial products. Every digit shown comes from the engine's validated steps.
 */
(function () {
  'use strict';
  var E = window.MandyEngine;
  var ABBR = ['U', 'T', 'H', 'Th', 'TTh', 'HTh', 'M'];
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  window.MandyBoard = function (sol, o) {
    var applied = o.done ? sol.steps.length : o.applied;
    var st = o.active, f = o.freshStep;
    var multi = sol.rows.length > 1;
    var W = sol.width, rowDigits = sol.rows.map(function () { return {}; }), ans = {}, addCarry = {}, mulCarry = {};
    var curRow = st && st.stage === 'mul' ? st.row : -1;
    for (var i = 0; i < applied; i++) {
      var s = sol.steps[i];
      if (s.stage === 'mul' && (s.type === 'write' || s.type === 'placeholder' || s.type === 'writeCarry')) rowDigits[s.row][s.col] = s.value;
      if (s.stage === 'mul' && s.type === 'write' && s.carryOut && s.row === curRow) mulCarry[s.i + 1] = s.carryOut;
      if (s.stage === 'add' && (s.type === 'write' || s.type === 'carryDown')) { ans[s.col] = s.value; if (s.carryOut) addCarry[s.col + 1] = s.carryOut; }
    }
    if (o.done || (st && st.stage === 'add')) mulCarry = {};
    var cols = []; for (var k = W - 1; k >= 0; k--) cols.push(k);
    function cell(k, inner, extra) { return '<div class="cell' + (extra ? ' ' + extra : '') + '" data-col="' + k + '">' + inner + '</div>'; }
    function note(t) { return '<div class="row-note">' + t + '</div>'; }
    var rows = '<div class="op"></div>' + cols.map(function (k) { return cell(k, '<abbr title="' + E.PLACE[k] + '">' + ABBR[k] + '</abbr>', 'place' + (st && st.col === k && st.type !== 'times' && st.type !== 'addCarry' && st.type !== 'colSum' ? ' hi-focus' : '')); }).join('') + note('');
    // carries for the current row (written above the multiplicand)
    rows += '<div class="op"></div>' + cols.map(function (k) {
      var c = mulCarry[k];
      return cell(k, c ? '<span class="carry-mark' + (f && f.type === 'write' && f.i + 1 === k ? ' pop' : '') + '">' + c + '</span>' : '', 'carry');
    }).join('') + note('');
    var focusA = st && st.stage === 'mul' && st.i !== undefined ? st.i : -1;
    rows += '<div class="op"></div>' + cols.map(function (k) { return cell(k, k < sol.ad.length ? '<span class="digit">' + sol.ad[k] + '</span>' : '', 'row' + (k === focusA ? ' hi-focus' : '')); }).join('') + note('');
    rows += '<div class="op">×</div>' + cols.map(function (k) { return cell(k, k < sol.bd.length ? '<span class="digit">' + sol.bd[k] + '</span>' : '', 'row' + (k === curRow ? ' hi-lend' : '')); }).join('') + note('');
    rows += '<div class="rule" style="grid-column: 1 / span ' + (W + 2) + '"></div>';
    sol.rows.forEach(function (r, j) {
      var started = Object.keys(rowDigits[j]).length > 0 || curRow === j;
      var complete = r && (o.done || (st && (st.stage === 'add' || st.row > j)));
      rows += '<div class="op">' + (multi && j === sol.rows.length - 1 ? '+' : '') + '</div>' + cols.map(function (k) {
        var v = rowDigits[j][k];
        if (v !== undefined) return cell(k, '<span class="slot filled' + (f && f.stage === 'mul' && f.row === j && f.col === k && f.type !== 'times' && f.type !== 'addCarry' ? ' pop' : '') + (j > 0 && k < j ? ' zero-ph' : '') + '">' + v + '</span>', 'answer');
        var act = st && st.stage === 'mul' && st.row === j && st.col === k && (st.type === 'write' || st.type === 'placeholder' || st.type === 'writeCarry');
        var expect = started && k < String(r.value).length;
        return cell(k, act ? '<span class="slot active" aria-label="' + E.PLACE[k] + ' digit of this row">' + esc(o.entry || '') + '</span>' : expect ? '<span class="slot"></span>' : '', 'answer');
      }).join('') + note(started ? '<span class="' + (complete ? 'done' : '') + '">' + sol.a + ' × ' + (r.d * Math.pow(10, j)) + (complete ? ' = ' + r.value : '') + '</span>' : '');
    });
    if (multi) {
      var addStage = (st && st.stage === 'add') || o.done;
      rows += '<div class="rule" style="grid-column: 1 / span ' + (W + 2) + '"></div>';
      rows += '<div class="op"></div>' + cols.map(function (k) {
        if (ans[k] !== undefined) return cell(k, '<span class="slot filled' + (f && f.stage === 'add' && f.col === k && f.type !== 'colSum' ? ' pop' : '') + '">' + ans[k] + '</span>', 'answer' + (st && st.stage === 'add' && st.col === k ? ' hi-focus' : ''));
        var act = st && st.stage === 'add' && st.col === k && st.type !== 'colSum';
        return cell(k, addStage ? '<span class="slot' + (act ? ' active' : '') + '">' + (act ? esc(o.entry || '') : '') + '</span>' : '', 'answer' + (st && st.stage === 'add' && st.col === k ? ' hi-focus' : ''));
      }).join('') + note(addStage ? 'total' : '');
      rows += '<div class="op"></div>' + cols.map(function (k) { return cell(k, addCarry[k] ? '<span class="carry-mark small">' + addCarry[k] + '</span>' : '', 'carry add-carry'); }).join('') + note('');
    }
    if (st && (st.type === 'times' || st.type === 'addCarry' || st.type === 'colSum')) {
      var ex = st.type === 'times' ? st.d + ' × ' + st.x : st.type === 'addCarry' ? st.prod + ' + ' + st.carryIn + ' carried' : st.parts.concat(st.carryIn ? [st.carryIn] : []).join(' + ');
      rows += '<div class="side-note">Working: ' + ex + ' = <span class="slot slot-inline active" aria-label="Working answer">' + esc(o.entry || '') + '</span></div>';
    }
    return '<div class="board mult-board" role="group" aria-label="' + sol.a + ' times ' + sol.b + '" style="--n:' + W + ';--fit:' + (W + 3.2) + '">' + rows + '</div>';
  };
})();
