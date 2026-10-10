/* Danny the Divisor — 10-level division curriculum. Exact division before remainders, remainders before decimals. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../maths/core/js/curriculum-kit.js'), require('./engine.js'), require('../../maths/core/js/facts.js'));
  else root.DannyCurriculum = factory(root.ArithCurriculumKit, root.DannyEngine, root.ArithFacts);
})(typeof self !== 'undefined' ? self : this, function (Kit, E, Facts) {
  'use strict';
  /* Profile: fact {dMin,dMax,qMin,qMax} | len (dividend digits), mode exact|remainder|decimal, qlen, innerRem, zeroQ, divs, minDp, maxDp, maxDividend */
  var LEVELS = [
    { id: 1, short: 'What is division?', sub: 'sharing and grouping', visual: true,
      objective: 'Understand division as making equal groups.',
      newSkill: 'Division means sharing equally or making equal groups.',
      intro: ['Hi! Division is all about sharing equally and making groups.', '12 ÷ 3 asks: if we put 12 things into groups of 3, how many groups do we get?'],
      examples: [[12, 3], [15, 5], [20, 4]],
      profiles: [{ fact: { dMin: 2, dMax: 5, qMin: 2, qMax: 6 }, label: 'equal groups' }] },
    { id: 2, short: 'Exact division', sub: 'using times tables',
      objective: 'Use multiplication facts to divide exactly.',
      newSkill: 'Division is the opposite of multiplication.',
      intro: ['Times tables are a division superpower!', '27 ÷ 3 asks how many 3s make 27. We know 3 × 9 = 27, so 27 ÷ 3 = 9.'],
      examples: [[27, 9], [27, 3], [36, 4], [48, 6], [56, 7]],
      profiles: [{ fact: { dMin: 2, dMax: 9, qMin: 2, qMax: 9 }, label: 'division facts' }] },
    { id: 3, short: 'Long division', sub: 'getting started',
      objective: 'Use the long-division layout: divide, multiply, subtract, bring down.',
      newSkill: 'The written long-division method.',
      intro: ['Let’s learn long division!', 'We write the number inside the bracket and the divisor outside. Then we repeat four steps: divide, multiply, subtract, bring down.'],
      examples: [[27, 3], [84, 4], [96, 3]],
      profiles: [{ len: 2, mode: 'exact', qlen: 1, label: 'one quotient digit' }, { len: 2, mode: 'exact', qlen: 2, innerRem: false, label: 'two quotient digits' }] },
    { id: 4, short: '2-digit ÷ 1-digit', sub: 'carrying a remainder along',
      objective: 'Divide two-digit numbers where something is left over part-way through.',
      newSkill: 'Carrying the remainder into the next digit.',
      intro: ['Now part-way through, something will be left over.', 'That’s fine! We bring the next digit down next to it and keep going.'],
      examples: [[75, 5], [96, 4], [84, 6]],
      profiles: [{ len: 2, mode: 'exact', qlen: 2, innerRem: true, label: 'remainder carried along' }, { len: 2, mode: 'exact', qlen: 2, label: 'two-digit answers' }] },
    { id: 5, short: '3-digit ÷ 1-digit', sub: 'exact answers',
      objective: 'Keep the long-division steps going across three digits, including a 0 in the answer.',
      newSkill: 'Placing every quotient digit, even zeros.',
      intro: ['Three-digit numbers now.', 'Every digit in the answer sits above a digit of the number we’re dividing. Sometimes that digit is a 0, and we must still write it!'],
      examples: [[144, 3], [248, 4], [408, 4]],
      profiles: [{ len: 3, mode: 'exact', label: 'exact answers' }, { len: 3, mode: 'exact', zeroQ: true, label: 'a zero in the answer' }] },
    { id: 6, short: 'Remainders', sub: 'simple',
      objective: 'Find what is left over when a number doesn’t divide exactly.',
      newSkill: 'Quotients and remainders.',
      intro: ['Sometimes a number doesn’t share out exactly.', 'What’s left over is the remainder. It’s always smaller than the number we’re dividing by.'],
      examples: [[29, 8], [23, 5], [47, 6]],
      profiles: [{ len: 2, mode: 'remainder', qlen: 1, label: 'simple remainders' }] },
    { id: 7, short: 'Remainders', sub: 'larger numbers',
      objective: 'Use long division on three-digit numbers that leave a remainder.',
      newSkill: 'Long division with remainders.',
      intro: ['Bigger numbers with remainders.', 'Do all the long-division steps, then whatever is left at the very end is the remainder.'],
      examples: [[157, 6], [245, 8], [389, 7]],
      profiles: [{ len: 3, mode: 'remainder', label: 'larger remainders' }] },
    { id: 8, short: 'Decimal answers', sub: 'introduction',
      objective: 'Turn a remainder into a decimal by adding a decimal point and a 0.',
      newSkill: 'Continuing past the decimal point.',
      intro: ['Instead of a remainder, we can keep dividing!', 'We add a decimal point and a 0 to the number, put a decimal point in the answer too, and carry on. 7 ÷ 2 = 3.5.'],
      examples: [[7, 2], [9, 2], [13, 2]],
      profiles: [{ len: 1, mode: 'decimal', divs: [2, 4, 5], minDp: 1, maxDp: 1, label: 'one decimal place' }, { len: 2, mode: 'decimal', divs: [2, 4, 5], minDp: 1, maxDp: 1, maxDividend: 20, label: 'tenths' }] },
    { id: 9, short: 'Long division', sub: 'with decimals',
      objective: 'Keep adding zeros after the decimal point until nothing is left over.',
      newSkill: 'Long division with decimal answers.',
      intro: ['Now longer decimal answers.', 'If something is still left over after a decimal place, add another 0 and keep going until nothing is left.'],
      examples: [[15, 4], [25, 8], [7, 4]],
      profiles: [{ len: 2, mode: 'decimal', divs: [2, 4, 5, 8], minDp: 1, maxDp: 3, label: 'two-digit decimals' },
                 { len: 2, mode: 'decimal', divs: [4, 8], minDp: 2, maxDp: 3, label: 'more decimal places' },
                 { len: 1, mode: 'decimal', divs: [4, 8], minDp: 2, maxDp: 3, label: 'small numbers, more places' },
                 { len: 3, mode: 'decimal', divs: [2, 4, 5, 8], minDp: 1, maxDp: 3, label: 'three-digit decimals' }] },
    { id: 10, short: 'Mixed division', sub: 'challenge',
      objective: 'Choose the right approach: exact, remainder or decimal.',
      newSkill: 'Choosing the right technique without being told.',
      intro: ['The mixed challenge!', 'Some divide exactly, some leave a remainder, and some go past the decimal point. The question tells you which kind of answer to give.'],
      examples: [[96, 8], [139, 4], [9, 8]],
      mixedFrom: [2, 3, 4, 5, 6, 7, 8, 9] }
  ];

  function candidate(p, rng) {
    if (p.fact) { var d = Kit.rnd(p.fact.dMin, p.fact.dMax, rng), q = Kit.rnd(p.fact.qMin, p.fact.qMax, rng); return { fact: [d * q, d] }; }
    var divs = p.divs || [2, 3, 4, 5, 6, 7, 8, 9];
    var dv = divs[Kit.rnd(0, divs.length - 1, rng)];
    if (p.mode === 'exact') {
      var lo = Math.ceil(Math.pow(10, p.len - 1) / dv), hi = Math.floor((Math.pow(10, p.len) - 1) / dv);
      if (lo > hi) return null;
      return [dv * Kit.rnd(lo, hi, rng), dv];
    }
    var max = Math.min(Math.pow(10, p.len) - 1, p.maxDividend || Infinity);
    return [Kit.rnd(Math.max(Math.pow(10, p.len - 1), 2), max, rng), dv];
  }
  function solve(q, p) {
    if ((p && p.fact) || q.fact) { var f = q.fact || q; return Facts.solveFact('/', f[0], f[1]); }
    var mode = p && p.mode || (q[0] % q[1] === 0 ? 'exact' : 'remainder');
    return E.solve(q[0], q[1], mode);
  }
  function matches(sol, p) {
    if (p.fact) return sol.format === 'fact' && sol.b >= p.fact.dMin && sol.b <= p.fact.dMax && sol.answer >= p.fact.qMin && sol.answer <= p.fact.qMax;
    if (sol.format !== 'long-div' || sol.mode !== p.mode) return false;
    if (String(sol.dividend).length !== p.len) return false;
    if (p.divs && p.divs.indexOf(sol.divisor) < 0) return false;
    if (p.maxDividend && sol.dividend > p.maxDividend) return false;
    if (p.qlen && sol.quotientLen !== p.qlen) return false;
    if (p.innerRem === true && !sol.innerRemainder) return false;
    if (p.innerRem === false && sol.innerRemainder) return false;
    if (p.zeroQ && !sol.zeroInQuotient) return false;
    if (p.mode === 'remainder' && !sol.remainder) return false;
    if (p.mode === 'decimal' && (sol.dp < (p.minDp || 1) || sol.dp > (p.maxDp || 3))) return false;
    if (sol.quotient < 1) return false;
    return true;
  }
  return Kit.make({ LEVELS: LEVELS, candidate: candidate, solve: solve, matches: matches });
});
