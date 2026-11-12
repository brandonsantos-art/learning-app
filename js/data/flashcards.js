/* NetSec Academy – flashcard decks (spaced repetition) */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {};
  let n = 0;
  const C = (deck, front, back) => ({ id: deck + '-' + (++n), deck, front, back });
  const cards = [];
  const ports = [['20/21', 'FTP (data / control)'], ['22', 'SSH, SFTP, SCP'], ['23', 'Telnet (insecure)'], ['25', 'SMTP'], ['53', 'DNS (UDP for queries, TCP for zone transfers)'], ['67/68', 'DHCP (server / client)'], ['69', 'TFTP'], ['80', 'HTTP'], ['110', 'POP3'], ['123', 'NTP'], ['137-139', 'NetBIOS'], ['143', 'IMAP'], ['161/162', 'SNMP (agent / trap)'], ['389', 'LDAP'], ['443', 'HTTPS'], ['445', 'SMB'], ['514', 'Syslog (UDP)'], ['636', 'LDAPS'], ['993', 'IMAPS'], ['995', 'POP3S'], ['1433', 'Microsoft SQL Server'], ['1521', 'Oracle DB'], ['3306', 'MySQL / MariaDB'], ['3389', 'RDP'], ['5060/5061', 'SIP'], ['5900', 'VNC'], ['8080', 'HTTP alternate / proxy']];
  for (const [p, s] of ports) { cards.push(C('ports', 'Port ' + p, s)); cards.push(C('ports', s.split(' (')[0] + ' – port number?', p)); }
  const concepts = [
    ['What does the OSI model Layer 3 do?', 'Network layer: logical addressing (IP) and routing between networks. PDU = packet. Devices: routers.'],
    ['What does the OSI model Layer 2 do?', 'Data link layer: MAC addressing, framing, error detection. PDU = frame. Devices: switches, bridges, NICs.'],
    ['Name the 7 OSI layers from bottom to top', 'Physical, Data Link, Network, Transport, Session, Presentation, Application ("Please Do Not Throw Sausage Pizza Away").'],
    ['TCP three-way handshake', 'SYN → SYN-ACK → ACK. Establishes sequence numbers before data is exchanged.'],
    ['TCP vs UDP in one line', 'TCP: reliable, ordered, connection-oriented, more overhead. UDP: connectionless, best-effort, fast (DNS, VoIP, DHCP).'],
    ['DHCP DORA', 'Discover (client broadcast) → Offer (server) → Request (client) → Acknowledge (server).'],
    ['RFC 1918 private ranges', '10.0.0.0/8, 172.16.0.0/12 (172.16–172.31), 192.168.0.0/16.'],
    ['APIPA range', '169.254.0.0/16 – self-assigned when DHCP fails.'],
    ['Loopback address', '127.0.0.1 (IPv4), ::1 (IPv6).'],
    ['/24 mask in dotted decimal', '255.255.255.0 – 254 usable hosts.'],
    ['/26 mask in dotted decimal', '255.255.255.192 – 62 usable hosts, block size 64.'],
    ['/30 subnet usable hosts', '2 usable hosts (point-to-point links).'],
    ['Usable hosts formula', '2^(host bits) − 2 (network and broadcast reserved).'],
    ['What is ARP?', 'Resolves an IPv4 address to a MAC address on the local segment via broadcast request / unicast reply.'],
    ['What is a default gateway?', 'The router a host uses to reach destinations outside its own subnet.'],
    ['Switch vs hub', 'Switch learns MAC addresses and forwards only to the right port (each port its own collision domain). Hub repeats to all ports.'],
    ['What separates broadcast domains?', 'Routers and VLANs. Switches do not (except via VLANs).'],
    ['802.1Q', 'The VLAN tagging standard used on trunk links; inserts a 4-byte tag with the 12-bit VLAN ID.'],
    ['Router-on-a-stick', 'Inter-VLAN routing using one router interface with 802.1Q sub-interfaces, one per VLAN.'],
    ['NAT overload / PAT', 'Many private hosts share one public IP; the router distinguishes flows by translated source port.'],
    ['Longest prefix match', 'When several routes match a destination, the router uses the most specific (longest mask) one.'],
    ['Administrative distance: connected / static / OSPF / EIGRP / RIP', '0 / 1 / 110 / 90 / 120 (lower is preferred).'],
    ['What is TTL?', 'IP header field decremented by each router; packet dropped at 0. Traceroute relies on it.'],
    ['IPv6 link-local prefix', 'fe80::/10 – automatically configured on every interface.'],
    ['IPv6 global unicast prefix', '2000::/3.'],
    ['IPv6 unique local prefix', 'fc00::/7 (in practice fd00::/8) – the IPv6 equivalent of private addresses.'],
    ['What does DNS record type A / AAAA / CNAME / MX / PTR mean?', 'A = IPv4, AAAA = IPv6, CNAME = alias, MX = mail server, PTR = reverse lookup.'],
    ['OSPF in one line', 'Link-state IGP; each router builds a map of the area and runs Dijkstra (SPF). Cost based on bandwidth.'],
    ['BGP in one line', 'Path-vector EGP between autonomous systems; policy-based; runs over TCP 179.'],
    ['Collision domain vs broadcast domain', 'Collision: devices sharing a medium (per switch port). Broadcast: devices receiving each other\'s broadcasts (per VLAN/subnet).'],
    ['What is a trunk native VLAN?', 'The VLAN whose frames cross the trunk untagged (default VLAN 1). Mismatches cause leaks between VLANs.'],
    ['Straight-through vs crossover cable', 'Straight-through: unlike devices (PC–switch). Crossover: like devices (switch–switch). Auto-MDIX makes this mostly historical.'],
    ['Wi-Fi 2.4 GHz vs 5 GHz', '2.4 GHz: longer range, more interference, 3 non-overlapping channels (1, 6, 11). 5 GHz: faster, shorter range, many channels.'],
    ['What does the "ip route 0.0.0.0 0.0.0.0 X" command do?', 'Configures a default (gateway of last resort) static route via next hop X on a Cisco router.']
  ];
  for (const [f, b] of concepts) cards.push(C('concepts', f, b));
  const commands = [
    ['Windows: show IP configuration (full)', 'ipconfig /all'], ['Windows: clear DNS cache', 'ipconfig /flushdns'], ['Windows: release and renew DHCP lease', 'ipconfig /release then ipconfig /renew'], ['Windows: trace route', 'tracert <host>'], ['Windows: show ARP cache', 'arp -a'], ['Windows: list listening ports with PIDs', 'netstat -ano'], ['Windows: show routing table', 'route print'], ['Windows: set static IP via CLI', 'netsh interface ip set address "Ethernet0" static <ip> <mask> <gateway>'], ['Windows: test TCP port with PowerShell', 'Test-NetConnection <host> -Port <port>'], ['Windows: resolve a name with PowerShell', 'Resolve-DnsName <name>'],
    ['Linux: show interfaces and addresses', 'ip addr (or ip a)'], ['Linux: show routing table', 'ip route (or ip r)'], ['Linux: add a default route', 'ip route add default via <gateway>'], ['Linux: assign an address', 'ip addr add 192.168.1.10/24 dev eth0'], ['Linux: bring an interface up', 'ip link set eth0 up'], ['Linux: list listening TCP/UDP sockets', 'ss -tuln (add -p for processes)'], ['Linux: DNS lookup (detailed)', 'dig <name>  (dig +short for just the answer)'], ['Linux: show DNS resolver config', 'cat /etc/resolv.conf'], ['Linux: HTTP request from the shell', 'curl http://host/  (curl -I for headers)'], ['Linux: follow a service log', 'journalctl -u <unit> -f'], ['Linux: change file permissions to rw-r-----', 'chmod 640 <file>'], ['Linux: make a script executable', 'chmod +x script.sh'], ['Linux: change owner and group', 'chown user:group <file>'], ['Linux: add user to a group', 'usermod -aG <group> <user>'], ['Linux: search text in files recursively', 'grep -r "pattern" /path'], ['Linux: find SUID binaries', 'find / -perm -4000 -type f'], ['Linux: manage a service', 'systemctl status|start|stop|restart <unit>'], ['Linux: show ARP/neighbour table', 'ip neigh (or arp -n)'],
    ['Cisco: enter global configuration', 'enable → configure terminal'], ['Cisco: show interface summary', 'show ip interface brief'], ['Cisco: show routing table', 'show ip route'], ['Cisco: assign IP to interface', 'interface g0/0 → ip address <ip> <mask> → no shutdown'], ['Cisco: default route', 'ip route 0.0.0.0 0.0.0.0 <next-hop>'], ['Cisco: save configuration', 'write memory (or copy running-config startup-config)'], ['Cisco: assign a switch port to VLAN 10', 'interface fa0/1 → switchport mode access → switchport access vlan 10'], ['Cisco: make a trunk', 'interface fa0/24 → switchport mode trunk'], ['Cisco: show VLANs', 'show vlan brief'], ['Cisco: show MAC table', 'show mac address-table'], ['Cisco: apply an ACL inbound', 'interface g0/0 → ip access-group <name> in'], ['Nmap: ping sweep a subnet', 'nmap -sn 192.168.1.0/24'], ['Nmap: service version scan', 'nmap -sV <target>']
  ];
  for (const [f, b] of commands) cards.push(C('commands', f, b));
  const security = [
    ['CIA triad', 'Confidentiality, Integrity, Availability.'], ['AAA', 'Authentication, Authorization, Accounting.'], ['Phishing vs spear phishing vs whaling', 'Mass generic lure / targeted at a specific person / targeted at executives.'], ['Vishing / smishing', 'Phishing by voice call / by SMS.'], ['Ransomware top defences', 'Offline tested backups, patching, MFA, email filtering, least privilege, network segmentation.'], ['MFA factor types', 'Something you know, have, are (plus somewhere you are, something you do).'], ['Hashing vs encryption', 'Hashing is one-way (integrity, password storage). Encryption is reversible with a key (confidentiality).'], ['Symmetric vs asymmetric encryption', 'Symmetric: one shared key, fast (AES). Asymmetric: public/private key pair (RSA, ECC), used for key exchange and signatures.'], ['What does a digital certificate bind?', 'A public key to an identity, signed by a Certificate Authority (PKI).'], ['Stateful firewall', 'Tracks connection state so return traffic for allowed sessions is permitted automatically.'], ['IDS vs IPS', 'IDS detects and alerts (out of band); IPS sits inline and can block.'], ['SQL injection fix', 'Parameterized queries / prepared statements, least-privilege DB accounts, input validation.'], ['XSS fix', 'Output encoding, Content Security Policy, input validation, HttpOnly cookies.'], ['OWASP A01:2021', 'Broken Access Control.'], ['OWASP A03:2021', 'Injection (including SQLi and XSS).'], ['Zero Trust principle', 'Never trust, always verify: authenticate and authorize every request regardless of network location.'], ['Incident response phases (NIST)', 'Preparation → Detection & Analysis → Containment, Eradication & Recovery → Post-Incident Activity.'], ['Chain of custody', 'Documented record of who handled evidence, when and how, so it remains admissible and trustworthy.'], ['CVSS', 'Common Vulnerability Scoring System: 0–10 severity score for vulnerabilities.'], ['Kerberoasting', 'Requesting service tickets for SPN accounts in Active Directory and cracking them offline to recover service account passwords.'], ['Pass-the-hash', 'Authenticating with a stolen NTLM hash instead of the plaintext password (Windows lateral movement).'], ['Golden Ticket', 'A forged Kerberos TGT created with the krbtgt account hash, granting persistent domain access.'], ['SIEM', 'Platform that centralizes logs, correlates events and raises alerts for the SOC.'], ['Indicators of Compromise (IoC)', 'Artifacts such as malicious IPs, domains, file hashes or registry keys that indicate an intrusion.'], ['MITRE ATT&CK', 'Knowledge base of adversary tactics and techniques used to describe and detect attacker behaviour.'], ['Principle of least privilege', 'Give only the minimum access required for a task.'], ['Defence in depth', 'Multiple overlapping layers of controls so that a single failure does not lead to compromise.'], ['WPA2 vs WPA3', 'WPA3 adds SAE (resists offline dictionary attacks) and forward secrecy; WPA2-AES is still acceptable; WEP/TKIP are broken.'], ['ARP spoofing defence', 'Dynamic ARP Inspection with DHCP snooping on switches; static ARP for critical hosts; encryption end-to-end.'], ['What is a DMZ?', 'A screened subnet for public-facing servers, isolated from the internal LAN by firewall policy.']
  ];
  for (const [f, b] of security) cards.push(C('security', f, b));
  const subnetting = [
    ['Block size for /27', '32 (256 − 224).'], ['Block size for /28', '16.'], ['Block size for /29', '8.'], ['Block size for /25', '128.'], ['Hosts in /23', '510 usable.'], ['Hosts in /22', '1022 usable.'], ['Hosts in /20', '4094 usable.'], ['Mask for /19', '255.255.224.0.'], ['Mask for /21', '255.255.248.0.'], ['Network of 192.168.10.77/26', '192.168.10.64 (broadcast .127, hosts .65–.126).'], ['Network of 10.4.19.200/28', '10.4.19.192 (broadcast .207).'], ['Network of 172.16.45.9/20', '172.16.32.0 (broadcast 172.16.47.255).'], ['Smallest prefix for 100 hosts', '/25 (126 usable).'], ['Smallest prefix for 30 hosts', '/27 (30 usable).'], ['Smallest prefix for 2 hosts', '/30 (or /31 on point-to-point links).'], ['Wildcard mask for /24', '0.0.0.255.'], ['Wildcard mask for /27', '0.0.0.31.']
  ];
  for (const [f, b] of subnetting) cards.push(C('subnetting', f, b));
  NSA.data.flashcards = cards;
  NSA.data.flashcardDecks = [
    { id: 'ports', title: 'Ports & Protocols', desc: 'Well-known port numbers in both directions.' },
    { id: 'concepts', title: 'Networking Concepts', desc: 'OSI, TCP/IP, addressing, switching, routing.' },
    { id: 'commands', title: 'Commands', desc: 'Windows, Linux, Cisco IOS and Nmap commands.' },
    { id: 'security', title: 'Security Terminology', desc: 'Attacks, defences, frameworks and crypto.' },
    { id: 'subnetting', title: 'Subnetting Drills', desc: 'Block sizes, masks and host counts.' }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
