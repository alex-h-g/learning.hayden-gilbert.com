/* Mandy the Multiplier — plugs into the shared shell and adds the times-table check and times-table practice. */
(function () {
  'use strict';
  var C = window.MandyCurriculum, Facts = window.ArithFacts;
  var missed = [];

  function factKey(sol) { return Math.min(sol.a, sol.b) + 'x' + Math.max(sol.a, sol.b); }
  function stats(sh) { return sh.P.extra('facts', {}); }
  function onAnswer(sh) {
    return function (sol, ok) {
      var st = stats(sh), k = factKey(sol);
      var s = st[k] || (st[k] = { seen: 0, right: 0, lastWrong: false });
      s.seen++; if (ok) s.right++; s.lastWrong = !ok;
      sh.P.save();
    };
  }
  function tableScore(sh, n) {
    var st = stats(sh), seen = 0, right = 0;
    Object.keys(st).forEach(function (k) { var p = k.split('x').map(Number); if (p[0] === n || p[1] === n) { seen += st[k].seen; right += st[k].right; } });
    return seen ? { seen: seen, rate: right / seen } : null;
  }
  function mistakes(sh) {
    var st = stats(sh);
    return Object.keys(st).filter(function (k) { return st[k].lastWrong; }).map(function (k) { var p = k.split('x').map(Number); return Facts.solveFact('x', p[1], p[0]); });
  }

  function startDiagnostic(sh, knows) {
    sh.startDrill({
      title: 'Times-table check', chip: 'Quick check', items: C.diagnostic(), oneShot: true, noHints: true, back: 'hub',
      intro: { pose: 'encouraging', text: knows ? 'Brilliant! Let’s see how you get on. Just three quick questions!' : 'No problem, that’s what I’m here for! Let’s just see where you’re starting from. Three quick questions, no pressure.' },
      introButton: 'I’m ready!',
      onAnswer: onAnswer(sh),
      onEnd: function (sh2, results) {
        var right = results.filter(function (r) { return r.firstTry; }).length;
        sh2.P.data.extra.diagnostic = { right: right, total: results.length, at: Date.now() };
        sh2.P.save();
        var text = right === 3 ? 'Brilliant! You knew all three. Let’s see how you get on with multiplying bigger numbers.'
          : right === 0 ? 'That’s a great start! Times tables take practice, and we can practise them together. You can practise first, or jump straight into multiplying and practise along the way.'
          : 'You got ' + right + ' out of 3 right! Great start. Let’s practise a few times tables before we move on, or jump straight in if you like.';
        text += '\nThree questions can’t tell me everything, so the times-table practice is always here when you want it.';
        sh2.showInter({ pose: right === 3 ? 'cheering' : 'encouraging', text: text },
          right === 3 ? [['go-hub', 'Start multiplying!'], ['go-tables', 'Practise times tables']] : [['go-tables', 'Practise my times tables'], ['go-hub', 'Start multiplying']]);
      }
    });
  }
  function startTable(sh, items, title, isRetry) {
    sh.startDrill({
      title: title, chip: 'Times tables', items: items, back: 'tables',
      onAnswer: onAnswer(sh),
      onEnd: function (sh2, results) {
        var right = results.filter(function (r) { return r.firstTry; }).length;
        missed = results.filter(function (r) { return !r.firstTry; }).map(function (r) { return Facts.solveFact('x', r.sol.a, r.sol.b); });
        if (missed.length && !isRetry) {
          sh2.showInter({ pose: 'encouraging', text: 'You got ' + right + ' out of ' + results.length + ' first time! Let’s have another go at the ' + (missed.length === 1 ? 'one' : missed.length + ' ones') + ' that tripped you up.' },
            [['retry-missed', 'Try ' + (missed.length === 1 ? 'it' : 'them') + ' again'], ['go-tables', 'Back to times tables']]);
        } else {
          sh2.showInter({ pose: right === results.length ? 'cheering' : 'encouraging', text: (right === results.length ? 'Perfect! You got every one first time.' : 'Well done for sticking with it! You got ' + right + ' out of ' + results.length + ' first time.') + ' Practice makes these facts stick.' },
            [['go-tables', 'More times tables'], ['go-hub', 'Long multiplication']]);
        }
      }
    }, isRetry);
  }

  function tablesHTML(sh) {
    var diag = sh.P.data.extra.diagnostic;
    var chips = '';
    for (var n = 1; n <= 9; n++) {
      var sc = tableScore(sh, n);
      chips += '<button class="table-chip' + (sc && sc.rate >= 0.9 && sc.seen >= 5 ? ' strong' : '') + '" data-action="drill-table" data-n="' + n + '" aria-label="Practise the ' + n + ' times table' + (sc ? ', ' + Math.round(sc.rate * 100) + '% right so far' : '') + '">' + n + '×<small>' + (sc ? Math.round(sc.rate * 100) + '%' : 'new') + '</small></button>';
    }
    var mis = mistakes(sh);
    return '<div class="card tables-card"><h2>Times tables</h2>' +
      '<p class="muted small">' + (diag ? 'Quick check: ' + diag.right + ' out of ' + diag.total + '. ' : '') + 'Pick a table to practise, or mix them up. You can always come back here.</p>' +
      '<div class="table-chips">' + chips + '</div><div class="actions">' +
      '<button class="btn btn-accent" data-action="drill-mixed">Mixed tables</button>' +
      (mis.length ? '<button class="btn btn-secondary" data-action="drill-mistakes">Practise my mistakes (' + mis.length + ')</button>' : '') +
      '<button class="btn btn-secondary" data-action="diag-again">' + (diag ? 'Do the quick check again' : 'Take the quick check') + '</button></div></div>';
  }

  window.ArithShell.start({
    id: 'multiplication',
    title: 'Multiplication with Mandy',
    noun: 'multiplication',
    char: { key: 'mandy', name: 'Mandy', role: 'Multiplier' },
    storageKey: 'arith-multiplication:progress:v1',
    C: C, D: window.MandyDialogue, board: window.MandyBoard,
    afterWelcome: function (sh) { if (!sh.P.data.extra.diagnostic) { sh.go('mandy-intro'); return true; } return false; },
    screens: {
      'mandy-intro': function (sh) {
        return '<section class="screen welcome"><div class="welcome-card"><div class="welcome-art">' + sh.charImg('curious', 'char-xl') + '</div><div class="welcome-body">' +
          '<h1 class="logo">Mandy <span>the Multiplier</span></h1><div class="bubble bubble-left">' + sh.paras((sh.profile.name ? 'Hi ' + sh.profile.name + '! ' : 'Hi there! ') + 'Before we start multiplying bigger numbers, let’s see how well you know your times tables.\nDo you know your times tables?') + '</div>' +
          '<div class="actions"><button class="btn btn-accent btn-lg" data-action="diag-yes" data-autofocus>Yes, let’s go!</button><button class="btn btn-secondary btn-lg" data-action="diag-no">Not yet. I need some practice.</button></div>' +
          '</div></div></section>';
      },
      tables: function (sh) {
        return '<section class="screen tables-page"><div class="crumb"><button class="btn btn-ghost" data-action="hub">← All levels</button></div>' +
          '<h1>Times tables with Mandy</h1><div class="tutor-card plain">' + sh.charImg('encouraging', 'char-md') + '<div class="bubble bubble-left">' + sh.paras('Times tables make long multiplication much easier. Which one shall we practise? I’ll give you ten questions, and we’ll try any tricky ones again at the end.') + '</div></div>' +
          tablesHTML(sh) + '</section>';
      }
    },
    hubExtras: function (sh) { return tablesHTML(sh); },
    progressExtras: function (sh) {
      var rows = '';
      for (var n = 1; n <= 9; n++) { var sc = tableScore(sh, n); rows += '<li class="badge-item"><span class="badge-medal" aria-hidden="true">' + n + '×</span><span>' + n + ' times table<br><span class="muted small">' + (sc ? Math.round(sc.rate * 100) + '% right (' + sc.seen + ' tries)' : 'not practised yet') + '</span></span></li>'; }
      return '<h2>Times tables</h2><ul class="badges">' + rows + '</ul>';
    },
    onAction: function (a, el, sh) {
      if (a === 'diag-yes' || a === 'diag-no') { startDiagnostic(sh, a === 'diag-yes'); return true; }
      if (a === 'diag-again') { startDiagnostic(sh, true); return true; }
      if (a === 'go-tables') { sh.go('tables'); return true; }
      if (a === 'go-hub') { sh.go('hub'); return true; }
      if (a === 'drill-table') { var n = Number(el.getAttribute('data-n')); startTable(sh, C.tableSet(n, 10), 'The ' + n + ' times table'); return true; }
      if (a === 'drill-mixed') { startTable(sh, C.mixedSet(10), 'Mixed times tables'); return true; }
      if (a === 'drill-mistakes') { startTable(sh, mistakes(sh), 'My tricky facts'); return true; }
      if (a === 'retry-missed') { startTable(sh, missed, 'Tricky ones again', true); return true; }
      return false;
    }
  });
})();
