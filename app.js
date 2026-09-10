(()=>{
'use strict';
const APP_NAME='JCSQE〜初級〜';
const STORAGE_KEY='jcsqe-shokyu-state-v3';
const APP_VERSION=4;
const QUESTIONS=Array.isArray(window.JCSQE_QUESTIONS)?window.JCSQE_QUESTIONS:[];
const L=window.JCSQELogic;
const qMap=new Map(QUESTIONS.map(q=>[q.id,q]));
const app=document.getElementById('app');
const toastEl=document.getElementById('toast');
const importInput=document.getElementById('import-file');
let route='home';
let currentResult=null;
let timerHandle=null;
let storagePersistent=true;
let state=loadState();


function uid(){return 'p_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function nowIso(){return new Date().toISOString()}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function safeParse(s){try{return JSON.parse(s)}catch{return null}}
function defaultState(){return {version:APP_VERSION,activeProfileId:null,profiles:{}}}
function normalizeProfile(p){return {name:String(p?.name||'ユーザー'),createdAt:p?.createdAt||nowIso(),history:Array.isArray(p?.history)?p.history:[],sessions:Array.isArray(p?.sessions)?p.sessions:[],activeSession:p?.activeSession||null}}
function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY); if(!raw)return defaultState(); const parsed=JSON.parse(raw);
    const s=defaultState(); if(parsed&&typeof parsed==='object'){
      s.activeProfileId=parsed.activeProfileId||null;
      if(parsed.profiles&&typeof parsed.profiles==='object') Object.entries(parsed.profiles).forEach(([id,p])=>s.profiles[id]=normalizeProfile(p));
      if(s.activeProfileId&&!s.profiles[s.activeProfileId])s.activeProfileId=Object.keys(s.profiles)[0]||null;
    }
    return s;
  }catch(e){console.warn('state load failed',e);storagePersistent=false;return defaultState()}
}
function saveState(silent=false){
  try{state.version=APP_VERSION;localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storagePersistent=true;return true}catch(e){console.error(e);storagePersistent=false;if(!silent)showToast('このブラウザでは学習履歴を保存できません。通常モードで開いてください。');return false}
}
function profile(){return state.activeProfileId?state.profiles[state.activeProfileId]:null}
function showToast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toastEl.classList.remove('show'),2300)}
function createProfile(name){const clean=String(name||'').trim().slice(0,30)||`ユーザー${Object.keys(state.profiles).length+1}`;const id=uid();state.profiles[id]=normalizeProfile({name:clean});state.activeProfileId=id;saveState(true);return id}
function ensureUsableProfile(){
  const ids=Object.keys(state.profiles);
  if(state.activeProfileId&&state.profiles[state.activeProfileId])return state.activeProfileId;
  if(ids.length){state.activeProfileId=ids[0];saveState(true);return ids[0];}
  return createProfile('ユーザー1');
}
function renameActiveProfile(name){const p=profile();if(!p)return false;const clean=String(name||'').trim().slice(0,30);if(!clean)return false;p.name=clean;saveState();return true}
function countdown(){const target=new Date('2026-11-14T00:00:00+09:00');const n=new Date();return Math.max(0,Math.ceil((target-n)/(86400000)))}
function streak(history){
  const days=new Set(history.map(h=>{const d=new Date(h.timestamp);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}));
  let n=0,d=new Date();d.setHours(0,0,0,0); while(true){const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(days.has(k)){n++;d.setDate(d.getDate()-1)}else break} return n;
}
function header(){const p=profile();return `<header class="topbar"><div class="topbar-row"><div class="brand"><div class="logo">Q</div><div><div class="brand-title">${APP_NAME}</div><div class="brand-sub">400 QUESTIONS / OFFLINE READY</div></div></div>${p?`<button class="profile-chip" data-action="nav" data-route="profile">${esc(p.name)}</button>`:''}</div></header>`}
function nav(active){const items=[['home','⌂','ホーム'],['practice','✦','演習'],['mock','◷','模試'],['analysis','⌁','分析'],['profile','◎','ユーザー']];return `<nav class="bottom-nav">${items.map(([r,i,t])=>`<button class="nav-btn ${active===r?'active':''}" data-action="nav" data-route="${r}"><span class="nav-icon">${i}</span><span>${t}</span></button>`).join('')}</nav>`}
function shell(content,active=route){return header()+`<main class="page">${content}</main>`+nav(active)}
function render(){
  stopTimer();
  ensureUsableProfile();
  const errors=L?.validateQuestions?L.validateQuestions(QUESTIONS):['logic unavailable'];
  if(errors.length){app.innerHTML=`<div class="fatal"><b>アプリを起動できません</b><br>問題データ検証エラー: ${esc(errors.slice(0,6).join(' / '))}</div>`;return}
  try{
    if(route==='home')renderHome(); else if(route==='practice')renderPracticeMenu(); else if(route==='mock')renderMockMenu(); else if(route==='analysis')renderAnalysis(); else if(route==='profile')renderProfile(); else if(route==='quiz')renderQuiz(); else if(route==='result')renderResult(); else {route='home';renderHome()}
  }catch(e){console.error(e);app.innerHTML=shell(`<div class="fatal"><b>画面表示中にエラーが発生しました。</b><br>${esc(e.message)}<div class="spacer12"></div><button class="primary" data-action="nav" data-route="home">ホームへ戻る</button></div>`,'home')}
}
function renderHome(){
  const p=profile(),s=L.calculateStats(QUESTIONS,p.history),days=countdown(),st=streak(p.history),daily=L.dailySeries(p.history,1)[0]; const active=p.activeSession;
  const persistenceBanner=storagePersistent?'':`<div class="card warning-card"><b>学習履歴を保存できないブラウザモードです</b><div class="tiny muted" style="margin-top:6px">通常のSafari / Chromeで開くと、次回も続きから学習できます。</div></div><div class="spacer12"></div>`;
  let resume=''; if(active){resume=`<div class="section-title">続きから</div><div class="card glow resume"><div><div class="pill ${active.kind==='mock'?'warn':'good'}">${active.kind==='mock'?'模擬試験':'演習'}</div><div class="action-title" style="margin-top:8px">${esc(active.title)}</div><div class="action-desc">${active.index+1}/${active.questionIds.length}問目から再開</div></div><button class="primary" data-action="resume-session">再開</button></div>`}
  const content=`<section class="hero"><div class="eyebrow">SMART STUDY</div><h1>今日も、合格に<br>近づく5問を。</h1><p>試験まで <b style="color:var(--text)">${days}日</b>。弱点を優先して、短時間でも効率よく進めます。</p></section>
  ${persistenceBanner}<div class="grid two"><div class="card stat"><div class="stat-value">${s.accuracy}%</div><div class="stat-label">総合正答率</div></div><div class="card stat"><div class="stat-value">${s.answered}</div><div class="stat-label">総回答数</div></div><div class="card stat"><div class="stat-value">${daily.answered}</div><div class="stat-label">今日の回答</div></div><div class="card stat"><div class="stat-value">${st}<span class="tiny">日</span></div><div class="stat-label">連続学習</div></div></div>
  ${resume}<div class="section-title">すぐ始める</div><button class="action-card" data-action="start-practice" data-mode="quick"><span class="action-icon">⚡</span><span class="action-main"><span class="action-title">今日の5問</span><span class="action-desc">未回答・誤答・苦手分野を優先</span></span><span class="chev">›</span></button><div class="spacer8"></div><button class="action-card" data-action="start-practice" data-mode="weak"><span class="action-icon">◎</span><span class="action-main"><span class="action-title">弱点集中 10問</span><span class="action-desc">正答率の低い領域を重点復習</span></span><span class="chev">›</span></button>
  <div class="section-title">本番対策</div><button class="action-card" data-action="nav" data-route="mock"><span class="action-icon">◷</span><span class="action-main"><span class="action-title">60分・40問の模擬試験</span><span class="action-desc">第1〜10回、またはランダム40問</span></span><span class="chev">›</span></button>`;
  app.innerHTML=shell(content,'home');
}
function renderPracticeMenu(){
  const p=profile(),wrong=L.wrongQuestionIds(p.history),cats=[...new Set(QUESTIONS.map(q=>q.category))].sort((a,b)=>a.localeCompare(b,'ja'));
  const content=`<section class="hero"><div class="eyebrow">PRACTICE</div><h1>演習</h1><p>通常演習は回答直後に正誤と解説を表示します。</p></section>
  <div class="grid"><button class="action-card" data-action="start-practice" data-mode="quick"><span class="action-icon">⚡</span><span class="action-main"><span class="action-title">今日の5問</span><span class="action-desc">最短で続けたいとき</span></span><span class="chev">›</span></button><button class="action-card" data-action="start-practice" data-mode="random"><span class="action-icon">↻</span><span class="action-main"><span class="action-title">ランダム10問</span><span class="action-desc">全400問からランダム</span></span><span class="chev">›</span></button><button class="action-card" data-action="start-practice" data-mode="weak"><span class="action-icon">◎</span><span class="action-main"><span class="action-title">弱点集中10問</span><span class="action-desc">学習履歴から動的に出題</span></span><span class="chev">›</span></button><button class="action-card" data-action="start-practice" data-mode="wrong" ${wrong.length?'':'disabled'}><span class="action-icon">↺</span><span class="action-main"><span class="action-title">誤答だけ復習</span><span class="action-desc">現在 ${wrong.length}問</span></span><span class="chev">›</span></button></div>
  <div class="section-title">分野別</div><div class="grid">${cats.map(c=>`<button class="action-card" data-action="start-category" data-category="${esc(c)}"><span class="action-main"><span class="action-title">${esc(c)}</span><span class="action-desc">${QUESTIONS.filter(q=>q.category===c).length}問から最大10問</span></span><span class="chev">›</span></button>`).join('')}</div>`;
  app.innerHTML=shell(content,'practice');
}
function renderMockMenu(){
  const p=profile(),active=p.activeSession&&p.activeSession.kind==='mock'?p.activeSession:null;
  const content=`<section class="hero"><div class="eyebrow">MOCK EXAM</div><h1>模擬試験</h1><p>40問・60分。回答中は正解を表示せず、終了後にまとめて採点します。</p></section>${active?`<div class="card glow resume"><div><div class="pill warn">進行中</div><div class="action-title" style="margin-top:8px">${esc(active.title)}</div><div class="action-desc">${Object.keys(active.answers||{}).length}/40問 回答済み</div></div><button class="primary" data-action="resume-session">再開</button></div><div class="spacer12"></div>`:''}
  <button class="action-card" data-action="start-mock" data-exam="random"><span class="action-icon">✣</span><span class="action-main"><span class="action-title">ランダム模試 40問</span><span class="action-desc">全400問から本番形式で出題</span></span><span class="chev">›</span></button>
  <div class="section-title">添付問題セット</div><div class="grid two">${Array.from({length:10},(_,i)=>`<button class="action-card" data-action="start-mock" data-exam="${i+1}"><span class="action-main"><span class="action-title">第${i+1}回</span><span class="action-desc">40問 / 60分</span></span><span class="chev">›</span></button>`).join('')}</div>`;
  app.innerHTML=shell(content,'mock');
}
function startPractice(mode,category){
  const p=profile(); let qs=[],title='演習';
  if(mode==='quick'){qs=L.pickWeakQuestions(QUESTIONS,p.history,5);title='今日の5問'}
  else if(mode==='weak'){qs=L.pickWeakQuestions(QUESTIONS,p.history,10);title='弱点集中10問'}
  else if(mode==='random'){qs=L.pickRandomQuestions(QUESTIONS,10);title='ランダム10問'}
  else if(mode==='wrong'){const ids=new Set(L.wrongQuestionIds(p.history));qs=L.pickRandomQuestions(QUESTIONS.filter(q=>ids.has(q.id)),Math.min(10,ids.size));title='誤答復習'}
  else if(mode==='category'){const pool=QUESTIONS.filter(q=>q.category===category);qs=L.pickRandomQuestions(pool,Math.min(10,pool.length));title=`${category} 演習`}
  if(!qs.length){showToast('出題できる問題がありません。');return}
  p.activeSession={id:'s_'+Date.now().toString(36),kind:'practice',mode,title,questionIds:qs.map(q=>q.id),index:0,answers:{},startedAt:Date.now(),updatedAt:Date.now()}; saveState();route='quiz';currentResult=null;render();
}
function startMock(exam){
  const p=profile(); let qs,title;
  if(exam==='random'){qs=L.pickRandomQuestions(QUESTIONS,40);title='ランダム模試'} else {const n=Number(exam);qs=QUESTIONS.filter(q=>q.exam===n).sort((a,b)=>a.number-b.number);title=`模擬試験 第${n}回`}
  if(qs.length!==40){showToast('模擬試験データが40問ではありません。');return}
  p.activeSession={id:'m_'+Date.now().toString(36),kind:'mock',mode:String(exam),title,questionIds:qs.map(q=>q.id),index:0,answers:{},startedAt:Date.now(),updatedAt:Date.now(),durationSec:3600};saveState();route='quiz';currentResult=null;render();
}
function renderQuiz(){
  const p=profile(),s=p.activeSession; if(!s){route='home';render();return}
  s.index=Math.max(0,Math.min(s.index||0,s.questionIds.length-1)); const q=qMap.get(s.questionIds[s.index]); if(!q){showToast('問題を読み込めません。');p.activeSession=null;saveState();route='home';render();return}
  const selected=s.answers?.[q.id]; const isMock=s.kind==='mock'; const answered=selected!==undefined;
  const choices=q.options.map((t,i)=>{let cls='choice';if(answered){if(isMock){if(selected===i)cls+=' selected'}else{if(i===q.correct)cls+=' correct';else if(selected===i)cls+=' wrong'}}return `<button class="${cls}" data-action="answer" data-index="${i}" ${(!isMock&&answered)?'disabled':''}><span class="choice-letter">${L.LETTERS[i]}</span><span class="choice-text">${esc(t)}</span></button>`}).join('');
  let feedback=''; if(!isMock&&answered){const ok=selected===q.correct;feedback=`<div class="feedback ${ok?'good':'bad'}"><div class="feedback-title">${ok?'正解':'不正解'} · 正解 ${q.correctLetter}</div>${esc(q.explanation)}</div>`}
  let jumps=''; if(isMock){jumps=`<div class="mock-grid">${s.questionIds.map((id,i)=>`<button class="qjump ${s.answers[id]!==undefined?'answered':''} ${i===s.index?'current':''}" data-action="jump-question" data-index="${i}">${i+1}</button>`).join('')}</div>`}
  const content=`<div class="quiz-head"><div class="quiz-meta"><span>${esc(s.title)}</span><span>${isMock?`残り <b id="timer">--:--</b>`:`${s.index+1}/${s.questionIds.length}`}</span></div><div class="progress"><span style="width:${((s.index+1)/s.questionIds.length)*100}%"></span></div></div>
  <div class="card question-card"><div class="q-no"><span>Q${s.index+1} · ${esc(q.category)}</span><span>${isMock?`第${q.exam}回 問${q.number}`:''}</span></div><div class="q-text">${esc(q.text)}</div><div class="choices">${choices}</div>${feedback}</div>
  ${isMock?jumps:''}<div class="quiz-actions">${isMock?`<button class="secondary" data-action="prev-question" ${s.index===0?'disabled':''}>← 前へ</button><button class="secondary" data-action="next-question" ${s.index===s.questionIds.length-1?'disabled':''}>次へ →</button>`:`<button class="secondary" data-action="quit-session">中断</button><button class="primary" data-action="next-practice" ${answered?'':'disabled'}>${s.index===s.questionIds.length-1?'結果を見る':'次の問題 →'}</button>`}</div>${isMock?`<div class="spacer12"></div><button class="danger wide" data-action="finish-mock">模擬試験を終了して採点</button>`:''}`;
  app.innerHTML=header()+`<main class="page">${content}</main>`; if(isMock)startTimer();
}
function recordPracticeAnswer(q,selected,s){
  const p=profile(); const ok=selected===q.correct; p.history.push({questionId:q.id,selected,correct:ok,timestamp:nowIso(),mode:'practice',sessionId:s.id,category:q.category,exam:q.exam});
}
function answerCurrent(index){
  const p=profile(),s=p.activeSession;if(!s)return;const q=qMap.get(s.questionIds[s.index]);if(!q)return;const i=Number(index);if(!Number.isInteger(i)||i<0||i>3)return;
  if(s.kind==='practice'&&s.answers[q.id]!==undefined)return; s.answers[q.id]=i;s.updatedAt=Date.now();if(s.kind==='practice')recordPracticeAnswer(q,i,s);saveState();render();
}
function nextPractice(){const s=profile().activeSession;if(!s)return;const qid=s.questionIds[s.index];if(s.answers[qid]===undefined){showToast('先に回答してください。');return}if(s.index>=s.questionIds.length-1){finishPractice()}else{s.index++;s.updatedAt=Date.now();saveState();render()}}
function finishPractice(){const p=profile(),s=p.activeSession;if(!s)return;const scored=L.scoreAnswers(s.questionIds,s.answers,qMap);const result={id:s.id,title:s.title,kind:'practice',finishedAt:nowIso(),correct:scored.correct,total:scored.total,accuracy:scored.accuracy,details:scored.details,categoryStats:L.sessionCategoryStats(scored.details,qMap)};p.sessions.push({...result,details:undefined,categoryStats:result.categoryStats});p.sessions=p.sessions.slice(-100);p.activeSession=null;saveState();currentResult=result;route='result';render()}
function finishMock(){
  const p=profile(),s=p.activeSession;if(!s||s.kind!=='mock')return;const scored=L.scoreAnswers(s.questionIds,s.answers,qMap);const ts=nowIso();scored.details.forEach(d=>{const q=qMap.get(d.questionId);p.history.push({questionId:d.questionId,selected:d.selected??null,correct:d.correct,timestamp:ts,mode:'mock',sessionId:s.id,category:q?.category||'',exam:q?.exam||null})});const result={id:s.id,title:s.title,kind:'mock',finishedAt:ts,correct:scored.correct,total:scored.total,accuracy:scored.accuracy,details:scored.details,categoryStats:L.sessionCategoryStats(scored.details,qMap)};p.sessions.push({...result,details:undefined,categoryStats:result.categoryStats});p.sessions=p.sessions.slice(-100);p.activeSession=null;saveState();currentResult=result;route='result';render();
}
function startTimer(){stopTimer();const s=profile()?.activeSession;if(!s||s.kind!=='mock')return;const tick=()=>{const elapsed=Math.floor((Date.now()-s.startedAt)/1000);const left=Math.max(0,(s.durationSec||3600)-elapsed);const el=document.getElementById('timer');if(el)el.textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;if(left<=0){stopTimer();finishMock()}};tick();timerHandle=setInterval(tick,1000)}
function stopTimer(){if(timerHandle){clearInterval(timerHandle);timerHandle=null}}
function renderResult(){
  const r=currentResult;if(!r){route='analysis';render();return}const wrong=r.details.filter(d=>!d.correct);const label=r.accuracy>=80?'目標達成':r.accuracy>=70?'合格ライン付近':'要復習';
  const content=`<section class="hero"><div class="eyebrow">RESULT</div><h1>${esc(r.title)}</h1><p>${esc(label)}</p></section><div class="card result-score"><div class="score-ring" style="--p:${r.accuracy}%"><div class="score-inner"><div class="score-num">${r.accuracy}%</div><div class="score-den">${r.correct}/${r.total} 正解</div></div></div><span class="pill ${r.accuracy>=80?'good':r.accuracy>=70?'warn':'bad'}">${label}</span></div>
  <div class="section-title">分野別結果</div><div class="card"><div class="bar-list">${r.categoryStats.map(s=>barRow(s.category,s.accuracy,`${s.correct}/${s.total}`)).join('')}</div></div>
  <div class="section-title">復習</div>${wrong.length?`<div class="card"><div class="weak-list">${wrong.slice(0,10).map((d,i)=>{const q=qMap.get(d.questionId);return `<div class="weak-item"><span class="rank">${i+1}</span><span><div class="weak-name">${esc(q?.category||'')}</div><div class="weak-meta">${esc(q?.text||'')}</div></span><span class="pill bad">${d.selected===undefined||d.selected===null?'未回答':L.LETTERS[d.selected]} → ${q?.correctLetter||''}</span></div>`}).join('')}</div>`:`<div class="card empty">全問正解です。</div>`}
  <div class="spacer12"></div><div class="button-row"><button class="primary" data-action="nav" data-route="analysis">分析を見る</button><button class="secondary" data-action="nav" data-route="home">ホームへ</button></div>`;
  app.innerHTML=shell(content,'analysis');
}
function barRow(label,pct,right=''){return `<div class="bar-row"><span class="bar-label" title="${esc(label)}">${esc(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(0,Math.min(100,pct))}%"></span></span><span class="bar-val">${right||pct+'%'}</span></div>`}
function lineChart(rows,key,max=100){const w=640,h=180,pad=18;const vals=rows.map(r=>Number(r[key]||0));const points=vals.map((v,i)=>`${pad+(w-2*pad)*(i/(Math.max(1,vals.length-1)))},${h-pad-(h-2*pad)*(Math.min(max,v)/max)}`).join(' ');const dots=vals.map((v,i)=>{const x=pad+(w-2*pad)*(i/(Math.max(1,vals.length-1))),y=h-pad-(h-2*pad)*(Math.min(max,v)/max);return `<circle cx="${x}" cy="${y}" r="3.2" fill="var(--cyan)"><title>${rows[i].label}: ${v}${key==='accuracy'?'%':''}</title></circle>`}).join('');return `<div class="chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="推移グラフ"><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#29405e"/><line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h-pad}" stroke="#29405e"/><polyline points="${points}" fill="none" stroke="url(#grad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="grad" x1="0" x2="1"><stop offset="0" stop-color="#55e6ff"/><stop offset="1" stop-color="#9c7cff"/></linearGradient></defs>${dots}</svg><div class="chart-labels"><span>${esc(rows[0]?.label||'')}</span><span>${esc(rows[Math.floor(rows.length/2)]?.label||'')}</span><span>${esc(rows.at(-1)?.label||'')}</span></div></div>`}
function columnChart(rows){const max=Math.max(1,...rows.map(r=>r.answered));const bars=rows.map(r=>`<div style="flex:1;min-width:8px;height:${Math.max(4,(r.answered/max)*120)}px;background:linear-gradient(180deg,var(--purple),var(--cyan));border-radius:5px 5px 2px 2px" title="${esc(r.label)}: ${r.answered}問"></div>`).join('');return `<div style="height:140px;display:flex;align-items:flex-end;gap:5px;padding:10px 4px;border-bottom:1px solid #29405e">${bars}</div><div class="chart-labels"><span>${esc(rows[0]?.label||'')}</span><span>${esc(rows[Math.floor(rows.length/2)]?.label||'')}</span><span>${esc(rows.at(-1)?.label||'')}</span></div>`}
function renderAnalysis(){
  const p=profile(),s=L.calculateStats(QUESTIONS,p.history),daily=L.dailySeries(p.history,14),cats=L.categoryStats(QUESTIONS,p.history);const weak=cats.filter(x=>x.answered>0).slice(0,5);const sessions=[...p.sessions].reverse().slice(0,8);
  const catAll=[...new Set(QUESTIONS.map(q=>q.category))].map(c=>cats.find(x=>x.category===c)||{category:c,answered:0,correct:0,accuracy:0}).sort((a,b)=>(a.answered===0)-(b.answered===0)||a.accuracy-b.accuracy);
  const content=`<section class="hero"><div class="eyebrow">ANALYTICS</div><h1>学習分析</h1><p>正答率だけでなく、学習量と苦手分野の変化を確認できます。</p></section><div class="grid two"><div class="card stat"><div class="stat-value">${s.accuracy}%</div><div class="stat-label">総合正答率</div></div><div class="card stat"><div class="stat-value">${s.uniqueAnswered}<span class="tiny">/400</span></div><div class="stat-label">触れた問題数</div></div></div>
  <div class="section-title">14日間の正答率</div><div class="card">${lineChart(daily,'accuracy',100)}</div><div class="section-title">14日間の学習量</div><div class="card">${columnChart(daily)}</div>
  <div class="section-title">弱点ランキング</div>${weak.length?`<div class="card"><div class="weak-list">${weak.map((x,i)=>`<div class="weak-item"><span class="rank">${i+1}</span><span><div class="weak-name">${esc(x.category)}</div><div class="weak-meta">${x.correct}/${x.answered} 正解</div></span><span class="pill ${x.accuracy>=80?'good':x.accuracy>=70?'warn':'bad'}">${x.accuracy}%</span></div>`).join('')}</div></div>`:`<div class="card empty">まだ学習データがありません。まず5問解いてみましょう。</div>`}
  <div class="section-title">分野別正答率</div><div class="card"><div class="bar-list">${catAll.map(x=>barRow(x.category,x.accuracy,x.answered?`${x.accuracy}%`:'未学習')).join('')}</div></div>
  <div class="section-title">最近の結果</div>${sessions.length?`<div class="grid">${sessions.map(x=>`<div class="profile-row"><div class="avatar">${x.kind==='mock'?'M':'P'}</div><div class="profile-info"><div class="profile-name">${esc(x.title)}</div><div class="profile-meta">${new Date(x.finishedAt).toLocaleString('ja-JP')} · ${x.correct}/${x.total}</div></div><span class="pill ${x.accuracy>=80?'good':x.accuracy>=70?'warn':'bad'}">${x.accuracy}%</span></div>`).join('')}</div>`:`<div class="card empty">結果はまだありません。</div>`}`;
  app.innerHTML=shell(content,'analysis');
}
function renderProfile(){
  const p=profile();const profiles=Object.entries(state.profiles);
  const storageNotice=storagePersistent?'':`<div class="card warning-card"><b>保存できないブラウザモードです</b><div class="tiny muted" style="margin-top:6px">通常のSafari / Chromeで開くと、学習履歴を端末に保存できます。</div></div>`;
  const content=`<section class="hero"><div class="eyebrow">LOCAL PROFILES</div><h1>ユーザー</h1><p>通常は設定不要です。アプリは前回使ったユーザーで自動的に再開します。複数人で同じ端末を使う場合だけ切り替えてください。</p></section>${storageNotice}
  <div class="section-title">現在のユーザー</div><div class="card"><div class="form"><label class="tiny muted" for="rename-profile-name">表示名</label><div class="inline-form"><input id="rename-profile-name" class="input" maxlength="30" value="${esc(p.name)}" aria-label="現在のユーザー名"><button class="secondary compact" data-action="rename-profile">変更</button></div><div class="tiny muted">名前は任意です。変更しなくても全機能を利用できます。</div></div></div>
  <div class="section-title">プロフィール切替</div><div class="grid">${profiles.map(([id,x])=>`<div class="profile-row"><div class="avatar">${esc(x.name.slice(0,1).toUpperCase())}</div><div class="profile-info"><div class="profile-name">${esc(x.name)}</div><div class="profile-meta">${x.history.length}回答 ${id===state.activeProfileId?'· 利用中':''}</div></div>${id===state.activeProfileId?'<span class="pill good">利用中</span>':`<button class="secondary" data-action="switch-profile" data-id="${id}">切替</button>`}</div>`).join('')}</div>
  <div class="section-title">この端末で別ユーザーを追加</div><div class="card"><div class="form"><div class="inline-form"><input id="new-profile-name" class="input" maxlength="30" placeholder="表示名（任意）"><button class="primary compact" data-action="add-profile">追加</button></div><div class="tiny muted">未入力なら「ユーザー${profiles.length+1}」として追加します。</div></div></div>
  <div class="section-title">バックアップ</div><div class="card"><div class="button-row"><button class="secondary" data-action="export-data">データを書き出す</button><button class="secondary" data-action="import-data">データを読み込む</button></div><div class="spacer8"></div><div class="tiny muted">機種変更時はJSONを書き出し、新端末で読み込んでください。サーバー同期は行いません。</div></div>
  <div class="section-title">データ管理</div><div class="card"><div class="button-row"><button class="danger" data-action="clear-history">学習履歴を初期化</button>${profiles.length>1?'<button class="danger" data-action="delete-profile">このプロフィールを削除</button>':''}</div></div>`;
  app.innerHTML=shell(content,'profile');
}

