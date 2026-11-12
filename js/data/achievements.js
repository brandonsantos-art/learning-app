/* NetSec Academy – achievements (badges). test(ctx) receives computed progress counters. */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {};
  const A = (id, icon, title, desc, xp, test, progress) => ({ id, icon, title, desc, xp, test, progress });
  NSA.data.achievements = [
    A('first-steps', '🚀', 'First Steps', 'Complete your first lesson.', 25, c => c.lessonsDone >= 1, c => [c.lessonsDone, 1]),
    A('bookworm', '📚', 'Bookworm', 'Complete 5 lessons.', 50, c => c.lessonsDone >= 5, c => [c.lessonsDone, 5]),
    A('scholar', '🎓', 'Scholar', 'Complete 15 lessons.', 100, c => c.lessonsDone >= 15, c => [c.lessonsDone, 15]),
    A('foundation', '🏗️', 'Solid Foundation', 'Complete every Beginner lesson.', 200, c => c.levelDone[1], c => [c.levelLessons[1].done, c.levelLessons[1].total]),
    A('administrator', '🛠️', 'Network Administrator', 'Complete every Intermediate lesson.', 300, c => c.levelDone[2], c => [c.levelLessons[2].done, c.levelLessons[2].total]),
    A('expert', '🏆', 'Expert', 'Complete every Expert lesson.', 500, c => c.levelDone[3], c => [c.levelLessons[3].done, c.levelLessons[3].total]),
    A('perfect-score', '💯', 'Perfect Score', 'Score 100% on any lesson assessment.', 50, c => c.perfectQuizzes >= 1, c => [c.perfectQuizzes, 1]),
    A('quiz-master', '🧠', 'Quiz Master', 'Pass 20 assessments.', 100, c => c.quizzesPassed >= 20, c => [c.quizzesPassed, 20]),
    A('lab-rat', '🧪', 'Lab Rat', 'Complete your first virtual lab.', 40, c => c.labsDone >= 1, c => [c.labsDone, 1]),
    A('lab-veteran', '⚗️', 'Lab Veteran', 'Complete 10 virtual labs.', 150, c => c.labsDone >= 10, c => [c.labsDone, 10]),
    A('network-builder', '🔌', 'Network Builder', 'Get a successful ping between two devices you configured in the simulator.', 50, c => c.stats.pingsSuccess >= 1, c => [Math.min(1, c.stats.pingsSuccess), 1]),
    A('packet-herder', '📡', 'Packet Herder', 'Achieve 50 successful pings in the simulator.', 100, c => c.stats.pingsSuccess >= 50, c => [c.stats.pingsSuccess, 50]),
    A('terminal-explorer', '⌨️', 'Terminal Explorer', 'Run 15 different commands in the terminal labs.', 75, c => c.distinctCommands >= 15, c => [c.distinctCommands, 15]),
    A('shell-wizard', '🧙', 'Shell Wizard', 'Run 40 different commands in the terminal labs.', 150, c => c.distinctCommands >= 40, c => [c.distinctCommands, 40]),
    A('subnet-apprentice', '🔢', 'Subnet Apprentice', 'Solve 10 subnetting problems correctly.', 75, c => c.stats.subnetCorrect >= 10, c => [c.stats.subnetCorrect, 10]),
    A('subnet-master', '🧮', 'Subnet Master', 'Solve 50 subnetting problems correctly.', 200, c => c.stats.subnetCorrect >= 50, c => [c.stats.subnetCorrect, 50]),
    A('troubleshooter', '🔧', 'Troubleshooter', 'Solve 3 troubleshooting scenarios.', 100, c => c.troubleshootDone >= 3, c => [c.troubleshootDone, 3]),
    A('phish-spotter', '🎣', 'Phish Spotter', 'Correctly classify 5 phishing emails.', 50, c => c.stats.phishingSpotted >= 5, c => [c.stats.phishingSpotted, 5]),
    A('blue-team', '🛡️', 'Blue Team', 'Complete 5 cybersecurity labs.', 150, c => c.securityDone >= 5, c => [c.securityDone, 5]),
    A('first-mission', '🎯', 'Field Work', 'Complete your first Real-World Mission.', 150, c => c.missionsDone >= 1, c => [c.missionsDone, 1]),
    A('consultant', '💼', 'Consultant', 'Complete all six Real-World Missions.', 500, c => c.missionsDone >= 6, c => [c.missionsDone, 6]),
    A('streak-3', '🔥', 'Warming Up', 'Maintain a 3-day learning streak.', 30, c => c.bestStreak >= 3, c => [c.bestStreak, 3]),
    A('streak-7', '🔥', 'On Fire', 'Maintain a 7-day learning streak.', 100, c => c.bestStreak >= 7, c => [c.bestStreak, 7]),
    A('streak-30', '☄️', 'Unstoppable', 'Maintain a 30-day learning streak.', 400, c => c.bestStreak >= 30, c => [c.bestStreak, 30]),
    A('daily-5', '📅', 'Daily Habit', 'Complete 5 daily challenges.', 75, c => c.dailyDone >= 5, c => [c.dailyDone, 5]),
    A('flashcard-fan', '🃏', 'Flashcard Fan', 'Review 100 flashcards.', 75, c => c.stats.flashReviews >= 100, c => [c.stats.flashReviews, 100]),
    A('certified-l1', '📜', 'Level 1 Certified', 'Pass the Beginner practical examination.', 250, c => c.examsPassed[1], c => [c.examsPassed[1] ? 1 : 0, 1]),
    A('certified-l2', '📜', 'Level 2 Certified', 'Pass the Intermediate practical examination.', 400, c => c.examsPassed[2], c => [c.examsPassed[2] ? 1 : 0, 1]),
    A('certified-l3', '🏅', 'Level 3 Certified', 'Pass the Expert practical examination.', 600, c => c.examsPassed[3], c => [c.examsPassed[3] ? 1 : 0, 1]),
    A('xp-1000', '⭐', 'Rising Star', 'Earn 1,000 XP.', 0, c => c.xp >= 1000, c => [c.xp, 1000]),
    A('xp-5000', '🌟', 'Veteran', 'Earn 5,000 XP.', 0, c => c.xp >= 5000, c => [c.xp, 5000]),
    A('note-taker', '📝', 'Note Taker', 'Write 5 study notes.', 30, c => c.notes >= 5, c => [c.notes, 5]),
    A('cli-collector', '📋', 'Command Collector', 'Save 10 commands to your personal command library.', 30, c => c.commandsSaved >= 10, c => [c.commandsSaved, 10])
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
