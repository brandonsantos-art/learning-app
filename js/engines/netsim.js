/* NetSec Academy – Network simulation engine
 * Simulates L2 switching (VLANs, trunks, MAC learning), ARP, IPv4 routing (longest prefix match,
 * static/default routes), NAT/PAT, firewall policies, router ACLs, DHCP, DNS (with forwarding),
 * ICMP (echo, TTL expiry, unreachable), and TCP/UDP port checks. Pure data in, results + trace out.
 */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  const S = () => NSA.subnet;

  const TYPES = {
    pc: { label: 'PC', icon: 'pc', ports: ['eth0'], kind: 'host', os: 'windows' },
    laptop: { label: 'Laptop', icon: 'laptop', ports: ['eth0', 'wlan0'], kind: 'host', os: 'windows' },
    server: { label: 'Server', icon: 'server', ports: ['eth0'], kind: 'host', os: 'linux' },
    switch: { label: 'Switch', icon: 'switch', ports: (function () { const p = []; for (let i = 1; i <= 24; i++) p.push('Fa0/' + i); p.push('G0/1', 'G0/2'); return p; })(), kind: 'switch', os: 'ios' },
    hub: { label: 'Hub', icon: 'switch', ports: ['P1', 'P2', 'P3', 'P4'], kind: 'hub' },
    ap: { label: 'Access Point', icon: 'wifi', ports: ['eth0', 'wlan1', 'wlan2', 'wlan3', 'wlan4'], kind: 'switch', wireless: true },
    router: { label: 'Router', icon: 'router', ports: ['G0/0', 'G0/1', 'G0/2'], kind: 'router', os: 'ios' },
    firewall: { label: 'Firewall', icon: 'firewall', ports: ['wan', 'lan', 'dmz'], kind: 'router', firewall: true },
    internet: { label: 'Internet', icon: 'cloud', ports: ['wan1', 'wan2'], kind: 'internet' }
  };
  const SERVICE_PORTS = { ftp: 21, ssh: 22, telnet: 23, smtp: 25, dns: 53, dhcp: 67, http: 80, pop3: 110, ntp: 123, netbios: 139, imap: 143, snmp: 161, ldap: 389, https: 443, smb: 445, mssql: 1433, mysql: 3306, rdp: 3389, vnc: 5900, redis: 6379, winrm: 5985, 'http-alt': 8080, mongodb: 27017 };
  const UDP_SERVICES = ['dns', 'dhcp', 'ntp', 'snmp'];
  const PUBLIC_DNS = { 'dns.google': '8.8.8.8', 'one.one.one.one': '1.1.1.1', 'google.com': '142.250.74.46', 'www.google.com': '142.250.74.46', 'example.com': '93.184.216.34', 'www.example.com': '93.184.216.34', 'github.com': '140.82.121.4', 'www.github.com': '140.82.121.4', 'microsoft.com': '20.70.246.20', 'www.microsoft.com': '20.70.246.20', 'cloudflare.com': '104.16.132.229', 'www.cloudflare.com': '104.16.132.229', 'netsec.academy': '203.0.113.80', 'www.netsec.academy': '203.0.113.80', 'updates.netsec.academy': '203.0.113.81', 'cisco.com': '72.163.4.185', 'www.cisco.com': '72.163.4.185' };

  let macCounter = 1;
  function nextMac(net) {
    net.macCounter = (net.macCounter || 0) + 1;
    const n = net.macCounter;
    return '02:00:' + hex(Math.floor(n / 65536) % 256) + ':' + hex(Math.floor(n / 256) % 256) + ':' + hex(n % 256) + ':' + hex((n * 7) % 256);
  }
  function hex(n) { return n.toString(16).padStart(2, '0'); }
  function uid(p) { return (p || 'd') + Math.random().toString(36).slice(2, 7); }

  function createNetwork() { return { devices: {}, links: [], macCounter: 0, nextNum: {} }; }

  function addDevice(net, type, opts) {
    opts = opts || {};
    const T = TYPES[type]; if (!T) throw new Error('Unknown device type ' + type);
    net.nextNum[type] = (net.nextNum[type] || 0) + 1;
    const id = opts.id || uid(type.slice(0, 2));
    const defaultNames = { pc: 'PC', laptop: 'Laptop', server: 'Server', switch: 'SW', hub: 'Hub', ap: 'AP', router: 'R', firewall: 'FW', internet: 'Internet' };
    const dev = {
      id, type, name: opts.name || (defaultNames[type] + (type === 'internet' ? '' : net.nextNum[type])),
      x: opts.x || 100, y: opts.y || 100,
      os: opts.os || T.os || null,
      interfaces: {}, ports: {}, gateway: opts.gateway || '', dns: opts.dns || '', dnsSuffix: opts.dnsSuffix || '',
      routes: opts.routes ? opts.routes.map(r => Object.assign({ type: 'static' }, r)) : [],
      services: opts.services || {}, arp: {}, macTable: {}, acls: opts.acls || {}, nat: opts.nat || null,
      rules: opts.rules || [], policy: opts.policy || (type === 'firewall' ? 'deny' : 'allow'), flows: {},
      wifi: opts.wifi || (type === 'ap' ? { ssid: 'NetSec-WiFi', psk: 'changeme123', security: 'wpa2' } : (type === 'laptop' ? { ssid: '', psk: '' } : null)),
      host: opts.host || null, notes: opts.notes || ''
    };
    if (T.kind === 'host' || T.kind === 'router' || T.kind === 'internet') {
      for (const p of T.ports) dev.interfaces[p] = { ip: '', mask: '', up: true, mac: nextMac(net), mode: 'static', acl: { in: null, out: null }, description: '' };
    } else {
      for (const p of T.ports) dev.ports[p] = { mode: 'access', vlan: 1, up: true, native: 1, allowed: null };
      dev.vlans = { 1: 'default' };
    }
    if (opts.interfaces) {
      for (const name of Object.keys(opts.interfaces)) {
        const cfg = opts.interfaces[name];
        if (!dev.interfaces[name]) dev.interfaces[name] = { ip: '', mask: '', up: true, mac: nextMac(net), mode: 'static', acl: { in: null, out: null }, description: '' };
        Object.assign(dev.interfaces[name], cfg);
        if (typeof dev.interfaces[name].mask === 'number') dev.interfaces[name].mask = S().cidrToMask(dev.interfaces[name].mask);
        if (cfg.ip && cfg.ip.includes('/')) { const [ip, bits] = cfg.ip.split('/'); dev.interfaces[name].ip = ip; dev.interfaces[name].mask = S().cidrToMask(Number(bits)); }
        if (!dev.interfaces[name].acl) dev.interfaces[name].acl = { in: null, out: null };
      }
    }
    if (opts.ports) for (const p of Object.keys(opts.ports)) dev.ports[p] = Object.assign(dev.ports[p] || { mode: 'access', vlan: 1, up: true, native: 1, allowed: null }, opts.ports[p]);
    if (opts.vlans) dev.vlans = Object.assign(dev.vlans || {}, opts.vlans);
    if (type === 'internet') {
      dev.services = Object.assign({ dns: { records: Object.assign({}, PUBLIC_DNS), authoritative: true } }, dev.services);
      dev.publicHosts = Object.assign({ '8.8.8.8': { name: 'dns.google', services: ['dns'] }, '1.1.1.1': { name: 'one.one.one.one', services: ['dns'] }, '93.184.216.34': { name: 'example.com', services: ['http', 'https'] }, '142.250.74.46': { name: 'google.com', services: ['http', 'https'] }, '140.82.121.4': { name: 'github.com', services: ['http', 'https', 'ssh'] }, '203.0.113.80': { name: 'netsec.academy', services: ['http', 'https'] }, '203.0.113.81': { name: 'updates.netsec.academy', services: ['https'] } }, opts.publicHosts || {});
    }
    net.devices[id] = dev;
    return dev;
  }
  function removeDevice(net, id) {
    net.links = net.links.filter(l => l.a.dev !== id && l.b.dev !== id);
    delete net.devices[id];
  }
  function portsOf(dev) { return Object.keys(TYPES[dev.type].kind === 'host' || TYPES[dev.type].kind === 'router' || TYPES[dev.type].kind === 'internet' ? dev.interfaces : dev.ports).filter(p => !(dev.interfaces[p] && dev.interfaces[p].parent)); }
  function isWirelessPort(dev, port) { return /^wlan/.test(port); }
  function linkAt(net, devId, port) { return net.links.find(l => (l.a.dev === devId && l.a.port === port) || (l.b.dev === devId && l.b.port === port)) || null; }
  function connect(net, devA, portA, devB, portB) {
    const A = net.devices[devA], B = net.devices[devB];
    if (!A || !B) return { error: 'Device not found' };
    if (devA === devB) return { error: 'Cannot connect a device to itself' };
    if (!portsOf(A).includes(portA)) return { error: 'Port ' + portA + ' does not exist on ' + A.name };
    if (!portsOf(B).includes(portB)) return { error: 'Port ' + portB + ' does not exist on ' + B.name };
    if (linkAt(net, devA, portA)) return { error: A.name + ' port ' + portA + ' is already connected' };
    if (linkAt(net, devB, portB)) return { error: B.name + ' port ' + portB + ' is already connected' };
    const wA = isWirelessPort(A, portA), wB = isWirelessPort(B, portB);
    if (wA !== wB) return { error: 'A wireless port can only associate with another wireless port (laptop wlan0 ↔ access point wlan)' };
    if (wA) {
      const ap = A.type === 'ap' ? A : (B.type === 'ap' ? B : null); const client = ap === A ? B : A;
      if (!ap) return { error: 'Wireless clients must associate with an access point' };
      const cw = client.wifi || {}, aw = ap.wifi || {};
      if (!cw.ssid || cw.ssid !== aw.ssid) return { error: 'Association failed: the client is looking for SSID "' + (cw.ssid || '(none)') + '" but the access point broadcasts "' + aw.ssid + '"' };
      if (aw.security !== 'open' && cw.psk !== aw.psk) return { error: 'Authentication failed: wrong Wi-Fi passphrase for "' + aw.ssid + '"' };
    }
    const link = { id: uid('l'), a: { dev: devA, port: portA }, b: { dev: devB, port: portB }, wireless: wA, latency: wA ? 3 : (A.type === 'internet' || B.type === 'internet' ? 18 : 0.3) };
    net.links.push(link);
    return { link };
  }
  function disconnect(net, linkId) { net.links = net.links.filter(l => l.id !== linkId); }
  function otherEnd(link, devId, port) { return (link.a.dev === devId && link.a.port === port) ? link.b : link.a; }
  function portUp(net, dev, port) {
    if (dev.interfaces[port]) return dev.interfaces[port].up !== false;
    if (dev.ports[port]) return dev.ports[port].up !== false;
    return true;
  }
  function ifaceCidr(iface) { const b = iface && iface.mask ? S().maskToCidr(iface.mask) : null; return b === null ? null : b; }
  function kindOf(dev) { return TYPES[dev.type].kind; }
  function isL3(dev) { const k = kindOf(dev); return k === 'host' || k === 'router' || k === 'internet'; }
  function ipsOf(dev) { return Object.keys(dev.interfaces || {}).filter(n => dev.interfaces[n].ip && dev.interfaces[n].up !== false).map(n => dev.interfaces[n].ip); }
  function portOfIface(dev, name) { const i = dev.interfaces[name]; return i && i.parent ? i.parent : name; }

  // ---------- Layer 2 ----------
  function l2Endpoints(net, devId, ifaceName) {
    const dev = net.devices[devId];
    const iface = dev.interfaces[ifaceName];
    const port = iface && iface.parent ? iface.parent : ifaceName;
    const startTag = iface && iface.parent ? Number(iface.vlan) : null;
    const results = []; const seen = new Set();
    const queue = [{ dev: devId, port, tag: startTag, path: [] }];
    while (queue.length) {
      const cur = queue.shift();
      const cdev = net.devices[cur.dev];
      if (!portUp(net, cdev, cur.port)) continue;
      const link = linkAt(net, cur.dev, cur.port);
      if (!link) continue;
      const far = otherEnd(link, cur.dev, cur.port);
      const key = far.dev + '|' + far.port + '|' + cur.tag;
      if (seen.has(key)) continue; seen.add(key);
      const path = cur.path.concat([{ link: link.id, from: cur.dev, to: far.dev, port: far.port }]);
      const fd = net.devices[far.dev]; if (!fd) continue;
      const kind = kindOf(fd);
      if (!portUp(net, fd, far.port)) continue;
      if (kind === 'hub') { for (const q of portsOf(fd)) if (q !== far.port) queue.push({ dev: fd.id, port: q, tag: cur.tag, path }); continue; }
      if (kind === 'switch') {
        const pin = fd.ports[far.port] || { mode: 'access', vlan: 1 };
        let vlan;
        if (pin.mode === 'trunk') { vlan = cur.tag == null ? Number(pin.native || 1) : cur.tag; if (pin.allowed && !pin.allowed.map(Number).includes(vlan)) continue; }
        else { if (cur.tag != null) continue; vlan = Number(pin.vlan || 1); }
        for (const q of portsOf(fd)) {
          if (q === far.port) continue;
          const pq = fd.ports[q] || { mode: 'access', vlan: 1 };
          if (pq.up === false) continue;
          if (pq.mode === 'trunk') { if (pq.allowed && !pq.allowed.map(Number).includes(vlan)) continue; queue.push({ dev: fd.id, port: q, tag: vlan === Number(pq.native || 1) ? null : vlan, path }); }
          else if (Number(pq.vlan || 1) === vlan) queue.push({ dev: fd.id, port: q, tag: null, path });
        }
        continue;
      }
      if (cur.tag == null) { if (fd.interfaces[far.port]) results.push({ dev: fd.id, iface: far.port, path }); }
      else { const sub = Object.keys(fd.interfaces).find(n => fd.interfaces[n].parent === far.port && Number(fd.interfaces[n].vlan) === Number(cur.tag)); if (sub) results.push({ dev: fd.id, iface: sub, path }); }
    }
    return results;
  }
  function learnPath(net, path, srcMac) {
    for (const step of path) { const d = net.devices[step.to]; if (d && kindOf(d) === 'switch' && srcMac) d.macTable[srcMac] = step.port; }
  }
  function reversePath(net, path) {
    return path.slice().reverse().map(s => { const l = net.links.find(x => x.id === s.link); const port = l ? (l.a.dev === s.from ? l.a.port : l.b.port) : undefined; return { link: s.link, from: s.to, to: s.from, port }; });
  }

  function arpResolve(net, dev, ifaceName, targetIp, ctx) {
    const iface = dev.interfaces[ifaceName];
    const eps = l2Endpoints(net, dev.id, ifaceName);
    const match = eps.find(e => { const i = net.devices[e.dev].interfaces[e.iface]; return i.up !== false && i.ip === targetIp; });
    const cached = dev.arp[targetIp];
    const fresh = match && cached && cached.mac === net.devices[match.dev].interfaces[match.iface].mac;
    if (!fresh) {
      ctx.trace.push({ kind: 'arp-req', from: dev.id, iface: ifaceName, target: targetIp, segmentPaths: eps.map(e => e.path), text: dev.name + ' broadcasts ARP: Who has ' + targetIp + '? Tell ' + (iface.ip || '0.0.0.0') });
      if (match) ctx.trace.push({ kind: 'arp-reply', from: match.dev, to: dev.id, path: reversePath(net, match.path), ip: targetIp, mac: net.devices[match.dev].interfaces[match.iface].mac, text: net.devices[match.dev].name + ' replies: ' + targetIp + ' is at ' + net.devices[match.dev].interfaces[match.iface].mac });
      else ctx.trace.push({ kind: 'drop', dev: dev.id, reason: 'No device on the ' + dev.name + ' ' + ifaceName + ' segment answered ARP for ' + targetIp + (eps.length ? '' : ' (nothing is connected to this interface)') });
    }
    if (!match) { delete dev.arp[targetIp]; return null; }
    const mi = net.devices[match.dev].interfaces[match.iface];
    dev.arp[targetIp] = { mac: mi.mac, iface: ifaceName, dev: match.dev, type: 'dynamic' };
    if (iface.ip) net.devices[match.dev].arp[iface.ip] = { mac: iface.mac, iface: match.iface, dev: dev.id, type: 'dynamic' };
    learnPath(net, match.path, iface.mac);
    learnPath(net, reversePath(net, match.path), mi.mac);
    return Object.assign({ mac: mi.mac }, match);
  }

  // ---------- Layer 3 ----------
  function lookupRoute(net, dev, dstIp) {
    const dst = S().parseIPv4(dstIp); if (dst === null) return null;
    const candidates = [];
    for (const name of Object.keys(dev.interfaces)) {
      const i = dev.interfaces[name];
      if (!i.ip || !i.mask || i.up === false) continue;
      const bits = ifaceCidr(i); if (bits === null) continue;
      if (S().sameSubnet(dstIp, i.ip, bits)) candidates.push({ iface: name, nextHop: dstIp, prefix: bits, type: 'connected', network: S().info(i.ip, bits).network });
    }
    const statics = (dev.routes || []).slice();
    if (dev.gateway && kindOf(dev) === 'host') statics.push({ dest: '0.0.0.0', mask: '0.0.0.0', via: dev.gateway, type: 'gateway' });
    for (const r of statics) {
      const bits = /^\d+$/.test(String(r.mask)) ? Number(r.mask) : S().maskToCidr(r.mask);
      if (bits === null || !S().isValidIPv4(r.dest)) continue;
      if (!S().sameSubnet(dstIp, r.dest, bits)) continue;
      let out = null;
      if (r.iface && dev.interfaces[r.iface]) out = { iface: r.iface, nextHop: r.via || dstIp };
      else if (r.via) {
        for (const name of Object.keys(dev.interfaces)) { const i = dev.interfaces[name]; if (!i.ip || !i.mask || i.up === false) continue; const b = ifaceCidr(i); if (b !== null && S().sameSubnet(r.via, i.ip, b)) { out = { iface: name, nextHop: r.via }; break; } }
      }
      if (!out) continue; // next hop not reachable (bad gateway)
      candidates.push(Object.assign(out, { prefix: bits, type: r.type || 'static', via: r.via, network: r.dest }));
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.prefix - a.prefix);
    return candidates[0];
  }
  function routeTable(net, dev) {
    const rows = [];
    for (const name of Object.keys(dev.interfaces)) { const i = dev.interfaces[name]; if (!i.ip || !i.mask || i.up === false) continue; const bits = ifaceCidr(i); if (bits === null) continue; const inf = S().info(i.ip, bits); rows.push({ code: 'C', network: inf.network, prefix: bits, mask: inf.mask, via: null, iface: name }); }
    for (const r of dev.routes || []) { const bits = /^\d+$/.test(String(r.mask)) ? Number(r.mask) : S().maskToCidr(r.mask); rows.push({ code: 'S', network: r.dest, prefix: bits, mask: S().cidrToMask(bits), via: r.via || null, iface: r.iface || null }); }
    if (dev.gateway && kindOf(dev) === 'host') rows.push({ code: 'S*', network: '0.0.0.0', prefix: 0, mask: '0.0.0.0', via: dev.gateway, iface: null });
    return rows;
  }
  function matchCidr(ip, spec) {
    if (!spec || spec === 'any') return true;
    if (spec.includes('/')) { const [n, b] = spec.split('/'); return S().sameSubnet(ip, n, Number(b)); }
    if (spec.includes(' ')) { const [n, wc] = spec.split(' '); const m = S().parseIPv4(wc); if (m === null) return false; const mask = (~m) >>> 0; return ((S().parseIPv4(ip) & mask) >>> 0) === ((S().parseIPv4(n) & mask) >>> 0); }
    return ip === spec;
  }
  function portMatch(pkt, spec) {
    if (spec == null || spec === 'any' || spec === '') return true;
    const p = pkt.dport; if (p == null) return false;
    const s = String(spec);
    if (s.includes('-')) { const [a, b] = s.split('-').map(Number); return p >= a && p <= b; }
    if (s.includes(',')) return s.split(',').map(Number).includes(p);
    return Number(s) === p;
  }
  function ruleMatches(rule, pkt) {
    if (rule.proto && rule.proto !== 'any' && rule.proto !== 'ip' && rule.proto !== pkt.proto) return false;
    if (!matchCidr(pkt.src, rule.src)) return false;
    if (!matchCidr(pkt.dst, rule.dst)) return false;
    if ((pkt.proto === 'tcp' || pkt.proto === 'udp') && !portMatch(pkt, rule.port != null ? rule.port : rule.dport)) return false;
    if (pkt.proto === 'icmp' && rule.port && rule.port !== 'any') return false;
    return true;
  }
  function aclCheck(net, dev, ifaceName, dir, pkt, ctx) {
    const iface = dev.interfaces[ifaceName]; if (!iface || !iface.acl) return true;
    const name = iface.acl[dir]; if (!name) return true;
    const acl = (dev.acls || {})[name]; if (!acl) return true;
    for (const r of acl) {
      if (ruleMatches(r, pkt)) {
        if (r.action === 'permit' || r.action === 'allow') return true;
        ctx.trace.push({ kind: 'drop', dev: dev.id, reason: dev.name + ': ACL ' + name + ' (' + dir + 'bound on ' + ifaceName + ') denied ' + describePkt(pkt) + ' by rule "' + ruleText(r) + '"' });
        return false;
      }
    }
    ctx.trace.push({ kind: 'drop', dev: dev.id, reason: dev.name + ': ACL ' + name + ' (' + dir + 'bound on ' + ifaceName + ') has no matching permit – implicit deny dropped ' + describePkt(pkt) });
    return false;
  }
  function ruleText(r) { return [r.action, r.proto || 'ip', r.src || 'any', r.dst || 'any', r.port != null && r.port !== 'any' ? 'port ' + r.port : ''].filter(Boolean).join(' '); }
  function firewallCheck(net, dev, inIface, outIface, pkt, ctx) {
    if (dev.flows && dev.flows[pkt.flow] && pkt._reply) return true; // stateful return traffic
    for (const r of dev.rules || []) {
      if (r.from && r.from !== 'any' && r.from !== inIface) continue;
      if (r.to && r.to !== 'any' && r.to !== outIface) continue;
      if (!ruleMatches(r, pkt)) continue;
      if (r.action === 'allow' || r.action === 'permit') { dev.flows[pkt.flow] = true; ctx.trace.push({ kind: 'note', text: dev.name + ' firewall allowed ' + describePkt(pkt) + ' (rule: ' + (r.desc || ruleText(r)) + ')' }); return true; }
      ctx.trace.push({ kind: 'drop', dev: dev.id, reason: dev.name + ' firewall DENIED ' + describePkt(pkt) + ' (rule: ' + (r.desc || ruleText(r)) + ')' });
      return false;
    }
    if ((dev.policy || 'deny') === 'allow') { dev.flows[pkt.flow] = true; return true; }
    ctx.trace.push({ kind: 'drop', dev: dev.id, reason: dev.name + ' firewall dropped ' + describePkt(pkt) + ': no rule matched and the default policy is DENY' });
    return false;
  }
  function describePkt(pkt) {
    if (pkt.proto === 'icmp') return 'ICMP ' + (pkt.type === 'echo' ? 'echo request' : pkt.type) + ' ' + pkt.src + ' → ' + pkt.dst;
    return pkt.proto.toUpperCase() + ' ' + pkt.src + ' → ' + pkt.dst + (pkt.dport ? ':' + pkt.dport : '');
  }
  function isLocalAddress(dev, ip) { return Object.keys(dev.interfaces).some(n => dev.interfaces[n].ip === ip && dev.interfaces[n].up !== false); }

  function sendPacket(net, devId, pkt, ctx) {
    const dev = net.devices[devId];
    if (++ctx.steps > 400) { ctx.trace.push({ kind: 'drop', dev: devId, reason: 'Packet is looping between routers – TTL exhausted' }); return { status: 'loop', at: devId }; }
    const route = lookupRoute(net, dev, pkt.dst);
    if (!route) {
      const host = kindOf(dev) === 'host';
      let why = host ? (ipsOf(dev).length ? (dev.gateway ? 'default gateway ' + dev.gateway + ' is not on any connected subnet' : 'no default gateway is configured') : 'no IP address is configured') : (kindOf(dev) === 'internet' && S().isPrivate(pkt.dst) ? 'private (RFC 1918) addresses are not routable on the public Internet. The reply has nowhere to go – configure NAT on the edge router' : 'no matching route in the routing table');
      ctx.trace.push({ kind: 'drop', dev: devId, reason: dev.name + ' cannot reach ' + pkt.dst + ': ' + why });
      if (kindOf(dev) === 'router' && pkt.src && !isLocalAddress(dev, pkt.src) && pkt._in) return sendIcmpError(net, dev, pkt._in, pkt, 'unreachable', ctx, 'no route');
      return { status: 'no-route', at: devId, reason: why };
    }
    const iface = dev.interfaces[route.iface];
    if (!pkt.src) pkt.src = iface.ip;
    if (!pkt.src) { ctx.trace.push({ kind: 'drop', dev: devId, reason: dev.name + ' interface ' + route.iface + ' has no IP address' }); return { status: 'no-ip', at: devId }; }
    if (!aclCheck(net, dev, route.iface, 'out', pkt, ctx)) return { status: 'filtered', at: devId, by: 'acl' };
    if (dev.type === 'firewall' && pkt._in && !firewallCheck(net, dev, pkt._in, route.iface, pkt, ctx)) return { status: 'filtered', at: devId, by: 'firewall' };
    // NAT: inside → outside
    if (dev.nat && dev.nat.outside === route.iface && pkt._in && pkt._in !== dev.nat.outside && (!dev.nat.inside || dev.nat.inside.includes(pkt._in) || dev.nat.inside.includes('any'))) {
      dev.nat.table = dev.nat.table || {};
      dev.nat.table[pkt.flow] = { origSrc: pkt.src, inside: pkt._in, proto: pkt.proto, dst: pkt.dst, at: Date.now() };
      ctx.trace.push({ kind: 'note', text: dev.name + ' NAT: translated source ' + pkt.src + ' → ' + iface.ip + ' (PAT overload on ' + route.iface + ')' });
      pkt.src = iface.ip; pkt._natted = true;
    }
    if (route.type !== 'connected') ctx.trace.push({ kind: 'note', text: dev.name + ' routes ' + pkt.dst + ' via ' + route.nextHop + ' out ' + route.iface + ' (' + (route.type === 'gateway' ? 'default gateway' : 'route ' + route.network + '/' + route.prefix) + ')' });
    const arp = arpResolve(net, dev, route.iface, route.nextHop, ctx);
    if (!arp) {
      if (kindOf(dev) === 'router' && pkt._in && !isLocalAddress(dev, pkt.src)) return sendIcmpError(net, dev, pkt._in, pkt, 'unreachable', ctx, 'host unreachable');
      return { status: 'arp-fail', at: devId, nextHop: route.nextHop, reason: 'no reply to ARP for ' + route.nextHop };
    }
    ctx.trace.push({ kind: 'frame', from: devId, to: arp.dev, path: arp.path, pkt: Object.assign({}, pkt), label: frameLabel(pkt), text: dev.name + ' → ' + net.devices[arp.dev].name + ': ' + describePkt(pkt) + ' (TTL ' + pkt.ttl + ')' });
    ctx.latency += arp.path.reduce((a, s) => { const l = net.links.find(x => x.id === s.link); return a + (l ? l.latency : 0.3); }, 0);
    ctx.visited.push(arp.dev);
    return receivePacket(net, arp.dev, arp.iface, pkt, ctx);
  }
  function frameLabel(pkt) {
    if (pkt.proto === 'icmp') return pkt.type === 'echo' ? 'ICMP Echo' : pkt.type === 'echo-reply' ? 'ICMP Reply' : 'ICMP ' + pkt.type;
    if (pkt.proto === 'tcp') return 'TCP ' + (pkt.flags || '').toUpperCase() + (pkt.dport ? ' :' + pkt.dport : '');
    if (pkt.proto === 'udp') return pkt.dport === 53 || pkt.sport === 53 ? 'DNS' : 'UDP :' + pkt.dport;
    return pkt.proto;
  }
  function sendIcmpError(net, dev, inIface, orig, type, ctx, note) {
    if (orig.proto === 'icmp' && orig.type !== 'echo') return { status: type, at: dev.id, delivered: false, from: dev.interfaces[inIface] ? dev.interfaces[inIface].ip : null };
    const srcIp = dev.interfaces[inIface] && dev.interfaces[inIface].ip ? dev.interfaces[inIface].ip : ipsOf(dev)[0];
    const err = { proto: 'icmp', type, src: srcIp, dst: orig.src, ttl: 64, flow: orig.flow, _reply: true, note };
    ctx.trace.push({ kind: 'note', text: dev.name + ' sends ICMP ' + (type === 'time-exceeded' ? 'Time Exceeded' : 'Destination Unreachable' + (note ? ' (' + note + ')' : '')) + ' to ' + orig.src });
    const res = sendPacket(net, dev.id, err, ctx);
    return { status: type, at: dev.id, from: srcIp, delivered: res.status === type, note };
  }
  function receivePacket(net, devId, ifaceName, pkt, ctx) {
    const dev = net.devices[devId];
    const iface = dev.interfaces[ifaceName];
    if (!aclCheck(net, dev, ifaceName, 'in', pkt, ctx)) return { status: 'filtered', at: devId, by: 'acl' };
    if (dev.nat && dev.nat.outside === ifaceName && dev.nat.table && dev.nat.table[pkt.flow] && pkt.dst === iface.ip) {
      const t = dev.nat.table[pkt.flow];
      ctx.trace.push({ kind: 'note', text: dev.name + ' NAT: translated destination ' + pkt.dst + ' → ' + t.origSrc + ' (matched translation table)' });
      pkt.dst = t.origSrc; pkt._reply = true;
    }
    if (isLocalAddress(dev, pkt.dst)) return handleLocal(net, dev, ifaceName, pkt, ctx);
    const kind = kindOf(dev);
    if (kind === 'internet') {
      // Forward if the destination is on a connected customer link; otherwise "the Internet" answers for public IPs
      const r = lookupRoute(net, dev, pkt.dst);
      if (!r || r.type !== 'connected') {
        if (S().isPublic(pkt.dst)) return handleLocal(net, dev, ifaceName, pkt, ctx, true);
        ctx.trace.push({ kind: 'drop', dev: devId, reason: 'The Internet dropped a packet to ' + pkt.dst + ': private (RFC 1918) addresses are not routable on the public Internet. Use NAT on the edge router.' });
        return { status: 'no-route', at: devId, reason: 'private address not routable on the Internet' };
      }
    } else if (kind !== 'router') {
      ctx.trace.push({ kind: 'drop', dev: devId, reason: dev.name + ' received a packet addressed to ' + pkt.dst + ' but end hosts do not forward packets' });
      return { status: 'dropped', at: devId };
    }
    pkt.ttl -= 1;
    if (pkt.ttl <= 0) return sendIcmpError(net, dev, ifaceName, pkt, 'time-exceeded', ctx);
    pkt._in = ifaceName;
    return sendPacket(net, devId, pkt, ctx);
  }
  function serviceOnPort(dev, port, proto) {
    const svcs = dev.services || {};
    for (const name of Object.keys(svcs)) {
      const s = svcs[name]; if (!s || s.enabled === false) continue;
      const p = s.port || SERVICE_PORTS[name]; if (p !== port) continue;
      const isUdp = s.proto ? s.proto === 'udp' : UDP_SERVICES.includes(name);
      if ((proto === 'udp') !== isUdp && name !== 'dns') continue;
      return Object.assign({ name }, s, { port: p });
    }
    return null;
  }
  function hostFirewallBlocks(dev, pkt) {
    const hf = dev.host && dev.host.firewall; if (!hf || hf.enabled === false) return false;
    if (pkt.proto === 'icmp') return !!hf.blockIcmp;
    if (hf.allowPorts && (pkt.proto === 'tcp' || pkt.proto === 'udp')) return !hf.allowPorts.includes(pkt.dport);
    return false;
  }
  function handleLocal(net, dev, ifaceName, pkt, ctx, asInternet) {
    const replyTtl = dev.os === 'windows' ? 128 : (kindOf(dev) === 'router' || kindOf(dev) === 'internet') ? 255 : 64;
    if (pkt.proto === 'icmp') {
      if (pkt.type === 'echo') {
        if (hostFirewallBlocks(dev, pkt)) { ctx.trace.push({ kind: 'drop', dev: dev.id, reason: dev.name + ' host firewall silently dropped the ICMP echo request (ping blocked by local firewall)' }); return { status: 'filtered', at: dev.id, by: 'host-firewall' }; }
        const reply = { proto: 'icmp', type: 'echo-reply', src: pkt.dst, dst: pkt.src, ttl: replyTtl, flow: pkt.flow, _reply: true, seq: pkt.seq };
        ctx.trace.push({ kind: 'note', text: (asInternet ? 'Internet host ' + pkt.dst : dev.name) + ' replies to echo request from ' + pkt.src });
        return sendPacket(net, dev.id, reply, ctx);
      }
      if (pkt.type === 'echo-reply') return { status: 'echo-reply', from: pkt.src, at: dev.id, ttl: pkt.ttl };
      return { status: pkt.type, from: pkt.src, at: dev.id, delivered: true, note: pkt.note };
    }
    if (pkt.proto === 'tcp') {
      if (pkt.flags === 'syn') {
        let svc = asInternet ? publicService(dev, pkt.dst, pkt.dport, 'tcp') : serviceOnPort(dev, pkt.dport, 'tcp');
        if (hostFirewallBlocks(dev, pkt)) { ctx.trace.push({ kind: 'drop', dev: dev.id, reason: dev.name + ' host firewall dropped TCP SYN to port ' + pkt.dport }); return { status: 'filtered', at: dev.id, by: 'host-firewall' }; }
        const reply = { proto: 'tcp', flags: svc ? 'syn-ack' : 'rst', src: pkt.dst, dst: pkt.src, sport: pkt.dport, dport: pkt.sport, ttl: replyTtl, flow: pkt.flow, _reply: true, service: svc ? { name: svc.name, banner: svc.banner || '', version: svc.version || '', content: svc.content || '', port: pkt.dport, headers: svc.headers || null, status: svc.status || 200, vulnerable: svc.vulnerable || null, pages: svc.pages || null } : null };
        ctx.trace.push({ kind: 'note', text: dev.name + ' port ' + pkt.dport + '/tcp is ' + (svc ? 'OPEN (' + svc.name + ') – replies SYN-ACK' : 'CLOSED – replies RST') });
        return sendPacket(net, dev.id, reply, ctx);
      }
      if (pkt.flags === 'syn-ack') return { status: 'open', from: pkt.src, at: dev.id, service: pkt.service, port: pkt.sport };
      if (pkt.flags === 'rst') return { status: 'closed', from: pkt.src, at: dev.id, port: pkt.sport };
    }
    if (pkt.proto === 'udp') {
      if (pkt.dport === 53) {
        const svc = asInternet ? (publicService(dev, pkt.dst, 53, 'udp') ? Object.assign({ name: 'dns' }, dev.services.dns) : null) : serviceOnPort(dev, 53, 'udp');
        if (!svc) { ctx.trace.push({ kind: 'drop', dev: dev.id, reason: dev.name + ' is not running a DNS service on port 53 (ICMP port unreachable)' }); return sendIcmpError(net, dev, ifaceName, pkt, 'unreachable', ctx, 'port unreachable'); }
        const ans = dnsLookup(net, dev, svc, pkt.q, ctx);
        const reply = { proto: 'udp', src: pkt.dst, dst: pkt.src, sport: 53, dport: pkt.sport, ttl: replyTtl, flow: pkt.flow, _reply: true, dns: ans };
        ctx.trace.push({ kind: 'note', text: dev.name + ' DNS answers ' + pkt.q + ': ' + (ans.rcode === 'NOERROR' ? ans.answer : ans.rcode) });
        return sendPacket(net, dev.id, reply, ctx);
      }
      if (pkt.sport === 53) return { status: 'dns-reply', from: pkt.src, at: dev.id, dns: pkt.dns };
      const svc = asInternet ? publicService(dev, pkt.dst, pkt.dport, 'udp') : serviceOnPort(dev, pkt.dport, 'udp');
      if (svc) { const reply = { proto: 'udp', src: pkt.dst, dst: pkt.src, sport: pkt.dport, dport: pkt.sport, ttl: replyTtl, flow: pkt.flow, _reply: true, service: { name: svc.name, port: pkt.dport } }; return sendPacket(net, dev.id, reply, ctx); }
      if (pkt._reply || pkt.service) return { status: 'udp-open', from: pkt.src, at: dev.id, port: pkt.sport, service: pkt.service };
      return sendIcmpError(net, dev, ifaceName, pkt, 'unreachable', ctx, 'port unreachable');
    }
    return { status: 'delivered', at: dev.id };
  }
  function publicService(internet, ip, port, proto) {
    const h = internet.publicHosts && internet.publicHosts[ip];
    if (!h) return null;
    for (const name of h.services || []) if ((SERVICE_PORTS[name] === port)) return { name, port, banner: h.banner || (name === 'http' ? 'nginx' : ''), content: name === 'http' || name === 'https' ? '<html><head><title>' + h.name + '</title></head><body><h1>' + h.name + '</h1><p>It works! You reached a public web server through the simulated Internet.</p></body></html>' : '' };
    return null;
  }
  function dnsLookup(net, dev, svc, name, ctx) {
    const q = String(name || '').toLowerCase().replace(/\.$/, '');
    const recs = (svc && svc.records) || {};
    const key = Object.keys(recs).find(k => k.toLowerCase() === q);
    if (key) return { name: q, answer: recs[key], rcode: 'NOERROR', server: dev.name, authoritative: true };
    if (svc && svc.forwarder && dev.type !== 'internet') {
      ctx.trace.push({ kind: 'note', text: dev.name + ' has no record for ' + q + ' – forwarding query to ' + svc.forwarder });
      const r = dnsQuery(net, dev.id, svc.forwarder, q, ctx);
      if (r.status === 'dns-reply') return Object.assign({}, r.dns, { server: dev.name, authoritative: false, via: svc.forwarder });
      return { name: q, answer: null, rcode: 'SERVFAIL', server: dev.name, reason: 'forwarder ' + svc.forwarder + ' did not respond (' + r.status + ')' };
    }
    return { name: q, answer: null, rcode: 'NXDOMAIN', server: dev.name, authoritative: !!(svc && svc.authoritative) };
  }
  function dnsQuery(net, devId, serverIp, name, ctx) {
    const pkt = { proto: 'udp', dst: serverIp, src: null, sport: 40000 + Math.floor(Math.random() * 20000), dport: 53, ttl: 64, flow: uid('f'), q: name };
    return sendPacket(net, devId, pkt, ctx);
  }
  function newCtx() { return { trace: [], steps: 0, latency: 0, visited: [] }; }

  // ---------- High level operations ----------
  function resolve(net, devId, name, ctx, opts) {
    ctx = ctx || newCtx(); opts = opts || {};
    const dev = net.devices[devId];
    const server = opts.server || dev.dns;
    if (S().isValidIPv4(name)) return { ok: true, ip: name, source: 'literal', ctx };
    const q = String(name).toLowerCase();
    if (q === 'localhost') return { ok: true, ip: '127.0.0.1', source: 'hosts', ctx };
    if (q === (dev.name || '').toLowerCase() || q === ((dev.host && dev.host.hostname) || '').toLowerCase()) return { ok: true, ip: ipsOf(dev)[0] || '127.0.0.1', source: 'self', ctx };
    const hosts = (dev.host && dev.host.hosts) || {};
    const hk = Object.keys(hosts).find(k => k.toLowerCase() === q); if (hk) return { ok: true, ip: hosts[hk], source: 'hosts file', ctx };
    if (!opts.server && !opts.noCache && dev.dnsCache && dev.dnsCache[q]) return { ok: true, ip: dev.dnsCache[q], source: 'cache', ctx };
    if (!server) return { ok: false, reason: 'no DNS server configured', ctx };
    const fq = (!q.includes('.') && dev.dnsSuffix) ? q + '.' + dev.dnsSuffix : q;
    let r;
    if (isLocalAddress(dev, server) || server === '127.0.0.1' || server === '127.0.0.53') {
      const svc = serviceOnPort(dev, 53, 'udp');
      if (!svc) r = { status: 'closed' };
      else { ctx.trace.push({ kind: 'note', text: dev.name + ' queries its own DNS service for ' + fq }); r = { status: 'dns-reply', dns: dnsLookup(net, dev, svc, fq, ctx) }; }
    } else r = dnsQuery(net, devId, server, fq, ctx);
    if (r.status !== 'dns-reply') return { ok: false, reason: 'DNS server ' + server + ' did not respond (' + explainStatus(r) + ')', status: r.status, ctx, server };
    if (r.dns.rcode !== 'NOERROR') return { ok: false, reason: 'DNS server ' + server + ' answered ' + r.dns.rcode + ' for ' + fq, rcode: r.dns.rcode, ctx, server, name: fq, authoritative: r.dns.authoritative };
    if (!opts.server) { dev.dnsCache = dev.dnsCache || {}; dev.dnsCache[q] = r.dns.answer; }
    return { ok: true, ip: r.dns.answer, source: 'dns', server, authoritative: r.dns.authoritative, via: r.dns.via, ctx, name: fq };
  }
  function explainStatus(r) {
    const m = { 'no-route': 'no route', 'arp-fail': 'ARP failed', filtered: 'blocked by ' + (r.by || 'a filter'), dropped: 'dropped', 'time-exceeded': 'TTL expired', unreachable: 'destination unreachable', loop: 'routing loop', 'no-ip': 'no IP address', closed: 'port closed' };
    return m[r.status] || r.status;
  }
  function ping(net, fromId, target, opts) {
    opts = opts || {};
    const dev = net.devices[fromId];
    const ctx = newCtx();
    if (!dev) return { success: false, status: 'error', reason: 'device not found', trace: [] };
    if (!isL3(dev)) return { success: false, status: 'error', reason: dev.name + ' is a Layer 2 device without an IP address – ping from a host or router', trace: [] };
    const r = resolve(net, fromId, target, ctx);
    if (!r.ok) return { success: false, status: 'dns-fail', reason: r.reason, trace: ctx.trace, target, resolved: null };
    const dstIp = r.ip;
    if (isLocalAddress(dev, dstIp) || dstIp === '127.0.0.1') return { success: true, status: 'echo-reply', target, resolved: dstIp, from: dstIp, rtt: 0.05, ttl: 128, trace: [{ kind: 'note', text: 'Loopback: ' + dev.name + ' answers its own ping internally' }], hops: [] };
    const pkt = { proto: 'icmp', type: 'echo', src: null, dst: dstIp, ttl: opts.ttl || (dev.os === 'windows' ? 128 : 64), flow: uid('f'), seq: opts.seq || 1 };
    const res = sendPacket(net, fromId, pkt, ctx);
    const success = res.status === 'echo-reply';
    return { success, status: res.status, target, resolved: dstIp, from: res.from || null, at: res.at, reason: success ? null : reasonFor(net, res, ctx), rtt: Math.round(ctx.latency * 2 * 100) / 100, ttl: res.ttl, trace: ctx.trace, hops: ctx.visited, delivered: res.delivered, note: res.note, dns: r.source === 'dns' ? r : null };
  }
  function reasonFor(net, res, ctx) {
    const drops = ctx.trace.filter(t => t.kind === 'drop');
    if (drops.length) return drops[drops.length - 1].reason;
    if (res.status === 'time-exceeded') return 'TTL expired in transit at ' + (res.from || '?');
    if (res.status === 'unreachable') return 'ICMP destination unreachable from ' + (res.from || '?') + (res.note ? ' (' + res.note + ')' : '');
    if (res.reason) return res.reason;
    return explainStatus(res);
  }
  function traceroute(net, fromId, target, opts) {
    opts = opts || {};
    const dev = net.devices[fromId];
    const out = { target, hops: [], success: false, reason: null, resolved: null, trace: [] };
    if (!dev || !isL3(dev)) { out.reason = 'not a Layer 3 device'; return out; }
    const r = resolve(net, fromId, target);
    if (!r.ok) { out.reason = r.reason; out.status = 'dns-fail'; return out; }
    out.resolved = r.ip;
    let consecutiveTimeouts = 0;
    for (let ttl = 1; ttl <= (opts.maxHops || 30); ttl++) {
      const res = ping(net, fromId, r.ip, { ttl });
      out.trace = out.trace.concat(res.trace);
      if (res.status === 'echo-reply') { out.hops.push({ ttl, ip: res.from, rtt: res.rtt, name: reverseName(net, res.from) }); out.success = true; break; }
      if (res.status === 'time-exceeded' && res.delivered !== false) { out.hops.push({ ttl, ip: res.from, rtt: res.rtt, name: reverseName(net, res.from) }); consecutiveTimeouts = 0; continue; }
      if (ttl === 1 && (res.status === 'no-route' || res.status === 'arp-fail' || res.status === 'no-ip')) { out.reason = res.reason; out.status = res.status; break; }
      out.hops.push({ ttl, ip: null, timeout: true, reason: res.reason });
      if (++consecutiveTimeouts >= 3) { out.reason = res.reason; out.status = res.status; break; }
    }
    return out;
  }
  function reverseName(net, ip) {
    if (!ip) return null;
    for (const id of Object.keys(net.devices)) { const d = net.devices[id]; for (const n of Object.keys(d.interfaces || {})) if (d.interfaces[n].ip === ip) return d.host && d.host.hostname ? d.host.hostname : d.name; if (d.publicHosts && d.publicHosts[ip]) return d.publicHosts[ip].name; }
    return null;
  }
  function tcpConnect(net, fromId, target, port, opts) {
    const ctx = newCtx();
    const dev = net.devices[fromId];
    const r = resolve(net, fromId, target, ctx);
    if (!r.ok) return { status: 'dns-fail', reason: r.reason, trace: ctx.trace };
    if (isLocalAddress(dev, r.ip) || r.ip === '127.0.0.1') {
      const svc = serviceOnPort(dev, Number(port), 'tcp');
      const blocked = svc && hostFirewallBlocks(dev, { proto: 'tcp', dport: Number(port) }) && r.ip !== '127.0.0.1';
      return { status: blocked ? 'filtered' : (svc ? 'open' : 'closed'), ip: r.ip, port: Number(port), service: svc ? { name: svc.name, banner: svc.banner || '', version: svc.version || '', content: svc.content || '', port: Number(port), headers: svc.headers || null, status: svc.status || 200, pages: svc.pages || null } : null, reason: svc ? null : 'connection refused (no service listening locally)', trace: ctx.trace, rtt: 0.05 };
    }
    const pkt = { proto: 'tcp', flags: 'syn', src: null, dst: r.ip, sport: 49152 + Math.floor(Math.random() * 10000), dport: Number(port), ttl: dev.os === 'windows' ? 128 : 64, flow: uid('f') };
    const res = sendPacket(net, fromId, pkt, ctx);
    const status = res.status === 'open' ? 'open' : res.status === 'closed' ? 'closed' : (res.status === 'filtered' || res.status === 'dropped' ? 'filtered' : res.status);
    return { status, ip: r.ip, port: Number(port), service: res.service || null, reason: status === 'open' ? null : reasonFor(net, res, ctx), trace: ctx.trace, rtt: Math.round(ctx.latency * 2 * 100) / 100 };
  }
  function udpProbe(net, fromId, target, port) {
    const ctx = newCtx();
    const r = resolve(net, fromId, target, ctx);
    if (!r.ok) return { status: 'dns-fail', reason: r.reason };
    const pkt = { proto: 'udp', src: null, dst: r.ip, sport: 50000, dport: Number(port), ttl: 64, flow: uid('f') };
    const res = sendPacket(net, fromId, pkt, ctx);
    if (res.status === 'udp-open') return { status: 'open', service: res.service };
    if (res.status === 'unreachable' && res.note === 'port unreachable') return { status: 'closed' };
    return { status: 'open|filtered', reason: reasonFor(net, res, ctx) };
  }
  function portScan(net, fromId, target, ports, opts) {
    opts = opts || {};
    const r = resolve(net, fromId, target);
    if (!r.ok) return { error: r.reason };
    const up = ping(net, fromId, r.ip).success;
    if (!up && !opts.skipPing) return { ip: r.ip, up: false, results: [] };
    const results = [];
    for (const p of ports) {
      const c = tcpConnect(net, fromId, r.ip, p);
      results.push({ port: p, state: c.status === 'open' ? 'open' : c.status === 'closed' ? 'closed' : 'filtered', service: c.service ? c.service.name : (serviceNameForPort(p) || 'unknown'), banner: c.service ? (c.service.banner || '') : '', version: c.service ? (c.service.version || '') : '', vulnerable: c.service ? c.service.vulnerable : null });
    }
    return { ip: r.ip, up: true, results, name: reverseName(net, r.ip) };
  }
  function serviceNameForPort(p) { return Object.keys(SERVICE_PORTS).find(k => SERVICE_PORTS[k] === p) || null; }
  function dhcpRequest(net, devId, ifaceName) {
    const dev = net.devices[devId];
    const iface = dev.interfaces[ifaceName];
    const log = [];
    if (!iface) return { ok: false, reason: 'no such interface', log };
    log.push(dev.name + ' broadcasts DHCP DISCOVER on ' + ifaceName);
    const eps = l2Endpoints(net, devId, ifaceName);
    const offers = [];
    for (const e of eps) {
      const d = net.devices[e.dev]; const svc = d.services && d.services.dhcp;
      if (!svc || svc.enabled === false) continue;
      const sif = d.interfaces[e.iface];
      for (const pool of svc.pools || []) {
        if (!sif.ip || !S().sameSubnet(sif.ip, pool.network, pool.mask)) continue;
        offers.push({ server: d, pool, latency: svc.latency != null ? svc.latency : 10, serverIp: sif.ip });
      }
    }
    if (!offers.length) {
      const apipa = '169.254.' + (100 + (net.macCounter % 100)) + '.' + (10 + (Object.keys(net.devices).indexOf(devId) % 200));
      iface.ip = apipa; iface.mask = '255.255.0.0'; dev.gateway = ''; dev.dns = ''; iface.dhcpServer = null; iface.lease = null;
      log.push('No DHCP OFFER received after 4 attempts');
      log.push('Assigned automatic private address (APIPA) ' + apipa + '/16 – limited connectivity');
      return { ok: false, reason: 'No DHCP server responded; the host assigned an APIPA address ' + apipa, ip: apipa, log };
    }
    offers.sort((a, b) => a.latency - b.latency);
    const w = offers[0];
    if (offers.length > 1) log.push('Received ' + offers.length + ' DHCP OFFERs; accepting the first one from ' + w.serverIp + ' (' + w.server.name + ')');
    else log.push('DHCP OFFER from ' + w.serverIp + ' (' + w.server.name + ')');
    const used = new Set();
    for (const id of Object.keys(net.devices)) for (const n of Object.keys(net.devices[id].interfaces || {})) { const i = net.devices[id].interfaces[n]; if (i.ip && !(id === devId && n === ifaceName)) used.add(i.ip); }
    for (const x of w.pool.excluded || []) used.add(x);
    const exRanges = (w.server.services.dhcp.excludedRanges || []).concat(w.pool.excludedRanges || []);
    const isExcluded = ip => exRanges.some(r => { const n = S().parseIPv4(ip), lo = S().parseIPv4(r[0]), hi = S().parseIPv4(r[1] || r[0]); return n >= lo && n <= hi; });
    w.server.services.dhcp.leases = w.server.services.dhcp.leases || {};
    const leases = w.server.services.dhcp.leases;
    for (const mac of Object.keys(leases)) if (mac !== iface.mac) used.add(leases[mac].ip);
    let ip = null;
    if (leases[iface.mac] && !used.has(leases[iface.mac].ip)) ip = leases[iface.mac].ip;
    else { const start = S().parseIPv4(w.pool.start), end = S().parseIPv4(w.pool.end); for (let n = start; n <= end; n++) { const cand = S().intToIp(n); if (!used.has(cand) && !isExcluded(cand)) { ip = cand; break; } } }
    if (!ip) { log.push('DHCP pool exhausted on ' + w.server.name); return { ok: false, reason: 'DHCP pool on ' + w.server.name + ' has no free addresses', log }; }
    leases[iface.mac] = { ip, host: dev.name, at: Date.now() };
    iface.ip = ip; iface.mask = w.pool.mask; dev.gateway = w.pool.gateway || ''; dev.dns = w.pool.dns || ''; dev.dnsSuffix = w.pool.domain || dev.dnsSuffix; iface.dhcpServer = w.serverIp; iface.lease = { hours: w.pool.lease || 24, at: Date.now() };
    log.push('DHCP REQUEST ' + ip + ' → DHCP ACK: ' + ip + ' ' + w.pool.mask + ' gw ' + (w.pool.gateway || 'none') + ' dns ' + (w.pool.dns || 'none'));
    return { ok: true, ip, mask: w.pool.mask, gateway: dev.gateway, dns: dev.dns, server: w.serverIp, serverName: w.server.name, log, rogue: !!w.server.services.dhcp.rogue };
  }
  function renewAllDhcp(net) {
    const out = [];
    for (const id of Object.keys(net.devices)) { const d = net.devices[id]; for (const n of Object.keys(d.interfaces || {})) if (d.interfaces[n].mode === 'dhcp' && linkAt(net, id, n)) out.push({ dev: id, iface: n, result: dhcpRequest(net, id, n) }); }
    return out;
  }

  // ---------- Diagnostics ----------
  function diagnose(net) {
    const issues = [];
    const devs = Object.values(net.devices);
    const ipOwners = {};
    for (const d of devs) {
      const kind = kindOf(d);
      const connected = net.links.some(l => l.a.dev === d.id || l.b.dev === d.id);
      if (!connected && kind !== 'internet') issues.push({ sev: 'warn', dev: d.id, msg: d.name + ' is not connected to anything' });
      for (const n of Object.keys(d.interfaces || {})) {
        const i = d.interfaces[n];
        const hasLink = !!linkAt(net, d.id, portOfIface(d, n));
        if (i.ip) {
          if (!S().isValidIPv4(i.ip)) issues.push({ sev: 'error', dev: d.id, msg: d.name + ' ' + n + ': "' + i.ip + '" is not a valid IPv4 address' });
          else {
            if (!i.mask || S().maskToCidr(i.mask) === null) issues.push({ sev: 'error', dev: d.id, msg: d.name + ' ' + n + ': subnet mask "' + (i.mask || '') + '" is invalid' });
            else { const inf = S().info(i.ip, i.mask); if (inf.isNetworkAddress) issues.push({ sev: 'error', dev: d.id, msg: d.name + ' ' + n + ': ' + i.ip + ' is the network address of ' + inf.network + '/' + inf.cidr + ' and cannot be assigned to a host' }); if (inf.isBroadcastAddress) issues.push({ sev: 'error', dev: d.id, msg: d.name + ' ' + n + ': ' + i.ip + ' is the broadcast address of ' + inf.network + '/' + inf.cidr }); }
            (ipOwners[i.ip] = ipOwners[i.ip] || []).push(d.name + ' ' + n);
          }
          if (i.up === false) issues.push({ sev: 'error', dev: d.id, msg: d.name + ' ' + n + ' is administratively down (shutdown)' });
          if (!hasLink && kind !== 'internet' && !i.parent) issues.push({ sev: 'warn', dev: d.id, msg: d.name + ' ' + n + ' has an IP address but no cable is connected' });
        } else if (hasLink && !i.parent && kind !== 'internet') {
          if (i.mode === 'dhcp') issues.push({ sev: 'info', dev: d.id, msg: d.name + ' ' + n + ' is set to DHCP but has no address yet – run a DHCP renew' });
          else issues.push({ sev: 'warn', dev: d.id, msg: d.name + ' ' + n + ' is connected but has no IP address' });
        }
      }
      if (kind === 'host') {
        const ifs = Object.keys(d.interfaces).filter(n => d.interfaces[n].ip);
        if (d.gateway) {
          if (!S().isValidIPv4(d.gateway)) issues.push({ sev: 'error', dev: d.id, msg: d.name + ': default gateway "' + d.gateway + '" is not a valid address' });
          else {
            const onLocal = ifs.some(n => d.interfaces[n].mask && S().sameSubnet(d.gateway, d.interfaces[n].ip, d.interfaces[n].mask));
            if (!onLocal) issues.push({ sev: 'error', dev: d.id, msg: d.name + ': default gateway ' + d.gateway + ' is not in the same subnet as its IP address' + (ifs.length ? ' (' + ifs.map(n => d.interfaces[n].ip + '/' + S().maskToCidr(d.interfaces[n].mask)).join(', ') + ')' : '') });
            else if (ifs.length) {
              const eps = l2Endpoints(net, d.id, ifs[0]);
              const gwExists = eps.some(e => net.devices[e.dev].interfaces[e.iface].ip === d.gateway);
              if (!gwExists) issues.push({ sev: 'error', dev: d.id, msg: d.name + ': no device on the local segment owns the gateway address ' + d.gateway });
              else if (d.gateway === d.interfaces[ifs[0]].ip) issues.push({ sev: 'error', dev: d.id, msg: d.name + ': the default gateway cannot be the host\'s own address' });
            }
          }
        } else if (ifs.length && devs.some(x => kindOf(x) === 'router')) issues.push({ sev: 'warn', dev: d.id, msg: d.name + ' has no default gateway – it can only reach its own subnet' });
        if (d.dns && !S().isValidIPv4(d.dns)) issues.push({ sev: 'error', dev: d.id, msg: d.name + ': DNS server "' + d.dns + '" is not a valid address' });
        if (ifs.length) {
          const eps = l2Endpoints(net, d.id, ifs[0]);
          for (const e of eps) {
            const o = net.devices[e.dev]; const oi = o.interfaces[e.iface];
            if (kindOf(o) === 'host' && oi.ip && oi.mask && d.interfaces[ifs[0]].mask) {
              const a = S().info(d.interfaces[ifs[0]].ip, d.interfaces[ifs[0]].mask), b = S().info(oi.ip, oi.mask);
              if (a && b && a.network === b.network && a.cidr !== b.cidr) issues.push({ sev: 'warn', dev: d.id, msg: d.name + ' (/' + a.cidr + ') and ' + o.name + ' (/' + b.cidr + ') share a segment but use different subnet masks' });
            }
          }
        }
      }
      if (kind === 'router') {
        const nets = Object.keys(d.interfaces).filter(n => d.interfaces[n].ip && d.interfaces[n].mask).map(n => ({ n, inf: S().info(d.interfaces[n].ip, d.interfaces[n].mask) }));
        for (let a = 0; a < nets.length; a++) for (let b = a + 1; b < nets.length; b++) if (nets[a].inf && nets[b].inf && nets[a].inf.network === nets[b].inf.network) issues.push({ sev: 'error', dev: d.id, msg: d.name + ': interfaces ' + nets[a].n + ' and ' + nets[b].n + ' overlap (both in ' + nets[a].inf.network + '/' + nets[a].inf.cidr + ')' });
        for (const r of d.routes || []) { if (!lookupRouteVia(d, r)) issues.push({ sev: 'error', dev: d.id, msg: d.name + ': static route to ' + r.dest + ' via ' + r.via + ' – next hop is not on a connected subnet' }); }
      }
    }
    for (const ip of Object.keys(ipOwners)) if (ipOwners[ip].length > 1) issues.push({ sev: 'error', msg: 'Duplicate IP address ' + ip + ' on ' + ipOwners[ip].join(' and ') });
    // VLAN mismatch: hosts in the same subnet but isolated at L2
    const hosts = devs.filter(d => kindOf(d) === 'host');
    for (let a = 0; a < hosts.length; a++) for (let b = a + 1; b < hosts.length; b++) {
      const ha = hosts[a], hb = hosts[b];
      const ia = Object.keys(ha.interfaces).find(n => ha.interfaces[n].ip && ha.interfaces[n].mask), ib = Object.keys(hb.interfaces).find(n => hb.interfaces[n].ip && hb.interfaces[n].mask);
      if (!ia || !ib) continue;
      if (!S().sameSubnet(ha.interfaces[ia].ip, hb.interfaces[ib].ip, ha.interfaces[ia].mask)) continue;
      const linked = net.links.some(l => l.a.dev === ha.id || l.b.dev === ha.id) && net.links.some(l => l.a.dev === hb.id || l.b.dev === hb.id);
      if (!linked) continue;
      const eps = l2Endpoints(net, ha.id, ia);
      if (!eps.some(e => e.dev === hb.id)) {
        const sw = devs.filter(d => kindOf(d) === 'switch');
        const vlanIssue = sw.some(s => { const pa = net.links.find(l => (l.a.dev === ha.id && l.b.dev === s.id) || (l.b.dev === ha.id && l.a.dev === s.id)); const pb = net.links.find(l => (l.a.dev === hb.id && l.b.dev === s.id) || (l.b.dev === hb.id && l.a.dev === s.id)); if (!pa || !pb) return false; const qa = s.ports[otherEnd(pa, ha.id, Object.keys(ha.interfaces)[0]).port], qb = s.ports[otherEnd(pb, hb.id, Object.keys(hb.interfaces)[0]).port]; return qa && qb && qa.vlan !== qb.vlan; });
        issues.push({ sev: 'warn', msg: ha.name + ' and ' + hb.name + ' are in the same subnet but are not on the same Layer 2 segment' + (vlanIssue ? ' – their switch ports are in different VLANs' : '') });
      }
    }
    return issues;
  }
  function lookupRouteVia(dev, r) { if (r.iface && dev.interfaces[r.iface]) return true; if (!r.via || !S().isValidIPv4(r.via)) return false; return Object.keys(dev.interfaces).some(n => { const i = dev.interfaces[n]; return i.ip && i.mask && S().sameSubnet(r.via, i.ip, i.mask); }); }

  // ---------- Config helpers ----------
  function setInterface(net, devId, name, cfg) {
    const dev = net.devices[devId]; if (!dev) return { error: 'device not found' };
    const i = dev.interfaces[name]; if (!i) return { error: 'interface not found' };
    if (cfg.ip !== undefined) {
      let ip = String(cfg.ip || '').trim();
      if (ip.includes('/')) { const [a, b] = ip.split('/'); ip = a; cfg.mask = S().cidrToMask(Number(b)); }
      if (ip && !S().isValidIPv4(ip)) return { error: '"' + ip + '" is not a valid IPv4 address' };
      i.ip = ip;
    }
    if (cfg.mask !== undefined) {
      let m = String(cfg.mask || '').trim();
      if (/^\/?\d{1,2}$/.test(m)) m = S().cidrToMask(Number(m.replace('/', '')));
      if (m && !S().isValidMask(m)) return { error: '"' + cfg.mask + '" is not a valid subnet mask' };
      i.mask = m;
    }
    if (cfg.up !== undefined) i.up = !!cfg.up;
    if (cfg.mode !== undefined) i.mode = cfg.mode;
    if (cfg.description !== undefined) i.description = cfg.description;
    dev.arp = {}; dev.dnsCache = {};
    return { ok: true };
  }
  function addSubInterface(net, devId, parent, vlan) {
    const dev = net.devices[devId]; const name = parent + '.' + vlan;
    if (!dev.interfaces[parent]) return { error: 'parent interface not found' };
    if (!dev.interfaces[name]) dev.interfaces[name] = { ip: '', mask: '', up: true, mac: dev.interfaces[parent].mac, mode: 'static', parent, vlan: Number(vlan), acl: { in: null, out: null }, description: '' };
    return { ok: true, name };
  }
  function removeSubInterface(net, devId, name) { const dev = net.devices[devId]; if (dev.interfaces[name] && dev.interfaces[name].parent) delete dev.interfaces[name]; }
  function addRoute(net, devId, dest, mask, via, iface) {
    const dev = net.devices[devId];
    let d = dest, m = mask;
    if (String(dest).includes('/')) { const [a, b] = dest.split('/'); d = a; m = S().cidrToMask(Number(b)); }
    if (/^\d{1,2}$/.test(String(m))) m = S().cidrToMask(Number(m));
    if (!S().isValidIPv4(d) || !S().isValidMask(m)) return { error: 'invalid destination network or mask' };
    if (via && !S().isValidIPv4(via)) return { error: 'invalid next hop address' };
    if (!via && !iface) return { error: 'a route needs a next-hop address or an exit interface' };
    dev.routes = dev.routes || [];
    dev.routes = dev.routes.filter(r => !(r.dest === d && r.mask === m));
    dev.routes.push({ dest: S().info(d, m).network, mask: m, via: via || null, iface: iface || null, type: 'static' });
    return { ok: true };
  }
  function removeRoute(net, devId, dest, mask) { const dev = net.devices[devId]; dev.routes = (dev.routes || []).filter(r => !(r.dest === dest && (!mask || r.mask === mask))); }

  function serialize(net) { return JSON.stringify(net); }
  function deserialize(json) { return typeof json === 'string' ? JSON.parse(json) : JSON.parse(JSON.stringify(json)); }
  function clone(net) { return JSON.parse(JSON.stringify(net)); }

  // Build a network from a compact scenario description
  function build(def) {
    const net = createNetwork();
    for (const d of def.devices || []) addDevice(net, d.type, d);
    for (const l of def.links || []) { const r = connect(net, l[0], l[1], l[2], l[3]); if (r.error) throw new Error('Scenario link error: ' + r.error); if (l[4] && r.link) r.link.up = l[4].up; }
    for (const d of def.devices || []) if (d.dhcp) renewAllDhcp(net);
    return net;
  }
  function findByName(net, name) { return Object.values(net.devices).find(d => d.name === name) || null; }
  function summary(net) { return Object.values(net.devices).map(d => d.name + ' (' + TYPES[d.type].label + '): ' + Object.keys(d.interfaces || {}).filter(n => d.interfaces[n].ip).map(n => n + '=' + d.interfaces[n].ip + '/' + S().maskToCidr(d.interfaces[n].mask)).join(', ')).join('\n'); }

  NSA.netsim = { TYPES, SERVICE_PORTS, PUBLIC_DNS, createNetwork, addDevice, removeDevice, connect, disconnect, linkAt, portsOf, portUp, kindOf, isL3, ipsOf, l2Endpoints, lookupRoute, routeTable, ping, traceroute, resolve, tcpConnect, udpProbe, portScan, dhcpRequest, renewAllDhcp, diagnose, setInterface, addSubInterface, removeSubInterface, addRoute, removeRoute, serialize, deserialize, clone, build, findByName, summary, serviceOnPort, serviceNameForPort, reverseName, describePkt, ruleText, otherEnd };
})(typeof globalThis !== 'undefined' ? globalThis : window);
