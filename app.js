const QUESTIONS = window.JCSQE_QUESTIONS;
const STORAGE_KEY = 'jcsqe-dojo-progress-v1';
const EXAM_DATE = new Date('2026-11-14T10:30:00+09:00');
const state = {
  mode: null, queue: [], index: 0, sessionAnswers: [], answeredCurrent: false,
  timer: null, secondsLeft: 0
};

const $ = (id) => document.getElementById(id);
const els = {
  home:$('homeView'), quiz:$('quizView'), result:$('resultView'), daysLeft:$('daysLeft'),
  overallRate:$('overallRate'), answeredCount:$('answeredCount'), categoryStats:$('categoryStats'),
  progressText:$('progressText'), progressBar:$('progressBar'), timerText:$('timerText'),
  categoryBadge:$('categoryBadge'), difficultyBadge:$('difficultyBadge'), questionText:$('questionText'),
  choices:$('choices'), explanation:$('explanation'), nextBtn:$('nextBtn'), quitBtn:$('quitBtn'),
  backHomeBtn:$('backHomeBtn'), resetBtn:$('resetBtn'), installBtn:$('installBtn'),
  resultTitle:$('resultTitle'), resultCorrect:$('resultCorrect'), resultTotal:$('resultTotal'),
  resultRate:$('resultRate'), resultMessage:$('resultMessage'), resultBreakdown:$('resultBreakdown')
};