function exportData(){const p=profile();const payload={app:APP_NAME,version:APP_VERSION,exportedAt:nowIso(),profile:p};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`jcsqe-shokyu-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);showToast('学習データを書き出しました。')}
async function importData(file){try{const text=await file.text();const data=JSON.parse(text);if(!data||!data.profile||!Array.isArray(data.profile.history))throw new Error('形式が正しくありません');const id=uid();const np=normalizeProfile(data.profile);np.name=`${np.name}（復元）`.slice(0,30);np.activeSession=null;state.profiles[id]=np;state.activeProfileId=id;saveState();route='profile';render();showToast('バックアップを新しいプロフィールとして復元しました。')}catch(e){showToast(`読み込みに失敗しました: ${e.message}`)}}
function handleAction(btn){const a=btn.dataset.action;
  if(a==='nav'){route=btn.dataset.route||'home';currentResult=null;render();return}
  if(a==='start-practice'){startPractice(btn.dataset.mode);return}
  if(a==='start-category'){startPractice('category',btn.dataset.category);return}
  if(a==='start-mock'){startMock(btn.dataset.exam);return}
  if(a==='resume-session'){route='quiz';render();return}
  if(a==='answer'){answerCurrent(btn.dataset.index);return}
  if(a==='next-practice'){nextPractice();return}
  if(a==='prev-question'||a==='next-question'){const s=profile().activeSession;if(!s)return;const delta=a==='prev-question'?-1:1;s.index=Math.max(0,Math.min(s.questionIds.length-1,s.index+delta));s.updatedAt=Date.now();saveState();render();return}
  if(a==='jump-question'){const s=profile().activeSession;if(!s)return;s.index=Math.max(0,Math.min(s.questionIds.length-1,Number(btn.dataset.index)||0));s.updatedAt=Date.now();saveState();render();return}
  if(a==='finish-mock'){finishMock();return}
  if(a==='quit-session'){route='home';render();showToast('進捗を保存しました。');return}
  if(a==='rename-profile'){const input=document.getElementById('rename-profile-name');if(renameActiveProfile(input?.value)){render();showToast('表示名を変更しました。')}else showToast('表示名を入力してください。');return}
  if(a==='add-profile'){const input=document.getElementById('new-profile-name');createProfile(input?.value);route='profile';render();showToast('新しいプロフィールを作成しました。');return}
  if(a==='switch-profile'){const id=btn.dataset.id;if(state.profiles[id]){state.activeProfileId=id;saveState();route='home';currentResult=null;render();showToast('プロフィールを切り替えました。')}return}
  if(a==='export-data'){exportData();return}
  if(a==='import-data'){importInput.value='';importInput.click();return}
  if(a==='clear-history'){if(confirm('このプロフィールの学習履歴・結果・途中セッションをすべて消しますか？')){const p=profile();p.history=[];p.sessions=[];p.activeSession=null;saveState();render();showToast('学習履歴を初期化しました。')}return}
  if(a==='delete-profile'){const id=state.activeProfileId;if(Object.keys(state.profiles).length<=1)return;if(confirm('このプロフィールを削除しますか？')){delete state.profiles[id];state.activeProfileId=Object.keys(state.profiles)[0];saveState();route='home';render();showToast('プロフィールを削除しました。')}return}
}
app.addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn||btn.disabled)return;try{handleAction(btn)}catch(err){console.error(err);showToast(`操作に失敗しました: ${err.message}`)}});
app.addEventListener('keydown',e=>{if(e.key!=='Enter')return;if(e.target.id==='new-profile-name')document.querySelector('[data-action="add-profile"]')?.click();if(e.target.id==='rename-profile-name')document.querySelector('[data-action="rename-profile"]')?.click();});
importInput.addEventListener('change',()=>{const f=importInput.files?.[0];if(f)importData(f)});
window.addEventListener('error',e=>{console.error('window error',e.error||e.message)});
window.addEventListener('unhandledrejection',e=>{console.error('promise rejection',e.reason)});
if('serviceWorker'in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(e=>console.warn('SW registration failed',e)));
if(window.__JCSQE_ENABLE_TEST_HOOKS__)window.JCSQEAppTest={getState:()=>JSON.parse(JSON.stringify(state)),getRoute:()=>route,profile:()=>JSON.parse(JSON.stringify(profile())),handleAction,render,createProfile,renameActiveProfile,ensureUsableProfile,importData,exportData};
render();
})();
