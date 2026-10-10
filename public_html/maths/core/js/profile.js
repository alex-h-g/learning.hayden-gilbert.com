/* Arithmetic Gang — shared learner profile (name, sound, which characters have said hello).
 * Stored only in this browser. One profile is shared by Andy, Susy, Mandy and Danny.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ArithProfile = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var KEY = 'arithmetic:profile:v1';
  var LEGACY_SUSY = 'subtraction-susy:progress:v1';

  function safeStorage() {
    try { var s = window.localStorage, k = '__arith_t'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; }
  }
  function blank() { return { v: 1, name: '', sound: false, welcomed: {} }; }

  function create(storage) {
    if (storage === undefined) storage = safeStorage();
    var data = blank();
    try {
      var d = storage && JSON.parse(storage.getItem(KEY) || 'null');
      if (d && d.v === 1) data = Object.assign(blank(), d, { welcomed: Object.assign({}, d.welcomed) });
      else if (storage) {
        // First run of the shared profile: carry over the name and welcome from the original Susy app.
        var old = JSON.parse(storage.getItem(LEGACY_SUSY) || 'null');
        if (old && typeof old === 'object') {
          if (typeof old.name === 'string') data.name = old.name;
          data.sound = !!old.sound;
          if (old.welcomed) data.welcomed.subtraction = true;
        }
      }
    } catch (e) { data = blank(); }
    if (typeof data.name !== 'string') data.name = '';
    function save() { try { storage && storage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
    return {
      KEY: KEY,
      storage: storage,
      get name() { return data.name; },
      get sound() { return !!data.sound; },
      setName: function (n) { data.name = String(n || '').trim().slice(0, 24); save(); },
      setSound: function (on) { data.sound = !!on; save(); },
      welcomed: function (id) { return !!data.welcomed[id]; },
      setWelcomed: function (id) { data.welcomed[id] = true; save(); },
      reset: function () { var n = data.name, s = data.sound; data = blank(); data.name = n; data.sound = s; save(); }
    };
  }
  return { create: create, KEY: KEY };
});
