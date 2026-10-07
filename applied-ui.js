/* Static UI. Shared profile storage is preserved; only appliedStudy is added. */
(() => {
'use strict';
const E = window.JCSQEApplied, B = E.bank(window.JCSQEAppliedBank), G = window.JCSQEExplanationGuide || {}, T = window.JCSQETextbook || null;
const DEMO = document.body.dataset.demo === 'true';
const KEY = DEMO ? 'jcsqe-v11-preview-state' : 'jcsqe-shokyu-state-v3';
const $ = s => document.querySelector(s), rootEl = $('#applied-app'), letters = 'ABCD';
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state, lastRaw = null, blocked = false, storageError = '', route = 'home', currentResult = null, waitingWorker = null, interval;
const params=new URLSearchParams(location.search);
const plannedDate=/^2026-(?:10|11)-\d{2}$/.test(params.get('plan')||'')?params.get('plan'):null;
const plannedRound=Number.isFinite(Number(params.get('round')))&&Number(params.get('round'))>0?Number(params.get('round')):null;
const filters = {mode:'smart',chapter:'all',topic:'all'};
const btn = (label, action, extra='', primary=false) => `<button data-act="${action}" ${extra} class="${primary?'primary':''}">${label}</button>`;
function toast(s) { const el=$('#applied-toast'); el.textContent=s; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),4500); }
function p() { return state.profiles[state.activeProfileId]; }
function safeObject(x) {
  if (Array.isArray(x)) return x.map(safeObject);
  if (x && typeof x==='object') return Object.fromEntries(Object.entries(x).filter(([k])=>!['__proto__','constructor','prototype'].includes(k)).map(([k,v])=>[k,safeObject(v)]));
  return x;
}
function load() {
  let raw;
  try { raw=localStorage.getItem(KEY); lastRaw=raw; }
  catch { blocked=true; storageError='保存領域を利用できません。この画面内で試せますが、閉じる前にJSONを書き出してください。'; }
  if (raw) {
    const parsed=safeObject(JSON.parse(raw));
    if (!parsed || !parsed.profiles || Array.isArray(parsed.profiles) || typeof parsed.profiles!=='object') throw Error('既存の保存形式を確認できません。');
    state=parsed;
    if (!state.profiles[state.activeProfileId]) state.activeProfileId=Object.keys(state.profiles)[0];
  }
  if (!state || !state.activeProfileId) {
    const id='p_'+Date.now(); state={version:7,activeProfileId:id,profiles:{[id]:{name:'ユーザー1',history:[],sessions:[],bookmarks:[],exposures:{},activeSession:null}}};
  }
  E.profile(p()); document.documentElement.dataset.theme=state.theme||'dark';
}
function save() {
  if (blocked) return false;
  try {
    const remote=localStorage.getItem(KEY);
    if (remote!==lastRaw) { blocked=true; storageError='別のタブで履歴が更新されました。上書きを止めています。現在のJSONを保存し、再読み込みしてください。'; return false; }
    state.updatedAt=Date.now(); state.version=7;
    const next=JSON.stringify(state); localStorage.setItem(KEY,next); lastRaw=next; return true;
  } catch { blocked=true; storageError='端末への保存に失敗しました。履歴はこの画面にあります。JSONを書き出して保管してください。'; return false; }
}
function header() { return `<header><div class="brand">JCSQE〜初級〜<small>v15.3 · スマホ最適化 · 教科書解説つき${DEMO?' · 確認用デモ':''}</small></div>${btn('表示切替','theme','aria-label="ライト／ダーク表示を切り替え"')}</header>`; }
function navigation() { return `<nav class="nav" aria-label="主なメニュー">${btn('連続演習','home')}${btn('学習記録','history')}${DEMO?'':`<a class="button" href="./index.html?legacy=1">以前の学習・設定</a>`}</nav>`; }
function metric(n,label) {return `<div class="metric"><strong>${esc(n)}</strong><span>${esc(label)}</span></div>`;}
function ratio(x) {return x.total?`${x.correct}/${x.total}`:'—';}
function planLabel(date,round){if(!date)return'';const [,m,d]=date.split('-');return `${Number(m)}/${Number(d)} 第${round||'?'}回`;}
function finishCurrent(){
  const s=E.active(p()),meta=s?{plannedDate:s.plannedDate||null,plannedRound:s.plannedRound||null}:null;
  const r=E.finish(p());
  if(r&&meta?.plannedDate){r.plannedDate=meta.plannedDate;r.plannedRound=meta.plannedRound;}
  return r;
}
function home() {
  const st=E.stats(B,p()),s=E.active(p()),a=E.profile(p());
  const practiceActive=s?.kind==='practice'&&s?.continuous===true, legacyPractice=s?.kind==='practice'&&s?.continuous!==true, legacyMock=s?.kind==='mock';
  const chapters=B.chapters.map(x=>`<option value="${esc(x)}" ${filters.chapter===x?'selected':''}>${esc(x)}</option>`).join('');
  const topics=[...new Map(B.questions.filter(x=>filters.chapter==='all'||x.chapter===filters.chapter).map(q=>[q.topicKey,q.topic])).entries()];
  const coverage=st.total?Math.round(st.answered/st.total*1000)/10:0;
  const labels={smart:'おすすめ（自動）',new:'未回答のみ',wrong:'弱点のある概念',due:'復習時期',bookmarks:'保存した問題'};const modeLabel=labels[practiceActive?s.mode:filters.mode]||'おすすめ（自動）';
  return `<section class="hero"><div class="eyebrow">JCSQE PRACTICE DOJO</div><h1>JCSQE<br><em>演習道場</em></h1><p class="muted">過去問道場の使い方を参考に、出題範囲を決めたら問題数を選ばず、そのまま連続で解き続ける作りです。</p></section>
  ${DEMO?'<div class="notice">このファイルは動作確認用です。公開サイトの履歴とは別に保存します。</div>':''}
  ${practiceActive?`<section class="panel"><span class="tag">続きから再開</span><h2 style="margin-top:10px">連続演習を続ける</h2><p>${s.questionIds.filter(id=>s.committed[id]).length}問回答済み・設定：${esc(modeLabel)}</p><p class="muted">中断位置と回答履歴は自動保存されています。</p><p>${btn('続きから再開','resume','',true)}</p></section>`:legacyPractice?`<section class="panel"><span class="tag">旧演習の途中データ</span><h2 style="margin-top:10px">以前の通常演習があります</h2><div class="row">${btn('再開','resume','',true)}${btn('終了して採点','finish-early')}</div></section>`:legacyMock?`<section class="panel"><span class="tag">旧演習の途中データ</span><h2 style="margin-top:10px">以前の40問演習があります</h2><div class="row">${btn('再開','resume','',true)}${btn('終了して採点','finish-early')}</div></section>`:''}
  <section class="panel"><h2>出題設定</h2>
    <div class="filter-grid">
      <label>出題対象<select id="practice-mode">
        <option value="smart" ${filters.mode==='smart'?'selected':''}>おすすめ（未回答・弱点・復習時期を自動優先）</option>
        <option value="new" ${filters.mode==='new'?'selected':''}>未回答のみ</option>
        <option value="wrong" ${filters.mode==='wrong'?'selected':''}>弱点のある概念</option>
        <option value="due" ${filters.mode==='due'?'selected':''}>復習時期の問題</option>
        <option value="bookmarks" ${filters.mode==='bookmarks'?'selected':''}>保存した問題</option>
      </select></label>
      <label>分野<select id="chapter"><option value="all">全分野</option>${chapters}</select></label>
      <label>テーマ<select id="topic"><option value="all">全テーマ</option>${topics.map(([id,label])=>`<option value="${esc(id)}" ${filters.topic===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label>
    </div>
    <p class="muted">出題順はランダム化しつつ、同じ問題は一巡するまで重ねません。選択肢の位置もシャッフルします。</p>
    <p>${s?'':btn('出題開始','start-continuous','',true)}</p>
  </section>
  <section class="metrics">${metric(st.answered+'/'+st.total,'網羅度 '+coverage+'%')}${metric(st.weakTopics,'弱点の概念')}${metric(st.dueTopics,'復習時期')}${metric(st.confirmedAcrossCases,'別事例で定着確認')}</section>
  <section class="panel"><h2>学習履歴</h2><p>回答は1問ごとに自動保存します。未回答・弱点・復習時期を履歴から判断し、次の出題へ反映します。</p><p>${btn('学習記録を見る','history')}</p></section>
  <section class="panel"><h2>本番校正</h2><p>本番形式だけは実試験に合わせて40問・60分です。通常の連続演習とは別に実施します。</p><p><a class="button primary" href="./benchmark.html">本番校正ダッシュボード →</a></p></section>`;
}
function textbookExplanation(q, selected, order){
  if(!T)return '';
  const l=T.lesson(q),targetTerms=l.targets.map(x=>x.term),related=l.related||[];
  const conceptRows=related.map(x=>`<tr class="${targetTerms.includes(x.term)?'target-row':''}"><td><b>${esc(x.term)}</b><br><small>${esc(x.level)} / ${esc(x.syllabus)}</small></td><td>${esc(x.definition)}</td></tr>`).join('');
  const optionRows=order.map((n,i)=>{
    const notes=T.optionNote(q,n).filter(Boolean);
    return `<div class="textbook-option ${n===q.correct?'correct':'wrong'} ${n===selected?'selected':''}"><div class="reason-head"><b>${letters[i]}. ${esc(q.options[n])}</b><span class="verdict">${n===q.correct?'○ 正解':'× 誤り'}</span></div>${notes.map((x,j)=>`<p>${j===0?'<b>判定理由：</b>':''}${esc(x)}</p>`).join('')}</div>`;
  }).join('');
  const targets=l.targets.length?l.targets.map(x=>`<li><b>${esc(x.term)}</b>：${esc(x.definition)}</li>`).join(''):`<li><b>${esc(q.family||q.chapter)}</b>の目的・判断基準を理解する。</li>`;
  return `<details class="deep textbook-deep" open><summary>教科書解説</summary><div class="body textbook-body">
    <div class="textbook-title"><span>TEXTBOOK</span><h3>${esc(q.family||q.chapter)}｜この1問から周辺知識まで理解する</h3></div>
    <section class="textbook-section"><h4>1. まず、この分野を理解する</h4><p>${esc(l.chapter.overview)}</p><p>${esc(l.family.overview)}</p></section>
    <section class="textbook-section"><h4>2. このテーマの定義</h4><ul class="textbook-definition">${targets}</ul><p><b>比較するときの軸：</b>${esc(l.family.compare||l.chapter.axis)}</p></section>
    <section class="textbook-section"><h4>3. 問題文をどう読むか</h4><p><b>${esc(l.type.title)}</b></p><ol class="decision-steps">${l.type.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="textbook-tip"><b>試験での注意：</b>${esc(l.type.tip)} ${esc(l.chapter.exam||'')}</p></section>
    <section class="textbook-section"><h4>4. 今回の問題へ当てはめる</h4><p><b>決め手：</b>${esc(q.brief)}</p><p>${esc(q.detail)}</p></section>
    <section class="textbook-section"><h4>5. 似た概念を表で整理する</h4><div class="table-wrap"><table class="textbook-table"><thead><tr><th>用語</th><th>意味・使う場面</th></tr></thead><tbody>${conceptRows}</tbody></table></div></section>
    <section class="textbook-section"><h4>6. 4択を1つずつ検証する</h4>${optionRows}</section>
    <section class="textbook-section"><h4>7. よくある取り違え</h4><p>${esc(l.family.trap||l.chapter.exam)}</p></section>
    <section class="textbook-section textbook-summary"><h4>8. この問題から持ち帰ること</h4><p>正解記号ではなく、<b>「何を対象に、何のために使う概念か」</b>を説明できる状態にする。次に同じテーマが別事例で出ても、定義と比較軸から判断する。</p><p class="muted">公式シラバス項目 ${esc(l.syllabus)} / ${esc(l.level)}。この解説は公式シラバスを範囲基準にした学習用テキストで、公式問題の解説そのものではありません。</p><p><a href="${esc(l.source)}" target="_blank" rel="noopener noreferrer">公式シラバス Ver.3.0 を確認</a></p></section>
  </div></details>`;
}
function feedback(q, selected, order, confidence) {
  const letter=letters[order.indexOf(q.correct)];
  const selectedLabel=Number.isInteger(selected)?`${letters[order.indexOf(selected)]}. ${q.options[selected]}`:'分からない／未回答';
  const status=selected===q.correct?'正解':'ここを確認';
  return `<section class="panel feedback ${selected===q.correct?'':'incorrect'}" tabindex="-1" aria-live="polite"><h2>${status}</h2><p class="result-answer">正解：<b>${letter}. ${esc(q.options[q.correct])}</b><br>あなたの回答：${esc(selectedLabel)}</p>
  <div class="brief"><b>この問題の結論</b><p>${esc(q.brief)}</p></div>
  ${textbookExplanation(q,selected,order)}
  </section>`;
}
function quiz() {
  const v=E.view(p()); if (!v) {route='home';return home();}
  const s=E.active(p()), bookmarked=E.profile(p()).bookmarks.includes(v.question.id), isPractice=s.kind==='practice', continuous=isPractice&&s.continuous===true;
  const answeredTotal=E.profile(p()).history.filter(h=>h.observed!==false&&h.kind==='practice').length;
  return `<div class="quiz-top"><div><span class="tag">${continuous?'連続演習':esc(v.question.chapter)}</span><p class="muted">${continuous?`累計 ${answeredTotal+(v.revealed?0:1)}問目`:`${v.index+1}/${v.total}問　${v.question.id}`}</p></div>${s.kind==='mock'?'<strong id="exam-timer" class="timer" role="timer"></strong>':''}${btn('中断','pause')}</div>
  ${continuous?'':`<progress max="${v.total}" value="${v.index+1}" aria-label="演習の進捗"></progress>`}
  <section class="panel"><div class="row" style="justify-content:flex-end">${btn(bookmarked?'★ 保存済み':'☆ あとで復習','bookmark',`aria-pressed="${bookmarked}"`)}</div>
  <h1 class="question">${esc(v.question.text)}</h1><p class="muted">選択肢をタップして回答してください。解説を確認したら次の問題へ進みます。</p>
  <div class="options" role="group" aria-label="選択肢">${v.options.map(o=>`<div class="option-row single"><button class="option ${o.selected?'chosen':''} ${v.revealed&&o.correct?'right':''} ${v.revealed&&o.selected&&!o.correct?'wrong':''}" data-act="answer" data-choice="${o.original}" ${v.revealed?'disabled':''} aria-pressed="${o.selected}"><span class="letter">${letters[o.display]}</span><span>${esc(o.text)}</span></button></div>`).join('')}</div>
  ${v.revealed?'':btn('分からない','unknown')} ${s.kind==='mock'&&Object.hasOwn(s.answers,v.question.id)?`<span class="tag">回答保存済み</span>`:''}
  </section>${v.revealed?feedback(v.feedback,v.selected,s.orders[v.question.id],v.confidence):''}
  ${isPractice?v.revealed?(continuous?`<button class="primary full" data-act="continuous-next">次の問題へ</button>`:`<button class="primary full" data-act="next">${v.index+1===v.total?'結果を見る':'次の問題へ'}</button>`):'':`<div class="row">${btn('前へ','previous',v.index?'':'disabled')}${btn(v.index+1===v.total?'終了前に確認':'次へ','next','',true)}</div><div class="jump">${s.questionIds.map((id,i)=>`<button class="${s.index===i?'current':''} ${Object.hasOwn(s.answers,id)?'answered':''}" data-act="jump" data-index="${i}" aria-label="問${i+1}${Object.hasOwn(s.answers,id)?' 回答済み':' 未回答'}">${i+1}</button>`).join('')}</div>${btn('終了して採点','finish-early')}`}`;
}
function result() {
  const r=currentResult||E.profile(p()).sessions.at(-1);
  if (!r) return '<div class="empty">終了した演習はまだありません。</div>';
  return `<section class="hero"><div class="eyebrow">RESULT · 次に使える理解へ</div><div class="result-title">${r.correct}<small> / ${r.total}</small></div>${r.plannedDate?`<p><span class="tag">${planLabel(r.plannedDate,r.plannedRound)}</span>として実施</p>`:''}<p>${r.accuracy}% · ${r.kind==='mock'?'経過時間':'回答時間の累計'} ${Math.floor(r.elapsedSec/60)}分${r.elapsedSec%60}秒</p><p class="muted">初回表示 ${r.details.filter(d=>d.firstExposure).length}問／再表示・再回答 ${r.details.filter(d=>d.observed!==false&&!d.firstExposure).length}問／未表示・未回答 ${r.details.filter(d=>d.observed===false).length}問／不明 ${r.details.filter(d=>d.observed!==false&&d.confidence==='unknown').length}問。正答率だけで定着・合格とは判定しません。</p></section><div class="row">${btn('結果をコピー','copy','',true)}${btn('JSON保存','export')}${btn('演習を選ぶ','home')}</div>
  ${r.details.map((d,i)=>`<details class="result-item" data-review-id="${esc(d.questionId)}"><summary><span class="history-summary"><span>${d.correct?'○':'×'} 問${i+1} ${esc(r.questions[d.questionId].topic)}</span><small>${d.confidence==='unknown'?'?':''}</small></span></summary><div class="body"><p class="question" style="font-size:15px">${esc(r.questions[d.questionId].text)}</p>${feedback(r.questions[d.questionId],d.selected,d.order,d.confidence)}</div></details>`).join('')}`;
}
function history() {
  const a=E.profile(p()), st=E.stats(B,p()), topics=E.topicStatus(B,p()), valid=a.history.filter(h=>B.byId.has(h.questionId)&&h.observed!==false);
  const attempts=new Map();
  for(const h of valid){const x=attempts.get(h.topicKey)||{total:0,correct:0};x.total++;if(h.correct)x.correct++;attempts.set(h.topicKey,x);}
  const coverage=st.total?Math.round(st.answered/st.total*1000)/10:0;
  const rows=[...topics.values()].filter(t=>t.last).sort((x,y)=>(y.weak-x.weak)||((attempts.get(y.key)?.total||0)-(attempts.get(x.key)?.total||0)));
  return `<section class="hero"><h1>学習履歴・達成度</h1><p class="muted">過去問道場の達成度表示を参考に、網羅度と同じ概念を何回解いて安定したかを分けて見ます。</p></section>
  <div class="metrics">${metric(st.answered+'/'+st.total,'網羅度 '+coverage+'%')}${metric(st.weakTopics,'要復習の概念')}${metric(st.confirmedAcrossCases,'別事例で定着確認')}${metric(ratio(st.delayed),'2日以上空けた正解')}</div>
  <section class="panel"><h2>理解の安定性</h2><p class="muted">△自己申告は使いません。1回正解しただけでは「安定」とせず、別問題・日を空けた正解を積み上げます。</p>
  <div class="table-wrap"><table><thead><tr><th>テーマ</th><th>回答</th><th>正解</th><th>状態</th></tr></thead><tbody>${rows.map(t=>{const q=B.questions.find(q=>q.topicKey===t.key),x=attempts.get(t.key)||{total:0,correct:0};const status=t.weak?'要復習':t.confirmedAcrossCases?'安定確認':'再確認中';return`<tr><td>${esc(q?.topic||t.key)}</td><td>${x.total}回</td><td>${x.correct}/${x.total}</td><td><span class="tag">${status}</span></td></tr>`;}).join('')||'<tr><td colspan="4">まだ回答がありません。</td></tr>'}</tbody></table></div></section>
  <section class="panel"><h2>復習タイミング</h2><p>誤答は早めに、正解した概念も日を空けて別問題で確認します。</p><div class="table-wrap"><table><thead><tr><th>テーマ</th><th>最新</th><th>次回目安</th></tr></thead><tbody>${rows.slice(0,40).map(t=>{const q=B.questions.find(q=>q.topicKey===t.key);return`<tr><td>${esc(q?.topic||t.key)}</td><td>${t.weak?'要復習':'正解'}</td><td>${t.dueAt?new Date(t.dueAt+9*3600000).toISOString().slice(5,10):'—'}</td></tr>`;}).join('')||'<tr><td colspan="3">まだ回答がありません。</td></tr>'}</tbody></table></div></section>
  <section class="panel"><label>プロフィール<select id="profile" class="profile-select">${Object.entries(state.profiles).map(([id,v])=>`<option value="${esc(id)}" ${id===state.activeProfileId?'selected':''}>${esc(v.name||'ユーザー')}</option>`).join('')}</select></label><div class="row" style="margin-top:14px">${btn('このプロフィールをJSON保存','export')}${btn('最新結果をコピー','copy')}</div></section>`;
}
function expire() {
  const s=E.active(p());
  if (s?.kind==='mock' && Date.now()-s.startedAt>=s.durationMs) {
    currentResult=finishCurrent();save();route='result';toast('60分になったため採点しました。');return true;
  }
  return false;
}
function render() {
  clearInterval(interval); expire();
  const view=({home,quiz,result,history})[route]||home;
  rootEl.innerHTML=header()+`<main>${storageError?`<div class="notice error">${esc(storageError)}<p>${btn('現在のJSONを保存','export')}${btn('再読み込み','reload')}</p></div>`:''}${waitingWorker?`<div class="notice">更新版があります。${btn('保存して更新','update')}</div>`:''}${view()}</main>`+navigation();
  if (route==='quiz'&&E.active(p())?.kind==='mock') {
    const tick=()=>{if(expire()){render();return;}const s=E.active(p());const el=$('#exam-timer');if(s&&el){const seconds=Math.max(0,Math.ceil((s.durationMs-(Date.now()-s.startedAt))/1000));el.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}};tick();interval=setInterval(tick,1000);
  }
}
function navigate(r) {route=r;render();window.scrollTo(0,0);}
function exportData() {
  const payload={app:'JCSQE〜初級〜',version:7,exportedAt:new Date().toISOString(),profile:p()};
  download('jcsqe-v11-profile.json',JSON.stringify(payload,null,2));
}
function download(name,text) {const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function copyText(text) {try{await navigator.clipboard.writeText(text);toast('コピーしました。');}catch{const d=$('#applied-copy');d.querySelector('textarea').value=text;d.showModal();d.querySelector('textarea').select();}}
async function handle(el) {
  const act=el.dataset.act;
  if (['home','history'].includes(act)) {if(route==='quiz')E.pause(p());save();navigate(act);return;}
  if (act==='start-continuous') {
    if (E.active(p())) {toast('途中の演習があります。続きから再開してください。');return;}
    const started=E.createSession(B,p(),{count:1,mode:filters.mode,kind:'practice',continuous:true,chapter:filters.chapter,topic:filters.topic});
    if(!started.session){toast(started.warning||'出題できる問題がありません。');return;}
    save();navigate('quiz');return;
  }
  if (act==='start') {
    if (E.active(p())) {toast('途中の演習を再開するか、終了してから始めてください。');return;}
    const kind=el.dataset.kind||'practice';
    if (kind==='mock'&&!confirm('40問・60分。途中の正解表示なし、中断中も時計は進みます。開始しますか？')) return;
    const opt={count:Number(el.dataset.count)||1,mode:el.dataset.mode||'smart',kind,...(kind==='mock'?{}:filters)};
    const started=E.createSession(B,p(),opt); if(!started.session){toast(started.warning);return;}
    save();navigate('quiz');return;
  }
  if (act==='resume'){if(expire()){render();return;}E.resume(p());save();navigate('quiz');return;}
  if (act==='pause'){E.pause(p());save();navigate('home');return;}
  if (act==='answer'||act==='unknown') {
    if(expire()){render();return;}
    if (!E.answer(p(),act==='unknown'?null:Number(el.dataset.choice),act==='unknown'?'unknown':'sure')) return;
    save();render();const f=$('.feedback');f?.focus({preventScroll:true});f?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return;
  }
  if (act==='continuous-next') {
    const next=E.continuePractice(B,p());
    if(!next.session){toast(next.warning||'次の問題を作成できませんでした。');return;}
    save();render();window.scrollTo(0,0);return;
  }
  if (act==='next'||act==='previous'||act==='jump') {
    const s=E.active(p()); if(!s)return;
    let index=act==='next'?s.index+1:act==='previous'?s.index-1:Number(el.dataset.index);
    if(index>=s.questionIds.length){if(s.kind==='mock'&&!confirm('終了して採点しますか？未回答は不正解として扱います。'))return;currentResult=finishCurrent();save();navigate('result');return;}
    E.go(p(),index);save();render();window.scrollTo(0,0);return;
  }
  if (act==='finish-early') {const s=E.active(p());if(!s)return;if(!confirm('ここまでで終了しますか？未回答も不正解として記録します。途中データを勝手に別問題へ置き換えません。'))return;currentResult=finishCurrent();save();navigate('result');return;}
  if (act==='bookmark'){const q=E.current(p()).q;if(q){E.bookmark(p(),q.id);save();render();}return;}
  if(act==='open-result'){currentResult=E.profile(p()).sessions.find(r=>r.id===el.dataset.id);navigate('result');return;}
  if(act==='copy'){await copyText(E.resultText(p(),route==='result'?currentResult:null));return;}
  if(act==='export'){exportData();return;}
  if(act==='theme'){state.theme=state.theme==='light'?'dark':'light';document.documentElement.dataset.theme=state.theme;save();render();return;}
  if(act==='reload'){location.reload();return;}
  if(act==='update'){if(save())waitingWorker?.postMessage({type:'SKIP_WAITING'});else render();}
}
rootEl.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el||el.disabled)return;e.preventDefault();Promise.resolve(handle(el)).catch(error=>{console.error(error);toast(error.message||'操作を確認できませんでした。');});});
rootEl.addEventListener('change',e=>{
  if(e.target.id==='practice-mode'){filters.mode=e.target.value;render();}
  if(e.target.id==='chapter'){filters.chapter=e.target.value;filters.topic='all';render();}
  if(e.target.id==='topic'){filters.topic=e.target.value;}
  if(e.target.id==='profile'){if(route==='quiz')E.pause(p());state.activeProfileId=e.target.value;E.profile(p());currentResult=null;save();render();}
});
// Seeing a previously unshown answer in results must not remain 'new'.
rootEl.addEventListener('toggle', e => {
  const id=e.target.dataset?.reviewId;
  if (!id || !e.target.open || route!=='result') return;
  const r=currentResult||E.profile(p()).sessions.at(-1);
  if (!r?.questions[id]) return;
  const a=E.profile(p());
  if (!Object.hasOwn(a.exposures,id)) { a.exposures[id]=Date.now(); save(); }
}, true);
$('#close-copy').addEventListener('click',()=>$('#applied-copy').close());
// Events may be queued while navigating or restoring a cached document.
// Compare the live value, not an obsolete event payload, while keeping real conflicts blocked.
window.addEventListener('storage', e => {
  if (e.key !== KEY && e.key !== null) return;
  try { if (localStorage.getItem(KEY) === lastRaw) return; }
  catch { blocked=true;storageError='保存領域を確認できません。現在のJSONを保存してから再読み込みしてください。';render();return; }
  blocked=true;
  storageError='別のタブで保存内容が更新されました。現在の内容をJSON保存し、再読み込みしてから続けてください。';
  render();
});
window.addEventListener('pagehide',()=>{try{E.pause(p());save();}catch{}});
try {load();save();render();}
catch(e) {
  blocked=true;
  rootEl.innerHTML=`<main><h1>保存データの確認が必要です</h1><p>${esc(e.message)}</p><p>既存データは上書きしていません。</p><button id="raw-backup">元のJSONを書き出す</button></main>`;
  $('#raw-backup')?.addEventListener('click',()=>download('jcsqe-original-backup.json',lastRaw||''));
}
if(!DEMO&&'serviceWorker'in navigator&&location.protocol!=='file:'){
  let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloading){reloading=true;location.reload();}});
  navigator.serviceWorker.register('./sw.js').then(reg=>{const ready=()=>{if(reg.waiting){waitingWorker=reg.waiting;if(route!=='quiz')render();}};ready();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',ready));}).catch(()=>toast('オフライン準備は未完了です。通信中は学習できます。'));
}
})();
