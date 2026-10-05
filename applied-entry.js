/* Additive v12.1 launcher. ?legacy=1 leaves all previous screens untouched. */
(() => {
'use strict';
if (new URLSearchParams(location.search).get('legacy') === '1') return;
const app = document.getElementById('app');
if (!app) return;
const practiceUrl = new URL('./practice.html', location.href);
const STORAGE_KEY = 'jcsqe-shokyu-state-v3';

function activeApplied() {
  try {
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const state=JSON.parse(raw), p=state?.profiles?.[state.activeProfileId];
    return p?.appliedStudy || null;
  } catch { return null; }
}
function planHref(date, round) {
  const u=new URL(practiceUrl.href);
  u.searchParams.set('plan',date);
  u.searchParams.set('round',String(round));
  return u.href;
}
function enhanceHome() {
  const main = app.querySelector('main#main');
  if (!main || main.dataset.appliedLauncher === '12') return;
  const eyebrow = main.querySelector('.hero .eyebrow');
  if (!eyebrow || !eyebrow.textContent.includes('SMALL STEPS, CLEAR PROGRESS')) return;
  main.dataset.appliedLauncher = '12';
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
  launch.innerHTML = '<span class="tag">v12.1 · 理解重視＋理由が分かる解説</span><h1 style="margin-top:14px">消去法から、<br>根拠で選ぶ練習へ。</h1><p>64問・32テーマ。似た概念・近い選択肢を比較し、問題文の条件を理解しないと選びにくい構成へ更新しました。</p><p><a class="primary" data-applied-launch style="display:inline-block;text-decoration:none" href="./practice.html">事例で考える演習を開く →</a></p><p class="muted">ワンタップ回答。詳細解説では「判断基準→問題への適用→誤答の決定的な誤り→正解との比較」まで確認できます。v11までの履歴は残します。公式問題や全範囲の網羅を保証するものではありません。</p>';
  main.append(launch, previous);
}
function setTextIfChanged(el,text){if(el.textContent!==text)el.textContent=text;}
function enhancePlan() {
  const main=app.querySelector('main#main');
  if(!main) return;
  const hero=main.querySelector('.hero h1');
  if(!hero || !hero.textContent.includes('11月14日までの道筋')) return;
  const list=main.querySelector('.category-list');
  if(!list) return;
  if(!main.querySelector('[data-plan-help]')){
    const help=document.createElement('div');
    help.className='notice';
    help.dataset.planHelp='1';
    help.innerHTML='<b>未実施の回はここから開始できます</b><p>「未実施」または「今日」のカードをタップしてください。予定日を過ぎて実施しても、対象回の日付と実際の実施日は分けて記録します。</p>';
    list.before(help);
  }
  const applied=activeApplied();
  const sessions=applied?.sessions || [];
  const active=applied?.active || null;
  for(const row of list.querySelectorAll('.plan-row')){
    const strong=row.querySelector('strong'), tag=row.querySelector('.tag');
    if(!strong || !tag) continue;
    const m=strong.textContent.match(/(\d{2})\/(\d{2})\s*第(\d+)回/);
    if(!m) continue;
    const date=`2026-${m[1]}-${m[2]}`, round=Number(m[3]);
    const completed=sessions.some(r=>r?.kind==='mock'&&r?.total===40&&r?.plannedDate===date);
    const inProgress=active?.kind==='mock'&&active?.plannedDate===date;
    row.classList.remove('plan-clickable','plan-completed');
    row.removeAttribute('role');row.removeAttribute('tabindex');
    delete row.dataset.appliedPlanDate;delete row.dataset.appliedPlanRound;
    if(completed){
      setTextIfChanged(tag,'実施済み');
      row.classList.add('plan-completed');
      continue;
    }
    if(inProgress){
      setTextIfChanged(tag,'途中・再開 →');
      row.classList.add('plan-clickable');
      row.dataset.appliedPlanDate=date;row.dataset.appliedPlanRound=String(round);
      row.setAttribute('role','button');row.tabIndex=0;
      continue;
    }
    if(tag.textContent.includes('未実施')||tag.textContent.includes('今日')){
      setTextIfChanged(tag,tag.textContent.includes('今日')?'今日・開始 →':'未実施・開始 →');
      row.classList.add('plan-clickable');
      row.dataset.appliedPlanDate=date;row.dataset.appliedPlanRound=String(round);
      row.setAttribute('role','button');row.tabIndex=0;
    }
  }
}
function enhance(){enhanceHome();enhancePlan();}
function launchPlan(el){
  const date=el.dataset.appliedPlanDate,round=el.dataset.appliedPlanRound;
  if(!date||!round)return;
  location.href=planHref(date,round);
}
// The exercise navigation opens the new bank; an explicit legacy URL opts out.
document.addEventListener('click', e => {
  const plan=e.target.closest('[data-applied-plan-date]');
  if(plan&&app.contains(plan)){e.preventDefault();e.stopImmediatePropagation();launchPlan(plan);return;}
  const target = e.target.closest('[data-action="nav"][data-route="practice"]');
  if (target && app.contains(target)) {
    e.preventDefault();e.stopImmediatePropagation();location.href = practiceUrl.href;
  }
}, true);
document.addEventListener('keydown', e=>{
  if(!['Enter',' '].includes(e.key))return;
  const plan=e.target.closest?.('[data-applied-plan-date]');
  if(plan&&app.contains(plan)){e.preventDefault();launchPlan(plan);}
}, true);
new MutationObserver(enhance).observe(app, {childList: true, subtree: true});
enhance();
})();