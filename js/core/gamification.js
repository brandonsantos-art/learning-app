/* NetSec Academy – XP, levels, ranks, streaks, achievements, skill proficiency */
(function (global) {
  const NSA = global.NSA;
  const st = () => NSA.store.state;
  const U = () => NSA.util;

  const SKILLS = [
    { id: 'networking', name: 'Networking' }, { id: 'netadmin', name: 'Network Administration' }, { id: 'linux', name: 'Linux' }, { id: 'windows', name: 'Windows Administration' },
    { id: 'security', name: 'Cybersecurity' }, { id: 'hacking', name: 'Ethical Hacking' }, { id: 'forensics', name: 'Digital Forensics' }, { id: 'cloud', name: 'Cloud Security' }, { id: 'automation', name: 'Network Automation' }
  ];
  function xpForLevel(n) { return n <= 1 ? 0 : Math.round(120 * Math.pow(n - 1, 1.5)); }
  function levelInfo(xp) {
    xp = xp == null ? st().xp : xp;
    let level = 1; while (xpForLevel(level + 1) <= xp) level++;
    const cur = xpForLevel(level), next = xpForLevel(level + 1);
    return { level, cur, next, into: xp - cur, needed: next - cur, pct: Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100)) };
  }
  const TITLES = ['Newcomer', 'Cable Puller', 'Help Desk Hero', 'Packet Pusher', 'Subnet Sorcerer', 'Route Ranger', 'Switch Whisperer', 'Firewall Keeper', 'Log Hunter', 'Incident Wrangler', 'Network Architect', 'Security Sentinel', 'Infrastructure Sage', 'Grandmaster'];
  function title(level) { return TITLES[Math.min(TITLES.length - 1, Math.max(0, (level || levelInfo().level) - 1))]; }
  function rank() {
    const ex = st().exams || {};
    if (ex[3] && ex[3].passed) return { name: 'Professional', level: 4, color: 'purple' };
    if (ex[2] && ex[2].passed) return { name: 'Expert', level: 3, color: 'red' };
    if (ex[1] && ex[1].passed) return { name: 'Intermediate', level: 2, color: 'amber' };
    return { name: 'Beginner', level: 1, color: 'green' };
  }

  function recordActivity(type, label, xp) {
    const s = st();
    s.activity.unshift({ t: new Date().toISOString(), type, label, xp: xp || 0 });
    if (s.activity.length > 60) s.activity.length = 60;
  }
  function addXP(amount, label, type) {
    if (!amount) return;
    const s = st();
    const before = levelInfo(s.xp).level;
    s.xp += amount;
    recordActivity(type || 'xp', label || 'XP earned', amount);
    if (NSA.ui) NSA.ui.toast('+' + amount + ' XP · ' + (label || ''), 'xp');
    const after = levelInfo(s.xp).level;
    if (after > before && NSA.ui) setTimeout(() => NSA.ui.toast('Level up! You are now level ' + after + ' – ' + title(after), 'success', 5000), 400);
    touchStreak();
    checkAchievements();
  }
  function touchStreak() {
    const s = st(); const today = U().todayKey();
    if (s.streak.lastActive === today) { s.streak.days[today] = true; return; }
    const yesterday = U().addDays(today, -1);
    s.streak.current = s.streak.lastActive === yesterday ? (s.streak.current || 0) + 1 : 1;
    s.streak.lastActive = today; s.streak.days[today] = true;
    if (s.streak.current > (s.streak.best || 0)) s.streak.best = s.streak.current;
    // prune old days
    const keys = Object.keys(s.streak.days).sort(); if (keys.length > 120) keys.slice(0, keys.length - 120).forEach(k => delete s.streak.days[k]);
  }
  function streakStatus() {
    const s = st(); const today = U().todayKey(); const yesterday = U().addDays(today, -1);
    const alive = s.streak.lastActive === today || s.streak.lastActive === yesterday;
    return { current: alive ? (s.streak.current || 0) : 0, best: s.streak.best || 0, activeToday: s.streak.lastActive === today, days: s.streak.days };
  }

  // Counters used by achievements and the dashboard
  function context() {
    const s = st(); const D = NSA.data;
    const lessons = D.lessons || [];
    const lessonsDone = lessons.filter(l => s.lessons[l.id] && s.lessons[l.id].completedAt).length;
    const levelLessons = {}; const levelDone = {};
    for (const lv of [1, 2, 3]) { const L = lessons.filter(l => l.level === lv); const done = L.filter(l => s.lessons[l.id] && s.lessons[l.id].completedAt).length; levelLessons[lv] = { done, total: L.length }; levelDone[lv] = L.length > 0 && done === L.length; }
    const labs = D.labs || {};
    const labDone = id => s.labs[id] && s.labs[id].completed;
    const count = arr => (arr || []).filter(l => labDone(l.id)).length;
    const examsPassed = { 1: !!(s.exams[1] && s.exams[1].passed), 2: !!(s.exams[2] && s.exams[2].passed), 3: !!(s.exams[3] && s.exams[3].passed) };
    return {
      xp: s.xp, stats: s.stats, lessonsDone, levelLessons, levelDone, examsPassed,
      labsDone: Object.keys(s.labs).filter(labDone).length,
      netsimDone: count(labs.netsim), terminalDone: count(labs.terminal), securityDone: count(labs.security), troubleshootDone: count(labs.troubleshoot),
      missionsDone: Object.keys(s.missions).filter(id => s.missions[id].completed).length,
      quizzesPassed: s.stats.quizzesPassed || 0, perfectQuizzes: (s.quizHistory || []).filter(q => q.score === 100).length,
      bestStreak: s.streak.best || 0, dailyDone: Object.keys(s.challenges.daily || {}).filter(k => s.challenges.daily[k].done).length,
      distinctCommands: (s.stats.distinctCommands || []).length, notes: (s.notes || []).length, commandsSaved: (s.commands || []).length
    };
  }
  function checkAchievements() {
    const s = st(); const ctx = context(); const earned = [];
    for (const a of NSA.data.achievements || []) {
      if (s.achievements[a.id]) continue;
      let hit = false; try { hit = !!a.test(ctx); } catch (e) { hit = false; }
      if (hit) { s.achievements[a.id] = new Date().toISOString(); earned.push(a); }
    }
    for (const a of earned) {
      recordActivity('achievement', 'Achievement unlocked: ' + a.title, a.xp);
      if (a.xp) s.xp += a.xp;
      if (NSA.ui) NSA.ui.toast(a.icon + ' Achievement unlocked: ' + a.title + (a.xp ? ' (+' + a.xp + ' XP)' : ''), 'success', 5000);
    }
    return earned;
  }
  function achievementProgress(a) { const ctx = context(); try { const p = a.progress ? a.progress(ctx) : [0, 1]; return { done: Math.min(p[0], p[1]), total: p[1], pct: Math.min(100, Math.round((p[0] / p[1]) * 100)) }; } catch (e) { return { done: 0, total: 1, pct: 0 }; } }

  // Skill proficiency: weighted completion of tagged lessons, labs and missions
  function skillItems() {
    const D = NSA.data; const items = [];
    for (const l of D.lessons || []) items.push({ id: l.id, kind: 'lesson', skills: l.skills || {}, title: l.title, level: l.level });
    for (const k of Object.keys(D.labs || {})) for (const l of D.labs[k]) items.push({ id: l.id, kind: 'lab', skills: l.skills || {}, title: l.title, level: l.level });
    for (const m of D.missions || []) items.push({ id: m.id, kind: 'mission', skills: m.skills || {}, title: m.title, level: m.level });
    return items;
  }
  function itemDone(item) {
    const s = st();
    if (item.kind === 'lesson') return !!(s.lessons[item.id] && s.lessons[item.id].completedAt);
    if (item.kind === 'lab') return !!(s.labs[item.id] && s.labs[item.id].completed);
    if (item.kind === 'mission') return !!(s.missions[item.id] && s.missions[item.id].completed);
    return false;
  }
  function skills() {
    const items = skillItems();
    return SKILLS.map(sk => {
      let total = 0, earned = 0;
      for (const it of items) { const w = it.skills[sk.id] || 0; if (!w) continue; total += w; if (itemDone(it)) earned += w; }
      return { id: sk.id, name: sk.name, total, earned, pct: total ? Math.round((earned / total) * 100) : 0 };
    });
  }
  function knowledgeGaps() {
    const s = st(); const gaps = [];
    const weakLessons = (NSA.data.lessons || []).filter(l => { const p = s.lessons[l.id]; return p && p.attempts > 0 && (p.bestScore || 0) < 80; }).map(l => ({ kind: 'lesson', id: l.id, title: l.title, score: s.lessons[l.id].bestScore || 0 }));
    const weakSkills = skills().filter(k => k.pct < 35 && k.total > 0).map(k => ({ kind: 'skill', id: k.id, title: k.name, pct: k.pct }));
    return { weakLessons: weakLessons.sort((a, b) => a.score - b.score).slice(0, 5), weakSkills: weakSkills.sort((a, b) => a.pct - b.pct).slice(0, 3), lessonsNeedingReview: gaps };
  }

  NSA.gamification = { SKILLS, xpForLevel, levelInfo, title, rank, addXP, recordActivity, touchStreak, streakStatus, context, checkAchievements, achievementProgress, skills, skillItems, knowledgeGaps };
})(typeof globalThis !== 'undefined' ? globalThis : window);
