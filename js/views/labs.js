/* NetSec Academy – Virtual Labs index + Security lab renderer */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};

  const CATS = [
    { key: 'netsim', title: 'Network Simulator', icon: 'network', desc: 'Build networks: place devices, cable them, configure IP, VLANs, routing and NAT, and watch packets move.', route: 'netsim' },
    { key: 'terminal', title: 'Command-Line Terminal', icon: 'terminal', desc: 'A real parser for Windows, Linux and Cisco IOS commands with meaningful output.', route: 'terminal' },
    { key: 'security', title: 'Cybersecurity Labs', icon: 'bug', desc: 'Phishing triage, log and packet analysis, firewall policy, vulnerability assessment and incident response.', route: 'security' },
    { key: 'troubleshoot', title: 'Troubleshooting Lab', icon: 'firewall', desc: 'Realistic IT support scenarios: diagnose the root cause and fix it.', route: 'troubleshoot' }
  ];

  NSA.components['view-labs'] = {
    data() { return { state: NSA.store.state, cat: 'all' }; },
    computed: {
      P() { return NSA.progress; },
      cats() { return CATS; },
      shown() { return this.cat === 'all' ? CATS : CATS.filter(c => c.key === this.cat); },
      counts() { const L = NSA.data.labs; const out = {}; for (const c of CATS) { const arr = L[c.key] || []; out[c.key] = { total: arr.length, done: arr.filter(l => this.state.labs[l.id] && this.state.labs[l.id].completed).length }; } return out; }
    },
    methods: {
      labsOf(key) { return (NSA.data.labs[key] || []).slice().sort((a, b) => a.level - b.level); },
      routeFor(key, id) { return '/labs/' + key + '/' + id; },
      open(key, lab) { if (this.P.isLabUnlocked(lab.id)) NSA.router.navigate(this.routeFor(key, lab.id)); else NSA.ui.alert(this.P.labLockReason(lab.id), 'Locked'); },
      st(id) { return this.state.labs[id] || {}; }
    },
    template: `
    <div class="stack">
      <section-head title="Virtual Labs" sub="Hands-on practice with no physical equipment. Progress and completions are saved automatically." />
      <div class="grid cols-4">
        <div v-for="c in cats" :key="c.key" class="stat clickable" @click="cat=c.key" :style="cat===c.key?'border-color:var(--accent)':''">
          <div class="label">{{ c.title }}</div><div class="value">{{ counts[c.key].done }}/{{ counts[c.key].total }}</div>
          <div class="stat-icon"><nsa-icon :name="c.icon"/></div>
        </div>
      </div>
      <div class="pills"><button :class="{active:cat==='all'}" @click="cat='all'">All</button><button v-for="c in cats" :key="c.key" :class="{active:cat===c.key}" @click="cat=c.key">{{ c.title }}</button></div>

      <div v-for="c in shown" :key="c.key" class="card">
        <div class="card-title"><h3><nsa-icon :name="c.icon" :size="18"/> {{ c.title }}</h3><span class="muted small">{{ counts[c.key].done }}/{{ counts[c.key].total }} complete</span></div>
        <p class="muted small">{{ c.desc }}</p>
        <div class="grid auto">
          <div v-for="l in labsOf(c.key)" :key="l.id" class="card pad-sm clickable" :class="{locked:!P.isLabUnlocked(l.id)}" @click="open(c.key,l)">
            <div class="row between">
              <strong class="small">{{ l.title }}</strong>
              <span v-if="st(l.id).completed" class="chip green"><nsa-icon name="check" :size="12"/></span>
              <nsa-icon v-else-if="!P.isLabUnlocked(l.id)" name="lock" :size="14"/>
              <level-badge v-else :level="l.level"/>
            </div>
            <div class="tiny dim" style="margin-top:4px">{{ l.brief }}</div>
            <div class="row tiny dim" style="margin-top:6px;gap:8px"><span v-if="l.est"><nsa-icon name="clock" :size="11"/> {{ l.est }} min</span><span v-if="st(l.id).attempts">· {{ st(l.id).attempts }} attempt(s)</span></div>
          </div>
        </div>
      </div>
    </div>`
  };

  // ---- Security lab renderer (dispatch by kind) ----
  NSA.components['view-seclab'] = {
    props: { route: Object },
    data() { return { lab: null, phishIdx: {}, phishAns: {}, submitted: false, result: null, policyAns: {}, fwAns: {}, logFlags: {}, qAnswers: {}, caseAns: {}, revealWhy: {} }; },
    computed: {
      labId() { return this.route.params.id; },
      completed() { const st = NSA.store.state.labs[this.labId]; return st && st.completed; },
      kind() { return this.lab ? this.lab.kind : ''; }
    },
    created() { this.lab = (NSA.data.labs.security || []).find(l => l.id === this.labId); if (this.lab) NSA.progress.labAttempt(this.labId, {}); },
    methods: {
      go(p) { NSA.router.navigate(p); },
      // Phishing
      setPhish(i, v) { if (this.submitted) return; this.phishAns[i] = v; },
      // Generic question graders
      setQ(key, i, v) { if (this.submitted) return; (this[key] = this[key] || {})[i] = v; },
      gradePhish() {
        const emails = this.lab.emails; let correct = 0; const total = emails.length;
        emails.forEach((e, i) => { if (this.phishAns[i] === e.verdict) correct++; if (e.verdict === 'phish' && this.phishAns[i] === 'phish') NSA.store.state.stats.phishingSpotted = (NSA.store.state.stats.phishingSpotted || 0) + 1; });
        return Math.round(correct / total * 100);
      },
      gradeList(items, answerKey, ansKey) { let c = 0; items.forEach((it, i) => { if (String((this[ansKey] || {})[i]) === String(it[answerKey])) c++; }); return Math.round(c / items.length * 100); },
      gradeQuestions(qs, ansKey) { const answers = qs.map((q, i) => (this[ansKey] || {})[i]); const r = NSA.quiz.gradeAll(qs, answers); return r.score; },
      submit() {
        let score = 0;
        if (this.kind === 'phishing') score = this.gradePhish();
        else if (this.kind === 'password') score = this.gradeList(this.lab.policy, 'answer', 'policyAns');
        else if (this.kind === 'firewall') score = (function (self) { let c = 0; self.lab.rules.forEach((r, i) => { if (self.fwAns[i] === r.answer) c++; }); return Math.round(c / self.lab.rules.length * 100); })(this);
        else if (this.kind === 'logs' || this.kind === 'pcap') score = this.gradeQuestions(this.lab.questions, 'qAnswers');
        else if (this.kind === 'assessment') score = this.gradeList(this.lab.findings, 'answer', 'caseAns');
        else if (this.kind === 'webapp') score = this.gradeList(this.lab.cases, 'answer', 'caseAns');
        this.result = score; this.submitted = true;
        const pass = score >= (this.lab.passPct || 75);
        if (pass) { const first = NSA.progress.completeLab(this.labId, score); if (first) NSA.ui.toast('Security lab passed! ' + score + '%', 'success', 4000); }
        else NSA.ui.toast('Scored ' + score + '% — need ' + (this.lab.passPct || 75) + '% to pass. Review and retry.', 'error', 4000);
        this.$nextTick(() => { try { this.$el.scrollIntoView({ behavior: 'smooth' }); } catch (e) {} });
      },
      retry() { this.submitted = false; this.result = null; this.phishAns = {}; this.policyAns = {}; this.fwAns = {}; this.qAnswers = {}; this.caseAns = {}; },
      qCorrect(qs, i) { const q = qs[i]; return NSA.quiz.grade(q, this.qAnswers[i]).correct; },
      listCorrect(items, ansKey, i, field) { return String((this[ansKey] || {})[i]) === String(items[i][field]); }
    },
    template: `
    <div v-if="!lab"><empty-state text="Lab not found." /></div>
    <div v-else class="stack">
      <div class="row between">
        <button class="btn ghost sm" @click="go('/labs')"><nsa-icon name="arrowLeft" :size="16"/> Labs</button>
        <div class="row"><level-badge :level="lab.level"/><span v-if="completed" class="chip green"><nsa-icon name="check" :size="13"/> Completed</span></div>
      </div>
      <section-head :title="lab.title" :sub="lab.brief" />
      <div v-if="submitted" class="card">
        <div class="result-head"><score-ring :value="result" /><div>
          <h2 style="margin:0">{{ result>=(lab.passPct||75)?'Passed':'Keep going' }}</h2>
          <p class="muted">You scored {{ result }}%. Passing is {{ lab.passPct||75 }}%. Review the explanations below, then retry if needed.</p>
          <div class="btn-row"><button class="btn" @click="retry"><nsa-icon name="refresh" :size="16"/> Retry</button><button class="btn ghost" @click="go('/labs')">Done</button></div>
        </div></div>
      </div>

      <!-- PHISHING -->
      <template v-if="kind==='phishing'">
        <div v-for="(e,i) in lab.emails" :key="i" class="card">
          <div class="email-view">
            <div class="eh">From: {{ e.from }}</div>
            <div class="eh">Subject: <strong>{{ e.subject }}</strong></div>
            <hr style="border-color:#dfe3ea">
            <p style="white-space:pre-line">{{ e.body }}</p>
            <p v-if="e.link"><a href="#" @click.prevent>{{ e.link }}</a></p>
          </div>
          <div class="btn-row mt">
            <button class="btn sm" :class="phishAns[i]==='legit'?'success':''" :disabled="submitted" @click="setPhish(i,'legit')"><nsa-icon name="check" :size="14"/> Legitimate</button>
            <button class="btn sm" :class="phishAns[i]==='phish'?'danger':''" :disabled="submitted" @click="setPhish(i,'phish')"><nsa-icon name="warning" :size="14"/> Phishing</button>
            <span v-if="submitted" class="chip" :class="phishAns[i]===e.verdict?'green':'red'">{{ phishAns[i]===e.verdict?'Correct':'Wrong' }} — it is {{ e.verdict==='phish'?'phishing':'legitimate' }}</span>
          </div>
          <div v-if="submitted" class="feedback mt" :class="phishAns[i]===e.verdict?'ok':'bad'">{{ e.why }}</div>
        </div>
      </template>

      <!-- PASSWORD POLICY -->
      <template v-else-if="kind==='password'">
        <nsa-demo name="password-strength" />
        <div class="card"><div class="card-title"><h3>Fix the policy</h3></div>
          <div v-for="(p,i) in lab.policy" :key="i" class="quiz-q">
            <div class="q-text">{{ p.q }}</div>
            <div class="options"><div v-for="(o,oi) in p.options" :key="oi" class="option" :class="{selected:policyAns[i]===oi, correct:submitted&&p.answer===oi, wrong:submitted&&policyAns[i]===oi&&policyAns[i]!==p.answer}" @click="setQ('policyAns',i,oi)"><span class="opt-key">{{ String.fromCharCode(65+oi) }}</span>{{ o }}</div></div>
            <div v-if="submitted" class="feedback mt" :class="policyAns[i]===p.answer?'ok':'bad'">{{ p.why }}</div>
          </div>
        </div>
      </template>

      <!-- FIREWALL -->
      <template v-else-if="kind==='firewall'">
        <div class="callout note"><div class="callout-title">Scenario</div>{{ lab.zones }}</div>
        <div class="card"><div class="card-title"><h3>Decide each flow</h3></div>
          <div v-for="(r,i) in lab.rules" :key="i" class="list-item" style="padding:10px 12px">
            <div class="li-body mono small">{{ r.flow }}</div>
            <div class="li-right">
              <button class="btn xs" :class="fwAns[i]==='allow'?'success':''" :disabled="submitted" @click="setQ('fwAns',i,'allow')">Allow</button>
              <button class="btn xs" :class="fwAns[i]==='deny'?'danger':''" :disabled="submitted" @click="setQ('fwAns',i,'deny')">Deny</button>
              <span v-if="submitted" :style="fwAns[i]===r.answer?'color:var(--green)':'color:var(--red)'"><nsa-icon :name="fwAns[i]===r.answer?'check':'x'" :size="14"/></span>
            </div>
          </div>
          <div v-if="submitted" class="stack mt"><div v-for="(r,i) in lab.rules" :key="i" class="small" :style="fwAns[i]===r.answer?'color:var(--muted)':'color:var(--amber)'">{{ r.flow }} → <strong>{{ r.answer }}</strong>: {{ r.why }}</div></div>
        </div>
      </template>

      <!-- LOGS / PCAP -->
      <template v-else-if="kind==='logs'||kind==='pcap'">
        <div class="card"><div class="card-title"><h3>{{ lab.logLabel || lab.capLabel }}</h3></div>
          <div v-if="kind==='logs'" class="scroll-x"><table class="log-table"><tbody>
            <tr v-for="(l,i) in lab.log" :key="i" :class="{flag:l.flag}"><td style="color:var(--muted)">{{ l.t }}</td><td>{{ l.m }}</td></tr>
          </tbody></table></div>
          <div v-else class="scroll-x"><table class="log-table"><thead><tr><th>#</th><th>Time</th><th>Source</th><th>Dest</th><th>Proto</th><th>Info</th></tr></thead><tbody>
            <tr v-for="p in lab.packets" :key="p.no"><td>{{ p.no }}</td><td>{{ p.time }}</td><td>{{ p.src }}</td><td>{{ p.dst }}</td><td>{{ p.proto }}</td><td>{{ p.info }}</td></tr>
          </tbody></table></div>
        </div>
        <div class="card"><div class="card-title"><h3>Investigation</h3></div>
          <div v-for="(q,i) in lab.questions" :key="i" class="quiz-q">
            <div class="q-text">{{ q.q }}</div>
            <div v-if="q.type==='mcq'" class="options"><div v-for="(o,oi) in q.options" :key="oi" class="option" :class="{selected:qAnswers[i]===oi, correct:submitted&&q.answer===oi, wrong:submitted&&qAnswers[i]===oi&&qAnswers[i]!==q.answer}" @click="setQ('qAnswers',i,oi)"><span class="opt-key">{{ String.fromCharCode(65+oi) }}</span>{{ o }}</div></div>
            <div v-else class="inline-form"><input class="mono" :disabled="submitted" :value="qAnswers[i]||''" @input="setQ('qAnswers',i,$event.target.value)" placeholder="answer…"/></div>
            <div v-if="submitted" class="feedback mt" :class="qCorrect(lab.questions,i)?'ok':'bad'">{{ q.explain }}</div>
          </div>
        </div>
      </template>

      <!-- ASSESSMENT / WEBAPP -->
      <template v-else-if="kind==='assessment'||kind==='webapp'">
        <div class="card" v-for="(c,i) in (lab.findings||lab.cases)" :key="i">
          <div class="row between"><h3 style="margin:0">{{ c.service||c.label }}</h3><span v-if="c.sev" class="chip" :class="c.sev==='High'?'red':(c.sev==='Medium'?'amber':'')">{{ c.sev }}</span></div>
          <pre v-if="c.code"><code>{{ c.code }}</code></pre>
          <div class="q-text mt">{{ c.q }}</div>
          <div class="options"><div v-for="(o,oi) in c.options" :key="oi" class="option" :class="{selected:caseAns[i]===oi, correct:submitted&&c.answer===oi, wrong:submitted&&caseAns[i]===oi&&caseAns[i]!==c.answer}" @click="setQ('caseAns',i,oi)"><span class="opt-key">{{ String.fromCharCode(65+oi) }}</span>{{ o }}</div></div>
          <div v-if="submitted" class="feedback mt" :class="caseAns[i]===c.answer?'ok':'bad'">{{ c.why }}</div>
        </div>
      </template>

      <div class="card">
        <div class="row between"><div class="small muted">{{ submitted?'Review your answers above.':'Answer everything, then submit.' }}</div>
        <button v-if="!submitted" class="btn primary" @click="submit"><nsa-icon name="check" :size="16"/> Submit</button>
        <button v-else class="btn" @click="retry"><nsa-icon name="refresh" :size="16"/> Retry</button></div>
      </div>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
