// Learning homepage: optional "Welcome back" summary.
// Reads each game's saved progress from this browser (same origin) — read-only,
// nothing is sent anywhere. Fails silently if storage is unavailable or data is malformed.
(function () {
  'use strict';
  var plural = function (n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); };
  var read = function (key) {
    try { return JSON.parse(window.localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  };
  var link = function (href, label, cls) {
    var a = document.createElement('a');
    a.href = href;
    a.className = 'btn ' + cls;
    a.textContent = label;
    return a;
  };
  var summaries = [];
  var buttons = [];

  // ── Arithmetic Gang (Andy, Susy, Mandy, Danny) ──
  var GANG = [
    { key: 'arith-addition:progress:v1', who: 'Andy', path: '/addition/', levels: 6 },
    { key: 'subtraction-susy:progress:v1', who: 'Susy', path: '/subtraction/', levels: 14 },
    { key: 'arith-multiplication:progress:v1', who: 'Mandy', path: '/multiplication/', levels: 7 },
    { key: 'arith-division:progress:v1', who: 'Danny', path: '/division/', levels: 10 }
  ];
  var gangParts = [], lastPlayed = null;
  GANG.forEach(function (g) {
    var d = read(g.key);
    if (!d || typeof d !== 'object' || !d.levels || typeof d.levels !== 'object') return;
    var solved = 0, mastered = 0;
    Object.keys(d.levels).forEach(function (id) {
      var l = d.levels[id];
      if (!l || typeof l !== 'object') return;
      if (typeof l.correct === 'number' && l.correct > 0) solved += l.correct;
      if (l.mastered === true) mastered += 1;
    });
    var diag = d.extra && d.extra.diagnostic;
    if (!solved && !mastered && !diag) return;
    gangParts.push(g.who + ' ' + Math.min(mastered, g.levels) + '/' + g.levels + ' levels');
    if (!lastPlayed || solved > lastPlayed.solved) lastPlayed = { g: g, solved: solved, mastered: mastered };
  });
  if (gangParts.length) {
    summaries.push('With the Arithmetic Gang you’ve mastered: ' + gangParts.join(', ') + '.');
    buttons.push(link(lastPlayed.g.path, 'Carry on with ' + lastPlayed.g.who, 'btn-primary'));
    buttons.push(link('/maths/', 'The Arithmetic Gang', 'btn-secondary'));
    var note = document.getElementById('gang-progress-note');
    if (note) { note.textContent = '✓ ' + gangParts.join(' · '); note.hidden = false; }
  }

  // ── Basic Geometry ──
  var geo = read('basic-geometry:history:v1');
  if (geo && typeof geo === 'object' && geo.stats && typeof geo.stats === 'object') {
    var answered = 0, toReview = 0;
    Object.keys(geo.stats).forEach(function (id) {
      var s = geo.stats[id];
      if (!s || typeof s !== 'object') return;
      if (typeof s.timesTested === 'number' && s.timesTested > 0) answered += s.timesTested;
      if (typeof s.incorrectAttempts === 'number' && s.incorrectAttempts > 0) toReview += 1;
    });
    if (answered > 0 || toReview > 0) {
      summaries.push('In Basic Geometry you’ve answered ' + plural(answered, 'question') +
        (toReview ? ', and ' + plural(toReview, 'formula') + ' could use another look.' : ' with no mistakes so far.'));
      if (toReview) buttons.push(link('/basic-geometry/play?mode=mistakes', 'Practise my mistakes', 'btn-primary'));
      buttons.push(link('/basic-geometry/progress', 'Geometry progress', 'btn-secondary'));
      var geoNote = document.getElementById('geo-progress');
      if (geoNote) {
        geoNote.textContent = '✓ You’ve played this game in this browser — ' + plural(answered, 'question') + ' answered.';
        geoNote.hidden = false;
      }
    }
  }

  if (!summaries.length) return;
  var section = document.getElementById('continue');
  var text = document.getElementById('continue-text');
  var actions = document.getElementById('continue-actions');
  if (!section || !text || !actions) return;
  var seenPrimary = false;
  buttons.forEach(function (b) {
    if (b.classList.contains('btn-primary')) {
      if (seenPrimary) { b.classList.remove('btn-primary'); b.classList.add('btn-secondary'); }
      seenPrimary = true;
    }
    actions.appendChild(b);
  });
  text.textContent = summaries.join(' ') + ' Progress is saved in this browser only.';
  section.hidden = false;
})();
