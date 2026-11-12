/* NetSec Academy – Achievements & skill tree view */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};

  NSA.components['view-achievements'] = {
    data() { return { state: NSA.store.state, tab: 'badges' }; },
    computed: {
      G() { return NSA.gamification; },
      achievements() { return NSA.data.achievements || []; },
      earnedCount() { return this.achievements.filter(a => this.state.achievements[a.id]).length; },
      totalXpFromAch() { return this.achievements.filter(a => this.state.achievements[a.id]).reduce((s, a) => s + (a.xp || 0), 0); },
      level() { return this.G.levelInfo(); },
      skills() { return this.G.skills(); },
      ranks() { return [
        { name: 'Beginner', need: 'Start learning', has: true, color: 'green' },
        { name: 'Intermediate', need: 'Pass the Level 1 exam', has: !!(this.state.exams[1] && this.state.exams[1].passed), color: 'amber' },
        { name: 'Expert', need: 'Pass the Level 2 exam', has: !!(this.state.exams[2] && this.state.exams[2].passed), color: 'red' },
        { name: 'Professional', need: 'Pass the Level 3 exam', has: !!(this.state.exams[3] && this.state.exams[3].passed), color: 'purple' }
      ]; }
    },
    methods: {
      earned(a) { return !!this.state.achievements[a.id]; },
      prog(a) { return this.G.achievementProgress(a); },
      when(a) { return this.state.achievements[a.id] ? NSA.util.fmtDate(this.state.achievements[a.id]) : ''; }
    },
    template: `
    <div class="stack">
      <section-head title="Achievements & Skills" :sub="earnedCount + ' of ' + achievements.length + ' badges earned · ' + totalXpFromAch + ' bonus XP'" />
      <div class="tabs">
        <button :class="{active:tab==='badges'}" @click="tab='badges'">Badges</button>
        <button :class="{active:tab==='skills'}" @click="tab='skills'">Skill Tree</button>
        <button :class="{active:tab==='ranks'}" @click="tab='ranks'">Ranks</button>
      </div>

      <template v-if="tab==='badges'">
        <div class="grid auto">
          <div v-for="a in achievements" :key="a.id" class="ach" :class="{earned:earned(a), locked:!earned(a)}">
            <div class="ach-icon">{{ a.icon }}</div>
            <div style="flex:1">
              <div class="row between"><strong>{{ a.title }}</strong><span v-if="a.xp" class="tiny dim">+{{ a.xp }} XP</span></div>
              <div class="small muted">{{ a.desc }}</div>
              <div v-if="earned(a)" class="tiny" style="color:var(--green)">Earned {{ when(a) }}</div>
              <div v-else class="mt"><nsa-progress :value="prog(a).pct" thin /><span class="tiny dim">{{ prog(a).done }}/{{ prog(a).total }}</span></div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="tab==='skills'">
        <div class="grid cols-2">
          <div class="card">
            <div class="card-title"><h3>Skill proficiency</h3></div>
            <div v-for="s in skills" :key="s.id" class="skill-row"><span>{{ s.name }}</span><nsa-progress :value="s.pct" thin :kind="s.pct>=70?'green':(s.pct>=35?'':'amber')" /><span class="pct">{{ s.pct }}%</span></div>
            <p class="tiny dim mt">Proficiency grows as you complete lessons, labs and missions tagged with each skill.</p>
          </div>
          <div class="card center">
            <div class="card-title" style="justify-content:center"><h3>Skill radar</h3></div>
            <skill-radar :skills="skills" :size="280" />
          </div>
        </div>
      </template>

      <template v-else-if="tab==='ranks'">
        <div class="card">
          <div class="card-title"><h3>Rank progression</h3></div>
          <div class="step-list">
            <div v-for="(r,i) in ranks" :key="i" class="step" :class="{done:r.has}">
              <div class="step-num">{{ r.has?'✓':i+1 }}</div>
              <div style="flex:1"><div class="row between"><strong>{{ r.name }}</strong><span class="chip" :class="r.color">{{ r.has?'Achieved':'Locked' }}</span></div><div class="small muted">{{ r.need }}</div></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><h3>Level titles</h3></div>
          <p class="small muted">You are level {{ level.level }} — <strong>{{ G.title(level.level) }}</strong>. Earn XP from lessons, labs, missions, challenges and achievements to level up.</p>
          <nsa-progress :value="level.pct" :label="'Level ' + level.level + ' → ' + (level.level+1)" />
        </div>
      </template>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
