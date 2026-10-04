/* Additive v11 launcher. ?legacy=1 leaves all previous screens untouched. */
(() => {
'use strict';
if (new URLSearchParams(location.search).get('legacy') === '1') return;
const app = document.getElementById('app');
if (!app) return;
const url = new URL('./practice.html', location.href).href;
function enhanceHome() {
  const main = app.querySelector('main#main');
  if (!main || main.dataset.appliedLauncher === '11') return;
  const eyebrow = main.querySelector('.hero .eyebrow');
  if (!eyebrow || !eyebrow.textContent.includes('SMALL STEPS, CLEAR PROGRESS')) return;
  main.dataset.appliedLauncher = '11';
  const previous = document.createElement('details');
  previous.className = 'panel';
  const summary = document.createElement('summary');
  summary.textContent = '以前の用語問題・3周コース・学習記録を開く';
  previous.appendChild(summary);
  const old = document.createElement('div');
  while (main.firstChild) old.appendChild(main.firstChild);
  previous.appendChild(old);
  const launch = document.createElement('section');
  launch.className = 'panel';
  launch.setAttribute('aria-label', '新しい事例演習');
  launch.innerHTML = '<span class="tag">v11.0 · 新しい演習</span><h1 style="margin-top:14px">言葉の暗記から、<br>条件を読み解く練習へ。</h1><p>64問・32テーマの独自問題。事例判断、比較、計算、テストの組み立てを混ぜて解きます。</p><p><a class="primary" data-applied-launch style="display:inline-block;text-decoration:none" href="./practice.html">事例で考える演習を開く →</a></p><p class="muted">ワンタップ回答・要点＋詳細解説。旧履歴は残し、新演習の成績とは分けて管理します。公式問題や全範囲の網羅を保証するものではありません。</p>';
  main.append(launch, previous);
}
// The exercise navigation opens the new bank; an explicit legacy URL opts out.
document.addEventListener('click', e => {
  const target = e.target.closest('[data-action="nav"][data-route="practice"]');
  if (target && app.contains(target)) {
    e.preventDefault();e.stopImmediatePropagation();location.href = url;
  }
}, true);
new MutationObserver(enhanceHome).observe(app, {childList: true, subtree: true});
enhanceHome();
})();
