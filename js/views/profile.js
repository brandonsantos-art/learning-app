/* NetSec Academy – Profile & Settings */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};

  NSA.components['view-profile'] = {
    data() { return { state: NSA.store.state, nameEdit: NSA.store.state.profile.name, importText: '' }; },
    computed: {
      G() { return NSA.gamification; },
      level() { return this.G.levelInfo(); }, rank() { return this.G.rank(); }, streak() { return this.G.streakStatus(); },
      skills() { return this.G.skills(); },
      ctx() { return this.G.context(); },
      overall() { return NSA.progress.overallProgress(); },
      theme() { return this.state.profile.theme || 'dark'; },
      created() { return NSA.util.fmtDate(this.state.profile.createdAt); }
    },
    methods: {
      saveName() { this.state.profile.name = (this.nameEdit || 'Learner').trim() || 'Learner'; NSA.ui.toast('Name updated.', 'success'); },
      setSpec(s) { this.state.profile.specialization = s; },
      setTheme(t) { this.state.profile.theme = t; document.documentElement.setAttribute('data-theme', t === 'darker' ? 'darker' : ''); },
      exportData() { const name = 'netsec-academy-progress-' + NSA.util.todayKey() + '.json'; if (NSA.util.download(name, NSA.store.exportJSON())) NSA.ui.toast('Progress exported as ' + name, 'success', 4000); },
      triggerImport() { this.$refs.file.click(); },
      onFile(e) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { NSA.store.importJSON(r.result); NSA.ui.toast('Progress imported successfully.', 'success', 4000); this.nameEdit = this.state.profile.name; } catch (err) { NSA.ui.toast('Import failed: ' + err.message, 'error', 5000); } }; r.readAsText(f); e.target.value = ''; },
      importPaste() { try { NSA.store.importJSON(this.importText); this.importText = ''; NSA.ui.toast('Progress imported.', 'success'); this.nameEdit = this.state.profile.name; } catch (e) { NSA.ui.toast('Invalid progress data: ' + e.message, 'error'); } },
      reset() { NSA.ui.confirm('This erases **all** your progress, XP, achievements and notes on this device. This cannot be undone. Export a backup first if you want to keep it.', { okLabel: 'Erase everything', danger: true }).then(ok => { if (ok) { NSA.store.reset(); this.nameEdit = this.state.profile.name; NSA.ui.toast('All progress reset.', 'success'); NSA.router.navigate('/dashboard'); } }); },
      toggleDev() { this.state.profile.devUnlock = !this.state.profile.devUnlock; NSA.ui.toast(this.state.profile.devUnlock ? 'All content unlocked (practice mode).' : 'Normal unlock rules restored.', 'info'); },
      go(p) { NSA.router.navigate(p); }
    },
    mounted() { this.setTheme(this.theme); },
    template: `
    <div class="stack">
      <section-head title="Profile & Settings" :sub="'Member since ' + created" />

      <div class="grid cols-3">
        <div class="card" style="grid-column:span 2">
          <div class="card-title"><h3>Profile</h3><span class="chip" :class="rank.color">{{ rank.name }}</span></div>
          <div class="row" style="gap:20px;flex-wrap:wrap">
            <div style="text-align:center"><score-ring :value="level.pct" :size="110" /><div class="small muted mt">Level {{ level.level }} · {{ G.title(level.level) }}</div></div>
            <div style="flex:1;min-width:200px">
              <div class="field"><label>Display name</label><div class="inline-form"><input v-model="nameEdit" maxlength="24"/><button class="btn sm" @click="saveName">Save</button></div></div>
              <div class="field"><label>Primary focus</label><div class="pills"><button :class="{active:state.profile.specialization==='networking'}" @click="setSpec('networking')">Networking</button><button :class="{active:state.profile.specialization==='security'}" @click="setSpec('security')">Security</button><button :class="{active:!state.profile.specialization}" @click="setSpec(null)">Both</button></div></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><h3>Stats</h3></div>
          <div class="small"><div class="row between" style="padding:3px 0"><span class="muted">XP</span><strong>{{ state.xp.toLocaleString() }}</strong></div>
          <div class="row between" style="padding:3px 0"><span class="muted">Best streak</span><strong>{{ streak.best }} days</strong></div>
          <div class="row between" style="padding:3px 0"><span class="muted">Lessons</span><strong>{{ ctx.lessonsDone }}</strong></div>
          <div class="row between" style="padding:3px 0"><span class="muted">Labs</span><strong>{{ ctx.labsDone }}</strong></div>
          <div class="row between" style="padding:3px 0"><span class="muted">Missions</span><strong>{{ ctx.missionsDone }}</strong></div>
          <div class="row between" style="padding:3px 0"><span class="muted">Commands learned</span><strong>{{ ctx.distinctCommands }}</strong></div>
          <div class="row between" style="padding:3px 0"><span class="muted">Overall</span><strong>{{ overall.pct }}%</strong></div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><h3>Skill tree</h3></div>
        <div class="grid cols-2">
          <div><div v-for="s in skills" :key="s.id" class="skill-row"><span>{{ s.name }}</span><nsa-progress :value="s.pct" thin :kind="s.pct>=70?'green':''" /><span class="pct">{{ s.pct }}%</span></div></div>
          <div class="center"><skill-radar :skills="skills" :size="260" /></div>
        </div>
      </div>

      <div class="grid cols-2">
        <div class="card">
          <div class="card-title"><h3>Appearance</h3></div>
          <div class="field"><label>Theme</label><div class="pills"><button :class="{active:theme==='dark'}" @click="setTheme('dark')">Dark (navy)</button><button :class="{active:theme==='darker'}" @click="setTheme('darker')">Darker (black)</button></div></div>
          <div class="field"><label>Practice mode</label><label class="checkbox"><input type="checkbox" :checked="state.profile.devUnlock" @change="toggleDev"/> Unlock all content (skip prerequisites — for review/practice)</label></div>
        </div>
        <div class="card">
          <div class="card-title"><h3><nsa-icon name="download" :size="18"/> Backup &amp; sync</h3></div>
          <p class="small muted">Your progress is saved in this browser automatically. Export a file to back it up or move it to another device (phone, laptop) — then import it there.</p>
          <div class="btn-row"><button class="btn primary" @click="exportData"><nsa-icon name="download" :size="16"/> Export progress</button>
          <button class="btn" @click="triggerImport"><nsa-icon name="upload" :size="16"/> Import file</button></div>
          <input ref="file" type="file" accept="application/json,.json" style="display:none" @change="onFile"/>
        </div>
      </div>

      <div class="card" style="border-color:var(--red)">
        <div class="card-title"><h3 style="color:var(--red)">Danger zone</h3></div>
        <div class="row between"><div><strong class="small">Reset all progress</strong><div class="small muted">Erases everything on this device. Export a backup first.</div></div><button class="btn danger" @click="reset"><nsa-icon name="trash" :size="16"/> Reset</button></div>
      </div>

      <div class="card">
        <div class="card-title"><h3>About</h3></div>
        <p class="small muted">NetSec Academy is a fully offline, interactive training lab for computer networking and cybersecurity. All simulations — the network simulator, the command-line terminals and the security labs — run locally in your browser with no internet connection or account required. It is an educational tool; its labs and certification maps prepare you to study for industry exams but do not themselves grant certifications. Install it as an app from your browser's menu to use it offline on any device.</p>
      </div>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
