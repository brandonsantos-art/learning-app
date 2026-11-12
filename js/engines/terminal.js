/* NetSec Academy – terminal session core (tokenizer, pipelines, Linux shell commands) */
(function (global) {
  const NSA = (global.NSA = global.NSA || {});
  const S = () => NSA.subnet; const N = () => NSA.netsim; const T = () => NSA.termfs; const X = () => NSA.termnet;
  const FS = () => NSA.termfs.FS;

  // ---------- tokenizer ----------
  function tokenize(line, os) {
    const win = os === 'windows';
    const out = []; let cur = ''; let q = null; let has = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === q) { q = null; } else cur += c; continue; }
      if (c === '"' || (c === "'" && !win)) { q = c; has = true; continue; }
      if (c === '\\' && !win && i + 1 < line.length) { cur += line[++i]; has = true; continue; }
      if (c === '>' && (cur === '2' || cur === '1') && !win) { const fd = cur; cur = ''; if (line[i + 1] === '&' && line[i + 2] === '1') { out.push(fd + '>&1'); i += 2; } else out.push(fd + '>'); continue; }
      if (/\s/.test(c)) { if (cur || has) { out.push(cur); cur = ''; has = false; } continue; }
      if (c === '|' || c === '>' || c === '<' || c === ';' || c === '&') {
        if (cur || has) { out.push(cur); cur = ''; has = false; }
        if ((c === '>' || c === '&' || c === '|') && line[i + 1] === c) { out.push(c + c); i++; } else out.push(c);
        continue;
      }
      cur += c;
    }
    if (cur || has) out.push(cur);
    return out;
  }
  function parseFlags(args, withValue) {
    withValue = withValue || [];
    const flags = {}; const pos = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--') { pos.push(...args.slice(i + 1)); break; }
      if (/^--[a-z]/i.test(a)) { const [k, v] = a.slice(2).split('='); if (v !== undefined) flags[k] = v; else if (withValue.includes('--' + k) && i + 1 < args.length) flags[k] = args[++i]; else flags[k] = true; continue; }
      if (/^-[a-zA-Z]/.test(a)) {
        if (withValue.includes(a)) { flags[a.slice(1)] = args[++i]; continue; }
        const letters = a.slice(1);
        const m = letters.match(/^([a-zA-Z])(\d+)$/); if (m) { flags[m[1]] = m[2]; continue; }
        for (let k = 0; k < letters.length; k++) { const ch = letters[k]; if (withValue.includes('-' + ch)) { const rest = letters.slice(k + 1); flags[ch] = rest !== '' ? rest : args[++i]; break; } flags[ch] = true; }
        continue;
      }
      pos.push(a);
    }
    return { flags, pos };
  }

  // ---------- filters (pipe targets) ----------
  function applyFilter(name, args, input, os) {
    const lines = input.replace(/\n$/, '').split('\n');
    const { flags, pos } = parseFlags(args, ['-n', '-d', '-f', '-m', '-A', '-B', '-C']);
    switch (name) {
      case 'grep': case 'egrep': case 'findstr': case 'find': {
        let pat = pos[0]; if (pat === undefined) return { out: '', err: 'Usage: ' + name + ' [OPTION]... PATTERN' };
        if (name === 'find') pat = pat.replace(/^"|"$/g, '');
        let re; try { re = new RegExp(flags.F || name === 'find' || flags.C ? pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : pat, flags.i || name === 'findstr' && flags.I ? 'i' : ''); } catch (e) { re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags.i ? 'i' : ''); }
        let res = lines.filter(l => re.test(l) !== !!flags.v);
        if (flags.c) return { out: String(res.length) };
        if (flags.n) res = lines.map((l, k) => re.test(l) !== !!flags.v ? (k + 1) + ':' + l : null).filter(x => x !== null);
        if (flags.o) res = res.map(l => (l.match(re) || [''])[0]);
        return { out: res.join('\n') };
      }
      case 'head': return { out: lines.slice(0, Number(flags.n || pos[0] && /^\d+$/.test(pos[0]) ? pos[0] : 10) || 10).join('\n') };
      case 'tail': return { out: lines.slice(-(Number(flags.n || 10) || 10)).join('\n') };
      case 'wc': { const words = input.split(/\s+/).filter(Boolean).length; const chars = input.length; const nl = (input.match(/\n/g) || []).length; if (flags.l) return { out: String(nl) }; if (flags.w) return { out: String(words) }; if (flags.c) return { out: String(chars) }; return { out: nl + ' ' + words + ' ' + chars }; }
      case 'sort': { let res = lines.slice(); if (flags.n) res.sort((a, b) => parseFloat(a) - parseFloat(b)); else res.sort(); if (flags.r) res.reverse(); if (flags.u) res = res.filter((l, i) => res.indexOf(l) === i); return { out: res.join('\n') }; }
      case 'uniq': { const res = []; let last = null, count = 0; for (const l of lines.concat([null])) { if (l === last) { count++; continue; } if (last !== null) res.push(flags.c ? X().lpad(count, 7) + ' ' + last : last); last = l; count = 1; } return { out: res.join('\n') }; }
      case 'cut': { const d = flags.d !== undefined ? flags.d : '\t'; const f = String(flags.f || '1').split(',').map(Number); return { out: lines.map(l => { const parts = l.split(d); return f.map(i => parts[i - 1] || '').join(d); }).join('\n') }; }
      case 'awk': { const prog = pos[0] || ''; const m = prog.match(/\{\s*print\s+(.*?)\s*\}/); if (!m) return { out: input }; const fields = m[1].split(/[,\s]+/).filter(Boolean); const sep = flags.F ? new RegExp(flags.F === true ? '\\s+' : flags.F) : /\s+/; return { out: lines.map(l => { const parts = l.trim().split(sep); return fields.map(fld => fld === '$0' ? l : fld.startsWith('$') ? (parts[Number(fld.slice(1)) - 1] || '') : fld.replace(/^"|"$/g, '')).join(' '); }).join('\n') }; }
      case 'tr': { if (pos.length < 2) return { out: input }; const from = pos[0], to = pos[1]; if (from === 'a-z' && to === 'A-Z') return { out: input.toUpperCase() }; if (from === 'A-Z' && to === 'a-z') return { out: input.toLowerCase() }; return { out: input.split(from).join(to) }; }
      case 'more': case 'less': case 'cat': return { out: input };
      case 'tee': return { out: input, tee: pos[0] };
      case 'nl': return { out: lines.map((l, i) => X().lpad(i + 1, 6) + '\t' + l).join('\n') };
      case 'rev': return { out: lines.map(l => l.split('').reverse().join('')).join('\n') };
      case 'xargs': return { out: input };
      case 'column': return { out: input };
      default: return null;
    }
  }
  const FILTERS = ['grep', 'egrep', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut', 'awk', 'tr', 'more', 'less', 'tee', 'nl', 'rev', 'xargs', 'column'];

  // ---------- Linux commands ----------
  const MAN = {
    ls: 'ls - list directory contents\n  ls [-l] [-a] [-h] [FILE...]\n  -l long format, -a include hidden files, -h human readable sizes',
    cd: 'cd - change the working directory\n  cd [DIR]   (cd with no argument returns to $HOME; cd .. goes up one level)',
    pwd: 'pwd - print name of current/working directory',
    cat: 'cat - concatenate files and print on the standard output\n  cat FILE...',
    grep: 'grep - print lines that match patterns\n  grep [-i] [-n] [-v] [-c] [-r] PATTERN [FILE...]\n  -i ignore case, -n line numbers, -v invert match, -c count, -r recursive',
    chmod: 'chmod - change file mode bits\n  chmod [-R] MODE FILE...\n  MODE is octal (644, 755) or symbolic (u+x, go-w, a=r). r=4 w=2 x=1',
    chown: 'chown - change file owner and group\n  chown [-R] OWNER[:GROUP] FILE...   (requires root / sudo)',
    ip: 'ip - show / manipulate routing, devices and tunnels\n  ip addr [show]          ip addr add 192.168.1.10/24 dev eth0\n  ip link set eth0 up     ip route [show]\n  ip route add default via 192.168.1.1    ip neigh',
    ping: 'ping - send ICMP ECHO_REQUEST to network hosts\n  ping [-c COUNT] DESTINATION',
    traceroute: 'traceroute - print the route packets trace to network host\n  traceroute HOST',
    nslookup: 'nslookup - query Internet name servers interactively\n  nslookup NAME [SERVER]',
    dig: 'dig - DNS lookup utility\n  dig [@SERVER] NAME [+short]',
    ss: 'ss - another utility to investigate sockets\n  ss -tuln   (TCP, UDP, listening, numeric)   ss -tulpn adds process names',
    netstat: 'netstat - print network connections, routing tables\n  netstat -tulpn   netstat -an   netstat -rn',
    curl: 'curl - transfer a URL\n  curl [-I] [-v] URL     -I headers only',
    journalctl: 'journalctl - query the systemd journal\n  journalctl [-u UNIT] [-n LINES] [-p PRIORITY] [-r]\n  e.g. journalctl -u sshd -n 20',
    systemctl: 'systemctl - control the systemd system and service manager\n  systemctl status|start|stop|restart|enable|disable UNIT',
    find: 'find - search for files in a directory hierarchy\n  find PATH [-name PATTERN] [-type f|d] [-perm -4000] [-user USER]',
    sudo: 'sudo - execute a command as another user\n  sudo COMMAND     sudo -i  (interactive root shell)',
    useradd: 'useradd - create a new user\n  useradd [-m] [-s SHELL] [-G GROUPS] LOGIN   (-m creates the home directory)',
    usermod: 'usermod - modify a user account\n  usermod -aG GROUP USER   (append to group)   usermod -L USER (lock)',
    nmap: 'nmap - Network exploration tool and security / port scanner\n  nmap [-sn] [-sV] [-p PORTS] [-F] [-Pn] TARGET   (lab hosts only)',
    tar: 'tar - an archiving utility (simulated)', ifconfig: 'ifconfig - configure a network interface (legacy; prefer ip)\n  ifconfig [IFACE] [IP netmask MASK] [up|down]',
    dhclient: 'dhclient - Dynamic Host Configuration Protocol Client\n  dhclient [-r] [IFACE]   (-r releases the lease)',
    ufw: 'ufw - program for managing a netfilter firewall\n  ufw status | enable | disable | allow PORT | deny PORT', id: 'id - print real and effective user and group IDs', whoami: 'whoami - print effective user name', echo: 'echo - display a line of text', touch: 'touch - change file timestamps / create empty file', mkdir: 'mkdir - make directories (-p creates parents)', rm: 'rm - remove files or directories (-r recursive, -f force)', cp: 'cp - copy files', mv: 'mv - move (rename) files', head: 'head - output the first part of files (-n N)', tail: 'tail - output the last part of files (-n N)', wc: 'wc - print newline, word, and byte counts (-l lines)', history: 'history - show command history', hostname: 'hostname - show the system host name (-I shows IP addresses)', stat: 'stat - display file status including permissions and ownership', sha256sum: 'sha256sum - compute SHA256 message digest', md5sum: 'md5sum - compute MD5 message digest', ps: 'ps - report a snapshot of current processes (ps aux)', kill: 'kill - send a signal to a process', groupadd: 'groupadd - create a new group', passwd: 'passwd - change user password', nc: 'nc - arbitrary TCP and UDP connections\n  nc -zv HOST PORT  (port check)', arp: 'arp - manipulate the system ARP cache (-a / -n)', route: 'route - show / manipulate the IP routing table (-n)', host: 'host - DNS lookup utility\n  host NAME [SERVER]', last: 'last - show a listing of last logged in users', uname: 'uname - print system information (-a)', date: 'date - print the system date and time', df: 'df - report file system disk space usage (-h)', du: 'du - estimate file space usage', env: 'env - print environment', export: 'export - set environment variable', which: 'which - locate a command', man: 'man - an interface to the system reference manuals', clear: 'clear - clear the terminal screen', exit: 'exit - leave the shell'
  };
  function ctxFs(ctx) { return ctx.host.fs; }
  function resolveP(ctx, p) { return T().normPath(p, ctx.session.cwd, ctx.homeOf(ctx.user)); }
  function readFile(ctx, path) {
    const p = resolveP(ctx, path); const host = ctx.host;
    const node = host.fs[p]; const virt = T().VIRTUAL[p];
    if (!node && !virt) return { err: 'No such file or directory' };
    if (node && node.type === 'dir') return { err: 'Is a directory' };
    if (!FS().canTraverse(host, T().dirname(p), ctx.user)) return { err: 'Permission denied' };
    if (node && !FS().perm(host, node, ctx.user, 'r')) return { err: 'Permission denied' };
    if (!node && virt && (p === '/etc/shadow')) return { err: 'Permission denied' };
    return { content: T().readContent(host, ctx.dev, p), path: p };
  }
  function lsLong(ctx, p, node, name) {
    const h = ctx.flags && ctx.flags.h;
    const size = FS().size(node);
    return FS().modeStr(node) + ' ' + X().lpad(node.type === 'dir' ? 2 : 1, 2) + ' ' + X().pad(node.owner, 8) + ' ' + X().pad(node.group, 8) + ' ' + X().lpad(h ? human(size) : size, 6) + ' ' + node.mtime + ' ' + name;
  }
  function human(n) { if (n < 1024) return n; if (n < 1048576) return (n / 1024).toFixed(1) + 'K'; return (n / 1048576).toFixed(1) + 'M'; }
  function fakeHash(s, len) { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0; h2 = Math.imul(h2 + s.charCodeAt(i), 2246822519) >>> 0; } let out = ''; let a = h1, b = h2; while (out.length < len) { a = Math.imul(a ^ (a >>> 13), 1274126177) >>> 0; b = Math.imul(b ^ (b >>> 11), 3266489917) >>> 0; out += (a ^ b).toString(16).padStart(8, '0'); } return out.slice(0, len); }
  function parseMode(spec, cur, isDir) {
    if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec, 8);
    let mode = cur;
    for (const part of spec.split(',')) {
      const m = part.match(/^([ugoa]*)([+\-=])([rwxXst]*)$/); if (!m) return null;
      const who = m[1] || 'a'; const op = m[2]; let bits = 0;
      for (const c of m[3]) { if (c === 'r') bits |= 4; if (c === 'w') bits |= 2; if (c === 'x' || (c === 'X' && (isDir || (cur & 0o111)))) bits |= 1; }
      let mask = 0; if (who.includes('a')) mask = 0o777; else { if (who.includes('u')) mask |= 0o700; if (who.includes('g')) mask |= 0o070; if (who.includes('o')) mask |= 0o007; }
      const expanded = (bits * 0o111) & mask; // replicate bits to u/g/o positions
      const special = (m[3].includes('s') ? (who.includes('u') || who === 'a' ? 0o4000 : 0) | (who.includes('g') || who === 'a' ? 0o2000 : 0) : 0) | (m[3].includes('t') ? 0o1000 : 0);
      if (op === '+') mode |= expanded | special; else if (op === '-') mode &= ~(expanded | special); else mode = (mode & ~mask & ~0o7000) | expanded | special;
    }
    return mode;
  }
  function isSudoer(host, user) { return user === 'root' || (host.groups.sudo && host.groups.sudo.members.includes(user)) || (host.groups.wheel && host.groups.wheel.members.includes(user)) || (host.sudoers || []).includes(user); }
  function processes(ctx) {
    const dev = ctx.dev; const host = ctx.host;
    const P = [{ user: 'root', pid: 1, cpu: 0.0, mem: 0.3, cmd: '/sbin/init' }, { user: 'root', pid: 2, cpu: 0.0, mem: 0.0, cmd: '[kthreadd]' }, { user: 'root', pid: 601, cpu: 0.0, mem: 0.6, cmd: '/lib/systemd/systemd-resolved' }, { user: 'root', pid: 640, cpu: 0.0, mem: 0.2, cmd: '/sbin/dhclient eth0' }, { user: 'root', pid: 812, cpu: 0.0, mem: 0.4, cmd: 'sshd: /usr/sbin/sshd -D [listener]' }, { user: 'root', pid: 830, cpu: 0.0, mem: 0.1, cmd: '/usr/sbin/cron -f' }, { user: 'syslog', pid: 760, cpu: 0.0, mem: 0.3, cmd: '/usr/sbin/rsyslogd -n' }];
    for (const s of Object.keys(dev.services || {})) { if (dev.services[s].enabled === false) continue; const unit = T().svcUnit(s); const map = { apache2: { user: 'www-data', cmd: '/usr/sbin/apache2 -k start', pid: 901 }, named: { user: 'bind', cmd: '/usr/sbin/named -f -u bind', pid: 880 }, 'isc-dhcp-server': { user: 'root', cmd: '/usr/sbin/dhcpd -4 -q -cf /etc/dhcp/dhcpd.conf', pid: 890 }, mysql: { user: 'mysql', cmd: '/usr/sbin/mysqld', pid: 950 }, vsftpd: { user: 'root', cmd: '/usr/sbin/vsftpd /etc/vsftpd.conf', pid: 960 }, smbd: { user: 'root', cmd: '/usr/sbin/smbd --foreground', pid: 970 }, 'redis-server': { user: 'redis', cmd: '/usr/bin/redis-server 0.0.0.0:6379', pid: 980 }, inetd: { user: 'root', cmd: '/usr/sbin/inetd', pid: 985 } }; if (map[unit]) P.push({ user: map[unit].user, pid: map[unit].pid, cpu: 0.1, mem: 1.2, cmd: map[unit].cmd }); }
    P.push({ user: ctx.session.user, pid: 1203, cpu: 0.0, mem: 0.2, cmd: 'sshd: ' + ctx.session.user + '@pts/0' }, { user: ctx.session.user, pid: 1210, cpu: 0.0, mem: 0.3, cmd: '-bash' });
    for (const p of host.extraProcesses || []) P.push(p);
    P.push({ user: ctx.session.user, pid: 2042, cpu: 0.0, mem: 0.1, cmd: 'ps aux' });
    return P;
  }
  function journalLines(ctx, flags, pos) {
    let J = ctx.host.journal.slice();
    const PRI = { emerg: 0, alert: 1, crit: 2, err: 3, warning: 4, notice: 5, info: 6, debug: 7 };
    if (flags.u) { const u = String(flags.u).replace(/\.service$/, ''); const alias = { ssh: ['ssh', 'sshd'], sshd: ['ssh', 'sshd'], apache2: ['apache2'], cron: ['CRON', 'cron'], named: ['named'], bind9: ['named'], 'systemd-logind': ['systemd-logind'] }[u] || [u]; J = J.filter(j => alias.includes(j.unit)); }
    if (flags.k) J = J.filter(j => j.unit === 'kernel');
    if (flags.p !== undefined) { const p = /^\d$/.test(flags.p) ? Number(flags.p) : PRI[flags.p]; if (p !== undefined) J = J.filter(j => (j.pri != null ? j.pri : 6) <= p); }
    if (flags.g) { const re = new RegExp(flags.g, 'i'); J = J.filter(j => re.test(j.msg)); }
    if (pos.length && /^_COMM=|^SYSLOG_IDENTIFIER=/.test(pos[0])) { const v = pos[0].split('=')[1]; J = J.filter(j => j.unit === v); }
    if (flags.r) J.reverse();
    if (flags.n) J = flags.r ? J.slice(0, Number(flags.n)) : J.slice(-Number(flags.n));
    const fmt = T().fmtJournal(ctx.host);
    if (!J.length) return '-- No entries --';
    return (flags.n || flags.r ? '' : '-- Journal begins at ' + new Date(Date.now() - 86400000 * 3).toDateString() + '. --\n') + J.map(fmt).join('\n');
  }
  function sysctl(ctx, pos) {
    const [action, unitRaw] = pos; const unit = String(unitRaw || '').replace(/\.service$/, '');
    const host = ctx.host; const dev = ctx.dev;
    if (!action) return { out: 'Usage: systemctl status|start|stop|restart|enable|disable UNIT' };
    if (action === 'list-units' || action === 'list-unit-files') return { out: Object.keys(host.services).map(u => X().pad(u + '.service', 32) + (host.services[u] === 'active' ? 'loaded active running' : 'loaded inactive dead')).join('\n') };
    if (!unit) return { err: 'Too few arguments.' };
    const alias = { sshd: 'ssh', bind9: 'named', httpd: 'apache2', nginx: 'apache2', dhcpd: 'isc-dhcp-server', mariadb: 'mysql' }; const u = alias[unit] || unit;
    const svcName = T().unitToService(u);
    if (host.services[u] === undefined && !svcName) return { err: 'Unit ' + unit + '.service could not be found.' };
    if (action === 'status') { const active = host.services[u] === 'active'; return { out: '● ' + u + '.service - ' + ({ ssh: 'OpenBSD Secure Shell server', apache2: 'The Apache HTTP Server', named: 'BIND Domain Name Server', 'isc-dhcp-server': 'ISC DHCP IPv4 server', mysql: 'MySQL Community Server', cron: 'Regular background program processing daemon', vsftpd: 'vsftpd FTP server', smbd: 'Samba SMB Daemon' }[u] || u + ' service') + '\n     Loaded: loaded (/lib/systemd/system/' + u + '.service; enabled; preset: enabled)\n     Active: ' + (active ? 'active (running) since ' + new Date(Date.now() - 7200000).toUTCString() + '; 2h ago' : 'inactive (dead)') + '\n' + (active ? '   Main PID: ' + (800 + u.length * 7) + ' (' + u + ')\n      Tasks: 3\n     Memory: 6.2M\n' : '') + '\n' + host.journal.filter(j => j.unit === u || (u === 'ssh' && j.unit === 'sshd')).slice(-3).map(T().fmtJournal(host)).join('\n') }; }
    if (!['start', 'stop', 'restart', 'enable', 'disable', 'reload'].includes(action)) return { err: 'Unknown command verb ' + action + '.' };
    if (ctx.user !== 'root') return { err: 'Failed to ' + action + ' ' + u + '.service: Access denied\nSee system logs and \'systemctl status ' + u + '.service\' for details.\n[hint] use sudo' };
    if (action === 'enable' || action === 'disable') return { out: (action === 'enable' ? 'Created symlink /etc/systemd/system/multi-user.target.wants/' + u + '.service → /lib/systemd/system/' + u + '.service.' : 'Removed /etc/systemd/system/multi-user.target.wants/' + u + '.service.') };
    const running = action !== 'stop';
    host.services[u] = running ? 'active' : 'inactive';
    if (svcName && dev.services && dev.services[svcName]) dev.services[svcName].enabled = running;
    if (svcName === 'http' && dev.services && dev.services.https) dev.services.https.enabled = running;
    host.journal.push({ ts: T().ts(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()), unit: 'systemd', pid: 1, pri: 6, msg: (running ? 'Started ' : 'Stopped ') + u + '.service.' });
    return { out: '' };
  }

  const linux = {
    pwd: ctx => ctx.session.cwd,
    cd: ctx => { const p = resolveP(ctx, ctx.pos[0] === undefined ? '~' : ctx.pos[0]); const n = ctx.host.fs[p]; if (!n) return { err: 'cd: ' + (ctx.pos[0] || '~') + ': No such file or directory' }; if (n.type !== 'dir') return { err: 'cd: ' + ctx.pos[0] + ': Not a directory' }; if (!FS().canTraverse(ctx.host, p, ctx.user)) return { err: 'cd: ' + ctx.pos[0] + ': Permission denied' }; ctx.session.cwd = p; return ''; },
    ls: ctx => {
      const targets = ctx.pos.length ? ctx.pos : ['.']; const out = [];
      for (const t of targets) {
        const p = resolveP(ctx, t); const n = ctx.host.fs[p] || (T().VIRTUAL[p] ? T().file('') : null);
        if (!n) { out.push('ls: cannot access \'' + t + '\': No such file or directory'); continue; }
        if (n.type !== 'dir' || ctx.flags.d) { out.push(ctx.flags.l ? lsLong(ctx, p, ctx.host.fs[p] || n, t) : t); continue; }
        if (!FS().perm(ctx.host, n, ctx.user, 'r') || !FS().canTraverse(ctx.host, p, ctx.user)) { out.push('ls: cannot open directory \'' + t + '\': Permission denied'); continue; }
        let kids = FS().children(ctx.host.fs, p).concat(Object.keys(T().VIRTUAL).filter(v => T().dirname(v) === p && !ctx.host.fs[v]));
        kids = Array.from(new Set(kids)).sort();
        let names = kids.map(k => T().basename(k)); if (!ctx.flags.a) names = names.filter(x => !x.startsWith('.'));
        if (targets.length > 1) out.push(t + ':');
        if (ctx.flags.l) { const rows = []; if (ctx.flags.a) { rows.push(lsLong(ctx, p, n, '.'), lsLong(ctx, p, ctx.host.fs[T().dirname(p)] || n, '..')); } for (const k of names) { const node = ctx.host.fs[(p === '/' ? '' : p) + '/' + k] || T().file(T().readContent(ctx.host, ctx.dev, (p === '/' ? '' : p) + '/' + k) || ''); rows.push(lsLong(ctx, p, node, k)); } out.push('total ' + rows.length * 4, ...rows); }
        else out.push(ctx.flags[1] ? names.join('\n') : names.join('  '));
      }
      return out.join('\n');
    },
    ll: ctx => { ctx.flags.l = true; ctx.flags.a = true; return linux.ls(ctx); },
    cat: ctx => { if (!ctx.pos.length) return ctx.stdin || ''; const out = []; let err = null; for (const f of ctx.pos) { const r = readFile(ctx, f); if (r.err) { err = (err ? err + '\n' : '') + 'cat: ' + f + ': ' + r.err; continue; } out.push(r.content.replace(/\n$/, '')); } return err ? { out: out.join('\n'), err } : out.join('\n'); },
    head: ctx => { const files = ctx.pos.filter(p => !/^-\d+$/.test(p)); const nflag = ctx.args.find(a => /^-\d+$/.test(a)); const fargs = ctx.args.filter(a => !files.includes(a) && !/^-\d+$/.test(a)).concat(nflag ? ['-n', nflag.slice(1)] : []); if (!files.length) return applyFilter('head', fargs, ctx.stdin || '').out; const r = readFile(ctx, files[0]); if (r.err) return { err: 'head: cannot open \'' + files[0] + '\' for reading: ' + r.err }; return applyFilter('head', fargs, r.content).out; },
    tail: ctx => { const files = ctx.pos.filter(p => !/^-\d+$/.test(p)); const nflag = ctx.args.find(a => /^-\d+$/.test(a)); const fargs = ctx.args.filter(a => !files.includes(a) && a !== '-f' && !/^-\d+$/.test(a)).concat(nflag ? ['-n', nflag.slice(1)] : []); if (!files.length) return applyFilter('tail', fargs, ctx.stdin || '').out; const r = readFile(ctx, files[0]); if (r.err) return { err: 'tail: cannot open \'' + files[0] + '\' for reading: ' + r.err }; return applyFilter('tail', fargs, r.content).out; },
    less: ctx => linux.cat(ctx), more: ctx => linux.cat(ctx),
    wc: ctx => { if (!ctx.pos.length) return applyFilter('wc', ctx.args, ctx.stdin || '').out; const outs = []; for (const f of ctx.pos) { const r = readFile(ctx, f); if (r.err) return { err: 'wc: ' + f + ': ' + r.err }; outs.push(applyFilter('wc', ctx.args.filter(a => a !== f), r.content).out + ' ' + f); } return outs.join('\n'); },
    grep: ctx => {
      const { flags, pos } = parseFlags(ctx.args, ['-A', '-B', '-C', '-m']);
      if (!pos.length) return { err: 'Usage: grep [OPTION]... PATTERNS [FILE...]' };
      const pattern = pos[0]; const files = pos.slice(1);
      if (!files.length) return applyFilter('grep', ctx.args, ctx.stdin || '').out;
      const out = []; let err = '';
      let list = [];
      for (const f of files) { const p = resolveP(ctx, f); const n = ctx.host.fs[p]; if (n && n.type === 'dir') { if (!flags.r && !flags.R) { err += 'grep: ' + f + ': Is a directory\n'; continue; } const pre = p === '/' ? '/' : p + '/'; list.push(...Object.keys(ctx.host.fs).filter(k => k.startsWith(pre) && ctx.host.fs[k].type === 'file')); } else list.push(p); }
      for (const p of list) { const r = readFile(ctx, p); if (r.err) { err += 'grep: ' + p + ': ' + r.err + '\n'; continue; } const res = applyFilter('grep', [pattern].concat(ctx.args.filter(a => a.startsWith('-'))), r.content).out; if (res) out.push(list.length > 1 ? res.split('\n').map(l => p + ':' + l).join('\n') : res); }
      return err ? { out: out.join('\n'), err: err.trim() } : out.join('\n');
    },
    egrep: ctx => linux.grep(ctx),
    find: ctx => {
      const a = ctx.args; const start = a[0] && !a[0].startsWith('-') ? a[0] : '.'; const p = resolveP(ctx, start);
      if (!ctx.host.fs[p]) return { err: 'find: \'' + start + '\': No such file or directory' };
      const opts = {}; for (let i = 0; i < a.length; i++) { if (a[i] === '-name' || a[i] === '-iname') opts.name = a[++i]; else if (a[i] === '-type') opts.type = a[++i]; else if (a[i] === '-perm') opts.perm = a[++i]; else if (a[i] === '-user') opts.user = a[++i]; else if (a[i] === '-group') opts.group = a[++i]; else if (a[i] === '-newer' || a[i] === '-mtime' || a[i] === '-size' || a[i] === '-maxdepth') i++; }
      const re = opts.name ? new RegExp('^' + opts.name.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i') : null;
      const pre = p === '/' ? '/' : p + '/'; const out = []; let denied = [];
      for (const k of Object.keys(ctx.host.fs).sort()) {
        if (k !== p && !k.startsWith(pre)) continue; const n = ctx.host.fs[k];
        if (!FS().canTraverse(ctx.host, T().dirname(k), ctx.user)) { if (!denied.some(d => k.startsWith(d))) denied.push(T().dirname(k)); continue; }
        if (opts.type === 'f' && n.type !== 'file') continue; if (opts.type === 'd' && n.type !== 'dir') continue;
        if (re && !re.test(T().basename(k))) continue;
        if (opts.user && n.owner !== opts.user) continue; if (opts.group && n.group !== opts.group) continue;
        if (opts.perm) { const spec = opts.perm; if (spec.startsWith('-')) { const bits = parseInt(spec.slice(1), 8); if ((n.mode & bits) !== bits) continue; } else if (spec.startsWith('/')) { const bits = parseInt(spec.slice(1), 8); if (!(n.mode & bits)) continue; } else if ((n.mode & 0o7777) !== parseInt(spec, 8)) continue; }
        out.push(start === '.' ? '.' + k.slice(p.length) || '.' : (start.endsWith('/') && start !== '/' ? start.slice(0, -1) : start) + k.slice(p.length));
      }
      const errs = Array.from(new Set(denied)).map(d => 'find: \'' + d + '\': Permission denied');
      return errs.length ? { out: out.join('\n'), err: errs.join('\n') } : out.join('\n');
    },
    touch: ctx => { for (const f of ctx.pos) { const p = resolveP(ctx, f); if (ctx.host.fs[p]) continue; if (!FS().canWrite(ctx.host, p, ctx.user)) return { err: 'touch: cannot touch \'' + f + '\': Permission denied' }; if (!ctx.host.fs[T().dirname(p)]) return { err: 'touch: cannot touch \'' + f + '\': No such file or directory' }; FS().write(ctx.host.fs, p, '', { owner: ctx.user, group: ctx.groupOf(ctx.user) }); } return ''; },
    mkdir: ctx => { for (const f of ctx.pos) { const p = resolveP(ctx, f); if (ctx.host.fs[p]) return { err: 'mkdir: cannot create directory \'' + f + '\': File exists' }; const parent = T().dirname(p); if (!ctx.host.fs[parent]) { if (!ctx.flags.p) return { err: 'mkdir: cannot create directory \'' + f + '\': No such file or directory' }; FS().ensureDirs(ctx.host.fs, parent, ctx.user); } if (!FS().canWrite(ctx.host, p, ctx.user)) return { err: 'mkdir: cannot create directory \'' + f + '\': Permission denied' }; ctx.host.fs[p] = T().dir({ owner: ctx.user, group: ctx.groupOf(ctx.user) }); } return ''; },
    rm: ctx => { if (!ctx.pos.length) return { err: 'rm: missing operand' }; for (const f of ctx.pos) { const p = resolveP(ctx, f); const n = ctx.host.fs[p]; if (!n) { if (ctx.flags.f) continue; return { err: 'rm: cannot remove \'' + f + '\': No such file or directory' }; } if (n.type === 'dir' && !ctx.flags.r && !ctx.flags.R) return { err: 'rm: cannot remove \'' + f + '\': Is a directory' }; if (!FS().canWrite(ctx.host, T().dirname(p), ctx.user)) return { err: 'rm: cannot remove \'' + f + '\': Permission denied' }; if (p === '/' || p === '/etc' || p === '/home') return { err: 'rm: it is dangerous to operate recursively on \'' + p + '\' (refusing in this lab)' }; FS().remove(ctx.host.fs, p); } return ''; },
    rmdir: ctx => { ctx.flags.r = true; return linux.rm(ctx); },
    cp: ctx => { if (ctx.pos.length < 2) return { err: 'cp: missing file operand' }; const r = readFile(ctx, ctx.pos[0]); if (r.err) return { err: 'cp: cannot stat \'' + ctx.pos[0] + '\': ' + r.err }; let dst = resolveP(ctx, ctx.pos[1]); if (ctx.host.fs[dst] && ctx.host.fs[dst].type === 'dir') dst = dst.replace(/\/$/, '') + '/' + T().basename(r.path); if (!FS().canWrite(ctx.host, dst, ctx.user)) return { err: 'cp: cannot create regular file \'' + ctx.pos[1] + '\': Permission denied' }; const src = ctx.host.fs[r.path]; FS().write(ctx.host.fs, dst, r.content, { owner: ctx.user, group: ctx.groupOf(ctx.user), mode: src ? src.mode : 0o644 }); return ''; },
    mv: ctx => { if (ctx.pos.length < 2) return { err: 'mv: missing file operand' }; const src = resolveP(ctx, ctx.pos[0]); const n = ctx.host.fs[src]; if (!n) return { err: 'mv: cannot stat \'' + ctx.pos[0] + '\': No such file or directory' }; let dst = resolveP(ctx, ctx.pos[1]); if (ctx.host.fs[dst] && ctx.host.fs[dst].type === 'dir') dst = dst.replace(/\/$/, '') + '/' + T().basename(src); if (!FS().canWrite(ctx.host, T().dirname(src), ctx.user) || !FS().canWrite(ctx.host, dst, ctx.user)) return { err: 'mv: cannot move \'' + ctx.pos[0] + '\': Permission denied' }; const pre = src + '/'; for (const k of Object.keys(ctx.host.fs)) { if (k === src || k.startsWith(pre)) { ctx.host.fs[dst + k.slice(src.length)] = ctx.host.fs[k]; delete ctx.host.fs[k]; } } return ''; },
    echo: ctx => { const parts = ctx.args.filter(a => a !== '-e' && a !== '-n'); return parts.map(a => a.replace(/\$\{?(\w+)\}?/g, (m, v) => v === 'USER' ? ctx.user : v === 'HOME' ? ctx.homeOf(ctx.user) : v === 'PATH' ? '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' : v === 'HOSTNAME' ? ctx.host.hostname : v === 'PWD' ? ctx.session.cwd : v === 'SHELL' ? '/bin/bash' : v === '?' ? String(ctx.session.lastExit || 0) : (ctx.host.env[v] || ''))).join(' '); },
    printf: ctx => ctx.pos.join(' ').replace(/\\n/g, '\n'),
    stat: ctx => { if (!ctx.pos.length) return { err: 'stat: missing operand' }; const p = resolveP(ctx, ctx.pos[0]); const n = ctx.host.fs[p]; if (!n) return { err: 'stat: cannot statx \'' + ctx.pos[0] + '\': No such file or directory' }; const u = ctx.host.users[n.owner] || { uid: 0 }; const g = ctx.host.groups[n.group] || { gid: 0 }; return '  File: ' + ctx.pos[0] + '\n  Size: ' + X().pad(FS().size(n), 10) + '\tBlocks: 8          IO Block: 4096   ' + (n.type === 'dir' ? 'directory' : 'regular file') + '\nDevice: 801h/2049d\tInode: ' + (100000 + p.length * 131) + '     Links: 1\nAccess: (' + FS().octal(n).padStart(4, '0') + '/' + FS().modeStr(n) + ')  Uid: (' + X().lpad(u.uid, 5) + '/' + X().pad(n.owner, 8) + ')   Gid: (' + X().lpad(g.gid, 5) + '/' + X().pad(n.group, 8) + ')\nModify: ' + new Date().getFullYear() + '-11-11 ' + n.mtime.slice(-5) + ':00.000000000 +0000'; },
    chmod: ctx => { const { flags, pos } = parseFlags(ctx.args); if (pos.length < 2) return { err: 'chmod: missing operand' }; const spec = pos[0]; for (const f of pos.slice(1)) { const p = resolveP(ctx, f); const n = ctx.host.fs[p]; if (!n) return { err: 'chmod: cannot access \'' + f + '\': No such file or directory' }; if (ctx.user !== 'root' && n.owner !== ctx.user) return { err: 'chmod: changing permissions of \'' + f + '\': Operation not permitted' }; const targets = flags.R && n.type === 'dir' ? Object.keys(ctx.host.fs).filter(k => k === p || k.startsWith(p + '/')) : [p]; for (const t of targets) { const node = ctx.host.fs[t]; const m = parseMode(spec, node.mode, node.type === 'dir'); if (m === null) return { err: 'chmod: invalid mode: \'' + spec + '\'' }; node.mode = m; } } return ''; },
    chown: ctx => { const { flags, pos } = parseFlags(ctx.args); if (pos.length < 2) return { err: 'chown: missing operand' }; const [owner, group] = pos[0].split(/[:.]/); if (ctx.user !== 'root') return { err: 'chown: changing ownership of \'' + pos[1] + '\': Operation not permitted' }; if (owner && !ctx.host.users[owner]) return { err: 'chown: invalid user: \'' + pos[0] + '\'' }; if (group && !ctx.host.groups[group]) return { err: 'chown: invalid group: \'' + pos[0] + '\'' }; for (const f of pos.slice(1)) { const p = resolveP(ctx, f); const n = ctx.host.fs[p]; if (!n) return { err: 'chown: cannot access \'' + f + '\': No such file or directory' }; const targets = flags.R && n.type === 'dir' ? Object.keys(ctx.host.fs).filter(k => k === p || k.startsWith(p + '/')) : [p]; for (const t of targets) { if (owner) ctx.host.fs[t].owner = owner; if (group) ctx.host.fs[t].group = group; else if (owner && pos[0].includes(':')) ctx.host.fs[t].group = ctx.host.users[owner].group; } } return ''; },
    chgrp: ctx => { const { flags, pos } = parseFlags(ctx.args); if (pos.length < 2) return { err: 'chgrp: missing operand' }; if (!ctx.host.groups[pos[0]]) return { err: 'chgrp: invalid group: \'' + pos[0] + '\'' }; for (const f of pos.slice(1)) { const p = resolveP(ctx, f); const n = ctx.host.fs[p]; if (!n) return { err: 'chgrp: cannot access \'' + f + '\': No such file or directory' }; if (ctx.user !== 'root' && !(n.owner === ctx.user && T().userGroups(ctx.host, ctx.user).includes(pos[0]))) return { err: 'chgrp: changing group of \'' + f + '\': Operation not permitted' }; const targets = flags.R && n.type === 'dir' ? Object.keys(ctx.host.fs).filter(k => k === p || k.startsWith(p + '/')) : [p]; for (const t of targets) ctx.host.fs[t].group = pos[0]; } return ''; },
    whoami: ctx => ctx.user,
    id: ctx => { const u = ctx.pos[0] || ctx.user; const x = ctx.host.users[u]; if (!x) return { err: 'id: \'' + u + '\': no such user' }; const groups = T().userGroups(ctx.host, u); return 'uid=' + x.uid + '(' + u + ') gid=' + x.gid + '(' + x.group + ') groups=' + groups.map(g => (ctx.host.groups[g] ? ctx.host.groups[g].gid : '?') + '(' + g + ')').join(','); },
    groups: ctx => { const u = ctx.pos[0] || ctx.user; if (!ctx.host.users[u]) return { err: 'groups: \'' + u + '\': no such user' }; return (ctx.pos[0] ? u + ' : ' : '') + T().userGroups(ctx.host, u).join(' '); },
    hostname: ctx => ctx.flags.I || ctx.flags.i ? N().ipsOf(ctx.dev).join(' ') : ctx.flags.f ? ctx.host.hostname + (ctx.dev.dnsSuffix ? '.' + ctx.dev.dnsSuffix : '') : ctx.host.hostname,
    hostnamectl: ctx => '   Static hostname: ' + ctx.host.hostname + '\n         Icon name: computer-vm\n           Chassis: vm\n  Operating System: Debian GNU/Linux 12 (bookworm)\n            Kernel: Linux 6.1.0-18-amd64\n      Architecture: x86-64',
    uname: ctx => ctx.flags.a ? 'Linux ' + ctx.host.hostname + ' 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.76-1 (2024-02-01) x86_64 GNU/Linux' : ctx.flags.r ? '6.1.0-18-amd64' : 'Linux',
    date: () => new Date().toString().replace(/ GMT.*$/, '') + ' UTC ' + new Date().getFullYear(),
    uptime: () => ' ' + new Date().toTimeString().slice(0, 8) + ' up  2:14,  1 user,  load average: 0.08, 0.03, 0.01',
    history: ctx => ctx.session.history.map((h, i) => X().lpad(i + 1, 5) + '  ' + h).join('\n'),
    clear: () => ({ out: '', clear: true }),
    env: ctx => ['SHELL=/bin/bash', 'USER=' + ctx.user, 'HOME=' + ctx.homeOf(ctx.user), 'PWD=' + ctx.session.cwd, 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', 'LANG=en_US.UTF-8', 'TERM=xterm-256color', 'HOSTNAME=' + ctx.host.hostname].concat(Object.keys(ctx.host.env).filter(k => !['SHELL', 'LANG', 'TERM'].includes(k)).map(k => k + '=' + ctx.host.env[k])).join('\n'),
    printenv: ctx => linux.env(ctx),
    export: ctx => { for (const a of ctx.pos) { const [k, v] = a.split('='); if (k && v !== undefined) ctx.host.env[k] = v; } return ''; },
    which: ctx => ctx.pos.map(c => (linux[c] || FILTERS.includes(c)) ? '/usr/bin/' + c : '').filter(Boolean).join('\n') || { err: ctx.pos[0] + ' not found', exit: 1 },
    man: ctx => { const c = ctx.pos[0]; if (!c) return 'What manual page do you want?\nFor example, try \'man ls\'.'; return MAN[c] ? MAN[c].toUpperCase().slice(0, 0) + MAN[c] : (linux[c] ? c + ' - supported in this lab; run \'' + c + ' --help\' or try the command' : 'No manual entry for ' + c); },
    help: () => 'NetSec Academy Linux shell – supported commands:\n  files:    ls cd pwd cat head tail less grep find touch mkdir rm cp mv echo stat chmod chown chgrp wc sort uniq cut awk tr sha256sum md5sum base64 strings\n  users:    whoami id groups sudo su useradd usermod userdel groupadd groupdel passwd last w who\n  system:   ps top kill systemctl service journalctl dmesg uname hostname uptime date df du free env export history clear man\n  network:  ip ifconfig ping traceroute tracepath nslookup dig host curl wget ss netstat route arp nc telnet ssh dhclient nmap ufw iptables resolvectl\nPipes (|), redirection (>, >>) and sudo are supported. Type "man <command>" for details.',
    sha256sum: ctx => { const outs = []; for (const f of ctx.pos) { const r = readFile(ctx, f); if (r.err) return { err: 'sha256sum: ' + f + ': ' + r.err }; outs.push(fakeHash('sha256' + r.content, 64) + '  ' + f); } return outs.join('\n') || fakeHash('sha256' + (ctx.stdin || ''), 64) + '  -'; },
    md5sum: ctx => { const outs = []; for (const f of ctx.pos) { const r = readFile(ctx, f); if (r.err) return { err: 'md5sum: ' + f + ': ' + r.err }; outs.push(fakeHash('md5' + r.content, 32) + '  ' + f); } return outs.join('\n') || fakeHash('md5' + (ctx.stdin || ''), 32) + '  -'; },
    base64: ctx => { let data = ctx.stdin || ''; if (ctx.pos[0]) { const r = readFile(ctx, ctx.pos[0]); if (r.err) return { err: 'base64: ' + ctx.pos[0] + ': ' + r.err }; data = r.content; } try { return ctx.flags.d ? decodeURIComponent(escape(atob(data.trim()))) : btoa(unescape(encodeURIComponent(data))); } catch (e) { return { err: 'base64: invalid input' }; } },
    strings: ctx => { const r = readFile(ctx, ctx.pos[0] || ''); if (r.err) return { err: 'strings: ' + ctx.pos[0] + ': ' + r.err }; return (r.content.match(/[\x20-\x7e]{4,}/g) || []).join('\n'); },
    file: ctx => { const p = resolveP(ctx, ctx.pos[0] || ''); const n = ctx.host.fs[p]; if (!n) return { err: 'file: cannot open \'' + ctx.pos[0] + '\' (No such file or directory)' }; const c = n.content || ''; return ctx.pos[0] + ': ' + (n.type === 'dir' ? 'directory' : c.startsWith('#!') ? c.split('\n')[0].slice(2) + ' script, ASCII text executable' : c.startsWith('MZ') ? 'PE32 executable (GUI) Intel 80386, for MS Windows' : c.startsWith('\x7fELF') ? 'ELF 64-bit LSB executable' : /^[\x20-\x7e\n\r\t]*$/.test(c) ? 'ASCII text' : 'data'); },
    df: () => 'Filesystem     1K-blocks    Used Available Use% Mounted on\nudev              986532       0    986532   0% /dev\n/dev/sda1       40460568 6244512  32139420  17% /\ntmpfs             201452    1020    200432   1% /run',
    du: ctx => { const p = resolveP(ctx, ctx.pos[0] || '.'); let total = 0; for (const k of Object.keys(ctx.host.fs)) if (k === p || k.startsWith(p + '/')) total += FS().size(ctx.host.fs[k]); return Math.ceil(total / 1024) + '\t' + (ctx.pos[0] || '.'); },
    free: () => '               total        used        free      shared  buff/cache   available\nMem:         2014904      312204     1281344        1020      421356     1552148\nSwap:        1048572           0     1048572',
    ps: ctx => { const P = processes(ctx); if (ctx.args.some(a => /aux|-ef|-e|ax/.test(a))) return ['USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND'].concat(P.map(p => X().pad(p.user, 12) + X().lpad(p.pid, 5) + X().lpad(p.cpu.toFixed(1), 5) + X().lpad(p.mem.toFixed(1), 5) + X().lpad(2000 + p.pid * 3, 7) + X().lpad(1000 + p.pid, 6) + ' ' + X().pad(p.cmd.includes('bash') || p.cmd.startsWith('ps') ? 'pts/0' : '?', 8) + ' ' + X().pad(p.cmd.startsWith('[') ? 'S' : 'Ss', 4) + ' 08:00   0:00 ' + p.cmd)).join('\n'); return '    PID TTY          TIME CMD\n   1210 pts/0    00:00:00 bash\n   2042 pts/0    00:00:00 ps'; },
    top: ctx => 'top - ' + new Date().toTimeString().slice(0, 8) + ' up  2:14,  1 user,  load average: 0.08, 0.03, 0.01\nTasks: ' + processes(ctx).length + ' total,   1 running\n%Cpu(s):  0.7 us,  0.3 sy,  0.0 ni, 99.0 id\nMiB Mem :   1967.7 total,   1251.3 free,    304.9 used,    411.5 buff/cache\n\n    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n' + processes(ctx).sort((a, b) => b.cpu - a.cpu).slice(0, 10).map(p => X().lpad(p.pid, 7) + ' ' + X().pad(p.user, 9) + ' 20   0 ' + X().lpad(2000 + p.pid * 3, 7) + X().lpad(1000 + p.pid, 7) + '   1200 S ' + X().lpad(p.cpu.toFixed(1), 5) + ' ' + X().lpad(p.mem.toFixed(1), 5) + '   0:00.0 ' + p.cmd.split(' ')[0].replace(/^.*\//, '')).join('\n'),
    kill: ctx => { const pid = Number(ctx.pos[ctx.pos.length - 1]); if (!pid) return { err: 'kill: usage: kill [-s sigspec | -n signum | -sigspec] pid' }; const P = processes(ctx); const p = P.find(x => x.pid === pid); if (!p) return { err: 'bash: kill: (' + pid + ') - No such process' }; if (p.user !== ctx.user && ctx.user !== 'root') return { err: 'bash: kill: (' + pid + ') - Operation not permitted' }; const idx = (ctx.host.extraProcesses || []).findIndex(x => x.pid === pid); if (idx >= 0) { ctx.host.extraProcesses.splice(idx, 1); ctx.host.killed = (ctx.host.killed || []).concat([pid]); return ''; } return { err: 'kill: process ' + pid + ' is a core system process in this lab and cannot be killed' }; },
    pkill: ctx => { const name = ctx.pos[0]; const idx = (ctx.host.extraProcesses || []).findIndex(x => x.cmd.includes(name)); if (idx >= 0) { const pid = ctx.host.extraProcesses[idx].pid; ctx.host.extraProcesses.splice(idx, 1); ctx.host.killed = (ctx.host.killed || []).concat([pid]); return ''; } return { exit: 1, out: '' }; },
    crontab: ctx => ctx.flags.l ? ((ctx.host.crontab && ctx.host.crontab[ctx.user]) || 'no crontab for ' + ctx.user) : 'usage: crontab -l',
    last: ctx => ctx.host.journal.filter(j => /Accepted/.test(j.msg)).map(j => { const m = j.msg.match(/for (\S+) from (\S+)/); return X().pad(m ? m[1] : '?', 9) + X().pad('pts/0', 13) + X().pad(m ? m[2] : '?', 17) + j.ts.slice(0, 12) + '   still logged in'; }).join('\n') + '\n\nwtmp begins ' + new Date(Date.now() - 86400000 * 30).toDateString(),
    lastb: ctx => ctx.host.journal.filter(j => /Failed password/.test(j.msg)).map(j => { const m = j.msg.match(/for (?:invalid user )?(\S+) from (\S+)/); return X().pad(m ? m[1] : '?', 9) + X().pad('ssh:notty', 13) + X().pad(m ? m[2] : '?', 17) + j.ts.slice(0, 12); }).join('\n') || 'btmp begins ' + new Date().toDateString(),
    who: ctx => ctx.user + '   pts/0        ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' (192.168.1.10)',
    w: ctx => ' ' + new Date().toTimeString().slice(0, 8) + ' up  2:14,  1 user,  load average: 0.08, 0.03, 0.01\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\n' + X().pad(ctx.user, 9) + 'pts/0    192.168.1.10     09:14    0.00s  0.05s  0.00s w',
    sudo: ctx => {
      if (!ctx.args.length) return 'usage: sudo -h | -K | -k | -V\nusage: sudo [command]';
      if (!isSudoer(ctx.host, ctx.session.user)) return { err: ctx.session.user + ' is not in the sudoers file.  This incident will be reported.' };
      ctx.host.journal.push({ ts: T().ts(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()), unit: 'sudo', pid: 1240 + ctx.session.history.length, pri: 5, msg: ctx.session.user + ' : TTY=pts/0 ; PWD=' + ctx.session.cwd + ' ; USER=root ; COMMAND=' + ctx.args.join(' ') });
      if (ctx.args[0] === '-i' || ctx.args[0] === '-s' || (ctx.args[0] === 'su' && (!ctx.args[1] || ctx.args[1] === '-' || ctx.args[1] === 'root'))) { ctx.session.previousUser = ctx.session.user; ctx.session.user = 'root'; ctx.session.cwd = ctx.args[0] === '-i' || ctx.args[1] === '-' ? '/root' : ctx.session.cwd; return ''; }
      const sub = ctx.args[0] === '-u' ? ctx.args.slice(2) : ctx.args;
      const asUser = ctx.args[0] === '-u' ? ctx.args[1] : 'root';
      return ctx.runAs(sub, asUser);
    },
    su: ctx => { const target = ctx.pos[0] && ctx.pos[0] !== '-' ? ctx.pos[0] : 'root'; if (ctx.session.user === 'root') { if (!ctx.host.users[target]) return { err: 'su: user ' + target + ' does not exist' }; ctx.session.previousUser = ctx.session.user; ctx.session.user = target; ctx.session.cwd = ctx.pos.includes('-') ? ctx.homeOf(target) : ctx.session.cwd; return ''; } return { err: 'Password: \nsu: Authentication failure\n[hint] root login via su is disabled in this lab – use "sudo -i" or "sudo <command>"' }; },
    exit: ctx => { if (ctx.session.previousUser) { ctx.session.user = ctx.session.previousUser; ctx.session.previousUser = null; ctx.session.cwd = ctx.homeOf(ctx.session.user); return 'logout'; } return { out: 'logout', exit: true }; },
    logout: ctx => linux.exit(ctx),
    useradd: ctx => { const { flags, pos } = parseFlags(ctx.args, ['-s', '-G', '-g', '-d', '-c', '-u']); const name = pos[0]; if (!name) return { err: 'Usage: useradd [options] LOGIN' }; if (ctx.user !== 'root') return { err: 'useradd: Permission denied.\nuseradd: cannot lock /etc/passwd; try again later.' }; if (ctx.host.users[name]) return { err: 'useradd: user \'' + name + '\' already exists' }; if (!/^[a-z_][a-z0-9_-]*$/.test(name)) return { err: 'useradd: invalid user name \'' + name + '\'' }; const uid = ctx.host.nextUid++; const gid = ctx.host.nextGid++; ctx.host.groups[name] = { gid, members: [] }; ctx.host.users[name] = { uid, gid, group: name, home: flags.d || '/home/' + name, shell: flags.s || '/bin/sh', gecos: flags.c || '', locked: true }; if (flags.m) { ctx.host.fs[ctx.host.users[name].home] = T().dir({ owner: name, group: name, mode: 0o750 }); } if (flags.G) for (const g of String(flags.G).split(',')) { if (!ctx.host.groups[g]) return { err: 'useradd: group \'' + g + '\' does not exist' }; ctx.host.groups[g].members.push(name); } return ''; },
    userdel: ctx => { const { flags, pos } = parseFlags(ctx.args); const name = pos[0]; if (ctx.user !== 'root') return { err: 'userdel: Permission denied.' }; if (!ctx.host.users[name]) return { err: 'userdel: user \'' + name + '\' does not exist' }; if (name === 'root') return { err: 'userdel: user root is currently used by process 1' }; const home = ctx.host.users[name].home; delete ctx.host.users[name]; for (const g of Object.keys(ctx.host.groups)) ctx.host.groups[g].members = ctx.host.groups[g].members.filter(m => m !== name); if (ctx.host.groups[name] && !ctx.host.groups[name].members.length) delete ctx.host.groups[name]; if (flags.r) FS().remove(ctx.host.fs, home); return ''; },
    usermod: ctx => { const { flags, pos } = parseFlags(ctx.args, ['-G', '-g', '-s', '-d', '-c']); const name = pos[0]; if (ctx.user !== 'root') return { err: 'usermod: Permission denied.' }; if (!name || !ctx.host.users[name]) return { err: 'usermod: user \'' + (name || '') + '\' does not exist' }; if (flags.G) { const gs = String(flags.G).split(','); for (const g of gs) if (!ctx.host.groups[g]) return { err: 'usermod: group \'' + g + '\' does not exist' }; if (!flags.a) for (const g of Object.keys(ctx.host.groups)) ctx.host.groups[g].members = ctx.host.groups[g].members.filter(m => m !== name); for (const g of gs) if (!ctx.host.groups[g].members.includes(name)) ctx.host.groups[g].members.push(name); } if (flags.g) { if (!ctx.host.groups[flags.g]) return { err: 'usermod: group \'' + flags.g + '\' does not exist' }; ctx.host.users[name].group = flags.g; ctx.host.users[name].gid = ctx.host.groups[flags.g].gid; } if (flags.s) ctx.host.users[name].shell = flags.s; if (flags.L) ctx.host.users[name].locked = true; if (flags.U) ctx.host.users[name].locked = false; if (flags.d) ctx.host.users[name].home = flags.d; return ''; },
    groupadd: ctx => { const name = ctx.pos[0]; if (ctx.user !== 'root') return { err: 'groupadd: Permission denied.' }; if (!name) return { err: 'Usage: groupadd [options] GROUP' }; if (ctx.host.groups[name]) return { err: 'groupadd: group \'' + name + '\' already exists' }; ctx.host.groups[name] = { gid: ctx.host.nextGid++, members: [] }; return ''; },
    groupdel: ctx => { const name = ctx.pos[0]; if (ctx.user !== 'root') return { err: 'groupdel: Permission denied.' }; if (!ctx.host.groups[name]) return { err: 'groupdel: group \'' + name + '\' does not exist' }; if (Object.values(ctx.host.users).some(u => u.group === name)) return { err: 'groupdel: cannot remove the primary group of user' }; delete ctx.host.groups[name]; return ''; },
    gpasswd: ctx => { const { flags, pos } = parseFlags(ctx.args, ['-a', '-d']); if (ctx.user !== 'root') return { err: 'gpasswd: Permission denied.' }; const g = pos[0]; if (!g || !ctx.host.groups[g]) return { err: 'gpasswd: group \'' + g + '\' does not exist in /etc/group' }; if (flags.a) { if (!ctx.host.users[flags.a]) return { err: 'gpasswd: user \'' + flags.a + '\' does not exist' }; ctx.host.groups[g].members.push(flags.a); return 'Adding user ' + flags.a + ' to group ' + g; } if (flags.d) { ctx.host.groups[g].members = ctx.host.groups[g].members.filter(m => m !== flags.d); return 'Removing user ' + flags.d + ' from group ' + g; } return ''; },
    passwd: ctx => { const u = ctx.pos[0] || ctx.user; if (u !== ctx.user && ctx.user !== 'root') return { err: 'passwd: You may not view or modify password information for ' + u + '.' }; if (!ctx.host.users[u]) return { err: 'passwd: user \'' + u + '\' does not exist' }; ctx.host.users[u].locked = false; ctx.host.users[u].passwordSet = true; return 'New password: ********\nRetype new password: ********\npasswd: password updated successfully'; },
    getent: ctx => { const db = ctx.pos[0]; const key = ctx.pos[1]; if (db === 'passwd') { const all = T().VIRTUAL['/etc/passwd'](ctx.host).trim().split('\n'); return key ? (all.find(l => l.startsWith(key + ':')) || { exit: 2, out: '' }) : all.join('\n'); } if (db === 'group') { const all = T().VIRTUAL['/etc/group'](ctx.host).trim().split('\n'); return key ? (all.find(l => l.startsWith(key + ':')) || { exit: 2, out: '' }) : all.join('\n'); } if (db === 'hosts') { const r = N().resolve(ctx.net, ctx.dev.id, key || ''); return r.ok ? r.ip + '\t' + key : { exit: 2, out: '' }; } return { err: 'Unknown database: ' + db }; },
    // ----- networking -----
    ip: ctx => {
      const a = ctx.args.filter(x => x !== '-4'); const brief = a.includes('-br') || a.includes('-brief'); const args = a.filter(x => x !== '-br' && x !== '-brief' && x !== '-c');
      const obj = (args[0] || '').toLowerCase(); const dev = ctx.dev; const net = ctx.net;
      const ifErr = n => 'Cannot find device "' + n + '"';
      if (!obj || obj === 'help') return 'Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }\nwhere  OBJECT := { address | link | route | neigh }\n       OPTIONS := { -br[ief] | -4 }';
      if (/^a(dd(r(ess)?)?)?$/.test(obj)) {
        const sub = (args[1] || 'show').toLowerCase();
        if (sub === 'show' || sub === 'list' || sub === 'ls' || sub === 's') { const which = args[2] === 'dev' ? args[3] : args[2]; return X().ipAddr(net, dev, brief, which); }
        if (ctx.user !== 'root') return { err: 'RTNETLINK answers: Operation not permitted' };
        if (sub === 'add' || sub === 'a' || sub === 'del' || sub === 'delete' || sub === 'd') { const cidr = args[2]; const di = args.indexOf('dev'); const iface = di >= 0 ? args[di + 1] : null; if (!cidr || !iface) return { err: 'Error: either "dev" is duplicate, or "' + (args[2] || '') + '" is a garbage.' }; if (!dev.interfaces[iface]) return { err: ifErr(iface) }; if (!cidr.includes('/') && (sub === 'add' || sub === 'a')) return { err: 'Error: an inet prefix is expected rather than "' + cidr + '" (use e.g. 192.168.1.10/24)' }; if (sub.startsWith('d')) { if (dev.interfaces[iface].ip !== cidr.split('/')[0]) return { err: 'RTNETLINK answers: Cannot assign requested address' }; N().setInterface(net, dev.id, iface, { ip: '', mask: '' }); return ''; } const r = N().setInterface(net, dev.id, iface, { ip: cidr }); if (r.error) return { err: 'Error: inet prefix is expected rather than "' + cidr + '".' }; dev.interfaces[iface].mode = 'static'; return ''; }
        if (sub === 'flush') { const iface = args[3]; if (!iface || !dev.interfaces[iface]) return { err: ifErr(iface || '') }; N().setInterface(net, dev.id, iface, { ip: '', mask: '' }); return ''; }
        return { err: 'Command "' + sub + '" is unknown, try "ip address help".' };
      }
      if (/^l(ink)?$/.test(obj)) {
        const sub = (args[1] || 'show').toLowerCase();
        if (sub === 'show' || sub === 'list' || sub === 'ls') return brief ? Object.keys(dev.interfaces).map(n => X().pad(n, 17) + X().pad(dev.interfaces[n].up !== false && N().linkAt(net, dev.id, n) ? 'UP' : 'DOWN', 16) + dev.interfaces[n].mac + ' <BROADCAST,MULTICAST,UP,LOWER_UP>').join('\n') : X().ipLink(net, dev);
        if (sub === 'set') { if (ctx.user !== 'root') return { err: 'RTNETLINK answers: Operation not permitted' }; const iface = args[2] === 'dev' ? args[3] : args[2]; const state = args[args.length - 1].toLowerCase(); if (!dev.interfaces[iface]) return { err: ifErr(iface) }; if (state === 'up') dev.interfaces[iface].up = true; else if (state === 'down') dev.interfaces[iface].up = false; else return { err: 'Error: either "dev" is duplicate, or "' + state + '" is a garbage.' }; return ''; }
        return { err: 'Command "' + sub + '" is unknown, try "ip link help".' };
      }
      if (/^r(oute)?$/.test(obj)) {
        const sub = (args[1] || 'show').toLowerCase();
        if (sub === 'show' || sub === 'list' || sub === 'ls') return X().ipRoute(net, dev);
        if (sub === 'get') { const r = N().lookupRoute(net, dev, args[2] || ''); if (!r) return { err: 'RTNETLINK answers: Network is unreachable' }; return args[2] + (r.via ? ' via ' + r.via : '') + ' dev ' + r.iface + ' src ' + dev.interfaces[r.iface].ip + ' uid ' + (ctx.user === 'root' ? 0 : 1000); }
        if (ctx.user !== 'root') return { err: 'RTNETLINK answers: Operation not permitted' };
        if (sub === 'add' || sub === 'replace' || sub === 'change') { let dest = args[2]; const vi = args.indexOf('via'); const via = vi >= 0 ? args[vi + 1] : null; const di = args.indexOf('dev'); const iface = di >= 0 ? args[di + 1] : null; if (!dest) return { err: 'Error: "dest" is required' }; if (dest === 'default') dest = '0.0.0.0/0'; if (!dest.includes('/')) dest += '/32'; if (via && !S().isValidIPv4(via)) return { err: 'Error: inet address is expected rather than "' + via + '".' }; if (via && !Object.keys(dev.interfaces).some(n => dev.interfaces[n].ip && dev.interfaces[n].mask && S().sameSubnet(via, dev.interfaces[n].ip, dev.interfaces[n].mask))) return { err: 'RTNETLINK answers: Network is unreachable\n[diagnostic] the next hop ' + via + ' is not in any directly connected subnet' }; if (dest === '0.0.0.0/0') { if (dev.gateway && sub === 'add') return { err: 'RTNETLINK answers: File exists' }; dev.gateway = via || ''; return ''; } const r = N().addRoute(net, dev.id, dest, null, via, iface); if (r.error) return { err: 'Error: ' + r.error }; return ''; }
        if (sub === 'del' || sub === 'delete') { let dest = args[2]; if (dest === 'default') { if (!dev.gateway) return { err: 'RTNETLINK answers: No such process' }; dev.gateway = ''; return ''; } if (!dest.includes('/')) dest += '/32'; const [d] = dest.split('/'); const before = (dev.routes || []).length; N().removeRoute(net, dev.id, S().info(dest).network); if ((dev.routes || []).length === before) return { err: 'RTNETLINK answers: No such process' }; return ''; }
        return { err: 'Command "' + sub + '" is unknown, try "ip route help".' };
      }
      if (/^n(eigh(bou?r)?)?$/.test(obj)) { if (args[1] === 'flush') { dev.arp = {}; return ''; } return X().ipNeigh(net, dev); }
      return { err: 'Object "' + obj + '" is unknown, try "ip help".' };
    },
    ifconfig: ctx => { const a = ctx.args; const dev = ctx.dev; if (!a.length || a[0] === '-a') return X().ifconfig(ctx.net, dev); const iface = a[0]; if (!dev.interfaces[iface]) return { err: iface + ': error fetching interface information: Device not found' }; if (a.length === 1) return X().ifconfig(ctx.net, dev, iface); if (ctx.user !== 'root') return { err: 'SIOCSIFADDR: Operation not permitted' }; if (a[1] === 'up') { dev.interfaces[iface].up = true; return ''; } if (a[1] === 'down') { dev.interfaces[iface].up = false; return ''; } const ip = a[1]; const ni = a.indexOf('netmask'); const mask = ni >= 0 ? a[ni + 1] : (ip.includes('/') ? null : '255.255.255.0'); const r = N().setInterface(ctx.net, dev.id, iface, mask ? { ip, mask } : { ip }); if (r.error) return { err: 'SIOCSIFADDR: ' + r.error }; dev.interfaces[iface].mode = 'static'; return ''; },
    ping: ctx => { const { flags, pos } = parseFlags(ctx.args, ['-c', '-i', '-W', '-w', '-s', '-I']); if (!pos.length) return { err: 'ping: usage error: Destination address required' }; const count = Math.min(10, Math.max(1, Number(flags.c) || 4)); return X().pingLinux(ctx.net, ctx.dev, pos[0], count, ctx.session) + (flags.c ? '' : '\n(simulated: ping stopped after 4 packets; use -c to choose a count)'); },
    traceroute: ctx => { const { pos } = parseFlags(ctx.args, ['-m', '-q', '-w']); if (!pos.length) return { err: 'Usage: traceroute [-n] host' }; return X().tracerouteLinux(ctx.net, ctx.dev, pos[0], ctx.session); },
    tracepath: ctx => linux.traceroute(ctx), mtr: ctx => linux.traceroute(ctx),
    nslookup: ctx => X().nslookup(ctx.net, ctx.dev, ctx.pos[0], ctx.pos[1]),
    dig: ctx => { const server = (ctx.args.find(a => a.startsWith('@')) || '').slice(1); const short = ctx.args.includes('+short'); const name = ctx.args.find(a => !a.startsWith('@') && !a.startsWith('+') && !a.startsWith('-') && !/^(A|AAAA|MX|NS|TXT|ANY)$/i.test(a)); return X().dig(ctx.net, ctx.dev, name, server || null, short); },
    host: ctx => { const name = ctx.pos[0]; if (!name) return 'Usage: host [-v] hostname [server]'; const r = N().resolve(ctx.net, ctx.dev.id, name, null, { server: ctx.pos[1] || null, noCache: true }); if (S().isValidIPv4(name)) { const rn = N().reverseName(ctx.net, name); return rn ? name.split('.').reverse().join('.') + '.in-addr.arpa domain name pointer ' + rn + '.' : 'Host ' + name.split('.').reverse().join('.') + '.in-addr.arpa not found: 3(NXDOMAIN)'; } if (!r.ok) return r.rcode ? 'Host ' + name + ' not found: 3(NXDOMAIN)' : ';; communications error to ' + (r.server || '?') + '#53: timed out\n;; no servers could be reached'; return name + ' has address ' + r.ip; },
    resolvectl: ctx => 'Global\n       Protocols: +LLMNR +mDNS -DNSOverTLS DNSSEC=no/unsupported\nresolv.conf mode: stub\n\nLink 2 (eth0)\n    Current Scopes: DNS\n         Protocols: +DefaultRoute\nCurrent DNS Server: ' + (ctx.dev.dns || '(none)') + '\n       DNS Servers: ' + (ctx.dev.dns || '') + '\n        DNS Domain: ' + (ctx.dev.dnsSuffix || ''),
    curl: ctx => { const { flags, pos } = parseFlags(ctx.args, ['-o', '-H', '-X', '-d', '-u']); return X().curl(ctx.net, ctx.dev, pos[0], flags, ctx.session); },
    wget: ctx => { const { flags, pos } = parseFlags(ctx.args, ['-O']); const url = pos[0]; if (!url) return { err: 'wget: missing URL' }; const r = X().curl(ctx.net, ctx.dev, url, {}, ctx.session); if (r.startsWith('curl:')) return { err: r.replace(/^curl: \(\d+\) /, 'wget: ') }; const u = X().parseUrl(url); const fname = flags.O || (u.path.split('/').pop() || 'index.html'); FS().write(ctx.host.fs, resolveP(ctx, fname), r, { owner: ctx.user, group: ctx.groupOf(ctx.user) }); return '--' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '--  ' + url + '\nResolving ' + u.host + '... ' + (ctx.session.lastConnect ? ctx.session.lastConnect.ip : '') + '\nConnecting to ' + u.host + ':' + u.port + '... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: ' + r.length + ' [text/html]\nSaving to: ‘' + fname + '’\n\n' + fname + '  100%[===================>]  ' + r.length + '  --.-KB/s    in 0s'; },
    ss: ctx => { const { flags } = parseFlags(ctx.args); return X().ssOut(ctx.net, ctx.dev, flags); },
    netstat: ctx => { const { flags } = parseFlags(ctx.args); if (flags.r) return 'Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n' + N().routeTable(ctx.net, ctx.dev).map(r => X().pad(r.network, 16) + X().pad(r.via || '0.0.0.0', 16) + X().pad(r.mask, 16) + X().pad(r.via ? 'UG' : 'U', 6) + '100    0        0 ' + (r.iface || X().ifaceFor(ctx.dev, r.via) || 'eth0')).join('\n'); if (flags.i) return 'Kernel Interface table\nIface      MTU    RX-OK RX-ERR RX-DRP RX-OVR    TX-OK TX-ERR TX-DRP TX-OVR Flg\n' + Object.keys(ctx.dev.interfaces).map(n => X().pad(n, 10) + ' 1500     1284      0      0 0          1310      0      0      0 BMRU').join('\n') + '\nlo        65536      120      0      0 0           120      0      0      0 LRU'; return X().netstatLinux(ctx.net, ctx.dev, flags); },
    route: ctx => { if (ctx.pos[0] === 'add' || ctx.pos[0] === 'del') { const a = ctx.args.slice(1); if (ctx.user !== 'root') return { err: 'SIOCADDRT: Operation not permitted' }; if (a[0] === 'default' || a[0] === '-net' && a[1] === '0.0.0.0') { const gi = a.indexOf('gw'); if (ctx.pos[0] === 'del') { ctx.dev.gateway = ''; return ''; } if (gi < 0) return { err: 'route: usage: route add default gw GATEWAY' }; ctx.dev.gateway = a[gi + 1]; return ''; } const dest = a[a.indexOf('-net') + 1]; const mi = a.indexOf('netmask'); const gi = a.indexOf('gw'); if (ctx.pos[0] === 'del') { N().removeRoute(ctx.net, ctx.dev.id, dest); return ''; } const r = N().addRoute(ctx.net, ctx.dev.id, dest, mi >= 0 ? a[mi + 1] : null, gi >= 0 ? a[gi + 1] : null); return r.error ? { err: 'route: ' + r.error } : ''; } return linux.netstat(Object.assign({}, ctx, { args: ['-rn'] })); },
    arp: ctx => X().arpLinux(ctx.net, ctx.dev, ctx.flags.n || !ctx.flags.a),
    nc: ctx => { const { flags, pos } = parseFlags(ctx.args, ['-w', '-p']); const [host, port] = pos; if (!host || !port) return { err: 'usage: nc [-zv] host port' }; const c = N().tcpConnect(ctx.net, ctx.dev.id, host, port); ctx.session.lastConnect = c; if (c.status === 'dns-fail') return { err: 'nc: getaddrinfo for host "' + host + '" port ' + port + ': Name or service not known' }; if (c.status === 'open') return (flags.v || flags.z ? 'Connection to ' + host + ' (' + c.ip + ') ' + port + ' port [tcp/' + (c.service ? c.service.name : '*') + '] succeeded!' : '') + (!flags.z && c.service && c.service.banner ? '\n' + c.service.banner : ''); if (c.status === 'closed') return { err: 'nc: connect to ' + host + ' (' + c.ip + ') port ' + port + ' (tcp) failed: Connection refused' }; return { err: 'nc: connect to ' + host + ' (' + c.ip + ') port ' + port + ' (tcp) failed: Connection timed out' + (c.reason ? '\n[diagnostic] ' + c.reason : '') }; },
    ncat: ctx => linux.nc(ctx),
    telnet: ctx => { const [host, port] = ctx.pos; if (!host) return 'telnet> (usage: telnet HOST [PORT])'; const c = N().tcpConnect(ctx.net, ctx.dev.id, host, port || 23); ctx.session.lastConnect = c; if (c.status === 'dns-fail') return { err: 'telnet: could not resolve ' + host + '/' + (port || 'telnet') + ': Name or service not known' }; if (c.status === 'open') return 'Trying ' + c.ip + '...\nConnected to ' + host + '.\nEscape character is \'^]\'.\n' + (c.service && c.service.banner ? c.service.banner + '\n' : '') + (c.service && c.service.name === 'telnet' ? 'login: (interactive sessions are not simulated)\nConnection closed by foreign host.' : 'Connection closed by foreign host.'); if (c.status === 'closed') return { err: 'Trying ' + c.ip + '...\ntelnet: Unable to connect to remote host: Connection refused' }; return { err: 'Trying ' + c.ip + '...\ntelnet: Unable to connect to remote host: Connection timed out' + (c.reason ? '\n[diagnostic] ' + c.reason : '') }; },
    ssh: ctx => { const target = ctx.pos.find(p => !p.startsWith('-')); if (!target) return 'usage: ssh [-p port] [user@]hostname'; const host = target.includes('@') ? target.split('@')[1] : target; const pi = ctx.args.indexOf('-p'); const port = pi >= 0 ? Number(ctx.args[pi + 1]) : 22; const c = N().tcpConnect(ctx.net, ctx.dev.id, host, port); ctx.session.lastConnect = c; if (c.status === 'dns-fail') return { err: 'ssh: Could not resolve hostname ' + host + ': Name or service not known' }; if (c.status === 'open') return (c.service && c.service.name === 'ssh') ? 'The authenticity of host \'' + host + ' (' + c.ip + ')\' can\'t be established.\nED25519 key fingerprint is SHA256:' + fakeHash(c.ip, 43) + '.\nAre you sure you want to continue connecting (yes/no/[fingerprint])? yes\n' + (target.includes('@') ? target.split('@')[0] : ctx.user) + '@' + host + '\'s password: \n(simulated: remote interactive sessions are not available – open the terminal of that device directly from the simulator)' : 'kex_exchange_identification: Connection closed by remote host\nConnection closed by ' + c.ip + ' port ' + port + '\n[diagnostic] port ' + port + ' is open but runs ' + (c.service ? c.service.name : 'an unknown service') + ', not SSH'; if (c.status === 'closed') return { err: 'ssh: connect to host ' + host + ' port ' + port + ': Connection refused' }; return { err: 'ssh: connect to host ' + host + ' port ' + port + ': Connection timed out' + (c.reason ? '\n[diagnostic] ' + c.reason : '') }; },
    dhclient: ctx => { if (ctx.user !== 'root') return { err: 'dhclient: Operation not permitted (use sudo)' }; const { flags, pos } = parseFlags(ctx.args); const iface = pos[0] || 'eth0'; if (!ctx.dev.interfaces[iface]) return { err: 'dhclient: interface ' + iface + ' not found' }; if (flags.r) { N().setInterface(ctx.net, ctx.dev.id, iface, { ip: '', mask: '' }); ctx.dev.gateway = ''; ctx.dev.dns = ''; return ''; } ctx.dev.interfaces[iface].mode = 'dhcp'; const r = N().dhcpRequest(ctx.net, ctx.dev.id, iface); ctx.session.lastDhcp = r; return r.log.map(l => 'DHCP: ' + l).join('\n') + (r.ok ? '\nbound to ' + r.ip + ' -- renewal in 43200 seconds.' : ''); },
    nmap: ctx => X().nmap(ctx.net, ctx.dev, ctx.args, ctx.session),
    journalctl: ctx => { const { flags, pos } = parseFlags(ctx.args, ['-u', '-n', '-p', '-g', '--since', '--until', '-o']); if (ctx.user !== 'root' && !T().userGroups(ctx.host, ctx.user).some(g => g === 'adm' || g === 'systemd-journal')) return { err: 'Hint: You are currently not seeing messages from other users and the system.\n      Users in groups \'adm\', \'systemd-journal\' can see all messages.\n-- No entries --' }; return journalLines(ctx, flags, pos); },
    dmesg: ctx => ctx.host.journal.filter(j => j.unit === 'kernel').map(j => j.msg).join('\n'),
    systemctl: ctx => sysctl(ctx, ctx.pos),
    service: ctx => sysctl(ctx, [ctx.pos[1], ctx.pos[0]]),
    ufw: ctx => { const fw = ctx.host.firewall; const sub = ctx.pos[0]; if (!sub || sub === 'status') return 'Status: ' + (fw.enabled ? 'active' : 'inactive') + (fw.enabled ? '\n\nTo                         Action      From\n--                         ------      ----\n' + (fw.rules || []).map(r => X().pad(r.port + (r.proto ? '/' + r.proto : ''), 27) + X().pad(r.action.toUpperCase() + ' IN', 12) + (r.from || 'Anywhere')).join('\n') : ''); if (ctx.user !== 'root') return { err: 'ERROR: You need to be root to run this script' }; if (sub === 'enable') { fw.enabled = true; fw.allowPorts = (fw.rules || []).filter(r => r.action === 'allow').map(r => Number(r.port)); fw.blockIcmp = false; return 'Firewall is active and enabled on system startup'; } if (sub === 'disable') { fw.enabled = false; fw.allowPorts = null; return 'Firewall stopped and disabled on system startup'; } if (sub === 'allow' || sub === 'deny') { const spec = ctx.pos[1]; if (!spec) return { err: 'ERROR: Bad port' }; const [port, proto] = spec.split('/'); const svc = { ssh: 22, http: 80, https: 443, dns: 53, ftp: 21, smtp: 25, mysql: 3306 }; const p = svc[port] || Number(port); if (!p) return { err: 'ERROR: Bad port' }; fw.rules = (fw.rules || []).filter(r => Number(r.port) !== p); fw.rules.push({ port: p, proto: proto || 'tcp', action: sub }); if (fw.enabled) fw.allowPorts = fw.rules.filter(r => r.action === 'allow').map(r => Number(r.port)); return 'Rule ' + (sub === 'allow' ? 'added' : 'added'); } if (sub === 'delete') { const spec = ctx.pos[2] || ''; const p = Number(spec.split('/')[0]); fw.rules = (fw.rules || []).filter(r => Number(r.port) !== p); if (fw.enabled) fw.allowPorts = fw.rules.filter(r => r.action === 'allow').map(r => Number(r.port)); return 'Rule deleted'; } if (sub === 'default') { return 'Default ' + (ctx.pos[1] || 'deny') + ' policy changed for \'incoming\''; } return { err: 'ERROR: Unknown command \'' + sub + '\'' }; },
    iptables: ctx => { if (ctx.user !== 'root') return { err: 'iptables v1.8.9 (nf_tables): Permission denied (you must be root)' }; const fw = ctx.host.firewall; if (ctx.flags.L || ctx.flags.S) return 'Chain INPUT (policy ' + (fw.enabled && fw.allowPorts ? 'DROP' : 'ACCEPT') + ')\ntarget     prot opt source               destination\n' + (fw.rules || []).map(r => X().pad(r.action === 'allow' ? 'ACCEPT' : 'DROP', 11) + X().pad(r.proto || 'tcp', 5) + '--  anywhere             anywhere             ' + (r.proto || 'tcp') + ' dpt:' + r.port).join('\n') + '\n\nChain FORWARD (policy ACCEPT)\ntarget     prot opt source               destination\n\nChain OUTPUT (policy ACCEPT)\ntarget     prot opt source               destination'; const a = ctx.args; const pi = a.indexOf('--dport'); const ji = a.indexOf('-j'); if ((a.includes('-A') || a.includes('-I')) && pi >= 0 && ji >= 0) { const port = Number(a[pi + 1]); const action = a[ji + 1] === 'ACCEPT' ? 'allow' : 'deny'; const prI = a.indexOf('-p'); fw.rules = (fw.rules || []).filter(r => Number(r.port) !== port); fw.rules.push({ port, proto: prI >= 0 ? a[prI + 1] : 'tcp', action }); if (fw.enabled && fw.allowPorts) fw.allowPorts = fw.rules.filter(r => r.action === 'allow').map(r => Number(r.port)); return ''; } if (a.includes('-P') && a.includes('INPUT')) { const pol = a[a.indexOf('INPUT') + 1]; fw.enabled = true; fw.allowPorts = pol === 'DROP' ? (fw.rules || []).filter(r => r.action === 'allow').map(r => Number(r.port)) : null; return ''; } if (a.includes('-F')) { fw.rules = []; fw.allowPorts = null; return ''; } return { err: 'iptables: unsupported rule in this lab (try -L, -A INPUT -p tcp --dport N -j ACCEPT|DROP, -P INPUT DROP, -F)' }; },
    tar: ctx => { const { flags, pos } = parseFlags(ctx.args, ['-f']); const a = ctx.args.join(' '); const m = a.match(/-[a-z]*f\s+(\S+)/); const archive = m ? m[1] : null; if (/c/.test(ctx.args[0] || '') && archive) { FS().write(ctx.host.fs, resolveP(ctx, archive), 'TARBALL:' + pos.join(','), { owner: ctx.user, group: ctx.groupOf(ctx.user) }); return ''; } if (/t/.test(ctx.args[0] || '') && archive) { const r = readFile(ctx, archive); if (r.err) return { err: 'tar: ' + archive + ': Cannot open: ' + r.err }; return r.content.replace(/^TARBALL:/, '').split(',').join('\n'); } return 'tar: You must specify one of the \'-Acdtrux\' options\nTry \'tar --help\' for more information.'; },
    apt: ctx => ctx.user !== 'root' ? { err: 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock, are you root?' } : ctx.pos[0] === 'update' ? 'Hit:1 http://deb.debian.org/debian bookworm InRelease\nReading package lists... Done\nAll packages are up to date.' : ctx.pos[0] === 'install' ? 'Reading package lists... Done\nBuilding dependency tree... Done\n' + ctx.pos.slice(1).filter(p => !p.startsWith('-')).map(p => p + ' is already the newest version (simulated).').join('\n') : 'apt ' + (ctx.pos[0] || '') + ': simulated',
    'apt-get': ctx => linux.apt(ctx),
    nano: ctx => 'nano: interactive editors are not simulated. Create or change files with:\n  echo "text" > file      (overwrite)\n  echo "text" >> file     (append)\n  cat file                (view)',
    vi: ctx => linux.nano(ctx), vim: ctx => linux.nano(ctx),
    sleep: () => '', true: () => '', false: () => ({ exit: 1, out: '' }),
    alias: () => 'alias ll=\'ls -la\'',
    lsof: ctx => { const { flags } = parseFlags(ctx.args); if (flags.i) return 'COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\n' + X().sockets(ctx.net, ctx.dev).map(s => X().pad(s.proc.slice(0, 9), 10) + X().lpad(s.pid, 4) + ' ' + X().pad(s.proc === 'sshd' || s.proc === 'named' ? 'root' : s.proc === 'apache2' ? 'www-data' : 'root', 6) + ' 3u  IPv4  ' + (20000 + s.pid) + '      0t0  ' + s.proto.toUpperCase() + ' ' + (s.local.replace(/^0\.0\.0\.0/, '*')) + (s.state === 'LISTEN' ? ' (LISTEN)' : s.state === 'ESTABLISHED' ? '->' + s.remote + ' (ESTABLISHED)' : '')).join('\n'); return 'lsof: use lsof -i to list network connections in this lab'; }
  };

  // ---------- session ----------
  function createSession(opts) {
    const net = opts.net; const dev = net.devices[opts.devId];
    if (!dev) throw new Error('device not found');
    const kind = N().kindOf(dev);
    if (kind === 'router' || kind === 'switch') {
      const cli = NSA.ios.createCli({ net, devId: dev.id });
      return { os: 'ios', dev, net, cli, history: cli.history, prompt: () => cli.prompt(), run: line => { const out = cli.run(line); return { out, err: /^% |^%Warning|^%Error|^%Ambiguous|^%Incomplete|^%Invalid/.test(out) }; }, isIos: true };
    }
    if (kind !== 'host') throw new Error('No terminal on this device');
    const host = T().ensureHost(dev);
    const session = { os: host.os, dev, net, host, user: host.user || (host.os === 'linux' ? 'student' : 'student'), cwd: host.cwd || (host.os === 'linux' ? '/home/student' : 'C:\\Users\\student'), history: [], lastExit: 0, previousUser: null, lastPing: null, lastTrace: null, lastScan: null, lastConnect: null, lastDhcp: null, commandsRun: 0 };
    session.prompt = function () {
      if (session.os === 'windows') return (NSA.termwin && NSA.termwin.prompt) ? NSA.termwin.prompt(session) : session.cwd + '>';
      const home = (host.users[session.user] || {}).home || '/';
      const cwd = session.cwd === home ? '~' : (session.cwd.startsWith(home + '/') ? '~' + session.cwd.slice(home.length) : session.cwd);
      return session.user + '@' + host.hostname + ':' + cwd + (session.user === 'root' ? '# ' : '$ ');
    };
    function makeCtx(args, user, stdin) {
      const { flags, pos } = parseFlags(args);
      return { session, host, dev, net, args, flags, pos, user, stdin, homeOf: u => (host.users && host.users[u] ? host.users[u].home : (session.os === 'windows' ? 'C:\\Users\\' + u : '/')), groupOf: u => (host.users && host.users[u] ? host.users[u].group : u), runAs: (subArgs, asUser) => { const r = execOne(subArgs, asUser, stdin); return r; } };
    }
    function normalizeResult(r) {
      if (r == null) return { out: '', err: null };
      if (typeof r === 'string') return { out: r, err: null };
      return { out: r.out || '', err: r.err || null, clear: !!r.clear, exit: !!r.exit, exitCode: r.exit === 1 ? 1 : (r.err ? 1 : 0) };
    }
    function execOne(args, user, stdin) {
      if (!args.length) return { out: '', err: null };
      const name = args[0]; const rest = args.slice(1);
      const table = session.os === 'windows' ? (NSA.termwin ? NSA.termwin.commands : {}) : linux;
      const key = session.os === 'windows' ? name.toLowerCase().replace(/\.exe$/, '') : name;
      if (rest[0] === '--help' && MAN[key]) return { out: MAN[key], err: null };
      const fn = table[key];
      if (fn) return normalizeResult(fn(makeCtx(rest, user, stdin)));
      if (session.os !== 'windows' && FILTERS.includes(key)) { const r = applyFilter(key, rest, stdin || '', session.os); return r ? normalizeResult(r) : { out: '', err: key + ': cannot run without input' }; }
      if (session.os === 'windows' && ['findstr', 'find', 'more', 'sort'].includes(key)) { const r = applyFilter(key, rest, stdin || '', 'windows'); return normalizeResult(r); }
      if (session.os !== 'windows' && key.startsWith('./')) { const p = T().normPath(key, session.cwd, host.users[user] ? host.users[user].home : '/'); const n = host.fs[p]; if (!n) return { out: '', err: 'bash: ' + key + ': No such file or directory' }; if (!FS().perm(host, n, user, 'x')) return { out: '', err: 'bash: ' + key + ': Permission denied' }; const c = n.content || ''; if (c.startsWith('#!')) { const lines = c.split('\n').slice(1).filter(l => l.trim() && !l.trim().startsWith('#')); const outs = []; for (const l of lines) { const r = runLine(l, user); if (r.out) outs.push(r.out); if (r.err) outs.push(r.err); } return { out: outs.join('\n'), err: null }; } return { out: '', err: 'bash: ' + key + ': cannot execute binary file' }; }
      return { out: '', err: session.os === 'windows' ? '\'' + name + '\' is not recognized as an internal or external command,\noperable program or batch file.' : (key + ': command not found') };
    }
    function runLine(line, user) {
      const tokens = tokenize(line, session.os);
      // split by pipes and redirects
      const stages = []; let cur = []; let redirect = null; let errRedirect = null;
      for (let i = 0; i < tokens.length; i++) { const t = tokens[i]; if (t === '|') { stages.push(cur); cur = []; continue; } if (t === '>' || t === '>>' || t === '1>') { redirect = { append: t === '>>', target: tokens[i + 1] }; i++; continue; } if (t === '2>') { errRedirect = tokens[i + 1]; i++; continue; } if (t === '2>&1') { errRedirect = '&1'; continue; } if (t === ';' || t === '&&') { break; } cur.push(t); }
      stages.push(cur);
      let stdin = null; let result = { out: '', err: null };
      for (let s = 0; s < stages.length; s++) {
        const st = stages[s]; if (!st.length) continue;
        result = execOne(st, user, stdin);
        if (result.err && s < stages.length - 1) { stdin = result.out; continue; }
        stdin = result.out;
      }
      if (errRedirect) { if (errRedirect === '&1') { if (result.err) result.out = (result.out ? result.out + '\n' : '') + result.err; result.err = null; } else { result.err = null; } }
      if (redirect && redirect.target === '/dev/null') return { out: '', err: result.err };
      if (redirect && redirect.target) {
        if (session.os === 'windows') { const r = NSA.termwin && NSA.termwin.writeFile ? NSA.termwin.writeFile(session, redirect.target, result.out, redirect.append) : null; if (r && r.err) return { out: '', err: r.err }; return { out: '', err: result.err }; }
        const p = T().normPath(redirect.target, session.cwd, host.users[user] ? host.users[user].home : '/');
        if (!FS().canWrite(host, p, user)) return { out: '', err: 'bash: ' + redirect.target + ': Permission denied' };
        if (!host.fs[T().dirname(p)]) return { out: '', err: 'bash: ' + redirect.target + ': No such file or directory' };
        FS().write(host.fs, p, result.out + (result.out ? '\n' : ''), { append: redirect.append, owner: user, group: host.users[user] ? host.users[user].group : user });
        return { out: '', err: result.err };
      }
      return result;
    }
    session.run = function (line) {
      const raw = String(line || '');
      if (!raw.trim()) return { out: '', err: null };
      session.history.push(raw); session.commandsRun++;
      let r;
      try { r = runLine(raw, session.user); } catch (e) { r = { out: '', err: 'internal error: ' + (e && e.message) }; }
      session.lastExit = r.err ? 1 : 0;
      const toks = tokenize(raw, session.os); session.last = { line: raw, cmd: toks[0] || '', args: toks.slice(1), result: r };
      return r;
    };
    session.exec = (line) => session.run(line);
    return session;
  }

  NSA.terminal = { createSession, tokenize, parseFlags, applyFilter, linux, MAN, fakeHash, parseMode, processes, FILTERS };
})(typeof globalThis !== 'undefined' ? globalThis : window);
