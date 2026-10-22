/* Read-only cumulative practice statistics. Does not change grading, questions or storage. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.JCSQECumulative = api;
    api.install(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const VERSION = '15.10';

  // Count committed practice-history rows, not displayed questions or unique question IDs.
  // Preserve prior revisions' attempts. Timed exams and unobserved allocations are separate.
  function summarize(profile) {
    const history = profile && profile.appliedStudy && profile.appliedStudy.history;
    let answered = 0, correct = 0;
    for (const row of Array.isArray(history) ? history : []) {
      if (!row || row.kind !== 'practice' || row.observed === false ||
          typeof row.correct !== 'boolean') continue;
      answered++;
      if (row.correct) correct++;
    }
    return {answered, correct, accuracy: answered ? Math.round(correct / answered * 1000) / 10 : null};
  }

  function accuracyText(stats) {
    return stats.accuracy === null ? '—' : stats.accuracy.toFixed(1) + '%';
  }

  function install(win) {
    const E = win.JCSQEApplied, doc = win.document;
    const root = doc && doc.getElementById('applied-app');
    if (!E || !root || root.dataset.cumulativeInstalled) return;
    root.dataset.cumulativeInstalled = VERSION;
    doc.documentElement.dataset.cumulativeRevision = VERSION;
    let currentProfile = null;

    // Observe the same in-memory profile the UI uses, including unsaved results when storage
    // is blocked. Do not re-read storage, initialize a profile or store a separate counter.
    for (const [name, argument] of [['profile', 0], ['stats', 1], ['view', 0]]) {
      const original = E[name];
      if (typeof original !== 'function') continue;
      E[name] = function (...args) {
        currentProfile = args[argument];
        return original.apply(this, args);
      };
    }

    function createPanel() {
      const panel = doc.createElement('section');
      panel.className = 'cumulative-scoreboard';
      panel.setAttribute('aria-label', '通常演習の累計成績');
      panel.setAttribute('aria-live', 'polite');
      panel.setAttribute('aria-atomic', 'true');
      const grid = doc.createElement('div');
      grid.className = 'cumulative-grid';
      for (const [key, label] of [['answered', '累計回答数'], ['correct', '正解数'], ['accuracy', '正解率']]) {
        const cell = doc.createElement('div'), value = doc.createElement('strong'), caption = doc.createElement('span');
        cell.className = 'cumulative-metric';
        value.dataset.cumulativeValue = key;
        caption.textContent = label;
        cell.append(value, caption);
        grid.append(cell);
      }
      const note = doc.createElement('p');
      note.className = 'cumulative-note';
      note.textContent = '通常演習の累計です。復習・「分からない」を含み、模試と未表示の問題は含みません。';
      panel.append(grid, note);
      return panel;
    }

    function layout() {
      const main = root.querySelector('main');
      if (!main || !currentProfile) return;
      const active = currentProfile.appliedStudy && currentProfile.appliedStudy.active;
      const quiz = main.querySelector('.quiz-top');
      let panel = main.querySelector('.cumulative-scoreboard');
      // Do not change any score display during a timed exam, even via stored history.
      if (quiz && active && active.kind === 'mock') {
        if (panel) panel.remove();
        return;
      }
      const anchor = quiz || main.querySelector('.hero');
      if (!anchor) return;
      if (!panel) {
        panel = createPanel();
        anchor.insertAdjacentElement('afterend', panel);
      }
      const stats = summarize(currentProfile);
      const values = {
        answered: stats.answered.toLocaleString('ja-JP') + '問',
        correct: stats.correct.toLocaleString('ja-JP') + '問',
        accuracy: accuracyText(stats)
      };
      for (const [key, text] of Object.entries(values)) {
        const element = panel.querySelector('[data-cumulative-value="' + key + '"]');
        if (element.textContent !== text) element.textContent = text;
      }
      // The original counter added one before a question was answered. Only the new,
      // actually committed total is labelled cumulative; a question number is not a score.
      if (quiz && active && active.continuous === true) {
        const label = quiz.querySelector('p.muted');
        if (label && label.textContent !== '連続演習中') label.textContent = '連続演習中';
      }
    }
    const observer = new win.MutationObserver(layout);
    observer.observe(root, {childList: true, subtree: true});
    layout();
    return {refresh: layout, disconnect: () => observer.disconnect()};
  }
  return {version: VERSION, summarize, accuracyText, install};
});
