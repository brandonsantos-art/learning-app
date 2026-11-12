/* NetSec Academy – reusable quiz/assessment runner component */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};

  NSA.components['quiz-runner'] = {
    props: { questions: Array, pass: { default: 70 }, title: { default: 'Assessment' }, compact: Boolean },
    emits: ['complete', 'close'],
    data() { return { answers: {}, submitted: false, result: null, idx: 0, single: !this.compact }; },
    computed: {
      prepared() { return this.questions; },
      current() { return this.prepared[this.idx]; },
      answeredCount() { return this.prepared.filter((q, i) => this.hasAnswer(i)).length; },
      allAnswered() { return this.answeredCount === this.prepared.length; }
    },
    methods: {
      qid(i) { return 'q' + i; },
      hasAnswer(i) { const a = this.answers[i]; if (a == null) return false; if (Array.isArray(a)) return a.length > 0; if (typeof a === 'object') return Object.keys(a).length > 0; return a !== ''; },
      setMcq(i, opt) { if (this.submitted) return; this.answers[i] = opt; },
      toggleMulti(i, opt) { if (this.submitted) return; const a = this.answers[i] = this.answers[i] || []; const k = a.indexOf(opt); if (k >= 0) a.splice(k, 1); else a.push(opt); },
      setTf(i, v) { if (this.submitted) return; this.answers[i] = v; },
      setFill(i, e) { this.answers[i] = e.target.value; },
      setSubnet(i, key, e) { const o = this.answers[i] = this.answers[i] || {}; o[key] = e.target.value; },
      setMatch(i, li, e) { const o = this.answers[i] = this.answers[i] || {}; o[li] = Number(e.target.value); },
      moveOrder(i, from, dir) { const q = this.prepared[i]; const cur = (this.answers[i] && this.answers[i].slice()) || q.items.map((x, k) => k); const to = from + dir; if (to < 0 || to >= cur.length) return; const t = cur[from]; cur[from] = cur[to]; cur[to] = t; this.answers[i] = cur; },
      orderList(i) { const q = this.prepared[i]; return (this.answers[i] && this.answers[i].slice()) || q.items.map((x, k) => k); },
      optClass(i, opt) {
        const q = this.prepared[i]; const sel = this.answers[i];
        if (!this.submitted) { if (q.type === 'multi') return { selected: (sel || []).includes(opt) }; return { selected: sel === opt }; }
        const correct = q.type === 'multi' ? (q.answer || []).includes(opt) : q.answer === opt;
        const chosen = q.type === 'multi' ? (sel || []).includes(opt) : sel === opt;
        return { correct, wrong: chosen && !correct, selected: chosen };
      },
      res(i) { return this.result ? this.result.results[i] : null; },
      submit() {
        if (!this.allAnswered) { NSA.ui.toast('Answer every question first (' + this.answeredCount + '/' + this.prepared.length + ')', 'error'); return; }
        const answersArr = this.prepared.map((q, i) => this.answers[i]);
        this.result = NSA.quiz.gradeAll(this.prepared, answersArr);
        this.submitted = true;
        this.$emit('complete', this.result);
        this.$nextTick(() => { try { this.$el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} });
      },
      retry() { this.answers = {}; this.submitted = false; this.result = null; this.idx = 0; this.$emit('retry'); },
      lessonTitle(id) { const l = (NSA.data.lessons || []).find(x => x.id === id); return l ? l.title : id; },
      goLesson(id) { NSA.router.navigate('/lesson/' + id); }
    },
    template: `
    <div class="quiz">
      <template v-if="!submitted">
        <div class="row between mb">
          <div class="muted small">{{ answeredCount }} / {{ prepared.length }} answered</div>
          <nsa-progress :value="answeredCount/prepared.length*100" thin style="width:140px" />
        </div>
        <div v-for="(q,i) in prepared" :key="i" class="quiz-q">
          <div class="q-num">Question {{ i+1 }} · {{ typeName(q.type) }}</div>
          <div class="q-text"><nsa-md v-if="q.type==='subnet'" :src="q.problem.question" /><nsa-md v-else :src="q.q" /></div>

          <div v-if="q.type==='mcq'||q.type==='multi'" class="options">
            <div v-for="(o,oi) in q.options" :key="oi" class="option" :class="optClass(i,oi)" @click="q.type==='multi'?toggleMulti(i,oi):setMcq(i,oi)">
              <span class="opt-key">{{ String.fromCharCode(65+oi) }}</span><span>{{ o }}</span>
            </div>
            <div v-if="q.type==='multi'" class="tiny dim">Select all that apply.</div>
          </div>

          <div v-else-if="q.type==='tf'" class="options">
            <div class="option" :class="optClass(i,true)" @click="setTf(i,true)"><span class="opt-key">T</span><span>True</span></div>
            <div class="option" :class="optClass(i,false)" @click="setTf(i,false)"><span class="opt-key">F</span><span>False</span></div>
          </div>

          <div v-else-if="q.type==='fill'||q.type==='command'">
            <input type="text" :placeholder="q.type==='command'?'type the command…':'your answer…'" @input="setFill(i,$event)" :value="answers[i]||''" spellcheck="false" :class="{mono:q.type==='command'}" />
          </div>

          <div v-else-if="q.type==='subnet'" class="grid auto-sm" style="gap:8px">
            <div v-for="f in q.problem.fields" :key="f.key" class="field">
              <label>{{ f.label }}</label>
              <input type="text" class="mono" spellcheck="false" @input="setSubnet(i,f.key,$event)" :value="(answers[i]||{})[f.key]||''" />
            </div>
          </div>

          <div v-else-if="q.type==='order'" class="list">
            <div v-for="(oi,pos) in orderList(i)" :key="oi" class="list-item" style="padding:8px 12px">
              <span class="opt-key">{{ pos+1 }}</span><div class="li-body">{{ q.items[oi] }}</div>
              <div class="li-right"><button class="btn xs" @click="moveOrder(i,pos,-1)">↑</button><button class="btn xs" @click="moveOrder(i,pos,1)">↓</button></div>
            </div>
          </div>

          <div v-else-if="q.type==='match'" class="list">
            <div v-for="(p,pi) in q.pairs" :key="pi" class="row" style="gap:10px">
              <div style="flex:1">{{ p[0] }}</div><span class="dim">→</span>
              <select style="flex:1" @change="setMatch(i,pi,$event)" :value="(answers[i]||{})[pi]">
                <option :value="undefined" disabled selected>choose…</option>
                <option v-for="(p2,pj) in q.pairs" :key="pj" :value="pj">{{ p2[1] }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="btn-row mt">
          <button class="btn primary" @click="submit"><nsa-icon name="check" :size="16"/> Submit answers</button>
          <button class="btn ghost" @click="$emit('close')">Cancel</button>
        </div>
      </template>

      <template v-else>
        <div class="card">
          <div class="result-head">
            <score-ring :value="result.score" />
            <div>
              <h2 style="margin:0">{{ result.score>=pass ? 'Passed' : 'Keep practising' }}</h2>
              <p class="muted" style="margin:4px 0">You scored {{ result.correct }} of {{ result.total }} correct ({{ result.score }}%). Passing is {{ pass }}%.</p>
              <div class="btn-row">
                <button class="btn" @click="retry"><nsa-icon name="refresh" :size="16"/> Try again</button>
                <button class="btn ghost" @click="$emit('close')">Done</button>
              </div>
            </div>
          </div>
          <div v-if="result.reviewLessons.length" class="callout tip mt">
            <div class="callout-title">Recommended review</div>
            <div class="row" style="gap:8px">
              <button v-for="lid in result.reviewLessons" :key="lid" class="btn sm" @click="goLesson(lid)"><nsa-icon name="book" :size="14"/> {{ lessonTitle(lid) }}</button>
            </div>
          </div>
        </div>

        <div v-for="(q,i) in prepared" :key="i" class="quiz-q" style="margin-top:12px">
          <div class="q-num">Question {{ i+1 }} · <span :style="res(i).correct?'color:var(--green)':'color:var(--red)'">{{ res(i).correct?'Correct':(res(i).partial>0?'Partially correct':'Incorrect') }}</span></div>
          <div class="q-text"><nsa-md v-if="q.type==='subnet'" :src="q.problem.question" /><nsa-md v-else :src="q.q" /></div>
          <div v-if="q.type==='mcq'||q.type==='multi'||q.type==='tf'" class="options">
            <template v-if="q.type==='tf'">
              <div class="option" :class="optClass(i,true)"><span class="opt-key">T</span>True</div>
              <div class="option" :class="optClass(i,false)"><span class="opt-key">F</span>False</div>
            </template>
            <div v-else v-for="(o,oi) in q.options" :key="oi" class="option" :class="optClass(i,oi)"><span class="opt-key">{{ String.fromCharCode(65+oi) }}</span>{{ o }}</div>
          </div>
          <div v-else class="small mono" style="margin-bottom:6px">Expected: {{ res(i).expected }}</div>
          <div class="feedback" :class="res(i).correct?'ok':'bad'">
            <strong>{{ res(i).correct?'Correct.':'Not quite.' }}</strong> {{ res(i).explanation }}
          </div>
        </div>
      </template>
    </div>`,
    setup() { return {}; },
    created() { this.typeName = NSA.quiz.describeType; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
