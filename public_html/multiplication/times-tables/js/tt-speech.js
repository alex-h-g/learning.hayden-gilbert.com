/* Mandy's voice — Web Speech API, used ONLY by Chant Along. Flashcards and the Game never load speech.
 *
 * - Picks the best English voice on this device that sounds female (by name), preferring British English,
 *   then raises the pitch for a bright, young character voice. Voices differ by browser/OS, so nothing is assumed.
 * - The chant speaks one line at a time. The next line starts from the utterance's `end` event plus a short,
 *   controlled pause (longer after every fifth line). A watchdog only steps in if a browser never fires `end`.
 * - Every run has a token: stopping, restarting or changing table bumps it, so stale callbacks are ignored and
 *   speech never overlaps.
 * - "Pause" cancels the current line and remembers where we were; "Resume" starts that line again. This is more
 *   reliable than speechSynthesis.pause(), which is broken on several mobile browsers.
 */
(function (root) {
  'use strict';
  var synth = root.speechSynthesis || null;
  var Utter = root.SpeechSynthesisUtterance || null;
  var supported = !!(synth && Utter);

  var PITCH = 1.6;          // 0–2; higher = younger-sounding
  var SHORT_PAUSE = 450;    // ms between lines (scaled by speed)
  var LONG_PAUSE = 1100;    // ms after every fifth line

  var FEMALE = ['female', 'woman', 'girl', 'samantha', 'karen', 'moira', 'tessa', 'serena', 'victoria', 'fiona', 'kate', 'susan', 'zira',
    'hazel', 'libby', 'sonia', 'maisie', 'jenny', 'aria', 'ava', 'allison', 'catherine', 'nicky', 'martha', 'stephanie', 'emma', 'amy', 'olivia', 'joanna', 'salli', 'kimberly', 'ivy', 'natasha', 'clara', 'molly'];
  var MALE = ['male', 'man', 'boy', 'daniel', 'alex', 'fred', 'david', 'mark', 'george', 'guy', 'ryan', 'tom', 'oliver', 'arthur', 'aaron',
    'rishi', 'gordon', 'lee', 'thomas', 'brian', 'matthew', 'justin', 'joey', 'eric', 'william', 'james', 'albert', 'bruce', 'ralph', 'junior', 'grandpa', 'reed', 'rocko', 'eddy'];

  function score(v) {
    var name = (v.name + ' ' + (v.voiceURI || '')).toLowerCase(), lang = (v.lang || '').toLowerCase().replace('_', '-');
    if (lang.indexOf('en') !== 0) return -1;
    var s = 10;
    if (lang === 'en-gb') s += 6; else if (lang === 'en-au' || lang === 'en-ie' || lang === 'en-nz') s += 4; else if (lang === 'en-us') s += 3;
    var fem = FEMALE.some(function (w) { return new RegExp('(^|[^a-z])' + w + '([^a-z]|$)').test(name); });
    var mal = MALE.some(function (w) { return new RegExp('(^|[^a-z])' + w + '([^a-z]|$)').test(name); });
    if (fem && !mal) s += 20;
    if (mal && !fem) s -= 25;
    if (/natural|neural|enhanced|premium|google/.test(name)) s += 3;
    if (/novelty|whisper|bells|bubbles|cellos|organ|trinoids|zarvox|bad news|good news|hysterical|jester|superstar|wobble|boing|deranged|albert/.test(name)) s -= 40;
    if (v.localService) s += 1;
    return s;
  }
  function pickVoice(voices) {
    var best = null, bs = -1;
    (voices || []).forEach(function (v) { var s = score(v); if (s > bs) { bs = s; best = v; } });
    return bs >= 0 ? best : null;
  }

  var voice = null, voicesReady = false, readyCbs = [];
  function refreshVoices() {
    if (!supported) return;
    var list = [];
    try { list = synth.getVoices() || []; } catch (e) {}
    if (list.length) {
      voice = pickVoice(list); voicesReady = true;
      var cbs = readyCbs; readyCbs = []; cbs.forEach(function (cb) { cb(voice); });
    }
  }
  /* cb(voice|null) once voices are known. Some browsers only fill the list after `voiceschanged`;
   * if none arrive within 2.5 s we carry on with the browser's default voice. */
  function whenReady(cb) {
    if (!supported) { cb(null); return; }
    if (voicesReady) { cb(voice); return; }
    readyCbs.push(cb);
    refreshVoices();
    setTimeout(function () { if (!voicesReady) { voicesReady = true; var cbs = readyCbs; readyCbs = []; cbs.forEach(function (c) { c(voice); }); } }, 2500);
  }
  if (supported) {
    refreshVoices();
    try {
      if (synth.addEventListener) synth.addEventListener('voiceschanged', refreshVoices);
      else synth.onvoiceschanged = refreshVoices;
    } catch (e) {}
  }

  function makeUtterance(text, rate) {
    var u = new Utter(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-GB';
    u.pitch = PITCH; u.rate = rate; u.volume = 1;
    return u;
  }

  /* ───────── the chant ───────── */
  function createChanter(opts) {
    // opts: { getRate(): number, onLine(i), onState('playing'|'paused'|'stopped'|'finished'), silent?: bool }
    var lines = [], idx = 0, state = 'stopped', token = 0, timer = null, watchdog = null;
    var silent = !supported || !!opts.silent;

    function clearTimers() { clearTimeout(timer); clearTimeout(watchdog); timer = watchdog = null; }
    function setState(s) { state = s; if (opts.onState) opts.onState(s); }
    function hush() { clearTimers(); if (supported) { try { synth.cancel(); } catch (e) {} } }

    function speakLine(myToken) {
      if (myToken !== token || state !== 'playing') return;
      if (idx >= lines.length) { setState('finished'); if (opts.onLine) opts.onLine(-1); return; }
      var line = lines[idx], rate = opts.getRate();
      if (opts.onLine) opts.onLine(idx);
      var finished = false;
      function done() {
        if (finished || myToken !== token || state !== 'playing') return;
        finished = true; clearTimeout(watchdog);
        var pause = (line.longPause ? LONG_PAUSE : SHORT_PAUSE) / Math.max(0.5, rate);
        timer = setTimeout(function () { if (myToken !== token || state !== 'playing') return; idx++; speakLine(myToken); }, pause);
      }
      // Rough length of the line, used for silent read-along and as a safety net if `end` never fires.
      var estimate = (line.spoken.split(/\s+/).length * 420) / Math.max(0.5, rate);
      if (silent) { timer = setTimeout(done, estimate); return; }
      var u = makeUtterance(line.spoken, rate);
      u.onend = done;
      u.onerror = function (e) {
        if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; // our own cancel()
        done();
      };
      try { synth.cancel(); synth.speak(u); } catch (e) { timer = setTimeout(done, estimate); return; }
      watchdog = setTimeout(done, estimate * 2.5 + 2500);
    }

    return {
      get supported() { return supported; },
      get silent() { return silent; },
      get state() { return state; },
      get index() { return idx; },
      load: function (newLines) { this.stop(); lines = newLines || []; idx = 0; if (opts.onLine) opts.onLine(-1); },
      play: function () {
        if (!lines.length) return;
        if (state === 'paused') return this.resume();
        if (state === 'finished') idx = 0;
        hush(); token++; setState('playing'); var tk = token;
        whenReady(function () { speakLine(tk); });
      },
      pause: function () { if (state !== 'playing') return; token++; hush(); setState('paused'); },
      resume: function () { if (state !== 'paused') return; token++; setState('playing'); var tk = token; whenReady(function () { speakLine(tk); }); },
      stop: function () { token++; hush(); idx = 0; if (state !== 'stopped') setState('stopped'); if (opts.onLine) opts.onLine(-1); },
      restart: function () { token++; hush(); idx = 0; setState('stopped'); this.play(); }
    };
  }

  /* One-off voice test (cancels anything already speaking). */
  function sayTest(text, rate, onDone) {
    if (!supported) { if (onDone) onDone(false); return; }
    whenReady(function () {
      try {
        synth.cancel();
        var u = makeUtterance(text, rate);
        u.onend = function () { if (onDone) onDone(true); };
        u.onerror = function () { if (onDone) onDone(false); };
        synth.speak(u);
      } catch (e) { if (onDone) onDone(false); }
    });
  }
  function cancelAll() { if (supported) { try { synth.cancel(); } catch (e) {} } }
  function voiceLabel() { return voice ? voice.name + ' (' + voice.lang + ')' : (supported ? 'your device’s default voice' : 'no voice available'); }

  root.MandyVoice = {
    supported: supported, PITCH: PITCH,
    score: score, pickVoice: pickVoice, whenReady: whenReady,
    createChanter: createChanter, sayTest: sayTest, cancelAll: cancelAll, voiceLabel: voiceLabel
  };
})(typeof self !== 'undefined' ? self : this);
