/* NetSec Academy – Real-World Missions index + mission runner */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};

  NSA.components['view-missions'] = {
    data() { return { state: NSA.store.state }; },
    computed: { missions() { return NSA.data.missions || []; } },
    methods: {
      mstate(id) { return this.state.missions[id] || {}; },
      prog(m) { const ms = this.mstate(m.id); const done = Object.keys(ms.steps || {}).length; return Math.round(done / m.steps.length * 100); },
      unlocked(m) { return NSA.progress.isLevelUnlocked(m.level) || this.state.profile.devUnlock; },
      open(m) { if (this.unlocked(m)) NSA.router.navigate('/missions/' + m.id); else NSA.ui.alert(NSA.progress.levelLockReason(m.level), 'Locked'); }
    },
    template: `
    <div class="stack">
      <section-head title="Real-World Missions" sub="Scenario-based tasks an IT or security professional might face. Each ends in a scored deliverable." />
      <div class="grid cols-2">
        <div v-for="m in missions" :key="m.id" class="card clickable" :class="{locked:!unlocked(m)}" @click="open(m)">
          <div class="row between">
            <div class="row"><span style="font-size:1.6rem">{{ m.icon }}</span><div><h3 style="margin:0">{{ m.title }}</h3><div class="muted small"><level-badge :level="m.level"/> · {{ m.est }} min · {{ m.xp }} XP</div></div></div>
            <span v-if="mstate(m.id).completed" class="chip green"><nsa-icon name="check" :size="13"/> Done</span>
            <nsa-icon v-else-if="!unlocked(m)" name="lock" :size="16"/>
          </div>
          <p class="small muted mt">{{ m.scenario }}</p>
          <nsa-progress v-if="unlocked(m)" :value="prog(m)" thin :kind="mstate(m.id).completed?'green':''" />
        </div>
      </div>
    </div>`
  };

  NSA.components['view-mission'] = {
    props: { route: Object },
    data() { return { state: NSA.store.state, stepIdx: 0, answers: {}, checked: {}, examQ: null, examStep: null }; },
    computed: {
      mission() { return (NSA.data.missions || []).find(m => m.id === this.route.params.id); },
      ms() { return this.mission ? NSA.progress.missionState(this.mission.id) : null; },
      steps() { return this.mission ? this.mission.steps : []; },
      completed() { return this.ms && this.ms.completed; },
      doneCount() { return this.steps.filter(s => this.stepDone(s)).length; },
      allStepsDone() { return this.steps.every(s => this.stepDone(s)); }
    },
    methods: {
      go(p) { NSA.router.navigate(p); },
      stepDone(s) { const st = this.ms.steps[s.id]; if (st && st.done) return true; if (s.type === 'lab') { return !!(this.state.labs[s.lab] && this.state.labs[s.lab].completed); } return false; },
      stepUnlocked(i) { if (i === 0) return true; return this.stepDone(this.steps[i - 1]); },
      setAns(sid, v) { if (this.checked[sid]) return; this.answers[sid] = v; },
      checkStep(s) {
        if (s.type === 'decision' || s.type === 'knowledge') {
          const correct = this.answers[s.id] === s.answer;
          this.checked[s.id] = { correct, explain: s.explain };
          if (correct) { NSA.progress.completeMissionStep(this.mission.id, s.id, 100); this.maybeComplete(); }
        }
      },
      openLab(s) { const kind = NSA.progress.labKind(s.lab); NSA.router.navigate('/labs/' + kind + '/' + s.lab); },
      maybeComplete() {
        if (this.allStepsDone && !this.completed) {
          const score = 100;
          NSA.progress.completeMission(this.mission.id, score);
          NSA.ui.toast('Mission complete! 🎯 Deliverable earned.', 'success', 5000);
        }
      },
      refresh() { this.maybeComplete(); }
    },
    mounted() { // re-check lab-based steps on return
      this.$nextTick(() => this.maybeComplete());
    },
    template: `
    <div v-if="!mission"><empty-state text="Mission not found." /></div>
    <div v-else class="stack">
      <div class="row between"><button class="btn ghost sm" @click="go('/missions')"><nsa-icon name="arrowLeft" :size="16"/> Missions</button><span v-if="completed" class="chip green"><nsa-icon name="check" :size="13"/> Completed</span></div>
      <section-head :title="mission.icon + '  ' + mission.title" :sub="mission.role" />
      <div class="callout real"><div class="callout-title">The brief</div>{{ mission.scenario }}</div>
      <div class="card pad-sm"><div class="row"><strong class="small">Tools & resources:</strong><span v-for="t in mission.tools" :key="t" class="chip">{{ t }}</span></div></div>

      <nsa-progress :value="doneCount/steps.length*100" :kind="completed?'green':''" :label="'Progress: ' + doneCount + '/' + steps.length + ' steps'" />

      <div class="step-list">
        <div v-for="(s,i) in steps" :key="s.id" class="step" :class="{done:stepDone(s), active:!stepDone(s)&&stepUnlocked(i), locked:!stepUnlocked(i)}">
          <div class="step-num">{{ stepDone(s)?'✓':i+1 }}</div>
          <div style="flex:1">
            <div class="row between"><strong>{{ s.title }}</strong><span class="chip tiny">{{ s.type }}</span></div>
            <div v-if="!stepUnlocked(i)" class="small muted">Complete the previous step first.</div>
            <template v-else>
              <p class="small" style="margin:6px 0">{{ s.q }}</p>
              <div v-if="s.type==='decision'||s.type==='knowledge'">
                <div class="options"><div v-for="(o,oi) in s.options" :key="oi" class="option" :class="{selected:answers[s.id]===oi, correct:checked[s.id]&&s.answer===oi, wrong:checked[s.id]&&answers[s.id]===oi&&answers[s.id]!==s.answer}" @click="setAns(s.id,oi)"><span class="opt-key">{{ String.fromCharCode(65+oi) }}</span>{{ o }}</div></div>
                <button v-if="!checked[s.id]" class="btn sm primary mt" @click="checkStep(s)">Submit</button>
                <div v-if="checked[s.id]" class="feedback mt" :class="checked[s.id].correct?'ok':'bad'">{{ checked[s.id].explain }}<span v-if="!checked[s.id].correct"> — try again.</span></div>
                <button v-if="checked[s.id]&&!checked[s.id].correct" class="btn sm mt" @click="checked[s.id]=null">Retry</button>
              </div>
              <div v-else-if="s.type==='lab'">
                <button class="btn" :class="stepDone(s)?'':'primary'" @click="openLab(s)"><nsa-icon name="flask" :size="16"/> {{ stepDone(s)?'Lab complete ✓ — revisit':'Open the lab' }}</button>
                <button class="btn sm ghost" @click="refresh"><nsa-icon name="refresh" :size="14"/> I finished it</button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="completed" class="card" style="border-color:var(--green)">
        <div class="card-title"><h3><nsa-icon name="trophy" :size="18"/> Deliverable</h3><span class="chip green">+{{ mission.xp }} XP earned</span></div>
        <p>{{ mission.deliverable }}</p>
        <div class="btn-row"><button class="btn" @click="go('/resources')"><nsa-icon name="clipboard" :size="16"/> Open report templates</button><button class="btn ghost" @click="go('/missions')">Back to missions</button></div>
      </div>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
