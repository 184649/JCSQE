
(()=> {
'use strict';
const Q = window.JCSQE_QUESTIONS || [];
const APP_KEY='jcsqe_dojo_v2';
const state={page:'home', profileId:null, session:null, timer:null, modal:null};

const uid=()=> crypto.randomUUID ? crypto.randomUUID() : 'p'+Date.now()+Math.random().toString(36).slice(2);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const today=()=>new Date().toISOString().slice(0,10);
const fmtPct=n=>Number.isFinite(n)?Math.round(n)+'%':'—';
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const storage={
  load(){try{return JSON.parse(localStorage.getItem(APP_KEY))||null}catch{return null}},
  save(v){localStorage.setItem(APP_KEY,JSON.stringify(v))}
};
function defaultDB(){
  const id=uid();
  return {version:2,activeProfile:id,profiles:{[id]:{id,name:'ゲスト',createdAt:new Date().toISOString(),dailyGoal:10,attempts:[],examResults:[]}}};
}
let db=storage.load()||defaultDB();
if(!db.profiles||!Object.keys(db.profiles).length) db=defaultDB();
state.profileId=db.activeProfile&&db.profiles[db.activeProfile]?db.activeProfile:Object.keys(db.profiles)[0];
db.activeProfile=state.profileId; storage.save(db);

const p=()=>db.profiles[state.profileId];
const save=()=>{db.activeProfile=state.profileId;storage.save(db)};
const byId=id=>Q.find(q=>q.id===id);

function attemptStats(profile=p()){
  const a=profile.attempts||[], correct=a.filter(x=>x.correct).length;
  return {total:a.length,correct,accuracy:a.length?correct/a.length*100:NaN};
}
function questionStats(id,profile=p()){
  const a=(profile.attempts||[]).filter(x=>x.qid===id);
  return {attempts:a.length,correct:a.filter(x=>x.correct).length,last:a[a.length-1]};
}
function wrongQuestionIds(profile=p()){
  const map=new Map();
  (profile.attempts||[]).forEach(a=>map.set(a.qid,a));
  return [...map.entries()].filter(([,a])=>!a.correct).map(([id])=>id);
}
function categoryStats(profile=p()){
  const m={};
  (profile.attempts||[]).forEach(a=>{
    const q=byId(a.qid); if(!q)return;
    const k=q.category; m[k]??={total:0,correct:0};m[k].total++;if(a.correct)m[k].correct++;
  });
  return Object.entries(m).map(([category,v])=>({category,...v,accuracy:v.correct/v.total*100})).sort((a,b)=>a.accuracy-b.accuracy||b.total-a.total);
}
function dayStats(days=14,profile=p()){
  const dates=[]; const now=new Date(); now.setHours(0,0,0,0);
  for(let i=days-1;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);dates.push(d.toISOString().slice(0,10))}
  return dates.map(date=>{
    const arr=(profile.attempts||[]).filter(a=>a.date.slice(0,10)===date);
    return {date,total:arr.length,correct:arr.filter(a=>a.correct).length,accuracy:arr.length?arr.filter(a=>a.correct).length/arr.length*100:null};
  });
}
function weakWeight(q){
  const s=questionStats(q.id);
  if(!s.attempts)return 3.0;
  const miss=(s.attempts-s.correct)/s.attempts;
  const lastWrong=s.last&&!s.last.correct?1.8:0;
  const age=s.last?Math.min(1.5,(Date.now()-new Date(s.last.date))/86400000/7):1;
  return .7+miss*5+lastWrong+age;
}
function weightedSample(pool,n){
  pool=[...pool]; const out=[];
  while(pool.length&&out.length<n){
    const weights=pool.map(weakWeight), sum=weights.reduce((a,b)=>a+b,0);
    let r=Math.random()*sum, idx=0;
    for(;idx<pool.length;idx++){r-=weights[idx];if(r<=0)break}
    out.push(pool.splice(Math.min(idx,pool.length-1),1)[0]);
  } return out;
}
function todayAnswered(){
  return (p().attempts||[]).filter(a=>a.date.slice(0,10)===today()).length;
}
function streak(){
  const set=new Set((p().attempts||[]).map(a=>a.date.slice(0,10))); let n=0; const d=new Date(); d.setHours(0,0,0,0);
  while(set.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}
  return n;
}
function daysToExam(){
  const target=new Date('2026-11-14T00:00:00+09:00'); const now=new Date();
  return Math.max(0,Math.ceil((target-now)/86400000));
}
function shell(content,active=state.page){
  return `<div class="app-shell">
    <div class="topbar"><div class="brand">JCSQE <span>DOJO</span></div>
      <button class="profile-chip" data-action="profiles"><span class="avatar">${esc(p().name.slice(0,1).toUpperCase())}</span>${esc(p().name)}</button>
    </div>
    ${content}
    <nav class="bottom-nav">
      ${nav('home','⌂','ホーム',active)}${nav('study','◫','学習',active)}${nav('analysis','⌁','分析',active)}${nav('settings','⚙','設定',active)}
    </nav>
    ${state.modal||''}
  </div>`;
}
function nav(page,icon,label,active){return `<button class="nav-btn ${active===page?'active':''}" data-page="${page}"><span>${icon}</span>${label}</button>`}

function home(){
  const st=attemptStats(), daily=todayAnswered(), goal=p().dailyGoal||10, cs=categoryStats(), weakest=cs[0];
  const content=`<section class="hero"><div class="eyebrow">Adaptive JCSQE Training</div><h1>今日も、<br>合格に近づく。</h1>
    <p class="sub">400問の模擬問題から、あなたの履歴に合わせて出題します。試験まであと <b>${daysToExam()}</b> 日。</p></section>
    <div class="grid two stats">
      ${stat('今日',`${daily}/${goal}`,'問',Math.min(100,daily/goal*100))}
      ${stat('総合正答率',fmtPct(st.accuracy),'',st.accuracy||0)}
      ${stat('連続学習',streak(),'日',Math.min(100,streak()*10))}
      ${stat('解答数',st.total,'問',Math.min(100,st.total/400*100))}
    </div>
    <div class="section-title">すぐ始める</div>
    <div class="action-grid">
      <button class="action primary" data-start="weak10"><span class="icon">⚡</span><strong>弱点優先 10問</strong><small>苦手・未学習を自動選択</small></button>
      <button class="action" data-start="quick5"><span class="icon">◉</span><strong>5問だけ</strong><small>移動中の数分に</small></button>
      <button class="action" data-start="mistakes"><span class="icon">↺</span><strong>間違い復習</strong><small>${wrongQuestionIds().length}問が復習対象</small></button>
      <button class="action" data-page="study"><span class="icon">▦</span><strong>模擬試験</strong><small>第1〜10回・40問60分</small></button>
    </div>
    <div class="section-title">いまの弱点</div>
    <div class="card">${weakest?`<div class="eyebrow">Lowest accuracy</div><div style="font-size:24px;font-weight:900;margin:8px 0">${esc(weakest.category)}</div><div class="sub">正答率 ${fmtPct(weakest.accuracy)} ・ ${weakest.total}回答</div>`:`<div class="empty">問題を解くと、ここに弱点が表示されます。</div>`}</div>`;
  return shell(content,'home');
}
function stat(label,value,unit,progress){
  return `<div class="card stat"><div class="label">${label}</div><div class="value">${value}<span style="font-size:14px;margin-left:4px">${unit}</span></div><div class="bar-bg"><div class="bar-fg" style="width:${Math.max(0,Math.min(100,progress||0))}%"></div></div></div>`;
}
function study(){
  const cats=[...new Set(Q.map(q=>q.category))].sort();
  const exams=Array.from({length:10},(_,i)=>i+1);
  const content=`<section class="hero"><div class="eyebrow">Practice</div><h1>学習モード</h1><p class="sub">短時間演習、弱点復習、分野別、模擬試験を選べます。</p></section>
    <div class="section-title">クイック演習</div>
    <div class="action-grid">
      <button class="action primary" data-start="weak10"><span class="icon">⚡</span><strong>弱点優先10問</strong><small>履歴から出題を最適化</small></button>
      <button class="action" data-start="random10"><span class="icon">⤨</span><strong>ランダム10問</strong><small>全400問からランダム</small></button>
      <button class="action" data-start="mistakes"><span class="icon">↺</span><strong>間違い復習</strong><small>直近で誤答した問題</small></button>
      <button class="action" data-start="allweak"><span class="icon">◇</span><strong>苦手集中</strong><small>正答率の低い問題を20問</small></button>
    </div>
    <div class="section-title">模擬試験</div><div class="exam-grid">
      ${exams.map(n=>{const rs=(p().examResults||[]).filter(r=>r.exam===n);const last=rs[rs.length-1];return `<button class="exam-btn" data-exam="${n}"><strong>第${n}回</strong><small>${last?`前回 ${last.score}/40`:'40問・60分'}</small></button>`}).join('')}
    </div>
    <div class="section-title">分野別</div>
    <div class="pill-row">${cats.map(c=>`<button class="pill" data-category="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="note">問題・選択肢・正解・解説は、添付された「JCSQE初級 模擬試験 第1〜10回」の内容を問題バンクとして使用しています。</div>`;
  return shell(content,'study');
}
function analysis(){
  const st=attemptStats(), days=dayStats(14), cats=categoryStats();
  const recent=days.filter(d=>d.total>0);
  const examResults=(p().examResults||[]).slice(-8);
  const trendSvg=lineChart(days);
  const max=Math.max(1,...days.map(d=>d.total));
  const content=`<section class="hero"><div class="eyebrow">Analytics</div><h1>学習分析</h1><p class="sub">正答率の推移と苦手分野を可視化します。</p></section>
    <div class="grid two stats">${stat('総合正答率',fmtPct(st.accuracy),'',st.accuracy||0)}${stat('累計解答',st.total,'問',Math.min(100,st.total/400*100))}</div>
    <div class="section-title">14日間の正答率</div><div class="card chart-card"><div class="chart-title">Accuracy trend</div><div class="chart-sub">回答した日の正答率</div>${trendSvg}</div>
    <div class="section-title">14日間の学習量</div><div class="card chart-card"><div class="chart-title">Daily activity</div><div class="heat">${days.map(d=>`<div class="${d.total===0?'':d.total<5?'l1':d.total<10?'l2':d.total<20?'l3':'l4'}" title="${d.date}: ${d.total}問"></div>`).join('')}</div><div class="chart-sub" style="margin-top:10px">濃いほど多く解答しています。</div></div>
    <div class="section-title">分野別正答率</div><div class="card"><div class="bar-list">
      ${cats.length?cats.map(c=>`<div class="bar-row"><div class="bar-meta"><span>${esc(c.category)}</span><span>${fmtPct(c.accuracy)} · ${c.total}問</span></div><div class="bar-bg"><div class="bar-fg" style="width:${c.accuracy}%"></div></div></div>`).join(''):'<div class="empty">まだ分析できる回答履歴がありません。</div>'}
    </div></div>
    <div class="section-title">模擬試験履歴</div><div class="card"><div class="list">
      ${examResults.length?examResults.map(r=>`<div class="list-item"><div><b>第${r.exam}回</b><small>${new Date(r.date).toLocaleString('ja-JP')}</small></div><div><b>${r.score}/40</b><small>${Math.round(r.score/40*100)}%</small></div></div>`).join(''):'<div class="empty">模擬試験を受けると履歴が表示されます。</div>'}
    </div></div>`;
  return shell(content,'analysis');
}
function lineChart(days){
  const vals=days.map(d=>d.accuracy);
  const pts=[]; const W=320,H=150,pad=14;
  vals.forEach((v,i)=>{if(v!=null){const x=pad+(W-pad*2)*(i/(days.length-1));const y=H-pad-(H-pad*2)*(v/100);pts.push([x,y])}});
  if(!pts.length)return `<div class="empty">回答するとグラフが表示されます。</div>`;
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="正答率推移"><line class="axis" x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}"/><line class="axis" x1="${pad}" y1="${pad}" x2="${pad}" y2="${H-pad}"/><path class="trend-line" d="${d}"/>${pts.map(([x,y])=>`<circle class="trend-dot" cx="${x}" cy="${y}" r="3"/>`).join('')}</svg>`;
}
function settings(){
  const content=`<section class="hero"><div class="eyebrow">Local first</div><h1>設定</h1><p class="sub">学習データはこの端末のブラウザ内だけに保存されます。サーバー送信はありません。</p></section>
    <div class="card">
      <div class="field"><label>プロフィール名</label><input id="profileName" value="${esc(p().name)}" maxlength="24"></div>
      <div class="field"><label>1日の目標問題数</label><select id="dailyGoal">${[5,10,15,20,30,40].map(n=>`<option value="${n}" ${p().dailyGoal===n?'selected':''}>${n}問</option>`).join('')}</select></div>
      <div class="btn-row"><button class="btn primary-btn" data-action="saveSettings">保存</button><button class="btn" data-action="profiles">プロフィール切替</button></div>
    </div>
    <div class="section-title">データ管理</div>
    <div class="card"><p class="sub">機種変更や別ブラウザへ移す場合は、プロフィールデータを書き出して読み込めます。</p>
      <div class="btn-row"><button class="btn" data-action="export">書き出す</button><label class="btn" style="cursor:pointer">読み込む<input id="importFile" type="file" accept="application/json" hidden></label><button class="btn danger" data-action="resetProfile">履歴をリセット</button></div>
    </div>
    <div class="section-title">このアプリについて</div><div class="card"><div class="list">
      <div class="list-item"><div><b>問題バンク</b><small>添付模擬試験 第1〜10回</small></div><b>400問</b></div>
      <div class="list-item"><div><b>保存先</b><small>localStorage / 端末内</small></div><b>サーバーなし</b></div>
      <div class="list-item"><div><b>オフライン</b><small>PWAキャッシュ</small></div><b>対応</b></div>
    </div></div>`;
  return shell(content,'settings');
}

