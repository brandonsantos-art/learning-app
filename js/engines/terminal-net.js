/* NetSec Academy – network command output formatters (shared by Linux and Windows terminals) */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  const S = () => NSA.subnet;
  const N = () => NSA.netsim;

  function winMac(mac) { return mac.toUpperCase().replace(/:/g, '-'); }
  function adapterName(port) { return /^wlan/.test(port) ? 'Wi-Fi' : 'Ethernet' + (port.replace(/\D/g, '') || '0'); }
  function portForAdapter(dev, name) { const n = String(name || '').replace(/"/g, '').toLowerCase(); for (const p of Object.keys(dev.interfaces)) if (adapterName(p).toLowerCase() === n || p.toLowerCase() === n) return p; return null; }
  function jitter(rtt) { const j = rtt * (0.85 + Math.random() * 0.3); return Math.max(0.05, Math.round(j * 1000) / 1000); }
  function pad(s, n) { s = String(s == null ? '' : s); while (s.length < n) s += ' '; return s; }
  function lpad(s, n) { s = String(s == null ? '' : s); while (s.length < n) s = ' ' + s; return s; }
  function srcIp(dev) { return N().ipsOf(dev)[0] || '0.0.0.0'; }

  // ---------- ping ----------
  function pingWindows(net, dev, target, count, session) {
    const first = N().ping(net, dev.id, target, { seq: 1 });
    if (session) session.lastPing = first;
    if (first.status === 'dns-fail') return 'Ping request could not find host ' + target + '. Please check the name and try again.';
    if (first.status === 'error') return first.reason;
    if ((first.status === 'no-route' || first.status === 'no-ip') && first.at === dev.id) return 'PING: transmit failed. General failure.';
    const ip = first.resolved; const byName = ip !== target;
    const lines = ['', 'Pinging ' + (byName ? target + ' [' + ip + ']' : ip) + ' with 32 bytes of data:'];
    let recv = 0, lost = 0; const times = [];
    for (let i = 0; i < count; i++) {
      const r = i === 0 ? first : N().ping(net, dev.id, ip, { seq: i + 1 });
      if (r.success) { const t = jitter(r.rtt); times.push(t); recv++; lines.push('Reply from ' + ip + ': bytes=32 ' + (t < 1 ? 'time<1ms' : 'time=' + Math.round(t) + 'ms') + ' TTL=' + (r.ttl || 64)); }
      else if (r.status === 'arp-fail' && r.at === dev.id) { recv++; lines.push('Reply from ' + srcIp(dev) + ': Destination host unreachable.'); }
      else if (r.status === 'unreachable' && r.delivered !== false) { recv++; lines.push('Reply from ' + (r.from || srcIp(dev)) + ': Destination ' + (/port/.test(r.note || '') ? 'port' : 'host') + ' unreachable.'); }
      else if (r.status === 'time-exceeded' && r.delivered !== false) { recv++; lines.push('Reply from ' + r.from + ': TTL expired in transit.'); }
      else { lost++; lines.push('Request timed out.'); }
    }
    lines.push('', 'Ping statistics for ' + ip + ':', '    Packets: Sent = ' + count + ', Received = ' + recv + ', Lost = ' + lost + ' (' + Math.round(lost / count * 100) + '% loss),');
    if (times.length) lines.push('Approximate round trip times in milli-seconds:', '    Minimum = ' + Math.round(Math.min(...times)) + 'ms, Maximum = ' + Math.round(Math.max(...times)) + 'ms, Average = ' + Math.round(times.reduce((a, b) => a + b, 0) / times.length) + 'ms');
    if (!first.success && first.reason) lines.push('', '[diagnostic] ' + first.reason);
    return lines.join('\n');
  }
  function pingLinux(net, dev, target, count, session) {
    const first = N().ping(net, dev.id, target, { seq: 1 });
    if (session) session.lastPing = first;
    if (first.status === 'dns-fail') return 'ping: ' + target + ': ' + (first.reason && /did not respond|no DNS/.test(first.reason) ? 'Temporary failure in name resolution' : 'Name or service not known');
    if (first.status === 'error') return 'ping: ' + first.reason;
    if ((first.status === 'no-route' || first.status === 'no-ip') && first.at === dev.id) return 'ping: connect: Network is unreachable';
    const ip = first.resolved;
    const lines = ['PING ' + target + ' (' + ip + ') 56(84) bytes of data.'];
    let recv = 0, errors = 0; const times = [];
    for (let i = 0; i < count; i++) {
      const r = i === 0 ? first : N().ping(net, dev.id, ip, { seq: i + 1 });
      if (r.success) { const t = jitter(r.rtt); times.push(t); recv++; lines.push('64 bytes from ' + ip + ': icmp_seq=' + (i + 1) + ' ttl=' + (r.ttl || 64) + ' time=' + t.toFixed(3) + ' ms'); }
      else if (r.status === 'arp-fail' && r.at === dev.id) { errors++; lines.push('From ' + srcIp(dev) + ' icmp_seq=' + (i + 1) + ' Destination Host Unreachable'); }
      else if (r.status === 'unreachable' && r.delivered !== false) { errors++; lines.push('From ' + (r.from || srcIp(dev)) + ' icmp_seq=' + (i + 1) + ' Destination ' + (/no route/.test(r.note || '') ? 'Net' : /port/.test(r.note || '') ? 'Port' : 'Host') + ' Unreachable'); }
      else if (r.status === 'time-exceeded' && r.delivered !== false) { errors++; lines.push('From ' + r.from + ' icmp_seq=' + (i + 1) + ' Time to live exceeded'); }
    }
    lines.push('', '--- ' + target + ' ping statistics ---', count + ' packets transmitted, ' + recv + ' received, ' + (errors ? '+' + errors + ' errors, ' : '') + Math.round((count - recv) / count * 100) + '% packet loss, time ' + ((count - 1) * 1000 + Math.round(Math.random() * 20)) + 'ms');
    if (times.length) { const mn = Math.min(...times), mx = Math.max(...times), avg = times.reduce((a, b) => a + b, 0) / times.length; lines.push('rtt min/avg/max/mdev = ' + mn.toFixed(3) + '/' + avg.toFixed(3) + '/' + mx.toFixed(3) + '/' + ((mx - mn) / 2).toFixed(3) + ' ms'); }
    if (!first.success && first.reason) lines.push('[diagnostic] ' + first.reason);
    return lines.join('\n');
  }

  // ---------- traceroute ----------
  function tracertWindows(net, dev, target, session) {
    const t = N().traceroute(net, dev.id, target);
    if (session) session.lastTrace = t;
    if (t.status === 'dns-fail') return 'Unable to resolve target system name ' + target + '.';
    if (t.status === 'no-route' || t.status === 'no-ip') return 'Unable to contact IP driver. General failure.';
    const lines = ['', 'Tracing route to ' + (t.resolved !== target ? target + ' [' + t.resolved + ']' : t.resolved), 'over a maximum of 30 hops:', ''];
    for (const h of t.hops) {
      if (h.timeout) lines.push(lpad(h.ttl, 3) + '     *        *        *     Request timed out.');
      else { const f = () => { const x = jitter(h.rtt); return x < 1 ? '   <1 ms' : lpad(Math.round(x) + ' ms', 8); }; lines.push(lpad(h.ttl, 3) + ' ' + f() + ' ' + f() + ' ' + f() + '  ' + (h.name ? h.name + ' [' + h.ip + ']' : h.ip)); }
    }
    lines.push('', t.success ? 'Trace complete.' : (t.reason ? '[diagnostic] ' + t.reason : 'Trace incomplete.'));
    return lines.join('\n');
  }
  function tracerouteLinux(net, dev, target, session) {
    const t = N().traceroute(net, dev.id, target);
    if (session) session.lastTrace = t;
    if (t.status === 'dns-fail') return target + ': Name or service not known\nCannot handle "host" cmdline arg `' + target + "' on position 1 (argc 1)";
    if (t.status === 'no-route' || t.status === 'no-ip') return 'connect: Network is unreachable';
    const lines = ['traceroute to ' + target + ' (' + t.resolved + '), 30 hops max, 60 byte packets'];
    for (const h of t.hops) {
      if (h.timeout) lines.push(lpad(h.ttl, 2) + '  * * *');
      else lines.push(lpad(h.ttl, 2) + '  ' + (h.name || h.ip) + ' (' + h.ip + ')  ' + jitter(h.rtt).toFixed(3) + ' ms  ' + jitter(h.rtt).toFixed(3) + ' ms  ' + jitter(h.rtt).toFixed(3) + ' ms');
    }
    if (!t.success && t.reason) lines.push('[diagnostic] ' + t.reason);
    return lines.join('\n');
  }

  // ---------- DNS ----------
  function nslookup(net, dev, name, server) {
    if (!name) return 'Usage: nslookup <hostname> [server]';
    const srv = server || dev.dns;
    if (!srv) return 'Server:  UnKnown\nAddress:  127.0.0.1\n\n*** UnKnown can\'t find ' + name + ': No response from server\n[diagnostic] no DNS server is configured on this host';
    if (S().isValidIPv4(name)) { const rn = N().reverseName(net, name); const srvName = N().reverseName(net, srv) || 'UnKnown'; return 'Server:  ' + srvName + '\nAddress:  ' + srv + '\n\n' + (rn ? 'Name:    ' + rn + '\nAddress:  ' + name : '*** ' + srvName + ' can\'t find ' + name + ': Non-existent domain'); }
    const r = N().resolve(net, dev.id, name, null, { server: srv });
    const srvName = N().reverseName(net, srv) || 'UnKnown';
    if (!r.ok) {
      if (r.rcode === 'NXDOMAIN') return 'Server:  ' + srvName + '\nAddress:  ' + srv + '\n\n*** ' + srvName + ' can\'t find ' + (r.name || name) + ': Non-existent domain';
      if (r.rcode === 'SERVFAIL') return 'Server:  ' + srvName + '\nAddress:  ' + srv + '\n\n*** ' + srvName + ' can\'t find ' + (r.name || name) + ': Server failed';
      return 'DNS request timed out.\n    timeout was 2 seconds.\nServer:  UnKnown\nAddress:  ' + srv + '\n\nDNS request timed out.\n    timeout was 2 seconds.\n*** Request to UnKnown timed-out\n[diagnostic] ' + r.reason;
    }
    return 'Server:  ' + srvName + '\nAddress:  ' + srv + '\n\n' + (r.authoritative ? '' : 'Non-authoritative answer:\n') + 'Name:    ' + (r.name || name) + '\nAddress:  ' + r.ip;
  }
  function dig(net, dev, name, server, short) {
    if (!name) return '; <<>> DiG 9.18.19 <<>>\n;; global options: +cmd\n;; Got answer: (no name specified)';
    const srv = server || dev.dns;
    if (!srv) return short ? '' : '; <<>> DiG 9.18.19 <<>> ' + name + '\n;; global options: +cmd\n;; no servers could be reached\n[diagnostic] no DNS server configured (/etc/resolv.conf has no nameserver)';
    const r = N().resolve(net, dev.id, name, null, { server: srv });
    if (short) return r.ok ? r.ip : (r.rcode ? '' : ';; connection timed out; no servers could be reached');
    const id = 10000 + Math.floor(Math.random() * 50000);
    if (!r.ok && !r.rcode) return '; <<>> DiG 9.18.19 <<>> ' + name + (server ? ' @' + server : '') + '\n;; global options: +cmd\n;; connection timed out; no servers could be reached\n[diagnostic] ' + r.reason;
    const status = r.ok ? 'NOERROR' : r.rcode;
    const out = ['; <<>> DiG 9.18.19 <<>> ' + name + (server ? ' @' + server : ''), ';; global options: +cmd', ';; Got answer:', ';; ->>HEADER<<- opcode: QUERY, status: ' + status + ', id: ' + id, ';; flags: qr ' + (r.authoritative ? 'aa ' : '') + 'rd ra; QUERY: 1, ANSWER: ' + (r.ok ? 1 : 0) + ', AUTHORITY: 0, ADDITIONAL: 1', '', ';; QUESTION SECTION:', ';' + name + '.\t\t\tIN\tA', ''];
    if (r.ok) out.push(';; ANSWER SECTION:', name + '.\t\t' + (r.authoritative ? 3600 : 299) + '\tIN\tA\t' + r.ip, '');
    out.push(';; Query time: ' + Math.round(1 + Math.random() * 20) + ' msec', ';; SERVER: ' + srv + '#53(' + srv + ') (UDP)', ';; WHEN: ' + new Date().toString().slice(0, 24), ';; MSG SIZE  rcvd: ' + (r.ok ? 60 : 44));
    return out.join('\n');
  }

  // ---------- interface configuration output ----------
  function ipconfig(net, dev, all) {
    const host = dev.host || {};
    const L = ['', 'Windows IP Configuration', ''];
    if (all) L.push('   Host Name . . . . . . . . . . . . : ' + (host.hostname || dev.name), '   Primary Dns Suffix  . . . . . . . : ' + (dev.dnsSuffix || ''), '   Node Type . . . . . . . . . . . . : Hybrid', '   IP Routing Enabled. . . . . . . . : No', '   WINS Proxy Enabled. . . . . . . . : No', dev.dnsSuffix ? '   DNS Suffix Search List. . . . . . : ' + dev.dnsSuffix : null, '');
    for (const p of Object.keys(dev.interfaces)) {
      const i = dev.interfaces[p]; const link = N().linkAt(net, dev.id, p); const wifi = /^wlan/.test(p);
      L.push((wifi ? 'Wireless LAN adapter ' : 'Ethernet adapter ') + adapterName(p) + ':', '');
      if (!link || i.up === false) { L.push('   Media State . . . . . . . . . . . : Media disconnected', '   Connection-specific DNS Suffix  . : ' + (dev.dnsSuffix || '')); if (all) L.push('   Description . . . . . . . . . . . : ' + (wifi ? 'Intel(R) Wi-Fi 6 AX201 160MHz' : 'Intel(R) PRO/1000 MT Network Connection'), '   Physical Address. . . . . . . . . : ' + winMac(i.mac), '   DHCP Enabled. . . . . . . . . . . : ' + (i.mode === 'dhcp' ? 'Yes' : 'No'), '   Autoconfiguration Enabled . . . . : Yes'); L.push(''); continue; }
      L.push('   Connection-specific DNS Suffix  . : ' + (dev.dnsSuffix || ''));
      if (all) L.push('   Description . . . . . . . . . . . : ' + (wifi ? 'Intel(R) Wi-Fi 6 AX201 160MHz' : 'Intel(R) PRO/1000 MT Network Connection'), '   Physical Address. . . . . . . . . : ' + winMac(i.mac), '   DHCP Enabled. . . . . . . . . . . : ' + (i.mode === 'dhcp' ? 'Yes' : 'No'), '   Autoconfiguration Enabled . . . . : Yes');
      L.push('   Link-local IPv6 Address . . . . . : fe80::' + i.mac.split(':').slice(2).map((h, k) => k % 2 ? h : h).join('').replace(/(.{4})/g, '$1:').replace(/:$/, '') + '%' + (12 + Object.keys(dev.interfaces).indexOf(p)) + (all ? '(Preferred)' : ''));
      if (i.ip) {
        const apipa = S().isAPIPA(i.ip);
        L.push('   ' + (apipa ? 'Autoconfiguration IPv4 Address. . : ' : 'IPv4 Address. . . . . . . . . . . : ') + i.ip + (all ? '(Preferred)' : ''), '   Subnet Mask . . . . . . . . . . . : ' + i.mask);
        if (all && i.mode === 'dhcp' && !apipa) { const lease = i.lease ? new Date(i.lease.at) : new Date(); L.push('   Lease Obtained. . . . . . . . . . : ' + lease.toLocaleString(), '   Lease Expires . . . . . . . . . . : ' + new Date(lease.getTime() + ((i.lease && i.lease.hours) || 24) * 3600000).toLocaleString()); }
      }
      L.push('   Default Gateway . . . . . . . . . : ' + (dev.gateway || ''));
      if (all) { if (i.mode === 'dhcp' && i.dhcpServer) L.push('   DHCP Server . . . . . . . . . . . : ' + i.dhcpServer); L.push('   DNS Servers . . . . . . . . . . . : ' + (dev.dns || ''), '   NetBIOS over Tcpip. . . . . . . . : Enabled'); }
      L.push('');
    }
    return L.filter(x => x !== null).join('\n');
  }
  function ipAddr(net, dev, brief, which) {
    const names = Object.keys(dev.interfaces).filter(n => !which || n === which);
    if (which && !names.length) return 'Device "' + which + '" does not exist.';
    if (brief) { const L = []; if (!which) L.push(pad('lo', 17) + pad('UNKNOWN', 16) + '127.0.0.1/8 ::1/128'); for (const n of names) { const i = dev.interfaces[n]; const up = i.up !== false && N().linkAt(net, dev.id, n); L.push(pad(n, 17) + pad(up ? 'UP' : 'DOWN', 16) + (i.ip ? i.ip + '/' + S().maskToCidr(i.mask) + ' ' : '') + 'fe80::' + i.mac.split(':').slice(3).join('') .replace(/(.{4})/g, '$1:').replace(/:$/, '') + '/64'); } return L.join('\n'); }
    const L = [];
    if (!which) L.push('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000', '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00', '    inet 127.0.0.1/8 scope host lo', '       valid_lft forever preferred_lft forever', '    inet6 ::1/128 scope host', '       valid_lft forever preferred_lft forever');
    names.forEach((n, k) => {
      const i = dev.interfaces[n]; const link = N().linkAt(net, dev.id, n); const adminUp = i.up !== false; const carrier = adminUp && link;
      L.push((k + 2) + ': ' + n + ': <' + (carrier ? 'BROADCAST,MULTICAST,UP,LOWER_UP' : adminUp ? 'NO-CARRIER,BROADCAST,MULTICAST,UP' : 'BROADCAST,MULTICAST') + '> mtu 1500 qdisc fq_codel state ' + (carrier ? 'UP' : 'DOWN') + ' group default qlen 1000', '    link/ether ' + i.mac + ' brd ff:ff:ff:ff:ff:ff');
      if (i.ip) { const inf = S().info(i.ip, i.mask); L.push('    inet ' + i.ip + '/' + inf.cidr + ' brd ' + inf.broadcast + ' scope global ' + (i.mode === 'dhcp' ? 'dynamic ' : '') + n, '       valid_lft ' + (i.mode === 'dhcp' ? '86312sec' : 'forever') + ' preferred_lft ' + (i.mode === 'dhcp' ? '86312sec' : 'forever')); }
      if (carrier) L.push('    inet6 fe80::' + i.mac.split(':').slice(3).join('').replace(/(.{4})/g, '$1:').replace(/:$/, '') + '/64 scope link', '       valid_lft forever preferred_lft forever');
    });
    return L.join('\n');
  }
  function ipLink(net, dev) {
    const L = ['1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000', '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00'];
    Object.keys(dev.interfaces).forEach((n, k) => { const i = dev.interfaces[n]; const carrier = i.up !== false && N().linkAt(net, dev.id, n); L.push((k + 2) + ': ' + n + ': <' + (carrier ? 'BROADCAST,MULTICAST,UP,LOWER_UP' : i.up !== false ? 'NO-CARRIER,BROADCAST,MULTICAST,UP' : 'BROADCAST,MULTICAST') + '> mtu 1500 qdisc fq_codel state ' + (carrier ? 'UP' : 'DOWN') + ' mode DEFAULT group default qlen 1000', '    link/ether ' + i.mac + ' brd ff:ff:ff:ff:ff:ff'); });
    return L.join('\n');
  }
  function ipRoute(net, dev) {
    const rows = N().routeTable(net, dev); const L = [];
    for (const r of rows) {
      if (r.network === '0.0.0.0') L.push('default via ' + r.via + ' dev ' + (ifaceFor(dev, r.via) || 'eth0') + ' proto ' + (dev.interfaces[ifaceFor(dev, r.via) || 'eth0'] && dev.interfaces[ifaceFor(dev, r.via) || 'eth0'].mode === 'dhcp' ? 'dhcp' : 'static') + ' metric 100');
      else if (r.code === 'C') L.push(r.network + '/' + r.prefix + ' dev ' + r.iface + ' proto kernel scope link src ' + dev.interfaces[r.iface].ip + ' metric 100');
      else L.push(r.network + '/' + r.prefix + ' via ' + r.via + ' dev ' + (ifaceFor(dev, r.via) || r.iface || 'eth0') + ' proto static metric 100');
    }
    if (!L.length) return '';
    return L.join('\n');
  }
  function ifaceFor(dev, ip) { for (const n of Object.keys(dev.interfaces)) { const i = dev.interfaces[n]; if (i.ip && i.mask && S().sameSubnet(ip, i.ip, i.mask)) return n; } return null; }
  function ifconfig(net, dev, which) {
    const names = Object.keys(dev.interfaces).filter(n => !which || n === which);
    if (which && !names.length) return 'ifconfig: interface ' + which + ' does not exist.';
    const L = [];
    for (const n of names) {
      const i = dev.interfaces[n]; const carrier = i.up !== false && N().linkAt(net, dev.id, n); const inf = i.ip ? S().info(i.ip, i.mask) : null;
      L.push(n + ': flags=' + (carrier ? '4163<UP,BROADCAST,RUNNING,MULTICAST>' : i.up !== false ? '4099<UP,BROADCAST,MULTICAST>' : '4098<BROADCAST,MULTICAST>') + '  mtu 1500');
      if (inf) L.push('        inet ' + i.ip + '  netmask ' + i.mask + '  broadcast ' + inf.broadcast);
      L.push('        ether ' + i.mac + '  txqueuelen 1000  (Ethernet)', '        RX packets 1284  bytes 198331 (193.6 KiB)', '        RX errors 0  dropped 0  overruns 0  frame 0', '        TX packets 1310  bytes 161842 (158.0 KiB)', '        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0', '');
    }
    if (!which) L.push('lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536', '        inet 127.0.0.1  netmask 255.0.0.0', '        loop  txqueuelen 1000  (Local Loopback)', '        RX packets 120  bytes 9600 (9.3 KiB)', '        TX packets 120  bytes 9600 (9.3 KiB)');
    return L.join('\n');
  }

  // ---------- sockets ----------
  function sockets(net, dev) {
    const host = dev.host || {}; const out = [];
    const ip = srcIp(dev);
    const svcPorts = NSA.netsim.SERVICE_PORTS;
    for (const name of Object.keys(dev.services || {})) {
      const s = dev.services[name]; if (!s || s.enabled === false) continue;
      const port = s.port || svcPorts[name]; if (!port || name === 'dhcp' && dev.type !== 'server') continue;
      const udp = s.proto === 'udp' || ['dns', 'dhcp', 'ntp', 'snmp'].includes(name);
      const proc = s.process || { http: 'apache2', https: 'apache2', ssh: 'sshd', dns: 'named', dhcp: 'dhcpd', ftp: 'vsftpd', smb: 'smbd', mysql: 'mysqld', telnet: 'inetd', smtp: 'master', rdp: 'xrdp', redis: 'redis-server', vnc: 'Xvnc', 'http-alt': 'node', mongodb: 'mongod', winrm: 'svchost' }[name] || name;
      if (!udp || name === 'dns') out.push({ proto: 'tcp', local: '0.0.0.0:' + port, remote: '0.0.0.0:*', state: 'LISTEN', pid: s.pid || (800 + port % 100), proc });
      if (udp) out.push({ proto: 'udp', local: '0.0.0.0:' + port, remote: '0.0.0.0:*', state: 'UNCONN', pid: s.pid || (800 + port % 100), proc });
    }
    if (host.os === 'linux' || dev.type === 'server') { if (!out.some(s => s.local.endsWith(':22'))) out.push({ proto: 'tcp', local: '0.0.0.0:22', remote: '0.0.0.0:*', state: 'LISTEN', pid: 812, proc: 'sshd' }); out.push({ proto: 'udp', local: '127.0.0.53:53', remote: '0.0.0.0:*', state: 'UNCONN', pid: 601, proc: 'systemd-resolve' }); }
    else { out.push({ proto: 'tcp', local: '0.0.0.0:135', remote: '0.0.0.0:0', state: 'LISTENING', pid: 924, proc: 'svchost.exe' }, { proto: 'tcp', local: '0.0.0.0:445', remote: '0.0.0.0:0', state: 'LISTENING', pid: 4, proc: 'System' }, { proto: 'tcp', local: ip + ':139', remote: '0.0.0.0:0', state: 'LISTENING', pid: 4, proc: 'System' }, { proto: 'udp', local: '0.0.0.0:5353', remote: '*:*', state: '', pid: 1532, proc: 'svchost.exe' }, { proto: 'udp', local: ip + ':137', remote: '*:*', state: '', pid: 4, proc: 'System' }); if (dev.services && dev.services.rdp) out.push({ proto: 'tcp', local: '0.0.0.0:3389', remote: '0.0.0.0:0', state: 'LISTENING', pid: 1100, proc: 'svchost.exe' }); }
    for (const s of host.extraSockets || []) out.push(Object.assign({ proto: 'tcp', remote: '0.0.0.0:*', state: 'ESTABLISHED', pid: 0, proc: '-' }, s, { local: (s.local || '').replace('{ip}', ip) }));
    return out;
  }
  function ssOut(net, dev, flags) {
    let rows = sockets(net, dev);
    const tcp = flags.t, udp = flags.u; if (tcp && !udp) rows = rows.filter(r => r.proto === 'tcp'); if (udp && !tcp) rows = rows.filter(r => r.proto === 'udp');
    if (flags.l) rows = rows.filter(r => r.state === 'LISTEN' || r.state === 'UNCONN'); else if (!flags.a) rows = rows.filter(r => r.state !== 'LISTEN' && r.state !== 'UNCONN');
    const L = [pad('Netid', 6) + pad('State', 8) + pad('Recv-Q', 7) + pad('Send-Q', 7) + pad('Local Address:Port', 27) + pad('Peer Address:Port', 22) + (flags.p ? 'Process' : '')];
    for (const r of rows) L.push(pad(r.proto, 6) + pad(r.state, 8) + pad('0', 7) + pad(r.state === 'LISTEN' ? '128' : '0', 7) + pad(flags.n ? r.local : r.local.replace(/^0\.0\.0\.0:/, '*:'), 27) + pad(r.remote.replace(/^0\.0\.0\.0:\*/, '*:*'), 22) + (flags.p ? 'users:(("' + r.proc + '",pid=' + r.pid + ',fd=3))' : ''));
    return L.join('\n');
  }
  function netstatLinux(net, dev, flags) {
    let rows = sockets(net, dev);
    if (flags.t && !flags.u) rows = rows.filter(r => r.proto === 'tcp'); if (flags.u && !flags.t) rows = rows.filter(r => r.proto === 'udp');
    if (flags.l) rows = rows.filter(r => r.state === 'LISTEN' || r.state === 'UNCONN'); else if (!flags.a) rows = rows.filter(r => r.state !== 'LISTEN' && r.state !== 'UNCONN');
    const L = ['Active Internet connections ' + (flags.l ? '(only servers)' : flags.a ? '(servers and established)' : '(w/o servers)'), pad('Proto', 6) + pad('Recv-Q', 7) + pad('Send-Q', 7) + pad('Local Address', 24) + pad('Foreign Address', 24) + pad('State', 12) + (flags.p ? 'PID/Program name' : '')];
    for (const r of rows) L.push(pad(r.proto, 6) + pad('0', 7) + pad('0', 7) + pad(r.local, 24) + pad(r.remote, 24) + pad(r.proto === 'udp' ? '' : r.state, 12) + (flags.p ? r.pid + '/' + r.proc : ''));
    return L.join('\n');
  }
  function netstatWindows(net, dev, flags) {
    let rows = sockets(net, dev);
    if (!flags.a) rows = rows.filter(r => r.state === 'ESTABLISHED');
    const L = ['', 'Active Connections', '', '  Proto  Local Address          Foreign Address        State' + (flags.o ? '           PID' : '')];
    for (const r of rows) { const line = '  ' + pad(r.proto.toUpperCase(), 7) + pad(r.local, 23) + pad(r.remote === '0.0.0.0:*' ? '0.0.0.0:0' : r.remote, 23) + pad(r.proto === 'udp' ? '' : (r.state === 'LISTEN' ? 'LISTENING' : r.state), 16) + (flags.o ? r.pid : ''); L.push(line); if (flags.b) L.push(' [' + r.proc + ']'); }
    return L.join('\n');
  }
  function routePrintWindows(net, dev) {
    const L = ['===========================================================================', 'Interface List'];
    Object.keys(dev.interfaces).forEach((n, k) => { L.push(' ' + (12 + k) + '...' + winMac(dev.interfaces[n].mac).toLowerCase().replace(/-/g, ' ') + ' ......' + (/^wlan/.test(n) ? 'Intel(R) Wi-Fi 6 AX201 160MHz' : 'Intel(R) PRO/1000 MT Network Connection')); });
    L.push('  1...........................Software Loopback Interface 1', '===========================================================================', '', 'IPv4 Route Table', '===========================================================================', 'Active Routes:', 'Network Destination        Netmask          Gateway       Interface  Metric');
    const ip = srcIp(dev);
    const row = (d, m, g, i, met) => L.push(lpad(d, 17) + lpad(m, 17) + lpad(g, 17) + lpad(i, 18) + lpad(met, 7));
    if (dev.gateway) row('0.0.0.0', '0.0.0.0', dev.gateway, ip, 25);
    row('127.0.0.0', '255.0.0.0', 'On-link', '127.0.0.1', 331); row('127.0.0.1', '255.255.255.255', 'On-link', '127.0.0.1', 331);
    for (const n of Object.keys(dev.interfaces)) { const i = dev.interfaces[n]; if (!i.ip) continue; const inf = S().info(i.ip, i.mask); row(inf.network, inf.mask, 'On-link', i.ip, 281); row(i.ip, '255.255.255.255', 'On-link', i.ip, 281); row(inf.broadcast, '255.255.255.255', 'On-link', i.ip, 281); }
    for (const r of dev.routes || []) row(r.dest, r.mask, r.via, ip, 26);
    row('224.0.0.0', '240.0.0.0', 'On-link', '127.0.0.1', 331); row('255.255.255.255', '255.255.255.255', 'On-link', ip, 281);
    L.push('===========================================================================', 'Persistent Routes:', (dev.routes || []).length ? '  Network Address          Netmask  Gateway Address  Metric' : '  None');
    for (const r of dev.routes || []) L.push(lpad(r.dest, 17) + lpad(r.mask, 17) + lpad(r.via, 17) + lpad('1', 8));
    return L.join('\n');
  }
  function arpWindows(net, dev) {
    const L = [];
    for (const n of Object.keys(dev.interfaces)) {
      const i = dev.interfaces[n]; if (!i.ip) continue; const inf = S().info(i.ip, i.mask);
      L.push('', 'Interface: ' + i.ip + ' --- 0x' + (12 + Object.keys(dev.interfaces).indexOf(n)).toString(16), '  Internet Address      Physical Address      Type');
      for (const ip of Object.keys(dev.arp || {})) if (dev.arp[ip].iface === n) L.push('  ' + pad(ip, 22) + pad(winMac(dev.arp[ip].mac).toLowerCase(), 22) + (dev.arp[ip].type || 'dynamic'));
      L.push('  ' + pad(inf.broadcast, 22) + pad('ff-ff-ff-ff-ff-ff', 22) + 'static', '  ' + pad('224.0.0.22', 22) + pad('01-00-5e-00-00-16', 22) + 'static', '  ' + pad('255.255.255.255', 22) + pad('ff-ff-ff-ff-ff-ff', 22) + 'static');
    }
    return L.join('\n') || 'No ARP Entries Found.';
  }
  function arpLinux(net, dev, numeric) {
    const ips = Object.keys(dev.arp || {});
    if (!ips.length) return numeric ? 'Address                  HWtype  HWaddress           Flags Mask            Iface' : '';
    if (numeric) return ['Address                  HWtype  HWaddress           Flags Mask            Iface'].concat(ips.map(ip => pad(ip, 25) + pad('ether', 8) + pad(dev.arp[ip].mac, 20) + pad('C', 22) + dev.arp[ip].iface)).join('\n');
    return ips.map(ip => (ip === dev.gateway ? '_gateway' : (N().reverseName(net, ip) || '?')) + ' (' + ip + ') at ' + dev.arp[ip].mac + ' [ether] on ' + dev.arp[ip].iface).join('\n');
  }
  function ipNeigh(net, dev) { return Object.keys(dev.arp || {}).map(ip => ip + ' dev ' + dev.arp[ip].iface + ' lladdr ' + dev.arp[ip].mac + ' REACHABLE').join('\n'); }

  // ---------- HTTP / ports ----------
  function parseUrl(u) {
    let s = String(u || ''); let proto = 'http';
    const m = s.match(/^(https?):\/\//i); if (m) { proto = m[1].toLowerCase(); s = s.slice(m[0].length); }
    const slash = s.indexOf('/'); let hostport = slash >= 0 ? s.slice(0, slash) : s; const path = slash >= 0 ? s.slice(slash) : '/';
    let port = proto === 'https' ? 443 : 80; const c = hostport.lastIndexOf(':'); if (c > 0) { port = Number(hostport.slice(c + 1)) || port; hostport = hostport.slice(0, c); }
    return { proto, host: hostport, port, path };
  }
  function curl(net, dev, url, flags, session) {
    if (!url) return 'curl: try \'curl --help\' for more information';
    const u = parseUrl(url);
    const c = N().tcpConnect(net, dev.id, u.host, u.port);
    if (session) session.lastConnect = c;
    if (c.status === 'dns-fail') return 'curl: (6) Could not resolve host: ' + u.host;
    if (c.status === 'closed') return 'curl: (7) Failed to connect to ' + u.host + ' port ' + u.port + ' after 3 ms: Connection refused';
    if (c.status === 'filtered' || c.status === 'dropped') return 'curl: (28) Failed to connect to ' + u.host + ' port ' + u.port + ' after 5001 ms: Connection timed out' + (c.reason ? '\n[diagnostic] ' + c.reason : '');
    if (c.status !== 'open') return 'curl: (7) Failed to connect to ' + u.host + ' port ' + u.port + ': ' + (c.status === 'no-route' ? 'Network is unreachable' : 'No route to host') + (c.reason ? '\n[diagnostic] ' + c.reason : '');
    const svc = c.service || {};
    const isHttp = ['http', 'https', 'http-alt'].includes(svc.name);
    if (!isHttp) return 'curl: (1) Received HTTP/0.9 when not allowed\n[diagnostic] port ' + u.port + ' is open but the service (' + svc.name + ') does not speak HTTP' + (svc.banner ? ' – banner: ' + svc.banner : '');
    const body = (u.path !== '/' && svc.pages && svc.pages[u.path]) || (u.path === '/' ? (svc.content || '<html><head><title>' + u.host + '</title></head><body><h1>It works!</h1></body></html>') : null);
    const status = body ? (svc.status || 200) : 404;
    const headers = ['HTTP/1.1 ' + status + ' ' + (status === 200 ? 'OK' : status === 404 ? 'Not Found' : status === 301 ? 'Moved Permanently' : 'Error'), 'Date: ' + new Date().toUTCString(), 'Server: ' + (svc.banner || 'nginx/1.24.0'), 'Content-Type: text/html; charset=UTF-8', 'Content-Length: ' + (body || '').length].concat(svc.headers ? Object.keys(svc.headers).map(k => k + ': ' + svc.headers[k]) : []);
    if (flags.I) return headers.join('\n') + '\n';
    if (flags.v) return headers.map(h => '< ' + h).join('\n') + '\n<\n' + (body || '<html><body><h1>404 Not Found</h1></body></html>');
    return body || '<html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>';
  }
  const TOP_PORTS = [21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 1433, 1723, 3306, 3389, 5900, 8080, 8443];
  function nmap(net, dev, args, session) {
    const flags = {}; const targets = []; let ports = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-p') { ports = parsePorts(args[++i]); } else if (a.startsWith('-p')) ports = parsePorts(a.slice(2));
      else if (a === '-sn' || a === '-sP') flags.sn = true; else if (a === '-sV' || a === '-A') flags.sV = true; else if (a === '-Pn') flags.Pn = true; else if (a === '-F') flags.F = true; else if (a === '-O') flags.O = true; else if (a === '-sS' || a === '-sT' || a === '-v' || a === '-T4' || a === '-T5' || a === '-n' || a === '-sU' || a === '--open') { if (a === '-sU') flags.sU = true; if (a === '--open') flags.open = true; } else if (a.startsWith('-')) return 'nmap: unrecognized option \'' + a + '\'';
      else targets.push(a);
    }
    if (!targets.length) return 'Nmap 7.94SVN ( https://nmap.org )\nUsage: nmap [Scan Type(s)] [Options] {target specification}\nEXAMPLES:\n  nmap -sn 192.168.1.0/24\n  nmap -sV -p 1-1000 192.168.1.2\n  nmap -F scanme.lab';
    const L = ['Starting Nmap 7.94SVN ( https://nmap.org ) at ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'];
    let hostsUp = 0, scanned = 0; const results = [];
    for (const t of targets) {
      let ips = [];
      if (t.includes('/')) { const inf = S().info(t); if (!inf) { L.push('Failed to resolve "' + t + '".'); continue; } if (inf.hosts > 1024) { L.push('Target range too large for this lab (max /22).'); continue; } for (let n = inf.networkInt + 1; n < inf.broadcastInt; n++) ips.push(S().intToIp(n)); }
      else if (/^\d+\.\d+\.\d+\.\d+-\d+$/.test(t)) { const [base, end] = t.split('-'); const parts = base.split('.'); const start = Number(parts[3]); for (let n = start; n <= Number(end); n++) ips.push(parts.slice(0, 3).join('.') + '.' + n); }
      else { const r = N().resolve(net, dev.id, t); if (!r.ok) { L.push('Failed to resolve "' + t + '".'); continue; } ips.push(r.ip); }
      for (const ip of ips) {
        scanned++;
        const up = N().ping(net, dev.id, ip).success;
        if (!up && !flags.Pn) continue;
        if (!up && flags.Pn && ips.length > 1) continue;
        hostsUp++;
        const name = N().reverseName(net, ip);
        L.push('Nmap scan report for ' + (name ? name + ' (' + ip + ')' : ip), 'Host is up (' + (0.0002 + Math.random() * 0.002).toFixed(4) + 's latency).');
        const mac = macFor(net, dev, ip); if (mac) L.push('MAC Address: ' + mac.toUpperCase() + ' (NetSec Academy virtual NIC)');
        if (flags.sn) { L.push(''); continue; }
        const plist = ports || (flags.F ? TOP_PORTS.slice(0, 12) : TOP_PORTS);
        const scan = N().portScan(net, dev.id, ip, plist, { skipPing: true });
        const open = scan.results.filter(r => r.state === 'open'); const filtered = scan.results.filter(r => r.state === 'filtered'); const closed = scan.results.filter(r => r.state === 'closed');
        results.push({ ip, name, open, filtered, closed });
        if (closed.length && closed.length === plist.length) L.push('All ' + plist.length + ' scanned ports on ' + ip + ' are closed');
        else if (filtered.length === plist.length) L.push('All ' + plist.length + ' scanned ports on ' + ip + ' are filtered (no-response)');
        else {
          const shown = flags.open ? open : open.concat(filtered);
          const notShown = plist.length - shown.length;
          if (notShown > 0) L.push('Not shown: ' + notShown + (closed.length >= filtered.length ? ' closed tcp ports (reset)' : ' filtered tcp ports (no-response)'));
          L.push(pad('PORT', 9) + pad('STATE', 10) + pad('SERVICE', 12) + (flags.sV ? 'VERSION' : ''));
          for (const r of shown.sort((a, b) => a.port - b.port)) L.push(pad(r.port + '/tcp', 9) + pad(r.state, 10) + pad(r.service, 12) + (flags.sV ? (r.banner || '') : ''));
        }
        if (flags.O) { const d = Object.values(net.devices).find(x => N().ipsOf(x).includes(ip)); L.push('OS details: ' + (d ? (d.os === 'windows' ? 'Microsoft Windows 10 - 11' : N().kindOf(d) === 'router' ? 'Cisco IOS 15.X' : 'Linux 5.X - 6.X') : 'unknown')); }
        if (flags.sV) L.push('Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .');
        L.push('');
      }
    }
    L.push('Nmap done: ' + scanned + ' IP address' + (scanned === 1 ? '' : 'es') + ' (' + hostsUp + ' host' + (hostsUp === 1 ? '' : 's') + ' up) scanned in ' + (0.5 + scanned * 0.12 + Math.random()).toFixed(2) + ' seconds');
    if (session) session.lastScan = { targets, results, hostsUp };
    return L.join('\n');
  }
  function macFor(net, dev, ip) { for (const k of Object.keys(dev.arp || {})) if (k === ip) return dev.arp[k].mac; return null; }
  function parsePorts(spec) { const out = []; for (const part of String(spec || '').split(',')) { if (part.includes('-')) { const [a, b] = part.split('-').map(Number); for (let i = a; i <= Math.min(b, a + 2000); i++) out.push(i); } else if (part.trim()) out.push(Number(part)); } return out.filter(p => p > 0 && p < 65536); }
  function testNetConnection(net, dev, host, port) {
    if (!host) return 'Test-NetConnection : Missing ComputerName';
    const r = N().resolve(net, dev.id, host);
    if (!r.ok) return 'WARNING: Name resolution of ' + host + ' failed';
    const L = ['', 'ComputerName           : ' + host, 'RemoteAddress          : ' + r.ip];
    if (port) { const c = N().tcpConnect(net, dev.id, r.ip, port); L.push('RemotePort             : ' + port, 'InterfaceAlias         : Ethernet0', 'SourceAddress          : ' + srcIp(dev), 'TcpTestSucceeded       : ' + (c.status === 'open' ? 'True' : 'False')); if (c.status !== 'open') L.unshift('WARNING: TCP connect to (' + r.ip + ' : ' + port + ') failed'); }
    else { const p = N().ping(net, dev.id, r.ip); L.push('InterfaceAlias         : Ethernet0', 'SourceAddress          : ' + srcIp(dev), 'PingSucceeded          : ' + (p.success ? 'True' : 'False'), p.success ? 'PingReplyDetails (RTT) : ' + Math.max(0, Math.round(p.rtt)) + ' ms' : null); if (!p.success) L.unshift('WARNING: Ping to ' + r.ip + ' failed with status: ' + (p.status === 'time-exceeded' ? 'TtlExpired' : 'TimedOut')); }
    return L.filter(x => x !== null).join('\n');
  }

  NSA.termnet = { winMac, adapterName, portForAdapter, pingWindows, pingLinux, tracertWindows, tracerouteLinux, nslookup, dig, ipconfig, ipAddr, ipLink, ipRoute, ifconfig, sockets, ssOut, netstatLinux, netstatWindows, routePrintWindows, arpWindows, arpLinux, ipNeigh, parseUrl, curl, nmap, parsePorts, testNetConnection, TOP_PORTS, pad, lpad, srcIp, ifaceFor };
})(typeof globalThis !== 'undefined' ? globalThis : window);
