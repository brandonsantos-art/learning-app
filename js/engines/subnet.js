/* NetSec Academy – IPv4/IPv6 addressing engine (pure functions, unit tested) */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});

  function parseIPv4(str) {
    if (typeof str !== 'string') return null;
    const parts = str.trim().split('.');
    if (parts.length !== 4) return null;
    let n = 0;
    for (const p of parts) {
      if (!/^\d{1,3}$/.test(p)) return null;
      const v = Number(p);
      if (v > 255) return null;
      n = (n * 256) + v;
    }
    return n >>> 0;
  }
  function isValidIPv4(str) { return parseIPv4(str) !== null; }
  function intToIp(n) { n = n >>> 0; return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
  function cidrToMaskInt(bits) { bits = Number(bits); if (bits < 0 || bits > 32 || isNaN(bits)) return null; return bits === 0 ? 0 : ((0xFFFFFFFF << (32 - bits)) >>> 0); }
  function cidrToMask(bits) { const m = cidrToMaskInt(bits); return m === null ? null : intToIp(m); }
  function maskToCidr(mask) {
    const m = typeof mask === 'number' ? mask >>> 0 : parseIPv4(mask);
    if (m === null) return null;
    // must be contiguous ones followed by zeros
    const inv = (~m) >>> 0;
    if (((inv + 1) & inv) !== 0) return null;
    let bits = 0; let x = m;
    while (x & 0x80000000) { bits++; x = (x << 1) >>> 0; }
    return bits;
  }
  function isValidMask(str) { return maskToCidr(str) !== null; }
  function wildcard(maskStr) { const m = parseIPv4(maskStr); return m === null ? null : intToIp((~m) >>> 0); }

  // Accept "ip/24", ("ip", "255.255.255.0"), ("ip", 24)
  function normalize(ip, mask) {
    let ipStr = ip, bits = null;
    if (typeof ip === 'string' && ip.includes('/') && mask == null) { const [a, b] = ip.split('/'); ipStr = a.trim(); bits = Number(b); }
    else if (typeof mask === 'number') bits = mask;
    else if (typeof mask === 'string') { bits = /^\d{1,2}$/.test(mask.trim()) ? Number(mask) : maskToCidr(mask); }
    const ipInt = parseIPv4(ipStr);
    if (ipInt === null || bits === null || isNaN(bits) || bits < 0 || bits > 32) return null;
    return { ipInt, bits };
  }
  function classOf(ipStr) {
    const n = parseIPv4(ipStr); if (n === null) return null;
    const f = n >>> 24;
    if (f < 128) return 'A'; if (f < 192) return 'B'; if (f < 224) return 'C'; if (f < 240) return 'D (multicast)'; return 'E (experimental)';
  }
  function inRange(n, cidr) { const [net, bits] = cidr.split('/'); const m = cidrToMaskInt(Number(bits)); return ((n & m) >>> 0) === ((parseIPv4(net) & m) >>> 0); }
  function isPrivate(ipStr) { const n = parseIPv4(ipStr); if (n === null) return false; return inRange(n, '10.0.0.0/8') || inRange(n, '172.16.0.0/12') || inRange(n, '192.168.0.0/16'); }
  function isAPIPA(ipStr) { const n = parseIPv4(ipStr); return n !== null && inRange(n, '169.254.0.0/16'); }
  function isLoopback(ipStr) { const n = parseIPv4(ipStr); return n !== null && inRange(n, '127.0.0.0/8'); }
  function isMulticast(ipStr) { const n = parseIPv4(ipStr); return n !== null && inRange(n, '224.0.0.0/4'); }
  function isPublic(ipStr) { const n = parseIPv4(ipStr); if (n === null) return false; return !(isPrivate(ipStr) || isAPIPA(ipStr) || isLoopback(ipStr) || isMulticast(ipStr) || inRange(n, '0.0.0.0/8') || inRange(n, '240.0.0.0/4') || inRange(n, '100.64.0.0/10')); }
  function addressType(ipStr) {
    if (!isValidIPv4(ipStr)) return 'invalid';
    if (isLoopback(ipStr)) return 'loopback'; if (isAPIPA(ipStr)) return 'APIPA (link-local)'; if (isPrivate(ipStr)) return 'private'; if (isMulticast(ipStr)) return 'multicast';
    if (inRange(parseIPv4(ipStr), '100.64.0.0/10')) return 'shared (CGNAT)';
    return isPublic(ipStr) ? 'public' : 'reserved';
  }

  function info(ip, mask) {
    const n = normalize(ip, mask); if (!n) return null;
    const { ipInt, bits } = n;
    const m = cidrToMaskInt(bits);
    const net = (ipInt & m) >>> 0;
    const bcast = (net | ((~m) >>> 0)) >>> 0;
    const hostBits = 32 - bits;
    let hosts, first, last;
    if (bits === 32) { hosts = 1; first = net; last = net; }
    else if (bits === 31) { hosts = 2; first = net; last = bcast; }
    else { hosts = Math.pow(2, hostBits) - 2; first = net + 1; last = bcast - 1; }
    return {
      ip: intToIp(ipInt), cidr: bits, mask: intToIp(m), wildcard: intToIp((~m) >>> 0),
      network: intToIp(net), broadcast: intToIp(bcast), first: intToIp(first), last: intToIp(last),
      hosts, hostBits, networkInt: net, broadcastInt: bcast, class: classOf(intToIp(ipInt)), type: addressType(intToIp(ipInt)),
      isNetworkAddress: ipInt === net && bits < 31, isBroadcastAddress: ipInt === bcast && bits < 31,
      binary: toBinary(ipInt), maskBinary: toBinary(m)
    };
  }
  function toBinary(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].map(o => o.toString(2).padStart(8, '0')).join('.'); }
  function sameSubnet(ip1, ip2, mask) {
    const a = parseIPv4(ip1), b = parseIPv4(ip2); const bits = typeof mask === 'number' ? mask : maskToCidr(mask);
    if (a === null || b === null || bits === null) return false;
    const m = cidrToMaskInt(bits); return ((a & m) >>> 0) === ((b & m) >>> 0);
  }
  function inSubnet(ipStr, netStr, mask) { return sameSubnet(ipStr, netStr, mask); }
  function isUsableHost(ipStr, mask) { const i = info(ipStr, mask); return !!i && !i.isNetworkAddress && !i.isBroadcastAddress; }

  // Split a network into equal subnets with a new prefix
  function subnetsOf(baseCidr, newPrefix, limit) {
    const n = normalize(baseCidr); if (!n || newPrefix < n.bits || newPrefix > 32) return [];
    const base = info(baseCidr);
    const size = Math.pow(2, 32 - newPrefix);
    const count = Math.pow(2, newPrefix - n.bits);
    const out = [];
    for (let i = 0; i < count && i < (limit || 1024); i++) out.push(info(intToIp(base.networkInt + i * size), newPrefix));
    return out;
  }
  // Smallest prefix that fits N usable hosts
  function prefixForHosts(hosts) {
    for (let bits = 30; bits >= 0; bits--) { if (Math.pow(2, 32 - bits) - 2 >= hosts) return bits; }
    return 0;
  }
  // VLSM allocation: requirements [{name, hosts}] from base network
  function vlsm(baseCidr, reqs) {
    const base = info(baseCidr); if (!base) return { error: 'Invalid base network' };
    const sorted = reqs.map((r, i) => ({ ...r, _i: i })).sort((a, b) => b.hosts - a.hosts);
    let cursor = base.networkInt;
    const end = base.broadcastInt + 1;
    const allocs = [];
    for (const r of sorted) {
      const bits = prefixForHosts(r.hosts);
      const size = Math.pow(2, 32 - bits);
      // align cursor to block size
      if (cursor % size !== 0) cursor = Math.ceil(cursor / size) * size;
      if (cursor + size > end) return { error: 'Not enough address space for ' + r.name, allocations: allocs };
      const i = info(intToIp(cursor), bits);
      allocs.push({ name: r.name, hosts: r.hosts, cidr: bits, network: i.network, mask: i.mask, broadcast: i.broadcast, first: i.first, last: i.last, usable: i.hosts, _i: r._i });
      cursor += size;
    }
    return { allocations: allocs, remaining: end - cursor };
  }

  // IPv6 helpers
  function expandIPv6(str) {
    if (typeof str !== 'string') return null;
    let s = str.trim().toLowerCase();
    const zoneIdx = s.indexOf('%'); if (zoneIdx >= 0) s = s.slice(0, zoneIdx);
    const prefixIdx = s.indexOf('/'); let prefix = null; if (prefixIdx >= 0) { prefix = Number(s.slice(prefixIdx + 1)); s = s.slice(0, prefixIdx); }
    if ((s.match(/::/g) || []).length > 1) return null;
    let head = [], tail = [];
    if (s.includes('::')) { const [a, b] = s.split('::'); head = a ? a.split(':') : []; tail = b ? b.split(':') : []; }
    else head = s.split(':');
    const all = head.concat(tail);
    for (const g of all) if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    let groups;
    if (s.includes('::')) { const missing = 8 - all.length; if (missing < 1) return null; groups = head.concat(new Array(missing).fill('0')).concat(tail); }
    else { if (all.length !== 8) return null; groups = all; }
    const full = groups.map(g => g.padStart(4, '0')).join(':');
    return prefix !== null ? full + '/' + prefix : full;
  }
  function compressIPv6(str) {
    const full = expandIPv6(str); if (!full) return null;
    let prefix = ''; let s = full;
    if (s.includes('/')) { const i = s.indexOf('/'); prefix = s.slice(i); s = s.slice(0, i); }
    const groups = s.split(':').map(g => g.replace(/^0+(?=.)/, ''));
    // find longest run of zeros (length >= 2)
    let best = { start: -1, len: 0 }, cur = { start: -1, len: 0 };
    for (let i = 0; i < 8; i++) {
      if (groups[i] === '0') { if (cur.start < 0) cur = { start: i, len: 1 }; else cur.len++; if (cur.len > best.len) best = { ...cur }; }
      else cur = { start: -1, len: 0 };
    }
    let out;
    if (best.len >= 2) { const a = groups.slice(0, best.start).join(':'); const b = groups.slice(best.start + best.len).join(':'); out = a + '::' + b; }
    else out = groups.join(':');
    return out + prefix;
  }
  function ipv6Type(str) {
    const f = expandIPv6(str); if (!f) return 'invalid';
    const s = f.split('/')[0];
    if (s === '0000:0000:0000:0000:0000:0000:0000:0001') return 'loopback (::1)';
    if (s === '0000:0000:0000:0000:0000:0000:0000:0000') return 'unspecified (::)';
    if (/^fe[89ab]/.test(s)) return 'link-local (fe80::/10)';
    if (/^f[cd]/.test(s)) return 'unique local (fc00::/7)';
    if (/^ff/.test(s)) return 'multicast (ff00::/8)';
    if (/^2|^3/.test(s)) return 'global unicast (2000::/3)';
    return 'reserved';
  }

  // ---- Practice problem generator ----
  const PREFIX_POOL = { easy: [24, 25, 26, 27, 28], medium: [20, 21, 22, 23, 25, 26, 27, 28, 29, 30], hard: [11, 13, 14, 17, 18, 19, 21, 22, 23, 26, 27, 29, 30] };
  function randomIp(rng, privateOnly) {
    const base = NSA.util.pick(rng, privateOnly ? ['10', '172', '192'] : ['10', '172', '192', '203', '198', '45', '64', '128']);
    let octets;
    if (base === '10') octets = [10, NSA.util.randInt(rng, 0, 255), NSA.util.randInt(rng, 0, 255), NSA.util.randInt(rng, 1, 254)];
    else if (base === '172') octets = [172, NSA.util.randInt(rng, 16, 31), NSA.util.randInt(rng, 0, 255), NSA.util.randInt(rng, 1, 254)];
    else if (base === '192') octets = [192, 168, NSA.util.randInt(rng, 0, 255), NSA.util.randInt(rng, 1, 254)];
    else octets = [Number(base), NSA.util.randInt(rng, 0, 255), NSA.util.randInt(rng, 0, 255), NSA.util.randInt(rng, 1, 254)];
    return octets.join('.');
  }
  function generateProblem(rng, difficulty, kind) {
    rng = rng || Math.random; difficulty = difficulty || 'easy';
    const kinds = kind ? [kind] : (difficulty === 'easy' ? ['basic', 'basic', 'mask', 'hosts'] : difficulty === 'medium' ? ['basic', 'hosts', 'mask', 'count', 'same'] : ['basic', 'count', 'hosts', 'same', 'vlsm']);
    const k = NSA.util.pick(rng, kinds);
    const prefix = NSA.util.pick(rng, PREFIX_POOL[difficulty] || PREFIX_POOL.easy);
    const ip = randomIp(rng, difficulty === 'easy');
    const i = info(ip, prefix);
    if (k === 'basic') {
      return { kind: 'basic', difficulty, title: 'Identify the subnet',
        question: 'Host **' + ip + '/' + prefix + '**. Determine the network address, broadcast address, and the usable host range.',
        fields: [{ key: 'network', label: 'Network address' }, { key: 'broadcast', label: 'Broadcast address' }, { key: 'first', label: 'First usable host' }, { key: 'last', label: 'Last usable host' }],
        answers: { network: i.network, broadcast: i.broadcast, first: i.first, last: i.last },
        explain: 'Mask /' + prefix + ' = ' + i.mask + '. AND the address with the mask to get the network ' + i.network + '. The block size in the interesting octet is ' + blockSize(prefix) + ', so the broadcast is ' + i.broadcast + '. Usable hosts are everything in between: ' + i.first + ' – ' + i.last + '.' };
    }
    if (k === 'mask') {
      const toMask = rng() < 0.5;
      return toMask ? { kind: 'mask', difficulty, title: 'CIDR to dotted-decimal', question: 'Write the subnet mask for prefix **/' + prefix + '** in dotted-decimal notation.', fields: [{ key: 'mask', label: 'Subnet mask' }], answers: { mask: i.mask }, explain: '/' + prefix + ' means ' + prefix + ' one-bits from the left: ' + i.maskBinary + ' = ' + i.mask + '.' }
        : { kind: 'mask', difficulty, title: 'Dotted-decimal to CIDR', question: 'Express the mask **' + i.mask + '** as a CIDR prefix length (number only).', fields: [{ key: 'cidr', label: 'Prefix length' }], answers: { cidr: String(prefix) }, explain: i.mask + ' in binary is ' + i.maskBinary + ', which has ' + prefix + ' one-bits, so the prefix is /' + prefix + '.' };
    }
    if (k === 'hosts') {
      return { kind: 'hosts', difficulty, title: 'Usable hosts', question: 'How many **usable host addresses** does the subnet **' + i.network + '/' + prefix + '** provide?', fields: [{ key: 'hosts', label: 'Usable hosts' }], answers: { hosts: String(i.hosts) }, explain: '32 − ' + prefix + ' = ' + i.hostBits + ' host bits → 2^' + i.hostBits + ' = ' + Math.pow(2, i.hostBits) + ' addresses, minus network and broadcast = ' + i.hosts + ' usable.' };
    }
    if (k === 'count') {
      const basePrefix = Math.max(8, prefix - NSA.util.randInt(rng, 1, 4));
      const base = info(ip, basePrefix);
      const count = Math.pow(2, prefix - basePrefix);
      return { kind: 'count', difficulty, title: 'Subnet count', question: 'The network **' + base.network + '/' + basePrefix + '** is subnetted with a **/' + prefix + '** mask. How many subnets are created, and how many usable hosts does each have?', fields: [{ key: 'subnets', label: 'Number of subnets' }, { key: 'hosts', label: 'Usable hosts per subnet' }], answers: { subnets: String(count), hosts: String(i.hosts) }, explain: 'Borrowed bits: ' + prefix + ' − ' + basePrefix + ' = ' + (prefix - basePrefix) + ' → 2^' + (prefix - basePrefix) + ' = ' + count + ' subnets. Host bits: 32 − ' + prefix + ' = ' + i.hostBits + ' → ' + i.hosts + ' usable hosts each.' };
    }
    if (k === 'same') {
      const other = rng() < 0.5 ? intToIp(i.networkInt + NSA.util.randInt(rng, 1, Math.max(1, i.hosts - 1))) : intToIp((i.broadcastInt + NSA.util.randInt(rng, 2, 50)) >>> 0);
      const same = sameSubnet(ip, other, prefix);
      return { kind: 'same', difficulty, title: 'Same subnet?', question: 'Host A is **' + ip + '/' + prefix + '** and Host B is **' + other + '/' + prefix + '**. Are they in the same subnet? Answer **yes** or **no**.', fields: [{ key: 'same', label: 'Same subnet? (yes/no)' }], answers: { same: same ? 'yes' : 'no' }, explain: 'Network of A: ' + i.network + '. Network of B: ' + info(other, prefix).network + '. ' + (same ? 'They match, so the hosts can talk directly without a router.' : 'They differ, so traffic between them must pass through a router (default gateway).') };
    }
    if (k === 'vlsm') {
      const base = '192.168.' + NSA.util.randInt(rng, 0, 200) + '.0/24';
      const reqs = [{ name: 'Sales', hosts: NSA.util.pick(rng, [50, 60, 100, 25]) }, { name: 'Engineering', hosts: NSA.util.pick(rng, [20, 28, 12, 40]) }, { name: 'Management', hosts: NSA.util.pick(rng, [5, 10, 6, 12]) }];
      const sol = vlsm(base, reqs);
      const big = sol.allocations[0];
      return { kind: 'vlsm', difficulty, title: 'VLSM allocation', question: 'From **' + base + '**, allocate subnets using VLSM for: ' + reqs.map(r => r.name + ' (' + r.hosts + ' hosts)').join(', ') + '. What is the network address and prefix for the **largest** department (' + big.name + ')?', fields: [{ key: 'network', label: big.name + ' network address' }, { key: 'cidr', label: big.name + ' prefix length' }], answers: { network: big.network, cidr: String(big.cidr) }, explain: 'Allocate largest first. ' + big.name + ' needs ' + big.hosts + ' hosts → /' + big.cidr + ' (' + big.usable + ' usable). Starting at the base network gives ' + big.network + '/' + big.cidr + '. Then: ' + sol.allocations.slice(1).map(a => a.name + ' ' + a.network + '/' + a.cidr).join(', ') + '.' };
    }
    return generateProblem(rng, difficulty, 'basic');
  }
  function blockSize(prefix) { const r = prefix % 8; return r === 0 ? 256 : Math.pow(2, 8 - r); }
  function checkAnswer(problem, key, value) {
    const expected = String(problem.answers[key]).trim().toLowerCase();
    const got = String(value || '').trim().toLowerCase();
    if (expected === got) return true;
    if (key === 'cidr') return got.replace('/', '') === expected;
    return false;
  }

  NSA.subnet = { parseIPv4, isValidIPv4, intToIp, cidrToMask, cidrToMaskInt, maskToCidr, isValidMask, wildcard, info, toBinary, classOf, isPrivate, isAPIPA, isLoopback, isMulticast, isPublic, addressType, sameSubnet, inSubnet, isUsableHost, subnetsOf, prefixForHosts, vlsm, expandIPv6, compressIPv6, ipv6Type, generateProblem, checkAnswer, blockSize, normalize };
})(typeof globalThis !== 'undefined' ? globalThis : window);
