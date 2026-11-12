/* NetSec Academy – persistent reactive state (localStorage) */
(function (global) {
  const NSA = global.NSA;
  const KEY = 'nsa.state.v1';
  const VERSION = 1;

  function defaultState() {
    return {
      version: VERSION,
      profile: { name: 'Learner', specialization: null, theme: 'dark', createdAt: new Date().toISOString(), onboarded: false },
      xp: 0,
      streak: { current: 0, best: 0, lastActive: null, days: {} },
      lessons: {},      // id -> { read:[], checks:{}, bestScore, attempts, passed, practical, completedAt, lastScore }
      labs: {},         // id -> { completed, bestScore, attempts, completedAt, hintsUsed, network }
      missions: {},     // id -> { steps:{}, answers:{}, score, completed, completedAt }
      exams: {},        // levelKey -> { bestScore, passed, attempts, lastAt }
      challenges: { daily: {}, weekly: {} },
      achievements: {}, // id -> ISO date
      flashcards: {},   // cardId -> { interval, ease, due, reps, lapses }
      notes: [],
      bookmarks: [],
      commands: [],     // personal command library
      activity: [],     // recent activity log
      stats: { commandsRun: 0, distinctCommands: [], subnetCorrect: 0, subnetAttempts: 0, pingsSuccess: 0, quizzesPassed: 0, quizzesTaken: 0, labsCompleted: 0, flashReviews: 0, simDevicesPlaced: 0, phishingSpotted: 0 },
      quizHistory: []   // { lessonId, score, at, wrongTopics:[] }
    };
  }

  function load() {
    let saved = null;
    try { const raw = global.localStorage && localStorage.getItem(KEY); if (raw) saved = JSON.parse(raw); } catch (e) { saved = null; }
    const base = defaultState();
    if (!saved || typeof saved !== 'object') return base;
    // shallow merge known top-level keys so new fields appear after upgrades
    const merged = Object.assign({}, base, saved);
    merged.profile = Object.assign({}, base.profile, saved.profile || {});
    merged.streak = Object.assign({}, base.streak, saved.streak || {});
    merged.stats = Object.assign({}, base.stats, saved.stats || {});
    merged.challenges = Object.assign({}, base.challenges, saved.challenges || {});
    merged.version = VERSION;
    return merged;
  }

  const reactive = (global.Vue && global.Vue.reactive) ? global.Vue.reactive : (x => x);
  const state = reactive(load());
  let dirty = false;
  let saveTimer = null;
  let listeners = [];

  function saveNow() {
    dirty = false;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable (private mode) – app still works in memory */ }
    listeners.forEach(fn => { try { fn(state); } catch (e) {} });
  }
  function save() {
    dirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }
  if (global.Vue && global.Vue.watch) {
    global.Vue.watch(() => state, save, { deep: true });
  }
  if (global.addEventListener) {
    global.addEventListener('beforeunload', () => { if (dirty) saveNow(); });
    global.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && dirty) saveNow(); });
  }

  function exportJSON() { return JSON.stringify(state, null, 2); }
  function importJSON(text) {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || typeof data.xp !== 'number' || !data.lessons) throw new Error('Not a NetSec Academy progress file');
    const base = defaultState();
    const merged = Object.assign({}, base, data);
    merged.profile = Object.assign({}, base.profile, data.profile || {});
    merged.stats = Object.assign({}, base.stats, data.stats || {});
    merged.streak = Object.assign({}, base.streak, data.streak || {});
    Object.keys(state).forEach(k => { delete state[k]; });
    Object.assign(state, merged);
    saveNow();
  }
  function reset() {
    const base = defaultState();
    Object.keys(state).forEach(k => { delete state[k]; });
    Object.assign(state, base);
    saveNow();
  }
  function onSave(fn) { listeners.push(fn); }

  NSA.store = { state, save, saveNow, exportJSON, importJSON, reset, onSave, defaultState, KEY };
})(typeof globalThis !== 'undefined' ? globalThis : window);
