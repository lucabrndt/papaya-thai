const CLASS_NAMES = { middle: 'Middle Class', low: 'Low Class', high: 'High Class' };

const TONE_NAMES = {
  mid: 'Mittlerer Ton', low: 'Tiefer Ton', falling: 'Fallender Ton',
  high: 'Hoher Ton', rising: 'Steigender Ton'
};
const TONE_ICONS = {
  mid: '→', low: '↘', falling: '↗↘', high: '↑', rising: '↗'
};

const Learn = {
  lesson: null,
  items: [],
  idx: 0,
  flipped: false,

  init(lesson) {
    this.lesson = lesson;
    this.items = lesson.items;
    this.idx = 0;
    this.flipped = false;
    this._render();
  },

  _render() {
    const body = document.getElementById('learn-body');
    body.innerHTML = '';

    // Build card scene
    const scene = document.createElement('div');
    scene.className = 'card-scene';
    scene.innerHTML = this._buildCard(this.items[this.idx]);
    body.appendChild(scene);

    const card = scene.querySelector('.learn-card');
    card.addEventListener('click', () => this.flip());

    // Navigation
    const nav = document.createElement('div');
    nav.className = 'learn-nav';
    nav.innerHTML = `
      <button class="btn btn-icon" id="btn-prev" title="Zurück" ${this.idx === 0 ? 'disabled' : ''}>←</button>
      <span class="nav-spacer"></span>
      <button class="btn btn-icon" id="btn-next" title="Weiter">${this.idx === this.items.length - 1 ? '✓' : '→'}</button>
    `;
    body.appendChild(nav);

    nav.querySelector('#btn-prev').addEventListener('click', e => { e.stopPropagation(); this.prev(); });
    nav.querySelector('#btn-next').addEventListener('click', e => { e.stopPropagation(); this.next(); });

    this._updateHeader();
  },

  _buildCard(item) {
    const front = this._buildFront(item);
    const back  = this._buildBack(item);
    return `<div class="learn-card" id="learn-card">
      <div class="card-face card-front ${this._cardClass(item)}">${front}</div>
      <div class="card-face card-back  ${this._cardClass(item)}">${back}</div>
    </div>`;
  },

  _cardClass(item) {
    if (item.type === 'consonant') return `class-${item.tone_class}`;
    return 'class-none';
  },

  _buildFront(item) {
    if (item.type === 'consonant') {
      return `
        <div class="front-top">
          <span class="class-badge ${item.tone_class}">${CLASS_NAMES[item.tone_class]}</span>
        </div>
        <div class="front-center">
          <div class="thai-main">${item.thai}</div>
          <div class="item-name-label">${item.name}</div>
        </div>
        <div class="flip-hint">Zum Umdrehen antippen</div>`;
    }

    if (item.type === 'vowel') {
      const display = item.thai.replace('-', 'ก');
      return `
        <div class="front-top">
          <span class="length-badge">${item.length === 'long' ? 'Langer Vokal' : 'Kurzer Vokal'}</span>
        </div>
        <div class="front-center">
          <div class="thai-main with-context">${display}</div>
          <div class="item-name-label">${item.name}</div>
        </div>
        <div class="flip-hint">Zum Umdrehen antippen</div>`;
    }

    if (item.type === 'number') {
      return `
        <div class="front-top"></div>
        <div class="front-center">
          <div class="number-pair">
            <div class="thai-main with-context">${item.thai}</div>
            <div class="number-arabic">${item.arabic}</div>
          </div>
        </div>
        <div class="flip-hint">Zum Umdrehen antippen</div>`;
    }

    if (item.type === 'tone_mark') {
      return `
        <div class="front-top"></div>
        <div class="front-center">
          <div class="thai-main">${item.thai}</div>
          <div class="item-name-label">${item.name}</div>
        </div>
        <div class="flip-hint">Zum Umdrehen antippen</div>`;
    }

    return `<div class="front-center"><div class="thai-main">${item.thai}</div></div>`;
  },

  _buildBack(item) {
    if (item.type === 'consonant') {
      const toneN = TONE_NAMES[item.example_tone] || item.example_tone;
      const toneI = TONE_ICONS[item.example_tone] || '?';
      return `
        <div class="back-header">
          <span class="thai-small">${item.thai}</span>
          <span class="back-name">${item.name}</span>
          <span class="class-badge ${item.tone_class}">${CLASS_NAMES[item.tone_class]}</span>
        </div>
        <div class="back-body">
          <div class="example-block">
            <div class="example-thai">${item.example_thai}</div>
            <div class="example-row">
              <span class="example-romanized">${item.example_romanized}</span>
              <span class="example-bullet">•</span>
              <span class="example-de">${item.example_de}</span>
            </div>
          </div>
          <div class="hint-box">💡 ${item.sound_hint_de}</div>
          <div class="tone-box">
            <div class="tone-row">
              <span class="tone-icon">🎵</span>
              <span class="tone-name">${toneN}</span>
              <span class="tone-icon">${toneI}</span>
            </div>
            ${this.lesson.tone_note_de ? `<div class="tone-rule-text">${this.lesson.tone_note_de}</div>` : ''}
          </div>
          ${item.note_de ? `<div class="note-box">ℹ️ ${item.note_de}</div>` : ''}
        </div>`;
    }

    if (item.type === 'vowel') {
      return `
        <div class="back-header">
          <span class="thai-small">${item.thai.replace('-','ก')}</span>
          <span class="back-name">${item.name}</span>
          <span class="length-badge">${item.length === 'long' ? 'Lang' : 'Kurz'}</span>
        </div>
        <div class="back-body">
          <div class="example-block">
            <div class="example-thai">${item.example_thai}</div>
            <div class="example-row">
              <span class="example-romanized">${item.example_romanized}</span>
              <span class="example-bullet">•</span>
              <span class="example-de">${item.example_de}</span>
            </div>
          </div>
          <div class="hint-box">💡 ${item.sound_hint_de}</div>
          ${item.note_de ? `<div class="note-box">ℹ️ ${item.note_de}</div>` : ''}
        </div>`;
    }

    if (item.type === 'number') {
      return `
        <div class="back-header">
          <span class="thai-small">${item.thai}</span>
          <span class="back-name">${item.arabic} – ${item.de}</span>
        </div>
        <div class="back-body">
          <div class="example-block">
            <div class="example-thai">${item.thai}</div>
            <div class="example-row">
              <span class="example-romanized">${item.romanized}</span>
              <span class="example-bullet">•</span>
              <span class="example-de">${item.de}</span>
            </div>
          </div>
          <div class="hint-box">💡 Aussprache: ${item.romanized} = "${item.de}"</div>
          ${item.note_de ? `<div class="note-box">ℹ️ ${item.note_de}</div>` : ''}
        </div>`;
    }

    if (item.type === 'tone_mark') {
      return `
        <div class="back-header">
          <span class="thai-small">${item.thai}</span>
          <span class="back-name">${item.name}</span>
        </div>
        <div class="back-body">
          ${item.description_de ? `<div class="hint-box">💡 ${item.description_de}</div>` : ''}
          ${item.effect_de ? `<div class="effect-box">🎵 ${item.effect_de}</div>` : ''}
          ${item.example_thai ? `
          <div class="example-block">
            <div class="example-thai">${item.example_thai}</div>
            <div class="example-row">
              ${item.example_romanized ? `<span class="example-romanized">${item.example_romanized}</span>` : ''}
              ${item.example_de ? `<span class="example-bullet">•</span><span class="example-de">${item.example_de}</span>` : ''}
            </div>
          </div>` : ''}
        </div>`;
    }

    return `<div class="back-body"><div class="hint-box">💡 ${item.description_de || ''}</div></div>`;
  },

  _updateHeader() {
    const fill = document.getElementById('learn-progress-fill');
    const counter = document.getElementById('learn-counter');
    if (fill) fill.style.width = `${((this.idx + 1) / this.items.length) * 100}%`;
    if (counter) counter.textContent = `${this.idx + 1} / ${this.items.length}`;
  },

  flip() {
    const card = document.getElementById('learn-card');
    if (!card) return;
    this.flipped = !this.flipped;
    card.classList.toggle('flipped', this.flipped);
  },

  _animateChange(direction, callback) {
    const card = document.getElementById('learn-card');
    if (!card) { callback(); return; }
    card.classList.remove('flipped');
    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass  = direction === 'next' ? 'slide-in-right' : 'slide-in-left';
    card.classList.add(outClass);
    setTimeout(() => {
      callback();
      // after re-render grab new card
      const newCard = document.getElementById('learn-card');
      if (newCard) {
        newCard.style.opacity = '0';
        newCard.classList.add(inClass);
        newCard.style.opacity = '';
        setTimeout(() => newCard.classList.remove(inClass), 300);
      }
    }, 240);
  },

  next() {
    if (this.idx < this.items.length - 1) {
      this._animateChange('next', () => {
        this.idx++;
        this.flipped = false;
        this._render();
      });
    } else {
      this._showSummary();
    }
  },

  prev() {
    if (this.idx > 0) {
      this._animateChange('prev', () => {
        this.idx--;
        this.flipped = false;
        this._render();
      });
    }
  },

  _showSummary() {
    const body = document.getElementById('learn-body');
    const items = this.items;
    const itemsHtml = items.map(item => {
      const thai = item.thai.replace('-', 'ก');
      const label = item.type === 'number' ? item.de
                  : item.type === 'tone_mark' ? item.name
                  : item.example_de || item.de || '';
      return `<div class="summary-item">
        <span class="summary-thai">${thai}</span>
        <div class="summary-de">${label}</div>
      </div>`;
    }).join('');

    body.innerHTML = `
      <div class="summary-view">
        <div class="summary-title">Lektion abgeschlossen!</div>
        <div class="summary-grid">${itemsHtml}</div>
        <div class="summary-actions">
          <button class="btn btn-outline" onclick="App.showOverview()">Zur Übersicht</button>
          <button class="btn btn-primary" onclick="App.startQuiz(${this.lesson.lesson})">Quiz starten</button>
          <button class="btn btn-success" onclick="App.completeLesson(${this.lesson.lesson})">Abschließen ✓</button>
        </div>
      </div>`;

    const fill = document.getElementById('learn-progress-fill');
    if (fill) fill.style.width = '100%';
    const counter = document.getElementById('learn-counter');
    if (counter) counter.textContent = `${this.items.length} / ${this.items.length}`;
  }
};
