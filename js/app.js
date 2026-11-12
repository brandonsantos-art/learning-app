/* NetSec Academy – application root: navigation, routing, mount */
(function (global) {
  const NSA = global.NSA;
  const { createApp, reactive, computed, h } = global.Vue;

  const NAV = [
    { name: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'paths', label: 'Learning Paths', icon: 'paths', path: '/paths' },
    { name: 'networking', label: 'Networking', icon: 'network', path: '/networking' },
    { name: 'security', label: 'Cybersecurity', icon: 'shield', path: '/security' },
    { name: 'labs', label: 'Virtual Labs', icon: 'flask', path: '/labs' },
    { name: 'missions', label: 'Real-World Missions', icon: 'target', path: '/missions' },
    { name: 'challenges', label: 'Challenges', icon: 'bolt', path: '/challenges' },
    { name: 'assessments', label: 'Assessments', icon: 'clipboard', path: '/assessments' },
    { name: 'achievements', label: 'Achievements', icon: 'trophy', path: '/achievements' },
    { name: 'resources', label: 'Study Tools', icon: 'book', path: '/resources' },
    { name: 'profile', label: 'Profile & Settings', icon: 'user', path: '/profile' }
  ];
  const BOTTOM = ['dashboard', 'paths', 'labs', 'missions', 'profile'];

  // route name -> component + which nav item is active
  const ROUTE_VIEW = {
    dashboard: { comp: 'view-dashboard', nav: 'dashboard' },
    paths: { comp: 'view-paths', nav: 'paths' },
    networking: { comp: 'view-paths', nav: 'networking', props: { track: 'networking' } },
    security: { comp: 'view-paths', nav: 'security', props: { track: 'security' } },
    lesson: { comp: 'view-lesson', nav: 'paths' },
    labs: { comp: 'view-labs', nav: 'labs' },
    'lab-netsim': { comp: 'view-netsim', nav: 'labs' },
    'lab-troubleshoot': { comp: 'view-netsim', nav: 'labs' },
    'lab-terminal': { comp: 'view-terminal', nav: 'labs' },
    'lab-security': { comp: 'view-seclab', nav: 'labs' },
    missions: { comp: 'view-missions', nav: 'missions' },
    mission: { comp: 'view-mission', nav: 'missions' },
    challenges: { comp: 'view-challenges', nav: 'challenges' },
    assessments: { comp: 'view-assessments', nav: 'assessments' },
    exam: { comp: 'view-exam', nav: 'assessments' },
    achievements: { comp: 'view-achievements', nav: 'achievements' },
    resources: { comp: 'view-resources', nav: 'resources' },
    profile: { comp: 'view-profile', nav: 'profile' }
  };

  const Root = {
    data() { return { sidebarOpen: false, route: NSA.router.route, state: NSA.store.state }; },
    computed: {
      current() { return ROUTE_VIEW[this.route.name] || { comp: 'view-notfound', nav: '' }; },
      viewComp() { return NSA.components[this.current.comp] || NSA.components['view-notfound']; },
      viewProps() { return Object.assign({}, this.current.props || {}, { route: this.route }); },
      title() { return this.route.title || 'NetSec Academy'; },
      nav() { return NAV; },
      bottomNav() { return NAV.filter(n => BOTTOM.includes(n.name)); },
      level() { return NSA.gamification.levelInfo(); },
      rank() { return NSA.gamification.rank(); },
      streak() { return NSA.gamification.streakStatus(); }
    },
    watch: { 'route.path'() { this.sidebarOpen = false; } },
    methods: {
      go(path) { NSA.router.navigate(path); this.sidebarOpen = false; },
      isActive(name) { return this.current.nav === name; },
      icon(n) { return NSA.ui.iconSvg(n, 18); }
    },
    mounted() {
      if (!this.state.profile.onboarded) setTimeout(() => NSA.app.onboard(), 300);
      // daily streak visit
      try { NSA.gamification.touchStreak(); } catch (e) {}
    },
    template: `
    <div class="app">
      <aside class="sidebar" :class="{open:sidebarOpen}">
        <div class="brand">
          <span class="brand-logo"></span>
          <div><div class="brand-name">NetSec Academy</div><div class="brand-sub">Offline training lab</div></div>
          <button class="icon-btn sidebar-close" @click="sidebarOpen=false">&times;</button>
        </div>
        <nav class="nav">
          <a v-for="n in nav" :key="n.name" :class="{active:isActive(n.name)}" @click="go(n.path)">
            <span v-html="icon(n.icon)"></span><span>{{ n.label }}</span>
          </a>
        </nav>
        <div class="sidebar-foot">
          <div class="row between"><span>Level {{ level.level }}</span><span class="chip" :class="rank.color">{{ rank.name }}</span></div>
          <nsa-progress :value="level.pct" thin style="margin-top:6px" />
          <div class="row between tiny dim" style="margin-top:4px"><span>{{ state.xp.toLocaleString() }} XP</span><span>🔥 {{ streak.current }}d</span></div>
        </div>
      </aside>
      <div class="backdrop" :class="{show:sidebarOpen}" @click="sidebarOpen=false"></div>
      <main class="main">
        <header class="topbar">
          <button class="icon-btn menu-btn" @click="sidebarOpen=true" v-html="icon('menu')"></button>
          <h1 class="page-title">{{ title }}</h1>
          <div class="topbar-right">
            <span class="chip amber" :title="'Learning streak'">🔥 {{ streak.current }}</span>
            <span class="chip accent" :title="'Experience points'"><nsa-icon name="star" :size="14"/> {{ state.xp.toLocaleString() }}</span>
          </div>
        </header>
        <div class="view">
          <component :is="viewComp" v-bind="viewProps" :key="route.path" />
        </div>
      </main>
      <nav class="bottom-nav">
        <a v-for="n in bottomNav" :key="n.name" :class="{active:isActive(n.name)}" @click="go(n.path)">
          <span v-html="icon(n.icon)"></span><span>{{ n.label.split(' ')[0] }}</span>
        </a>
      </nav>
      <nsa-toasts /><nsa-modal />
    </div>`
  };

  NSA.app = {
    mount() {
      const app = createApp(Root);
      app.config.globalProperties.$nsa = NSA;
      app.config.globalProperties.NSA = NSA; // templates reference NSA.* directly
      app.config.warnHandler = function () {};
      NSA.registerComponents(app);
      // register all view-* components (they self-register into NSA.components)
      Object.keys(NSA.components).forEach(name => { if (!app._context.components[name]) app.component(name, NSA.components[name]); });
      app.component('view-notfound', { template: '<empty-state icon="info" text="Page not found."><button class="btn primary mt" onclick="location.hash=\'#/dashboard\'">Go to dashboard</button></empty-state>' });
      app.mount('#app');
      NSA.app._app = app;
    },
    onboard() {
      const s = NSA.store.state;
      NSA.ui.openModal({ title: 'Welcome to NetSec Academy', wide: false, component: 'onboard-dialog', actions: [] }).then(() => {});
    }
  };

  // Onboarding dialog
  NSA.components['onboard-dialog'] = {
    data() { return { name: NSA.store.state.profile.name || 'Learner', spec: null, step: 0 }; },
    methods: {
      finish() { const p = NSA.store.state.profile; p.name = (this.name || 'Learner').trim() || 'Learner'; p.specialization = this.spec; p.onboarded = true; NSA.store.saveNow(); NSA.ui.closeModal(true); NSA.ui.toast('Welcome, ' + p.name + '! Your progress saves automatically.', 'success', 4000); NSA.router.navigate('/dashboard'); },
      skip() { NSA.store.state.profile.onboarded = true; NSA.store.saveNow(); NSA.ui.closeModal(null); }
    },
    template: `
    <div>
      <p>NetSec Academy is a hands-on lab for computer networking and cybersecurity. It runs entirely offline, and your progress is saved in this browser automatically.</p>
      <div class="field mt"><label>What should we call you?</label><input v-model="name" maxlength="24" /></div>
      <div class="field"><label>Pick a primary focus (you can change this anytime, and still do both)</label>
        <div class="pills">
          <button :class="{active:spec==='networking'}" @click="spec='networking'">Networking</button>
          <button :class="{active:spec==='security'}" @click="spec='security'">Cybersecurity</button>
          <button :class="{active:spec===null}" @click="spec=null">Both / undecided</button>
        </div>
      </div>
      <div class="callout tip mt"><div class="callout-title">How it works</div>Work through lessons, prove skills in the labs and missions, and pass each level's practical exam to unlock the next. You cannot skip ahead by clicking — you unlock by demonstrating competence.</div>
      <div class="btn-row mt"><button class="btn primary" @click="finish">Start learning</button><button class="btn ghost" @click="skip">Skip</button></div>
    </div>`
  };

  // Boot
  function boot() { NSA.router.sync(); NSA.app.mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof globalThis !== 'undefined' ? globalThis : window);
