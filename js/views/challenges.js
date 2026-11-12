/* NetSec Academy – Challenges: daily/weekly, subnet trainer, flashcards */
(function (global) {
  const NSA = global.NSA;
  NSA.components = NSA.components || {};
  const U = () => NSA.util; const S = () => NSA.subnet;

  NSA.components['view-challenges'] = {
    data() { return { state: NSA.store.state, tab: 'daily',
      // subnet trainer
      sp: null, spDiff: 'easy', spAns: {}, spResult: null, spStreak: 0,
      // flashcards
      deck: 'ports', card: null, flipped: false, reviewed: 0, sessionCards: []
    }; },
    computed: {
      todayKey() { return U().todayKey(); },
      weekKey() { return U().isoWeekKey(); },
      daily() { return this.buildDaily(); },
      weekly() { return this.buildWeekly(); },
      dailyState() { return this.state.challenges.daily[this.todayKey] || { done: false }; },
      weeklyState() { return this.state.challenges.weekly[this.weekKey] || { done: false }; },
      decks() { return NSA.data.flashcardDecks; },
      deckCards() { return (NSA.data.flashcards || []).filter(c => c.deck === this.deck); },
      srsStats() { return NSA.srs.stats(this.deckCards, this.state.flashcards); }
    },
    methods: {
      go(p) { NSA.router.navigate(p); },
      // ---- daily/weekly generation (deterministic by date) ----
      buildDaily() {
        const seed = U().hashString('daily' + this.todayKey);
        const rng = U().seededRng(seed);
        const types = ['subnet', 'flashcards', 'quiz'];
        const pick = types[seed % types.length];
        if (pick === 'subnet') return { type: 'subnet', title: 'Solve 3 subnetting problems', seed, goal: 3 };
        if (pick === 'flashcards') return { type: 'flashcards', title: 'Review 10 flashcards', seed, goal: 10 };
        return { type: 'quiz', title: 'Answer 5 mixed questions', seed, goal: 5, questions: this.randomQuiz(rng, 5) };
      },
      buildWeekly() {
        const seed = U().hashString('weekly' + this.weekKey);
        return { type: 'lab', title: 'Complete any 2 labs this week', seed, goal: 2 };
      },
      randomQuiz(rng, n) {
        const pool = []; (NSA.data.lessons || []).forEach(l => (l.assessment.questions || []).forEach(q => { if (q.type !== 'subnet') pool.push(Object.assign({}, q, { lessonRef: l.id, topic: l.title })); }));
        return NSA.quiz.prepare(U().shuffle(pool, rng).slice(0, n), rng);
      },
      markDaily(progress) {
        const d = this.state.challenges.daily[this.todayKey] || (this.state.challenges.daily[this.todayKey] = { done: false, progress: 0 });
        d.progress = Math.max(d.progress || 0, progress);
        if (progress >= this.daily.goal && !d.done) { d.done = true; NSA.gamification.addXP(NSA.progress.XP.daily, 'Daily challenge complete', 'daily'); }
      },
      startDaily() {
        if (this.daily.type === 'subnet') { this.tab = 'subnet'; }
        else if (this.daily.type === 'flashcards') { this.tab = 'flashcards'; }
        else if (this.daily.type === 'quiz') { this.openQuizModal(this.daily.questions, 'Daily challenge', s => this.markDaily(this.daily.goal)); }
      },
      openQuizModal(questions, title, onDone) {
        NSA.ui.openModal({ title, wide: true, component: 'quiz-modal', props: { questions, pass: 60, onComplete: onDone }, actions: [] });
      },
      // ---- subnet trainer ----
      newProblem() { this.sp = S().generateProblem(Math.random, this.spDiff); this.spAns = {}; this.spResult = null; },
      checkSubnet() {
        if (!this.sp) return;
        let hits = 0; const total = this.sp.fields.length;
        this.sp.fields.forEach(f => { if (S().checkAnswer(this.sp, f.key, this.spAns[f.key])) hits++; });
        const correct = hits === total;
        this.spResult = { correct, hits, total };
        NSA.store.state.stats.subnetAttempts = (NSA.store.state.stats.subnetAttempts || 0) + 1;
        if (correct) { NSA.store.state.stats.subnetCorrect = (NSA.store.state.stats.subnetCorrect || 0) + 1; this.spStreak++; if (this.daily.type === 'subnet') this.markDaily(this.spStreak); NSA.gamification.checkAchievements(); }
        else this.spStreak = 0;
      },
      // ---- flashcards ----
      startFlash() { this.sessionCards = this.buildFlashSession(); this.reviewed = 0; this.nextCard(); },
      buildFlashSession() { const due = NSA.srs.dueCards(this.deckCards, this.state.flashcards); const rest = this.deckCards.filter(c => !due.includes(c)); return U().shuffle(due.length ? due : rest).slice(0, 20); },
      nextCard() { this.flipped = false; this.card = this.sessionCards[this.reviewed] || null; },
      flip() { this.flipped = !this.flipped; },
      grade(g) {
        if (!this.card) return;
        const st = this.state.flashcards[this.card.id] || NSA.srs.defaultCard();
        this.state.flashcards[this.card.id] = NSA.srs.review(st, g);
        NSA.store.state.stats.flashReviews = (NSA.store.state.stats.flashReviews || 0) + 1;
        this.reviewed++;
        if (this.daily.type === 'flashcards') this.markDaily(this.reviewed);
        NSA.gamification.checkAchievements();
        if (this.reviewed >= this.sessionCards.length) { this.card = null; NSA.ui.toast('Reviewed ' + this.reviewed + ' cards. 🧠', 'success'); }
        else this.nextCard();
      },
      changeDeck(d) { this.deck = d; this.card = null; this.sessionCards = []; }
    },
    created() { this.newProblem(); },
    template: `
    <div class="stack">
      <section-head title="Challenges" sub="Daily and weekly challenges, a subnet trainer, and spaced-repetition flashcards." />
      <div class="tabs">
        <button :class="{active:tab==='daily'}" @click="tab='daily'">Daily &amp; Weekly</button>
        <button :class="{active:tab==='subnet'}" @click="tab='subnet'">Subnet Trainer</button>
        <button :class="{active:tab==='flashcards'}" @click="tab='flashcards'">Flashcards</button>
      </div>

      <template v-if="tab==='daily'">
        <div class="grid cols-2">
          <div class="card" :style="dailyState.done?'border-color:var(--green)':''">
            <div class="card-title"><h3><nsa-icon name="bolt" :size="18"/> Daily challenge</h3><span class="chip" :class="dailyState.done?'green':'amber'">{{ dailyState.done?'Done ✓':'+'+ (NSA.progress.XP.daily) +' XP' }}</span></div>
            <p>{{ daily.title }}</p>
            <nsa-progress :value="Math.min(100,(dailyState.progress||0)/daily.goal*100)" thin :kind="dailyState.done?'green':''" style="margin-bottom:10px" />
            <button class="btn" :class="dailyState.done?'':'primary'" @click="startDaily">{{ dailyState.done?'Practise again':'Start challenge' }}</button>
          </div>
          <div class="card" :style="weeklyState.done?'border-color:var(--green)':''">
            <div class="card-title"><h3><nsa-icon name="target" :size="18"/> Weekly challenge</h3><span class="chip" :class="weeklyState.done?'green':'purple'">{{ weeklyState.done?'Done ✓':'+'+ (NSA.progress.XP.weekly) +' XP' }}</span></div>
            <p>{{ weekly.title }}</p>
            <button class="btn" @click="go('/labs')"><nsa-icon name="flask" :size="16"/> Go to labs</button>
          </div>
        </div>
        <div class="callout tip"><div class="callout-title">Keep your streak</div>Completing any lesson, lab or challenge each day grows your learning streak and earns bonus achievements.</div>
      </template>

      <template v-else-if="tab==='subnet'">
        <div class="card">
          <div class="row between"><div class="pills"><button v-for="d in ['easy','medium','hard']" :key="d" :class="{active:spDiff===d}" @click="spDiff=d;newProblem()">{{ d }}</button></div>
          <div class="row"><span class="chip amber">🔥 streak {{ spStreak }}</span><span class="chip">{{ state.stats.subnetCorrect||0 }} solved</span></div></div>
          <div class="quiz-q mt" v-if="sp">
            <div class="q-num">{{ sp.title }}</div>
            <div class="q-text"><nsa-md :src="sp.question" /></div>
            <div class="grid auto-sm" style="gap:8px">
              <div v-for="f in sp.fields" :key="f.key" class="field"><label>{{ f.label }}</label><input class="mono" v-model="spAns[f.key]" :disabled="spResult" spellcheck="false" @keyup.enter="checkSubnet"/></div>
            </div>
            <div class="btn-row mt">
              <button v-if="!spResult" class="btn primary" @click="checkSubnet">Check</button>
              <button v-else class="btn primary" @click="newProblem">Next problem →</button>
            </div>
            <div v-if="spResult" class="feedback mt" :class="spResult.correct?'ok':'bad'"><strong>{{ spResult.correct?'Correct!':'Got '+spResult.hits+'/'+spResult.total+'.' }}</strong> {{ sp.explain }}</div>
          </div>
        </div>
      </template>

      <template v-else-if="tab==='flashcards'">
        <div class="card pad-sm">
          <div class="pills"><button v-for="d in decks" :key="d.id" :class="{active:deck===d.id}" @click="changeDeck(d.id)">{{ d.title }}</button></div>
        </div>
        <div class="grid cols-4">
          <stat-card label="Total cards" :value="srsStats.total" />
          <stat-card label="Due now" :value="srsStats.due" kind="amber" icon="clock" />
          <stat-card label="Learned" :value="srsStats.learned" icon="check" />
          <stat-card label="Mastered" :value="srsStats.mastered" icon="star" />
        </div>
        <div class="card" v-if="card">
          <div class="flashcard" @click="flip">
            <span class="fc-label">{{ flipped?'Answer':'Question' }} · card {{ reviewed+1 }}/{{ sessionCards.length }}</span>
            <div v-if="!flipped">{{ card.front }}</div>
            <div v-else class="fc-back">{{ card.back }}</div>
          </div>
          <div v-if="!flipped" class="center mt"><button class="btn" @click="flip">Show answer</button></div>
          <div v-else class="btn-row mt" style="justify-content:center">
            <button class="btn danger" @click="grade('again')">Again</button>
            <button class="btn" @click="grade('hard')">Hard</button>
            <button class="btn primary" @click="grade('good')">Good</button>
            <button class="btn success" @click="grade('easy')">Easy</button>
          </div>
        </div>
        <div v-else class="card center">
          <p class="muted">{{ reviewed>0?'Session complete — '+reviewed+' cards reviewed.':'Ready to study the '+deck+' deck.' }}</p>
          <button class="btn primary" @click="startFlash"><nsa-icon name="cards" :size="16"/> {{ reviewed>0?'Study again':'Start review' }}</button>
          <p class="tiny dim mt">Spaced repetition schedules each card based on how well you knew it.</p>
        </div>
      </template>
    </div>`
  };

  // Quiz modal wrapper
  NSA.components['quiz-modal'] = {
    props: { questions: Array, pass: Number, onComplete: Function },
    template: `<quiz-runner :questions="questions" :pass="pass||60" @complete="onComplete && onComplete($event)" @close="$root.$nsa ? NSA.ui.closeModal() : null" />`,
    created() { this.NSA = NSA; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
