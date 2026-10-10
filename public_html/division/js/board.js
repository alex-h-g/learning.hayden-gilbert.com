/* Danny the Divisor — long-division board (bracket layout).
 * Quotient digits sit above the dividend digit they belong to; products and remainders stack underneath.
 */
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function digitsRight(value, endP) { var s = String(value), out = {}; for (var i = 0; i < s.length; i++) out[endP - s.length + 1 + i] = s.charAt(i); return out; }

  window.DannyBoard = function (sol, o) {
    var applied = o.done ? sol.steps.length : o.applied, st = o.active, f = o.freshStep;
    var intLen = sol.intLen, dp = sol.dp, ncols = intLen + (dp ? 1 + dp : 0);
    function col(p) { return 2 + (p < intLen ? p : p + 1); }
    var pointCol = 2 + intLen, rcol = 2 + ncols;
    var qd = {}, rows = [], pointShown = false, zeros = 0, remShown = null;
    for (var i = 0; i < applied; i++) {
      var s = sol.steps[i];
      if (s.type === 'qdigit') qd[s.p] = s.value;
      else if (s.type === 'product') { var start = s.p - String(s.cur).length + 1; rows.push({ kind: 'prod', cells: digitsRight(s.value, s.p), rule: [start, s.p], minus: s.p - String(s.value).length }); }
      else if (s.type === 'subtract') rows.push({ kind: 'rem', cells: digitsRight(s.value, s.p) });
      else if (s.type === 'bringDown') { if (rows.length) rows[rows.length - 1].cells[s.p] = String(s.digit); rows.length && (rows[rows.length - 1].brought = s.p); }
      else if (s.type === 'decimalPoint') { pointShown = true; zeros++; if (rows.length) { rows[rows.length - 1].cells[s.p] = '0'; rows[rows.length - 1].brought = s.p; } }
      else if (s.type === 'remainder') remShown = s.value;
    }
    var items = [];
    function put(r, c, html, cls, span) { items.push('<div class="dv ' + (cls || '') + '" style="grid-area:' + r + ' / ' + c + ' / span 1 / span ' + (span || 1) + '">' + html + '</div>'); }
    // header tag for which kind of answer
    var tag = sol.mode === 'remainder' ? 'Answer with a remainder' : sol.mode === 'decimal' ? 'Answer as a decimal' : 'Divides exactly';
    // quotient row (row 2; row 1 is the tag)
    for (var p = 0; p < sol.totalLen; p++) {
      if (dp && pointShown && p === intLen) put(2, pointCol, '<span class="pt">.</span>', 'q');
      var shownP = p < intLen || p - intLen < zeros;
      var act = st && st.type === 'qdigit' && st.p === p;
      if (act) put(2, col(p), '<span class="slot active" aria-label="Answer digit">' + esc(o.entry || '') + '</span>', 'q');
      else if (qd[p] !== undefined && shownP) put(2, col(p), '<span class="qd' + (f && f.type === 'qdigit' && f.p === p ? ' pop' : '') + '">' + qd[p] + '</span>', 'q');
    }
    if (st && st.type === 'remainder') put(2, rcol, 'r <span class="slot slot-sm active" aria-label="Remainder">' + esc(o.entry || '') + '</span>', 'rem-tag');
    else if (remShown !== null) put(2, rcol, 'r ' + remShown, 'rem-tag');
    // divisor and dividend (row 3)
    put(3, 1, '<span class="divisor">' + sol.divisor + '</span>', 'divcell');
    items.push('<div class="bracket" style="grid-area: 3 / 2 / span 1 / span ' + ncols + '"></div>');
    var curRowIdx = -1, curStart = -1, curEnd = -1, nextP = -1;
    if (st && (st.type === 'qdigit' || st.type === 'tooSmall')) { curEnd = st.p; curStart = st.p - String(st.cur).length + 1; curRowIdx = rows.length ? rows.length - 1 : -1; if (st.type === 'tooSmall') { curStart = st.p; } }
    if (st && (st.type === 'product' || st.type === 'subtract')) { curEnd = st.p; curStart = st.p - String(st.cur).length + 1; curRowIdx = st.type === 'product' ? (rows.length ? rows.length - 1 : -1) : rows.length - 1; }
    if (st && (st.type === 'bringDown' || st.type === 'decimalPoint')) nextP = st.p;
    for (var k = 0; k < sol.totalLen; k++) {
      var isZero = k >= intLen, visible = !isZero || k - intLen < zeros;
      var hi = curRowIdx === -1 && k >= curStart && k <= curEnd ? ' hi' : '';
      if (k === nextP) hi += ' bring';
      if (visible) put(3, col(k), '<span class="digit">' + (isZero ? 0 : sol.digits[k]) + '</span>', 'dd' + hi + (isZero ? ' added' : ''));
      else if (k === nextP) put(3, col(k), '<span class="digit ghost">0</span>', 'dd bring');
    }
    if (dp && pointShown) put(3, pointCol, '<span class="pt">.</span>', 'dd');
    else if (dp && st && st.type === 'decimalPoint' && st.first) put(3, pointCol, '<span class="pt ghost">.</span>', 'dd bring');
    // working rows
    var r = 4;
    rows.forEach(function (row, idx) {
      Object.keys(row.cells).forEach(function (pp) {
        pp = Number(pp);
        var hi = idx === curRowIdx && pp >= curStart && pp <= curEnd ? ' hi' : '';
        put(r, col(pp), '<span class="digit' + (row.brought === pp ? ' brought' : '') + '">' + row.cells[pp] + '</span>', 'wk' + hi);
      });
      if (row.kind === 'prod') {
        put(r, Math.max(1, col(row.minus) || 1), '<span class="minus">−</span>', 'wk');
        items.push('<div class="drule" style="grid-area:' + r + ' / ' + col(row.rule[0]) + ' / span 1 / span ' + (col(row.rule[1]) - col(row.rule[0]) + 1) + '"></div>');
      }
      r++;
    });
    if (st && (st.type === 'product' || st.type === 'subtract')) {
      var len = Math.max(st.expected.length, 1), startC = col(st.p - len + 1);
      if (st.type === 'product') put(r, Math.max(1, startC - 1), '<span class="minus">−</span>', 'wk');
      put(r, startC, '<span class="slot active wide-entry" aria-label="' + (st.type === 'product' ? 'Product' : 'What is left') + '">' + esc(o.entry || '') + '</span>', 'wk', col(st.p) - startC + 1);
      r++;
    }
    var tmpl = 'auto';
    for (var c = 0; c < sol.totalLen; c++) { if (dp && c === intLen) tmpl += ' calc(var(--cw) * .38)'; tmpl += ' var(--cw)'; }
    tmpl += ' minmax(calc(var(--cw) * 1.2), auto)';
    return '<div class="board div-board" role="group" aria-label="' + sol.dividend + ' divided by ' + sol.divisor + '" style="--fit:' + (ncols + 2.6) + ';grid-template-columns:' + tmpl + '">' +
      '<div class="div-tag" style="grid-area: 1 / 1 / span 1 / span ' + (ncols + 2) + '">' + tag + '</div>' + items.join('') + '</div>';
  };
})();
