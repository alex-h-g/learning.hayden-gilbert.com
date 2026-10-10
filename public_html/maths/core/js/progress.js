/* Arithmetic Gang — per-subject progress (localStorage only, nothing leaves the browser).
 * create(storage, key, curriculum) → store. Data format is compatible with the original Susy app.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ArithProgress = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function blankLevel() {
    return { learned: false, practised: false, mastered: false, attempts: 0, correct: 0, independent: 0, assisted: 0,
      hints: 0, masteryAttempts: 0, masteryBest: 0, lastMastery: null, skills: {} };
  }
  function blank() { return { v: 1, current: 1, levels: {}, extra: {} }; }
  function num(x) { return typeof x === 'number' && isFinite(x) ? x : 0; }

  function sanitize(d) {
    var out = blank();
    if (!d || d.v !== 1 || typeof d.levels !== 'object' || !d.levels) return out;
    out.current = num(d.current) || 1;
    Object.keys(d.levels).forEach(function (k) {
      var L = d.levels[k]; if (!L || typeof L !== 'object') return;
      var b = blankLevel();
      ['learned', 'practised', 'mastered'].forEach(function (f) { b[f] = L[f] === true; });
      ['attempts', 'correct', 'independent', 'assisted', 'hints', 'masteryAttempts', 'masteryBest'].forEach(function (f) { b[f] = num(L[f]); });
      if (L.lastMastery && typeof L.lastMastery === 'object') b.lastMastery = { correct: num(L.lastMastery.correct), total: num(L.lastMastery.total) };
      if (L.skills && typeof L.skills === 'object') Object.keys(L.skills).forEach(function (s) {
        var x = L.skills[s] || {}; b.skills[s] = { attempts: num(x.attempts), independent: num(x.independent), mistakes: num(x.mistakes) };
      });
      out.levels[k] = b;
    });
    if (d.extra && typeof d.extra === 'object') out.extra = d.extra;
    return out;
  }

  function create(storage, KEY, Curriculum) {
    var data = blank();
    function save() { try { storage && storage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
    function lvl(id) { return data.levels[id] || (data.levels[id] = blankLevel()); }
    var api = {
      KEY: KEY,
      load: function () {
        try { data = sanitize(JSON.parse((storage && storage.getItem(KEY)) || 'null')); } catch (e) { data = blank(); }
        return api;
      },
      get data() { return data; },
      save: save,
      extra: function (k, def) { if (!(k in data.extra)) data.extra[k] = def; return data.extra[k]; },
      level: function (id) { return data.levels[id] || blankLevel(); },
      setCurrent: function (id) { data.current = id; save(); },
      isUnlocked: function (id) {
        var L = Curriculum.LEVELS;
        if (id === L[0].id) return true;
        for (var i = 1; i < L.length; i++) if (L[i].id === id) return !!(data.levels[L[i - 1].id] || {}).mastered;
        return false;
      },
      stars: function (id) {
        var L = data.levels[id]; if (!L) return 0;
        return (L.learned ? 1 : 0) + (L.practised ? 1 : 0) + (L.mastered ? 1 : 0);
      },
      recordQuestion: function (id, r) {
        var L = lvl(id);
        L.attempts++; L.hints += r.hints || 0;
        if (r.correct) { L.correct++; if (r.independent) L.independent++; else L.assisted++; }
        var s = L.skills[r.label] || (L.skills[r.label] = { attempts: 0, independent: 0, mistakes: 0 });
        s.attempts++; if (r.correct && r.independent) s.independent++; else s.mistakes++;
        save();
      },
      markPhase: function (id, phase) { lvl(id)[phase] = true; save(); },
      recordMastery: function (id, correct, total) {
        var level = Curriculum.getLevel(id), L = lvl(id);
        var score = total ? correct / total : 0;
        L.masteryAttempts++;
        L.masteryBest = Math.max(L.masteryBest, score);
        L.lastMastery = { correct: correct, total: total };
        var passed = total >= level.config.mastery && score >= level.config.threshold;
        if (passed) {
          L.mastered = true; L.learned = true; L.practised = true;
          if (level.next && data.current < level.next) data.current = level.next;
        }
        save();
        return passed;
      },
      weakestSkill: function (id) {
        var L = data.levels[id]; if (!L) return null;
        var worst = null, worstRate = 2;
        Object.keys(L.skills).forEach(function (k) {
          var s = L.skills[k]; if (s.attempts < 2) return;
          var rate = s.independent / s.attempts;
          if (rate < worstRate) { worstRate = rate; worst = k; }
        });
        return worstRate < 0.7 ? worst : null;
      },
      totals: function () {
        var t = { attempts: 0, correct: 0, independent: 0, assisted: 0, hints: 0, mastered: 0, levels: Curriculum.LEVELS.length };
        Object.keys(data.levels).forEach(function (k) {
          var L = data.levels[k];
          t.attempts += L.attempts; t.correct += L.correct; t.independent += L.independent; t.assisted += L.assisted; t.hints += L.hints;
          if (L.mastered) t.mastered++;
        });
        return t;
      },
      reset: function () { data = blank(); save(); }
    };
    return api;
  }

  /** Read-only summary for the launch page / homepage (no curriculum needed). */
  function summarize(storage, KEY) {
    var d;
    try { d = sanitize(JSON.parse((storage && storage.getItem(KEY)) || 'null')); } catch (e) { return null; }
    var s = { attempts: 0, correct: 0, mastered: 0, highest: 0, current: d.current, extra: d.extra };
    Object.keys(d.levels).forEach(function (k) {
      var L = d.levels[k]; s.attempts += L.attempts; s.correct += L.correct;
      if (L.mastered) { s.mastered++; s.highest = Math.max(s.highest, Number(k)); }
    });
    return s;
  }

  return { create: create, summarize: summarize };
});
