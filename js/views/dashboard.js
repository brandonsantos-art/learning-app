/* NetSec Academy – Dashboard view */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};

  NSA.components['view-dashboard'] = {
    data() { return { state: NSA.store.state }; },
    computed: {
      P() { return NSA.progress; }, G() { return NSA.gamification; },
      level() { return this.G.levelInfo(); },
      rank() { return this.G.rank(); },
      streak() { return this.G.streakStatus(); },
      overall() { return this.P.overallProgress(); },
      rec() { return this.P.recommendNext(); },
      recTitle() { const r = this.rec; if (r.kind === 'lesson') return r.item.title; if (r.kind === 'lab') return r.item.title; if (r.kind === 'exam') return NSA.progress.LEVELS[r.level].name + ' Practical Examination'; return 'All caught up'; },
      levels() { return [1, 2, 3].map(l => this.P.levelStats(l)); },
      skills() { return this.G.skills(); },
      topSkills() { return this.skills.slice().sort((a, b) => b.pct - a.pct).slice(0, 5); },
      activity() { return (this.state.activity || []).slice(0, 6); },
      streakDays() { const days = []; for (let i = 13; i >= 0; i--) { const k = NSA.util.addDays(NSA.util.todayKey(), -i); days.push({ on: !!this.streak.days[k], today: i === 0 }); } return days; },
      gaps() { return this.G.knowledgeGaps(); },
      dailyDone() { const d = this.state.challenges.daily[NSA.util.todayKey()]; return d && d.done; },
      counts() { const c = this.G.context(); return { lessons: c.lessonsDone, labs: c.labsDone, missions: c.missionsDone, cmds: c.distinctCommands }; }
    },
    methods: {
      go(p) { NSA.router.navigate(p); },
      startRec() { const r = this.rec; if (r.kind === 'lesson') this.go('/lesson/' + r.item.id); else if (r.kind === 'lab') this.go('/labs/' + NSA.progress.labKind(r.item.id) + '/' + r.item.id); else if (r.kind === 'exam') this.go('/assessments/exam/' + r.level); else this.go('/challenges'); },
      levelPath(l) { return l.level === 1 ? '/paths' : '/paths'; },
      greeting() { const h = new Date().getHours(); return (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + ', ' + (this.state.profile.name || 'Learner'); },
      actLabel(a) { return a.label; }, actTime(a) { return NSA.util.timeAgo(a.t); },
      lessonTitle(id) { const l = NSA.progress.lesson(id); return l ? l.title : id; }
    },
    template: `
    <div class="stack">
      <section-head :title="greeting()" :sub="'Level ' + level.level + ' · ' + G.title(level.level) + ' · ' + rank.name + ' rank'">
        <button class="btn primary" @click="startRec"><nsa-icon name="play" :size="16"/> {{ rec.kind==='none'?'Daily challenge':'Continue learning' }}</button>
      </section-head>

      <div class="grid cols-4">
        <stat-card label="Experience" :value="state.xp.toLocaleString()" :sub="level.needed - level.into + ' XP to level ' + (level.level+1)" icon="star" />
        <stat-card label="Learning streak" :value="streak.current + ' days'" :sub="'Best: ' + streak.best + ' days'" icon="flame" kind="amber" />
        <stat-card label="Overall progress" :value="overall.pct + '%'" :sub="overall.done + ' of ' + overall.total + ' items'" icon="graph" />
        <stat-card label="Current rank" :value="rank.name" :sub="G.title(level.level)" icon="trophy" />
      </div>

      <div class="grid cols-3">
        <div class="card clickable" style="grid-column:span 2" @click="startRec">
          <div class="card-title"><h3><nsa-icon name="target" :size="18"/> Recommended next</h3><span class="chip accent">{{ rec.reason }}</span></div>
          <div class="row between">
            <div><div style="font-size:1.1rem;font-weight:650">{{ recTitle }}</div>
              <div class="muted small" v-if="rec.kind==='lesson'"><level-badge :level="rec.item.level"/> <level-badge :track="rec.item.track"/> · {{ rec.item.minutes }} min</div>
              <div class="muted small" v-else-if="rec.kind==='lab'">Hands-on lab · {{ rec.item.est }} min</div>
              <div class="muted small" v-else-if="rec.kind==='exam'">Pass to unlock the next level</div>
            </div>
            <button class="btn primary">Start <nsa-icon name="chevron" :size="16"/></button>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><h3><nsa-icon name="flame" :size="18"/> This fortnight</h3></div>
          <div class="streak-days">
            <span v-for="(d,i) in streakDays" :key="i" :class="{on:d.on, today:d.today}" :title="d.on?'active':'inactive'"></span>
          </div>
          <p class="small muted mt">Learn something every day to keep your streak alive.</p>
          <button class="btn sm block" :class="dailyDone?'':'primary'" @click="go('/challenges')">{{ dailyDone?'Daily challenge done ✓':'Do today\\'s challenge' }}</button>
        </div>
      </div>

      <div class="grid cols-3">
        <div class="card" style="grid-column:span 2">
          <div class="card-title"><h3>Learning paths</h3><button class="btn sm ghost" @click="go('/paths')">View all</button></div>
          <div class="stack">
            <div v-for="l in levels" :key="l.level" class="card pad-sm" :style="P.isLevelUnlocked(l.level)?'cursor:pointer':''" @click="P.isLevelUnlocked(l.level)&&go('/paths')">
              <div class="row between">
                <div class="row"><level-badge :level="l.level"/><strong>{{ l.name }}</strong><span class="muted small">{{ l.sub }}</span></div>
                <span v-if="!P.isLevelUnlocked(l.level)" class="chip"><nsa-icon name="lock" :size="13"/> Locked</span>
                <span v-else-if="l.examPassed" class="chip green"><nsa-icon name="check" :size="13"/> Certified</span>
                <span v-else class="muted small">{{ l.lessonsDone }}/{{ l.lessons }} lessons · {{ l.labsDone }}/{{ l.labs }} labs</span>
              </div>
              <nsa-progress :value="l.pct" thin style="margin-top:8px" :kind="l.examPassed?'green':''" />
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><h3>Skill proficiency</h3></div>
          <div v-for="s in topSkills" :key="s.id" class="skill-row">
            <span>{{ s.name }}</span><nsa-progress :value="s.pct" thin /><span class="pct">{{ s.pct }}%</span>
          </div>
          <button class="btn sm ghost block mt" @click="go('/profile')">Full skill tree</button>
        </div>
      </div>

      <div class="grid cols-3">
        <div class="card">
          <div class="card-title"><h3>Recent activity</h3></div>
          <div v-if="activity.length" class="list">
            <div v-for="(a,i) in activity" :key="i" class="row between small" style="padding:4px 0;border-bottom:1px solid var(--border)">
              <span>{{ actLabel(a) }}</span><span class="dim tiny">{{ actTime(a) }}{{ a.xp?' · +'+a.xp+' XP':'' }}</span>
            </div>
          </div>
          <empty-state v-else icon="clock" text="No activity yet — complete a lesson or lab to get started." />
        </div>
        <div class="card">
          <div class="card-title"><h3>Quick labs</h3></div>
          <div class="list">
            <list-tile icon="network" title="Network Simulator" sub="Build and test networks" to="/labs" />
            <list-tile icon="terminal" title="Terminal Labs" sub="Practise real commands" to="/labs" />
            <list-tile icon="bug" title="Security Labs" sub="Investigate & defend" to="/labs" />
          </div>
        </div>
        <div class="card">
          <div class="card-title"><h3>Focus areas</h3></div>
          <div v-if="gaps.weakLessons.length || gaps.weakSkills.length">
            <div v-for="w in gaps.weakLessons" :key="w.id" class="list-item" style="padding:8px 10px;cursor:pointer" @click="go('/lesson/'+w.id)">
              <div class="li-icon" style="background:var(--amber-soft);color:var(--amber)"><nsa-icon name="hint" :size="16"/></div>
              <div class="li-body"><div class="small">{{ w.title }}</div><div class="tiny dim">Best score {{ w.score }}% — review</div></div>
            </div>
            <div v-for="w in gaps.weakSkills" :key="w.id" class="small muted" style="padding:4px 0">Build up: <strong>{{ w.title }}</strong> ({{ w.pct }}%)</div>
          </div>
          <empty-state v-else icon="check" text="No weak areas detected. Keep it up!" />
        </div>
      </div>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
