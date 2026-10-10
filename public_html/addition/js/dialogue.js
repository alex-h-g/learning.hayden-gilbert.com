/* Andy the Adder — what Andy says at each step. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.AndyDialogue = factory(root.AndyEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function place(c) { return E.PLACE[c]; }
  function expr(st) { return st.parts.join(' + ') + (st.carryIn ? ' + the ' + st.carryIn + ' we carried' : ''); }
  function exprShort(st) { return st.parts.concat(st.carryIn ? [st.carryIn] : []).join(' + '); }
  function running(st) {
    var all = st.parts.concat(st.carryIn ? [st.carryIn] : []), tot = all[0], out = [];
    for (var i = 1; i < all.length; i++) { out.push(tot + ' + ' + all[i] + ' = ' + (tot + all[i])); tot += all[i]; }
    return out.join(', then ');
  }
  function lonely(st) { return st.parts.length === 1 && !st.carryIn; }
  function carryText(st) { return 'We write the ' + (st.sum % 10) + ' and carry the ' + st.carryOut + ' into the ' + place(st.col + 1) + ' column.'; }

  return {
    welcome: function () {
      return 'Hey there! I’m Andy the Adder. Adding is all about putting numbers together. I’ll show you how, from small sums right up to big four-digit numbers, one column at a time.\nWhat should I call you?';
    },
    demoStart: function (sol) {
      return { pose: 'pointing', text: 'Here’s our sum: ' + sol.addends.join(' + ') + '. We line up the columns and always start with the units on the right.' };
    },
    demoStep: function (st) {
      if (st.type === 'colSum') return { pose: 'pointing', text: cap(place(st.col)) + ' column: ' + exprShort(st) + ' = ' + st.sum + '.' };
      if (st.type === 'carryDown') return { pose: 'pointing', text: 'We carried ' + st.carryIn + ' into the ' + place(st.col) + ' column and there’s nothing else there, so it comes straight down.' };
      if (st.sum >= 10) return { pose: 'pointing', text: st.sum + ' is 10 or more. ' + carryText(st) };
      if (lonely(st)) return { pose: 'pointing', text: 'Nothing to add in the ' + place(st.col) + ' column, so the ' + st.parts[0] + ' comes straight down.' };
      return { pose: 'pointing', text: cap(place(st.col)) + ' column: ' + exprShort(st) + ' = ' + st.sum + '. We write ' + st.sum + '.' };
    },
    prompt: function (st, guided) {
      if (!guided) return { pose: 'neutral', text: cap(place(st.col)) + ' column. What do you write?' };
      var lead = st.col === 0 ? '' : 'Now the ' + place(st.col) + ' column. ';
      if (st.type === 'colSum') return { pose: 'pointing', text: lead + 'Let’s add ' + expr(st) + '. What do they make?' };
      if (st.type === 'carryDown') return { pose: 'pointing', text: 'We carried ' + st.carryIn + ' into the ' + place(st.col) + ' column, and there’s nothing else there. What do we write?' };
      if (st.sum >= 10) return { pose: 'pointing', text: st.sum + ' is too big for one column! We write the units digit here and carry the ten. What digit goes in the ' + place(st.col) + ' column?' };
      if (lonely(st)) return { pose: 'pointing', text: lead + 'There’s nothing to add to the ' + st.parts[0] + ', so it comes straight down. What do we write?' };
      return { pose: 'pointing', text: lead + 'What is ' + expr(st) + '?' };
    },
    afterStep: function (st) { return st.type === 'write' && st.carryOut ? carryText(st) : ''; },
    choiceWrong: function () { return { pose: 'reassuring', text: 'Let’s try the other one.' }; },
    hint: function (st, lvl) {
      if (st.type === 'carryDown') return 'Bring down the ' + st.carryIn + ' we carried.';
      if (lonely(st)) return 'Nothing is added here, so the ' + st.parts[0] + ' stays as it is.';
      if (st.type === 'colSum') return lvl === 1 ? 'Add them one at a time. Start with the biggest and count on.' : running(st) + '.';
      if (lvl === 1) return 'Add ' + expr(st) + '. If it makes 10 or more, write only the units digit and carry the ten.';
      return exprShort(st) + ' = ' + st.sum + '. So what goes in this column?';
    },
    wrong: function (st, entry) {
      var e = Number(entry);
      if (st.type === 'colSum' && st.carryIn && e === st.sum - st.carryIn) return 'Nearly! Don’t forget the ' + st.carryIn + ' we carried.';
      if (st.type === 'write') {
        if (st.carryIn && e === (st.sum - st.carryIn) % 10) return 'So close! Did you remember the ' + st.carryIn + ' we carried?';
        if (st.sum >= 10 && e === Math.floor(st.sum / 10)) return 'That’s the ten we carry. In this column we write the units digit.';
      }
      if (Math.abs(e - Number(st.expected)) === 1) return 'So close! You’re just one out.';
      return 'Not quite. You typed ' + entry + '.';
    },
    reveal: function (st) {
      if (st.type === 'carryDown') return 'The carried ' + st.carryIn + ' comes straight down.';
      if (st.type === 'colSum') return exprShort(st) + ' = ' + st.sum + '.';
      return exprShort(st) + ' = ' + st.sum + (st.carryOut ? '. ' + carryText(st) : ', so we write ' + st.sum + '.');
    },
    finish: function (sol) {
      var t = sol.addends.join(' + ') + ' = ' + sol.answer + '.';
      if (sol.carryCount > 1) t += ' You carried ' + sol.carryCount + ' times. Great carrying!';
      else if (sol.carryCount === 1) t += ' You carried the ten perfectly.';
      return t;
    }
  };
});
