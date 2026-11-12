/* Engine unit tests – run with: node tests/engines.test.js */
'use strict';
const path = require('path');
globalThis.NSA = {};
['js/core/util.js', 'js/engines/subnet.js', 'js/engines/netsim.js'].forEach(f => require(path.join(__dirname, '..', f)));
const { subnet: S, netsim: N } = NSA;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n       ') : e)); }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'expected') + ': got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }

console.log('subnet engine');
test('info /26', () => { const i = S.info('192.168.1.130', 26); eq([i.network, i.broadcast, i.first, i.last, i.hosts, i.mask], ['192.168.1.128', '192.168.1.191', '192.168.1.129', '192.168.1.190', 62, '255.255.255.192']); });
test('info /30 and /32', () => { eq(S.info('10.0.0.5/30').hosts, 2); eq(S.info('10.0.0.5', 32).hosts, 1); eq(S.info('10.0.0.4/30').isNetworkAddress, true); });
test('mask conversions', () => { eq(S.maskToCidr('255.255.255.0'), 24); eq(S.maskToCidr('255.255.240.0'), 20); eq(S.maskToCidr('255.0.255.0'), null); eq(S.cidrToMask(27), '255.255.255.224'); eq(S.wildcard('255.255.255.0'), '0.0.0.255'); });
test('address classification', () => { ok(S.isPrivate('10.1.2.3')); ok(S.isPrivate('172.31.0.1')); ok(!S.isPrivate('172.32.0.1')); ok(S.isAPIPA('169.254.1.1')); eq(S.classOf('150.1.1.1'), 'B'); eq(S.addressType('8.8.8.8'), 'public'); ok(!S.isPublic('192.168.1.1')); });
test('sameSubnet', () => { ok(S.sameSubnet('192.168.1.10', '192.168.1.200', 24)); ok(!S.sameSubnet('192.168.1.10', '192.168.1.200', 25)); ok(S.sameSubnet('10.0.0.1', '10.255.255.254', '255.0.0.0')); });
test('subnetsOf', () => { const s = S.subnetsOf('192.168.1.0/24', 26); eq(s.length, 4); eq(s[2].network, '192.168.1.128'); });
test('vlsm', () => { const r = S.vlsm('192.168.1.0/24', [{ name: 'Sales', hosts: 50 }, { name: 'Eng', hosts: 20 }, { name: 'Mgmt', hosts: 5 }]); eq(r.allocations.map(a => a.network + '/' + a.cidr), ['192.168.1.0/26', '192.168.1.64/27', '192.168.1.96/29']); });
test('ipv6 expand/compress', () => { eq(S.expandIPv6('2001:db8::1'), '2001:0db8:0000:0000:0000:0000:0000:0001'); eq(S.compressIPv6('2001:0db8:0000:0000:0000:0000:0000:0001'), '2001:db8::1'); eq(S.compressIPv6('fe80:0:0:0:1:0:0:1'), 'fe80::1:0:0:1'); eq(S.expandIPv6('::'), '0000:0000:0000:0000:0000:0000:0000:0000'); eq(S.expandIPv6('1::2::3'), null); eq(S.ipv6Type('fe80::1'), 'link-local (fe80::/10)'); });
test('problem generator', () => { const rng = NSA.util.seededRng(42); for (const k of ['basic', 'mask', 'hosts', 'count', 'same', 'vlsm']) { const p = S.generateProblem(rng, 'hard', k); ok(p.question && p.fields.length, 'problem ' + k); for (const f of p.fields) ok(S.checkAnswer(p, f.key, p.answers[f.key]), 'self-check ' + k); } });

