/* NetSec Academy – assessment engine: grading, scoring, exam building, recommendations */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});

  function norm(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.]+$/, ''); }
  function fillMatches(answer, accepted) {
    const a = norm(answer); if (!a) return false;
    const list = Array.isArray(accepted) ? accepted : [accepted];
    return list.some(x => { const e = norm(x); if (e === a) return true; if (/^\/.*\/[a-z]*$/.test(String(x))) { try { const m = String(x).match(/^\/(.*)\/([a-z]*)$/); return new RegExp(m[1], m[2]).test(String(answer).trim()); } catch (err) { return false; } } return false; });
  }
  function commandMatches(answer, patterns) {
    const a = String(answer || '').trim().replace(/\s+/g, ' ');
    const list = Array.isArray(patterns) ? patterns : [patterns];
    return list.some(p => { try { return new RegExp(p, 'i').test(a); } catch (e) { return a.toLowerCase() === String(p).toLowerCase(); } });
  }
  // Grade a single question. answer shape depends on type.
  function grade(q, answer) {
    let correct = false, partial = 0, expected = '';
    switch (q.type) {
      case 'mcq': correct = Number(answer) === Number(q.answer); expected = q.options[q.answer]; partial = correct ? 1 : 0; break;
      case 'multi': { const want = (q.answer || []).slice().sort().join(','); const got = (Array.isArray(answer) ? answer : []).map(Number).sort().join(','); correct = want === got; expected = (q.answer || []).map(i => q.options[i]).join('; '); const hits = (Array.isArray(answer) ? answer : []).filter(i => q.answer.includes(Number(i))).length; const wrong = (Array.isArray(answer) ? answer : []).filter(i => !q.answer.includes(Number(i))).length; partial = correct ? 1 : Math.max(0, (hits - wrong) / q.answer.length); break; }
      case 'tf': correct = (answer === true || answer === 'true') === !!q.answer; expected = q.answer ? 'True' : 'False'; partial = correct ? 1 : 0; break;
      case 'fill': correct = fillMatches(answer, q.answer); expected = Array.isArray(q.answer) ? q.answer.filter(x => !/^\/.*\/[a-z]*$/.test(String(x)))[0] || q.display || '' : q.answer; partial = correct ? 1 : 0; break;
      case 'command': correct = commandMatches(answer, q.answer); expected = q.display || (Array.isArray(q.answer) ? q.answer[0] : q.answer); partial = correct ? 1 : 0; break;
      case 'subnet': { const ans = answer || {}; let hits = 0; const fields = q.problem.fields; for (const f of fields) if (NSA.subnet.checkAnswer(q.problem, f.key, ans[f.key])) hits++; correct = hits === fields.length; partial = hits / fields.length; expected = fields.map(f => f.label + ': ' + q.problem.answers[f.key]).join(', '); break; }
      case 'order': { const want = (q.answer || q.items.map((x, i) => i)).join(','); const got = (Array.isArray(answer) ? answer : []).join(','); correct = want === got; expected = (q.answer || q.items.map((x, i) => i)).map(i => q.items[i]).join(' → '); const seq = Array.isArray(answer) ? answer : []; let hits = 0; (q.answer || []).forEach((v, i) => { if (seq[i] === v) hits++; }); partial = correct ? 1 : hits / (q.answer || q.items).length; break; }
      case 'match': { const ans = answer || {}; let hits = 0; q.pairs.forEach((p, i) => { if (Number(ans[i]) === i) hits++; }); correct = hits === q.pairs.length; partial = hits / q.pairs.length; expected = q.pairs.map(p => p[0] + ' = ' + p[1]).join('; '); break; }
      default: correct = false;
    }
    return { correct, partial, expected, explanation: q.explain || '', lessonRef: q.lessonRef || null, topic: q.topic || null };
  }
  function gradeAll(questions, answers) {
    const results = questions.map((q, i) => Object.assign({ index: i, question: q, answer: answers[i] }, grade(q, answers[i])));
    const points = results.reduce((a, r) => a + r.partial, 0);
    const score = questions.length ? Math.round((points / questions.length) * 100) : 0;
    const wrong = results.filter(r => !r.correct);
    const weakTopics = Array.from(new Set(wrong.map(r => r.topic).filter(Boolean)));
    const reviewLessons = Array.from(new Set(wrong.map(r => r.lessonRef).filter(Boolean)));
    return { score, correct: results.filter(r => r.correct).length, total: questions.length, results, weakTopics, reviewLessons };
  }
  // Return a copy of the question with shuffled options (answer indices remapped)
  function shuffled(q, rng) {
    if (!q.options || q.noShuffle) return q;
    const idx = NSA.util.shuffle(q.options.map((o, i) => i), rng);
    const copy = Object.assign({}, q, { options: idx.map(i => q.options[i]) });
    if (q.type === 'mcq') copy.answer = idx.indexOf(q.answer);
    if (q.type === 'multi') copy.answer = q.answer.map(a => idx.indexOf(a)).sort((a, b) => a - b);
    return copy;
  }
  function prepare(questions, rng) {
    return questions.map(q => {
      if (q.type === 'subnet' && !q.problem) return Object.assign({}, q, { problem: NSA.subnet.generateProblem(rng || Math.random, q.difficulty || 'easy', q.kind) });
      return shuffled(q, rng);
    });
  }
  // Build a level exam from lesson question banks
  function buildExam(lessons, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const perLesson = opts.perLesson || 2;
    let pool = [];
    for (const l of lessons) {
      const qs = (l.assessment && l.assessment.questions || []).map(q => Object.assign({}, q, { lessonRef: q.lessonRef || l.id, topic: q.topic || l.title }));
      pool = pool.concat(NSA.util.shuffle(qs, rng).slice(0, perLesson));
    }
    pool = NSA.util.shuffle(pool, rng).slice(0, opts.max || 30);
    for (let i = 0; i < (opts.subnetProblems || 0); i++) pool.push({ type: 'subnet', q: 'Subnetting problem', difficulty: opts.subnetDifficulty || 'easy', topic: 'Subnetting', lessonRef: opts.subnetLesson || null });
    return prepare(pool, rng);
  }
  function describeType(t) { return { mcq: 'Multiple choice', multi: 'Select all that apply', tf: 'True or false', fill: 'Fill in the blank', command: 'Command challenge', subnet: 'Subnetting problem', order: 'Put in order', match: 'Match the pairs' }[t] || t; }

  NSA.quiz = { grade, gradeAll, shuffled, prepare, buildExam, describeType, norm, fillMatches, commandMatches };
})(typeof globalThis !== 'undefined' ? globalThis : window);
