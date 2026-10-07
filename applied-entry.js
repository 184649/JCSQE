/* Additive v15.2 launcher. ?legacy=1 leaves all previous screens untouched. */
(() => {
'use strict';
if (new URLSearchParams(location.search).get('legacy') === '1') return;
const app = document.getElementById('app');
if (!app) return;
const practiceUrl = new URL('./practice.html', location.href);
const benchmarkUrl = new URL('./benchmark.html', location.href);
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
  if (!main || main.dataset.appliedLauncher === '151') return;
  const eyebrow = main.querySelector('.hero .eyebrow');
  if (!eyebrow || !eyebrow.textContent.includes('SMALL STEPS, CLEAR PROGRESS')) return;
  main.dataset.appliedLauncher = '151';
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
  launch.setAttribute('aria-label', 'JCSQE演習道場');
  launch.innerHTML = '<span class="tag">v15.2 · JCSQE演習道場</span><h1 style="margin-top:14px">問題数を選ばず、<br>次々と解く。</h1><p>公式公開過去問の出題形式を参考にした400問から、未回答・弱点・復習時期を自動で優先。1問ごとに教科書水準の解説で周辺知識まで確認し、そのまま次へ進みます。</p><p><a class="primary" data-applied-launch style="display:inline-block;text-decoration:none" href="./practice.html">演習道場を開く →</a></p><p class="muted">過去問道場を参考に、出題範囲の指定・続きから再開・未回答/弱点の復習・網羅度と学習履歴を重視した作りです。通常演習に問題数選択はありません。</p>';
  const benchmark = document.createElement('section');
  benchmark.className='panel';
  benchmark.setAttribute('aria-label','本番校正10回');
  benchmark.innerHTML='<span class="tag">v15 · 公式公開過去問の出題形式準拠</span><h2 style="margin-top:12px">本番80%への積み上げ</h2><p>本番と同じ40問・60分。10回400問を重複なしで実施し、直近3回と分野別の安定性で到達度を確認します。</p><p><a class="primary" style="display:inline-block;text-decoration:none" href="./benchmark.html">本番校正ダッシュボード →</a></p><p class="muted">第18・20・22・26回と公式サンプルに見られる、同一テーマの記述判定・組合せ・事例選択・計算を混在させた独自問題です。本番得点そのものを保証する表示はしません。</p>';
  main.append(benchmark,launch,previous);
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
    help.className='notice';help.dataset.planHelp='1';
    help.innerHTML='<b>本番校正は計画カードから開始できます</b><p>今日または未実施のカードをタップすると、該当する40問・60分の固定回へ進みます。</p>';
    list.before(help);
  }
  let benchmarkStudy=null;
  try{const raw=localStorage.getItem(STORAGE_KEY),st=raw?JSON.parse(raw):null,p=st?.profiles?.[st.activeProfileId];benchmarkStudy=p?.benchmarkStudy||null;}catch{}
  const done=benchmarkStudy?.sessions||[],active=benchmarkStudy?.active||null;
  for(const row of list.querySelectorAll('[data-benchmark-form]')){
    const form=Number(row.dataset.benchmarkForm),date=row.dataset.benchmarkPlanDate,tag=row.querySelector('.tag');
    if(!tag)continue;
    const completed=done.some(r=>r?.firstAttempt&&r?.form===form),inProgress=active?.form===form;
    row.classList.remove('plan-clickable','plan-completed');row.removeAttribute('role');row.removeAttribute('tabindex');
    if(completed){setTextIfChanged(tag,'実施済み');row.classList.add('plan-completed');continue;}
    if(inProgress){setTextIfChanged(tag,'途中・再開 →');row.classList.add('plan-clickable');row.setAttribute('role','button');row.tabIndex=0;continue;}
    if(tag.textContent.includes('未実施')||tag.textContent.includes('今日')){setTextIfChanged(tag,tag.textContent.includes('今日')?'今日・開始 →':'未実施・開始 →');row.classList.add('plan-clickable');row.setAttribute('role','button');row.tabIndex=0;}
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
  const bench=e.target.closest('[data-benchmark-form]');
  if(bench&&app.contains(bench)&&bench.classList.contains('plan-clickable')){
    e.preventDefault();e.stopImmediatePropagation();const u=new URL(benchmarkUrl.href);u.searchParams.set('form',bench.dataset.benchmarkForm);u.searchParams.set('plan',bench.dataset.benchmarkPlanDate);location.href=u.href;return;
  }
  const plan=e.target.closest('[data-applied-plan-date]');
  if(plan&&app.contains(plan)){e.preventDefault();e.stopImmediatePropagation();launchPlan(plan);return;}
  const target = e.target.closest('[data-action="nav"][data-route="practice"]');
  if (target && app.contains(target)) {
    e.preventDefault();e.stopImmediatePropagation();location.href = practiceUrl.href;
  }
}, true);
document.addEventListener('keydown', e=>{
  if(!['Enter',' '].includes(e.key))return;
  const bench=e.target.closest?.('[data-benchmark-form]');
  if(bench&&app.contains(bench)&&bench.classList.contains('plan-clickable')){e.preventDefault();const u=new URL(benchmarkUrl.href);u.searchParams.set('form',bench.dataset.benchmarkForm);u.searchParams.set('plan',bench.dataset.benchmarkPlanDate);location.href=u.href;return;}
  const plan=e.target.closest?.('[data-applied-plan-date]');
  if(plan&&app.contains(plan)){e.preventDefault();launchPlan(plan);}
}, true);
new MutationObserver(enhance).observe(app, {childList: true, subtree: true});
enhance();
})();