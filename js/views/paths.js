/* NetSec Academy – Learning Paths view (also /networking and /security via track prop) */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};

  NSA.components['view-paths'] = {
    props: { track: String, route: Object },
    data() { return { state: NSA.store.state, level: this.initialLevel() }; },
    computed: {
      P() { return NSA.progress; },
      heading() { return this.track === 'networking' ? 'Networking Path' : this.track === 'security' ? 'Cybersecurity Path' : 'Learning Paths'; },
      sub() { return this.track ? 'Lessons, demos, labs and a final exam for each level.' : 'Three levels from absolute beginner to professional. Unlock each level by passing its practical exam.'; },
      levelStat() { return this.P.levelStats(this.level); },
      unlocked() { return this.P.isLevelUnlocked(this.level); },
      lockReason() { return this.P.levelLockReason(this.level); },
      lessons() { return this.P.lessonsForLevel(this.level, this.track); },
      netLessons() { return this.P.lessonsForLevel(this.level, 'networking'); },
      secLessons() { return this.P.lessonsForLevel(this.level, 'security'); },
      labs() { return this.P.labsForLevel(this.level); },
      examReq() { return this.P.examRequirements(this.level); }
    },
    methods: {
      initialLevel() { try { return this.track ? (NSA.store.state.profile.lastLevel || NSA.progress.currentLevel()) : NSA.progress.currentLevel(); } catch (e) { return 1; } },
      lp(id) { return this.P.lessonProgress(id); },
      go(p) { NSA.router.navigate(p); },
      openLesson(l) { if (this.P.isLessonUnlocked(l.id)) this.go('/lesson/' + l.id); else NSA.ui.alert(this.P.lessonLockReason(l.id), 'Locked'); },
      openLab(l) { if (this.P.isLabUnlocked(l.id)) this.go('/labs/' + this.P.labKind(l.id) + '/' + l.id); else NSA.ui.alert(this.P.labLockReason(l.id), 'Locked'); },
      labState(id) { return this.P.labState(id); },
      lessonSub(l) { const p = this.lp(l.id); return p.completed ? 'Completed' : p.started ? p.pct + '% · best quiz ' + p.bestScore + '%' : l.minutes + ' min'; },
      lessonBadge(l) { const p = this.lp(l.id); if (p.completed) return null; if (!this.P.isLessonUnlocked(l.id)) return null; return null; },
      examBtn() { if (this.levelStat.examPassed) return { label: 'Exam passed ✓', cls: 'success', disabled: false }; if (this.examReq.ok) return { label: 'Take the ' + this.levelStat.name + ' exam', cls: 'primary', disabled: false }; return { label: 'Exam locked', cls: '', disabled: true }; },
      startExam() { if (this.examReq.ok || this.levelStat.examPassed) this.go('/assessments/exam/' + this.level); else NSA.ui.alert('The exam opens after you complete ' + this.examReq.needLessons + ' lessons and ' + this.examReq.needLabs + ' labs of this level. You have ' + this.examReq.haveLessons + ' lessons and ' + this.examReq.haveLabs + ' labs.', 'Not ready yet'); }
    },
    watch: { level(v) { NSA.store.state.profile.lastLevel = v; } },
    template: `
    <div class="stack">
      <section-head :title="heading" :sub="sub" />
      <div class="tabs">
        <button v-for="l in [1,2,3]" :key="l" :class="{active:level===l}" @click="level=l">
          {{ ['','Beginner','Intermediate','Expert'][l] }}
          <nsa-icon v-if="!P.isLevelUnlocked(l)" name="lock" :size="12" />
          <nsa-icon v-else-if="P.levelStats(l).examPassed" name="check" :size="12" />
        </button>
      </div>

      <div v-if="!unlocked" class="callout warn"><div class="callout-title"><nsa-icon name="lock" :size="14"/> Level locked</div>{{ lockReason }}</div>

      <div class="card">
        <div class="row between">
          <div><h3 style="margin:0">{{ levelStat.name }} — {{ levelStat.sub }}</h3>
            <div class="muted small">{{ levelStat.lessonsDone }}/{{ levelStat.lessons }} lessons · {{ levelStat.labsDone }}/{{ levelStat.labs }} labs complete</div></div>
          <button class="btn" :class="examBtn().cls" :disabled="examBtn().disabled && !levelStat.examPassed" @click="startExam"><nsa-icon name="clipboard" :size="16"/> {{ examBtn().label }}</button>
        </div>
        <nsa-progress :value="levelStat.pct" style="margin-top:10px" :kind="levelStat.examPassed?'green':''" />
      </div>

      <template v-if="unlocked">
        <div v-if="!track" class="grid cols-2">
          <div class="card">
            <div class="card-title"><h3><nsa-icon name="network" :size="18"/> Networking</h3><level-badge track="networking"/></div>
            <div class="list">
              <list-tile v-for="l in netLessons" :key="l.id" icon="book" :title="l.title" :sub="lessonSub(l)" :done="lp(l.id).completed" :locked="!P.isLessonUnlocked(l.id)" @click.native="openLesson(l)" style="cursor:pointer" />
            </div>
          </div>
          <div class="card">
            <div class="card-title"><h3><nsa-icon name="shield" :size="18"/> Cybersecurity</h3><level-badge track="security"/></div>
            <div class="list">
              <list-tile v-for="l in secLessons" :key="l.id" icon="book" :title="l.title" :sub="lessonSub(l)" :done="lp(l.id).completed" :locked="!P.isLessonUnlocked(l.id)" @click.native="openLesson(l)" style="cursor:pointer" />
            </div>
          </div>
        </div>
        <div v-else class="card">
          <div class="card-title"><h3>Lessons</h3></div>
          <div class="list">
            <div v-for="l in lessons" :key="l.id" class="list-item" :class="{locked:!P.isLessonUnlocked(l.id)}" @click="openLesson(l)" style="cursor:pointer">
              <div class="li-icon" :class="{done:lp(l.id).completed}"><nsa-icon :name="!P.isLessonUnlocked(l.id)?'lock':(lp(l.id).completed?'check':'book')" :size="18"/></div>
              <div class="li-body"><div class="li-title">{{ l.title }}</div><div class="li-sub"><span>{{ lessonSub(l) }}</span><span v-if="lp(l.id).started && !lp(l.id).completed" class="dim">· {{ lp(l.id).sectionsRead }}/{{ lp(l.id).total }} sections</span></div></div>
              <div class="li-right"><nsa-progress v-if="lp(l.id).started && !lp(l.id).completed" :value="lp(l.id).pct" thin style="width:70px"/><nsa-icon name="chevron" :size="16"/></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><h3><nsa-icon name="flask" :size="18"/> Labs for this level</h3><button class="btn sm ghost" @click="go('/labs')">All labs</button></div>
          <div class="grid auto">
            <div v-for="l in labs" :key="l.id" class="card pad-sm" :class="{locked:!P.isLabUnlocked(l.id)}" :style="P.isLabUnlocked(l.id)?'cursor:pointer':'opacity:.6'" @click="openLab(l)">
              <div class="row between"><strong class="small">{{ l.title }}</strong><span v-if="labState(l.id).completed" class="chip green"><nsa-icon name="check" :size="12"/></span><nsa-icon v-else-if="!P.isLabUnlocked(l.id)" name="lock" :size="14"/></div>
              <div class="tiny dim" style="margin-top:4px">{{ l.brief }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
