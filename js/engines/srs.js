/* NetSec Academy – spaced repetition (SM-2 variant) for flashcards */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  const GRADES = { again: 1, hard: 3, good: 4, easy: 5 };

  function defaultCard(today) { return { interval: 0, ease: 2.5, due: today || NSA.util.todayKey(), reps: 0, lapses: 0, last: null }; }
  function review(card, grade, today) {
    today = today || NSA.util.todayKey();
    const q = typeof grade === 'number' ? grade : (GRADES[grade] || 4);
    const c = Object.assign(defaultCard(today), card || {});
    if (q < 3) { c.reps = 0; c.lapses = (c.lapses || 0) + 1; c.interval = 0; c.due = today; }
    else {
      c.reps = (c.reps || 0) + 1;
      if (c.reps === 1) c.interval = q === 5 ? 3 : 1;
      else if (c.reps === 2) c.interval = q === 5 ? 8 : 6;
      else c.interval = Math.round(c.interval * (q === 3 ? 1.2 : c.ease));
      if (q === 5) c.interval = Math.round(c.interval * 1.3);
      c.interval = Math.max(1, c.interval);
      c.due = NSA.util.addDays(today, c.interval);
    }
    c.ease = Math.max(1.3, c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    c.last = today;
    return c;
  }
  function isDue(card, today) { today = today || NSA.util.todayKey(); return !card || !card.due || card.due <= today; }
  function dueCards(cards, state, today) { return cards.filter(c => isDue(state[c.id], today)); }
  function stats(cards, state, today) {
    today = today || NSA.util.todayKey();
    let newCount = 0, due = 0, learned = 0, mastered = 0;
    for (const c of cards) { const s = state[c.id]; if (!s) { newCount++; continue; } if (s.due <= today) due++; if (s.reps >= 1) learned++; if (s.interval >= 21) mastered++; }
    return { total: cards.length, new: newCount, due, learned, mastered };
  }
  function nextIntervals(card, today) { return { again: 0, hard: review(card, 'hard', today).interval, good: review(card, 'good', today).interval, easy: review(card, 'easy', today).interval }; }

  NSA.srs = { defaultCard, review, isDue, dueCards, stats, nextIntervals, GRADES };
})(typeof globalThis !== 'undefined' ? globalThis : window);
