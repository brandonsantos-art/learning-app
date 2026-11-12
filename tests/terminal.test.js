/* Terminal / IOS / quiz / srs tests – run with: node tests/terminal.test.js */
'use strict';
const path = require('path');
globalThis.NSA = {};
['js/core/util.js', 'js/engines/subnet.js', 'js/engines/netsim.js', 'js/engines/ios.js', 'js/engines/terminal-fs.js', 'js/engines/terminal-net.js', 'js/engines/terminal-win.js', 'js/engines/terminal.js', 'js/engines/quiz.js', 'js/engines/srs.js'].forEach(f => require(path.join(__dirname, '..', f)));
const N = NSA.netsim;
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log('  ok   ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n       ') : e)); } }
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }
function has(out, re, msg) { const s = typeof out === 'string' ? out : (out.out + (out.err ? '\n' + out.err : '')); if (!(re instanceof RegExp ? re.test(s) : s.includes(re))) throw new Error((msg || 'expected output to match ' + re) + '\n--- got ---\n' + s.slice(0, 600)); }

function office() {
  const net = N.createNetwork();
  N.addDevice(net, 'pc', { id: 'pc1', name: 'PC1', interfaces: { eth0: { ip: '192.168.1.10/24' } }, gateway: '192.168.1.1', dns: '192.168.1.2', dnsSuffix: 'corp.local' });
  N.addDevice(net, 'server', { id: 'srv', name: 'SRV1', interfaces: { eth0: { ip: '192.168.1.2/24' } }, gateway: '192.168.1.1', dns: '192.168.1.2', dnsSuffix: 'corp.local', services: { dns: { records: { 'srv1.corp.local': '192.168.1.2', 'www.corp.local': '192.168.1.2' }, forwarder: '8.8.8.8' }, http: { banner: 'Apache/2.4.57 (Debian)', content: '<h1>Intranet</h1>' }, ssh: { banner: 'SSH-2.0-OpenSSH_9.2' } } });
  N.addDevice(net, 'router', { id: 'r1', name: 'R1', interfaces: { 'G0/0': { ip: '203.0.113.2/30' }, 'G0/1': { ip: '192.168.1.1/24' } }, routes: [{ dest: '0.0.0.0', mask: '0.0.0.0', via: '203.0.113.1' }], nat: { inside: ['G0/1'], outside: 'G0/0' } });
  N.addDevice(net, 'internet', { id: 'inet', interfaces: { wan1: { ip: '203.0.113.1/30' } } });
  N.addDevice(net, 'switch', { id: 'sw1', name: 'SW1' });
  N.connect(net, 'pc1', 'eth0', 'sw1', 'Fa0/1'); N.connect(net, 'srv', 'eth0', 'sw1', 'Fa0/2'); N.connect(net, 'sw1', 'Fa0/8', 'r1', 'G0/1'); N.connect(net, 'r1', 'G0/0', 'inet', 'wan1');
  return net;
}

