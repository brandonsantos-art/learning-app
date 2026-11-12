/* NetSec Academy – progression rules: lesson/lab/mission state, unlocks, recommendations */
(function (global) {
  const NSA = global.NSA;
  const st = () => NSA.store.state;
  const G = () => NSA.gamification;
  const D = () => NSA.data;

  const LEVELS = { 1: { name: 'Beginner', sub: 'IT and Networking Foundations' }, 2: { name: 'Intermediate', sub: 'Network Administration and Security' }, 3: { name: 'Expert', sub: 'Professional Networking and Cybersecurity' } };
  const XP = { lessonComplete: 60, quizPass: 40, quizPerfectBonus: 20, lab: { 1: 80, 2: 120, 3: 160 }, troubleshoot: 100, mission: 250, exam: 300, daily: 30, weekly: 120, check: 5 };

  function lessons() { return D().lessons || []; }
  function lesson(id) { return lessons().find(l => l.id === id) || null; }
  function lessonsForLevel(level, track) { return lessons().filter(l => l.level === level && (!track || l.track === track)).sort((a, b) => (a.order || 0) - (b.order || 0)); }
  function lstate(id) { const s = st(); if (!s.lessons[id]) s.lessons[id] = { read: [], checks: {}, bestScore: 0, attempts: 0, passed: false, practical: false, completedAt: null, lastScore: null }; return s.lessons[id]; }
  function lessonProgress(id) {
    const l = lesson(id); if (!l) return null;
    const p = st().lessons[id];
    const total = l.sections.length + 1 + (l.practical ? 1 : 0);
    if (!p) return { pct: 0, started: false, completed: false, passed: false, practical: false, sectionsRead: 0, total: l.sections.length, bestScore: 0, attempts: 0 };
    const read = (p.read || []).filter(i => i < l.sections.length).length;
    const done = read + (p.passed ? 1 : 0) + (l.practical && p.practical ? 1 : 0);
    return { pct: Math.round((done / total) * 100), started: true, completed: !!p.completedAt, passed: !!p.passed, practical: !!p.practical, sectionsRead: read, total: l.sections.length, bestScore: p.bestScore || 0, attempts: p.attempts || 0, lastScore: p.lastScore };
  }
  function allLabs() { const L = D().labs || {}; return [].concat(L.netsim || [], L.terminal || [], L.security || [], L.troubleshoot || []); }
  function lab(id) { return allLabs().find(l => l.id === id) || null; }
  function labKind(id) { const L = D().labs || {}; for (const k of Object.keys(L)) if (L[k].some(l => l.id === id)) return k; return null; }
  function labState(id) { const s = st(); return s.labs[id] || { completed: false, bestScore: 0, attempts: 0, hintsUsed: 0 }; }
  function labsForLevel(level) { return allLabs().filter(l => l.level === level); }

  function levelStats(level) {
    const s = st(); const L = lessonsForLevel(level); const done = L.filter(l => s.lessons[l.id] && s.lessons[l.id].completedAt).length;
    const labs = labsForLevel(level); const labsDone = labs.filter(l => s.labs[l.id] && s.labs[l.id].completed).length;
    const exam = s.exams[level] || null;
    const pct = L.length + labs.length ? Math.round(((done + labsDone) / (L.length + labs.length)) * 100) : 0;
    return { level, name: LEVELS[level].name, sub: LEVELS[level].sub, lessons: L.length, lessonsDone: done, labs: labs.length, labsDone, examPassed: !!(exam && exam.passed), examBest: exam ? exam.bestScore : 0, pct };
  }
  function isLevelUnlocked(level) {
    if (level <= 1) return true;
    if (st().profile.devUnlock) return true;
    const prev = st().exams[level - 1];
    return !!(prev && prev.passed);
  }
  function examRequirements(level) {
    const stats = levelStats(level);
    const needLessons = Math.ceil(stats.lessons * 0.7);
    const needLabs = Math.min(3, stats.labs);
    return { needLessons, haveLessons: stats.lessonsDone, needLabs, haveLabs: stats.labsDone, ok: stats.lessonsDone >= needLessons && stats.labsDone >= needLabs || !!st().profile.devUnlock };
  }
  function levelLockReason(level) {
    if (isLevelUnlocked(level)) return null;
    const req = examRequirements(level - 1);
    return 'Pass the ' + LEVELS[level - 1].name + ' practical examination to unlock ' + LEVELS[level].name + ' content' + (req.ok ? '.' : ' (exam opens after ' + req.needLessons + ' lessons and ' + req.needLabs + ' labs of ' + LEVELS[level - 1].name + ' are complete – you have ' + req.haveLessons + ' lessons and ' + req.haveLabs + ' labs).');
  }
  function isLessonUnlocked(id) {
    const l = lesson(id); if (!l) return false;
    if (!isLevelUnlocked(l.level)) return false;
    if (st().profile.devUnlock) return true;
    for (const p of l.prereqs || []) { const ps = st().lessons[p]; if (!ps || !ps.passed) return false; }
    return true;
  }
  function lessonLockReason(id) {
    const l = lesson(id); if (!l) return 'Unknown lesson';
    if (!isLevelUnlocked(l.level)) return levelLockReason(l.level);
    const missing = (l.prereqs || []).filter(p => !(st().lessons[p] && st().lessons[p].passed)).map(p => (lesson(p) || { title: p }).title);
    return missing.length ? 'Pass the assessment of: ' + missing.join(', ') : null;
  }
  function isLabUnlocked(id) { const l = lab(id); if (!l) return false; if (!isLevelUnlocked(l.level)) return false; if (st().profile.devUnlock) return true; for (const p of l.prereqs || []) { if (lesson(p)) { const ps = st().lessons[p]; if (!ps || !ps.passed) return false; } else { const ls = st().labs[p]; if (!ls || !ls.completed) return false; } } return true; }
  function labLockReason(id) { const l = lab(id); if (!l) return 'Unknown lab'; if (!isLevelUnlocked(l.level)) return levelLockReason(l.level); const missing = (l.prereqs || []).filter(p => lesson(p) ? !(st().lessons[p] && st().lessons[p].passed) : !(st().labs[p] && st().labs[p].completed)).map(p => (lesson(p) || lab(p) || { title: p }).title); return missing.length ? 'Complete first: ' + missing.join(', ') : null; }

  // ---- lesson events ----
  function markSectionRead(id, idx) { const p = lstate(id); if (!p.read.includes(idx)) { p.read.push(idx); G().touchStreak(); } finalizeLesson(id); }
  function recordCheck(id, idx, correct) { const p = lstate(id); if (correct && !p.checks[idx]) { p.checks[idx] = true; G().addXP(XP.check, 'Knowledge check', 'check'); } }
  function recordAssessment(id, result) {
    const l = lesson(id); const p = lstate(id); const s = st();
    p.attempts++; p.lastScore = result.score; p.bestScore = Math.max(p.bestScore || 0, result.score);
    s.stats.quizzesTaken++;
    s.quizHistory.unshift({ lessonId: id, score: result.score, at: new Date().toISOString(), weakTopics: result.weakTopics || [] }); if (s.quizHistory.length > 100) s.quizHistory.length = 100;
    const pass = result.score >= ((l.assessment && l.assessment.pass) || 70);
    if (pass && !p.passed) { p.passed = true; s.stats.quizzesPassed++; G().addXP(XP.quizPass + (result.score === 100 ? XP.quizPerfectBonus : 0), 'Passed: ' + l.title, 'quiz'); }
    else if (pass) { s.stats.quizzesPassed++; G().touchStreak(); G().checkAchievements(); }
    else G().touchStreak();
    finalizeLesson(id);
    return pass;
  }
  function markPractical(id) { const p = lstate(id); if (!p.practical) { p.practical = true; } finalizeLesson(id); }
  function finalizeLesson(id) {
    const l = lesson(id); const p = lstate(id); if (!l || p.completedAt) return false;
    const allRead = l.sections.every((sec, i) => p.read.includes(i));
    const practicalOk = !l.practical || p.practical;
    if (allRead && p.passed && practicalOk) { p.completedAt = new Date().toISOString(); G().addXP(XP.lessonComplete, 'Lesson complete: ' + l.title, 'lesson'); return true; }
    return false;
  }
  // ---- labs ----
  function completeLab(id, score, extra) {
    const s = st(); const l = lab(id); if (!l) return;
    const ls = s.labs[id] || (s.labs[id] = { completed: false, bestScore: 0, attempts: 0, hintsUsed: 0 });
    ls.attempts = (ls.attempts || 0) + 1; ls.bestScore = Math.max(ls.bestScore || 0, score == null ? 100 : score);
    if (extra) Object.assign(ls, extra);
    const first = !ls.completed;
    ls.completed = true; ls.completedAt = ls.completedAt || new Date().toISOString();
    if (first) { s.stats.labsCompleted++; const kind = labKind(id); G().addXP(l.xp || (kind === 'troubleshoot' ? XP.troubleshoot : XP.lab[l.level] || 80), 'Lab complete: ' + l.title, 'lab'); }
    else { G().touchStreak(); G().checkAchievements(); }
    // mark practicals of lessons that reference this lab
    for (const les of lessons()) if (les.practical && les.practical.id === id) markPractical(les.id);
    return first;
  }
  function labAttempt(id, patch) { const s = st(); const ls = s.labs[id] || (s.labs[id] = { completed: false, bestScore: 0, attempts: 0, hintsUsed: 0 }); Object.assign(ls, patch || {}); return ls; }
  // ---- missions ----
  function missionState(id) { const s = st(); if (!s.missions[id]) s.missions[id] = { steps: {}, answers: {}, score: 0, completed: false, completedAt: null }; return s.missions[id]; }
  function completeMissionStep(id, stepId, score) { const m = missionState(id); m.steps[stepId] = { done: true, score: score == null ? 100 : score, at: new Date().toISOString() }; G().touchStreak(); }
  function completeMission(id, score) { const m = missionState(id); const mission = (D().missions || []).find(x => x.id === id); const first = !m.completed; m.score = Math.max(m.score || 0, score); m.completed = true; m.completedAt = m.completedAt || new Date().toISOString(); if (first) G().addXP((mission && mission.xp) || XP.mission, 'Mission complete: ' + (mission ? mission.title : id), 'mission'); else G().checkAchievements(); return first; }
  // ---- exams ----
  function recordExam(level, score) { const s = st(); const e = s.exams[level] || (s.exams[level] = { bestScore: 0, passed: false, attempts: 0, lastAt: null }); e.attempts++; e.bestScore = Math.max(e.bestScore, score); e.lastAt = new Date().toISOString(); const pass = score >= 75; if (pass && !e.passed) { e.passed = true; G().addXP(XP.exam, LEVELS[level].name + ' examination passed', 'exam'); if (NSA.ui) setTimeout(() => NSA.ui.toast('🎉 ' + LEVELS[level].name + ' level complete! ' + (LEVELS[level + 1] ? LEVELS[level + 1].name + ' content unlocked.' : 'You have finished the curriculum.'), 'success', 7000), 600); } else G().touchStreak(); return pass; }
  // ---- recommendations ----
  function recommendNext() {
    const s = st(); const spec = s.profile.specialization;
    const order = spec === 'security' ? ['security', 'networking'] : ['networking', 'security'];
    for (const level of [1, 2, 3]) {
      if (!isLevelUnlocked(level)) break;
      // in-progress lessons first
      const inProgress = lessonsForLevel(level).filter(l => s.lessons[l.id] && !s.lessons[l.id].completedAt && isLessonUnlocked(l.id));
      if (inProgress.length) return { kind: 'lesson', item: inProgress[0], reason: 'Continue where you left off' };
      for (const track of order) { const next = lessonsForLevel(level, track).find(l => !(s.lessons[l.id] && s.lessons[l.id].completedAt) && isLessonUnlocked(l.id)); if (next) return { kind: 'lesson', item: next, reason: 'Next in your ' + (track === 'networking' ? 'Networking' : 'Cybersecurity') + ' path' }; }
      const stats = levelStats(level);
      if (!stats.examPassed) { const req = examRequirements(level); if (req.ok) return { kind: 'exam', level, reason: 'You are ready for the ' + LEVELS[level].name + ' practical examination' }; const labNext = labsForLevel(level).find(l => !(s.labs[l.id] && s.labs[l.id].completed) && isLabUnlocked(l.id)); if (labNext) return { kind: 'lab', item: labNext, reason: 'Complete labs to unlock the ' + LEVELS[level].name + ' exam' }; }
    }
    const gaps = G().knowledgeGaps();
    if (gaps.weakLessons.length) return { kind: 'lesson', item: lesson(gaps.weakLessons[0].id), reason: 'Review a weak area (scored ' + gaps.weakLessons[0].score + '%)' };
    return { kind: 'none', reason: 'You have completed everything available. Try the daily challenge!' };
  }
  function overallProgress() {
    const s = st(); const L = lessons().length; const labs = allLabs().length; const missions = (D().missions || []).length;
    const done = lessons().filter(l => s.lessons[l.id] && s.lessons[l.id].completedAt).length + allLabs().filter(l => s.labs[l.id] && s.labs[l.id].completed).length + (D().missions || []).filter(m => s.missions[m.id] && s.missions[m.id].completed).length;
    return { done, total: L + labs + missions, pct: Math.round((done / Math.max(1, L + labs + missions)) * 100) };
  }
  function currentLevel() { for (const lv of [3, 2, 1]) if (isLevelUnlocked(lv)) return lv; return 1; }

  NSA.progress = { LEVELS, XP, lessons, lesson, lessonsForLevel, lstate, lessonProgress, allLabs, lab, labKind, labState, labsForLevel, levelStats, isLevelUnlocked, examRequirements, levelLockReason, isLessonUnlocked, lessonLockReason, isLabUnlocked, labLockReason, markSectionRead, recordCheck, recordAssessment, markPractical, finalizeLesson, completeLab, labAttempt, missionState, completeMissionStep, completeMission, recordExam, recommendNext, overallProgress, currentLevel };
})(typeof globalThis !== 'undefined' ? globalThis : window);
