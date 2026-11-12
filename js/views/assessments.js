/* NetSec Academy – Assessments hub + level examinations */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};

  NSA.components['view-assessments'] = {
    data() { return { state: NSA.store.state }; },
    computed: {
      P() { return NSA.progress; },
      levels() { return [1, 2, 3].map(l => { const st = this.P.levelStats(l); const req = this.P.examRequirements(l); const ex = this.state.exams[l] || {}; return { level: l, name: st.name, unlocked: this.P.isLevelUnlocked(l), ready: req.ok, req, passed: !!ex.passed, best: ex.bestScore || 0, attempts: ex.attempts || 0 }; }); },
      history() { return (this.state.quizHistory || []).slice(0, 12); }
    },
    methods: {
      go(p) { NSA.router.navigate(p); },
      startExam(l) { if (l.passed || l.ready) this.go('/assessments/exam/' + l.level); else NSA.ui.alert('The ' + l.name + ' exam opens after you complete ' + l.req.needLessons + ' lessons and ' + l.req.needLabs + ' labs of that level. You have ' + l.req.haveLessons + ' lessons and ' + l.req.haveLabs + ' labs.', 'Not ready yet'); },
      lessonTitle(id) { const les = this.P.lesson(id); return les ? les.title : id; },
      practiceQuiz() {
        const pool = []; (NSA.data.lessons || []).forEach(les => { if (this.state.lessons[les.id] && this.state.lessons[les.id].completedAt) (les.assessment.questions || []).forEach(q => pool.push(Object.assign({}, q, { lessonRef: les.id, topic: les.title }))); });
        if (pool.length < 5) { NSA.ui.toast('Complete a few lessons first to unlock a practice quiz.', 'error'); return; }
        const qs = NSA.quiz.prepare(NSA.util.shuffle(pool).slice(0, 10), Math.random);
        NSA.ui.openModal({ title: 'Practice quiz (mixed)', wide: true, component: 'quiz-modal', props: { questions: qs, pass: 70 }, actions: [] });
      }
    },
    template: `
    <div class="stack">
      <section-head title="Assessments" sub="Each level ends in a practical examination. Pass it (75%) to certify the level and unlock the next.">
        <button class="btn" @click="practiceQuiz"><nsa-icon name="refresh" :size="16"/> Mixed practice quiz</button>
      </section-head>

      <div class="grid cols-3">
        <div v-for="l in levels" :key="l.level" class="card" :style="l.passed?'border-color:var(--green)':''">
          <div class="card-title"><h3>{{ l.name }} Exam</h3><level-badge :level="l.level"/></div>
          <div v-if="!l.unlocked" class="empty" style="padding:18px"><nsa-icon name="lock" :size="24"/><p class="small mt">Pass the previous level's exam to unlock.</p></div>
          <template v-else>
            <div class="row between small"><span class="muted">Status</span><span :style="l.passed?'color:var(--green)':''">{{ l.passed?'Certified ✓':(l.ready?'Ready':'Locked') }}</span></div>
            <div class="row between small"><span class="muted">Best score</span><span>{{ l.best }}%</span></div>
            <div class="row between small"><span class="muted">Requirement</span><span>{{ l.req.haveLessons }}/{{ l.req.needLessons }} lessons · {{ l.req.haveLabs }}/{{ l.req.needLabs }} labs</span></div>
            <button class="btn block mt" :class="l.passed?'success':(l.ready?'primary':'')" @click="startExam(l)"><nsa-icon name="clipboard" :size="16"/> {{ l.passed?'Retake exam':(l.ready?'Take exam':'Not ready') }}</button>
          </template>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><h3>Assessment types in this course</h3></div>
        <div class="grid auto-sm small">
          <div class="chip">Multiple choice</div><div class="chip">Select all that apply</div><div class="chip">True / false</div>
          <div class="chip">Fill in the blank</div><div class="chip">Subnetting problems</div><div class="chip">Command challenges</div>
          <div class="chip">Put in order</div><div class="chip">Match the pairs</div><div class="chip">Lab objectives</div>
        </div>
        <p class="small muted mt">Every assessment explains wrong answers, shows the correct solution and recommends lessons to review.</p>
      </div>

      <div class="card" v-if="history.length">
        <div class="card-title"><h3>Recent quiz results</h3></div>
        <div class="list">
          <div v-for="(h,i) in history" :key="i" class="row between small" style="padding:6px 0;border-bottom:1px solid var(--border)">
            <span>{{ lessonTitle(h.lessonId) }}</span>
            <span class="row"><span class="chip" :class="h.score>=70?'green':'amber'">{{ h.score }}%</span><span class="dim tiny">{{ NSA.util.timeAgo(h.at) }}</span></span>
          </div>
        </div>
      </div>
    </div>`
  };

  NSA.components['view-exam'] = {
    props: { route: Object },
    data() { return { state: NSA.store.state, started: false, questions: null, result: null, attempt: 0 }; },
    computed: {
      level() { return Number(this.route.params.level); },
      levelName() { return NSA.progress.LEVELS[this.level] ? NSA.progress.LEVELS[this.level].name : ''; },
      ready() { return NSA.progress.examRequirements(this.level).ok || (this.state.exams[this.level] && this.state.exams[this.level].passed); },
      lessons() { return NSA.progress.lessonsForLevel(this.level); }
    },
    methods: {
      go(p) { NSA.router.navigate(p); },
      build() { const rng = NSA.util.seededRng(NSA.util.hashString('exam' + this.level) + this.attempt + Date.now() % 1000); this.questions = NSA.quiz.buildExam(this.lessons, { rng, perLesson: 2, max: this.level === 1 ? 24 : 20, subnetProblems: this.level === 1 ? 3 : this.level === 2 ? 4 : 2, subnetDifficulty: this.level === 1 ? 'easy' : this.level === 2 ? 'medium' : 'hard' }); },
      start() { this.attempt++; this.build(); this.started = true; this.result = null; },
      onComplete(result) { this.result = result; const passed = NSA.progress.recordExam(this.level, result.score); },
      retry() { this.start(); }
    },
    template: `
    <div class="stack">
      <div class="row between"><button class="btn ghost sm" @click="go('/assessments')"><nsa-icon name="arrowLeft" :size="16"/> Assessments</button><level-badge :level="level"/></div>
      <section-head :title="levelName + ' Practical Examination'" :sub="'Comprehensive assessment of Level ' + level + '. You need 75% to certify this level.'" />

      <div v-if="!ready" class="callout warn"><div class="callout-title"><nsa-icon name="lock" :size="14"/> Not ready</div>Complete more lessons and labs of this level first. See the requirement on the Assessments page.</div>

      <template v-else>
        <div v-if="!started" class="card center">
          <nsa-icon name="clipboard" :size="40" />
          <h3 class="mt">Ready to certify Level {{ level }}?</h3>
          <p class="muted">The exam mixes questions from every lesson in this level, including live subnetting problems. Take your time — you can retake it.</p>
          <button class="btn primary" @click="start"><nsa-icon name="play" :size="16"/> Begin examination</button>
        </div>
        <div v-else class="card">
          <quiz-runner :questions="questions" :pass="75" :title="levelName + ' Exam'" @complete="onComplete" @retry="retry" @close="go('/assessments')" :key="attempt" />
        </div>
        <div v-if="result && result.score>=75" class="card" style="border-color:var(--green)">
          <div class="row between"><div><h3 style="margin:0"><nsa-icon name="trophy" :size="18"/> Level {{ level }} certified!</h3><p class="small muted" style="margin:4px 0">{{ level<3 ? NSA.progress.LEVELS[level+1].name + ' content is now unlocked.' : 'You have completed the full curriculum. Outstanding work.' }}</p></div>
          <button class="btn primary" @click="go('/paths')">{{ level<3?'Explore the next level':'View all paths' }}</button></div>
        </div>
      </template>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
