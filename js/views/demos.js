/* NetSec Academy – interactive lesson demos. nsa-demo dispatches by name. */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};
  const C = NSA.components;
  const S = () => NSA.subnet;

  // ---- OSI explorer ----
  C['demo-osi-explorer'] = { data() { return { active: 7, layers: [
    { n: 7, name: 'Application', job: 'The service the user interacts with. Provides network services to applications.', pdu: 'Data', ex: 'HTTP, HTTPS, DNS, DHCP, SMTP, FTP, SSH', dev: '—' },
    { n: 6, name: 'Presentation', job: 'Translates, encrypts and compresses data into a format the application can use.', pdu: 'Data', ex: 'TLS/SSL, JPEG, ASCII, UTF-8', dev: '—' },
    { n: 5, name: 'Session', job: 'Opens, manages and closes conversations between applications.', pdu: 'Data', ex: 'NetBIOS, RPC, SMB sessions', dev: '—' },
    { n: 4, name: 'Transport', job: 'End-to-end delivery, reliability and port addressing.', pdu: 'Segment (TCP) / Datagram (UDP)', ex: 'TCP, UDP', dev: 'Firewalls (port filtering)' },
    { n: 3, name: 'Network', job: 'Logical addressing and routing between networks.', pdu: 'Packet', ex: 'IPv4, IPv6, ICMP, OSPF', dev: 'Routers; IP addresses' },
    { n: 2, name: 'Data Link', job: 'Local delivery, framing and error detection on the link.', pdu: 'Frame', ex: 'Ethernet, Wi-Fi (802.11), ARP', dev: 'Switches, NICs; MAC addresses' },
    { n: 1, name: 'Physical', job: 'Transmits raw bits over the medium.', pdu: 'Bits', ex: 'Cables, fibre, radio, connectors', dev: 'Hubs, repeaters, cabling' }
  ] }; }, computed: { cur() { return this.layers.find(l => l.n === this.active); } }, template: `
    <div class="card">
      <div class="grid cols-2" style="gap:14px;align-items:start">
        <div>
          <div v-for="l in layers" :key="l.n" class="osi-layer" :class="{active:active===l.n}" @click="active=l.n" style="grid-template-columns:40px 1fr">
            <div class="osi-num">{{ l.n }}</div><div><strong>{{ l.name }}</strong></div>
          </div>
        </div>
        <div class="card pad-sm" style="position:sticky;top:12px">
          <h3>Layer {{ cur.n }} — {{ cur.name }}</h3>
          <p>{{ cur.job }}</p>
          <dl class="kv"><dt>PDU</dt><dd>{{ cur.pdu }}</dd><dt>Protocols</dt><dd style="font-family:var(--font)">{{ cur.ex }}</dd><dt>Devices</dt><dd style="font-family:var(--font)">{{ cur.dev }}</dd></dl>
        </div>
      </div>
      <p class="tiny dim mt">Mnemonic: <strong>P</strong>lease <strong>D</strong>o <strong>N</strong>ot <strong>T</strong>hrow <strong>S</strong>ausage <strong>P</strong>izza <strong>A</strong>way (Layer 1→7).</p>
    </div>` };

  // ---- Encapsulation ----
  C['demo-encapsulation'] = { data() { return { step: 0, steps: [
    { layer: 'Application (L7)', label: 'GET / HTTP/1.1', add: 'The browser creates the request data.', box: ['Data'] },
    { layer: 'Transport (L4)', label: 'TCP header + Data', add: 'TCP adds source/destination ports → segment.', box: ['TCP', 'Data'] },
    { layer: 'Network (L3)', label: 'IP header + segment', add: 'IP adds source/destination IP addresses → packet.', box: ['IP', 'TCP', 'Data'] },
    { layer: 'Data Link (L2)', label: 'Ethernet header + packet + FCS', add: 'Ethernet adds MAC addresses and a checksum → frame.', box: ['Eth', 'IP', 'TCP', 'Data', 'FCS'] },
    { layer: 'Physical (L1)', label: '0110100101…', add: 'The frame becomes bits on the wire.', box: ['bits'] }
  ] }; }, computed: { cur() { return this.steps[this.step]; } }, template: `
    <div class="card">
      <div class="row between"><h3 style="margin:0">{{ cur.layer }}</h3><div class="chip accent">Step {{ step+1 }} / {{ steps.length }}</div></div>
      <div class="bits mt" style="gap:6px">
        <span v-for="(b,i) in cur.box" :key="i" :class="b==='Data'?'host':(b==='bits'?'':'net')" style="width:auto;padding:0 10px;height:34px">{{ b }}</span>
      </div>
      <p class="mt">{{ cur.add }}</p>
      <div class="btn-row"><button class="btn" :disabled="step===0" @click="step--">Back</button><button class="btn primary" :disabled="step===steps.length-1" @click="step++">Next layer</button><button class="btn ghost" @click="step=0">Reset</button></div>
    </div>` };

  // ---- Binary converter ----
  C['demo-binary-converter'] = { data() { return { ip: '192.168.10.25' }; }, computed: {
    valid() { return S().isValidIPv4(this.ip); },
    octets() { return this.ip.split('.').map(o => { const n = Number(o); const bits = []; let rem = n; for (let v = 128; v >= 1; v /= 2) { if (rem >= v) { bits.push(1); rem -= v; } else bits.push(0); } return { dec: n, bits, valid: /^\d+$/.test(o) && n <= 255 }; }); }
  }, template: `
    <div class="card">
      <div class="field"><label>IPv4 address (decimal)</label><input class="mono" v-model="ip" :class="valid?'valid':'invalid'" spellcheck="false" /></div>
      <template v-if="octets.length===4 && octets.every(o=>o.valid)">
        <table class="mt"><thead><tr><th>Decimal</th><th>128</th><th>64</th><th>32</th><th>16</th><th>8</th><th>4</th><th>2</th><th>1</th></tr></thead>
        <tbody><tr v-for="(o,i) in octets" :key="i"><td class="mono"><strong>{{ o.dec }}</strong></td><td v-for="(b,bi) in o.bits" :key="bi" class="mono center" :style="b?'background:var(--accent-soft);color:var(--accent2)':''">{{ b }}</td></tr></tbody></table>
        <p class="mono mt">{{ octets.map(o=>o.bits.join('')).join('.') }}</p>
      </template>
      <p v-else class="muted small">Enter four octets 0–255.</p>
      <p class="tiny dim">Each octet is 8 bits. Turn on the values that add up to the number: 168 = 128 + 32 + 8.</p>
    </div>` };

  // ---- Subnet calculator ----
  C['demo-subnet-calculator'] = { data() { return { ip: '192.168.1.130', cidr: 26 }; }, computed: {
    info() { try { return S().info(this.ip, Number(this.cidr)); } catch (e) { return null; } }
  }, template: `
    <div class="card">
      <div class="inline-form">
        <div class="field" style="flex:2"><label>IP address</label><input class="mono" v-model="ip" spellcheck="false"/></div>
        <div class="field"><label>Prefix (/{{ cidr }})</label><input type="range" min="1" max="32" v-model.number="cidr" style="width:160px"/></div>
      </div>
      <template v-if="info">
        <dl class="kv mt">
          <dt>Mask</dt><dd>{{ info.mask }} (/{{ info.cidr }})</dd>
          <dt>Network</dt><dd>{{ info.network }}</dd>
          <dt>First host</dt><dd>{{ info.first }}</dd>
          <dt>Last host</dt><dd>{{ info.last }}</dd>
          <dt>Broadcast</dt><dd>{{ info.broadcast }}</dd>
          <dt>Usable hosts</dt><dd>{{ info.hosts.toLocaleString() }}</dd>
          <dt>Wildcard</dt><dd>{{ info.wildcard }}</dd>
          <dt>Type</dt><dd style="font-family:var(--font)">{{ info.type }}, class {{ info.class }}</dd>
        </dl>
      </template>
      <p v-else class="muted">Enter a valid IPv4 address.</p>
    </div>` };

  // ---- CIDR visualizer ----
  C['demo-cidr-visualizer'] = { data() { return { prefix: 26 }; }, computed: {
    blocks() { const size = Math.pow(2, 32 - this.prefix); const count = Math.min(64, 256 / (size > 256 ? 256 : size)); const list = []; const per = Math.pow(2, 32 - this.prefix); for (let i = 0; i < 256 / per && i < 64; i++) { const net = i * per; list.push({ net, end: net + per - 1, label: '192.168.1.' + net + '/' + this.prefix }); } return list; }
  }, template: `
    <div class="card">
      <div class="field"><label>Split 192.168.1.0/24 into /{{ prefix }} subnets</label><input type="range" min="24" max="30" v-model.number="prefix" style="width:220px"/></div>
      <div class="row" style="gap:4px;flex-wrap:wrap" :title="'192.168.1.0/24 divided into /'+prefix">
        <div v-for="(b,i) in blocks" :key="i" class="chip" :title="b.label" style="font-family:var(--mono);font-size:.72rem">.{{ b.net }}–.{{ b.end }}</div>
      </div>
      <p class="tiny dim mt">{{ blocks.length }} subnet(s), each with {{ Math.max(0, Math.pow(2,32-prefix)-2) }} usable hosts. Block size {{ Math.pow(2,32-prefix) }}.</p>
    </div>` };

  // ---- IPv6 compressor ----
  C['demo-ipv6-compressor'] = { data() { return { v: '2001:0db8:0000:0000:0000:ff00:0042:8329' }; }, computed: {
    expanded() { return S().expandIPv6(this.v); }, compressed() { return S().compressIPv6(this.v); }, type() { return this.expanded ? S().ipv6Type(this.v) : 'invalid'; }
  }, template: `
    <div class="card">
      <div class="field"><label>IPv6 address (any form)</label><input class="mono" v-model="v" spellcheck="false" :class="expanded?'valid':'invalid'"/></div>
      <template v-if="expanded">
        <dl class="kv mt"><dt>Expanded</dt><dd>{{ expanded }}</dd><dt>Compressed</dt><dd>{{ compressed }}</dd><dt>Type</dt><dd style="font-family:var(--font)">{{ type }}</dd></dl>
      </template>
      <p v-else class="muted">Not a valid IPv6 address.</p>
      <p class="tiny dim">Rules: drop leading zeros in each group; replace one run of all-zero groups with ::.</p>
    </div>` };

  // ---- Address classifier ----
  C['demo-address-classifier'] = { data() { return { ip: '192.168.1.1' }; }, computed: {
    valid() { return S().isValidIPv4(this.ip); }, type() { return S().addressType(this.ip); }, cls() { return S().classOf(this.ip); }
  }, methods: { chip(ip) { this.ip = ip; } }, template: `
    <div class="card">
      <div class="field"><label>IPv4 address</label><input class="mono" v-model="ip" spellcheck="false" :class="valid?'valid':'invalid'"/></div>
      <div class="row mt" v-if="valid">
        <span class="chip" :class="type==='public'?'green':(type==='private'?'accent':'amber')">{{ type }}</span>
        <span class="chip">Class {{ cls }}</span>
      </div>
      <div class="pills mt"><button v-for="ex in ['10.0.5.1','172.16.9.9','192.168.0.1','169.254.1.1','8.8.8.8','127.0.0.1','224.0.0.5','203.0.113.5']" :key="ex" @click="chip(ex)">{{ ex }}</button></div>
    </div>` };

  // ---- MAC OUI ----
  C['demo-mac-oui'] = { data() { return { mac: '3C:52:82:1A:9B:C4', vendors: { '3C:52:82': 'Hewlett Packard', '00:50:56': 'VMware', 'B8:27:EB': 'Raspberry Pi Foundation', '00:1A:2B': 'Cisco Systems', 'F0:9F:C2': 'Ubiquiti', '02:00:00': 'Locally administered (NetSec sim)' } }; }, computed: {
    clean() { return this.mac.toUpperCase().replace(/[^0-9A-F]/g, ''); }, valid() { return this.clean.length === 12; },
    oui() { return this.valid ? this.clean.slice(0, 6).match(/../g).join(':') : ''; },
    vendor() { return this.vendors[this.oui] || 'Unknown vendor (not in the demo list)'; },
    firstByte() { return this.valid ? parseInt(this.clean.slice(0, 2), 16) : 0; },
    multicast() { return (this.firstByte & 1) === 1; }, local() { return (this.firstByte & 2) === 2; }
  }, template: `
    <div class="card">
      <div class="field"><label>MAC address</label><input class="mono" v-model="mac" spellcheck="false" :class="valid?'valid':'invalid'"/></div>
      <template v-if="valid">
        <dl class="kv mt"><dt>OUI (vendor prefix)</dt><dd>{{ oui }}</dd><dt>Vendor</dt><dd style="font-family:var(--font)">{{ vendor }}</dd>
        <dt>Cast</dt><dd style="font-family:var(--font)">{{ multicast?'Multicast':'Unicast' }}</dd><dt>Administration</dt><dd style="font-family:var(--font)">{{ local?'Locally administered':'Universally administered (burned-in)' }}</dd></dl>
      </template>
    </div>` };

  // ---- DNS lookup ----
  C['demo-dns-lookup'] = { data() { return { step: 0, name: 'www.example.com', steps: [
    'Your computer checks its local DNS cache — not found.',
    'It asks the configured recursive resolver (e.g. 8.8.8.8): "What is www.example.com?"',
    'The resolver asks a root server: "Who handles .com?"',
    'The root replies with the .com TLD servers. The resolver asks them: "Who is authoritative for example.com?"',
    'The TLD replies with example.com\'s authoritative name server. The resolver asks it directly.',
    'The authoritative server answers: www.example.com = 93.184.216.34.',
    'The resolver caches the answer (for its TTL) and returns it to your computer. Now TCP can connect.'
  ] }; }, template: `
    <div class="card">
      <div class="handshake-step on"><strong>Resolving {{ name }}</strong></div>
      <div v-for="(s,i) in steps" :key="i" class="handshake-step" :class="{on:i<=step}">{{ i+1 }}. {{ s }}</div>
      <div class="btn-row mt"><button class="btn" :disabled="step===0" @click="step--">Back</button><button class="btn primary" :disabled="step===steps.length-1" @click="step++">Next step</button><button class="btn ghost" @click="step=0">Reset</button></div>
    </div>` };

  // ---- DHCP DORA ----
  C['demo-dhcp-dora'] = { data() { return { step: -1, steps: [
    { t: 'DISCOVER', dir: 'client → broadcast', d: 'Client (0.0.0.0) broadcasts "any DHCP servers?" to 255.255.255.255.', cast: 'broadcast' },
    { t: 'OFFER', dir: 'server → client', d: 'A server offers an address, mask, gateway and DNS.', cast: 'unicast' },
    { t: 'REQUEST', dir: 'client → broadcast', d: 'Client requests that specific offer (and declines others).', cast: 'broadcast' },
    { t: 'ACK', dir: 'server → client', d: 'Server confirms; the lease begins. Client is now configured.', cast: 'unicast' }
  ] }; }, template: `
    <div class="card">
      <div v-for="(s,i) in steps" :key="i" class="handshake-step" :class="{on:i<=step}">
        <div class="row between"><strong>{{ s.t }}</strong><span class="chip" :class="s.cast==='broadcast'?'amber':'green'">{{ s.dir }}</span></div>
        <div class="small">{{ s.d }}</div>
      </div>
      <div class="btn-row mt"><button class="btn primary" :disabled="step>=3" @click="step++">{{ step<0?'Start':'Next' }}</button><button class="btn ghost" @click="step=-1">Reset</button></div>
    </div>` };

  // ---- TCP handshake ----
  C['demo-tcp-handshake'] = { data() { return { step: -1, steps: [
    { t: 'SYN', d: 'Client → Server: "I want to connect" (synchronize, seq=x).' },
    { t: 'SYN-ACK', d: 'Server → Client: "OK, and I want to connect too" (seq=y, ack=x+1).' },
    { t: 'ACK', d: 'Client → Server: "Acknowledged" (ack=y+1). Connection established — data flows.' },
    { t: 'FIN/ACK ×2', d: 'When done, each side sends FIN and is acknowledged — the connection closes.' }
  ] }; }, template: `
    <div class="card">
      <div v-for="(s,i) in steps" :key="i" class="handshake-step" :class="{on:i<=step}"><strong>{{ s.t }}</strong> — {{ s.d }}</div>
      <div class="btn-row mt"><button class="btn primary" :disabled="step>=3" @click="step++">{{ step<0?'Begin handshake':'Next' }}</button><button class="btn ghost" @click="step=-1">Reset</button></div>
      <p class="tiny dim">In a scan: SYN → RST means the port is closed; SYN with no reply means filtered.</p>
    </div>` };

  // ---- Port matcher game ----
  C['demo-port-matcher'] = { data() { return { pairs: [['SSH', 22], ['HTTPS', 443], ['DNS', 53], ['HTTP', 80], ['RDP', 3389], ['SMB', 445], ['FTP', 21], ['SMTP', 25]], chosen: null, matched: {}, msg: '' }; }, computed: {
    services() { return NSA.util.shuffle(this.pairs.map(p => p[0])); }, ports() { return NSA.util.shuffle(this.pairs.map(p => p[1])); }, done() { return Object.keys(this.matched).length === this.pairs.length; }
  }, methods: {
    pickSvc(s) { this.chosen = { type: 'svc', v: s }; }, pickPort(p) { if (!this.chosen) { this.chosen = { type: 'port', v: p }; return; } const svc = this.chosen.type === 'svc' ? this.chosen.v : null; const port = this.chosen.type === 'port' ? this.chosen.v : p; const svc2 = svc || s; this.tryMatch(this.chosen.type === 'svc' ? this.chosen.v : null, p); },
    tryMatch(svc, port) { if (!svc) { this.chosen = null; return; } const correct = this.pairs.find(x => x[0] === svc && x[1] === port); if (correct) { this.matched[svc] = port; this.msg = '✓ ' + svc + ' = ' + port; } else { this.msg = '✗ try again'; } this.chosen = null; },
    reset() { this.matched = {}; this.chosen = null; this.msg = ''; }
  }, template: `
    <div class="card">
      <p class="small muted">Click a service, then its port.</p>
      <div class="grid cols-2" style="gap:10px">
        <div><div class="tiny dim mb">Services</div><div class="pills" style="flex-direction:column;align-items:stretch">
          <button v-for="s in services" :key="s" :disabled="matched[s]" :class="{active:chosen&&chosen.v===s}" @click="pickSvc(s)">{{ s }} <span v-if="matched[s]" style="float:right">→ {{ matched[s] }} ✓</span></button>
        </div></div>
        <div><div class="tiny dim mb">Ports</div><div class="pills" style="flex-direction:column;align-items:stretch">
          <button v-for="p in ports" :key="p" @click="pickPort(p)">{{ p }}</button>
        </div></div>
      </div>
      <div class="row between mt"><span class="small" :style="msg[0]==='✓'?'color:var(--green)':'color:var(--red)'">{{ msg }}</span><button class="btn sm ghost" @click="reset">Reset</button></div>
      <div v-if="done" class="feedback ok mt">All matched! You know your ports.</div>
    </div>` };

  // ---- Wi-Fi channels ----
  C['demo-wifi-channels'] = { data() { return { a: 1, b: 6, c: 11 }; }, computed: {
    overlap() { const ch = [this.a, this.b, this.c]; const bad = []; for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(ch[i] - ch[j]) < 5 && ch[i] !== ch[j]) bad.push([ch[i], ch[j]]); if (ch[0] === ch[1] || ch[1] === ch[2] || ch[0] === ch[2]) bad.push(['same']); return bad; }
  }, template: `
    <div class="card">
      <p class="small muted">Set three access points\' 2.4 GHz channels. Only 1, 6, 11 avoid overlap.</p>
      <div class="inline-form">
        <div class="field"><label>AP1 (ch {{ a }})</label><input type="range" min="1" max="11" v-model.number="a"/></div>
        <div class="field"><label>AP2 (ch {{ b }})</label><input type="range" min="1" max="11" v-model.number="b"/></div>
        <div class="field"><label>AP3 (ch {{ c }})</label><input type="range" min="1" max="11" v-model.number="c"/></div>
      </div>
      <div class="feedback mt" :class="overlap.length?'bad':'ok'">{{ overlap.length ? 'Channels overlap — interference and retransmissions. Use 1, 6 and 11.' : 'No overlap. Clean channel plan.' }}</div>
    </div>` };

  // ---- CIA sorter ----
  C['demo-cia-sorter'] = { data() { return { items: [
    { t: 'An attacker reads customer records from an unencrypted database', a: 'C' },
    { t: 'Malware silently changes figures in a spreadsheet', a: 'I' },
    { t: 'A DDoS attack takes the website offline', a: 'A' },
    { t: 'A laptop with full-disk encryption is stolen (data stays secret)', a: 'C' },
    { t: 'Ransomware encrypts all the file server\'s files', a: 'A' },
    { t: 'A checksum reveals a downloaded file was tampered with', a: 'I' }
  ], answers: {}, checked: false }; }, computed: { score() { return this.items.filter((it, i) => this.answers[i] === it.a).length; } }, methods: { set(i, v) { this.answers[i] = v; }, check() { this.checked = true; } }, template: `
    <div class="card">
      <p class="small muted">Which property does each event concern? C = Confidentiality, I = Integrity, A = Availability.</p>
      <div class="list">
        <div v-for="(it,i) in items" :key="i" class="list-item" style="align-items:center">
          <div class="li-body">{{ it.t }}</div>
          <div class="li-right">
            <button v-for="p in ['C','I','A']" :key="p" class="btn xs" :class="{primary:answers[i]===p, success:checked&&it.a===p, danger:checked&&answers[i]===p&&answers[i]!==it.a}" @click="set(i,p)">{{ p }}</button>
          </div>
        </div>
      </div>
      <div class="btn-row mt"><button class="btn primary" @click="check">Check</button><span v-if="checked" class="chip" :class="score===items.length?'green':'amber'">{{ score }}/{{ items.length }} correct</span></div>
    </div>` };

  // ---- Phishing inspector ----
  C['demo-phishing-inspector'] = { data() { return { reveal: {}, flags: [
    { id: 'from', label: 'From: Microsoft 365 <security@micros0ft-alerts.com>', why: 'Look-alike domain: "micros0ft" uses a zero, and the real domain is micros0ft-alerts.com — not microsoft.com.' },
    { id: 'subj', label: 'Subject: Unusual sign-in — verify within 24 HOURS or account LOCKED', why: 'Urgency and threats pressure you to act without thinking.' },
    { id: 'link', label: 'Link: https://account.microsoft.com.verify-login.net/reset', why: 'Read right-to-left: the real domain is verify-login.net. "account.microsoft.com" is just a subdomain the attacker controls.' },
    { id: 'greet', label: 'Greeting: "Dear valued user,"', why: 'Generic greeting — a real service usually uses your name.' },
    { id: 'ask', label: 'Body: "Confirm your password and payment details to keep your account."', why: 'Asking for credentials and payment details is a hallmark of phishing. Legitimate services never do this by email link.' }
  ] }; }, template: `
    <div class="card">
      <div class="email-view">
        <div class="eh" @click="reveal.from=!reveal.from" style="cursor:pointer">From: <strong>Microsoft 365</strong> &lt;security@<span style="background:#fde68a">micros0ft-alerts.com</span>&gt;</div>
        <div class="eh" style="cursor:pointer" @click="reveal.subj=!reveal.subj">Subject: <strong>Unusual sign-in — verify within 24 HOURS</strong></div>
        <hr style="border-color:#dfe3ea">
        <p>Dear valued user,</p>
        <p>We detected an unusual sign-in. Confirm your password and payment details to keep your account active.</p>
        <p><a href="#" @click.prevent="reveal.link=!reveal.link">https://account.microsoft.com.<span style="background:#fde68a">verify-login.net</span>/reset</a></p>
      </div>
      <p class="small muted mt">Click any highlighted element below to see why it is a red flag.</p>
      <div class="list">
        <div v-for="f in flags" :key="f.id" class="list-item" style="cursor:pointer" @click="reveal[f.id]=!reveal[f.id]">
          <div class="li-icon" style="background:var(--red-soft);color:var(--red)"><nsa-icon name="warning" :size="16"/></div>
          <div class="li-body"><div class="mono tiny">{{ f.label }}</div><div v-if="reveal[f.id]" class="small" style="color:var(--amber);margin-top:4px">{{ f.why }}</div></div>
        </div>
      </div>
    </div>` };

  // ---- Password strength ----
  C['demo-password-strength'] = { data() { return { pw: '' }; }, computed: {
    analysis() { const pw = this.pw; if (!pw) return null; let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/[0-9]/.test(pw)) pool += 10; if (/[^a-zA-Z0-9]/.test(pw)) pool += 33; const entropy = pw.length * Math.log2(pool || 1); const common = ['password', '123456', 'qwerty', 'letmein', 'admin', 'welcome', 'password1', 'summer2024', 'p@ssw0rd'].some(c => pw.toLowerCase().includes(c)); const guesses = Math.pow(2, entropy) / 2; const perSec = 1e11; let secs = guesses / perSec; if (common) secs = 0.001; return { entropy: Math.round(entropy), common, time: this.fmt(secs), score: common ? 5 : Math.min(100, entropy) }; },
    bar() { const a = this.analysis; if (!a) return { w: 0, c: 'var(--panel3)' }; const s = a.score; return { w: Math.min(100, s), c: s < 40 ? 'var(--red)' : s < 70 ? 'var(--amber)' : 'var(--green)' }; }
  }, methods: { fmt(s) { if (s < 1) return 'instantly'; if (s < 60) return Math.round(s) + ' seconds'; if (s < 3600) return Math.round(s / 60) + ' minutes'; if (s < 86400) return Math.round(s / 3600) + ' hours'; if (s < 31536000) return Math.round(s / 86400) + ' days'; const y = s / 31536000; if (y < 1e6) return Math.round(y).toLocaleString() + ' years'; return 'millions of years'; } }, template: `
    <div class="card">
      <div class="field"><label>Try a password (not a real one)</label><input type="text" v-model="pw" spellcheck="false" placeholder="type here…"/></div>
      <div class="pw-meter mt"><span :style="{width:bar.w+'%',background:bar.c}"></span></div>
      <template v-if="analysis">
        <dl class="kv mt"><dt>Estimated entropy</dt><dd>{{ analysis.entropy }} bits</dd><dt>Offline crack time</dt><dd>{{ analysis.time }}</dd></dl>
        <div v-if="analysis.common" class="feedback bad mt">Contains a common/breached pattern — crackable instantly regardless of length.</div>
      </template>
      <p class="tiny dim mt">Estimate only. Length and unpredictability matter most; a long passphrase of random words beats a short complex one.</p>
    </div>` };

  // ---- Firewall rule sim / ACL tester (shared) ----
  const fwDemo = {
    data() { return { rules: [
      { action: 'allow', proto: 'tcp', src: 'LAN', dst: 'any', port: '443' },
      { action: 'allow', proto: 'tcp', src: 'LAN', dst: 'any', port: '80' },
      { action: 'deny', proto: 'tcp', src: 'any', dst: 'any', port: '23' },
      { action: 'allow', proto: 'tcp', src: 'any', dst: 'DMZ', port: '443' }
    ], test: { proto: 'tcp', src: 'LAN', dst: 'any', port: '443' }, result: null }; },
    methods: {
      move(i, d) { const j = i + d; if (j < 0 || j >= this.rules.length) return; const t = this.rules[i]; this.rules[i] = this.rules[j]; this.rules[j] = t; this.run(); },
      run() { for (let i = 0; i < this.rules.length; i++) { const r = this.rules[i]; const m = (r.proto === 'any' || r.proto === this.test.proto) && (r.src === 'any' || r.src === this.test.src) && (r.dst === 'any' || r.dst === this.test.dst) && (r.port === 'any' || r.port === this.test.port); if (m) { this.result = { line: i + 1, action: r.action }; return; } } this.result = { line: 'none', action: 'deny', implicit: true }; }
    },
    mounted() { this.run(); },
    template: `
    <div class="card">
      <p class="small muted">Rules are evaluated top to bottom; first match wins; unmatched traffic hits the implicit deny.</p>
      <div class="list">
        <div v-for="(r,i) in rules" :key="i" class="list-item" style="padding:8px 12px">
          <span class="opt-key">{{ i+1 }}</span>
          <div class="li-body mono small"><span :style="r.action==='allow'?'color:var(--green)':'color:var(--red)'">{{ r.action }}</span> {{ r.proto }} {{ r.src }} → {{ r.dst }} port {{ r.port }}</div>
          <div class="li-right"><button class="btn xs" @click="move(i,-1)">↑</button><button class="btn xs" @click="move(i,1)">↓</button></div>
        </div>
        <div class="list-item" style="padding:8px 12px;opacity:.7"><span class="opt-key">∞</span><div class="li-body mono small"><span style="color:var(--red)">deny</span> any any (implicit)</div></div>
      </div>
      <div class="inline-form mt">
        <div class="field"><label>Test src</label><select v-model="test.src" @change="run"><option>LAN</option><option>DMZ</option><option>any</option></select></div>
        <div class="field"><label>dst</label><select v-model="test.dst" @change="run"><option>any</option><option>DMZ</option></select></div>
        <div class="field"><label>port</label><select v-model="test.port" @change="run"><option>443</option><option>80</option><option>23</option></select></div>
      </div>
      <div v-if="result" class="feedback mt" :class="result.action==='allow'?'ok':'bad'">
        Traffic is <strong>{{ result.action==='allow'?'ALLOWED':'DENIED' }}</strong>
        <span v-if="result.implicit">by the implicit deny (no rule matched).</span><span v-else>by rule {{ result.line }}.</span>
      </div>
    </div>`
  };
  C['demo-firewall-rule-sim'] = fwDemo; C['demo-acl-tester'] = fwDemo;

  // ---- NAT table ----
  C['demo-nat-table'] = { data() { return { flows: [], n: 0 }; }, methods: {
    add() { const inside = ['192.168.1.10', '192.168.1.11', '192.168.1.12'][this.n % 3]; const port = 51000 + this.n; this.flows.push({ inside: inside + ':' + port, global: '203.0.113.2:' + port, dst: '8.8.8.8:443' }); this.n++; },
    inbound() { NSA.ui.alert('An unsolicited inbound packet to 203.0.113.2 has no matching translation entry, so the router **drops it**. This is the incidental firewall effect of NAT — but it is not a substitute for a real firewall policy.', 'Unsolicited inbound'); }
  }, template: `
    <div class="card">
      <p class="small muted">Each inside host that starts a connection gets a translation entry. One public IP serves them all (PAT).</p>
      <table class="mt"><thead><tr><th>Inside (local)</th><th>Translated (global)</th><th>Destination</th></tr></thead>
      <tbody><tr v-for="(f,i) in flows" :key="i"><td class="mono small">{{ f.inside }}</td><td class="mono small">{{ f.global }}</td><td class="mono small">{{ f.dst }}</td></tr>
      <tr v-if="!flows.length"><td colspan="3" class="muted center">No translations yet</td></tr></tbody></table>
      <div class="btn-row mt"><button class="btn primary" @click="add">Start a connection</button><button class="btn" @click="inbound">Unsolicited inbound packet</button><button class="btn ghost" @click="flows=[];n=0">Clear</button></div>
    </div>` };

  // ---- ARP MitM ----
  C['demo-arp-mitm'] = { data() { return { phase: 0 }; }, computed: {
    rows() { if (this.phase === 0) return [{ ip: '192.168.1.1 (gateway)', mac: '02:00:00:00:00:05', note: 'legitimate router' }, { ip: '192.168.1.2 (server)', mac: '02:00:00:00:00:02', note: 'legitimate server' }]; return [{ ip: '192.168.1.1 (gateway)', mac: '02:00:00:aa:bb:cc', note: '⚠ now the attacker\'s MAC!', bad: true }, { ip: '192.168.1.2 (server)', mac: '02:00:00:aa:bb:cc', note: '⚠ also the attacker\'s MAC!', bad: true }]; }
  }, template: `
    <div class="card">
      <div class="row between"><h3 style="margin:0">Victim's ARP cache</h3><span class="chip" :class="phase?'red':'green'">{{ phase?'After ARP spoofing':'Normal' }}</span></div>
      <table class="mt"><thead><tr><th>IP</th><th>MAC</th><th></th></tr></thead>
      <tbody><tr v-for="(r,i) in rows" :key="i"><td class="mono small">{{ r.ip }}</td><td class="mono small" :style="r.bad?'color:var(--red)':''">{{ r.mac }}</td><td class="small" :style="r.bad?'color:var(--red)':'color:var(--muted)'">{{ r.note }}</td></tr></tbody></table>
      <div class="btn-row mt"><button class="btn" :class="phase?'ghost':'danger'" @click="phase=phase?0:1">{{ phase?'Reset':'Launch ARP spoof' }}</button></div>
      <div v-if="phase" class="feedback bad mt">Both the gateway and server now point to one MAC — the attacker is in the middle. Detection: duplicate IP warnings, the gateway MAC changing. Prevention: DHCP snooping + Dynamic ARP Inspection, and end-to-end encryption.</div>
    </div>` };

  // ---- Topology picker ----
  C['demo-topology-picker'] = { data() { return { sel: 'star', topos: {
    star: { name: 'Star', desc: 'Every device connects to a central switch. One cable failure affects one device, but the switch is a single point of failure. The standard LAN layout.', fail: 'If the central switch fails, everything connected to it goes down.' },
    bus: { name: 'Bus', desc: 'All devices share one cable. Cheap but a single break stops everyone and collisions are common. Obsolete.', fail: 'One break in the backbone cable kills the whole segment.' },
    ring: { name: 'Ring', desc: 'Each device links to the next in a loop. Predictable, no collisions, but a break can stop the ring unless it is dual.', fail: 'A single break can isolate the ring (unless redundant).' },
    mesh: { name: 'Mesh', desc: 'Every node connects to many/all others. No single point of failure, but expensive. Used in WAN cores and data centres.', fail: 'Survives link failures by rerouting — that is the point.' }
  } }; }, computed: { cur() { return this.topos[this.sel]; } }, template: `
    <div class="card">
      <div class="pills">
        <button v-for="(t,k) in topos" :key="k" :class="{active:sel===k}" @click="sel=k">{{ t.name }}</button>
      </div>
      <h3 class="mt">{{ cur.name }}</h3><p>{{ cur.desc }}</p>
      <div class="callout warn"><div class="callout-title">What happens on failure</div>{{ cur.fail }}</div>
    </div>` };

  // ---- Device matcher ----
  C['demo-device-matcher'] = { data() { return { qs: [
    { need: 'Connect many PCs on one floor and forward frames by MAC address', a: 'Switch', opts: ['Hub', 'Switch', 'Router', 'Firewall'] },
    { need: 'Connect two different subnets / reach the Internet', a: 'Router', opts: ['Switch', 'Hub', 'Router', 'Access point'] },
    { need: 'Allow or block traffic by zone, port and connection state', a: 'Firewall', opts: ['Hub', 'Switch', 'Firewall', 'Modem'] },
    { need: 'Give laptops and phones wireless access to the wired LAN', a: 'Access point', opts: ['Router', 'Access point', 'Hub', 'Firewall'] }
  ], answers: {}, checked: false }; }, computed: { score() { return this.qs.filter((q, i) => this.answers[i] === q.a).length; } }, methods: { set(i, v) { this.answers[i] = v; }, check() { this.checked = true; } }, template: `
    <div class="card">
      <div v-for="(q,i) in qs" :key="i" class="quiz-q">
        <div class="q-text">{{ q.need }}</div>
        <div class="pills">
          <button v-for="o in q.opts" :key="o" :class="{active:answers[i]===o, 'btn':false}" :style="checked&&o===q.a?'border-color:var(--green);color:var(--green)':(checked&&answers[i]===o?'border-color:var(--red)':'')" @click="set(i,o)">{{ o }}</button>
        </div>
      </div>
      <div class="btn-row mt"><button class="btn primary" @click="check">Check</button><span v-if="checked" class="chip" :class="score===qs.length?'green':'amber'">{{ score }}/{{ qs.length }}</span></div>
    </div>` };

  // ---- VLSM planner ----
  C['demo-vlsm-planner'] = { data() { return { base: '192.168.1.0/24', reqs: [{ name: 'Sales', hosts: 50 }, { name: 'Engineering', hosts: 25 }, { name: 'Management', hosts: 10 }, { name: 'WAN link', hosts: 2 }] }; }, computed: {
    result() { try { return S().vlsm(this.base, this.reqs); } catch (e) { return { error: 'invalid' }; } }
  }, methods: { add() { this.reqs.push({ name: 'Dept' + (this.reqs.length + 1), hosts: 10 }); }, rm(i) { this.reqs.splice(i, 1); } }, template: `
    <div class="card">
      <div class="field"><label>Base network</label><input class="mono" v-model="base" style="max-width:220px"/></div>
      <div class="list">
        <div v-for="(r,i) in reqs" :key="i" class="list-item" style="padding:6px 10px">
          <input v-model="r.name" style="flex:1" />
          <input type="number" v-model.number="r.hosts" style="width:90px" /> <span class="small muted">hosts</span>
          <button class="btn xs ghost" @click="rm(i)"><nsa-icon name="trash" :size="14"/></button>
        </div>
      </div>
      <button class="btn sm mt" @click="add"><nsa-icon name="plus" :size="14"/> Add department</button>
      <table class="mt" v-if="result.allocations"><thead><tr><th>Dept</th><th>Hosts</th><th>Network</th><th>Range</th><th>Broadcast</th></tr></thead>
      <tbody><tr v-for="a in result.allocations" :key="a.name"><td>{{ a.name }}</td><td>{{ a.hosts }} → /{{ a.cidr }} ({{ a.usable }})</td><td class="mono small">{{ a.network }}</td><td class="mono small">{{ a.first }}–{{ a.last }}</td><td class="mono small">{{ a.broadcast }}</td></tr></tbody></table>
      <div v-if="result.error" class="feedback bad mt">{{ result.error }}</div>
    </div>` };

  // Dispatcher
  C['nsa-demo'] = { props: { name: String }, computed: { comp() { const c = NSA.components['demo-' + this.name]; return c || null; } }, template: `
    <div><component v-if="comp" :is="comp" /><div v-else class="empty">Interactive demo "{{ name }}" is loading…</div></div>` };
})(typeof globalThis !== 'undefined' ? globalThis : window);
