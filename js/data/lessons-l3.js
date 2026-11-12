/* NetSec Academy – Level 3 (Expert) lessons: professional networking */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  NSA.data = NSA.data || {}; NSA.data.lessons = NSA.data.lessons || [];
  const L = [];

  L.push({ id: 'l3-net-01-architecture', level: 3, track: 'networking', order: 1, title: 'Enterprise Network Architecture and High Availability', summary: 'The three-tier and spine-leaf models, redundancy at every layer, and how to design networks that survive failures.', minutes: 35, skills: { networking: 4, netadmin: 4 }, prereqs: [],
    objectives: ['Describe the access/distribution/core hierarchy and spine-leaf', 'Design redundancy with link aggregation, FHRP and dual uplinks', 'Explain network segmentation for security and performance', 'Identify and remove single points of failure'],
    sections: [
      { type: 'text', title: 'Hierarchical campus design', md: `Enterprise campuses use a **three-tier** model so the network scales and faults stay local:

- **Access layer** — where end devices connect; access ports, VLANs, PoE, port security, 802.1X. Cheap, numerous switches.
- **Distribution layer** — aggregates access switches; Layer 3 boundary (inter-VLAN routing, first-hop redundancy, ACLs, QoS policy). Deployed in redundant pairs.
- **Core layer** — high-speed backbone connecting distribution blocks and the data centre/WAN edge; does little policy, just forwards fast.

Small sites **collapse** core and distribution into one tier. Data centres increasingly use **spine-leaf** (every leaf connects to every spine) for predictable, low-latency east-west traffic — every server is two hops from any other, and capacity scales by adding spines.` },
      { type: 'text', title: 'Redundancy', md: `High availability removes single points of failure at each layer:

- **Link aggregation (LACP / EtherChannel)** bundles several physical links into one logical link for bandwidth and failover.
- **Dual uplinks** from each access switch to two distribution switches; loops are managed by **Rapid PVST+** or avoided with **MLAG/stacking/VSS** so both uplinks forward.
- **First-Hop Redundancy Protocols** — **HSRP/VRRP/GLBP** give hosts a virtual gateway IP shared by two routers; if one fails the other takes over in seconds, transparently.
- **Routing redundancy** — multiple paths via OSPF/EIGRP with fast convergence (BFD for sub-second detection).
- **Hardware** — redundant power supplies, supervisors, and separate power feeds.
- **Site** — dual ISPs (BGP), and a disaster-recovery site.

Design metric: **no single device, link, or power feed failure should take down a user population.** Draw the topology and ask "what if this fails?" at every element.` },
      { type: 'text', title: 'Segmentation', md: `Segmentation limits both broadcast scope and attack blast radius. Techniques: VLANs per function, Layer 3 boundaries with ACLs between segments, separate zones (user, server, DMZ, guest, IoT, OT/industrial, management), and **micro-segmentation** (per-workload policy) in data centres and zero-trust designs.

Rules of thumb: put servers, users, guests, IoT and management in **separate** segments; never let user VLANs reach device-management interfaces; default-deny between segments and permit only required flows; keep critical systems (domain controllers, backups) in tightly controlled zones. Segmentation is the control that most often limits how far ransomware or an intruder can spread.` },
      { type: 'check', question: { type: 'mcq', q: 'Which protocol gives hosts a redundant default gateway so failover is transparent?', options: ['OSPF', 'HSRP/VRRP', 'LACP', 'STP'], answer: 1, explain: 'First-Hop Redundancy Protocols share a virtual gateway IP between two routers.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'Which layer is the Layer 3 boundary and policy enforcement point in the three-tier model?', options: ['Access', 'Distribution', 'Core', 'Edge'], answer: 1, explain: 'Distribution aggregates access and applies routing/ACL/QoS.', topic: 'architecture' },
      { type: 'mcq', q: 'Spine-leaf is preferred in data centres because it optimizes:', options: ['North-south traffic only', 'Predictable low-latency east-west traffic', 'Wireless coverage', 'WAN cost'], answer: 1, explain: 'Every leaf is equidistant from every other via the spine.', topic: 'architecture' },
      { type: 'mcq', q: 'LACP is used to:', options: ['Elect a root bridge', 'Bundle links into one logical link', 'Assign IP addresses', 'Encrypt traffic'], answer: 1, explain: 'Link Aggregation Control Protocol.', topic: 'HA' },
      { type: 'mcq', q: 'HSRP provides redundancy for the:', options: ['DNS server', 'Default gateway', 'DHCP scope', 'WAN link only'], answer: 1, explain: 'A virtual gateway IP shared between routers.', topic: 'HA' },
      { type: 'mcq', q: 'The strongest reason to segment the network into zones is to:', options: ['Increase bandwidth', 'Limit broadcast scope and contain breaches', 'Reduce cabling', 'Avoid DHCP'], answer: 1, explain: 'Segmentation limits blast radius and broadcasts.', topic: 'segmentation' },
      { type: 'mcq', q: 'Which pairing provides sub-second failure detection for routing?', options: ['STP + VTP', 'OSPF + BFD', 'NAT + PAT', 'DNS + DHCP'], answer: 1, explain: 'Bidirectional Forwarding Detection speeds convergence.', topic: 'HA' },
      { type: 'tf', q: 'Management interfaces of switches should be reachable from the user VLAN for convenience.', answer: false, explain: 'Management must be isolated in its own segment.', topic: 'segmentation' }
    ] }, practical: { type: 'netsim', id: 'sim-13-enterprise', title: 'Design a redundant campus network' }, cert: ['ccna:1.2', 'netplus:1.6'], refs: [] });

  L.push({ id: 'l3-net-02-routing', level: 3, track: 'networking', order: 2, title: 'Advanced Routing: OSPF Areas and BGP Fundamentals', summary: 'Scaling OSPF with areas, route summarization and redistribution, and how BGP connects autonomous systems.', minutes: 35, skills: { networking: 5, netadmin: 3 }, prereqs: ['l3-net-01-architecture'],
    objectives: ['Design multi-area OSPF and explain area types', 'Summarize and redistribute routes safely', 'Explain BGP, autonomous systems and path selection', 'Troubleshoot route propagation problems'],
    sections: [
      { type: 'text', title: 'Scaling OSPF', md: `A single OSPF area floods every link-state change to every router — fine for dozens of routers, painful for hundreds. **Areas** partition the topology: routers inside an area share full detail; **Area Border Routers (ABRs)** summarize into **area 0 (backbone)**. Every area must touch the backbone.

Special areas reduce the database further: **stub** areas block external routes (use a default instead); **totally stubby** also block inter-area; **NSSA** allows limited external injection. Summarize on ABRs (\`area 1 range 10.1.0.0 255.255.0.0\`) so a flap inside an area does not ripple across the network — one of the biggest stability wins in large OSPF designs.

**Redistribution** shares routes between protocols (OSPF ↔ static ↔ BGP). It is powerful and dangerous: watch for routing loops and suboptimal paths, always set a sane **metric** and use route filtering/tags to control what crosses the boundary.` },
      { type: 'text', title: 'BGP fundamentals', md: `**BGP** is the routing protocol **between** organizations — it glues the Internet together. Each network is an **Autonomous System (AS)** with a number; BGP exchanges reachability of IP prefixes between AS peers over TCP 179.

- **eBGP** runs between different ASes (you ↔ your ISP); **iBGP** within one AS.
- BGP is a **path-vector** protocol: it carries the list of ASes a route traversed (AS-PATH), which prevents loops and informs policy.
- **Path selection** is policy-driven, not just shortest: highest **weight/local preference**, shortest **AS-PATH**, origin, lowest **MED**, eBGP over iBGP, and tie-breakers. Operators shape traffic with these attributes.
- **Use cases**: multi-homing to two ISPs for redundancy, enterprise-to-cloud connectivity, and the global routing table (~1 million prefixes).

BGP's trust model is weak by design — mis-announced prefixes (route leaks/hijacks) have caused major outages. **RPKI** origin validation is the growing defence.` },
      { type: 'text', title: 'Troubleshooting propagation', md: `When a route does not appear where expected:
1. Is it in the origin router's table and actually advertised (correct \`network\` statement / redistribution)?
2. Neighbor relationship up (\`show ip ospf neighbor\`, \`show ip bgp summary\`)?
3. Filtered somewhere — distribute-lists, prefix-lists, route-maps, stub-area rules?
4. Summarization hiding or black-holing it?
5. Administrative distance causing another protocol's route to win?

\`show ip route\`, \`show ip protocols\`, \`show ip ospf database\`, \`show ip bgp\` are the tools. Change one thing at a time and re-check.` },
      { type: 'check', question: { type: 'mcq', q: 'Every non-backbone OSPF area must connect to:', options: ['Area 1', 'Area 0 (the backbone)', 'The ISP', 'A stub router'], answer: 1, explain: 'All areas attach to area 0, directly or via virtual links.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'A router connecting an OSPF area to the backbone is a(n):', options: ['ASBR', 'ABR', 'DR', 'BDR'], answer: 1, explain: 'Area Border Router sits between an area and area 0.', topic: 'OSPF' },
      { type: 'mcq', q: 'Summarizing routes on an ABR primarily improves:', options: ['Security', 'Stability — flaps do not propagate network-wide', 'Encryption', 'DNS'], answer: 1, explain: 'Summaries hide internal instability.', topic: 'OSPF' },
      { type: 'mcq', q: 'BGP runs between organizations using the concept of:', options: ['VLANs', 'Autonomous Systems', 'Collision domains', 'Subnets only'], answer: 1, explain: 'Each AS has a number; eBGP peers across them.', topic: 'BGP' },
      { type: 'mcq', q: 'BGP is best described as a:', options: ['Link-state protocol', 'Distance-vector protocol', 'Path-vector protocol', 'Spanning-tree protocol'], answer: 2, explain: 'It carries the AS-PATH.', topic: 'BGP' },
      { type: 'mcq', q: 'A common real-world use of BGP in enterprises is:', options: ['Assigning IPs to PCs', 'Multi-homing to two ISPs for redundancy', 'Replacing DHCP', 'VLAN tagging'], answer: 1, explain: 'Dual-ISP resilience and traffic engineering.', topic: 'BGP' },
      { type: 'mcq', q: 'Redistribution between protocols risks:', options: ['Nothing', 'Routing loops and suboptimal paths if unfiltered', 'Faster convergence always', 'Disabling OSPF'], answer: 1, explain: 'Control it with metrics, tags and filters.', topic: 'routing' },
      { type: 'tf', q: 'BGP always chooses the shortest physical path.', answer: false, explain: 'BGP path selection is policy-driven (weight, local preference, AS-PATH…).', topic: 'BGP' }
    ] }, practical: { type: 'netsim', id: 'sim-15-ospf', title: 'Build a multi-area routed network' }, cert: ['ccna:3.4', 'netplus:2.1'], refs: [] });

  L.push({ id: 'l3-net-03-firewalls', level: 3, track: 'networking', order: 3, title: 'Enterprise Firewalls, NAC and Zero Trust', summary: 'Next-generation firewalls, zones and policy design, network access control, and the zero-trust model.', minutes: 30, skills: { netadmin: 3, security: 4 }, prereqs: ['l2-net-08-acls'],
    objectives: ['Design zone-based firewall policy for an enterprise', 'Explain NGFW capabilities beyond ports and addresses', 'Describe Network Access Control (802.1X) posture checks', 'Explain the zero-trust architecture and its building blocks'],
    sections: [
      { type: 'text', title: 'Zone-based policy', md: `Enterprise firewalls group interfaces into **zones** by trust level (inside/trust, outside/untrust, DMZ, guest, management, partner) and write policy **between zones**. Rules are explicit, logged and reviewed; the default between zones is **deny**.

Design principles: default-deny both inbound and outbound; place public services in a **DMZ** reachable from outside on specific ports and from inside for management only; restrict server outbound to what it needs (catching C2/exfiltration); separate management; log allow and deny; and keep the rule base clean — remove "temporary any-any" rules and stale objects, which are the top audit findings.` },
      { type: 'text', title: 'Next-generation firewalls', md: `An **NGFW** inspects beyond ports and addresses:
- **Application identification** — recognizes the actual app regardless of port (blocks tunnelling over 443).
- **User identity** — policy by user/group (via AD), not just IP.
- **Intrusion Prevention (IPS)** — signatures block known exploits inline.
- **TLS inspection** — decrypts, inspects, re-encrypts (with privacy and performance trade-offs).
- **URL/DNS filtering and threat intelligence** — block known-bad destinations.
- **Sandboxing** — detonate unknown files.

These add visibility and control but also complexity and failure modes; tune carefully and monitor performance.` },
      { type: 'text', title: 'NAC and Zero Trust', md: `**Network Access Control (NAC)** decides whether a device may join the network: **802.1X** authenticates the device/user at the switch port or AP, and **posture checks** verify health (patched, AV running, disk encrypted) before granting access — non-compliant devices land in a remediation VLAN. This stops unmanaged and rogue devices.

**Zero Trust** abandons "trusted inside, untrusted outside". Core tenets: **never trust, always verify**; authenticate and authorize **every** request based on identity, device posture and context; grant **least-privilege** access to specific resources (not the whole network); assume breach and **micro-segment** so a compromised host cannot roam. Building blocks: strong identity + MFA, device trust, policy engine/enforcement points (ZTNA replacing broad VPN access), micro-segmentation, and pervasive logging. It is a strategy implemented over years, not a product you buy.` },
      { type: 'check', question: { type: 'mcq', q: 'A laptop fails its posture check (no disk encryption, outdated AV) when connecting via 802.1X. A well-designed NAC will:', options: ['Grant full access anyway', 'Place it in a restricted remediation VLAN', 'Shut down the switch', 'Delete the laptop\'s account'], answer: 1, explain: 'NAC quarantines non-compliant devices until they are remediated.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'Public web servers reachable from the Internet belong in the:', options: ['Inside zone', 'DMZ', 'Management zone', 'Guest VLAN'], answer: 1, explain: 'The DMZ isolates public services from the internal LAN.', topic: 'firewalls' },
      { type: 'mcq', q: 'An NGFW capability that a traditional firewall lacks is:', options: ['Blocking by port', 'Application identification regardless of port', 'Routing', 'NAT'], answer: 1, explain: 'App-ID is a hallmark of NGFWs.', topic: 'firewalls' },
      { type: 'mcq', q: '802.1X posture assessment checks:', options: ['Link speed', 'Device health before granting access', 'DNS records', 'Cable length'], answer: 1, explain: 'Posture verifies patching, AV, encryption, etc.', topic: 'NAC' },
      { type: 'mcq', q: 'The core principle of zero trust is:', options: ['Trust the internal network', 'Never trust, always verify every request', 'Use one strong firewall', 'Disable MFA inside'], answer: 1, explain: 'Verification regardless of location.', topic: 'zero trust' },
      { type: 'mcq', q: 'ZTNA typically replaces:', options: ['DHCP', 'Broad VPN network access with per-application access', 'DNS', 'Switching'], answer: 1, explain: 'Zero Trust Network Access grants resource-specific access.', topic: 'zero trust' },
      { type: 'mcq', q: 'The most common firewall audit finding is:', options: ['Too few rules', 'Stale/overly broad "any-any" rules left in place', 'No DMZ ever', 'Encryption enabled'], answer: 1, explain: 'Rule hygiene matters.', topic: 'firewalls' },
      { type: 'tf', q: 'Micro-segmentation supports zero trust by limiting lateral movement.', answer: true, explain: 'Per-workload policy contains a compromised host.', topic: 'zero trust' }
    ] }, practical: { type: 'netsim', id: 'sim-12-firewall-dmz', title: 'Build a firewall policy with a DMZ' }, cert: ['secplus:3.2', 'netplus:4.1'], refs: [{ title: 'NIST SP 800-207 Zero Trust Architecture', url: 'https://csrc.nist.gov/pubs/sp/800/207/final' }] });

  L.push({ id: 'l3-net-04-cloud', level: 3, track: 'networking', order: 4, title: 'Cloud Networking (AWS, Azure, GCP)', summary: 'Virtual networks, subnets, security groups, gateways and hybrid connectivity across the major cloud providers.', minutes: 30, skills: { cloud: 5, networking: 2 }, prereqs: [],
    objectives: ['Map on-prem concepts to cloud virtual networks', 'Explain subnets, route tables and gateways in the cloud', 'Compare security groups and network ACLs', 'Describe hybrid connectivity options'],
    sections: [
      { type: 'text', title: 'Virtual networks', md: `Each provider gives you a private virtual network you fully control:

| Concept | AWS | Azure | GCP |
| --- | --- | --- | --- |
| Virtual network | VPC | VNet | VPC |
| Subnet | Subnet (per AZ) | Subnet | Subnet (regional) |
| Instance firewall | Security Group | NSG | Firewall rules |
| Subnet firewall | Network ACL | NSG (subnet) | — |
| Internet access | Internet Gateway + route | — | Cloud NAT / external IP |
| Private egress | NAT Gateway | NAT Gateway | Cloud NAT |
| Routing | Route Tables | Route Tables/UDR | Routes |

You choose the CIDR (e.g. 10.0.0.0/16), carve subnets (often public vs private), and attach gateways. **Availability Zones/regions** give geographic redundancy — spread subnets across AZs for resilience.` },
      { type: 'text', title: 'Security groups vs network ACLs', md: `- **Security groups** (AWS SG, Azure NSG, GCP firewall rules) are **stateful** and attach to instances/NICs: allow rules only; return traffic is automatic. This is the primary control.
- **Network ACLs** (AWS) are **stateless** and attach to subnets: allow and deny, evaluated in order, and you must permit return traffic explicitly. Used as a coarse subnet-level backstop.

Best practice: default deny, least privilege, reference other security groups instead of IP ranges where possible, and avoid 0.0.0.0/0 on management ports (SSH/RDP) — exposed cloud management ports are a leading breach cause. The **shared responsibility model** means the provider secures the infrastructure; **you** secure your network configuration, identity and data.` },
      { type: 'text', title: 'Hybrid connectivity', md: `Connecting cloud to on-prem:
- **Site-to-site VPN** over the Internet (IPsec) — quick, encrypted, bandwidth-limited.
- **Dedicated interconnect** (AWS Direct Connect, Azure ExpressRoute, GCP Interconnect) — private, high-bandwidth, low-latency circuits.
- **VPC/VNet peering** connects cloud networks; **Transit Gateway/Virtual WAN/Network Connectivity Center** build hub-and-spoke across many networks and accounts.
- **Private endpoints** reach provider services (storage, databases) without traversing the Internet.

Watch for **overlapping CIDRs** between cloud and on-prem (plan address space centrally), asymmetric routing, and DNS integration (resolve on-prem and cloud names both ways).` },
      { type: 'check', question: { type: 'mcq', q: 'Which cloud control is stateful and attached to an instance?', options: ['Network ACL', 'Security group / NSG', 'Route table', 'Internet gateway'], answer: 1, explain: 'Security groups are stateful; return traffic is automatic.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'The AWS equivalent of an on-prem private network is a:', options: ['VNet', 'VPC', 'Subnet', 'NSG'], answer: 1, explain: 'Virtual Private Cloud.', topic: 'cloud' },
      { type: 'mcq', q: 'Security groups differ from AWS network ACLs in that they are:', options: ['Stateless', 'Stateful and allow-only', 'Attached to subnets', 'Deny-only'], answer: 1, explain: 'SGs are stateful instance-level allow rules.', topic: 'cloud' },
      { type: 'mcq', q: 'Under the shared responsibility model, the customer is responsible for:', options: ['Physical data-centre security', 'Their network config, identity and data', 'The hypervisor', 'The power supply'], answer: 1, explain: 'Provider secures infrastructure; customer secures their configuration.', topic: 'cloud' },
      { type: 'mcq', q: 'A private, high-bandwidth circuit from on-prem to Azure is:', options: ['VPN', 'ExpressRoute', 'Internet Gateway', 'NSG'], answer: 1, explain: 'Azure ExpressRoute (AWS Direct Connect, GCP Interconnect).', topic: 'hybrid' },
      { type: 'mcq', q: 'A leading cause of cloud breaches is:', options: ['Too many subnets', 'Management ports (SSH/RDP) exposed to 0.0.0.0/0', 'Using private IPs', 'Enabling encryption'], answer: 1, explain: 'Exposed management is heavily scanned and attacked.', topic: 'cloud' },
      { type: 'mcq', q: 'Overlapping CIDRs between cloud and on-prem cause:', options: ['Faster routing', 'Routing/connectivity failures across the hybrid link', 'Better security', 'Nothing'], answer: 1, explain: 'Plan non-overlapping address space.', topic: 'hybrid' },
      { type: 'tf', q: 'Private endpoints let you reach cloud services without going over the public Internet.', answer: true, explain: 'They keep traffic on the provider backbone.', topic: 'cloud' }
    ] }, practical: null, cert: ['netplus:1.8', 'secplus:3.1'], refs: [] });

  L.push({ id: 'l3-net-05-automation', level: 3, track: 'networking', order: 5, title: 'Network Automation with Python', summary: 'Why automate, the tooling landscape, and reading/writing simple Python scripts for network tasks.', minutes: 30, skills: { automation: 5, linux: 1 }, prereqs: [],
    objectives: ['Explain the benefits and risks of automation', 'Describe the automation toolchain (APIs, SSH, IaC, config management)', 'Read a simple Python network script', 'Use idempotency and version control for configurations'],
    sections: [
      { type: 'text', title: 'Why automate', md: `Manual configuration does not scale and is error-prone: a typo on one of 200 switches causes an outage; audits require consistency; changes must be fast and reversible. Automation delivers **consistency, speed, scale and auditability** — the same change applied identically everywhere, tracked in version control, reviewable before deployment.

Risks: automation applies mistakes just as fast as fixes (test first, stage rollouts, have rollback), and it concentrates power (protect the automation credentials and pipeline). Treat network configs as **code**: store in git, peer-review changes, and deploy through a pipeline.` },
      { type: 'text', title: 'The toolchain', md: `- **APIs** — modern devices expose REST/RESTCONF/NETCONF (YANG models) and gNMI; cloud uses provider SDKs. Structured data (JSON/XML) beats scraping CLI text.
- **Python libraries** — \`netmiko\` and \`paramiko\` (SSH to CLI devices), \`napari/napalm\` (NAPALM: multi-vendor abstraction), \`requests\` (REST), \`ncclient\` (NETCONF), \`pyATS\`/Nornir (frameworks).
- **Configuration management / IaC** — **Ansible** (agentless, YAML playbooks, huge network module set), **Terraform** (declarative cloud/infra), templated configs with **Jinja2**.
- **Source of truth** — NetBox/IPAM feeding templates so intent lives in one place.

**Idempotency** is key: running the same automation twice should leave the device in the same desired state, not append duplicate config. Declarative tools enforce this.` },
      { type: 'text', title: 'Reading a script', md: `A typical netmiko snippet pushes config to several devices:

\`\`\`python
from netmiko import ConnectHandler

devices = [
    {"device_type": "cisco_ios", "host": "10.0.0.1", "username": "admin", "password": PW},
    {"device_type": "cisco_ios", "host": "10.0.0.2", "username": "admin", "password": PW},
]
commands = ["ntp server 10.0.0.250", "logging host 10.0.0.240"]

for dev in devices:
    with ConnectHandler(**dev) as conn:
        output = conn.send_config_set(commands)
        conn.save_config()
        print(f"{dev['host']} updated")
\`\`\`
You do not need to write this from scratch yet — but you should **read** it: it connects to each device, sends a list of config commands, saves, and reports. A REST example uses \`requests.get/put\` against an API endpoint and parses JSON. The automation lesson lab gives you small scripts to predict the output of and modify.` },
      { type: 'check', question: { type: 'mcq', q: 'Why does "idempotency" matter in network automation?', options: ['It encrypts the config', 'Running the automation repeatedly converges to the same desired state without duplicating config', 'It speeds up SSH', 'It replaces version control'], answer: 1, explain: 'Idempotent automation is safe to re-run and describes desired state.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'The main benefit of automation over manual config is:', options: ['Lower bandwidth', 'Consistency, speed and auditability at scale', 'Encryption', 'Fewer devices'], answer: 1, explain: 'Repeatable, reviewable, consistent change.', topic: 'automation' },
      { type: 'mcq', q: 'Which Python library connects to CLI devices over SSH?', options: ['requests', 'netmiko', 'flask', 'numpy'], answer: 1, explain: 'netmiko (built on paramiko) drives device CLIs.', topic: 'tools' },
      { type: 'mcq', q: 'An agentless, YAML-based tool widely used for network config management is:', options: ['Terraform', 'Ansible', 'Wireshark', 'nmap'], answer: 1, explain: 'Ansible playbooks with network modules.', topic: 'tools' },
      { type: 'mcq', q: 'Storing device configs in git provides:', options: ['Faster packets', 'Version history, review and rollback', 'Encryption of traffic', 'More bandwidth'], answer: 1, explain: 'Infrastructure as code benefits.', topic: 'automation' },
      { type: 'mcq', q: 'Structured APIs (NETCONF/RESTCONF) are preferred over CLI scraping because:', options: ['They are slower', 'They return structured data that is reliable to parse', 'They need no credentials', 'They work only on hubs'], answer: 1, explain: 'JSON/XML beats brittle text parsing.', topic: 'tools' },
      { type: 'mcq', q: 'The biggest operational risk of automation is:', options: ['It is too slow', 'It applies mistakes everywhere just as fast as fixes', 'It cannot be reversed ever', 'It needs no testing'], answer: 1, explain: 'Test, stage and keep rollback paths.', topic: 'automation' },
      { type: 'tf', q: 'A declarative tool describes the desired end state rather than step-by-step commands.', answer: true, explain: 'Declarative IaC converges to desired state.', topic: 'automation' }
    ] }, practical: { type: 'terminal', id: 'term-17-python', title: 'Read and reason about network automation scripts' }, cert: ['ccna:6.0', 'netplus:3.0'], refs: [{ title: 'Netmiko documentation', url: 'https://github.com/ktbyers/netmiko' }] });

  L.push({ id: 'l3-net-06-performance', level: 3, track: 'networking', order: 6, title: 'Network Performance, Monitoring and Troubleshooting Complex Infrastructure', summary: 'QoS, capacity, baselining, and a structured methodology for diagnosing hard problems across a large network.', minutes: 30, skills: { netadmin: 4, networking: 2 }, prereqs: ['l2-net-10-monitoring'],
    objectives: ['Explain QoS marking, queuing and when it helps', 'Baseline and monitor performance proactively', 'Apply a structured troubleshooting methodology', 'Diagnose latency, loss and asymmetric-path problems'],
    sections: [
      { type: 'text', title: 'Performance factors and QoS', md: `Application experience depends on **bandwidth**, **latency**, **jitter** (latency variation) and **loss**. Real-time traffic (voice, video) tolerates little jitter or loss; bulk transfers care about throughput.

**Quality of Service** prioritizes traffic when links are congested: **classify and mark** at the edge (DSCP values — EF for voice, AF for video/business apps), then **queue** so marked traffic gets priority (LLQ/CBWFQ), and **police/shape** to contract rates. QoS does not create bandwidth; it decides who suffers when there is not enough. It only matters at congestion points (WAN links, Internet edge). Trust boundaries matter — re-mark untrusted traffic so users cannot claim priority.` },
      { type: 'text', title: 'Baselining and monitoring', md: `You cannot spot "abnormal" without a baseline of **normal**: typical utilization, latency, error rates, top talkers and flows per link and per time of day. Collect continuously (SNMP, flow, synthetic probes), store trends, and alert on deviation from baseline rather than only on fixed thresholds.

Watch interface **errors and discards** (duplex mismatch, bad optics/cables, oversubscription), **utilization** nearing saturation, **CPU/memory** on devices, and **flow anomalies** (new large talkers). Capacity planning uses these trends to upgrade before users feel pain.` },
      { type: 'text', title: 'Structured troubleshooting', md: `Complex problems need method, not guessing:
1. **Define the problem precisely** — who, what, when, scope, what changed. "Slow" is not a problem statement.
2. **Gather information** — reproduce, collect from both ends and the path (pings, traceroutes, captures, interface stats, logs).
3. **Form a hypothesis** using the OSI layers (bottom-up or divide-and-conquer at Layer 3).
4. **Test one change at a time**; document results; revert if it does not help.
5. **Escalate with evidence** when it crosses a boundary (ISP, application team).
6. **Verify and document** the fix and root cause.

Hard patterns: **asymmetric routing** (traffic takes different paths each way, breaking stateful firewalls), **MTU/fragmentation** black holes (large packets drop, small ones pass — PMTUD blocked), **intermittent loss** (one bad link in an aggregated bundle), and **DNS/dependency** failures masquerading as "network slow". Measure, isolate the segment, and compare working vs non-working to narrow the fault.` },
      { type: 'check', question: { type: 'mcq', q: 'Small pings succeed but large file transfers and some HTTPS sites hang. The most likely cause is:', options: ['DNS down', 'An MTU/fragmentation black hole (PMTUD blocked)', 'Wrong VLAN', 'DHCP exhaustion'], answer: 1, explain: 'Large packets dropped while small ones pass is the classic MTU/PMTUD signature.' } }
    ],
    assessment: { pass: 75, questions: [
      { type: 'mcq', q: 'Jitter is:', options: ['Total bandwidth', 'Variation in latency', 'Packet size', 'Number of hops'], answer: 1, explain: 'Latency variation, critical for voice/video.', topic: 'performance' },
      { type: 'mcq', q: 'QoS is useful specifically at:', options: ['Every link always', 'Congestion points where demand exceeds capacity', 'DNS servers', 'Idle links'], answer: 1, explain: 'It prioritizes only when there is contention.', topic: 'QoS' },
      { type: 'mcq', q: 'DSCP EF is typically used for:', options: ['Bulk backups', 'Voice traffic', 'Email', 'Web browsing'], answer: 1, explain: 'Expedited Forwarding for real-time voice.', topic: 'QoS' },
      { type: 'mcq', q: 'The first step in structured troubleshooting is:', options: ['Reboot everything', 'Define the problem precisely (scope, timing, what changed)', 'Replace the switch', 'Call the vendor'], answer: 1, explain: 'A precise problem statement guides everything else.', topic: 'troubleshooting' },
      { type: 'mcq', q: 'Rising interface discards most often indicate:', options: ['Good performance', 'Duplex mismatch, bad cabling, or oversubscription', 'Correct QoS', 'A DNS issue'], answer: 1, explain: 'Physical/capacity problems show as errors/discards.', topic: 'performance' },
      { type: 'mcq', q: 'Asymmetric routing most directly breaks:', options: ['Ping', 'Stateful firewalls expecting both directions', 'DNS', 'DHCP'], answer: 1, explain: 'State is not seen on the return path.', topic: 'troubleshooting' },
      { type: 'tf', q: 'A baseline of normal behaviour makes anomaly detection far more effective.', answer: true, explain: 'You must know normal to recognize abnormal.', topic: 'monitoring' }
    ] }, practical: { type: 'troubleshoot', id: 'ts-05-slow-network', title: 'Diagnose a complex performance problem' }, cert: ['netplus:5.1', 'ccna:5.0'], refs: [] });

  NSA.data.lessons = NSA.data.lessons.concat(L);
})(typeof globalThis !== 'undefined' ? globalThis : window);
