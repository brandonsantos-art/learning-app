/* NetSec Academy – Study Tools: certifications, templates, career, glossary, notes */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};
  const U = () => NSA.util;

  NSA.components['view-resources'] = {
    data() { return { state: NSA.store.state, tab: 'certs', gq: '', gcat: 'all', noteText: '', cmdText: '', cmdDesc: '', openCert: null, openTpl: null, roleSel: null }; },
    computed: {
      certs() { return NSA.data.certs || []; },
      templates() { return NSA.data.templates || []; },
      career() { return NSA.data.career || {}; },
      glossary() { let g = (NSA.data.glossary || []).slice(); if (this.gcat !== 'all') g = g.filter(x => x.cat === this.gcat); if (this.gq.trim()) { const q = this.gq.toLowerCase(); g = g.filter(x => x.term.toLowerCase().includes(q) || x.def.toLowerCase().includes(q)); } return g.sort((a, b) => a.term.localeCompare(b.term)); },
      notes() { return this.state.notes || []; },
      commands() { return this.state.commands || []; },
      bookmarks() { return (this.state.bookmarks || []).map(id => NSA.progress.lesson(id)).filter(Boolean); }
    },
    methods: {
      go(p) { NSA.router.navigate(p); },
      lessonTitle(id) { const l = NSA.progress.lesson(id); return l ? l.title : id; },
      lessonDone(id) { return this.state.lessons[id] && this.state.lessons[id].completedAt; },
      certProgress(c) { const all = []; c.domains.forEach(d => d.lessons.forEach(l => all.push(l))); const uniq = Array.from(new Set(all)); const done = uniq.filter(id => this.lessonDone(id)).length; return { done, total: uniq.length, pct: U().pct(done, uniq.length) }; },
      addNote() { if (!this.noteText.trim()) return; this.state.notes.unshift({ id: U().uid('n'), text: this.noteText.trim(), at: new Date().toISOString() }); this.noteText = ''; NSA.gamification.checkAchievements(); },
      delNote(id) { const i = this.state.notes.findIndex(n => n.id === id); if (i >= 0) this.state.notes.splice(i, 1); },
      addCmd() { if (!this.cmdText.trim()) return; this.state.commands.unshift({ id: U().uid('c'), cmd: this.cmdText.trim(), desc: this.cmdDesc.trim(), at: new Date().toISOString() }); this.cmdText = ''; this.cmdDesc = ''; NSA.gamification.checkAchievements(); },
      delCmd(id) { const i = this.state.commands.findIndex(c => c.id === id); if (i >= 0) this.state.commands.splice(i, 1); },
      openTemplate(t) { NSA.ui.openModal({ title: t.title, wide: true, md: t.md, actions: [{ label: 'Copy to a note', kind: '', value: 'note' }, { label: 'Download (.md)', kind: '', value: 'dl' }, { label: 'Close', kind: 'primary', value: null }] }).then(v => { if (v === 'note') { this.state.notes.unshift({ id: U().uid('n'), text: '# ' + t.title + '\\n\\n' + t.md, at: new Date().toISOString() }); NSA.ui.toast('Saved to your notes.', 'success'); } else if (v === 'dl') { U().download(t.id + '.md', t.md, 'text/markdown'); } }); },
      selRole(r) { this.roleSel = this.roleSel === r.id ? null : r.id; }
    },
    template: `
    <div class="stack">
      <section-head title="Study Tools" sub="Certification prep, professional documentation templates, career readiness, a glossary and your personal notes." />
      <div class="tabs">
        <button :class="{active:tab==='certs'}" @click="tab='certs'">Certifications</button>
        <button :class="{active:tab==='templates'}" @click="tab='templates'">Templates</button>
        <button :class="{active:tab==='career'}" @click="tab='career'">Career</button>
        <button :class="{active:tab==='glossary'}" @click="tab='glossary'">Glossary</button>
        <button :class="{active:tab==='notes'}" @click="tab='notes'">Notes &amp; Commands</button>
      </div>

      <template v-if="tab==='certs'">
        <p class="small muted">Lessons are mapped to certification objectives. Completing this course prepares you to study for these exams — it does not grant an official certification.</p>
        <div class="grid cols-2">
          <div v-for="c in certs" :key="c.id" class="card">
            <div class="card-title"><h3>{{ c.title }}</h3><a :href="c.url" target="_blank" rel="noopener" class="chip"><nsa-icon name="external" :size="12"/> official</a></div>
            <p class="small muted">{{ c.desc }}</p>
            <nsa-progress :value="certProgress(c).pct" :label="certProgress(c).done + '/' + certProgress(c).total + ' mapped lessons complete'" />
            <button class="btn sm ghost block mt" @click="openCert = openCert===c.id?null:c.id">{{ openCert===c.id?'Hide':'Show' }} objective map</button>
            <div v-if="openCert===c.id" class="mt">
              <div v-for="d in c.domains" :key="d.name" style="margin-bottom:8px">
                <div class="small" style="font-weight:600">{{ d.name }}</div>
                <div class="row" style="gap:4px;flex-wrap:wrap">
                  <span v-for="lid in d.lessons" :key="lid" class="chip tiny" :class="lessonDone(lid)?'green':''" style="cursor:pointer" @click="go('/lesson/'+lid)">{{ lessonDone(lid)?'✓ ':'' }}{{ lessonTitle(lid) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="tab==='templates'">
        <p class="small muted">Professional documentation templates. Open one to read it, save it to your notes, or download it.</p>
        <div class="grid cols-2">
          <div v-for="t in templates" :key="t.id" class="card clickable" @click="openTemplate(t)">
            <div class="card-title"><h3>{{ t.title }}</h3><span class="chip">{{ t.category }}</span></div>
            <p class="small muted">{{ t.md.split('\\n').filter(l=>l.trim()&&!l.startsWith('#'))[0] }}</p>
            <button class="btn sm"><nsa-icon name="clipboard" :size="14"/> Open template</button>
          </div>
        </div>
      </template>

      <template v-else-if="tab==='career'">
        <div class="card">
          <div class="card-title"><h3>Career tracks</h3></div>
          <div class="grid auto">
            <div v-for="r in career.roles" :key="r.id" class="card pad-sm clickable" @click="selRole(r)" :style="roleSel===r.id?'border-color:var(--accent)':''">
              <div class="row between"><strong class="small">{{ r.title }}</strong><span class="chip">{{ r.salary }}</span></div>
              <div v-if="roleSel===r.id" class="mt">
                <div class="tiny dim mb">Core skills</div><ul class="small">​<li v-for="s in r.skills" :key="s">{{ s }}</li></ul>
                <div class="tiny dim">Recommended lessons</div><div class="row" style="gap:4px;flex-wrap:wrap"><span v-for="lid in r.lessons" :key="lid" class="chip tiny" :class="lessonDone(lid)?'green':''" style="cursor:pointer" @click.stop="go('/lesson/'+lid)">{{ lessonTitle(lid) }}</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="grid cols-2">
          <div class="card">
            <div class="card-title"><h3>Interview questions</h3></div>
            <details v-for="(q,i) in career.interview" :key="i" style="border-bottom:1px solid var(--border);padding:8px 0">
              <summary style="cursor:pointer;font-weight:550">{{ q.q }}</summary>
              <p class="small muted" style="margin:8px 0 0">{{ q.a }}</p>
            </details>
          </div>
          <div class="card">
            <div class="card-title"><h3>Practical challenges</h3></div>
            <div v-for="(c,i) in career.challenges" :key="i" class="list-item" style="padding:10px 12px;cursor:pointer" @click="c.lab && c.lab.indexOf('challenge')<0 && go('/labs')">
              <div class="li-icon"><nsa-icon name="target" :size="16"/></div>
              <div class="li-body"><div class="small" style="font-weight:600">{{ c.title }}</div><div class="tiny dim">{{ c.desc }}</div></div>
            </div>
            <div class="card-title mt"><h3>Portfolio ideas</h3></div>
            <ul class="small">​<li v-for="(p,i) in career.portfolio" :key="i">{{ p }}</li></ul>
          </div>
        </div>
      </template>

      <template v-else-if="tab==='glossary'">
        <div class="card pad-sm">
          <div class="inline-form"><input v-model="gq" placeholder="search terms…" style="flex:1"/><div class="pills"><button :class="{active:gcat==='all'}" @click="gcat='all'">All</button><button :class="{active:gcat==='networking'}" @click="gcat='networking'">Networking</button><button :class="{active:gcat==='security'}" @click="gcat='security'">Security</button></div></div>
        </div>
        <div class="card">
          <div v-for="g in glossary" :key="g.term" style="padding:8px 0;border-bottom:1px solid var(--border)">
            <div class="row between"><strong>{{ g.term }}</strong><span class="badge" :class="g.cat==='security'?'sec':'net'">{{ g.cat }}</span></div>
            <div class="small muted">{{ g.def }}</div>
          </div>
          <empty-state v-if="!glossary.length" text="No terms match your search." />
        </div>
      </template>

      <template v-else-if="tab==='notes'">
        <div class="grid cols-2">
          <div class="card">
            <div class="card-title"><h3><nsa-icon name="note" :size="18"/> My notes</h3></div>
            <div class="field"><textarea v-model="noteText" placeholder="Write a study note (Markdown supported)…" style="min-height:70px"></textarea></div>
            <button class="btn sm primary" @click="addNote"><nsa-icon name="plus" :size="14"/> Add note</button>
            <div class="list mt">
              <div v-for="n in notes" :key="n.id" class="card pad-sm">
                <div class="row between"><span class="tiny dim">{{ NSA.util.fmtDateTime(n.at) }}</span><button class="btn xs ghost" @click="delNote(n.id)"><nsa-icon name="trash" :size="13"/></button></div>
                <nsa-md :src="n.text" />
              </div>
              <empty-state v-if="!notes.length" icon="note" text="No notes yet." />
            </div>
          </div>
          <div class="card">
            <div class="card-title"><h3><nsa-icon name="terminal" :size="18"/> Command library</h3></div>
            <div class="field"><input v-model="cmdText" class="mono" placeholder="command, e.g. ip route add default via 10.0.0.1" spellcheck="false"/></div>
            <div class="inline-form"><input v-model="cmdDesc" placeholder="what it does (optional)"/><button class="btn sm primary" @click="addCmd"><nsa-icon name="plus" :size="14"/> Save</button></div>
            <div class="list mt">
              <div v-for="c in commands" :key="c.id" class="list-item" style="padding:8px 10px">
                <div class="li-body"><div class="mono small">{{ c.cmd }}</div><div v-if="c.desc" class="tiny dim">{{ c.desc }}</div></div>
                <button class="btn xs ghost" @click="delCmd(c.id)"><nsa-icon name="trash" :size="13"/></button>
              </div>
              <empty-state v-if="!commands.length" icon="terminal" text="Save useful commands here as you learn them." />
            </div>
            <div class="card-title mt"><h3><nsa-icon name="bookmark" :size="18"/> Bookmarked lessons</h3></div>
            <div class="list"><list-tile v-for="l in bookmarks" :key="l.id" icon="book" :title="l.title" :to="'/lesson/'+l.id" /><empty-state v-if="!bookmarks.length" icon="bookmark" text="Bookmark lessons from the lesson page." /></div>
          </div>
        </div>
      </template>
    </div>`
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
