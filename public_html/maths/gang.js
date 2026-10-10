/* Arithmetic Gang launch page — shows each character's saved progress (read-only, this browser only). */
(function () {
  'use strict';
  var storage; try { storage = window.localStorage; } catch (e) { return; }
  var SUBJECTS = [
    { id: 'addition', key: 'arith-addition:progress:v1', name: 'Addition with Andy', levels: 6 },
    { id: 'subtraction', key: 'subtraction-susy:progress:v1', name: 'Subtraction with Susy', levels: 14 },
    { id: 'multiplication', key: 'arith-multiplication:progress:v1', name: 'Multiplication with Mandy', levels: 7 },
    { id: 'division', key: 'arith-division:progress:v1', name: 'Division with Danny', levels: 10 }
  ];
  var name = '';
  try { var prof = JSON.parse(storage.getItem('arithmetic:profile:v1') || 'null'); if (prof && typeof prof.name === 'string') name = prof.name; } catch (e) {}
  if (name) {
    var lead = document.getElementById('hero-lead');
    if (lead) lead.textContent = 'Welcome back, ' + name + '! Andy, Susy, Mandy and Danny are ready when you are. Pick up where you left off, or try someone new.';
  }
  var items = [];
  SUBJECTS.forEach(function (s) {
    var sum = window.ArithProgress && window.ArithProgress.summarize(storage, s.key);
    if (!sum) return;
    var diag = s.id === 'multiplication' && sum.extra && sum.extra.diagnostic;
    if (!sum.attempts && !diag) return; // never tried: don't show misleading progress
    var text;
    if (sum.mastered === s.levels) text = 'All ' + s.levels + ' levels mastered!';
    else if (sum.mastered) text = 'Level ' + sum.highest + ' completed (' + sum.mastered + ' of ' + s.levels + ' mastered)';
    else if (sum.attempts) text = 'Getting started on Level ' + Math.min(sum.current || 1, s.levels);
    else text = 'Getting started';
    if (diag) text += (sum.attempts ? '. ' : '. ') + 'Times-table check: ' + diag.right + '/' + diag.total;
    items.push('<li><a href="/' + s.id + '/"><strong>' + s.name + ':</strong> ' + text + '</a></li>');
    var p = document.querySelector('.gc-progress[data-subject="' + s.id + '"]');
    if (p) { p.textContent = '✓ ' + text; p.hidden = false; }
  });
  if (items.length) {
    document.getElementById('gp-list').innerHTML = items.join('');
    document.getElementById('gang-progress').hidden = false;
  }
})();
