/* NetSec Academy – Terminal emulator component and terminal lab view */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};
  const N = () => NSA.netsim;

  // Reusable terminal emulator bound to a live session
  NSA.components['terminal-emu'] = {
    props: { session: Object, height: { default: '' } },
    data() { return { lines: [], input: '', histIdx: -1, draft: '' }; },
    computed: {
      windows() { return this.session.os === 'windows'; },
      prompt() { return this.session.prompt(); },
      barTitle() { const d = this.session.dev; return d.name + ' — ' + (this.session.isIos ? 'Cisco IOS' : this.session.os === 'windows' ? 'Windows Command Prompt' : 'Linux bash'); }
    },
    methods: {
      run() {
        const cmd = this.input;
        if (!cmd.trim() && cmd !== '') { this.input = ''; return; }
        this.lines.push({ cmd: true, text: this.prompt + ' ' + cmd });
        if (cmd.trim()) {
          const r = this.session.run(cmd);
          if (r.clear) { this.lines = []; this.input = ''; this.histIdx = -1; this.$emit('ran', this.session); return; }
          if (r.out) r.out.split('\n').forEach(l => this.lines.push({ text: l }));
          if (r.err) r.err.split('\n').forEach(l => this.lines.push({ text: l, err: true }));
          this.trackStats(cmd);
        }
        this.input = ''; this.histIdx = -1;
        this.$emit('ran', this.session);
        this.$nextTick(() => { const o = this.$refs.out; if (o) o.scrollTop = o.scrollHeight; });
      },
      trackStats(cmd) {
        const s = NSA.store.state.stats; s.commandsRun = (s.commandsRun || 0) + 1;
        const base = cmd.trim().split(/\s+/)[0].toLowerCase().replace(/\.exe$/, '');
        if (base && !(s.distinctCommands || []).includes(base)) { s.distinctCommands = (s.distinctCommands || []).concat([base]); NSA.gamification.checkAchievements(); }
      },
      hist(dir) {
        const h = this.session.history || [];
        if (!h.length) return;
        if (this.histIdx === -1) this.draft = this.input;
        if (dir < 0) { this.histIdx = this.histIdx === -1 ? h.length - 1 : Math.max(0, this.histIdx - 1); }
        else { if (this.histIdx === -1) return; this.histIdx = this.histIdx + 1; if (this.histIdx >= h.length) { this.histIdx = -1; this.input = this.draft; return; } }
        this.input = h[this.histIdx];
      },
      focus() { if (this.$refs.inp) this.$refs.inp.focus(); }
    },
    mounted() {
      const banner = this.session.isIos ? [this.session.dev.name + ' line 0\n', 'Press RETURN to get started.', ''] :
        this.windows ? ['Microsoft Windows [Version 10.0.22631.4317]', '(c) Microsoft Corporation. All rights reserved.', ''] :
        ['Welcome to the ' + this.session.host.hostname + ' shell. Type "help" for supported commands.', 'Last login: ' + new Date().toDateString() + ' from 192.168.1.10', ''];
      banner.forEach(t => this.lines.push({ text: t }));
    },
    template: `
    <div class="terminal" :class="{windows}" @click="focus" :style="height?('max-height:'+height):''">
      <div class="terminal-bar">
        <span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span>
        <span style="margin-left:8px">{{ barTitle }}</span>
      </div>
      <div class="terminal-out" ref="out">
        <div v-for="(l,i) in lines" :key="i" :class="{cmdline:l.cmd, err:l.err}">{{ l.text }}</div>
      </div>
      <div class="terminal-in">
        <span class="prompt">{{ prompt }}</span>
        <input ref="inp" v-model="input" spellcheck="false" autocapitalize="off" autocomplete="off"
          @keydown.enter="run" @keydown.up.prevent="hist(-1)" @keydown.down.prevent="hist(1)" />
      </div>
    </div>`
  };

  NSA.components['view-terminal'] = {
    props: { route: Object },
    data() { return { lab: null, net: null, session: null, taskState: [], hintsShown: 0, showAnswer: false, tick: 0 }; },
    computed: {
      labId() { return this.route.params.id; },
      tasks() { return this.lab ? this.lab.tasks : []; },
      taskDone() { return this.taskState.filter(Boolean).length; },
      allDone() { return this.tasks.length > 0 && this.taskState.every(Boolean); },
      completed() { const st = NSA.store.state.labs[this.labId]; return st && st.completed; },
      hints() { return (this.lab && this.lab.hints) || []; }
    },
    created() { this.load(); },
    methods: {
      load() {
        this.lab = (NSA.data.labs.terminal || []).find(l => l.id === this.labId);
        if (!this.lab) return;
        const scen = this.lab.scenario ? this.lab.scenario() : { devices: [{ type: 'server', id: this.lab.device || 'host', name: 'host' }], links: [] };
        this.net = N().build(scen);
        const dev = this.net.devices[this.lab.device];
        if (this.lab.setupHost) { dev.host = Object.assign({}, dev.host || {}, this.lab.setupHost); }
        try { this.session = NSA.terminal.createSession({ net: this.net, devId: this.lab.device }); } catch (e) { NSA.ui.toast(e.message, 'error'); return; }
        NSA.progress.labAttempt(this.labId, {});
        this.check();
      },
      onRan() { this.check(); },
      check() {
        this.taskState = this.tasks.map(t => { try { return !!t.check(this.session); } catch (e) { return false; } });
        this.tick++;
        if (this.allDone && !this.completed) { const first = NSA.progress.completeLab(this.labId, 100); if (first) NSA.ui.toast('Terminal lab complete! 🎉', 'success', 4000); }
      },
      showHint() { if (this.hintsShown < this.hints.length) { this.hintsShown++; NSA.progress.labAttempt(this.labId, { hintsUsed: this.hintsShown }); } },
      go(p) { NSA.router.navigate(p); }
    },
    template: `
    <div v-if="!lab"><empty-state text="Lab not found." /></div>
    <div v-else class="stack">
      <div class="row between">
        <button class="btn ghost sm" @click="go('/labs')"><nsa-icon name="arrowLeft" :size="16"/> Labs</button>
        <div class="row"><level-badge :level="lab.level"/><span v-if="completed" class="chip green"><nsa-icon name="check" :size="13"/> Completed</span></div>
      </div>
      <section-head :title="lab.title" :sub="lab.brief" />
      <div class="sim-layout">
        <div>
          <terminal-emu v-if="session" :session="session" @ran="onRan" />
        </div>
        <div class="sim-side">
          <div class="card pad-sm">
            <div class="card-title"><h3><nsa-icon name="target" :size="16"/> Tasks</h3><span class="chip" :class="allDone?'green':''">{{ taskDone }}/{{ tasks.length }}</span></div>
            <div class="task-list">
              <div v-for="(t,i) in tasks" :key="t.id" class="task" :class="{done:taskState[i]}">
                <span class="task-check">{{ taskState[i]?'✓':'' }}</span><span>{{ t.text }}</span>
              </div>
            </div>
            <div v-if="completed" class="feedback ok mt">All tasks complete — nicely done!</div>
          </div>
          <div class="card pad-sm">
            <div class="card-title"><h3><nsa-icon name="hint" :size="16"/> Hints</h3><button class="btn xs" @click="showHint" :disabled="hintsShown>=hints.length">Reveal</button></div>
            <div v-if="!hintsShown" class="small muted">Stuck? Reveal a hint at a time.</div>
            <div v-for="(h,i) in hints.slice(0,hintsShown)" :key="i" class="callout tip" style="padding:8px 10px;margin-bottom:6px"><span class="small mono">{{ h }}</span></div>
          </div>
          <div v-if="lab.answerKey" class="card pad-sm">
            <button class="btn sm ghost block" @click="showAnswer=!showAnswer"><nsa-icon name="eye" :size="14"/> {{ showAnswer?'Hide':'Show' }} answer key</button>
            <div v-if="showAnswer" class="callout note mt" style="padding:8px 10px"><span class="small">{{ lab.answerKey }}</span></div>
          </div>
          <div class="card pad-sm">
            <div class="tiny dim">This is a simulated terminal — commands are parsed and produce realistic output. Supported commands are listed by typing <span class="kbd">help</span>. Use ↑/↓ for history.</div>
          </div>
        </div>
      </div>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
