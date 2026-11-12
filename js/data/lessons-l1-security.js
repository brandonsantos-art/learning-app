/* NetSec Academy – Level 1 Cybersecurity lessons */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.lessons = NSA.data.lessons || [];
  const L = [];

  L.push({
    id: 'l1-sec-01-intro', level: 1, track: 'security', order: 1, title: 'Introduction to Cybersecurity', summary: 'What security teams protect, who attacks and why, and the vocabulary of risk.', minutes: 20, skills: { security: 3 }, prereqs: [],
    objectives: ['Define assets, threats, vulnerabilities and risk', 'Describe the main attacker types and motivations', 'Explain defence in depth and least privilege', 'Describe the roles in a security team'],
    sections: [
      { type: 'text', title: 'The vocabulary of risk', md: `Security is the practice of protecting **assets** (data, systems, money, reputation) from **threats** (anything that can cause harm) that exploit **vulnerabilities** (weaknesses). **Risk** is the combination: how likely is the threat to exploit the vulnerability, and how bad would it be?

> Risk = Likelihood × Impact

A **control** reduces risk: a firewall, a patch, a policy, a backup, training. Controls are *preventive* (stop it), *detective* (notice it), or *corrective* (recover from it), and can be *technical*, *administrative* or *physical*.

| Term | Example |
| --- | --- |
| Asset | customer database, domain controller, the company's reputation |
| Threat | ransomware gang, careless employee, flood |
| Vulnerability | unpatched VPN appliance, password "Summer2024!", no backups |
| Exploit | the code or technique that uses a vulnerability |
| Risk | "likely that the VPN gets exploited within a year; impact: full network compromise" |

**Attack surface** is the sum of all points where an attacker can try to get in: exposed services, email inboxes, USB ports, suppliers, people.` },
      { type: 'text', title: 'Who attacks and why', md: `| Actor | Motivation | Typical methods |
| --- | --- | --- |
| Cybercriminals / ransomware gangs | money | phishing, exploiting exposed services, ransomware, business email compromise |
| Nation-state (APT) | espionage, sabotage | long-term stealthy intrusion, zero-days, supply chain |
| Hacktivists | ideology, attention | DDoS, defacement, leaks |
| Insiders | revenge, money, carelessness | data theft, misuse of access, mistakes |
| Script kiddies | curiosity, bragging | downloaded tools against easy targets |

Most incidents are **opportunistic**: automated scanners find an exposed RDP server or a user clicks a link. Being harder than the next target is already a strong defence.` },
      { type: 'check', question: { type: 'mcq', q: 'An unpatched web server is best described as a:', options: ['Threat', 'Vulnerability', 'Risk', 'Control'], answer: 1, explain: 'The missing patch is a weakness (vulnerability); the attacker is the threat; together they create risk.' } },
      { type: 'text', title: 'Core principles', md: `- **Defence in depth** – several independent layers (email filter + user training + endpoint protection + network segmentation + backups) so one failure is not fatal.
- **Least privilege** – users and systems get only the access they need. An intern should not be a domain admin; a web server should not reach the HR database.
- **Zero trust** – never trust by location; verify every request (Level 3).
- **Secure by default** – deny unless allowed; change default passwords; disable unused services.
- **Assume breach** – design detection and response as if attackers are already inside.

:::real Where you fit
Security roles: SOC analyst (monitoring and triage), incident responder, penetration tester (authorized attacker), security engineer (builds controls), GRC analyst (policies, audits, compliance), CISO (leadership). Network knowledge is the common foundation – which is why this course teaches both.
:::` },
      { type: 'check', question: { type: 'mcq', q: 'Giving an accountant access only to the finance share and not to engineering source code is an example of:', options: ['Defence in depth', 'Least privilege', 'Assume breach', 'Hashing'], answer: 1, explain: 'Least privilege limits access to what the job needs.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Risk is best described as:', options: ['Any weakness in a system', 'Likelihood of a threat exploiting a vulnerability combined with the impact', 'A malicious program', 'A firewall rule'], answer: 1, explain: 'Risk = likelihood × impact.', topic: 'risk' },
      { type: 'mcq', q: 'A security awareness training programme is which type of control?', options: ['Technical', 'Physical', 'Administrative', 'Corrective only'], answer: 2, explain: 'Policies and training are administrative controls.', topic: 'controls' },
      { type: 'mcq', q: 'Which attacker type is primarily motivated by financial gain?', options: ['Hacktivist', 'Nation-state APT', 'Cybercriminal', 'Researcher'], answer: 2, explain: 'Ransomware and fraud are money-driven.', topic: 'actors' },
      { type: 'tf', q: 'Defence in depth means relying on one very strong firewall.', answer: false, explain: 'It means multiple independent layers.', topic: 'principles' },
      { type: 'mcq', q: 'Backups that let you restore after ransomware are an example of which control type?', options: ['Preventive', 'Detective', 'Corrective', 'Deterrent'], answer: 2, explain: 'They correct/recover after an incident.', topic: 'controls' },
      { type: 'mcq', q: 'Which role monitors alerts and performs first-line triage in a security team?', options: ['CISO', 'SOC analyst', 'Penetration tester', 'GRC analyst'], answer: 1, explain: 'SOC analysts handle monitoring and triage.', topic: 'roles' }
    ] },
    practical: null, cert: ['secplus:1.0'], refs: [{ title: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework' }]
  });

  L.push({
    id: 'l1-sec-02-cia', level: 1, track: 'security', order: 2, title: 'The CIA Triad', summary: 'Confidentiality, Integrity and Availability: the lens for every security decision.', minutes: 15, skills: { security: 3 }, prereqs: ['l1-sec-01-intro'],
    objectives: ['Define confidentiality, integrity and availability with examples', 'Map common controls and attacks to each property', 'Explain non-repudiation and authenticity', 'Analyse a scenario using the triad'],
    sections: [
      { type: 'text', title: 'Three properties', md: `**Confidentiality** – only authorized people can read the data. *Controls:* encryption (TLS, disk encryption), access control lists, authentication, need-to-know. *Attacks:* eavesdropping, data theft, shoulder surfing, misconfigured cloud buckets.

**Integrity** – data and systems are accurate and unmodified. *Controls:* hashing and checksums, digital signatures, version control, change management, file integrity monitoring. *Attacks:* tampering, man-in-the-middle modification, unauthorized changes, malware altering files.

**Availability** – systems and data are there when needed. *Controls:* redundancy, backups, UPS, load balancing, DDoS protection, patching for stability. *Attacks:* DDoS, ransomware, hardware failure, accidental deletion, power loss.

Two companions often added: **Authenticity** (the data really comes from who it claims – certificates, signatures) and **Non-repudiation** (the sender cannot deny sending – logs plus signatures).` },
      { type: 'demo', title: 'Interactive: sort the scenarios', demo: 'cia-sorter', md: 'Drag or click each event into the property it violates.' },
      { type: 'text', title: 'Using the triad in practice', md: `Every control trades off against the others. Encrypting backups improves confidentiality but if you lose the key, availability is gone. A strict approval process protects integrity but slows recovery.

When you assess an incident or design a system, ask three questions:
1. Who could read this that should not? (C)
2. Could this be changed without detection? (I)
3. What happens if it goes down? (A)

:::real
Ransomware is primarily an **availability** attack (files encrypted), but modern gangs also steal data first (**confidentiality**) to extort twice. A planted backdoor changing login code is an **integrity** attack.
:::` },
      { type: 'check', question: { type: 'mcq', q: 'A DDoS attack takes a web shop offline for six hours. Which property is violated?', options: ['Confidentiality', 'Integrity', 'Availability', 'Non-repudiation'], answer: 2, explain: 'The service is unavailable; no data was read or changed.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Hashing a downloaded file and comparing it to the published checksum protects:', options: ['Confidentiality', 'Integrity', 'Availability', 'Anonymity'], answer: 1, explain: 'A matching hash proves the file was not altered.', topic: 'CIA' },
      { type: 'mcq', q: 'Encrypting a laptop\'s disk mainly protects:', options: ['Confidentiality', 'Integrity', 'Availability', 'Latency'], answer: 0, explain: 'A thief cannot read the data.', topic: 'CIA' },
      { type: 'mcq', q: 'A UPS and a redundant Internet link support:', options: ['Confidentiality', 'Integrity', 'Availability', 'Authentication'], answer: 2, explain: 'They keep systems running.', topic: 'CIA' },
      { type: 'mcq', q: 'Digital signatures provide integrity and:', options: ['Availability', 'Non-repudiation', 'Compression', 'Load balancing'], answer: 1, explain: 'A signature binds the message to the signer\'s private key.', topic: 'CIA' },
      { type: 'multi', q: 'Which are confidentiality controls? (Select all that apply)', options: ['TLS encryption', 'Access control lists', 'RAID disks', 'Need-to-know policy'], answer: [0, 1, 3], explain: 'RAID is an availability control.', topic: 'CIA' },
      { type: 'tf', q: 'An attacker changing prices in an online shop database is an integrity violation.', answer: true, explain: 'Data was altered without authorization.', topic: 'CIA' }
    ] },
    practical: null, cert: ['secplus:1.2', 'entrysec:principles'], refs: []
  });

  L.push({
    id: 'l1-sec-03-threats', level: 1, track: 'security', order: 3, title: 'Common Cybersecurity Threats', summary: 'The attacks you will actually see: from credential stuffing to DDoS, and how each is detected and prevented.', minutes: 25, skills: { security: 3 }, prereqs: ['l1-sec-02-cia'],
    objectives: ['Describe the most common attack categories and how they work', 'Match attacks to the CIA property they target', 'Identify the primary control for each attack', 'Recognize the stages of a typical intrusion'],
    sections: [
      { type: 'text', title: 'The threat landscape', md: `| Threat | How it works | Main defence |
| --- | --- | --- |
| **Phishing** | fake email/SMS/call tricks the user into entering credentials or opening malware | training, email filtering, MFA, reporting button |
| **Credential stuffing / password spraying** | reused or guessable passwords tried against logins | MFA, unique passwords, lockout, monitoring |
| **Malware / ransomware** | malicious code executes, encrypts or steals | endpoint protection, patching, least privilege, backups |
| **Exploitation of exposed services** | unpatched VPN, RDP, web apps attacked from the Internet | patching, reduce attack surface, firewall, scanning |
| **Man-in-the-middle** | attacker sits between two parties (rogue Wi-Fi, ARP spoofing) | encryption (TLS, VPN), certificate validation |
| **Denial of Service (DoS/DDoS)** | flood a service so legitimate users cannot reach it | DDoS protection services, rate limiting, redundancy |
| **SQL injection / web attacks** | malicious input manipulates the application or database | secure coding, input validation, WAF |
| **Insider threat** | authorized user abuses or leaks access | least privilege, logging, separation of duties |
| **Supply chain** | compromised vendor software or update | vendor assessment, code signing, monitoring |
| **Social engineering** | manipulation of people (pretexting, tailgating, baiting) | training, verification procedures |

:::real What actually gets companies breached
Industry reports consistently rank **stolen credentials, phishing and exploitation of Internet-facing vulnerabilities** as the top three initial access methods. Fix those three and you have removed most of the risk.
:::` },
      { type: 'text', title: 'Anatomy of an intrusion', md: `Most intrusions follow recognizable stages (the "kill chain" / MITRE ATT&CK tactics):

1. **Reconnaissance** – scanning, LinkedIn research, leaked passwords.
2. **Initial access** – phishing, exploited VPN, stolen credentials.
3. **Execution & persistence** – malware runs, creates scheduled tasks or accounts to survive reboots.
4. **Privilege escalation** – from user to admin.
5. **Lateral movement** – from one PC to servers using stolen credentials (RDP, SMB).
6. **Collection & exfiltration** – stage data, send it out (often over HTTPS to cloud storage).
7. **Impact** – ransomware deployment, destruction, fraud.

Every stage leaves traces in logs. The defender's job is to detect as early as possible: an alert at stage 2 costs hours; at stage 7 it costs millions.` },
      { type: 'check', question: { type: 'mcq', q: 'An attacker uses credentials stolen from one PC to log into the file server via SMB. Which stage is this?', options: ['Reconnaissance', 'Initial access', 'Lateral movement', 'Impact'], answer: 2, explain: 'Moving between internal systems is lateral movement.' } },
      { type: 'text', title: 'Denial of service in detail', md: `A **DoS** attack exhausts a resource: bandwidth (volumetric floods), connection tables (SYN floods), or application capacity (expensive requests). **DDoS** uses thousands of compromised devices (a **botnet**, often IoT cameras and routers) so blocking one source is useless. **Amplification** attacks abuse UDP services (DNS, NTP, memcached) that reply with far more data than they receive, spoofing the victim as the source.

Symptoms: service slow or down, link saturated, firewall CPU at 100%. Defences: upstream scrubbing services (Cloudflare, Akamai), anycast, rate limiting, disabling open resolvers so your servers cannot be used as amplifiers.` },
      { type: 'check', question: { type: 'match', q: 'Match the attack to the primary defence.', pairs: [['Credential stuffing', 'MFA'], ['Exposed unpatched VPN', 'Patching'], ['Ransomware', 'Offline backups'], ['Man-in-the-middle on Wi-Fi', 'TLS / VPN encryption']], explain: 'Each attack has a control that removes most of its impact.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which attack reuses passwords leaked from other websites?', options: ['Phishing', 'Credential stuffing', 'SQL injection', 'DDoS'], answer: 1, explain: 'Credential stuffing automates leaked username/password pairs.', topic: 'threats' },
      { type: 'mcq', q: 'What makes a DDoS attack hard to block compared to a DoS attack?', options: ['It uses encryption', 'Traffic comes from thousands of sources', 'It only targets DNS', 'It is slower'], answer: 1, explain: 'Distributed sources defeat simple IP blocking.', topic: 'DoS' },
      { type: 'mcq', q: 'Amplification attacks typically abuse which transport protocol?', options: ['TCP', 'UDP', 'ICMP only', 'SSH'], answer: 1, explain: 'UDP has no handshake, so the source can be spoofed.', topic: 'DoS' },
      { type: 'mcq', q: 'The stage where an attacker ensures malware survives a reboot is:', options: ['Reconnaissance', 'Persistence', 'Exfiltration', 'Initial access'], answer: 1, explain: 'Persistence mechanisms: scheduled tasks, services, registry run keys.', topic: 'kill chain' },
      { type: 'multi', q: 'Which are among the most common initial access methods? (Select all that apply)', options: ['Phishing', 'Stolen credentials', 'Exploiting exposed vulnerabilities', 'Breaking AES encryption'], answer: [0, 1, 2], explain: 'Nobody breaks AES; attackers use the easy doors.', topic: 'threats' },
      { type: 'tf', q: 'An insider threat always involves malicious intent.', answer: false, explain: 'Careless insiders (misdirected email, lost laptop) are also insider threats.', topic: 'threats' },
      { type: 'mcq', q: 'Which control most directly protects against man-in-the-middle attacks on public Wi-Fi?', options: ['Longer passwords', 'TLS/VPN encryption', 'Disabling Bluetooth', 'Antivirus'], answer: 1, explain: 'Encryption makes intercepted traffic unreadable.', topic: 'threats' }
    ] },
    practical: null, cert: ['secplus:2.0'], refs: [{ title: 'MITRE ATT&CK', url: 'https://attack.mitre.org/' }]
  });

  L.push({
    id: 'l1-sec-04-malware', level: 1, track: 'security', order: 4, title: 'Malware, Ransomware, Phishing and Social Engineering', summary: 'How malicious software and manipulation work, how to spot a phishing email, and what to do when you find one.', minutes: 30, skills: { security: 4 }, prereqs: ['l1-sec-03-threats'],
    objectives: ['Classify malware types by behaviour', 'Describe how a ransomware attack unfolds and how to prepare', 'Analyse an email for phishing indicators', 'Recognize social engineering techniques and respond correctly'],
    sections: [
      { type: 'text', title: 'Malware types', md: `| Type | Behaviour | Example |
| --- | --- | --- |
| **Virus** | attaches to files, needs a user to run it | macro viruses in Office documents |
| **Worm** | spreads itself over the network without user action | WannaCry (via SMB), Conficker |
| **Trojan** | pretends to be legitimate software | "Invoice.pdf.exe", cracked software |
| **Ransomware** | encrypts files and demands payment | LockBit, Ryuk |
| **Spyware / infostealer** | steals credentials, cookies, keystrokes | RedLine, keyloggers |
| **Rootkit** | hides deep in the OS to avoid detection | bootkits |
| **Botnet agent** | enrols the device in a remote-controlled army | Mirai (IoT) |
| **Adware / PUP** | unwanted ads and bundled software | browser toolbars |
| **Fileless malware** | lives in memory, uses PowerShell/WMI | many modern attacks |
| **Backdoor / RAT** | remote access for the attacker | Cobalt Strike beacons |

**Indicators** a technician notices: unknown processes, CPU spikes, new scheduled tasks, odd outbound connections (\`netstat -ano\`), disabled antivirus, files renamed with strange extensions, ransom notes.` },
      { type: 'text', title: 'Ransomware: how it unfolds', md: `1. **Entry** – phishing attachment, exposed RDP with a weak password, unpatched VPN.
2. **Foothold** – a remote access tool is installed; attackers wait days or weeks.
3. **Escalation and spread** – they steal admin credentials, move laterally, disable backups and security tools.
4. **Exfiltration** – sensitive data copied out for double extortion.
5. **Detonation** – at night or on a weekend, encryption runs on hundreds of machines at once.

**Preparation that works:** offline/immutable backups that are tested; MFA on every remote access; prompt patching; least privilege (no local admin for daily use); network segmentation; email filtering; EDR; an incident response plan with phone numbers printed on paper.

:::warn
"We have backups" is not enough – ransomware gangs delete online backups first. Ask: can we restore from a copy the attacker cannot reach, and have we practised it?
:::` },
      { type: 'text', title: 'Phishing anatomy', md: `Phishing works by **urgency**, **authority** and **familiarity**. Indicators:

- **Sender** – display name says "Microsoft" but the address is \`security@micros0ft-support.com\`; reply-to differs from from.
- **Links** – hover shows a different domain, look-alike letters (\`paypa1.com\`), URL shorteners, IP addresses, \`login.microsoft.com.evil.net\` (the *real* domain is the part before the first single slash, read from the right).
- **Urgency and threats** – "your account will be closed in 24 hours", "CEO needs gift cards now".
- **Unexpected attachments** – .zip, .iso, .html, Office files asking to *Enable content* (macros), double extensions.
- **Generic greeting, spelling errors, unusual requests** – changing bank details, bypassing procedures.
- **Spear phishing** uses real names and projects; **whaling** targets executives; **BEC** (business email compromise) impersonates a boss or supplier to redirect payments.

**What to do:** do not click; verify through a known channel (call the person); report with the phishing button; if you clicked, change the password immediately and tell IT – fast reporting is what limits damage, so never punish reporters.` },
      { type: 'demo', title: 'Interactive: inspect a suspicious email', demo: 'phishing-inspector', md: 'Hover the elements of a real-looking email and find the red flags.' },
      { type: 'check', question: { type: 'mcq', q: 'An email link shows https://accounts.google.com.verify-login.net/reset. Which domain will the browser actually open?', options: ['google.com', 'accounts.google.com', 'verify-login.net', 'reset'], answer: 2, explain: 'The registrable domain is the last two labels before the first slash: verify-login.net. Everything before it is a subdomain controlled by the attacker.' } },
      { type: 'text', title: 'Social engineering beyond email', md: `- **Pretexting** – a story to justify a request ("I'm from IT, I need your password to migrate your mailbox").
- **Vishing / smishing** – voice calls and SMS, often spoofing the caller ID.
- **Tailgating / piggybacking** – following someone through a secure door.
- **Baiting** – USB sticks in the car park labelled "salaries".
- **Quid pro quo** – help offered in exchange for access.
- **Watering hole** – compromising a site the targets visit.

Defences are procedural: verify identity before sharing anything, never give passwords to anyone (IT never asks), challenge strangers in secure areas, and report attempts so others are warned.` },
      { type: 'check', question: { type: 'tf', q: 'If IT support calls and asks for your password to fix your mailbox, you should give it because it is an internal request.', answer: false, explain: 'Legitimate IT staff never need your password. This is classic pretexting.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Malware that spreads across the network on its own, without user action, is a:', options: ['Virus', 'Worm', 'Trojan', 'Adware'], answer: 1, explain: 'Worms self-propagate (e.g. WannaCry via SMB).', topic: 'malware' },
      { type: 'mcq', q: 'A file named Invoice_2024.pdf.exe is most likely:', options: ['A PDF', 'A trojan using a double extension', 'A safe archive', 'A Windows update'], answer: 1, explain: 'The real extension is .exe; the .pdf is bait.', topic: 'malware' },
      { type: 'mcq', q: 'Why do ransomware gangs steal data before encrypting?', options: ['To speed up encryption', 'For double extortion: threaten to leak if not paid', 'To fix backups', 'To test the network'], answer: 1, explain: 'Double extortion increases pressure to pay.', topic: 'ransomware' },
      { type: 'multi', q: 'Which are phishing red flags? (Select all that apply)', options: ['Urgent threat of account closure', 'Link text and real URL differ', 'Email from a colleague you expect, about a known project', 'Request to change supplier bank details'], answer: [0, 1, 3], explain: 'An expected email about known work is not by itself a red flag.', topic: 'phishing' },
      { type: 'mcq', q: 'A USB stick labelled "Q4 bonuses" left in the lobby is an example of:', options: ['Baiting', 'Tailgating', 'Vishing', 'Whaling'], answer: 0, explain: 'Baiting uses curiosity/greed with a physical lure.', topic: 'social engineering' },
      { type: 'mcq', q: 'What is the single most important backup property against ransomware?', options: ['Stored on the same server', 'Offline or immutable and tested', 'Compressed', 'Encrypted with the server\'s key'], answer: 1, explain: 'If attackers can reach the backups, they will delete them.', topic: 'ransomware' },
      { type: 'mcq', q: 'A user clicked a phishing link and entered their password. The best immediate action is:', options: ['Say nothing to avoid trouble', 'Change the password and report to IT immediately', 'Delete the email', 'Reboot the PC'], answer: 1, explain: 'Speed limits damage; reporting lets IT look for other victims.', topic: 'phishing' },
      { type: 'mcq', q: 'Business Email Compromise (BEC) typically aims to:', options: ['Install a worm', 'Redirect payments by impersonating an executive or supplier', 'Crash the mail server', 'Steal Wi-Fi passwords'], answer: 1, explain: 'BEC is fraud through impersonation, often with no malware at all.', topic: 'phishing' }
    ] },
    practical: { type: 'security', id: 'sec-01-phishing', title: 'Classify a mailbox of suspicious emails' }, cert: ['secplus:2.2', 'entrysec:principles'], refs: [{ title: 'CISA: Avoiding Social Engineering and Phishing Attacks', url: 'https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks' }]
  });

  L.push({
    id: 'l1-sec-05-passwords', level: 1, track: 'security', order: 5, title: 'Password Security and Authentication', summary: 'How passwords are attacked and stored, what makes one strong, and how organizations should manage them.', minutes: 20, skills: { security: 3 }, prereqs: ['l1-sec-02-cia'],
    objectives: ['Explain brute force, dictionary, spraying and stuffing attacks', 'Describe hashing and salting of stored passwords', 'Evaluate password strength realistically', 'Apply modern password policy guidance (NIST SP 800-63B)'],
    sections: [
      { type: 'text', title: 'How passwords are attacked', md: `- **Brute force** – try every combination. Online it is slow and triggers lockouts; **offline** against a stolen hash database, a GPU rig tests billions of guesses per second.
- **Dictionary attack** – try common words and known leaked passwords with variations (Password1!, Summer2024).
- **Password spraying** – one common password against many accounts, staying under lockout thresholds.
- **Credential stuffing** – leaked email/password pairs replayed on other sites; works because people reuse passwords.
- **Phishing and keyloggers** – steal it directly; strength is irrelevant.

Length beats complexity: each extra character multiplies the search space. A 16-character passphrase of random words (\`correct-horse-battery-staple\` style) resists offline cracking far better than \`P@ssw0rd!\`, which every cracking dictionary contains.` },
      { type: 'demo', title: 'Interactive: how strong is it?', demo: 'password-strength', md: 'Type candidate passwords (not your real ones) to see estimated entropy, crack time and the patterns that weaken them.' },
      { type: 'text', title: 'How passwords should be stored', md: `Systems must **never store plaintext passwords**. They store a **hash** – a one-way fingerprint. At login the entered password is hashed and compared.

- **Salt** – a random value per user mixed into the hash, so identical passwords produce different hashes and precomputed tables (rainbow tables) are useless.
- **Slow hashing** – bcrypt, scrypt, Argon2 or PBKDF2 are deliberately slow (milliseconds per guess) to make offline cracking expensive. MD5/SHA-1 for passwords is a critical finding.
- **Breach impact** – when a database leaks, well-hashed unique passwords buy time; plaintext or fast hashes mean every account is compromised within hours.

Linux stores hashes in \`/etc/shadow\` (readable only by root); Windows in the SAM database and in Active Directory (NTLM hashes – fast and crackable, which is why Windows domains need long passwords and MFA).` },
      { type: 'check', question: { type: 'mcq', q: 'Why is a salt added before hashing a password?', options: ['To make the password longer for the user', 'So identical passwords get different hashes and precomputed tables fail', 'To encrypt the database', 'To speed up login'], answer: 1, explain: 'Salting defeats rainbow tables and hides duplicate passwords.' } },
      { type: 'text', title: 'Modern password policy', md: `NIST SP 800-63B (adopted by most organizations) changed the rules:

| Old practice | Modern guidance |
| --- | --- |
| force change every 90 days | change only on evidence of compromise (forced rotation produces Summer2024 → Autumn2024) |
| complexity rules (upper/lower/digit/symbol) | minimum **length** (≥ 12–15), allow long passphrases, no composition rules |
| secret questions | block **known-breached passwords** (check against leak lists) |
| lockout after 3 tries | rate limiting and monitoring; MFA everywhere |
| memorize everything | **password managers** generating unique random passwords per site |

Rules for users: unique password per account, a password manager, MFA wherever offered, never share or email a password, and treat any "verify your password" request as phishing.

For administrators: separate admin accounts from daily accounts, no shared accounts, audit default credentials on every device (printers, cameras, switches), and log authentication failures centrally.` },
      { type: 'check', question: { type: 'tf', q: 'Forcing users to change passwords every 60 days is current best practice.', answer: false, explain: 'NIST recommends changing only on compromise; forced rotation leads to predictable patterns.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Trying "Welcome2024!" against every account in the company is called:', options: ['Brute force', 'Password spraying', 'Credential stuffing', 'Salting'], answer: 1, explain: 'One password, many accounts, below lockout thresholds.', topic: 'attacks' },
      { type: 'mcq', q: 'Which property matters most for resisting offline cracking?', options: ['Using a symbol', 'Length', 'Starting with a capital letter', 'Changing it monthly'], answer: 1, explain: 'Each character multiplies the search space.', topic: 'strength' },
      { type: 'mcq', q: 'Which hashing algorithm is appropriate for storing passwords?', options: ['MD5', 'SHA-1', 'bcrypt / Argon2', 'Base64'], answer: 2, explain: 'Slow, salted algorithms; Base64 is not even a hash.', topic: 'storage' },
      { type: 'mcq', q: 'Credential stuffing succeeds mainly because:', options: ['Passwords are too long', 'People reuse passwords across sites', 'MFA is enabled', 'Sites use HTTPS'], answer: 1, explain: 'Leaked pairs are replayed elsewhere.', topic: 'attacks' },
      { type: 'tf', q: 'A system should be able to email you your forgotten password.', answer: false, explain: 'That would mean it stores plaintext; proper systems can only reset it.', topic: 'storage' },
      { type: 'mcq', q: 'Which file holds password hashes on Linux?', options: ['/etc/passwd', '/etc/shadow', '/etc/hosts', '/var/log/auth.log'], answer: 1, explain: '/etc/shadow, readable only by root.', topic: 'storage' },
      { type: 'mcq', q: 'The best tool for having a unique strong password on every site is:', options: ['A sticky note', 'One password with site name appended', 'A password manager', 'Secret questions'], answer: 2, explain: 'Managers generate and store random unique passwords.', topic: 'policy' }
    ] },
    practical: { type: 'security', id: 'sec-02-password', title: 'Evaluate password strength and fix a weak policy' }, cert: ['secplus:4.6', 'ccna:5.0'], refs: [{ title: 'NIST SP 800-63B Digital Identity Guidelines', url: 'https://pages.nist.gov/800-63-3/sp800-63b.html' }]
  });

  L.push({
    id: 'l1-sec-06-mfa', level: 1, track: 'security', order: 6, title: 'Multi-Factor Authentication', summary: 'Factor types, MFA methods from SMS to passkeys, how attackers bypass weak MFA, and where to deploy it first.', minutes: 15, skills: { security: 3 }, prereqs: ['l1-sec-05-passwords'],
    objectives: ['Name the authentication factor categories', 'Compare MFA methods by security and usability', 'Explain MFA fatigue, SIM swapping and phishing-resistant MFA', 'Prioritize MFA deployment in an organization'],
    sections: [
      { type: 'text', title: 'Factors', md: `Authentication proves an identity claim using one or more **factors**:

1. **Something you know** – password, PIN.
2. **Something you have** – phone with an authenticator app, hardware key, smart card.
3. **Something you are** – fingerprint, face, iris.

Plus contextual attributes: *somewhere you are* (location), *something you do* (typing pattern). **Multi-factor** means two *different* categories – a password plus a PIN is still one factor.

Why it matters: with MFA, a stolen or guessed password alone is useless. Microsoft reports MFA blocks over 99% of automated account-compromise attacks.` },
      { type: 'text', title: 'Methods, weakest to strongest', md: `| Method | How | Weakness |
| --- | --- | --- |
| SMS / voice code | code texted to the phone | SIM swapping, SS7 interception, phishing of the code |
| Email code | code sent to mailbox | the mailbox is often what is being attacked |
| TOTP app (Google/Microsoft Authenticator) | 6-digit code every 30 s from a shared seed | real-time phishing proxies can relay the code |
| Push notification | approve on phone | **MFA fatigue**: attacker spams prompts until the user taps approve; number matching mitigates |
| Hardware key / FIDO2 passkey (YubiKey, Windows Hello, platform passkeys) | public-key challenge bound to the site's origin | **phishing-resistant** – a fake site cannot obtain a valid response |
| Smart card / certificate | PKI-based | deployment complexity |

Rule: any MFA is better than none; move privileged accounts and remote access to **phishing-resistant** methods first.` },
      { type: 'check', question: { type: 'mcq', q: 'A user receives twenty push notifications at 2 a.m. and finally taps "Approve". This attack is called:', options: ['SIM swapping', 'MFA fatigue (push bombing)', 'Credential stuffing', 'Tailgating'], answer: 1, explain: 'Push bombing abuses approval fatigue; number matching and rate limits counter it.' } },
      { type: 'text', title: 'Deploying MFA', md: `Priority order for an organization:
1. **Administrators and privileged accounts** (domain admins, cloud root/global admin).
2. **Remote access** – VPN, RDP gateways, email/webmail, SaaS logins.
3. **Everyone else**, starting with finance and HR (BEC targets).

Practical notes: register at least two methods per user (lost phone), keep recovery codes offline, exclude nothing permanently ("service accounts" need a different control, not an exemption), and monitor for MFA registrations from new locations – attackers add their own device after a successful phish.` },
      { type: 'check', question: { type: 'mcq', q: 'Which MFA method is considered phishing-resistant?', options: ['SMS code', 'TOTP app', 'FIDO2 hardware key / passkey', 'Email link'], answer: 2, explain: 'FIDO2 responses are bound to the legitimate site origin, so a proxy site cannot replay them.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'A password plus a 4-digit PIN is:', options: ['Two-factor', 'Single-factor (both are "something you know")', 'Biometric', 'Phishing-resistant'], answer: 1, explain: 'MFA needs different categories.', topic: 'MFA' },
      { type: 'mcq', q: 'SIM swapping defeats which MFA method?', options: ['Hardware keys', 'SMS codes', 'Smart cards', 'Passkeys'], answer: 1, explain: 'The attacker ports the victim\'s number to their own SIM.', topic: 'MFA' },
      { type: 'mcq', q: 'Which accounts should get MFA first?', options: ['Interns', 'Privileged/admin accounts and remote access', 'Printers', 'Guest Wi-Fi users'], answer: 1, explain: 'Highest impact if compromised.', topic: 'MFA' },
      { type: 'tf', q: 'TOTP authenticator codes cannot be phished.', answer: false, explain: 'Real-time phishing proxies relay the code within its 30-second window.', topic: 'MFA' },
      { type: 'mcq', q: 'Number matching in push MFA is designed to stop:', options: ['SIM swapping', 'MFA fatigue', 'Keyloggers', 'Rainbow tables'], answer: 1, explain: 'The user must type the number shown on the login screen, so blind approvals fail.', topic: 'MFA' },
      { type: 'mcq', q: 'A fingerprint is which factor type?', options: ['Something you know', 'Something you have', 'Something you are', 'Somewhere you are'], answer: 2, explain: 'Biometrics = inherence.', topic: 'MFA' }
    ] },
    practical: null, cert: ['secplus:1.2', 'secplus:4.6'], refs: [{ title: 'CISA: Phishing-Resistant MFA', url: 'https://www.cisa.gov/mfa' }]
  });

  L.push({
    id: 'l1-sec-07-firewalls-av', level: 1, track: 'security', order: 7, title: 'Firewalls and Antivirus', summary: 'How firewall rules are written and evaluated, host vs network firewalls, and how modern endpoint protection detects malware.', minutes: 25, skills: { security: 3, netadmin: 1 }, prereqs: ['l1-net-13-ports', 'l1-sec-03-threats'],
    objectives: ['Write and read firewall rules (source, destination, port, action)', 'Explain rule order, implicit deny and stateful inspection', 'Distinguish host firewalls from network firewalls and NGFWs', 'Describe how antivirus/EDR detects threats and its limits'],
    sections: [
      { type: 'text', title: 'Firewall rules', md: `A firewall rule says: *traffic matching these conditions is allowed or denied*. Conditions: source address, destination address, protocol, destination port, sometimes direction, zone, application or user.

Rules are evaluated **top to bottom**; the **first match wins**; if nothing matches, the **implicit deny** at the end drops the packet. Order therefore matters:

\`\`\`
1  allow  LAN  →  any     tcp 443   (web)
2  allow  LAN  →  DNS-SRV udp 53    (dns)
3  deny   LAN  →  any     tcp 23    (telnet)
4  allow  any  →  DMZ-WEB tcp 80,443
   implicit deny
\`\`\`
Put specific denies **above** broad allows. A classic mistake is an "allow any any" rule placed early "temporarily" – it stays for years.

**Stateful inspection** tracks sessions: when the LAN opens a connection to a web server, the reply packets are allowed automatically without an inbound rule. Inbound rules are only needed for connections *initiated from outside* (e.g. Internet → DMZ web server).` },
      { type: 'demo', title: 'Interactive: evaluate traffic against a rule set', demo: 'firewall-rule-sim', md: 'Reorder rules and test packets to see which rule matches and why.' },
      { type: 'text', title: 'Types of firewalls', md: `- **Host firewall** – Windows Defender Firewall, Linux ufw/iptables/nftables, macOS. Protects one machine; blocks inbound by default on Windows; essential against lateral movement (an attacker on one PC should not reach SMB/RDP on every other PC).
- **Network firewall / router ACLs** – at the perimeter and between internal zones. Stateless ACLs on routers for simple filtering; stateful firewalls for policy.
- **Next-generation firewall (NGFW)** – identifies applications regardless of port, inspects TLS, blocks known-bad URLs, includes IPS signatures.
- **Web application firewall (WAF)** – understands HTTP; blocks SQL injection and XSS patterns in front of web apps.
- **Cloud security groups** – stateful per-instance firewalls in AWS/Azure/GCP.

Best practice: default deny inbound everywhere; outbound restricted at least for servers (a web server has no reason to connect to arbitrary Internet hosts – that is how data exfiltration and command-and-control are caught).` },
      { type: 'check', question: { type: 'mcq', q: 'A rule set has "allow any any" as rule 1 and "deny tcp 23" as rule 2. What happens to Telnet traffic?', options: ['Denied by rule 2', 'Allowed by rule 1 – rule 2 is never reached', 'Dropped by implicit deny', 'Logged only'], answer: 1, explain: 'First match wins; the broad allow shadows the deny.' } },
      { type: 'text', title: 'Antivirus and EDR', md: `Traditional **antivirus** matches files against **signatures** (hashes and patterns of known malware) and uses **heuristics** for suspicious structure. Limits: new or modified malware (polymorphic, packed) evades signatures; fileless attacks never write a file.

**EDR** (Endpoint Detection and Response) watches **behaviour**: a Word process spawning PowerShell that downloads an executable, mass file renames (ransomware), credential dumping from LSASS. It records process trees and network connections so analysts can investigate and isolate the host remotely. **XDR** correlates endpoint, email, identity and network telemetry.

Operational rules: keep definitions and agents updated, never let users disable protection, send alerts to a central console, and treat "antivirus cleaned a trojan" as the *start* of an investigation (how did it get there, and what else happened?).` },
      { type: 'check', question: { type: 'mcq', q: 'Which detection approach catches a never-before-seen ransomware variant encrypting files?', options: ['Signature matching only', 'Behavioural detection (EDR)', 'Port blocking', 'DNS filtering'], answer: 1, explain: 'Behaviour (mass encryption, shadow copy deletion) is recognizable even when the file is new.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'What happens to traffic that matches no firewall rule?', options: ['It is allowed', 'It is dropped by the implicit deny', 'It is logged and allowed', 'It is sent to the DMZ'], answer: 1, explain: 'Default deny.', topic: 'firewalls' },
      { type: 'mcq', q: 'A stateful firewall allows replies to an outbound web session because:', options: ['Port 443 is always open inbound', 'It tracks the connection state table', 'Replies use ICMP', 'The client is on Wi-Fi'], answer: 1, explain: 'Return traffic is matched to an existing session.', topic: 'firewalls' },
      { type: 'mcq', q: 'Which firewall understands HTTP and blocks SQL injection patterns?', options: ['Router ACL', 'WAF', 'Host firewall', 'Switch ACL'], answer: 1, explain: 'A Web Application Firewall inspects application-layer requests.', topic: 'firewalls' },
      { type: 'mcq', q: 'Why restrict outbound traffic from servers?', options: ['To save bandwidth', 'To catch data exfiltration and command-and-control connections', 'Servers cannot use DNS', 'To speed up backups'], answer: 1, explain: 'Servers rarely need arbitrary Internet access; unexpected outbound traffic is a strong indicator.', topic: 'firewalls' },
      { type: 'mcq', q: 'Signature-based antivirus is weakest against:', options: ['Old known worms', 'New or modified (polymorphic) malware', 'Macro viruses from 2003', 'Known trojans'], answer: 1, explain: 'No signature exists yet.', topic: 'antivirus' },
      { type: 'tf', q: 'Host firewalls are unnecessary when a network firewall is present.', answer: false, explain: 'Host firewalls stop lateral movement inside the network.', topic: 'firewalls' },
      { type: 'mcq', q: 'In a rule list, specific deny rules should be placed:', options: ['After broad allow rules', 'Before broad allow rules', 'Anywhere – order is irrelevant', 'Only at the very end'], answer: 1, explain: 'First match wins, so exceptions go first.', topic: 'firewalls' }
    ] },
    practical: { type: 'security', id: 'sec-03-firewall', title: 'Build a firewall policy for a small office' }, cert: ['secplus:3.2', 'netplus:4.1'], refs: []
  });

  L.push({
    id: 'l1-sec-08-best-practices', level: 1, track: 'security', order: 8, title: 'Basic Security Best Practices', summary: 'The hygiene that prevents most incidents: patching, backups, least privilege, hardening, logging and awareness.', minutes: 20, skills: { security: 3, windows: 1, linux: 1 }, prereqs: ['l1-sec-07-firewalls-av'],
    objectives: ['List the essential security controls for any organization', 'Explain the 3-2-1 backup rule', 'Describe basic hardening of a workstation or server', 'Explain why logging and monitoring are controls'],
    sections: [
      { type: 'text', title: 'The essential eight-ish', md: `Frameworks (CIS Controls, ASD Essential Eight, NIST CSF) agree on a short list that stops the majority of attacks:

1. **Inventory** – know every device, account and application. You cannot protect what you do not know exists.
2. **Patch promptly** – operating systems *and* applications and firmware; Internet-facing systems within days.
3. **MFA** on all remote access and admin accounts.
4. **Least privilege** – no local admin for daily work; separate admin accounts; review access regularly.
5. **Backups** – 3-2-1 rule, with one copy offline/immutable, tested restores.
6. **Endpoint protection** – EDR/antivirus, host firewall on.
7. **Email and web filtering** – block malicious attachments and domains.
8. **Harden configurations** – disable unused services and macros, change defaults, application allow-listing where possible.
9. **Log and monitor** – central logs, alerts for failed logins, new admin accounts, disabled security tools.
10. **Train people** and give them an easy way to report.

:::tip The 3-2-1 backup rule
**3** copies of your data, on **2** different media, **1** off-site (and offline or immutable). Test restores quarterly; an untested backup is a hope, not a control.
:::` },
      { type: 'text', title: 'Hardening a system', md: `**Workstation (Windows)**
- Users are *not* local administrators; UAC enabled.
- Windows Update automatic; BitLocker disk encryption; Defender + firewall on.
- Office macros from the Internet blocked; screen lock after 10 minutes.
- Remove unused software; no shared accounts.

**Server (Linux)**
- SSH: key-based authentication, \`PermitRootLogin no\`, \`PasswordAuthentication no\`, fail2ban.
- Firewall (ufw/nftables) allowing only required ports; services bound to localhost where possible.
- Automatic security updates; minimal packages; separate service accounts with no shell.
- Correct file permissions (config files 640, no world-writable directories outside /tmp).

**Network devices**
- Change default credentials; disable Telnet/HTTP management; management only from the admin VLAN; SNMPv3; firmware updated; configuration backups.

You will apply several of these in the terminal labs (sshd_config, ufw, permissions).` },
      { type: 'check', question: { type: 'mcq', q: 'Which backup arrangement follows the 3-2-1 rule?', options: ['Three copies on the same NAS', 'Production disk + NAS copy + off-site immutable cloud copy', 'Two USB drives in the server room', 'A RAID mirror'], answer: 1, explain: 'Three copies, two media, one off-site. RAID is not a backup.' } },
      { type: 'text', title: 'Logging as a control', md: `Logs turn an invisible intrusion into a detectable one. Minimum useful sources: authentication (Windows Security log 4624/4625, Linux auth.log), firewall denies, DNS queries, VPN logins, EDR alerts, and admin actions on servers and cloud consoles.

Send them to a central place (syslog server or SIEM) so an attacker who wipes a host cannot erase the evidence, keep them at least 90 days, and set a handful of high-value alerts: many failed logins then a success, logins from new countries, new privileged accounts, security tools disabled, large outbound transfers.

Without logs, incident response is guesswork; with logs, you can answer *what happened, when, and how far did it spread*.` },
      { type: 'check', question: { type: 'tf', q: 'Logs should be kept only on the device that generates them to save storage.', answer: false, explain: 'Centralize logs so attackers cannot erase evidence on a compromised host.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which control directly prevents an employee from installing a trojan with admin rights?', options: ['Logging', 'Removing local administrator rights (least privilege)', 'Longer passwords', 'Off-site backups'], answer: 1, explain: 'Without admin rights, many malware installs fail or are contained.', topic: 'hygiene' },
      { type: 'mcq', q: 'RAID mirroring is:', options: ['A full backup strategy', 'Availability protection against disk failure, not a backup', 'Encryption', 'An offline copy'], answer: 1, explain: 'Deleted or encrypted files are mirrored instantly.', topic: 'backups' },
      { type: 'multi', q: 'Which are good SSH hardening steps? (Select all that apply)', options: ['PermitRootLogin no', 'Key-based authentication', 'Enabling Telnet as a fallback', 'fail2ban or rate limiting'], answer: [0, 1, 3], explain: 'Telnet is never a fallback.', topic: 'hardening' },
      { type: 'mcq', q: 'Why should Internet-facing systems be patched within days rather than months?', options: ['Patches expire', 'Exploits for public vulnerabilities appear within days and scanners find exposed systems quickly', 'Vendors require it', 'To improve Wi-Fi'], answer: 1, explain: 'Exposed systems are scanned constantly.', topic: 'patching' },
      { type: 'mcq', q: 'The first step in any security programme is:', options: ['Buying an NGFW', 'Knowing your assets (inventory)', 'Hiring a pentester', 'Writing a password policy'], answer: 1, explain: 'You cannot protect unknown systems.', topic: 'hygiene' },
      { type: 'mcq', q: 'Which log event sequence deserves an alert?', options: ['A user logs in at 9 a.m.', 'Hundreds of failed logins followed by a successful one', 'A printer renews its DHCP lease', 'Windows Update completes'], answer: 1, explain: 'Classic brute force success pattern.', topic: 'logging' }
    ] },
    practical: { type: 'terminal', id: 'term-16-hardening', title: 'Harden a Linux server: SSH, firewall and permissions' }, cert: ['secplus:4.1', 'entrysec:principles'], refs: [{ title: 'CIS Critical Security Controls', url: 'https://www.cisecurity.org/controls' }]
  });

  L.push({
    id: 'l1-sec-09-ethical-hacking', level: 1, track: 'security', order: 9, title: 'Introduction to Ethical Hacking', summary: 'What penetration testers do, the rules that make hacking legal, the methodology, and your first reconnaissance.', minutes: 20, skills: { hacking: 3, security: 1 }, prereqs: ['l1-sec-03-threats', 'l1-net-13-ports'],
    objectives: ['Distinguish ethical hacking from crime: authorization, scope, rules of engagement', 'Describe the penetration testing phases', 'Explain black/grey/white box and vulnerability scan vs pentest', 'Perform basic authorized reconnaissance with a port scanner in the lab'],
    sections: [
      { type: 'text', title: 'Legal first', md: `**Ethical hacking** is attacking systems *with written permission* to find weaknesses before criminals do. The permission is everything: without a signed **authorization** and **scope**, the same keystrokes are a crime in virtually every country (Computer Misuse Act, CFAA, etc.), even with good intentions.

Before any test:
- **Scope** – exactly which IPs, domains, applications; what is excluded.
- **Rules of engagement** – allowed techniques (no DoS, no social engineering unless agreed), testing windows, emergency contacts, how to handle discovered data.
- **Authorization** – signed by someone who owns the systems (not a random employee). Cloud providers and third parties may need separate approval.

In this course, every offensive exercise runs **only inside the simulator**. Never point scanners at networks you do not own or have authorization for – including your employer's, your school's or your ISP's.` },
      { type: 'text', title: 'Methodology', md: `A penetration test follows a repeatable method (PTES, OSSTMM, NIST SP 800-115):

1. **Planning and scoping** – goals, scope, rules.
2. **Reconnaissance** – passive (public records, DNS, leaked data, job postings) and active (ping sweeps, port scans with Nmap).
3. **Enumeration** – identify services, versions, users, shares.
4. **Vulnerability analysis** – map versions to known CVEs, test misconfigurations.
5. **Exploitation** – gain access (carefully, within rules).
6. **Post-exploitation** – privilege escalation, lateral movement, demonstrate impact without causing damage.
7. **Reporting** – the deliverable: findings with evidence, severity, and clear remediation. A test without a good report has no value.
8. **Remediation verification** – retest.

| Term | Meaning |
| --- | --- |
| Black box | tester has no inside knowledge |
| Grey box | some knowledge (user credentials, diagrams) |
| White box | full knowledge, source code, configs |
| Vulnerability scan | automated, broad, no exploitation (Nessus, OpenVAS) |
| Penetration test | manual, goal-oriented, exploits and chains findings |
| Red team | covert, adversary emulation against people, process and tech; blue team defends; purple = both together |
| Bug bounty | public programme paying for responsibly disclosed vulnerabilities within its scope |` },
      { type: 'check', question: { type: 'mcq', q: 'A friend asks you to "test" their company\'s website; they are a help-desk technician there. Should you proceed?', options: ['Yes, an employee asked', 'No – only the system owner can authorize, and it must be in writing with a defined scope', 'Yes, if you only scan ports', 'Yes, at night'], answer: 1, explain: 'Authorization must come from someone with authority over the asset, in writing.' } },
      { type: 'text', title: 'Your first reconnaissance', md: `**Nmap** is the standard scanner. In the lab:

\`\`\`
nmap -sn 192.168.1.0/24         ping sweep: which hosts are up?
nmap 192.168.1.2                scan the most common ports
nmap -sV -p 1-1000 192.168.1.2  identify service versions
nmap -p 22,80,443 -sV host      specific ports
\`\`\`
Port states: **open** (service answered), **closed** (RST – host reachable, nothing listening), **filtered** (no answer – firewall). Versions let you look up CVEs; an old OpenSSH or Apache banner is a lead, not proof – verify before reporting.

Scanning is noisy: IDS and firewalls log it. Real testers coordinate with the blue team or deliberately test whether the SOC notices.` },
      { type: 'check', question: { type: 'command', q: 'Type the Nmap command for a ping sweep of 10.0.0.0/24.', answer: ['^nmap\\s+-s[nP]\\s+10\\.0\\.0\\.0/24$', '^nmap\\s+10\\.0\\.0\\.0/24\\s+-s[nP]$'], display: 'nmap -sn 10.0.0.0/24', explain: '-sn disables port scanning and only discovers hosts.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'What makes hacking "ethical"?', options: ['Not causing damage', 'Written authorization with a defined scope and rules of engagement', 'Using only free tools', 'Reporting to the police afterwards'], answer: 1, explain: 'Permission from the asset owner is the legal basis.', topic: 'ethics' },
      { type: 'mcq', q: 'Which phase produces the deliverable that clients actually pay for?', options: ['Reconnaissance', 'Exploitation', 'Reporting', 'Scoping'], answer: 2, explain: 'Clear findings and remediation are the value.', topic: 'methodology' },
      { type: 'mcq', q: 'A tester is given user credentials and a network diagram. This is:', options: ['Black box', 'Grey box', 'White box', 'Red team'], answer: 1, explain: 'Partial knowledge = grey box.', topic: 'methodology' },
      { type: 'mcq', q: 'Nmap reports a port as "filtered". This means:', options: ['A service is listening', 'The host replied with RST', 'No response – likely a firewall dropping probes', 'The host is down'], answer: 2, explain: 'Filtered = probes dropped silently.', topic: 'recon' },
      { type: 'mcq', q: 'The main difference between a vulnerability scan and a penetration test is:', options: ['Scans are illegal', 'Pentests manually exploit and chain findings; scans are automated identification', 'Pentests never use tools', 'Scans take longer'], answer: 1, explain: 'A pentest demonstrates real impact.', topic: 'methodology' },
      { type: 'tf', q: 'Scanning your ISP\'s network to "help them" is acceptable ethical hacking.', answer: false, explain: 'No authorization = no ethical hacking.', topic: 'ethics' },
      { type: 'command', q: 'Type the Nmap option that detects service versions.', answer: ['^-sV$', '^nmap\\s+-sV.*$'], display: '-sV', explain: '-sV probes services for version banners.', topic: 'recon' }
    ] },
    practical: { type: 'terminal', id: 'term-11-nmap', title: 'Authorized reconnaissance in the lab network' }, cert: ['secplus:5.5', 'entrysec:operations'], refs: [{ title: 'Nmap Reference Guide', url: 'https://nmap.org/book/man.html' }, { title: 'PTES – Penetration Testing Execution Standard', url: 'http://www.pentest-standard.org/' }]
  });

  NSA.data.lessons = NSA.data.lessons.concat(L);
})(typeof globalThis !== 'undefined' ? globalThis : window);
