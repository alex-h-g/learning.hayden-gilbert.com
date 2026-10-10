/* Danny the Divisor — what Danny says at each step of long division. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DannyDialogue = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function skip(d, upto) { var o = []; for (var i = 1; i * d <= upto + d && o.length < 9; i++) o.push(d * i); return o.join(', '); }

  return {
    welcome: function () {
      return 'Hello! I’m Danny the Divisor. Division is about sharing things out equally, and I’ll take you from simple sharing all the way to long division and decimals. Nice and steady, one step at a time.\nWhat should I call you?';
    },
    demoStart: function (sol) {
      return { pose: 'pointing', text: 'Here’s our division: ' + sol.dividend + ' ÷ ' + sol.divisor + '. The ' + sol.divisor + ' goes outside the bracket and ' + sol.dividend + ' goes inside. We work from left to right: divide, multiply, subtract, bring down.' };
    },
    demoStep: function (st, sol) {
      var d = sol.divisor;
      switch (st.type) {
        case 'tooSmall': return { pose: 'curious', text: d + ' doesn’t fit into ' + st.cur + ', so we look at ' + st.cur + st.next + ' instead.' };
        case 'qdigit': return { pose: 'pointing', text: st.value === 0 ? d + ' doesn’t fit into ' + st.cur + ', so we write a 0 in the answer to hold the place.' : d + ' goes into ' + st.cur + ' ' + st.value + (st.value === 1 ? ' time' : ' times') + '. We write ' + st.value + ' above.' };
        case 'product': return { pose: 'pointing', text: st.q + ' × ' + d + ' = ' + st.value + '. We write it underneath.' };
        case 'subtract': return { pose: 'pointing', text: st.cur + ' − ' + st.prod + ' = ' + st.value + '.' + (st.value ? ' That’s what’s left so far.' : ' Nothing left over.') };
        case 'bringDown': return { pose: 'pointing', text: 'We bring down the next digit, ' + st.digit + ', to make ' + (st.rem * 10 + st.digit) + '.' };
        case 'decimalPoint': return { pose: 'pointing', text: (st.first ? 'No digits left, but ' + st.rem + ' is left over. We add a decimal point and a 0, and put a decimal point in the answer too.' : 'Still ' + st.rem + ' left, so we add another 0.') + ' Now we have ' + st.rem * 10 + '.' };
        case 'remainder': return { pose: 'pointing', text: 'Nothing left to bring down, so the ' + st.value + ' left over is the remainder.' };
      }
      return { pose: 'pointing', text: '' };
    },
    prompt: function (st, guided, sol) {
      var d = sol.divisor;
      if (st.type === 'tooSmall') return { pose: 'curious', text: 'Let’s start with the first digit, ' + st.cur + '. Can ' + d + ' go into ' + st.cur + '?' };
      if (st.type === 'bringDown') return { pose: 'pointing', text: guided ? 'Now bring down the next digit, ' + st.digit + ', next to the ' + st.rem + '.' : 'Next step?' };
      if (st.type === 'decimalPoint') {
        if (!st.first) return { pose: 'pointing', text: 'There’s still ' + st.rem + ' left over.' };
        return { pose: 'curious', text: guided ? 'We’ve used every digit, but ' + st.rem + ' is left over. This time we want a decimal answer, so we can keep going!' : 'Every digit is used and ' + st.rem + ' is left. This one wants a decimal answer.' };
      }
      if (!guided) {
        var short = { qdigit: 'How many ' + d + 's in ' + st.cur + '?', product: 'Multiply.', subtract: 'Subtract.', remainder: 'What is the remainder?' };
        return { pose: 'neutral', text: short[st.type] };
      }
      if (st.type === 'qdigit') {
        if (st.value === 0) return { pose: 'pointing', text: 'How many times does ' + d + ' go into ' + st.cur + '?' };
        return { pose: 'pointing', text: (st.decimal ? 'We’re past the decimal point now. ' : '') + 'How many times does ' + d + ' go into ' + st.cur + '? Think: ' + d + ' × what gets close to ' + st.cur + ' without going over?' };
      }
      if (st.type === 'product') return { pose: 'pointing', text: 'Now multiply: ' + st.q + ' × ' + d + ' = ? We write it under ' + st.cur + '.' };
      if (st.type === 'subtract') return { pose: 'pointing', text: 'Now subtract: ' + st.cur + ' − ' + st.prod + ' = ?' };
      return { pose: 'pointing', text: 'There are no more digits to bring down, and something is left over. It’s smaller than ' + d + ', so it’s our remainder. What is the remainder?' };
    },
    afterStep: function (st, guided, sol) {
      if (st.type === 'tooSmall') return 'Right! ' + sol.divisor + ' is bigger than ' + st.cur + ', so we use ' + st.cur + st.next + ' instead.';
      if (st.type === 'qdigit' && st.value === 0) return 'We write the 0 so the other digits stay in the right places.';
      if (st.type === 'bringDown') return 'Now we have ' + (st.rem * 10 + st.digit) + '.';
      if (st.type === 'decimalPoint') return 'Now we have ' + st.rem * 10 + (st.first ? '. Notice the decimal point in the answer, right above the one in the number.' : '.');
      if (st.type === 'subtract' && guided && st.value === 0 && st.stage === sol.stages.length - 1) return 'Nothing left over!';
      return '';
    },
    choiceWrong: function (st, i, sol) {
      if (st.type === 'tooSmall') return { pose: 'reassuring', text: 'Let’s check: ' + sol.divisor + ' is bigger than ' + st.cur + ', so it doesn’t fit, not even once. We need to use more digits.' };
      return { pose: 'reassuring', text: 'This question wants a decimal answer, not a remainder, so let’s keep going past the point.' };
    },
    hint: function (st, lvl, sol) {
      var d = sol.divisor;
      if (st.type === 'qdigit') {
        if (st.value === 0) return lvl === 1 ? 'Is ' + d + ' bigger than ' + st.cur + '?' : d + ' doesn’t fit into ' + st.cur + ', so it goes 0 times. We still write the 0!';
        if (lvl === 1) return 'Count in ' + d + 's and stop before you go past ' + st.cur + ': ' + skip(d, st.cur) + '…';
        return d + ' × ' + st.value + ' = ' + d * st.value + ' and ' + d + ' × ' + (st.value + 1) + ' = ' + d * (st.value + 1) + ', which is too big.';
      }
      if (st.type === 'product') return lvl === 1 ? 'Multiply the answer digit you just wrote by ' + d + '.' : 'Use your ' + d + ' times table: ' + st.q + ' × ' + d + '.';
      if (st.type === 'subtract') return lvl === 1 ? 'Take ' + st.prod + ' away from ' + st.cur + '.' : 'Count up from ' + st.prod + ' to ' + st.cur + '. How far is it?';
      if (st.type === 'remainder') return lvl === 1 ? 'Look at the last number at the bottom.' : 'The remainder is what’s left after the last subtraction.';
      return '';
    },
    wrong: function (st, entry, lvl, sol) {
      var e = Number(entry), d = sol.divisor;
      if (st.type === 'qdigit') {
        if (e > st.value) return 'Too big! ' + d + ' × ' + e + ' = ' + d * e + ', which is more than ' + st.cur + '.';
        return 'Not quite. ' + d + ' × ' + e + ' = ' + d * e + ', leaving ' + (st.cur - d * e) + '. That’s ' + d + ' or more, so ' + d + ' fits in again!';
      }
      if (st.type === 'product') return 'Check your multiplication: ' + st.q + ' × ' + d + '.';
      if (st.type === 'subtract') return Math.abs(e - st.value) === 1 ? 'So close! You’re just one out.' : 'Not quite. You typed ' + entry + '.';
      if (st.type === 'remainder' && e >= d) return 'A remainder must be smaller than ' + d + '. If it were ' + d + ' or more, ' + d + ' would fit in again.';
      return 'Not quite. You typed ' + entry + '.';
    },
    reveal: function (st, sol) {
      var d = sol.divisor;
      if (st.type === 'qdigit') return d + ' goes into ' + st.cur + ' ' + st.value + (st.value === 1 ? ' time.' : ' times.');
      if (st.type === 'product') return st.q + ' × ' + d + ' = ' + st.value + '.';
      if (st.type === 'subtract') return st.cur + ' − ' + st.prod + ' = ' + st.value + '.';
      if (st.type === 'remainder') return 'The remainder is ' + st.value + '.';
      return '';
    },
    finish: function (sol) {
      var d = sol.divisor, t;
      if (sol.mode === 'remainder' && sol.remainder) t = sol.dividend + ' ÷ ' + d + ' = ' + sol.quotientText + ' remainder ' + sol.remainder + '.\nCheck: ' + d + ' × ' + sol.quotientText + ' + ' + sol.remainder + ' = ' + sol.dividend + '.';
      else t = sol.dividend + ' ÷ ' + d + ' = ' + sol.quotientText + '.\nCheck: ' + d + ' × ' + sol.quotientText + ' = ' + sol.dividend + '.';
      if (sol.zeroInQuotient) t += ' And you remembered the 0 in the answer!';
      return t;
    }
  };
});
