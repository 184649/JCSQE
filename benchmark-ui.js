/* v15 benchmark UI */
(() => {
'use strict';
const E=window.JCSQEBenchmark,B=E.bank(window.JCSQEBenchmarkBank),T=window.JCSQETextbook||null,KEY='jcsqe-shokyu-state-v3';
const root=document.getElementById('benchmark-app'),toastEl=document.getElementById('benchmark-toast'),letters='ABCD';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state,lastRaw=null,route='home',selectedResult=null,timer=null;
const params=new URLSearchParams(location.search),plannedForm=Number(params.get('form'))||null,plannedDate=params.get('plan')||null;
function toast(t){toastEl.textContent=t;toastEl.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>toastEl.classList.remove('show'),3500);}
function safe(x){if(Array.isArray(x))return x.map(safe);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>!['__proto__','constructor','prototype'].includes(k)).map(([k,v])=>[k,safe(v)]));return x;}
function load(){const raw=localStorage.getItem(KEY);lastRaw=raw;if(raw){state=safe(JSON.parse(raw));}if(!state?.profiles){const id='p_'+Date.now();state={version:7,activeProfileId:id,profiles:{[id]:{name:'ユーザー1',history:[],sessions:[],bookmarks:[],exposures:{}}}};}if(!state.profiles[state.activeProfileId])state.activeProfileId=Object.keys(state.profiles)[0];E.state(p());}
function save(){const remote=localStorage.getItem(KEY);if(remote!==lastRaw){toast('別タブで履歴が更新されました。再読み込みしてください。');return false;}state.updatedAt=Date.now();const next=JSON.stringify(state);localStorage.setItem(KEY,next);lastRaw=next;return true;}
function p(){return state.profiles[state.activeProfileId];}
function button(label,act,extra='',primary=false){return `<button data-act="${act}" ${extra} class="${primary?'primary':''}">${label}</button>`;}
function metric(n,label){return `<div class="progress-stat"><strong>${esc(n)}</strong><span>${esc(label)}</span></div>`;}
function badge(n,label,done){return `<span class="milestone ${done?'on':''}">${done?'✓':'○'} ${esc(label)}</span>`;}
function active(){return E.active(p());}
function profileName(){return p().name||'ユーザー';}
function scoreStrip(list){if(!list.length)return '<p class="muted">本番校正演習の初回結果はまだありません。</p>';return `<div class="score-strip">${list.map(x=>`<div class="score-bar"><i style="height:${Math.max(8,x.correct/40*90)}px"></i><b>${x.correct}/40</b><small>第${x.form}回</small></div>`).join('')}</div>`;}
function chapterRows(ch){const keys=['品質の概念','品質マネジメント','品質技術','専門品質','新領域'];return keys.map(k=>{const x=ch[k];return `<tr><td>${k}</td><td>${x?x.correct+'/'+x.total:'—'}</td><td>${x?x.accuracy+'%':'—'}</td></tr>`;}).join('');}
function home(){
 const r=E.readiness(p()),a=E.accumulation(p()),first=E.firstSessions(p()),st=E.state(p()),next=r.nextForm;
 const last3ok=r.last3.length===3&&r.last3.every(x=>x>=32);
 const planned=plannedForm&&plannedForm>=1&&plannedForm<=10?`<section class="panel planned-round"><span class="tag">学習計画</span><h2>本番校正 第${plannedForm}回</h2><p>${plannedDate?esc(plannedDate.replaceAll('-','/'))+' の予定回です。':''}40問・60分、途中解説なしで実施します。</p>${E.firstSessions(p()).some(x=>x.form===plannedForm)?'<p>この回の初回は実施済みです。再受験は復習扱いになります。</p>':plannedForm===E.nextForm(p())?`<p>${button('この回を開始','start',`data-form="${plannedForm}"`,'true')}</p>`:'<p class="muted">前の本番校正回を完了すると開始できます。</p>'}</section>`:'';
 const forms=Array.from({length:10},(_,i)=>i+1).map(n=>{
   const x=first.find(s=>s.form===n),isNext=n===next,locked=!x&&!isNext;
   return `<button class="form-card ${x?'done':''} ${isNext?'next':''}" data-act="${x?'open-result':isNext?'start':'locked'}" data-form="${n}" ${locked?'disabled':''}><strong>第${n}回　40問・60分</strong><small>${x?`初回 ${x.correct}/40（${x.accuracy}%）・${Math.floor(x.elapsedSec/60)}分${x.elapsedSec%60}秒`:isNext?'次に実施する本番校正回':'前の回を完了すると開放'}</small></button>`;
 }).join('');
 const activePanel=st.active?`<section class="panel"><h2>途中の本番演習</h2><p>第${st.active.form}回　${st.active.index+1}/40問</p><p class="muted">中断しても60分の時計は進みます。</p><div class="row">${button('再開','resume','',true)}${button('終了して採点','finish')}</div></section>`:'';
 return `<main class="benchmark-shell">
 <section class="benchmark-hero"><span class="tag">v15 · 公式公開過去問の出題形式・難度アンカー準拠</span><h1>${esc(profileName())}さんの<br><em>本番80%への積み上げ</em></h1><p>本番と同じ40問・60分。10回400問は問題IDを重複させません。</p></section>
 ${activePanel}
 ${planned}
 <section class="readiness-card ${r.stable80?'ready':''}"><div class="readiness-title">${esc(r.label)}</div><p>${esc(r.description)}</p>
 <div class="criteria">
  <div class="criterion"><span class="mark">${r.firstCompleted>=3?'✓':'○'}</span><span>本番校正の初回40問を3回以上完了</span></div>
  <div class="criterion"><span class="mark">${last3ok?'✓':'○'}</span><span>直近3回すべて32/40以上</span></div>
  <div class="criterion"><span class="mark">${r.stable80?'✓':'○'}</span><span>直近3回の主要5分野がすべて70%以上・60分以内</span></div>
 </div>
 <p class="muted">「高信頼」はこの演習内の判定であり、本番得点の保証ではありません。公開されている公式問題は本試験の一部だけなので、統計的な1対1保証はできません。</p></section>
 <div class="progress-grid">
  ${metric(a.benchmarkForms+'/10','本番校正 完了')}
  ${metric(a.benchmarkQuestions+'/400','初見の本番校正問題')}
  ${metric(a.totalAnswers,'これまでの総回答履歴')}
  ${metric(a.stability.repeated,'2回以上出た概念')}${metric(a.stability.unstable,'正誤が割れた概念')}
 </div>
 <section class="panel"><h2>理解の安定性</h2><div class="progress-grid">
  ${metric(r.stability.tested,'出題された概念')}
  ${metric(r.stability.repeated,'2回以上確認')}
  ${metric(r.stability.stable,'直近2回とも正解')}
  ${metric(r.stability.unstable,'正誤が割れた概念')}
 </div><p class="muted">△自己申告は使いません。同じ概念を別問題で複数回出し、正解と誤答が混ざる概念を「不安定」として表面化します。</p></section>
 <section class="panel"><h2>得点の積み上げ</h2>${scoreStrip(first)}<div class="badge-line">${badge(1,'1回完走',a.benchmarkForms>=1)}${badge(3,'3回継続',a.benchmarkForms>=3)}${badge(5,'200問到達',a.benchmarkQuestions>=200)}${badge(8,'最終仕上げ',a.benchmarkForms>=8)}${badge(10,'400問完走',a.benchmarkForms>=10)}</div></section>
 <section class="panel"><h2>直近3回の分野別</h2><div class="table-wrap"><table class="chapter-table"><thead><tr><th>分野</th><th>正解</th><th>正答率</th></tr></thead><tbody>${chapterRows(r.chapters)}</tbody></table></div><p class="muted">総合点だけで弱点が隠れないよう、80%圏判定では主要5分野すべて70%以上も確認します。</p></section>
 <section class="panel"><h2>本番校正10回</h2><div class="forms">${forms}</div><p class="muted">初回得点だけを到達判定に使います。再受験は復習として記録し、初回スコアを書き換えません。</p></section>
 <section class="panel"><h2>難易度の基準</h2><div class="calibration-note"><b>公式公開問題の形式・難度アンカー準拠</b><p>日科技連の初級サンプル問題と第18・20・22・26回の公開解説をアンカーに、同一テーマの記述判定、4空欄の組合せ、目的から技法を選ぶ事例、計算・テスト設計を混在させています。単語定義だけの問題は全体の一部に限定し、公式問題の文面は転載していません。</p></div>
 <p>公式試験は40問・60分、初級シラバスVer.3.0のL1〜L3が対象です。本番校正では、4択すべてを同じ論点の中で比較できるようにし、同じ説明を重複させて実質2択になる構造を禁止しています。</p>
 <p><a class="button" href="./practice.html">通常の理解重視演習へ</a> <a class="button" href="./index.html">学習計画へ</a></p></section>
 </main>`;
}
function quiz(){
 const v=E.view(B,p()),s=active();if(!v){route='home';return home();}
 return `<main class="benchmark-shell"><div class="bench-top"><div><span class="tag">第${v.form}回 · ${v.firstAttempt?'初回':'再受験'}</span><p class="muted">${v.index+1}/40問　${v.id}　${esc(v.chapter)} / ${esc(v.level)}</p></div><strong class="bench-timer" id="timer">${format(v.remainingSec)}</strong></div>
 <progress max="40" value="${v.index+1}"></progress><section class="panel"><h1 class="bench-question">${esc(v.text)}</h1><p class="muted">本番と同様、終了するまで正解・解説は表示しません。選択肢は何度でも変更できます。</p>
 <div class="bench-options">${v.options.map(o=>`<div class="bench-option-row single"><button class="bench-option ${o.selected?'chosen':''}" data-act="answer" data-choice="${o.original}"><span class="letter">${letters[o.display]}</span><span>${esc(o.text)}</span></button></div>`).join('')}</div>
 <p>${button('分からない','unknown')}</p></section>
 <div class="row">${button('前へ','prev',v.index?'':'disabled')}${button(v.index===39?'終了前に確認':'次へ','next','',true)}</div>
 <div class="bench-jump">${s.ids.map((id,i)=>`<button data-act="jump" data-index="${i}" class="${i===s.index?'current':''} ${Object.hasOwn(s.answers,id)?'answered':''}">${i+1}</button>`).join('')}</div>
 ${button('終了して採点','finish')}
 </main>`;
}
function benchmarkTextbook(q,order,selected){
 if(!T)return '';
 const l=T.lesson(q),targetTerms=l.targets.map(x=>x.term),related=l.related||[];
 const rows=related.map(x=>`<tr class="${targetTerms.includes(x.term)?'target-row':''}"><td><b>${esc(x.term)}</b><br><small>${esc(x.level)} / ${esc(x.syllabus)}</small></td><td>${esc(x.definition)}</td></tr>`).join('');
 const options=order.map((n,i)=>`<div class="textbook-option ${n===q.correct?'correct':'wrong'} ${n===selected?'selected':''}"><div class="reason-head"><b>${letters[i]}. ${esc(q.options[n])}</b><span class="verdict">${n===q.correct?'○ 正解':'× 誤り'}</span></div>${T.optionNote(q,n).filter(Boolean).map((x,j)=>`<p>${j===0?'<b>判定理由：</b>':''}${esc(x)}</p>`).join('')}</div>`).join('');
 const targets=l.targets.length?l.targets.map(x=>`<li><b>${esc(x.term)}</b>：${esc(x.definition)}</li>`).join(''):`<li><b>${esc(q.family||q.chapter)}</b>の判断基準を理解する。</li>`;
 return `<div class="textbook-body benchmark-textbook">
  <div class="textbook-title"><span>TEXTBOOK</span><h3>${esc(q.family||q.chapter)}｜教科書解説</h3></div>
  <section class="textbook-section"><h4>1. 分野の全体像</h4><p>${esc(l.chapter.overview)}</p><p>${esc(l.family.overview)}</p></section>
  <section class="textbook-section"><h4>2. 定義を押さえる</h4><ul class="textbook-definition">${targets}</ul><p><b>比較軸：</b>${esc(l.family.compare||l.chapter.axis)}</p></section>
  <section class="textbook-section"><h4>3. 本番での読み方</h4><p><b>${esc(l.type.title)}</b></p><ol class="decision-steps">${l.type.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="textbook-tip"><b>注意：</b>${esc(l.type.tip)} ${esc(l.chapter.exam||'')}</p></section>
  <section class="textbook-section"><h4>4. この問題の決め手</h4><p><b>${esc(q.brief)}</b></p><p>${esc(q.detail)}</p></section>
  <section class="textbook-section"><h4>5. 似た概念との比較</h4><div class="table-wrap"><table class="textbook-table"><thead><tr><th>用語</th><th>意味・使う場面</th></tr></thead><tbody>${rows}</tbody></table></div></section>
  <section class="textbook-section"><h4>6. 4択を1つずつ検証</h4>${options}</section>
  <section class="textbook-section"><h4>7. よくある誤り</h4><p>${esc(l.family.trap||l.chapter.exam)}</p></section>
  <section class="textbook-section textbook-summary"><h4>8. 覚える要点</h4><p>正解記号ではなく、対象・目的・使う場面の違いを説明できる状態にする。同じテーマが別事例で出ても定義から判断する。</p><p class="muted">公式シラバス項目 ${esc(l.syllabus)} / ${esc(l.level)}。学習用解説であり、公式問題の解説そのものではありません。</p></section>
 </div>`;
}
function result(r){
 if(!r)return '<main class="benchmark-shell"><p>結果がありません。</p></main>';
 const rd=E.readiness(p());
 return `<main class="benchmark-shell"><section class="benchmark-hero"><span class="tag">第${r.form}回 · ${r.firstAttempt?'初回':'再受験'}</span><div class="result-score">${r.correct}<small>/40</small></div><p>${r.accuracy}% · ${Math.floor(r.elapsedSec/60)}分${r.elapsedSec%60}秒 · 未回答 ${r.unknown||0}問</p></section>
 <section class="readiness-card ${rd.stable80?'ready':''}"><div class="readiness-title">${esc(rd.label)}</div><p>${esc(rd.description)}</p></section>
 <div class="row">${button('ダッシュボードへ','home','',true)}${button('この回を再受験','retake',`data-form="${r.form}"`)}</div>
 <section class="panel"><h2>分野別</h2><div class="table-wrap"><table><thead><tr><th>分野</th><th>正解</th><th>正答率</th></tr></thead><tbody>${chapterRows(r.chapters)}</tbody></table></div></section>
 <section class="panel"><h2>40問の教科書解説</h2><p class="muted">答え合わせではなく、その周辺テーマまで復習できる学習テキストとして確認します。</p>
 ${r.details.map((d,i)=>`<details class="result-question" ${d.correct?'':'open'}><summary>${d.correct?'○':'×'} 問${i+1} ${esc(d.id)} ${d.selected===null?'?':''}</summary><div class="body"><p class="bench-question" style="font-size:15px">${esc(d.question.text)}</p><p><b>正解：</b>${letters[d.order.indexOf(d.question.correct)]}. ${esc(d.question.options[d.question.correct])}</p>${benchmarkTextbook(d.question,d.order,d.selected)}</div></details>`).join('')}</section></main>`;
}
function format(sec){sec=Math.max(0,sec);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function render(){
 clearInterval(timer);document.documentElement.dataset.theme=state.theme||'dark';
 root.innerHTML=route==='quiz'?quiz():route==='result'?result(selectedResult):home();
 if(route==='quiz'){timer=setInterval(()=>{const s=active();if(!s)return;const left=Math.max(0,Math.floor((s.durationMs-(Date.now()-s.startedAt))/1000));const t=document.getElementById('timer');if(t)t.textContent=format(left);if(left<=0){selectedResult=E.finish(B,p());save();route='result';render();}},1000);}
}
async function act(el){
 const a=el.dataset.act;
 if(a==='home'){route='home';selectedResult=null;render();return;}
 if(a==='start'||a==='retake'){const form=Number(el.dataset.form||E.nextForm(p()));if(!form)return;if(!confirm(`第${form}回を開始します。40問・60分、途中解説なしです。`))return;E.start(B,p(),form);save();route='quiz';render();return;}
 if(a==='locked'){toast('前の回を完了すると開放されます。');return;}
 if(a==='resume'){route='quiz';render();return;}
 if(a==='open-result'){selectedResult=E.firstSessions(p()).find(x=>x.form===Number(el.dataset.form));route='result';render();return;}
 if(a==='answer'){E.answer(p(),Number(el.dataset.choice));save();render();return;}
 if(a==='unknown'){E.unknown(p());save();render();return;}
 if(a==='prev'){const s=active();if(s&&s.index>0)E.go(p(),s.index-1);save();render();return;}
 if(a==='next'){const s=active();if(!s)return;if(s.index===39){toast('「終了して採点」で提出してください。');return;}E.go(p(),s.index+1);save();render();return;}
 if(a==='jump'){E.go(p(),Number(el.dataset.index));save();render();return;}
 if(a==='finish'){if(!active())return;if(!confirm('終了して採点しますか？未回答は不正解になります。'))return;selectedResult=E.finish(B,p());save();route='result';render();return;}
}
root.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el||el.disabled)return;e.preventDefault();act(el).catch(err=>{console.error(err);toast(err.message||'操作できませんでした。');});});
window.addEventListener('storage',e=>{if(e.key===KEY)toast('別のタブで履歴が更新されました。再読み込みしてください。');});
load();if(active()){const s=active();if(Date.now()-s.startedAt>=s.durationMs){selectedResult=E.finish(B,p());save();route='result';}else route='quiz';}
render();
})();