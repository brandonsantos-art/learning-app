/* NetSec Academy – Level 2 (Intermediate) lessons: network administration */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.lessons = NSA.data.lessons || [];
  const L = [];

  L.push({ id: 'l2-net-01-addressing', level: 2, track: 'networking', order: 1, title: 'Advanced IPv4 and IPv6 Addressing', summary: 'Address planning, summarization, IPv6 subnetting and dual-stack realities.', minutes: 25, skills: { networking: 4, netadmin: 2 }, prereqs: [],
    objectives: ['Design a hierarchical address plan', 'Summarize contiguous networks into one route', 'Subnet an IPv6 /48 into /64s', 'Plan dual-stack deployment'],
    sections: [
      { type: 'text', title: 'Hierarchical address planning', md: `Good addressing encodes meaning. A common enterprise scheme uses **10.S.V.H**: second octet = site, third = VLAN/function, fourth = host. Site 3, VLAN 20 → 10.3.20.0/24. Advantages: you can read a packet capture and know where a host is; routes can be **summarized** per site (10.3.0.0/16); firewall rules become readable.

Reserve ranges deliberately: 10.0.0.0/16 for infrastructure links, 10.255.0.0/16 for VPN pools, 172.16.0.0/12 for labs/cloud. Document everything in an IPAM tool (NetBox, phpIPAM) or at least the IP plan template in Study Tools.` },
      { type: 'text', title: 'Route summarization', md: `Instead of advertising 10.3.0.0/24, 10.3.1.0/24 … 10.3.255.0/24 (256 routes), advertise **10.3.0.0/16**. To summarize arbitrary blocks, write the networks in binary and keep the common leading bits:

\`\`\`
192.168.16.0  = 11000000.10101000.00010000.0
192.168.17.0  = 11000000.10101000.00010001.0
192.168.18.0  = 11000000.10101000.00010010.0
192.168.19.0  = 11000000.10101000.00010011.0
common bits: 22 → summary 192.168.16.0/22
\`\`\`
Summaries must be contiguous and aligned (192.168.17.0/22 is not valid – 17 is not a multiple of 4). Over-summarizing can black-hole or attract traffic for networks you do not have – a frequent cause of routing surprises.` },
      { type: 'text', title: 'IPv6 subnetting', md: `ISPs assign a /48 (65,536 /64 subnets) or /56 (256 subnets) per site. Subnetting IPv6 means choosing the fourth hex group (for a /48): 2001:db8:acad:**0001**::/64, 2001:db8:acad:**0002**::/64. Use hex meaningfully: VLAN 10 → :a::/64 or :10::/64 (readability beats cleverness).

Never subnet a LAN smaller than /64 (SLAAC breaks). Point-to-point links use /127 (RFC 6164) or /64. Loopbacks are /128.

**Dual stack** checklist: router advertisements with the correct flags (SLAAC vs DHCPv6), DNS AAAA records, firewall rules mirrored for IPv6, monitoring for both stacks. Hosts prefer IPv6 when both exist; a broken IPv6 path produces mysterious slowness ("happy eyeballs" falls back after a delay).` },
      { type: 'check', question: { type: 'fill', q: 'Summarize 10.4.0.0/24 through 10.4.3.0/24 into one prefix.', answer: ['10.4.0.0/22'], explain: 'Four contiguous /24s aligned on a multiple of 4 → /22.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'In the 10.S.V.H scheme, 10.7.30.15 most likely belongs to:', options: ['Site 15, VLAN 7', 'Site 7, VLAN 30', 'Site 30, VLAN 7', 'A public address'], answer: 1, explain: 'Second octet = site, third = VLAN.', topic: 'addressing' },
      { type: 'fill', q: 'Summarize 172.16.8.0/24 to 172.16.15.0/24.', answer: ['172.16.8.0/21'], explain: 'Eight /24s starting at a multiple of 8 → /21.', topic: 'summarization' },
      { type: 'mcq', q: 'Why must IPv6 LAN subnets be /64?', options: ['Routers require it', 'SLAAC needs 64 bits for the interface identifier', 'To save addresses', 'DNS requires it'], answer: 1, explain: 'Stateless autoconfiguration uses a 64-bit interface ID.', topic: 'IPv6' },
      { type: 'mcq', q: 'How many /64 subnets fit in a /48?', options: ['256', '4096', '65,536', '16'], answer: 2, explain: '2^(64−48) = 65,536.', topic: 'IPv6' },
      { type: 'tf', q: '192.168.17.0/22 is a valid summary route.', answer: false, explain: 'A /22 must start on a multiple of 4 in the third octet (16, 20, 24…).', topic: 'summarization' },
      { type: 'mcq', q: 'Users report websites are slow to start loading but then fast. A likely cause in a dual-stack network is:', options: ['IPv6 path broken, clients falling back to IPv4 after a timeout', 'Too many VLANs', 'ARP cache full', 'DHCP lease too long'], answer: 0, explain: 'Happy Eyeballs fallback delay.', topic: 'IPv6' }
    ] }, practical: null, cert: ['netplus:1.7', 'ccna:1.8'], refs: [] });

  L.push({ id: 'l2-net-02-subnetting', level: 2, track: 'networking', order: 2, title: 'Subnetting, CIDR and VLSM', summary: 'Variable-length subnetting to fit each network to its size, and designing an address plan from requirements.', minutes: 30, skills: { networking: 5, netadmin: 2 }, prereqs: ['l2-net-01-addressing'],
    objectives: ['Allocate subnets with VLSM from a single block', 'Avoid overlaps when allocating variable sizes', 'Translate department requirements into an IP plan', 'Solve medium and hard subnetting problems quickly'],
    sections: [
      { type: 'text', title: 'Why VLSM', md: `Fixed-length subnetting wastes addresses: splitting 192.168.1.0/24 into eight /27s gives every department 30 hosts – too few for Sales (50) and far too many for a router link (2). **VLSM** uses a different prefix per subnet.

**Method:** sort requirements **largest first**, allocate each from the next available aligned block:

| Requirement | Hosts | Prefix | Allocation |
| --- | --- | --- | --- |
| Sales | 50 | /26 (62) | 192.168.1.0 – .63 |
| Engineering | 20 | /27 (30) | 192.168.1.64 – .95 |
| Management | 10 | /28 (14) | 192.168.1.96 – .111 |
| Printers | 5 | /29 (6) | 192.168.1.112 – .119 |
| WAN link | 2 | /30 (2) | 192.168.1.120 – .123 |

Remaining: .124 – .255 for growth. Allocating small blocks first creates fragmentation and overlaps – always largest first.` },
      { type: 'demo', title: 'Interactive: VLSM planner', demo: 'vlsm-planner', md: 'Enter departments and host counts; the planner allocates and you verify each boundary.' },
      { type: 'check', question: { type: 'subnet', q: 'VLSM problem.', difficulty: 'hard', kind: 'vlsm' } },
      { type: 'text', title: 'Checking for overlaps', md: `Two subnets overlap if one's network address falls inside the other's range. Routers reject overlapping interface addresses ("overlaps with GigabitEthernet0/1"), but overlapping *routes* are accepted and silently cause longest-prefix-match surprises. Always list allocations in order and confirm each one starts where the previous one ended (or later).

Growth rule: leave at least one block of equal size free after each allocation when the business is growing, or allocate from alternating ends of the space (large from the bottom, tiny links from the top).` },
      { type: 'check', question: { type: 'subnet', q: 'Hard subnetting problem.', difficulty: 'hard', kind: 'basic' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'subnet', q: 'VLSM', difficulty: 'hard', kind: 'vlsm', topic: 'VLSM' },
      { type: 'subnet', q: 'Subnetting', difficulty: 'hard', kind: 'basic', topic: 'subnetting' },
      { type: 'subnet', q: 'Subnetting', difficulty: 'medium', kind: 'same', topic: 'subnetting' },
      { type: 'mcq', q: 'When allocating VLSM subnets, you should allocate:', options: ['Smallest first', 'Largest first', 'Alphabetically', 'Randomly'], answer: 1, explain: 'Largest first keeps blocks aligned and avoids fragmentation.', topic: 'VLSM' },
      { type: 'mcq', q: 'After allocating 10.0.0.0/26 and 10.0.0.64/27, the next free aligned block for a /28 starts at:', options: ['10.0.0.80', '10.0.0.96', '10.0.0.112', '10.0.0.128'], answer: 1, explain: '/27 covers .64–.95; next address .96 is aligned to 16.', topic: 'VLSM' },
      { type: 'tf', q: 'A router will accept two interfaces in overlapping subnets without complaint.', answer: false, explain: 'IOS rejects overlapping interface addresses.', topic: 'VLSM' }
    ] }, practical: { type: 'netsim', id: 'sim-14-vlsm-design', title: 'Address a multi-subnet network with VLSM' }, cert: ['netplus:1.7', 'ccna:1.6'], refs: [] });

  L.push({ id: 'l2-net-03-vlans', level: 2, track: 'networking', order: 3, title: 'VLAN Configuration and Inter-VLAN Routing', summary: 'Segment a switch into VLANs, carry them over trunks, and route between them with a router-on-a-stick or Layer 3 switch.', minutes: 35, skills: { netadmin: 5, networking: 2 }, prereqs: ['l2-net-02-subnetting'],
    objectives: ['Create VLANs and assign access ports on a Cisco switch', 'Configure 802.1Q trunks and understand native VLAN', 'Configure router-on-a-stick sub-interfaces', 'Troubleshoot VLAN mismatches and missing trunks'],
    sections: [
      { type: 'text', title: 'VLAN concepts', md: `A **VLAN** is a broadcast domain defined in software on a switch. Ports in VLAN 10 cannot hear VLAN 20 even on the same switch – like having separate switches. Each VLAN normally maps to one IP subnet.

- **Access port** – belongs to one VLAN; frames are untagged; connects end devices.
- **Trunk port** – carries many VLANs between switches or to a router; each frame carries an **802.1Q tag** with the VLAN ID (12 bits, 1–4094).
- **Native VLAN** – frames of this VLAN cross the trunk *untagged* (default 1). Both ends must agree or traffic leaks between VLANs.
- Best practice: do not use VLAN 1 for users; create a dedicated management VLAN; shut down unused ports and put them in a black-hole VLAN.` },
      { type: 'text', title: 'Switch configuration (IOS)', md: `\`\`\`
SW1# configure terminal
SW1(config)# vlan 10
SW1(config-vlan)# name Sales
SW1(config-vlan)# vlan 20
SW1(config-vlan)# name Engineering
SW1(config-vlan)# exit
SW1(config)# interface range fa0/1 - 4
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# interface range fa0/5 - 8
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 20
SW1(config-if-range)# interface fa0/24
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20,99
SW1(config-if)# end
SW1# show vlan brief
SW1# show interfaces trunk
\`\`\`
Verification commands: \`show vlan brief\` (ports per VLAN), \`show interfaces trunk\` (trunking status, allowed and native VLANs), \`show mac address-table\` (which VLAN a MAC was learned in).` },
      { type: 'text', title: 'Inter-VLAN routing', md: `VLANs isolate; routing reconnects them under policy. Two options:

**Router-on-a-stick** – one physical router interface, one **sub-interface per VLAN**, each with 802.1Q encapsulation and the VLAN's gateway address:
\`\`\`
R1(config)# interface g0/0
R1(config-if)# no shutdown
R1(config-if)# interface g0/0.10
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip address 192.168.10.1 255.255.255.0
R1(config-subif)# interface g0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 192.168.20.1 255.255.255.0
\`\`\`
The switch port facing the router must be a **trunk**. Each PC uses its VLAN's sub-interface address as default gateway.

**Layer 3 switch (SVI)** – \`interface vlan 10\` with an IP address, plus \`ip routing\`; routes in hardware at wire speed; the standard in campus networks.

**Troubleshooting checklist:** PC in the right VLAN (\`show vlan brief\`)? Trunk actually trunking (\`show interfaces trunk\`)? VLAN allowed on the trunk? Sub-interface encapsulation matches the VLAN ID? PC gateway = sub-interface IP? Native VLAN consistent?` },
      { type: 'check', question: { type: 'mcq', q: 'PCs in VLAN 10 can ping each other but not their gateway on R1 G0/0.10. The switch port to R1 is in access mode. The fix is:', options: ['Change the PCs\' subnet mask', 'Make the switch port to the router a trunk', 'Add a static route on the PCs', 'Reboot the switch'], answer: 1, explain: 'Tagged frames for the sub-interface need a trunk.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'command', q: 'Type the interface command that assigns an access port to VLAN 20.', answer: ['^switchport\\s+access\\s+vlan\\s+20$'], display: 'switchport access vlan 20', explain: 'switchport access vlan <id>.', topic: 'VLAN' },
      { type: 'mcq', q: 'Which standard tags frames on a trunk?', options: ['802.1X', '802.1Q', '802.11', '802.3'], answer: 1, explain: '802.1Q inserts the VLAN tag.', topic: 'VLAN' },
      { type: 'mcq', q: 'A native VLAN mismatch between two switches causes:', options: ['Nothing', 'Traffic leaking between the two native VLANs', 'Faster forwarding', 'DHCP failure only'], answer: 1, explain: 'Untagged frames are placed in different VLANs on each side.', topic: 'VLAN' },
      { type: 'command', q: 'Type the sub-interface command that sets 802.1Q VLAN 30.', answer: ['^encapsulation\\s+dot1[qQ]\\s+30$'], display: 'encapsulation dot1Q 30', explain: 'encapsulation dot1Q <vlan>.', topic: 'routing' },
      { type: 'mcq', q: 'Which show command confirms a port is trunking and lists allowed VLANs?', options: ['show ip route', 'show interfaces trunk', 'show arp', 'show version'], answer: 1, explain: 'show interfaces trunk.', topic: 'VLAN' },
      { type: 'mcq', q: 'In a Layer 3 switch, the gateway for VLAN 10 is configured on:', options: ['A physical port', 'interface vlan 10 (SVI)', 'The DHCP server', 'A trunk'], answer: 1, explain: 'Switched Virtual Interface.', topic: 'routing' },
      { type: 'tf', q: 'Hosts in different VLANs on the same switch can communicate without a Layer 3 device.', answer: false, explain: 'VLANs are separate broadcast domains; routing is required.', topic: 'VLAN' }
    ] }, practical: { type: 'netsim', id: 'sim-08-vlans', title: 'Configure VLANs, a trunk and router-on-a-stick' }, cert: ['ccna:2.1', 'netplus:2.3'], refs: [{ title: 'Cisco: Inter-VLAN routing configuration', url: 'https://www.cisco.com/c/en/us/support/docs/lan-switching/inter-vlan-routing/41860-howto-L3-intervlanrouting.html' }] });

  L.push({ id: 'l2-net-04-routing', level: 2, track: 'networking', order: 4, title: 'Static and Dynamic Routing, Introduction to OSPF', summary: 'How routers choose paths: routing tables, static and default routes, administrative distance, and OSPF basics.', minutes: 35, skills: { netadmin: 5, networking: 2 }, prereqs: ['l2-net-03-vlans'],
    objectives: ['Read a routing table and predict the chosen route', 'Configure static and default routes on Cisco routers', 'Explain administrative distance and metric', 'Describe OSPF neighbour formation, areas and cost', 'Troubleshoot missing or asymmetric routes'],
    sections: [
      { type: 'text', title: 'The routing table', md: `\`show ip route\` lists known networks with their source:

\`\`\`
S*    0.0.0.0/0 [1/0] via 203.0.113.1
C     192.168.1.0/24 is directly connected, GigabitEthernet0/1
L     192.168.1.1/32 is directly connected, GigabitEthernet0/1
S     192.168.3.0/24 [1/0] via 10.0.0.2
O     192.168.5.0/24 [110/2] via 10.0.0.2, 00:12:04, GigabitEthernet0/2
\`\`\`
Codes: **C** connected, **L** local, **S** static, **S\\*** default static, **O** OSPF, **D** EIGRP, **B** BGP. The numbers in brackets are **[administrative distance / metric]**.

Selection order: 1) **longest prefix match** wins regardless of source; 2) if equal prefix, lowest **administrative distance** (connected 0, static 1, EIGRP 90, OSPF 110, RIP 120); 3) if equal AD, lowest **metric** (and equal-cost paths load balance).

Every packet needs a route in **both directions** – the most common "ping fails" cause between routers is a missing return route.` },
      { type: 'text', title: 'Static and default routes', md: `\`\`\`
R1(config)# ip route 192.168.3.0 255.255.255.0 10.0.0.2        next hop
R1(config)# ip route 192.168.3.0 255.255.255.0 g0/2 10.0.0.2   exit interface + next hop (best practice)
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1              default route
R1(config)# ip route 192.168.3.0 255.255.255.0 10.0.0.6 50    floating static (AD 50) backup
\`\`\`
Statics are predictable and cheap but do not react to failures (unless floating statics with tracking) and do not scale. Stub networks and the default route toward the ISP are almost always static.` },
      { type: 'text', title: 'Dynamic routing and OSPF', md: `Dynamic protocols exchange reachability automatically and reroute around failures. **OSPF** (Open Shortest Path First) is the standard interior protocol:

- **Link-state**: each router floods LSAs describing its links; all routers in an area build the same topology database and run **Dijkstra SPF** to compute shortest paths.
- **Cost** = reference bandwidth / interface bandwidth (default reference 100 Mbps, so adjust \`auto-cost reference-bandwidth 10000\` on gigabit networks or every fast link costs 1).
- **Neighbours** form on a link if hello/dead timers, area ID, subnet and authentication match; state goes Down → Init → 2-Way → ExStart → Exchange → Loading → **Full**. On multi-access segments a DR/BDR is elected.
- **Areas** limit flooding; area 0 is the backbone and all other areas attach to it.
- Router ID: highest loopback or configured \`router-id\`.

\`\`\`
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 10.0.0.0 0.0.0.3 area 0
R1(config-router)# network 192.168.1.0 0.0.0.255 area 0
R1(config-router)# passive-interface g0/1
R1# show ip ospf neighbor
R1# show ip route ospf
\`\`\`
Compare: **RIP** (hop count, max 15, slow – obsolete), **EIGRP** (Cisco, fast, composite metric), **BGP** (between organizations, Level 3).` },
      { type: 'check', question: { type: 'mcq', q: 'A router has 10.0.0.0/8 via OSPF and 10.1.0.0/16 via a static route. A packet to 10.1.5.5 uses:', options: ['The OSPF route because OSPF is dynamic', 'The static route because /16 is the longest match', 'Both equally', 'Neither'], answer: 1, explain: 'Prefix length is checked before administrative distance.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'command', q: 'Type the IOS command for a default route via 203.0.113.1.', answer: ['^ip\\s+route\\s+0\\.0\\.0\\.0\\s+0\\.0\\.0\\.0\\s+203\\.0\\.113\\.1$'], display: 'ip route 0.0.0.0 0.0.0.0 203.0.113.1', explain: 'Default static route.', topic: 'routing' },
      { type: 'mcq', q: 'Administrative distance of OSPF is:', options: ['1', '90', '110', '120'], answer: 2, explain: 'OSPF 110, EIGRP 90, RIP 120, static 1.', topic: 'routing' },
      { type: 'mcq', q: 'Two OSPF routers on a link never reach Full. The most likely cause among these is:', options: ['Different hostnames', 'Mismatched hello/dead timers or area IDs', 'Different router models', 'Too many VLANs'], answer: 1, explain: 'Timers, area, subnet mask and authentication must match.', topic: 'OSPF' },
      { type: 'mcq', q: 'PC1 behind R1 pings PC2 behind R2. R1 has a route to PC2\'s subnet; R2 has no route back. The result is:', options: ['Ping succeeds', 'Ping fails – the reply cannot be routed', 'Ping succeeds slowly', 'Only traceroute works'], answer: 1, explain: 'Routing must work in both directions.', topic: 'troubleshooting' },
      { type: 'mcq', q: 'OSPF cost is derived from:', options: ['Hop count', 'Interface bandwidth', 'Delay only', 'MAC address'], answer: 1, explain: 'Cost = reference bandwidth / bandwidth.', topic: 'OSPF' },
      { type: 'mcq', q: 'A floating static route is created by:', options: ['Setting a higher administrative distance than the primary route', 'Using a /32 mask', 'Enabling OSPF', 'Using the exit interface only'], answer: 0, explain: 'It is only installed when the better route disappears.', topic: 'routing' },
      { type: 'tf', q: 'All OSPF non-backbone areas must connect to area 0.', answer: true, explain: 'Area 0 is the backbone (virtual links aside).', topic: 'OSPF' }
    ] }, practical: { type: 'netsim', id: 'sim-09-static-routes', title: 'Connect three sites with static routes' }, cert: ['ccna:3.1', 'netplus:2.1'], refs: [] });

  L.push({ id: 'l2-net-05-nat', level: 2, track: 'networking', order: 5, title: 'NAT and PAT', summary: 'Translate private addresses to public ones: static NAT, dynamic NAT, PAT overload, and port forwarding.', minutes: 25, skills: { netadmin: 4, networking: 2 }, prereqs: ['l2-net-04-routing'],
    objectives: ['Explain inside/outside local/global terminology', 'Configure PAT overload on a Cisco router', 'Configure static NAT (port forwarding) for a server', 'Troubleshoot NAT with show ip nat translations'],
    sections: [
      { type: 'text', title: 'NAT types', md: `| Type | Mapping | Use |
| --- | --- | --- |
| **Static NAT** | one private ↔ one public, permanent | servers that must be reachable from outside |
| **Dynamic NAT** | private addresses borrow from a pool of public addresses | rare today |
| **PAT / NAT overload** | many private ↔ one public, distinguished by source port | every home and office edge |
| **Port forwarding** (static PAT) | public IP:port → private IP:port | expose one service without a dedicated public IP |

Terminology (Cisco): **inside local** = private address of the host (192.168.1.10); **inside global** = its translated public address (203.0.113.2); **outside global** = the Internet host (8.8.8.8).

PAT keeps a **translation table**: 192.168.1.10:51234 → 203.0.113.2:51234 → 8.8.8.8:53. Replies to 203.0.113.2:51234 are mapped back. Unsolicited inbound traffic has no entry and is dropped – the incidental "firewall" effect of NAT.` },
      { type: 'text', title: 'Configuration', md: `\`\`\`
R1(config)# interface g0/1
R1(config-if)# ip nat inside
R1(config-if)# interface g0/0
R1(config-if)# ip nat outside
R1(config-if)# exit
R1(config)# access-list 1 permit 192.168.1.0 0.0.0.255
R1(config)# ip nat inside source list 1 interface g0/0 overload
!
! static NAT for a web server (port forwarding)
R1(config)# ip nat inside source static tcp 192.168.1.20 80 203.0.113.2 80
!
R1# show ip nat translations
R1# show ip nat statistics
R1# clear ip nat translation *
\`\`\`
The ACL defines *which* inside addresses are translated. Missing \`ip nat inside/outside\` on an interface is the number one NAT mistake: everything looks configured, nothing is translated.` },
      { type: 'demo', title: 'Interactive: translation table', demo: 'nat-table', md: 'Send flows from several inside hosts and watch the PAT table build; then see what happens to an unsolicited inbound packet.' },
      { type: 'check', question: { type: 'mcq', q: 'An admin configures the NAT ACL and the overload statement but hosts still cannot reach the Internet. show ip nat translations is empty. The most likely omission is:', options: ['A DNS server', 'ip nat inside / ip nat outside on the interfaces', 'A VLAN', 'An OSPF area'], answer: 1, explain: 'Without interface roles, no translation occurs.' } },
      { type: 'text', title: 'NAT and troubleshooting', md: `NAT breaks protocols that embed addresses (SIP/VoIP, active FTP) and the end-to-end model; it also hides which internal host did something unless the NAT log is kept – important for security investigations (retain translation logs with timestamps).

Symptoms and causes: inside hosts cannot reach outside but the router can → NAT not applied; some hosts work and others not → ACL does not include their subnet; the server is unreachable from outside → missing static mapping or firewall; translations show but no replies → default route or ISP issue. **Carrier-grade NAT** at the ISP means your "public" address is private too (100.64.0.0/10) and inbound port forwarding will never work.` }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which NAT type lets 200 PCs share one public IP?', options: ['Static NAT', 'Dynamic NAT', 'PAT (overload)', 'Reverse NAT'], answer: 2, explain: 'PAT multiplexes by source port.', topic: 'NAT' },
      { type: 'mcq', q: 'In Cisco terminology, the translated public address of an internal host is the:', options: ['Inside local', 'Inside global', 'Outside local', 'Outside global'], answer: 1, explain: 'Inside global = how the inside host appears to the outside.', topic: 'NAT' },
      { type: 'command', q: 'Type the interface command marking the LAN interface for NAT.', answer: ['^ip\\s+nat\\s+inside$'], display: 'ip nat inside', explain: 'ip nat inside on LAN, ip nat outside on WAN.', topic: 'NAT' },
      { type: 'mcq', q: 'Which command shows active translations?', options: ['show ip route', 'show ip nat translations', 'show arp', 'show vlan brief'], answer: 1, explain: 'show ip nat translations.', topic: 'NAT' },
      { type: 'mcq', q: 'Inbound connections to a web server behind PAT require:', options: ['Nothing extra', 'A static NAT / port forwarding entry', 'A second default route', 'IPv6'], answer: 1, explain: 'Unsolicited inbound traffic needs a fixed mapping.', topic: 'NAT' },
      { type: 'tf', q: 'NAT by itself is a complete substitute for a firewall.', answer: false, explain: 'NAT is address translation; firewalls enforce policy and log.', topic: 'NAT' }
    ] }, practical: { type: 'netsim', id: 'sim-10-nat', title: 'Connect an office to the Internet with PAT' }, cert: ['ccna:4.1', 'netplus:1.7'], refs: [] });

  L.push({ id: 'l2-net-06-dhcp-dns', level: 2, track: 'networking', order: 6, title: 'DHCP and DNS Configuration and Troubleshooting', summary: 'Run DHCP on a router or server, relay across subnets, operate an internal DNS zone with forwarding, and fix the failures users report.', minutes: 30, skills: { netadmin: 4, linux: 1, windows: 1 }, prereqs: ['l2-net-03-vlans'],
    objectives: ['Configure DHCP pools with exclusions on a Cisco router', 'Configure a DHCP relay for remote subnets', 'Explain internal zones, forwarders and split DNS', 'Diagnose DHCP and DNS failures systematically'],
    sections: [
      { type: 'text', title: 'DHCP on a router', md: `\`\`\`
R1(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.50
R1(config)# ip dhcp pool SALES
R1(dhcp-config)# network 192.168.10.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.10.1
R1(dhcp-config)# dns-server 192.168.1.2 8.8.8.8
R1(dhcp-config)# domain-name corp.local
R1(dhcp-config)# lease 7
R1# show ip dhcp binding
R1# show ip dhcp conflict
\`\`\`
Exclusions protect static addresses (gateway, servers, printers). A pool only answers requests arriving on an interface in its network – for other subnets the router nearest the clients needs \`ip helper-address <server>\` on the client-facing interface (**DHCP relay**), which turns the broadcast Discover into a unicast to the server and tells the server which subnet to allocate from (giaddr).

Windows Server DHCP adds **reservations** (fixed address by MAC), scopes per subnet, and **DHCP snooping** on switches blocks rogue servers by allowing Offers only on trusted ports.` },
      { type: 'text', title: 'Internal DNS', md: `Companies run an internal DNS server (Windows AD DNS, BIND, Unbound) that is **authoritative** for internal zones (\`corp.local\`, \`10.in-addr.arpa\`) and **forwards** everything else to public resolvers. Clients receive the internal server via DHCP option 6 and a search suffix (\`ping fileserver\` → \`fileserver.corp.local\`).

**Split DNS**: the same name resolves to a private address inside and a public one outside. **Reverse zones** (PTR) make logs and traceroutes readable. Record changes take effect after the TTL expires on caches – \`ipconfig /flushdns\` on clients and clearing the server cache speeds testing.

Security: block outbound DNS except from the resolver (malware uses DNS tunnelling and its own resolvers), log queries (an invaluable incident-response source), consider DNS filtering of known malicious domains, and use DNSSEC validation on the resolver.` },
      { type: 'text', title: 'Troubleshooting flow', md: `**DHCP – client has 169.254.x.x or no lease**
1. Physical/VLAN: is the port up and in the right VLAN?
2. Local server? If not, is \`ip helper-address\` configured on the client's gateway interface?
3. Is the service running (\`service dhcp\`, Windows DHCP Server service)? Pool exhausted (\`show ip dhcp pool\`)?
4. Wrong lease (bad gateway/DNS)? Suspect a **rogue DHCP server** – \`ipconfig /all\` shows the DHCP Server address; trace its MAC through switch tables.

**DNS – names fail, IPs work**
1. \`ipconfig /all\` – which DNS server is configured? Reachable (\`ping\`, \`Test-NetConnection -Port 53\`)?
2. \`nslookup name\` vs \`nslookup name 8.8.8.8\` – is it the server or the record?
3. NXDOMAIN → missing record or wrong suffix; timeout → server/firewall; SERVFAIL → forwarder or zone problem on the server.
4. Check the server: zone loaded, forwarders reachable, service running (\`systemctl status named\`, \`journalctl -u named\`).` },
      { type: 'check', question: { type: 'mcq', q: 'Clients in VLAN 20 get no DHCP lease; the DHCP server is in VLAN 1 and works for VLAN 1 clients. The fix is:', options: ['Add a second DHCP server per VLAN only', 'Configure ip helper-address on the VLAN 20 gateway interface pointing to the server', 'Change the clients\' DNS', 'Enable NAT'], answer: 1, explain: 'Broadcast Discover does not cross the router without a relay.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'command', q: 'Type the IOS interface command that relays DHCP to server 192.168.1.2.', answer: ['^ip\\s+helper-address\\s+192\\.168\\.1\\.2$'], display: 'ip helper-address 192.168.1.2', explain: 'DHCP relay.', topic: 'DHCP' },
      { type: 'mcq', q: 'Which command protects the gateway address from being leased?', options: ['ip dhcp pool', 'ip dhcp excluded-address', 'default-router', 'lease 7'], answer: 1, explain: 'Exclusions remove addresses from the pool.', topic: 'DHCP' },
      { type: 'mcq', q: 'A client got 192.168.10.200 with gateway 192.168.10.254, but the real gateway is .1. ipconfig /all shows DHCP Server 192.168.10.77. This indicates:', options: ['A DNS problem', 'A rogue DHCP server at 192.168.10.77', 'A VLAN mismatch', 'Pool exhaustion'], answer: 1, explain: 'An unexpected DHCP server address handing out wrong options.', topic: 'DHCP' },
      { type: 'mcq', q: 'Which switch feature blocks rogue DHCP offers?', options: ['Port security', 'DHCP snooping', 'VTP', 'Spanning tree'], answer: 1, explain: 'DHCP snooping trusts only designated ports for Offers.', topic: 'DHCP' },
      { type: 'mcq', q: 'nslookup against the internal server returns SERVFAIL for google.com but internal names work. Most likely:', options: ['The client has no IP', 'The server\'s forwarder is unreachable or misconfigured', 'The internal zone is missing', 'The switch is down'], answer: 1, explain: 'Internal (authoritative) works; recursion through the forwarder fails.', topic: 'DNS' },
      { type: 'mcq', q: 'Why block outbound DNS from hosts other than the resolver?', options: ['To save bandwidth', 'To prevent malware from bypassing filtering and tunnelling data over DNS', 'DNS only works from servers', 'To stop DHCP'], answer: 1, explain: 'Forces all resolution through the logged, filtered resolver.', topic: 'DNS' },
      { type: 'tf', q: 'A DNS record change is visible to all clients immediately.', answer: false, explain: 'Caches hold the old answer until the TTL expires.', topic: 'DNS' }
    ] }, practical: { type: 'troubleshoot', id: 'ts-03-dns', title: 'Fix a DNS server that is not resolving' }, cert: ['ccna:4.3', 'netplus:3.4'], refs: [] });

  L.push({ id: 'l2-net-07-wireless-security', level: 2, track: 'networking', order: 7, title: 'Wireless Network Security', summary: 'WPA2/WPA3 internals, 802.1X with RADIUS, rogue APs and evil twins, and enterprise WLAN hardening.', minutes: 20, skills: { netadmin: 2, security: 3 }, prereqs: [],
    objectives: ['Compare WPA2-PSK, WPA2-Enterprise and WPA3', 'Explain the 802.1X/EAP/RADIUS authentication flow', 'Identify rogue AP and evil-twin attacks', 'Harden a corporate WLAN design'],
    sections: [
      { type: 'text', title: 'WPA2 and WPA3', md: `**WPA2-Personal (PSK)**: everyone shares one passphrase; the 4-way handshake derives per-client keys. Weaknesses: the handshake can be captured and the passphrase cracked offline if weak; anyone who knows the PSK can decrypt others' traffic; revoking one user means changing it for everyone. KRACK (2017) attacked the handshake itself – patched in modern devices.

**WPA3-Personal**: replaces PSK with **SAE** (Dragonfly), which resists offline dictionary attacks and provides forward secrecy. **WPA3-Enterprise** adds 192-bit mode. Transition mode supports both WPA2 and WPA3 clients.

**Enterprise (802.1X)**: each user or device authenticates individually through the AP (authenticator) to a **RADIUS** server (authentication server) using **EAP** methods: PEAP-MSCHAPv2 (username/password), EAP-TLS (certificates – strongest). Compromised credentials affect one user, and the RADIUS server can assign a VLAN per role (dynamic VLAN assignment) – staff, contractors, IoT.` },
      { type: 'text', title: 'Attacks', md: `- **Evil twin** – an attacker AP broadcasting your SSID with stronger signal; clients auto-join, credentials are captured through a fake portal. Defence: 802.1X with server certificate validation (clients refuse an AP whose RADIUS cert is not trusted), user training, wireless IDS.
- **Rogue AP** – an unauthorized AP plugged into the wired LAN (employee convenience or attacker). Defence: 802.1X on wired ports too, port security, WIDS/WIPS detection, regular surveys.
- **Deauthentication attacks** – forged management frames disconnect clients (used to capture handshakes). Defence: 802.11w Protected Management Frames (mandatory in WPA3).
- **WPS PIN brute force** – disable WPS.
- **Captive portal** networks are *unencrypted*: use a VPN on public Wi-Fi.` },
      { type: 'text', title: 'Enterprise WLAN hardening checklist', md: `1. WPA3 (or WPA2-AES with PMF) – no WEP/TKIP, no WPS.
2. Separate SSIDs mapped to VLANs: corporate (802.1X), guest (isolated, Internet only, client isolation on), IoT (PSK, segmented).
3. RADIUS with EAP-TLS where possible; PEAP with certificate pinning otherwise.
4. Management of APs only from the management VLAN; controller and AP firmware updated.
5. Monitor for rogue SSIDs and APs; log authentications centrally.
6. Guest portal terms, bandwidth limits, and no access to internal subnets (firewall rules, not just VLANs).` },
      { type: 'check', question: { type: 'mcq', q: 'Which design lets you revoke a departing contractor\'s Wi-Fi access without affecting other users?', options: ['WPA2-PSK with a long passphrase', 'WPA2/WPA3-Enterprise with 802.1X and RADIUS', 'Hidden SSID', 'MAC filtering'], answer: 1, explain: 'Per-user credentials can be disabled individually.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'WPA3-Personal improves on WPA2-PSK mainly by:', options: ['Using longer SSIDs', 'SAE, which resists offline dictionary attacks', 'Removing encryption', 'Requiring RADIUS'], answer: 1, explain: 'Simultaneous Authentication of Equals.', topic: 'wireless' },
      { type: 'mcq', q: 'In 802.1X, the access point acts as the:', options: ['Supplicant', 'Authenticator', 'Authentication server', 'Certificate authority'], answer: 1, explain: 'Supplicant = client, authenticator = AP/switch, authentication server = RADIUS.', topic: 'wireless' },
      { type: 'mcq', q: 'An attacker broadcasts your corporate SSID from a laptop in the car park. This is a(n):', options: ['Rogue AP on the wired LAN', 'Evil twin', 'Deauth attack', 'WPS attack'], answer: 1, explain: 'Evil twin impersonates the legitimate network.', topic: 'attacks' },
      { type: 'mcq', q: 'Which EAP method uses client certificates and is considered strongest?', options: ['PEAP-MSCHAPv2', 'EAP-TLS', 'LEAP', 'EAP-MD5'], answer: 1, explain: 'Mutual certificate authentication.', topic: 'wireless' },
      { type: 'mcq', q: 'Protected Management Frames (802.11w) defend against:', options: ['Weak passphrases', 'Deauthentication attacks', 'Rogue DHCP', 'SQL injection'], answer: 1, explain: 'PMF authenticates management frames.', topic: 'attacks' },
      { type: 'tf', q: 'A guest Wi-Fi VLAN alone guarantees guests cannot reach internal servers.', answer: false, explain: 'Firewall rules between VLANs are required; VLANs only separate Layer 2.', topic: 'design' }
    ] }, practical: { type: 'netsim', id: 'sim-06-wifi', title: 'Secure the lab access point' }, cert: ['ccna:5.9', 'netplus:4.3'], refs: [] });

  L.push({ id: 'l2-net-08-acls', level: 2, track: 'networking', order: 8, title: 'Access Control Lists', summary: 'Standard and extended ACLs on Cisco routers: syntax, wildcard masks, placement, and verification.', minutes: 30, skills: { netadmin: 4, security: 2 }, prereqs: ['l2-net-04-routing'],
    objectives: ['Write standard and extended ACL entries with wildcard masks', 'Apply ACLs to interfaces in the correct direction', 'Place standard ACLs near the destination and extended near the source', 'Verify and troubleshoot ACLs'],
    sections: [
      { type: 'text', title: 'ACL basics', md: `An ACL is an ordered list of **permit/deny** statements matched top-down; the first match decides; an **implicit deny any** ends every list. ACLs filter traffic through an interface (**in** = arriving, **out** = leaving) and also classify traffic for NAT, VPNs and QoS.

**Wildcard masks** are inverse masks: 0 = must match, 1 = don't care. /24 → \`0.0.0.255\`; a single host → \`0.0.0.0\` (or \`host 10.1.1.5\`); any address → \`0.0.0.0 255.255.255.255\` (\`any\`).

| Type | Numbers / names | Matches on | Place |
| --- | --- | --- | --- |
| Standard | 1–99, 1300–1999, named | source address only | close to the **destination** |
| Extended | 100–199, 2000–2699, named | source, destination, protocol, ports | close to the **source** |` },
      { type: 'text', title: 'Syntax', md: `\`\`\`
! standard: block one subnet from reaching the server LAN
R1(config)# access-list 10 deny 192.168.20.0 0.0.0.255
R1(config)# access-list 10 permit any
R1(config)# interface g0/1
R1(config-if)# ip access-group 10 out
!
! extended named: Sales may use web and DNS, nothing else, to the server subnet
R1(config)# ip access-list extended SALES-POLICY
R1(config-ext-nacl)# permit tcp 192.168.10.0 0.0.0.255 192.168.1.0 0.0.0.255 eq 80
R1(config-ext-nacl)# permit tcp 192.168.10.0 0.0.0.255 192.168.1.0 0.0.0.255 eq 443
R1(config-ext-nacl)# permit udp 192.168.10.0 0.0.0.255 host 192.168.1.2 eq 53
R1(config-ext-nacl)# deny ip 192.168.10.0 0.0.0.255 192.168.1.0 0.0.0.255
R1(config-ext-nacl)# permit ip any any
R1(config-ext-nacl)# exit
R1(config)# interface g0/0.10
R1(config-subif)# ip access-group SALES-POLICY in
R1# show access-lists
R1# show ip interface g0/0.10 | include access list
\`\`\`
Each line gets a sequence number (10, 20 …) so you can insert or delete individual entries in named ACLs. Add \`log\` to an entry to record matches.` },
      { type: 'demo', title: 'Interactive: ACL tester', demo: 'acl-tester', md: 'Build an ACL and test packets against it; see which line matches and whether the implicit deny catches the rest.' },
      { type: 'text', title: 'Pitfalls', md: `- Forgetting the final \`permit ip any any\` when you only meant to block one thing – everything else dies at the implicit deny.
- Applying in the wrong direction (traffic from Sales entering the router on the Sales sub-interface is **in**, not out).
- Router-originated traffic is not filtered by outbound ACLs; replies to permitted traffic *are* filtered on the way back unless the ACL (or the \`established\` keyword / reflexive ACL) permits them – ACLs are stateless.
- One ACL per interface, per protocol, per direction.
- Standard ACLs near the source block the source from everywhere, not just the intended destination.` },
      { type: 'check', question: { type: 'fill', q: 'What wildcard mask matches exactly the subnet 172.16.32.0/20?', answer: ['0.0.15.255'], explain: '/20 mask is 255.255.240.0; inverted: 0.0.15.255.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'fill', q: 'Wildcard mask for a /26 network:', answer: ['0.0.0.63'], explain: '255.255.255.192 inverted.', topic: 'ACL' },
      { type: 'mcq', q: 'Extended ACLs should be placed:', options: ['Close to the destination', 'Close to the source', 'Only on loopbacks', 'On the ISP router'], answer: 1, explain: 'Drop unwanted traffic before it crosses the network.', topic: 'ACL' },
      { type: 'command', q: 'Type the interface command applying ACL 110 to inbound traffic.', answer: ['^ip\\s+access-group\\s+110\\s+in$'], display: 'ip access-group 110 in', explain: 'ip access-group <acl> in|out.', topic: 'ACL' },
      { type: 'mcq', q: 'An ACL contains only "deny tcp any any eq 23". Its effect when applied is:', options: ['Blocks Telnet only', 'Blocks everything (implicit deny)', 'Permits everything', 'Blocks only UDP'], answer: 1, explain: 'Without a permit statement nothing passes.', topic: 'ACL' },
      { type: 'mcq', q: 'Which ACL type can match on destination port?', options: ['Standard', 'Extended', 'Neither', 'Only numbered 1–99'], answer: 1, explain: 'Extended ACLs match protocol and ports.', topic: 'ACL' },
      { type: 'mcq', q: 'Which command shows how many packets matched each ACL line?', options: ['show ip route', 'show access-lists', 'show vlan', 'show ip nat translations'], answer: 1, explain: 'show access-lists displays match counters.', topic: 'ACL' },
      { type: 'tf', q: 'Router ACLs are stateful by default.', answer: false, explain: 'They evaluate each packet independently.', topic: 'ACL' }
    ] }, practical: { type: 'netsim', id: 'sim-11-acl', title: 'Write and apply an ACL policy' }, cert: ['ccna:5.6', 'netplus:4.3'], refs: [] });

  L.push({ id: 'l2-net-09-vpn', level: 2, track: 'networking', order: 9, title: 'VPN Fundamentals', summary: 'Site-to-site and remote-access VPNs, IPsec and TLS/WireGuard basics, split tunnelling, and common VPN failures.', minutes: 20, skills: { netadmin: 2, security: 2 }, prereqs: ['l2-net-05-nat'],
    objectives: ['Distinguish site-to-site from remote-access VPNs', 'Explain IPsec phases, IKE and ESP at a high level', 'Compare IPsec, SSL/TLS VPNs and WireGuard', 'Troubleshoot overlapping subnets and split tunnelling issues'],
    sections: [
      { type: 'text', title: 'VPN types', md: `A **VPN** creates an encrypted tunnel across an untrusted network so remote sites or users appear to be on the private network.

- **Site-to-site** – router/firewall to router/firewall, always on, transparent to users (branch ↔ HQ, on-prem ↔ cloud VPC). Usually **IPsec**.
- **Remote access** – a client on a laptop connects to a VPN gateway. IPsec/IKEv2, SSL/TLS (OpenVPN, AnyConnect) or WireGuard. MFA is mandatory here – VPN gateways are a top target.
- **Full tunnel** – all client traffic goes through the VPN (inspection, consistent policy, slower). **Split tunnel** – only corporate subnets via VPN, Internet direct (faster, less visibility; a compromised home network can bridge).` },
      { type: 'text', title: 'IPsec in brief', md: `1. **IKE phase 1** – peers authenticate (pre-shared key or certificates) and build a secure management channel (ISAKMP SA). Must agree on encryption (AES-256), hash (SHA-256), DH group, lifetime.
2. **IKE phase 2** – negotiate the IPsec SA for the actual traffic: **ESP** (encryption + integrity) in **tunnel mode** (whole IP packet encapsulated) or transport mode. The "interesting traffic" ACL/crypto map defines which subnets go through the tunnel.
3. Data flows; keys are re-negotiated at lifetime expiry.

Common failures: mismatched proposals (phase 1 never completes), mismatched interesting-traffic definitions (phase 2 fails or only one direction works), NAT in the path without NAT-T (UDP 4500), **overlapping subnets** at both sites (both use 192.168.1.0/24 – fix with NAT or re-addressing), firewall blocking UDP 500/4500 or ESP (protocol 50).

**TLS VPNs** use TCP/UDP 443 and traverse hotel firewalls easily. **WireGuard** is a modern, minimal, very fast protocol with static public keys (UDP 51820), increasingly common in cloud and SMB deployments.` },
      { type: 'check', question: { type: 'mcq', q: 'Two merged companies both use 192.168.1.0/24 and want a site-to-site VPN. What is required?', options: ['Nothing, IPsec handles it', 'NAT over the tunnel or re-addressing one site', 'A longer pre-shared key', 'Split tunnelling'], answer: 1, explain: 'Overlapping subnets cannot be routed; translate or renumber.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'A branch router permanently tunnelling to HQ is a:', options: ['Remote-access VPN', 'Site-to-site VPN', 'Split tunnel', 'Proxy'], answer: 1, explain: 'Device-to-device, always on.', topic: 'VPN' },
      { type: 'mcq', q: 'ESP provides:', options: ['Only authentication', 'Encryption and integrity for IPsec payloads', 'Routing', 'Address assignment'], answer: 1, explain: 'Encapsulating Security Payload.', topic: 'IPsec' },
      { type: 'mcq', q: 'An IPsec tunnel through a NAT device needs:', options: ['NAT-T on UDP 4500', 'Telnet', 'A static route only', 'IPv6'], answer: 0, explain: 'NAT traversal encapsulates ESP in UDP.', topic: 'IPsec' },
      { type: 'mcq', q: 'Split tunnelling means:', options: ['Two VPN servers', 'Only corporate traffic uses the VPN; Internet goes direct', 'The tunnel uses two ciphers', 'Half the users are connected'], answer: 1, explain: 'Trade-off between performance and visibility/control.', topic: 'VPN' },
      { type: 'mcq', q: 'Why is MFA essential on remote-access VPN gateways?', options: ['To speed up connections', 'Stolen passwords are the main way attackers enter through VPNs', 'VPNs cannot encrypt otherwise', 'It is required for IPsec'], answer: 1, explain: 'VPN credentials are heavily targeted.', topic: 'VPN' },
      { type: 'tf', q: 'WireGuard typically uses TCP 443.', answer: false, explain: 'WireGuard uses UDP (default 51820); TLS VPNs use 443.', topic: 'VPN' }
    ] }, practical: null, cert: ['ccna:5.5', 'netplus:4.4'], refs: [] });

  L.push({ id: 'l2-net-10-monitoring', level: 2, track: 'networking', order: 10, title: 'Network Monitoring and Packet Analysis with Wireshark', summary: 'SNMP, syslog, flow data and packet captures: what to collect, how to read a capture, and how to spot problems and attacks.', minutes: 30, skills: { netadmin: 3, security: 2, forensics: 1 }, prereqs: [],
    objectives: ['Describe SNMP, syslog, NetFlow and uptime monitoring', 'Capture traffic in the right place (SPAN/mirror, TAP)', 'Read Wireshark captures: filters, handshake, DNS, HTTP', 'Recognize scans, ARP spoofing and failed connections in a capture'],
    sections: [
      { type: 'text', title: 'Monitoring sources', md: `| Source | What it gives | Tooling |
| --- | --- | --- |
| **SNMP** (161/162 UDP) | interface counters, CPU, memory, errors; traps on events; use **SNMPv3** (v1/v2c send the community string in clear text) | LibreNMS, Zabbix, PRTG, SolarWinds |
| **Syslog** (514 UDP / 6514 TLS) | device event messages with severity 0–7 | rsyslog, Graylog, SIEM |
| **NetFlow / sFlow / IPFIX** | who talked to whom, how much, which ports – without payload | ntopng, ElastiFlow |
| **ICMP/TCP checks** | up/down and latency | Nagios, Uptime Kuma |
| **Packet capture** | everything on the wire | Wireshark, tcpdump |

Baselines turn data into alerts: know normal utilization, error rates and top talkers so that a 2 a.m. spike to an unknown IP stands out. Interface **errors/discards** rising = duplex mismatch, bad cable or oversubscription.` },
      { type: 'text', title: 'Capturing traffic', md: `A switch only sends a port the frames it needs, so capturing on your laptop shows your own traffic plus broadcasts. To see a server's traffic: configure a **SPAN / mirror port** on the switch (\`monitor session 1 source interface fa0/5\`, \`destination interface fa0/8\`), insert a **network TAP**, or capture **on the host** itself (\`tcpdump -i eth0 -w capture.pcap port 80\`).

Capture filters (BPF, applied while capturing): \`host 192.168.1.20\`, \`port 53\`, \`not arp\`. Display filters (Wireshark, applied afterwards): \`ip.addr == 192.168.1.20\`, \`tcp.port == 443\`, \`dns\`, \`http.request\`, \`tcp.flags.syn == 1 && tcp.flags.ack == 0\`, \`tcp.analysis.retransmission\`.

Follow a conversation with *Follow → TCP Stream*; *Statistics → Conversations* and *Endpoints* show top talkers; *Expert Information* flags retransmissions, resets and zero windows.` },
      { type: 'text', title: 'Reading the story', md: `- **Healthy TCP**: SYN → SYN/ACK → ACK, data, FIN/ACK pairs.
- **Closed port**: SYN → RST/ACK. **Filtered**: SYN, SYN retransmissions, no answer.
- **DNS failure**: query, then *No such name* (NXDOMAIN) or no response.
- **Slow application**: large *time delta* between request and response at the server side (server slow) vs retransmissions and duplicate ACKs (network loss).
- **Port scan**: one source sending SYNs to many ports/hosts in seconds, mostly answered by RST.
- **ARP spoofing**: *Duplicate IP address detected* warnings; gateway IP suddenly mapped to a new MAC.
- **Clear-text credentials**: \`http.authorization\`, FTP \`USER/PASS\`, Telnet keystrokes – proof for a finding.
- **Beaconing**: a host contacting the same external IP at a regular interval (malware C2).

You will practise all of these in the packet analysis lab with a provided capture.` },
      { type: 'check', question: { type: 'mcq', q: 'A capture shows your PC sending SYN three times to 10.0.0.5:3389 with no response. The port is:', options: ['Open', 'Closed (RST received)', 'Filtered – something drops the SYN', 'Listening on UDP'], answer: 2, explain: 'Closed ports answer RST; silence means a firewall or no host.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which SNMP version should be used?', options: ['v1', 'v2c', 'v3', 'Any – they are equivalent'], answer: 2, explain: 'v3 adds authentication and encryption.', topic: 'monitoring' },
      { type: 'mcq', q: 'To capture all traffic of a server from another port on the switch you configure a:', options: ['Trunk', 'SPAN/mirror session', 'Default route', 'DHCP relay'], answer: 1, explain: 'Port mirroring copies frames to the analyzer port.', topic: 'capture' },
      { type: 'fill', q: 'Wireshark display filter to show only DNS traffic:', answer: ['dns', 'udp.port == 53', 'udp.port==53'], explain: 'The protocol name works as a filter.', topic: 'Wireshark' },
      { type: 'mcq', q: 'NetFlow data tells you:', options: ['Full packet payloads', 'Who talked to whom, when, ports and byte counts', 'Only link up/down', 'Passwords'], answer: 1, explain: 'Flow metadata without payload.', topic: 'monitoring' },
      { type: 'mcq', q: 'Hundreds of SYN packets from one host to sequential ports on a server within two seconds indicates:', options: ['Normal browsing', 'A port scan', 'DHCP', 'A DNS zone transfer'], answer: 1, explain: 'Scanning pattern.', topic: 'analysis' },
      { type: 'mcq', q: 'A capture shows the gateway IP suddenly associated with a different MAC and "duplicate IP address detected". This suggests:', options: ['ARP spoofing', 'A DHCP lease renewal', 'A VLAN change', 'TLS negotiation'], answer: 0, explain: 'Classic man-in-the-middle indicator.', topic: 'analysis' },
      { type: 'tf', q: 'Capture filters and display filters use the same syntax.', answer: false, explain: 'Capture filters use BPF (e.g. port 53); display filters use Wireshark syntax (dns).', topic: 'Wireshark' }
    ] }, practical: { type: 'security', id: 'sec-05-pcap', title: 'Analyse a packet capture' }, cert: ['netplus:3.2', 'ccna:4.4'], refs: [{ title: 'Wireshark User Guide', url: 'https://www.wireshark.org/docs/wsug_html_chunked/' }] });

  L.push({ id: 'l2-net-11-linux-admin', level: 2, track: 'networking', order: 11, title: 'Linux Networking Administration', summary: 'Persistent network configuration, services, firewalls, logs and the shell skills a Linux administrator uses daily.', minutes: 35, skills: { linux: 5, netadmin: 2 }, prereqs: [],
    objectives: ['Configure interfaces, routes and DNS persistently', 'Manage services with systemctl and read logs with journalctl', 'Control access with ufw/nftables and SSH hardening', 'Use pipes and text tools to analyse network data'],
    sections: [
      { type: 'text', title: 'Interfaces and routing', md: `\`ip\` changes are live but lost at reboot. Persistent configuration depends on the distribution:

- **Netplan** (Ubuntu): \`/etc/netplan/01-netcfg.yaml\` – addresses, gateway4/routes, nameservers; apply with \`sudo netplan apply\`.
- **NetworkManager** (desktops, RHEL): \`nmcli con mod eth0 ipv4.addresses 192.168.1.10/24 ipv4.gateway 192.168.1.1 ipv4.dns 192.168.1.2 ipv4.method manual && nmcli con up eth0\`.
- **systemd-networkd** / \`/etc/network/interfaces\` (Debian) on servers.

Verify: \`ip -br a\`, \`ip r\`, \`resolvectl status\` or \`cat /etc/resolv.conf\`, \`ping -c 3 gateway\`. Name resolution order lives in \`/etc/nsswitch.conf\` (files = /etc/hosts before DNS).` },
      { type: 'text', title: 'Services, sockets and logs', md: `\`\`\`
systemctl status ssh          state, PID, recent log lines
sudo systemctl restart named  restart; enable/disable for boot
ss -tulpn                     what is listening, and which process
journalctl -u ssh -n 50       last 50 lines for a unit
journalctl -p err -b          errors since boot
journalctl -f                 follow live
tail -f /var/log/auth.log     classic log files (Debian/Ubuntu)
\`\`\`
Combine with text tools: \`grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head\` lists the top attacking IPs. \`cut\`, \`sort\`, \`uniq\`, \`wc\` and \`awk\` turn logs into answers – practise them in the terminal labs.` },
      { type: 'text', title: 'Firewall and SSH', md: `\`\`\`
sudo ufw default deny incoming
sudo ufw allow 22/tcp
sudo ufw allow from 192.168.1.0/24 to any port 80
sudo ufw enable
sudo ufw status numbered
\`\`\`
Under the hood ufw drives nftables/iptables (\`sudo iptables -L -n -v\`). Enterprise hosts use firewalld (\`firewall-cmd --add-service=https --permanent\`).

SSH hardening in \`/etc/ssh/sshd_config\`: \`PermitRootLogin no\`, \`PasswordAuthentication no\` (keys only, \`ssh-keygen\` + \`ssh-copy-id\`), \`AllowGroups sshusers\`, optionally change the port and install fail2ban. Validate the file with \`sudo sshd -t\` before \`systemctl restart ssh\`, and keep your current session open until you confirm a new login works.` },
      { type: 'check', question: { type: 'command', q: 'Type the command that shows the last 20 log lines of the ssh unit.', answer: ['^journalctl\\s+-u\\s+ssh(d)?(\\.service)?\\s+-n\\s*20$', '^journalctl\\s+-n\\s*20\\s+-u\\s+ssh(d)?(\\.service)?$'], display: 'journalctl -u ssh -n 20', explain: '-u selects the unit, -n the number of lines.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'command', q: 'Command that lists listening sockets with owning processes:', answer: ['^(sudo\\s+)?ss\\s+-[tulnp]{4,5}$'], display: 'ss -tulpn', explain: 'ss -tulpn.', topic: 'Linux' },
      { type: 'mcq', q: 'Which file should you edit to disable SSH password logins?', options: ['/etc/ssh/ssh_config', '/etc/ssh/sshd_config', '/etc/hosts', '/etc/resolv.conf'], answer: 1, explain: 'sshd_config is the server; ssh_config is the client.', topic: 'SSH' },
      { type: 'mcq', q: 'ip addr add is lost after reboot because:', options: ['The kernel forgets', 'It changes the running state only; persistence needs netplan/NetworkManager config', 'DHCP overrides it', 'It is a syntax error'], answer: 1, explain: 'Live vs persistent configuration.', topic: 'Linux' },
      { type: 'command', q: 'ufw command allowing SSH:', answer: ['^(sudo\\s+)?ufw\\s+allow\\s+(22(/tcp)?|ssh)$'], display: 'sudo ufw allow 22/tcp', explain: 'ufw allow 22/tcp or ufw allow ssh.', topic: 'firewall' },
      { type: 'mcq', q: 'Which pipeline counts failed SSH logins per source IP?', options: ['grep Failed auth.log | wc', 'grep "Failed password" auth.log | awk \'{print $11}\' | sort | uniq -c | sort -rn', 'cat auth.log | head', 'ls -la /var/log'], answer: 1, explain: 'Extract the IP field, sort, count unique, sort by count.', topic: 'logs' },
      { type: 'mcq', q: 'Before restarting sshd after editing its config you should run:', options: ['reboot', 'sshd -t to test the configuration', 'rm sshd_config', 'ufw disable'], answer: 1, explain: 'A syntax error would lock you out.', topic: 'SSH' },
      { type: 'tf', q: 'journalctl -p err shows only messages of priority error and more severe.', answer: true, explain: '-p sets the maximum priority level (lower number = more severe).', topic: 'logs' }
    ] }, practical: { type: 'terminal', id: 'term-10-logs', title: 'Investigate SSH logs and manage services' }, cert: ['linux:networking', 'linux:cli'], refs: [] });

  L.push({ id: 'l2-net-12-windows-server', level: 2, track: 'networking', order: 12, title: 'Windows Server Networking Fundamentals', summary: 'Active Directory, DNS and DHCP roles, Group Policy, file sharing and the PowerShell cmdlets for network administration.', minutes: 25, skills: { windows: 5, netadmin: 2 }, prereqs: [],
    objectives: ['Describe Active Directory domains, domain controllers and DNS dependency', 'Install and verify DHCP and DNS roles conceptually', 'Use PowerShell networking cmdlets', 'Apply Group Policy to enforce network and security settings'],
    sections: [
      { type: 'text', title: 'Active Directory and DNS', md: `**Active Directory Domain Services (AD DS)** is the identity backbone of most organizations: users, groups, computers and policies in a **domain** (corp.local) hosted on **domain controllers (DCs)**. Authentication uses **Kerberos** (port 88) with LDAP (389/636) for directory queries and SMB (445) for SYSVOL/policies.

AD depends completely on **DNS**: clients find DCs through SRV records (\`_ldap._tcp.dc._msdcs.corp.local\`). The DC usually runs the DNS role with AD-integrated zones; every domain member must use the internal DNS servers – pointing a client at 8.8.8.8 breaks logons, Group Policy and share access, a very common ticket.

Join a computer: System → Rename/Join domain (or \`Add-Computer -DomainName corp.local\`); it needs DNS to resolve the domain and network access to a DC.` },
      { type: 'text', title: 'DHCP, file sharing and Group Policy', md: `**DHCP role**: create a scope per subnet (range, exclusions, lease), scope options 003 router, 006 DNS, 015 domain name; **authorize** the server in AD (unauthorized Windows DHCP servers refuse to serve – a rogue-DHCP protection); use failover between two servers. Routers point to it with \`ip helper-address\`.

**File sharing**: SMB shares with two permission layers – share permissions and NTFS permissions (the most restrictive wins). Use groups (AGDLP), never individual users. \`net share\`, \`Get-SmbShare\`, \`icacls\`.

**Group Policy (GPO)** pushes settings to users and computers: Windows Firewall rules, password policy, disabling SMBv1, mapped drives, proxy settings, Defender configuration. \`gpupdate /force\` applies immediately; \`gpresult /r\` shows what applied. GPOs are the main way security baselines are enforced at scale.` },
      { type: 'text', title: 'PowerShell for networking', md: `\`\`\`
Get-NetIPConfiguration                    like ipconfig, object output
Get-NetAdapter | Where Status -eq Up
New-NetIPAddress -InterfaceAlias Ethernet0 -IPAddress 192.168.1.50 -PrefixLength 24 -DefaultGateway 192.168.1.1
Set-DnsClientServerAddress -InterfaceAlias Ethernet0 -ServerAddresses 192.168.1.2
Test-NetConnection fileserver -Port 445   TCP test with route and ping
Resolve-DnsName corp.local -Type SRV
Get-NetTCPConnection -State Listen
Get-DhcpServerv4Lease -ScopeId 192.168.10.0
Get-EventLog Security -InstanceId 4625 -Newest 20    failed logons
\`\`\`
PowerShell output is objects, so you can filter and export: \`Get-NetTCPConnection | Where RemoteAddress -ne '0.0.0.0' | Export-Csv conns.csv\`. Remote administration uses WinRM (\`Enter-PSSession server1\`).` },
      { type: 'check', question: { type: 'mcq', q: 'A domain-joined laptop was manually set to use 8.8.8.8 as DNS. Users report they cannot access shares or apply Group Policy. Why?', options: ['Google blocks SMB', 'The client cannot find domain controllers because AD SRV records live only in the internal DNS', 'DHCP is down', 'The laptop needs IPv6'], answer: 1, explain: 'AD service location depends on internal DNS.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which protocol does Active Directory use for authentication?', options: ['FTP', 'Kerberos', 'SNMP', 'RDP'], answer: 1, explain: 'Kerberos on port 88 (NTLM as fallback).', topic: 'AD' },
      { type: 'mcq', q: 'DHCP scope option 006 configures:', options: ['Default gateway', 'DNS servers', 'Lease time', 'Domain name'], answer: 1, explain: '003 = router, 006 = DNS, 015 = domain name.', topic: 'DHCP' },
      { type: 'mcq', q: 'A share grants Everyone Full Control at the share level and Read at NTFS level. Effective access for a user is:', options: ['Full Control', 'Read', 'Modify', 'No access'], answer: 1, explain: 'The most restrictive of share and NTFS permissions applies.', topic: 'file sharing' },
      { type: 'command', q: 'PowerShell cmdlet to test TCP port 445 on fileserver:', answer: ['^Test-NetConnection\\s+fileserver\\s+-Port\\s+445$', '^tnc\\s+fileserver\\s+-Port\\s+445$'], display: 'Test-NetConnection fileserver -Port 445', explain: 'Test-NetConnection with -Port.', topic: 'PowerShell' },
      { type: 'mcq', q: 'Which command forces Group Policy to reapply on a client?', options: ['gpresult /r', 'gpupdate /force', 'net use', 'ipconfig /renew'], answer: 1, explain: 'gpupdate /force.', topic: 'GPO' },
      { type: 'mcq', q: 'Windows Security event ID 4625 records:', options: ['Successful logon', 'Failed logon', 'Service start', 'Firewall rule change'], answer: 1, explain: '4624 success, 4625 failure.', topic: 'logs' },
      { type: 'tf', q: 'An unauthorized Windows Server DHCP service will still hand out leases in an AD domain.', answer: false, explain: 'Windows DHCP must be authorized in AD; this protects against accidental rogue servers (but not against non-Windows rogues).', topic: 'DHCP' }
    ] }, practical: { type: 'terminal', id: 'term-12-windows-netsh', title: 'Repair a Windows client\'s network configuration' }, cert: ['netplus:3.4', 'secplus:4.0'], refs: [{ title: 'Microsoft Learn: Active Directory Domain Services', url: 'https://learn.microsoft.com/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview' }] });

  NSA.data.lessons = NSA.data.lessons.concat(L);
})(typeof globalThis !== 'undefined' ? globalThis : window);
