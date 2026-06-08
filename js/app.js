const CHAPTERS = [
  { num: 1, name: 'Erste Buchstaben: M, N, G, D, B', lessons: [1, 2, 3] },
  { num: 2, name: 'Ch, S, Ph, F und erste Vokale',   lessons: [4, 5, 6] },
  { num: 3, name: 'Th, H, R, L und mehr Vokale',     lessons: [7, 8, 9] },
  { num: 4, name: 'J, DT, BP und Diphthonge',        lessons: [10, 11, 12] },
  { num: 5, name: 'Die S-Laute und UEA-Vokale',      lessons: [13, 14, 15] },
  { num: 6, name: 'Verdoppelungen und Tonzeichen',   lessons: [16, 17, 18] },
  { num: 7, name: 'Historische Sanskrit-Buchstaben', lessons: [19, 20, 21, 22] },
  { num: 8, name: 'Zahlen 1–10',                     lessons: [23, 24, 25] },
];

const App = {
  data: null,

  init() {
    this.data = APP_DATA;
    Progress.load(this.data.meta.user_progress.completed_lessons);
    this.renderOverview();
    this._showView('overview');
    this._bindSidebar();
  },

  _showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');
  },

  showOverview() {
    document.body.classList.remove('lesson-active');
    this.renderOverview();
    this._showView('overview');
  },

  /* ── Sidebar ─────────────────────────────────────────── */

  _bindSidebar() {
    // "Weiterlernen" goes to the current lesson
    const btn = document.getElementById('btn-weiterlernen');
    if (btn) {
      btn.addEventListener('click', () => {
        if (!this.data) return;
        this.openLesson(this._getCurrentLesson());
      });
    }

    // Update review badge (count of lessons with quiz score due for review)
    const reviewCount = Progress.data ? Progress.data.completedLessons.length : 0;
    const badge = document.getElementById('review-count');
    if (badge) badge.textContent = reviewCount;
  },

  /* ── Overview ────────────────────────────────────────── */

  renderOverview() {
    if (!this.data) return;

    const total = this.data.meta.total_lessons || 25;
    const completed = Progress.data.completedLessons.length;
    const currentLesson = this._getCurrentLesson();

    const fill = document.getElementById('overview-progress-fill');
    if (fill) fill.style.width = Math.round((completed / total) * 100) + '%';
    const label = document.getElementById('completed-count');
    if (label) label.textContent = completed + ' von ' + total + ' abgeschlossen';

    const meta = document.getElementById('overview-meta');
    if (meta) meta.textContent = total + ' Lektionen';

    const container = document.getElementById('chapters-container');
    if (!container) return;

    container.innerHTML = this.data.lessons.map(lesson => {
      const done = Progress.isComplete(lesson.lesson);
      const isCurrent = !done && lesson.lesson === currentLesson;

      // Thai chars: only consonant + vowel items
      const thaiChars = lesson.items
        .filter(i => i.type === 'consonant' || i.type === 'vowel')
        .map(i => i.thai || '')
        .filter(Boolean);

      // Join: a, b, c und d
      let thaiStr = '';
      if (thaiChars.length === 1) {
        thaiStr = thaiChars[0];
      } else if (thaiChars.length > 1) {
        thaiStr = thaiChars.slice(0, -1).join(', ') + ' und ' + thaiChars[thaiChars.length - 1];
      }

      // For tone_mark-only lessons (like 17, 18), fall back to all items
      if (!thaiStr) {
        const fallback = lesson.items.map(i => i.thai || '').filter(Boolean);
        if (fallback.length === 1) thaiStr = fallback[0];
        else if (fallback.length > 1) thaiStr = fallback.slice(0, -1).join(', ') + ' und ' + fallback[fallback.length - 1];
      }

      const circleIcon = done ? '✓' : isCurrent ? '▶' : '';
      const circleClass = done ? 'lesson-row-circle done' : isCurrent ? 'lesson-row-circle current' : 'lesson-row-circle todo';

      return `
        <div class="lesson-row ${done ? 'done' : isCurrent ? 'current' : ''}" onclick="App.openLesson(${lesson.lesson})">
          <span class="lesson-row-num">${lesson.lesson}</span>
          <span class="lesson-row-title">
            Lektion ${lesson.lesson}
            ${thaiStr ? `<span class="lesson-row-sep"> · </span><span class="lesson-row-thai">${thaiStr}</span>` : ''}
          </span>
          <span class="${circleClass}">${circleIcon}</span>
        </div>`;
    }).join('');
  },

  _getCurrentLesson() {
    for (let i = 1; i <= (this.data.meta.total_lessons || 25); i++) {
      if (!Progress.isComplete(i)) return i;
    }
    return 1;
  },

  /* ── Lesson popup ────────────────────────────────────── */

  openLesson(lessonNum) {
    const lesson = this.data.lessons.find(l => l.lesson === lessonNum);
    if (!lesson) return;

    // Build title: first letter of each name capitalized, joined with ", und " for last
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const names = lesson.items
      .map(i => i.name ? cap(i.name) : '')
      .filter(Boolean);
    let romanTitle = '';
    if (names.length === 0) {
      romanTitle = lesson.title_de || ('Lektion ' + lesson.lesson);
    } else if (names.length === 1) {
      romanTitle = names[0];
    } else {
      romanTitle = names.slice(0, -1).join(', ') + ', und ' + names[names.length - 1];
    }

    // Thai chars display (replace vowel placeholder dashes)
    const thaiChars = lesson.items
      .map(i => (i.thai || '').replace(/-/g, 'ก'))
      .filter(Boolean);
    const thaiDisplay = thaiChars.join('  ');

    const itemCount = lesson.items.filter(i => i.type !== 'tone_rule').length;

    const content = document.getElementById('popup-content');
    content.innerHTML = `
      <div class="popup-lesson-num">Lektion ${lesson.lesson}</div>
      <div class="popup-title">${romanTitle}</div>
      <div class="popup-subtitle">Lerne ${itemCount} Zeichen</div>
      <div class="popup-thai-display">${thaiDisplay}</div>`;

    const actions = document.getElementById('popup-actions');
    actions.innerHTML = `
      <button class="btn btn-primary" onclick="App.startLearn(${lessonNum}); App._closePopup();">Lernen</button>
      <button class="btn btn-outline" onclick="App.startQuiz(${lessonNum}); App._closePopup();">Quiz</button>`;

    const overlay = document.getElementById('lesson-popup-overlay');
    overlay.style.display = 'flex';
  },

  closePopup(event, force) {
    if (force || (event && event.target === document.getElementById('lesson-popup-overlay'))) {
      this._closePopup();
    }
  },

  _closePopup() {
    document.getElementById('lesson-popup-overlay').style.display = 'none';
  },

  /* ── Lesson title helper ─────────────────────────────── */

  _lessonTitle(lesson) {
    const chars = lesson.items
      .filter(i => i.type === 'consonant' || i.type === 'vowel')
      .map(i => i.thai)
      .filter(Boolean);

    if (chars.length === 0) {
      // fallback: tone_mark or number items
      const all = lesson.items.map(i => i.thai).filter(Boolean);
      if (all.length === 0) return 'Lektion ' + lesson.lesson;
      const last = all[all.length - 1];
      const rest = all.slice(0, -1);
      const joined = rest.length ? rest.join(', ') + ' und ' + last : last;
      return 'Lektion ' + lesson.lesson + ' · ' + joined;
    }

    const last = chars[chars.length - 1];
    const rest = chars.slice(0, -1);
    const joined = rest.length ? rest.join(', ') + ' und ' + last : last;
    return 'Lektion ' + lesson.lesson + ' · ' + joined;
  },

  _setModeTitle(elId, lesson) {
    const el = document.getElementById(elId);
    if (!el) return;
    const parts = this._lessonTitle(lesson).split(' · ');
    if (parts.length === 2) {
      el.innerHTML = parts[0] + ' <span class="mode-title-sep">·</span> <span class="mode-title-thai">' + parts[1] + '</span>';
    } else {
      el.textContent = parts[0];
    }
  },

  /* ── Learn mode ──────────────────────────────────────── */

  startLearn(lessonNum) {
    const lesson = this.data.lessons.find(l => l.lesson === lessonNum);
    if (!lesson) return;
    document.body.classList.add('lesson-active');

    this._setModeTitle('learn-lesson-title', lesson);
    document.getElementById('learn-progress-fill').style.width = '0%';
    document.getElementById('learn-counter').textContent = '1 / ' + lesson.items.length;

    this._showView('learn');
    Learn.init(lesson);
  },

  /* ── Quiz mode ───────────────────────────────────────── */

  startQuiz(lessonNum) {
    const lesson = this.data.lessons.find(l => l.lesson === lessonNum);
    if (!lesson) return;
    document.body.classList.add('lesson-active');

    this._setModeTitle('quiz-lesson-title', lesson);
    document.getElementById('quiz-progress-fill').style.width = '0%';
    document.getElementById('quiz-counter').textContent = '1 / ' + lesson.items.length;

    // Reset quiz body
    const body = document.getElementById('quiz-body');
    body.querySelectorAll('.quiz-result-card').forEach(el => el.remove());
    const qCard = document.getElementById('quiz-question-card');
    const answersEl = document.getElementById('quiz-answers');
    const fb = document.getElementById('quiz-feedback');
    qCard.style.display = '';
    answersEl.style.display = '';
    fb.style.display = '';

    const allItems = this.data.lessons.flatMap(l => l.items);
    this._showView('quiz');
    Quiz.init(lesson, allItems);
  },

  /* ── Complete lesson ─────────────────────────────────── */

  completeLesson(lessonNum) {
    Progress.markComplete(lessonNum);
    document.body.classList.remove('lesson-active');
    this.renderOverview();
    this._showView('overview');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
