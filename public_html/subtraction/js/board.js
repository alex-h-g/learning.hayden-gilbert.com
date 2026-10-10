/* Susy the Subtractor — renders the column-subtraction working (crossings-out, regrouped digits, answer row). */
(function () {
  'use strict';
  var E = window.SusyEngine;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function viewState(sol, applied) {
    var hist = sol.topDigits.map(function (d) { return [d]; });
    var ans = new Array(sol.n).fill(null);
    for (var i = 0; i < applied && i < sol.steps.length; i++) {
      var st = sol.steps[i];
      if (st.type === 'borrow') { hist[st.from].push(st.fromAfter); hist[st.to].push(st.toAfter); }
      if (st.type === 'subtract') ans[st.col] = st.value;
    }
    return { hist: hist, ans: ans };
  }
  window.SusyBoard = function (sol, o) {
    var n = sol.n, v = viewState(sol, o.done ? sol.steps.length : o.applied);
    var st = o.active, hi = {};
    if (st) {
      if (st.type === 'subtract') hi[st.col] = 'focus';
      if (st.type === 'needBorrow') { hi[st.col] = 'focus'; for (var z = st.col + 1; z <= st.lender; z++) hi[z] = 'lend'; }
      if (st.type === 'borrow') { hi[st.from] = 'focus'; hi[st.to] = 'lend'; }
    }
    var f = o.freshStep, fresh = !f ? [] : f.type === 'borrow' ? [f.from, f.to] : f.type === 'subtract' ? ['a' + f.col] : [];
    var abbr = ['U', 'T', 'H', 'Th'];
    var cols = []; for (var k = n - 1; k >= 0; k--) cols.push(k);
    function cell(k, inner, extra) { return '<div class="cell' + (hi[k] ? ' hi-' + hi[k] : '') + (extra ? ' ' + extra : '') + '" data-col="' + k + '">' + inner + '</div>'; }
    var borrowing = st && st.type === 'borrow';
    var rows = '<div class="op"></div>' + cols.map(function (k) { return cell(k, '<abbr title="' + E.PLACE[k] + '">' + abbr[k] + '</abbr>', 'place'); }).join('');
    rows += '<div class="op"></div>' + cols.map(function (k) {
      var h = v.hist[k], inner = '';
      for (var i = 1; i < h.length; i++) {
        var now = i === h.length - 1 && !(borrowing && st.from === k);
        inner += '<span class="w' + (now ? ' w-now' : ' w-old') + (now && fresh.indexOf(k) >= 0 ? ' pop' : '') + '">' + h[i] + '</span>';
      }
      if (borrowing && st.from === k) inner += '<span class="slot slot-sm active" aria-label="New ' + E.PLACE[k] + ' digit">' + esc(o.entry || '') + '</span>';
      return cell(k, inner, 'working');
    }).join('');
    rows += '<div class="op"></div>' + cols.map(function (k) { return cell(k, '<span class="digit' + (v.hist[k].length > 1 ? ' struck' : '') + '">' + sol.topDigits[k] + '</span>', 'top'); }).join('');
    rows += '<div class="op">−</div>' + cols.map(function (k) { return cell(k, k < sol.bottomLen ? '<span class="digit">' + sol.bottomDigits[k] + '</span>' : '', 'bottom'); }).join('');
    rows += '<div class="rule" style="grid-column: 1 / span ' + (n + 1) + '"></div>';
    rows += '<div class="op"></div>' + cols.map(function (k) {
      var leadZero = k >= n - sol.leadingZeros && k > 0;
      if (v.ans[k] !== null) return cell(k, '<span class="slot filled' + (o.done && leadZero ? ' lead-zero' : '') + (fresh.indexOf('a' + k) >= 0 ? ' pop' : '') + '">' + v.ans[k] + '</span>', 'answer');
      var isActive = st && st.type === 'subtract' && st.col === k;
      return cell(k, '<span class="slot' + (isActive ? ' active' : '') + '"' + (isActive ? ' aria-label="Answer for the ' + E.PLACE[k] + ' column"' : '') + '>' + (isActive ? esc(o.entry || '') : '') + '</span>', 'answer');
    }).join('');
    return '<div class="board" role="group" aria-label="' + sol.top + ' minus ' + sol.bottom + '" style="--n:' + n + ';--fit:' + (n + 1) + '">' + rows + '</div>';
  };
})();
