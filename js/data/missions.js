/* NetSec Academy – Real-World Missions. Multi-step scenarios combining knowledge checks,
 * decisions and (where relevant) a linked lab, ending in a scored deliverable.
 */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {};
  const M = [];

  M.push({ id: 'mission-01-office-setup', title: 'Small Office Network Setup', level: 1, xp: 250, est: 40, skills: { networking: 3, netadmin: 3 }, icon: '🏢',
    role: 'You have been hired to set up the network for a 15-person startup.',
    scenario: 'The office has one Internet connection, 15 staff, 2 printers and a file server. You must design the addressing, plan the equipment, and stand up a working network with Internet access.',
    tools: ['Network simulator', 'IP addressing plan template (Study Tools)'],
    steps: [
      { id: 's1', type: 'decision', title: 'Choose an address plan', q: 'Which subnet best fits ~20 devices with room to grow, using private space?', options: ['192.168.1.0/24', '10.0.0.0/8 for the whole office', '192.168.1.0/29', '172.16.0.0/30'], answer: 0, explain: 'A /24 gives 254 usable addresses — plenty of headroom for a small office, and is the conventional choice.' },
      { id: 's2', type: 'decision', title: 'Reserve addresses', q: 'What is the best practice for the gateway, server and printers?', options: ['Let DHCP assign everything randomly', 'Static addresses for gateway/server/printers; DHCP pool for staff PCs with those excluded', 'All static', 'All DHCP including the gateway'], answer: 1, explain: 'Infrastructure gets predictable static addresses (excluded from the DHCP pool); user devices use DHCP.' },
      { id: 's3', type: 'decision', title: 'Equipment', q: 'Minimum equipment for this office?', options: ['A hub and a modem', 'A router (with NAT/firewall), a switch, and a wireless access point', 'Two routers only', 'Just a Wi-Fi router is impossible to justify'], answer: 1, explain: 'Router for Internet/NAT, switch for wired devices, AP for Wi-Fi — often combined but conceptually these roles.' },
      { id: 's4', type: 'lab', title: 'Build it', lab: 'sim-10-nat', q: 'Complete the linked simulator lab: addresses configured and the office reaches the Internet through NAT.' },
      { id: 's5', type: 'knowledge', title: 'Verify', q: 'Before handing over, which test confirms end-to-end Internet access from a user PC?', options: ['ping 127.0.0.1', 'ping the gateway only', 'ping 8.8.8.8 and resolve a name (nslookup)', 'Check the cable colour'], answer: 2, explain: 'Reaching an external IP and resolving a name confirms routing, NAT and DNS.' }
    ],
    deliverable: 'A working office network: /24 addressing with reserved infrastructure addresses, DHCP for staff, and verified Internet access. Document it with the IP plan and topology templates.',
    passPct: 80 });

  M.push({ id: 'mission-02-troubleshoot', title: 'Network Troubleshooting Call', level: 1, xp: 250, est: 35, skills: { networking: 4, netadmin: 2 }, icon: '🔧',
    role: 'You are the IT support technician on shift.',
    scenario: 'An employee cannot access the internal file server or the Internet. You must diagnose methodically and restore service.',
    tools: ['Terminal', 'Network simulator'],
    steps: [
      { id: 's1', type: 'decision', title: 'First question', q: 'What do you establish first?', options: ['Reinstall Windows', 'Scope: is it just this user, or everyone? What changed?', 'Replace the switch', 'Reset their password'], answer: 1, explain: 'Scoping (one vs many, recent changes) guides everything that follows.' },
      { id: 's2', type: 'decision', title: 'Layered checks', q: 'The PC shows 169.254.10.5. What does this tell you?', options: ['Static IP is fine', 'DHCP failed — APIPA address', 'DNS problem', 'The server is down'], answer: 1, explain: 'APIPA means no DHCP lease — investigate the cable, VLAN, or DHCP service.' },
      { id: 's3', type: 'lab', title: 'Fix it', lab: 'ts-02-wrong-ip', q: 'Complete the linked troubleshooting lab to restore DHCP and connectivity.' },
      { id: 's4', type: 'knowledge', title: 'Root cause', q: 'What is the professional way to close the ticket?', options: ['Say "it works now"', 'Document the symptom, root cause, fix, and a prevention step', 'Delete the ticket', 'Blame the user'], answer: 1, explain: 'A documented root cause and prevention step is proper practice.' }
    ],
    deliverable: 'Restored connectivity and a short troubleshooting report (symptom, tests, root cause, fix, prevention) using the template in Study Tools.',
    passPct: 80 });

  M.push({ id: 'mission-03-incident', title: 'Security Incident Investigation', level: 2, xp: 300, est: 40, skills: { security: 4, forensics: 2 }, icon: '🔍',
    role: 'You are a junior security analyst.',
    scenario: 'The monitoring system flagged unusual activity on a Linux server overnight. Determine whether it is malicious, scope it, and recommend action.',
    tools: ['Terminal (log analysis)', 'Security lab'],
    steps: [
      { id: 's1', type: 'lab', title: 'Analyse the logs', lab: 'sec-04-logs', q: 'Complete the log investigation lab to identify the attack and whether it succeeded.' },
      { id: 's2', type: 'decision', title: 'Classify', q: 'The logs show many failed root logins then a success as "student" from the same external IP, followed by sudo installing netcat. This is:', options: ['A false positive', 'A successful SSH brute-force leading to compromise', 'Normal admin work', 'A hardware fault'], answer: 1, explain: 'Failures then success then post-exploitation tooling = compromise.' },
      { id: 's3', type: 'decision', title: 'Immediate action', q: 'What do you do first?', options: ['Wipe the server immediately', 'Contain (isolate the host, disable the account, block the IP) while preserving evidence', 'Email everyone', 'Ignore it until morning'], answer: 1, explain: 'Contain and preserve evidence before eradication.' },
      { id: 's4', type: 'knowledge', title: 'Prevention', q: 'Which control would most directly have prevented this?', options: ['A faster CPU', 'SSH key-based auth + MFA + fail2ban, no password root login', 'A longer hostname', 'More RAM'], answer: 1, explain: 'Hardening SSH stops password brute-force.' }
    ],
    deliverable: 'An incident report: timeline, root cause (SSH brute-force), scope (compromised host and account), actions taken, and prevention recommendations. Use the IR report template.',
    passPct: 80 });

  M.push({ id: 'mission-04-vuln-assessment', title: 'Vulnerability Assessment', level: 2, xp: 300, est: 40, skills: { hacking: 3, security: 3 }, icon: '🛡️',
    role: 'You have signed, authorized scope to assess a company\'s lab network.',
    scenario: 'Identify exposed services, rate the findings, and recommend mitigations. Everything runs in the simulator.',
    tools: ['Terminal (nmap)', 'Security assessment lab'],
    steps: [
      { id: 's1', type: 'decision', title: 'Before you start', q: 'What must be in place first?', options: ['A fast laptop', 'Written authorization and a defined scope', 'A new exploit', 'The CEO\'s password'], answer: 1, explain: 'No authorization, no assessment — it would be illegal.' },
      { id: 's2', type: 'lab', title: 'Scan', lab: 'term-11-nmap', q: 'Complete the authorized reconnaissance lab: discover hosts and service versions.' },
      { id: 's3', type: 'lab', title: 'Assess and recommend', lab: 'sec-06-scan', q: 'Classify the findings and choose the correct remediation for each.' },
      { id: 's4', type: 'knowledge', title: 'Prioritize', q: 'Two findings: a critical-CVSS flaw on an isolated lab box, and a Telnet service exposed to all users. Which do you likely prioritize?', options: ['The isolated box always', 'The exposed Telnet — exposure and exploitability raise real-world risk', 'Neither', 'Flip a coin'], answer: 1, explain: 'Context (exposure, reachability) adjusts priority beyond raw CVSS.' }
    ],
    deliverable: 'A vulnerability assessment report: scope, methodology, prioritized findings with evidence and remediation. Use the vulnerability assessment template.',
    passPct: 80 });

  M.push({ id: 'mission-05-enterprise-design', title: 'Enterprise Network Design', level: 3, xp: 400, est: 60, skills: { networking: 4, netadmin: 4, security: 2 }, icon: '🏗️',
    role: 'You are the network engineer for a growing company.',
    scenario: 'Design a secure, segmented network for multiple departments, servers, remote staff and Internet access, with redundancy in mind.',
    tools: ['Network simulator', 'Documentation templates'],
    steps: [
      { id: 's1', type: 'decision', title: 'Segmentation', q: 'How should departments, servers, guests and management be arranged?', options: ['All in one flat subnet', 'Separate VLANs/subnets per function with routing and ACLs between them', 'One VLAN per person', 'Only separate the Wi-Fi'], answer: 1, explain: 'Segmentation by function limits broadcast scope and breach blast radius.' },
      { id: 's2', type: 'decision', title: 'Remote access', q: 'How do remote staff connect securely?', options: ['Open RDP to the Internet', 'A VPN with MFA', 'Email the files', 'Public Wi-Fi only'], answer: 1, explain: 'VPN + MFA is the standard for secure remote access.' },
      { id: 's3', type: 'decision', title: 'Redundancy', q: 'Which single points of failure should you address?', options: ['None, keep it cheap', 'Redundant distribution/core links, dual uplinks, FHRP for the gateway', 'Only buy one big switch', 'Two Internet routers but one switch'], answer: 1, explain: 'No single device/link failure should isolate a user population.' },
      { id: 's4', type: 'lab', title: 'Build a reference design', lab: 'sim-13-enterprise', q: 'Complete the enterprise design lab: multiple segments, inter-segment routing, and Internet via NAT.' },
      { id: 's5', type: 'knowledge', title: 'Document', q: 'What documentation should accompany the design?', options: ['Nothing', 'Topology diagram, IP addressing plan, and device configs', 'Only a price list', 'A single screenshot'], answer: 1, explain: 'Professional designs are documented so others can operate and audit them.' }
    ],
    deliverable: 'A documented enterprise design: segmented topology, IP plan, security controls (segmentation, VPN+MFA, redundancy) and a working reference build. Use the topology and IP plan templates.',
    passPct: 80 });

  M.push({ id: 'mission-06-soc-analyst', title: 'SOC Analyst Challenge', level: 3, xp: 400, est: 50, skills: { security: 5, forensics: 2 }, icon: '🎯',
    role: 'You are a junior SOC analyst on shift.',
    scenario: 'Alerts are coming in. Triage them, investigate the real incident, classify it, and prepare a report.',
    tools: ['Security labs (SIEM triage, packet analysis)'],
    steps: [
      { id: 's1', type: 'lab', title: 'Triage the alerts', lab: 'sec-09-incident', q: 'Complete the SOC incident triage lab: correlate events and classify the incident.' },
      { id: 's2', type: 'lab', title: 'Confirm with packet evidence', lab: 'sec-05-pcap', q: 'Analyse the capture to confirm the exfiltration/C2 activity.' },
      { id: 's3', type: 'decision', title: 'Escalation', q: 'You confirm active intrusion with data exfiltration and Domain Admin escalation. What is correct?', options: ['Close it as low severity', 'Classify High/Critical, contain, preserve evidence, and escalate per the IR plan', 'Reboot everything first', 'Wait for the next shift'], answer: 1, explain: 'Active compromise with exfiltration is critical — contain and escalate.' },
      { id: 's4', type: 'knowledge', title: 'Framework', q: 'Which framework helps you describe the attacker\'s techniques in the report?', options: ['OSI model', 'MITRE ATT&CK', 'DHCP DORA', 'CIDR'], answer: 1, explain: 'ATT&CK provides a shared taxonomy of tactics and techniques.' }
    ],
    deliverable: 'A SOC incident report: alert timeline, evidence (logs + capture), ATT&CK-mapped techniques, severity classification, containment actions and recommendations. Use the incident response template.',
    passPct: 80 });

  NSA.data.missions = M;
})(typeof globalThis !== 'undefined' ? globalThis : window);
