/* Andy the Adder — column-addition board: carries above, addends, answer row, and a working line for column totals. */
(function () {
  'use strict';
  var E = window.AndyEngine;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ABBR = ['U', 'T', 'H', 'Th', 'TTh', 'HTh', 'M'];

  /** Shared by Mandy for the partial-product addition stage. opts: { applied, active, entry, done, freshStep, rowsLabel } */
  window.AndyBoard = function (sol, o) {
    var W = sol.width, applied = o.done ? sol.steps.length : o.applied;
    var ans = {}, carryShown = {};
    for (var i = 0; i < applied && i < sol.steps.length; i++) {
      var s = sol.steps[i];
      if (s.type === 'write' || s.type === 'carryDown') { ans[s.col] = s.value; if (s.carryOut) carryShown[s.col + 1] = s.carryOut; }
    }
    var st = o.active, focus = st ? st.col : -1, f = o.freshStep;
    var cols = []; for (var k = W - 1; k >= 0; k--) cols.push(k);
    function cell(k, inner, extra) { return '<div class="cell' + (k === focus ? ' hi-focus' : '') + (extra ? ' ' + extra : '') + '" data-col="' + k + '">' + inner + '</div>'; }
    var rows = '<div class="op"></div>' + cols.map(function (k) { return cell(k, '<abbr title="' + E.PLACE[k] + '">' + ABBR[k] + '</abbr>', 'place'); }).join('');
    rows += '<div class="op"></div>' + cols.map(function (k) {
      var c = carryShown[k];
      return cell(k, c ? '<span class="carry-mark' + (f && f.col === k - 1 ? ' pop' : '') + '" aria-label="carried ' + c + '">' + c + '</span>' : '', 'carry');
    }).join('');
    sol.digits.forEach(function (d, r) {
      rows += '<div class="op">' + (r === sol.digits.length - 1 ? '+' : '') + '</div>' + cols.map(function (k) { return cell(k, k < d.length ? '<span class="digit">' + d[k] + '</span>' : '', 'row'); }).join('');
    });
    rows += '<div class="rule" style="grid-column: 1 / span ' + (W + 1) + '"></div>';
    rows += '<div class="op"></div>' + cols.map(function (k) {
      if (ans[k] !== undefined) return cell(k, '<span class="slot filled' + (f && f.col === k && f.type !== 'colSum' ? ' pop' : '') + '">' + ans[k] + '</span>', 'answer');
      var act = st && st.col === k && st.type !== 'colSum';
      return cell(k, '<span class="slot' + (act ? ' active' : '') + '"' + (act ? ' aria-label="Answer for the ' + E.PLACE[k] + ' column"' : '') + '>' + (act ? esc(o.entry || '') : '') + '</span>', 'answer');
    }).join('');
    if (st && st.type === 'colSum') {
      rows += '<div class="side-note">' + E.PLACE[st.col].charAt(0).toUpperCase() + E.PLACE[st.col].slice(1) + ': ' + st.parts.concat(st.carryIn ? [st.carryIn] : []).join(' + ') +
        ' = <span class="slot slot-inline active" aria-label="Column total">' + esc(o.entry || '') + '</span></div>';
    }
    return '<div class="board add-board" role="group" aria-label="' + sol.addends.join(' plus ') + '" style="--n:' + W + ';--fit:' + (W + 1.2) + '">' + rows + '</div>';
  };
})();
