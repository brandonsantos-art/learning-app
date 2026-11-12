/* NetSec Academy – Network Simulator lab definitions.
 * Each lab: id, title, level, skills, brief, build() -> scenario def for netsim.build,
 * objectives[] each with check(net) -> bool, hints[], and optional starter guidance.
 */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.labs = NSA.data.labs || {};
  const N = () => NSA.netsim; const S = () => NSA.subnet;
  const labs = [];
  function pingOk(net, a, b) { try { return N().ping(net, a, b).success; } catch (e) { return false; } }
  function dev(net, name) { return N().findByName(net, name); }
  function ipOf(net, name, iface) { const d = dev(net, name); if (!d) return null; iface = iface || Object.keys(d.interfaces || {})[0]; return d.interfaces[iface] ? d.interfaces[iface].ip : null; }

  labs.push({ id: 'sim-01-first-lan', title: 'Build Your First LAN', level: 1, xp: 80, skills: { networking: 3 }, est: 10,
    brief: 'Connect two PCs through a switch and get them talking. This is the "hello world" of networking.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'PC1', x: 120, y: 120, interfaces: { eth0: { ip: '192.168.1.10', mask: '255.255.255.0' } } },
      { type: 'pc', id: 'pc2', name: 'PC2', x: 120, y: 320, interfaces: { eth0: { ip: '192.168.1.20', mask: '255.255.255.0' } } },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 420, y: 220 }
    ], links: [] }),
    objectives: [
      { id: 'o1', text: 'Connect PC1 to SW1 with a cable', check: n => !!N().linkAt(n, dev(n, 'PC1').id, 'eth0') },
      { id: 'o2', text: 'Connect PC2 to SW1 with a cable', check: n => !!N().linkAt(n, dev(n, 'PC2').id, 'eth0') },
      { id: 'o3', text: 'Successfully ping PC2 from PC1', check: n => pingOk(n, dev(n, 'PC1').id, '192.168.1.20') }
    ],
    hints: ['Use the Cable tool: click PC1\'s eth0 port, then a free port on SW1.', 'Both PCs are already in 192.168.1.0/24, so they can talk directly once cabled.', 'Open PC1\'s console and run ping 192.168.1.20, or use the Ping tool.'] });

  labs.push({ id: 'sim-02-ip-config', title: 'Configure IP Addresses', level: 1, xp: 90, skills: { networking: 4 }, est: 12, prereqs: ['sim-01-first-lan'],
    brief: 'Three PCs are cabled to a switch but have no addresses. Put them all in 192.168.10.0/24 and get full connectivity.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'PC1', x: 120, y: 100, interfaces: { eth0: { ip: '', mask: '' } } },
      { type: 'pc', id: 'pc2', name: 'PC2', x: 120, y: 240, interfaces: { eth0: { ip: '', mask: '' } } },
      { type: 'pc', id: 'pc3', name: 'PC3', x: 120, y: 380, interfaces: { eth0: { ip: '', mask: '' } } },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 440, y: 240 }
    ], links: [['pc1', 'eth0', 'sw1', 'Fa0/1'], ['pc2', 'eth0', 'sw1', 'Fa0/2'], ['pc3', 'eth0', 'sw1', 'Fa0/3']] }),
    objectives: [
      { id: 'o1', text: 'Give each PC a valid, unique address in 192.168.10.0/24 with mask 255.255.255.0', check: n => { const ok = ['PC1', 'PC2', 'PC3'].map(nm => ipOf(n, nm)); const valid = ok.every(ip => ip && S().inSubnet(ip, '192.168.10.0', 24) && S().isUsableHost(ip, 24)); const uniq = new Set(ok).size === 3; return valid && uniq; } },
      { id: 'o2', text: 'PC1 can ping PC2', check: n => pingOk(n, dev(n, 'PC1').id, ipOf(n, 'PC2') || 'x') },
      { id: 'o3', text: 'PC1 can ping PC3', check: n => pingOk(n, dev(n, 'PC1').id, ipOf(n, 'PC3') || 'x') }
    ],
    hints: ['Select a PC and use the Config panel to set its IP and mask.', 'Valid host addresses are 192.168.10.1 to 192.168.10.254 — avoid .0 (network) and .255 (broadcast).', 'Give each PC a different address, all with mask 255.255.255.0.'] });

  labs.push({ id: 'sim-04-dhcp', title: 'Set Up a DHCP Server', level: 1, xp: 100, skills: { networking: 3, netadmin: 2 }, est: 15, prereqs: ['sim-02-ip-config'],
    brief: 'A server will hand out addresses automatically. Enable its DHCP pool, then set the client PCs to DHCP and watch them get leases.',
    scenario: () => ({ devices: [
      { type: 'server', id: 'srv', name: 'DHCP-SRV', x: 120, y: 120, interfaces: { eth0: { ip: '192.168.1.2', mask: '255.255.255.0' } }, gateway: '192.168.1.1', services: { dhcp: { enabled: true, pools: [{ network: '192.168.1.0', mask: '255.255.255.0', start: '192.168.1.100', end: '192.168.1.150', gateway: '192.168.1.1', dns: '192.168.1.2' }] } } },
      { type: 'pc', id: 'pc1', name: 'PC1', x: 120, y: 300, interfaces: { eth0: { mode: 'dhcp' } } },
      { type: 'pc', id: 'pc2', name: 'PC2', x: 120, y: 420, interfaces: { eth0: { mode: 'dhcp' } } },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 440, y: 260 }
    ], links: [['srv', 'eth0', 'sw1', 'Fa0/8'], ['pc1', 'eth0', 'sw1', 'Fa0/1'], ['pc2', 'eth0', 'sw1', 'Fa0/2']] }),
    objectives: [
      { id: 'o1', text: 'PC1 obtains a DHCP lease in 192.168.1.100-150', check: n => { const ip = ipOf(n, 'PC1'); return ip && S().parseIPv4(ip) >= S().parseIPv4('192.168.1.100') && S().parseIPv4(ip) <= S().parseIPv4('192.168.1.150'); } },
      { id: 'o2', text: 'PC2 obtains a DHCP lease', check: n => { const ip = ipOf(n, 'PC2'); return ip && S().parseIPv4(ip) >= S().parseIPv4('192.168.1.100') && S().parseIPv4(ip) <= S().parseIPv4('192.168.1.150'); } },
      { id: 'o3', text: 'PC1 can ping the server at 192.168.1.2', check: n => pingOk(n, dev(n, 'PC1').id, '192.168.1.2') }
    ],
    hints: ['Select each client PC and press "DHCP renew" in the config panel (or set the interface to DHCP mode).', 'The server already has a pool configured; the clients just need to request a lease.', 'If a PC shows 169.254.x.x it never reached the server — check the cabling.'] });

  labs.push({ id: 'sim-06-wifi', title: 'Secure Wireless Connection', level: 1, xp: 90, skills: { networking: 3, security: 1 }, est: 12,
    brief: 'Associate a laptop with the access point using the correct SSID and passphrase, then reach the wired PC.',
    scenario: () => ({ devices: [
      { type: 'ap', id: 'ap1', name: 'AP1', x: 420, y: 160, wifi: { ssid: 'NetSec-Office', psk: 'Secure#2026', security: 'wpa2' }, interfaces: { eth0: { ip: '', mask: '' } } },
      { type: 'laptop', id: 'lt', name: 'Laptop', x: 120, y: 160, wifi: { ssid: '', psk: '' }, interfaces: { wlan0: { ip: '192.168.1.50', mask: '255.255.255.0' } } },
      { type: 'pc', id: 'pc1', name: 'PC1', x: 120, y: 360, interfaces: { eth0: { ip: '192.168.1.10', mask: '255.255.255.0' } } },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 620, y: 300 }
    ], links: [['pc1', 'eth0', 'sw1', 'Fa0/1'], ['ap1', 'eth0', 'sw1', 'Fa0/2']] }),
    objectives: [
      { id: 'o1', text: 'Set the laptop Wi-Fi SSID and passphrase to match AP1, then associate', check: n => !!N().linkAt(n, dev(n, 'Laptop').id, 'wlan0') },
      { id: 'o2', text: 'Laptop can ping the wired PC1 (192.168.1.10)', check: n => pingOk(n, dev(n, 'Laptop').id, '192.168.1.10') }
    ],
    hints: ['Select the AP to read its SSID (NetSec-Office) and security — the passphrase is Secure#2026.', 'Select the Laptop, set its Wi-Fi SSID and passphrase to match, then use the Cable/associate tool from wlan0 to a wlan port on the AP.', 'A wrong passphrase or SSID makes association fail — the error tells you which.'] });

  labs.push({ id: 'sim-08-vlans', title: 'VLANs and Inter-VLAN Routing', level: 2, xp: 140, skills: { netadmin: 5 }, est: 25, prereqs: ['sim-02-ip-config'],
    brief: 'Separate Sales (VLAN 10) and Engineering (VLAN 20) on the switch, trunk to the router, and configure router-on-a-stick so the two VLANs can reach each other through R1.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'Sales-PC', x: 110, y: 100, interfaces: { eth0: { ip: '192.168.10.10', mask: '255.255.255.0' } }, gateway: '192.168.10.1' },
      { type: 'pc', id: 'pc2', name: 'Eng-PC', x: 110, y: 320, interfaces: { eth0: { ip: '192.168.20.10', mask: '255.255.255.0' } }, gateway: '192.168.20.1' },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 420, y: 210 },
      { type: 'router', id: 'r1', name: 'R1', x: 700, y: 210 }
    ], links: [['pc1', 'eth0', 'sw1', 'Fa0/1'], ['pc2', 'eth0', 'sw1', 'Fa0/2'], ['sw1', 'Fa0/24', 'r1', 'G0/0']] }),
    objectives: [
      { id: 'o1', text: 'SW1 Fa0/1 in VLAN 10, Fa0/2 in VLAN 20', check: n => { const s = dev(n, 'SW1'); return s.ports['Fa0/1'].vlan === 10 && s.ports['Fa0/2'].vlan === 20; } },
      { id: 'o2', text: 'SW1 Fa0/24 configured as a trunk', check: n => dev(n, 'SW1').ports['Fa0/24'].mode === 'trunk' },
      { id: 'o3', text: 'R1 has sub-interfaces G0/0.10 (192.168.10.1) and G0/0.20 (192.168.20.1) with dot1Q encapsulation', check: n => { const r = dev(n, 'R1'); const a = r.interfaces['G0/0.10'], b = r.interfaces['G0/0.20']; return a && a.ip === '192.168.10.1' && Number(a.vlan) === 10 && b && b.ip === '192.168.20.1' && Number(b.vlan) === 20; } },
      { id: 'o4', text: 'Sales-PC can ping Eng-PC across the VLANs', check: n => pingOk(n, dev(n, 'Sales-PC').id, '192.168.20.10') }
    ],
    hints: ['Open the SW1 CLI: create vlan 10 and 20, then "switchport access vlan 10" on Fa0/1 and 20 on Fa0/2.', 'On Fa0/24: switchport mode trunk.', 'On R1: interface g0/0.10 → encapsulation dot1Q 10 → ip address 192.168.10.1 255.255.255.0. Repeat for .20 / VLAN 20. Do "no shutdown" on g0/0.', 'Each PC\'s gateway must be its sub-interface address.'] });

  labs.push({ id: 'sim-09-static-routes', title: 'Connect Sites with Static Routes', level: 2, xp: 140, skills: { netadmin: 5, networking: 2 }, est: 25, prereqs: ['sim-08-vlans'],
    brief: 'Two routers connect two sites over a WAN link. Add the static routes (in both directions) so the PCs at each site can reach each other.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'HQ-PC', x: 110, y: 160, interfaces: { eth0: { ip: '192.168.1.10', mask: '255.255.255.0' } }, gateway: '192.168.1.1' },
      { type: 'pc', id: 'pc2', name: 'Branch-PC', x: 820, y: 160, interfaces: { eth0: { ip: '192.168.2.10', mask: '255.255.255.0' } }, gateway: '192.168.2.1' },
      { type: 'router', id: 'r1', name: 'R1', x: 300, y: 300, interfaces: { 'G0/0': { ip: '192.168.1.1', mask: '255.255.255.0' }, 'G0/1': { ip: '10.0.0.1', mask: '255.255.255.252' } } },
      { type: 'router', id: 'r2', name: 'R2', x: 620, y: 300, interfaces: { 'G0/0': { ip: '192.168.2.1', mask: '255.255.255.0' }, 'G0/1': { ip: '10.0.0.2', mask: '255.255.255.252' } } }
    ], links: [['pc1', 'eth0', 'r1', 'G0/0'], ['r1', 'G0/1', 'r2', 'G0/1'], ['pc2', 'eth0', 'r2', 'G0/0'] ] }),
    objectives: [
      { id: 'o1', text: 'R1 has a route to 192.168.2.0/24 via 10.0.0.2', check: n => (dev(n, 'R1').routes || []).some(r => r.dest === '192.168.2.0' && r.via === '10.0.0.2') },
      { id: 'o2', text: 'R2 has a route to 192.168.1.0/24 via 10.0.0.1', check: n => (dev(n, 'R2').routes || []).some(r => r.dest === '192.168.1.0' && r.via === '10.0.0.1') },
      { id: 'o3', text: 'HQ-PC can ping Branch-PC', check: n => pingOk(n, dev(n, 'HQ-PC').id, '192.168.2.10') }
    ],
    hints: ['On R1 CLI: ip route 192.168.2.0 255.255.255.0 10.0.0.2', 'On R2 CLI: ip route 192.168.1.0 255.255.255.0 10.0.0.1', 'Remember routing must work in BOTH directions — one route alone will fail the return trip.'] });

  labs.push({ id: 'sim-10-nat', title: 'Internet Access with PAT', level: 2, xp: 150, skills: { netadmin: 4 }, est: 25, prereqs: ['sim-09-static-routes'],
    brief: 'The office uses private addresses. Configure PAT (NAT overload) on R1 so the PC can reach the simulated Internet (8.8.8.8).',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'PC1', x: 110, y: 160, interfaces: { eth0: { ip: '192.168.1.10', mask: '255.255.255.0' } }, gateway: '192.168.1.1', dns: '8.8.8.8' },
      { type: 'router', id: 'r1', name: 'R1', x: 360, y: 240, interfaces: { 'G0/1': { ip: '192.168.1.1', mask: '255.255.255.0' }, 'G0/0': { ip: '203.0.113.2', mask: '255.255.255.252' } }, routes: [{ dest: '0.0.0.0', mask: '0.0.0.0', via: '203.0.113.1' }] },
      { type: 'internet', id: 'inet', name: 'Internet', x: 700, y: 240, interfaces: { wan1: { ip: '203.0.113.1', mask: '255.255.255.252' } } }
    ], links: [['pc1', 'eth0', 'r1', 'G0/1'], ['r1', 'G0/0', 'inet', 'wan1']] }),
    objectives: [
      { id: 'o1', text: 'R1 G0/1 marked ip nat inside, G0/0 marked ip nat outside', check: n => { const r = dev(n, 'R1'); return r.interfaces['G0/1'].nat === 'inside' && r.interfaces['G0/0'].nat === 'outside'; } },
      { id: 'o2', text: 'A NAT ACL permits 192.168.1.0/24 and overload is configured', check: n => { const r = dev(n, 'R1'); return r.nat && r.nat.outside === 'G0/0'; } },
      { id: 'o3', text: 'PC1 can ping 8.8.8.8 through NAT', check: n => pingOk(n, dev(n, 'PC1').id, '8.8.8.8') }
    ],
    hints: ['On R1: interface g0/1 → ip nat inside; interface g0/0 → ip nat outside.', 'access-list 1 permit 192.168.1.0 0.0.0.255', 'ip nat inside source list 1 interface g0/0 overload', 'Verify with "show ip nat translations" after pinging.'] });

  labs.push({ id: 'sim-11-acl', title: 'Filter Traffic with an ACL', level: 2, xp: 150, skills: { netadmin: 4, security: 2 }, est: 25, prereqs: ['sim-08-vlans'],
    brief: 'Guests (192.168.30.0/24) must reach the Internet but must NOT reach the internal server subnet (192.168.1.0/24). Write and apply an extended ACL on R1.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'guest', name: 'Guest-PC', x: 110, y: 120, interfaces: { eth0: { ip: '192.168.30.10', mask: '255.255.255.0' } }, gateway: '192.168.30.1' },
      { type: 'server', id: 'srv', name: 'FileSrv', x: 110, y: 340, interfaces: { eth0: { ip: '192.168.1.2', mask: '255.255.255.0' } }, gateway: '192.168.1.1', services: { http: {}, smb: {} } },
      { type: 'router', id: 'r1', name: 'R1', x: 480, y: 230, interfaces: { 'G0/0': { ip: '192.168.30.1', mask: '255.255.255.0' }, 'G0/1': { ip: '192.168.1.1', mask: '255.255.255.0' }, 'G0/2': { ip: '203.0.113.2', mask: '255.255.255.252' } }, routes: [{ dest: '0.0.0.0', mask: '0.0.0.0', via: '203.0.113.1' }], nat: { inside: ['G0/0', 'G0/1'], outside: 'G0/2' } },
      { type: 'internet', id: 'inet', name: 'Internet', x: 760, y: 230, interfaces: { wan1: { ip: '203.0.113.1', mask: '255.255.255.252' } } }
    ], links: [['guest', 'eth0', 'r1', 'G0/0'], ['srv', 'eth0', 'r1', 'G0/1'], ['r1', 'G0/2', 'inet', 'wan1']] }),
    objectives: [
      { id: 'o1', text: 'Guest-PC CANNOT reach the server subnet (ping to 192.168.1.2 fails)', check: n => !pingOk(n, dev(n, 'Guest-PC').id, '192.168.1.2') },
      { id: 'o2', text: 'Guest-PC CAN still reach the Internet (ping 8.8.8.8 works)', check: n => pingOk(n, dev(n, 'Guest-PC').id, '8.8.8.8') }
    ],
    hints: ['Create an extended ACL: deny ip 192.168.30.0 0.0.0.255 192.168.1.0 0.0.0.255, then permit ip any any.', 'Apply it inbound on G0/0 (the guest interface): ip access-group <name> in.', 'Do not forget the permit ip any any, or the implicit deny will block Internet access too.'] });

  labs.push({ id: 'sim-12-firewall-dmz', title: 'Firewall with a DMZ', level: 3, xp: 160, skills: { security: 4, netadmin: 2 }, est: 30, prereqs: ['sim-11-acl'],
    brief: 'Design firewall rules: the LAN may browse the web server in the DMZ, the Internet may reach the DMZ web server on 80/443 only, and nothing may initiate connections into the LAN.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'LAN-PC', x: 110, y: 120, interfaces: { eth0: { ip: '10.0.0.10', mask: '255.255.255.0' } }, gateway: '10.0.0.1' },
      { type: 'server', id: 'web', name: 'WebSrv', x: 110, y: 340, interfaces: { eth0: { ip: '172.16.0.10', mask: '255.255.255.0' } }, gateway: '172.16.0.1', services: { http: { content: '<h1>DMZ Web</h1>' }, https: {} } },
      { type: 'firewall', id: 'fw', name: 'FW', x: 480, y: 230, policy: 'deny', interfaces: { lan: { ip: '10.0.0.1', mask: '255.255.255.0' }, dmz: { ip: '172.16.0.1', mask: '255.255.255.0' }, wan: { ip: '203.0.113.2', mask: '255.255.255.252' } }, routes: [{ dest: '0.0.0.0', mask: '0.0.0.0', via: '203.0.113.1' }] },
      { type: 'internet', id: 'inet', name: 'Internet', x: 760, y: 230, interfaces: { wan1: { ip: '203.0.113.1', mask: '255.255.255.252' } }, publicHosts: { '203.0.113.9': { name: 'scanner', services: [] } } }
    ], links: [['pc1', 'eth0', 'fw', 'lan'], ['web', 'eth0', 'fw', 'dmz'], ['fw', 'wan', 'inet', 'wan1']] }),
    objectives: [
      { id: 'o1', text: 'LAN-PC can open the DMZ web server (TCP 80)', check: n => { try { return N().tcpConnect(n, dev(n, 'LAN-PC').id, '172.16.0.10', 80).status === 'open'; } catch (e) { return false; } } },
      { id: 'o2', text: 'The DMZ web server cannot initiate a connection into the LAN (TCP 80 to LAN-PC is blocked)', check: n => { try { return N().tcpConnect(n, dev(n, 'WebSrv').id, '10.0.0.10', 80).status !== 'open'; } catch (e) { return true; } } },
      { id: 'o3', text: 'LAN-PC cannot be reached from outside, but can browse out (ICMP to Internet allowed or web works)', check: n => { const r = dev(n, 'FW').rules || []; return r.some(x => x.action === 'allow'); } }
    ],
    hints: ['The firewall default policy is DENY — add explicit allow rules.', 'Allow LAN→DMZ tcp 80/443. Allow WAN→DMZ tcp 80/443 for the public web server.', 'Do NOT add any rule allowing DMZ→LAN or WAN→LAN inbound; stateful inspection lets LAN replies back automatically.', 'Use the firewall rules editor in the config panel; order matters, first match wins.'] });

  labs.push({ id: 'sim-13-enterprise', title: 'Design a Redundant Campus', level: 3, xp: 200, skills: { networking: 4, netadmin: 4 }, est: 40, prereqs: ['sim-09-static-routes'],
    brief: 'Open design task: build a small campus with at least two VLANs, a router providing inter-VLAN routing, a server subnet, and a working path to the Internet with NAT. Connectivity across all segments is the goal.',
    freeform: true,
    scenario: () => ({ devices: [
      { type: 'internet', id: 'inet', name: 'Internet', x: 760, y: 120, interfaces: { wan1: { ip: '203.0.113.1', mask: '255.255.255.252' } } }
    ], links: [] }),
    objectives: [
      { id: 'o1', text: 'At least 2 VLANs (or subnets) with hosts configured', check: n => { const subs = new Set(); Object.values(n.devices).forEach(d => { if (N().kindOf(d) === 'host') Object.values(d.interfaces).forEach(i => { if (i.ip && i.mask) subs.add(S().info(i.ip, i.mask).network); }); }); return subs.size >= 2; } },
      { id: 'o2', text: 'A router or Layer 3 device routes between the segments', check: n => Object.values(n.devices).some(d => N().kindOf(d) === 'router' && Object.values(d.interfaces).filter(i => i.ip).length >= 2) },
      { id: 'o3', text: 'Hosts in different segments can ping each other', check: n => { const hosts = Object.values(n.devices).filter(d => N().kindOf(d) === 'host' && N().ipsOf(d).length); if (hosts.length < 2) return false; const a = hosts[0]; for (const b of hosts) { if (b === a) continue; if (!S().sameSubnet(N().ipsOf(a)[0], N().ipsOf(b)[0], a.interfaces[Object.keys(a.interfaces)[0]].mask || 24) && pingOk(n, a.id, N().ipsOf(b)[0])) return true; } return false; } },
      { id: 'o4', text: 'At least one host can reach the Internet (8.8.8.8)', check: n => Object.values(n.devices).some(d => N().kindOf(d) === 'host' && N().ipsOf(d).length && pingOk(n, d.id, '8.8.8.8')) }
    ],
    hints: ['Drag devices from the palette: PCs, a switch, a router, optionally a server.', 'Plan your subnets first (e.g. 192.168.10.0/24 and 192.168.20.0/24, servers 192.168.1.0/24).', 'Connect the router to the Internet cloud and configure NAT overload for Internet access.', 'This is open-ended — aim for a clean, documented design like the templates in Study Tools.'] });

  labs.push({ id: 'sim-14-vlsm-design', title: 'VLSM Address Plan', level: 2, xp: 150, skills: { networking: 5, netadmin: 2 }, est: 25, prereqs: ['sim-02-ip-config'],
    brief: 'You have 192.168.50.0/24. Three departments need 50, 20 and 10 hosts. Address the three PCs (one per department) from correctly-sized VLSM subnets and connect them through the switch and router.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'Dept-A', x: 110, y: 90, interfaces: { eth0: { ip: '', mask: '' } }, gateway: '' },
      { type: 'pc', id: 'pc2', name: 'Dept-B', x: 110, y: 240, interfaces: { eth0: { ip: '', mask: '' } }, gateway: '' },
      { type: 'pc', id: 'pc3', name: 'Dept-C', x: 110, y: 390, interfaces: { eth0: { ip: '', mask: '' } }, gateway: '' },
      { type: 'router', id: 'r1', name: 'R1', x: 560, y: 240 }
    ], links: [['pc1', 'eth0', 'r1', 'G0/0'], ['pc2', 'eth0', 'r1', 'G0/1'], ['pc3', 'eth0', 'r1', 'G0/2']] }),
    objectives: [
      { id: 'o1', text: 'Dept-A is in a /26 (50 hosts) within 192.168.50.0/24', check: n => { const ip = ipOf(n, 'Dept-A'); const m = dev(n, 'Dept-A').interfaces.eth0.mask; return ip && S().maskToCidr(m) === 26 && S().inSubnet(ip, '192.168.50.0', 24); } },
      { id: 'o2', text: 'Dept-B is in a /27 (20 hosts)', check: n => { const m = dev(n, 'Dept-B').interfaces.eth0.mask; return S().maskToCidr(m) === 27 && S().inSubnet(ipOf(n, 'Dept-B') || 'x', '192.168.50.0', 24); } },
      { id: 'o3', text: 'Dept-C is in a /28 (10 hosts)', check: n => { const m = dev(n, 'Dept-C').interfaces.eth0.mask; return S().maskToCidr(m) === 28 && S().inSubnet(ipOf(n, 'Dept-C') || 'x', '192.168.50.0', 24); } },
      { id: 'o4', text: 'Each PC reaches its router gateway and the three subnets do not overlap', check: n => { const names = ['Dept-A', 'Dept-B', 'Dept-C']; const nets = names.map(nm => { const i = dev(n, nm).interfaces.eth0; return i.ip && i.mask ? S().info(i.ip, i.mask).network + '/' + S().maskToCidr(i.mask) : null; }); if (nets.some(x => !x) || new Set(nets).size !== 3) return false; return names.every(nm => { const d = dev(n, nm); return d.gateway && pingOk(n, d.id, d.gateway); }); } }
    ],
    hints: ['Allocate largest first: Dept-A /26 = 192.168.50.0/26 (mask 255.255.255.192).', 'Dept-B /27 starts at 192.168.50.64; Dept-C /28 starts at 192.168.50.96.', 'On R1 give each interface the first usable address of its subnet, and set each PC\'s gateway to it.'] });

  labs.push({ id: 'sim-15-ospf', title: 'Multi-Router OSPF', level: 3, xp: 170, skills: { netadmin: 4, networking: 3 }, est: 30, prereqs: ['sim-09-static-routes'],
    brief: 'Three routers are cabled in a triangle. Enable OSPF area 0 on all of them so every LAN can reach every other LAN without static routes. (In this simulator, add the equivalent routes to represent an OSPF-converged network.)',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'LAN1-PC', x: 90, y: 90, interfaces: { eth0: { ip: '192.168.1.10', mask: '255.255.255.0' } }, gateway: '192.168.1.1' },
      { type: 'pc', id: 'pc2', name: 'LAN2-PC', x: 760, y: 90, interfaces: { eth0: { ip: '192.168.2.10', mask: '255.255.255.0' } }, gateway: '192.168.2.1' },
      { type: 'pc', id: 'pc3', name: 'LAN3-PC', x: 430, y: 470, interfaces: { eth0: { ip: '192.168.3.10', mask: '255.255.255.0' } }, gateway: '192.168.3.1' },
      { type: 'router', id: 'r1', name: 'R1', x: 230, y: 230, interfaces: { 'G0/0': { ip: '192.168.1.1', mask: '255.255.255.0' }, 'G0/1': { ip: '10.0.12.1', mask: '255.255.255.252' }, 'G0/2': { ip: '10.0.13.1', mask: '255.255.255.252' } } },
      { type: 'router', id: 'r2', name: 'R2', x: 620, y: 230, interfaces: { 'G0/0': { ip: '192.168.2.1', mask: '255.255.255.0' }, 'G0/1': { ip: '10.0.12.2', mask: '255.255.255.252' }, 'G0/2': { ip: '10.0.23.1', mask: '255.255.255.252' } } },
      { type: 'router', id: 'r3', name: 'R3', x: 430, y: 360, interfaces: { 'G0/0': { ip: '192.168.3.1', mask: '255.255.255.0' }, 'G0/1': { ip: '10.0.13.2', mask: '255.255.255.252' }, 'G0/2': { ip: '10.0.23.2', mask: '255.255.255.252' } } }
    ], links: [['pc1', 'eth0', 'r1', 'G0/0'], ['pc2', 'eth0', 'r2', 'G0/0'], ['pc3', 'eth0', 'r3', 'G0/0'], ['r1', 'G0/1', 'r2', 'G0/1'], ['r1', 'G0/2', 'r3', 'G0/1'], ['r2', 'G0/2', 'r3', 'G0/2']] }),
    objectives: [
      { id: 'o1', text: 'LAN1-PC can ping LAN2-PC', check: n => pingOk(n, dev(n, 'LAN1-PC').id, '192.168.2.10') },
      { id: 'o2', text: 'LAN1-PC can ping LAN3-PC', check: n => pingOk(n, dev(n, 'LAN1-PC').id, '192.168.3.10') },
      { id: 'o3', text: 'LAN2-PC can ping LAN3-PC', check: n => pingOk(n, dev(n, 'LAN2-PC').id, '192.168.3.10') }
    ],
    hints: ['Each router must learn the other two LANs. On each router add routes to the remote LAN subnets via the correct next hop.', 'R1 reaches 192.168.2.0/24 via 10.0.12.2 and 192.168.3.0/24 via 10.0.13.2, etc.', 'Alternatively enter "router ospf 1" and network statements — the simulator installs the converged routes.'] });

  NSA.data.labs.netsim = labs;
})(typeof globalThis !== 'undefined' ? globalThis : window);
