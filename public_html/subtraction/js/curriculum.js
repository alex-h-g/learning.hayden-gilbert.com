/* Susy the Subtractor — curriculum definitions and question generator.
 * Levels are pure data. The generator uses the engine's analysis of each question
 * (borrow columns, zeros crossed) to guarantee every question fits its level.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.SusyCurriculum = factory(root.SusyEngine);
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  var DEFAULTS = { guided: 3, practice: 5, mastery: 5, threshold: 0.8 };

  /* Profile fields (all optional except top/bottom):
   *   top, bottom      number of digits in each operand
   *   borrow           'none' | 'some'
   *   minBorrows       at least this many columns need a borrow
   *   zero             true → must borrow across at least one zero; false → never
   *   minZeroChain     must cross at least this many zeros in one borrow
   *   borrowAt         a borrow must happen for this column (0 units, 1 tens, ...)
   *   onlyBorrowAt     the only column allowed to need a borrow
   *   label            short description shown in Susy's hints / progress
   */
  var LEVELS = [
    {
      id: 1, name: 'Two-digit minus one-digit', short: '2-digit − 1-digit', sub: 'no borrowing',
      objective: 'Take a one-digit number away from the units of a two-digit number. The tens stay the same.',
      newSkill: 'Subtracting a single-digit number from a two-digit number.',
      intro: ['Today we’ll take a small number away from a bigger one.', 'We start in the units column. The tens just come straight down!'],
      examples: [[24, 3], [57, 4], [86, 2]],
      profiles: [{ top: 2, bottom: 1, borrow: 'none', label: 'no borrowing' }]
    },
    {
      id: 2, name: 'Two-digit minus one-digit', short: '2-digit − 1-digit', sub: 'with borrowing',
      objective: 'Borrow a ten when the units digit on top is too small.',
      newSkill: 'Borrowing from the tens column.',
      intro: ['Today we’ll learn about borrowing!', 'Sometimes the top units digit is too small, so we borrow a ten from next door. One ten is the same as ten ones.'],
      examples: [[52, 8], [61, 7], [43, 6]],
      profiles: [{ top: 2, bottom: 1, borrow: 'some', label: 'borrowing a ten' }]
    },
    {
      id: 3, name: 'Two-digit minus two-digit', short: '2-digit − 2-digit', sub: 'no borrowing',
      objective: 'Subtract column by column: units first, then tens.',
      newSkill: 'Subtracting two multi-digit numbers column by column.',
      intro: ['Now both numbers have two digits.', 'We always start with the units, then do the tens.'],
      examples: [[86, 32], [79, 45], [67, 23]],
      profiles: [{ top: 2, bottom: 2, borrow: 'none', label: 'no borrowing' }]
    },
    {
      id: 4, name: 'Two-digit minus two-digit', short: '2-digit − 2-digit', sub: 'with borrowing',
      objective: 'Regroup a ten into ten ones, then subtract both columns.',
      newSkill: 'Regrouping during two-digit subtraction.',
      intro: ['This is a big one: borrowing with two-digit numbers!', 'When the top units digit is too small, the tens digit goes down by one and the units digit goes up by ten. The number is still worth the same.'],
      examples: [[58, 49], [52, 28], [73, 56]],
      profiles: [{ top: 2, bottom: 2, borrow: 'some', label: 'borrowing a ten' }]
    },
    {
      id: 5, name: 'Three-digit minus one-digit', short: '3-digit − 1-digit', sub: 'with and without borrowing',
      objective: 'Use the same skills with three-digit numbers. Hundreds and tens stay put unless we need to borrow.',
      newSkill: 'Applying existing subtraction skills to three-digit numbers.',
      intro: ['Let’s try bigger numbers! Three digits this time.', 'The rules are the same. Start with the units, and only borrow if you need to.'],
      examples: [[458, 3], [452, 8], [637, 9]],
      profiles: [
        { top: 3, bottom: 1, borrow: 'none', label: 'no borrowing' },
        { top: 3, bottom: 1, borrow: 'some', zero: false, label: 'borrowing a ten' }
      ]
    },
    {
      id: 6, name: 'Three-digit minus two-digit', short: '3-digit − 2-digit', sub: 'no borrowing',
      objective: 'Line the numbers up by place value: units under units, tens under tens.',
      newSkill: 'Subtracting numbers with different numbers of digits.',
      intro: ['The bottom number is shorter this time.', 'We line it up on the right: units under units, tens under tens. Nothing goes under the hundreds, so they come straight down.'],
      examples: [[786, 42], [654, 23], [948, 35]],
      profiles: [{ top: 3, bottom: 2, borrow: 'none', label: 'no borrowing' }]
    },
    {
      id: 7, name: 'Three-digit minus two-digit', short: '3-digit − 2-digit', sub: 'with borrowing',
      objective: 'Borrow in three-digit sums, including borrowing across a zero.',
      newSkill: 'Regrouping in three-digit calculations, including borrowing across zero.',
      intro: ['Time for borrowing with three-digit numbers.', 'Sometimes the tens digit is a zero. Zero tens means nothing to borrow yet, so we go next door to the hundreds first!'],
      examples: [[351, 76], [402, 18], [503, 27]],
      profiles: [
        { top: 3, bottom: 2, borrow: 'some', zero: false, label: 'borrowing' },
        { top: 3, bottom: 2, borrow: 'some', zero: true, label: 'borrowing across a zero' }
      ]
    },
    {
      id: 8, name: 'Three-digit minus three-digit', short: '3-digit − 3-digit', sub: 'no borrowing',
      objective: 'Subtract all three columns: units, tens, then hundreds.',
      newSkill: 'Working confidently with three-digit subtraction.',
      intro: ['Three digits on top and three on the bottom!', 'Units, then tens, then hundreds. One column at a time.'],
      examples: [[786, 243], [975, 421], [869, 357]],
      profiles: [{ top: 3, bottom: 3, borrow: 'none', label: 'no borrowing' }]
    },
    {
      id: 9, name: 'Three-digit minus three-digit', short: '3-digit − 3-digit', sub: 'with borrowing',
      objective: 'Borrow in the units, the tens, across a zero, and more than once in one sum.',
      newSkill: 'Multi-column regrouping and borrowing across zero.',
      intro: ['Now we can borrow anywhere!', 'Sometimes we borrow more than once in the same sum. Take it one column at a time and you’ll be fine.'],
      examples: [[731, 456], [604, 278], [402, 187]],
      profiles: [
        { top: 3, bottom: 3, borrow: 'some', onlyBorrowAt: 0, zero: false, label: 'borrowing in the units' },
        { top: 3, bottom: 3, borrow: 'some', onlyBorrowAt: 1, label: 'borrowing in the tens' },
        { top: 3, bottom: 3, borrow: 'some', zero: true, label: 'borrowing across a zero' },
        { top: 3, bottom: 3, borrow: 'some', minBorrows: 2, zero: false, label: 'borrowing twice' }
      ]
    },
    {
      id: 10, name: 'Four-digit minus one- or two-digit', short: '4-digit − 1/2-digit', sub: 'with and without borrowing',
      objective: 'Keep four columns lined up, borrowing where needed.',
      newSkill: 'Applying subtraction techniques to four-digit numbers.',
      intro: ['Four digits! Now we have a thousands column too.', 'Keep everything lined up on the right and work from the units.'],
      examples: [[5834, 2], [5204, 7], [5834, 27]],
      profiles: [
        { top: 4, bottom: 1, borrow: 'none', label: 'no borrowing' },
        { top: 4, bottom: 1, borrow: 'some', label: 'borrowing' },
        { top: 4, bottom: 2, borrow: 'none', label: 'no borrowing' },
        { top: 4, bottom: 2, borrow: 'some', label: 'borrowing' }
      ]
    },
    {
      id: 11, name: 'Four-digit minus three-digit', short: '4-digit − 3-digit', sub: 'with and without borrowing',
      objective: 'Line up hundreds, tens and units; the thousands come down unless we borrow.',
      newSkill: 'Four-digit subtraction with differently sized operands.',
      intro: ['Four digits on top, three on the bottom.', 'Line up the hundreds, tens and units. The thousands come down unless we need to borrow from them.'],
      examples: [[5834, 321], [5004, 327], [6452, 381]],
      profiles: [
        { top: 4, bottom: 3, borrow: 'none', label: 'no borrowing' },
        { top: 4, bottom: 3, borrow: 'some', zero: false, label: 'borrowing' },
        { top: 4, bottom: 3, borrow: 'some', zero: true, label: 'borrowing across zeros' }
      ]
    },
    {
      id: 12, name: 'Four-digit minus four-digit', short: '4-digit − 4-digit', sub: 'no borrowing',
      objective: 'Subtract all four columns, one at a time.',
      newSkill: 'Four-digit subtraction without regrouping.',
      intro: ['Four columns, no borrowing.', 'Units, tens, hundreds, thousands. Nice and steady.'],
      examples: [[9876, 4321], [8754, 3212], [7968, 5431]],
      profiles: [{ top: 4, bottom: 4, borrow: 'none', label: 'no borrowing' }]
    },
    {
      id: 13, name: 'Four-digit minus four-digit', short: '4-digit − 4-digit', sub: 'with borrowing',
      objective: 'Borrow across several columns, including across more than one zero.',
      newSkill: 'Complex multi-column subtraction and regrouping across multiple zeros.',
      intro: ['The biggest challenge yet!', 'Sometimes we have to borrow across two or even three zeros. Each zero becomes ten, then gives one away and becomes nine.'],
      examples: [[5832, 2764], [7002, 3487], [6000, 4321]],
      profiles: [
        { top: 4, bottom: 4, borrow: 'some', zero: false, label: 'borrowing' },
        { top: 4, bottom: 4, borrow: 'some', minBorrows: 2, zero: false, label: 'borrowing more than once' },
        { top: 4, bottom: 4, borrow: 'some', minZeroChain: 2, label: 'borrowing across several zeros' }
      ]
    },
    {
      id: 14, name: 'Mixed subtraction challenge', short: 'Mixed challenge', sub: 'everything you’ve learned',
      objective: 'Work out which method each sum needs, without being told.',
      newSkill: 'Choosing and applying the correct subtraction technique without being told which one to use.',
      intro: ['This is the mixed challenge!', 'Every sum is different. Some need borrowing and some don’t. You decide!'],
      examples: [[93, 47], [705, 268], [8000, 2753]],
      mixed: true,
      profiles: null // built below from every earlier level
    }
  ];

  LEVELS.forEach(function (L, i) {
    L.config = Object.assign({}, DEFAULTS, L.config || {});
    L.next = i + 1 < LEVELS.length ? LEVELS[i + 1].id : null;
    L.borrowLabel = L.sub;
    L.title = 'Level ' + L.id + ': ' + L.short + ' (' + L.sub + ')';
  });
  var mixed = LEVELS[LEVELS.length - 1];
  mixed.profiles = [];
  LEVELS.forEach(function (L) { if (!L.mixed) L.profiles.forEach(function (p) { mixed.profiles.push(p); }); });

  function getLevel(id) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i];
    return null;
  }

  function matches(sol, p) {
    if (String(sol.top).length !== p.top || String(sol.bottom).length !== p.bottom) return false;
    if (p.borrow === 'none' && sol.borrowCount !== 0) return false;
    if (p.borrow === 'some' && sol.borrowCount === 0) return false;
    if (p.minBorrows && sol.borrowCount < p.minBorrows) return false;
    if (p.zero === true && sol.maxZeroChain < 1) return false;
    if (p.zero === false && sol.maxZeroChain > 0) return false;
    if (p.minZeroChain && sol.maxZeroChain < p.minZeroChain) return false;
    if (p.borrowAt !== undefined && sol.borrowCols.indexOf(p.borrowAt) < 0) return false;
    if (p.onlyBorrowAt !== undefined && !(sol.borrowCols.length === 1 && sol.borrowCols[0] === p.onlyBorrowAt)) return false;
    if (sol.answer === 0) return false; // avoid "x − x" sums
    return true;
  }

  function rnd(lo, hi, rng) { return lo + Math.floor(rng() * (hi - lo + 1)); }

  function candidate(p, rng) {
    // Build the top number digit by digit; inject zeros when the profile is about zeros.
    var d = [];
    for (var i = 0; i < p.top; i++) d.push(rnd(i === p.top - 1 ? 1 : 0, 9, rng));
    var wantZeros = p.minZeroChain || (p.zero ? 1 : 0);
    if (wantZeros && p.top >= 3) {
      var maxStart = p.top - 1 - wantZeros; // zeros must sit below the leading digit
      var start = rnd(1, Math.max(1, maxStart), rng);
      for (var z = 0; z < wantZeros && start + z < p.top - 1; z++) d[start + z] = 0;
      if (rng() < 0.3 && p.minZeroChain) for (var k = 0; k < p.top - 1; k++) d[k] = 0; // e.g. 6000
    }
    var top = 0;
    for (var j = d.length - 1; j >= 0; j--) top = top * 10 + d[j];
    var bottom = rnd(Math.pow(10, p.bottom - 1), Math.pow(10, p.bottom) - 1, rng);
    return [top, bottom];
  }

  /** Generate one question for a profile. Returns a solved question (engine output + profile). */
  function generate(profile, opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    var avoid = opts.avoid || {};
    for (var tries = 0; tries < 20000; tries++) {
      var c = candidate(profile, rng);
      if (c[1] > c[0]) continue;
      var key = c[0] + '-' + c[1];
      if (avoid[key] && tries < 15000) continue;
      var sol = Engine.solve(c[0], c[1]);
      if (matches(sol, profile)) { sol.profile = profile; sol.key = key; return sol; }
    }
    throw new Error('Could not generate a question for profile ' + JSON.stringify(profile));
  }

  /**
   * Build a set of questions for a level, cycling through its profiles so every skill
   * in the level is represented. `focusProfile` (a label) biases the set toward one skill.
   */
  function buildSet(level, count, opts) {
    opts = opts || {};
    var out = [];
    var avoid = Object.assign({}, opts.avoid || {});
    var profiles = level.profiles;
    if (opts.focus) {
      var f = profiles.filter(function (p) { return p.label === opts.focus; });
      if (f.length) profiles = f.concat(profiles); // weight the focus skill
    }
    var offset = Math.floor((opts.rng || Math.random)() * profiles.length);
    for (var i = 0; i < count; i++) {
      var p = profiles[(i + offset) % profiles.length];
      if (opts.progressive && level.profiles.length > 1) p = level.profiles[Math.min(level.profiles.length - 1, Math.floor(i * level.profiles.length / count))];
      var q = generate(p, { rng: opts.rng, avoid: avoid });
      avoid[q.key] = true;
      out.push(q);
    }
    return out;
  }

  function exampleSet(level) {
    return level.examples.map(function (e) {
      var sol = Engine.solve(e[0], e[1]);
      sol.key = e[0] + '-' + e[1];
      sol.profile = level.profiles.filter(function (p) { return matches(sol, p); })[0] || level.profiles[0];
      return sol;
    });
  }

  return {
    LEVELS: LEVELS, DEFAULTS: DEFAULTS,
    getLevel: getLevel, matches: matches, generate: generate, buildSet: buildSet, exampleSet: exampleSet
  };
});
