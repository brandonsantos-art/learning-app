/* NetSec Academy – Level 2 (Intermediate) lessons: security */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.lessons = NSA.data.lessons || [];
  const L = [];

  L.push({ id: 'l2-sec-01-vuln-assessment', level: 2, track: 'security', order: 1, title: 'Vulnerability Assessment, Reconnaissance and Nmap', summary: 'Find hosts, services and weaknesses methodically, then prioritize and report them so they get fixed. Authorized environments only.', minutes: 35, skills: { hacking: 4, security: 2 }, prereqs: [],
    objectives: ['Perform host discovery and port scanning with the right Nmap options', 'Interpret open/closed/filtered and version output', 'Map services to known-vulnerability data and rate severity with CVSS', 'Write findings with evidence and remediation'],
    sections: [
      { type: 'callout', tone: 'warn', title: 'Authorization', md: 'Everything in this lesson is performed only in the course simulator or on systems you own or have written permission to test. Scanning networks without authorization is a crime. The point of a vulnerability assessment is to **fix** weaknesses, so every technique here is paired with its defence.' },
      { type: 'text', title: 'Reconnaissance workflow', md: `A vulnerability assessment is a disciplined, documented process, not random tool-running:

1. **Passive recon** (no packets to the target): WHOIS, public DNS records, certificate transparency logs, asset inventories, vendor advisories. For a company's own assessment this is simply reading your own documentation.
2. **Host discovery**: \`nmap -sn 10.10.0.0/24\` finds live hosts (ARP on the local segment, ICMP/TCP probes remotely). Hosts that ignore ping are scanned with \`-Pn\`.
3. **Port scanning**: \`-sS\` SYN scan (default with privileges), \`-sT\` full connect, \`-sU\` UDP (slow), \`-p-\` all ports, \`-F\` fast top 100, \`--top-ports 1000\`.
4. **Service and OS detection**: \`-sV\` identifies the service and version, \`-O\` fingerprints the OS, \`-A\` adds default scripts.
5. **Enumeration**: interact with each service to learn configuration and users (HTTP directories and technologies, SMB shares, SNMP community strings, anonymous FTP).

Save evidence with \`-oA basename\` (normal, XML and grepable). Use conservative timing (\`-T2\`/\`-T3\`) against fragile devices such as printers and industrial equipment.` },
      { type: 'text', title: 'Reading results', md: `Nmap reports each port as **open** (a service answered), **closed** (the host replied with RST but nothing is listening) or **filtered** (no reply, usually a firewall). The version column, when \`-sV\` is used, names the software and version string.

What you do with a version string is the whole value of the exercise:
- A current, patched version is reassurance to record.
- An outdated version is a **lead**: note it, then confirm against the vendor's advisories and a vulnerability database whether that exact version is affected, rather than assuming. Banners can be wrong or deliberately misleading.
- A service that should not be exposed at all (a database reachable from a user VLAN, a management interface on the Internet) is a finding regardless of version.

In the labs, compare the external Nmap view with the host's own \`ss -tulpn\` output. The gap between "what is listening" and "what is reachable" is exactly what firewall rules should be closing.` },
      { type: 'text', title: 'Prioritizing with CVSS', md: `Scanners (Nessus, OpenVAS/Greenbone, Qualys) automate identification and attach a **CVSS** score (0–10) and often a CVE identifier. Use severity plus context to prioritize:

| Factor | Raises priority |
| --- | --- |
| CVSS base score | 9.0–10 critical, 7.0–8.9 high |
| Exposure | reachable from the Internet or an untrusted VLAN |
| Exploit availability | public exploit or active exploitation in the wild (check CISA KEV) |
| Asset value | domain controller, payment system, backups |
| Compensating controls | already behind MFA, segmented, or WAF-protected |

A medium-severity issue on an Internet-facing server can outrank a critical one on an isolated lab box. Record every finding with the four things a fixer needs: **where** (asset), **what** (the weakness and evidence), **how bad** (rating with justification) and **what to do** (specific remediation).` },
      { type: 'text', title: 'Scanning safely and ethically', md: `- **Verify before you report.** A version banner is a hypothesis; confirm the vulnerability actually applies and, in a real engagement, that a safe proof-of-concept is within scope before demonstrating exploitability.
- **Do no harm.** Aggressive scans and vulnerability scripts can crash old services. Agree a maintenance window and avoid \`--script\` categories that are intrusive on production.
- **Scanning is loud.** IDS, firewalls and SIEM log it. In the labs you will scan, then look at the target's logs to see your own footprint — the defender's view of an attacker.
- **Closing the loop** is the job: every finding should end with patched software, a tightened firewall rule, a removed service, or an accepted-risk decision by the owner.` },
      { type: 'check', question: { type: 'mcq', q: 'Nmap -sV reports an old web server version on an internal host. The best next step is to:', options: ['Immediately mark it exploited and move on', 'Confirm against vendor advisories/a vulnerability database whether that version is actually affected, and check its exposure', 'Delete the server', 'Ignore it because it is internal'], answer: 1, explain: 'A banner is a lead, not proof. Validate the vulnerability and weigh exposure before rating it.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'command', q: 'Type the Nmap command for a ping sweep of 10.10.0.0/24.', answer: ['^nmap\\s+-s[nP]\\s+10\\.10\\.0\\.0/24$', '^nmap\\s+10\\.10\\.0\\.0/24\\s+-s[nP]$'], display: 'nmap -sn 10.10.0.0/24', explain: '-sn host discovery without port scan.', topic: 'recon' },
      { type: 'mcq', q: 'A port shown as "filtered" means:', options: ['A service answered', 'The host sent RST', 'No response — usually a firewall dropping the probe', 'The host is offline'], answer: 2, explain: 'Filtered = silently dropped.', topic: 'recon' },
      { type: 'mcq', q: 'Which Nmap option identifies service versions?', options: ['-sn', '-sV', '-Pn', '-F'], answer: 1, explain: '-sV probes for version information.', topic: 'recon' },
      { type: 'mcq', q: 'A CVSS base score of 9.1 indicates a vulnerability that is:', options: ['Informational', 'Low', 'Medium', 'Critical'], answer: 3, explain: '9.0–10.0 is critical.', topic: 'CVSS' },
      { type: 'mcq', q: 'Why might a medium-severity Internet-facing issue be prioritized over a critical one on an isolated host?', options: ['Medium is always worse', 'Exposure and exploitability change real-world risk', 'CVSS is meaningless', 'Internet hosts are cheaper'], answer: 1, explain: 'Context (exposure, exploit availability, asset value) adjusts priority.', topic: 'CVSS' },
      { type: 'tf', q: 'A service version banner is sufficient proof that a host is vulnerable.', answer: false, explain: 'Banners can be wrong or spoofed; validate before reporting.', topic: 'recon' },
      { type: 'mcq', q: 'The deliverable that gives a vulnerability assessment its value is:', options: ['The raw scan file', 'A prioritized report with evidence and remediation', 'A list of IP addresses', 'A screenshot of the tool'], answer: 1, explain: 'Findings must drive fixes.', topic: 'reporting' }
    ] }, practical: { type: 'security', id: 'sec-06-scan', title: 'Assess the lab network and write up findings' }, cert: ['secplus:4.3', 'entrysec:operations'], refs: [{ title: 'NIST SP 800-115 Technical Guide to Security Testing', url: 'https://csrc.nist.gov/pubs/sp/800/115/final' }, { title: 'FIRST CVSS', url: 'https://www.first.org/cvss/' }] });

  L.push({ id: 'l2-sec-02-attacks', level: 2, track: 'security', order: 2, title: 'Common Network Attacks: ARP/DNS Spoofing and MitM', summary: 'How Layer 2 and DNS trust is abused for man-in-the-middle, how to detect it, and the controls that stop it.', minutes: 25, skills: { security: 4, hacking: 2 }, prereqs: ['l1-net-10-mac'],
    objectives: ['Explain ARP spoofing and how it enables man-in-the-middle', 'Explain DNS spoofing and cache poisoning', 'Detect these attacks from captures and host state', 'Apply switch and endpoint defences'],
    sections: [
      { type: 'text', title: 'Why these attacks work', md: `ARP and DNS were designed without authentication. A host believes any ARP reply and, by default, any DNS answer from its configured resolver. On a shared LAN or open Wi-Fi an attacker can abuse that trust to insert themselves between a victim and the gateway — a **man-in-the-middle (MitM)** — to read, modify or redirect traffic.

Understanding the mechanism is what lets you **detect and prevent** it; that is the goal here.` },
      { type: 'text', title: 'ARP spoofing / poisoning', md: `The attacker sends forged ARP replies telling the victim "the gateway's IP is at *my* MAC" and telling the gateway "the victim's IP is at *my* MAC". Both now send traffic through the attacker. Consequences: eavesdropping on unencrypted traffic, session hijacking, downgrade attempts, or simply dropping traffic (DoS).

**Detection**
- The gateway IP suddenly maps to a new MAC in \`arp -a\` / \`ip neigh\`; two IPs share one MAC.
- Captures show "duplicate IP address detected" and a burst of unsolicited ARP replies.
- Host agents and WIDS flag ARP anomalies.

**Prevention**
- **Dynamic ARP Inspection (DAI)** with **DHCP snooping** on switches validates ARP against the DHCP binding table and drops forgeries.
- **Port security** limits MACs per port; **private VLANs** isolate hosts.
- End-to-end encryption (HTTPS everywhere, VPN on untrusted networks) makes intercepted traffic useless even if MitM succeeds.
- Static ARP entries for critical gateways on high-value hosts.` },
      { type: 'text', title: 'DNS spoofing and cache poisoning', md: `If an attacker answers a DNS query faster than the real server (on-path, or by guessing the query ID on weak resolvers), the victim resolves a legitimate name to an attacker address. **Cache poisoning** plants a false record in a resolver so many users are redirected. Variants include rogue DHCP handing out a malicious DNS server, and malware editing the local **hosts file**.

**Detection and prevention**
- Unexpected IP for a known name; certificate mismatches when the victim reaches the fake site (HTTPS catches many redirections — another reason it matters).
- **DNSSEC** validation lets resolvers reject forged records.
- Use trusted, patched resolvers with source-port randomization; restrict outbound DNS to the approved resolver and log queries.
- Protect DHCP (snooping) so the DNS server option cannot be spoofed; monitor the hosts file for changes.
- **DoH/DoT** (encrypted DNS) protects queries in transit from on-path tampering.` },
      { type: 'demo', title: 'Interactive: spot the MitM', demo: 'arp-mitm', md: 'Watch a normal exchange, then a spoofed one, and identify the tell-tale ARP and MAC changes.' },
      { type: 'check', question: { type: 'mcq', q: 'Which switch features together stop ARP spoofing on an access network?', options: ['STP and VTP', 'DHCP snooping and Dynamic ARP Inspection', 'NAT and PAT', 'OSPF and BGP'], answer: 1, explain: 'DHCP snooping builds the binding table that DAI uses to validate ARP.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'ARP spoofing enables man-in-the-middle because:', options: ['ARP replies are authenticated', 'Hosts trust any ARP reply and update their cache', 'It encrypts traffic', 'Switches block it by default'], answer: 1, explain: 'Unauthenticated ARP is the root cause.', topic: 'MitM' },
      { type: 'mcq', q: 'A strong on-host indicator of ARP poisoning is:', options: ['High CPU', 'The gateway IP mapping to a new/unexpected MAC', 'A full disk', 'Slow DNS only'], answer: 1, explain: 'The gateway MAC change (or duplicate IP warnings) is characteristic.', topic: 'detection' },
      { type: 'mcq', q: 'DNSSEC helps by:', options: ['Encrypting web pages', 'Letting resolvers cryptographically validate DNS records', 'Blocking ARP', 'Replacing DHCP'], answer: 1, explain: 'Signatures detect forged records.', topic: 'DNS' },
      { type: 'mcq', q: 'Even if MitM succeeds on open Wi-Fi, what still protects a user logging into their bank?', options: ['A long password', 'HTTPS/TLS with certificate validation', 'A fast CPU', 'Private IP addresses'], answer: 1, explain: 'Encrypted, authenticated sessions resist interception and tampering.', topic: 'defence' },
      { type: 'mcq', q: 'Malware redirecting one PC to a fake banking site by editing a local file most likely changed the:', options: ['routing table', 'hosts file', 'ARP cache', 'DHCP lease'], answer: 1, explain: 'The hosts file overrides DNS for that host.', topic: 'DNS' },
      { type: 'tf', q: 'Restricting outbound DNS to an approved resolver helps limit spoofing and malware DNS abuse.', answer: true, explain: 'It forces resolution through a logged, controlled, validating server.', topic: 'defence' }
    ] }, practical: { type: 'security', id: 'sec-08-mitm', title: 'Detect a man-in-the-middle from capture evidence' }, cert: ['secplus:2.4', 'netplus:4.2'], refs: [] });

  L.push({ id: 'l2-sec-03-web-attacks', level: 2, track: 'security', order: 3, title: 'Web Application Security: SQL Injection and XSS', summary: 'How injection and cross-site scripting work at a conceptual level, how to recognize them, and the coding controls that prevent them.', minutes: 30, skills: { security: 3, hacking: 3 }, prereqs: [],
    objectives: ['Explain why injection vulnerabilities exist', 'Describe SQL injection impact and prevention', 'Describe the XSS types and prevention', 'Recognize these issues in code review and logs'],
    sections: [
      { type: 'callout', tone: 'warn', title: 'Defensive focus', md: 'This lesson explains how these flaws arise so you can find and fix them. All practice happens against the intentionally vulnerable app in the lab. The emphasis throughout is on prevention and detection.' },
      { type: 'text', title: 'The root cause: mixing data and code', md: `Most web vulnerabilities come from one mistake: **untrusted input is treated as trusted code or markup**. When a user's text is pasted directly into a database query, an HTML page, a shell command or a file path, the user can change the *meaning*, not just the content. The fix family is always the same: **validate input, and keep data separate from code** (parameterization, encoding, allow-lists).

The **OWASP Top 10** catalogues these; Broken Access Control and Injection are perennial leaders.` },
      { type: 'text', title: 'SQL injection (SQLi)', md: `A login form that builds a query by gluing the username into a string lets an attacker supply input that closes the string and adds their own logic, so the database returns rows it should not, or the attacker reads other tables. Impact ranges from authentication bypass to full database theft and, in bad cases, server compromise.

**Prevention (the parts you will actually implement):**
- **Parameterized queries / prepared statements** — the query structure is fixed and user values are bound separately, so input can never change the query's meaning. This is the primary fix.
- **ORMs** used correctly produce parameterized queries.
- **Least privilege** database accounts — the web app's account can read/write only its own tables, never \`DROP\` or read system tables.
- **Input validation** (allow-lists) and **stored-procedure** discipline as defence in depth.
- A **WAF** blocks common patterns but is a backstop, not a substitute for fixing the code.

**Detection:** unusual characters or SQL keywords in request logs, database errors returned to users, sudden large result sets or unusual queries in database logs.` },
      { type: 'text', title: 'Cross-Site Scripting (XSS)', md: `XSS happens when a site reflects or stores user input into a page without encoding it, so a victim's browser runs attacker-supplied script in the context of the trusted site — stealing session cookies, performing actions as the user, or defacing the page.

- **Reflected** — the payload is in the request (a crafted link) and echoed into the response.
- **Stored** — the payload is saved (a comment, profile field) and served to every viewer.
- **DOM-based** — client-side JavaScript writes untrusted data into the page.

**Prevention:**
- **Context-aware output encoding** — HTML-encode data placed in HTML, attribute-encode in attributes, etc. This is the core fix.
- **Content Security Policy (CSP)** restricts where scripts may load from and blocks inline script.
- **HttpOnly** cookies so script cannot read the session token; **SameSite** cookies.
- Framework auto-escaping (React, modern template engines) prevents most XSS when not bypassed with "dangerous" raw-HTML APIs.
- Validate and sanitize rich input with a vetted library, never a home-grown blacklist.` },
      { type: 'text', title: 'Finding it in review and logs', md: `In **code review**, flag any place where a request value reaches a query, a page, a command or a redirect without parameterization or encoding. Search for string concatenation into SQL, raw-HTML sink functions, and \`eval\`-like calls.

In **logs and monitoring**, watch for injection-looking characters and keywords in parameters, spikes of 500 errors, script tags in stored fields, and requests that differ wildly from normal application traffic. A WAF and application logging feed these signals to the SOC.

The lab provides a deliberately vulnerable app where you will identify the flaw, then apply the parameterized-query and output-encoding fix and confirm the attack no longer works.` },
      { type: 'check', question: { type: 'mcq', q: 'The single most effective control against SQL injection is:', options: ['A longer admin password', 'Parameterized queries / prepared statements', 'Hiding the login page', 'Disabling cookies'], answer: 1, explain: 'Binding values separately from the query keeps input from changing the query structure.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Injection vulnerabilities fundamentally arise because:', options: ['Servers are slow', 'Untrusted input is treated as code or markup', 'Passwords are weak', 'Encryption is missing'], answer: 1, explain: 'Data is interpreted as code.', topic: 'web' },
      { type: 'mcq', q: 'Which database practice limits the damage of a successful SQLi?', options: ['Running the app as the database admin', 'A least-privilege app account', 'Disabling backups', 'Using one shared account'], answer: 1, explain: 'Least privilege caps what injected queries can do.', topic: 'SQLi' },
      { type: 'mcq', q: 'Stored XSS differs from reflected XSS because the payload is:', options: ['Encrypted', 'Saved on the server and served to many victims', 'Only in the URL', 'Executed on the server'], answer: 1, explain: 'Stored payloads persist and hit every viewer.', topic: 'XSS' },
      { type: 'mcq', q: 'Which control most directly prevents XSS?', options: ['Context-aware output encoding', 'A faster server', 'Longer URLs', 'Disabling HTTPS'], answer: 0, explain: 'Encoding neutralizes markup in output.', topic: 'XSS' },
      { type: 'mcq', q: 'The HttpOnly cookie flag helps by:', options: ['Encrypting the cookie', 'Preventing JavaScript from reading the session cookie', 'Blocking SQLi', 'Speeding up login'], answer: 1, explain: 'It limits cookie theft via XSS.', topic: 'XSS' },
      { type: 'mcq', q: 'A WAF in front of a web app is best described as:', options: ['A replacement for secure coding', 'A backstop that blocks common patterns while the code is fixed', 'A database', 'An encryption tool'], answer: 1, explain: 'Defence in depth, not a substitute for the fix.', topic: 'web' },
      { type: 'tf', q: 'Framework auto-escaping prevents most XSS unless developers bypass it with raw-HTML APIs.', answer: true, explain: 'Modern frameworks escape by default; the risk returns when that is overridden.', topic: 'XSS' }
    ] }, practical: { type: 'security', id: 'sec-07-webapp', title: 'Find and fix a web app vulnerability' }, cert: ['secplus:2.3', 'entrysec:operations'], refs: [{ title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' }, { title: 'OWASP Cheat Sheets (SQLi, XSS)', url: 'https://cheatsheetseries.owasp.org/' }] });

  L.push({ id: 'l2-sec-04-access-control', level: 2, track: 'security', order: 4, title: 'Authentication, Access Control and Linux Permissions', summary: 'Access control models, Linux file permissions and ownership, and Windows NTFS basics for everyday administration.', minutes: 30, skills: { security: 3, linux: 3, windows: 1 }, prereqs: ['l1-sec-05-passwords'],
    objectives: ['Distinguish authentication, authorization and accounting', 'Compare DAC, MAC, RBAC and ABAC', 'Read and set Linux permissions and ownership', 'Apply least privilege with groups and special bits'],
    sections: [
      { type: 'text', title: 'AAA and access control models', md: `**Authentication** (who are you) → **Authorization** (what may you do) → **Accounting** (what did you do, via logs). Models for authorization:

| Model | Idea | Example |
| --- | --- | --- |
| **DAC** Discretionary | the owner sets permissions | Linux file permissions, share permissions |
| **MAC** Mandatory | system-enforced labels, users cannot override | SELinux, military classification |
| **RBAC** Role-based | permissions attached to roles, users get roles | "Finance" role, Active Directory groups |
| **ABAC** Attribute-based | policies on attributes (department, time, device) | modern cloud/zero-trust policies |

Principles: **least privilege**, **separation of duties** (no one person completes a sensitive transaction alone), **need to know**, and regular **access reviews** (revoke on role change, not just on leaving).` },
      { type: 'text', title: 'Linux permissions', md: `\`ls -l\` shows ten characters: type + three triplets (owner, group, others), each **r w x**.

\`\`\`
-rwxr-x---  1 alice devs  4096 Nov 12 09:00 deploy.sh
 │ │  │  │      │    │
 │ │  │  └ others: none      owner: alice
 │ │  └ group (devs): r-x
 │ └ owner (alice): rwx
 └ regular file
\`\`\`
Numeric (octal): r=4, w=2, x=1. \`chmod 750 deploy.sh\` = rwx r-x ---. On directories, **x** means "may enter/traverse", **r** means "may list". Common values: files 644, private files 600, scripts/dirs 755, group-shared dirs 2775 (setgid).

\`\`\`
chmod 640 config.yaml          owner rw, group r, others none
chmod u+x,g-w script.sh        symbolic
chown alice:devs report.txt    change owner and group
chmod g+s /srv/shared          setgid: new files inherit the group
\`\`\`
Special bits: **setuid** (run as file owner — dangerous on scripts), **setgid** (inherit group on directories), **sticky** (on /tmp: only the owner may delete their files). \`find / -perm -4000 -type f\` audits setuid binaries — a classic privilege-escalation hunting ground.

Beyond the basic bits: **ACLs** (\`setfacl -m u:bob:r file\`) for finer control, and **sudo** rules in \`/etc/sudoers\` (edited with \`visudo\`) to grant specific commands without full root.` },
      { type: 'text', title: 'Windows NTFS in brief', md: `NTFS permissions (Read, Read & Execute, Modify, Full Control) are set per user/group and **inherit** down the tree. **Share** permissions and **NTFS** permissions both apply to network access; the **most restrictive** combination wins. Use groups (role-based), avoid "Everyone: Full Control", and audit with \`icacls path\` or \`Get-Acl\`. Privileged tasks use separate admin accounts, and User Account Control prompts for elevation.` },
      { type: 'check', question: { type: 'mcq', q: 'What does chmod 640 grant?', options: ['Owner rwx, group rx, others r', 'Owner rw, group r, others none', 'Everyone rw', 'Owner r, group rw, others rw'], answer: 1, explain: '6=rw owner, 4=r group, 0=none others.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Permissions attached to roles that users are assigned describe which model?', options: ['DAC', 'MAC', 'RBAC', 'ABAC'], answer: 2, explain: 'Role-Based Access Control.', topic: 'access' },
      { type: 'fill', q: 'Octal mode for rwxr-x--- is ______.', answer: ['750'], explain: '7=rwx, 5=r-x, 0=---.', topic: 'Linux' },
      { type: 'command', q: 'Command to give a file owner rw, group r, others nothing:', answer: ['^chmod\\s+640\\s+\\S+$'], display: 'chmod 640 <file>', explain: 'chmod 640.', topic: 'Linux' },
      { type: 'mcq', q: 'On a directory, the execute bit means:', options: ['The directory is a program', 'Permission to enter/traverse it', 'Nothing', 'Permission to delete it'], answer: 1, explain: 'x on a directory allows traversal.', topic: 'Linux' },
      { type: 'mcq', q: 'find / -perm -4000 -type f is used to find:', options: ['Large files', 'Setuid binaries (privilege-escalation audit)', 'World-writable files', 'Hidden files'], answer: 1, explain: 'Setuid programs run with the owner\'s privileges.', topic: 'Linux' },
      { type: 'mcq', q: 'A share grants Modify; NTFS grants Read. Effective network access is:', options: ['Modify', 'Read', 'Full Control', 'None'], answer: 1, explain: 'Most restrictive of share and NTFS wins.', topic: 'Windows' },
      { type: 'tf', q: 'Setuid on a shell script is a safe way to let users run it as root.', answer: false, explain: 'Setuid scripts are notoriously exploitable; most systems ignore it on scripts for that reason.', topic: 'Linux' }
    ] }, practical: { type: 'terminal', id: 'term-09-permissions', title: 'Configure users, groups and permissions on Linux' }, cert: ['secplus:4.6', 'linux:security'], refs: [] });

  L.push({ id: 'l2-sec-05-logs-siem', level: 2, track: 'security', order: 5, title: 'Security Logs, Monitoring and Introduction to SIEM', summary: 'Which logs matter, how to read Windows and Linux security events, and how a SIEM turns logs into detections.', minutes: 30, skills: { security: 4, forensics: 2 }, prereqs: ['l2-net-10-monitoring'],
    objectives: ['Identify the key security log sources and events', 'Read Windows Security events and Linux auth logs', 'Explain SIEM collection, correlation and alerting', 'Build a simple detection from log patterns'],
    sections: [
      { type: 'text', title: 'Key log sources and events', md: `| Source | Watch for |
| --- | --- |
| Windows Security log | 4624 logon, 4625 failed logon, 4672 special privileges, 4720 user created, 4728/4732 added to admin group, 4688 process creation, 1102 log cleared |
| Linux auth.log / secure | "Accepted/Failed password", "sudo ... COMMAND", "session opened", useradd |
| Firewall | denies, new allow rules, outbound to rare destinations |
| DNS | queries to known-bad or newly registered domains, tunnelling patterns |
| Web/proxy | 500 spikes, injection patterns, large downloads |
| EDR | malware detections, suspicious process trees, credential access |
| VPN / IdP | logins from new countries, impossible travel, MFA changes |

Three properties make logs useful: **centralized** (attacker cannot erase them — note event 1102/cleared auth.log), **time-synchronized** (NTP, so timelines line up), and **retained** long enough (often 90–365 days).` },
      { type: 'text', title: 'Reading events', md: `A brute-force-then-success on Linux looks like many "Failed password for … from 203.0.113.50" followed by "Accepted password for … from 203.0.113.50" and "session opened", then perhaps a "sudo … COMMAND=/bin/bash". On Windows the equivalent is a run of 4625s then a 4624 from the same source, maybe followed by 4672 and a 4720/4732 (new admin).

You will practise extracting the signal: in the terminal labs, \`grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn\` ranks attacking IPs; \`journalctl -u ssh -g Accepted\` finds successful logins. The skill is turning thousands of lines into "who, from where, and did they get in".` },
      { type: 'text', title: 'SIEM', md: `A **SIEM** (Splunk, Microsoft Sentinel, Elastic, QRadar, Wazuh) centralizes logs and adds value in stages:

1. **Collection & parsing** — agents/forwarders normalize many formats into fields (source IP, user, event type).
2. **Correlation** — rules combine events across sources: *20 failed logons then a success then a new admin account within 10 minutes* is one alert, not 22 lines.
3. **Enrichment** — add threat intelligence (is this IP known bad?), geolocation, asset criticality.
4. **Alerting & dashboards** — prioritized alerts to analysts; metrics for management.
5. **Investigation & response** — pivot across data, build timelines, feed SOAR automation.

Good detections balance **true positives** against **alert fatigue**: too many noisy rules and analysts miss the real one. Start with high-value, low-noise detections (new admin accounts, log cleared, impossible travel, disabled security tools, many-fails-then-success).` },
      { type: 'check', question: { type: 'mcq', q: 'Windows event 1102 ("audit log was cleared") appearing unexpectedly suggests:', options: ['Routine maintenance only', 'A possible attempt to destroy evidence — investigate', 'A DNS problem', 'A successful backup'], answer: 1, explain: 'Clearing logs is a common anti-forensics step; it should be alerted and investigated.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Windows event ID 4625 is:', options: ['Successful logon', 'Failed logon', 'Account created', 'Log cleared'], answer: 1, explain: '4624 success, 4625 failure.', topic: 'logs' },
      { type: 'mcq', q: 'Why centralize logs off the host that generates them?', options: ['To save CPU', 'So an attacker who compromises the host cannot erase the evidence', 'Logs are smaller remotely', 'It is required by TCP'], answer: 1, explain: 'Tamper resistance and correlation.', topic: 'logs' },
      { type: 'mcq', q: 'The core value a SIEM adds over raw logs is:', options: ['Encryption', 'Correlation of events across sources into prioritized alerts', 'Faster disks', 'Replacing firewalls'], answer: 1, explain: 'Correlation and alerting.', topic: 'SIEM' },
      { type: 'mcq', q: 'Many 4625s from one IP followed by a 4624 from the same IP indicates:', options: ['Normal logons', 'A likely successful brute-force', 'A printer', 'A DNS query'], answer: 1, explain: 'Failures then success = probable compromise.', topic: 'detection' },
      { type: 'mcq', q: 'Which pairing is a high-value, low-noise detection?', options: ['Every successful logon', 'New member added to the Administrators group', 'Every DNS query', 'Each DHCP renewal'], answer: 1, explain: 'Rare and high impact.', topic: 'detection' },
      { type: 'mcq', q: 'Accurate timelines across systems depend on:', options: ['Fast CPUs', 'Synchronized clocks (NTP)', 'IPv6', 'Large disks'], answer: 1, explain: 'Correlating events needs consistent time.', topic: 'logs' },
      { type: 'tf', q: 'More alert rules always make a SOC more effective.', answer: false, explain: 'Alert fatigue causes real alerts to be missed; quality beats quantity.', topic: 'SIEM' }
    ] }, practical: { type: 'security', id: 'sec-04-logs', title: 'Investigate security logs for a breach' }, cert: ['secplus:4.0', 'entrysec:operations'], refs: [] });

  L.push({ id: 'l2-sec-06-policies-risk', level: 2, track: 'security', order: 6, title: 'Security Policies, Risk Assessment and Incident Response', summary: 'How organizations govern security: policies, risk assessment, and a practical incident response lifecycle.', minutes: 25, skills: { security: 4 }, prereqs: ['l1-sec-08-best-practices'],
    objectives: ['Explain the role of policies, standards and procedures', 'Perform a basic qualitative risk assessment', 'Describe the incident response lifecycle', 'Classify and prioritize an incident'],
    sections: [
      { type: 'text', title: 'Governance documents', md: `- **Policy** — high-level intent approved by management ("all remote access requires MFA").
- **Standard** — mandatory specifics ("MFA via FIDO2 or authenticator app, not SMS").
- **Procedure** — step-by-step how-to ("to enrol a token, …").
- **Guideline** — recommended but not mandatory.

Common policies: Acceptable Use, Access Control, Password/Authentication, Data Classification, Remote Work, Incident Response, BYOD, Retention, Vendor/Third-Party. Policies must be approved, communicated, trained and enforced — an unread policy changes nothing.

Frameworks give you a ready structure: **NIST CSF** (Identify, Protect, Detect, Respond, Recover), **ISO 27001**, **CIS Controls**, plus regulations such as GDPR, HIPAA and PCI DSS that impose specific requirements.` },
      { type: 'text', title: 'Risk assessment', md: `1. **Identify assets** and their value.
2. **Identify threats and vulnerabilities** for each.
3. **Assess likelihood and impact** — qualitative (Low/Medium/High matrix) or quantitative (ALE = SLE × ARO).
4. **Prioritize** by risk level.
5. **Treat** the risk — one of four choices:

| Treatment | Meaning | Example |
| --- | --- | --- |
| Mitigate | reduce likelihood/impact | patch, MFA, segmentation |
| Transfer | shift to a third party | cyber insurance, outsourcing |
| Avoid | stop the risky activity | decommission the exposed service |
| Accept | live with it (documented, by the owner) | low-impact issue, costly fix |

Residual risk remains after controls; the **risk owner** (a business leader, not IT) formally accepts it. A **risk register** tracks each risk, its rating, treatment, owner and review date.` },
      { type: 'text', title: 'Incident response lifecycle', md: `NIST SP 800-61 phases:

1. **Preparation** — plan, roles, contacts, tools, backups, training, tabletop exercises.
2. **Detection & Analysis** — identify and validate the incident; determine scope and severity; start a timeline.
3. **Containment** — short-term (isolate the host) then long-term (block indicators, reset credentials); preserve evidence before wiping.
4. **Eradication** — remove malware/persistence, close the entry vector, patch.
5. **Recovery** — restore from clean backups, monitor closely, confirm normal operation.
6. **Post-incident (Lessons Learned)** — what happened, what worked, what to improve; update controls and playbooks.

**Classification** drives the response: severity by impact (data loss, systems affected, business disruption, regulatory exposure) and urgency. A single phished test account differs from ransomware on the file server — but both follow the same lifecycle. Know **when to escalate** (legal, management, regulators within breach-notification deadlines, law enforcement) before the incident, not during it.` },
      { type: 'check', question: { type: 'mcq', q: 'A company buys cyber-insurance to cover breach costs. This risk treatment is:', options: ['Mitigate', 'Transfer', 'Avoid', 'Accept'], answer: 1, explain: 'Transferring financial impact to a third party.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'A step-by-step document for enrolling an MFA token is a:', options: ['Policy', 'Standard', 'Procedure', 'Guideline'], answer: 2, explain: 'Procedures are the how-to.', topic: 'governance' },
      { type: 'mcq', q: 'ALE is calculated as:', options: ['SLE × ARO', 'Impact + Likelihood', 'CVSS × assets', 'Threats − controls'], answer: 0, explain: 'Annual Loss Expectancy = Single Loss Expectancy × Annual Rate of Occurrence.', topic: 'risk' },
      { type: 'mcq', q: 'Who should formally accept a residual risk?', options: ['The help desk', 'The business risk owner', 'The attacker', 'Any employee'], answer: 1, explain: 'Risk acceptance is a business decision.', topic: 'risk' },
      { type: 'order', q: 'Order the incident response phases.', items: ['Containment', 'Preparation', 'Detection & Analysis', 'Recovery'], answer: [1, 2, 0, 3], explain: 'Preparation → Detection → Containment → Eradication → Recovery → Lessons Learned.', topic: 'IR' },
      { type: 'mcq', q: 'During containment you should, before wiping a host:', options: ['Reinstall immediately', 'Preserve evidence (memory, disk image, logs)', 'Delete all logs', 'Pay any ransom'], answer: 1, explain: 'Evidence supports investigation and possible legal action.', topic: 'IR' },
      { type: 'mcq', q: 'The NIST CSF functions are:', options: ['Plan, Do, Check, Act', 'Identify, Protect, Detect, Respond, Recover', 'Scan, Exploit, Report', 'Confidentiality, Integrity, Availability'], answer: 1, explain: 'Five CSF functions.', topic: 'frameworks' },
      { type: 'tf', q: 'Escalation paths and breach-notification deadlines should be defined before an incident occurs.', answer: true, explain: 'Preparation is the first IR phase precisely for this reason.', topic: 'IR' }
    ] }, practical: { type: 'troubleshoot', id: 'ts-06-suspicious-device', title: 'Investigate and respond to a suspicious device' }, cert: ['secplus:5.0', 'entrysec:operations'], refs: [{ title: 'NIST SP 800-61 Computer Security Incident Handling Guide', url: 'https://csrc.nist.gov/pubs/sp/800/61/r2/final' }] });

  NSA.data.lessons = NSA.data.lessons.concat(L);
})(typeof globalThis !== 'undefined' ? globalThis : window);
