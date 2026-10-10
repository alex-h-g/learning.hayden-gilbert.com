/* Mandy the Multiplier — what Mandy says at each step of written multiplication. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('../../addition/js/dialogue.js'));
  else root.MandyDialogue = factory(root.MandyEngine, root.AndyDialogue);
})(typeof self !== 'undefined' ? self : this, function (E, AddD) {
  'use strict';
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function place(c) { return E.PLACE[c]; }
  function worth(d, j) { return d * Math.pow(10, j); }
  function rowName(st) { return st.row === 0 ? 'the units digit, ' + st.d : 'the ' + place(st.row) + ' digit, ' + st.d + ' (which really means ' + worth(st.d, st.row) + ')'; }
  function carryText(st) { return 'We write the ' + (st.p % 10) + ' and carry the ' + Math.floor(st.p / 10) + '.'; }
  function addIntro(sol) {
    return 'We’ve got all ' + sol.partials.length + ' rows: ' + sol.partials.join(' + ') + '. Now we add them together, just like column addition.';
  }

  var D = {
    welcome: function () {
      return 'Hi there! I’m Mandy the Multiplier! Before we start multiplying bigger numbers, let’s see how well you know your times tables.\nBut first, what should I call you?';
    },
    demoStart: function (sol) {
      return { pose: 'pointing', text: 'Here’s our question: ' + sol.a + ' × ' + sol.b + '. ' + (sol.bd.length > 1 ? 'We’ll make one row for each digit of ' + sol.b + ', then add the rows.' : 'We multiply each digit of ' + sol.a + ' by ' + sol.b + ', starting with the units.') };
    },
    demoStep: function (st, sol) {
      if (st.stage === 'add') { var m = AddD.demoStep(st); if (st.firstAdd) m = { pose: m.pose, text: addIntro(sol) + '\n' + m.text }; return m; }
      if (st.type === 'placeholder') return { pose: 'pointing', text: st.first ? 'Now we multiply by ' + rowName(st) + '. Because we’re multiplying by ' + place(st.row) + ', this row starts with ' + (st.row === 1 ? 'a 0' : st.row + ' zeros') + ' in the ' + (st.row === 1 ? 'units column' : 'columns on the right') + '.' : 'Another 0 for the ' + place(st.col) + ' column.' };
      if (st.type === 'times') return { pose: 'pointing', text: st.d + ' × ' + st.x + ' = ' + st.prod + '.' };
      if (st.type === 'addCarry') return { pose: 'pointing', text: 'Add the ' + st.carryIn + ' we carried: ' + st.prod + ' + ' + st.carryIn + ' = ' + st.p + '.' };
      if (st.type === 'writeCarry') return { pose: 'pointing', text: 'No more digits to multiply, so the carried ' + st.carryIn + ' goes in the ' + place(st.col) + ' column.' };
      if (st.p >= 10) return { pose: 'pointing', text: st.p + ' is 10 or more. ' + carryText(st) };
      return { pose: 'pointing', text: st.d + ' × ' + st.x + (st.carryIn ? ' + ' + st.carryIn : '') + ' = ' + st.p + '. We write the ' + st.p + ' in the ' + place(st.col) + ' column.' };
    },
    prompt: function (st, guided, sol) {
      if (st.stage === 'add') {
        var m = AddD.prompt(st, guided);
        if (st.firstAdd && guided) m = { pose: 'pointing', text: addIntro(sol) + '\n' + m.text };
        else if (st.firstAdd) m = { pose: 'neutral', text: 'Now add the rows. ' + m.text };
        return m;
      }
      if (!guided) {
        if (st.type === 'placeholder') return { pose: 'neutral', text: 'New row, multiplying by the ' + place(st.row) + ' digit. What goes in the ' + place(st.col) + ' column?' };
        return { pose: 'neutral', text: cap(place(st.col)) + ' column of this row. What do you write?' };
      }
      if (st.type === 'placeholder') {
        if (st.first) return { pose: 'pointing', text: 'Great! We’ve finished multiplying by the ' + place(st.row - 1) + ' digit. Now we’re multiplying by the ' + place(st.row) + ' digit. Remember, this ' + st.d + ' represents ' + worth(st.d, st.row) + ', not just ' + st.d + ', so our answer needs to line up with the ' + place(st.row) + ' column. We start by writing a 0 in the units. Type 0.' };
        return { pose: 'pointing', text: 'And another 0 in the ' + place(st.col) + ' column, because we’re multiplying by ' + place(st.row) + '.' };
      }
      if (st.type === 'times') return { pose: 'pointing', text: (st.firstInRow ? 'We start with the units: ' : 'Next: ') + 'what is ' + st.d + ' × ' + st.x + '?' };
      if (st.type === 'addCarry') return { pose: 'pointing', text: 'Now add the ' + st.carryIn + ' we carried. What is ' + st.prod + ' + ' + st.carryIn + '?' };
      if (st.type === 'writeCarry') return { pose: 'pointing', text: 'There are no more digits to multiply, but we still have the ' + st.carryIn + ' we carried. It goes in the ' + place(st.col) + ' column. What do we write?' };
      if (st.p >= 10) return { pose: 'pointing', text: st.p + ' is 10 or more. Which digit do we write in the ' + place(st.col) + ' column?' };
      var lead = st.firstInRow ? 'We start with the units. ' : st.rowStart ? 'Now multiply the units digit, ' + st.x + '. ' : '';
      return { pose: 'pointing', text: lead + 'What is ' + st.d + ' × ' + st.x + (st.carryIn ? ' + ' + st.carryIn + ' carried' : '') + '?' };
    },
    afterStep: function (st, guided, sol) {
      if (st.stage === 'add') return AddD.afterStep(st);
      if (st.type === 'write' && st.carryOut) return carryText(st);
      if (st.type === 'writeCarry' || (st.type === 'write' && st.i === sol.ad.length - 1 && !st.carryOut)) {
        var r = sol.rows[st.row];
        return 'That row is ' + r.value + ', which is ' + sol.a + ' × ' + worth(r.d, st.row) + '.';
      }
      return '';
    },
    choiceWrong: function () { return { pose: 'reassuring', text: 'Let’s try the other one.' }; },
    hint: function (st, lvl, sol) {
      if (st.stage === 'add') return AddD.hint(st, lvl);
      if (st.type === 'placeholder') return lvl === 1 ? 'We’re multiplying by ' + place(st.row) + ', so the ' + place(st.col) + ' column gets a placeholder.' : 'Type 0. It keeps every digit in the right place-value column.';
      if (st.type === 'writeCarry') return 'Write the ' + st.carryIn + ' we carried.';
      if (st.type === 'times') return lvl === 1 ? 'Think of the ' + st.d + ' times table.' : 'Count in ' + st.d + 's, ' + st.x + ' times.';
      if (st.type === 'addCarry') return lvl === 1 ? 'Start at ' + st.prod + ' and count on ' + st.carryIn + '.' : st.prod + ' + ' + st.carryIn + ' is one more than ' + (st.p - 1) + '.';
      if (lvl === 1) return 'Work out ' + st.d + ' × ' + st.x + (st.carryIn ? ', then add the ' + st.carryIn + ' we carried' : '') + '. If it’s 10 or more, write only the units digit.';
      return st.d + ' × ' + st.x + (st.carryIn ? ' + ' + st.carryIn : '') + ' = ' + st.p + '. So what goes in this column?';
    },
    wrong: function (st, entry, lvl, sol) {
      if (st.stage === 'add') return AddD.wrong(st, entry);
      var e = Number(entry);
      if (st.type === 'placeholder') return 'This row is multiplying by ' + place(st.row) + ', not units, so it needs a 0 placeholder here. Otherwise the row would be in the wrong columns.';
      if (st.type === 'write') {
        if (st.carryIn && e === st.prod % 10) return 'So close! Don’t forget to add the ' + st.carryIn + ' we carried.';
        if (st.p >= 10 && e === Math.floor(st.p / 10)) return 'That’s the part we carry. In this column we write the units digit.';
      }
      if (st.type === 'times' && (e === st.d * (st.x + 1) || e === st.d * (st.x - 1))) return 'Nearly! That’s one ' + st.d + ' too many or too few. Check your ' + st.d + ' times table.';
      if (st.type === 'times' && e === st.d + st.x) return 'That’s ' + st.d + ' plus ' + st.x + '. We need ' + st.d + ' times ' + st.x + '.';
      if (Math.abs(e - Number(st.expected)) === 1) return 'So close! You’re just one out.';
      return 'Not quite. You typed ' + entry + '.';
    },
    reveal: function (st) {
      if (st.stage === 'add') return AddD.reveal(st);
      if (st.type === 'placeholder') return 'We write a 0 to hold the place.';
      if (st.type === 'times') return st.d + ' × ' + st.x + ' = ' + st.prod + '.';
      if (st.type === 'addCarry') return st.prod + ' + ' + st.carryIn + ' = ' + st.p + '.';
      if (st.type === 'writeCarry') return 'The carried ' + st.carryIn + ' goes here.';
      return st.d + ' × ' + st.x + (st.carryIn ? ' + ' + st.carryIn : '') + ' = ' + st.p + (st.p >= 10 ? '. ' + carryText(st) : ', so we write ' + st.p + '.');
    },
    finish: function (sol) {
      if (sol.partials.length === 1) return sol.a + ' × ' + sol.b + ' = ' + sol.answer + '.' + (sol.mulCarries ? ' You handled the carrying perfectly.' : '');
      var parts = sol.rows.map(function (r) { return sol.a + ' × ' + worth(r.d, r.j) + ' = ' + r.value; });
      return sol.a + ' × ' + sol.b + ' = ' + sol.answer + '.\nWe worked out ' + parts.join(', ') + ', then added the rows together.';
    }
  };
  return D;
});
