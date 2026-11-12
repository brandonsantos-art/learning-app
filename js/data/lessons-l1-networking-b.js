/* NetSec Academy – Level 1 Networking lessons (part B: 8–15) */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.lessons = NSA.data.lessons || [];
  const L = [];

  L.push({
    id: 'l1-net-08-public-private', level: 1, track: 'networking', order: 8, title: 'Public vs. Private IP Addresses', summary: 'RFC 1918 ranges, NAT at the edge, APIPA, loopback and the special addresses you must recognize on sight.', minutes: 15, skills: { networking: 3 }, prereqs: ['l1-net-06-ipv4'],
    objectives: ['Recite the three private IPv4 ranges', 'Explain why private addresses need NAT to reach the Internet', 'Recognize APIPA, loopback and other special addresses', 'Diagnose "I have an IP but no Internet" from the address alone'],
    sections: [
      { type: 'text', title: 'Private address ranges (RFC 1918)', md: `Three blocks are reserved for use inside organizations. Anyone may use them; they are **never routed on the public Internet**.

| Range | CIDR | Addresses | Typical use |
| --- | --- | --- | --- |
| 10.0.0.0 – 10.255.255.255 | 10.0.0.0/8 | 16.7 million | enterprises, data centres |
| 172.16.0.0 – 172.31.255.255 | 172.16.0.0/12 | 1 million | mid-size sites, Docker, cloud VPCs |
| 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 | 65,536 | homes, small offices |

Because millions of networks reuse 192.168.1.0/24, the Internet cannot know which one you mean. The edge router therefore performs **NAT** (Network Address Translation): it replaces your private source address with its **public** address and remembers the mapping so replies find their way back.

**Public addresses** are globally unique and assigned by regional registries (ARIN, RIPE, APNIC…) to ISPs, who lease them to customers. Your home router's WAN interface usually has one public address shared by everything behind it (PAT / overload).` },
      { type: 'demo', title: 'Interactive: classify addresses', demo: 'address-classifier', md: 'Type an address and the tool tells you whether it is public, private, APIPA, loopback, multicast or reserved.' },
      { type: 'text', title: 'Special addresses you must recognize', md: `| Address / range | Meaning | What it tells a technician |
| --- | --- | --- |
| 169.254.0.0/16 (APIPA) | self-assigned when no DHCP server answered | "DHCP failed" – check cable, VLAN, DHCP service |
| 127.0.0.0/8 (127.0.0.1) | loopback, the host itself | ping it to test the TCP/IP stack |
| 0.0.0.0 | "no address" / "any address"; default route 0.0.0.0/0 | a service listening on 0.0.0.0 accepts connections on all interfaces |
| 255.255.255.255 | limited broadcast (DHCP Discover uses it) | never leaves the local segment |
| 224.0.0.0/4 | multicast (224.0.0.5 OSPF, 239.x streaming) | one-to-many traffic |
| 100.64.0.0/10 | carrier-grade NAT (shared address space) | your ISP is NATing you too – inbound port forwarding will not work |

:::real Diagnosis in one glance
- \`169.254.x.x\` → no DHCP lease.
- \`192.168.x.x\` but no Internet → gateway, DNS or NAT problem, not the address itself.
- A public address directly on a PC → it is exposed to the Internet; verify the host firewall.
:::` },
      { type: 'check', question: { type: 'mcq', q: 'A laptop shows 169.254.33.12 with mask 255.255.0.0. What is the most likely cause?', options: ['The ISP is down', 'No DHCP server responded, so Windows self-assigned an address', 'The laptop has a static public IP', 'DNS is misconfigured'], answer: 1, explain: 'APIPA addresses mean the DHCP exchange failed.' } },
      { type: 'text', title: 'Private addresses and security', md: `Private addressing is **not** a security control by itself – NAT hides hosts incidentally, but a firewall policy is what actually blocks unsolicited inbound traffic. Still, the facts matter for security work:

- Attackers who get inside (phishing, VPN credentials) see the private ranges; "internal only" is not "safe".
- Logs showing a private address as the source of an *Internet* attack are usually spoofed or mis-parsed.
- Overlapping private ranges (two merged companies both using 10.0.0.0/8) is a classic VPN headache solved with NAT.` }
    ],
    assessment: { pass: 70, questions: [
      { type: 'multi', q: 'Which addresses are private (RFC 1918)? (Select all that apply)', options: ['10.45.2.1', '172.32.0.5', '192.168.250.7', '172.20.1.1', '11.0.0.1'], answer: [0, 2, 3], explain: '172.32.x.x is outside 172.16–172.31; 11.0.0.1 is public.', topic: 'addressing' },
      { type: 'mcq', q: 'Why can a private address not be used directly on the Internet?', options: ['It is too short', 'Internet routers do not have routes for private ranges; many networks reuse them', 'It is encrypted', 'It only works on Wi-Fi'], answer: 1, explain: 'Private ranges are not globally unique and are filtered by ISPs.', topic: 'addressing' },
      { type: 'fill', q: 'What technology lets many private hosts share one public address?', answer: ['NAT', 'PAT', 'network address translation', 'NAT overload'], explain: 'NAT/PAT translates private source addresses to the public address.', topic: 'NAT' },
      { type: 'mcq', q: 'Pinging 127.0.0.1 tests:', options: ['The default gateway', 'The local TCP/IP stack', 'The DNS server', 'The ISP link'], answer: 1, explain: 'Loopback never leaves the host.', topic: 'addressing' },
      { type: 'mcq', q: 'A server shows it is listening on 0.0.0.0:22. This means:', options: ['SSH is disabled', 'SSH accepts connections on all its interfaces', 'Only localhost can connect', 'The address is invalid'], answer: 1, explain: '0.0.0.0 as a listening address means "any local address".', topic: 'addressing' },
      { type: 'tf', q: 'Using private IP addresses makes a firewall unnecessary.', answer: false, explain: 'NAT is not a security policy; firewalls enforce access control.', topic: 'security' }
    ] },
    practical: null, cert: ['netplus:1.7', 'ccna:1.6'], refs: [{ title: 'RFC 1918 – Address Allocation for Private Internets', url: 'https://www.rfc-editor.org/rfc/rfc1918' }]
  });

  L.push({
    id: 'l1-net-09-subnetting', level: 1, track: 'networking', order: 9, title: 'Subnetting Fundamentals', summary: 'Splitting a network into subnets: the block-size method that lets you subnet in your head.', minutes: 35, skills: { networking: 6 }, prereqs: ['l1-net-06-ipv4'],
    objectives: ['Explain why networks are subnetted', 'Use the block-size (magic number) method to find network, broadcast and range', 'Choose a prefix length for a required number of hosts or subnets', 'Solve subnetting problems quickly without a calculator'],
    sections: [
      { type: 'text', title: 'Why subnet?', md: `A company with 192.168.0.0/16 has 65,534 addresses in **one** broadcast domain – every ARP request reaches every device, a single faulty NIC can flood everyone, and there is no way to separate Finance from guests. **Subnetting** borrows host bits to create smaller networks:

- **Performance** – smaller broadcast domains.
- **Security** – firewalls/ACLs can control traffic between subnets.
- **Organization** – one subnet per department, floor, VLAN or function (servers, printers, management).
- **Routing** – summarizable, hierarchical addressing.

Borrowing **n** host bits creates **2^n** subnets. Each extra borrowed bit halves the hosts per subnet.` },
      { type: 'text', title: 'The block-size method', md: `For any prefix, find the **interesting octet** (the one where the mask is not 255 or 0) and the **block size** = 256 − mask value in that octet.

| Mask octet | 128 | 192 | 224 | 240 | 248 | 252 | 254 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Block size | 128 | 64 | 32 | 16 | 8 | 4 | 2 |
| Prefix (4th octet) | /25 | /26 | /27 | /28 | /29 | /30 | /31 |

Subnets start at multiples of the block size: 0, 64, 128, 192 for /26.

**Example:** 192.168.10.77/26
1. Mask = 255.255.255.192 → interesting octet is the 4th, block size 64.
2. Multiples of 64: 0, 64, 128, 192. The value 77 falls in the block starting at **64**.
3. Network = 192.168.10.**64**. Next block starts at 128, so broadcast = 192.168.10.**127**.
4. Usable range = .65 – .126 (62 hosts).

**Example in the 3rd octet:** 172.16.45.9/20
1. /20 = 255.255.**240**.0 → block size 16 in the 3rd octet.
2. Multiples of 16: 32, 48 … 45 is in the block starting at 32.
3. Network = 172.16.32.0, broadcast = 172.16.47.255 (one less than next block 48, with the 4th octet at 255). Hosts 172.16.32.1 – 172.16.47.254 (4,094).` },
      { type: 'demo', title: 'Interactive: visualize the blocks', demo: 'cidr-visualizer', md: 'Pick a prefix and see how a /24 is carved into equal blocks. Click a block to see its range.' },
      { type: 'check', question: { type: 'subnet', q: 'Solve using the block-size method.', difficulty: 'easy', kind: 'basic' } },
      { type: 'text', title: 'Choosing a prefix', md: `**"I need N hosts"** → find the smallest power of two ≥ N + 2, and count host bits.
- 50 hosts → 64 addresses → 6 host bits → /26 (62 usable).
- 100 hosts → 128 → 7 bits → /25 (126 usable).
- 300 hosts → 512 → 9 bits → /23 (510 usable).

**"I need N subnets from a /24"** → borrow bits: 2 bits = 4 subnets (/26), 3 bits = 8 subnets (/27), 4 bits = 16 subnets (/28).

Quick table for a /24 split:

| Borrowed bits | New prefix | Subnets | Hosts each |
| --- | --- | --- | --- |
| 1 | /25 | 2 | 126 |
| 2 | /26 | 4 | 62 |
| 3 | /27 | 8 | 30 |
| 4 | /28 | 16 | 14 |
| 5 | /29 | 32 | 6 |
| 6 | /30 | 64 | 2 |

:::tip Exam trick
The question "how many subnets and hosts does /27 give from a Class C?" wants: 2^3 = 8 subnets, 2^5 − 2 = 30 hosts.
:::` },
      { type: 'check', question: { type: 'subnet', q: 'Count subnets and hosts.', difficulty: 'medium', kind: 'count' } },
      { type: 'text', title: 'Practice plan', md: `Subnetting becomes automatic only through repetition. The **Challenges** section has a subnet trainer with easy/medium/hard problems and a timer; the daily challenge includes one problem every day. Aim for solving a basic problem in under 30 seconds before taking the Level 1 exam.

Common errors to watch for:
- Forgetting to subtract 2 for network and broadcast.
- Using the wrong interesting octet for /17–/23 prefixes.
- Mixing up block size (256 − mask) with the number of subnets.` }
    ],
    assessment: { pass: 70, questions: [
      { type: 'subnet', q: 'Subnetting problem', difficulty: 'easy', kind: 'basic', topic: 'subnetting' },
      { type: 'subnet', q: 'Subnetting problem', difficulty: 'medium', kind: 'hosts', topic: 'subnetting' },
      { type: 'subnet', q: 'Subnetting problem', difficulty: 'medium', kind: 'count', topic: 'subnetting' },
      { type: 'mcq', q: 'What is the block size for a /27 mask?', options: ['16', '32', '64', '30'], answer: 1, explain: '256 − 224 = 32.', topic: 'subnetting' },
      { type: 'mcq', q: 'The smallest subnet that provides at least 100 usable hosts is:', options: ['/26', '/25', '/24', '/27'], answer: 1, explain: '/25 gives 126 usable hosts; /26 only 62.', topic: 'subnetting' },
      { type: 'mcq', q: 'Which is the network address of 10.20.130.5/23?', options: ['10.20.130.0', '10.20.128.0', '10.20.0.0', '10.20.131.0'], answer: 0, explain: '/23 → block size 2 in the 3rd octet; 130 is even so the block starts at 130: 10.20.130.0 – 10.20.131.255.', topic: 'subnetting' },
      { type: 'tf', q: 'Borrowing 3 host bits from a /24 creates 6 subnets.', answer: false, explain: '2^3 = 8 subnets.', topic: 'subnetting' }
    ] },
    practical: { type: 'challenge', id: 'challenge-subnet-10', title: 'Solve 10 problems in the subnet trainer' }, cert: ['netplus:1.7', 'ccna:1.6'], refs: []
  });

  L.push({
    id: 'l1-net-10-mac', level: 1, track: 'networking', order: 10, title: 'MAC Addresses and ARP', summary: 'Hardware addresses, vendor codes, how ARP ties Layer 2 to Layer 3, and what an ARP cache tells you.', minutes: 20, skills: { networking: 3 }, prereqs: ['l1-net-05-devices'],
    objectives: ['Describe the format and structure of a MAC address', 'Explain the ARP request/reply process step by step', 'Read an ARP cache with arp -a / ip neigh', 'Explain why MAC addresses stay local while IP addresses travel end to end'],
    sections: [
      { type: 'text', title: 'What a MAC address is', md: `Every network interface has a **48-bit Media Access Control address**, written as six hexadecimal pairs: \`3C:52:82:1A:9B:C4\` (also \`3c-52-82-1a-9b-c4\` on Windows or \`3c52.821a.9bc4\` on Cisco).

- The first 24 bits are the **OUI** (Organizationally Unique Identifier) – the vendor. \`3C:52:82\` is Hewlett Packard; \`00:50:56\` is VMware; \`B8:27:EB\` is Raspberry Pi.
- The last 24 bits are assigned by the vendor to make the address unique.
- \`FF:FF:FF:FF:FF:FF\` is the **broadcast** MAC – every device on the segment accepts it.
- Addresses starting with an odd second hex digit of the first byte (e.g. 01:00:5E) are **multicast**.

MAC addresses are "burned in" but can be changed in software (spoofed) – which is why MAC filtering on Wi-Fi is weak security. Modern phones **randomize** their Wi-Fi MAC per network for privacy; this confuses DHCP reservations and MAC-based access lists.` },
      { type: 'demo', title: 'Interactive: decode a MAC', demo: 'mac-oui', md: 'Enter a MAC address to see its vendor OUI, unicast/multicast bit and local/universal bit.' },
      { type: 'text', title: 'ARP: gluing IP to MAC', md: `A host knows the IP address it wants to reach, but Ethernet frames need a **destination MAC**. **ARP** (Address Resolution Protocol) resolves it:

1. PC1 (192.168.1.10) wants to send to 192.168.1.20. Same subnet → it needs 192.168.1.20's MAC.
2. PC1 checks its **ARP cache**. Not there.
3. PC1 **broadcasts** an ARP Request: *"Who has 192.168.1.20? Tell 192.168.1.10"* (destination MAC ff:ff:ff:ff:ff:ff).
4. Every device on the segment receives it; only PC2 answers with a **unicast** ARP Reply: *"192.168.1.20 is at 02:00:00:00:00:02"*.
5. PC1 caches the mapping (typically for a few minutes) and sends the frame.

For a destination in **another** subnet, the host ARPs for its **default gateway** instead, because the frame must go to the router first. The IP header still carries the final destination.

:::real
"Destination host unreachable" in Windows ping usually means ARP got no reply – the target is off, unplugged, in another VLAN, or the gateway address is wrong.
:::` },
      { type: 'text', title: 'Reading the ARP cache', md: `\`\`\`
C:\\> arp -a
Interface: 192.168.1.10 --- 0xc
  Internet Address      Physical Address      Type
  192.168.1.1           02-00-00-00-00-05     dynamic
  192.168.1.255         ff-ff-ff-ff-ff-ff     static
\`\`\`
Linux: \`ip neigh\` (or \`arp -n\`) shows \`192.168.1.1 dev eth0 lladdr 02:00:00:00:00:05 REACHABLE\`.

Why it matters for security: **ARP has no authentication**. An attacker can answer "192.168.1.1 is at *my* MAC" and become the gateway for everyone – ARP spoofing, the basis of many man-in-the-middle attacks (Level 2). Two different MACs claiming the same IP, or the gateway's MAC suddenly changing, is a red flag.` },
      { type: 'check', question: { type: 'mcq', q: 'PC1 (192.168.1.10/24) sends a packet to 8.8.8.8. Which MAC address goes in the destination field of the Ethernet frame?', options: ['The MAC of 8.8.8.8', 'The broadcast MAC', 'The MAC of PC1\'s default gateway', 'The MAC of the DNS server'], answer: 2, explain: 'Remote destination → frame goes to the gateway router; the IP header still says 8.8.8.8.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'fill', q: 'How many bits long is a MAC address?', answer: ['48', '48 bits'], explain: '6 bytes × 8 = 48 bits.', topic: 'MAC' },
      { type: 'mcq', q: 'The first three bytes of a MAC address identify:', options: ['The subnet', 'The vendor (OUI)', 'The country', 'The VLAN'], answer: 1, explain: 'OUI = Organizationally Unique Identifier assigned by IEEE.', topic: 'MAC' },
      { type: 'mcq', q: 'An ARP Request is sent to which destination MAC?', options: ['00:00:00:00:00:00', 'FF:FF:FF:FF:FF:FF', 'The gateway MAC', 'The DNS server MAC'], answer: 1, explain: 'ARP requests are broadcast so every host can hear them.', topic: 'ARP' },
      { type: 'tf', q: 'An ARP Reply is unicast directly to the requester.', answer: true, explain: 'Only the owner of the IP replies, directly to the asker.', topic: 'ARP' },
      { type: 'mcq', q: 'Windows reports "Destination host unreachable" when pinging a PC in the same subnet. The most likely cause is:', options: ['DNS is down', 'No device answered ARP for that IP (off, unplugged, wrong VLAN)', 'The default gateway is overloaded', 'The firewall allowed the ping'], answer: 1, explain: 'Without an ARP reply the frame cannot be built.', topic: 'ARP' },
      { type: 'mcq', q: 'Which statement is true about MAC and IP addresses as a packet crosses the Internet?', options: ['Both change at every hop', 'The IP addresses change; MAC addresses stay the same', 'The MAC addresses change at every hop; IP addresses stay the same', 'Neither changes'], answer: 2, explain: 'Layer 2 addresses are per link; Layer 3 addresses are end to end.', topic: 'encapsulation' },
      { type: 'mcq', q: 'Why is MAC address filtering on Wi-Fi considered weak security?', options: ['MAC addresses are encrypted', 'MAC addresses can be easily changed (spoofed) in software', 'Access points cannot read MAC addresses', 'It slows the network'], answer: 1, explain: 'An attacker can clone an allowed MAC.', topic: 'security' }
    ] },
    practical: { type: 'terminal', id: 'term-02-ping-tracert', title: 'Ping, inspect the ARP cache and trace a route' }, cert: ['netplus:1.3', 'ccna:1.1'], refs: []
  });

  L.push({
    id: 'l1-net-11-services', level: 1, track: 'networking', order: 11, title: 'DNS, DHCP, HTTP, HTTPS and FTP', summary: 'The core application services: how names become addresses, how hosts get addresses, and how the web and file transfer work.', minutes: 30, skills: { networking: 4, netadmin: 1 }, prereqs: ['l1-net-08-public-private'],
    objectives: ['Explain DNS resolution including caching and record types', 'Describe the DHCP DORA process and lease options', 'Explain the HTTP request/response model and why HTTPS matters', 'Recognize FTP and its secure alternatives'],
    sections: [
      { type: 'text', title: 'DNS – the phone book', md: `Humans remember \`www.netsec.academy\`; packets need \`203.0.113.80\`. **DNS** (UDP/TCP port 53) translates between them.

**Resolution path** when you look up a name:
1. Browser/OS **cache** (\`ipconfig /displaydns\`).
2. The **hosts file** (\`C:\\Windows\\System32\\drivers\\etc\\hosts\`, \`/etc/hosts\`) – manual overrides, also abused by malware.
3. The configured **recursive resolver** (your ISP's, the company DNS server, 8.8.8.8, 1.1.1.1). It asks on your behalf:
4. a **root server** (which TLD server knows .academy?) → the **TLD server** (which server is authoritative for netsec.academy?) → the **authoritative server** (the answer: 203.0.113.80).
5. The resolver caches the answer for the record's **TTL** and returns it.

**Record types:** A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail server), NS (name server), PTR (reverse: IP → name), TXT (text, used by SPF/DKIM), SOA (zone authority).

:::real Troubleshooting DNS
Can ping \`8.8.8.8\` but not \`google.com\`? That is DNS. Check \`nslookup google.com\`: "DNS request timed out" = server unreachable; "Non-existent domain" = server answered but has no record (typo, wrong suffix, missing record).
:::` },
      { type: 'demo', title: 'Interactive: resolve a name', demo: 'dns-lookup', md: 'Step through a recursive lookup from the stub resolver to the authoritative server.' },
      { type: 'text', title: 'DHCP – addresses on demand', md: `Without DHCP an administrator types an IP, mask, gateway and DNS server into every device by hand. **DHCP** (UDP 67 server / 68 client) automates it with four broadcast/unicast messages – **DORA**:

1. **Discover** – client broadcasts "any DHCP servers out there?" (source 0.0.0.0, destination 255.255.255.255).
2. **Offer** – a server proposes an address and options.
3. **Request** – the client asks for that offer (and implicitly declines others).
4. **Acknowledge** – the server confirms; the lease starts.

The lease includes **options**: subnet mask, default gateway (option 3), DNS servers (option 6), domain name, lease time. Clients renew at 50% of the lease.

Because Discover is a broadcast, the server must be on the same segment – or a router must forward the request with a **DHCP relay** (\`ip helper-address\` on Cisco).

**Failure modes you will troubleshoot:**
- No server reachable → APIPA 169.254.x.x.
- **Rogue DHCP server** (a home router plugged into the office) hands out wrong gateways – users "have an IP" but nothing works.
- Pool exhausted → new devices cannot connect while old ones work.
- Reservations (fixed address by MAC) for printers and servers – but static addresses must be excluded from the pool or you get **duplicate IPs**.` },
      { type: 'demo', title: 'Interactive: watch DORA', demo: 'dhcp-dora', md: 'Play the exchange and see which messages are broadcast and which are unicast.' },
      { type: 'check', question: { type: 'order', q: 'Order the DHCP messages.', items: ['Request', 'Offer', 'Acknowledge', 'Discover'], answer: [3, 1, 0, 2], explain: 'Discover → Offer → Request → Acknowledge.' } },
      { type: 'text', title: 'HTTP and HTTPS – the web', md: `**HTTP** (TCP 80) is a request/response protocol. The client sends a **method** and path, the server returns a **status code** and content.

\`\`\`
GET /index.html HTTP/1.1
Host: www.netsec.academy

HTTP/1.1 200 OK
Content-Type: text/html
\`\`\`

Common status codes: **200** OK, **301/302** redirect, **401** unauthorized, **403** forbidden, **404** not found, **500** server error, **503** service unavailable.

**HTTPS** (TCP 443) wraps HTTP in **TLS**: the server presents a **certificate** signed by a trusted Certificate Authority, the client verifies it, both agree on session keys, and everything after that is encrypted. HTTPS protects *confidentiality* (nobody on the Wi-Fi reads your password), *integrity* (no injected ads/malware) and *authenticity* (you are really talking to your bank). A certificate warning means one of those guarantees failed – never click through on a site that handles credentials.

Test from the command line: \`curl -I https://example.com\` shows the headers; \`Test-NetConnection example.com -Port 443\` checks the port.` },
      { type: 'text', title: 'FTP and secure file transfer', md: `**FTP** (TCP 21 control, 20 data) is the original file transfer protocol. It sends usernames and passwords **in clear text** and uses a second connection for data (active vs passive mode – the source of countless firewall headaches). Treat it as legacy.

Use instead:
- **SFTP** – file transfer over SSH (port 22). Encrypted, firewall-friendly.
- **FTPS** – FTP with TLS (ports 21/990).
- **SMB** (445) – Windows file shares; **NFS** – Unix file shares; **HTTPS** uploads for most modern apps.
- **TFTP** (UDP 69) – trivial, no authentication; used only for network device firmware/config in protected management networks.

Security audits flag any FTP or Telnet service as a finding; in the port-scanning labs you will see why.` },
      { type: 'check', question: { type: 'mcq', q: 'A user can reach websites by IP address but not by name. Which service has failed?', options: ['DHCP', 'DNS', 'HTTP', 'ARP'], answer: 1, explain: 'Name resolution is DNS; connectivity itself works.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which DNS record maps a name to an IPv4 address?', options: ['AAAA', 'MX', 'A', 'PTR'], answer: 2, explain: 'A = IPv4, AAAA = IPv6, MX = mail, PTR = reverse.', topic: 'DNS' },
      { type: 'mcq', q: 'Which DHCP message is the first one sent by a client?', options: ['Offer', 'Discover', 'Request', 'Acknowledge'], answer: 1, explain: 'DORA starts with Discover.', topic: 'DHCP' },
      { type: 'mcq', q: 'A DHCP server is in another subnet from the clients. What is needed on the router?', options: ['NAT', 'A DHCP relay (ip helper-address)', 'A DNS forwarder', 'Port forwarding on 80'], answer: 1, explain: 'DHCP Discover is a broadcast; the relay forwards it as unicast to the server.', topic: 'DHCP' },
      { type: 'fill', q: 'HTTPS uses TCP port ______.', answer: ['443'], explain: 'HTTP is 80, HTTPS is 443.', topic: 'HTTP' },
      { type: 'mcq', q: 'What does HTTP status 404 mean?', options: ['Server error', 'Not found', 'Unauthorized', 'Redirect'], answer: 1, explain: '404 = the resource does not exist at that path.', topic: 'HTTP' },
      { type: 'mcq', q: 'Which protocol should replace FTP for secure transfers through a firewall with minimal rules?', options: ['TFTP', 'Telnet', 'SFTP', 'SNMP'], answer: 2, explain: 'SFTP runs over SSH on one port (22) and is encrypted.', topic: 'FTP' },
      { type: 'tf', q: 'nslookup returning "Non-existent domain" means the DNS server could not be reached.', answer: false, explain: 'NXDOMAIN means the server answered: the name does not exist. A timeout would indicate unreachability.', topic: 'DNS' },
      { type: 'mcq', q: 'What guarantees does HTTPS provide? ', options: ['Only faster loading', 'Confidentiality, integrity and server authenticity', 'Only that the server is online', 'Protection against all malware'], answer: 1, explain: 'TLS encrypts, protects integrity and authenticates the server via certificates.', topic: 'HTTPS' }
    ] },
    practical: { type: 'netsim', id: 'sim-04-dhcp', title: 'Set up a DHCP server and lease addresses' }, cert: ['netplus:1.4', 'ccna:4.3'], refs: [{ title: 'Cloudflare: What is DNS?', url: 'https://www.cloudflare.com/learning/dns/what-is-dns/' }]
  });

  L.push({
    id: 'l1-net-12-tcp-udp', level: 1, track: 'networking', order: 12, title: 'TCP vs. UDP', summary: 'The two transport protocols: reliability, handshakes, ports and when each is the right choice.', minutes: 20, skills: { networking: 3 }, prereqs: ['l1-net-03-models'],
    objectives: ['Describe the TCP three-way handshake and connection teardown', 'Contrast TCP reliability with UDP simplicity', 'Match applications to the transport protocol they use', 'Interpret SYN/ACK/RST/FIN flags in a capture or scan'],
    sections: [
      { type: 'text', title: 'Two ways to deliver', md: `Layer 4 delivers data between **applications**, identified by **port numbers**, on hosts identified by IP addresses. A conversation is defined by the 5-tuple: source IP, source port, destination IP, destination port, protocol.

| | **TCP** | **UDP** |
| --- | --- | --- |
| Connection | yes – handshake first | none – just send |
| Reliability | acknowledgements, retransmission | none (the application may add its own) |
| Ordering | sequence numbers, in-order delivery | none |
| Flow/congestion control | yes (windows) | none |
| Overhead | 20+ byte header | 8 byte header |
| Used by | HTTP/HTTPS, SSH, SMTP, FTP, SMB, RDP, databases | DNS, DHCP, VoIP/RTP, video streaming, NTP, SNMP, TFTP, online games |

Rule: use **TCP** when every byte must arrive (web page, file). Use **UDP** when speed matters more than perfection (a late voice packet is useless, so why retransmit it?) or when the exchange is tiny (one DNS query and answer).` },
      { type: 'demo', title: 'Interactive: the three-way handshake', demo: 'tcp-handshake', md: 'Step through SYN, SYN-ACK and ACK, then the FIN/ACK teardown, and see what a RST looks like.' },
      { type: 'text', title: 'TCP in detail', md: `**Three-way handshake**
1. Client → Server: **SYN** (synchronize), with an initial sequence number.
2. Server → Client: **SYN-ACK** – "I'm listening, here is my sequence number".
3. Client → Server: **ACK**. Connection established; data flows.

If no service listens on the port, the server replies **RST** (reset) – that is how a port scanner knows a port is *closed*. If a firewall silently drops the SYN, the client sees nothing and times out – the port appears *filtered*.

**Teardown:** each side sends **FIN** and receives an **ACK**.

**Reliability:** every byte is numbered; the receiver acknowledges what it got; missing segments are retransmitted after a timeout. The **window** controls how much data can be in flight – TCP slows down on packet loss (congestion control), which is why a lossy Wi-Fi link makes downloads crawl even with plenty of bandwidth.

**Header flags you will see in Wireshark/nmap:** SYN, ACK, FIN, RST, PSH (push), URG.` },
      { type: 'check', question: { type: 'mcq', q: 'A port scan sends a SYN and receives a RST. The port is:', options: ['Open', 'Closed', 'Filtered', 'Unknown'], answer: 1, explain: 'RST means the host is reachable but nothing listens on that port. No reply at all would be "filtered".' } },
      { type: 'text', title: 'UDP in detail', md: `UDP adds only ports and a checksum. The sender fires datagrams; if one is lost, nobody at Layer 4 notices. Applications that need some reliability implement it themselves (DNS retries a query after a timeout; QUIC – the protocol behind HTTP/3 – rebuilds reliability on top of UDP to avoid TCP's slow start).

Why DNS uses UDP: a query fits in one packet, and a handshake would triple the latency. Large responses (zone transfers, DNSSEC) fall back to TCP 53.

Why VoIP uses UDP: 50 packets per second; a retransmitted packet would arrive too late to be played.

**Security notes:** UDP is easy to **spoof** (no handshake proves the source address), which makes it the vehicle for amplification DDoS attacks (DNS, NTP, SSDP reflection). Firewalls therefore treat UDP "connections" with short timeouts.` },
      { type: 'check', question: { type: 'match', q: 'Match the application to its transport protocol.', pairs: [['Web browsing (HTTPS)', 'TCP'], ['DNS query', 'UDP'], ['VoIP call audio', 'UDP'], ['SSH session', 'TCP']], explain: 'Reliable byte streams use TCP; short or real-time traffic uses UDP.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'order', q: 'Order the TCP handshake.', items: ['ACK', 'SYN', 'SYN-ACK'], answer: [1, 2, 0], explain: 'SYN → SYN-ACK → ACK.', topic: 'TCP' },
      { type: 'mcq', q: 'Which protocol provides guaranteed, ordered delivery?', options: ['UDP', 'TCP', 'ICMP', 'ARP'], answer: 1, explain: 'TCP uses sequence numbers and acknowledgements.', topic: 'TCP' },
      { type: 'mcq', q: 'Why does VoIP prefer UDP?', options: ['UDP is encrypted', 'Retransmitting late voice packets is pointless; low overhead matters more', 'UDP has larger headers', 'TCP cannot carry audio'], answer: 1, explain: 'Real-time traffic values timeliness over reliability.', topic: 'UDP' },
      { type: 'mcq', q: 'A TCP flag used to abruptly abort a connection or signal a closed port is:', options: ['FIN', 'PSH', 'RST', 'URG'], answer: 2, explain: 'RST = reset.', topic: 'TCP' },
      { type: 'multi', q: 'Which services use UDP? (Select all that apply)', options: ['DNS', 'DHCP', 'HTTPS', 'NTP', 'SSH'], answer: [0, 1, 3], explain: 'DNS, DHCP and NTP are UDP; HTTPS and SSH are TCP.', topic: 'UDP' },
      { type: 'tf', q: 'A port scanner that gets no response at all to a SYN can conclude the port is closed.', answer: false, explain: 'No response means filtered (dropped by a firewall) – closed ports answer with RST.', topic: 'TCP' },
      { type: 'mcq', q: 'What identifies a single TCP conversation uniquely?', options: ['Destination IP only', 'Source and destination IPs, ports and the protocol (5-tuple)', 'The MAC addresses', 'The TTL'], answer: 1, explain: 'The 5-tuple defines a flow.', topic: 'TCP' }
    ] },
    practical: { type: 'security', id: 'sec-05-pcap', title: 'Find the handshake in a packet capture' }, cert: ['netplus:1.4', 'ccna:1.5'], refs: []
  });

  L.push({
    id: 'l1-net-13-ports', level: 1, track: 'networking', order: 13, title: 'Introduction to Ports and Protocols', summary: 'Well-known port numbers, how servers listen, how firewalls use ports, and the list you must memorize.', minutes: 20, skills: { networking: 3, security: 1 }, prereqs: ['l1-net-12-tcp-udp'],
    objectives: ['Explain port ranges: well-known, registered, ephemeral', 'Memorize the most common service ports', 'Read netstat / ss output to see listening services', 'Relate ports to firewall rules and attack surface'],
    sections: [
      { type: 'text', title: 'What a port is', md: `A **port** is a 16-bit number (0–65535) that identifies an application endpoint on a host. The server **listens** on a known port; the client picks a random **ephemeral** source port for the reply path.

| Range | Name | Use |
| --- | --- | --- |
| 0–1023 | well-known | standard services (require admin rights to bind on most systems) |
| 1024–49151 | registered | vendor applications (3306 MySQL, 3389 RDP, 8080 HTTP-alt) |
| 49152–65535 | dynamic / ephemeral | client-side source ports |

A connection to a web server: \`192.168.1.10:51234 → 93.184.216.34:443\`. The reply comes back to port 51234, which the OS maps to your browser.` },
      { type: 'text', title: 'The ports you must know', md: `| Port | Protocol | Service | Notes |
| --- | --- | --- | --- |
| 20/21 | TCP | FTP | clear text, legacy |
| 22 | TCP | SSH / SFTP / SCP | encrypted admin |
| 23 | TCP | Telnet | clear text – never use |
| 25 | TCP | SMTP | mail between servers (587 submission with auth) |
| 53 | UDP/TCP | DNS | |
| 67/68 | UDP | DHCP | server / client |
| 69 | UDP | TFTP | no auth |
| 80 | TCP | HTTP | |
| 110 / 995 | TCP | POP3 / POP3S | |
| 123 | UDP | NTP | time sync |
| 143 / 993 | TCP | IMAP / IMAPS | |
| 161/162 | UDP | SNMP | monitoring |
| 389 / 636 | TCP | LDAP / LDAPS | directory, Active Directory |
| 443 | TCP | HTTPS | |
| 445 | TCP | SMB | Windows file sharing; ransomware favourite |
| 514 | UDP | Syslog | |
| 1433 | TCP | MS SQL | |
| 3306 | TCP | MySQL | |
| 3389 | TCP | RDP | remote desktop; attacked constantly |
| 5900 | TCP | VNC | |
| 8080 | TCP | HTTP alternate / proxies | |

The **Flashcards** deck "Ports & Protocols" drills these both ways.` },
      { type: 'demo', title: 'Interactive: port matcher', demo: 'port-matcher', md: 'Match services to ports against the clock.' },
      { type: 'check', question: { type: 'match', q: 'Match the port to the service.', pairs: [['22', 'SSH'], ['53', 'DNS'], ['443', 'HTTPS'], ['3389', 'RDP']], explain: 'These four appear in nearly every firewall policy and scan result.' } },
      { type: 'text', title: 'Seeing ports on a host', md: `Windows:
\`\`\`
netstat -ano          all connections and listening ports with PIDs
netstat -an | findstr LISTENING
\`\`\`
Linux:
\`\`\`
ss -tuln              listening TCP/UDP sockets, numeric
ss -tulpn             ...with the owning process (needs sudo)
\`\`\`
A line such as \`0.0.0.0:22 LISTEN\` means SSH accepts connections from any address. \`127.0.0.1:3306\` means MySQL only accepts local connections – good practice for databases.

**Attack surface** = the set of listening ports reachable by an attacker. Every open port is a service that may have vulnerabilities; the first job of hardening is closing or firewalling what is not needed. Nmap shows the same list from the outside, which is why you will run both views in the labs and compare.` },
      { type: 'check', question: { type: 'mcq', q: 'ss -tuln shows 127.0.0.1:3306 LISTEN. From another PC, can you connect to MySQL?', options: ['Yes, port 3306 is open', 'No, it only listens on the loopback address', 'Only via UDP', 'Only if DNS works'], answer: 1, explain: 'Binding to 127.0.0.1 restricts the service to local connections.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'fill', q: 'SSH uses TCP port ______.', answer: ['22'], explain: 'Port 22.', topic: 'ports' },
      { type: 'fill', q: 'Remote Desktop Protocol (RDP) uses port ______.', answer: ['3389'], explain: 'RDP = 3389/TCP.', topic: 'ports' },
      { type: 'mcq', q: 'Which port does DNS primarily use?', options: ['25', '53', '67', '80'], answer: 1, explain: 'DNS is port 53 (UDP, with TCP for large answers).', topic: 'ports' },
      { type: 'mcq', q: 'The port range 49152–65535 is used for:', options: ['Well-known services', 'Ephemeral client source ports', 'Multicast', 'Printing'], answer: 1, explain: 'Clients pick dynamic source ports from this range.', topic: 'ports' },
      { type: 'mcq', q: 'Which two services send credentials in clear text and should be replaced?', options: ['SSH and HTTPS', 'Telnet and FTP', 'DNS and NTP', 'SMB and RDP'], answer: 1, explain: 'Telnet (23) and FTP (21) are unencrypted.', topic: 'security' },
      { type: 'mcq', q: 'Which command lists listening sockets with their process on Linux?', options: ['ipconfig /all', 'ss -tulpn', 'arp -a', 'dig'], answer: 1, explain: 'ss -tulpn (TCP, UDP, listening, process, numeric).', topic: 'commands' },
      { type: 'mcq', q: 'SMB file sharing, frequently abused by ransomware worms, uses port:', options: ['139 only', '445', '3306', '161'], answer: 1, explain: 'SMB over TCP = 445 (NetBIOS variant on 139).', topic: 'ports' },
      { type: 'multi', q: 'Which ports belong to email protocols? (Select all that apply)', options: ['25', '110', '143', '443', '993'], answer: [0, 1, 2, 4], explain: 'SMTP 25, POP3 110, IMAP 143, IMAPS 993. 443 is HTTPS.', topic: 'ports' }
    ] },
    practical: { type: 'terminal', id: 'term-06-ports-services', title: 'List listening services and test ports' }, cert: ['netplus:1.4', 'secplus:3.0'], refs: [{ title: 'IANA Service Name and Port Number Registry', url: 'https://www.iana.org/assignments/service-names-port-numbers/' }]
  });

  L.push({
    id: 'l1-net-14-commands', level: 1, track: 'networking', order: 14, title: 'Basic Linux and Windows Networking Commands', summary: 'The command-line toolkit every technician uses daily: ipconfig, ip, ping, tracert, nslookup, netstat and friends.', minutes: 35, skills: { networking: 3, windows: 3, linux: 3 }, prereqs: ['l1-net-11-services'],
    objectives: ['Display and interpret IP configuration on Windows and Linux', 'Use ping and traceroute to isolate where connectivity breaks', 'Query DNS with nslookup and dig', 'List connections and ARP entries', 'Follow a standard troubleshooting sequence'],
    sections: [
      { type: 'text', title: 'Show the configuration', md: `**Windows**
\`\`\`
ipconfig            IP, mask, gateway per adapter
ipconfig /all       + MAC, DHCP server, DNS servers, lease times
ipconfig /release   give the DHCP lease back
ipconfig /renew     ask DHCP for a new lease
ipconfig /flushdns  clear the DNS cache (after a record changes)
\`\`\`
**Linux**
\`\`\`
ip addr          (ip a)   addresses per interface
ip route         (ip r)   routing table; "default via" is the gateway
ip link                   interface up/down state
ip neigh                  ARP table
cat /etc/resolv.conf      DNS servers
hostname -I               just the IP addresses
\`\`\`
The older \`ifconfig\` and \`route -n\` still exist on many systems but \`ip\` is the modern tool.

**What to look for:** a valid address in the expected subnet (not 169.254.x.x), a mask that matches the rest of the subnet, a gateway in the same subnet, and reachable DNS servers.` },
      { type: 'text', title: 'Test reachability: ping', md: `\`ping\` sends ICMP Echo Requests and reports replies, round-trip time and loss. Windows sends 4; Linux pings until Ctrl+C (use \`-c 4\`).

| Output | Meaning |
| --- | --- |
| \`Reply from X: time<1ms TTL=64\` | reachable; TTL hints at the OS (64 Linux, 128 Windows, 255 network devices) minus hops |
| \`Request timed out.\` | no reply: host down, firewall drops ICMP, or the return path is broken |
| \`Destination host unreachable.\` from your own IP | ARP failed on the local subnet |
| \`Destination host unreachable.\` from a router | the router has no route or ARP failed on the far side |
| \`PING: transmit failed. General failure.\` | no usable IP/gateway on this host |
| \`Ping request could not find host\` | DNS failed |

**The classic sequence** (bottom-up, stop at the first failure):
1. \`ping 127.0.0.1\` – TCP/IP stack OK?
2. \`ping <own IP>\` – NIC OK?
3. \`ping <gateway>\` – local LAN and router OK?
4. \`ping 8.8.8.8\` – Internet routing and NAT OK?
5. \`ping google.com\` – DNS OK?

:::warn
Many servers and firewalls block ICMP. "No ping reply" alone does not prove a host is down – test the actual service port with \`Test-NetConnection host -Port 443\` or \`nc -zv host 443\`.
:::` },
      { type: 'text', title: 'Find the path: tracert / traceroute', md: `\`tracert\` (Windows) and \`traceroute\` (Linux) send probes with TTL 1, 2, 3… Each router that drops a probe returns *Time Exceeded*, revealing its address, until the destination answers.

\`\`\`
C:\\> tracert 8.8.8.8
  1    <1 ms    192.168.1.1        your gateway
  2     8 ms    100.64.0.1         ISP (carrier NAT)
  3    12 ms    203.0.113.1        ISP core
  ...
  9    14 ms    8.8.8.8            destination
\`\`\`
Rows of \`* * *\` mean a hop did not answer (common for firewalls) – if later hops reply, the path is fine. If the trace stops at a hop and never recovers, the break is **after** that hop. Rising latency at one hop that persists afterwards is a slow link.` },
      { type: 'check', question: { type: 'mcq', q: 'ping 8.8.8.8 works but ping google.com says "could not find host". Which command do you run next?', options: ['ipconfig /release', 'nslookup google.com', 'arp -d *', 'tracert 8.8.8.8'], answer: 1, explain: 'IP connectivity is fine; test name resolution directly.' } },
      { type: 'text', title: 'Query DNS: nslookup and dig', md: `\`\`\`
nslookup www.corp.local            ask the default DNS server
nslookup www.corp.local 8.8.8.8    ask a specific server (compare answers!)
dig www.corp.local                 Linux; detailed sections and flags
dig +short www.corp.local          just the answer
dig @8.8.8.8 example.com MX        record type and server
\`\`\`
Interpreting results:
- **Timeout** → the DNS server is unreachable (wrong address, firewall, service down).
- **NXDOMAIN / Non-existent domain** → the server works but has no such name (typo, missing record, wrong search suffix).
- **Different answers from different servers** → stale cache or a split-horizon setup.
- **Non-authoritative answer** → the resolver answered from cache or recursion; normal for public names.` },
      { type: 'text', title: 'Connections and neighbours', md: `\`\`\`
netstat -ano          (Windows) connections + PIDs; -r shows the routing table
ss -tuln / ss -tulpn  (Linux) listening sockets
arp -a                (Windows) ARP cache          ip neigh (Linux)
route print           (Windows) routing table      ip route (Linux)
getmac                (Windows) MAC addresses
Test-NetConnection host -Port 443   (PowerShell) TCP port test with route info
nc -zv host 443 / curl -I https://host   (Linux) port and HTTP tests
\`\`\`
Suspicious ARP entries (two IPs with one MAC), unknown listening ports, or connections to strange addresses are also the first things a security analyst looks at – the same commands serve both roles.` },
      { type: 'check', question: { type: 'command', q: 'Type the Windows command that shows the full IP configuration including MAC and DHCP server.', answer: ['^ipconfig\\s+/all$'], display: 'ipconfig /all', explain: 'ipconfig /all lists every detail per adapter.' } }
    ],
    assessment: { pass: 70, questions: [
      { type: 'command', q: 'Which Linux command displays the routing table (modern syntax)?', answer: ['^ip\\s+(r|route)(\\s+show)?$'], display: 'ip route', explain: 'ip route (short: ip r).', topic: 'commands' },
      { type: 'mcq', q: 'ping replies show TTL=128. The target is most likely:', options: ['A Linux server', 'A Windows host', 'A Cisco router', 'Unreachable'], answer: 1, explain: 'Windows starts TTL at 128, Linux at 64, network devices at 255.', topic: 'ping' },
      { type: 'mcq', q: 'Which command clears the DNS resolver cache on Windows?', options: ['ipconfig /renew', 'ipconfig /flushdns', 'netstat -r', 'arp -d'], answer: 1, explain: 'ipconfig /flushdns.', topic: 'commands' },
      { type: 'mcq', q: 'tracert shows replies for hops 1–3 and then "* * *" for every remaining hop, never reaching the destination. Where is the problem most likely?', options: ['Hop 1', 'Beyond hop 3', 'The local DNS server', 'The user\'s keyboard'], answer: 1, explain: 'The path is good up to hop 3; the break (or a firewall dropping everything) is after it.', topic: 'traceroute' },
      { type: 'command', q: 'Type the Linux command that lists listening TCP and UDP sockets numerically.', answer: ['^ss\\s+-[tulnp]{3,5}$', '^netstat\\s+-[tulnpa]{3,6}$'], display: 'ss -tuln', explain: 'ss -tuln (or netstat -tuln).', topic: 'commands' },
      { type: 'mcq', q: 'In the standard ping sequence, which step tests whether the local router is reachable?', options: ['ping 127.0.0.1', 'ping the default gateway', 'ping 8.8.8.8', 'ping google.com'], answer: 1, explain: 'The gateway is the first hop off the LAN.', topic: 'ping' },
      { type: 'mcq', q: 'nslookup returns "DNS request timed out". What does this indicate?', options: ['The name does not exist', 'The DNS server could not be reached', 'The web server is down', 'The gateway is wrong'], answer: 1, explain: 'A timeout is a reachability problem; NXDOMAIN would be a missing name.', topic: 'DNS' },
      { type: 'tf', q: 'If a server does not answer ping, it is definitely offline.', answer: false, explain: 'ICMP is often blocked; test the service port instead.', topic: 'ping' }
    ] },
    practical: { type: 'terminal', id: 'term-01-ipconfig', title: 'Inspect configuration and troubleshoot with the terminal' }, cert: ['netplus:5.5', 'linux:cli'], refs: [{ title: 'Microsoft Learn: ipconfig', url: 'https://learn.microsoft.com/windows-server/administration/windows-commands/ipconfig' }, { title: 'Linux man page: ip(8)', url: 'https://man7.org/linux/man-pages/man8/ip.8.html' }]
  });

  L.push({
    id: 'l1-net-15-wifi', level: 1, track: 'networking', order: 15, title: 'Introduction to Wi-Fi and Wireless Networking', summary: 'How 802.11 works: SSIDs, channels, frequencies, standards and the basics of securing a wireless LAN.', minutes: 25, skills: { networking: 3, security: 1 }, prereqs: ['l1-net-05-devices'],
    objectives: ['Explain SSIDs, BSSIDs, channels and frequency bands', 'Compare Wi-Fi standards and their real-world speeds', 'Describe how a client associates and authenticates', 'Troubleshoot common wireless problems (interference, coverage, wrong passphrase)'],
    sections: [
      { type: 'text', title: 'Radio basics', md: `Wi-Fi (IEEE **802.11**) carries Ethernet-style frames over radio. An **access point (AP)** advertises a network name, the **SSID**, in beacon frames. Each AP radio has a **BSSID** (its MAC address). Several APs can share one SSID so clients roam between them (an **ESS**).

**Frequency bands**

| Band | Channels | Range / penetration | Interference | Speed |
| --- | --- | --- | --- | --- |
| 2.4 GHz | 1–13 (only 1, 6, 11 do not overlap) | longer, goes through walls | microwaves, Bluetooth, neighbours | lower |
| 5 GHz | many non-overlapping (36–165) | shorter | less | higher |
| 6 GHz (Wi-Fi 6E/7) | very many | shortest | least | highest |

Only one device transmits at a time on a channel (**CSMA/CA** – listen, wait, send). More clients on an AP = less airtime each. Overlapping channels on neighbouring APs cause collisions and retransmissions – the most common cause of "slow Wi-Fi" in offices.` },
      { type: 'demo', title: 'Interactive: 2.4 GHz channel planner', demo: 'wifi-channels', md: 'Place three access points on channels and see which combinations overlap.' },
      { type: 'text', title: 'Standards', md: `| Standard | Marketing name | Band | Max theoretical | Year |
| --- | --- | --- | --- | --- |
| 802.11n | Wi-Fi 4 | 2.4/5 GHz | 600 Mbps | 2009 |
| 802.11ac | Wi-Fi 5 | 5 GHz | 3.5 Gbps | 2013 |
| 802.11ax | Wi-Fi 6 / 6E | 2.4/5/6 GHz | 9.6 Gbps | 2019/2021 |
| 802.11be | Wi-Fi 7 | 2.4/5/6 GHz | 46 Gbps | 2024 |

Real throughput is typically a third to a half of the headline figure, shared by everyone on the channel. Wider channels (40/80/160 MHz) are faster but overlap more.` },
      { type: 'text', title: 'Joining a network', md: `1. **Scan** – the client listens for beacons or probes for a known SSID.
2. **Authenticate / associate** – the client requests to join the BSSID.
3. **Security handshake** – with WPA2/WPA3-Personal the client proves it knows the **passphrase** (PSK) through a 4-way handshake that also derives per-session encryption keys. With WPA2/3-**Enterprise**, the client authenticates to a RADIUS server (802.1X, usually with a username/password or certificate).
4. **DHCP** – now a normal LAN client.

Wrong passphrase → "cannot connect"/"authentication failed" before any IP is assigned. Right passphrase but no IP → the AP's wired side or DHCP is the problem.

| Security option | Status |
| --- | --- |
| Open / no encryption | anyone can read traffic – avoid; captive portals do not encrypt |
| WEP | broken in minutes – never |
| WPA (TKIP) | deprecated |
| WPA2-AES (CCMP) | acceptable minimum |
| WPA3 | current standard; resists offline passphrase cracking (SAE) |

Hidden SSIDs and MAC filtering are *not* security: both are trivially bypassed. A strong passphrase (or 802.1X) and WPA2/WPA3 are what matter. Keep guests on a **separate SSID/VLAN** so visitors never touch the internal network.` },
      { type: 'check', question: { type: 'mcq', q: 'Three APs in one office are set to 2.4 GHz channels 1, 3 and 6. Which is the problem?', options: ['Channel 1 is illegal', 'Channels 1 and 3 overlap; use 1, 6 and 11', 'Three APs are too many', 'There is no problem'], answer: 1, explain: 'Only channels 1, 6 and 11 are non-overlapping in 2.4 GHz.' } },
      { type: 'text', title: 'Troubleshooting wireless', md: `| Symptom | Likely cause | Check |
| --- | --- | --- |
| cannot see the SSID | out of range, 5 GHz-only network on a 2.4 GHz-only device, hidden SSID | move closer, check bands |
| cannot connect / auth failed | wrong passphrase, WPA3-only AP with old client, MAC filter | re-enter PSK, check AP security mode |
| connected, no Internet | DHCP (APIPA), captive portal, AP uplink down | ipconfig, ping gateway |
| slow or dropping | interference, channel overlap, too many clients, weak signal (< −70 dBm) | signal strength, channel scan, move AP |
| works near AP only | coverage gap, wall attenuation | add AP / mesh node, adjust power |

Signal strength is reported in **dBm**: −30 excellent, −67 good for VoIP/video, −70 acceptable, −80 unreliable.` }
    ],
    assessment: { pass: 70, questions: [
      { type: 'mcq', q: 'Which 2.4 GHz channels do not overlap?', options: ['1, 2, 3', '1, 6, 11', '2, 7, 12', '5, 10, 13'], answer: 1, explain: 'Channels are 5 MHz apart but 20 MHz wide; 1, 6 and 11 are the non-overlapping set.', topic: 'Wi-Fi' },
      { type: 'mcq', q: 'The name a Wi-Fi network broadcasts is the:', options: ['BSSID', 'SSID', 'MAC', 'ESSID key'], answer: 1, explain: 'SSID = Service Set Identifier; the BSSID is the AP radio\'s MAC.', topic: 'Wi-Fi' },
      { type: 'mcq', q: 'Which wireless security option is currently recommended?', options: ['WEP', 'WPA (TKIP)', 'WPA3 (or WPA2-AES minimum)', 'Open with hidden SSID'], answer: 2, explain: 'WPA3 is current; WPA2-AES is the acceptable minimum.', topic: 'security' },
      { type: 'tf', q: 'Hiding the SSID is an effective security control.', answer: false, explain: 'The SSID is visible in probe/association frames; hiding it only inconveniences users.', topic: 'security' },
      { type: 'mcq', q: 'A laptop connects to Wi-Fi but gets 169.254.10.5. The problem is most likely:', options: ['Wrong passphrase', 'DHCP not reachable through the AP', 'The 5 GHz band', 'A hidden SSID'], answer: 1, explain: 'Association succeeded; the DHCP exchange failed.', topic: 'troubleshooting' },
      { type: 'mcq', q: 'Which band generally offers higher speed but shorter range?', options: ['2.4 GHz', '5 GHz', 'Both the same', '900 MHz'], answer: 1, explain: 'Higher frequencies carry more data but attenuate faster.', topic: 'Wi-Fi' },
      { type: 'mcq', q: 'WPA2-Enterprise authenticates users with:', options: ['A shared passphrase', 'A RADIUS server via 802.1X', 'MAC filtering', 'WEP keys'], answer: 1, explain: 'Enterprise mode uses 802.1X/RADIUS with per-user credentials or certificates.', topic: 'security' }
    ] },
    practical: { type: 'netsim', id: 'sim-06-wifi', title: 'Connect a laptop to an access point with the correct passphrase' }, cert: ['netplus:2.3', 'ccna:1.11'], refs: [{ title: 'Wi-Fi Alliance: Security', url: 'https://www.wi-fi.org/discover-wi-fi/security' }]
  });

  NSA.data.lessons = NSA.data.lessons.concat(L);
})(typeof globalThis !== 'undefined' ? globalThis : window);
