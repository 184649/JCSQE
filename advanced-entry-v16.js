/* Additive bank switch and section-level learning map. Storage remains owned by applied-ui.js. */
(()=>{'use strict';
const A=window.JCSQEAdvancedBank,E=window.JCSQEApplied,base=window.JCSQEPracticeBank;if(!A||!E||!base)throw Error('強化教材の読み込みが不完全です。');
const params=new URLSearchParams(location.search),requested=params.get('bank'),mode=['advanced','foundation','mixed'].includes(requested)?requested:'advanced';
const unit=A.scope.byId.has(params.get('unit'))?params.get('unit'):null;
const allStrong=E.bank(A.questions),allBase=E.bank(base.questions),allMixed=E.bank([...A.questions,...base.questions]);
const selected=mode==='foundation'?base.questions:mode==='mixed'?[...A.questions,...base.questions]:A.questions;
const pool=unit?selected.filter(q=>A.byId.has(q.id)&&A.relates(q,unit)):selected;
window.JCSQEAppliedBank={version:'16.0',questions:pool.length?pool:selected};
window.JCSQEAdvancedSelection={mode,unit,questionCount:window.JCSQEAppliedBank.questions.length};
let profile=null;
const previousStats=E.stats;E.stats=(b,p,...args)=>{profile=p;return previousStats(b,p,...args);};
const originalCreate=E.createSession;E.createSession=(b,p,opt,...args)=>{profile=p;const out=originalCreate(b,p,opt,...args);if(out.session){out.session.trainingBank=mode;out.session.syllabusUnit=unit;}return out;};
function sessionBank(s){
 if(s?.trainingBank==='foundation')return allBase;
 if(s?.trainingBank==='mixed')return allMixed;
 if(s?.trainingBank==='advanced')return s.syllabusUnit?E.bank(A.scoped(s.syllabusUnit)):allStrong;
 const ids=s?.questionIds||[];return ids.some(x=>x.startsWith('H16-'))?allMixed:allBase;
}
// Existing in-progress quizzes retain their own bank and snapshots, including filtered old topics.
const previousContinue=E.continuePractice;E.continuePractice=(b,p,...args)=>{profile=p;const s=E.active(p),bank=s?sessionBank(s):b,meta=s?{trainingBank:s.trainingBank||'foundation',syllabusUnit:s.syllabusUnit||null}:null;const out=previousContinue(bank,p,...args);if(out.session&&meta)Object.assign(out.session,meta);return out;};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=(bank,section)=>'./practice.html?bank='+encodeURIComponent(bank)+(section?'&unit='+encodeURIComponent(section):'');
function paint(){
 const root=document.getElementById('applied-app'),main=root?.querySelector('main');if(!main||!profile)return;
 const home=!!main.querySelector('#practice-mode'),history=!!main.querySelector('#profile');if(!home&&!history)return;
 if(main.querySelector('#advanced-controls'))return;
 const report=A.coverage(profile),active=E.active(profile),label={advanced:'強化問題',foundation:'従来の基礎問題',mixed:'基礎＋強化'}[mode];
 const card=document.createElement('section');card.id='advanced-controls';card.className='panel advanced-panel';card.dataset.version='16.0';
 const jump=(id,text)=>active?'<span class="muted">'+esc(text)+'</span>':'<a href="'+esc(url('advanced',id))+'">'+esc(text)+'</a>';
 card.innerHTML='<div class="eyebrow">v16.0 · 難易度を一段引き上げた独自教材</div><h2>'+label+'</h2><p>強化 '+A.questions.length+'問／従来 '+base.questions.length+'問。事例比較・条件表・状態遷移・コード読解・計算を含みます。</p>'+
 '<label>教材を選択<select id="advanced-bank" '+(active?'disabled':'')+'>'+[['advanced','強化問題（標準）'],['foundation','従来の基礎問題'],['mixed','基礎＋強化']].map(([v,t])=>'<option value="'+v+'" '+(mode===v?'selected':'')+'>'+t+'</option>').join('')+'</select></label>'+
 (unit?'<p class="notice">選択項目：'+esc(unit+' '+A.scope.byId.get(unit).title)+' · '+pool.length+'問 '+(active?'':jump('', '全範囲に戻る'))+'</p>':'')+
 (active?'<p class="notice">途中の演習は元の問題・選択肢順で再開します。教材を切り替える場合は、ここまでの演習を終了してください。</p><button data-act="finish-early">ここまでで終了して教材を選ぶ</button>':'')+
 '<div class="advanced-evidence"><span>強化の回答済み <b>'+report.answered+'/'+report.questionCount+'</b></span><span>最新回答が正解 <b>'+report.correct+'</b></span></div>'+
 '<details id="advanced-coverage"><summary>シラバス対応表・未回答を確認</summary><div class="body"><p>番号付きKA/S-KA '+report.coveredUnits+'/'+report.totalUnits+'項目に問題を配置（末端項目 '+report.coveredLeaves+'/'+report.leafUnits+'）。'+esc(report.notice)+'</p><p>「一巡正解」は掲載問題の最新回答が正解という意味で、定着・本番合格の判定ではありません。</p>'+
 A.scope.chapters.map(ch=>'<h3>'+esc(ch)+'</h3><div class="table-wrap"><table class="advanced-table"><thead><tr><th>項目</th><th>知識<br>レベル</th><th>回答</th><th>最新<br>正解</th><th>状態</th></tr></thead><tbody>'+report.units.filter(u=>u.leaf&&u.chapter===ch).map(u=>'<tr><td>'+jump(u.id,u.id+' '+u.title)+'</td><td>'+u.level+'</td><td>'+u.answered+'/'+u.total+'</td><td>'+u.correct+'</td><td>'+esc(u.status)+'</td></tr>').join('')+'</tbody></table></div>').join('')+
 '<p><a href="'+A.scope.source+'" target="_blank" rel="noopener noreferrer">公式シラバスVer.3.0</a> · 対応表の見出しは学習用に要約しています。</p></div></details>'+
 '<p class="muted">既存の履歴・累計成績は残しています。強化問題は新しいIDで別に記録します。市販問題集と同じ難度を実測した教材ではなく、合格保証もありません。</p>'+
 (!active&&window.JCSQEAppliedBank.questions.length>=40?'<details><summary>強化の40問・60分演習</summary><div class="body"><p>現在選択中の教材から分野を分散して40問。提出まで解説なし。初見不足時は初見モードを開始しません。再挑戦には重複が含まれ得ます。</p><div class="row"><button data-act="start" data-kind="mock" data-mode="new" data-count="40">初見40問</button><button data-act="start" data-kind="mock" data-mode="smart" data-count="40">復習を含む40問</button></div></div></details>':'');
 const hero=main.querySelector('.hero');if(hero)hero.after(card);else main.prepend(card);
 card.querySelector('#advanced-bank')?.addEventListener('change',e=>{location.href=url(e.target.value,null);});
}
let scheduled=false;const schedule=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;paint();});};
new MutationObserver(schedule).observe(document.getElementById('applied-app'),{childList:true,subtree:true});schedule();
})();