console.log('windows terminal');
test('ipconfig and ipconfig /all', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'pc1' }); has(s.run('ipconfig'), /IPv4 Address[. ]+: 192\.168\.1\.10/); has(s.run('ipconfig /all'), /Physical Address/); has(s.run('ipconfig /all'), /DNS Servers[. ]+: 192\.168\.1\.2/); });
test('ping success/failure formats', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'pc1' }); has(s.run('ping 192.168.1.1'), /Reply from 192\.168\.1\.1: bytes=32/); has(s.run('ping -n 2 8.8.8.8'), /Sent = 2, Received = 2/); has(s.run('ping 192.168.1.99'), /Destination host unreachable/); has(s.run('ping nope.invalid'), /could not find host/); net.devices.pc1.gateway = ''; has(s.run('ping 8.8.8.8'), /transmit failed/); });
test('tracert, nslookup, arp, netstat, route print', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'pc1' }); has(s.run('tracert www.google.com'), /192\.168\.1\.1[\s\S]*Trace complete/); has(s.run('nslookup www.corp.local'), /Address:  192\.168\.1\.2/); has(s.run('nslookup www.corp.local 8.8.8.8'), /Non-existent domain/); has(s.run('arp -a'), /192\.168\.1\.1\s+02-00/); has(s.run('netstat -an'), /LISTENING/); has(s.run('route print'), /0\.0\.0\.0\s+0\.0\.0\.0\s+192\.168\.1\.1/); has(s.run('getmac'), /02-00-00/); });
test('netsh configures address and dns', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'pc1' }); const r = s.run('netsh interface ip set address "Ethernet0" static 192.168.1.50 255.255.255.0 192.168.1.1'); ok(!r.err, r.err); ok(net.devices.pc1.interfaces.eth0.ip === '192.168.1.50'); ok(!s.run('netsh interface ip set dns "Ethernet0" static 8.8.8.8').err); ok(net.devices.pc1.dns === '8.8.8.8'); has(s.run('netsh interface ip show config'), /192\.168\.1\.50/); has(s.run('netsh advfirewall show allprofiles'), /State\s+ON/); });
test('dhcp renew via netsh/ipconfig', () => { const net = office(); net.devices.srv.services.dhcp = { pools: [{ network: '192.168.1.0', mask: '255.255.255.0', start: '192.168.1.100', end: '192.168.1.120', gateway: '192.168.1.1', dns: '192.168.1.2' }] }; const s = NSA.terminal.createSession({ net, devId: 'pc1' }); has(s.run('netsh interface ip set address "Ethernet0" dhcp'), /^$|OK/); ok(net.devices.pc1.interfaces.eth0.ip === '192.168.1.100', net.devices.pc1.interfaces.eth0.ip); has(s.run('ipconfig /release'), /lease released/); ok(net.devices.pc1.interfaces.eth0.ip === ''); has(s.run('ipconfig /renew'), /DHCP ACK/); ok(net.devices.pc1.interfaces.eth0.ip === '192.168.1.100'); });
test('pipes, findstr, dir, type, powershell cmdlets', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'pc1' }); has(s.run('ipconfig | findstr IPv4'), /^\s+IPv4 Address/); has(s.run('dir'), /Documents/); has(s.run('type Documents\\network-notes.txt'), /Gateway/); has(s.run('cd Downloads'), /^$/); ok(s.cwd === 'C:\\Users\\student\\Downloads'); has(s.run('Test-NetConnection 192.168.1.2 -Port 80'), /TcpTestSucceeded\s+: True/); has(s.run('Resolve-DnsName www.corp.local'), /192\.168\.1\.2/); has(s.run('bogus'), /not recognized/); });

