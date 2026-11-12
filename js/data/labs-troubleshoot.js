/* NetSec Academy – Troubleshooting lab definitions.
 * Each builds a broken network; the learner must diagnose and fix it. Checks verify the fix.
 */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.labs = NSA.data.labs || {};
  const N = () => NSA.netsim; const S = () => NSA.subnet;
  const labs = [];
  function pingOk(net, a, b) { try { return N().ping(net, a, b).success; } catch (e) { return false; } }
  function dev(net, name) { return N().findByName(net, name); }

  labs.push({ id: 'ts-01-no-internet', title: 'A PC Cannot Reach the Internet', level: 1, xp: 100, skills: { networking: 3, netadmin: 1 }, est: 20, kind: 'troubleshoot',
    brief: 'PC1 cannot browse the Internet. Other PCs work. Investigate (ipconfig, ping the gateway, ping 8.8.8.8), find the root cause and fix it.',
    symptom: 'User reports: "I can\'t get online. The website won\'t load." PC2 on the same switch works fine.',
    rootCause: 'PC1 has the wrong default gateway (192.168.1.254 instead of 192.168.1.1), so it cannot leave its subnet.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'PC1', x: 110, y: 120, interfaces: { eth0: { ip: '192.168.1.10', mask: '255.255.255.0' } }, gateway: '192.168.1.254', dns: '8.8.8.8' },
      { type: 'pc', id: 'pc2', name: 'PC2', x: 110, y: 320, interfaces: { eth0: { ip: '192.168.1.11', mask: '255.255.255.0' } }, gateway: '192.168.1.1', dns: '8.8.8.8' },
      { type: 'router', id: 'r1', name: 'R1', x: 480, y: 220, interfaces: { 'G0/1': { ip: '192.168.1.1', mask: '255.255.255.0' }, 'G0/0': { ip: '203.0.113.2', mask: '255.255.255.252' } }, routes: [{ dest: '0.0.0.0', mask: '0.0.0.0', via: '203.0.113.1' }], nat: { inside: ['G0/1'], outside: 'G0/0' } },
      { type: 'internet', id: 'inet', name: 'Internet', x: 760, y: 220, interfaces: { wan1: { ip: '203.0.113.1', mask: '255.255.255.252' } } },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 300, y: 220 }
    ], links: [['pc1', 'eth0', 'sw1', 'Fa0/1'], ['pc2', 'eth0', 'sw1', 'Fa0/2'], ['sw1', 'Fa0/8', 'r1', 'G0/1'], ['r1', 'G0/0', 'inet', 'wan1']] }),
    objectives: [
      { id: 'o1', text: 'PC1 can reach its gateway (192.168.1.1)', check: n => pingOk(n, dev(n, 'PC1').id, '192.168.1.1') },
      { id: 'o2', text: 'PC1 can ping the Internet (8.8.8.8)', check: n => pingOk(n, dev(n, 'PC1').id, '8.8.8.8') }
    ],
    diagnosis: [
      { q: 'After running ipconfig on PC1, what stands out compared to PC2?', options: ['The IP address is wrong', 'The default gateway is 192.168.1.254, not 192.168.1.1', 'The subnet mask is wrong', 'The MAC address differs'], answer: 1, explain: 'PC1\'s gateway points to a non-existent address.' }
    ],
    hints: ['On PC1 run ipconfig and compare the Default Gateway with PC2\'s.', 'ping 192.168.1.1 — the real gateway — then ping 192.168.1.254.', 'Fix PC1\'s default gateway to 192.168.1.1 in the config panel, then ping 8.8.8.8.'] });

  labs.push({ id: 'ts-02-wrong-ip', title: 'Wrong IP Address (APIPA)', level: 1, xp: 100, skills: { networking: 3 }, est: 20, kind: 'troubleshoot',
    brief: 'A PC shows a 169.254.x.x address and cannot reach anything. Diagnose why DHCP failed and restore connectivity.',
    symptom: 'User reports: "Nothing works." ipconfig shows 169.254.33.10.',
    rootCause: 'The DHCP server\'s service was disabled, so the PC self-assigned an APIPA address. Re-enable DHCP (or set a correct static address) and renew.',
    scenario: () => ({ devices: [
      { type: 'server', id: 'srv', name: 'DHCP-SRV', x: 120, y: 120, interfaces: { eth0: { ip: '192.168.1.2', mask: '255.255.255.0' } }, gateway: '192.168.1.1', services: { dhcp: { enabled: false, pools: [{ network: '192.168.1.0', mask: '255.255.255.0', start: '192.168.1.100', end: '192.168.1.150', gateway: '192.168.1.1', dns: '192.168.1.2' }] } } },
      { type: 'pc', id: 'pc1', name: 'PC1', x: 120, y: 320, interfaces: { eth0: { mode: 'dhcp', ip: '169.254.33.10', mask: '255.255.0.0' } } },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 440, y: 220 }
    ], links: [['srv', 'eth0', 'sw1', 'Fa0/8'], ['pc1', 'eth0', 'sw1', 'Fa0/1']] }),
    objectives: [
      { id: 'o1', text: 'PC1 obtains a valid DHCP address in 192.168.1.100-150', check: n => { const ip = (dev(n, 'PC1').interfaces.eth0.ip) || ''; return S().inSubnet(ip, '192.168.1.0', 24) && S().parseIPv4(ip) >= S().parseIPv4('192.168.1.100'); } },
      { id: 'o2', text: 'PC1 can ping the server (192.168.1.2)', check: n => pingOk(n, dev(n, 'PC1').id, '192.168.1.2') }
    ],
    diagnosis: [
      { q: 'A 169.254.x.x address means:', options: ['A static misconfiguration', 'The DHCP request failed and the OS self-assigned (APIPA)', 'The Internet is down', 'The cable is unplugged (always)'], answer: 1, explain: 'APIPA appears when no DHCP server answers.' }
    ],
    hints: ['169.254.x.x = APIPA = DHCP failed.', 'Check the DHCP server — its service is disabled. Enable it (service dhcp / the DHCP toggle).', 'Then renew the lease on PC1 (DHCP renew).'] });

  labs.push({ id: 'ts-03-dns', title: 'DNS Not Resolving', level: 1, xp: 110, skills: { networking: 3, netadmin: 2 }, est: 22, kind: 'troubleshoot',
    brief: 'Users can reach sites by IP but names do not resolve. The DNS service on the server has stopped. Find and fix it.',
    symptom: 'User: "I can ping 192.168.1.2 but intranet.corp.local won\'t load."',
    rootCause: 'The DNS service on the server is stopped. Restart it so name resolution works again.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'PC1', x: 110, y: 120, os: 'windows', interfaces: { eth0: { ip: '192.168.1.10', mask: '255.255.255.0' } }, gateway: '192.168.1.1', dns: '192.168.1.2', dnsSuffix: 'corp.local' },
      { type: 'server', id: 'srv', name: 'srv1', os: 'linux', interfaces: { eth0: { ip: '192.168.1.2', mask: '255.255.255.0' } }, gateway: '192.168.1.1', services: { dns: { enabled: false, records: { 'intranet.corp.local': '192.168.1.2', 'www.corp.local': '192.168.1.2' } }, http: {} } },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 440, y: 160 }
    ], links: [['pc1', 'eth0', 'sw1', 'Fa0/1'], ['srv', 'eth0', 'sw1', 'Fa0/2']] }),
    objectives: [
      { id: 'o1', text: 'intranet.corp.local resolves from PC1 (DNS service running)', check: n => { try { return N().resolve(n, dev(n, 'PC1').id, 'intranet.corp.local').ok; } catch (e) { return false; } } }
    ],
    diagnosis: [
      { q: 'nslookup intranet.corp.local times out, but ping 192.168.1.2 works. This means:', options: ['The network is down', 'The DNS server is unreachable or its service is stopped', 'The PC has no IP', 'The switch failed'], answer: 1, explain: 'Connectivity is fine; name resolution specifically fails.' }
    ],
    hints: ['From PC1: nslookup intranet.corp.local (fails), but ping 192.168.1.2 works — so it is DNS, not the network.', 'On the server, check the DNS service: systemctl status named — it is stopped.', 'Start it: sudo systemctl start named (or toggle DNS on in the config panel), then nslookup again.'] });

  labs.push({ id: 'ts-04-vlans', title: 'Two VLANs Cannot Communicate', level: 2, xp: 130, skills: { netadmin: 4 }, est: 25, kind: 'troubleshoot', prereqs: ['sim-08-vlans'],
    brief: 'Inter-VLAN routing worked yesterday; today VLAN 10 and VLAN 20 cannot reach each other. The trunk to the router was changed to an access port. Find and fix it.',
    symptom: 'Sales (VLAN 10) and Engineering (VLAN 20) cannot reach each other, but each VLAN works internally.',
    rootCause: 'The switch port to the router (Fa0/24) was set to access mode, so tagged VLAN traffic no longer reaches the router sub-interfaces. Restore it to trunk.',
    scenario: () => ({ devices: [
      { type: 'pc', id: 'pc1', name: 'Sales-PC', x: 110, y: 100, interfaces: { eth0: { ip: '192.168.10.10', mask: '255.255.255.0' } }, gateway: '192.168.10.1' },
      { type: 'pc', id: 'pc2', name: 'Eng-PC', x: 110, y: 320, interfaces: { eth0: { ip: '192.168.20.10', mask: '255.255.255.0' } }, gateway: '192.168.20.1' },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 420, y: 210, ports: { 'Fa0/1': { vlan: 10 }, 'Fa0/2': { vlan: 20 }, 'Fa0/24': { mode: 'access', vlan: 1 } }, vlans: { 1: 'default', 10: 'Sales', 20: 'Eng' } },
      { type: 'router', id: 'r1', name: 'R1', x: 700, y: 210, interfaces: { 'G0/0': { ip: '', mask: '' }, 'G0/0.10': { ip: '192.168.10.1', mask: '255.255.255.0', parent: 'G0/0', vlan: 10 }, 'G0/0.20': { ip: '192.168.20.1', mask: '255.255.255.0', parent: 'G0/0', vlan: 20 } } }
    ], links: [['pc1', 'eth0', 'sw1', 'Fa0/1'], ['pc2', 'eth0', 'sw1', 'Fa0/2'], ['sw1', 'Fa0/24', 'r1', 'G0/0']] }),
    objectives: [
      { id: 'o1', text: 'SW1 Fa0/24 is a trunk again', check: n => dev(n, 'SW1').ports['Fa0/24'].mode === 'trunk' },
      { id: 'o2', text: 'Sales-PC can ping Eng-PC', check: n => pingOk(n, dev(n, 'Sales-PC').id, '192.168.20.10') }
    ],
    diagnosis: [
      { q: 'Each VLAN works internally but not between VLANs, and the router has correct sub-interfaces. Where is the fault?', options: ['The PCs\' IP addresses', 'The switch-to-router link is an access port, not a trunk', 'The router is powered off', 'DNS'], answer: 1, explain: 'Inter-VLAN traffic needs a trunk carrying the VLAN tags to the router.' }
    ],
    hints: ['Check "show interfaces trunk" on SW1 — Fa0/24 is not trunking.', 'The router expects 802.1Q tags on G0/0; an access port strips them.', 'On SW1: interface fa0/24 → switchport mode trunk.'] });

  labs.push({ id: 'ts-05-slow-network', title: 'Intermittent Slowness (Duplex Mismatch)', level: 3, xp: 140, skills: { netadmin: 4 }, est: 25, kind: 'troubleshoot',
    brief: 'A server link is slow and shows errors. Interpret the evidence to find the cause. (This lab is diagnostic — identify the root cause from the interface stats.)',
    symptom: 'Backups to the server crawl and the switch port shows rising CRC errors and late collisions.',
    rootCause: 'A duplex mismatch: one side is hard-set to full duplex, the other auto-negotiated to half. Set both ends to the same (auto/auto or full/full).',
    scenario: () => ({ devices: [
      { type: 'server', id: 'srv', name: 'Backup-SRV', x: 140, y: 200, interfaces: { eth0: { ip: '192.168.1.5', mask: '255.255.255.0' } }, gateway: '192.168.1.1', stats: { eth0: { in: 48213, out: 50192, crc: 1842, collisions: 912 } } },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 480, y: 200 }
    ], links: [['srv', 'eth0', 'sw1', 'Fa0/1']] }),
    objectives: [
      { id: 'o1', text: 'Identify the root cause in the diagnosis questions', check: n => true, manual: true }
    ],
    diagnosis: [
      { q: 'The switch port shows CRC errors AND late collisions on a switched (non-shared) link. The classic cause is:', options: ['Too many users', 'A duplex mismatch (one side full, the other half)', 'A DNS problem', 'A weak password'], answer: 1, explain: 'CRC + late collisions on a point-to-point link is the signature of a duplex mismatch.' },
      { q: 'The correct fix is to:', options: ['Replace the server', 'Set both ends to the same duplex (auto/auto or full/full)', 'Add a second VLAN', 'Reboot the router'], answer: 1, explain: 'Both ends must agree on duplex; mismatches often come from one side hard-coded.' },
      { q: 'Which command would reveal interface errors on the switch?', options: ['show vlan', 'show interfaces (counters: CRC, collisions)', 'show ip route', 'ping'], answer: 1, explain: 'show interfaces displays error and collision counters.' }
    ],
    hints: ['Look at the interface error counters, not just the IP config.', 'CRC errors plus late collisions on a full-switched link = duplex mismatch.', 'The fix is configuration, not hardware: match duplex settings on both ends.'] });

  labs.push({ id: 'ts-06-suspicious-device', title: 'A Suspicious Device on the Network', level: 2, xp: 130, skills: { security: 4, netadmin: 1 }, est: 22, kind: 'troubleshoot',
    brief: 'Some PCs suddenly get wrong gateway/DNS from DHCP. A rogue DHCP server has appeared. Identify it and restore correct addressing. (Diagnostic + containment.)',
    symptom: 'New devices get gateway 192.168.1.66 and DNS 192.168.1.66 — the wrong values. The real gateway is 192.168.1.1.',
    rootCause: 'A rogue DHCP server (192.168.1.66) is answering faster than the legitimate one. Remove/disconnect it (and in production, enable DHCP snooping), then renew clients.',
    scenario: () => ({ devices: [
      { type: 'server', id: 'srv', name: 'DHCP-SRV', x: 120, y: 100, interfaces: { eth0: { ip: '192.168.1.2', mask: '255.255.255.0' } }, gateway: '192.168.1.1', services: { dhcp: { enabled: true, latency: 10, pools: [{ network: '192.168.1.0', mask: '255.255.255.0', start: '192.168.1.100', end: '192.168.1.150', gateway: '192.168.1.1', dns: '192.168.1.2' }] } } },
      { type: 'pc', id: 'rogue', name: 'ROGUE', x: 120, y: 420, interfaces: { eth0: { ip: '192.168.1.66', mask: '255.255.255.0' } }, services: { dhcp: { enabled: true, rogue: true, latency: 1, pools: [{ network: '192.168.1.0', mask: '255.255.255.0', start: '192.168.1.200', end: '192.168.1.220', gateway: '192.168.1.66', dns: '192.168.1.66' }] } } },
      { type: 'pc', id: 'pc1', name: 'PC1', x: 120, y: 260, interfaces: { eth0: { mode: 'dhcp' } } },
      { type: 'router', id: 'r1', name: 'R1', x: 480, y: 180, interfaces: { 'G0/1': { ip: '192.168.1.1', mask: '255.255.255.0' }, 'G0/0': { ip: '203.0.113.2', mask: '255.255.255.252' } }, routes: [{ dest: '0.0.0.0', mask: '0.0.0.0', via: '203.0.113.1' }], nat: { inside: ['G0/1'], outside: 'G0/0' } },
      { type: 'internet', id: 'inet', name: 'Internet', x: 760, y: 180, interfaces: { wan1: { ip: '203.0.113.1', mask: '255.255.255.252' } } },
      { type: 'switch', id: 'sw1', name: 'SW1', x: 300, y: 260 }
    ], links: [['srv', 'eth0', 'sw1', 'Fa0/8'], ['rogue', 'eth0', 'sw1', 'Fa0/5'], ['pc1', 'eth0', 'sw1', 'Fa0/1'], ['sw1', 'Fa0/7', 'r1', 'G0/1'], ['r1', 'G0/0', 'inet', 'wan1']] }),
    objectives: [
      { id: 'o1', text: 'Remove the rogue DHCP server (disconnect it or disable its DHCP service)', check: n => { const r = dev(n, 'ROGUE'); return !r || !N().linkAt(n, r.id, 'eth0') || !(r.services && r.services.dhcp && r.services.dhcp.enabled); } },
      { id: 'o2', text: 'PC1 gets a correct lease (gateway 192.168.1.1) and can reach the Internet', check: n => { const pc = dev(n, 'PC1'); return pc.gateway === '192.168.1.1' && pingOk(n, pc.id, '8.8.8.8'); } }
    ],
    diagnosis: [
      { q: 'Clients receive gateway/DNS 192.168.1.66 instead of 192.168.1.1. ipconfig /all shows DHCP Server 192.168.1.66. This is:', options: ['A DNS cache problem', 'A rogue DHCP server answering faster than the real one', 'A duplex mismatch', 'A routing loop'], answer: 1, explain: 'An unauthorized DHCP server is handing out malicious options.' }
    ],
    hints: ['On an affected PC, ipconfig /all shows the DHCP Server address — 192.168.1.66 is not your real server (192.168.1.2).', 'Find the device at 192.168.1.66 (ROGUE) and disconnect it or disable its DHCP service.', 'Then renew the client lease — it should now get gateway 192.168.1.1. In production, enable DHCP snooping on the switch.'] });

  NSA.data.labs.troubleshoot = labs;
})(typeof globalThis !== 'undefined' ? globalThis : window);
