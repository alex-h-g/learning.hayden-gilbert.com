/* Mandy's Times Tables — student profiles and learning history, stored only in this browser.
 * UMD. One namespaced key: 'mandy-times-tables:v1'. Nothing else in localStorage is read or written,
 * except a read-only peek at the Arithmetic Gang name ('arithmetic:profile:v1') to prefill the first name box.
 *
 * Shape:
 *   { v: 1, active: <id|null>, rate: <chant speed>,
 *     students: [{ id, name, created }],
 *     progress: { <id>: { facts: { '7x6': stat, … }, settings: {maxA,maxB,count,order}, rounds: n } } }
 *
 * Profiles are identified by `id`, never by name, so two children called Alex keep separate histories.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./tt-core.js'));
  else root.MandyTTStore = factory(root.MandyTT);
})(typeof self !== 'undefined' ? self : this, function (TT) {
  'use strict';
  var KEY = 'mandy-times-tables:v1';
  var GANG_KEY = 'arithmetic:profile:v1';
  var MAX_NAME = 24, MAX_STUDENTS = 40;
  var RATE_MIN = 0.6, RATE_MAX = 1.4, RATE_DEFAULT = 0.95;

  function safeStorage() {
    try { var s = window.localStorage, k = '__mtt_t'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; }
  }
  function cleanName(n) { return String(n == null ? '' : n).replace(/\s+/g, ' ').trim().slice(0, MAX_NAME).trim(); }
  function sameName(a, b) { return cleanName(a).toLocaleLowerCase() === cleanName(b).toLocaleLowerCase(); }
  function blank() { return { v: 1, active: null, rate: RATE_DEFAULT, students: [], progress: {} }; }
  function blankProgress() { return { facts: {}, settings: TT.sanitizeSettings(null), rounds: 0 }; }
  function clampRate(r) { r = Number(r); return isFinite(r) ? Math.min(RATE_MAX, Math.max(RATE_MIN, Math.round(r * 100) / 100)) : RATE_DEFAULT; }

  function sanitize(d) {
    var out = blank();
    if (!d || typeof d !== 'object' || d.v !== 1) return out;
    out.rate = clampRate(d.rate);
    var ids = {};
    (Array.isArray(d.students) ? d.students : []).forEach(function (s) {
      if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !/^[a-z0-9_-]{1,40}$/i.test(s.id) || ids[s.id]) return;
      var name = cleanName(s.name); if (!name) return;
      ids[s.id] = true;
      out.students.push({ id: s.id, name: name, created: typeof s.created === 'string' ? s.created.slice(0, 40) : '' });
    });
    out.students = out.students.slice(0, MAX_STUDENTS);
    var prog = d.progress && typeof d.progress === 'object' ? d.progress : {};
    out.students.forEach(function (s) {
      var p = prog[s.id], b = blankProgress();
      if (p && typeof p === 'object') {
        if (p.facts && typeof p.facts === 'object') Object.keys(p.facts).forEach(function (k) { if (TT.parseKey(k)) b.facts[k] = TT.sanitizeStat(p.facts[k]); });
        b.settings = TT.sanitizeSettings(p.settings);
        b.rounds = typeof p.rounds === 'number' && p.rounds >= 0 ? Math.floor(p.rounds) : 0;
      }
      out.progress[s.id] = b;
    });
    out.active = typeof d.active === 'string' && ids[d.active] ? d.active : null;
    return out;
  }

  function newId(rng) {
    rng = typeof rng === 'function' ? rng : Math.random;
    return 's' + Date.now().toString(36) + Math.floor(rng() * 1e9).toString(36);
  }

  function create(storage, opts) {
    opts = opts || {};
    if (storage === undefined) storage = safeStorage();
    var data = blank(), loadProblem = false;
    try {
      var raw = storage ? storage.getItem(KEY) : null;
      if (raw) { var parsed = JSON.parse(raw); data = sanitize(parsed); if (!parsed || parsed.v !== 1) loadProblem = true; }
    } catch (e) { data = blank(); loadProblem = true; }

    function save() {
      if (!storage) return false;
      try { storage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
    }
    function student(id) { for (var i = 0; i < data.students.length; i++) if (data.students[i].id === id) return data.students[i]; return null; }
    function prog(id) { return data.progress[id] || (data.progress[id] = blankProgress()); }
    function makeId() { var id; do { id = newId(opts.rng); } while (student(id)); return id; }

    var api = {
      KEY: KEY,
      get persistent() { return !!storage; },
      get loadProblem() { return loadProblem; },
      students: function () { return data.students.map(function (s) { return { id: s.id, name: s.name, created: s.created }; }); },
      get activeId() { return data.active; },
      active: function () { var s = student(data.active); return s ? { id: s.id, name: s.name, created: s.created } : null; },
      cleanName: cleanName,
      /* Existing students whose name matches (case-insensitive). Used to offer "Is this you?" before creating a duplicate. */
      findByName: function (name) { return data.students.filter(function (s) { return sameName(s.name, name); }).map(function (s) { return { id: s.id, name: s.name, created: s.created }; }); },
      /* Always creates a new, separate profile and makes it active. Returns the student, or null for an empty name. */
      createStudent: function (name) {
        var n = cleanName(name); if (!n) return null;
        if (data.students.length >= MAX_STUDENTS) return null;
        var s = { id: makeId(), name: n, created: (opts.now ? opts.now() : new Date()).toISOString() };
        data.students.push(s); data.progress[s.id] = blankProgress(); data.active = s.id; save();
        return { id: s.id, name: s.name, created: s.created };
      },
      select: function (id) { if (!student(id)) return false; data.active = id; save(); return true; },
      clearActive: function () { data.active = null; save(); },
      /* Clears one student's question history, revision list and mastery. Name, settings and other students stay. */
      resetProgress: function (id) {
        if (!student(id)) return false;
        var keep = prog(id).settings;
        data.progress[id] = blankProgress(); data.progress[id].settings = keep; save(); return true;
      },
      /* Deletes the profile and everything recorded for it. */
      removeStudent: function (id) {
        if (!student(id)) return false;
        data.students = data.students.filter(function (s) { return s.id !== id; });
        delete data.progress[id];
        if (data.active === id) data.active = null;
        save(); return true;
      },
      facts: function (id) { return prog(id || data.active).facts; },
      settings: function (id) { return TT.sanitizeSettings(prog(id || data.active).settings); },
      setSettings: function (s, id) { var p = prog(id || data.active); p.settings = TT.sanitizeSettings(Object.assign({}, p.settings, s)); save(); return p.settings; },
      rounds: function (id) { return prog(id || data.active).rounds; },
      /* Record one finished Game question for the active (or given) student. tries = taps to reach the right answer. */
      recordAttempt: function (a, b, tries, roundId, id) {
        id = id || data.active; if (!student(id)) return null;
        var k = TT.key(a, b); if (!TT.parseKey(k)) return null;
        var p = prog(id);
        p.facts[k] = TT.recordAttempt(p.facts[k], tries, roundId, opts.now ? opts.now().toISOString() : undefined);
        save(); return p.facts[k];
      },
      finishRound: function (id) { id = id || data.active; if (!student(id)) return; prog(id).rounds++; save(); },
      get rate() { return data.rate; },
      setRate: function (r) { data.rate = clampRate(r); save(); return data.rate; },
      /* Read-only: the name typed into the Arithmetic Gang, to prefill the first name box. */
      gangName: function () {
        try { var g = storage && JSON.parse(storage.getItem(GANG_KEY) || 'null'); return g && typeof g.name === 'string' ? cleanName(g.name) : ''; } catch (e) { return ''; }
      }
    };
    return api;
  }

  return { create: create, KEY: KEY, sanitize: sanitize, cleanName: cleanName, RATE_MIN: RATE_MIN, RATE_MAX: RATE_MAX, RATE_DEFAULT: RATE_DEFAULT };
});
