/* Susy the Subtractor — what Susy says at each step (shared-shell dialogue interface). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.SusyDialogue = factory(root.SusyEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function place(c) { return E.PLACE[c]; }
  function many(c, n) { return n === 1 ? E.ONE_OF[c] : E.MANY_OF[c]; }
  function valueSame(step) {
    if (step.from !== step.to + 1) return '';
    return cap(String(step.fromBefore)) + ' ' + many(step.from, step.fromBefore) + ' and ' + step.toBefore + ' ' + many(step.to, step.toBefore) +
      ' is the same as ' + step.fromAfter + ' ' + many(step.from, step.fromAfter) + ' and ' + step.toAfter + ' ' + many(step.to, step.toAfter) + '. The number hasn’t changed!';
  }
  function afterBorrow(step) {
    return 'One ' + E.ONE_OF[step.from] + ' is worth ten ' + E.MANY_OF[step.to] + ', so the ' + step.toBefore + ' becomes ' + step.toAfter + '.' +
      (step.last && valueSame(step) ? '\n' + valueSame(step) : '');
  }
  function countBack(top, n) { var o = []; for (var i = 1; i <= n; i++) o.push(top - i); return o.join(', '); }

  return {
    welcome: function () {
      return 'Hi there! I’m Susy the Subtractor. I’m here to help you become brilliant at subtraction. We’ll start with the easy stuff and work our way up to some really big numbers.\nWhat should I call you?';
    },
    demoStart: function (sol) {
      return { pose: 'pointing', text: 'Here’s our sum: ' + sol.top + ' minus ' + sol.bottom + '. We always start with the units column on the right.' };
    },
    demoStep: function (step) {
      if (step.type === 'needBorrow') {
        var t = 'Uh-oh! We need to take ' + step.bottom + ' away from ' + step.top + '. ' + step.top + ' is smaller than ' + step.bottom + ', so we need to borrow.';
        if (step.zerosCrossed) t += ' The ' + place(step.col + 1) + ' digit is 0, so there’s nothing to borrow there yet. We go further left, to the ' + place(step.lender) + '.';
        return { pose: 'curious', text: t };
      }
      if (step.type === 'borrow') {
        return { pose: 'pointing', text: 'We borrow one ' + E.ONE_OF[step.from] + ' from the ' + step.fromBefore + ', so it becomes ' + step.fromAfter + '.\n' + afterBorrow(step) };
      }
      if (!step.hasBottom) return { pose: 'pointing', text: 'There’s nothing to take away in the ' + place(step.col) + ' column, so the ' + step.top + ' comes straight down.' };
      return { pose: 'pointing', text: cap(place(step.col)) + ' column: ' + step.top + ' minus ' + step.bottom + ' is ' + step.expected + '.' };
    },
    prompt: function (step, guided) {
      if (step.type === 'needBorrow') return { pose: 'curious', text: 'Uh-oh! We need to take ' + step.bottom + ' away from ' + step.top + '. Can we do that yet? Do you think we need to borrow from next door?' };
      if (step.type === 'borrow') {
        if (!guided) return { pose: 'neutral', text: 'Borrow from the ' + place(step.from) + ' column. What does the ' + step.fromBefore + ' become?' };
        if (step.first && step.lender > step.forCol + 1) {
          return { pose: 'pointing', text: 'The ' + place(step.forCol + 1) + ' digit is 0. Zero ' + E.MANY_OF[step.forCol + 1] + ' means nothing to borrow yet! So we go next door again, to the ' + step.fromBefore +
            ' in the ' + place(step.from) + ' column. We take one ' + E.ONE_OF[step.from] + ' away. What does the ' + step.fromBefore + ' become?' };
        }
        if (!step.first) return { pose: 'pointing', text: 'Now the ' + place(step.from) + ' column has ' + step.fromBefore + '. We borrow one of them for the column on the right. What does ' + step.fromBefore + ' become?' };
        return { pose: 'pointing', text: 'Let’s borrow! We’ll take one ' + E.ONE_OF[step.from] + ' from the ' + step.fromBefore + '. That means one fewer, so what does the ' + step.fromBefore + ' become? Type it above the ' + step.fromBefore + '.' };
      }
      if (!guided) return { pose: 'neutral', text: cap(place(step.col)) + ' column. What’s the answer?' };
      var lead = step.col === 0 ? '' : 'Now let’s look at the ' + place(step.col) + ' column. ';
      if (!step.hasBottom) return { pose: 'pointing', text: lead + 'There’s nothing to take away here, so the ' + step.top + ' comes straight down. What do we write?' };
      return { pose: 'pointing', text: lead + (step.top !== step.originalTop ? 'Remember, it’s ' + step.top + ' now. ' : '') + 'We have ' + step.top + ' minus ' + step.bottom + '. What’s the answer?' };
    },
    afterStep: function (step) { return step.type === 'borrow' ? afterBorrow(step) : ''; },
    choiceWrong: function (step) {
      return { pose: 'reassuring', text: 'That’s OK! ' + step.top + ' is smaller than ' + step.bottom + ', so we can’t take it away yet. When the top digit is smaller, we borrow one from the column on the left. Let’s do it together!' };
    },
    hint: function (step, lvl) {
      if (step.type === 'borrow') return lvl === 1 ? 'Borrowing means this digit gives one away, so it goes down by one.' : step.fromBefore + ' take away 1 is…?';
      if (!step.hasBottom) return lvl === 1 ? 'Nothing is being taken away in this column.' : 'Just bring the ' + step.top + ' straight down.';
      if (lvl === 1) {
        if (step.top !== step.originalTop) return 'Remember, we borrowed, so the top digit is ' + step.top + ' now, not ' + step.originalTop + '. Start at ' + step.top + ' and count back ' + step.bottom + '.';
        return 'Start at ' + step.top + ' and count back ' + step.bottom + '.';
      }
      if (step.bottom <= 6) return 'Count back from ' + step.top + ': ' + countBack(step.top, step.bottom) + '. Where did you land?';
      return 'What number do you add to ' + step.bottom + ' to make ' + step.top + '?';
    },
    wrong: function (step, entry) {
      var e = Number(entry);
      if (step.type === 'borrow') {
        if (e === step.fromBefore + 1) return 'Close, but borrowing makes this digit one smaller, not bigger.';
        if (e === step.toAfter || e === 10) return 'That’s what the next column gets. This digit gives one away, so it goes down by one.';
        return 'Not quite. You typed ' + entry + '.';
      }
      if (step.top !== step.originalTop && step.originalTop < step.bottom && e === step.bottom - step.originalTop) {
        return 'It looks like you took ' + step.originalTop + ' away from ' + step.bottom + '. We always take the bottom from the top. That’s why we borrowed, so it’s ' + step.top + ' minus ' + step.bottom + '.';
      }
      if (Math.abs(e - Number(step.expected)) === 1) return 'So close! You’re just one out.';
      return 'Nearly there! You typed ' + entry + '.';
    },
    reveal: function (step) {
      if (step.type === 'borrow') return step.fromBefore + ' take away 1 is ' + step.fromAfter + '. ' + afterBorrow(step);
      if (!step.hasBottom) return 'Nothing is taken away, so we write ' + step.expected + '.';
      return step.top + ' minus ' + step.bottom + ' is ' + step.expected + '.';
    },
    finish: function (sol) {
      var t = sol.top + ' minus ' + sol.bottom + ' equals ' + sol.answer + '.';
      if (sol.leadingZeros) t += '\nWe don’t need the 0' + (sol.leadingZeros > 1 ? 's' : '') + ' at the front, so the answer is ' + sol.answer + '.';
      if (sol.maxZeroChain) t += ' You borrowed across ' + (sol.maxZeroChain > 1 ? 'zeros' : 'a zero') + ', which is a really tricky skill!';
      else if (sol.borrowCount > 1) t += ' You borrowed ' + sol.borrowCount + ' times and kept everything straight.';
      else if (sol.borrowCount === 1) t += ' You borrowed a ' + E.ONE_OF[sol.borrowCols[0] + 1] + ' and finished every column.';
      return t;
    }
  };
});
