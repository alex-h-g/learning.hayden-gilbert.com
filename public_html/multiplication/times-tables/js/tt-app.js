/* Mandy's Times Tables — the app (screens, events). Logic: tt-core.js. Storage: tt-store.js. Voice: tt-speech.js (Chant only). */
(function () {
  'use strict';
  var TT = window.MandyTT, Store = window.MandyTTStore, Voice = window.MandyVoice;
  var app = document.getElementById('app'), live = document.getElementById('live');
  var S = Store.create();
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── helpers ───────── */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function announce(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); }
  var POSE = ['waving', 'thinking', 'pointing', 'curious', 'encouraging', 'celebrating', 'cheering', 'reassuring', 'neutral'];
  function mandy(pose, cls) {
    if (POSE.indexOf(pose) < 0) pose = 'neutral';
    return '<img class="char ' + (cls || 'char-md') + '" src="/maths/assets/gang/mandy/' + pose + '.webp" alt="" width="320" height="400" decoding="async" onerror="this.onerror=null;this.src=\'/maths/assets/gang/placeholder-mandy.svg\'">';
  }
  function bubble(text, extra) { return '<div class="bubble bubble-left tt-bubble"' + (extra || '') + '><p>' + esc(text) + '</p></div>'; }
  function dateLabel(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }

  /* Mandy's lines. {n} = the child's name. Name lines are used now and then, never every time, never twice running. */
  var LINES = {
    menuBack: ['Ready for another round, {n}?', 'Welcome back, {n}! What shall we practise?', 'What would you like to do now?', 'Pick something to practise. You choose!'],
    flashThink: ['Have a think. What’s the answer?', 'Say the answer in your head, then tap the card.', 'Take your time. When you’re ready, reveal the answer.', 'Come on, {n}. Let’s see if you can remember this one.'],
    flashReveal: ['Did you get it right? Ready for another one?', 'How did you do? Let’s try the next card.', 'Keep practising. You’ll get quicker with every round.', 'Feeling confident? You can test yourself in the game.', 'Did you remember that one, {n}?', 'Ready to see if you know the next one?'],
    gamePrompt: ['Let’s see. Which one could it be?', 'Think carefully. Which answer looks right?', 'Can you remember this one?', 'Take your time. You can do it.', 'Come on, {n}. Let’s see if you can remember this one.', 'Which answer is right?'],
    right: ['That’s right. Well done.', 'Brilliant. You remembered it.', 'Yes, that’s the one.', 'Excellent work. Ready for another?', 'Well done, {n}. You’re getting the hang of this.', 'Well done, {n}. You got that right.', 'Brilliant work, {n}. You’re getting better at this.'],
    rightAfterTry: ['You found it! Well done for sticking with it.', 'Yes, that’s the one. Good thinking.', 'There it is. Well done, {n}.', 'You got there. Brilliant.'],
    wrong: ['Hmm, that’s not quite right. Try again.', 'Not that one. Have another think.', 'Almost. Let’s see if you can find the right answer.', 'That’s a tricky one. Give it another try.', 'Hmm, {n}, that’s not quite right. Have another try.'],
    chant: ['Let’s chant together! Say each one out loud with me.', 'Listen, then join in. The more you say it, the more it sticks.', 'Ready, {n}? Say it with me!']
  };
  var lastLine = {}, lastHadName = false;
  function line(group) {
    var name = (S.active() || {}).name || '';
    var opts = LINES[group].filter(function (l, i) { return i !== lastLine[group]; });
    var plain = opts.filter(function (l) { return l.indexOf('{n}') < 0; });
    var named = opts.filter(function (l) { return l.indexOf('{n}') >= 0; });
    var useName = name && named.length && !lastHadName && Math.random() < 0.3;
    var pool = useName || !plain.length ? named : plain;
    var pick = pool[Math.floor(Math.random() * pool.length)];
    lastLine[group] = LINES[group].indexOf(pick);
    lastHadName = pick.indexOf('{n}') >= 0;
    return pick.replace(/\{n\}/g, name);
  }

  /* ───────── state ───────── */
  var V = {
    screen: null, arg: null, dialog: null, error: '', pending: null, greeted: false,
    chant: { table: 2, line: -1, state: 'stopped', note: '' },
    flash: { table: 2, order: 'sequential', deck: [], i: 0, revealed: false, msg: '' },
    game: null, results: null
  };

  var chanter = Voice.createChanter({
    getRate: function () { return S.rate; },
    onLine: function (i) { V.chant.line = i; if (V.screen === 'chant') paintChantLine(); },
    onState: function (st) { V.chant.state = st; if (V.screen === 'chant') paintChantControls(); if (st === 'finished') announce('Finished the ' + V.chant.table + ' times table. Play it again?'); }
  });

  function go(screen, arg) {
    if (V.screen === 'chant' && screen !== 'chant') { chanter.stop(); Voice.cancelAll(); }
    if (V.game && V.game.timer && screen !== 'game') { clearTimeout(V.game.timer); }
    V.screen = screen; V.arg = arg; V.dialog = null; V.error = '';
    render(true);
  }

  /* ───────── shared pieces ───────── */
  function studentBar() {
    var st = S.active(); if (!st) return '';
    return '<div class="tt-studentbar" role="region" aria-label="Who is practising">' +
      '<span class="tt-who">' + mandy('neutral', 'tt-who-img') + '<span>Practising as <strong>' + esc(st.name) + '</strong></span></span>' +
      '<span class="tt-bar-tools">' + (V.screen !== 'menu' ? '<button class="btn btn-secondary btn-sm" data-action="menu">Menu</button>' : '') +
      '<button class="btn btn-secondary btn-sm" data-action="change-student">Change student</button></span></div>';
  }
  function storageNote() {
    if (!S.persistent) return '<p class="tt-note" role="note">This browser isn’t letting Mandy save anything, so progress will be forgotten when you leave the page.</p>';
    return '';
  }
  function numberPicker(name, value, label, opts) {
    opts = opts || {};
    var h = '<fieldset class="tt-picker' + (opts.cls ? ' ' + opts.cls : '') + '"><legend>' + esc(label) + '</legend><div class="tt-nums">';
    for (var k = 1; k <= 10; k++) h += '<button type="button" class="tt-num" data-action="' + name + '" data-n="' + k + '" aria-pressed="' + (k === value ? 'true' : 'false') + '"' + (opts.aria ? ' aria-label="' + esc(opts.aria(k)) + '"' : '') + '>' + k + '</button>';
    return h + '</div></fieldset>';
  }
  function toggle(action, options, value, label) {
    return '<fieldset class="tt-toggle"><legend>' + esc(label) + '</legend><div class="tt-seg">' + options.map(function (o) {
      return '<button type="button" class="tt-seg-btn" data-action="' + action + '" data-v="' + o[0] + '" aria-pressed="' + (o[0] === value ? 'true' : 'false') + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div></fieldset>';
  }

  /* ───────── welcome / choose student ───────── */
  function nameForm(prefill, label) {
    return '<form class="name-form tt-name-form" data-form="name" novalidate>' +
      '<label for="tt-name">' + esc(label) + '</label>' +
      '<div class="name-row"><input id="tt-name" name="name" maxlength="24" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="go" value="' + esc(prefill || '') + '" placeholder="Your first name or nickname" aria-describedby="tt-name-help tt-name-err" data-autofocus>' +
      '<button class="btn btn-accent btn-lg" type="submit">Start</button></div>' +
      '<p id="tt-name-err" class="tt-error" role="alert">' + esc(V.error) + '</p>' +
      '<p id="tt-name-help" class="muted small">Just a first name or nickname. It stays on this device and is never sent anywhere.</p></form>';
  }
  function welcomeHTML() {
    var list = S.students();
    if (V.pending) {
      var p = V.pending;
      return '<section class="screen welcome"><div class="welcome-card"><div class="welcome-art">' + mandy('curious', 'char-xl') + '</div><div class="welcome-body">' +
        bubble('I already know someone called ' + p.name + '! Is that you?') +
        '<div class="tt-profile-list">' + p.matches.map(function (m) {
          return '<button class="btn btn-accent btn-lg tt-profile-btn" data-action="pick-student" data-id="' + esc(m.id) + '">Yes, that’s me' + (m.created ? ' <small>(started ' + esc(dateLabel(m.created)) + ')</small>' : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="actions"><button class="btn btn-secondary btn-lg" data-action="create-anyway">No, I’m a different ' + esc(p.name) + '</button><button class="btn btn-ghost" data-action="cancel-pending">Go back</button></div>' +
        '</div></div></section>';
    }
    if (!list.length) {
      return '<section class="screen welcome"><div class="welcome-card"><div class="welcome-art">' + mandy('waving', 'char-xl') + '</div><div class="welcome-body">' +
        '<h1 class="logo">Mandy’s <span>Times Tables</span></h1>' +
        bubble('Hello. I’m Mandy, and I’m here to help you learn your multiplication tables. What’s your name?') +
        nameForm(S.gangName(), 'Your name') + storageNote() +
        '</div></div></section>';
    }
    var buttons = list.map(function (s) {
      return '<li class="tt-profile-row"><button class="btn btn-accent btn-lg tt-profile-btn" data-action="pick-student" data-id="' + esc(s.id) + '">' + esc(s.name) + '</button>' +
        '<button class="btn btn-ghost btn-sm" data-action="ask-remove" data-id="' + esc(s.id) + '" aria-label="Remove ' + esc(s.name) + '’s profile">Remove</button></li>';
    }).join('');
    return '<section class="screen welcome"><div class="welcome-card"><div class="welcome-art">' + mandy('waving', 'char-xl') + '</div><div class="welcome-body">' +
      '<h1 class="logo">Mandy’s <span>Times Tables</span></h1>' +
      bubble('Hello! I’m Mandy. Who’s practising today? Tap your name.') +
      '<ul class="tt-profile-list" aria-label="Students on this device">' + buttons + '</ul>' +
      '<details class="tt-new"' + (V.error ? ' open' : '') + '><summary class="btn btn-secondary btn-lg">I’m new here</summary>' + nameForm('', 'What’s your name?') + '</details>' +
      storageNote() + '</div></div></section>';
  }
  function submitName(raw) {
    var name = S.cleanName(raw);
    if (!name) { V.error = 'Please type your name first.'; render(); var i = document.getElementById('tt-name'); if (i) i.focus(); announce(V.error); return; }
    var matches = S.findByName(name);
    if (matches.length) { V.pending = { name: name, matches: matches }; V.error = ''; render(true); return; }
    S.createStudent(name); V.greeted = false; go('menu');
  }

  /* ───────── menu ───────── */
  function menuHTML() {
    var st = S.active(), text;
    if (!V.greeted) { text = 'Hello, ' + st.name + '. It’s lovely to see you. Are you ready to practise your multiplication tables with me?'; V.greeted = true; }
    else text = line('menuBack');
    var tricky = TT.revisionFacts(S.facts(), 10, 10).length;
    return '<section class="screen tt-menu">' + studentBar() +
      '<div class="tutor-card plain tt-hero">' + mandy('waving', 'char-md') + bubble(text) + '</div>' +
      '<h1 class="sr-only">Choose how to practise</h1>' +
      '<div class="tt-modes">' +
        '<button class="tt-mode" data-action="chant"><span class="tt-mode-title">Chant Along</span><span class="tt-mode-sub">Say the tables out loud with Mandy</span></button>' +
        '<button class="tt-mode" data-action="flash"><span class="tt-mode-title">Flashcards</span><span class="tt-mode-sub">Remember the answer, then flip the card</span></button>' +
        '<button class="tt-mode tt-mode-game" data-action="setup"><span class="tt-mode-title">Play the Game</span><span class="tt-mode-sub">Pick the right answer' + (tricky ? ' · ' + tricky + ' to practise' : '') + '</span></button>' +
      '</div>' +
      '<div class="actions tt-menu-tools"><button class="btn btn-secondary" data-action="map">My times-table map</button>' +
      '<button class="btn btn-secondary" data-action="ask-reset">Reset my progress</button>' +
      '<a class="btn btn-ghost" href="/multiplication/">Long multiplication with Mandy →</a></div>' +
      storageNote() + '</section>';
  }

  /* ───────── Chant Along ───────── */
  function chantHTML() {
    var c = V.chant, lines = TT.chantLines(c.table);
    var list = lines.map(function (l, i) { return '<li class="tt-chant-line" data-i="' + i + '"><span>' + l.a + ' × ' + l.b + '</span><span class="tt-eq">=</span><span>' + l.answer + '</span></li>' + (l.longPause && i < 9 ? '<li class="tt-chant-gap" aria-hidden="true"></li>' : ''); }).join('');
    var unsupported = !Voice.supported;
    return '<section class="screen tt-chant">' + studentBar() +
      '<h1 class="tt-title">Chant Along</h1>' +
      '<div class="tt-layout">' +
        '<div class="tt-side">' +
          '<div class="tutor-card plain">' + mandy('cheering', 'char-md') + bubble(unsupported ? 'Your browser can’t do my voice, but you can still read along! I’ll light up each line. Say it out loud.' : line('chant')) + '</div>' +
          numberPicker('chant-table', c.table, 'Choose a times table', { aria: function (k) { return 'The ' + k + ' times table'; } }) +
          '<div class="tt-controls" role="group" aria-label="Chant controls">' +
            '<button class="btn btn-accent btn-lg" data-action="chant-play" data-k="play">Play</button>' +
            '<button class="btn btn-secondary btn-lg" data-action="chant-pause" data-k="pause">Pause</button>' +
            '<button class="btn btn-secondary btn-lg" data-action="chant-resume" data-k="resume">Resume</button>' +
            '<button class="btn btn-secondary btn-lg" data-action="chant-stop" data-k="stop">Stop</button>' +
            '<button class="btn btn-secondary btn-lg" data-action="chant-restart" data-k="restart">Restart</button>' +
          '</div>' +
          '<div class="tt-speed" role="group" aria-label="Speaking speed">' +
            '<button class="btn btn-secondary" data-action="slower">Slower</button>' +
            '<span class="tt-speed-val" aria-live="polite">Speed: <strong data-k="speed">' + speedLabel() + '</strong></span>' +
            '<button class="btn btn-secondary" data-action="faster">Faster</button>' +
            '<button class="btn btn-secondary" data-action="voice-test"' + (unsupported ? ' disabled' : '') + '>Voice test</button>' +
          '</div>' +
          '<p class="muted small tt-voice-name" data-k="voice">' + (unsupported ? 'Speech isn’t available in this browser.' : 'Voice: ' + esc(Voice.voiceLabel())) + '</p>' +
        '</div>' +
        '<ol class="tt-chant-list" aria-label="The ' + c.table + ' times table">' + list + '</ol>' +
      '</div></section>';
  }
  function speedLabel() { var r = S.rate; return r <= 0.75 ? 'slow' : r <= 0.9 ? 'steady' : r <= 1.05 ? 'normal' : r <= 1.2 ? 'quick' : 'fast'; }
  function paintChantLine() {
    var items = app.querySelectorAll('.tt-chant-line');
    for (var i = 0; i < items.length; i++) {
      var on = Number(items[i].getAttribute('data-i')) === V.chant.line;
      items[i].classList.toggle('is-now', on);
      if (on) { items[i].setAttribute('aria-current', 'true'); if (items[i].scrollIntoView && !reduceMotion) { var r = items[i].getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight) items[i].scrollIntoView({ block: 'nearest' }); } }
      else items[i].removeAttribute('aria-current');
    }
  }
  function paintChantControls() {
    var st = V.chant.state;
    var en = { play: st === 'stopped' || st === 'finished', pause: st === 'playing', resume: st === 'paused', stop: st !== 'stopped', restart: true };
    Object.keys(en).forEach(function (k) { var b = app.querySelector('[data-k="' + k + '"]'); if (b) b.disabled = !en[k]; });
    var v = app.querySelector('[data-k="voice"]'); if (v && Voice.supported) v.textContent = 'Voice: ' + Voice.voiceLabel();
  }
  function chantLoad() { chanter.load(TT.chantLines(V.chant.table)); }

  /* ───────── Flashcards ───────── */
  function flashReset(shuffle) {
    var f = V.flash;
    if (shuffle) f.order = 'random';
    f.deck = TT.flashcardDeck(f.table, f.order); f.i = 0; f.revealed = false; f.msg = line('flashThink');
  }
  function flashHTML() {
    var f = V.flash, c = f.deck[f.i];
    var face = c.a + ' × ' + c.b + ' = ' + (f.revealed ? c.answer : '?');
    return '<section class="screen tt-flash">' + studentBar() +
      '<h1 class="tt-title">Flashcards</h1>' +
      '<div class="tt-flash-top">' + numberPicker('flash-table', f.table, 'Choose a times table', { aria: function (k) { return 'The ' + k + ' times table'; } }) +
      toggle('flash-order', [['sequential', 'In order'], ['random', 'Mixed up']], f.order, 'Order') + '</div>' +
      '<div class="tt-flash-main">' +
        '<div class="tutor-card plain tt-flash-tutor">' + mandy(f.revealed ? 'curious' : 'thinking', 'char-md') + bubble(f.msg, ' aria-live="polite"') + '</div>' +
        '<div class="tt-card-wrap">' +
          '<button class="tt-card' + (f.revealed ? ' is-revealed' : '') + '" data-action="flash-reveal" aria-label="' + esc(f.revealed ? c.a + ' times ' + c.b + ' equals ' + c.answer : c.a + ' times ' + c.b + '. Tap to reveal the answer') + '"' + (f.revealed ? ' aria-disabled="true"' : '') + '>' +
            '<span class="tt-card-q">' + esc(face) + '</span>' + (f.revealed ? '' : '<span class="tt-card-hint">Tap to reveal</span>') + '</button>' +
          '<p class="tt-count">Card ' + (f.i + 1) + ' of ' + f.deck.length + '</p>' +
          '<div class="tt-controls tt-flash-nav">' +
            '<button class="btn btn-secondary btn-lg" data-action="flash-prev"' + (f.i === 0 ? ' disabled' : '') + '>← Previous card</button>' +
            '<button class="btn btn-accent btn-lg" data-action="flash-reveal" data-k="reveal"' + (f.revealed ? ' disabled' : ' data-autofocus') + '>Reveal answer</button>' +
            '<button class="btn btn-accent btn-lg" data-action="flash-next"' + (f.revealed ? ' data-autofocus' : '') + (f.i >= f.deck.length - 1 ? ' disabled' : '') + '>Next card →</button>' +
          '</div>' +
          '<div class="actions tt-flash-tools">' +
            '<button class="btn btn-secondary" data-action="flash-shuffle">Shuffle</button>' +
            '<button class="btn btn-secondary" data-action="flash-restart">Restart</button>' +
            '<button class="btn btn-secondary" data-action="setup">Try the Game</button>' +
            '<button class="btn btn-secondary" data-action="menu">Return to menu</button>' +
          '</div>' +
          (f.revealed && f.i >= f.deck.length - 1 ? '<p class="tt-done-note">That’s the whole ' + f.table + ' times table! Restart, shuffle, or pick another table.</p>' : '') +
        '</div></div></section>';
  }

  /* ───────── Game: setup ───────── */
  function setupHTML() {
    var st = S.settings(), stats = S.facts();
    var rev = TT.revisionFacts(stats, st.maxA, st.maxB).length;
    var kind = V.arg && V.arg.kind ? V.arg.kind : (rev ? 'mix' : 'practise');
    if (kind !== 'practise' && !rev) kind = 'practise';
    V.setupKind = kind;
    var ex = st.maxA + ' × ' + st.maxB;
    return '<section class="screen tt-setup">' + studentBar() +
      '<h1 class="tt-title">Play the Game</h1>' +
      '<div class="tutor-card plain">' + mandy('pointing', 'char-md') + bubble('Choose how big the numbers can be. Start small and go bigger when you feel ready!') + '</div>' +
      '<div class="card tt-setup-card">' +
        numberPicker('max-a', st.maxA, 'First number: from 1 up to…', { cls: 'tt-pick-a', aria: function (k) { return 'First number up to ' + k; } }) +
        numberPicker('max-b', st.maxB, 'Second number: from 1 up to…', { cls: 'tt-pick-b', aria: function (k) { return 'Second number up to ' + k; } }) +
        '<p class="tt-range-note" aria-live="polite">Questions from <strong>1 × 1</strong> up to <strong>' + ex + '</strong>, for example <strong>' + Math.max(1, Math.ceil(st.maxA / 2)) + ' × ' + st.maxB + '</strong> or <strong>' + st.maxA + ' × ' + Math.max(1, Math.ceil(st.maxB / 2)) + '</strong>.</p>' +
        toggle('count', [['10', '10 questions'], ['20', '20'], ['30', '30']], String(st.count), 'How many questions?') +
        toggle('order', [['random', 'Mixed up'], ['sequential', 'In order']], st.order, 'Question order') +
        '<fieldset class="tt-toggle"><legend>What kind of round?</legend><div class="tt-seg tt-seg-wrap">' +
          [['practise', 'Practise these numbers'], ['revise', 'Revise my tricky ones' + (rev ? ' (' + rev + ')' : '')], ['mix', 'Mix tricky and new']].map(function (o) {
            var off = o[0] !== 'practise' && !rev;
            return '<button type="button" class="tt-seg-btn" data-action="kind" data-v="' + o[0] + '" aria-pressed="' + (o[0] === kind ? 'true' : 'false') + '"' + (off ? ' disabled' : '') + '>' + esc(o[1]) + '</button>';
          }).join('') +
        '</div>' + (rev ? '' : '<p class="muted small">No tricky ones in these numbers yet. Mandy will remember any that catch you out.</p>') + '</fieldset>' +
        '<div class="actions"><button class="btn btn-accent btn-lg" data-action="start-game" data-autofocus>Start the game</button><button class="btn btn-secondary btn-lg" data-action="menu">Back to menu</button></div>' +
      '</div></section>';
  }

  /* ───────── Game: play ───────── */
  function startGame(kind, focus) {
    var st = S.settings();
    var qs = TT.buildRound({ kind: kind, settings: st, stats: S.facts(), focus: focus });
    if (!qs.length) { announce('There are no questions to revise in these numbers.'); go('setup', { kind: 'practise' }); return; }
    V.game = { round: TT.createRound(qs), kind: kind, msg: line('gamePrompt'), pose: 'thinking', state: 'asking', timer: null };
    go('game');
  }
  function gameHTML() {
    var g = V.game, r = g.round, q = r.current();
    var labels = { practise: 'Practice round', revise: 'Revision round', mix: 'Mixed round', focus: 'Tricky ones' };
    var btns = q.choices.map(function (c, i) {
      var cls = 'tt-answer', mark = '', aria = String(c.value);
      if (c.disabled) { cls += ' is-wrong'; mark = '<span class="tt-mark" aria-hidden="true">✗</span>'; aria += ', not this one'; }
      if (q.solved && c.correct) { cls += ' is-right'; mark = '<span class="tt-mark" aria-hidden="true">✓</span>'; aria += ', correct'; }
      var dis = c.disabled || q.solved;
      return '<button class="' + cls + '" data-action="answer" data-i="' + i + '"' + (dis ? ' disabled aria-disabled="true"' : '') + ' aria-label="' + esc(aria) + '">' + mark + '<span>' + c.value + '</span></button>';
    }).join('');
    return '<section class="screen tt-game">' + studentBar() +
      '<div class="tt-game-bar"><span class="mode-chip">' + labels[g.kind] + '</span><span class="tt-progress" aria-label="Question ' + (r.index + 1) + ' of ' + r.total + '">Question ' + (r.index + 1) + ' of ' + r.total + '</span>' +
      '<button class="btn btn-ghost btn-sm" data-action="quit-game">Stop this round</button></div>' +
      '<div class="tt-game-main">' +
        '<div class="tutor-card plain tt-game-tutor">' + mandy(g.pose, 'char-md') + bubble(g.msg) + '</div>' +
        '<div class="tt-question"><h1 class="tt-equation" aria-label="' + q.a + ' times ' + q.b + ' equals what?"><span>' + q.a + ' × ' + q.b + '</span> <span class="tt-eq">=</span> <span class="tt-q">' + (q.solved ? q.answer : '?') + '</span></h1>' +
        '<div class="tt-answers" role="group" aria-label="Choose an answer">' + btns + '</div>' +
        (q.solved ? '<div class="actions tt-next"><button class="btn btn-secondary" data-action="next-q">Next →</button></div>' : '') + '</div>' +
      '</div></section>';
  }
  function onAnswer(i) {
    var g = V.game, r = g.round, q = r.current();
    var res = r.choose(i);
    if (res.result === 'ignored') return;
    if (res.result === 'wrong') {
      g.msg = line('wrong'); g.pose = 'reassuring';
      render(); announce(q.choices[i].value + ' is not right. ' + g.msg);
      var first = app.querySelector('.tt-answer:not([disabled])'); if (first) first.focus();
      return;
    }
    S.recordAttempt(q.a, q.b, res.tries, r.id);
    g.msg = line(res.tries === 1 ? 'right' : 'rightAfterTry'); g.pose = res.tries === 1 ? 'celebrating' : 'cheering';
    render(); announce('Yes! ' + q.a + ' times ' + q.b + ' is ' + q.answer + '. ' + g.msg);
    var nx = app.querySelector('[data-action="next-q"]'); if (nx) nx.focus();
    g.timer = setTimeout(nextQuestion, 1600);
  }
  function nextQuestion() {
    var g = V.game; if (!g || V.screen !== 'game') return;
    clearTimeout(g.timer); g.timer = null;
    var q = g.round.current(); if (!q || !q.solved) return;
    g.round.next();
    if (g.round.done) { S.finishRound(); V.results = { summary: g.round.summary(), kind: g.kind }; go('results'); return; }
    g.msg = line('gamePrompt'); g.pose = Math.random() < 0.5 ? 'thinking' : 'curious';
    render(true);
  }

  /* ───────── results & progress map ───────── */
  function gridHTML(maxA, maxB, caption) {
    var stats = S.facts(), h = '<div class="tt-grid-wrap"><table class="tt-grid"><caption>' + esc(caption) + '</caption><thead><tr><th scope="col"><span class="sr-only">First number</span>×</th>';
    for (var b = 1; b <= maxB; b++) h += '<th scope="col">' + b + '</th>';
    h += '</tr></thead><tbody>';
    var marks = { strong: ['★', 'strong'], learning: ['•', 'getting there'], practise: ['!', 'practise this one'], 'new': ['', 'not tried yet'] };
    for (var a = 1; a <= maxA; a++) {
      h += '<tr><th scope="row">' + a + '</th>';
      for (var bb = 1; bb <= maxB; bb++) {
        var s = TT.assess(stats[TT.key(a, bb)]).status, m = marks[s];
        h += '<td class="g-' + s + '" title="' + a + ' × ' + bb + ' = ' + (a * bb) + ': ' + m[1] + '"><span class="sr-only">' + a + ' times ' + bb + ' is ' + (a * bb) + ': ' + m[1] + '</span><span aria-hidden="true">' + m[0] + '</span></td>';
      }
      h += '</tr>';
    }
    return h + '</tbody></table></div>' +
      '<ul class="tt-legend"><li><span class="g-strong" aria-hidden="true">★</span> Strong (right first time in 3 rounds in a row)</li><li><span class="g-learning" aria-hidden="true">•</span> Getting there</li><li><span class="g-practise" aria-hidden="true">!</span> Let’s practise this one</li><li><span class="g-new" aria-hidden="true"></span> Not tried yet</li></ul>';
  }
  function resultsHTML() {
    var R = V.results.summary, st = S.active(), set = S.settings();
    var tricky = R.tricky, allRev = TT.revisionFacts(S.facts(), set.maxA, set.maxB);
    var head = R.neededAnotherTry === 0 ? 'Brilliant, ' + st.name + '! You got every one first time.' : 'Well done, ' + st.name + '. You’ve finished this round.';
    var practiseList = tricky.length ? tricky : allRev.slice(0, 6);
    return '<section class="screen tt-results">' + studentBar() +
      '<div class="tutor-card plain">' + mandy(R.neededAnotherTry === 0 ? 'cheering' : 'celebrating', 'char-md') + bubble(head) + '</div>' +
      '<h1 class="tt-title">Round finished</h1>' +
      '<div class="card tt-summary"><ul class="tt-stats">' +
        '<li><strong>' + R.completed + '</strong> questions completed</li>' +
        '<li><strong>' + R.firstTry + '</strong> right on the first try</li>' +
        '<li><strong>' + R.neededAnotherTry + '</strong> needed another try</li>' +
        '<li><strong>' + practiseList.length + '</strong> to practise</li></ul>' +
        (practiseList.length ? '<div class="tt-practise"><div class="tutor-card plain">' + mandy('encouraging', 'char-sm') + bubble('Let’s practise these a little more. Everyone has a few tricky ones!') + '</div>' +
          '<ul class="tt-facts">' + practiseList.map(function (f) { return '<li>' + f.a + ' × ' + f.b + ' = ' + f.answer + '</li>'; }).join('') + '</ul></div>'
          : '<p>Nothing to practise from this round. Try bigger numbers when you feel ready!</p>') +
      '</div>' +
      '<div class="actions tt-result-actions">' +
        '<button class="btn btn-accent btn-lg" data-action="play-again" data-autofocus>Play again</button>' +
        (practiseList.length ? '<button class="btn btn-accent btn-lg" data-action="revise-these">Revise my mistakes</button>' : '') +
        '<button class="btn btn-secondary btn-lg" data-action="setup">Change difficulty</button>' +
        '<button class="btn btn-secondary btn-lg" data-action="flash">Choose another table</button>' +
        '<button class="btn btn-secondary btn-lg" data-action="change-student">Change student</button>' +
        '<button class="btn btn-secondary btn-lg" data-action="menu">Return to menu</button>' +
      '</div>' +
      '<div class="card tt-overview"><h2>Your numbers: 1 × 1 to ' + set.maxA + ' × ' + set.maxB + '</h2>' + gridHTML(set.maxA, set.maxB, 'How you’re doing with these numbers') + '</div>' +
      '</section>';
  }
  function mapHTML() {
    var st = S.active(), rev = TT.revisionFacts(S.facts(), 10, 10);
    return '<section class="screen tt-map">' + studentBar() +
      '<h1 class="tt-title">' + esc(st.name) + '’s times-table map</h1>' +
      '<div class="tutor-card plain">' + mandy('pointing', 'char-md') + bubble(rev.length ? 'Here’s everything we’ve practised. The ones marked ! are worth another go. They’re suggestions, not mistakes!' : 'Here’s everything we’ve practised. A star means you’ve got it right first time in three rounds in a row.') + '</div>' +
      '<div class="card">' + gridHTML(10, 10, 'All facts from 1 × 1 to 10 × 10. Rows are the first number, columns the second.') + '</div>' +
      '<div class="actions">' + (rev.length ? '<button class="btn btn-accent btn-lg" data-action="setup-revise">Revise my tricky ones (' + rev.length + ')</button>' : '') +
      '<button class="btn btn-secondary btn-lg" data-action="menu">Back to menu</button><button class="btn btn-secondary btn-lg" data-action="ask-reset">Reset my progress</button></div></section>';
  }

  /* ───────── confirm dialogs ───────── */
  function dialogHTML() {
    var d = V.dialog; if (!d) return '';
    var title, text, yes;
    if (d.type === 'reset') {
      var who = S.active();
      title = 'Reset ' + who.name + '’s progress?';
      text = 'Are you sure you want to reset your progress? Mandy will forget the questions you have practised and the answers you got wrong. Other students won’t be affected.';
      yes = 'Reset progress';
    } else {
      var s = S.students().filter(function (x) { return x.id === d.id; })[0];
      if (!s) return '';
      title = 'Remove ' + s.name + '?';
      text = 'This deletes ' + s.name + '’s profile and everything Mandy remembers about their practice on this device. It can’t be undone. Other students won’t be affected.';
      yes = 'Remove ' + s.name;
    }
    return '<div class="tt-overlay"><div class="tt-dialog" role="alertdialog" aria-modal="true" aria-labelledby="tt-dlg-t" aria-describedby="tt-dlg-d">' +
      '<div class="tt-dialog-head">' + mandy('reassuring', 'char-sm') + '<h2 id="tt-dlg-t">' + esc(title) + '</h2></div>' +
      '<p id="tt-dlg-d">' + esc(text) + '</p>' +
      '<div class="actions"><button class="btn btn-secondary btn-lg" data-action="dlg-cancel" data-dlg-first>Cancel</button><button class="btn btn-danger btn-lg" data-action="dlg-confirm">' + esc(yes) + '</button></div></div></div>';
  }

  /* ───────── render ───────── */
  function render(newScreen) {
    if (!S.active() && V.screen !== 'welcome') { V.screen = 'welcome'; }
    var html = ({ welcome: welcomeHTML, menu: menuHTML, chant: chantHTML, flash: flashHTML, setup: setupHTML, game: gameHTML, results: resultsHTML, map: mapHTML }[V.screen] || menuHTML)();
    app.innerHTML = html + dialogHTML();
    var scr = app.querySelector('.screen'); if (scr && newScreen && !reduceMotion) scr.classList.add('enter');
    document.body.classList.toggle('tt-dialog-open', !!V.dialog);
    if (V.screen === 'chant') { paintChantLine(); paintChantControls(); }
    if (V.dialog) { var f = app.querySelector('[data-dlg-first]'); if (f) f.focus(); return; }
    if (newScreen) {
      window.scrollTo(0, 0);
      var af = app.querySelector('[data-autofocus]');
      // On touch screens, don't pop the keyboard up uninvited — except on the very first name prompt.
      if (af && (af.tagName !== 'INPUT' || !S.students().length || !matchMedia('(pointer: coarse)').matches)) { try { af.focus({ preventScroll: true }); } catch (e) { af.focus(); } }
      else { var h = app.querySelector('h1, .tt-bubble'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    }
  }

  /* ───────── events ───────── */
  app.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-form="name"]'); if (!f) return;
    e.preventDefault(); submitName(f.querySelector('input').value);
  });
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]'); if (!el || el.disabled) return;
    var a = el.getAttribute('data-action'), n = Number(el.getAttribute('data-n')), v = el.getAttribute('data-v');
    switch (a) {
      case 'pick-student': if (S.select(el.getAttribute('data-id'))) { V.pending = null; V.greeted = false; go('menu'); } break;
      case 'create-anyway': S.createStudent(V.pending.name); V.pending = null; V.greeted = false; go('menu'); break;
      case 'cancel-pending': V.pending = null; render(true); break;
      case 'change-student': S.clearActive(); V.pending = null; V.game = null; go('welcome'); break;
      case 'ask-remove': V.dialog = { type: 'remove', id: el.getAttribute('data-id'), back: el.getAttribute('data-id') }; render(); break;
      case 'ask-reset': V.dialog = { type: 'reset' }; render(); break;
      case 'dlg-cancel': closeDialog(); break;
      case 'dlg-confirm':
        if (V.dialog.type === 'reset') { S.resetProgress(S.activeId); V.dialog = null; announce('Progress reset. Mandy has forgotten your practice history.'); go(V.screen === 'map' ? 'map' : 'menu'); }
        else { var nm = (S.students().filter(function (x) { return x.id === V.dialog.id; })[0] || {}).name; S.removeStudent(V.dialog.id); V.dialog = null; announce((nm || 'That') + ' profile was removed.'); go('welcome'); }
        break;
      case 'menu': go('menu'); break;
      case 'map': go('map'); break;
      case 'chant': chantLoad(); go('chant'); break;
      case 'chant-table': if (n !== V.chant.table) { V.chant.table = n; chantLoad(); render(); var b = app.querySelector('[data-action="chant-table"][data-n="' + n + '"]'); if (b) b.focus(); } break;
      case 'chant-play': chanter.play(); break;
      case 'chant-pause': chanter.pause(); var r1 = app.querySelector('[data-k="resume"]'); if (r1) r1.focus(); break;
      case 'chant-resume': chanter.resume(); var p1 = app.querySelector('[data-k="pause"]'); if (p1) p1.focus(); break;
      case 'chant-stop': chanter.stop(); var pl = app.querySelector('[data-k="play"]'); if (pl) pl.focus(); break;
      case 'chant-restart': chanter.restart(); break;
      case 'slower': case 'faster':
        S.setRate(S.rate + (a === 'faster' ? 0.1 : -0.1));
        var sp = app.querySelector('[data-k="speed"]'); if (sp) sp.textContent = speedLabel();
        break;
      case 'voice-test':
        if (chanter.state === 'playing') chanter.pause();
        Voice.sayTest('Hello! I’m Mandy. Let’s chant our times tables together!', S.rate, function () { paintChantControls(); });
        break;
      case 'flash': if (!V.flash.deck.length || V.flash.deck[0].a !== V.flash.table) flashReset(); go('flash'); break;
      case 'flash-table': V.flash.table = n; flashReset(); render(); break;
      case 'flash-order': V.flash.order = v; flashReset(); render(); break;
      case 'flash-reveal': if (!V.flash.revealed) { V.flash.revealed = true; V.flash.msg = line('flashReveal'); var c = V.flash.deck[V.flash.i]; render(); announce(c.a + ' times ' + c.b + ' equals ' + c.answer + '. ' + V.flash.msg); var nx = app.querySelector('[data-action="flash-next"]:not([disabled])') || app.querySelector('[data-action="flash-restart"]'); if (nx) nx.focus(); } break;
      case 'flash-next': if (V.flash.i < V.flash.deck.length - 1) { V.flash.i++; V.flash.revealed = false; V.flash.msg = line('flashThink'); render(); focusSel('[data-k="reveal"]'); } break;
      case 'flash-prev': if (V.flash.i > 0) { V.flash.i--; V.flash.revealed = false; V.flash.msg = line('flashThink'); render(); focusSel('[data-k="reveal"]'); } break;
      case 'flash-shuffle': flashReset(true); render(); announce('Cards shuffled.'); focusSel('[data-k="reveal"]'); break;
      case 'flash-restart': flashReset(); render(); announce('Back to the first card.'); focusSel('[data-k="reveal"]'); break;
      case 'setup': go('setup'); break;
      case 'setup-revise': go('setup', { kind: 'revise' }); break;
      case 'max-a': S.setSettings({ maxA: n }); keepFocusRender(el); break;
      case 'max-b': S.setSettings({ maxB: n }); keepFocusRender(el); break;
      case 'count': S.setSettings({ count: Number(v) }); keepFocusRender(el); break;
      case 'order': S.setSettings({ order: v }); keepFocusRender(el); break;
      case 'kind': V.arg = { kind: v }; keepFocusRender(el); break;
      case 'start-game': startGame(V.setupKind || 'practise'); break;
      case 'answer': if (V.game) onAnswer(Number(el.getAttribute('data-i'))); break;
      case 'next-q': nextQuestion(); break;
      case 'quit-game': if (V.game && V.game.timer) clearTimeout(V.game.timer); V.game = null; go('menu'); break;
      case 'play-again': startGame(V.results.kind === 'focus' ? 'practise' : V.results.kind); break;
      case 'revise-these': {
        var R = V.results.summary, set = S.settings();
        var list = R.tricky.length ? R.tricky : TT.revisionFacts(S.facts(), set.maxA, set.maxB).slice(0, 6);
        startGame('focus', list);
        break;
      }
    }
  });
  function focusSel(sel) { var x = app.querySelector(sel); if (x) x.focus(); }
  function keepFocusRender(el) {
    var sel = '[data-action="' + el.getAttribute('data-action') + '"][' + (el.hasAttribute('data-n') ? 'data-n="' + el.getAttribute('data-n') : 'data-v="' + el.getAttribute('data-v')) + '"]';
    render(); focusSel(sel);
  }
  function closeDialog() { var back = V.dialog && V.dialog.back; V.dialog = null; render(); if (back) focusSel('[data-action="ask-remove"][data-id="' + back + '"]'); else focusSel('[data-action="ask-reset"]'); }
  document.addEventListener('keydown', function (e) {
    if (V.dialog && e.key === 'Escape') { e.preventDefault(); closeDialog(); return; }
    if (V.dialog && e.key === 'Tab') { // keep focus inside the dialog
      var f = app.querySelectorAll('.tt-dialog button'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // Stop talking when the page is hidden or left.
  document.addEventListener('visibilitychange', function () { if (document.hidden && chanter.state === 'playing') chanter.pause(); });
  window.addEventListener('pagehide', function () { chanter.stop(); Voice.cancelAll(); });

  // Test hook (read-only view of state; used by the browser tests).
  window.__tt = { V: V, S: S, TT: TT, chanter: chanter, go: go };

  go(S.active() ? 'menu' : 'welcome');
})();
