/* NetSec Academy – Cisco IOS-style CLI for simulated routers and switches.
 * Supports user/privileged/global/interface/subinterface/vlan/dhcp/acl modes with command
 * abbreviation, context help (?), and show commands generated from live simulator state.
 */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  const S = () => NSA.subnet;
  const N = () => NSA.netsim;

  const SVC_PORTS = { www: 80, http: 80, https: 443, ftp: 21, 'ftp-data': 20, ssh: 22, telnet: 23, smtp: 25, domain: 53, dns: 53, pop3: 110, ntp: 123, snmp: 161, bootps: 67, bootpc: 68, tftp: 69, rdp: 3389 };

  function longName(short) {
    if (/^G/i.test(short)) return 'GigabitEthernet' + short.slice(1);
    if (/^Fa/i.test(short)) return 'FastEthernet' + short.slice(2);
    return short;
  }
  function normIface(dev, token, token2) {
    if (!token) return null;
    let t = (token + (token2 && /^\d/.test(token2) ? token2 : '')).toLowerCase().replace(/\s+/g, '');
    let m = t.match(/^(gigabitethernet|gigabit|gig|gi|g)(\d+\/\d+(?:\.\d+)?)$/); if (m) t = 'G' + m[2];
    m = t.match(/^(fastethernet|fast|fa|f)(\d+\/\d+(?:\.\d+)?)$/); if (m) t = 'Fa' + m[2];
    m = t.match(/^(ethernet|eth|e)(\d+\/\d+)$/); if (m) t = 'Fa' + m[2];
    const names = Object.keys(dev.interfaces || {}).concat(Object.keys(dev.ports || {}));
    const hit = names.find(n => n.toLowerCase() === t.toLowerCase());
    if (hit) return hit;
    // sub-interface on a router that does not exist yet
    const sub = t.match(/^(G|Fa)(\d+\/\d+)\.(\d+)$/);
    if (sub && dev.interfaces && dev.interfaces[sub[1] + sub[2]]) return sub[1] + sub[2] + '.' + sub[3];
    return null;
  }
  function parseRange(dev, tokens) {
    // "range fa0/1 - 4" or "range fa0/1-4" or "range fa0/1 , fa0/3"
    const joined = tokens.join(' ').replace(/\s*-\s*/g, '-').replace(/\s*,\s*/g, ',');
    const out = [];
    for (const part of joined.split(',')) {
      const m = part.match(/^([A-Za-z]+)(\d+)\/(\d+)-(\d+)$/);
      if (m) { for (let i = Number(m[3]); i <= Number(m[4]); i++) { const n = normIface(dev, m[1] + m[2] + '/' + i); if (n) out.push(n); } }
      else { const n = normIface(dev, part); if (n) out.push(n); }
    }
    return out;
  }
  function parseAclTarget(tokens, i) {
    // returns { spec, next }
    const t = tokens[i];
    if (!t) return null;
    if (t.toLowerCase() === 'any') return { spec: 'any', next: i + 1 };
    if (t.toLowerCase() === 'host') { if (!S().isValidIPv4(tokens[i + 1] || '')) return null; return { spec: tokens[i + 1], next: i + 2 }; }
    if (S().isValidIPv4(t)) {
      if (tokens[i + 1] && S().isValidIPv4(tokens[i + 1]) && !/^eq|^gt|^lt|^range/i.test(tokens[i + 1])) { const wc = tokens[i + 1]; return { spec: wc === '0.0.0.0' ? t : t + ' ' + wc, next: i + 2 }; }
      return { spec: t, next: i + 1 };
    }
    return null;
  }
  function portNum(tok) { if (/^\d+$/.test(tok)) return Number(tok); return SVC_PORTS[String(tok).toLowerCase()] || null; }
  function iosMac(mac) { const h = mac.replace(/:/g, ''); return h.slice(0, 4) + '.' + h.slice(4, 8) + '.' + h.slice(8, 12); }
  function padR(s, n) { s = String(s == null ? '' : s); while (s.length < n) s += ' '; return s; }
  function ifaceStatus(net, dev, name) {
    const i = dev.interfaces ? dev.interfaces[name] : null; const p = dev.ports ? dev.ports[name] : null;
    const adminUp = i ? i.up !== false : (p ? p.up !== false : true);
    const phys = i && i.parent ? i.parent : name;
    const link = N().linkAt(net, dev.id, phys);
    const parentUp = i && i.parent ? dev.interfaces[i.parent].up !== false : true;
    if (!adminUp) return ['administratively down', 'down'];
    if (!link || !parentUp) return ['down', 'down'];
    return ['up', 'up'];
  }

  function createCli(opts) {
    const net = opts.net; const dev = net.devices[opts.devId];
    const isSwitch = N().kindOf(dev) === 'switch';
    const cli = { net, dev, mode: 'user', iface: null, ifaces: [], vlan: null, pool: null, acl: null, aclType: null, hostname: () => dev.name, history: [], changed: false, enableSecret: dev.enableSecret || null };
    dev.vlans = dev.vlans || { 1: 'default' };
    dev.acls = dev.acls || {};
    dev.routes = dev.routes || [];

    cli.prompt = function () {
      const h = dev.name;
      switch (cli.mode) {
        case 'user': return h + '>';
        case 'priv': return h + '#';
        case 'config': return h + '(config)#';
        case 'if': return h + (cli.ifaces.length > 1 ? '(config-if-range)#' : (cli.iface && cli.iface.includes('.') ? '(config-subif)#' : '(config-if)#'));
        case 'vlan': return h + '(config-vlan)#';
        case 'dhcp': return h + '(dhcp-config)#';
        case 'acl': return h + (cli.aclType === 'standard' ? '(config-std-nacl)#' : '(config-ext-nacl)#');
        case 'line': return h + '(config-line)#';
        default: return h + '#';
      }
    };

    const INVALID = '% Invalid input detected at \'^\' marker.';
    const INCOMPLETE = '% Incomplete command.';

    function matchWords(tokens, words) {
      if (tokens.length < words.length) return false;
      for (let i = 0; i < words.length; i++) { const t = tokens[i].toLowerCase(); if (!words[i].startsWith(t)) return false; }
      return true;
    }
    function dispatch(tokens, table) {
      // choose the spec with the longest keyword match
      let best = null, bestLen = -1, ambiguous = false;
      for (const spec of table) {
        if (matchWords(tokens, spec.words)) {
          if (spec.words.length > bestLen) { best = spec; bestLen = spec.words.length; ambiguous = false; }
          else if (spec.words.length === bestLen && spec !== best) ambiguous = true;
        }
      }
      if (!best) return null;
      if (ambiguous) return { ambiguous: true };
      return { spec: best, args: tokens.slice(best.words.length) };
    }
    function help(table, tokens) {
      const prefix = tokens.filter(t => t !== '?');
      const seen = new Set(); const lines = [];
      for (const spec of table) {
        if (prefix.length && !matchWords(prefix, spec.words.slice(0, prefix.length)) && !(prefix.length <= spec.words.length && prefix.every((p, i) => spec.words[i].startsWith(p.toLowerCase())))) continue;
        const w = spec.words[prefix.length];
        if (!w) { if (spec.argHelp) lines.push('  ' + padR(spec.argHelp, 22)); continue; }
        if (seen.has(w)) continue; seen.add(w);
        lines.push('  ' + padR(w, 22) + (spec.help && spec.words.length === prefix.length + 1 ? spec.help : ''));
      }
      return lines.length ? lines.sort().join('\n') : INVALID;
    }

    // ---------- show commands ----------
    function showIpIntBrief() {
      const rows = ['Interface                  IP-Address      OK? Method Status                Protocol'];
      const names = Object.keys(dev.interfaces || {});
      for (const n of names) {
        const i = dev.interfaces[n]; const [st, pr] = ifaceStatus(net, dev, n);
        rows.push(padR(longName(n), 27) + padR(i.ip || 'unassigned', 16) + 'YES ' + padR(i.ip ? (i.mode === 'dhcp' ? 'DHCP' : 'manual') : 'unset', 7) + padR(st, 22) + pr);
      }
      if (isSwitch) { rows.push(padR('Vlan1', 27) + padR(dev.mgmtIp || 'unassigned', 16) + 'YES ' + padR(dev.mgmtIp ? 'manual' : 'unset', 7) + padR('up', 22) + 'up'); for (const p of Object.keys(dev.ports)) { const [st, pr] = ifaceStatus(net, dev, p); rows.push(padR(longName(p), 27) + padR('unassigned', 16) + 'YES ' + padR('unset', 7) + padR(st, 22) + pr); } }
      return rows.join('\n');
    }
    function showIpRoute() {
      const out = ['Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP', '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area', '       * - candidate default, U - per-user static route', ''];
      const def = (dev.routes || []).find(r => r.dest === '0.0.0.0');
      out.push(def ? 'Gateway of last resort is ' + (def.via || '0.0.0.0') + ' to network 0.0.0.0' : 'Gateway of last resort is not set');
      out.push('');
      const rows = N().routeTable(net, dev).filter(r => !(isSwitch));
      for (const r of rows.sort((a, b) => S().parseIPv4(a.network) - S().parseIPv4(b.network))) {
        if (r.code === 'C') { out.push('C        ' + r.network + '/' + r.prefix + ' is directly connected, ' + longName(r.iface)); const i = dev.interfaces[r.iface]; out.push('L        ' + i.ip + '/32 is directly connected, ' + longName(r.iface)); }
        else if (r.network === '0.0.0.0') out.push('S*    0.0.0.0/0 [1/0] via ' + (r.via || 'directly connected, ' + longName(r.iface)));
        else out.push('S        ' + r.network + '/' + r.prefix + ' [1/0] via ' + (r.via || 'directly connected, ' + longName(r.iface)));
      }
      if (!rows.length) out.push('(no routes – configure IP addresses on interfaces)');
      return out.join('\n');
    }
    function showRun() {
      const L = ['Building configuration...', '', 'Current configuration : ' + (800 + Object.keys(dev.interfaces || dev.ports).length * 60) + ' bytes', '!', 'version 15.2', 'service timestamps debug datetime msec', 'service timestamps log datetime msec', (dev.enableSecret ? 'enable secret 5 $1$mERr$' + btoaSafe(dev.enableSecret) : 'no service password-encryption'), '!', 'hostname ' + dev.name, '!'];
      if (isSwitch) {
        for (const v of Object.keys(dev.vlans).filter(v => Number(v) !== 1)) L.push('vlan ' + v, ' name ' + dev.vlans[v], '!');
        for (const p of Object.keys(dev.ports)) {
          const c = dev.ports[p]; L.push('interface ' + longName(p));
          if (c.description) L.push(' description ' + c.description);
          if (c.mode === 'trunk') { L.push(' switchport mode trunk'); if (c.allowed) L.push(' switchport trunk allowed vlan ' + c.allowed.join(',')); if (c.native && c.native !== 1) L.push(' switchport trunk native vlan ' + c.native); }
          else { if (c.vlan && c.vlan !== 1) L.push(' switchport access vlan ' + c.vlan); L.push(' switchport mode access'); }
          if (c.up === false) L.push(' shutdown');
          L.push('!');
        }
        L.push('interface Vlan1', dev.mgmtIp ? ' ip address ' + dev.mgmtIp + ' ' + (dev.mgmtMask || '255.255.255.0') : ' no ip address', '!');
        if (dev.gateway) L.push('ip default-gateway ' + dev.gateway, '!');
      } else {
        const names = Object.keys(dev.interfaces);
        for (const n of names) {
          const i = dev.interfaces[n]; L.push('interface ' + longName(n));
          if (i.description) L.push(' description ' + i.description);
          if (i.parent) L.push(' encapsulation dot1Q ' + i.vlan + (i.native ? ' native' : ''));
          L.push(i.ip ? ' ip address ' + i.ip + ' ' + i.mask : ' no ip address');
          if (i.acl && i.acl.in) L.push(' ip access-group ' + i.acl.in + ' in');
          if (i.acl && i.acl.out) L.push(' ip access-group ' + i.acl.out + ' out');
          if (i.nat) L.push(' ip nat ' + i.nat);
          if (i.helper) L.push(' ip helper-address ' + i.helper);
          if (i.up === false) L.push(' shutdown');
          if (!i.parent) L.push(' duplex auto', ' speed auto');
          L.push('!');
        }
        const dh = dev.services && dev.services.dhcp;
        if (dh) {
          for (const r of dh.excludedRanges || []) L.push('ip dhcp excluded-address ' + r[0] + (r[1] && r[1] !== r[0] ? ' ' + r[1] : ''));
          for (const p of dh.pools || []) { L.push('ip dhcp pool ' + (p.name || 'POOL'), ' network ' + p.network + ' ' + p.mask); if (p.gateway) L.push(' default-router ' + p.gateway); if (p.dns) L.push(' dns-server ' + p.dns); if (p.domain) L.push(' domain-name ' + p.domain); if (p.lease) L.push(' lease ' + p.lease); L.push('!'); }
        }
        for (const r of dev.routes) L.push('ip route ' + r.dest + ' ' + r.mask + ' ' + (r.iface ? longName(r.iface) + (r.via ? ' ' + r.via : '') : r.via));
        if (dev.natSource) L.push('ip nat inside source list ' + dev.natSource.list + ' interface ' + longName(dev.natSource.iface) + (dev.natSource.overload ? ' overload' : ''));
        L.push('!');
        for (const name of Object.keys(dev.acls)) {
          const acl = dev.acls[name]; const numbered = /^\d+$/.test(name);
          if (numbered) { for (const r of acl) L.push('access-list ' + name + ' ' + aclLine(r, Number(name) < 100)); }
          else { L.push('ip access-list ' + (acl.type || 'extended') + ' ' + name); for (const r of acl) L.push(' ' + aclLine(r, acl.type === 'standard')); }
        }
        L.push('!');
      }
      L.push('line con 0', 'line vty 0 4', ' login', ' transport input ssh', '!', 'end');
      return L.join('\n');
    }
    function btoaSafe(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36) + 'xK9/' + s.length; }
    function aclLine(r, standard) {
      if (r.remark) return 'remark ' + r.remark;
      const fmt = spec => spec === 'any' ? 'any' : (spec.includes(' ') ? spec : 'host ' + spec);
      if (standard) return r.action + ' ' + fmt(r.src || 'any');
      return [r.action, r.proto || 'ip', fmt(r.src || 'any'), r.sport ? 'eq ' + r.sport : '', fmt(r.dst || 'any'), r.port != null && r.port !== 'any' ? 'eq ' + r.port : ''].filter(Boolean).join(' ');
    }
    function showInterfaces(arg) {
      const names = arg ? [normIface(dev, arg)].filter(Boolean) : Object.keys(dev.interfaces || {}).concat(Object.keys(dev.ports || {}));
      if (arg && !names.length) return INVALID;
      return names.map(n => {
        const [st, pr] = ifaceStatus(net, dev, n); const i = dev.interfaces ? dev.interfaces[n] : null;
        const mac = i ? i.mac : '0200.0000.' + Math.abs(n.length * 37).toString(16).padStart(4, '0');
        const lines = [longName(n) + ' is ' + st + ', line protocol is ' + pr, '  Hardware is ' + (/^G/.test(n) ? 'iGbE' : 'Fast Ethernet') + ', address is ' + (i ? iosMac(mac) : mac)];
        if (i && i.description) lines.push('  Description: ' + i.description);
        if (i && i.ip) lines.push('  Internet address is ' + i.ip + '/' + S().maskToCidr(i.mask));
        lines.push('  MTU 1500 bytes, BW ' + (/^G/.test(n) ? '1000000' : '100000') + ' Kbit/sec, DLY 100 usec,', '     reliability 255/255, txload 1/255, rxload 1/255', '  Encapsulation ARPA, loopback not set', '  Full-duplex, ' + (/^G/.test(n) ? '1000Mb/s' : '100Mb/s') + ', media type is RJ45', '     ' + (dev.stats && dev.stats[n] ? dev.stats[n].in : 1284) + ' packets input, 0 input errors, 0 CRC', '     ' + (dev.stats && dev.stats[n] ? dev.stats[n].out : 1310) + ' packets output, 0 output errors, 0 collisions');
        return lines.join('\n');
      }).join('\n');
    }
    function showVlan() {
      const out = ['VLAN Name                             Status    Ports', '---- -------------------------------- --------- -------------------------------'];
      const vlans = Object.keys(dev.vlans).map(Number).sort((a, b) => a - b);
      for (const v of vlans) {
        const ports = Object.keys(dev.ports).filter(p => dev.ports[p].mode !== 'trunk' && Number(dev.ports[p].vlan || 1) === v);
        out.push(padR(v, 5) + padR(dev.vlans[v], 33) + padR('active', 10) + ports.join(', '));
      }
      out.push(padR(1002, 5) + padR('fddi-default', 33) + 'act/unsup', padR(1003, 5) + padR('token-ring-default', 33) + 'act/unsup');
      return out.join('\n');
    }
    function showMac() {
      const out = ['          Mac Address Table', '-------------------------------------------', '', 'Vlan    Mac Address       Type        Ports', '----    -----------       --------    -----'];
      const entries = Object.keys(dev.macTable || {});
      for (const mac of entries) { const port = dev.macTable[mac]; const p = dev.ports[port] || {}; out.push(padR('   ' + (p.vlan || 1), 8) + padR(iosMac(mac), 18) + padR('DYNAMIC', 12) + port); }
      out.push('Total Mac Addresses for this criterion: ' + entries.length);
      return out.join('\n');
    }
    function showArp() {
      const out = ['Protocol  Address          Age (min)  Hardware Addr   Type   Interface'];
      for (const n of Object.keys(dev.interfaces || {})) { const i = dev.interfaces[n]; if (i.ip) out.push('Internet  ' + padR(i.ip, 17) + padR('-', 11) + padR(iosMac(i.mac), 16) + 'ARPA   ' + longName(n)); }
      for (const ip of Object.keys(dev.arp || {})) { const e = dev.arp[ip]; out.push('Internet  ' + padR(ip, 17) + padR(String(Math.floor(Math.random() * 5)), 11) + padR(iosMac(e.mac), 16) + 'ARPA   ' + longName(e.iface)); }
      return out.join('\n');
    }
    function showTrunk() {
      const trunks = Object.keys(dev.ports || {}).filter(p => dev.ports[p].mode === 'trunk');
      if (!trunks.length) return '';
      const out = ['Port        Mode         Encapsulation  Status        Native vlan'];
      for (const p of trunks) out.push(padR(p, 12) + padR('on', 13) + padR('802.1q', 15) + padR(N().linkAt(net, dev.id, p) ? 'trunking' : 'not-trunking', 14) + (dev.ports[p].native || 1));
      out.push('', 'Port        Vlans allowed on trunk');
      for (const p of trunks) out.push(padR(p, 12) + (dev.ports[p].allowed ? dev.ports[p].allowed.join(',') : '1-4094'));
      return out.join('\n');
    }
    function showCdp() {
      const out = ['Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge', '                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone', '', 'Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID'];
      for (const l of net.links) {
        if (l.a.dev !== dev.id && l.b.dev !== dev.id) continue;
        const me = l.a.dev === dev.id ? l.a : l.b; const them = l.a.dev === dev.id ? l.b : l.a; const o = net.devices[them.dev];
        const kind = N().kindOf(o); const cap = kind === 'router' ? 'R' : kind === 'switch' ? 'S' : kind === 'host' ? 'H' : 'r';
        out.push(padR(o.name, 17) + padR(longName(me.port).replace('GigabitEthernet', 'Gig ').replace('FastEthernet', 'Fas '), 18) + padR('150', 11) + padR(cap, 12) + padR(kind === 'router' ? 'ISR4321' : kind === 'switch' ? 'WS-C2960' : 'Host', 10) + longName(them.port).replace('GigabitEthernet', 'Gig ').replace('FastEthernet', 'Fas '));
      }
      return out.join('\n');
    }
    function showAcl() {
      const out = [];
      for (const name of Object.keys(dev.acls)) { const acl = dev.acls[name]; out.push((/^\d+$/.test(name) ? (Number(name) < 100 ? 'Standard' : 'Extended') + ' IP access list ' + name : (acl.type === 'standard' ? 'Standard' : 'Extended') + ' IP access list ' + name)); acl.forEach((r, i) => out.push('    ' + ((i + 1) * 10) + ' ' + aclLine(r, /^\d+$/.test(name) ? Number(name) < 100 : acl.type === 'standard'))); }
      return out.join('\n') || '';
    }
    function showNat() {
      const t = dev.nat && dev.nat.table ? dev.nat.table : {};
      const keys = Object.keys(t); if (!keys.length) return '';
      const out = ['Pro Inside global      Inside local       Outside local      Outside global'];
      const outside = dev.nat.outside && dev.interfaces[dev.nat.outside] ? dev.interfaces[dev.nat.outside].ip : '-';
      keys.slice(-20).forEach((k, i) => { const e = t[k]; const port = 1024 + i; out.push(padR(e.proto === 'icmp' ? 'icmp' : e.proto, 4) + padR(outside + ':' + port, 19) + padR(e.origSrc + ':' + port, 19) + padR(e.dst + (e.proto === 'icmp' ? ':' + port : ':' + (e.dport || 80)), 19) + e.dst + (e.proto === 'icmp' ? ':' + port : ':' + (e.dport || 80))); });
      return out.join('\n');
    }
    function showDhcpBinding() {
      const dh = dev.services && dev.services.dhcp; const leases = dh && dh.leases ? dh.leases : {};
      const out = ['Bindings from all pools not associated with VRF:', 'IP address          Client-ID/              Lease expiration        Type', '                    Hardware address/', '                    User name'];
      for (const mac of Object.keys(leases)) out.push(padR(leases[mac].ip, 20) + padR('0100.' + iosMac(mac), 24) + padR('Infinite', 24) + 'Automatic');
      return out.join('\n');
    }
    function showVersion() { return 'Cisco IOS Software, ' + (isSwitch ? 'C2960 Software (C2960-LANBASEK9-M), Version 15.2(7)E' : 'ISR Software (ISR4300-UNIVERSALK9), Version 15.2(4)M') + ', RELEASE SOFTWARE (fc1)\nNetSec Academy simulated device\n\n' + dev.name + ' uptime is 2 hours, 14 minutes\nSystem image file is "flash:' + (isSwitch ? 'c2960-lanbasek9-mz.152-7.E.bin' : 'isr4300-universalk9.bin') + '"\n\n' + (isSwitch ? '24 FastEthernet interfaces' : Object.keys(dev.interfaces).length + ' Gigabit Ethernet interfaces') + '\n512K bytes of non-volatile configuration memory.\n\nConfiguration register is 0x2102'; }
    function doPing(args) {
      if (!args.length) return INCOMPLETE;
      const target = args[0];
      const out = ['Type escape sequence to abort.'];
      const first = N().ping(net, dev.id, target);
      if (first.status === 'dns-fail') return '% Unrecognized host or address, or protocol not running.';
      out.push('Sending 5, 100-byte ICMP Echos to ' + first.resolved + ', timeout is 2 seconds:');
      let okc = 0; let marks = '';
      for (let i = 0; i < 5; i++) { const r = i === 0 ? first : N().ping(net, dev.id, first.resolved); if (r.success) { okc++; marks += '!'; } else marks += (r.status === 'unreachable' ? 'U' : '.'); }
      out.push(marks);
      const rtt = Math.max(1, Math.round(first.rtt));
      out.push('Success rate is ' + Math.round(okc / 5 * 100) + ' percent (' + okc + '/5)' + (okc ? ', round-trip min/avg/max = ' + rtt + '/' + rtt + '/' + (rtt + 1) + ' ms' : ''));
      if (!okc && first.reason) out.push('% ' + first.reason);
      cli.lastPing = first;
      return out.join('\n');
    }
    function doTrace(args) {
      if (!args.length) return INCOMPLETE;
      const t = N().traceroute(net, dev.id, args[0]);
      if (t.status === 'dns-fail') return '% Unrecognized host or address, or protocol not running.';
      const out = ['Type escape sequence to abort.', 'Tracing the route to ' + t.resolved, 'VRF info: (vrf in name/id, vrf out name/id)'];
      t.hops.forEach(h => out.push('  ' + h.ttl + ' ' + (h.timeout ? ' *  *  *' : h.ip + ' ' + Math.max(1, Math.round(h.rtt)) + ' msec ' + Math.max(1, Math.round(h.rtt)) + ' msec ' + Math.max(1, Math.round(h.rtt + 1)) + ' msec')));
      if (!t.success && t.reason) out.push('% ' + t.reason);
      return out.join('\n');
    }

    const showTable = [
      { words: ['show', 'running-config'], help: 'Current operating configuration', fn: a => a[0] && /^int/.test(a[0]) ? showRunIface(a) : showRun() },
      { words: ['show', 'startup-config'], help: 'Contents of startup configuration', fn: () => dev.saved ? 'Using ' + (700 + Object.keys(dev.interfaces || dev.ports).length * 60) + ' out of 262144 bytes\n!\n' + showRun().split('\n').slice(4).join('\n') : 'startup-config is not present' },
      { words: ['show', 'ip', 'interface', 'brief'], help: 'Brief summary of IP status and configuration', fn: showIpIntBrief },
      { words: ['show', 'ip', 'interface'], help: 'IP interface status and configuration', fn: showIpIntBrief },
      { words: ['show', 'ip', 'route'], help: 'IP routing table', fn: showIpRoute },
      { words: ['show', 'ip', 'arp'], help: 'IP ARP table', fn: showArp },
      { words: ['show', 'ip', 'nat', 'translations'], help: 'NAT translation table', fn: showNat },
      { words: ['show', 'ip', 'dhcp', 'binding'], help: 'DHCP address bindings', fn: showDhcpBinding },
      { words: ['show', 'ip', 'dhcp', 'pool'], help: 'DHCP pools', fn: () => ((dev.services && dev.services.dhcp && dev.services.dhcp.pools) || []).map(p => 'Pool ' + (p.name || 'POOL') + ' :\n Utilization mark (high/low)    : 100 / 0\n Subnet size (first/next)       : 0 / 0\n Total addresses                : ' + S().info(p.network, p.mask).hosts + '\n Leased addresses               : ' + Object.keys((dev.services.dhcp.leases || {})).length + '\n Current index        IP address range                    Leased addresses\n ' + padR(p.start, 21) + p.start + ' - ' + p.end).join('\n') || 'No DHCP pools configured' },
      { words: ['show', 'ip', 'access-lists'], help: 'List IP access lists', fn: showAcl },
      { words: ['show', 'access-lists'], help: 'List access lists', fn: showAcl },
      { words: ['show', 'ip', 'protocols'], help: 'IP routing protocol process parameters', fn: () => '*** IP Routing is NSF aware ***\n\nNo dynamic routing protocols are running (static routing only in this lab)' },
      { words: ['show', 'interfaces', 'trunk'], help: 'Trunk interface status', fn: showTrunk },
      { words: ['show', 'interfaces', 'status'], help: 'Interface line status', fn: () => (isSwitch ? ['Port      Name               Status       Vlan       Duplex  Speed Type'].concat(Object.keys(dev.ports).map(p => { const c = dev.ports[p]; const [st] = ifaceStatus(net, dev, p); return padR(p, 10) + padR(c.description || '', 19) + padR(st === 'up' ? 'connected' : st === 'down' ? 'notconnect' : 'disabled', 13) + padR(c.mode === 'trunk' ? 'trunk' : String(c.vlan || 1), 11) + 'a-full  a-100 10/100BaseTX'; })).join('\n') : showIpIntBrief()) },
      { words: ['show', 'interfaces'], help: 'Interface status and configuration', argHelp: 'GigabitEthernet  GigabitEthernet IEEE 802.3z', fn: a => showInterfaces(a.join('')) },
      { words: ['show', 'vlan', 'brief'], help: 'VLAN summary', fn: () => isSwitch ? showVlan() : INVALID },
      { words: ['show', 'vlan'], help: 'VTP VLAN status', fn: () => isSwitch ? showVlan() : INVALID },
      { words: ['show', 'mac', 'address-table'], help: 'MAC forwarding table', fn: () => isSwitch ? showMac() : INVALID },
      { words: ['show', 'mac-address-table'], help: 'MAC forwarding table', fn: () => isSwitch ? showMac() : INVALID },
      { words: ['show', 'arp'], help: 'ARP table', fn: showArp },
      { words: ['show', 'cdp', 'neighbors'], help: 'CDP neighbor entries', fn: showCdp },
      { words: ['show', 'version'], help: 'System hardware and software status', fn: showVersion },
      { words: ['show', 'clock'], help: 'Display the system clock', fn: () => '*' + new Date().toTimeString().slice(0, 8) + '.000 UTC ' + new Date().toDateString().slice(0, 10) },
      { words: ['show', 'history'], help: 'Display the session command history', fn: () => cli.history.slice(-10).join('\n') },
      { words: ['show', 'users'], help: 'Display users logged in', fn: () => '    Line       User       Host(s)              Idle       Location\n*  0 con 0                idle                 00:00:00' }
    ];
    function showRunIface(a) { const n = normIface(dev, a[1], a[2]); if (!n) return INVALID; const full = showRun().split('\n'); const start = full.indexOf('interface ' + longName(n)); if (start < 0) return INVALID; const out = ['Building configuration...', '', 'Current configuration : 120 bytes', '!']; for (let i = start; i < full.length; i++) { out.push(full[i]); if (full[i] === '!' ) break; } out.push('end'); return out.join('\n'); }

    const userTable = showTable.concat([
      { words: ['enable'], help: 'Turn on privileged commands', fn: () => { cli.mode = 'priv'; return ''; } },
      { words: ['ping'], help: 'Send echo messages', fn: doPing },
      { words: ['traceroute'], help: 'Trace route to destination', fn: doTrace },
      { words: ['exit'], help: 'Exit from the EXEC', fn: () => '' },
      { words: ['logout'], help: 'Exit from the EXEC', fn: () => '' }
    ]);
    const privTable = showTable.concat([
      { words: ['configure', 'terminal'], help: 'Enter configuration mode', fn: () => { cli.mode = 'config'; return 'Enter configuration commands, one per line.  End with CNTL/Z.'; } },
      { words: ['configure'], help: 'Enter configuration mode', fn: () => INCOMPLETE },
      { words: ['disable'], help: 'Turn off privileged commands', fn: () => { cli.mode = 'user'; return ''; } },
      { words: ['enable'], help: 'Turn on privileged commands', fn: () => '' },
      { words: ['exit'], help: 'Exit from the EXEC', fn: () => { cli.mode = 'user'; return ''; } },
      { words: ['end'], help: 'Exit from the EXEC', fn: () => '' },
      { words: ['ping'], help: 'Send echo messages', fn: doPing },
      { words: ['traceroute'], help: 'Trace route to destination', fn: doTrace },
      { words: ['write', 'memory'], help: 'Write to NV memory', fn: () => { dev.saved = true; cli.changed = false; return 'Building configuration...\n[OK]'; } },
      { words: ['write'], help: 'Write running configuration to memory', fn: () => { dev.saved = true; cli.changed = false; return 'Building configuration...\n[OK]'; } },
      { words: ['copy', 'running-config', 'startup-config'], help: 'Copy from current system configuration', fn: () => { dev.saved = true; cli.changed = false; return 'Destination filename [startup-config]? \nBuilding configuration...\n[OK]'; } },
      { words: ['copy'], help: 'Copy from one file to another', fn: () => INCOMPLETE },
      { words: ['reload'], help: 'Halt and perform a cold restart', fn: () => dev.saved ? 'Proceed with reload? [confirm]\n(simulated reload complete – running-config restored from startup-config)' : 'System configuration has been modified. Save? [yes/no]: (simulated: save with "write memory" first)' },
      { words: ['clear', 'ip', 'nat', 'translation'], help: 'Clear NAT translations', fn: () => { if (dev.nat) dev.nat.table = {}; return ''; } },
      { words: ['clear', 'arp-cache'], help: 'Clear the entire ARP cache', fn: () => { dev.arp = {}; return ''; } },
      { words: ['clear', 'mac', 'address-table', 'dynamic'], help: 'Clear dynamic MAC entries', fn: () => { dev.macTable = {}; return ''; } },
      { words: ['debug'], help: 'Debugging functions', fn: () => '(debugging is not simulated – use "show" commands and the packet trace panel)' },
      { words: ['terminal', 'length'], help: 'Set number of lines on a screen', fn: () => '' }
    ]);

    function enterIface(names) { cli.mode = 'if'; cli.ifaces = names; cli.iface = names[0]; return ''; }
    const configTable = [
      { words: ['hostname'], help: 'Set system\'s network name', fn: a => { if (!a[0]) return INCOMPLETE; dev.name = a[0]; return ''; } },
      { words: ['interface', 'range'], help: 'Select a range of interfaces', fn: a => { const names = parseRange(dev, a); if (!names.length) return INVALID; return enterIface(names); } },
      { words: ['interface'], help: 'Select an interface to configure', argHelp: 'GigabitEthernet  GigabitEthernet IEEE 802.3z', fn: a => {
        if (!a.length) return INCOMPLETE;
        if (/^vlan/i.test(a[0])) { if (!isSwitch) return INVALID; cli.mode = 'if'; cli.ifaces = ['Vlan1']; cli.iface = 'Vlan1'; return ''; }
        const n = normIface(dev, a[0], a[1]); if (!n) return INVALID;
        if (n.includes('.') && !dev.interfaces[n]) { const [parent, vlan] = n.split('.'); N().addSubInterface(net, dev.id, parent, Number(vlan)); dev.interfaces[n].vlan = null; }
        return enterIface([n]);
      } },
      { words: ['no', 'interface'], help: 'Remove a sub-interface', fn: a => { const n = normIface(dev, a[0], a[1]); if (!n || !dev.interfaces[n] || !dev.interfaces[n].parent) return INVALID; N().removeSubInterface(net, dev.id, n); return ''; } },
      { words: ['ip', 'route'], help: 'Establish static routes', fn: a => {
        if (a.length < 3) return INCOMPLETE;
        let [dest, mask] = a; let via = null, iface = null;
        if (dest.includes('/')) { const [d, b] = dest.split('/'); dest = d; mask = S().cidrToMask(Number(b)); a = [dest, mask].concat(a.slice(1)); }
        const rest = a.slice(2);
        if (S().isValidIPv4(rest[0])) via = rest[0]; else { iface = normIface(dev, rest[0], rest[1]); if (!iface) return '% Invalid next hop address or interface'; if (rest[1] && S().isValidIPv4(rest[1])) via = rest[1]; else if (rest[2] && S().isValidIPv4(rest[2])) via = rest[2]; }
        const r = N().addRoute(net, dev.id, dest, mask, via, iface); if (r.error) return '% ' + r.error;
        if (via && !iface && !Object.keys(dev.interfaces).some(n => dev.interfaces[n].ip && dev.interfaces[n].mask && S().sameSubnet(via, dev.interfaces[n].ip, dev.interfaces[n].mask))) return '%Warning: next hop ' + via + ' is not on a directly connected network – the route will not be installed until it is';
        return '';
      } },
      { words: ['no', 'ip', 'route'], help: 'Remove a static route', fn: a => { if (a.length < 2) return INCOMPLETE; let [dest, mask] = a; if (dest.includes('/')) { const [d, b] = dest.split('/'); dest = d; mask = S().cidrToMask(Number(b)); } N().removeRoute(net, dev.id, dest, mask); return ''; } },
      { words: ['ip', 'dhcp', 'pool'], help: 'Configure DHCP address pools', fn: a => { if (!a[0]) return INCOMPLETE; dev.services = dev.services || {}; dev.services.dhcp = dev.services.dhcp || { pools: [], excludedRanges: [] }; let p = dev.services.dhcp.pools.find(x => x.name === a[0]); if (!p) { p = { name: a[0], network: '', mask: '', start: '', end: '', gateway: '', dns: '', domain: '', lease: null }; dev.services.dhcp.pools.push(p); } cli.pool = p; cli.mode = 'dhcp'; return ''; } },
      { words: ['no', 'ip', 'dhcp', 'pool'], help: 'Remove a DHCP pool', fn: a => { if (dev.services && dev.services.dhcp) dev.services.dhcp.pools = dev.services.dhcp.pools.filter(p => p.name !== a[0]); return ''; } },
      { words: ['ip', 'dhcp', 'excluded-address'], help: 'Prevent DHCP from assigning certain addresses', fn: a => { if (!S().isValidIPv4(a[0] || '')) return INVALID; dev.services = dev.services || {}; dev.services.dhcp = dev.services.dhcp || { pools: [], excludedRanges: [] }; dev.services.dhcp.excludedRanges = dev.services.dhcp.excludedRanges || []; dev.services.dhcp.excludedRanges.push([a[0], a[1] && S().isValidIPv4(a[1]) ? a[1] : a[0]]); return ''; } },
      { words: ['no', 'ip', 'dhcp', 'excluded-address'], help: 'Remove excluded range', fn: a => { if (dev.services && dev.services.dhcp) dev.services.dhcp.excludedRanges = (dev.services.dhcp.excludedRanges || []).filter(r => r[0] !== a[0]); return ''; } },
      { words: ['service', 'dhcp'], help: 'Enable DHCP server', fn: () => { if (dev.services && dev.services.dhcp) dev.services.dhcp.enabled = true; return ''; } },
      { words: ['no', 'service', 'dhcp'], help: 'Disable DHCP server', fn: () => { if (dev.services && dev.services.dhcp) dev.services.dhcp.enabled = false; return ''; } },
      { words: ['ip', 'nat', 'inside', 'source', 'list'], help: 'Enable NAT for inside source addresses', fn: a => { // list N interface X overload
        const list = a[0]; const ii = a.indexOf('interface'); if (!list || ii < 0) return INCOMPLETE; const iface = normIface(dev, a[ii + 1], a[ii + 2]); if (!iface) return INVALID;
        dev.natSource = { list, iface, overload: a.map(x => x.toLowerCase()).includes('overload') }; recomputeNat(); return '';
      } },
      { words: ['no', 'ip', 'nat', 'inside', 'source'], help: 'Disable NAT', fn: () => { dev.natSource = null; recomputeNat(); return ''; } },
      { words: ['access-list'], help: 'Add an access list entry', fn: a => {
        const num = a[0]; if (!/^\d+$/.test(num || '')) return INVALID; const n = Number(num);
        const standard = n < 100 || (n >= 1300 && n <= 1999);
        if (a[1] === 'remark') { dev.acls[num] = dev.acls[num] || []; dev.acls[num].push({ remark: a.slice(2).join(' ') }); return ''; }
        const r = parseAclEntry(a.slice(1), standard); if (r.error) return r.error;
        dev.acls[num] = dev.acls[num] || []; dev.acls[num].type = standard ? 'standard' : 'extended'; dev.acls[num].push(r.rule); recomputeNat(); return '';
      } },
      { words: ['no', 'access-list'], help: 'Remove an access list', fn: a => { delete dev.acls[a[0]]; return ''; } },
      { words: ['ip', 'access-list', 'extended'], help: 'Extended Access List', fn: a => { if (!a[0]) return INCOMPLETE; dev.acls[a[0]] = dev.acls[a[0]] || []; dev.acls[a[0]].type = 'extended'; cli.acl = a[0]; cli.aclType = 'extended'; cli.mode = 'acl'; return ''; } },
      { words: ['ip', 'access-list', 'standard'], help: 'Standard Access List', fn: a => { if (!a[0]) return INCOMPLETE; dev.acls[a[0]] = dev.acls[a[0]] || []; dev.acls[a[0]].type = 'standard'; cli.acl = a[0]; cli.aclType = 'standard'; cli.mode = 'acl'; return ''; } },
      { words: ['no', 'ip', 'access-list'], help: 'Remove a named access list', fn: a => { const name = a[1] || a[0]; delete dev.acls[name]; for (const n of Object.keys(dev.interfaces || {})) { const i = dev.interfaces[n]; if (i.acl) { if (i.acl.in === name) i.acl.in = null; if (i.acl.out === name) i.acl.out = null; } } return ''; } },
      { words: ['vlan'], help: 'Vlan commands', fn: a => { if (!isSwitch) return INVALID; if (!/^\d+$/.test(a[0] || '')) return INCOMPLETE; const v = Number(a[0]); if (v < 1 || v > 4094) return '% Bad VLAN list'; dev.vlans[v] = dev.vlans[v] || ('VLAN' + String(v).padStart(4, '0')); cli.vlan = v; cli.mode = 'vlan'; return ''; } },
      { words: ['no', 'vlan'], help: 'Remove a VLAN', fn: a => { if (!isSwitch) return INVALID; const v = Number(a[0]); if (v === 1) return '% Default VLAN 1 may not be deleted.'; delete dev.vlans[v]; return ''; } },
      { words: ['ip', 'default-gateway'], help: 'Specify default gateway (switch management)', fn: a => { if (!S().isValidIPv4(a[0] || '')) return INVALID; dev.gateway = a[0]; return ''; } },
      { words: ['ip', 'routing'], help: 'Enable IP routing', fn: () => '' },
      { words: ['ip', 'domain-name'], help: 'Define the default domain name', fn: a => { dev.domain = a[0]; return ''; } },
      { words: ['ip', 'domain', 'name'], help: 'Define the default domain name', fn: a => { dev.domain = a[0]; return ''; } },
      { words: ['ip', 'name-server'], help: 'Specify address of name server', fn: a => { dev.dns = a[0]; return ''; } },
      { words: ['ip', 'ssh', 'version'], help: 'Configure SSH version', fn: () => '' },
      { words: ['crypto', 'key', 'generate', 'rsa'], help: 'Generate RSA keys', fn: () => 'The name for the keys will be: ' + dev.name + '.' + (dev.domain || 'local') + '\nGenerating 2048 bit RSA keys, keys will be non-exportable...[OK]' },
      { words: ['enable', 'secret'], help: 'Assign the privileged level secret', fn: a => { dev.enableSecret = a[a.length - 1]; return ''; } },
      { words: ['enable', 'password'], help: 'Assign the privileged level password', fn: a => { dev.enableSecret = a[a.length - 1]; return '% Tip: "enable secret" stores a hashed password and is preferred'; } },
      { words: ['service', 'password-encryption'], help: 'Encrypt system passwords', fn: () => '' },
      { words: ['username'], help: 'Establish User Name Authentication', fn: a => { dev.users = dev.users || {}; dev.users[a[0]] = true; return ''; } },
      { words: ['banner', 'motd'], help: 'Set Message of the Day banner', fn: a => { dev.banner = a.join(' ').replace(/^[#^]|[#^]$/g, ''); return ''; } },
      { words: ['line', 'vty'], help: 'Virtual terminal', fn: () => { cli.mode = 'line'; return ''; } },
      { words: ['line', 'console'], help: 'Primary terminal line', fn: () => { cli.mode = 'line'; return ''; } },
      { words: ['line', 'con'], help: 'Primary terminal line', fn: () => { cli.mode = 'line'; return ''; } },
      { words: ['spanning-tree'], help: 'Spanning Tree Subsystem', fn: () => '' },
      { words: ['no', 'ip', 'domain-lookup'], help: 'Disable DNS lookup of hostnames', fn: () => '' },
      { words: ['do'], help: 'To run exec commands in config mode', fn: a => runTable(a, privTable) },
      { words: ['exit'], help: 'Exit from configure mode', fn: () => { cli.mode = 'priv'; return ''; } },
      { words: ['end'], help: 'Exit from configure mode', fn: () => { cli.mode = 'priv'; return ''; } }
    ];
    function parseAclEntry(t, standard) {
      const action = (t[0] || '').toLowerCase(); if (action !== 'permit' && action !== 'deny') return { error: INVALID };
      if (standard) { const src = parseAclTarget(t, 1); if (!src) return { error: INVALID }; return { rule: { action, proto: 'ip', src: src.spec, dst: 'any' } }; }
      const proto = (t[1] || '').toLowerCase(); if (!['ip', 'tcp', 'udp', 'icmp'].includes(proto)) return { error: proto ? '% Unsupported protocol "' + proto + '" (use ip, tcp, udp or icmp)' : INCOMPLETE };
      let i = 2; const src = parseAclTarget(t, i); if (!src) return { error: INCOMPLETE }; i = src.next;
      let sport = null; if (t[i] && t[i].toLowerCase() === 'eq') { sport = portNum(t[i + 1]); i += 2; }
      const dst = parseAclTarget(t, i); if (!dst) return { error: INCOMPLETE }; i = dst.next;
      let port = null; if (t[i] && t[i].toLowerCase() === 'eq') { port = portNum(t[i + 1]); if (port == null) return { error: '% Unknown port "' + t[i + 1] + '"' }; i += 2; }
      const rule = { action, proto, src: src.spec, dst: dst.spec }; if (sport) rule.sport = sport; if (port != null) rule.port = port;
      return { rule };
    }
    function recomputeNat() {
      const inside = Object.keys(dev.interfaces || {}).filter(n => dev.interfaces[n].nat === 'inside');
      const outside = Object.keys(dev.interfaces || {}).find(n => dev.interfaces[n].nat === 'outside');
      if (dev.natSource && inside.length && outside && dev.acls[dev.natSource.list]) dev.nat = Object.assign(dev.nat || {}, { inside, outside, list: dev.natSource.list, table: (dev.nat && dev.nat.table) || {} });
      else dev.nat = null;
    }
    const ifTable = [
      { words: ['ip', 'address'], help: 'Set the IP address of an interface', fn: a => {
        if (isSwitch && cli.iface === 'Vlan1') { if (!S().isValidIPv4(a[0] || '') || !S().isValidMask(a[1] || '')) return a[0] && a[0].toLowerCase() === 'dhcp' ? '' : (a.length < 2 ? INCOMPLETE : '% Invalid address/mask'); dev.mgmtIp = a[0]; dev.mgmtMask = a[1]; return ''; }
        if (isSwitch) return '% IP addresses may only be configured on SVIs (interface Vlan1) on a Layer 2 switch';
        if ((a[0] || '').toLowerCase() === 'dhcp') { for (const n of cli.ifaces) dev.interfaces[n].mode = 'dhcp'; return ''; }
        if (a.length < 2) return INCOMPLETE;
        for (const n of cli.ifaces) {
          if (dev.interfaces[n].parent && dev.interfaces[n].vlan == null) return '% Configuring IP routing on a LAN subinterface is only allowed if that subinterface is already configured as part of an IEEE 802.1Q VLAN (use "encapsulation dot1Q <vlan>" first)';
          const i = S().info(a[0], a[1]); if (!i) return '% Invalid address/mask';
          if (i.isNetworkAddress || i.isBroadcastAddress) return '% Bad mask /' + i.cidr + ' for address ' + a[0];
          for (const o of Object.keys(dev.interfaces)) { if (o !== n && dev.interfaces[o].ip && dev.interfaces[o].mask && S().info(dev.interfaces[o].ip, dev.interfaces[o].mask).network === i.network) return '% ' + i.network + ' overlaps with ' + longName(o); }
          const r = N().setInterface(net, dev.id, n, { ip: a[0], mask: a[1] }); if (r.error) return '% ' + r.error;
        }
        return '';
      } },
      { words: ['no', 'ip', 'address'], help: 'Remove the IP address', fn: () => { for (const n of cli.ifaces) if (dev.interfaces[n]) N().setInterface(net, dev.id, n, { ip: '', mask: '' }); return ''; } },
      { words: ['no', 'shutdown'], help: 'Enable the interface', fn: () => { for (const n of cli.ifaces) { if (dev.interfaces && dev.interfaces[n]) { dev.interfaces[n].up = true; } else if (dev.ports && dev.ports[n]) dev.ports[n].up = true; } return cli.ifaces.map(n => '%LINK-5-CHANGED: Interface ' + longName(n) + ', changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ' + longName(n) + ', changed state to ' + (ifaceStatus(net, dev, n)[1])).join('\n'); } },
      { words: ['shutdown'], help: 'Shutdown the selected interface', fn: () => { for (const n of cli.ifaces) { if (dev.interfaces && dev.interfaces[n]) dev.interfaces[n].up = false; else if (dev.ports && dev.ports[n]) dev.ports[n].up = false; } return cli.ifaces.map(n => '%LINK-5-CHANGED: Interface ' + longName(n) + ', changed state to administratively down').join('\n'); } },
      { words: ['description'], help: 'Interface specific description', fn: a => { for (const n of cli.ifaces) { const o = (dev.interfaces && dev.interfaces[n]) || (dev.ports && dev.ports[n]); if (o) o.description = a.join(' '); } return ''; } },
      { words: ['encapsulation', 'dot1q'], help: 'IEEE 802.1Q Virtual LAN', fn: a => { if (!/^\d+$/.test(a[0] || '')) return INCOMPLETE; const i = dev.interfaces[cli.iface]; if (!i || !i.parent) return '% Encapsulation can only be configured on sub-interfaces'; i.vlan = Number(a[0]); i.native = (a[1] || '').toLowerCase() === 'native'; return ''; } },
      { words: ['switchport', 'mode', 'access'], help: 'Set trunking mode to ACCESS unconditionally', fn: () => { if (!isSwitch) return INVALID; for (const n of cli.ifaces) if (dev.ports[n]) dev.ports[n].mode = 'access'; return ''; } },
      { words: ['switchport', 'mode', 'trunk'], help: 'Set trunking mode to TRUNK unconditionally', fn: () => { if (!isSwitch) return INVALID; for (const n of cli.ifaces) if (dev.ports[n]) dev.ports[n].mode = 'trunk'; return ''; } },
      { words: ['switchport', 'access', 'vlan'], help: 'Set VLAN when interface is in access mode', fn: a => { if (!isSwitch) return INVALID; const v = Number(a[0]); if (!v) return INCOMPLETE; let msg = ''; if (!dev.vlans[v]) { dev.vlans[v] = 'VLAN' + String(v).padStart(4, '0'); msg = '% Access VLAN does not exist. Creating vlan ' + v; } for (const n of cli.ifaces) if (dev.ports[n]) dev.ports[n].vlan = v; return msg; } },
      { words: ['switchport', 'trunk', 'allowed', 'vlan'], help: 'Set allowed VLAN characteristics', fn: a => { if (!isSwitch) return INVALID; let spec = a.join(''); let add = false; if (/^add/i.test(a[0] || '')) { add = true; spec = a.slice(1).join(''); } if (/^all$/i.test(spec)) { for (const n of cli.ifaces) dev.ports[n].allowed = null; return ''; } const list = []; for (const part of spec.split(',')) { if (part.includes('-')) { const [x, y] = part.split('-').map(Number); for (let i = x; i <= y; i++) list.push(i); } else if (part) list.push(Number(part)); } for (const n of cli.ifaces) dev.ports[n].allowed = add ? Array.from(new Set((dev.ports[n].allowed || []).concat(list))) : list; return ''; } },
      { words: ['switchport', 'trunk', 'native', 'vlan'], help: 'Set native VLAN', fn: a => { if (!isSwitch) return INVALID; for (const n of cli.ifaces) dev.ports[n].native = Number(a[0]) || 1; return ''; } },
      { words: ['switchport', 'trunk', 'encapsulation', 'dot1q'], help: 'Set trunking encapsulation', fn: () => '' },
      { words: ['switchport', 'port-security'], help: 'Security related command', fn: a => { for (const n of cli.ifaces) { dev.ports[n].portSecurity = dev.ports[n].portSecurity || { max: 1, violation: 'shutdown' }; if (a[0] === 'maximum') dev.ports[n].portSecurity.max = Number(a[1]); if (a[0] === 'violation') dev.ports[n].portSecurity.violation = a[1]; } return ''; } },
      { words: ['switchport'], help: 'Set switching mode characteristics', fn: () => isSwitch ? INCOMPLETE : INVALID },
      { words: ['no', 'switchport', 'access', 'vlan'], help: 'Reset access VLAN to default', fn: () => { for (const n of cli.ifaces) dev.ports[n].vlan = 1; return ''; } },
      { words: ['ip', 'nat', 'inside'], help: 'Inside interface for address translation', fn: () => { if (isSwitch) return INVALID; for (const n of cli.ifaces) dev.interfaces[n].nat = 'inside'; recomputeNat(); return ''; } },
      { words: ['ip', 'nat', 'outside'], help: 'Outside interface for address translation', fn: () => { if (isSwitch) return INVALID; for (const n of cli.ifaces) dev.interfaces[n].nat = 'outside'; recomputeNat(); return ''; } },
      { words: ['no', 'ip', 'nat'], help: 'Remove NAT designation', fn: () => { for (const n of cli.ifaces) dev.interfaces[n].nat = null; recomputeNat(); return ''; } },
      { words: ['ip', 'access-group'], help: 'Specify access control for packets', fn: a => { if (isSwitch) return INVALID; const name = a[0]; const dir = (a[1] || '').toLowerCase(); if (!name || !dir) return INCOMPLETE; if (dir !== 'in' && dir !== 'out') return INVALID; if (!dev.acls[name]) return '% Access list ' + name + ' does not exist (it will match nothing until created – implicit deny)'; for (const n of cli.ifaces) { dev.interfaces[n].acl = dev.interfaces[n].acl || { in: null, out: null }; dev.interfaces[n].acl[dir] = name; } return ''; } },
      { words: ['no', 'ip', 'access-group'], help: 'Remove access control', fn: a => { const dir = (a[a.length - 1] || '').toLowerCase(); for (const n of cli.ifaces) { if (!dev.interfaces[n].acl) continue; if (dir === 'in' || dir === 'out') dev.interfaces[n].acl[dir] = null; else dev.interfaces[n].acl = { in: null, out: null }; } return ''; } },
      { words: ['ip', 'helper-address'], help: 'Specify a destination address for UDP broadcasts', fn: a => { for (const n of cli.ifaces) if (dev.interfaces[n]) dev.interfaces[n].helper = a[0]; return ''; } },
      { words: ['duplex'], help: 'Configure duplex operation', fn: () => '' },
      { words: ['speed'], help: 'Configure speed operation', fn: () => '' },
      { words: ['do'], help: 'To run exec commands in config mode', fn: a => runTable(a, privTable) },
      { words: ['exit'], help: 'Exit from interface configuration mode', fn: () => { cli.mode = 'config'; cli.ifaces = []; cli.iface = null; return ''; } },
      { words: ['end'], help: 'Exit from configure mode', fn: () => { cli.mode = 'priv'; cli.ifaces = []; return ''; } },
      { words: ['interface'], help: 'Select an interface to configure', fn: a => { cli.mode = 'config'; return runTable(['interface'].concat(a), configTable); } }
    ];
    const vlanTable = [
      { words: ['name'], help: 'Ascii name of the VLAN', fn: a => { if (!a[0]) return INCOMPLETE; dev.vlans[cli.vlan] = a.join('_'); return ''; } },
      { words: ['exit'], help: 'Apply changes, bump revision number, and exit mode', fn: () => { cli.mode = 'config'; return ''; } },
      { words: ['end'], help: 'Apply changes and exit', fn: () => { cli.mode = 'priv'; return ''; } },
      { words: ['do'], help: 'To run exec commands in config mode', fn: a => runTable(a, privTable) },
      { words: ['vlan'], help: 'Configure another VLAN', fn: a => { cli.mode = 'config'; return runTable(['vlan'].concat(a), configTable); } }
    ];
    const dhcpTable = [
      { words: ['network'], help: 'Network number and mask', fn: a => { let [n, m] = a; if (!n) return INCOMPLETE; if (n.includes('/')) { const [x, b] = n.split('/'); n = x; m = S().cidrToMask(Number(b)); } if (m && /^\/\d+$/.test(m)) m = S().cidrToMask(Number(m.slice(1))); const i = S().info(n, m || '255.255.255.0'); if (!i) return '% Invalid network'; Object.assign(cli.pool, { network: i.network, mask: i.mask, start: i.first, end: i.last }); return ''; } },
      { words: ['default-router'], help: 'Default routers', fn: a => { if (!S().isValidIPv4(a[0] || '')) return INVALID; cli.pool.gateway = a[0]; return ''; } },
      { words: ['dns-server'], help: 'DNS servers', fn: a => { if (!S().isValidIPv4(a[0] || '')) return INVALID; cli.pool.dns = a[0]; return ''; } },
      { words: ['domain-name'], help: 'Domain name', fn: a => { cli.pool.domain = a[0]; return ''; } },
      { words: ['lease'], help: 'Address lease time', fn: a => { cli.pool.lease = Number(a[0]) * 24 || 24; return ''; } },
      { words: ['exit'], help: 'Exit from DHCP pool configuration mode', fn: () => { cli.mode = 'config'; cli.pool = null; return ''; } },
      { words: ['end'], help: 'Exit from configure mode', fn: () => { cli.mode = 'priv'; cli.pool = null; return ''; } },
      { words: ['do'], help: 'To run exec commands in config mode', fn: a => runTable(a, privTable) }
    ];
    const aclTable = [
      { words: ['permit'], help: 'Specify packets to forward', fn: a => { const r = parseAclEntry(['permit'].concat(a), cli.aclType === 'standard'); if (r.error) return r.error; dev.acls[cli.acl].push(r.rule); return ''; } },
      { words: ['deny'], help: 'Specify packets to reject', fn: a => { const r = parseAclEntry(['deny'].concat(a), cli.aclType === 'standard'); if (r.error) return r.error; dev.acls[cli.acl].push(r.rule); return ''; } },
      { words: ['remark'], help: 'Access list entry comment', fn: a => { dev.acls[cli.acl].push({ remark: a.join(' ') }); return ''; } },
      { words: ['no'], help: 'Negate a command', fn: a => { const idx = /^\d+$/.test(a[0] || '') ? Number(a[0]) / 10 - 1 : -1; if (idx >= 0) dev.acls[cli.acl].splice(idx, 1); else { const r = parseAclEntry(a, cli.aclType === 'standard'); if (!r.error) dev.acls[cli.acl] = dev.acls[cli.acl].filter(x => JSON.stringify(x) !== JSON.stringify(r.rule)); } return ''; } },
      { words: ['exit'], help: 'Exit from access-list configuration mode', fn: () => { cli.mode = 'config'; cli.acl = null; return ''; } },
      { words: ['end'], help: 'Exit from configure mode', fn: () => { cli.mode = 'priv'; cli.acl = null; return ''; } },
      { words: ['do'], help: 'To run exec commands in config mode', fn: a => runTable(a, privTable) }
    ];
    const lineTable = [
      { words: ['password'], help: 'Set a password', fn: () => '' }, { words: ['login'], help: 'Enable password checking', fn: () => '' }, { words: ['login', 'local'], help: 'Local password checking', fn: () => '' },
      { words: ['transport', 'input'], help: 'Define which protocols to use', fn: () => '' }, { words: ['exec-timeout'], help: 'Set the EXEC timeout', fn: () => '' }, { words: ['logging', 'synchronous'], help: 'Synchronized message output', fn: () => '' },
      { words: ['exit'], help: 'Exit from line configuration mode', fn: () => { cli.mode = 'config'; return ''; } }, { words: ['end'], help: 'Exit from configure mode', fn: () => { cli.mode = 'priv'; return ''; } },
      { words: ['do'], help: 'To run exec commands in config mode', fn: a => runTable(a, privTable) }
    ];
    function tableFor() { return { user: userTable, priv: privTable, config: configTable, if: ifTable, vlan: vlanTable, dhcp: dhcpTable, acl: aclTable, line: lineTable }[cli.mode]; }
    function runTable(tokens, table) {
      if (!tokens.length) return '';
      if (tokens[tokens.length - 1] === '?' || tokens[tokens.length - 1].endsWith('?')) { const t = tokens.map(x => x.replace(/\?$/, '')).filter(Boolean); return help(table, t); }
      const d = dispatch(tokens, table);
      if (!d) return INVALID;
      if (d.ambiguous) return '% Ambiguous command:  "' + tokens.join(' ') + '"';
      cli.changed = true;
      const out = d.spec.fn(d.args);
      return out == null ? '' : out;
    }
    cli.run = function (line) {
      const raw = String(line || '').trim();
      if (!raw) return '';
      cli.history.push(raw);
      if (raw === '?') return help(tableFor(), []);
      const tokens = raw.replace(/\?$/, ' ?').split(/\s+/).filter(Boolean);
      // enable password prompt is simulated as unnecessary (console access)
      const before = cli.mode;
      const out = runTable(tokens, tableFor());
      if (out === INVALID) { const col = cli.prompt().length + raw.length; return raw + '\n' + ' '.repeat(Math.max(0, cli.prompt().length)) + '^\n' + INVALID; }
      if (before !== cli.mode && cli.mode === 'priv' && before !== 'user' && raw.toLowerCase().startsWith('end')) return '';
      return out;
    };
    cli.showRun = showRun;
    return cli;
  }

  NSA.ios = { createCli, normIface, longName, iosMac };
})(typeof globalThis !== 'undefined' ? globalThis : window);