function startSession(type,extra){
  let list=[], title='', exam=null, timed=false;
  if(type==='quick5'){list=weightedSample(Q,5);title='5問だけ'}
  if(type==='weak10'){list=weightedSample(Q,10);title='弱点優先10問'}
  if(type==='random10'){list=shuffle(Q).slice(0,10);title='ランダム10問'}
  if(type==='allweak'){list=weightedSample(Q,20);title='苦手集中20問'}
  if(type==='mistakes'){const ids=wrongQuestionIds();list=shuffle(ids.map(byId).filter(Boolean));title='間違い復習';if(!list.length){alert('現在、復習対象の誤答はありません。');return}}
  if(type==='category'){list=shuffle(Q.filter(q=>q.category===extra)).slice(0,Math.min(20,Q.filter(q=>q.category===extra).length));title=extra+' 分野'}
  if(type==='exam'){exam=Number(extra);list=Q.filter(q=>q.exam===exam).sort((a,b)=>a.number-b.number);title=`模擬試験 第${exam}回`;timed=true}
  state.session={type,title,exam,timed,list,index:0,answers:{},startedAt:new Date().toISOString(),remaining:timed?3600:null,submitted:false};
  state.page='quiz'; startTimer(); render();
}
function startTimer(){clearInterval(state.timer);if(!state.session?.timed)return;state.timer=setInterval(()=>{if(!state.session)return;state.session.remaining--;if(state.session.remaining<=0){clearInterval(state.timer);finishSession(true)}else updateTimer()},1000)}
function updateTimer(){const el=document.querySelector('.timer');if(el&&state.session){const s=state.session.remaining;el.textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}}
function quiz(){
  const s=state.session;if(!s)return home();
  const q=s.list[s.index], ans=s.answers[q.id], progress=(s.index+1)/s.list.length*100;
  const locked=ans&&ans.locked;
  const opts='ABCD'.map(letter=>{
    let cls='option';
    if(ans?.selected===letter)cls+=' selected';
    if(locked&&letter===q.answer)cls+=' correct';
    if(locked&&ans.selected===letter&&letter!==q.answer)cls+=' wrong';
    return `<button class="${cls}" data-answer="${letter}" ${locked?'disabled':''}><span class="letter">${letter}</span><span>${esc(q.options[letter])}</span></button>`
  }).join('');
  const feedback=locked?`<div class="feedback ${ans.correct?'good':'bad'}"><b>${ans.correct?'正解':'不正解'}：${q.answer}</b><br>${esc(q.explanation)}</div>`:'';
  const nextLabel=s.index===s.list.length-1?'結果を見る':'次の問題';
  return shell(`<div class="q-head"><button class="btn" data-action="quitQuiz">← 終了</button><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><div class="timer">${s.timed?`${String(Math.floor(s.remaining/60)).padStart(2,'0')}:${String(s.remaining%60).padStart(2,'0')}`:`${s.index+1}/${s.list.length}`}</div></div>
    <div class="card question-card"><span class="category">${esc(q.category)} · ${q.exam}回 問${q.number}</span><div class="question">${esc(q.question)}</div>${opts}${feedback}
      ${locked?`<div class="btn-row"><button class="btn primary-btn" data-action="nextQuestion">${nextLabel}</button></div>`:''}
    </div>`,'study');
}
function chooseAnswer(letter){
  const s=state.session,q=s.list[s.index]; if(s.answers[q.id]?.locked)return;
  const correct=letter===q.answer;
  s.answers[q.id]={selected:letter,correct,locked:true};
  p().attempts.push({qid:q.id,selected:letter,correct,date:new Date().toISOString(),session:s.type});
  save(); render();
}
function nextQuestion(){const s=state.session;if(s.index>=s.list.length-1)finishSession(false);else{s.index++;render()}}
function finishSession(timedOut){
  clearInterval(state.timer); const s=state.session;if(!s)return;
  const answered=Object.values(s.answers),score=answered.filter(a=>a.correct).length;
  const total=s.list.length;
  if(s.exam){
    p().examResults.push({exam:s.exam,score,total,date:new Date().toISOString(),timedOut:!!timedOut,duration:3600-(s.remaining??0)});
    save();
  }
  state.sessionResult={title:s.title,score,total,timedOut,exam:s.exam};
  state.session=null;state.page='result';render();
}
function result(){
  const r=state.sessionResult, pct=r.total?Math.round(r.score/r.total*100):0;
  return shell(`<section class="hero"><div class="eyebrow">Session complete</div><h1>${esc(r.title)}</h1></section>
    <div class="card"><div class="sub">${r.timedOut?'時間切れ':'おつかれさまでした'}</div><div class="result-score ${pct>=80?'good':'bad'}">${r.score}/${r.total}</div><div class="sub">正答率 ${pct}%</div><div class="bar-bg"><div class="bar-fg" style="width:${pct}%"></div></div>
      <div class="btn-row"><button class="btn primary-btn" data-page="analysis">分析を見る</button><button class="btn" data-page="home">ホームへ</button></div>
    </div>`,'analysis');
}
function profilesModal(){
  const items=Object.values(db.profiles).map(x=>`<div class="list-item"><div><b>${esc(x.name)}</b><small>${x.id===state.profileId?'使用中':'端末内プロフィール'}</small></div><div class="btn-row" style="margin:0"><button class="btn" data-switch="${x.id}">選択</button>${Object.keys(db.profiles).length>1?`<button class="btn danger" data-delete-profile="${x.id}">削除</button>`:''}</div></div>`).join('');
  state.modal=`<div class="modal-backdrop" data-action="closeModal"><div class="modal" onclick="event.stopPropagation()"><div class="section-title" style="margin-top:0">プロフィール</div><div class="list">${items}</div><div class="field"><label>新しいプロフィール</label><input id="newProfileName" placeholder="名前を入力" maxlength="24"></div><div class="btn-row"><button class="btn primary-btn" data-action="createProfile">作成</button><button class="btn" data-action="closeModal">閉じる</button></div></div></div>`;render();
}
function createProfile(){
  const input=document.getElementById('newProfileName');const name=input?.value.trim();if(!name)return;
  const id=uid();db.profiles[id]={id,name,createdAt:new Date().toISOString(),dailyGoal:10,attempts:[],examResults:[]};state.profileId=id;save();state.modal=null;render();
}
function exportProfile(){
  const blob=new Blob([JSON.stringify({format:'jcsqe-dojo-profile-v2',profile:p()},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`jcsqe-dojo-${p().name}-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function importProfile(file){
  const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);const prof=data.profile||data;if(!prof||!Array.isArray(prof.attempts))throw new Error();
    const id=uid();db.profiles[id]={...prof,id,name:(prof.name||'インポート')+'（読込）'};state.profileId=id;save();alert('プロフィールを読み込みました。');render()}catch{alert('読み込めないデータです。')}};r.readAsText(file);
}
function render(){
  let htmlOut=state.page==='home'?home():state.page==='study'?study():state.page==='analysis'?analysis():state.page==='settings'?settings():state.page==='quiz'?quiz():state.page==='result'?result():home();
  document.getElementById('app').innerHTML=htmlOut; updateTimer();
}
document.addEventListener('click',e=>{
  const page=e.target.closest('[data-page]')?.dataset.page;if(page){clearInterval(state.timer);state.page=page;state.modal=null;render();return}
  const start=e.target.closest('[data-start]')?.dataset.start;if(start){startSession(start);return}
  const exam=e.target.closest('[data-exam]')?.dataset.exam;if(exam){startSession('exam',exam);return}
  const cat=e.target.closest('[data-category]')?.dataset.category;if(cat){startSession('category',cat);return}
  const ans=e.target.closest('[data-answer]')?.dataset.answer;if(ans){chooseAnswer(ans);return}
  const sw=e.target.closest('[data-switch]')?.dataset.switch;if(sw){state.profileId=sw;save();state.modal=null;render();return}
  const del=e.target.closest('[data-delete-profile]')?.dataset.deleteProfile;if(del){if(confirm('このプロフィールと学習履歴を削除しますか？')){delete db.profiles[del];if(state.profileId===del)state.profileId=Object.keys(db.profiles)[0];save();state.modal=null;render()}return}
  const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='profiles')profilesModal();
  if(action==='closeModal'){state.modal=null;render()}
  if(action==='createProfile')createProfile();
  if(action==='nextQuestion')nextQuestion();
  if(action==='quitQuiz'){if(confirm('現在の学習を終了しますか？')){clearInterval(state.timer);state.session=null;state.page='home';render()}}
  if(action==='saveSettings'){p().name=document.getElementById('profileName').value.trim()||p().name;p().dailyGoal=Number(document.getElementById('dailyGoal').value);save();alert('保存しました。');render()}
  if(action==='export')exportProfile();
  if(action==='resetProfile'){if(confirm('このプロフィールの学習履歴をすべてリセットしますか？')){p().attempts=[];p().examResults=[];save();render()}}
});
document.addEventListener('change',e=>{if(e.target.id==='importFile'&&e.target.files[0])importProfile(e.target.files[0])});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
})();
