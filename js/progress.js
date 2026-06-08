const PROGRESS_KEY = 'thai_app_progress_v2';

const Progress = {
  data: null,

  load(defaultCompleted) {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      try { this.data = JSON.parse(saved); return this.data; } catch(e) {}
    }
    this.data = { completedLessons: [...(defaultCompleted || [])], quizScores: {} };
    this.save();
    return this.data;
  },

  save() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.data));
  },

  markComplete(lessonNum) {
    if (!this.data.completedLessons.includes(lessonNum)) {
      this.data.completedLessons.push(lessonNum);
      this.save();
    }
  },

  setQuizScore(lessonNum, score) {
    this.data.quizScores[lessonNum] = score;
    this.save();
  },

  isComplete(lessonNum) {
    return this.data.completedLessons.includes(lessonNum);
  },

  bestScore(lessonNum) {
    return this.data.quizScores[lessonNum] || 0;
  }
};
