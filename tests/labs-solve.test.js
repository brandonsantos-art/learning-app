/* Solve-test: apply the intended solution to each netsim/troubleshoot lab and
 * confirm every objective becomes satisfiable. Run: node tests/labs-solve.test.js */
'use strict';
const path = require('path');
globalThis.window = globalThis; globalThis.NSA = {};
['js/core/util.js', 'js/engines/subnet.js', 'js/engines/netsim.js', 'js/engines/ios.js',
 'js/engines/terminal-fs.js', 'js/engines/terminal-net.js', 'js/engines/terminal-win.js', 'js/engines/terminal.js']
  .forEach(f => require(path.join(__dirname, '..', f)));
['labs-netsim', 'labs-terminal', 'labs-security', 'labs-troubleshoot', 'missions'].forEach(f => require(path.join(__dirname, '..', 'js/data', f + '.js')));
const N = NSA.netsim, S = NSA.subnet;
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) pass++; else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } }
function build(lab) { return N.build(lab.scenario()); }
function allObj(net, lab) { return lab.objectives.map(o => { try { return !!o.check(net); } catch (e) { return 'ERR:' + e.message; } }); }
function solved(net, lab, skipIds) { return lab.objectives.every(o => (skipIds || []).includes(o.id) || o.manual || o.check(net)); }
function D(net, name) { return N.findByName(net, name); }
function cli(net, id) { return NSA.terminal.createSession({ net, devId: id }); }
function runIos(net, id, cmds) { const s = cli(net, id); cmds.forEach(c => s.run(c)); return s; }

