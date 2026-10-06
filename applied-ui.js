/* Static UI. Shared profile storage is preserved; only appliedStudy is added. */
(() => {
'use strict';
const E = window.JCSQEApplied, B = E.bank(window.JCSQEAppliedBank), G = window.JCSQEExplanationGuide || {};
const DEMO = document.body.dataset.demo === 'true';
const KEY = DEMO ? 'jcsqe-v11-preview-state' : 'jcsqe-shokyu-state-v3';
const $ = s => document.querySelector(s), rootEl = $('#applied-app'), letters = 'ABCD';
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state, lastRaw = null, blocked = false, storageError = '', route = 'home', currentResult = null, waitingWorker = null, interval;
const params=new URLSearchParams(location.search);
const plannedDate=/^2026-(?:10|11)-\d{2}$/.test(params.get('plan')||'')?params.get('plan'):null;
const plannedRound=Number.isFinite(Number(params.get('round')))&&Number(params.get('round'))>0?Number(params.get('round')):null;
const filters = {chapter:'all',topic:'all'};
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
function header() { return `<header><div class="brand">JCSQE〜初級〜<small>v12.2 · 内容再監査済み・理解重視 · 端末内保存${DEMO?' · 確認用デモ':''}</small></div>${btn('表示切替','theme')}</header>`; }
function navigation() { return `<nav class="nav" aria-label="主なメニュー">${btn('演習を選ぶ','home')}${btn('新演習の記録','history')}${DEMO?'':`<a class="button" href="./index.html?legacy=1">以前の学習・設定</a>`}</nav>`; }
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
  const plannedDone=plannedDate&&a.sessions.some(r=>r.kind==='mock'&&r.total===40&&r.plannedDate===plannedDate);
  const plannedActive=plannedDate&&s?.kind==='mock'&&s.plannedDate===plannedDate;
  const plannedMode=st.newCount>=40?'new':'mixed';
  const plannedPanel=plannedDate?`<section class="panel planned-round"><span class="tag">学習計画</span><h2 style="margin-top:10px">${planLabel(plannedDate,plannedRound)}</h2>${plannedDone?'<p>この回は実施済みです。結果は「新演習の記録」から確認できます。</p>':plannedActive?'<p>この回は途中です。上の「同じ問題から再開」から続けてください。</p>':s?'<p>別の演習が途中です。先に再開または終了してから、この回を開始してください。</p>':`<p>予定日を過ぎていても、この回として記録して実施できます。実施日は別に保存します。</p><p>${btn('この回の40問・60分を開始','start',`data-count="40" data-mode="${plannedMode}" data-kind="mock" data-plan-date="${plannedDate}" data-plan-round="${plannedRound||''}"`,true)}</p><p class="muted">${plannedMode==='new'?'未表示問題を優先して40問出題します。':'未表示が40問未満のため、復習問題を含めて40問出題します。'}</p>`}</section>`:'';
  const chapters=B.chapters.map(x=>`<option value="${esc(x)}" ${filters.chapter===x?'selected':''}>${esc(x)}</option>`).join('');
  const topics=[...new Map(B.questions.filter(x=>filters.chapter==='all'||x.chapter===filters.chapter).map(q=>[q.topicKey,q.topic])).entries()];
  return `<section class="hero"><div class="eyebrow">READ · REASON · DISTINGUISH</div><h1>消去法ではなく、<br><em>根拠で選ぶ。</em></h1><p class="muted">4択を同じ論点の中で比較し、問題文の条件を理解しないと切り分けにくい構成です。</p></section>
  ${DEMO?'<div class="notice">このファイルは動作確認用です。公開サイトの履歴とは別に保存します。GitHubへは未反映です。</div>':''}
  ${plannedPanel}
  ${s?`<section class="panel"><h2>途中の演習</h2><p>${s.kind==='mock'?'40問・時間制限つき':'事例演習'}　${s.index+1}/${s.questionIds.length}問目</p>${s.kind==='mock'?'<p class="muted">中断中も60分の時計は進みます。</p>':''}<div class="row">${btn('同じ問題から再開','resume','',true)}${btn('ここまでで終了・採点','finish-early')}</div></section>`:''}
  <div class="metrics">${metric(st.newCount,'このブラウザで未表示')}${metric(st.dueTopics,'復習期日のテーマ')}${metric(st.answered+'/'+st.total,'回答した問題')}</div>
  <section class="panel"><h2>いま解く</h2><div class="grid">${[3,5,10].map(n=>`<button class="start-card ${n===5?'primary':''}" data-act="start" data-count="${n}" data-mode="smart"><strong>${n}問</strong><span>${n===3?'短い空き時間':n===5?'判断を積み重ねる':'じっくり取り組む'}</span></button>`).join('')}</div>
  <div class="row" style="margin-top:12px">${btn('日を空けた復習','start','data-count="5" data-mode="due"')}${btn('未表示だけ10問','start','data-count="10" data-mode="new"')}</div>
  <p class="muted">同テーマの連続を抑え、未表示と復習期日の問題を優先します。選択肢は同じ論点内の近い考え方を中心に構成しています。選択肢をタップして回答します。曖昧さは、同じ概念を別問題で複数回解いた正誤の安定性で確認します。</p></section>
  <section class="panel"><h2>絞り込んで考える</h2><div class="filter-grid"><label>分野<select id="chapter"><option value="all">すべて</option>${chapters}</select></label><label>テーマ<select id="topic"><option value="all">すべて</option>${topics.map(([id,label])=>`<option value="${id}" ${filters.topic===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label></div>
  <div class="row">${btn('この条件で10問','start','data-count="10" data-mode="smart"',true)}${btn('弱点の別事例','start','data-count="5" data-mode="wrong"')}${btn('保存した問題','start','data-count="10" data-mode="bookmarks"')}</div><p class="muted">問題が少ない条件では、重複で水増しせず実際の問数を表示します。同日中の再確認は、遅延確認と分けて記録します。</p></section>
  <section class="panel"><h2>40問・60分の総合演習</h2><p>終了するまで正解・解説は出しません。回答を後から変更できます。</p><div class="grid two">${btn('未表示40問で開始','start','data-count="40" data-mode="new" data-kind="mock"',true)}${btn('復習を含む40問','start','data-count="40" data-mode="mixed" data-kind="mock"')}</div><p class="muted">初見40問は未表示が40問以上あるときだけ開始します。64問を使い回して「独立した模試10回分」とは数えません。外で既に見た問題かは判別できません。</p></section>
  <section class="panel"><h2>「正解」を分けて見る</h2><div class="metrics">${metric(ratio(st.first),'このブラウザで初回')}${metric(ratio(st.repeat),'再表示・再回答')}${metric(ratio(st.delayed),'別事例・2日以上後')}</div><p class="muted">64問・32テーマの理解重視版です。v11までの得点はv12の初回成績へ混ぜません。公式問題と同一難易度や合格を保証するものではありません。</p></section>`;
}
function feedback(q, selected, order, confidence) {
  const letter=letters[order.indexOf(q.correct)];
  const selectedLabel=Number.isInteger(selected)?`${letters[order.indexOf(selected)]}. ${q.options[selected]}`:'分からない／未回答';
  const status=selected===q.correct?'正解':'ここを確認';
  const guide=G[q.topicKey]||{};
  const selectedWrong=Number.isInteger(selected)&&selected!==q.correct;
  const calc=q.calculation?`<div class="explain-step calculation"><h3>計算で確かめる</h3><p><code>${esc(q.calculation.expression)}</code> ＝ <b>${esc(q.calculation.value)}${esc(q.calculation.unit||'')}</b></p><p>この値だけ暗記せず、どの数を分子・分母に置いたか、何回で平均したか、単位がそろっているかを確認します。</p></div>`:'';
  const selectedAnalysis=selectedWrong?`<div class="explain-step selected-choice-analysis"><h3>あなたの選択肢が誤りになる決定的理由</h3>
    <p class="choice-quote"><b>${esc(q.options[selected])}</b></p>
    ${guide.trap?`<p><b>なぜ迷いやすいか：</b>${esc(guide.trap)}</p>`:''}
    <p><b>この問題では成立しない理由：</b>${esc(q.reasons[selected])}</p>
    <p><b>正解との直接比較：</b>正解は「${esc(q.options[q.correct])}」。${esc(q.reasons[q.correct])}</p>
    ${guide.rule?`<p><b>境界線：</b>${esc(guide.rule)}</p>`:''}
    </div>`:
    confidence==='unknown'||!Number.isInteger(selected)?`<div class="explain-step selected-choice-analysis"><h3>迷ったときの判断基準</h3><p>${esc(guide.rule||q.distinction||q.brief)}</p></div>`:'';
  const steps=Array.isArray(guide.steps)&&guide.steps.length?`<ol class="decision-steps">${guide.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:'';
  return `<section class="panel feedback ${selected===q.correct?'':'incorrect'}" tabindex="-1" aria-live="polite"><h2>${status}</h2><p class="result-answer">正解：<b>${letter}. ${esc(q.options[q.correct])}</b><br>あなたの回答：${esc(selectedLabel)}</p><div class="brief"><b>まず覚えるポイント</b><p>${esc(q.brief)}</p></div>
  <details class="deep"><summary>${selected===q.correct?'詳細な解説を見る':'詳細な解説を見る（推奨）'}</summary><div class="body">
  ${selectedAnalysis}
  <div class="explain-step judgement-rule"><h3>1. まず使う判定基準</h3><p>${esc(guide.rule||q.distinction||q.brief)}</p>${steps}</div>
  <div class="explain-step"><h3>2. この問題文へ当てはめる</h3><p>${esc(q.detail)}</p></div>
  ${calc}
  ${q.distinction?`<div class="explain-step distinction"><h3>3. 似た概念との境界</h3><p>${esc(q.distinction)}</p></div>`:''}
  <div class="explain-step"><h3>4. 4択を同じ基準で検証</h3>${order.map((n,i)=>`<div class="reason ${n===q.correct?'reason-correct':'reason-wrong'} ${n===selected?'reason-selected':''}"><div class="reason-head"><b>${letters[i]}. ${esc(q.options[n])}</b><span class="verdict">${n===q.correct?'○ 正解':'× 誤り'}</span></div><p><b>${n===q.correct?'成立する理由':'成立しない理由'}：</b>${esc(q.reasons[n])}</p>${n!==q.correct&&guide.rule?`<p class="muted"><b>正しく選ぶには：</b>この選択肢の文言ではなく、問題文が「${esc(guide.rule)}」のどちら側かを確認します。</p>`:''}</div>`).join('')}</div>
  <div class="explain-step exam-check"><h3>5. 納得できたかの確認</h3><p>正解記号を覚えるのではなく、<b>「なぜ自分の選択肢ではなく正解なのか」</b>を問題文の条件を使って説明できるか確認してください。説明できなければ、この問題は正解しても定着扱いにしません。</p></div>
  <p class="muted">${esc(q.topic)} / 公式シラバス項目 ${esc(q.syllabus)} / 項目の知識レベル ${esc(q.level)}。独自問題であり、公式問題と同一難易度を保証するものではありません。</p><p class="reference"><a href="${esc(q.source)}" target="_blank" rel="noopener noreferrer">公式シラバス（範囲の参照）</a></p>${(q.references||[]).filter(r=>String(r.url).startsWith('https://')).map(r=>`<p class="reference"><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.label)}</a></p>`).join('')}</div></details></section>`;
}
function quiz() {
  const v=E.view(p()); if (!v) {route='home';return home();}
  const s=E.active(p()), bookmarked=E.profile(p()).bookmarks.includes(v.question.id);
  return `<div class="quiz-top"><div><span class="tag">${esc(v.question.chapter)}</span><p class="muted">${v.index+1}/${v.total}問　${v.question.id}</p></div>${s.kind==='mock'?'<strong id="exam-timer" class="timer" role="timer"></strong>':''}${btn('中断','pause')}</div>
  <progress max="${v.total}" value="${v.index+1}" aria-label="演習の進捗"></progress>
  ${s.warning&&v.index===0?`<div class="notice">${esc(s.warning)}</div>`:''}
  <section class="panel"><div class="row" style="justify-content:flex-end">${btn(bookmarked?'★ 保存済み':'☆ あとで復習','bookmark',`aria-pressed="${bookmarked}"`)}</div>
  <h1 class="question">${esc(v.question.text)}</h1><p class="muted">選択肢をタップして回答してください。曖昧さは自己申告ではなく、別問題で同じ概念を繰り返し確認した結果から判断します。</p>
  <div class="options" role="group" aria-label="選択肢">${v.options.map(o=>`<div class="option-row single"><button class="option ${o.selected?'chosen':''} ${v.revealed&&o.correct?'right':''} ${v.revealed&&o.selected&&!o.correct?'wrong':''}" data-act="answer" data-choice="${o.original}" ${v.revealed?'disabled':''} aria-pressed="${o.selected}"><span class="letter">${letters[o.display]}</span><span>${esc(o.text)}</span></button></div>`).join('')}</div>
  ${v.revealed?'':btn('分からない','unknown')} ${s.kind==='mock'&&Object.hasOwn(s.answers,v.question.id)?`<span class="tag">回答保存済み</span>`:''}
  </section>${v.revealed?feedback(v.feedback,v.selected,s.orders[v.question.id],v.confidence):''}
  ${s.kind==='practice'?v.revealed?`<button class="primary full" data-act="next">${v.index+1===v.total?'結果を見る':'次の問題へ'}</button>`:'':`<div class="row">${btn('前へ','previous',v.index?'':'disabled')}${btn(v.index+1===v.total?'終了前に確認':'次へ','next','',true)}</div><div class="jump">${s.questionIds.map((id,i)=>`<button class="${s.index===i?'current':''} ${Object.hasOwn(s.answers,id)?'answered':''}" data-act="jump" data-index="${i}" aria-label="問${i+1}${Object.hasOwn(s.answers,id)?' 回答済み':' 未回答'}">${i+1}</button>`).join('')}</div>${btn('終了して採点','finish-early')}`}`;
}
function result() {
  const r=currentResult||E.profile(p()).sessions.at(-1);
  if (!r) return '<div class="empty">終了した演習はまだありません。</div>';
  return `<section class="hero"><div class="eyebrow">RESULT · 次に使える理解へ</div><div class="result-title">${r.correct}<small> / ${r.total}</small></div>${r.plannedDate?`<p><span class="tag">${planLabel(r.plannedDate,r.plannedRound)}</span>として実施</p>`:''}<p>${r.accuracy}% · ${r.kind==='mock'?'経過時間':'回答時間の累計'} ${Math.floor(r.elapsedSec/60)}分${r.elapsedSec%60}秒</p><p class="muted">初回表示 ${r.details.filter(d=>d.firstExposure).length}問／再表示・再回答 ${r.details.filter(d=>d.observed!==false&&!d.firstExposure).length}問／未表示・未回答 ${r.details.filter(d=>d.observed===false).length}問／不明 ${r.details.filter(d=>d.observed!==false&&d.confidence==='unknown').length}問。正答率だけで定着・合格とは判定しません。</p></section><div class="row">${btn('結果をコピー','copy','',true)}${btn('JSON保存','export')}${btn('演習を選ぶ','home')}</div>
  ${r.details.map((d,i)=>`<details class="result-item" data-review-id="${esc(d.questionId)}"><summary><span class="history-summary"><span>${d.correct?'○':'×'} 問${i+1} ${esc(r.questions[d.questionId].topic)}</span><small>${d.confidence==='unknown'?'?':''}</small></span></summary><div class="body"><p class="question" style="font-size:15px">${esc(r.questions[d.questionId].text)}</p>${feedback(r.questions[d.questionId],d.selected,d.order,d.confidence)}</div></details>`).join('')}`;
}
function history() {
  const a=E.profile(p()), st=E.stats(B,p()), topics=E.topicStatus(B,p());
  return `<section class="hero"><h1>新演習の記録</h1><p class="muted">以前の問題・プロフィールはそのまま残しています。新しい事例問題の履歴は区別して保存します。</p></section><section class="panel"><label>プロフィール<select id="profile" class="profile-select">${Object.entries(state.profiles).map(([id,v])=>`<option value="${esc(id)}" ${id===state.activeProfileId?'selected':''}>${esc(v.name||'ユーザー')}</option>`).join('')}</select></label><div class="row" style="margin-top:14px">${btn('このプロフィールをJSON保存','export')}${btn('最新結果をコピー','copy')}</div></section>
  <div class="metrics">${metric(ratio(st.first),'初回表示の正解')}${metric(ratio(st.repeat),'再表示・再回答の正解')}${metric(ratio(st.delayed),'別事例・日を空けた正解')}</div>
  <section class="panel"><h2>復習の予定</h2><p class="muted">誤答・迷いは2日後、確信ありの正解は7日後を目安に別事例を優先します。正解が続いても全範囲の習得認定にはしません。</p><div class="table-wrap"><table><thead><tr><th>テーマ</th><th>最新の状態</th><th>次回目安</th></tr></thead><tbody>${[...topics.values()].filter(t=>t.last).map(t=>`<tr><td>${esc(B.questions.find(q=>q.topicKey===t.key).topic)}</td><td>${t.weak?'再確認が必要':t.confirmedAcrossCases?'別事例で遅延正解':'正解・継続確認'}</td><td>${new Date(t.dueAt+9*3600000).toISOString().slice(5,10)}</td></tr>`).join('')||'<tr><td colspan="3">まだ回答がありません。</td></tr>'}</tbody></table></div></section>
  <section class="panel"><h2>終了した演習</h2>${a.sessions.slice().reverse().map(r=>`<p>${btn(`${new Date(r.finishedAt+9*3600000).toISOString().slice(0,10)}　${r.plannedDate?planLabel(r.plannedDate,r.plannedRound)+'　':''}${r.correct}/${r.total}　${r.kind==='mock'?'60分演習':'通常演習'}`,'open-result',`data-id="${esc(r.id)}"`)}</p>`).join('')||'<p class="muted">まだありません。</p>'}</section>`;
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
  if (act==='start') {
    if (E.active(p())) {toast('途中の演習を再開するか、終了・採点してから始めてください。');return;}
    const kind=el.dataset.kind||'practice';
    if (kind==='mock'&&!confirm('40問・60分。途中の正解表示なし、中断中も時計は進みます。開始しますか？')) return;
    const opt={count:Number(el.dataset.count),mode:el.dataset.mode,kind,...(kind==='mock'?{}:filters)};
    const started=E.createSession(B,p(),opt); if(!started.session){toast(started.warning);return;}
    if(el.dataset.planDate){started.session.plannedDate=el.dataset.planDate;started.session.plannedRound=Number(el.dataset.planRound)||null;}
    save();navigate('quiz');return;
  }
  if (act==='resume'){if(expire()){render();return;}E.resume(p());save();navigate('quiz');return;}
  if (act==='pause'){E.pause(p());save();navigate('home');return;}
  if (act==='answer'||act==='unknown') {
    if(expire()){render();return;}
    if (!E.answer(p(),act==='unknown'?null:Number(el.dataset.choice),act==='unknown'?'unknown':'sure')) return;
    save();render();const f=$('.feedback');f?.focus({preventScroll:true});f?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return;
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