console.log('linux terminal');
test('ip addr/route, ping, traceroute, dig', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'srv' }); has(s.run('ip addr'), /inet 192\.168\.1\.2\/24 brd 192\.168\.1\.255/); has(s.run('ip route'), /default via 192\.168\.1\.1 dev eth0/); has(s.run('ping -c 2 192.168.1.10'), /2 packets transmitted, 2 received/); has(s.run('ping -c 1 192.168.1.77'), /Destination Host Unreachable/); has(s.run('traceroute 8.8.8.8'), /1  R1 \(192\.168\.1\.1\)/); has(s.run('dig www.google.com +short'), /142\.250\.74\.46/); has(s.run('dig www.corp.local'), /ANSWER SECTION/); has(s.run('host www.corp.local'), /has address 192\.168\.1\.2/); });
test('files, permissions, sudo, chmod', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'srv' }); has(s.run('pwd'), '/home/student'); has(s.run('ls -la'), /notes\.txt/); has(s.run('cat /etc/shadow'), /Permission denied/); has(s.run('sudo cat /etc/shadow'), /root:\$6/); has(s.run('./scripts/backup.sh'), /Permission denied/); ok(!s.run('chmod +x scripts/backup.sh').err); has(s.run('ls -l scripts'), /-rwxr-xr-x/); has(s.run('./scripts/backup.sh'), /backup done/); has(s.run('chmod 640 /var/www/html/config.php'), /Operation not permitted/); ok(!s.run('sudo chmod 640 /var/www/html/config.php').err); has(s.run('stat /var/www/html/config.php'), /0640/); has(s.run('echo hello > /tmp/x.txt && cat /tmp/x.txt'), /^$/); has(s.run('cat /tmp/x.txt'), /hello/); has(s.run('grep -n student /etc/passwd'), /student:x:1000/); has(s.run('cat /etc/passwd | grep -c :'), /^\d+$/); });
test('users and groups', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'srv' }); has(s.run('useradd bob'), /Permission denied/); ok(!s.run('sudo useradd -m -s /bin/bash bob').err); has(s.run('id bob'), /uid=1001\(bob\)/); ok(!s.run('sudo groupadd devops').err); ok(!s.run('sudo usermod -aG devops bob').err); has(s.run('groups bob'), /devops/); has(s.run('ls -ld /home/bob'), /drwxr-x--- .*bob\s+bob/); has(s.run('getent group devops'), /devops:x:\d+:bob/); has(s.run('sudo -i'), /^$/); ok(s.user === 'root'); has(s.prompt(), /root@srv1:~#/); has(s.run('exit'), /logout/); ok(s.user === 'student'); });
test('journalctl, systemctl, ss, curl, nmap', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'srv' }); has(s.run('journalctl -u sshd -n 5'), /Accepted password for student/); has(s.run('journalctl | grep sudo'), /COMMAND=/); has(s.run('systemctl status apache2'), /active \(running\)/); has(s.run('ss -tuln'), /0\.0\.0\.0:80/); has(s.run('curl http://localhost/'), /Intranet|It works/); has(s.run('sudo systemctl stop apache2'), /^$/); has(s.run('systemctl status apache2'), /inactive/); const s2 = NSA.terminal.createSession({ net, devId: 'pc1' }); has(s2.run('Test-NetConnection 192.168.1.2 -Port 80'), /TcpTestSucceeded\s+: False/); ok(!s.run('sudo systemctl start apache2').err); has(s.run('nmap -sV 192.168.1.2'), /22\/tcp\s+open\s+ssh\s+SSH-2\.0-OpenSSH_9\.2/); has(s.run('nmap -sn 192.168.1.0/24'), /3 hosts up/); has(s.run('sudo ufw enable'), /active/); has(s.run('sudo ufw allow 22'), /Rule added/); ok(N.tcpConnect(net, 'pc1', '192.168.1.2', 80).status === 'filtered'); has(s.run('sudo ufw allow 80/tcp'), /Rule added/); ok(N.tcpConnect(net, 'pc1', '192.168.1.2', 80).status === 'open'); });
test('ip config commands change the simulator', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'srv' }); has(s.run('ip addr add 192.168.1.3/24 dev eth0'), /Operation not permitted/); ok(!s.run('sudo ip addr add 192.168.1.3/24 dev eth0').err); ok(net.devices.srv.interfaces.eth0.ip === '192.168.1.3'); ok(!s.run('sudo ip route add 10.9.0.0/16 via 192.168.1.1').err); has(s.run('ip route'), /10\.9\.0\.0\/16 via 192\.168\.1\.1/); has(s.run('sudo ip route add 10.8.0.0/16 via 172.16.0.1'), /Network is unreachable/); ok(!s.run('sudo ip link set eth0 down').err); has(s.run('ip -br a'), /eth0\s+DOWN/); ok(!N.ping(net, 'pc1', '192.168.1.3').success); ok(!s.run('sudo ip link set eth0 up').err); ok(N.ping(net, 'pc1', '192.168.1.3').success); has(s.run('cat /etc/resolv.conf'), /nameserver 192\.168\.1\.2/); has(s.run('hostname -I'), /192\.168\.1\.3/); });
test('find with -perm and awk/cut/sort filters', () => { const net = office(); const s = NSA.terminal.createSession({ net, devId: 'srv' }); has(s.run('find /home -name "*.sh"'), /backup\.sh/); has(s.run('find / -perm -4000 -type f 2>/dev/null'), /^$|find/); has(s.run("cat /etc/passwd | cut -d: -f1 | sort | head -3"), /daemon\nroot\nstudent|daemon/); has(s.run("ps aux | awk '{print $1}' | sort | uniq -c"), /root/); has(s.run('history'), /find \/home/); has(s.run('man chmod'), /change file mode bits/); });

