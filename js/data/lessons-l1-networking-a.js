/* NetSec Academy – Level 1 Networking lessons (part A: 1–7) */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.lessons = NSA.data.lessons || [];
  const L = [];

  L.push({
    id: 'l1-net-01-intro', level: 1, track: 'networking', order: 1, title: 'Introduction to Computer Networks', summary: 'What a network is, why it exists, and the vocabulary you will use every day.', minutes: 20, skills: { networking: 2 }, prereqs: [],
    objectives: ['Define a computer network and list what it needs to work', 'Distinguish clients, servers, hosts and network devices', 'Explain the difference between bandwidth and latency', 'Describe what happens when you open a web page, at a high level'],
    sections: [
      { type: 'text', title: 'What is a network?', md: `A **computer network** is two or more devices connected so they can exchange data. The devices are called **hosts** (or end devices): PCs, phones, servers, printers, cameras, thermostats. Between the hosts sit **network devices** – switches, routers, access points and firewalls – whose only job is to move data correctly and safely.

Every network, from a two-laptop file share to the Internet, needs the same four ingredients:

1. **A medium** – copper cable, fibre, or radio waves (Wi-Fi, 4G/5G).
2. **Addressing** – a way to name each device (MAC addresses, IP addresses).
3. **Rules (protocols)** – agreements about how data is packaged and acknowledged (Ethernet, IP, TCP, HTTP).
4. **Devices that forward** – switches inside a site, routers between sites.

:::real Where you will meet this
Every IT job starts with networks. Help desk: "I can't reach the file server." Sysadmin: "the backup over the WAN is slow." Security analyst: "why is this workstation talking to an unknown address at 3 a.m.?" All three questions are answered with the ideas in this course.
:::` },
      { type: 'text', title: 'Clients, servers and peers', md: `Most communication is **client–server**: a client asks, a server answers. Your browser (client) requests a page from a web server; Outlook (client) fetches mail from a mail server; your PC (DHCP client) asks a DHCP server for an IP address.

| Role | Typical examples | Key property |
| --- | --- | --- |
| Client | laptop, phone, browser, Outlook | starts the conversation |
| Server | web, mail, file, DNS, DHCP, database | waits for requests on a known port |
| Peer | BitTorrent, Windows "workgroup" file sharing | both sides can request and serve |

A "server" is a **role**, not a type of hardware. A Raspberry Pi running a web service is a server; a powerful rack machine used only for browsing is a client.

:::tip
When troubleshooting, always ask: *who is the client, who is the server, and which device sits between them?* That single question turns a vague complaint into a testable path.
:::` },
      { type: 'text', title: 'Speed: bandwidth vs latency', md: `Two different numbers describe "how fast" a network is:

- **Bandwidth** (throughput) – how much data per second can flow, e.g. 100 Mbps, 1 Gbps. Think *width of the pipe*.
- **Latency** – how long one packet takes to travel, measured in milliseconds with \`ping\`. Think *length of the pipe*. A satellite link can have huge bandwidth and terrible latency (600 ms).

Rules of thumb:
- LAN latency: under 1 ms. Same city: 5–20 ms. Across an ocean: 80–150 ms.
- Video calls suffer above ~150 ms; file copies care about bandwidth, not latency.
- **Packet loss** (dropped packets) hurts more than either: TCP must retransmit, and voice/video glitch.

:::warn Common mistake
Saying "the Internet is slow" without measuring. Run \`ping\` (latency and loss) and a speed test (bandwidth) – they point at different causes.
:::` },
      { type: 'check', question: { type: 'mcq', q: 'A help-desk ticket says video calls are choppy, but large downloads finish quickly. Which measurement is most likely the problem?', options: ['Bandwidth', 'Latency or packet loss', 'Disk space', 'Screen resolution'], answer: 1, explain: 'Downloads need bandwidth; real-time calls need low latency and no loss. Fast downloads with bad calls points at latency/loss (often Wi-Fi interference or an overloaded link).' } },
      { type: 'text', title: 'What happens when you open a web page', md: `Opening \`https://www.example.com\` triggers a chain you will learn to debug step by step:

1. **DNS** – your PC asks a DNS server "what is the IP address of www.example.com?" and gets back something like 93.184.216.34.
2. **Local or remote?** – the PC compares that address with its own subnet. It is remote, so the packet must go to the **default gateway** (your router).
3. **ARP** – the PC asks the LAN "who has the gateway's IP address?" to learn the router's MAC address.
4. **Switch** – the frame travels through the switch to the router.
5. **Routing** – the router (and dozens of Internet routers) forward the packet hop by hop using routing tables.
6. **TCP handshake** – PC and server agree to talk (SYN, SYN-ACK, ACK) on port 443.
7. **TLS** – they set up encryption; the server proves its identity with a certificate.
8. **HTTP** – the browser sends \`GET /\` and the server returns the page.

Each step is a layer of the OSI model, which you will meet in Lesson 3. When a web page fails, the fix is finding **which step** broke.` },
      { type: 'demo', title: 'Interactive: trace the chain', demo: 'encapsulation', md: 'Step through how a web request is wrapped layer by layer before it hits the wire.' },
      { type: 'check', question: { type: 'order', q: 'Put these steps in the order they happen when you open a website.', items: ['TCP three-way handshake', 'DNS lookup of the name', 'ARP for the default gateway', 'HTTP GET request'], answer: [1, 2, 0, 3], explain: 'Name first (DNS), then find the gateway\'s MAC (ARP), then establish TCP, then send HTTP.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which of these is NOT one of the four basic ingredients every network needs?', options: ['A transmission medium', 'Addressing', 'A graphical user interface', 'Protocols'], answer: 2, explain: 'Networks need a medium, addressing, protocols and forwarding devices. A GUI is irrelevant to the network itself.', topic: 'fundamentals' },
      { type: 'tf', q: 'A server is defined by the hardware it runs on, not by the role it plays.', answer: false, explain: 'Server is a role: any device that waits for and answers requests is acting as a server.', topic: 'roles' },
      { type: 'mcq', q: 'Which tool measures latency?', options: ['ping', 'ipconfig', 'a speed test website', 'arp -a'], answer: 0, explain: 'ping reports round-trip time in milliseconds (and packet loss). Speed tests measure bandwidth.', topic: 'performance' },
      { type: 'fill', q: 'The device a PC sends traffic to when the destination is outside its own subnet is called the default ______.', answer: ['gateway', 'default gateway'], explain: 'The default gateway is the router on the local subnet.', topic: 'fundamentals' },
      { type: 'mcq', q: 'Your PC needs the MAC address of the router before it can send a frame to it. Which protocol provides it?', options: ['DNS', 'DHCP', 'ARP', 'HTTP'], answer: 2, explain: 'ARP (Address Resolution Protocol) maps an IP address to a MAC address on the local network.', topic: 'fundamentals' },
      { type: 'multi', q: 'Which statements about bandwidth and latency are true? (Select all that apply)', options: ['Bandwidth is measured in bits per second', 'Latency is measured in milliseconds', 'A link can have high bandwidth and high latency at the same time', 'Latency only matters for file downloads'], answer: [0, 1, 2], explain: 'Satellite links are the classic high-bandwidth, high-latency example. Latency matters most for interactive traffic, not bulk downloads.', topic: 'performance' },
      { type: 'mcq', q: 'In the chain of events for loading a web page, which happens FIRST?', options: ['TLS handshake', 'HTTP GET', 'DNS resolution', 'TCP handshake'], answer: 2, explain: 'The client must know the server\'s IP address before anything else can happen.', topic: 'fundamentals' }
    ] },
    practical: { type: 'netsim', id: 'sim-01-first-lan', title: 'Build your first LAN in the simulator' },
    cert: ['netplus:1.1', 'ccna:1.1'], refs: [{ title: 'Cisco: What is a computer network?', url: 'https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/what-is-a-network.html' }]
  });

  L.push({
    id: 'l1-net-02-types', level: 1, track: 'networking', order: 2, title: 'LAN, WAN, MAN and PAN', summary: 'Network types by size and ownership, and why the distinction changes how you design and troubleshoot.', minutes: 15, skills: { networking: 2 }, prereqs: ['l1-net-01-intro'],
    objectives: ['Classify networks as PAN, LAN, MAN or WAN', 'Explain who owns and manages each type', 'Recognize typical technologies for each type', 'Identify LAN vs WAN problems from symptoms'],
    sections: [
      { type: 'text', title: 'Four sizes of network', md: `| Type | Scope | Who owns it | Typical technology | Example |
| --- | --- | --- | --- | --- |
| **PAN** – Personal Area Network | a few metres | you | Bluetooth, USB, NFC | headset ↔ phone, smartwatch |
| **LAN** – Local Area Network | a room, floor, building, campus | the organization | Ethernet switches, Wi-Fi | office network, home network |
| **MAN** – Metropolitan Area Network | a city | a carrier or large organization | fibre rings, Metro Ethernet | university with several campuses, city CCTV |
| **WAN** – Wide Area Network | countries, continents | carriers / ISPs | MPLS, leased lines, Internet VPNs, 5G | branch offices connected to HQ; the Internet |

Two more terms you will hear:
- **WLAN** – a LAN that uses Wi-Fi.
- **SAN** – Storage Area Network, a dedicated high-speed network between servers and storage arrays.` },
      { type: 'text', title: 'Why it matters: LAN vs WAN behaviour', md: `The distinction is not academic – it predicts speed, cost and who you call when something breaks.

**LAN characteristics**
- High bandwidth (1–10 Gbps), latency under 1 ms, almost no loss.
- You own and control every device; mistakes are yours to fix.
- Addressing uses private IP ranges (192.168.x.x, 10.x.x.x).

**WAN characteristics**
- Lower bandwidth, higher latency, costs money per month.
- Provided by a carrier; you control only your edge router. Problems need a ticket with the ISP.
- Traffic crosses the public Internet or a provider's MPLS cloud; encryption (VPN) becomes necessary.

:::real
A branch office complains that opening files on the HQ server takes minutes. Local files open instantly. That pattern (fast LAN, slow WAN) tells you to look at the WAN link utilization or latency, not the file server.
:::` },
      { type: 'check', question: { type: 'mcq', q: 'A hospital connects three buildings across a city with its own fibre. What type of network is this?', options: ['PAN', 'LAN', 'MAN', 'WAN'], answer: 2, explain: 'City-wide, single organization: a Metropolitan Area Network.' } },
      { type: 'text', title: 'Internet, intranet, extranet', md: `- **Internet** – the global public WAN of WANs; nobody owns it, everyone connects to it through an ISP.
- **Intranet** – a private network using Internet technologies (web, email) only for employees, e.g. \`intranet.corp.local\`.
- **Extranet** – a controlled extension of the intranet for partners or customers (supplier portal).

**Edge** is the term for where your network meets the ISP: the edge router and firewall. Most security controls live there, which is why "the edge" appears constantly in security discussions.` },
      { type: 'check', question: { type: 'match', q: 'Match each situation with the network type.', pairs: [['Smartwatch syncing with a phone', 'PAN'], ['Office floor with 40 PCs on a switch', 'LAN'], ['Branch office reaching HQ via an ISP', 'WAN']], explain: 'Scope decides: metres → PAN, building → LAN, across the carrier → WAN.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which network type is typically provided and managed by a telecom carrier?', options: ['PAN', 'LAN', 'WAN', 'WLAN'], answer: 2, explain: 'WAN links are leased from carriers or run over the Internet; you only control your edge.', topic: 'network types' },
      { type: 'mcq', q: 'Bluetooth headphones connected to a laptop form a:', options: ['LAN', 'PAN', 'MAN', 'SAN'], answer: 1, explain: 'A Personal Area Network spans a few metres around one person.', topic: 'network types' },
      { type: 'tf', q: 'A LAN usually has lower latency and higher bandwidth than a WAN.', answer: true, explain: 'LANs are local and owned by you; WAN links are slower, longer and paid per month.', topic: 'network types' },
      { type: 'mcq', q: 'Which term describes a private web portal for a company\'s suppliers?', options: ['Internet', 'Intranet', 'Extranet', 'Darknet'], answer: 2, explain: 'An extranet extends internal resources to selected outside parties.', topic: 'network types' },
      { type: 'mcq', q: 'Users at a branch office say the HQ file server is slow, but local printing and local files are fast. The most likely area to investigate is:', options: ['The branch switch', 'The WAN link between branch and HQ', 'The users\' keyboards', 'The branch Wi-Fi password'], answer: 1, explain: 'Fast local, slow remote = WAN link (bandwidth, latency, or saturation).', topic: 'troubleshooting' },
      { type: 'fill', q: 'A LAN built with Wi-Fi instead of cables is called a ______.', answer: ['WLAN', 'wireless LAN', 'wireless local area network'], explain: 'WLAN = Wireless Local Area Network.', topic: 'network types' }
    ] },
    practical: null, cert: ['netplus:1.6'], refs: []
  });

  L.push({
    id: 'l1-net-03-models', level: 1, track: 'networking', order: 3, title: 'The OSI Model and the TCP/IP Model', summary: 'The layered models that organize every protocol, every device and every troubleshooting conversation.', minutes: 30, skills: { networking: 4 }, prereqs: ['l1-net-01-intro'],
    objectives: ['Name the seven OSI layers and the four TCP/IP layers', 'Place protocols, devices and addresses on the correct layer', 'Describe encapsulation and the PDU at each layer', 'Use the layers as a troubleshooting checklist'],
    sections: [
      { type: 'text', title: 'Why models?', md: `Networking is complicated enough that engineers split it into **layers**, each with one job and a clear interface to the layer above and below. A web developer does not care how Wi-Fi modulates radio waves; a cable installer does not care about HTTP. Layers make that possible.

Two models matter:
- **OSI** (7 layers) – the reference model used for *teaching, exams and conversation* ("that's a layer 2 problem").
- **TCP/IP** (4 layers) – the model that *actually describes the Internet protocols*.` },
      { type: 'demo', title: 'Interactive: the seven layers', demo: 'osi-explorer', md: 'Click each layer to see its job, PDU, protocols and devices. Memorize the mnemonic **P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way.' },
      { type: 'text', title: 'Layer by layer', md: `| # | Layer | Job | PDU | Protocols / examples | Devices / addresses |
| --- | --- | --- | --- | --- | --- |
| 7 | Application | the service the user wants | data | HTTP, HTTPS, DNS, DHCP, SMTP, FTP, SSH | – |
| 6 | Presentation | format, encrypt, compress | data | TLS/SSL, JPEG, ASCII/UTF-8 | – |
| 5 | Session | open, manage, close dialogues | data | NetBIOS, RPC, SMB sessions | – |
| 4 | Transport | end-to-end delivery, ports | **segment** (TCP) / datagram (UDP) | TCP, UDP | port numbers, firewalls |
| 3 | Network | logical addressing, routing | **packet** | IPv4, IPv6, ICMP, OSPF | routers; IP addresses |
| 2 | Data Link | local delivery, framing, error check | **frame** | Ethernet, Wi-Fi (802.11), ARP, PPP | switches, NICs; MAC addresses |
| 1 | Physical | bits on the medium | **bits** | cables, fibre, radio, connectors, hubs | hubs, repeaters, cables |

Memory anchors: *Layer 2 = MAC = switch; Layer 3 = IP = router; Layer 4 = port = firewall rule.*` },
      { type: 'text', title: 'TCP/IP model', md: `The TCP/IP model collapses OSI 5-7 into one **Application** layer and OSI 1-2 into **Network Access** (also called Link):

| TCP/IP layer | OSI layers | Examples |
| --- | --- | --- |
| Application | 7, 6, 5 | HTTP, DNS, SMTP, SSH |
| Transport | 4 | TCP, UDP |
| Internet | 3 | IP, ICMP |
| Network Access / Link | 2, 1 | Ethernet, Wi-Fi, ARP |

Exams (Network+, CCNA) expect you to know both; real engineers mostly say "layer 2/3/4/7" from OSI while using TCP/IP protocols.` },
      { type: 'text', title: 'Encapsulation', md: `When data goes down the stack, each layer **adds a header** (encapsulation). On the receiving side each layer strips its header (de-encapsulation).

\`\`\`
Application data:  GET / HTTP/1.1
Transport:         [TCP header: src port 51234, dst port 80] + data        → segment
Network:           [IP header: src 192.168.1.10, dst 93.184.216.34] + segment → packet
Data Link:         [Ethernet header: src MAC, dst MAC] + packet + [FCS]     → frame
Physical:          0110100101... on the wire                                → bits
\`\`\`

Notice the addressing: **MAC addresses change at every router hop** (they only mean something on the local link), while **IP addresses stay the same end to end** (unless NAT rewrites them). This single fact explains ARP, routing and much of troubleshooting.` },
      { type: 'check', question: { type: 'mcq', q: 'Which PDU name belongs to Layer 3?', options: ['Frame', 'Segment', 'Packet', 'Bit'], answer: 2, explain: 'Packet = Layer 3 (IP). Frame = Layer 2, segment = Layer 4.' } },
      { type: 'text', title: 'The layers as a troubleshooting method', md: `Technicians work **bottom-up** (physical first) or **top-down** (application first). Bottom-up for a PC that cannot connect:

1. **Layer 1** – link light on? cable plugged in? Wi-Fi associated?
2. **Layer 2** – correct VLAN? MAC seen by the switch? (\`show mac address-table\`)
3. **Layer 3** – valid IP, mask and gateway? (\`ipconfig\`, \`ping gateway\`)
4. **Layer 4** – is the port reachable or blocked by a firewall? (\`Test-NetConnection host -Port 443\`)
5. **Layer 7** – does the application itself work? certificate errors? wrong URL?

:::tip
Layer 8 is the running joke: the user. "Did you type the password correctly?" is a legitimate first question.
:::` },
      { type: 'check', question: { type: 'match', q: 'Match the item to its OSI layer.', pairs: [['Switch', 'Layer 2'], ['Router', 'Layer 3'], ['TCP port 443', 'Layer 4'], ['Ethernet cable', 'Layer 1']], explain: 'Switches forward frames (L2), routers forward packets (L3), ports identify transport endpoints (L4), cables are physical (L1).' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'At which OSI layer does a router make its forwarding decision?', options: ['Layer 2', 'Layer 3', 'Layer 4', 'Layer 7'], answer: 1, explain: 'Routers read the destination IP address, which is a Layer 3 (Network) address.', topic: 'OSI' },
      { type: 'mcq', q: 'What is the PDU at the Data Link layer?', options: ['Packet', 'Segment', 'Frame', 'Datagram'], answer: 2, explain: 'Layer 2 PDU = frame (Ethernet frame with MAC addresses).', topic: 'OSI' },
      { type: 'order', q: 'Order the OSI layers from Layer 1 to Layer 4.', items: ['Transport', 'Physical', 'Network', 'Data Link'], answer: [1, 3, 2, 0], explain: 'Physical (1), Data Link (2), Network (3), Transport (4).', topic: 'OSI' },
      { type: 'mcq', q: 'Which TCP/IP layer corresponds to OSI layers 5, 6 and 7?', options: ['Internet', 'Transport', 'Application', 'Network Access'], answer: 2, explain: 'TCP/IP merges Session, Presentation and Application into one Application layer.', topic: 'TCP/IP model' },
      { type: 'tf', q: 'As a packet crosses several routers, the source and destination MAC addresses in the frame change at every hop.', answer: true, explain: 'MAC addresses are rewritten per link; IP addresses stay the same end to end (ignoring NAT).', topic: 'encapsulation' },
      { type: 'mcq', q: 'TLS encryption is usually associated with which OSI layer?', options: ['Layer 2', 'Layer 3', 'Layer 6', 'Layer 1'], answer: 2, explain: 'Presentation layer handles encryption and data formatting (exam convention).', topic: 'OSI' },
      { type: 'multi', q: 'Which items operate at Layer 2? (Select all that apply)', options: ['MAC address', 'Switch', 'IP address', 'ARP', 'TCP port'], answer: [0, 1, 3], explain: 'MAC addresses, switches and ARP are Layer 2. IP is Layer 3; ports are Layer 4.', topic: 'OSI' },
      { type: 'mcq', q: 'A user can ping the web server by IP address but the website shows a certificate error in the browser. At which layer is the problem?', options: ['Layer 1', 'Layer 3', 'Layer 6/7 (application side)', 'Layer 2'], answer: 2, explain: 'Connectivity (L1–L4) works; the issue is in TLS/the application.', topic: 'troubleshooting' }
    ] },
    practical: null, cert: ['netplus:1.1', 'ccna:1.5'], refs: [{ title: 'Cloudflare: What is the OSI model?', url: 'https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/' }]
  });

  L.push({
    id: 'l1-net-04-topologies', level: 1, track: 'networking', order: 4, title: 'Network Topologies', summary: 'Star, bus, ring, mesh and hybrid layouts; physical vs logical topology; how topology affects reliability.', minutes: 15, skills: { networking: 2 }, prereqs: ['l1-net-01-intro'],
    objectives: ['Describe the common topologies and their trade-offs', 'Distinguish physical from logical topology', 'Explain why modern LANs are star-based and WAN cores are mesh', 'Read a simple topology diagram'],
    sections: [
      { type: 'demo', title: 'Interactive: compare topologies', demo: 'topology-picker', md: 'Select a topology to see how it looks, what breaks when a link fails, and where it is used.' },
      { type: 'text', title: 'The classic topologies', md: `| Topology | How it works | Pros | Cons | Where |
| --- | --- | --- | --- | --- |
| **Star** | every device connects to a central switch | one cable failure affects one device; easy to add hosts | the centre is a single point of failure | almost every LAN |
| **Bus** | one shared cable, devices tap in | cheap | one break kills everything; collisions | legacy coax Ethernet |
| **Ring** | each device links to the next in a loop | predictable, no collisions | one break can stop the ring (unless dual ring) | FDDI, Token Ring, some metro fibre |
| **Mesh** | every node connects to many/all others | no single point of failure | expensive: n(n−1)/2 links for full mesh | WAN cores, data centres, the Internet |
| **Hybrid** | combinations (star-of-stars, partial mesh) | balance cost and resilience | more complex | enterprise campuses |

**Point-to-point** (two devices, one link) and **point-to-multipoint** (hub and spokes over a WAN) describe WAN connections.` },
      { type: 'text', title: 'Physical vs logical topology', md: `- **Physical topology** – where the cables actually go. Modern offices: star (wall ports → patch panel → switch).
- **Logical topology** – how data *flows*. Wi-Fi is physically a star (clients ↔ access point) but logically a shared bus: everyone hears everyone, and only one device transmits at a time per channel.

A **hierarchical** enterprise design stacks stars: access switches (star to PCs) → distribution switches → core. Redundant links between distribution and core form a partial mesh so that no single failure isolates a floor. You will design one in Level 3.

:::warn Common mistake
Adding a second link between two switches for "redundancy" without Spanning Tree Protocol creates a **loop**: broadcasts circulate forever and the network melts down in seconds (a broadcast storm). Switches run STP by default – never disable it blindly.
:::` },
      { type: 'check', question: { type: 'mcq', q: 'In a star topology, what happens if the central switch fails?', options: ['Only one device loses connectivity', 'All devices on that switch lose connectivity', 'Nothing – traffic reroutes automatically', 'Only wireless devices are affected'], answer: 1, explain: 'The switch is the single point of failure in a star; that is why core switches are deployed in redundant pairs.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which topology requires n(n−1)/2 links for n devices?', options: ['Star', 'Bus', 'Full mesh', 'Ring'], answer: 2, explain: 'A full mesh connects every pair of devices directly.', topic: 'topologies' },
      { type: 'mcq', q: 'The most common physical topology in today\'s offices is:', options: ['Bus', 'Ring', 'Star', 'Full mesh'], answer: 2, explain: 'Every device cables back to a switch.', topic: 'topologies' },
      { type: 'tf', q: 'Wi-Fi is physically a star but logically a shared medium.', answer: true, explain: 'Clients associate with an AP (star) but share the radio channel (bus-like).', topic: 'topologies' },
      { type: 'mcq', q: 'Why do WAN cores and data centres use mesh designs?', options: ['They are cheaper', 'They avoid single points of failure', 'They need fewer cables', 'They do not need routers'], answer: 1, explain: 'Multiple paths let traffic reroute around failures.', topic: 'topologies' },
      { type: 'mcq', q: 'Connecting two switches with two cables and no Spanning Tree Protocol will most likely cause:', options: ['Double bandwidth automatically', 'A broadcast storm / switching loop', 'IP address conflicts', 'Nothing unusual'], answer: 1, explain: 'Without STP, frames loop endlessly between the switches.', topic: 'switching' },
      { type: 'fill', q: 'A WAN design where several branch sites connect only to headquarters is called hub-and-______.', answer: ['spoke'], explain: 'Hub-and-spoke = point-to-multipoint star at WAN scale.', topic: 'topologies' }
    ] },
    practical: null, cert: ['netplus:1.6'], refs: []
  });

  L.push({
    id: 'l1-net-05-devices', level: 1, track: 'networking', order: 5, title: 'Network Devices: Router, Switch, Hub, Access Point, Firewall', summary: 'What each device does, which layer it works at, and how to pick the right one for a job.', minutes: 25, skills: { networking: 4 }, prereqs: ['l1-net-03-models'],
    objectives: ['Explain the function and OSI layer of hubs, switches, routers, access points and firewalls', 'Describe how a switch learns MAC addresses', 'Explain why a router is needed between subnets', 'Choose the right device for common scenarios'],
    sections: [
      { type: 'text', title: 'Hub vs switch (Layer 1 vs Layer 2)', md: `A **hub** is a dumb repeater: a bit arriving on one port is copied to **every** other port. All devices share one collision domain and one bandwidth pool. Hubs are obsolete, but understanding them explains why switches are better and why an attacker with a hub (or a mirrored port) sees everything.

A **switch** reads the **destination MAC address** of each frame and forwards it only to the port where that MAC lives. It learns by watching **source** MAC addresses:

1. Frame from PC1 (MAC A) arrives on port 1 → switch records *A → port 1*.
2. Destination MAC B unknown → switch **floods** the frame out all other ports (like a hub, once).
3. PC2 replies from port 5 → switch records *B → port 5*. From now on A↔B traffic is private between ports 1 and 5.

Broadcast frames (destination ff:ff:ff:ff:ff:ff) are always flooded – that is what "broadcast domain" means.

:::real
On a Cisco switch, \`show mac address-table\` shows exactly this learning table. You will use it to find which port a device is plugged into.
:::` },
      { type: 'text', title: 'Router (Layer 3)', md: `A **router** connects *different networks* (subnets). It reads the **destination IP address**, looks it up in its **routing table**, and forwards the packet out the right interface toward the next hop – decrementing the TTL on the way. Routers:

- separate broadcast domains (broadcasts never cross a router),
- connect your LAN to the Internet (the "edge" or "gateway" router),
- often also provide NAT, DHCP and basic firewalling in small offices.

A host only talks *directly* to devices in its own subnet; for anything else it sends the packet to its **default gateway**, which is a router interface in that subnet. If the gateway is wrong or missing, local traffic works and everything else fails – the most common beginner misconfiguration, and one you will fix in the labs.` },
      { type: 'text', title: 'Access point and firewall', md: `**Wireless access point (AP)** – a Layer 2 bridge between Wi-Fi clients and the wired LAN. It broadcasts an **SSID**, authenticates clients (WPA2/WPA3 passphrase or 802.1X) and forwards frames to the switch. A home "Wi-Fi router" is really a router + switch + AP + firewall in one box.

**Firewall** – inspects traffic and allows or blocks it according to rules (policies). Types:
- **Packet filter / stateless** – checks addresses and ports per packet (router ACLs).
- **Stateful** – tracks connections; replies to allowed outbound sessions are permitted automatically. Standard today.
- **Next-generation (NGFW)** – adds application awareness, intrusion prevention, URL filtering, TLS inspection.
- **Host firewall** – software on the PC (Windows Defender Firewall, ufw/iptables on Linux).

A firewall typically has **zones**: *inside* (trusted LAN), *outside* (Internet) and *DMZ* (public servers). Default policy: deny everything, then allow only what is needed.

| Device | Layer | Decides using | Separates |
| --- | --- | --- | --- |
| Hub | 1 | nothing (repeats) | nothing |
| Switch | 2 | MAC address | collision domains |
| Router | 3 | IP address | broadcast domains / networks |
| Firewall | 3–7 | addresses, ports, state, applications | security zones |
| Access point | 2 | MAC / SSID | wired ↔ wireless |` },
      { type: 'demo', title: 'Interactive: pick the right device', demo: 'device-matcher', md: 'For each requirement, choose the device that solves it.' },
      { type: 'check', question: { type: 'mcq', q: 'A switch receives a frame for a MAC address it has never seen. What does it do?', options: ['Drops the frame', 'Sends it to the router', 'Floods it out all ports except the one it arrived on', 'Asks the DNS server'], answer: 2, explain: 'Unknown unicast is flooded; the reply teaches the switch where the MAC lives.' } },
      { type: 'text', title: 'Other devices you will meet', md: `- **Layer 3 switch** – a switch that can also route between VLANs at wire speed; the workhorse of campus networks.
- **Modem / ONT** – converts the ISP medium (DSL, cable, fibre) to Ethernet; sits before your router.
- **Load balancer** – spreads client connections across several servers.
- **Proxy** – makes web requests on behalf of clients (filtering, caching).
- **IDS/IPS** – detects/blocks attacks by inspecting traffic patterns and signatures.
- **NIC** – the network interface card in every host; owns the MAC address.` }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which device forwards frames based on MAC addresses?', options: ['Hub', 'Switch', 'Router', 'Modem'], answer: 1, explain: 'Switches operate at Layer 2 using MAC addresses.', topic: 'devices' },
      { type: 'mcq', q: 'Which device is required for PCs in 192.168.1.0/24 to communicate with servers in 192.168.2.0/24?', options: ['A hub', 'A second switch', 'A router (or Layer 3 switch)', 'An access point'], answer: 2, explain: 'Different subnets require routing.', topic: 'devices' },
      { type: 'tf', q: 'A broadcast frame sent by a PC will be forwarded by a router to other subnets.', answer: false, explain: 'Routers stop broadcasts; that is why they define broadcast domains.', topic: 'devices' },
      { type: 'mcq', q: 'A switch learns MAC addresses by looking at the ______ address of incoming frames.', options: ['destination MAC', 'source MAC', 'destination IP', 'source IP'], answer: 1, explain: 'Learning is based on source MAC + ingress port.', topic: 'switching' },
      { type: 'mcq', q: 'Which firewall type tracks the state of connections so that return traffic is allowed automatically?', options: ['Stateless packet filter', 'Stateful firewall', 'Hub-based filter', 'DNS firewall'], answer: 1, explain: 'Stateful inspection keeps a connection table.', topic: 'firewalls' },
      { type: 'multi', q: 'A home "Wi-Fi router" usually combines which functions? (Select all that apply)', options: ['Router', 'Switch', 'Access point', 'Firewall/NAT', 'Mail server'], answer: [0, 1, 2, 3], explain: 'Consumer gateways integrate routing, switching, Wi-Fi and NAT/firewall.', topic: 'devices' },
      { type: 'mcq', q: 'Which device would you place public web servers behind, in a separate zone from the internal LAN?', options: ['A hub', 'A firewall with a DMZ', 'An access point', 'A modem'], answer: 1, explain: 'The DMZ is a firewall zone for public-facing servers.', topic: 'firewalls' }
    ] },
    practical: { type: 'netsim', id: 'sim-01-first-lan', title: 'Identify and connect devices in the simulator' }, cert: ['netplus:1.2', 'ccna:1.1'], refs: []
  });

  L.push({
    id: 'l1-net-06-ipv4', level: 1, track: 'networking', order: 6, title: 'IPv4 Fundamentals', summary: 'How IPv4 addresses and subnet masks work, in decimal and in binary.', minutes: 30, skills: { networking: 5 }, prereqs: ['l1-net-03-models'],
    objectives: ['Convert between dotted-decimal and binary', 'Explain the roles of the subnet mask, network address and broadcast address', 'Determine whether two addresses are in the same subnet', 'Identify invalid host addresses'],
    sections: [
      { type: 'text', title: 'Anatomy of an IPv4 address', md: `An IPv4 address is **32 bits**, written as four decimal numbers (octets) from 0 to 255: \`192.168.10.25\`.

Each octet is 8 bits. \`192\` = \`11000000\`, \`168\` = \`10101000\`, \`10\` = \`00001010\`, \`25\` = \`00011001\`.

Bit values in an octet: **128 64 32 16 8 4 2 1**. To convert 168: 168 − 128 = 40 → 40 − 32 = 8 → 8 − 8 = 0, so bits 128, 32 and 8 are on: \`10101000\`.

The address has two parts, decided by the **subnet mask**:
- the **network** part (which network the host is on) – the bits where the mask is 1,
- the **host** part (which host on that network) – the bits where the mask is 0.` },
      { type: 'demo', title: 'Interactive: binary converter', demo: 'binary-converter', md: 'Type any address and watch the bits. Try 255, 192, 224 and 240 – the values that appear in subnet masks.' },
      { type: 'text', title: 'Subnet mask, network and broadcast', md: `Mask \`255.255.255.0\` is \`11111111.11111111.11111111.00000000\`: 24 one-bits, written \`/24\` (CIDR notation). Combine with the address using a bitwise AND:

\`\`\`
address  192.168.10.25   11000000.10101000.00001010.00011001
mask     255.255.255.0   11111111.11111111.11111111.00000000
network  192.168.10.0    11000000.10101000.00001010.00000000
\`\`\`

- **Network address** – host bits all 0 (\`192.168.10.0\`). Identifies the subnet; cannot be assigned to a host.
- **Broadcast address** – host bits all 1 (\`192.168.10.255\`). Reaches every host in the subnet; cannot be assigned either.
- **Usable hosts** – everything in between: \`.1\` to \`.254\` = 254 addresses. Formula: 2^(host bits) − 2.

Two hosts are **in the same subnet** when address AND mask gives the same network. \`192.168.10.25/24\` and \`192.168.10.200/24\` → both \`192.168.10.0\` → same subnet, they can talk directly. \`192.168.11.5/24\` → \`192.168.11.0\` → different subnet, needs a router.` },
      { type: 'demo', title: 'Interactive: subnet calculator', demo: 'subnet-calculator', md: 'Enter an address and prefix. Check the network, broadcast and host range, then verify your own calculation.' },
      { type: 'check', question: { type: 'subnet', q: 'Work out this subnet.', difficulty: 'easy', kind: 'basic' } },
      { type: 'text', title: 'Common masks and address classes', md: `| CIDR | Mask | Host bits | Usable hosts | Typical use |
| --- | --- | --- | --- | --- |
| /8 | 255.0.0.0 | 24 | 16,777,214 | huge private space (10.0.0.0/8) |
| /16 | 255.255.0.0 | 16 | 65,534 | large site |
| /24 | 255.255.255.0 | 8 | 254 | the classic office subnet |
| /25 | 255.255.255.128 | 7 | 126 | |
| /26 | 255.255.255.192 | 6 | 62 | |
| /27 | 255.255.255.224 | 5 | 30 | |
| /28 | 255.255.255.240 | 4 | 14 | |
| /29 | 255.255.255.248 | 3 | 6 | small device groups |
| /30 | 255.255.255.252 | 2 | 2 | router-to-router links |

**Address classes** (historical, still on exams): Class A 1–126 (default /8), Class B 128–191 (/16), Class C 192–223 (/24), Class D 224–239 multicast, Class E 240–255 experimental. 127.x.x.x is loopback. Modern networks ignore classes and use CIDR, but the terms persist in conversation.

:::warn Common mistakes
- Assigning the network address (\`.0\`) or broadcast (\`.255\` in a /24) to a host.
- Mismatched masks: PC1 with /24 and PC2 with /25 "sort of" work until they don't. Always set the same mask on every host in a subnet.
- Typing \`255.255.255.0\` as \`255.255.255.255\` – a /32 means "only me", nothing is reachable.
:::` },
      { type: 'check', question: { type: 'mcq', q: 'Which address cannot be assigned to a host in 10.1.1.0/24?', options: ['10.1.1.1', '10.1.1.254', '10.1.1.255', '10.1.1.100'], answer: 2, explain: '10.1.1.255 is the broadcast address of that subnet.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'fill', q: 'How many bits are in an IPv4 address?', answer: ['32', '32 bits'], explain: 'Four octets × 8 bits = 32 bits.', topic: 'IPv4' },
      { type: 'mcq', q: 'What is the binary form of 192?', options: ['10101000', '11000000', '11100000', '10000000'], answer: 1, explain: '128 + 64 = 192 → 11000000.', topic: 'binary' },
      { type: 'subnet', q: 'Subnetting problem', difficulty: 'easy', kind: 'basic', topic: 'subnetting' },
      { type: 'mcq', q: 'Host A is 172.16.5.10/16 and host B is 172.16.200.3/16. Can they communicate without a router?', options: ['Yes, same subnet (172.16.0.0/16)', 'No, different subnets', 'Only if they use DHCP', 'Only through a switch with VLANs'], answer: 0, explain: 'With a /16 mask only the first two octets must match.', topic: 'subnetting' },
      { type: 'mcq', q: 'How many usable host addresses are in a /26 subnet?', options: ['64', '62', '30', '126'], answer: 1, explain: '6 host bits → 64 addresses − 2 = 62.', topic: 'subnetting' },
      { type: 'mcq', q: 'What is the broadcast address of 192.168.4.0/24?', options: ['192.168.4.0', '192.168.4.1', '192.168.4.254', '192.168.4.255'], answer: 3, explain: 'Host bits all ones in a /24 gives .255.', topic: 'subnetting' },
      { type: 'tf', q: 'The subnet mask 255.255.255.0 can be written as /24.', answer: true, explain: '24 one-bits.', topic: 'IPv4' },
      { type: 'mcq', q: 'Which mask would you use for a point-to-point link between two routers to waste the fewest addresses?', options: ['/24', '/28', '/30', '/16'], answer: 2, explain: '/30 provides exactly 2 usable addresses.', topic: 'subnetting' }
    ] },
    practical: { type: 'netsim', id: 'sim-02-ip-config', title: 'Configure IP addresses and masks so the PCs can ping' }, cert: ['netplus:1.7', 'ccna:1.6'], refs: []
  });

  L.push({
    id: 'l1-net-07-ipv6', level: 1, track: 'networking', order: 7, title: 'IPv6 Fundamentals', summary: 'Why IPv6 exists, how to read and shorten its addresses, and the address types you will see on every host.', minutes: 20, skills: { networking: 3 }, prereqs: ['l1-net-06-ipv4'],
    objectives: ['Explain why IPv6 replaces IPv4', 'Compress and expand IPv6 addresses correctly', 'Identify link-local, unique local, global unicast and multicast addresses', 'Understand how hosts get IPv6 addresses (SLAAC, DHCPv6)'],
    sections: [
      { type: 'text', title: 'Why IPv6', md: `IPv4 has about 4.3 billion addresses – the public pool ran out in the 2010s. NAT kept IPv4 alive, but it breaks the end-to-end model and adds complexity. **IPv6** uses **128-bit** addresses: 340 undecillion of them (3.4 × 10^38). Enough to give every grain of sand its own subnet.

Other improvements: no broadcasts (multicast instead), built-in auto-configuration, simpler headers for faster routing, and IPsec designed in from the start. Today more than 45% of Google traffic is IPv6; phones on mobile networks are often IPv6-only.` },
      { type: 'text', title: 'Reading an IPv6 address', md: `An IPv6 address is eight groups of four hexadecimal digits separated by colons:

\`2001:0db8:0000:0000:0000:ff00:0042:8329\`

Two shortening rules:
1. **Drop leading zeros** in each group: \`2001:db8:0:0:0:ff00:42:8329\`.
2. **Replace one run of consecutive all-zero groups with \`::\`** (only once, the longest run): \`2001:db8::ff00:42:8329\`.

The **prefix length** replaces the mask: \`2001:db8:acad:1::/64\`. The standard LAN subnet is a **/64** – the first 64 bits identify the network, the last 64 the interface. ISPs typically give a site a /48 or /56, which contains thousands of /64 subnets.

Hexadecimal reminder: digits 0–9 then a–f (10–15). Each hex digit is 4 bits, so each group is 16 bits.` },
      { type: 'demo', title: 'Interactive: compress and expand', demo: 'ipv6-compressor', md: 'Type an address in either form and see the other, plus its type.' },
      { type: 'check', question: { type: 'fill', q: 'Compress fully: fe80:0000:0000:0000:0204:61ff:fe9d:f156', answer: ['fe80::204:61ff:fe9d:f156'], explain: 'Drop leading zeros (0204 → 204) and replace the single run of zero groups with ::.' } },
      { type: 'text', title: 'Address types', md: `| Type | Prefix | Meaning |
| --- | --- | --- |
| **Global unicast** | 2000::/3 (starts with 2 or 3) | public, routable on the Internet (like public IPv4) |
| **Link-local** | fe80::/10 | automatic on every interface; only valid on the local link; used for neighbour discovery and as gateway addresses |
| **Unique local** | fc00::/7 (in practice fd00::/8) | private, like RFC 1918 |
| **Multicast** | ff00::/8 | one-to-many; ff02::1 = all nodes, ff02::2 = all routers |
| **Loopback** | ::1 | the host itself |
| **Unspecified** | :: | "no address yet" |

Every IPv6 interface has **several** addresses at once: a link-local one, and usually a global one. When you run \`ipconfig\` or \`ip addr\` you will see \`fe80::...%12\` – that \`%12\` is the interface index (zone ID) because link-local addresses are ambiguous across interfaces.` },
      { type: 'text', title: 'How hosts get addresses', md: `- **SLAAC** (Stateless Address Autoconfiguration) – the router advertises the /64 prefix (Router Advertisement) and the host builds its own address (random or from its MAC via EUI-64). No server needed.
- **DHCPv6** – stateful, like DHCP, when administrators want control and logging.
- **Neighbor Discovery (NDP)** replaces ARP: *Neighbor Solicitation* / *Neighbor Advertisement* over multicast.

**Dual stack** – running IPv4 and IPv6 together – is how almost every network migrates. Many problems appear when one stack works and the other silently fails ("the site is slow" because IPv6 times out before falling back to IPv4).

:::tip
Firewalls must have IPv6 rules too. A common audit finding: careful IPv4 rules, but IPv6 wide open because nobody realized it was enabled.
:::` },
      { type: 'check', question: { type: 'mcq', q: 'An address starting with fe80: is:', options: ['Global unicast', 'Link-local', 'Multicast', 'Loopback'], answer: 1, explain: 'fe80::/10 is link-local, present on every IPv6 interface.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'fill', q: 'How many bits does an IPv6 address have?', answer: ['128', '128 bits'], explain: 'IPv6 = 128 bits; IPv4 = 32 bits.', topic: 'IPv6' },
      { type: 'mcq', q: 'Which is a correctly compressed form of 2001:0db8:0000:0000:0001:0000:0000:0001?', options: ['2001:db8::1::1', '2001:db8::1:0:0:1', '2001:db8:0:0:1::1', 'Both 2001:db8::1:0:0:1 and 2001:db8:0:0:1::1 are valid'], answer: 3, explain: 'Only one :: is allowed; both options compress a single run of zeros. RFC 5952 prefers compressing the longest run, which is the first one here, but both are valid addresses.', topic: 'IPv6' },
      { type: 'mcq', q: 'The standard prefix length for an IPv6 LAN subnet is:', options: ['/24', '/48', '/64', '/128'], answer: 2, explain: '/64 leaves 64 bits for interface identifiers and is required by SLAAC.', topic: 'IPv6' },
      { type: 'mcq', q: 'Which protocol replaces ARP in IPv6?', options: ['DHCPv6', 'Neighbor Discovery (NDP)', 'ICMPv4', 'DNS'], answer: 1, explain: 'NDP uses ICMPv6 Neighbor Solicitation/Advertisement.', topic: 'IPv6' },
      { type: 'tf', q: 'IPv6 uses broadcast addresses just like IPv4.', answer: false, explain: 'IPv6 has no broadcast; it uses multicast (e.g. ff02::1).', topic: 'IPv6' },
      { type: 'mcq', q: 'An address beginning with fd12: is which type?', options: ['Global unicast', 'Link-local', 'Unique local (private)', 'Multicast'], answer: 2, explain: 'fc00::/7 (fd00::/8 in practice) is unique local.', topic: 'IPv6' },
      { type: 'mcq', q: 'What does SLAAC allow a host to do?', options: ['Resolve names without DNS', 'Configure its own IPv6 address from a router advertisement', 'Encrypt all traffic', 'Translate IPv6 to IPv4'], answer: 1, explain: 'Stateless autoconfiguration builds an address from the advertised prefix.', topic: 'IPv6' }
    ] },
    practical: null, cert: ['netplus:1.7', 'ccna:1.8'], refs: [{ title: 'RFC 4291 – IPv6 Addressing Architecture', url: 'https://www.rfc-editor.org/rfc/rfc4291' }]
  });

  NSA.data.lessons = NSA.data.lessons.concat(L);
})(typeof globalThis !== 'undefined' ? globalThis : window);
