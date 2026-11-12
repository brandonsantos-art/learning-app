/* NetSec Academy – Terminal lab definitions.
 * Each lab builds a device (host/server/router) and a task list. Tasks check either the last
 * command run (cmd regex) or a predicate against the live session/device state.
 */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.labs = NSA.data.labs || {};
  const N = () => NSA.netsim;
  const labs = [];

  // A shared office scenario used by several terminal labs
  function office() {
    return { devices: [
      { type: 'pc', id: 'pc1', name: 'WIN-CLIENT', os: 'windows', interfaces: { eth0: { ip: '192.168.1.10', mask: '255.255.255.0' } }, gateway: '192.168.1.1', dns: '192.168.1.2', dnsSuffix: 'corp.local' },
      { type: 'server', id: 'srv', name: 'srv1', os: 'linux', interfaces: { eth0: { ip: '192.168.1.2', mask: '255.255.255.0' } }, gateway: '192.168.1.1', dns: '192.168.1.2', dnsSuffix: 'corp.local',
        services: { dns: { records: { 'srv1.corp.local': '192.168.1.2', 'www.corp.local': '192.168.1.2', 'intranet.corp.local': '192.168.1.2' }, forwarder: '8.8.8.8' }, http: { banner: 'Apache/2.4.57 (Debian)', content: '<html><body><h1>Corp Intranet</h1></body></html>' }, ssh: { banner: 'SSH-2.0-OpenSSH_9.2p1 Debian' } } },
      { type: 'router', id: 'r1', name: 'R1', interfaces: { 'G0/0': { ip: '203.0.113.2', mask: '255.255.255.252' }, 'G0/1': { ip: '192.168.1.1', mask: '255.255.255.0' } }, routes: [{ dest: '0.0.0.0', mask: '0.0.0.0', via: '203.0.113.1' }], nat: { inside: ['G0/1'], outside: 'G0/0' } },
      { type: 'internet', id: 'inet', name: 'Internet', interfaces: { wan1: { ip: '203.0.113.1', mask: '255.255.255.252' } } },
      { type: 'switch', id: 'sw1', name: 'SW1' }
    ], links: [['pc1', 'eth0', 'sw1', 'Fa0/1'], ['srv', 'eth0', 'sw1', 'Fa0/2'], ['sw1', 'Fa0/8', 'r1', 'G0/1'], ['r1', 'G0/0', 'inet', 'wan1']] };
  }
  function ranCmd(s, re) { return !!(s.last && new RegExp(re, 'i').test(s.last.line.trim())); }
  function anyCmd(s, re) { return (s.history || []).some(l => new RegExp(re, 'i').test(l.trim())); }

  labs.push({ id: 'term-01-ipconfig', title: 'Inspect Configuration (Windows)', level: 1, xp: 80, skills: { windows: 3, networking: 2 }, est: 12, device: 'pc1', scenario: office,
    brief: 'Use the Windows command line to read this PC\'s network configuration and verify basic connectivity.',
    tasks: [
      { id: 't1', text: 'Show the full IP configuration (hint: the /all switch)', check: s => anyCmd(s, '^ipconfig\\s+/all') },
      { id: 't2', text: 'Ping the default gateway (192.168.1.1)', check: s => s.lastPing && s.lastPing.target === '192.168.1.1' && s.lastPing.success || anyCmd(s, 'ping\\s+192\\.168\\.1\\.1') },
      { id: 't3', text: 'Resolve the name www.corp.local with nslookup', check: s => anyCmd(s, 'nslookup\\s+www\\.corp\\.local') },
      { id: 't4', text: 'Display the ARP cache', check: s => anyCmd(s, '^arp\\s+-a') }
    ],
    hints: ['Type: ipconfig /all', 'Type: ping 192.168.1.1', 'Type: nslookup www.corp.local', 'Type: arp -a'] });

  labs.push({ id: 'term-02-ping-tracert', title: 'Ping, ARP and Traceroute', level: 1, xp: 90, skills: { networking: 3, windows: 2 }, est: 15, device: 'pc1', scenario: office,
    brief: 'Trace how your PC reaches the Internet and inspect what it learns along the way.',
    tasks: [
      { id: 't1', text: 'Ping 8.8.8.8 successfully (Internet reachability)', check: s => anyCmd(s, 'ping.*8\\.8\\.8\\.8') && s.lastPing && s.lastPing.resolved === '8.8.8.8' && s.lastPing.success },
      { id: 't2', text: 'Run a traceroute to www.google.com', check: s => anyCmd(s, 'tracert\\s+www\\.google\\.com|tracert\\s+google') },
      { id: 't3', text: 'View the ARP cache and find the gateway\'s MAC', check: s => anyCmd(s, '^arp\\s+-a') },
      { id: 't4', text: 'Test TCP port 443 to www.corp.local (PowerShell Test-NetConnection)', check: s => anyCmd(s, 'test-netconnection.*(-port\\s*443|443)') }
    ],
    hints: ['ping 8.8.8.8', 'tracert www.google.com — note the first hop is your gateway.', 'arp -a', 'Test-NetConnection www.corp.local -Port 443'] });

  labs.push({ id: 'term-06-ports-services', title: 'List Listening Services', level: 1, xp: 90, skills: { networking: 3, linux: 2 }, est: 15, device: 'srv', scenario: office,
    brief: 'Log into the Linux server and discover which services it is running and on which ports.',
    tasks: [
      { id: 't1', text: 'List all listening TCP and UDP sockets (ss -tuln)', check: s => anyCmd(s, '^ss\\s+-[tulnp]{3,5}') },
      { id: 't2', text: 'Confirm the web service by fetching the local homepage with curl', check: s => anyCmd(s, 'curl.*localhost|curl.*127\\.0\\.0\\.1|curl.*://srv1') },
      { id: 't3', text: 'Check the status of the apache2 service with systemctl', check: s => anyCmd(s, 'systemctl\\s+status\\s+apache2') },
      { id: 't4', text: 'Read the DNS resolver configuration (/etc/resolv.conf)', check: s => anyCmd(s, 'cat\\s+/etc/resolv\\.conf') }
    ],
    hints: ['ss -tuln', 'curl http://localhost/', 'systemctl status apache2', 'cat /etc/resolv.conf'] });

  labs.push({ id: 'term-09-permissions', title: 'Users, Groups and Permissions', level: 2, xp: 130, skills: { linux: 5, security: 2 }, est: 25, device: 'srv', scenario: office,
    brief: 'Secure a shared directory. Create a user and group, set ownership and permissions so only the group can access it.',
    setupHost: { files: { '/srv/project': { type: 'dir', owner: 'root', group: 'root', mode: 0o755 } } },
    tasks: [
      { id: 't1', text: 'Create a group named "project" (use sudo)', check: s => !!(s.host.groups && s.host.groups.project) },
      { id: 't2', text: 'Create a user named "dev1" with a home directory (sudo useradd -m)', check: s => !!(s.host.users && s.host.users.dev1) },
      { id: 't3', text: 'Add dev1 to the project group (usermod -aG)', check: s => !!(s.host.groups && s.host.groups.project && s.host.groups.project.members.includes('dev1')) },
      { id: 't4', text: 'Set /srv/project group to project and permissions to 770', check: s => { const n = s.host.fs['/srv/project']; return n && n.group === 'project' && (n.mode & 0o777) === 0o770; } }
    ],
    hints: ['sudo groupadd project', 'sudo useradd -m dev1', 'sudo usermod -aG project dev1', 'sudo chgrp project /srv/project && sudo chmod 770 /srv/project'] });

  labs.push({ id: 'term-10-logs', title: 'Investigate SSH Logs', level: 2, xp: 130, skills: { linux: 3, security: 3, forensics: 1 }, est: 25, device: 'srv', scenario: office,
    brief: 'The server has been hit with login attempts. Use the log tools to find out who, from where, and whether anyone got in.',
    setupHost: { journal: (function () { const T = () => NSA.termfs; const J = []; const ip = '203.0.113.66'; for (let i = 0; i < 18; i++) J.push({ ts: T().ts(2, 14 + Math.floor(i / 6), (i * 7) % 60), unit: 'sshd', pid: 2200 + i, pri: 5, msg: 'Failed password for ' + (i % 3 === 0 ? 'invalid user admin' : 'root') + ' from ' + ip + ' port ' + (40000 + i) + ' ssh2' }); J.push({ ts: T().ts(2, 17, 5), unit: 'sshd', pid: 2300, pri: 6, msg: 'Accepted password for student from ' + ip + ' port 41020 ssh2' }); J.push({ ts: T().ts(2, 17, 6), unit: 'sshd', pid: 2300, pri: 6, msg: 'pam_unix(sshd:session): session opened for user student(uid=1000)' }); J.push({ ts: T().ts(2, 18, 40), unit: 'sudo', pid: 2340, pri: 5, msg: 'student : TTY=pts/1 ; PWD=/home/student ; USER=root ; COMMAND=/usr/bin/apt install netcat' }); return J; })() },
    tasks: [
      { id: 't1', text: 'Show the ssh unit logs (journalctl -u ssh)', check: s => anyCmd(s, 'journalctl\\s+.*-u\\s+ssh') },
      { id: 't2', text: 'Find the failed login attempts (grep for "Failed password")', check: s => anyCmd(s, '(grep|journalctl).*(Failed password|Failed)') },
      { id: 't3', text: 'Find the successful login (grep for "Accepted")', check: s => anyCmd(s, '(grep|journalctl).*(Accepted|-g Accepted)') },
      { id: 't4', text: 'Check what the logged-in user did with sudo (grep sudo)', check: s => anyCmd(s, '(grep|journalctl).*sudo') }
    ],
    answerKey: 'The attacker at 203.0.113.66 brute-forced many root/admin failures, then succeeded as "student" and ran apt install netcat via sudo. That host and the student account are compromised.',
    hints: ['sudo journalctl -u ssh', 'sudo grep "Failed password" /var/log/auth.log', 'sudo grep "Accepted" /var/log/auth.log', 'sudo grep sudo /var/log/auth.log — note the COMMAND run.'] });

  labs.push({ id: 'term-11-nmap', title: 'Authorized Reconnaissance with Nmap', level: 2, xp: 140, skills: { hacking: 4, security: 1 }, est: 25, device: 'pc1', scenarioWin: true,
    brief: 'You are authorized to assess the lab subnet. Discover live hosts and the services running on the server. Simulator only.',
    scenario: office,
    tasks: [
      { id: 't1', text: 'Ping-sweep the 192.168.1.0/24 subnet (nmap -sn)', check: s => anyCmd(s, 'nmap\\s+-s[nP]\\s+192\\.168\\.1\\.0/24') },
      { id: 't2', text: 'Scan the server 192.168.1.2 for open ports', check: s => anyCmd(s, 'nmap(\\s+-\\S+)*\\s+192\\.168\\.1\\.2') },
      { id: 't3', text: 'Detect service versions on the server (nmap -sV)', check: s => anyCmd(s, 'nmap.*-sV.*192\\.168\\.1\\.2') }
    ],
    answerKey: 'The server exposes SSH (22) and HTTP (80). Note the versions, then validate against advisories before concluding anything is vulnerable.',
    hints: ['nmap -sn 192.168.1.0/24', 'nmap 192.168.1.2', 'nmap -sV 192.168.1.2'] });

  labs.push({ id: 'term-12-windows-netsh', title: 'Repair Windows Networking', level: 2, xp: 130, skills: { windows: 5, netadmin: 1 }, est: 25, device: 'pc1', scenario: function () { const o = office(); o.devices[0].interfaces.eth0.ip = '192.168.1.10'; o.devices[0].dns = '8.8.4.4'; return o; },
    brief: 'This client\'s DNS server is set wrong (8.8.4.4 instead of the internal 192.168.1.2), so internal names fail. Diagnose and fix it from the command line.',
    tasks: [
      { id: 't1', text: 'Confirm internal name resolution fails (nslookup www.corp.local)', check: s => anyCmd(s, 'nslookup\\s+www\\.corp\\.local') },
      { id: 't2', text: 'Check the current DNS setting (ipconfig /all)', check: s => anyCmd(s, 'ipconfig\\s+/all') },
      { id: 't3', text: 'Set the DNS server to the internal 192.168.1.2 (netsh)', check: s => s.dev.dns === '192.168.1.2' },
      { id: 't4', text: 'Verify www.corp.local now resolves', check: s => s.dev.dns === '192.168.1.2' && anyCmd(s, 'nslookup\\s+www\\.corp\\.local|ipconfig\\s+/flushdns') }
    ],
    hints: ['nslookup www.corp.local — it should fail or give a public answer.', 'ipconfig /all shows DNS Servers 8.8.4.4 — wrong for internal names.', 'netsh interface ip set dns "Ethernet0" static 192.168.1.2', 'ipconfig /flushdns, then nslookup www.corp.local again.'] });

  labs.push({ id: 'term-16-hardening', title: 'Harden a Linux Server', level: 1, xp: 110, skills: { linux: 3, security: 3 }, est: 20, device: 'srv', scenario: office,
    brief: 'Apply basic hardening: enable the firewall allowing only SSH and HTTP, and review the SSH configuration.',
    tasks: [
      { id: 't1', text: 'Set the firewall default to deny incoming and allow SSH (22)', check: s => { const fw = s.host.firewall; return fw.enabled && (fw.rules || []).some(r => Number(r.port) === 22 && r.action === 'allow'); } },
      { id: 't2', text: 'Allow HTTP (80) through the firewall', check: s => (s.host.firewall.rules || []).some(r => Number(r.port) === 80 && r.action === 'allow') },
      { id: 't3', text: 'Enable the firewall (ufw enable)', check: s => s.host.firewall.enabled === true },
      { id: 't4', text: 'Review the SSH server configuration file', check: s => anyCmd(s, 'cat\\s+/etc/ssh/sshd_config|less\\s+/etc/ssh/sshd_config') }
    ],
    hints: ['sudo ufw default deny incoming', 'sudo ufw allow 22/tcp && sudo ufw allow 80/tcp', 'sudo ufw enable', 'cat /etc/ssh/sshd_config — note PermitRootLogin and PasswordAuthentication.'] });

  labs.push({ id: 'term-14-ios-vlans', title: 'Configure VLANs on a Switch (CLI)', level: 2, xp: 140, skills: { netadmin: 5 }, est: 25, device: 'sw1', scenario: function () { const o = office(); return o; },
    brief: 'Using the Cisco IOS CLI, create two VLANs on SW1, assign access ports, and build a trunk to the router.',
    tasks: [
      { id: 't1', text: 'Create VLAN 10 named Sales and VLAN 20 named Eng', check: s => { const d = s.dev; return d.vlans && d.vlans[10] && d.vlans[20]; } },
      { id: 't2', text: 'Put Fa0/1 in VLAN 10 (access)', check: s => s.dev.ports['Fa0/1'] && Number(s.dev.ports['Fa0/1'].vlan) === 10 },
      { id: 't3', text: 'Configure Fa0/8 as a trunk', check: s => s.dev.ports['Fa0/8'] && s.dev.ports['Fa0/8'].mode === 'trunk' },
      { id: 't4', text: 'Verify with show vlan brief', check: s => anyCmd(s, 'sh(ow)?\\s+vlan') }
    ],
    hints: ['enable → configure terminal', 'vlan 10 → name Sales → vlan 20 → name Eng', 'interface fa0/1 → switchport mode access → switchport access vlan 10', 'interface fa0/8 → switchport mode trunk ; then "do show vlan brief"'] });

  labs.push({ id: 'term-15-ios-acl-nat', title: 'Router ACL and NAT (CLI)', level: 3, xp: 160, skills: { netadmin: 5, security: 2 }, est: 30, device: 'r1', scenario: function () { const o = office(); o.devices[2].nat = null; return o; },
    brief: 'Configure the edge router from scratch: NAT overload for the LAN to reach the Internet, and an ACL blocking Telnet outbound.',
    tasks: [
      { id: 't1', text: 'Mark G0/1 as ip nat inside and G0/0 as ip nat outside', check: s => s.dev.interfaces['G0/1'].nat === 'inside' && s.dev.interfaces['G0/0'].nat === 'outside' },
      { id: 't2', text: 'Create ACL 1 permitting 192.168.1.0/24 and enable NAT overload', check: s => s.dev.nat && s.dev.nat.outside === 'G0/0' },
      { id: 't3', text: 'Create an ACL that denies TCP port 23 (Telnet) and apply it', check: s => Object.keys(s.dev.acls || {}).some(k => (s.dev.acls[k] || []).some(r => r.action === 'deny' && (r.port === 23 || r.proto === 'tcp' && String(r.port) === '23'))) },
      { id: 't4', text: 'Save the configuration (write memory)', check: s => s.dev.saved === true }
    ],
    hints: ['interface g0/1 → ip nat inside ; interface g0/0 → ip nat outside', 'access-list 1 permit 192.168.1.0 0.0.0.255 ; ip nat inside source list 1 interface g0/0 overload', 'ip access-list extended NO-TELNET → deny tcp any any eq 23 → permit ip any any ; apply with ip access-group NO-TELNET out on G0/0', 'write memory'] });

  labs.push({ id: 'term-17-python', title: 'Read Automation Scripts', level: 3, xp: 150, skills: { automation: 5 }, est: 25, device: 'srv', scenario: office, readOnly: true,
    brief: 'Automation is about reading and reasoning as much as writing. Inspect the provided Python scripts on the server and answer what each does. (This lab is a guided reading exercise — the questions are in the knowledge check.)',
    setupHost: { files: {
      '/home/student/scripts/push_ntp.py': '#!/usr/bin/env python3\nfrom netmiko import ConnectHandler\n\ndevices = ["10.0.0.1", "10.0.0.2", "10.0.0.3"]\ncommands = ["ntp server 10.0.0.250", "clock timezone UTC 0"]\n\nfor host in devices:\n    conn = ConnectHandler(device_type="cisco_ios", host=host,\n                          username="admin", password=PW)\n    output = conn.send_config_set(commands)\n    conn.save_config()\n    print(f"{host}: configured")\n    conn.disconnect()\n',
      '/home/student/scripts/audit_leases.py': '#!/usr/bin/env python3\nimport requests\n\nr = requests.get("https://ipam.corp.local/api/leases", verify=True)\nleases = r.json()\nactive = [l for l in leases if l["state"] == "active"]\nprint(f"{len(active)} active leases of {len(leases)} total")\nfor l in active:\n    if l["hostname"] == "":\n        print(f"  WARNING unnamed device at {l[\'ip\']} ({l[\'mac\']})")\n'
    } },
    tasks: [
      { id: 't1', text: 'List the scripts directory (ls scripts)', check: s => anyCmd(s, 'ls.*scripts') },
      { id: 't2', text: 'Read push_ntp.py (cat)', check: s => anyCmd(s, 'cat\\s+.*push_ntp\\.py') },
      { id: 't3', text: 'Read audit_leases.py (cat)', check: s => anyCmd(s, 'cat\\s+.*audit_leases\\.py') }
    ],
    answerKey: 'push_ntp.py connects via SSH (netmiko) to three routers and pushes NTP + timezone config, saving each. audit_leases.py queries an IPAM REST API and flags active DHCP leases that have no hostname.',
    hints: ['cd scripts && ls', 'cat scripts/push_ntp.py — follow the loop over devices.', 'cat scripts/audit_leases.py — note the REST call and the warning condition.'] });

  NSA.data.labs.terminal = labs;
})(typeof globalThis !== 'undefined' ? globalThis : window);