console.log('ios cli');
test('router: configure interface, route, show commands', () => {
  const net = office(); const r = net.devices.r1; r.interfaces['G0/2'].up = false;
  const s = NSA.terminal.createSession({ net, devId: 'r1' }); ok(s.isIos);
  has(s.prompt(), 'R1>'); has(s.run('show ip interface brief'), /GigabitEthernet0\/1\s+192\.168\.1\.1\s+YES manual up\s+up/);
  has(s.run('conf t'), /% Invalid|Invalid/); ok(!s.run('enable').err); has(s.prompt(), 'R1#');
  has(s.run('conf t'), /Enter configuration commands/); has(s.prompt(), 'R1(config)#');
  ok(!s.run('int g0/2').err); has(s.prompt(), 'R1(config-if)#'); ok(!s.run('ip address 10.0.0.1 255.255.255.0').err); ok(!s.run('no shut').err); ok(r.interfaces['G0/2'].up === true && r.interfaces['G0/2'].ip === '10.0.0.1');
  has(s.run('ip address 192.168.1.5 255.255.255.0'), /overlaps/);
  ok(!s.run('exit').err); ok(!s.run('ip route 10.20.0.0 255.255.0.0 10.0.0.2').err); ok(!s.run('end').err);
  has(s.run('show ip route'), /S\s+10\.20\.0\.0\/16 \[1\/0\] via 10\.0\.0\.2/); has(s.run('show ip route'), /Gateway of last resort is 203\.0\.113\.1/);
  has(s.run('sh run'), /interface GigabitEthernet0\/2\n ip address 10\.0\.0\.1 255\.255\.255\.0/); has(s.run('show running-config'), /ip route 10\.20\.0\.0 255\.255\.0\.0 10\.0\.0\.2/);
  has(s.run('ping 192.168.1.10'), /!!!!!/); has(s.run('ping 192.168.1.77'), /\.\.\.\.\./); has(s.run('show arp'), /192\.168\.1\.10/); has(s.run('show cdp neighbors'), /SW1/); has(s.run('wr'), /\[OK\]/);
  has(s.run('show ip int br ?'), /Invalid|brief|<cr>|Interface/); has(s.run('blah'), /Invalid input/); has(s.run('sh'), /Incomplete|Ambiguous|Invalid/);
});
test('router: ACL, NAT and DHCP via CLI', () => {
  const net = office(); const r = net.devices.r1; r.nat = null;
  const s = NSA.terminal.createSession({ net, devId: 'r1' }); s.run('enable'); s.run('conf t');
  ok(!s.run('ip access-list extended BLOCKWEB').err); has(s.prompt(), 'R1(config-ext-nacl)#'); ok(!s.run('deny tcp 192.168.1.0 0.0.0.255 any eq 80').err); ok(!s.run('permit ip any any').err); s.run('exit');
  s.run('int g0/1'); ok(!s.run('ip access-group BLOCKWEB in').err); s.run('exit');
  ok(N.tcpConnect(net, 'pc1', '192.168.1.2', 80).status === 'open', 'same-subnet traffic does not cross the router');
  ok(!N.ping(net, 'pc1', '8.8.8.8').success, 'no NAT yet');
  ok(!s.run('access-list 1 permit 192.168.1.0 0.0.0.255').err); s.run('int g0/1'); s.run('ip nat inside'); s.run('exit'); s.run('int g0/0'); s.run('ip nat outside'); s.run('exit');
  ok(!s.run('ip nat inside source list 1 interface g0/0 overload').err);
  ok(r.nat && r.nat.outside === 'G0/0', JSON.stringify(r.nat)); ok(N.ping(net, 'pc1', '8.8.8.8').success, 'NAT works');
  ok(N.tcpConnect(net, 'pc1', 'www.example.com', 80).status === 'filtered', 'ACL blocks web to internet: ' + N.tcpConnect(net, 'pc1', 'www.example.com', 80).status);
  ok(N.tcpConnect(net, 'pc1', 'www.example.com', 443).status === 'open');
  s.run('end'); has(s.run('show ip nat translations'), /Inside global/); has(s.run('show access-lists'), /deny tcp 192\.168\.1\.0 0\.0\.0\.255 any eq 80/);
  s.run('conf t'); ok(!s.run('ip dhcp excluded-address 192.168.1.1 192.168.1.50').err); ok(!s.run('ip dhcp pool LAN').err); has(s.prompt(), 'R1(dhcp-config)#'); ok(!s.run('network 192.168.1.0 255.255.255.0').err); ok(!s.run('default-router 192.168.1.1').err); ok(!s.run('dns-server 192.168.1.2').err); s.run('end');
  N.addDevice(net, 'pc', { id: 'pc9', interfaces: { eth0: { mode: 'dhcp' } } }); N.connect(net, 'pc9', 'eth0', 'sw1', 'Fa0/3');
  const d = N.dhcpRequest(net, 'pc9', 'eth0'); ok(d.ok && d.ip === '192.168.1.51', JSON.stringify(d)); has(s.run('show ip dhcp binding'), /192\.168\.1\.51/);
});
test('switch: vlans, trunk, show vlan/mac', () => {
  const net = office(); const s = NSA.terminal.createSession({ net, devId: 'sw1' }); s.run('en'); s.run('conf t');
  ok(!s.run('vlan 10').err); has(s.prompt(), 'SW1(config-vlan)#'); ok(!s.run('name Sales').err); s.run('exit');
  ok(!s.run('interface range fa0/1 - 2').err); ok(!s.run('switchport mode access').err); ok(!s.run('switchport access vlan 10').err); s.run('exit');
  s.run('int fa0/8'); ok(!s.run('switchport mode trunk').err); s.run('end');
  has(s.run('show vlan brief'), /10\s+Sales\s+active\s+Fa0\/1, Fa0\/2/); has(s.run('show interfaces trunk'), /Fa0\/8\s+on\s+802\.1q\s+trunking/);
  ok(N.ping(net, 'pc1', '192.168.1.2').success, 'pc1 and srv both in vlan 10'); ok(!N.ping(net, 'pc1', '192.168.1.1').success, 'router is on native vlan 1 via trunk');
  has(s.run('show mac address-table'), /DYNAMIC\s+Fa0\/1/); has(s.run('show running-config'), /switchport access vlan 10/);
  ok(!s.run('conf t').err); s.run('int fa0/2'); ok(!s.run('shutdown').err); s.run('end'); ok(!N.ping(net, 'pc1', '192.168.1.2').success); has(s.run('show ip int brief'), /FastEthernet0\/2\s+unassigned\s+YES unset\s+administratively down/);
});

