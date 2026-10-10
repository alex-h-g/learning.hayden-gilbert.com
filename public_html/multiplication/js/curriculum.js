/* Mandy the Multiplier — 7-level multiplication curriculum, plus times-table helpers. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../maths/core/js/curriculum-kit.js'), require('./engine.js'), require('../../maths/core/js/facts.js'));
  else root.MandyCurriculum = factory(root.ArithCurriculumKit, root.MandyEngine, root.ArithFacts);
})(typeof self !== 'undefined' ? self : this, function (Kit, E, Facts) {
  'use strict';
  /* Profile: fact | a,b digits, carry 'none'|'some' (carrying while multiplying) */
  var LEVELS = [
    { id: 1, short: 'One-digit multiplication', sub: 'times tables', visual: true,
      objective: 'Multiply two single-digit numbers using your times tables.',
      newSkill: 'Multiplication facts from 1 × 1 to 9 × 9.',
      intro: ['Let’s warm up with times tables!', 'Times means groups of. 3 × 4 is 4 groups of 3, which makes 12.'],
      examples: [[3, 4], [6, 7], [8, 5]], config: { guided: 2 },
      profiles: [{ fact: true, label: 'times tables' }] },
    { id: 2, short: '2-digit × 1-digit', sub: 'no carrying',
      objective: 'Multiply the units, then the tens, writing each answer in its own column.',
      newSkill: 'Written multiplication with place value.',
      intro: ['Now we multiply bigger numbers!', 'We multiply the units first, then the tens. The tens answer goes in the tens column, because 2 tens times 3 is 6 tens.'],
      examples: [[23, 3], [12, 4], [31, 2]],
      profiles: [{ a: 2, b: 1, carry: 'none', label: 'no carrying' }] },
    { id: 3, short: '2-digit × 1-digit', sub: 'with carrying',
      objective: 'When a product is 10 or more, write the units digit and carry the tens.',
      newSkill: 'Carrying in multiplication.',
      intro: ['Time to learn carrying!', 'If a product is 10 or more, we write the units digit and carry the tens. Then we add the carried number after the next multiplication.'],
      examples: [[27, 4], [36, 7], [45, 3]],
      profiles: [{ a: 2, b: 1, carry: 'some', label: 'carrying' }] },
    { id: 4, short: '2-digit × 2-digit', sub: 'long multiplication',
      objective: 'Make two partial products, one for the units digit and one for the tens digit, then add them.',
      newSkill: 'Partial products and the place-value zero.',
      intro: ['This is long multiplication!', 'We multiply by the units digit first. Then we multiply by the tens digit. That digit really means tens, so its row starts with a 0. Finally we add the two rows.'],
      examples: [[23, 12], [31, 23], [47, 36]], config: { guided: 3 },
      profiles: [{ a: 2, b: 2, carry: 'none', label: 'no carrying' }, { a: 2, b: 2, carry: 'some', label: 'with carrying' }] },
    { id: 5, short: '3-digit × 2-digit', sub: 'long multiplication',
      objective: 'Multiply a three-digit number by each digit of a two-digit number and add the rows.',
      newSkill: 'Longer partial products with carrying.',
      intro: ['Three digits times two digits!', 'Same steps: the units row, the tens row with its 0, then add them up.'],
      examples: [[213, 32], [123, 24], [346, 27]],
      profiles: [{ a: 3, b: 2, carry: 'none', label: 'no carrying' }, { a: 3, b: 2, carry: 'some', label: 'with carrying' }] },
    { id: 6, short: '3-digit × 3-digit', sub: 'three partial products',
      objective: 'Make three partial products (units, tens and hundreds) and add them.',
      newSkill: 'Three rows, each lined up by place value.',
      intro: ['The biggest one yet!', 'Three rows this time: units, tens and hundreds. The tens row starts with one 0, and the hundreds row starts with two 0s.'],
      examples: [[211, 312], [123, 234], [324, 152]], config: { guided: 3 },
      profiles: [{ a: 3, b: 3, carry: 'none', label: 'no carrying' }, { a: 3, b: 3, carry: 'some', label: 'with carrying' }] },
    { id: 7, short: 'Mixed multiplication', sub: 'challenge',
      objective: 'Work out which method each question needs.',
      newSkill: 'Choosing the right technique without being told.',
      intro: ['The mixed challenge!', 'Times tables, short multiplication and long multiplication, all mixed up. You decide how to solve each one!'],
      examples: [[7, 8], [48, 6], [134, 23]],
      mixedFrom: [1, 2, 3, 4, 5, 6] }
  ];

  function candidate(p, rng) {
    if (p.fact) return { fact: [Kit.rnd(1, 9, rng), Kit.rnd(1, 9, rng)] };
    var b = 0; for (var i = 0; i < p.b; i++) b = b * 10 + Kit.rnd(1, p.carry === 'none' ? 4 : 9, rng);
    var a = Kit.ofDigits(p.a, rng);
    return [a, b];
  }
  function solve(q, p) {
    if ((p && p.fact) || q.fact) { var f = q.fact || q; return Facts.solveFact('x', f[0], f[1]); }
    return E.solve(q[0], q[1]);
  }
  function matches(sol, p) {
    if (p.fact) return sol.format === 'fact';
    if (sol.format !== 'long-mult') return false;
    if (String(sol.a).length !== p.a || String(sol.b).length !== p.b) return false;
    if (p.carry === 'none' && sol.mulCarries) return false;
    if (p.carry === 'some' && !sol.mulCarries) return false;
    return true;
  }
  var C = Kit.make({ LEVELS: LEVELS, candidate: candidate, solve: solve, matches: matches });

  /** Times tables helpers */
  C.diagnostic = function (rng) {
    rng = rng || Math.random;
    var out = [], seen = {};
    while (out.length < 3) {
      var x = Kit.rnd(1, 9, rng), y = Kit.rnd(1, 9, rng), k = Math.min(x, y) + 'x' + Math.max(x, y);
      if (seen[k]) continue;
      seen[k] = true; out.push(Facts.solveFact('x', x, y));
    }
    return out;
  };
  C.tableSet = function (n, count, rng) {
    rng = rng || Math.random;
    var ys = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(function () { return rng() - 0.5; });
    var out = [];
    for (var i = 0; i < count; i++) {
      var y = ys[i % 9];
      out.push(rng() < 0.5 ? Facts.solveFact('x', n, y) : Facts.solveFact('x', y, n));
    }
    return out;
  };
  C.mixedSet = function (count, rng) {
    var out = [], seen = {};
    rng = rng || Math.random;
    while (out.length < count) {
      var x = Kit.rnd(2, 9, rng), y = Kit.rnd(2, 9, rng);
      if (seen[x + 'x' + y]) continue; seen[x + 'x' + y] = true;
      out.push(Facts.solveFact('x', x, y));
    }
    return out;
  };
  return C;
});
