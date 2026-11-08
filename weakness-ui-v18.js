/* JCSQE weakness drill v18.0 — additive to existing profile, no remote sync. */
(function(){
'use strict';
const B=window.JCSQEWeakness,root=document.getElementById('weakness-app'),KEY='jcsqe-shokyu-state-v3',ABC='ABCD';
if(!B||!root)throw Error('弱点問題のデータを読み込めませんでした。');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state,lastRaw,locked=false,route='home',msg='',filter='all',mode='smart';
function profile(){return state.profiles[state.activeProfileId];}
function data(){
 const p=profile();if(!p.weaknessStudy||typeof p.weaknessStudy!=='object')p.weaknessStudy={attempts:[],session:null,lastReport:null};
 const w=p.weaknessStudy;if(!Array.isArray(w.attempts))w.attempts=[];return w;
}
function load(){
 try{
  lastRaw=localStorage.getItem(KEY);
  if(lastRaw){
   state=JSON.parse(lastRaw);
   if(!state||!state.profiles||!state.profiles[state.activeProfileId])throw Error('既存プロフィールを正しく読み込めません。');
  }else{
   const id='p_'+Date.now();state={version:7,activeProfileId:id,profiles:{[id]:{name:'ユーザー1',history:[],sessions:[],bookmarks:[]}}};
  }
  data();document.documentElement.dataset.theme=state.theme||'dark';
 }catch(e){locked=true;msg='既存の学習履歴を読み込めませんでした。保存データは変更していません。 '+e.message;}
}
function save(){
 if(locked)return false;
 try{
  if(lastRaw!==localStorage.getItem(KEY)){locked=true;msg='別タブで学習履歴が変更されました。上書き防止のため停止しました。このページを再読み込みしてください。';render();return false;}
  state.updatedAt=Date.now();const v=JSON.stringify(state);localStorage.setItem(KEY,v);lastRaw=v;return true;
 }catch(e){locked=true;msg='保存に失敗しました。ブラウザの保存領域をご確認ください。';render();return false;}
}
function shuffled(arr){const out=[...arr];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function last(q){const at=data().attempts;for(let i=at.length-1;i>=0;i--)if(at[i].id===q.id)return at[i];return null;}
function scoped(){return B.questions.filter(q=>filter==='all'||q.category===filter);}
function build(modeName){
 const list=scoped(),seen=list.filter(q=>!!last(q)),fresh=list.filter(q=>!last(q)),wrong=seen.filter(q=>!last(q).correct),rest=seen.filter(q=>last(q).correct);
 if(modeName==='new')return shuffled(fresh);
 if(modeName==='wrong')return shuffled(wrong);
 if(modeName==='all')return shuffled(list);
 return [...shuffled(fresh),...shuffled(wrong),...shuffled(rest)];
}
const btn=(text,act,extra='',primary=false)=>'<button type="button" class="btn '+(primary?'primary':'')+'" data-act="'+act+'" '+extra+'>'+esc(text)+'</button>';
function head(){return '<header><a href="./index.html">JCSQE 初級<small>直前・弱点補強ドリル v18</small></a>'+btn('表示切替','theme')+'</header>';}
function banner(){return msg?'<div class="status error" role="alert">'+esc(msg)+'</div>':'';}
function overview(){
 const at=data().attempts,answered=new Set(at.map(x=>x.id)),latest=B.questions.map(last).filter(Boolean),ok=latest.filter(x=>x.correct).length;
 const f=B.questions.filter(q=>!answered.has(q.id)).length,errors=latest.filter(x=>!x.correct).length;
 return '<div class="metricgrid"><div class="metric"><b>'+answered.size+'/40</b><span>解いた独自問題</span></div><div class="metric"><b>'+ok+'</b><span>直近正解の問題</span></div><div class="metric"><b>'+errors+'</b><span>直近不正解の問題</span></div></div><p class="small muted">未回答 '+f+'問。最新の正誤はこの独自40問の記録であり、本試験の得点予測ではありません。復習の正解と初見の正解は区別してください。</p>';
}
function home(){
 const d=data(),session=d.session;
 const cats=B.categories.map(cat=>{
  const all=B.questions.filter(q=>q.category===cat),answered=all.filter(q=>last(q)),correct=all.filter(q=>last(q)?.correct);
  return '<tr><td>'+esc(cat)+'</td><td>'+answered.length+'/'+all.length+'</td><td>'+correct.length+'</td></tr>';
 }).join('');
 const options=['<option value="all">全分野（40問）</option>',...B.categories.map(cat=>'<option value="'+esc(cat)+'" '+(filter===cat?'selected':'')+'>'+esc(cat)+'（'+B.questions.filter(q=>q.category===cat).length+'問）</option>')].join('');
 return '<main>'+banner()+'<section class="hero"><div class="eyebrow">11月14日試験に向けた、独自の補強40問</div><h1>間違えた理由を、<br>次の一問で修正する。</h1><p>レビュー、FTA/FMEA、テスト網羅、統計の分母、適合率・再現率、PIA/PET、権利・変更管理を、別の事例で確認します。</p>'+overview()+'</section>'+
 (session?'<section class="card"><span class="tag">途中の演習を保存中</span><h2>続きから再開</h2><p>問 '+(session.index+1)+' / '+session.ids.length+'。別の演習を始める前にこの回を終えてください。</p>'+btn('続きから再開','resume','',true)+'</section>':'')+
 '<section class="card"><h2>演習を選ぶ</h2><label for="section">重点分野</label><select id="section">'+options+'</select><label for="mode">出題対象</label><select id="mode">'+[
 ['smart','おすすめ（初見→直近誤答→その他）'],['new','未回答のみ'],['wrong','直近で間違えた問題'],['all','全問ランダム']
 ].map(([v,name])=>'<option value="'+v+'" '+(mode===v?'selected':'')+'>'+name+'</option>').join('')+'</select><p class="small muted" style="margin-top:12px">解答直後に全4選択肢の解説を表示します。1回の演習は選んだ対象を一巡し、中断位置を保存します。</p><div class="actions">'+btn('演習を開始','start',session?'disabled':'',true)+'<a class="btn" href="./cram.html">実戦模試A・B</a></div></section>'+
 '<section class="card"><h2>分野別の進捗</h2><div class="table-wrap"><table><thead><tr><th>分野</th><th>既回答</th><th>直近正解</th></tr></thead><tbody>'+cats+'</tbody></table></div></section>'+
 '<section class="card"><h2>学習データ</h2><p class="small muted">回答はこれまでと同じブラウザのプロフィール内に別枠で保存します。模試A・Bや従来の履歴は変更しません。ChatGPTへの自動同期はありません。</p><div class="actions">'+btn('学習状況をコピー','copy')+btn('プロフィールJSONを保存','export')+'</div></section><p class="small muted"><a href="'+esc(B.reference)+'" target="_blank" rel="noopener">公式公開過去問</a> ／ <a href="'+esc(B.syllabusUrl)+'" target="_blank" rel="noopener">公式シラバス Ver.3.0</a><br>すべて独自作成問題。公式問題の転載ではなく、出題難度・配点の再現を保証しません。</p></main>';
}
function quiz(){
 const w=data(),s=w.session;if(!s)return home();
 const q=B.byId[s.ids[s.index]];if(!q){msg='保存された演習の問題IDが見つかりません。';return home();}
 const order=s.orders[q.id],answered=Object.prototype.hasOwnProperty.call(s.selections,q.id),chosen=s.selections[q.id];
 const options=order.map((j,i)=>'<button class="option '+(answered?(j===q.correct?'correct':'')+(chosen===j?' chosen':''):'')+'" data-act="choose" data-original="'+j+'" '+(answered?'disabled':'')+' aria-pressed="'+(chosen===j)+'"><b>'+ABC[i]+'</b><span>'+esc(q.options[j])+'</span></button>').join('');
 const info=answered?'<section class="card"><h2 style="color:var(--'+(chosen===q.correct?'ok':'bad')+')">'+(chosen===q.correct?'正解':'要復習')+'</h2><p><b>正解：</b>'+esc(q.options[q.correct])+'</p><p>'+esc(q.why)+'</p><h3>4つの選択肢の判定理由</h3>'+order.map((j,i)=>'<div class="reason '+(j===q.correct?'good':chosen===j?'bad':'')+'"><strong>'+ABC[i]+'. '+esc(q.options[j])+(j===q.correct?'（正解）':'')+'</strong><p>'+esc(q.notes[j])+'</p></div>').join('')+'</section>':'';
 return '<main>'+banner()+'<section class="hero"><div class="eyebrow">'+esc(q.category)+' · '+esc(q.syllabus)+' · '+esc(q.level)+'</div><h1>問 '+(s.index+1)+' / '+s.ids.length+'</h1><div class="rail" aria-label="演習の進行度"><span style="width:'+Math.round((s.index+1)/s.ids.length*100)+'%"></span></div><p class="small muted">分からないときは「分からない」を押してください。選択後に解説が開きます。</p></section><section class="card"><p class="question">'+esc(q.text)+'</p>'+options+
 (!answered?'<div class="actions">'+btn('分からない','unknown')+'</div>':'')+'</section>'+info+
 '<div class="actions">'+btn('ホームへ（中断・保存）','home')+btn(s.index===s.ids.length-1?'今回の結果を見る':'次の問題','next',answered?'':'disabled',true)+'</div></main>';
}
function report(){
 const r=data().lastReport;if(!r)return home();
 const misses=r.ids.filter(id=>!r.answers[id]?.correct);
 return '<main>'+banner()+'<section class="hero"><div class="eyebrow">弱点演習の結果</div><h1>'+r.ok+' / '+r.ids.length+'問</h1><p>正答率 '+Math.round(r.ok/r.ids.length*1000)/10+'%（この回の結果。初見・再挑戦の区別に注意）</p></section><section class="card"><h2>要復習：'+misses.length+'問</h2>'+
 (misses.length?misses.map(id=>{const q=B.byId[id];return '<div class="resultitem"><strong>'+esc(id)+' / '+esc(q.category)+' / '+esc(q.syllabus)+'</strong><p>'+esc(q.text)+'</p><p class="small muted">'+esc(q.why)+'</p></div>';}).join(''):'<p>この回での誤答はありません。翌日、別の問題でも確認してください。</p>')+
 '</section><div class="actions">'+btn('ホームへ','home','',true)+btn('学習状況をコピー','copy')+'</div></main>';
}
function render(){root.innerHTML=head()+(route==='quiz'?quiz():route==='report'?report():home());}
function begin(){
 if(locked)return;
 const w=data();if(w.session){route='quiz';render();return;}
 const questions=build(mode);
 if(!questions.length){msg=mode==='new'?'この条件で未回答の問題はありません。':'この条件で出題できる問題がありません。';route='home';render();return;}
 msg='';
 const ids=questions.map(q=>q.id),orders=Object.fromEntries(ids.map(id=>[id,shuffled([0,1,2,3])]));
 w.session={ids,orders,selections:{},index:0,startedAt:Date.now(),category:filter,mode};
 if(save()){route='quiz';render();}
}
function answer(value){
 if(locked)return;
 const w=data(),s=w.session;if(!s)return;const id=s.ids[s.index],q=B.byId[id];
 if(Object.prototype.hasOwnProperty.call(s.selections,id))return;
 const selected=value===null?null:Number(value);if(selected!==null&&(!Number.isInteger(selected)||selected<0||selected>3))return;
 const first=!w.attempts.some(x=>x.id===id);
 s.selections[id]=selected;w.attempts.push({id,selected,correct:selected===q.correct,firstExposure:first,at:Date.now()});
 if(save())render();
}
function next(){
 if(locked)return;
 const w=data(),s=w.session;if(!s)return;
 if(!Object.prototype.hasOwnProperty.call(s.selections,s.ids[s.index]))return;
 if(s.index<s.ids.length-1){s.index++;if(save())render();return;}
 const answers=Object.fromEntries(s.ids.map(id=>[id,{selected:s.selections[id],correct:s.selections[id]===B.byId[id].correct}]));
 w.lastReport={ids:s.ids,answers,ok:Object.values(answers).filter(x=>x.correct).length,finishedAt:Date.now(),startedAt:s.startedAt,mode:s.mode,category:s.category};
 w.session=null;if(save()){route='report';render();}
}
function summary(){
 const w=data(),latest=B.questions.map(q=>({q,x:last(q)})),seen=latest.filter(o=>o.x),bad=seen.filter(o=>!o.x.correct);
 return ['JCSQE初級 弱点補強v18（独自40問）','回答済み '+seen.length+'/40、直近正解 '+seen.filter(o=>o.x.correct).length+'、直近誤答 '+bad.length,'回答の総記録 '+w.attempts.length,'弱点：'+(bad.map(o=>o.q.category+' '+o.q.syllabus+' '+o.q.id).join(' / ')||'現在の直近誤答なし'),'公式問題ではなく本番得点予測ではありません。'].join('\n');
}
function copyText(){
 const val=summary();
 if(navigator.clipboard?.writeText){navigator.clipboard.writeText(val).then(()=>{msg='学習状況をコピーしました。';render();}).catch(()=>window.prompt('下の学習状況をコピーしてください。',val));}
 else window.prompt('下の学習状況をコピーしてください。',val);
}
function exportData(){
 const blob=new Blob([JSON.stringify({app:'JCSQE〜初級〜',version:7,exportedAt:new Date().toISOString(),profile:profile()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='jcsqe-v18-profile.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
root.addEventListener('click',e=>{
 const t=e.target.closest('[data-act]');if(!t||t.disabled)return;
 const a=t.dataset.act;
 if(locked){if(a==='home')location.reload();return;}
 if(a==='start'){begin();return;}if(a==='resume'){route='quiz';render();return;}
 if(a==='choose'){answer(t.dataset.original);return;}if(a==='unknown'){answer(null);return;}
 if(a==='next'){next();return;}if(a==='home'){route='home';msg='';render();return;}
 if(a==='copy'){copyText();return;}if(a==='export'){exportData();return;}
 if(a==='theme'){state.theme=state.theme==='light'?'dark':'light';document.documentElement.dataset.theme=state.theme;if(save())render();}
});
root.addEventListener('change',e=>{if(locked)return;const t=e.target;if(t.id==='section'){filter=t.value;render();}if(t.id==='mode'){mode=t.value;render();}});
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue!==lastRaw){locked=true;msg='別タブで学習履歴が変更されました。上書きしていません。このページを再読み込みしてください。';render();}});
load();if(!locked&&data().session)route='quiz';render();
})();
