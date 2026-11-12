# NetSec Academy

An **offline, interactive training lab** for computer networking and cybersecurity. It runs entirely in a web browser with **no internet connection, no install, and no account** — all the simulations (network simulator, Windows/Linux/Cisco terminals, security labs) run locally in JavaScript.

It works on **PC, laptop, tablet and phone**, and can be installed as an app for fully offline use.

---

## How to open it

### Easiest (PC / laptop) — just open the file
Double-click **`index.html`**. It opens in your default browser and works offline immediately. That's it.

- On Windows you can also double-click **`Open NetSec Academy.bat`**.
- Everything is self-contained — no setup, no internet.

### Recommended (enables "install as app" + works best on mobile) — run the tiny local server
Opening via a local server unlocks the Progressive Web App features (offline install, home-screen icon). You need [Node.js](https://nodejs.org) (which you already have if you ran the tests).

```
node serve.js
```

Then open **http://localhost:8080** in any browser. Leave the window running while you use the app.

### On a phone or tablet
1. Run the local server on a PC on the **same Wi-Fi** (`node serve.js`), note the PC's IP (e.g. `192.168.1.50`).
2. On the phone, open `http://192.168.1.50:8080`.
3. Use the browser menu **"Add to Home Screen" / "Install app"**. It now runs offline like a native app.

> Alternatively, copy the whole folder to the device and open `index.html` directly — it still works offline, you just don't get the installable app icon.

---

## What's inside

**Three learning levels**, Beginner → Intermediate → Expert, each gated by a practical exam you must pass to unlock the next:

- **54 lessons** across Networking and Cybersecurity, every one with learning objectives, interactive demos, inline knowledge checks, a graded assessment that explains wrong answers, and (where relevant) a hands-on practical.
- **Interactive demos**: clickable OSI model, binary/subnet calculators, TCP handshake, DHCP DORA, firewall rule simulator, ARP man-in-the-middle, phishing inspector, and more.

**Working virtual labs** (not mock-ups):

- **Network Simulator** — drag devices onto a canvas, cable them, configure IP/VLANs/routing/NAT, run `ping`/`traceroute`, and watch packets move. A real engine simulates L2 switching, VLANs/trunks, ARP, IPv4 routing (longest-prefix match, static routes), NAT/PAT, ACLs, firewalls, DHCP and DNS.
- **Command-Line Terminal** — genuine command parsers for **Windows** (`ipconfig`, `ping`, `tracert`, `nslookup`, `netstat`, `arp`, `netsh`, PowerShell cmdlets), **Linux** (`ip`, `ping`, `dig`, `ss`, `curl`, `chmod`, `chown`, `grep`, `journalctl`, `nmap`, `ufw`, users/groups…), and **Cisco IOS** (full config modes, VLANs, ACLs, NAT, DHCP, `show` commands). Commands produce realistic output from live simulated state, not canned screenshots.
- **Cybersecurity labs** — phishing triage, log and packet-capture analysis, firewall policy design, authorized vulnerability assessment, web-app flaw review, SOC incident triage, forensic triage. All offensive exercises run only inside the simulator.
- **Troubleshooting labs** — realistic "it's broken, fix it" scenarios (no internet, APIPA, DNS down, VLAN mismatch, rogue DHCP…).

**6 Real-World Missions** that chain lessons, decisions and labs into a scored professional deliverable.

**Progression & study tools**: XP, levels, ranks, streaks, achievements, a skill tree, daily/weekly challenges, a subnet trainer, spaced-repetition flashcards, a glossary, certification objective maps (Network+, Security+, CCNA, Linux, entry-level security), professional documentation templates, and a career-readiness section.

Your progress is saved automatically in the browser. Use **Profile → Export progress** to back it up or move it to another device, and **Import** to restore it.

---

## Project structure

```
index.html              entry point (loads everything)
css/app.css             styles (dark technical theme, responsive)
vendor/vue.global.prod.js   Vue 3 runtime (vendored, offline)
js/core/                store, router, UI services, gamification, progression rules
js/engines/             framework-independent, unit-tested simulation engines
                          subnet, netsim, ios, terminal(-fs/-net/-win), quiz, srs
js/data/                all lessons, labs, missions, flashcards, glossary, resources
js/views/               Vue components for every screen
js/app.js               app root, navigation, routing, mount
manifest.webmanifest    PWA manifest        sw.js   service worker (offline cache)
icons/                  app icons
tests/                  Node test suites (see below)
serve.js                tiny static server for local/PWA use
```

## Tests

The simulation engines and all content are covered by Node test suites (no browser needed):

```
node tests/engines.test.js      # subnet + network simulation engine (34 tests)
node tests/terminal.test.js     # Windows/Linux terminals, Cisco IOS, quiz, SRS (18 tests)
node tests/views.test.js        # loads the whole app, compiles every template, checks data integrity
node tests/labs-solve.test.js   # applies the intended solution to every lab and confirms it completes
```

---

## Notes & honesty about scope

- This is an **educational simulation**. The network simulator, terminals and "Internet" are faithful models, not real systems — they are clearly presented as a lab. No real networks or third-party systems are ever contacted.
- Offensive-security topics are taught **defensively** and practised only against the built-in, isolated vulnerable targets. Nothing in this app scans or attacks real systems.
- Completing the certification tracks prepares you to **study for** the real exams; it does not grant any official certification.
