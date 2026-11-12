/* Headless view smoke test: load the whole app with DOM stubs and compile every
 * component template via Vue.compile to catch template syntax errors. Run: node tests/views.test.js */
'use strict';
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');

// --- minimal DOM / browser stubs ---
const listeners = {};
const docEl = { setAttribute() {}, getAttribute() { return null; } };
// basic HTML entity decoder so Vue's template compiler can decode &times; &amp; &#39; etc.
function decodeEntities(s) {
  return String(s).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", times: '×', nbsp: ' ', hellip: '…', mdash: '—', copy: '©', rarr: '→' };
    if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return isNaN(n) ? m : String.fromCodePoint(n); }
    return named[e.toLowerCase()] != null ? named[e.toLowerCase()] : m;
  });
}
function el() { let _html = ''; const node = { style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, getAttribute() { return null; }, hasAttribute() { return false; }, appendChild() {}, removeChild() {}, remove() {}, addEventListener() {}, querySelectorAll() { return []; }, click() {}, focus() {}, scrollIntoView() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 560 }; }, viewBox: { baseVal: { width: 1000, height: 560 } }, children: [], href: '', value: '', nodeType: 1 }; Object.defineProperty(node, 'innerHTML', { get() { return _html; }, set(v) { _html = v; } }); Object.defineProperty(node, 'textContent', { get() { return decodeEntities(_html.replace(/<[^>]*>/g, '')); }, set(v) { _html = v; } });
  Object.defineProperty(node, 'children', { get() { const m = _html.match(/foo="([^"]*)"/); return [{ getAttribute(name) { return name === 'foo' && m ? decodeEntities(m[1]) : null; } }]; } });
  return node; }
const store = {};
global.window = global;
global.document = { documentElement: docEl, createElement: el, getElementById() { return null; }, querySelector() { return null; }, addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); }, body: el(), readyState: 'loading', visibilityState: 'visible' };
global.location = { hash: '#/dashboard', protocol: 'http:' };
global.history = { length: 1, back() {} };
global.localStorage = { getItem(k) { return store[k] || null; }, setItem(k, v) { store[k] = v; }, removeItem(k) { delete store[k]; } };
try { Object.defineProperty(global, "navigator", { value: { serviceWorker: null }, configurable: true }); } catch(e) {}
global.addEventListener = function (t, f) { (listeners[t] = listeners[t] || []).push(f); };
global.requestAnimationFrame = function (f) { return 0; };
global.scrollTo = function () {};
global.Blob = function () {}; global.URL = { createObjectURL() { return ''; }, revokeObjectURL() {} };
global.FileReader = function () {};
global.btoa = s => Buffer.from(s, 'binary').toString('base64');
global.atob = s => Buffer.from(s, 'base64').toString('binary');

// --- load Vue global build in this context so `var Vue` binds to global ---
const vm = require('vm');
vm.runInThisContext(fs.readFileSync(path.join(root, 'vendor/vue.global.prod.js'), 'utf8'), { filename: 'vue.global.prod.js' });
const Vue = global.Vue;
if (!Vue || !Vue.createApp) { console.log('FAIL: Vue did not load'); process.exit(1); }

// --- load all app scripts in index.html order ---
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...indexHtml.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(s => !s.includes('vendor/vue'));
let loadErr = 0;
for (const s of scripts) { try { require(path.join(root, s)); } catch (e) { console.log('LOAD FAIL ' + s + ': ' + e.message); loadErr++; } }

const NSA = global.NSA;
let pass = 0, fail = 0;
// data sanity
function ck(name, cond) { if (cond) { pass++; } else { fail++; console.log('  FAIL ' + name); } }
ck('lessons loaded (>=54)', (NSA.data.lessons || []).length >= 54);
ck('labs loaded', NSA.data.labs && NSA.data.labs.netsim && NSA.data.labs.terminal && NSA.data.labs.security && NSA.data.labs.troubleshoot);
ck('missions loaded (6)', (NSA.data.missions || []).length === 6);
ck('glossary/flashcards/achievements/resources', (NSA.data.glossary || []).length > 20 && (NSA.data.flashcards || []).length > 50 && (NSA.data.achievements || []).length > 10 && (NSA.data.certs || []).length > 0);
ck('components registered (>=25)', Object.keys(NSA.components || {}).length >= 25);
ck('engines present', NSA.subnet && NSA.netsim && NSA.terminal && NSA.quiz && NSA.srs && NSA.ios);
ck('gamification + progress', NSA.gamification && NSA.progress);

// compile every component template
let compiled = 0, compileFail = 0;
for (const name of Object.keys(NSA.components)) {
  const comp = NSA.components[name];
  const tpl = comp && comp.template;
  if (typeof tpl !== 'string') continue;
  try { const r = Vue.compile(tpl); if (typeof r !== 'function') throw new Error('not a function'); compiled++; }
  catch (e) { compileFail++; console.log('  TEMPLATE FAIL [' + name + ']: ' + (e.message || e).toString().split('\n')[0]); }
}
ck('all templates compile', compileFail === 0);

// verify lesson assessment questions are well-formed for the quiz engine
let qErr = 0;
for (const l of NSA.data.lessons) {
  for (const q of (l.assessment.questions || [])) {
    if (q.type === 'mcq' && (!q.options || q.answer == null)) qErr++;
    if (q.type === 'match' && !q.pairs) qErr++;
    if (q.type === 'order' && !q.items) qErr++;
  }
}
ck('lesson questions well-formed', qErr === 0);

// verify every lesson practical references an existing lab
const labIds = new Set([].concat(...Object.values(NSA.data.labs).map(a => a.map(l => l.id))));
let missingLab = 0;
for (const l of NSA.data.lessons) if (l.practical && l.practical.type !== 'challenge' && !labIds.has(l.practical.id)) { missingLab++; console.log('  missing practical lab ' + l.practical.id + ' in ' + l.id); }
ck('lesson practicals resolve to labs', missingLab === 0);

// verify mission lab steps reference existing labs
let missionLabErr = 0;
for (const m of NSA.data.missions) for (const s of m.steps) if (s.type === 'lab' && !labIds.has(s.lab)) { missionLabErr++; console.log('  mission ' + m.id + ' references missing lab ' + s.lab); }
ck('mission labs resolve', missionLabErr === 0);

console.log('\ntemplates compiled: ' + compiled + ', load errors: ' + loadErr);
console.log(pass + ' checks passed, ' + fail + ' failed');
process.exit(fail || loadErr ? 1 : 0);
