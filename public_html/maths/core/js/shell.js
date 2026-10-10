/* Arithmetic Gang — the shared lesson shell.
 * Screens (welcome, levels, level page, lesson, result, progress), the learn → guided → practice → mastery flow,
 * keypad, hints, feedback and progress. Each character plugs in a "subject" with its own curriculum,
 * step-by-step engine output, board renderer and dialogue.
 *
 * Step contract (produced by every engine):
 *   { kind: 'entry', expected: '24', allowDot?, ... }   learner types digits, presses Done
 *   { kind: 'choice', choices: [{ label, correct }], ... } learner taps a button
 *   guidedOnly: true → shown only while the character is guiding (skipped in practice and mastery)
 */
(function () {
  'use strict';
  var Facts = window.ArithFacts;

  function start(subject) {
    var C = subject.C, D = subject.D, CH = subject.char;
    var storage = (function () { try { var s = window.localStorage, k = '__arith_t'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; } })();
    var profile = window.ArithProfile.create(storage);
    var P = window.ArithProgress.create(storage, subject.storageKey, C).load();
    var app = document.getElementById('app');
    var live = document.getElementById('live');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var S = null, screen = '', screenArg = null, hubMsg = null, confirmReset = false;
    var last = {};

    /* ───────────── helpers ───────────── */
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function pick(key, list) {
      var opts = list.filter(function (x) { return x !== last[key]; });
      var v = opts[Math.floor(Math.random() * opts.length)] || list[0];
      last[key] = v; return v;
    }
    function withName(t) { return profile.name && Math.random() < 0.35 ? t.replace(/!$/, ', ' + profile.name + '!') : t; }
    var POSES = ['waving', 'thinking', 'pointing', 'curious', 'encouraging', 'celebrating', 'cheering', 'reassuring', 'neutral'];
    function charImg(pose, cls, who) {
      who = who || CH.key;
      if (POSES.indexOf(pose) < 0) pose = 'neutral';
      return '<img class="char ' + (cls || '') + '" src="/maths/assets/gang/' + who + '/' + pose + '.webp" alt="" width="240" height="240" decoding="async"' +
        ' onerror="this.onerror=null;this.src=\'/maths/assets/gang/placeholder-' + who + '.svg\'">';
    }
    function announce(text) { if (!live) return; live.textContent = ''; setTimeout(function () { live.textContent = text; }, 40); }
    function paras(t) { return '<p>' + esc(t).split('\n').join('</p><p>') + '</p>'; }
    function starsHTML(n, big) {
      var out = '<span class="stars' + (big ? ' stars-big' : '') + '" role="img" aria-label="' + n + ' of 3 stars">';
      for (var i = 0; i < 3; i++) out += '<svg viewBox="0 0 24 24" aria-hidden="true" class="star' + (i < n ? ' on' : '') + '"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
      return out + '</span>';
    }
    var LOCK = '<svg viewBox="0 0 24 24" class="lock" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
    var CHECK = '<svg viewBox="0 0 24 24" class="tick" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var actx = null;
    function sound(kind) {
      if (!profile.sound) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        var notes = kind === 'win' ? [523, 659, 784, 1047] : kind === 'step' ? [660] : kind === 'done' ? [523, 784] : [330];
        notes.forEach(function (f, i) {
          var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.09;
          o.frequency.value = f; o.type = 'sine';
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.2);
        });
      } catch (e) { /* no audio */ }
    }
    function confetti() {
      if (reduceMotion) return;
      var box = document.createElement('div');
      box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
      var colors = ['var(--accent)', '#f27ba1', '#5b9df9', '#ffc94d', '#3cc48a'];
      for (var i = 0; i < 16; i++) {
        var s = document.createElement('span');
        s.style.left = (10 + Math.random() * 80) + '%';
        s.style.background = colors[i % colors.length];
        s.style.animationDelay = (Math.random() * 0.25) + 's';
        s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
        s.style.setProperty('--rot', (Math.random() * 540) + 'deg');
        box.appendChild(s);
      }
      document.body.appendChild(box);
      setTimeout(function () { box.remove(); }, 1600);
    }

    /* ───────────── navigation ───────────── */
    function go(name, arg) {
      screen = name; screenArg = arg;
      if (name === 'hub') hubMsg = null;
      render();
      var sc = app.querySelector('.screen'); if (sc) sc.classList.add('enter');
      var h = app.querySelector('[data-autofocus]') || app.querySelector('h1, h2');
      if (h) { if (!h.hasAttribute('tabindex') && !/^(BUTTON|INPUT|A)$/.test(h.tagName)) h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      window.scrollTo(0, 0);
    }
    function render() {
      var focusKey = document.activeElement && document.activeElement.getAttribute('data-k');
      var html;
      if (subject.screens && subject.screens[screen]) html = subject.screens[screen](api, screenArg);
      else html = ({ welcome: welcomeHTML, hub: hubHTML, level: levelHTML, lesson: lessonHTML, result: resultHTML, progress: progressHTML }[screen] || hubHTML)(screenArg);
      app.innerHTML = html;
      if (focusKey) { var el = app.querySelector('[data-k="' + focusKey + '"]'); if (el && !el.disabled) el.focus({ preventScroll: true }); }
    }

    /* ───────────── welcome ───────────── */
    function welcomeHTML() {
      return '<section class="screen welcome">' +
        '<div class="welcome-card">' +
          '<div class="welcome-art">' + charImg('waving', 'char-xl') + '</div>' +
          '<div class="welcome-body">' +
            '<h1 class="logo">' + esc(CH.name) + ' <span>the ' + esc(CH.role) + '</span></h1>' +
            '<div class="bubble bubble-left">' + paras(D.welcome(profile.name)) + '</div>' +
            '<form class="name-form" data-action="welcome-go">' +
              '<label for="learner-name">Your name <span class="muted">(optional)</span></label>' +
              '<div class="name-row"><input id="learner-name" name="name" maxlength="24" autocomplete="off" value="' + esc(profile.name) + '" placeholder="Type your name">' +
              '<button class="btn btn-accent btn-lg" type="submit" data-autofocus>Let’s Go!</button></div>' +
            '</form>' +
            '<p class="muted small">You’ll work through ' + C.LEVELS.length + ' levels, step by step. You can go back to any level you’ve finished whenever you like. Your name and progress are saved in this browser only, and shared with the rest of the Arithmetic Gang.</p>' +
          '</div>' +
        '</div></section>';
    }

    /* ───────────── hub ───────────── */
    function nextLevel() {
      for (var i = 0; i < C.LEVELS.length; i++) if (!P.level(C.LEVELS[i].id).mastered) return C.LEVELS[i];
      return null;
    }
    function hubGreeting(t, nl) {
      var hi = profile.name ? 'Hi ' + profile.name + '!' : 'Hi there!';
      if (!t.attempts) return { pose: 'waving', text: hi + ' Let’s start with Level 1. You can come back to any level you’ve done whenever you like.' };
      if (!nl) return { pose: 'cheering', text: hi + ' You’ve mastered every level. Amazing! Practise any level or try a challenge to stay sharp.' };
      return { pose: 'encouraging', text: hi + ' ' + pick('hub', ['You’ve been practising hard. Look how much you’ve learned!', 'Ready for a new challenge?', 'Welcome back! Shall we carry on?', 'Every sum makes you a little bit stronger.']) + ' Next up: Level ' + nl.id + '.' };
    }
    function hubHTML() {
      var t = P.totals(), nl = nextLevel();
      var m = hubMsg || hubGreeting(t, nl);
      hubMsg = m;
      var pct = Math.round(t.mastered / t.levels * 100);
      var cards = C.LEVELS.map(function (L) {
        var lv = P.level(L.id), unlocked = P.isUnlocked(L.id), stars = P.stars(L.id);
        var state = lv.mastered ? 'mastered' : unlocked ? (lv.attempts ? 'started' : 'open') : 'locked';
        var label = 'Level ' + L.id + ': ' + L.short + ', ' + L.sub + '. ' + (state === 'locked' ? 'Locked. Pass the Level ' + (L.id - 1) + ' mastery check to unlock it.' : stars + ' of 3 stars' + (lv.mastered ? ', mastered.' : '.'));
        return '<li><button class="level-card lv-' + state + (nl && nl.id === L.id ? ' is-next' : '') + '" data-action="open-level" data-id="' + L.id + '" data-k="lvl' + L.id + '" aria-label="' + esc(label) + '"' + (state === 'locked' ? ' aria-disabled="true"' : '') + '>' +
          '<span class="lv-num">' + L.id + '</span><span class="lv-name">' + esc(L.short) + '</span><span class="lv-sub">' + esc(L.sub) + '</span>' +
          (state === 'locked' ? LOCK : starsHTML(stars)) +
          (lv.mastered ? '<span class="lv-badge">Mastered</span>' : nl && nl.id === L.id ? '<span class="lv-badge lv-badge-next">Up next</span>' : '') +
        '</button></li>';
      }).join('');
      return '<section class="screen hub">' +
        '<div class="hub-head"><h1>' + esc(subject.title) + '</h1><div class="hub-tools">' +
          '<a class="btn btn-secondary" href="/maths/">The Gang</a>' +
          '<button class="btn btn-secondary" data-action="progress" data-k="prog">My progress</button>' +
          '<button class="btn btn-secondary" data-action="toggle-sound" data-k="snd" aria-pressed="' + (profile.sound ? 'true' : 'false') + '">Sound: ' + (profile.sound ? 'on' : 'off') + '</button>' +
        '</div></div>' +
        '<div class="tutor-card">' + charImg(m.pose, 'char-md') + '<div class="bubble bubble-left">' + paras(m.text) +
          (nl ? '<button class="btn btn-accent" data-action="open-level" data-id="' + nl.id + '" data-k="cont">' + (t.attempts ? 'Carry on with Level ' + nl.id : 'Start Level 1') + ' →</button>' : '') +
        '</div></div>' +
        (subject.hubExtras ? subject.hubExtras(api) : '') +
        '<div class="overall"><div class="overall-label"><strong>' + t.mastered + ' of ' + t.levels + ' levels mastered</strong><span class="muted">' + t.correct + ' solved</span></div>' +
          '<div class="bar" role="progressbar" aria-label="Levels mastered" aria-valuemin="0" aria-valuemax="' + t.levels + '" aria-valuenow="' + t.mastered + '"><span style="width:' + pct + '%"></span></div></div>' +
        '<h2 class="sr-only">Levels</h2><ol class="level-grid">' + cards + '</ol>' +
        '<p class="muted small center">Locked levels open when you pass the mastery check on the level before. Finished levels always stay open.</p>' +
      '</section>';
    }

    /* ───────────── level page ───────────── */
    function levelHTML(id) {
      var L = C.getLevel(id), lv = P.level(id);
      var phases = [['Learn how to do it', lv.learned], ['Practise with my help', lv.learned], ['Try some on your own', lv.practised], ['Pass the mastery check', lv.mastered]];
      var list = phases.map(function (p) { return '<li class="' + (p[1] ? 'done' : '') + '">' + (p[1] ? CHECK : '<span class="dot-todo" aria-hidden="true"></span>') + '<span>' + p[0] + (p[1] ? '<span class="sr-only"> (done)</span>' : '') + '</span></li>'; }).join('');
      var weak = P.weakestSkill(id);
      var actions = '<button class="btn btn-accent btn-lg" data-action="start" data-mode="lesson" data-id="' + id + '" data-autofocus data-k="start">' + (lv.learned ? 'Watch the lesson again' : 'Start the lesson') + ' →</button>';
      if (lv.learned) actions += '<button class="btn btn-secondary btn-lg" data-action="start" data-mode="practice" data-id="' + id + '" data-k="prac">Practise' + (weak ? ' (' + esc(weak) + ')' : '') + '</button>';
      if (lv.learned && !lv.mastered) actions += '<button class="btn btn-secondary btn-lg" data-action="start" data-mode="check" data-id="' + id + '" data-k="chk">Take the mastery check</button>';
      if (lv.mastered) actions += '<button class="btn btn-secondary btn-lg" data-action="start" data-mode="challenge" data-id="' + id + '" data-k="chal">Challenge (no hints)</button>';
      var stats = lv.attempts ? '<p class="muted small">So far: ' + lv.correct + ' solved, ' + lv.independent + ' all by yourself, ' + lv.hints + ' hint' + (lv.hints === 1 ? '' : 's') + ' used.' +
        (lv.lastMastery ? ' Last mastery check: ' + lv.lastMastery.correct + '/' + lv.lastMastery.total + '.' : '') + '</p>' : '';
      return '<section class="screen level-page">' +
        '<div class="crumb"><button class="btn btn-ghost" data-action="hub" data-k="back">← All levels</button></div>' +
        '<div class="level-hero"><div class="level-hero-text"><p class="eyebrow">Level ' + L.id + ' of ' + C.LEVELS.length + '</p>' +
          '<h1>' + esc(L.short) + ' <span class="muted-h">(' + esc(L.sub) + ')</span></h1>' + starsHTML(P.stars(id), true) +
          '<div class="tutor-card plain">' + charImg('pointing', 'char-md') + '<div class="bubble bubble-left">' + paras(L.intro.join(' ')) + '</div></div>' +
          '<div class="actions">' + actions + '</div>' + stats + '</div>' +
          '<div class="card checklist"><h2>In this level you will</h2><ul>' + list + '</ul><p class="objective"><strong>Goal:</strong> ' + esc(L.objective) + '</p></div>' +
        '</div></section>';
    }

    /* ───────────── sessions ───────────── */
    var PLANS = { lesson: ['learn', 'guided', 'practice', 'mastery'], practice: ['practice'], check: ['mastery'], challenge: ['mastery'], more: ['practice', 'mastery'] };

    function startSession(id, mode) {
      var L = C.getLevel(id);
      P.setCurrent(id);
      S = { kind: 'level', level: L, mode: mode, plan: PLANS[mode], pi: 0, results: [], stack: [], extra: 0, flyingOffered: false };
      startPhase();
      go('lesson');
    }
    /** Drill sessions (times tables, diagnostic): a queue of facts with custom start/end handling. */
    function startDrill(cfg) {
      S = { kind: 'drill', cfg: cfg, mode: 'drill', plan: ['drill'], pi: 0, results: [], stack: [], extra: 0, flyingOffered: true, level: cfg.level || C.LEVELS[0] };
      S.queue = cfg.items.map(function (sol) { return { sol: sol, guided: false, drill: true }; });
      S.qi = 0; S.q = null; S.demo = null;
      S.inter = cfg.intro ? { msg: cfg.intro, actions: [['begin', cfg.introButton || 'Let’s go!']] } : null;
      if (!S.inter) startQuestion();
      go('lesson');
    }
    function phase() { return S.plan[S.pi]; }
    function startPhase() {
      var L = S.level, ph = phase();
      S.qi = 0; S.results = []; S.q = null; S.inter = null; S.demo = null;
      if (ph === 'learn') { S.demo = { sol: C.exampleSet(L)[0], d: -2 }; S.queue = []; return; }
      if (ph === 'guided') {
        S.queue = C.exampleSet(L).slice(0, L.config.guided).map(function (sol) { return { sol: sol, guided: true }; });
      } else if (ph === 'practice') {
        var weak = P.weakestSkill(L.id), avoid = {};
        C.exampleSet(L).forEach(function (q) { avoid[q.key] = true; });
        S.queue = C.buildSet(L, L.config.practice, weak ? { focus: weak, avoid: avoid } : { progressive: true, avoid: avoid }).map(function (sol) { return { sol: sol, guided: false }; });
        S.inter = { msg: { pose: 'encouraging', text: 'Now it’s your turn! I’ll help less this time. If you get stuck, press Hint.' }, actions: [['begin', 'Let’s go!']] };
      } else if (ph === 'mastery') {
        S.queue = C.buildSet(L, L.config.mastery).map(function (sol) { return { sol: sol, mastery: true }; });
        var n = L.config.mastery;
        S.inter = { msg: { pose: 'encouraging', text: (S.mode === 'challenge' ? 'Challenge time! ' : 'Mastery check! ') + n + ' questions, no hints. Work through every step carefully. A question counts when every step is right first time. You’ve got this!' },
          actions: [['begin', S.mode === 'challenge' ? 'Start the challenge' : 'Start the check']] };
      }
      if (!S.inter) startQuestion();
    }
    function startQuestion() {
      var item = S.queue[S.qi];
      S.inter = null;
      S.q = { sol: item.sol, guided: !!item.guided, mastery: !!item.mastery, drill: !!item.drill, si: 0, entry: '', attempts: 0, hintLvl: 0, hints: 0,
        revealed: false, errors: 0, done: false, removed: {}, fresh: null, msg: null, actions: [] };
      skipAuto();
      promptForStep(S.qi === 0 && phase() === 'guided' ? 'Now let’s try some together. I’ll help with every step.\n' : '');
    }
    function curStep() { return S.q.sol.steps[S.q.si]; }
    function skipAuto() { while (!S.q.guided && S.q.si < S.q.sol.steps.length && curStep().guidedOnly) S.q.si++; }
    function setMsg(m, actions, prefix) {
      S.q.msg = { pose: m.pose || 'neutral', text: (prefix || '') + m.text };
      S.q.actions = actions || [];
      announce(S.q.msg.text);
    }
    function promptFor(st, q) {
      if (q.sol.format === 'fact') return { pose: q.guided ? 'pointing' : 'thinking', text: Facts.D.prompt(q.sol, q.guided) };
      var m = D.prompt(st, q.guided, q.sol);
      if (q.mastery && st.kind === 'entry') m = { pose: 'thinking', text: D.prompt(st, false, q.sol).text };
      return m;
    }
    function promptForStep(prefix) {
      var q = S.q, st = curStep();
      var acts = [];
      if (st.kind === 'choice') st.choices.forEach(function (c, i) { if (!q.removed[i]) acts.push(['choice', c.label, i]); });
      setMsg(promptFor(st, q), acts, prefix);
    }
    function entryMax(st) { return st.expected.length === 1 ? 1 : st.expected.length + 1; }
    function press(d) {
      if (screen !== 'lesson' || !S || !S.q || S.q.done || S.inter || S.demo) return;
      var q = S.q, st = curStep();
      if (st.kind !== 'entry') { setMsg({ pose: 'curious', text: 'Use the buttons to choose.' }, q.actions); render(); return; }
      if (d === '.') { if (!st.allowDot || q.entry.indexOf('.') >= 0) return; q.entry = (q.entry || '0') + '.'; render(); return; }
      if (entryMax(st) === 1) q.entry = d;
      else if (q.entry.length < entryMax(st)) q.entry += d;
      render();
    }
    function backspace() { if (!S || !S.q || S.q.done || S.inter || S.demo) return; S.q.entry = S.q.entry.slice(0, -1); render(); }
    function clearEntry() { if (!S || !S.q || S.q.done || S.inter || S.demo) return; S.q.entry = ''; render(); }
    function norm(s) { s = String(s); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, ''); s = s.replace(/^0+(?=\d)/, ''); return s; }
    function done() {
      if (screen !== 'lesson' || !S || S.inter || S.demo) return;
      var q = S.q; if (!q) return;
      if (q.done) return nextQuestion();
      var st = curStep();
      if (st.kind !== 'entry') return;
      if (q.entry === '') { setMsg({ pose: 'thinking', text: 'Type a number on the keypad first, then press Done.' }, q.actions); render(); return; }
      if (norm(q.entry) === norm(st.expected)) { stepCorrect(); return; }
      q.attempts++; q.errors++;
      var entry = q.entry; q.entry = '';
      sound('oops');
      if (q.mastery || q.drill && S.cfg && S.cfg.noHints) {
        if (q.attempts >= (S.cfg && S.cfg.oneShot ? 1 : 2)) { q.revealed = true; stepCorrect(true); return; }
        setMsg({ pose: 'reassuring', text: 'Not quite. Have another careful look.' }, []); render(); return;
      }
      var acts = [];
      if (q.attempts >= 3 || (!q.guided && q.attempts >= 2)) acts.push(['reveal', 'Show me']);
      if (!q.guided && q.attempts === 1) acts.push(['hint', 'Give me a hint']);
      var text;
      if (q.sol.format === 'fact') text = Facts.D.wrong(q.sol, entry) + (q.attempts >= 2 ? ' ' + Facts.D.hint(q.sol, Math.min(2, q.attempts - 1)) : ' Have another go.');
      else {
        var lvl = q.guided ? q.attempts : Math.max(1, q.attempts - 1);
        text = D.wrong(st, entry, lvl, q.sol);
        if (!q.guided && q.attempts === 1) text = text.split(/(?<=[.!?])\s/)[0] + ' Have another go.';
        else if (lvl >= 3) text += ' This is a tricky bit. Would you like me to show you?';
        else text += ' ' + D.hint(st, Math.min(2, lvl), q.sol);
      }
      setMsg({ pose: 'reassuring', text: withName(text) }, acts);
      render();
    }
    function choose(i) {
      var q = S.q, st = curStep(), c = st.choices[i];
      if (!c) return;
      if (c.correct) { stepCorrect(); return; }
      q.removed[i] = true;
      var acts = []; st.choices.forEach(function (cc, j) { if (!q.removed[j]) acts.push(['choice', cc.label, j]); });
      setMsg(D.choiceWrong(st, i, q.sol), acts);
      render();
    }
    var PRAISE = ['That’s right!', 'Great job!', 'Spot on!', 'Yes!', 'Brilliant!', 'Nice work!', 'Exactly!', 'Super!'];
    function stepCorrect(revealed) {
      var q = S.q, st = curStep();
      var after = q.sol.format === 'fact' ? '' : (D.afterStep(st, q.guided, q.sol) || '');
      var lead = '';
      if (revealed) lead = (q.sol.format === 'fact' ? Facts.D.reveal(q.sol) : D.reveal(st, q.sol)) + (q.mastery ? ' Keep going!' : '');
      else if (q.guided) lead = withName(pick('praise', PRAISE)) + (after ? ' ' + after : '');
      else lead = after;
      q.fresh = st; q.si++; q.entry = ''; q.attempts = 0; q.hintLvl = 0; q.removed = {};
      skipAuto();
      if (!revealed) sound('step');
      if (q.si >= q.sol.steps.length) return finishQuestion(revealed ? lead : '');
      promptForStep(lead ? lead + '\n' : '');
      render();
    }
    function finishQuestion(prefix) {
      var q = S.q;
      q.done = true;
      var independent = !q.guided && !q.hints && !q.revealed && !q.errors;
      var correct = q.mastery ? q.errors === 0 : !q.revealed;
      if (S.kind === 'drill') { if (S.cfg.onAnswer) S.cfg.onAnswer(q.sol, q.errors === 0 && !q.hints); }
      else P.recordQuestion(S.level.id, { label: q.sol.profile ? q.sol.profile.label : 'all', correct: correct, independent: independent, hints: q.hints + (q.revealed ? 1 : 0) });
      S.results.push({ independent: independent, correct: correct, sol: q.sol, firstTry: q.errors === 0 && !q.hints });
      var nextLabel = S.qi + 1 < S.queue.length ? 'Next question →' : 'Continue →';
      var text;
      if (q.mastery) {
        text = correct ? withName(pick('mr', ['Correct!', 'That’s right!', 'Spot on!', 'Yes! Well done!'])) + ' ' + q.sol.answerText + ' is the answer.'
          : 'You finished it! There was a slip along the way, so this one doesn’t count, but you know how to fix it now. The answer is ' + q.sol.answerText + '.';
        setMsg({ pose: correct ? 'encouraging' : 'reassuring', text: text }, [['next', nextLabel]]);
        sound(correct ? 'done' : 'oops'); render(); return;
      }
      if (S.kind === 'drill') {
        var ok = q.errors === 0 && !q.revealed;
        text = ok ? withName(pick('dr', ['Correct!', 'Yes!', 'Brilliant!', 'Spot on!', 'You know it!'])) + ' ' + Facts.D.finish(q.sol)
          : q.revealed ? 'Not quite. ' + Facts.D.reveal(q.sol) + ' Let\u2019s remember that one!' : 'You got there! ' + Facts.D.finish(q.sol);
        setMsg({ pose: ok ? 'celebrating' : 'reassuring', text: text }, [['next', nextLabel]]);
        sound(ok ? 'done' : 'oops'); render(); return;
      }
      var fin = withName(pick('fin', ['Fantastic! You did it!', 'Brilliant!', 'Wonderful work!', 'You got it!', 'Super job!']));
      var body = q.sol.format === 'fact' ? Facts.D.finish(q.sol) : D.finish(q.sol, independent);
      if (independent && S.kind !== 'drill') body += ' And you did it all by yourself!';
      var after = '';
      if (S.kind === 'level' && phase() === 'practice' && (q.errors >= 2 || q.revealed) && S.extra < 2) {
        var avoid = {}; S.queue.forEach(function (it) { avoid[it.sol.key] = true; });
        S.queue.splice(S.qi + 1, 0, { sol: C.generate(q.sol.profile, { avoid: avoid }), guided: true });
        S.extra++;
        after = '\nThat one was tricky. Don’t worry, let’s do the next one together.';
      }
      setMsg({ pose: 'celebrating', text: (prefix ? prefix + '\n' : '') + fin + ' ' + body + after }, [['next', nextLabel]]);
      sound('done'); confetti(); render();
    }
    function nextQuestion() {
      var ph = phase();
      if (S.kind === 'level' && ph === 'practice' && S.mode === 'lesson' && !S.flyingOffered && S.results.length >= 3) {
        if (S.results.slice(-3).every(function (r) { return r.independent; }) && S.qi + 1 < S.queue.length) {
          S.flyingOffered = true;
          S.inter = { msg: { pose: 'encouraging', text: 'You’re flying! You’ve done those all by yourself. Ready to show me with a mastery check, or do you want more practice?' },
            actions: [['skip-to-mastery', 'Yes, check me!'], ['begin-next', 'Keep practising']] };
          render(); announce(S.inter.msg.text); return;
        }
      }
      S.qi++;
      if (S.qi < S.queue.length) { startQuestion(); render(); focusKeypad(); return; }
      endPhase();
    }
    function endPhase() {
      if (S.kind === 'drill') { var r = S.cfg.onEnd(api, S.results); if (r === 'more') return; return; }
      var ph = phase(), L = S.level;
      if (ph === 'guided') P.markPhase(L.id, 'learned');
      if (ph === 'practice') P.markPhase(L.id, 'practised');
      if (ph === 'mastery') {
        var correct = S.results.filter(function (r) { return r.correct; }).length, total = S.results.length;
        if (S.mode === 'challenge') { S.result = { kind: 'challenge', correct: correct, total: total }; return go('result'); }
        var before = P.level(L.id).masteryBest;
        var passed = P.recordMastery(L.id, correct, total);
        S.result = { kind: 'mastery', passed: passed, correct: correct, total: total, improved: !passed && total && correct / total > before && P.level(L.id).masteryAttempts > 1 };
        if (passed) sound('win');
        return go('result');
      }
      if (S.pi + 1 < S.plan.length) { S.pi++; startPhase(); render(); focusFirstAction(); return; }
      var ind = S.results.filter(function (r) { return r.independent; }).length;
      var acts = [['practise-again', 'Practise 5 more']];
      if (!P.level(L.id).mastered) acts.push(['goto-check', 'Take the mastery check']);
      acts.push(['level', 'Back to the level']);
      S.inter = { msg: { pose: 'encouraging', text: 'Great practising! You did ' + ind + ' of ' + S.results.length + ' all by yourself.' + (ind === S.results.length ? ' That’s brilliant!' : ' Every one makes you stronger.') }, actions: acts };
      render(); announce(S.inter.msg.text); focusFirstAction();
    }
    function showInter(msg, actions) { S.q = null; S.inter = { msg: msg, actions: actions }; render(); announce(msg.text); focusFirstAction(); }

    /* demonstrations */
    function demoMsg(dm) {
      var sol = dm.sol, len = sol.steps.length;
      if (dm.d === -1) return sol.format === 'fact' ? { pose: 'pointing', text: 'Here’s our question: ' + sol.a + ' ' + Facts.SYM[sol.op] + ' ' + sol.b + '. ' + Facts.D.hint(sol, 1) } : D.demoStart(sol);
      if (dm.d < len) return sol.format === 'fact' ? { pose: 'pointing', text: Facts.D.finish(sol) } : D.demoStep(sol.steps[dm.d], sol);
      return { pose: 'celebrating', text: (sol.format === 'fact' ? Facts.D.finish(sol) : 'So the answer is ' + sol.answerText + '.') + (dm.replay ? ' Now back to yours!' : ' Now let’s try it together!') };
    }
    function replay() {
      if (S.demo && !S.demo.replay) { S.demo.d = -1; render(); return; }
      S.stack.push({ q: S.q, inter: S.inter });
      S.demo = { sol: C.exampleSet(S.level)[0], d: -1, replay: true };
      S.inter = null; render();
    }
    function endReplay() { var st = S.stack.pop(); S.q = st.q; S.inter = st.inter; S.demo = null; if (S.q && S.q.msg) announce(S.q.msg.text); render(); }

    /* ───────────── lesson rendering ───────────── */
    function board(sol, view) { return sol.format === 'fact' ? Facts.board(sol, view) : subject.board(sol, view); }
    function keypadHTML(disabled) {
      var k = '';
      for (var i = 1; i <= 9; i++) k += '<button class="key" data-action="key" data-d="' + i + '" data-k="k' + i + '"' + (disabled ? ' disabled' : '') + '>' + i + '</button>';
      k += '<button class="key key-back" data-action="backspace" data-k="kb" aria-label="Delete"' + (disabled ? ' disabled' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 9.5l5 5M17 9.5l-5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>';
      k += '<button class="key" data-action="key" data-d="0" data-k="k0"' + (disabled ? ' disabled' : '') + '>0</button>';
      k += '<button class="key key-done" data-action="done" data-k="kd"' + (disabled ? ' disabled' : '') + '>Done</button>';
      var dotOK = S.q && !S.q.done && curStep() && curStep().allowDot;
      k += '<button class="key key-small key-clear" data-action="clear" data-k="kc"' + (disabled ? ' disabled' : '') + '>Clear</button>';
      if (subject.keypadDot) k += '<button class="key key-small" data-action="key" data-d="." data-k="kdot" aria-label="Decimal point"' + (disabled || !dotOK ? ' disabled' : '') + '>.</button>';
      return '<div class="keypad' + (subject.keypadDot ? ' has-dot' : '') + '" role="group" aria-label="Number keypad">' + k + '</div>';
    }
    function actionsHTML(acts) {
      if (!acts || !acts.length) return '';
      return '<div class="bubble-actions">' + acts.map(function (a, i) {
        return '<button class="btn ' + (i === 0 ? 'btn-accent' : 'btn-secondary') + '" data-action="' + a[0] + '"' + (a[2] !== undefined ? ' data-i="' + a[2] + '"' : '') + ' data-k="act-' + a[0] + (a[2] !== undefined ? a[2] : '') + '">' + esc(a[1]) + '</button>';
      }).join('') + '</div>';
    }
    function modeInfo() {
      if (S.kind === 'drill') return ['practice', S.cfg.chip || 'Practice'];
      var ph = phase();
      if (S.demo) return ['learn', S.demo.replay ? 'Replay' : 'Learn'];
      if (S.q && S.q.guided && ph === 'practice') return ['guided', 'Practise together'];
      return { guided: ['guided', 'Guided practice'], practice: ['practice', 'Your turn'], mastery: S.mode === 'challenge' ? ['challenge', 'Challenge'] : ['mastery', 'Mastery check'] }[ph];
    }
    function dotsHTML() {
      if (S.demo || !S.queue || !S.queue.length) return '';
      var n = S.queue.length, cur = Math.min(S.qi + 1, n);
      var out = '<div class="dots" role="img" aria-label="Question ' + cur + ' of ' + n + '">';
      if (n <= 12) for (var i = 0; i < n; i++) out += '<span class="' + (i < S.qi || (i === S.qi && S.q && S.q.done) ? 'd-done' : i === S.qi ? 'd-now' : '') + '"></span>';
      return out + '<span class="dots-n" aria-hidden="true">' + cur + '/' + n + '</span></div>';
    }
    function lessonHTML() {
      var mi = modeInfo();
      var title = S.kind === 'drill' ? esc(S.cfg.title) : 'Level ' + S.level.id + ': ' + esc(S.level.short) + ' <span class="muted">(' + esc(S.level.sub) + ')</span>';
      var canHint = S.q && !S.q.mastery && !S.q.done && !S.demo && !S.inter && curStep() && curStep().kind === 'entry' && !(S.cfg && S.cfg.noHints);
      var bar = '<div class="lesson-bar">' +
        '<button class="icon-btn" data-action="leave" data-k="leave" aria-label="Leave and go back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<div class="lesson-title"><span class="mode-chip mode-' + mi[0] + '">' + mi[1] + '</span><span class="lt-text">' + title + '</span></div>' + dotsHTML() +
        '<div class="bar-tools">' +
          (S.q && !S.q.mastery && !S.demo && !(S.cfg && S.cfg.noHints) ? '<button class="btn btn-secondary btn-sm" data-action="hint" data-k="hint"' + (canHint ? '' : ' disabled') + '>Hint</button>' : '') +
          (S.kind === 'level' && S.mode !== 'challenge' && !(S.q && S.q.mastery) ? '<button class="btn btn-secondary btn-sm" data-action="replay" data-k="replay">' + (S.demo && !S.demo.replay ? 'Replay' : 'Replay lesson') + '</button>' : '') +
        '</div></div>';
      var msg, acts, bd = '', keypad = '';
      if (S.demo) {
        var dm = S.demo, sol = dm.sol, len = sol.steps.length, L = S.level;
        if (dm.d === -2) {
          msg = { pose: 'waving', text: L.intro.join(' ') };
          acts = [['demo-next', 'Let’s see an example! →']];
          bd = '<div class="card checklist compact"><h2>In this level you will</h2><ul>' +
            ['Learn how to do it', 'Practise with my help', 'Try some on your own', 'Complete a short mastery check'].map(function (t) { return '<li>' + CHECK + '<span>' + t + '</span></li>'; }).join('') +
            '</ul><p class="objective"><strong>New skill:</strong> ' + esc(L.newSkill) + '</p></div>';
        } else {
          msg = demoMsg(dm);
          acts = [];
          if (dm.d < len) acts.push(['demo-next', 'Next →']);
          else acts.push(dm.replay ? ['end-replay', 'Back to mine →'] : ['demo-finish', 'Let’s try it together →']);
          if (dm.d > -1) acts.push(['demo-prev', '← Back']);
          if (dm.d === len) acts.push(['demo-restart', 'Watch again']);
          var act = dm.d >= 0 && dm.d < len ? sol.steps[dm.d] : null;
          bd = board(sol, { applied: dm.d + 1, active: act, demo: true, freshStep: act, done: dm.d >= len, visual: L.visual });
          keypad = '<p class="demo-note muted small">Watch how it works. Use Next and Back to go at your own pace.</p>';
        }
      } else if (S.inter) {
        msg = S.inter.msg; acts = S.inter.actions;
        bd = S.q && S.q.done ? board(S.q.sol, { applied: S.q.sol.steps.length, done: true, visual: S.kind === 'level' && S.level.visual }) : (S.inter.art || '');
      } else {
        var q = S.q;
        msg = q.msg; acts = q.actions;
        bd = board(q.sol, { applied: q.si, active: q.done ? null : curStep(), entry: q.entry, done: q.done, freshStep: q.fresh, guided: q.guided, mastery: q.mastery, visual: S.kind === 'level' && S.level.visual && !q.mastery });
        q.fresh = null;
        keypad = q.done ? '' : keypadHTML(curStep().kind !== 'entry');
      }
      var tutor = '<div class="tutor">' + charImg(msg.pose, 'char-lesson') + '<div class="bubble">' + paras(msg.text) + actionsHTML(acts) + '</div></div>';
      return '<section class="screen lesson">' + bar + '<div class="lesson-main">' + tutor + '<div class="work">' + bd + keypad + '</div></div></section>';
    }

    /* ───────────── results ───────────── */
    function resultHTML() {
      var r = S.result, L = S.level, next = L.next ? C.getLevel(L.next) : null, m, acts, body = '';
      if (r.kind === 'challenge') {
        m = { pose: r.correct === r.total ? 'cheering' : 'encouraging', text: 'Challenge finished! You got ' + r.correct + ' out of ' + r.total + '.' + (r.correct === r.total ? ' A perfect score!' : ' Great effort. Try again any time.') };
        acts = '<button class="btn btn-accent btn-lg" data-action="start" data-mode="challenge" data-id="' + L.id + '" data-autofocus>Try another challenge</button><button class="btn btn-secondary btn-lg" data-action="hub">All levels</button>';
      } else if (r.passed) {
        m = { pose: 'cheering', text: withName('Level complete!') + ' You’ve mastered ' + L.short + ' (' + L.sub + ').' + (next ? ' Next, we’ll learn ' + next.short + ' (' + next.sub + ').' : ' You’ve finished the whole course!') };
        body = '<div class="card checklist"><h2>Your progress</h2><ul>' + ['Lesson complete', 'Guided practice', 'Independent practice', 'Mastery check passed (' + r.correct + '/' + r.total + ')'].map(function (t) { return '<li class="done">' + CHECK + '<span>' + t + '</span></li>'; }).join('') + '</ul></div>';
        acts = (next ? '<button class="btn btn-accent btn-lg" data-action="open-level" data-id="' + next.id + '" data-autofocus>Next level →</button>' : '') +
          '<button class="btn btn-secondary btn-lg" data-action="hub"' + (next ? '' : ' data-autofocus') + '>All levels</button>';
        setTimeout(confetti, 50);
      } else {
        var weak = P.weakestSkill(L.id);
        m = { pose: 'reassuring', text: 'You got ' + r.correct + ' out of ' + r.total + '. Nearly there! You just need a little more practice' + (weak ? ' with ' + weak : '') + '. Every try makes you stronger.' + (r.improved ? ' You’ve improved since last time!' : '') };
        acts = '<button class="btn btn-accent btn-lg" data-action="start" data-mode="more" data-id="' + L.id + '" data-autofocus>Practise a bit more, then try again</button>' +
          '<button class="btn btn-secondary btn-lg" data-action="start" data-mode="lesson" data-id="' + L.id + '">Watch the lesson again</button>' +
          '<button class="btn btn-secondary btn-lg" data-action="hub">All levels</button>';
      }
      announce(m.text);
      return '<section class="screen result"><div class="result-card' + (r.passed ? ' passed' : '') + '">' + charImg(m.pose, 'char-xl') +
        '<div class="result-body">' + (r.passed ? '<h1 class="big-title">Level complete!</h1>' + starsHTML(3, true) : '<h1>' + (r.kind === 'challenge' ? 'Challenge result' : 'Keep going!') + '</h1>') +
        '<div class="bubble bubble-left">' + paras(m.text) + '</div>' + body + '<div class="actions">' + acts + '</div></div></div></section>';
    }

    /* ───────────── progress ───────────── */
    function stat(v, l) { return '<div class="stat"><span class="stat-v">' + v + '</span><span class="stat-l">' + l + '</span></div>'; }
    function progressHTML() {
      var t = P.totals(), nl = nextLevel();
      var badges = C.LEVELS.filter(function (L) { return P.level(L.id).mastered; }).map(function (L) {
        return '<li class="badge-item"><span class="badge-medal" aria-hidden="true">' + L.id + '</span><span>' + esc(L.short) + '<br><span class="muted small">' + esc(L.sub) + '</span></span></li>';
      }).join('') || '<li class="muted">Pass a mastery check to earn your first skill badge.</li>';
      var rows = C.LEVELS.map(function (L) {
        var lv = P.level(L.id);
        return '<tr><th scope="row">' + L.id + '. ' + esc(L.short) + ' <span class="muted">(' + esc(L.sub) + ')</span></th><td>' + starsHTML(P.stars(L.id)) + '</td><td>' + lv.attempts + '</td><td>' + lv.independent + '</td><td>' + lv.assisted + '</td><td>' + lv.hints + '</td><td>' +
          (lv.lastMastery ? lv.lastMastery.correct + '/' + lv.lastMastery.total : '–') + '</td><td>' + (lv.masteryBest ? Math.round(lv.masteryBest * 100) + '%' : '–') + '</td></tr>';
      }).join('');
      var tip = nl ? (t.mastered ? 'You’ve mastered ' + t.mastered + ' level' + (t.mastered === 1 ? '' : 's') + '. Next: ' + nl.short + ' (' + nl.sub + ').' : 'Start with Level 1. You’ll be amazed how quickly you learn!') : 'Every level mastered. You’re a superstar!';
      return '<section class="screen progress-page">' +
        '<div class="crumb"><button class="btn btn-ghost" data-action="hub" data-k="back">← All levels</button></div>' +
        '<h1>' + (profile.name ? esc(profile.name) + '’s progress' : 'My progress') + '</h1>' +
        '<div class="tutor-card plain">' + charImg('encouraging', 'char-md') + '<div class="bubble bubble-left">' + paras(tip) + '</div></div>' +
        '<div class="stat-grid">' + stat(t.mastered + '/' + t.levels, 'Levels mastered') + stat(t.attempts, 'Tried') + stat(t.correct, 'Solved') +
          stat(t.independent, 'Solved on my own') + stat(t.assisted, 'Solved with help') + stat(t.hints, 'Hints used') + '</div>' +
        (subject.progressExtras ? subject.progressExtras(api) : '') +
        '<h2>Skill badges</h2><ul class="badges">' + badges + '</ul>' +
        '<h2>Every level</h2><div class="table-wrap"><table class="prog-table"><thead><tr><th scope="col">Level</th><th scope="col">Stars</th><th scope="col">Tried</th><th scope="col">On my own</th><th scope="col">With help</th><th scope="col">Hints</th><th scope="col">Last check</th><th scope="col">Best check</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="settings card"><h2>Settings</h2>' +
          '<form class="name-form" data-action="save-name"><label for="nm">Your name <span class="muted">(shared with the whole Gang)</span></label><div class="name-row"><input id="nm" name="name" maxlength="24" autocomplete="off" value="' + esc(profile.name) + '">' +
          '<button class="btn btn-primary" type="submit">Save name</button><button class="btn btn-secondary" type="button" data-action="clear-name">Clear name</button></div></form>' +
          '<p class="muted small">Progress is saved only in this browser. Resetting clears ' + esc(CH.name) + '’s levels only and can’t be undone.</p>' +
          (confirmReset ? '<p><strong>Are you sure? All of ' + esc(CH.name) + '’s stars and levels will be cleared.</strong></p><div class="actions"><button class="btn btn-danger" data-action="reset-yes" data-k="ry">Yes, reset ' + esc(CH.name) + '’s progress</button><button class="btn btn-secondary" data-action="reset-no" data-k="rn">No, keep it</button></div>'
            : '<button class="btn btn-secondary" data-action="reset" data-k="rs">Reset my ' + esc(subject.noun) + ' progress</button>') +
        '</div></section>';
    }

    /* ───────────── events ───────────── */
    function focusFirstAction() { var b = app.querySelector('.bubble-actions button') || app.querySelector('[data-autofocus]'); if (b) b.focus({ preventScroll: true }); }
    function focusKeypad() { var b = app.querySelector('.bubble-actions button') || app.querySelector('.key-done:not([disabled])'); if (b) b.focus({ preventScroll: true }); }
    app.addEventListener('click', function (e) {
      var b = e.target.closest('[data-action]');
      if (!b || b.tagName === 'FORM') return;
      var a = b.getAttribute('data-action'), id = Number(b.getAttribute('data-id'));
      if (subject.onAction && subject.onAction(a, b, api)) return;
      switch (a) {
        case 'open-level':
          if (!P.isUnlocked(id)) {
            hubMsg = { pose: 'reassuring', text: 'Level ' + id + ' is still locked. Pass the mastery check on Level ' + (id - 1) + ' first, and it will open!' };
            if (screen !== 'hub') go('hub'); else render();
            hubMsg = hubMsg; announce(hubMsg.text); return;
          }
          go('level', id); break;
        case 'hub': confirmReset = false; go('hub'); break;
        case 'level': go('level', S.level.id); break;
        case 'progress': go('progress'); break;
        case 'toggle-sound': profile.setSound(!profile.sound); render(); if (profile.sound) sound('step'); break;
        case 'start': startSession(id, b.getAttribute('data-mode')); break;
        case 'leave': if (S.kind === 'drill') go(S.cfg.back || 'hub'); else go('level', S.level.id); break;
        case 'key': press(b.getAttribute('data-d')); break;
        case 'backspace': backspace(); break;
        case 'clear': clearEntry(); break;
        case 'done': done(); break;
        case 'next': nextQuestion(); focusFirstAction(); break;
        case 'choice': choose(Number(b.getAttribute('data-i'))); focusKeypad(); break;
        case 'hint':
          if (!S.q || S.q.mastery || S.q.done) return;
          S.q.hintLvl = Math.min(2, S.q.hintLvl + 1); S.q.hints++;
          setMsg({ pose: 'thinking', text: S.q.sol.format === 'fact' ? Facts.D.hint(S.q.sol, S.q.hintLvl) : D.hint(curStep(), S.q.hintLvl, S.q.sol) }, S.q.hintLvl >= 2 ? [['reveal', 'Show me']] : [['hint', 'Another hint']]);
          render(); break;
        case 'reveal': S.q.revealed = true; stepCorrect(true); focusKeypad(); break;
        case 'begin': startQuestion(); render(); focusKeypad(); break;
        case 'begin-next': S.inter = null; S.qi++; startQuestion(); render(); focusKeypad(); break;
        case 'skip-to-mastery': P.markPhase(S.level.id, 'practised'); S.pi = S.plan.indexOf('mastery'); startPhase(); render(); focusFirstAction(); break;
        case 'practise-again': startPhase(); render(); focusFirstAction(); break;
        case 'goto-check': S.plan = ['mastery']; S.mode = 'check'; S.pi = 0; startPhase(); render(); focusFirstAction(); break;
        case 'demo-next': S.demo.d = Math.min(S.demo.sol.steps.length, S.demo.d + 1); render(); announce(demoMsg(S.demo).text || ''); focusFirstAction(); break;
        case 'demo-prev': S.demo.d = Math.max(-1, S.demo.d - 1); render(); focusFirstAction(); break;
        case 'demo-restart': S.demo.d = -1; render(); focusFirstAction(); break;
        case 'demo-finish': S.pi++; startPhase(); render(); focusKeypad(); break;
        case 'end-replay': endReplay(); focusKeypad(); break;
        case 'replay': replay(); focusFirstAction(); break;
        case 'clear-name': profile.setName(''); render(); break;
        case 'reset': confirmReset = true; render(); var y = app.querySelector('[data-k="ry"]'); if (y) y.focus(); break;
        case 'reset-no': confirmReset = false; render(); break;
        case 'reset-yes': P.reset(); if (subject.onReset) subject.onReset(api); confirmReset = false; announce('Progress reset.'); go('hub'); break;
      }
    });
    app.addEventListener('submit', function (e) {
      var f = e.target.closest('form[data-action]'); if (!f) return;
      e.preventDefault();
      profile.setName(f.querySelector('input').value);
      if (f.getAttribute('data-action') === 'welcome-go') {
        profile.setWelcomed(subject.id);
        if (subject.afterWelcome && subject.afterWelcome(api)) return;
        go('hub');
      } else { announce('Name saved.'); render(); }
    });
    document.addEventListener('keydown', function (e) {
      if (screen !== 'lesson' || !S || e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (/^[0-9.]$/.test(e.key)) { e.preventDefault(); press(e.key); flashKey(e.key === '.' ? 'kdot' : 'k' + e.key); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); backspace(); flashKey('kb'); return; }
      if (e.key === 'Escape') { clearEntry(); return; }
      if (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); if (S.q && !S.inter && !S.demo) { done(); flashKey('kd'); } }
    });
    function flashKey(k) { var b = app.querySelector('[data-k="' + k + '"]'); if (!b) return; b.classList.add('pressed'); setTimeout(function () { b.classList.remove('pressed'); }, 140); }

    var api = {
      subject: subject, P: P, profile: profile, go: go, render: render, announce: announce, esc: esc, paras: paras, charImg: charImg,
      starsHTML: starsHTML, sound: sound, confetti: confetti, startSession: startSession, startDrill: startDrill, showInter: showInter,
      focusFirstAction: focusFirstAction, pick: pick, withName: withName,
      get S() { return S; }, get screen() { return screen; }
    };
    window.__arith = api;
    go(profile.welcomed(subject.id) ? 'hub' : 'welcome');
    return api;
  }

  window.ArithShell = { start: start };
})();
