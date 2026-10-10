/* Arithmetic Gang — curriculum kit. Turns a list of level definitions plus three subject functions
 * (candidate, solve, matches) into a validated question generator.
 *   spec.LEVELS     level objects: id, short, sub, objective, newSkill, intro[], examples[], profiles[], config?, visual?, mixedFrom?
 *   spec.candidate(profile, rng) → question (any shape the subject's solve accepts)
 *   spec.solve(question, profile) → solved question with steps, answerText, and a stable .key
 *   spec.matches(sol, profile) → true when the question genuinely fits the profile
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ArithCurriculumKit = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var DEFAULTS = { guided: 3, practice: 5, mastery: 5, threshold: 0.8 };

  function make(spec) {
    var LEVELS = spec.LEVELS;
    LEVELS.forEach(function (L, i) {
      L.config = Object.assign({}, DEFAULTS, spec.defaults || {}, L.config || {});
      L.next = i + 1 < LEVELS.length ? LEVELS[i + 1].id : null;
      L.title = 'Level ' + L.id + ': ' + L.short + ' (' + L.sub + ')';
    });
    LEVELS.forEach(function (L) {
      if (!L.mixedFrom) return;
      L.profiles = [];
      L.mixedFrom.forEach(function (id) { getLevel(id).profiles.forEach(function (p) { L.profiles.push(p); }); });
    });
    function getLevel(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return null; }
    function generate(profile, opts) {
      opts = opts || {};
      var rng = opts.rng || Math.random, avoid = opts.avoid || {};
      for (var tries = 0; tries < 20000; tries++) {
        var q = spec.candidate(profile, rng);
        if (!q) continue;
        var sol;
        try { sol = spec.solve(q, profile); } catch (e) { continue; }
        if (avoid[sol.key] && tries < 15000) continue;
        if (spec.matches(sol, profile)) { sol.profile = profile; return sol; }
      }
      throw new Error('Could not generate a question for profile ' + JSON.stringify(profile));
    }
    function buildSet(level, count, opts) {
      opts = opts || {};
      var out = [], avoid = Object.assign({}, opts.avoid || {}), profiles = level.profiles;
      if (opts.focus) {
        var f = profiles.filter(function (p) { return p.label === opts.focus; });
        if (f.length) profiles = f.concat(profiles);
      }
      var offset = Math.floor((opts.rng || Math.random)() * profiles.length);
      for (var i = 0; i < count; i++) {
        var p = profiles[(i + offset) % profiles.length];
        if (opts.progressive && !opts.focus && level.profiles.length > 1) p = level.profiles[Math.min(level.profiles.length - 1, Math.floor(i * level.profiles.length / count))];
        var q = generate(p, { rng: opts.rng, avoid: avoid });
        avoid[q.key] = true;
        out.push(q);
      }
      return out;
    }
    function exampleSet(level) {
      return level.examples.map(function (ex) {
        var prof = null, sol = null;
        for (var i = 0; i < level.profiles.length && !prof; i++) {
          try { var s = spec.solve(ex, level.profiles[i]); if (spec.matches(s, level.profiles[i])) { prof = level.profiles[i]; sol = s; } } catch (e) { /* try next */ }
        }
        if (!sol) { prof = level.profiles[0]; sol = spec.solve(ex, prof); }
        sol.profile = prof;
        return sol;
      });
    }
    return { LEVELS: LEVELS, DEFAULTS: DEFAULTS, getLevel: getLevel, generate: generate, buildSet: buildSet, exampleSet: exampleSet, matches: spec.matches, solve: spec.solve };
  }
  function rnd(lo, hi, rng) { return lo + Math.floor((rng || Math.random)() * (hi - lo + 1)); }
  function ofDigits(n, rng) { return rnd(Math.pow(10, n - 1), Math.pow(10, n) - 1, rng); }
  return { make: make, rnd: rnd, ofDigits: ofDigits };
});