console.log('netsim engine');
function lan2() {
  const net = N.createNetwork();
  N.addDevice(net, 'pc', { id: 'pc1', name: 'PC1', interfaces: { eth0: { ip: '192.168.1.10', mask: '255.255.255.0' } } });
  N.addDevice(net, 'pc', { id: 'pc2', name: 'PC2', interfaces: { eth0: { ip: '192.168.1.20', mask: '255.255.255.0' } } });
  N.addDevice(net, 'switch', { id: 'sw1', name: 'SW1' });
  ok(!N.connect(net, 'pc1', 'eth0', 'sw1', 'Fa0/1').error); ok(!N.connect(net, 'pc2', 'eth0', 'sw1', 'Fa0/2').error);
  return net;
}
test('same subnet ping via switch', () => {
  const net = lan2(); const r = N.ping(net, 'pc1', '192.168.1.20');
  ok(r.success, 'ping should succeed: ' + r.reason); ok(net.devices.pc1.arp['192.168.1.20'], 'arp learned'); eq(net.devices.sw1.macTable[net.devices.pc1.interfaces.eth0.mac], 'Fa0/1');
  ok(r.trace.some(t => t.kind === 'arp-req') && r.trace.some(t => t.kind === 'frame'), 'trace has arp and frames');
  const r2 = N.ping(net, 'pc1', '192.168.1.20'); ok(!r2.trace.some(t => t.kind === 'arp-req'), 'second ping uses ARP cache');
});
test('different subnet without gateway fails', () => { const net = lan2(); N.setInterface(net, 'pc2', 'eth0', { ip: '192.168.2.20' }); const r = N.ping(net, 'pc1', '192.168.2.20'); ok(!r.success); eq(r.status, 'no-route'); ok(/gateway/.test(r.reason), r.reason); });
test('unplugged cable', () => { const net = lan2(); N.disconnect(net, net.links[1].id); const r = N.ping(net, 'pc1', '192.168.1.20'); ok(!r.success); eq(r.status, 'arp-fail'); });
test('interface shutdown blocks traffic', () => { const net = lan2(); net.devices.sw1.ports['Fa0/2'].up = false; ok(!N.ping(net, 'pc1', '192.168.1.20').success); net.devices.sw1.ports['Fa0/2'].up = true; net.devices.pc2.interfaces.eth0.up = false; ok(!N.ping(net, 'pc1', '192.168.1.20').success); });
function routed() {
  const net = N.createNetwork();
  N.addDevice(net, 'pc', { id: 'pc1', name: 'PC1', interfaces: { eth0: { ip: '192.168.1.10/24' } }, gateway: '192.168.1.1' });
  N.addDevice(net, 'pc', { id: 'pc2', name: 'PC2', interfaces: { eth0: { ip: '192.168.2.10/24' } }, gateway: '192.168.2.1' });
  N.addDevice(net, 'router', { id: 'r1', name: 'R1', interfaces: { 'G0/0': { ip: '192.168.1.1/24' }, 'G0/1': { ip: '192.168.2.1/24' } } });
  N.addDevice(net, 'switch', { id: 'sw1' }); N.addDevice(net, 'switch', { id: 'sw2' });
  N.connect(net, 'pc1', 'eth0', 'sw1', 'Fa0/1'); N.connect(net, 'sw1', 'Fa0/8', 'r1', 'G0/0');
  N.connect(net, 'pc2', 'eth0', 'sw2', 'Fa0/1'); N.connect(net, 'sw2', 'Fa0/8', 'r1', 'G0/1');
  return net;
}
test('routed ping across subnets', () => { const net = routed(); const r = N.ping(net, 'pc1', '192.168.2.10'); ok(r.success, r.reason); eq(r.hops, ['r1', 'pc2', 'r1', 'pc1']); ok(r.ttl === 127 || r.ttl === 63, 'ttl decremented: ' + r.ttl); });
test('traceroute lists router then host', () => { const net = routed(); const t = N.traceroute(net, 'pc1', '192.168.2.10'); ok(t.success); eq(t.hops.map(h => h.ip), ['192.168.1.1', '192.168.2.10']); });
test('wrong gateway detected', () => { const net = routed(); net.devices.pc1.gateway = '192.168.1.254'; const r = N.ping(net, 'pc1', '192.168.2.10'); ok(!r.success); eq(r.status, 'arp-fail'); ok(N.diagnose(net).some(i => /gateway address 192.168.1.254/.test(i.msg)), 'diagnose flags missing gateway owner'); net.devices.pc1.gateway = '10.0.0.1'; ok(N.diagnose(net).some(i => /not in the same subnet/.test(i.msg))); });
test('return path missing (pc2 has no gateway)', () => { const net = routed(); net.devices.pc2.gateway = ''; const r = N.ping(net, 'pc1', '192.168.2.10'); ok(!r.success); ok(/PC2 cannot reach 192.168.1.10/.test(r.reason), r.reason); });
test('VLAN isolation on access ports', () => { const net = lan2(); net.devices.sw1.ports['Fa0/2'].vlan = 20; const r = N.ping(net, 'pc1', '192.168.1.20'); ok(!r.success); eq(r.status, 'arp-fail'); ok(N.diagnose(net).some(i => /different VLANs/.test(i.msg)), 'diagnose vlan mismatch'); });
test('router on a stick inter-VLAN routing', () => {
  const net = N.createNetwork();
  N.addDevice(net, 'pc', { id: 'pc1', name: 'PC1', interfaces: { eth0: { ip: '192.168.10.10/24' } }, gateway: '192.168.10.1' });
  N.addDevice(net, 'pc', { id: 'pc2', name: 'PC2', interfaces: { eth0: { ip: '192.168.20.10/24' } }, gateway: '192.168.20.1' });
  N.addDevice(net, 'switch', { id: 'sw1', ports: { 'Fa0/1': { vlan: 10 }, 'Fa0/2': { vlan: 20 }, 'Fa0/8': { mode: 'trunk' } } });
  const r1 = N.addDevice(net, 'router', { id: 'r1', name: 'R1' });
  N.addSubInterface(net, 'r1', 'G0/0', 10); N.addSubInterface(net, 'r1', 'G0/0', 20);
  N.setInterface(net, 'r1', 'G0/0.10', { ip: '192.168.10.1', mask: '255.255.255.0' }); N.setInterface(net, 'r1', 'G0/0.20', { ip: '192.168.20.1/24' });
  N.connect(net, 'pc1', 'eth0', 'sw1', 'Fa0/1'); N.connect(net, 'pc2', 'eth0', 'sw1', 'Fa0/2'); N.connect(net, 'sw1', 'Fa0/8', 'r1', 'G0/0');
  const r = N.ping(net, 'pc1', '192.168.20.10'); ok(r.success, r.reason);
  net.devices.sw1.ports['Fa0/8'].mode = 'access'; ok(!N.ping(net, 'pc1', '192.168.20.10').success, 'fails when trunk removed');
});
function withInternet(nat) {
  const net = N.createNetwork();
  N.addDevice(net, 'pc', { id: 'pc1', name: 'PC1', interfaces: { eth0: { ip: '192.168.1.10/24' } }, gateway: '192.168.1.1', dns: '192.168.1.2' });
  N.addDevice(net, 'server', { id: 'srv', name: 'DNS1', interfaces: { eth0: { ip: '192.168.1.2/24' } }, gateway: '192.168.1.1', services: { dns: { records: { 'www.corp.local': '192.168.1.20', 'intranet.corp.local': '192.168.1.20' }, forwarder: '8.8.8.8' }, http: { port: 80, banner: 'Apache/2.4.57', content: '<h1>Intranet</h1>' }, ssh: { banner: 'OpenSSH 9.2' } } });
  N.addDevice(net, 'router', { id: 'r1', name: 'R1', interfaces: { 'G0/0': { ip: '203.0.113.2/30' }, 'G0/1': { ip: '192.168.1.1/24' } }, routes: [{ dest: '0.0.0.0', mask: '0.0.0.0', via: '203.0.113.1' }], nat: nat ? { inside: ['G0/1'], outside: 'G0/0' } : null });
  N.addDevice(net, 'internet', { id: 'inet', interfaces: { wan1: { ip: '203.0.113.1/30' } } });
  N.addDevice(net, 'switch', { id: 'sw1' });
  N.connect(net, 'pc1', 'eth0', 'sw1', 'Fa0/1'); N.connect(net, 'srv', 'eth0', 'sw1', 'Fa0/2'); N.connect(net, 'sw1', 'Fa0/8', 'r1', 'G0/1'); N.connect(net, 'r1', 'G0/0', 'inet', 'wan1');
  return net;
}
test('NAT required to reach the Internet', () => { const noNat = withInternet(false); const r = N.ping(noNat, 'pc1', '8.8.8.8'); ok(!r.success); ok(/private/.test(r.reason), r.reason); const nat = withInternet(true); const r2 = N.ping(nat, 'pc1', '8.8.8.8'); ok(r2.success, r2.reason); ok(r2.trace.some(t => /NAT: translated source/.test(t.text || ''))); ok(r2.rtt > 30, 'internet latency ' + r2.rtt); });
test('DNS resolution local + forwarding', () => { const net = withInternet(true); const a = N.resolve(net, 'pc1', 'www.corp.local'); ok(a.ok && a.ip === '192.168.1.20', JSON.stringify(a)); const b = N.resolve(net, 'pc1', 'www.google.com'); ok(b.ok && b.ip === '142.250.74.46', JSON.stringify(b)); const c = N.resolve(net, 'pc1', 'nope.invalid'); ok(!c.ok && c.rcode === 'NXDOMAIN', JSON.stringify(c)); net.devices.pc1.dns = '192.168.1.99'; net.devices.pc1.dnsCache = {}; const d = N.resolve(net, 'pc1', 'www.corp.local'); ok(!d.ok && /did not respond/.test(d.reason), d.reason); });
test('ping by name uses DNS, service stopped gives SERVFAIL path', () => { const net = withInternet(true); ok(N.ping(net, 'pc1', 'www.google.com').success); net.devices.srv.services.dns.enabled = false; net.devices.pc1.dnsCache = {}; const r = N.ping(net, 'pc1', 'www.google.com'); ok(!r.success && r.status === 'dns-fail', r.reason); });
test('tcp connect open/closed/filtered + port scan', () => { const net = withInternet(true); eq(N.tcpConnect(net, 'pc1', '192.168.1.2', 80).status, 'open'); eq(N.tcpConnect(net, 'pc1', '192.168.1.2', 81).status, 'closed'); const scan = N.portScan(net, 'pc1', '192.168.1.2', [21, 22, 80, 443]); eq(scan.results.map(r => r.state), ['closed', 'open', 'open', 'closed']); eq(scan.results[1].banner, 'OpenSSH 9.2'); net.devices.srv.host = { firewall: { enabled: true, allowPorts: [80] } }; eq(N.tcpConnect(net, 'pc1', '192.168.1.2', 22).status, 'filtered'); eq(N.tcpConnect(net, 'pc1', 'www.example.com', 80).status, 'open'); });
test('DHCP lease and APIPA fallback', () => {
  const net = withInternet(true);
  net.devices.srv.services.dhcp = { pools: [{ network: '192.168.1.0', mask: '255.255.255.0', start: '192.168.1.100', end: '192.168.1.110', gateway: '192.168.1.1', dns: '192.168.1.2', excluded: ['192.168.1.100'] }] };
  N.addDevice(net, 'pc', { id: 'pc9', name: 'PC9', interfaces: { eth0: { mode: 'dhcp' } } }); N.connect(net, 'pc9', 'eth0', 'sw1', 'Fa0/3');
  const r = N.dhcpRequest(net, 'pc9', 'eth0'); ok(r.ok, r.reason); eq(r.ip, '192.168.1.101'); eq(net.devices.pc9.gateway, '192.168.1.1'); ok(N.ping(net, 'pc9', '8.8.8.8').success);
  net.devices.srv.services.dhcp.enabled = false; const r2 = N.dhcpRequest(net, 'pc9', 'eth0'); ok(!r2.ok); ok(S.isAPIPA(net.devices.pc9.interfaces.eth0.ip));
});
test('rogue DHCP wins when faster', () => { const net = withInternet(true); net.devices.srv.services.dhcp = { pools: [{ network: '192.168.1.0', mask: '255.255.255.0', start: '192.168.1.100', end: '192.168.1.110', gateway: '192.168.1.1', dns: '192.168.1.2' }], latency: 10 }; N.addDevice(net, 'pc', { id: 'rogue', name: 'Rogue', interfaces: { eth0: { ip: '192.168.1.66/24' } }, services: { dhcp: { rogue: true, latency: 1, pools: [{ network: '192.168.1.0', mask: '255.255.255.0', start: '192.168.1.200', end: '192.168.1.210', gateway: '192.168.1.66', dns: '192.168.1.66' }] } } }); N.connect(net, 'rogue', 'eth0', 'sw1', 'Fa0/4'); N.addDevice(net, 'pc', { id: 'pc9', interfaces: { eth0: { mode: 'dhcp' } } }); N.connect(net, 'pc9', 'eth0', 'sw1', 'Fa0/5'); const r = N.dhcpRequest(net, 'pc9', 'eth0'); ok(r.rogue && r.ip === '192.168.1.200'); });
test('firewall default deny, allow rule, stateful replies', () => {
  const net = N.createNetwork();
  N.addDevice(net, 'pc', { id: 'pc1', interfaces: { eth0: { ip: '10.0.0.10/24' } }, gateway: '10.0.0.1' });
  N.addDevice(net, 'server', { id: 'web', interfaces: { eth0: { ip: '172.16.0.10/24' } }, gateway: '172.16.0.1', services: { http: {} } });
  N.addDevice(net, 'firewall', { id: 'fw', name: 'FW', interfaces: { lan: { ip: '10.0.0.1/24' }, dmz: { ip: '172.16.0.1/24' } } });
  N.connect(net, 'pc1', 'eth0', 'fw', 'lan'); N.connect(net, 'web', 'eth0', 'fw', 'dmz');
  const r = N.ping(net, 'pc1', '172.16.0.10'); ok(!r.success && /default policy is DENY/.test(r.reason), r.reason);
  net.devices.fw.rules.push({ action: 'allow', from: 'lan', to: 'dmz', proto: 'tcp', port: 80, desc: 'LAN to web' });
  ok(!N.ping(net, 'pc1', '172.16.0.10').success, 'icmp still denied');
  eq(N.tcpConnect(net, 'pc1', '172.16.0.10', 80).status, 'open');
  eq(N.tcpConnect(net, 'pc1', '172.16.0.10', 22).status, 'filtered');
  eq(N.tcpConnect(net, 'web', '10.0.0.10', 80).status, 'filtered', 'dmz cannot initiate to lan');
});
test('router ACL denies subnet', () => { const net = routed(); net.devices.r1.acls.BLOCK = [{ action: 'deny', proto: 'icmp', src: '192.168.1.0/24', dst: '192.168.2.0/24' }, { action: 'permit', proto: 'ip', src: 'any', dst: 'any' }]; net.devices.r1.interfaces['G0/0'].acl.in = 'BLOCK'; const r = N.ping(net, 'pc1', '192.168.2.10'); ok(!r.success && /ACL BLOCK/.test(r.reason), r.reason); eq(N.tcpConnect(net, 'pc1', '192.168.2.10', 80).status, 'closed', 'tcp permitted, port closed'); });
test('two routers with static routes; missing return route', () => {
  const net = N.createNetwork();
  N.addDevice(net, 'pc', { id: 'pc1', interfaces: { eth0: { ip: '192.168.1.10/24' } }, gateway: '192.168.1.1' });
  N.addDevice(net, 'pc', { id: 'pc2', interfaces: { eth0: { ip: '192.168.3.10/24' } }, gateway: '192.168.3.1' });
  N.addDevice(net, 'router', { id: 'r1', name: 'R1', interfaces: { 'G0/0': { ip: '192.168.1.1/24' }, 'G0/1': { ip: '10.0.0.1/30' } }, routes: [{ dest: '192.168.3.0', mask: '255.255.255.0', via: '10.0.0.2' }] });
  N.addDevice(net, 'router', { id: 'r2', name: 'R2', interfaces: { 'G0/0': { ip: '192.168.3.1/24' }, 'G0/1': { ip: '10.0.0.2/30' } } });
  N.connect(net, 'pc1', 'eth0', 'r1', 'G0/0'); N.connect(net, 'r1', 'G0/1', 'r2', 'G0/1'); N.connect(net, 'pc2', 'eth0', 'r2', 'G0/0');
  const r = N.ping(net, 'pc1', '192.168.3.10'); ok(!r.success && /R2 cannot reach 192.168.1.10/.test(r.reason), r.reason);
  ok(!N.addRoute(net, 'r2', '192.168.1.0/24', null, '10.0.0.1').error); ok(N.ping(net, 'pc1', '192.168.3.10').success);
  const t = N.traceroute(net, 'pc1', '192.168.3.10'); eq(t.hops.map(h => h.ip), ['192.168.1.1', '10.0.0.2', '192.168.3.10']);
  ok(N.addRoute(net, 'r2', '192.168.1.0/24', null, '10.0.0.9').ok); ok(N.diagnose(net).some(i => /next hop is not on a connected subnet/.test(i.msg)));
});
test('ttl expiry returns time-exceeded', () => { const net = routed(); const r = N.ping(net, 'pc1', '192.168.2.10', { ttl: 1 }); eq(r.status, 'time-exceeded'); eq(r.from, '192.168.1.1'); });
test('diagnose duplicate IP and bad mask', () => { const net = lan2(); N.setInterface(net, 'pc2', 'eth0', { ip: '192.168.1.10' }); ok(N.diagnose(net).some(i => /Duplicate IP/.test(i.msg))); eq(N.setInterface(net, 'pc2', 'eth0', { mask: '255.255.0.255' }).error.length > 0, true); eq(N.setInterface(net, 'pc2', 'eth0', { ip: '192.168.1.256' }).error.length > 0, true); });
test('wireless association requires matching SSID/PSK', () => { const net = N.createNetwork(); N.addDevice(net, 'ap', { id: 'ap1', wifi: { ssid: 'Office', psk: 'secret123', security: 'wpa2' } }); N.addDevice(net, 'laptop', { id: 'lt', wifi: { ssid: 'Office', psk: 'wrong' }, interfaces: { wlan0: { ip: '192.168.1.50/24' } } }); N.addDevice(net, 'pc', { id: 'pc1', interfaces: { eth0: { ip: '192.168.1.10/24' } } }); ok(N.connect(net, 'lt', 'wlan0', 'ap1', 'wlan1').error); net.devices.lt.wifi.psk = 'secret123'; ok(!N.connect(net, 'lt', 'wlan0', 'ap1', 'wlan1').error); N.connect(net, 'pc1', 'eth0', 'ap1', 'eth0'); ok(N.ping(net, 'lt', '192.168.1.10').success); });
test('hub floods and works', () => { const net = N.createNetwork(); N.addDevice(net, 'pc', { id: 'a', interfaces: { eth0: { ip: '10.0.0.1/24' } } }); N.addDevice(net, 'pc', { id: 'b', interfaces: { eth0: { ip: '10.0.0.2/24' } } }); N.addDevice(net, 'hub', { id: 'h' }); N.connect(net, 'a', 'eth0', 'h', 'P1'); N.connect(net, 'b', 'eth0', 'h', 'P2'); ok(N.ping(net, 'a', '10.0.0.2').success); });
test('serialize round trip keeps behaviour', () => { const net = routed(); const copy = N.deserialize(N.serialize(net)); ok(N.ping(copy, 'pc1', '192.168.2.10').success); });
test('build() from scenario definition', () => { const net = N.build({ devices: [{ type: 'pc', id: 'a', interfaces: { eth0: { ip: '10.0.0.1/24' } } }, { type: 'pc', id: 'b', interfaces: { eth0: { ip: '10.0.0.2/24' } } }], links: [['a', 'eth0', 'b', 'eth0']] }); ok(N.ping(net, 'a', '10.0.0.2').success); });

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