console.log('quiz & srs');
test('grading all types', () => { const Q = NSA.quiz; ok(Q.grade({ type: 'mcq', options: ['a', 'b'], answer: 1 }, 1).correct); ok(!Q.grade({ type: 'mcq', options: ['a', 'b'], answer: 1 }, 0).correct); ok(Q.grade({ type: 'multi', options: ['a', 'b', 'c'], answer: [0, 2] }, [2, 0]).correct); ok(Q.grade({ type: 'tf', answer: false }, false).correct); ok(Q.grade({ type: 'fill', answer: ['255.255.255.0', '/24'] }, ' /24 ').correct); ok(Q.grade({ type: 'fill', answer: '/^(ip|ip addr)$/' }, 'ip addr').correct); ok(Q.grade({ type: 'command', answer: '^ipconfig\\s+/all$' }, 'ipconfig  /all').correct); const sp = NSA.subnet.generateProblem(NSA.util.seededRng(7), 'easy', 'basic'); const g = Q.grade({ type: 'subnet', problem: sp }, sp.answers); ok(g.correct); ok(Q.grade({ type: 'order', items: ['a', 'b', 'c'], answer: [2, 0, 1] }, [2, 0, 1]).correct); ok(Q.grade({ type: 'match', pairs: [['80', 'HTTP'], ['22', 'SSH']] }, { 0: 0, 1: 1 }).correct); const all = Q.gradeAll([{ type: 'tf', answer: true, lessonRef: 'x', topic: 'T' }, { type: 'tf', answer: true }], [false, true]); ok(all.score === 50 && all.reviewLessons[0] === 'x'); });
test('exam builder and shuffling keeps answers', () => { const lessons = [{ id: 'l1', title: 'L1', assessment: { questions: [{ type: 'mcq', q: '1', options: ['a', 'b', 'c'], answer: 2 }, { type: 'mcq', q: '2', options: ['a', 'b'], answer: 0 }] } }]; const exam = NSA.quiz.buildExam(lessons, { rng: NSA.util.seededRng(3), perLesson: 2, subnetProblems: 1 }); ok(exam.length === 3); const q = exam.find(x => x.q === '1'); ok(q.options[q.answer] === 'c'); ok(exam.some(x => x.type === 'subnet' && x.problem)); });
test('srs scheduling', () => { const R = NSA.srs; const today = '2026-11-12'; let c = R.review(null, 'good', today); ok(c.interval === 1 && c.due === '2026-11-13'); c = R.review(c, 'good', '2026-11-13'); ok(c.interval === 6); c = R.review(c, 'good', '2026-11-19'); ok(c.interval >= 14, 'interval ' + c.interval); const again = R.review(c, 'again', '2026-12-05'); ok(again.interval === 0 && again.lapses === 1 && again.due === '2026-12-05'); const st = R.stats([{ id: 'a' }, { id: 'b' }], { a: c }, '2026-11-20'); ok(st.new === 1 && st.learned === 1); });

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