function loadProgress(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {answers:{}}; }
  catch { return {answers:{}}; }
}
function saveProgress(p){ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function switchView(name){
  [els.home,els.quiz,els.result].forEach(v=>v.classList.remove('active'));
  ({home:els.home,quiz:els.quiz,result:els.result})[name].classList.add('active');
  window.scrollTo({top:0,behavior:'instant'});
}
function updateCountdown(){
  const diff = EXAM_DATE - new Date();
  els.daysLeft.textContent = Math.max(0, Math.ceil(diff/86400000));
}
function getStats(){
  const p=loadProgress();
  const stats={}; let total=0, correct=0;
  QUESTIONS.forEach(q=>{
    stats[q.category] ||= {answered:0,correct:0};
    const a=p.answers[q.id];
    if(a){ total+=a.attempts; correct+=a.correct; stats[q.category].answered+=a.attempts; stats[q.category].correct+=a.correct; }
  });
  return {stats,total,correct};
}
function renderHome(){
  updateCountdown();
  const {stats,total,correct}=getStats();
  els.overallRate.textContent = total ? `${Math.round(correct/total*100)}%` : '--%';
  els.answeredCount.textContent = `${total}問回答`;
  els.categoryStats.innerHTML='';
  Object.entries(stats).sort(([a],[b])=>a.localeCompare(b,'ja')).forEach(([name,s])=>{
    const rate=s.answered?Math.round(s.correct/s.answered*100):0;
    const row=document.createElement('div'); row.className='stat-row';
    row.innerHTML=`<span class="stat-name">${name}</span><span class="stat-value">${s.answered?rate+'%':'未回答'}</span><div class="bar"><span style="width:${rate}%"></span></div>`;
    els.categoryStats.appendChild(row);
  });
}
function weightedAdaptive(count=10){
  const p=loadProgress();
  const pool=[];
  QUESTIONS.forEach(q=>{
    const a=p.answers[q.id];
    let weight=2;
    if(!a) weight=4;
    else {
      const rate=a.correct/a.attempts;
      weight = rate < .5 ? 8 : rate < .8 ? 5 : 1;
      if(a.lastCorrect===false) weight += 4;
    }
    for(let i=0;i<weight;i++) pool.push(q);
  });
  const picked=[]; const used=new Set();
  while(picked.length<Math.min(count,QUESTIONS.length) && pool.length){
    const q=pool[Math.floor(Math.random()*pool.length)];
    if(!used.has(q.id)){ used.add(q.id); picked.push(q); }
  }
  return picked;
}
function buildQueue(mode){
  const p=loadProgress();
  if(mode==='adaptive') return weightedAdaptive(10);
  if(mode==='random') return shuffle(QUESTIONS).slice(0,10);
  if(mode==='wrong'){
    const wrong=QUESTIONS.filter(q=>p.answers[q.id] && p.answers[q.id].correct < p.answers[q.id].attempts);
    return shuffle(wrong).slice(0,Math.max(1,Math.min(10,wrong.length)));
  }
  if(mode==='exam'){
    // 50問未満でも将来的に増やせる。現状は40問をランダム抽出。
    return shuffle(QUESTIONS).slice(0,40);
  }
  return [];
}
function startMode(mode){
  const queue=buildQueue(mode);
  if(!queue.length){ alert('復習対象の間違い問題がまだありません。まず通常演習を解いてください。'); return; }
  Object.assign(state,{mode,queue,index:0,sessionAnswers:[],answeredCurrent:false});
  clearInterval(state.timer); state.timer=null;
  if(mode==='exam') { state.secondsLeft=60*60; startTimer(); }
  switchView('quiz'); renderQuestion();
}
function startTimer(){
  updateTimerText();
  state.timer=setInterval(()=>{
    state.secondsLeft--; updateTimerText();
    if(state.secondsLeft<=0){ clearInterval(state.timer); finishSession(true); }
  },1000);
}
function updateTimerText(){
  if(state.mode!=='exam'){ els.timerText.textContent=''; return; }
  const m=Math.floor(state.secondsLeft/60).toString().padStart(2,'0');
  const s=(state.secondsLeft%60).toString().padStart(2,'0');
  els.timerText.textContent=`残り ${m}:${s}`;
}
function renderQuestion(){
  const q=state.queue[state.index]; state.answeredCurrent=false;
  els.progressText.textContent=`${state.index+1} / ${state.queue.length}`;
  els.progressBar.style.width=`${(state.index/state.queue.length)*100}%`;
  els.categoryBadge.textContent=q.category;
  els.difficultyBadge.textContent=`${q.level} ・ 難易度 ${'★'.repeat(q.difficulty)}${'☆'.repeat(3-q.difficulty)}`;
  els.questionText.textContent=q.q;
  els.choices.innerHTML=''; els.explanation.classList.add('hidden'); els.explanation.innerHTML=''; els.nextBtn.classList.add('hidden');
  const letters=['A','B','C','D'];
  q.choices.forEach((c,i)=>{
    const btn=document.createElement('button'); btn.className='choice';
    btn.innerHTML=`<span class="choice-letter">${letters[i]}</span><span>${c}</span>`;
    btn.addEventListener('click',()=>answer(i)); els.choices.appendChild(btn);
  });
}
function answer(selected){
  if(state.answeredCurrent) return;
  state.answeredCurrent=true;
  const q=state.queue[state.index]; const correct=selected===q.answer;
  [...els.choices.children].forEach((b,i)=>{
    b.disabled=true;
    if(i===q.answer) b.classList.add('correct');
    else if(i===selected) b.classList.add('wrong');
  });
  const p=loadProgress();
  p.answers[q.id] ||= {attempts:0,correct:0,lastCorrect:null};
  p.answers[q.id].attempts++;
  if(correct) p.answers[q.id].correct++;
  p.answers[q.id].lastCorrect=correct; p.answers[q.id].lastAt=Date.now();
  saveProgress(p);
  state.sessionAnswers.push({id:q.id,category:q.category,correct});
  els.explanation.innerHTML=`<strong class="${correct?'good':'bad'}">${correct?'正解':'不正解'}</strong><br>${q.explanation}`;
  els.explanation.classList.remove('hidden');
  els.nextBtn.textContent= state.index===state.queue.length-1 ? '結果を見る' : '次の問題へ';
  els.nextBtn.classList.remove('hidden');
}
function next(){
  if(!state.answeredCurrent) return;
  if(state.index>=state.queue.length-1) finishSession(false);
  else { state.index++; renderQuestion(); }
}
function finishSession(timeUp){
  clearInterval(state.timer); state.timer=null;
  const total=state.queue.length;
  const answered=state.sessionAnswers.length;
  const correct=state.sessionAnswers.filter(a=>a.correct).length;
  const rate=answered?Math.round(correct/answered*100):0;
  els.resultTitle.textContent= state.mode==='exam' ? (timeUp?'模擬試験（時間切れ）':'模擬試験結果') : '学習結果';
  els.resultCorrect.textContent=correct; els.resultTotal.textContent=answered;
  els.resultRate.textContent=`正答率 ${rate}%`;
  if(state.mode==='exam') els.resultMessage.textContent = answered<total ? `40問中${answered}問まで回答。` : (rate>=70?'70%基準をクリアしました。':'70%基準まであと少しです。弱点分野を復習しましょう。');
  else els.resultMessage.textContent = rate>=80?'よくできています。次は苦手分野を重点復習しましょう。':rate>=70?'合格ライン相当です。安定して80%以上を目指しましょう。':'誤答分野を復習し、同じ概念の類題を解き直しましょう。';
  const by={};
  state.sessionAnswers.forEach(a=>{ by[a.category]||={n:0,c:0}; by[a.category].n++; if(a.correct)by[a.category].c++; });
  els.resultBreakdown.innerHTML='';
  Object.entries(by).forEach(([name,s])=>{
    const r=Math.round(s.c/s.n*100); const row=document.createElement('div'); row.className='stat-row';
    row.innerHTML=`<span class="stat-name">${name}</span><span class="stat-value">${s.c}/${s.n}（${r}%）</span><div class="bar"><span style="width:${r}%"></span></div>`;
    els.resultBreakdown.appendChild(row);
  });
  switchView('result');
}

document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>startMode(b.dataset.mode)));
els.nextBtn.addEventListener('click',next);
els.quitBtn.addEventListener('click',()=>{ if(confirm('この学習を終了してホームへ戻りますか？')){ clearInterval(state.timer); switchView('home'); renderHome(); } });
els.backHomeBtn.addEventListener('click',()=>{ switchView('home'); renderHome(); });
els.resetBtn.addEventListener('click',()=>{ if(confirm('学習履歴をすべてリセットしますか？')){ localStorage.removeItem(STORAGE_KEY); renderHome(); } });

let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; els.installBtn.classList.remove('hidden'); });
els.installBtn.addEventListener('click',async()=>{ if(!deferredPrompt)return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; els.installBtn.classList.add('hidden'); });

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
renderHome();
