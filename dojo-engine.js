/* JCSQE v9 "question dojo" engine.
   Generates four deterministic drill variants for each syllabus checkpoint and
   mixes them with the existing deduplicated original exercise bank. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.JCSQEDojo=factory();})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const LETTERS='ABCD';
function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function seeded(seed){let x=seed>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}
function shuffle(a,rng){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function clean(v){return String(v||'').replace(/\s+/g,' ').trim();}
function pickDistractors(concepts,target,n=3,salt=''){
 const sameFamily=concepts.filter(x=>x.id!==target.id&&x.family===target.family);
 const sameChapter=concepts.filter(x=>x.id!==target.id&&x.chapter===target.chapter&&!sameFamily.some(y=>y.id===x.id));
 const other=concepts.filter(x=>x.id!==target.id&&!sameFamily.some(y=>y.id===x.id)&&!sameChapter.some(y=>y.id===x.id));
 const ordered=shuffle([...sameFamily,...sameChapter,...other],seeded(hash(target.id+'|'+salt))),out=[],terms=new Set([clean(target.term)]),defs=new Set([clean(target.definition)]);
 for(const x of ordered){const term=clean(x.term),def=clean(x.definition);if(terms.has(term)||defs.has(def))continue;terms.add(term);defs.add(def);out.push(x);if(out.length===n)break;}
 if(out.length<n)throw Error('十分に異なる誤答候補を作れません: '+target.id);
 return out;
}
function variant(concepts,conceptId,type){
 const t=concepts.find(x=>x.id===conceptId);if(!t)throw Error('チェックポイントが見つかりません。');
 const d=pickDistractors(concepts,t,3,type),rng=seeded(hash(t.id+'|'+type+'|options'));let text,raw,correctValue,explanation;
 if(type==='def'){
  text='次の説明に最も当てはまる用語はどれか。\n\n「'+t.definition+'」';raw=[t.term,...d.map(x=>x.term)];correctValue=t.term;
 }else if(type==='term'){
  text='「'+t.term+'」の説明として最も適切なものはどれか。';raw=[t.definition,...d.map(x=>x.definition)];correctValue=t.definition;
 }else if(type==='pair'){
  text='次の「用語 — 説明」の組合せのうち、正しいものはどれか。';correctValue=t.term+' — '+t.definition;raw=[correctValue,...d.map((x,i)=>x.term+' — '+d[(i+1)%d.length].definition)];
 }else if(type==='wrong'){
  text='次の「用語 — 説明」の組合せのうち、誤っているものはどれか。';correctValue=t.term+' — '+d[0].definition;raw=[correctValue,...d.map(x=>x.term+' — '+x.definition)];
 }else throw Error('出題形式が不正です。');
 const options=shuffle(raw,rng),correct=options.indexOf(correctValue);
 explanation=t.term+'：'+t.definition;
 return{id:'DOJO-'+type.toUpperCase()+'-'+t.id,kind:'syllabus',variant:type,conceptId:t.id,chapter:t.chapter,topic:t.family,level:t.level,text,options,correct,explanation,syllabus:t.syllabus,source:t.source};
}
function syllabusItems(concepts){const types=['def','term','pair','wrong'],out=[];for(const c of concepts)for(const type of types)out.push(variant(concepts,c.id,type));return out;}
function caseItems(catalog){
 return catalog.groups.map(g=>{const q=g.question;return{id:'CASE-'+g.key,kind:'case',variant:'case',conceptId:null,chapter:'事例・計算問題',topic:q.category,level:q.level||'混合',text:q.text,options:q.options.slice(),correct:q.correct,explanation:q.explanation,reasons:q.reasons||null,syllabus:q.syllabus||'',source:q.sources?.[0]?.url||null,sourceQuestionId:q.id};});
}
function build(concepts,catalog){const s=syllabusItems(concepts),c=caseItems(catalog),all=[...s,...c];return{all,byId:new Map(all.map(x=>[x.id,x])),syllabus:s,cases:c,total:all.length};}
function profile(p){if(!p.dojo||typeof p.dojo!=='object')p.dojo={history:[],bookmarks:[],session:null};if(!Array.isArray(p.dojo.history))p.dojo.history=[];if(!Array.isArray(p.dojo.bookmarks))p.dojo.bookmarks=[];return p.dojo;}
function latestMap(p){const m=new Map();for(const h of profile(p).history)m.set(h.itemId,h);return m;}
function filter(bank,p,filters={}){
 const latest=latestMap(p),book=new Set(profile(p).bookmarks);return bank.all.filter(x=>{
  if(filters.source&&filters.source!=='all'&&x.kind!==filters.source)return false;
  if(filters.chapter&&filters.chapter!=='all'&&x.chapter!==filters.chapter)return false;
  if(filters.level&&filters.level!=='all'&&x.level!==filters.level)return false;
  if(filters.topic&&filters.topic!=='all'&&x.topic!==filters.topic)return false;
  const h=latest.get(x.id),status=filters.status||'all';
  if(status==='unanswered'&&h)return false;
  if(status==='wrong'&&(!h||h.correct))return false;
  if(status==='uncertain'&&(!h||h.confidence==='sure'))return false;
  if(status==='bookmarked'&&!book.has(x.id))return false;
  return true;
 });
}
function choose(bank,p,filters,count,time=Date.now()){
 const pool=filter(bank,p,filters),latest=latestMap(p),mode=filters.order||'random';let ordered;
 if(mode==='new-first')ordered=[...shuffle(pool.filter(x=>!latest.has(x.id)),seeded(hash('n'+time))),...shuffle(pool.filter(x=>latest.has(x.id)),seeded(hash('s'+time)))];
 else if(mode==='weak-first')ordered=shuffle(pool,seeded(hash('w'+time))).sort((a,b)=>{const A=latest.get(a.id),B=latest.get(b.id);const av=!A?2:A.correct&&A.confidence==='sure'?1:0,bv=!B?2:B.correct&&B.confidence==='sure'?1:0;return av-bv;});
 else if(mode==='ordered')ordered=pool.slice().sort((a,b)=>a.id.localeCompare(b.id));
 else ordered=shuffle(pool,seeded(hash('r'+time)));
 return ordered.slice(0,Math.min(count,ordered.length));
}
function makeSession(bank,p,filters,count=10,time=Date.now()){
 const items=choose(bank,p,filters,count,time);if(!items.length)return null;
 const orders={};for(const item of items)orders[item.id]=shuffle([0,1,2,3],seeded(hash(item.id+'|'+time)));
 return{id:'dojo_'+time,filters:{...filters},itemIds:items.map(x=>x.id),orders,index:0,answers:{},confidence:{},committed:{},startedAt:time,updatedAt:time};
}
function current(bank,s){const item=bank.byId.get(s.itemIds[s.index]);if(!item)throw Error('問題が見つかりません。');return item;}
function commit(bank,p,s,selected,confidence,time=Date.now()){
 const item=current(bank,s);if(s.committed[item.id])return null;const sel=Number.isInteger(selected)?selected:null,rec={id:'dh_'+time+'_'+item.id,sessionId:s.id,itemId:item.id,kind:item.kind,chapter:item.chapter,topic:item.topic,level:item.level,variant:item.variant,selected:sel,correct:sel===item.correct,confidence:confidence||'unknown',timestamp:new Date(time).toISOString()};
 profile(p).history.push(rec);s.answers[item.id]=sel;s.confidence[item.id]=confidence||'unknown';s.committed[item.id]=true;s.updatedAt=time;return{record:rec,item};
}
function finish(bank,p,s,time=Date.now()){
 for(const id of s.itemIds)if(!s.committed[id]){s.index=s.itemIds.indexOf(id);commit(bank,p,s,null,'unknown',time);}
 const rows=profile(p).history.filter(h=>h.sessionId===s.id),map=new Map(rows.map(h=>[h.itemId,h])),details=s.itemIds.map(id=>map.get(id)),correct=details.filter(x=>x.correct).length;
 const result={id:s.id,total:details.length,correct,accuracy:details.length?Math.round(correct/details.length*100):0,elapsedSec:Math.max(0,Math.floor((time-s.startedAt)/1000)),details,filters:s.filters,finishedAt:new Date(time).toISOString()};
 profile(p).lastResult=result;profile(p).session=null;return result;
}
function stats(bank,p){
 const hist=profile(p).history,latest=latestMap(p),items=bank.all,answered=items.filter(x=>latest.has(x.id)),sure=answered.filter(x=>{const h=latest.get(x.id);return h.correct&&h.confidence==='sure';}),wrong=answered.filter(x=>!latest.get(x.id).correct),uncertain=answered.filter(x=>latest.get(x.id).confidence!=='sure');
 const attempts=hist.length,correct=hist.filter(x=>x.correct).length;
 const byChapter=[...new Set(items.map(x=>x.chapter))].map(ch=>{const xs=items.filter(x=>x.chapter===ch),ys=xs.filter(x=>latest.has(x.id)),ok=ys.filter(x=>latest.get(x.id).correct).length;return{chapter:ch,total:xs.length,answered:ys.length,correct:ok,accuracy:ys.length?Math.round(ok/ys.length*100):null};});
 return{total:items.length,syllabus:bank.syllabus.length,cases:bank.cases.length,attempts,attemptAccuracy:attempts?Math.round(correct/attempts*100):null,answered:answered.length,unanswered:items.length-answered.length,sure:sure.length,wrong:wrong.length,uncertain:uncertain.length,bookmarks:profile(p).bookmarks.length,byChapter};
}
return{LETTERS,hash,seeded,shuffle,variant,syllabusItems,caseItems,build,profile,filter,choose,makeSession,current,commit,finish,stats};
});
