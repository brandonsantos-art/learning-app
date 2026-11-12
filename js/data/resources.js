/* NetSec Academy – certification prep maps, documentation templates, career readiness content */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {};

  NSA.data.certs = [
    { id: 'netplus', title: 'CompTIA Network+ (N10-009)', desc: 'Vendor-neutral networking fundamentals: concepts, implementation, operations, security and troubleshooting. Lessons below map to the official objective domains. Completing this track does not grant a certification – it prepares you to study for and sit the exam.', url: 'https://www.comptia.org/certifications/network', domains: [
      { name: '1.0 Networking Concepts', lessons: ['l1-net-01-intro', 'l1-net-02-types', 'l1-net-03-models', 'l1-net-04-topologies', 'l1-net-05-devices', 'l1-net-06-ipv4', 'l1-net-07-ipv6', 'l1-net-08-public-private', 'l1-net-09-subnetting', 'l1-net-12-tcp-udp', 'l1-net-13-ports', 'l2-net-01-addressing', 'l2-net-02-subnetting', 'l3-net-04-cloud'] },
      { name: '2.0 Network Implementation', lessons: ['l2-net-03-vlans', 'l2-net-04-routing', 'l2-net-05-nat', 'l1-net-15-wifi', 'l3-net-02-routing'] },
      { name: '3.0 Network Operations', lessons: ['l2-net-10-monitoring', 'l2-net-06-dhcp-dns', 'l3-net-05-automation', 'l3-net-06-performance'] },
      { name: '4.0 Network Security', lessons: ['l1-sec-02-cia', 'l2-net-07-wireless-security', 'l2-net-08-acls', 'l2-net-09-vpn', 'l2-sec-02-attacks', 'l3-net-03-firewalls'] },
      { name: '5.0 Network Troubleshooting', lessons: ['l1-net-14-commands', 'l2-net-06-dhcp-dns', 'l3-net-06-performance'] }
    ] },
    { id: 'secplus', title: 'CompTIA Security+ (SY0-701)', desc: 'Baseline cybersecurity skills: general security concepts, threats and vulnerabilities, architecture, operations and program management.', url: 'https://www.comptia.org/certifications/security', domains: [
      { name: '1.0 General Security Concepts', lessons: ['l1-sec-01-intro', 'l1-sec-02-cia', 'l1-sec-06-mfa', 'l3-sec-05-crypto'] },
      { name: '2.0 Threats, Vulnerabilities & Mitigations', lessons: ['l1-sec-03-threats', 'l1-sec-04-malware', 'l2-sec-01-vuln-assessment', 'l2-sec-02-attacks', 'l2-sec-03-web-attacks'] },
      { name: '3.0 Security Architecture', lessons: ['l1-sec-07-firewalls-av', 'l3-net-03-firewalls', 'l3-sec-06-cloud-grc', 'l2-net-09-vpn'] },
      { name: '4.0 Security Operations', lessons: ['l1-sec-05-passwords', 'l2-sec-04-access-control', 'l2-sec-05-logs-siem', 'l3-sec-04-soc', 'l3-sec-03-forensics'] },
      { name: '5.0 Security Program Management', lessons: ['l1-sec-08-best-practices', 'l2-sec-06-policies-risk', 'l3-sec-06-cloud-grc'] }
    ] },
    { id: 'ccna', title: 'Cisco CCNA (200-301)', desc: 'Network fundamentals, access, IP connectivity, IP services, security fundamentals and automation. The router/switch CLI labs use Cisco IOS syntax.', url: 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html', domains: [
      { name: '1.0 Network Fundamentals', lessons: ['l1-net-03-models', 'l1-net-05-devices', 'l1-net-06-ipv4', 'l1-net-07-ipv6', 'l1-net-09-subnetting', 'l2-net-02-subnetting', 'l1-net-15-wifi', 'l1-net-12-tcp-udp'] },
      { name: '2.0 Network Access', lessons: ['l2-net-03-vlans', 'l2-net-07-wireless-security'] },
      { name: '3.0 IP Connectivity', lessons: ['l2-net-04-routing', 'l3-net-02-routing'] },
      { name: '4.0 IP Services', lessons: ['l2-net-05-nat', 'l2-net-06-dhcp-dns', 'l2-net-10-monitoring'] },
      { name: '5.0 Security Fundamentals', lessons: ['l2-net-08-acls', 'l2-net-09-vpn', 'l1-sec-05-passwords', 'l1-sec-06-mfa'] },
      { name: '6.0 Automation and Programmability', lessons: ['l3-net-05-automation'] }
    ] },
    { id: 'linux', title: 'Linux Essentials / Linux+ foundations', desc: 'Command line, filesystem, users and permissions, networking and services on Linux.', url: 'https://www.lpi.org/our-certifications/linux-essentials-overview/', domains: [
      { name: 'Command line & filesystem', lessons: ['l1-net-14-commands', 'l2-net-11-linux-admin'] },
      { name: 'Users, groups & permissions', lessons: ['l2-sec-04-access-control', 'l2-net-11-linux-admin'] },
      { name: 'Networking & services', lessons: ['l2-net-06-dhcp-dns', 'l2-net-11-linux-admin', 'l2-sec-05-logs-siem'] }
    ] },
    { id: 'entrysec', title: 'Entry-level cybersecurity (ISC2 CC / Google Cybersecurity / SOC analyst)', desc: 'Foundational security principles, network security, incident response and SOC skills for entry-level roles.', url: 'https://www.isc2.org/certifications/cc', domains: [
      { name: 'Security principles', lessons: ['l1-sec-01-intro', 'l1-sec-02-cia', 'l1-sec-08-best-practices'] },
      { name: 'Access control & network security', lessons: ['l1-sec-06-mfa', 'l1-sec-07-firewalls-av', 'l2-sec-04-access-control', 'l2-net-08-acls'] },
      { name: 'Incident response & operations', lessons: ['l2-sec-05-logs-siem', 'l3-sec-04-soc', 'l3-sec-03-forensics'] }
    ] }
  ];

  NSA.data.templates = [
    { id: 'tpl-topology', title: 'Network topology diagram checklist', category: 'Documentation', md: `# Network topology diagram – checklist

A good diagram answers "what talks to what, and through which device" at a glance.

**Must include**
- Every router, switch, firewall, server and the Internet/ISP edge, with hostnames.
- Links with interface names on both ends (R1 G0/0 ↔ SW1 Fa0/24).
- Subnets written next to each segment (192.168.10.0/24, VLAN 10 – Sales).
- Gateway addresses, DNS/DHCP server addresses, public IP of the edge.
- A legend (colours for VLANs/zones, line styles for trunks/WAN/wireless).
- Title block: company, author, date, version.

**Good practice**
- Separate physical (cables, ports) and logical (subnets, VLANs, zones) diagrams for anything beyond a small office.
- Keep the Internet at the top (or left) and end devices at the bottom – readers expect a flow.
- Export a PDF/PNG with the source file (draw.io / Visio / Lucidchart) stored next to it.
- Update the diagram as part of every change ticket; an outdated diagram is worse than none.

**Example (text form)**
\`\`\`
Internet ── (203.0.113.2/30) R1-EDGE G0/0
                              R1-EDGE G0/1 (192.168.1.1/24) ── SW1 Fa0/24 (trunk)
                                 VLAN 10 Sales   192.168.10.0/24  gw .1
                                 VLAN 20 Eng     192.168.20.0/24  gw .1
                                 VLAN 99 Mgmt    192.168.99.0/24  gw .1
SRV1 (DNS/DHCP/Files) 192.168.1.2  ── SW1 Fa0/1 (VLAN 1)
\`\`\`` },
    { id: 'tpl-ipplan', title: 'IP addressing plan', category: 'Documentation', md: `# IP addressing plan – template

| Subnet | VLAN | Purpose | Gateway | DHCP range | Static range | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 192.168.10.0/24 | 10 | Sales workstations | 192.168.10.1 | .100–.199 | .2–.99 | printers .50–.59 |
| 192.168.20.0/24 | 20 | Engineering | 192.168.20.1 | .100–.199 | .2–.99 | |
| 192.168.1.0/24 | 1 | Servers | 192.168.1.1 | none | .2–.254 | all static, documented below |
| 192.168.99.0/24 | 99 | Management | 192.168.99.1 | none | .2–.254 | switches, APs, iLO |
| 10.0.0.0/30 | – | R1 ↔ R2 link | – | – | .1 / .2 | |

**Static assignments**

| Host | IP | MAC | Role | Owner |
| --- | --- | --- | --- | --- |
| SRV1 | 192.168.1.2 | 02:00:00:00:00:02 | DNS, DHCP | IT |
| SRV2 | 192.168.1.3 | 02:00:00:00:00:03 | File server | IT |

**Rules**
- Gateways are always the first usable address (.1).
- Infrastructure (switches, APs) lives in the management VLAN only.
- Reserve 20% of every subnet for growth before you declare it full.
- Record changes with a date and a ticket number.` },
    { id: 'tpl-config', title: 'Device configuration documentation', category: 'Documentation', md: `# Device configuration record

**Device:** R1-EDGE  **Model:** ISR 4321  **IOS:** 15.2  **Location:** Rack 1, U12
**Management IP:** 192.168.99.2  **Credentials:** in password manager (vault item "R1-EDGE")

## Interfaces
| Interface | Description | IP / mask | Connected to |
| --- | --- | --- | --- |
| G0/0 | ISP uplink | 203.0.113.2/30 | ISP handoff |
| G0/1 | LAN trunk | sub-interfaces .10/.20/.99 | SW1 Fa0/24 |

## Routing
- Default route: 0.0.0.0/0 via 203.0.113.1
- NAT: inside G0/1, outside G0/0, PAT overload, ACL 1 permits 192.168.0.0/16

## Services
- DHCP pools: SALES (192.168.10.0/24), ENG (192.168.20.0/24); excluded .1–.99
- ACL BLOCK-GUEST applied inbound on G0/1.30

## Change log
| Date | Ticket | Change | By |
| --- | --- | --- | --- |
| 2026-11-12 | CHG-1042 | Added VLAN 30 guest sub-interface | A. Admin |

## Backup
Running-config exported after every change to the config repository ("show running-config" → git).` },
    { id: 'tpl-vuln', title: 'Vulnerability assessment report', category: 'Security reports', md: `# Vulnerability assessment report

**Client / system:** ACME Corp – internal network 192.168.0.0/16
**Assessment window:** 2026-11-10 to 2026-11-12  **Assessor:** (name)  **Authorization:** signed scope letter #42

## 1. Executive summary
Two or three sentences a manager can read: overall risk, number of critical/high findings, the single most important action.

## 2. Scope and methodology
- Hosts in scope, hosts excluded, testing hours.
- Tools: Nmap (host discovery, service detection), vulnerability scanner, manual verification.
- Approach: discovery → enumeration → vulnerability identification → validation → reporting.

## 3. Findings (highest severity first)
| # | Severity (CVSS) | Host | Finding | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| 1 | Critical 9.8 | 192.168.1.20 | Telnet enabled with default credentials | nmap 23/tcp open; login admin/admin | Disable Telnet, enforce SSH with key auth |
| 2 | High 7.5 | 192.168.1.2 | Apache 2.4.49 path traversal (CVE-2021-41773) | banner, test request | Upgrade to current release |

For each finding give: description, impact, affected assets, evidence (commands/screenshots), remediation, references (CVE, vendor advisory).

## 4. Remediation plan
Prioritize by severity and effort; assign owners and target dates.

## 5. Appendix
Raw scan output, host inventory, tool versions.` },
    { id: 'tpl-ir', title: 'Incident response report', category: 'Security reports', md: `# Incident report – INC-2026-0113

**Reported:** 2026-11-12 09:40  **Reporter:** SIEM alert "Multiple failed logins"  **Handler:** (name)
**Severity:** High  **Status:** Contained

## 1. Summary
One paragraph: what happened, when, what was affected, current status.

## 2. Timeline (UTC)
| Time | Event | Source |
| --- | --- | --- |
| 09:12 | 480 failed SSH logins against SRV1 from 203.0.113.50 | auth.log |
| 09:31 | Successful login as "backup" from the same IP | auth.log |
| 09:40 | Alert raised, analyst assigned | SIEM |
| 09:55 | Host isolated from network | firewall change CHG-1050 |

## 3. Analysis
- Indicators of compromise (IPs, hashes, accounts, files).
- Attack vector and techniques (map to MITRE ATT&CK where possible: T1110 Brute Force, T1078 Valid Accounts).
- Scope: systems and data affected; evidence that others were not.

## 4. Actions taken
Containment → eradication → recovery, each with time and owner.

## 5. Root cause
Why it was possible (password-only SSH exposed to the Internet, weak password, no lockout).

## 6. Recommendations / lessons learned
Concrete, owned, dated: enforce key-based SSH, enable fail2ban, MFA on remote access, review exposed services monthly.

## 7. Evidence handling
List evidence collected, hashes, storage location and chain of custody.` },
    { id: 'tpl-audit', title: 'Security audit report', category: 'Security reports', md: `# Security audit report

**Organization:** (name)  **Standard / baseline:** CIS Controls v8 (IG1) / ISO 27001 Annex A  **Period:** Q4 2026

## Scope
Systems, locations, processes and controls reviewed; interviews conducted; evidence requested.

## Methodology
Document review → interviews → technical verification (configuration review, sampling) → gap analysis.

## Control assessment
| Control | Requirement | Status | Evidence | Gap / risk |
| --- | --- | --- | --- | --- |
| CIS 1 Inventory | Maintain asset inventory | Partial | spreadsheet last updated 6 months ago | unknown devices on network |
| CIS 5 Account mgmt | Disable dormant accounts | Non-compliant | 14 accounts inactive > 90 days | credential misuse |
| CIS 6 Access control | MFA for remote access | Compliant | VPN enforces MFA | – |

## Findings and recommendations
Each finding: risk rating, description, business impact, recommendation, owner, target date.

## Conclusion
Overall maturity statement and the top three priorities.` },
    { id: 'tpl-ts', title: 'Technical troubleshooting report', category: 'Documentation', md: `# Troubleshooting report – ticket #

**Reported symptom:** "I cannot open the intranet site" (user, department, time)
**Impact:** 1 user / 1 department / site-wide
**Priority:** P3

## 1. Information gathered
- What exactly fails? Error text, screenshots, affected URL/host.
- Scope: one user, one subnet, everyone? Since when? What changed?
- Checks: ipconfig /all, ping gateway, ping server IP, nslookup name, tracert.

## 2. Hypotheses tested (bottom-up)
| Layer | Test | Result |
| --- | --- | --- |
| 1 Physical | link light, cable | OK |
| 2/3 Addressing | ipconfig: 169.254.4.20 | FAIL – APIPA, no DHCP lease |
| ... | | |

## 3. Root cause
DHCP service stopped on SRV1 after patching (service not set to start automatically).

## 4. Resolution
Started service, set to automatic, client renewed lease (ipconfig /renew). Verified access.

## 5. Prevention
Monitoring check for the DHCP service; post-patch checklist updated.

**Time to resolve:** 35 min  **Escalated:** no` }
  ];

  NSA.data.career = {
    roles: [
      { id: 'support', title: 'IT Support Specialist', salary: 'Entry level', skills: ['Windows and Linux basics, user accounts, printers', 'ipconfig / ping / nslookup / tracert triage', 'Ticketing, documentation and communication', 'Basic networking: IP, DHCP, DNS, Wi-Fi', 'Security hygiene: phishing, MFA, patching'], lessons: ['l1-net-14-commands', 'l1-net-11-services', 'l1-sec-04-malware', 'l1-sec-08-best-practices'], labs: ['ts-01-no-internet', 'ts-02-wrong-ip', 'ts-03-dns'] },
      { id: 'netadmin', title: 'Network Administrator', salary: 'Mid level', skills: ['VLANs, trunks, inter-VLAN routing', 'Static routing, OSPF basics, NAT', 'DHCP/DNS services, ACLs, VPN', 'Monitoring and packet analysis', 'Change management and documentation'], lessons: ['l2-net-03-vlans', 'l2-net-04-routing', 'l2-net-05-nat', 'l2-net-08-acls', 'l2-net-10-monitoring'], labs: ['sim-08-vlans', 'sim-09-static-routes', 'sim-10-nat', 'term-14-ios-vlans'] },
      { id: 'neteng', title: 'Network Engineer', salary: 'Senior', skills: ['Enterprise design: core/distribution/access, redundancy', 'OSPF and BGP', 'Firewalls, segmentation, zero trust', 'Cloud networking (VPC, VNet, VPN/Direct Connect)', 'Automation with Python'], lessons: ['l3-net-01-architecture', 'l3-net-02-routing', 'l3-net-03-firewalls', 'l3-net-04-cloud', 'l3-net-05-automation'], labs: ['sim-13-enterprise', 'sim-12-firewall-dmz'] },
      { id: 'soc', title: 'Junior SOC Analyst', salary: 'Entry level', skills: ['Log analysis and SIEM queries', 'Alert triage and classification (true/false positive)', 'Phishing analysis, IoC extraction', 'Packet analysis basics', 'Incident documentation and escalation'], lessons: ['l2-sec-05-logs-siem', 'l3-sec-04-soc', 'l1-sec-04-malware', 'l2-net-10-monitoring'], labs: ['sec-04-logs', 'sec-05-pcap', 'sec-09-incident', 'sec-01-phishing'] },
      { id: 'pentest', title: 'Penetration Tester (fundamentals)', salary: 'Mid level', skills: ['Methodology: scoping, recon, enumeration, exploitation, reporting', 'Nmap and service enumeration', 'Web application testing (OWASP Top 10)', 'Active Directory attack paths', 'Clear, reproducible reporting'], lessons: ['l2-sec-01-vuln-assessment', 'l2-sec-03-web-attacks', 'l3-sec-01-pentest', 'l3-sec-02-ad'], labs: ['sec-06-scan', 'sec-07-webapp', 'term-11-nmap'] }
    ],
    interview: [
      { q: 'A user says "the Internet is down". What do you check first?', a: 'Scope it: is it one user or everyone? Then bottom-up on the user\'s machine: link light, ipconfig (valid IP or APIPA?), ping the gateway, ping 8.8.8.8 (IP works?), nslookup (DNS works?). Each test isolates a layer.' },
      { q: 'Explain the difference between a switch and a router.', a: 'A switch forwards frames within a LAN using MAC addresses (Layer 2) and keeps one broadcast domain. A router forwards packets between networks using IP addresses and a routing table (Layer 3) and separates broadcast domains.' },
      { q: 'What happens when you type a URL in a browser?', a: 'DNS resolves the name (cache → resolver → authoritative), the client ARPs for the gateway, TCP three-way handshake to port 443, TLS handshake validates the certificate, then HTTP request/response; the page loads additional resources the same way.' },
      { q: 'What is the difference between TCP and UDP, and when would you choose each?', a: 'TCP is reliable and ordered with connection setup (web, email, file transfer). UDP is connectionless and lightweight (DNS, DHCP, VoIP, video) where speed matters more than retransmission.' },
      { q: 'How many usable hosts in a /26? What is its mask?', a: '62 usable hosts (64 − 2), mask 255.255.255.192.' },
      { q: 'A host has 169.254.12.7. What does that tell you?', a: 'It is an APIPA address: the DHCP client got no lease. Check the cable/VLAN, the DHCP server service, scope exhaustion or a missing DHCP relay.' },
      { q: 'What is the CIA triad and give one control for each.', a: 'Confidentiality (encryption, access control), Integrity (hashing, digital signatures, change control), Availability (backups, redundancy, DDoS protection).' },
      { q: 'How do you recognize a phishing email?', a: 'Mismatched or look-alike sender domain, urgency or threats, unexpected attachments or links whose real URL differs from the text, generic greeting, requests for credentials or payment changes. Verify through a known channel, report it, never click.' },
      { q: 'What is the difference between an IDS and an IPS?', a: 'An IDS monitors and alerts (passive); an IPS sits inline and can block traffic. Both use signatures and anomaly detection.' },
      { q: 'What is NAT and why is it needed?', a: 'Network Address Translation rewrites private addresses to a public address at the edge so many internal hosts can share one public IP, conserving IPv4 space and hiding internal addressing.' },
      { q: 'Explain VLANs and why a company uses them.', a: 'VLANs split one physical switch into separate broadcast domains, improving security and performance by isolating departments (Sales vs Engineering vs guest Wi-Fi). Routing between VLANs needs a Layer 3 device.' },
      { q: 'What would you do first after discovering a compromised workstation?', a: 'Isolate it from the network (do not power off if volatile evidence matters), preserve evidence, notify the incident lead, identify the scope (other hosts, accounts), then eradicate and recover from a known-good image and reset credentials.' },
      { q: 'How does traceroute work?', a: 'It sends packets with TTL 1, 2, 3 ...; each router that decrements TTL to 0 returns ICMP Time Exceeded, revealing its address. The destination replies to the final probe.' },
      { q: 'What is the principle of least privilege?', a: 'Users and processes should have only the permissions required for their tasks, limiting the damage of mistakes or compromise.' },
      { q: 'What is the difference between hashing and encryption?', a: 'Hashing is one-way and fixed-length, used for integrity and password storage. Encryption is reversible with a key, used for confidentiality.' }
    ],
    challenges: [
      { title: 'Live troubleshooting', desc: 'Interviewers often give a scenario ("users in Sales cannot reach the file server") and want to hear your method. Practise explaining out loud: scope → layer-by-layer tests → hypothesis → fix → verify → document.', lab: 'ts-04-vlans' },
      { title: 'Subnet on the whiteboard', desc: 'Be ready to subnet 192.168.1.0/24 into departments of 60, 30 and 10 hosts in under three minutes.', lab: 'challenge:subnet' },
      { title: 'Read a packet capture', desc: 'Identify the three-way handshake, a DNS query and a failed connection in a capture.', lab: 'sec-05-pcap' },
      { title: 'Configure a router from scratch', desc: 'Hostname, interfaces, default route, DHCP pool, NAT – in the CLI, from memory.', lab: 'term-15-ios-acl-nat' }
    ],
    portfolio: [
      'Home lab write-up: build a two-VLAN network with a router-on-a-stick, document it with a diagram, IP plan and configs (use the simulator export).',
      'Troubleshooting journal: ten real or simulated tickets with symptoms, tests, root cause and fix.',
      'Security assessment of a deliberately vulnerable VM (Metasploitable / DVWA) with a professional report using the template in Study Tools.',
      'Python automation script that backs up device configs or audits DHCP leases, published on GitHub with a README.',
      'Phishing awareness one-pager for a small business, including three real examples you analysed.',
      'Incident response playbook for ransomware on a small network (roles, steps, contact list, recovery checklist).'
    ]
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
