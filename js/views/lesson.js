/* NetSec Academy – Lesson view: sections, demos, knowledge checks, final assessment */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};

  NSA.components['view-lesson'] = {
    props: { route: Object },
    data() { return { state: NSA.store.state, tab: 'learn', checkAnswers: {}, checkDone: {}, examQuestions: null }; },
    computed: {
      lesson() { return NSA.progress.lesson(this.route.params.id); },
      prog() { return this.lesson ? NSA.progress.lessonProgress(this.lesson.id) : null; },
      lstate() { return this.lesson ? NSA.progress.lstate(this.lesson.id) : null; },
      unlocked() { return this.lesson && NSA.progress.isLessonUnlocked(this.lesson.id); },
      sections() { return this.lesson ? this.lesson.sections : []; },
      allRead() { return this.sections.every((s, i) => (this.lstate.read || []).includes(i)); },
      practicalLab() { const pr = this.lesson && this.lesson.practical; if (!pr) return null; return { pr, lab: NSA.progress.lab(pr.id), done: this.state.labs[pr.id] && this.state.labs[pr.id].completed }; },
      nextLesson() { const sibs = NSA.progress.lessonsForLevel(this.lesson.level, this.lesson.track); const i = sibs.findIndex(l => l.id === this.lesson.id); return sibs[i + 1] || null; },
      refs() { return this.lesson.refs || []; }
    },
    methods: {
      isRead(i) { return (this.lstate.read || []).includes(i); },
      markRead(i) { NSA.progress.markSectionRead(this.lesson.id, i); },
      go(p) { NSA.router.navigate(p); },
      checkOk(i) { return this.checkDone[i]; },
      answerCheck(i, q, val) {
        if (this.checkDone[i]) return;
        this.checkAnswers[i] = val;
        const g = NSA.quiz.grade(q, val);
        this.checkDone[i] = { correct: g.correct, explanation: g.explanation, expected: g.expected };
        if (g.correct) NSA.progress.recordCheck(this.lesson.id, i, true);
      },
      checkOpt(i, q, opt) { if (!this.checkDone[i]) return { selected: this.checkAnswers[i] === opt }; const correct = q.type === 'mcq' ? q.answer === opt : false; return { correct, wrong: this.checkAnswers[i] === opt && !correct, selected: this.checkAnswers[i] === opt }; },
      startExam() { if (!this.allRead) { NSA.ui.toast('Read all sections before the final assessment.', 'error'); return; } this.examQuestions = NSA.quiz.prepare(this.lesson.assessment.questions, NSA.util.seededRng(NSA.util.hashString(this.lesson.id) + (this.lstate.attempts || 0))); this.tab = 'assess'; },
      onExam(result) { const passed = NSA.progress.recordAssessment(this.lesson.id, result); if (passed) setTimeout(() => { NSA.ui.toast('Lesson assessment passed!', 'success'); }, 200); },
      retryExam() { this.examQuestions = NSA.quiz.prepare(this.lesson.assessment.questions, NSA.util.seededRng(Date.now())); },
      openPractical() { const p = this.practicalLab; if (p) this.go('/labs/' + NSA.progress.labKind(p.pr.id) + '/' + p.pr.id); },
      scrollTo(i) { const el = document.getElementById('sec-' + i); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
    },
    template: `
    <div v-if="!lesson"><empty-state text="Lesson not found." /></div>
    <div v-else-if="!unlocked" class="stack">
      <section-head :title="lesson.title" />
      <div class="callout warn"><div class="callout-title"><nsa-icon name="lock" :size="14"/> Locked</div>{{ NSA.progress.lessonLockReason(lesson.id) }}</div>
      <button class="btn" @click="go('/paths')"><nsa-icon name="arrowLeft" :size="16"/> Back to paths</button>
    </div>
    <div v-else class="stack">
      <div class="row between">
        <button class="btn ghost sm" @click="go('/paths')"><nsa-icon name="arrowLeft" :size="16"/> Paths</button>
        <div class="row"><level-badge :level="lesson.level"/><level-badge :track="lesson.track"/><span class="chip"><nsa-icon name="clock" :size="13"/> {{ lesson.minutes }} min</span></div>
      </div>
      <section-head :title="lesson.title" :sub="lesson.summary" />
      <nsa-progress :value="prog.pct" :kind="prog.completed?'green':''" :label="prog.completed?'Lesson complete':'Lesson progress'" />

      <div class="tabs">
        <button :class="{active:tab==='learn'}" @click="tab='learn'">Learn</button>
        <button :class="{active:tab==='assess'}" @click="allRead?startExam():NSA.ui.toast('Finish reading first','error')">Assessment <span v-if="prog.passed">✓</span></button>
      </div>

      <template v-if="tab==='learn'">
        <div class="lesson-layout">
          <div>
            <div class="lesson-section" style="border-color:var(--accent)">
              <div class="sec-head"><nsa-icon name="target" :size="18"/><h3>Learning objectives</h3></div>
              <ul class="objectives">
                <li v-for="(o,i) in lesson.objectives" :key="i">{{ o }}</li>
              </ul>
            </div>

            <div v-for="(sec,i) in sections" :key="i" :id="'sec-'+i" class="lesson-section" :class="{read:isRead(i)}">
              <div class="sec-head">
                <nsa-icon :name="sec.type==='demo'?'play':(sec.type==='check'?'hint':(sec.type==='callout'?'info':'book'))" :size="16"/>
                <h3 v-if="sec.title">{{ sec.title }}</h3><h3 v-else>{{ sec.type==='check'?'Knowledge check':'Section ' + (i+1) }}</h3>
                <span class="spacer"></span><span v-if="isRead(i)" class="chip green" style="font-size:.7rem"><nsa-icon name="check" :size="12"/> read</span>
              </div>

              <nsa-md v-if="sec.type==='text'" :src="sec.md" />
              <div v-else-if="sec.type==='callout'" class="callout" :class="sec.tone||'note'"><div class="callout-title">{{ sec.title }}</div><nsa-md :src="sec.md" /></div>
              <div v-else-if="sec.type==='demo'">
                <nsa-md v-if="sec.md" :src="sec.md" />
                <nsa-demo :name="sec.demo" />
              </div>
              <div v-else-if="sec.type==='check'" class="quiz-q" style="background:var(--panel);margin:0">
                <div class="q-text"><nsa-md v-if="sec.question.type==='subnet'" :src="checkDone[i]?'':'Solve this subnetting problem:'" /><nsa-md :src="sec.question.q||''" /></div>
                <component :is="'check-q'" :q="sec.question" :done="checkDone[i]" :answer="checkAnswers[i]" @answer="answerCheck(i,sec.question,$event)" />
                <div v-if="checkDone[i]" class="feedback mt" :class="checkDone[i].correct?'ok':'bad'"><strong>{{ checkDone[i].correct?'Correct!':'Not quite.' }}</strong> {{ checkDone[i].explanation }}<span v-if="!checkDone[i].correct && checkDone[i].expected"> (Answer: {{ checkDone[i].expected }})</span></div>
              </div>

              <div class="mt" v-if="sec.type==='text'||sec.type==='callout'||sec.type==='demo'">
                <button v-if="!isRead(i)" class="btn sm primary" @click="markRead(i)"><nsa-icon name="check" :size="14"/> Mark as read &amp; continue</button>
                <span v-else class="small muted">✓ You've read this section.</span>
              </div>
            </div>

            <div v-if="practicalLab" class="lesson-section" style="border-color:var(--purple)">
              <div class="sec-head"><nsa-icon name="flask" :size="18"/><h3>Practical task</h3><span v-if="practicalLab.done" class="chip green">Done ✓</span></div>
              <p>Apply what you learned: <strong>{{ practicalLab.pr.title }}</strong></p>
              <button class="btn" :class="practicalLab.done?'':'primary'" @click="openPractical"><nsa-icon name="play" :size="16"/> {{ practicalLab.done?'Revisit lab':'Open the lab' }}</button>
            </div>

            <div class="lesson-section" v-if="refs.length">
              <div class="sec-head"><nsa-icon name="external" :size="16"/><h3>Official references</h3></div>
              <ul><li v-for="r in refs" :key="r.url"><a :href="r.url" target="_blank" rel="noopener">{{ r.title }}</a></li></ul>
            </div>

            <div class="card">
              <div class="row between">
                <div><strong>Ready for the assessment?</strong><div class="small muted">{{ allRead?'All sections read.':'Read every section to unlock it.' }}</div></div>
                <button class="btn primary" :disabled="!allRead" @click="startExam"><nsa-icon name="clipboard" :size="16"/> {{ prog.passed?'Retake assessment':'Take assessment' }}</button>
              </div>
            </div>
          </div>

          <aside class="lesson-side">
            <div class="card pad-sm">
              <div class="tiny dim" style="text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Contents</div>
              <div class="lesson-toc">
                <a v-for="(sec,i) in sections" :key="i" :class="{read:isRead(i)}" @click="scrollTo(i)">{{ sec.title || (sec.type==='check'?'Knowledge check':'Section '+(i+1)) }}</a>
              </div>
              <hr>
              <div class="small"><div class="row between"><span class="muted">Sections read</span><span>{{ (lstate.read||[]).filter(x=>x<sections.length).length }}/{{ sections.length }}</span></div>
              <div class="row between"><span class="muted">Best quiz</span><span>{{ lstate.bestScore }}%</span></div></div>
            </div>
          </aside>
        </div>
      </template>

      <template v-else-if="tab==='assess'">
        <div class="card">
          <div class="row between mb"><h3 style="margin:0">Final assessment — {{ lesson.title }}</h3><span class="muted small">Pass: {{ lesson.assessment.pass||70 }}%</span></div>
          <quiz-runner v-if="examQuestions" :questions="examQuestions" :pass="lesson.assessment.pass||70" @complete="onExam" @retry="retryExam" @close="tab='learn'" />
        </div>
        <div v-if="prog.passed && nextLesson" class="card">
          <div class="row between"><div><strong>Nice work!</strong><div class="small muted">Continue to the next lesson.</div></div>
          <button class="btn primary" @click="go('/lesson/'+nextLesson.id)">{{ nextLesson.title }} <nsa-icon name="chevron" :size="16"/></button></div>
        </div>
      </template>
    </div>`
  };

  // Small inline knowledge-check question component
  NSA.components['check-q'] = {
    props: { q: Object, done: Object, answer: null },
    data() { return { multi: [], fillVal: '', subnetVals: {}, orderList: null, matchVals: {} }; },
    methods: {
      pick(v) { if (this.done) return; this.$emit('answer', v); },
      toggle(opt) { if (this.done) return; const k = this.multi.indexOf(opt); if (k >= 0) this.multi.splice(k, 1); else this.multi.push(opt); this.$emit('answer', this.multi.slice()); },
      submitFill() { if (this.done) return; this.$emit('answer', this.fillVal); },
      submitSubnet() { if (this.done) return; this.$emit('answer', Object.assign({}, this.subnetVals)); },
      initOrder() { if (!this.orderList) this.orderList = this.q.items.map((x, i) => i); return this.orderList; },
      move(from, d) { if (this.done) return; const l = this.orderList; const to = from + d; if (to < 0 || to >= l.length) return; const t = l[from]; l[from] = l[to]; l[to] = t; },
      submitOrder() { this.$emit('answer', this.orderList.slice()); },
      setMatch(i, e) { this.matchVals[i] = Number(e.target.value); },
      submitMatch() { this.$emit('answer', Object.assign({}, this.matchVals)); },
      optClass(opt) { if (!this.done) return this.q.type === 'multi' ? { selected: this.multi.includes(opt) } : {}; const correct = this.q.type === 'multi' ? (this.q.answer || []).includes(opt) : this.q.answer === opt; return { correct, selected: (this.q.type === 'multi' ? this.multi : this.answer) === opt || (this.q.type === 'multi' && this.multi.includes(opt)) }; }
    },
    template: `
    <div>
      <div v-if="q.type==='mcq'" class="options">
        <div v-for="(o,i) in q.options" :key="i" class="option" :class="optClass(i)" @click="pick(i)"><span class="opt-key">{{ String.fromCharCode(65+i) }}</span>{{ o }}</div>
      </div>
      <div v-else-if="q.type==='tf'" class="options">
        <div class="option" :class="done?(q.answer?'correct':''):''" @click="pick(true)"><span class="opt-key">T</span>True</div>
        <div class="option" :class="done?(!q.answer?'correct':''):''" @click="pick(false)"><span class="opt-key">F</span>False</div>
      </div>
      <div v-else-if="q.type==='multi'">
        <div class="options"><div v-for="(o,i) in q.options" :key="i" class="option" :class="optClass(i)" @click="toggle(i)"><span class="opt-key">{{ String.fromCharCode(65+i) }}</span>{{ o }}</div></div>
        <button v-if="!done" class="btn sm mt" @click="$emit('answer', multi.slice())">Submit</button>
      </div>
      <div v-else-if="q.type==='fill'||q.type==='command'" class="inline-form">
        <input :class="{mono:q.type==='command'}" v-model="fillVal" :disabled="!!done" spellcheck="false" placeholder="your answer…" @keyup.enter="submitFill" />
        <button v-if="!done" class="btn sm primary" @click="submitFill">Check</button>
      </div>
      <div v-else-if="q.type==='subnet'">
        <div class="grid auto-sm" style="gap:8px">
          <div v-for="f in q.problem.fields" :key="f.key" class="field"><label>{{ f.label }}</label><input class="mono" v-model="subnetVals[f.key]" :disabled="!!done" spellcheck="false"/></div>
        </div>
        <button v-if="!done" class="btn sm primary mt" @click="submitSubnet">Check</button>
        <div v-if="done" class="small mono mt">Answer: <span v-for="f in q.problem.fields" :key="f.key">{{ f.label }}={{ q.problem.answers[f.key] }} </span></div>
      </div>
      <div v-else-if="q.type==='order'">
        <div class="list">
          <div v-for="(oi,pos) in initOrder()" :key="oi" class="list-item" style="padding:6px 10px"><span class="opt-key">{{ pos+1 }}</span><div class="li-body">{{ q.items[oi] }}</div><div class="li-right"><button class="btn xs" @click="move(pos,-1)" :disabled="!!done">↑</button><button class="btn xs" @click="move(pos,1)" :disabled="!!done">↓</button></div></div>
        </div>
        <button v-if="!done" class="btn sm primary mt" @click="submitOrder">Check order</button>
      </div>
      <div v-else-if="q.type==='match'">
        <div class="list"><div v-for="(p,pi) in q.pairs" :key="pi" class="row" style="gap:10px"><div style="flex:1">{{ p[0] }}</div><span class="dim">→</span><select style="flex:1" :disabled="!!done" @change="setMatch(pi,$event)"><option disabled selected>choose…</option><option v-for="(p2,pj) in q.pairs" :key="pj" :value="pj">{{ p2[1] }}</option></select></div></div>
        <button v-if="!done" class="btn sm primary mt" @click="submitMatch">Check</button>
      </div>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
