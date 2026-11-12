/* NetSec Academy – Cybersecurity lab definitions (interactive, data-driven).
 * Each lab has a "kind" the security-lab view knows how to render and grade.
 */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.labs = NSA.data.labs || {};
  const labs = [];

  // --- Phishing triage ---
  labs.push({ id: 'sec-01-phishing', title: 'Phishing Triage', level: 1, xp: 90, skills: { security: 4 }, est: 15, kind: 'phishing',
    brief: 'You are triaging a shared mailbox. For each message, decide: Legitimate, or Phishing. Read the sender, links and content carefully.',
    emails: [
      { from: 'IT Service Desk <helpdesk@corp.local>', subject: 'Scheduled maintenance this weekend', body: 'Hi team,\n\nEmail servers will be briefly unavailable Saturday 02:00–03:00 for patching. No action is required. Contact x4411 with questions.\n\n— IT Service Desk', link: 'https://intranet.corp.local/maintenance', verdict: 'legit', why: 'Internal domain, no urgency, no credential request, informational only.' },
      { from: 'Microsoft 365 <security@micros0ft-alerts.com>', subject: 'Unusual sign-in — verify within 24 hours', body: 'We detected a sign-in from a new device. Your account will be LOCKED in 24 hours unless you verify now.', link: 'https://micros0ft-alerts.com/login?verify=1', verdict: 'phish', why: 'Look-alike domain (micros0ft with a zero), urgency/threat, credential-harvesting link that is not a Microsoft domain.' },
      { from: 'DocuSign <dse@docusign.net>', subject: 'Please review the renewed NDA', body: 'Alex sent you a document to sign. The reference matches the contract your manager mentioned this week.', link: 'https://account.docusign.com.verify-doc.net/review', verdict: 'phish', why: 'The real domain is verify-doc.net, not docusign.com — the brand name is only a subdomain. Hover the link and read right-to-left.' },
      { from: 'Payroll <payroll@corp.local>', subject: 'Direct deposit confirmation', body: 'Your payslip for this month is available on the portal. Log in with your normal SSO.', link: 'https://portal.corp.local/payslips', verdict: 'legit', why: 'Internal domain, points to the known portal, no attachment, no unusual request.' },
      { from: 'CEO Jordan Blake <jordan.blake.ceo@gmail.com>', subject: 'Quick task — are you at your desk?', body: 'I\'m in a meeting and need you to purchase five $200 gift cards for client thank-yous. Send me the codes, I\'ll reimburse you. Keep this confidential.', link: '', verdict: 'phish', why: 'Business email compromise: external gmail address impersonating the CEO, gift-card request, urgency and secrecy. Verify via a known channel.' },
      { from: 'Jira <jira@corp.atlassian.net>', subject: 'You were mentioned in NET-482', body: 'Priya mentioned you on a ticket about the branch VLAN. View the comment in Jira.', link: 'https://corp.atlassian.net/browse/NET-482', verdict: 'legit', why: 'Legitimate Atlassian cloud domain for your org, expected workflow, no credential request.' },
      { from: 'HR Benefits <benefits@corp-hr-portal.com>', subject: 'ACTION REQUIRED: Re-enroll your benefits', body: 'Open enrollment closes today. Click to re-enter your SSN and bank details to keep coverage.', link: 'http://corp-hr-portal.com/enroll', verdict: 'phish', why: 'External look-alike domain, plain HTTP, asks for SSN and bank details, artificial deadline. HR never collects this by emailed link.' },
      { from: 'GitHub <noreply@github.com>', subject: '[corp/net-automation] New pull request', body: 'A pull request was opened against the net-automation repo you watch.', link: 'https://github.com/corp/net-automation/pull/57', verdict: 'legit', why: 'Genuine GitHub notification domain, matches a repo you watch, no credential request.' }
    ],
    passPct: 75 });

  // --- Password / policy ---
  labs.push({ id: 'sec-02-password', title: 'Password Strength and Policy', level: 1, xp: 80, skills: { security: 3 }, est: 12, kind: 'password',
    brief: 'Part 1: test passwords and see how crackable they are. Part 2: fix a weak password policy by selecting the better options.',
    policy: [
      { q: 'Minimum length', options: ['6 characters', '8 characters', '12+ characters'], answer: 2, why: 'Length is the biggest factor against offline cracking; aim for 12–15+.' },
      { q: 'Expiration', options: ['Every 30 days', 'Every 90 days', 'Only on evidence of compromise'], answer: 2, why: 'NIST advises against forced rotation; it leads to predictable patterns.' },
      { q: 'Composition rules', options: ['Require upper, lower, digit, symbol', 'Allow long passphrases, no composition rules', 'Require a symbol only'], answer: 1, why: 'Modern guidance drops composition rules in favour of length and breach checks.' },
      { q: 'Reuse of breached passwords', options: ['Allowed', 'Blocked against known-breach lists', 'Checked yearly'], answer: 1, why: 'Blocking known-compromised passwords stops credential stuffing.' },
      { q: 'Additional control', options: ['Security questions', 'Multi-factor authentication', 'CAPTCHA only'], answer: 1, why: 'MFA defeats password-only attacks even when the password is weak.' }
    ],
    passPct: 80 });

  // --- Firewall policy builder ---
  labs.push({ id: 'sec-03-firewall', title: 'Build a Firewall Policy', level: 1, xp: 90, skills: { security: 3, netadmin: 1 }, est: 18, kind: 'firewall',
    brief: 'A small office needs a firewall policy. Decide ALLOW or DENY for each requested flow, keeping the default policy at the end as implicit deny. Follow least privilege.',
    zones: 'LAN (10.0.0.0/24), DMZ web server (172.16.0.10), WAN (Internet). Default policy: DENY.',
    rules: [
      { flow: 'LAN → Internet, TCP 443 (HTTPS browsing)', answer: 'allow', why: 'Users need to browse the web securely.' },
      { flow: 'LAN → Internet, TCP 80 (HTTP)', answer: 'allow', why: 'Legacy web still needed; often allowed alongside 443.' },
      { flow: 'Internet → DMZ web server, TCP 443', answer: 'allow', why: 'The public must reach the web server over HTTPS.' },
      { flow: 'Internet → DMZ web server, TCP 22 (SSH)', answer: 'deny', why: 'Management must not be exposed to the Internet; administer from the LAN/VPN.' },
      { flow: 'Internet → LAN, any', answer: 'deny', why: 'No unsolicited inbound to the internal network; stateful replies are automatic.' },
      { flow: 'DMZ web server → LAN database, TCP 3306', answer: 'deny', why: 'A compromised DMZ host must not reach the internal database; if truly needed, allow only the specific DB host and port — here it is not required.' },
      { flow: 'LAN → DMZ web server, TCP 443 (internal access)', answer: 'allow', why: 'Staff may use the web app.' },
      { flow: 'Internet → DMZ web server, ICMP echo', answer: 'deny', why: 'No need to allow ping from the Internet; reduces reconnaissance (optional, but least privilege).' }
    ],
    passPct: 80 });

  // --- Log investigation ---
  labs.push({ id: 'sec-04-logs', title: 'Investigate Security Logs', level: 2, xp: 130, skills: { security: 4, forensics: 2 }, est: 25, kind: 'logs',
    brief: 'Review the authentication log below and answer the investigation questions. Flag the suspicious lines.',
    logLabel: '/var/log/auth.log (excerpt)',
    log: [
      { t: '02:14:03', m: 'sshd: Failed password for root from 203.0.113.66 port 40122 ssh2', flag: true },
      { t: '02:14:05', m: 'sshd: Failed password for root from 203.0.113.66 port 40126 ssh2', flag: true },
      { t: '02:14:09', m: 'sshd: Failed password for invalid user admin from 203.0.113.66 port 40140 ssh2', flag: true },
      { t: '02:14:14', m: 'sshd: Failed password for invalid user oracle from 203.0.113.66 port 40155 ssh2', flag: true },
      { t: '02:15:40', m: 'sshd: Accepted password for student from 203.0.113.66 port 41020 ssh2', flag: true },
      { t: '02:15:40', m: 'sshd: session opened for user student(uid=1000)', flag: false },
      { t: '02:16:22', m: 'sudo: student : TTY=pts/1 ; PWD=/home/student ; USER=root ; COMMAND=/usr/bin/apt install netcat', flag: true },
      { t: '02:17:01', m: 'sshd: Accepted password for backup from 10.0.0.9 port 51880 ssh2', flag: false },
      { t: '06:00:01', m: 'CRON: (root) CMD (run-parts /etc/cron.daily)', flag: false }
    ],
    questions: [
      { type: 'mcq', q: 'What type of attack do the 02:14 entries show?', options: ['A port scan', 'An SSH brute-force / password-guessing attack', 'A DDoS', 'Normal logins'], answer: 1, explain: 'Many rapid failed passwords for root/admin from one IP.' },
      { type: 'fill', q: 'Which source IP address is the attacker?', answer: ['203.0.113.66'], explain: 'All the failures and the eventual success come from 203.0.113.66.' },
      { type: 'mcq', q: 'Did the attacker gain access, and as whom?', options: ['No, all attempts failed', 'Yes, as root directly', 'Yes, as "student" at 02:15:40', 'Yes, as "backup"'], answer: 2, explain: 'The Accepted password for student from the same attacking IP indicates compromise.' },
      { type: 'mcq', q: 'What did the attacker do after logging in?', options: ['Nothing', 'Used sudo to install netcat', 'Changed the hostname', 'Rebooted'], answer: 1, explain: 'The sudo line shows apt install netcat — a common post-exploitation tool.' },
      { type: 'mcq', q: 'The 02:17 "backup" login from 10.0.0.9 is:', options: ['Part of the attack', 'Likely legitimate (internal IP, no preceding failures)', 'Impossible', 'A DDoS'], answer: 1, explain: 'Internal source, no brute-force pattern — probably normal.' }
    ],
    passPct: 75 });

  // --- Packet capture analysis ---
  labs.push({ id: 'sec-05-pcap', title: 'Packet Capture Analysis', level: 2, xp: 130, skills: { networking: 2, security: 3, forensics: 1 }, est: 25, kind: 'pcap',
    brief: 'Read the simplified packet capture and answer questions about the handshake, DNS and a suspicious connection.',
    capLabel: 'capture.pcap (simplified)',
    packets: [
      { no: 1, time: '0.000', src: '192.168.1.10', dst: '192.168.1.2', proto: 'DNS', info: 'Standard query A www.corp.local' },
      { no: 2, time: '0.002', src: '192.168.1.2', dst: '192.168.1.10', proto: 'DNS', info: 'Response A 192.168.1.20' },
      { no: 3, time: '0.010', src: '192.168.1.10', dst: '192.168.1.20', proto: 'TCP', info: '51234 → 80 [SYN] Seq=0' },
      { no: 4, time: '0.011', src: '192.168.1.20', dst: '192.168.1.10', proto: 'TCP', info: '80 → 51234 [SYN, ACK] Seq=0 Ack=1' },
      { no: 5, time: '0.012', src: '192.168.1.10', dst: '192.168.1.20', proto: 'TCP', info: '51234 → 80 [ACK] Seq=1 Ack=1' },
      { no: 6, time: '0.013', src: '192.168.1.10', dst: '192.168.1.20', proto: 'HTTP', info: 'GET /login HTTP/1.1' },
      { no: 7, time: '0.020', src: '192.168.1.10', dst: '192.168.1.20', proto: 'HTTP', info: 'POST /login (user=admin&pass=hunter2) [cleartext]' },
      { no: 8, time: '2.500', src: '192.168.1.10', dst: '45.77.10.3', proto: 'TCP', info: '49990 → 4444 [SYN] Seq=0' },
      { no: 9, time: '2.700', src: '192.168.1.10', dst: '45.77.10.3', proto: 'TCP', info: '49990 → 4444 [SYN] Seq=0 (retransmit)' },
      { no: 10, time: '32.5', src: '192.168.1.10', dst: '45.77.10.3', proto: 'TCP', info: '49990 → 4444 [SYN] Seq=0 (retransmit)' }
    ],
    questions: [
      { type: 'mcq', q: 'Packets 3–5 represent:', options: ['A DNS query', 'The TCP three-way handshake', 'A port scan', 'An ARP exchange'], answer: 1, explain: 'SYN, SYN-ACK, ACK = the handshake.' },
      { type: 'mcq', q: 'What security problem does packet 7 reveal?', options: ['Encrypted traffic', 'Credentials sent in cleartext over HTTP', 'A DNS failure', 'A broadcast storm'], answer: 1, explain: 'The POST shows user/pass in cleartext — the login should use HTTPS.' },
      { type: 'mcq', q: 'Packets 8–10 (repeated SYN to port 4444 on an external IP, no reply) most likely indicate:', options: ['Normal web browsing', 'A host beaconing to a command-and-control server on a filtered port', 'A DHCP request', 'An NTP sync'], answer: 1, explain: 'Port 4444 is a common C2/Meterpreter port; repeated SYNs with no answer suggest attempted outbound C2 that a firewall is dropping.' },
      { type: 'fill', q: 'Which external IP is the host trying to reach on port 4444?', answer: ['45.77.10.3'], explain: 'The suspicious outbound connection targets 45.77.10.3:4444.' },
      { type: 'mcq', q: 'What should the analyst do next?', options: ['Ignore it', 'Isolate 192.168.1.10, investigate for compromise, and block/flag 45.77.10.3', 'Reboot the DNS server', 'Change the Wi-Fi password'], answer: 1, explain: 'A host beaconing to a C2 port is likely compromised — contain and investigate.' }
    ],
    passPct: 75 });

  // --- Port scan interpretation (uses sim) ---
  labs.push({ id: 'sec-06-scan', title: 'Vulnerability Assessment Write-up', level: 2, xp: 140, skills: { hacking: 3, security: 3 }, est: 30, kind: 'assessment',
    brief: 'You scanned an authorized lab host and found the services below. Classify each finding and choose the correct remediation. The goal of the assessment is to drive fixes.',
    findings: [
      { service: 'Telnet (TCP 23) open', sev: 'High', q: 'Best remediation?', options: ['Leave it, change the banner', 'Disable Telnet and use SSH (encrypted)', 'Move it to port 2323'], answer: 1, why: 'Telnet sends credentials in cleartext; replace with SSH.' },
      { service: 'SSH (TCP 22) open, password auth enabled', sev: 'Medium', q: 'Best remediation?', options: ['Disable SSH entirely', 'Require key-based auth, disable root login, add rate limiting/MFA', 'Nothing needed'], answer: 1, why: 'SSH is fine but harden it: keys, no root, fail2ban.' },
      { service: 'HTTP (TCP 80) admin panel, no HTTPS', sev: 'Medium', q: 'Best remediation?', options: ['Accept the risk', 'Enforce HTTPS/TLS and restrict the admin panel to management network', 'Block port 80 only'], answer: 1, why: 'Admin credentials must not cross the network in cleartext; restrict access.' },
      { service: 'Database (TCP 3306) reachable from the user VLAN', sev: 'High', q: 'Best remediation?', options: ['Expose it on the Internet too', 'Restrict with firewall/ACL to only the app servers that need it', 'Change the DB password only'], answer: 1, why: 'Databases should not be reachable from user networks; segment and filter.' },
      { service: 'SMBv1 (TCP 445) enabled', sev: 'High', q: 'Best remediation?', options: ['Keep for compatibility', 'Disable SMBv1 (legacy, wormable) and use SMBv3', 'Open it to the Internet'], answer: 1, why: 'SMBv1 is obsolete and associated with worms like WannaCry.' }
    ],
    passPct: 80 });

  // --- Web app (conceptual) ---
  labs.push({ id: 'sec-07-webapp', title: 'Find and Fix a Web Vulnerability', level: 2, xp: 140, skills: { security: 3, hacking: 3 }, est: 30, kind: 'webapp',
    brief: 'Review the vulnerable code snippets from the lab app, identify the flaw, and choose the correct fix. Defensive exercise — no live exploitation.',
    cases: [
      { label: 'Login query', code: 'query = "SELECT * FROM users WHERE user=\'" + username + "\' AND pass=\'" + password + "\'"', q: 'What is the vulnerability and fix?', options: ['None; it is fine', 'SQL injection — use a parameterized query with bound values', 'XSS — HTML-encode the output', 'CSRF — add a token'], answer: 1, why: 'User input is concatenated into SQL. Use prepared statements: WHERE user=? AND pass=? with bound parameters.' },
      { label: 'Comment display', code: 'page += "<div>" + request.comment + "</div>"', q: 'What is the vulnerability and fix?', options: ['SQL injection — parameterize', 'Stored XSS — context-aware output encoding (HTML-encode)', 'Open redirect', 'None'], answer: 1, why: 'Untrusted comment is written into HTML without encoding. HTML-encode on output and apply a Content Security Policy.' },
      { label: 'File download', code: 'path = "/files/" + request.filename; return readFile(path)', q: 'What is the vulnerability and fix?', options: ['Path traversal — validate/allow-list the filename and block "../"', 'SQL injection', 'XSS', 'None'], answer: 0, why: 'filename like ../../etc/passwd escapes the directory. Canonicalize and allow-list.' },
      { label: 'Admin check', code: 'if request.params.get("admin") == "true": grant_admin()', q: 'What is the vulnerability and fix?', options: ['Broken access control — enforce authorization server-side from the session, not a request parameter', 'Weak crypto', 'XSS', 'None'], answer: 0, why: 'Privilege is granted from a client-controlled parameter. Authorize from the authenticated session/role server-side.' }
    ],
    passPct: 75 });

  // --- MitM detection ---
  labs.push({ id: 'sec-08-mitm', title: 'Detect a Man-in-the-Middle', level: 2, xp: 130, skills: { security: 4 }, est: 20, kind: 'logs',
    brief: 'Compare the host\'s ARP state before and after an incident and answer the questions.',
    logLabel: 'ARP table observations',
    log: [
      { t: '09:00', m: 'Normal: gateway 192.168.1.1 is at 02:00:00:00:00:05 (router)', flag: false },
      { t: '09:00', m: 'Normal: server 192.168.1.2 is at 02:00:00:00:00:02', flag: false },
      { t: '09:42', m: 'ALERT: gateway 192.168.1.1 is now at 02:00:00:aa:bb:cc (host 192.168.1.66)', flag: true },
      { t: '09:42', m: 'ALERT: 192.168.1.66 also claims to be 192.168.1.2 (duplicate IP detected)', flag: true },
      { t: '09:42', m: 'Burst of unsolicited ARP replies from 02:00:00:aa:bb:cc', flag: true }
    ],
    questions: [
      { type: 'mcq', q: 'What attack is occurring?', options: ['DNS spoofing', 'ARP spoofing / poisoning for man-in-the-middle', 'Port scan', 'DHCP exhaustion'], answer: 1, explain: 'The gateway and server IPs now map to the attacker\'s MAC — classic ARP poisoning.' },
      { type: 'fill', q: 'Which host is the attacker (IP)?', answer: ['192.168.1.66'], explain: '192.168.1.66 is claiming to be both the gateway and the server.' },
      { type: 'mcq', q: 'Which switch controls would have prevented this?', options: ['STP + VTP', 'DHCP snooping + Dynamic ARP Inspection', 'NAT + PAT', 'OSPF'], answer: 1, explain: 'DAI validates ARP against the DHCP binding table and drops forgeries.' },
      { type: 'mcq', q: 'Even if the MitM succeeds, what still protects HTTPS logins?', options: ['Private IPs', 'TLS with certificate validation', 'A fast CPU', 'The ARP cache'], answer: 1, explain: 'Encrypted, authenticated sessions resist interception.' }
    ],
    passPct: 75 });

  // --- SOC incident triage ---
  labs.push({ id: 'sec-09-incident', title: 'SOC Analyst: Triage an Incident', level: 3, xp: 170, skills: { security: 5, forensics: 2 }, est: 30, kind: 'logs',
    brief: 'You are a SOC analyst. Correlate the alerts and events below, then answer the triage questions and classify the incident.',
    logLabel: 'SIEM correlated events',
    log: [
      { t: '13:02', m: 'IDS: inbound exploit attempt against VPN gateway from 198.51.100.23 (CVE pattern)', flag: true },
      { t: '13:05', m: 'VPN: successful login user j.doe from 198.51.100.23 (new country: unusual)', flag: true },
      { t: '13:09', m: 'Endpoint EDR: j.doe workstation spawned powershell.exe -enc (encoded command)', flag: true },
      { t: '13:11', m: 'AD: user j.doe added to group "Domain Admins"', flag: true },
      { t: '13:14', m: 'Firewall: large outbound transfer workstation → 45.77.10.3:443 (2.1 GB)', flag: true },
      { t: '13:20', m: 'Backup job completed successfully (scheduled)', flag: false },
      { t: '13:30', m: 'User p.lee logged in from the office (normal)', flag: false }
    ],
    questions: [
      { type: 'mcq', q: 'What is the most likely overall scenario?', options: ['Routine activity', 'An intrusion: exploited VPN → compromised account → privilege escalation → data exfiltration', 'A hardware failure', 'A false positive'], answer: 1, explain: 'The events form a clear kill chain across sources.' },
      { type: 'mcq', q: 'Which single event is the highest-severity escalation?', options: ['The backup job', 'j.doe added to Domain Admins', 'p.lee office login', 'The IDS alert alone'], answer: 1, explain: 'Privilege escalation to Domain Admin means near-total control.' },
      { type: 'fill', q: 'Which external IP is the likely exfiltration destination?', answer: ['45.77.10.3'], explain: 'The 2.1 GB outbound transfer targets 45.77.10.3.' },
      { type: 'mcq', q: 'What is the correct immediate action?', options: ['Wait and watch', 'Contain: isolate the workstation, disable j.doe, revoke the DA membership, block the IPs, and open an incident', 'Reboot the VPN only', 'Email the user'], answer: 1, explain: 'Contain and preserve evidence; this is an active, high-severity incident.' },
      { type: 'mcq', q: 'How should this incident be classified?', options: ['Low', 'Informational', 'High/Critical — active intrusion with data exfiltration', 'Resolved'], answer: 2, explain: 'Active compromise with exfiltration and DA escalation is critical.' }
    ],
    passPct: 80 });

  // --- AD security audit (conceptual) ---
  labs.push({ id: 'sec-10-adsec', title: 'Audit Active Directory Weaknesses', level: 3, xp: 160, skills: { security: 4, windows: 2, hacking: 1 }, est: 25, kind: 'assessment',
    brief: 'Review the Active Directory findings and choose the correct hardening action for each. Defensive focus.',
    findings: [
      { service: '15 accounts in Domain Admins, several unused', sev: 'High', q: 'Action?', options: ['Add more admins', 'Reduce to the minimum, remove unused, use tiered/just-in-time admin', 'Ignore'], answer: 1, why: 'Minimize privileged accounts; fewer targets, less blast radius.' },
      { service: 'Local administrator password identical on all workstations', sev: 'High', q: 'Action?', options: ['Keep it simple', 'Deploy LAPS for unique, rotated local admin passwords', 'Disable local admin entirely'], answer: 1, why: 'Shared local admin enables pass-the-hash lateral movement; LAPS fixes it.' },
      { service: 'Service accounts with SPNs and weak passwords', sev: 'Medium', q: 'Action?', options: ['Nothing', 'Use gMSA / long random passwords to resist Kerberoasting', 'Add them to Domain Admins'], answer: 1, why: 'Kerberoastable accounts need long, random, managed passwords.' },
      { service: 'SMBv1 enabled on file servers', sev: 'High', q: 'Action?', options: ['Keep for old clients', 'Disable SMBv1, require SMBv3', 'Expose to Internet'], answer: 1, why: 'SMBv1 is legacy and wormable.' },
      { service: 'No alerting on "member added to Domain Admins"', sev: 'Medium', q: 'Action?', options: ['Not needed', 'Add SIEM detection for privileged group changes (4728/4732)', 'Disable auditing'], answer: 1, why: 'Privileged group changes must be monitored.' }
    ],
    passPct: 80 });

  // --- Forensics triage ---
  labs.push({ id: 'sec-11-forensics', title: 'Forensic Triage of a Suspicious File', level: 3, xp: 160, skills: { forensics: 5, security: 2 }, est: 25, kind: 'assessment',
    brief: 'A suspicious file was recovered from a host. Choose the correct forensic action at each step. Static, safe analysis only.',
    findings: [
      { service: 'First action on the evidence file', sev: 'Process', q: 'Do what first?', options: ['Double-click to open it', 'Compute and record its SHA-256 hash and preserve the original', 'Email it to colleagues', 'Rename it'], answer: 1, why: 'Hash and preserve to maintain integrity and chain of custody.' },
      { service: 'File named Invoice.pdf.exe, strings show "powershell -enc" and a URL', sev: 'Process', q: 'What does this indicate?', options: ['A real PDF', 'A malicious dropper (double extension, encoded PowerShell, external URL)', 'A system file', 'Nothing'], answer: 1, why: 'Double extension plus encoded PowerShell and a URL are strong malware indicators.' },
      { service: 'To observe its behaviour safely', sev: 'Process', q: 'Where do you run it?', options: ['On your laptop', 'In an isolated sandbox with snapshots and no production network', 'On a domain controller', 'Never run it, static only'], answer: 1, why: 'Dynamic analysis belongs in an isolated, revertible sandbox.' },
      { service: 'The URL and dropped-file hash', sev: 'Process', q: 'What are these for the investigation?', options: ['Irrelevant', 'Indicators of Compromise (IoCs) to hunt across the estate', 'The attacker\'s name', 'Backup locations'], answer: 1, why: 'IoCs let you find other affected hosts.' },
      { service: 'Order of volatility — collect first', sev: 'Process', q: 'Which first?', options: ['Backup tapes', 'RAM (memory)', 'Archived logs', 'Printed reports'], answer: 1, why: 'Memory is most volatile; capture before powering down.' }
    ],
    passPct: 80 });

  NSA.data.labs.security = labs;
})(typeof globalThis !== 'undefined' ? globalThis : window);
