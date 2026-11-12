/* NetSec Academy – Level 3 (Expert) lessons: security */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.lessons = NSA.data.lessons || [];
  const L = [];

  L.push({ id: 'l3-sec-01-pentest', level: 3, track: 'security', order: 1, title: 'Advanced Penetration Testing Methodologies and OWASP', summary: 'Professional pentest methodology, the OWASP Top 10 in depth, and how findings become reports that get fixed. Authorized testing only.', minutes: 35, skills: { hacking: 5, security: 2 }, prereqs: [],
    objectives: ['Apply a full pentest methodology and rules of engagement', 'Explain the OWASP Top 10 categories and defences', 'Chain findings to demonstrate impact responsibly', 'Write professional findings with CVSS and remediation'],
    sections: [
      { type: 'callout', tone: 'warn', title: 'Scope and authorization', md: 'Penetration testing is legal only with written authorization defining scope and rules of engagement. Every technique below is practised solely against the course\'s isolated vulnerable lab. The deliverable that matters is a report that drives remediation.' },
      { type: 'text', title: 'Methodology and rules of engagement', md: `A professional engagement follows a documented standard (PTES, OWASP WSTG, NIST SP 800-115):

1. **Pre-engagement** — scope, goals, rules of engagement (allowed techniques, testing windows, out-of-scope systems, emergency contacts, handling of sensitive data found), and signed authorization.
2. **Reconnaissance & enumeration** — map the attack surface within scope.
3. **Vulnerability analysis** — identify and validate weaknesses.
4. **Exploitation** — gain access within the rules, carefully, avoiding damage.
5. **Post-exploitation** — demonstrate impact (what an attacker could reach) via privilege escalation and lateral movement, while taking care and documenting.
6. **Reporting** — prioritized findings, evidence, business impact, remediation.
7. **Remediation testing** — verify fixes.

Rules of engagement protect everyone: no denial-of-service unless agreed, stop-and-notify on finding evidence of a prior breach or highly sensitive data, and "do no harm" on production.` },
      { type: 'text', title: 'OWASP Top 10 (2021)', md: `The industry reference for web risks — know the category, the cause and the fix:

| Category | Cause | Primary fix |
| --- | --- | --- |
| A01 Broken Access Control | missing/incorrect authorization checks | enforce server-side authorization on every request; deny by default |
| A02 Cryptographic Failures | weak/missing crypto, secrets in code | TLS everywhere, strong algorithms, proper key management |
| A03 Injection (SQLi, XSS…) | untrusted input mixed with code | parameterization, output encoding, validation |
| A04 Insecure Design | missing security requirements/threat modeling | design reviews, threat modeling, secure patterns |
| A05 Security Misconfiguration | defaults, verbose errors, open cloud | hardening baselines, least privilege, config management |
| A06 Vulnerable/Outdated Components | unpatched libraries | inventory (SBOM), patch, dependency scanning |
| A07 Identification/Auth Failures | weak auth, session handling | MFA, strong session management, lockout |
| A08 Software/Data Integrity Failures | unsigned updates, insecure deserialization | signing, integrity checks, trusted pipelines |
| A09 Logging & Monitoring Failures | no visibility | log security events, alert, retain |
| A10 Server-Side Request Forgery (SSRF) | server fetches attacker-controlled URLs | allow-list egress, validate URLs, block metadata endpoints |

Access control (A01) is consistently the most common real-world finding — test that a low-privilege user truly cannot reach high-privilege functions or other users' data.` },
      { type: 'text', title: 'Chaining and impact', md: `Individual low findings can combine into a critical one: an information leak reveals an internal hostname → an SSRF reaches it → a default credential grants admin. Demonstrating a realistic **chain** communicates impact far better than a list of isolated mediums — but only within scope and without causing harm. Capture clear, reproducible evidence (requests, responses, screenshots) at each step.

Post-exploitation in an authorized test proves reach (what data, which systems) to justify the business risk, then stops short of damage. Clean up artifacts and document everything for the retest.` },
      { type: 'text', title: 'Reporting', md: `The report is the product. Each finding includes: **title and severity** (CVSS with vector), **affected assets**, **description** of the weakness, **evidence/steps to reproduce**, **business impact** in plain language, and **specific remediation** plus references. Lead with an **executive summary** (overall posture, top risks, headline numbers) for leadership, and a technical section for engineers. Rank by risk, not by how interesting the bug is. A finding without clear remediation has little value — your job is to get it fixed.` },
      { type: 'check', question: { type: 'mcq', q: 'In the OWASP Top 10, which category is consistently the most prevalent real-world web risk?', options: ['A03 Injection', 'A01 Broken Access Control', 'A10 SSRF', 'A06 Vulnerable Components'], answer: 1, explain: 'Broken Access Control topped the 2021 list and remains the most common finding.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'Rules of engagement primarily exist to:', options: ['Slow the tester down', 'Define allowed techniques, scope and safety so the test does no unintended harm', 'Replace authorization', 'Guarantee findings'], answer: 1, explain: 'They protect the client and tester.', topic: 'methodology' },
      { type: 'mcq', q: 'The single most effective fix for A03 Injection is:', options: ['Longer passwords', 'Parameterization and output encoding (separate data from code)', 'Disabling logging', 'More servers'], answer: 1, explain: 'Keep input from being interpreted as code/markup.', topic: 'OWASP' },
      { type: 'mcq', q: 'SSRF (A10) is best mitigated by:', options: ['Allow-listing outbound destinations and blocking metadata endpoints', 'Faster CPUs', 'Disabling HTTPS', 'Longer URLs'], answer: 0, explain: 'Restrict and validate server-initiated requests.', topic: 'OWASP' },
      { type: 'mcq', q: 'Chaining findings in a report is valuable because it:', options: ['Pads the page count', 'Demonstrates realistic impact from combined weaknesses', 'Avoids remediation', 'Hides evidence'], answer: 1, explain: 'Impact drives prioritization.', topic: 'reporting' },
      { type: 'mcq', q: 'The most important section of a pentest report for executives is the:', options: ['Raw tool output', 'Executive summary with top risks and posture', 'Appendix', 'Tool versions'], answer: 1, explain: 'Leadership needs risk and priorities, not raw data.', topic: 'reporting' },
      { type: 'mcq', q: 'Broken access control is best tested by:', options: ['Checking page load speed', 'Verifying a low-privilege user cannot reach high-privilege functions or others\' data', 'Scanning for open ports only', 'Reading the privacy policy'], answer: 1, explain: 'Authorization enforcement is the core test.', topic: 'OWASP' },
      { type: 'tf', q: 'A finding without clear remediation guidance is of limited value.', answer: true, explain: 'The goal is to get issues fixed.', topic: 'reporting' }
    ] }, practical: { type: 'security', id: 'sec-07-webapp', title: 'Assess and report on the vulnerable lab app' }, cert: ['secplus:5.5', 'entrysec:operations'], refs: [{ title: 'OWASP Web Security Testing Guide', url: 'https://owasp.org/www-project-web-security-testing-guide/' }, { title: 'PTES', url: 'http://www.pentest-standard.org/' }] });

  L.push({ id: 'l3-sec-02-ad', level: 3, track: 'security', order: 2, title: 'Active Directory Security and Privilege Escalation', summary: 'How Windows domains are attacked and defended: common attack paths, privilege escalation concepts, and hardening — defensively framed.', minutes: 30, skills: { hacking: 3, security: 4, windows: 2 }, prereqs: ['l2-net-12-windows-server'],
    objectives: ['Explain AD authentication and why it is a prime target', 'Describe common attack path concepts at a high level', 'Explain privilege escalation categories', 'Apply AD hardening and tiered administration'],
    sections: [
      { type: 'callout', tone: 'warn', title: 'Defensive focus', md: 'This lesson explains attack concepts so defenders and authorized red teams can detect and prevent them. It covers what to look for and how to harden, not step-by-step exploitation. Practice is in the isolated lab only.' },
      { type: 'text', title: 'Why AD is the prize', md: `Active Directory controls identity for most enterprises — compromise the domain and you effectively own every joined system. Authentication uses **Kerberos** (tickets) and legacy **NTLM**. Attackers aim to steal credentials or tickets, escalate to **Domain Admin**, and establish persistence. Because AD is central, both the attack surface and the monitoring opportunity are large.

Key concepts a defender must understand: the **krbtgt** account signs all Kerberos tickets; **service accounts** with Service Principal Names (SPNs) can be targeted; **privileged groups** (Domain Admins, Enterprise Admins) are the crown jewels; and **trust relationships** can extend compromise across domains/forests.` },
      { type: 'text', title: 'Attack-path concepts (what to detect)', md: `At a conceptual level, common domain attack techniques — and their detections — include:

- **Credential theft from memory / reuse** (e.g. pass-the-hash, pass-the-ticket): watch for logons using NTLM where Kerberos is expected, and anomalous lateral authentication. Mitigate with Credential Guard, LAPS (unique local admin passwords), and no reuse of privileged credentials on workstations.
- **Kerberoasting**: requesting service tickets for SPN accounts to crack offline. Detect unusual ticket requests; mitigate with long, random service-account passwords (gMSA) and least-privilege SPNs.
- **AS-REP roasting**: accounts without Kerberos pre-auth. Mitigate by requiring pre-auth.
- **Forged tickets** (Golden/Silver): detect ticket anomalies and protect/rotate the krbtgt account; these require already-high privilege, so prevention is about not losing DA in the first place.
- **Delegation abuse** and **ACL misconfigurations**: audit with tools like BloodHound (used defensively) to find and remove dangerous rights.

Tools such as BloodHound map these paths; blue teams run them to **find and close** the paths before attackers use them.` },
      { type: 'text', title: 'Privilege escalation categories', md: `Escalation turns limited access into high privilege:
- **Misconfiguration** — excessive group membership, writable service binaries, unquoted service paths, scheduled tasks, weak file/registry ACLs.
- **Credential exposure** — passwords in scripts, GPP, shares, memory; reused local admin passwords (fixed by LAPS).
- **Missing patches** — local privilege-escalation vulnerabilities.
- **Token/delegation abuse** on Windows; **SUID/sudo misconfig** on Linux (from Level 2).

Defenders hunt the same things: least privilege, patching, and configuration hygiene remove most escalation paths.` },
      { type: 'text', title: 'Hardening AD', md: `- **Tiered administration** — separate admin accounts for workstations, servers and domain controllers; never use a DA account to log into a workstation.
- **LAPS** — unique, rotated local admin passwords.
- **Protected Users** group and Credential Guard to limit credential theft.
- **Least privilege** — minimize Domain/Enterprise Admins; use just-in-time/just-enough admin.
- **Disable legacy** — NTLM where possible, SMBv1, unconstrained delegation.
- **Monitor** — ticket anomalies, group changes (4728/4732), DCSync, new SPNs; feed to the SIEM.
- **Rotate krbtgt** periodically; secure and monitor domain controllers tightly; maintain tested, offline backups of AD.` },
      { type: 'check', question: { type: 'mcq', q: 'LAPS (Local Administrator Password Solution) primarily defends against:', options: ['Phishing', 'Reuse of the same local admin password enabling lateral movement', 'DDoS', 'SQL injection'], answer: 1, explain: 'Unique, rotated local admin passwords stop pass-the-hash lateral movement.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'Compromising which account most directly enables forging Kerberos tickets?', options: ['A standard user', 'krbtgt', 'Guest', 'A printer account'], answer: 1, explain: 'krbtgt signs all tickets; protect and rotate it.', topic: 'AD' },
      { type: 'mcq', q: 'Kerberoasting targets:', options: ['Domain controllers directly', 'Service accounts with SPNs (crack tickets offline)', 'DNS', 'DHCP'], answer: 1, explain: 'Mitigate with long random gMSA passwords.', topic: 'AD' },
      { type: 'mcq', q: 'Tiered administration means:', options: ['One admin account for everything', 'Separate admin accounts per tier; never use DA on a workstation', 'No admin accounts', 'Sharing credentials'], answer: 1, explain: 'Prevents credential theft from cascading.', topic: 'hardening' },
      { type: 'mcq', q: 'Blue teams run BloodHound to:', options: ['Attack production', 'Discover and remove dangerous attack paths before attackers use them', 'Replace AD', 'Encrypt tickets'], answer: 1, explain: 'Defensive attack-path analysis.', topic: 'AD' },
      { type: 'mcq', q: 'A common Windows privilege-escalation misconfiguration is:', options: ['Strong passwords', 'Writable service binaries / weak ACLs on services', 'MFA enabled', 'Patched systems'], answer: 1, explain: 'Service misconfigurations let a user run code as SYSTEM.', topic: 'privesc' },
      { type: 'mcq', q: 'Which detection signals possible privileged-group abuse?', options: ['4624 at 9am', 'Event 4728/4732 adding a member to Domain Admins', 'DHCP renewal', 'DNS query'], answer: 1, explain: 'Monitor privileged group changes.', topic: 'detection' },
      { type: 'tf', q: 'Minimizing Domain Admin membership reduces the AD attack surface.', answer: true, explain: 'Fewer high-privilege accounts, fewer targets.', topic: 'hardening' }
    ] }, practical: { type: 'security', id: 'sec-10-adsec', title: 'Audit an Active Directory environment for weaknesses' }, cert: ['secplus:2.4', 'entrysec:operations'], refs: [{ title: 'Microsoft: Securing privileged access', url: 'https://learn.microsoft.com/security/privileged-access-workstations/overview' }] });

  L.push({ id: 'l3-sec-03-forensics', level: 3, track: 'security', order: 3, title: 'Digital Forensics and Malware Analysis Fundamentals', summary: 'Evidence handling, acquisition order, host and network artifacts, and safe static malware triage.', minutes: 30, skills: { forensics: 5, security: 2 }, prereqs: ['l2-sec-05-logs-siem'],
    objectives: ['Apply chain of custody and order of volatility', 'Identify key forensic artifacts on Windows and Linux', 'Explain static vs dynamic malware analysis safely', 'Build an investigation timeline'],
    sections: [
      { type: 'text', title: 'Principles and chain of custody', md: `Digital forensics must preserve evidence so conclusions are trustworthy and, where needed, admissible. Core rules:

- **Chain of custody** — document who collected, handled and stored each item, when and how. Any gap undermines the evidence.
- **Preserve originals** — work on **verified copies** (bit-for-bit images); hash (SHA-256) before and after to prove integrity.
- **Order of volatility** — collect the most ephemeral data first: CPU/registers and cache → RAM → network state and running processes → disk → logs/archives → backups. Pulling the plug loses memory; shutting down cleanly may trigger anti-forensics — decisions depend on the situation and policy.
- **Documentation** — timestamps (with time zone), tools and versions, every action.` },
      { type: 'text', title: 'Artifacts', md: `**Windows**: Security/System/Application event logs, Prefetch and Amcache (execution), registry run keys and services (persistence), scheduled tasks, \$MFT and \$UsnJrnl (file activity), browser history, LNK/jumplists, memory (processes, injected code, credentials), and shadow copies.

**Linux**: \`/var/log\` (auth, syslog, journal), shell history, cron jobs and systemd units (persistence), \`/etc/passwd\`+\`shadow\`, SUID files, open files/processes, and timestamps (atime/mtime/ctime).

**Network**: flow records, firewall/proxy/DNS logs, and full packet captures if available — these often reveal C2 and exfiltration that an attacker scrubbed from the host.

Correlating host and network artifacts across a synchronized timeline tells the story: initial access → execution → persistence → lateral movement → exfiltration.` },
      { type: 'text', title: 'Malware analysis (safely)', md: `Analysis happens in an **isolated sandbox** (no production network, snapshots to revert), never on a live corporate network.

- **Static analysis** (no execution): file type and hashes (look up reputation in VirusTotal), strings, embedded URLs/IPs, PE headers and imports, packing detection, YARA rules. Safe and fast triage.
- **Dynamic analysis** (controlled execution): observe process, file, registry and network behaviour in the sandbox; capture IoCs (domains, IPs, dropped files, persistence). Automated sandboxes (Cuckoo-style, cloud services) do this at scale.

Goal: extract **indicators of compromise** to hunt across the estate, and understand capability (does it steal credentials? spread? ransom?). Do not run unknown samples outside a sandbox, and treat downloaded samples as hostile data.` },
      { type: 'text', title: 'Timelines', md: `A timeline orders events from all sources (super-timeline tools merge filesystem, log and registry timestamps). It answers **what happened, in what order, and how far it spread**, which drives containment scope and the incident report. Watch for timestamp tampering — attackers "timestomp" files; the \$UsnJrnl, logs and network data help detect it.` },
      { type: 'check', question: { type: 'mcq', q: 'Following the order of volatility, which should you capture first?', options: ['Disk image', 'RAM (memory)', 'Backup tapes', 'Archived logs'], answer: 1, explain: 'Memory is more volatile than disk; capture it before powering down.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'Chain of custody ensures:', options: ['Faster analysis', 'A documented, tamper-evident record of evidence handling', 'Encrypted disks', 'Automatic remediation'], answer: 1, explain: 'It makes evidence trustworthy/admissible.', topic: 'forensics' },
      { type: 'mcq', q: 'Why hash evidence before and after imaging?', options: ['To compress it', 'To prove the copy is identical and unaltered', 'To encrypt it', 'To speed up disks'], answer: 1, explain: 'Matching hashes prove integrity.', topic: 'forensics' },
      { type: 'mcq', q: 'Which Windows artifact shows program execution history?', options: ['hosts file', 'Prefetch/Amcache', 'resolv.conf', 'DHCP lease'], answer: 1, explain: 'Prefetch and Amcache record execution.', topic: 'artifacts' },
      { type: 'mcq', q: 'Static malware analysis means:', options: ['Running the sample on production', 'Examining the file without executing it (hashes, strings, headers)', 'Deleting the file', 'Encrypting the file'], answer: 1, explain: 'No execution; safe triage.', topic: 'malware' },
      { type: 'mcq', q: 'Malware should be executed only:', options: ['On the analyst\'s daily laptop', 'In an isolated sandbox with snapshots', 'On a domain controller', 'Never, under any circumstances'], answer: 1, explain: 'Controlled, isolated, revertible environment.', topic: 'malware' },
      { type: 'mcq', q: 'Network captures are valuable in forensics because they:', options: ['Are easy to fake', 'Often reveal C2/exfiltration an attacker scrubbed from the host', 'Replace disk images', 'Contain no evidence'], answer: 1, explain: 'Off-host evidence is harder for attackers to erase.', topic: 'artifacts' },
      { type: 'tf', q: 'Attackers may alter file timestamps (timestomping) to mislead investigators.', answer: true, explain: 'Cross-check with journals, logs and network data.', topic: 'forensics' }
    ] }, practical: { type: 'security', id: 'sec-11-forensics', title: 'Triage a suspicious file and build a timeline' }, cert: ['secplus:4.8', 'entrysec:operations'], refs: [{ title: 'NIST SP 800-86 Guide to Integrating Forensic Techniques', url: 'https://csrc.nist.gov/pubs/sp/800/86/final' }] });

  L.push({ id: 'l3-sec-04-soc', level: 3, track: 'security', order: 4, title: 'SOC Operations, Threat Hunting and SIEM Investigation', summary: 'How a Security Operations Center works: triage, investigation, threat hunting, and the metrics that run it.', minutes: 30, skills: { security: 5, forensics: 2 }, prereqs: ['l2-sec-05-logs-siem'],
    objectives: ['Describe SOC tiers, workflow and metrics', 'Triage and investigate an alert end to end', 'Explain proactive threat hunting with hypotheses', 'Use frameworks (MITRE ATT&CK, pyramid of pain) in analysis'],
    sections: [
      { type: 'text', title: 'How a SOC works', md: `A **SOC** monitors, detects, investigates and responds to security events, often 24/7. Typical structure:
- **Tier 1** — alert triage: validate, classify (true/false positive), escalate real incidents.
- **Tier 2** — deeper investigation, scoping, containment.
- **Tier 3 / threat hunting / IR** — advanced analysis, proactive hunting, major incidents.
- Plus **detection engineering** (writes and tunes rules) and **threat intelligence**.

Tooling: **SIEM** (correlation, search), **EDR/XDR** (endpoint), **SOAR** (automation/playbooks), ticketing, and threat-intel feeds. The workflow turns millions of events into a handful of investigated incidents.` },
      { type: 'text', title: 'Triage and investigation', md: `For each alert ask:
1. **Is it real?** Correlate with context — asset, user, time, other events. Many alerts are benign (admin activity, scanners you own).
2. **What is the scope?** One host or many? Which accounts? What was accessed?
3. **What is the impact and urgency?** Classify severity.
4. **What next?** Contain, escalate, or close with notes.

A disciplined investigation **pivots** across data: an alert IP → which hosts talked to it → what processes → what users → what else those users did. Document findings as you go (the start of the incident timeline). Good analysts write clear, factual notes — the next shift and any report depend on them.` },
      { type: 'text', title: 'Threat hunting', md: `Hunting is **proactive**: assume a breach that alerts missed and go looking, driven by a **hypothesis** ("if an attacker used this technique, I would see X"). Sources: ATT&CK techniques, threat intel, anomalies in baselines. Example hypotheses: unusual PowerShell encoded commands; new scheduled tasks across many hosts; beaconing to a rare external IP at fixed intervals; service accounts logging in interactively.

**MITRE ATT&CK** gives a shared language of tactics (the why) and techniques (the how) to structure detections and hunts. The **pyramid of pain** reminds you that blocking an attacker's TTPs (behaviours) hurts them far more than blocking easily-changed indicators like IPs and hashes.` },
      { type: 'text', title: 'Metrics', md: `SOCs are measured by **MTTD** (mean time to detect) and **MTTR** (mean time to respond), alert volume and false-positive rate, dwell time, and coverage (which ATT&CK techniques are detectable). The goal is to shrink detection and response time while controlling alert fatigue — tuning noisy rules is as important as writing new ones. Automation (SOAR playbooks) handles repetitive enrichment and containment so analysts focus on judgement.` },
      { type: 'check', question: { type: 'mcq', q: 'Threat hunting differs from alert triage because it is:', options: ['Reactive to alerts', 'Proactive and hypothesis-driven, assuming a missed breach', 'Only automated', 'Done by Tier 1 only'], answer: 1, explain: 'Hunters look for what detections missed, guided by hypotheses.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'Tier 1 SOC analysts primarily:', options: ['Write detection rules', 'Triage and classify alerts, escalating real incidents', 'Lead major incidents', 'Manage the budget'], answer: 1, explain: 'Front-line validation and escalation.', topic: 'SOC' },
      { type: 'mcq', q: 'MTTD measures:', options: ['Mean time to deploy', 'Mean time to detect', 'Maximum ticket depth', 'Memory total'], answer: 1, explain: 'Detection speed.', topic: 'metrics' },
      { type: 'mcq', q: 'MITRE ATT&CK provides:', options: ['A firewall', 'A shared taxonomy of adversary tactics and techniques', 'An antivirus engine', 'A password manager'], answer: 1, explain: 'Common language for detection and hunting.', topic: 'frameworks' },
      { type: 'mcq', q: 'The pyramid of pain says blocking which costs an attacker most?', options: ['IP addresses', 'File hashes', 'TTPs (tools, tactics, behaviours)', 'Domain names'], answer: 2, explain: 'Behaviours are hardest to change.', topic: 'frameworks' },
      { type: 'mcq', q: 'SOAR is used to:', options: ['Replace analysts entirely', 'Automate repetitive enrichment and response via playbooks', 'Store backups', 'Route packets'], answer: 1, explain: 'Automation frees analysts for judgement.', topic: 'SOC' },
      { type: 'mcq', q: 'During triage, the first question about an alert is:', options: ['Who to blame', 'Is it a true or false positive (with context)?', 'What time is lunch', 'Which vendor sold the tool'], answer: 1, explain: 'Validate before acting.', topic: 'SOC' },
      { type: 'tf', q: 'Reducing false positives is as important as adding new detections.', answer: true, explain: 'Alert fatigue causes real alerts to be missed.', topic: 'metrics' }
    ] }, practical: { type: 'security', id: 'sec-09-incident', title: 'Investigate SOC alerts and triage an incident' }, cert: ['secplus:4.0', 'entrysec:operations'], refs: [{ title: 'MITRE ATT&CK', url: 'https://attack.mitre.org/' }] });

  L.push({ id: 'l3-sec-05-crypto', level: 3, track: 'security', order: 5, title: 'Cryptography and PKI', summary: 'Symmetric and asymmetric crypto, hashing, digital signatures, certificates and TLS — the mechanisms behind confidentiality and trust.', minutes: 30, skills: { security: 5 }, prereqs: ['l1-sec-02-cia'],
    objectives: ['Distinguish symmetric, asymmetric and hashing and their uses', 'Explain digital signatures and certificates', 'Describe how PKI and TLS establish trust', 'Apply crypto best practices and spot weaknesses'],
    sections: [
      { type: 'text', title: 'The three building blocks', md: `- **Symmetric encryption** — one shared key encrypts and decrypts; fast, used for bulk data. Standard: **AES** (128/256-bit), typically in authenticated modes (AES-GCM). Challenge: distributing the key securely.
- **Asymmetric encryption** — a **key pair**: the public key encrypts (or verifies), the private key decrypts (or signs). Standards: **RSA**, **ECC** (smaller keys, same strength). Slow, so used to exchange a symmetric key and to sign — not for bulk data.
- **Hashing** — one-way fixed-length fingerprint for integrity. Use **SHA-256**/SHA-3; **MD5** and **SHA-1** are broken for security. **HMAC** adds a key for authenticated integrity; password hashing uses slow functions (bcrypt/Argon2).

In practice they combine: TLS uses asymmetric crypto to agree on a symmetric session key, then AES for the data, with hashes/HMAC for integrity.` },
      { type: 'text', title: 'Signatures and certificates', md: `A **digital signature** is created by hashing the data and encrypting the hash with the signer's **private key**; anyone can verify with the **public key**, proving **integrity**, **authenticity** and **non-repudiation**. This is how software updates, documents and TLS handshakes are trusted.

A **certificate** binds a public key to an identity (domain, person, device) and is signed by a **Certificate Authority (CA)**. Your system trusts a set of **root CAs**; they sign **intermediates**, which sign end-entity certs — a **chain of trust**. A browser trusts \`example.com\` because its cert chains up to a trusted root and is valid (not expired, not revoked, matching name).` },
      { type: 'text', title: 'PKI and TLS', md: `**PKI** is the whole system of CAs, certificates, registration, distribution and **revocation** (CRL / OCSP) that makes public keys usable at scale.

A simplified **TLS handshake**: client hello → server presents its certificate (and chain) → client validates the chain, name and validity → they perform a key exchange (ECDHE for **forward secrecy**, so past traffic stays safe even if the private key later leaks) → agree a symmetric session key → encrypted application data flows. TLS 1.3 streamlined and hardened this (removed weak ciphers, faster handshake).

Certificate errors mean a trust failure — wrong name, expired, untrusted issuer, or a possible interception. Never click through on a site handling credentials.` },
      { type: 'text', title: 'Best practices and pitfalls', md: `- Use current algorithms and modes (AES-GCM, SHA-256+, RSA-2048+/ECC, TLS 1.2/1.3); disable SSLv3, TLS 1.0/1.1, RC4, MD5, SHA-1.
- **Never roll your own crypto**; use vetted libraries correctly.
- Protect **private keys** (HSMs, key vaults, limited access); rotate and revoke.
- **Forward secrecy** so key compromise does not expose past sessions.
- Validate certificates fully (chain, name, expiry, revocation); pin where appropriate.
- Hash passwords with slow, salted functions — never plain SHA-256.
- Plan for **post-quantum** migration as standards mature (quantum threatens RSA/ECC long-term).` },
      { type: 'check', question: { type: 'mcq', q: 'A digital signature is created by encrypting a hash of the message with the signer\'s:', options: ['public key', 'private key', 'symmetric key', 'session key'], answer: 1, explain: 'Sign with the private key; verify with the public key.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'AES is a ______ encryption algorithm.', options: ['symmetric', 'asymmetric', 'hashing', 'signing'], answer: 0, explain: 'One shared key, fast, for bulk data.', topic: 'crypto' },
      { type: 'mcq', q: 'Which is appropriate for integrity but NOT reversible?', options: ['AES', 'RSA', 'SHA-256', 'ECC'], answer: 2, explain: 'Hashing is one-way.', topic: 'crypto' },
      { type: 'mcq', q: 'A certificate binds a public key to an identity and is signed by a:', options: ['DNS server', 'Certificate Authority', 'DHCP server', 'Firewall'], answer: 1, explain: 'The CA vouches for the binding.', topic: 'PKI' },
      { type: 'mcq', q: 'Forward secrecy ensures that:', options: ['Keys never expire', 'Past sessions stay secure even if the private key later leaks', 'Encryption is faster', 'Certificates never need renewal'], answer: 1, explain: 'Ephemeral key exchange (ECDHE) provides it.', topic: 'TLS' },
      { type: 'mcq', q: 'Asymmetric crypto in TLS is mainly used to:', options: ['Encrypt all application data', 'Exchange a symmetric session key and authenticate the server', 'Hash passwords', 'Compress data'], answer: 1, explain: 'Then AES handles bulk data.', topic: 'TLS' },
      { type: 'mcq', q: 'Which should be disabled today?', options: ['TLS 1.3', 'AES-GCM', 'SSLv3 / TLS 1.0 / RC4 / MD5', 'SHA-256'], answer: 2, explain: 'Legacy protocols and weak primitives are insecure.', topic: 'crypto' },
      { type: 'tf', q: 'Passwords should be stored using fast hashes like plain SHA-256.', answer: false, explain: 'Use slow, salted functions (bcrypt/Argon2).', topic: 'crypto' }
    ] }, practical: null, cert: ['secplus:1.4', 'ccna:5.1'], refs: [] });

  L.push({ id: 'l3-sec-06-cloud-grc', level: 3, track: 'security', order: 6, title: 'Cloud Security, Vulnerability Management and Compliance', summary: 'Securing cloud workloads, running a vulnerability management program, and governance, risk and compliance at enterprise scale.', minutes: 30, skills: { cloud: 4, security: 4 }, prereqs: ['l3-net-04-cloud', 'l2-sec-06-policies-risk'],
    objectives: ['Apply the shared responsibility model and cloud security controls', 'Run a vulnerability management lifecycle', 'Explain key compliance frameworks and their drivers', 'Design security architecture that satisfies governance'],
    sections: [
      { type: 'text', title: 'Cloud security', md: `The **shared responsibility model** divides duties: the provider secures the infrastructure ("security *of* the cloud"); you secure your configuration, identity, data and access ("security *in* the cloud"). Most cloud breaches are customer-side misconfigurations.

Key controls:
- **Identity (IAM)** — least privilege, roles over long-lived keys, MFA on all users, no public admin.
- **Network** — security groups default-deny, private subnets, no management ports open to the Internet, private endpoints.
- **Data** — encryption at rest and in transit, key management, block public storage buckets by default.
- **Posture management (CSPM)** — continuously scan for misconfigurations; **CWPP** protects workloads; **CNAPP** combines them.
- **Logging** — CloudTrail/Activity Log/Audit Logs to the SIEM; alert on risky changes (new public access, IAM policy changes, disabled logging).` },
      { type: 'text', title: 'Vulnerability management lifecycle', md: `A **program**, not a one-off scan:
1. **Asset inventory** — you cannot patch what you do not know.
2. **Discover** — regular authenticated scanning (infrastructure, apps, cloud, containers) and SBOM for dependencies.
3. **Prioritize** — by CVSS **plus** exposure, exploitability (CISA KEV, EPSS) and asset value — not just raw score.
4. **Remediate** — patch, reconfigure, or compensate; define SLAs by severity (e.g. critical internet-facing within days).
5. **Verify** — rescan to confirm.
6. **Report & improve** — trend metrics (mean time to remediate, SLA compliance, recurring issues).

Patch and configuration management, tested in change windows, do the heavy lifting; the program ensures nothing is forgotten.` },
      { type: 'text', title: 'Governance, risk and compliance', md: `Organizations must meet legal, regulatory and contractual obligations:

| Framework / regulation | Driver |
| --- | --- |
| ISO 27001 | certifiable ISMS; management system for security |
| NIST CSF / 800-53 | risk-based control catalog; US federal and widely adopted |
| SOC 2 | service providers demonstrate controls to customers |
| PCI DSS | anyone handling card data |
| GDPR / data protection law | personal data of EU residents; breach notification |
| HIPAA | US healthcare data |

Compliance is a **baseline, not the goal** — being compliant is not the same as being secure, but it forces essential controls and gives a common language. GRC work includes policy, risk registers, control mapping, evidence collection, audits and continuous monitoring.

**Security architecture** ties it together: design systems so that controls (segmentation, identity, encryption, logging, least privilege) satisfy the risk appetite and compliance requirements by default, documented so auditors and engineers can both follow it.` },
      { type: 'check', question: { type: 'mcq', q: 'Under the shared responsibility model, who is responsible for a world-readable cloud storage bucket exposing data?', options: ['The cloud provider', 'The customer who configured it', 'Nobody', 'The ISP'], answer: 1, explain: 'Configuration of your resources is the customer\'s responsibility ("security in the cloud").' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'Most cloud breaches result from:', options: ['Provider hardware failure', 'Customer misconfiguration (exposed storage, IAM, open ports)', 'Weak provider encryption', 'Slow networks'], answer: 1, explain: 'Security in the cloud is the customer\'s job.', topic: 'cloud' },
      { type: 'mcq', q: 'Vulnerability prioritization should combine CVSS with:', options: ['Alphabetical order', 'Exposure, exploitability and asset value', 'The vendor name', 'Scan duration'], answer: 1, explain: 'Context-driven risk, not raw score alone.', topic: 'vulnmgmt' },
      { type: 'mcq', q: 'A CSPM tool primarily:', options: ['Routes packets', 'Continuously detects cloud misconfigurations', 'Encrypts email', 'Manages passwords'], answer: 1, explain: 'Cloud Security Posture Management.', topic: 'cloud' },
      { type: 'mcq', q: 'PCI DSS applies to organizations that:', options: ['Use Linux', 'Handle payment card data', 'Run OSPF', 'Have a website'], answer: 1, explain: 'Cardholder data environments.', topic: 'compliance' },
      { type: 'mcq', q: 'Which statement is accurate?', options: ['Compliance guarantees security', 'Compliance is a baseline, not a guarantee of security', 'Security makes compliance unnecessary', 'They are unrelated'], answer: 1, explain: 'Compliant is not automatically secure.', topic: 'GRC' },
      { type: 'mcq', q: 'A certifiable information security management system is defined by:', options: ['PCI DSS', 'ISO 27001', 'HIPAA', 'GDPR'], answer: 1, explain: 'ISO 27001 ISMS.', topic: 'compliance' },
      { type: 'tf', q: 'Logging cloud control-plane events to a SIEM helps detect risky changes like new public access.', answer: true, explain: 'CloudTrail/Activity Log monitoring is essential.', topic: 'cloud' }
    ] }, practical: null, cert: ['secplus:5.1', 'entrysec:operations'], refs: [{ title: 'CSA Cloud Controls Matrix', url: 'https://cloudsecurityalliance.org/research/cloud-controls-matrix' }] });

  NSA.data.lessons = NSA.data.lessons.concat(L);
})(typeof globalThis !== 'undefined' ? globalThis : window);
