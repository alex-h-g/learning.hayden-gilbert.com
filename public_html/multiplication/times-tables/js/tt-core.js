/* Mandy's Times Tables — pure logic (no DOM, no storage). UMD: works in the browser and with require().
 *
 * Questions, plausible wrong answers, game rounds, scoring and the revision rule all live here so they
 * can be unit-tested on their own (tests/times-tables.test.js).
 *
 * A "fact" is ordered: 7 × 6 and 6 × 7 are kept separately, because the Game's two limits are
 * independent (first number up to A, second number up to B).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MandyTT = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MIN = 1, MAX = 10;

  /* ───────── basics ───────── */
  function clampInt(x, lo, hi, dflt) {
    var n = Math.round(Number(x));
    if (!isFinite(n)) return dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function product(a, b) { return a * b; }
  function key(a, b) { return a + 'x' + b; }
  function parseKey(k) {
    var m = /^(\d{1,2})x(\d{1,2})$/.exec(String(k));
    if (!m) return null;
    var a = Number(m[1]), b = Number(m[2]);
    if (a < MIN || a > MAX || b < MIN || b > MAX) return null;
    return { a: a, b: b };
  }
  function fact(a, b) { return { a: a, b: b, key: key(a, b), answer: product(a, b) }; }

  function rngOrDefault(rng) { return typeof rng === 'function' ? rng : Math.random; }
  function shuffle(list, rng) {
    rng = rngOrDefault(rng);
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ───────── number words (for Mandy's chant) ───────── */
  var ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function words(n) {
    n = Math.round(n);
    if (n < 0 || n > 100) throw new Error('words() supports 0–100, got ' + n);
    if (n === 100) return 'one hundred';
    if (n < 20) return ONES[n];
    var t = Math.floor(n / 10), o = n % 10;
    return TENS[t] + (o ? '-' + ONES[o] : '');
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ───────── tables (Chant Along, Flashcards) ───────── */
  function table(n) {
    n = clampInt(n, MIN, MAX, 1);
    var out = [];
    for (var k = MIN; k <= MAX; k++) out.push(fact(n, k));
    return out;
  }
  function chantLines(n) {
    return table(n).map(function (f, i) {
      return {
        a: f.a, b: f.b, answer: f.answer, index: i,
        display: f.a + ' × ' + f.b + ' = ' + f.answer,
        spoken: cap(words(f.a)) + ' times ' + words(f.b) + ' equals ' + words(f.answer) + '.',
        longPause: (i + 1) % 5 === 0 // slightly longer breath after every fifth line
      };
    });
  }
  function flashcardDeck(n, order, rng) {
    var cards = table(n);
    return order === 'random' ? shuffle(cards, rng) : cards;
  }

  /* ───────── Game ranges ───────── */
  var DEFAULT_SETTINGS = { maxA: 5, maxB: 5, count: 10, order: 'random' };
  var COUNTS = [10, 20, 30];
  function sanitizeSettings(s) {
    s = s && typeof s === 'object' ? s : {};
    return {
      maxA: clampInt(s.maxA, MIN, MAX, DEFAULT_SETTINGS.maxA),
      maxB: clampInt(s.maxB, MIN, MAX, DEFAULT_SETTINGS.maxB),
      count: COUNTS.indexOf(Number(s.count)) >= 0 ? Number(s.count) : DEFAULT_SETTINGS.count,
      order: s.order === 'sequential' ? 'sequential' : 'random'
    };
  }
  function inRange(f, maxA, maxB) { return f.a >= MIN && f.a <= maxA && f.b >= MIN && f.b <= maxB; }
  function rangeFacts(maxA, maxB) {
    maxA = clampInt(maxA, MIN, MAX, 1); maxB = clampInt(maxB, MIN, MAX, 1);
    var out = [];
    for (var a = MIN; a <= maxA; a++) for (var b = MIN; b <= maxB; b++) out.push(fact(a, b));
    return out;
  }

  /* Fill `count` slots from `pool`. Sequential cycles in order; random reshuffles each pass and avoids
   * the same fact twice in a row across a pass boundary. */
  function fillFrom(pool, count, order, rng) {
    var out = [];
    if (!pool.length || count <= 0) return out;
    while (out.length < count) {
      var pass = order === 'sequential' ? pool.slice() : shuffle(pool, rng);
      if (order !== 'sequential' && out.length && pass.length > 1 && pass[0].key === out[out.length - 1].key) {
        pass.push(pass.shift());
      }
      for (var i = 0; i < pass.length && out.length < count; i++) out.push(pass[i]);
    }
    return out;
  }

  /* ───────── plausible wrong answers ─────────
   * Tier 1 — one number slips to its neighbour: (a±1)×b, a×(b±1). 7×6 → 36, 48, 35, 49.
   * Tier 2 — a two-step slip, (a±2)×b, a×(b±2), or another real times-table product close by (54 for 56).
   * Fallback — correct answer ± 1, 2, 3 … (positive, distinct). Only used when tiers 1–2 can't give two.
   * Factors may reach 11 so ×10 questions still get a "one lot too many" slip (10 × 7 → 11 × 7 = 77).
   */
  var TABLE_PRODUCTS = (function () { var s = {}; for (var a = 1; a <= 10; a++) for (var b = 1; b <= 10; b++) s[a * b] = true; return Object.keys(s).map(Number).sort(function (x, y) { return x - y; }); })();

  function candidatePool(a, b) {
    var p = a * b, t1 = [], t2 = [];
    function add(list, x, y) { if (x >= 1 && y >= 1 && x <= 11 && y <= 11) list.push(x * y); }
    add(t1, a - 1, b); add(t1, a + 1, b); add(t1, a, b - 1); add(t1, a, b + 1);
    add(t2, a - 2, b); add(t2, a + 2, b); add(t2, a, b - 2); add(t2, a, b + 2);
    var near = Math.max(4, Math.round(p * 0.2));
    TABLE_PRODUCTS.forEach(function (q) { if (q !== p && Math.abs(q - p) <= near) t2.push(q); });
    function clean(list) {
      var seen = {}, out = [];
      list.forEach(function (x) { if (x > 0 && x !== p && !seen[x]) { seen[x] = true; out.push(x); } });
      return out;
    }
    var c1 = clean(t1), c2 = clean(t2).filter(function (x) { return c1.indexOf(x) < 0; });
    return { tier1: c1, tier2: c2 };
  }

  function distractors(a, b, rng) {
    rng = rngOrDefault(rng);
    var p = a * b, pool = candidatePool(a, b), picked = [];
    shuffle(pool.tier1, rng).forEach(function (x) { if (picked.length < 2) picked.push(x); });
    if (picked.length < 2) {
      // closest tier-2 values first, so the extra option stays believable
      var t2 = shuffle(pool.tier2, rng).sort(function (x, y) { return Math.abs(x - p) - Math.abs(y - p); });
      t2.forEach(function (x) { if (picked.length < 2 && picked.indexOf(x) < 0) picked.push(x); });
    }
    for (var k = 1; picked.length < 2 && k < 50; k++) {
      [p + k, p - k].forEach(function (x) { if (picked.length < 2 && x > 0 && x !== p && picked.indexOf(x) < 0) picked.push(x); });
    }
    return picked;
  }

  function choicesFor(a, b, rng) {
    var p = a * b, ds = distractors(a, b, rng);
    var opts = shuffle([p].concat(ds), rng);
    if (opts.length !== 3 || opts.filter(function (x) { return x === p; }).length !== 1) throw new Error('bad choices for ' + a + '×' + b);
    return opts.map(function (v) { return { value: v, correct: v === p }; });
  }

  /* ───────── revision rule (simple and transparent) ─────────
   * Per fact we keep: seen, wrong (wrong taps), firstTry, triesTotal, lastTries, misses (times it needed
   * more than one try), streak (separate rounds in a row answered first time), lastSeen.
   *
   *  recurring      = missed at least twice AND first-try rate under 80%
   *  needsRevision  = the last attempt needed another try, OR (recurring AND streak < 3)
   *  priority       = 2 × misses + (2 if last attempt was a miss) + (5 if recurring) − streak   (min 1; 0 if not flagged)
   *  strong         = streak ≥ 3 (three separate rounds in a row, first time) and not flagged
   *
   * So one slip is "worth another look" until the next first-time success; a fact missed again and again
   * stays on the list until it is answered first time in three separate rounds.
   */
  var STRONG_STREAK = 3;
  function blankStat() { return { seen: 0, wrong: 0, firstTry: 0, triesTotal: 0, lastTries: 0, misses: 0, streak: 0, lastSeen: null, lastRound: null, streakRound: null }; }
  function num(x) { return typeof x === 'number' && isFinite(x) && x >= 0 ? Math.floor(x) : 0; }
  function sanitizeStat(s) {
    var b = blankStat();
    if (!s || typeof s !== 'object') return b;
    ['seen', 'wrong', 'firstTry', 'triesTotal', 'lastTries', 'misses', 'streak'].forEach(function (f) { b[f] = num(s[f]); });
    if (b.firstTry > b.seen) b.firstTry = b.seen;
    if (b.misses > b.seen) b.misses = b.seen;
    b.lastSeen = typeof s.lastSeen === 'string' ? s.lastSeen.slice(0, 40) : null;
    b.lastRound = typeof s.lastRound === 'string' ? s.lastRound.slice(0, 40) : null;
    b.streakRound = typeof s.streakRound === 'string' ? s.streakRound.slice(0, 40) : null;
    return b;
  }
  /* tries = taps needed to reach the right answer (1 = first time). Returns a new stat object. */
  function recordAttempt(stat, tries, roundId, when) {
    var s = sanitizeStat(stat);
    tries = Math.max(1, Math.min(3, Math.round(tries) || 1));
    s.seen++;
    s.triesTotal += tries;
    s.wrong += tries - 1;
    s.lastTries = tries;
    s.lastSeen = when || new Date().toISOString();
    s.lastRound = roundId || null;
    if (tries === 1) {
      s.firstTry++;
      // the streak only grows once per separate round
      if (!roundId || s.streakRound !== roundId) { s.streak++; s.streakRound = roundId || null; }
    } else {
      s.misses++;
      s.streak = 0; s.streakRound = null;
    }
    return s;
  }
  function assess(stat) {
    var s = sanitizeStat(stat);
    if (!s.seen) return { status: 'new', needsRevision: false, priority: 0, recurring: false };
    var rate = s.firstTry / s.seen;
    var recurring = s.misses >= 2 && rate < 0.8;
    var needs = s.lastTries > 1 || (recurring && s.streak < STRONG_STREAK);
    var priority = needs ? Math.max(1, 2 * s.misses + (s.lastTries > 1 ? 2 : 0) + (recurring ? 5 : 0) - s.streak) : 0;
    var status = needs ? 'practise' : (s.streak >= STRONG_STREAK ? 'strong' : 'learning');
    return { status: status, needsRevision: needs, priority: priority, recurring: recurring, rate: rate };
  }

  /* Facts flagged for revision inside the range, most urgent first. */
  function revisionFacts(stats, maxA, maxB) {
    stats = stats || {};
    var out = [];
    Object.keys(stats).forEach(function (k) {
      var f = parseKey(k); if (!f || !inRange(f, maxA, maxB)) return;
      var as = assess(stats[k]);
      if (as.needsRevision) out.push({ f: fact(f.a, f.b), priority: as.priority, lastSeen: stats[k].lastSeen || '' });
    });
    out.sort(function (x, y) { return y.priority - x.priority || (x.lastSeen < y.lastSeen ? -1 : x.lastSeen > y.lastSeen ? 1 : 0) || (x.f.a - y.f.a) || (x.f.b - y.f.b); });
    return out.map(function (x) { return x.f; });
  }

  /* ───────── building a round ─────────
   * kind: 'practise' (the range), 'revise' (flagged facts in range), 'mix' (about half revision, rest new),
   *       'focus' (an explicit list, e.g. this round's tricky ones — still filtered to the range).
   * Revision rounds use each flagged fact once (most urgent first), never padding with unflagged facts.
   */
  function buildRound(opts) {
    opts = opts || {};
    var st = sanitizeSettings(opts.settings), rng = rngOrDefault(opts.rng);
    var kind = opts.kind || 'practise';
    var range = rangeFacts(st.maxA, st.maxB);
    var facts;
    if (kind === 'revise') {
      facts = revisionFacts(opts.stats, st.maxA, st.maxB).slice(0, st.count);
      if (st.order === 'random') facts = shuffle(facts, rng);
    } else if (kind === 'focus') {
      var seen = {};
      facts = (opts.focus || []).map(function (f) { return parseKey(f && f.key ? f.key : f); })
        .filter(function (f) { if (!f || !inRange(f, st.maxA, st.maxB) || seen[key(f.a, f.b)]) return false; seen[key(f.a, f.b)] = true; return true; })
        .map(function (f) { return fact(f.a, f.b); });
      if (st.order === 'random') facts = shuffle(facts, rng);
    } else if (kind === 'mix') {
      var rev = revisionFacts(opts.stats, st.maxA, st.maxB).slice(0, Math.ceil(st.count / 2));
      var used = {}; rev.forEach(function (f) { used[f.key] = true; });
      var rest = range.filter(function (f) { return !used[f.key]; });
      var more = fillFrom(rest.length ? rest : range, st.count - rev.length, 'random', rng);
      facts = shuffle(rev.concat(more), rng);
    } else {
      facts = fillFrom(range, st.count, st.order, rng);
    }
    return facts.map(function (f) { return { a: f.a, b: f.b, key: f.key, answer: f.answer, choices: choicesFor(f.a, f.b, rng) }; });
  }

  /* ───────── a game round (state machine, no DOM) ───────── */
  function createRound(questions, roundId) {
    var qs = questions.map(function (q) { return { a: q.a, b: q.b, key: q.key, answer: q.answer, choices: q.choices.map(function (c) { return { value: c.value, correct: !!c.correct, disabled: false }; }), tries: 0, solved: false }; });
    var i = 0;
    return {
      id: roundId || ('r' + Date.now().toString(36)),
      get index() { return i; },
      get total() { return qs.length; },
      get done() { return i >= qs.length; },
      current: function () { return qs[i] || null; },
      questions: function () { return qs; },
      /* Tap choice number `ci`. Returns {result:'correct'|'wrong'|'ignored', tries}. */
      choose: function (ci) {
        var q = qs[i];
        if (!q || q.solved) return { result: 'ignored' };
        var c = q.choices[ci];
        if (!c || c.disabled) return { result: 'ignored' };
        q.tries++;
        if (c.correct) { q.solved = true; return { result: 'correct', tries: q.tries }; }
        c.disabled = true;
        return { result: 'wrong', tries: q.tries };
      },
      next: function () { if (qs[i] && qs[i].solved) i++; return !this.done; },
      summary: function () {
        var solved = qs.filter(function (q) { return q.solved; });
        var first = solved.filter(function (q) { return q.tries === 1; });
        var again = solved.filter(function (q) { return q.tries > 1; });
        var seen = {}, tricky = [];
        again.forEach(function (q) { if (!seen[q.key]) { seen[q.key] = true; tricky.push(fact(q.a, q.b)); } });
        return { completed: solved.length, total: qs.length, firstTry: first.length, neededAnotherTry: again.length, tricky: tricky };
      }
    };
  }

  return {
    MIN: MIN, MAX: MAX, COUNTS: COUNTS, DEFAULT_SETTINGS: DEFAULT_SETTINGS, STRONG_STREAK: STRONG_STREAK,
    product: product, key: key, parseKey: parseKey, fact: fact, shuffle: shuffle, words: words,
    table: table, chantLines: chantLines, flashcardDeck: flashcardDeck,
    sanitizeSettings: sanitizeSettings, inRange: inRange, rangeFacts: rangeFacts,
    candidatePool: candidatePool, distractors: distractors, choicesFor: choicesFor,
    blankStat: blankStat, sanitizeStat: sanitizeStat, recordAttempt: recordAttempt, assess: assess, revisionFacts: revisionFacts,
    buildRound: buildRound, createRound: createRound
  };
});
