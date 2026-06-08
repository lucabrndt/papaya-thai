const Quiz = {
  lesson: null,
  questions: [],
  allItems: [],
  idx: 0,
  score: 0,
  answered: false,

  init(lesson, allItems) {
    this.lesson = lesson;
    this.allItems = allItems;
    this.questions = this._generateQuestions(lesson.items);
    this.idx = 0;
    this.score = 0;
    this.answered = false;
    this._renderQuestion();
  },

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  _distractors(correctItem, getValue, count = 3) {
    const correctVal = getValue(correctItem);
    const pool = this._shuffle(this.allItems).filter(i => {
      const v = getValue(i);
      return v && v.trim() && v !== correctVal;
    });
    const seen = new Set([correctVal]);
    const result = [];
    for (const item of pool) {
      const v = getValue(item);
      if (!seen.has(v)) { seen.add(v); result.push(v); }
      if (result.length >= count) break;
    }
    while (result.length < count) result.push('???');
    return result;
  },

  _generateQuestions(items) {
    return items.map((item, i) => this._makeQuestion(item, i % 3));
  },

  _makeQuestion(item, qType) {
    if (item.type === 'consonant' || item.type === 'vowel') {
      const displayThai = item.thai.replace('-', 'ก');
      if (qType === 0) {
        // Show Thai → pick name
        const correct = item.name;
        const wrong = this._distractors(item, i => i.name);
        const choices = this._shuffle([correct, ...wrong]);
        return { prompt: 'Was ist das?', promptThai: displayThai, isThai: true,
                 choices, correct, isThaiBtns: false };
      }
      if (qType === 1) {
        // Show name → pick Thai character
        const correct = displayThai;
        const wrong = this._distractors(item,
          i => (i.type === 'consonant' || i.type === 'vowel') ? i.thai.replace('-','ก') : null);
        const choices = this._shuffle([correct, ...wrong]);
        return { prompt: 'Welches Zeichen ist das?', promptText: item.name, isThai: false,
                 choices, correct, isThaiBtns: true };
      }
      // qType === 2: Show example Thai → pick German
      if (item.example_thai && item.example_de) {
        const correct = item.example_de;
        const wrong = this._distractors(item,
          i => (i.type === 'consonant' || i.type === 'vowel') ? i.example_de : null);
        const choices = this._shuffle([correct, ...wrong]);
        return { prompt: 'Was bedeutet das Wort?', promptThai: item.example_thai, isThai: true,
                 choices, correct, isThaiBtns: false };
      }
      // fallback to type 0
      const correct2 = item.name;
      const wrong2 = this._distractors(item, i => i.name);
      return { prompt: 'Wie heißt dieses Zeichen?', promptThai: displayThai, isThai: true,
               choices: this._shuffle([correct2, ...wrong2]), correct: correct2, isThaiBtns: false };
    }

    if (item.type === 'number') {
      if (qType !== 1) {
        // Show Thai numeral → pick German
        const correct = item.de;
        const wrong = this._distractors(item, i => i.type === 'number' ? i.de : null);
        const choices = this._shuffle([correct, ...wrong]);
        return { prompt: 'Was bedeutet diese Zahl?', promptThai: item.thai, isThai: true,
                 choices, correct, isThaiBtns: false };
      }
      // Show Arabic → pick Thai
      const correct = item.thai;
      const wrong = this._distractors(item, i => i.type === 'number' ? i.thai : null);
      const choices = this._shuffle([correct, ...wrong]);
      return { prompt: `Wie schreibt man die ${item.arabic}?`, promptText: item.arabic, isThai: false,
               choices, correct, isThaiBtns: true };
    }

    if (item.type === 'tone_mark') {
      if (qType !== 1) {
        const correct = item.name;
        const wrong = this._distractors(item, i => i.name);
        return { prompt: 'Wie heißt dieses Zeichen?', promptThai: item.thai, isThai: true,
                 choices: this._shuffle([correct, ...wrong]), correct, isThaiBtns: false };
      }
      const correct = item.thai;
      const wrong = this._distractors(item, i => i.type === 'tone_mark' ? i.thai : null);
      return { prompt: `Welches Zeichen ist "${item.name}"?`, promptText: item.name, isThai: false,
               choices: this._shuffle([correct, ...wrong]), correct, isThaiBtns: true };
    }

    // Fallback
    return { prompt: 'Was ist das?', promptThai: item.thai, isThai: true,
             choices: [item.name,'???','???','???'], correct: item.name, isThaiBtns: false };
  },

  _renderQuestion() {
    if (this.idx >= this.questions.length) { this._showResults(); return; }

    const q = this.questions[this.idx];
    this.answered = false;

    const fill = document.getElementById('quiz-progress-fill');
    const counter = document.getElementById('quiz-counter');
    if (fill) fill.style.width = `${((this.idx + 1) / this.questions.length) * 100}%`;
    if (counter) counter.textContent = `${this.idx + 1} / ${this.questions.length}`;

    const qCard = document.getElementById('quiz-question-card');
    let promptHtml = '';
    if (q.isThai) {
      const size = q.promptThai && q.promptThai.length > 3 ? 'small' : q.promptThai && q.promptThai.length > 1 ? 'medium' : '';
      promptHtml = `<div class="quiz-thai ${size}">${q.promptThai}</div>`;
    } else {
      promptHtml = `<div class="quiz-text">${q.promptText}</div>`;
    }
    qCard.innerHTML = `<div class="quiz-prompt-label">${q.prompt}</div>${promptHtml}`;

    const answersEl = document.getElementById('quiz-answers');
    answersEl.innerHTML = q.choices.map((c, i) => {
      const thaiClass = q.isThaiBtns ? ' thai-option' : '';
      return `<button class="quiz-answer-btn${thaiClass}" data-idx="${i}">${c}</button>`;
    }).join('');

    answersEl.querySelectorAll('.quiz-answer-btn').forEach(btn => {
      btn.addEventListener('click', () => this._handleAnswer(btn, q));
    });

    const fb = document.getElementById('quiz-feedback');
    fb.className = 'quiz-feedback';
    fb.textContent = '';
  },

  _handleAnswer(btn, q) {
    if (this.answered) return;
    this.answered = true;

    const chosen = btn.textContent;
    const isCorrect = chosen === q.correct;
    const allBtns = document.querySelectorAll('.quiz-answer-btn');

    allBtns.forEach(b => {
      b.disabled = true;
      if (b.textContent === q.correct) b.classList.add('correct');
    });

    const fb = document.getElementById('quiz-feedback');
    if (isCorrect) {
      this.score++;
      btn.classList.add('correct');
      fb.className = 'quiz-feedback correct';
      fb.textContent = '✓ Richtig!';
    } else {
      btn.classList.add('wrong');
      fb.className = 'quiz-feedback wrong';
      fb.textContent = `✗ Falsch — Richtig: ${q.correct}`;
    }

    setTimeout(() => {
      this.idx++;
      this._renderQuestion();
    }, 1500);
  },

  _showResults() {
    const pct = Math.round((this.score / this.questions.length) * 100);
    const passed = pct >= 80;

    if (passed) {
      Progress.markComplete(this.lesson.lesson);
      Progress.setQuizScore(this.lesson.lesson, pct);
      this._launchConfetti();
    } else {
      Progress.setQuizScore(this.lesson.lesson, pct);
    }

    const qCard = document.getElementById('quiz-question-card');
    const answersEl = document.getElementById('quiz-answers');
    const fb = document.getElementById('quiz-feedback');
    qCard.style.display = 'none';
    answersEl.style.display = 'none';
    fb.style.display = 'none';

    const body = document.getElementById('quiz-body');
    const result = document.createElement('div');
    result.className = 'quiz-result-card';
    result.innerHTML = `
      <div class="result-icon">${passed ? '🏆' : '📚'}</div>
      <div class="result-title">${passed ? 'Lektion abgeschlossen!' : 'Weiter üben!'}</div>
      <div class="result-score">${this.score}<span> / ${this.questions.length}</span></div>
      <div class="result-message">
        ${passed
          ? `Hervorragend! ${pct}% richtig – Lektion als abgeschlossen markiert.`
          : `${pct}% richtig. Für Abschluss sind 80% nötig.`}
      </div>
      <div class="result-actions">
        <button class="btn btn-outline" onclick="App.startQuiz(${this.lesson.lesson})">Nochmal</button>
        <button class="btn btn-primary" onclick="App.showOverview()">Zur Übersicht</button>
      </div>`;
    body.appendChild(result);

    if (passed && App && App.renderOverview) App.renderOverview();
  },

  _launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#E8A020','#5BA85A','#4A90D9','#E05252','#F5E6C8','#fff'];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: 5 + Math.random() * 5,
      d: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltAngleDelta: (Math.random() * 0.07) + 0.05
    }));

    let frame = 0;
    const maxFrames = 200;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.ellipse(p.x + p.tilt, p.y, p.r / 2, p.r, p.tiltAngle, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.d;
        p.tiltAngle += p.tiltAngleDelta;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      });
      frame++;
      if (frame < maxFrames) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    requestAnimationFrame(draw);
  }
};