// sim-01: cable PC1 and PC2 to switch
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-01-first-lan'); const net = build(lab);
  N.connect(net, D(net, 'PC1').id, 'eth0', D(net, 'SW1').id, 'Fa0/1');
  N.connect(net, D(net, 'PC2').id, 'eth0', D(net, 'SW1').id, 'Fa0/2');
  ok('sim-01 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-02: addresses already? no — assign
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-02-ip-config'); const net = build(lab);
  N.setInterface(net, D(net, 'PC1').id, 'eth0', { ip: '192.168.10.1', mask: '255.255.255.0' });
  N.setInterface(net, D(net, 'PC2').id, 'eth0', { ip: '192.168.10.2', mask: '255.255.255.0' });
  N.setInterface(net, D(net, 'PC3').id, 'eth0', { ip: '192.168.10.3', mask: '255.255.255.0' });
  ok('sim-02 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-04: DHCP renew clients
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-04-dhcp'); const net = build(lab);
  N.dhcpRequest(net, D(net, 'PC1').id, 'eth0'); N.dhcpRequest(net, D(net, 'PC2').id, 'eth0');
  ok('sim-04 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-06: wifi associate
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-06-wifi'); const net = build(lab);
  const lt = D(net, 'Laptop'); lt.wifi.ssid = 'NetSec-Office'; lt.wifi.psk = 'Secure#2026';
  const r = N.connect(net, lt.id, 'wlan0', D(net, 'AP1').id, 'wlan1');
  ok('sim-06 associate', !r.error, r.error); ok('sim-06 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-08: VLANs + router-on-a-stick via CLI
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-08-vlans'); const net = build(lab);
  runIos(net, D(net, 'SW1').id, ['enable', 'conf t', 'vlan 10', 'name Sales', 'vlan 20', 'name Eng', 'exit',
    'interface fa0/1', 'switchport mode access', 'switchport access vlan 10', 'exit',
    'interface fa0/2', 'switchport mode access', 'switchport access vlan 20', 'exit',
    'interface fa0/24', 'switchport mode trunk', 'end']);
  runIos(net, D(net, 'R1').id, ['enable', 'conf t', 'interface g0/0', 'no shutdown', 'exit',
    'interface g0/0.10', 'encapsulation dot1Q 10', 'ip address 192.168.10.1 255.255.255.0', 'exit',
    'interface g0/0.20', 'encapsulation dot1Q 20', 'ip address 192.168.20.1 255.255.255.0', 'end']);
  ok('sim-08 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-09: static routes
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-09-static-routes'); const net = build(lab);
  N.addRoute(net, D(net, 'R1').id, '192.168.2.0', '255.255.255.0', '10.0.0.2');
  N.addRoute(net, D(net, 'R2').id, '192.168.1.0', '255.255.255.0', '10.0.0.1');
  ok('sim-09 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-10: NAT via CLI
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-10-nat'); const net = build(lab);
  runIos(net, D(net, 'R1').id, ['enable', 'conf t', 'interface g0/1', 'ip nat inside', 'exit',
    'interface g0/0', 'ip nat outside', 'exit', 'access-list 1 permit 192.168.1.0 0.0.0.255',
    'ip nat inside source list 1 interface g0/0 overload', 'end']);
  ok('sim-10 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-11: ACL
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-11-acl'); const net = build(lab);
  runIos(net, D(net, 'R1').id, ['enable', 'conf t', 'ip access-list extended GUEST',
    'deny ip 192.168.30.0 0.0.0.255 192.168.1.0 0.0.0.255', 'permit ip any any', 'exit',
    'interface g0/0', 'ip access-group GUEST in', 'end']);
  ok('sim-11 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-12: firewall DMZ
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-12-firewall-dmz'); const net = build(lab);
  const fw = D(net, 'FW'); fw.rules.push({ action: 'allow', from: 'lan', to: 'dmz', proto: 'tcp', port: 80, desc: 'LAN to web' });
  fw.rules.push({ action: 'allow', from: 'lan', to: 'dmz', proto: 'tcp', port: 443 });
  fw.rules.push({ action: 'allow', from: 'lan', to: 'wan', proto: 'any', desc: 'LAN out' });
  ok('sim-12 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-13: freeform enterprise — build a minimal valid one
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-13-enterprise'); const net = build(lab);
  N.addDevice(net, 'pc', { id: 'a', name: 'A', interfaces: { eth0: { ip: '192.168.10.10/24' } }, gateway: '192.168.10.1' });
  N.addDevice(net, 'pc', { id: 'b', name: 'B', interfaces: { eth0: { ip: '192.168.20.10/24' } }, gateway: '192.168.20.1' });
  N.addDevice(net, 'router', { id: 'r', name: 'R', interfaces: { 'G0/0': { ip: '192.168.10.1/24' }, 'G0/1': { ip: '192.168.20.1/24' }, 'G0/2': { ip: '203.0.113.2/30' } }, routes: [{ dest: '0.0.0.0', mask: '0.0.0.0', via: '203.0.113.1' }], nat: { inside: ['G0/0', 'G0/1'], outside: 'G0/2' } });
  N.connect(net, 'a', 'eth0', 'r', 'G0/0'); N.connect(net, 'b', 'eth0', 'r', 'G0/1');
  N.connect(net, 'r', 'G0/2', D(net, 'Internet').id, 'wan1');
  ok('sim-13 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-14: VLSM
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-14-vlsm-design'); const net = build(lab);
  N.setInterface(net, D(net, 'Dept-A').id, 'eth0', { ip: '192.168.50.2', mask: '255.255.255.192' }); D(net, 'Dept-A').gateway = '192.168.50.1';
  N.setInterface(net, D(net, 'Dept-B').id, 'eth0', { ip: '192.168.50.66', mask: '255.255.255.224' }); D(net, 'Dept-B').gateway = '192.168.50.65';
  N.setInterface(net, D(net, 'Dept-C').id, 'eth0', { ip: '192.168.50.98', mask: '255.255.255.240' }); D(net, 'Dept-C').gateway = '192.168.50.97';
  N.setInterface(net, D(net, 'R1').id, 'G0/0', { ip: '192.168.50.1', mask: '255.255.255.192' });
  N.setInterface(net, D(net, 'R1').id, 'G0/1', { ip: '192.168.50.65', mask: '255.255.255.224' });
  N.setInterface(net, D(net, 'R1').id, 'G0/2', { ip: '192.168.50.97', mask: '255.255.255.240' });
  ok('sim-14 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// sim-15: OSPF-equivalent static routes
(() => { const lab = NSA.data.labs.netsim.find(l => l.id === 'sim-15-ospf'); const net = build(lab);
  const r1 = D(net, 'R1').id, r2 = D(net, 'R2').id, r3 = D(net, 'R3').id;
  N.addRoute(net, r1, '192.168.2.0', '255.255.255.0', '10.0.12.2'); N.addRoute(net, r1, '192.168.3.0', '255.255.255.0', '10.0.13.2');
  N.addRoute(net, r2, '192.168.1.0', '255.255.255.0', '10.0.12.1'); N.addRoute(net, r2, '192.168.3.0', '255.255.255.0', '10.0.23.2');
  N.addRoute(net, r3, '192.168.1.0', '255.255.255.0', '10.0.13.1'); N.addRoute(net, r3, '192.168.2.0', '255.255.255.0', '10.0.23.1');
  ok('sim-15 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// ts-01: fix gateway
(() => { const lab = NSA.data.labs.troubleshoot.find(l => l.id === 'ts-01-no-internet'); const net = build(lab);
  D(net, 'PC1').gateway = '192.168.1.1'; D(net, 'PC1').arp = {};
  ok('ts-01 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// ts-02: enable DHCP + renew
(() => { const lab = NSA.data.labs.troubleshoot.find(l => l.id === 'ts-02-wrong-ip'); const net = build(lab);
  D(net, 'DHCP-SRV').services.dhcp.enabled = true; N.dhcpRequest(net, D(net, 'PC1').id, 'eth0');
  ok('ts-02 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// ts-03: start DNS
(() => { const lab = NSA.data.labs.troubleshoot.find(l => l.id === 'ts-03-dns'); const net = build(lab);
  D(net, 'srv1').services.dns.enabled = true; D(net, 'PC1').dnsCache = {};
  ok('ts-03 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// ts-04: trunk the switch port
(() => { const lab = NSA.data.labs.troubleshoot.find(l => l.id === 'ts-04-vlans'); const net = build(lab);
  D(net, 'SW1').ports['Fa0/24'].mode = 'trunk';
  ok('ts-04 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// ts-05: diagnostic only (manual objective) — just confirm it builds
(() => { const lab = NSA.data.labs.troubleshoot.find(l => l.id === 'ts-05-slow-network'); const net = build(lab);
  ok('ts-05 builds', !!net && lab.objectives[0].manual, 'manual diag lab'); })();

// ts-06: remove rogue DHCP, renew
(() => { const lab = NSA.data.labs.troubleshoot.find(l => l.id === 'ts-06-suspicious-device'); const net = build(lab);
  const rogue = D(net, 'ROGUE'); N.removeDevice(net, rogue.id);
  N.dhcpRequest(net, D(net, 'PC1').id, 'eth0');
  ok('ts-06 solvable', solved(net, lab), JSON.stringify(allObj(net, lab))); })();

// Terminal labs: run the hint commands and confirm tasks complete
function solveTerm(id, cmds, skip) {
  const lab = NSA.data.labs.terminal.find(l => l.id === id);
  const scen = lab.scenario ? lab.scenario() : { devices: [{ type: 'server', id: lab.device, name: 'host' }], links: [] };
  const net = N.build(scen); const dev = net.devices[lab.device];
  if (lab.setupHost) dev.host = Object.assign({}, dev.host || {}, lab.setupHost);
  const s = NSA.terminal.createSession({ net, devId: lab.device });
  cmds.forEach(c => s.run(c));
  const done = lab.tasks.every(t => (skip || []).includes(t.id) || t.check(s));
  ok('term ' + id + ' solvable', done, JSON.stringify(lab.tasks.map(t => { try { return t.id + ':' + !!t.check(s); } catch (e) { return t.id + ':ERR'; } })));
}
solveTerm('term-01-ipconfig', ['ipconfig /all', 'ping 192.168.1.1', 'nslookup www.corp.local', 'arp -a']);
solveTerm('term-02-ping-tracert', ['ping 8.8.8.8', 'tracert www.google.com', 'arp -a', 'Test-NetConnection www.corp.local -Port 443']);
solveTerm('term-06-ports-services', ['ss -tuln', 'curl http://localhost/', 'systemctl status apache2', 'cat /etc/resolv.conf']);
solveTerm('term-09-permissions', ['sudo groupadd project', 'sudo useradd -m dev1', 'sudo usermod -aG project dev1', 'sudo chgrp project /srv/project', 'sudo chmod 770 /srv/project']);
solveTerm('term-10-logs', ['sudo journalctl -u ssh', 'grep "Failed password" /var/log/auth.log', 'grep Accepted /var/log/auth.log', 'grep sudo /var/log/auth.log']);
solveTerm('term-11-nmap', ['nmap -sn 192.168.1.0/24', 'nmap 192.168.1.2', 'nmap -sV 192.168.1.2']);
solveTerm('term-12-windows-netsh', ['nslookup www.corp.local', 'ipconfig /all', 'netsh interface ip set dns "Ethernet0" static 192.168.1.2', 'ipconfig /flushdns', 'nslookup www.corp.local']);
solveTerm('term-16-hardening', ['sudo ufw default deny incoming', 'sudo ufw allow 22/tcp', 'sudo ufw allow 80/tcp', 'sudo ufw enable', 'cat /etc/ssh/sshd_config']);
solveTerm('term-14-ios-vlans', ['enable', 'conf t', 'vlan 10', 'name Sales', 'exit', 'vlan 20', 'name Eng', 'exit', 'interface fa0/1', 'switchport mode access', 'switchport access vlan 10', 'exit', 'interface fa0/8', 'switchport mode trunk', 'do show vlan brief']);
solveTerm('term-15-ios-acl-nat', ['enable', 'conf t', 'interface g0/1', 'ip nat inside', 'exit', 'interface g0/0', 'ip nat outside', 'exit', 'access-list 1 permit 192.168.1.0 0.0.0.255', 'ip nat inside source list 1 interface g0/0 overload', 'ip access-list extended NO-TELNET', 'deny tcp any any eq 23', 'permit ip any any', 'exit', 'interface g0/0', 'ip access-group NO-TELNET out', 'end', 'write memory']);
solveTerm('term-17-python', ['ls scripts', 'cat scripts/push_ntp.py', 'cat scripts/audit_leases.py']);

console.log('\n' + pass + ' solved, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
