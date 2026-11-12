/* NetSec Academy – Network Simulator lab view (SVG canvas, config, tools, objectives) */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};
  const N = () => NSA.netsim; const S = () => NSA.subnet;

  NSA.components['view-netsim'] = {
    props: { route: Object },
    data() { return {
      net: null, lab: null, kind: 'netsim', sel: null, connectFrom: null, drag: null,
      tool: 'select', log: [], pingSrc: '', pingDst: '', traceDst: '', objState: [], hintsShown: 0,
      diagAnswers: {}, diagChecked: false, tab: 'canvas', termSession: null, termDevId: null,
      animPackets: [], pan: { x: 0, y: 0, scale: 1 }, tick: 0
    }; },
    computed: {
      labId() { return this.route.params.id; },
      devices() { return this.net ? Object.values(this.net.devices) : []; },
      links() { return this.net ? this.net.links : []; },
      hostsAndRouters() { return this.devices.filter(d => N().isL3(d)); },
      selDev() { return this.sel ? this.net.devices[this.sel] : null; },
      objectives() { return this.lab ? this.lab.objectives : []; },
      objDone() { return this.objState.filter(Boolean).length; },
      allDone() { return this.objectives.length > 0 && this.objState.every((v, i) => v || this.objectives[i].manual) && (this.kind !== 'troubleshoot' || this.diagOk); },
      completed() { const st = NSA.store.state.labs[this.labId]; return st && st.completed; },
      diag() { return (this.lab && this.lab.diagnosis) || []; },
      diagOk() { if (!this.diag.length) return true; return this.diag.every((q, i) => this.diagAnswers[i] === q.answer); },
      hints() { return (this.lab && this.lab.hints) || []; },
      ports() { return this.selDev ? N().portsOf(this.selDev).map(p => ({ name: p, link: N().linkAt(this.net, this.sel, p), iface: this.selDev.interfaces ? this.selDev.interfaces[p] : null })) : []; }
    },
    created() { this.tick; this.load(); },
    methods: {
      load() {
        const kindFromRoute = this.route.name === 'lab-troubleshoot' ? 'troubleshoot' : 'netsim';
        this.kind = kindFromRoute;
        const list = kindFromRoute === 'troubleshoot' ? NSA.data.labs.troubleshoot : NSA.data.labs.netsim;
        this.lab = list.find(l => l.id === this.labId);
        if (!this.lab) return;
        const saved = NSA.store.state.labs[this.labId];
        if (saved && saved.network) { try { this.net = N().deserialize(saved.network); } catch (e) { this.net = N().build(this.lab.scenario()); } }
        else this.net = N().build(this.lab.scenario());
        NSA.progress.labAttempt(this.labId, {});
        this.pingSrc = (this.hostsAndRouters[0] || {}).id || '';
        this.checkObjectives();
      },
      save() { NSA.progress.labAttempt(this.labId, { network: N().serialize(this.net) }); },
      logLine(text, cls) { this.log.unshift({ text, cls: cls || 'info', id: Math.random() }); if (this.log.length > 120) this.log.length = 120; },
      checkObjectives() {
        this.objState = this.objectives.map(o => { try { return !!o.check(this.net); } catch (e) { return false; } });
        this.save();
        if (this.allDone && !this.completed) this.complete();
        this.tick++;
      },
      complete() {
        const first = NSA.progress.completeLab(this.labId, 100);
        if (first) { NSA.store.state.stats.labsCompleted = NSA.store.state.stats.labsCompleted; NSA.ui.toast('Lab complete! 🎉', 'success', 4000); }
        this.checkObjectivesSoft();
      },
      checkObjectivesSoft() { this.objState = this.objectives.map(o => { try { return !!o.check(this.net); } catch (e) { return false; } }); },
      // ---- canvas interaction ----
      devAt(id) { return this.net.devices[id]; },
      icon(d) { return N().TYPES[d.type].icon; },
      devLabel(d) { const ips = N().ipsOf(d); return ips.length ? ips[0] : ''; },
      linkPath(l) { const a = this.net.devices[l.a.dev], b = this.net.devices[l.b.dev]; if (!a || !b) return ''; return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }; },
      linkClass(l) { const up = (!this.net.devices[l.a.dev] || N().portUp(this.net, this.net.devices[l.a.dev], l.a.port)) && (!this.net.devices[l.b.dev] || N().portUp(this.net, this.net.devices[l.b.dev], l.b.port)); return { wireless: l.wireless, down: !up }; },
      selectDev(id, e) { if (this.tool === 'cable') { this.cableClick(id); return; } if (this.tool === 'delete') { this.removeDev(id); return; } this.sel = id; },
      startDrag(id, e) {
        if (this.tool !== 'select') return;
        this.sel = id; const d = this.net.devices[id]; const svg = this.$refs.svg; const pt = this.evtPoint(e);
        this.drag = { id, dx: d.x - pt.x, dy: d.y - pt.y };
      },
      onMove(e) { if (!this.drag) return; const pt = this.evtPoint(e); const d = this.net.devices[this.drag.id]; d.x = Math.max(40, Math.min(960, pt.x + this.drag.dx)); d.y = Math.max(40, Math.min(540, pt.y + this.drag.dy)); },
      endDrag() { if (this.drag) { this.save(); this.drag = null; } },
      evtPoint(e) { const svg = this.$refs.svg; const r = svg.getBoundingClientRect(); const cx = (e.touches ? e.touches[0].clientX : e.clientX); const cy = (e.touches ? e.touches[0].clientY : e.clientY); const vb = svg.viewBox.baseVal; return { x: (cx - r.left) / r.width * vb.width, y: (cy - r.top) / r.height * vb.height }; },
      cableClick(id) {
        if (!this.connectFrom) { this.connectFrom = id; this.logLine('Select the second device to connect ' + this.net.devices[id].name, 'info'); return; }
        if (this.connectFrom === id) { this.connectFrom = null; return; }
        this.openPortPicker(this.connectFrom, id); this.connectFrom = null;
      },
      openPortPicker(aId, bId) {
        const A = this.net.devices[aId], B = this.net.devices[bId];
        const freeA = N().portsOf(A).filter(p => !N().linkAt(this.net, aId, p));
        const freeB = N().portsOf(B).filter(p => !N().linkAt(this.net, bId, p));
        if (!freeA.length || !freeB.length) { NSA.ui.toast('No free ports on one of the devices.', 'error'); return; }
        NSA.ui.openModal({ title: 'Connect ' + A.name + ' ↔ ' + B.name, component: 'port-picker', props: { net: this.net, aId, bId, freeA, freeB, onDone: (pa, pb) => { const r = N().connect(this.net, aId, pa, bId, pb); if (r.error) NSA.ui.toast(r.error, 'error'); else { this.logLine('Connected ' + A.name + ' ' + pa + ' ↔ ' + B.name + ' ' + pb, 'ok'); this.checkObjectives(); } NSA.ui.closeModal(); } }, actions: [] });
      },
      removeDev(id) { N().removeDevice(this.net, id); if (this.sel === id) this.sel = null; this.checkObjectives(); },
      disconnectPort(port) { const l = N().linkAt(this.net, this.sel, port); if (l) { N().disconnect(this.net, l.id); this.checkObjectives(); } },
      addDevice(type) { const d = N().addDevice(this.net, type, { x: 120 + Math.random() * 60, y: 120 + Math.random() * 60 }); this.sel = d.id; this.checkObjectives(); },
      // ---- config ----
      setIface(port, field, e) { const val = e.target.value; const r = N().setInterface(this.net, this.sel, port, { [field]: val }); if (r.error) { this.logLine(this.selDev.name + ' ' + port + ': ' + r.error, 'err'); } this.save(); this.checkObjectives(); },
      setMode(port, e) { const m = e.target.value; const i = this.selDev.interfaces[port]; i.mode = m; if (m === 'dhcp') this.dhcpOne(port); this.save(); this.checkObjectives(); },
      setGw(e) { this.selDev.gateway = e.target.value.trim(); this.selDev.arp = {}; this.save(); this.checkObjectives(); },
      setDns(e) { this.selDev.dns = e.target.value.trim(); this.selDev.dnsCache = {}; this.save(); this.checkObjectives(); },
      togglePort(port) { const i = this.selDev.interfaces ? this.selDev.interfaces[port] : this.selDev.ports[port]; if (i) i.up = i.up === false; this.save(); this.checkObjectives(); },
      setWifi(field, e) { this.selDev.wifi = this.selDev.wifi || {}; this.selDev.wifi[field] = e.target.value; },
      dhcpOne(port) { const r = N().dhcpRequest(this.net, this.sel, port); r.log.forEach(l => this.logLine(this.selDev.name + ': ' + l, r.ok ? 'ok' : 'warn')); this.checkObjectives(); },
      dhcpAll() { const res = N().renewAllDhcp(this.net); res.forEach(x => this.logLine(this.net.devices[x.dev].name + ': ' + (x.result.ok ? 'got ' + x.result.ip : x.result.reason), x.result.ok ? 'ok' : 'warn')); this.checkObjectives(); },
      openConsole(id) { const d = this.net.devices[id]; const k = N().kindOf(d); if (k !== 'host' && k !== 'router' && k !== 'switch' && k !== 'internet') { NSA.ui.toast('This device has no console.', 'error'); return; } this.termDevId = id; try { this.termSession = NSA.terminal.createSession({ net: this.net, devId: id }); this.tab = 'console'; } catch (e) { NSA.ui.toast(e.message, 'error'); } },
      // ---- tools ----
      doPing() {
        const src = this.pingSrc, dst = (this.pingDst || '').trim(); if (!src || !dst) return;
        const r = N().ping(this.net, src, dst);
        const name = this.net.devices[src].name;
        if (r.success) this.logLine(name + ': Reply from ' + r.resolved + (r.resolved !== dst ? ' (' + dst + ')' : '') + ' — ' + Math.round(r.rtt) + ' ms, TTL ' + r.ttl, 'ok');
        else this.logLine(name + ': ping ' + dst + ' FAILED — ' + (r.reason || r.status), 'err');
        if (r.success) { NSA.store.state.stats.pingsSuccess++; }
        this.animateTrace(r.trace);
        this.checkObjectives();
      },
      doTrace() { const src = this.pingSrc, dst = (this.traceDst || this.pingDst || '').trim(); if (!src || !dst) return; const t = N().traceroute(this.net, src, dst); this.logLine(this.net.devices[src].name + ' traceroute to ' + dst + ':', 'info'); t.hops.forEach(h => this.logLine('  ' + h.ttl + '  ' + (h.timeout ? '* * *' : (h.name ? h.name + ' (' + h.ip + ')' : h.ip) + '  ' + Math.round(h.rtt) + ' ms'), h.timeout ? 'warn' : 'ok')); if (!t.success && t.reason) this.logLine('  ' + t.reason, 'err'); this.checkObjectives(); },
      runDiagnostics() { const issues = N().diagnose(this.net); if (!issues.length) { this.logLine('Diagnostics: no problems found.', 'ok'); return; } this.logLine('Diagnostics found ' + issues.length + ' issue(s):', 'warn'); issues.forEach(i => this.logLine('  [' + i.sev + '] ' + i.msg, i.sev === 'error' ? 'err' : i.sev === 'warn' ? 'warn' : 'info')); },
      animateTrace(trace) {
        const frames = (trace || []).filter(t => t.kind === 'frame' && t.path);
        this.animPackets = [];
        frames.slice(0, 20).forEach((f, idx) => {
          setTimeout(() => {
            (f.path || []).forEach((step, si) => {
              const from = this.net.devices[step.from], to = this.net.devices[step.to];
              if (!from || !to) return;
              const id = Math.random();
              this.animPackets.push({ id, x: from.x, y: from.y, tx: to.x, ty: to.y, cls: f.pkt && f.pkt.proto === 'icmp' ? (f.pkt.type === 'echo-reply' ? 'reply' : '') : '' });
              requestAnimationFrame(() => { const p = this.animPackets.find(p => p.id === id); if (p) { p.x = p.tx; p.y = p.ty; } });
              setTimeout(() => { const k = this.animPackets.findIndex(p => p.id === id); if (k >= 0) this.animPackets.splice(k, 1); }, 650);
            });
          }, idx * 180);
        });
      },
      showHint() { if (this.hintsShown < this.hints.length) { this.hintsShown++; NSA.progress.labAttempt(this.labId, { hintsUsed: this.hintsShown }); } },
      setDiag(i, v) { if (this.diagChecked) return; this.diagAnswers[i] = v; },
      checkDiag() { this.diagChecked = true; this.checkObjectives(); if (this.kind === 'troubleshoot' && this.diagOk && this.objState.filter((v, idx) => v || this.objectives[idx].manual).length === this.objectives.length) this.complete(); },
      reset() { NSA.ui.confirm('Reset this lab to its starting state? Your configuration will be lost.', { okLabel: 'Reset', danger: true }).then(ok => { if (ok) { this.net = N().build(this.lab.scenario()); this.sel = null; this.log = []; this.diagChecked = false; this.diagAnswers = {}; this.save(); this.checkObjectives(); } }); },
      exportNet() { NSA.util.download(this.labId + '-network.json', N().serialize(this.net)); },
      go(p) { NSA.router.navigate(p); },
      palette() { return ['pc', 'laptop', 'server', 'switch', 'router', 'firewall', 'ap', 'hub']; }
    },
    template: `
    <div v-if="!lab"><empty-state text="Lab not found." /></div>
    <div v-else class="stack">
      <div class="row between">
        <button class="btn ghost sm" @click="go('/labs')"><nsa-icon name="arrowLeft" :size="16"/> Labs</button>
        <div class="row"><level-badge :level="lab.level"/><span class="chip" v-if="completed" :class="'green'"><nsa-icon name="check" :size="13"/> Completed</span></div>
      </div>
      <section-head :title="lab.title" :sub="lab.brief" />

      <div v-if="kind==='troubleshoot'" class="callout warn"><div class="callout-title"><nsa-icon name="warning" :size="14"/> Reported problem</div>{{ lab.symptom }}</div>

      <div class="tabs">
        <button :class="{active:tab==='canvas'}" @click="tab='canvas'">Topology</button>
        <button v-if="termSession" :class="{active:tab==='console'}" @click="tab='console'">{{ net.devices[termDevId].name }} console</button>
      </div>

      <div v-show="tab==='canvas'" class="sim-layout">
        <div class="sim-canvas-wrap">
          <div class="sim-toolbar">
            <button class="btn" :class="{primary:tool==='select'}" @click="tool='select'"><nsa-icon name="eye" :size="14"/> Select/Move</button>
            <button class="btn" :class="{primary:tool==='cable'}" @click="tool='cable';connectFrom=null"><nsa-icon name="cable" :size="14"/> Cable</button>
            <button class="btn" :class="{primary:tool==='delete'}" @click="tool='delete'"><nsa-icon name="trash" :size="14"/> Delete</button>
            <span class="spacer"></span>
            <div class="row" v-if="lab.freeform">
              <select @change="addDevice($event.target.value);$event.target.value=''" style="width:auto">
                <option value="">+ Add device…</option>
                <option v-for="t in palette()" :key="t" :value="t">{{ N().TYPES[t].label }}</option>
              </select>
            </div>
            <button class="btn sm" @click="reset()" title="Reset lab"><nsa-icon name="refresh" :size="14"/></button>
          </div>
          <svg ref="svg" viewBox="0 0 1000 560" @mousemove="onMove" @mouseup="endDrag" @mouseleave="endDrag" @touchmove.prevent="onMove" @touchend="endDrag">
            <line v-for="l in links" :key="l.id" class="sim-link" :class="linkClass(l)" :x1="linkPath(l).x1" :y1="linkPath(l).y1" :x2="linkPath(l).x2" :y2="linkPath(l).y2" />
            <circle v-for="p in animPackets" :key="p.id" class="sim-packet" :class="p.cls" :cx="p.x" :cy="p.y" r="6" style="transition:cx .6s linear,cy .6s linear" />
            <g v-for="d in devices" :key="d.id" class="sim-device" :class="{selected:sel===d.id}" :transform="'translate('+d.x+','+d.y+')'"
               @mousedown="startDrag(d.id,$event)" @touchstart="startDrag(d.id,$event)" @click.stop="selectDev(d.id,$event)" style="cursor:pointer">
              <rect class="dev-box" x="-34" y="-26" width="68" height="52" rx="10" :style="connectFrom===d.id?'stroke:var(--cyan);stroke-width:2':''" />
              <g transform="translate(-9,-20) scale(0.8)" v-html="iconSvg(icon(d))" style="color:var(--accent2)"></g>
              <text x="0" y="8" text-anchor="middle" font-weight="600">{{ d.name }}</text>
              <text x="0" y="20" text-anchor="middle" class="dev-ip">{{ devLabel(d) }}</text>
            </g>
          </svg>
        </div>

        <div class="sim-side">
          <div class="card pad-sm">
            <div class="card-title"><h3><nsa-icon name="target" :size="16"/> Objectives</h3><span class="chip" :class="allDone?'green':''">{{ objDone }}/{{ objectives.length }}</span></div>
            <div v-for="(o,i) in objectives" :key="o.id" class="objective" :class="{done:objState[i]}">
              <span class="obj-mark">{{ objState[i]?'✓':'' }}</span><span>{{ o.text }}</span>
            </div>
            <div v-if="completed" class="feedback ok mt">Lab complete — well done!</div>
          </div>

          <div v-if="diag.length" class="card pad-sm">
            <div class="card-title"><h3><nsa-icon name="hint" :size="16"/> Diagnosis</h3></div>
            <div v-for="(q,i) in diag" :key="i" class="quiz-q" style="padding:10px;margin-bottom:8px">
              <div class="q-text small">{{ q.q }}</div>
              <div class="options">
                <div v-for="(o,oi) in q.options" :key="oi" class="option" :class="{selected:diagAnswers[i]===oi, correct:diagChecked&&q.answer===oi, wrong:diagChecked&&diagAnswers[i]===oi&&diagAnswers[i]!==q.answer}" @click="setDiag(i,oi)"><span class="opt-key">{{ String.fromCharCode(65+oi) }}</span>{{ o }}</div>
              </div>
              <div v-if="diagChecked" class="feedback mt" :class="diagAnswers[i]===q.answer?'ok':'bad'">{{ q.explain }}</div>
            </div>
            <button class="btn sm primary" @click="checkDiag" :disabled="diagChecked">Check diagnosis</button>
          </div>

          <div class="card pad-sm">
            <div class="card-title"><h3><nsa-icon name="bolt" :size="16"/> Tools</h3></div>
            <div class="field"><label>Source device</label><select v-model="pingSrc"><option v-for="d in hostsAndRouters" :key="d.id" :value="d.id">{{ d.name }}</option></select></div>
            <div class="inline-form"><input v-model="pingDst" placeholder="ping target (IP or name)" class="mono" spellcheck="false" @keyup.enter="doPing"/><button class="btn sm primary" @click="doPing">Ping</button></div>
            <div class="inline-form mt"><input v-model="traceDst" placeholder="traceroute target" class="mono" spellcheck="false" @keyup.enter="doTrace"/><button class="btn sm" @click="doTrace">Trace</button></div>
            <div class="btn-row mt"><button class="btn sm" @click="runDiagnostics"><nsa-icon name="search" :size="14"/> Diagnose</button><button class="btn sm" @click="dhcpAll">DHCP renew all</button></div>
          </div>

          <div v-if="selDev" class="card pad-sm">
            <div class="card-title"><h3>{{ selDev.name }}</h3><span class="chip">{{ N().TYPES[selDev.type].label }}</span></div>
            <button class="btn sm block" v-if="['host','router','switch','internet'].includes(N().kindOf(selDev))" @click="openConsole(sel)"><nsa-icon name="terminal" :size="14"/> Open console / CLI</button>
            <template v-if="selDev.interfaces && Object.keys(selDev.interfaces).length && N().kindOf(selDev)!=='switch'">
              <div v-for="(iface,name) in selDev.interfaces" :key="name" v-show="!iface.parent || iface.vlan!=null" style="border-top:1px solid var(--border);padding-top:8px;margin-top:8px">
                <div class="row between"><strong class="small mono">{{ name }}</strong>
                  <label class="checkbox tiny"><input type="checkbox" :checked="iface.up!==false" @change="togglePort(name)"/> up</label></div>
                <div v-if="N().kindOf(selDev)==='host'" class="field"><label class="tiny">Mode</label><select :value="iface.mode||'static'" @change="setMode(name,$event)"><option value="static">Static</option><option value="dhcp">DHCP</option></select></div>
                <div class="field" v-if="(iface.mode||'static')==='static'"><label class="tiny">IP address</label><input class="mono" :value="iface.ip" @change="setIface(name,'ip',$event)" spellcheck="false"/></div>
                <div class="field" v-if="(iface.mode||'static')==='static'"><label class="tiny">Subnet mask</label><input class="mono" :value="iface.mask" @change="setIface(name,'mask',$event)" placeholder="255.255.255.0" spellcheck="false"/></div>
                <div v-else class="small mono muted">{{ iface.ip || '(no lease)' }} {{ iface.mask }}</div>
              </div>
              <div v-if="N().kindOf(selDev)==='host'">
                <div class="field"><label class="tiny">Default gateway</label><input class="mono" :value="selDev.gateway" @change="setGw" spellcheck="false"/></div>
                <div class="field"><label class="tiny">DNS server</label><input class="mono" :value="selDev.dns" @change="setDns" spellcheck="false"/></div>
              </div>
            </template>
            <div v-if="selDev.wifi && N().kindOf(selDev)!=='switch'" style="border-top:1px solid var(--border);padding-top:8px;margin-top:8px">
              <div class="field"><label class="tiny">Wi-Fi SSID</label><input :value="selDev.wifi.ssid" @change="setWifi('ssid',$event)"/></div>
              <div class="field"><label class="tiny">Passphrase</label><input :value="selDev.wifi.psk" @change="setWifi('psk',$event)"/></div>
            </div>
            <div v-if="ports.length" style="border-top:1px solid var(--border);padding-top:8px;margin-top:8px">
              <div class="tiny dim mb">Ports</div>
              <div class="row" style="gap:4px;flex-wrap:wrap">
                <span v-for="p in ports" :key="p.name" class="port-pill" :class="{used:p.link}" :title="p.link?'connected — click to disconnect':'free'" @click="p.link&&disconnectPort(p.name)">{{ p.name }}</span>
              </div>
            </div>
          </div>

          <div class="card pad-sm">
            <div class="card-title"><h3><nsa-icon name="list" :size="16"/> Activity log</h3><button class="btn xs ghost" @click="log=[]">clear</button></div>
            <div class="sim-log"><div v-for="l in log" :key="l.id" :class="l.cls">{{ l.text }}</div><div v-if="!log.length" class="dim">Actions and test results appear here.</div></div>
          </div>

          <div class="card pad-sm">
            <div class="row between"><button class="btn sm" @click="showHint" :disabled="hintsShown>=hints.length"><nsa-icon name="hint" :size="14"/> Hint ({{ hintsShown }}/{{ hints.length }})</button><button class="btn sm ghost" @click="exportNet"><nsa-icon name="download" :size="14"/> Export</button></div>
            <div v-for="(h,i) in hints.slice(0,hintsShown)" :key="i" class="callout tip" style="margin-top:8px;padding:8px 10px"><span class="small">{{ i+1 }}. {{ h }}</span></div>
          </div>
        </div>
      </div>

      <div v-if="termSession" v-show="tab==='console'">
        <terminal-emu :session="termSession" :key="termDevId" />
      </div>
    </div>`,
    created2() {},
    beforeCreate() {},
    mounted() {},
    setup() { return { iconSvg: NSA.ui.iconSvg }; }
  };

  // Port picker modal
  NSA.components['port-picker'] = {
    props: { net: Object, aId: String, bId: String, freeA: Array, freeB: Array, onDone: Function },
    data() { return { pa: this.freeA[0], pb: this.freeB[0] }; },
    computed: { A() { return this.net.devices[this.aId]; }, B() { return this.net.devices[this.bId]; } },
    template: `
    <div>
      <div class="grid cols-2">
        <div class="field"><label>{{ A.name }} port</label><select v-model="pa"><option v-for="p in freeA" :key="p">{{ p }}</option></select></div>
        <div class="field"><label>{{ B.name }} port</label><select v-model="pb"><option v-for="p in freeB" :key="p">{{ p }}</option></select></div>
      </div>
      <p class="tiny dim">Tip: connect hosts to switch Fa ports, and switch-to-router on a spare port.</p>
      <div class="btn-row"><button class="btn primary" @click="onDone(pa,pb)"><nsa-icon name="cable" :size="16"/> Connect</button></div>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
