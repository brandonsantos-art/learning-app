/* NetSec Academy – shared Vue components registered into NSA.components */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};
  const C = NSA.components;
  const h = () => NSA.ui.iconSvg;

  // Icon
  C['nsa-icon'] = { props: { name: String, size: { default: 18 } }, computed: { svg() { return NSA.ui.iconSvg(this.name, this.size); } }, template: `<span class="nsa-icon" v-html="svg" style="display:inline-flex"></span>` };

  // Markdown (trusted authored content)
  C['nsa-md'] = { props: { src: String }, computed: { html() { return NSA.util.md(this.src || ''); } }, mounted() { this.wire(); }, updated() { this.wire(); }, methods: { wire() { const root = this.$el; if (!root || !root.querySelectorAll) return; root.querySelectorAll('a[href^="#/"]').forEach(a => { if (a._wired) return; a._wired = true; a.addEventListener('click', e => { e.preventDefault(); NSA.router.navigate(a.getAttribute('href').slice(1)); }); }); } }, template: `<div class="lesson-content md-body" v-html="html"></div>` };

  // Progress bar
  C['nsa-progress'] = { props: { value: Number, kind: String, thin: Boolean, label: String }, template: `
    <div>
      <div v-if="label" class="progress-label"><span>{{ label }}</span><span>{{ Math.round(value) }}%</span></div>
      <div class="progress" :class="[kind, {thin}]"><span :style="{width: Math.max(0,Math.min(100,value))+'%'}"></span></div>
    </div>` };

  // Stat card
  C['stat-card'] = { props: { label: String, value: [String, Number], sub: String, icon: String, kind: String }, template: `
    <div class="stat">
      <div class="label">{{ label }}</div>
      <div class="value">{{ value }}</div>
      <div v-if="sub" class="sub">{{ sub }}</div>
      <div v-if="icon" class="stat-icon" :class="kind"><nsa-icon :name="icon" /></div>
    </div>` };

  // Level/track badge
  C['level-badge'] = { props: { level: Number, track: String }, computed: { cls() { return this.track ? (this.track === 'security' ? 'sec' : 'net') : 'l' + this.level; }, text() { return this.track ? (this.track === 'security' ? 'Security' : 'Networking') : ['', 'Beginner', 'Intermediate', 'Expert'][this.level]; } }, template: `<span class="badge" :class="cls">{{ text }}</span>` };

  // Section header
  C['section-head'] = { props: { title: String, sub: String }, template: `
    <div class="section-head"><div><h2>{{ title }}</h2><p v-if="sub">{{ sub }}</p></div><div class="row"><slot/></div></div>` };

  // Empty state
  C['empty-state'] = { props: { icon: { default: 'info' }, text: String }, template: `<div class="empty"><nsa-icon :name="icon" :size="28" /><p style="margin-top:8px">{{ text }}</p><slot/></div>` };

  // Toasts host
  C['nsa-toasts'] = { computed: { toasts() { return NSA.ui.toasts; } }, template: `
    <div class="toasts"><div v-for="t in toasts" :key="t.id" class="toast" :class="t.kind">{{ t.msg }}</div></div>` };

  // Modal host
  C['nsa-modal'] = {
    computed: { m() { return NSA.ui.modal; }, bodyHtml() { return this.m.html; }, comp() { return this.m.component ? NSA.components[this.m.component] : null; } },
    methods: { act(a) { NSA.ui.closeModal(a.value); }, bg(e) { if (e.target === this.$el && this.m.dismissible) NSA.ui.closeModal(null); } },
    template: `
    <div v-if="m.open" class="modal-bg" @mousedown="bg">
      <div class="modal" :class="{wide:m.wide}" @mousedown.stop>
        <div class="modal-head"><h3>{{ m.title }}</h3><button class="icon-btn" @click="act({value:null})"><nsa-icon name="x"/></button></div>
        <div class="modal-body">
          <component v-if="comp" :is="comp" v-bind="m.props" />
          <div v-else v-html="bodyHtml"></div>
        </div>
        <div class="modal-foot" v-if="m.actions && m.actions.length">
          <button v-for="a in m.actions" :key="a.label" class="btn" :class="a.kind" @click="act(a)">{{ a.label }}</button>
        </div>
      </div>
    </div>` };

  // Ring (score gauge)
  C['score-ring'] = { props: { value: Number, size: { default: 120 }, kind: String }, computed: {
    color() { if (this.kind) return this.kind; return this.value >= 80 ? 'var(--green)' : this.value >= 60 ? 'var(--amber)' : 'var(--red)'; },
    dash() { const r = this.size / 2 - 10; const c = 2 * Math.PI * r; return { r, c, off: c * (1 - Math.max(0, Math.min(100, this.value)) / 100) }; }
  }, template: `
    <svg :width="size" :height="size" viewBox="0 0 120 120" class="score-ring">
      <circle cx="60" cy="60" :r="dash.r" fill="none" stroke="var(--panel3)" stroke-width="10"/>
      <circle cx="60" cy="60" :r="dash.r" fill="none" :stroke="color" stroke-width="10" stroke-linecap="round"
        :stroke-dasharray="dash.c" :stroke-dashoffset="dash.off" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset .6s"/>
      <text x="60" y="60" text-anchor="middle" dominant-baseline="central" font-size="26" font-weight="700" fill="var(--text)">{{ Math.round(value) }}%</text>
    </svg>` };

  // Mini skill radar
  C['skill-radar'] = { props: { skills: Array, size: { default: 240 } }, computed: {
    pts() {
      const n = this.skills.length; const cx = this.size / 2, cy = this.size / 2, R = this.size / 2 - 34;
      const ring = p => this.skills.map((s, i) => { const a = (Math.PI * 2 * i / n) - Math.PI / 2; const r = R * (p != null ? p : s.pct / 100); return (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1); }).join(' ');
      const labels = this.skills.map((s, i) => { const a = (Math.PI * 2 * i / n) - Math.PI / 2; return { x: cx + (R + 18) * Math.cos(a), y: cy + (R + 18) * Math.sin(a), name: s.name.split(' ')[0], anchor: Math.cos(a) > 0.3 ? 'start' : Math.cos(a) < -0.3 ? 'end' : 'middle' }; });
      return { data: ring(), grid: [0.25, 0.5, 0.75, 1].map(ring), labels, cx, cy };
    }
  }, template: `
    <svg :width="size" :height="size" :viewBox="'0 0 '+size+' '+size" class="radar">
      <polygon v-for="(g,i) in pts.grid" :key="i" :points="g" fill="none" stroke="var(--border)" stroke-width="1"/>
      <polygon :points="pts.data" fill="rgba(59,130,246,0.22)" stroke="var(--accent)" stroke-width="2"/>
      <text v-for="(l,i) in pts.labels" :key="i" :x="l.x" :y="l.y" :text-anchor="l.anchor" dominant-baseline="central">{{ l.name }}</text>
    </svg>` };

  // Lab/lesson list item (clickable)
  C['list-tile'] = { props: { icon: String, title: String, sub: String, done: Boolean, locked: Boolean, to: String, badge: String, badgeKind: String },
    methods: { go() { if (!this.locked && this.to) NSA.router.navigate(this.to); } },
    template: `
    <a class="list-item" :class="{locked}" @click="go" :style="locked?'cursor:not-allowed':'cursor:pointer'">
      <div class="li-icon" :class="{done}"><nsa-icon :name="locked?'lock':(done?'check':icon)" /></div>
      <div class="li-body"><div class="li-title">{{ title }}</div><div class="li-sub"><span v-if="sub">{{ sub }}</span><slot name="sub"/></div></div>
      <div class="li-right"><span v-if="badge" class="badge" :class="badgeKind">{{ badge }}</span><nsa-icon v-if="!locked" name="chevron" :size="16" /></div>
    </a>` };

  NSA.registerComponents = function (app) { Object.keys(C).forEach(name => app.component(name, C[name])); };
})(typeof globalThis !== 'undefined' ? globalThis : window);
