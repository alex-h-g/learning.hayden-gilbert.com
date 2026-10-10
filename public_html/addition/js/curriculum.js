/* Andy the Adder — 6-level addition curriculum. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../maths/core/js/curriculum-kit.js'), require('./engine.js'), require('../../maths/core/js/facts.js'));
  else root.AndyCurriculum = factory(root.ArithCurriculumKit, root.AndyEngine, root.ArithFacts);
})(typeof self !== 'undefined' ? self : this, function (Kit, E, Facts) {
  'use strict';
  /* Profile fields: fact (single-digit fact), a/b digits, carry 'none'|'some', minCarries, carryOut true|false */
  var LEVELS = [
    { id: 1, short: 'Single-digit addition', sub: 'counting on', visual: true,
      objective: 'Add two small numbers by counting on from the bigger one.',
      newSkill: 'Adding two single-digit numbers.',
      intro: ['Hi! Let’s start with small numbers.', 'Adding means putting two groups together. Start with the bigger number and count on.'],
      examples: [[3, 4], [5, 2], [6, 3]],
      profiles: [{ fact: true, label: 'number facts' }] },
    { id: 2, short: '2-digit + 2-digit', sub: 'no carrying',
      objective: 'Line the numbers up and add the units first, then the tens.',
      newSkill: 'Column addition with place value.',
      intro: ['Now we’ll add bigger numbers in columns.', 'Units go under units and tens go under tens. We always start with the units on the right.'],
      examples: [[23, 14], [45, 32], [61, 27]],
      profiles: [{ a: 2, b: 2, carry: 'none', label: 'no carrying' }] },
    { id: 3, short: '2-digit + 2-digit', sub: 'with carrying',
      objective: 'When a column adds up to 10 or more, carry the ten into the next column.',
      newSkill: 'Carrying into the next column.',
      intro: ['Time to learn carrying!', 'If the units add up to 10 or more, we write the units and carry the ten into the tens column. Ten ones make one ten.'],
      examples: [[27, 18], [46, 37], [58, 26]],
      profiles: [{ a: 2, b: 2, carry: 'some', carryOut: false, label: 'carrying a ten' },
                 { a: 2, b: 2, carry: 'some', carryOut: true, label: 'carrying into the hundreds' }] },
    { id: 4, short: 'Three-digit addition', sub: 'with and without carrying',
      objective: 'Add hundreds, tens and units, carrying whenever a column reaches 10.',
      newSkill: 'Three-column addition, including numbers of different lengths.',
      intro: ['Three digits now!', 'Same method: units, then tens, then hundreds. Carry whenever a column makes 10 or more.'],
      examples: [[342, 215], [347, 268], [456, 78]],
      profiles: [{ a: 3, b: 3, carry: 'none', label: 'no carrying' },
                 { a: 3, b: 3, carry: 'some', label: 'carrying' },
                 { a: 3, b: 2, carry: 'some', label: 'different lengths' }] },
    { id: 5, short: 'Four-digit addition', sub: 'carrying across columns',
      objective: 'Add four-digit numbers, carrying across several columns.',
      newSkill: 'Larger numbers with more carrying.',
      intro: ['Big numbers! Four digits.', 'Take it one column at a time. Sometimes we carry more than once in the same sum.'],
      examples: [[3456, 2179], [768, 584], [5468, 729]],
      profiles: [{ a: 4, b: 4, carry: 'some', label: 'carrying' },
                 { a: 3, b: 3, carry: 'some', minCarries: 3, label: 'carrying in every column' },
                 { a: 4, b: 4, carry: 'some', minCarries: 2, label: 'carrying more than once' },
                 { a: 4, b: 3, carry: 'some', label: 'different lengths' }] },
    { id: 6, short: 'Mixed addition', sub: 'challenge',
      objective: 'Decide for yourself whether each sum needs carrying.',
      newSkill: 'Choosing the right steps without being told.',
      intro: ['The mixed challenge!', 'Some sums need carrying and some don’t. Different sizes too. You decide!'],
      examples: [[63, 29], [508, 296], [4875, 3268]],
      mixedFrom: [2, 3, 4, 5] }
  ];

  function candidate(p, rng) {
    if (p.fact) return { fact: [Kit.rnd(1, 9, rng), Kit.rnd(1, 9, rng)] };
    return [Kit.ofDigits(p.a, rng), Kit.ofDigits(p.b, rng)];
  }
  function solve(q, p) {
    if (p && p.fact || q.fact) {
      var pair = q.fact || q;
      return Facts.solveFact('+', pair[0], pair[1]);
    }
    var s = E.solve(q);
    s.key = q.join('+');
    return s;
  }
  function matches(sol, p) {
    if (p.fact) return sol.format === 'fact';
    if (sol.format !== 'column-add') return false;
    var a = sol.addends;
    if (String(a[0]).length !== p.a || String(a[1]).length !== p.b) return false;
    if (p.carry === 'none' && sol.carryCount) return false;
    if (p.carry === 'some' && !sol.carryCount) return false;
    if (p.minCarries && sol.carryCount < p.minCarries) return false;
    if (p.carryOut === true && !sol.carryOut) return false;
    if (p.carryOut === false && sol.carryOut) return false;
    return true;
  }
  return Kit.make({ LEVELS: LEVELS, candidate: candidate, solve: solve, matches: matches });
});
