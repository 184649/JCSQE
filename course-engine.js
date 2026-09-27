/* JCSQE v8 three-round syllabus course engine. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.JCSQECourse=factory();})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const LETTERS='ABCD';
function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function seeded(seed){let x=seed>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}
function shuffle(a,rng){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function normalizeProfile(p){if(!p.course||typeof p.course!=='object')p.course={history:[],session:null};if(!Array.isArray(p.course.history))p.course.history=[];if(!p.course.session||typeof p.course.session!=='object')p.course.session=null;return p.course;}
function pools(concepts,target){
 let pool=concepts.filter(x=>x.id!==target.id&&x.family===target.family);
 if(pool.length<3)pool=concepts.filter(x=>x.id!==target.id&&x.chapter===target.chapter);
 if(pool.length<3)pool=concepts.filter(x=>x.id!==target.id);
 return pool;
}
function distractors(concepts,target,round){
 const rng=seeded(hash(target.id+'|'+round+'|d'));return shuffle(pools(concepts,target),rng).slice(0,3);
}
function question(concepts,conceptId,round){
 const t=concepts.find(x=>x.id===conceptId);if(!t)throw Error('チェックポイントが見つかりません。');
 const ds=distractors(concepts,t,round),rng=seeded(hash(t.id+'|'+round+'|o'));
 let text,raw,correctValue;
 if(round===1){
   text='次の説明に最も当てはまる用語はどれか。\n\n「'+t.definition+'」';
   raw=[t.term,...ds.map(x=>x.term)];correctValue=t.term;
 }else if(round===2){
   text='「'+t.term+'」の説明として最も適切なものはどれか。';
   raw=[t.definition,...ds.map(x=>x.definition)];correctValue=t.definition;
 }else{
   text='次の「用語 — 説明」の組合せのうち、正しいものはどれか。';
   const wrong=ds.map((x,i)=>x.term+' — '+ds[(i+1)%ds.length].definition);
   correctValue=t.term+' — '+t.definition;raw=[correctValue,...wrong];
 }
 const options=shuffle(raw,rng),correct=options.indexOf(correctValue);
 return{id:'COURSE-'+round+'-'+t.id,conceptId:t.id,round,chapter:t.chapter,family:t.family,level:t.level,term:t.term,text,options,correct,correctLetter:LETTERS[correct],explanation:t.term+'：'+t.definition,syllabus:t.syllabus,source:t.source};
}
function firstAttempts(course,round){const seen=new Set(),out=[];for(const h of course.history){if(h.round!==round||seen.has(h.conceptId))continue;seen.add(h.conceptId);out.push(h);}return out;}
function roundProgress(concepts,profile,round){
 const course=normalizeProfile(profile),first=firstAttempts(course,round),answered=new Set(first.map(x=>x.conceptId)),correct=first.filter(x=>x.correct).length,sure=first.filter(x=>x.correct&&x.confidence==='sure').length;
 return{round,total:concepts.length,answered:answered.size,remaining:concepts.length-answered.size,complete:answered.size===concepts.length,correct,accuracy:first.length?Math.round(correct/first.length*100):null,sure,sureAccuracy:first.length?Math.round(sure/first.length*100):null};
}
function progress(concepts,profile){const rounds=[1,2,3].map(r=>roundProgress(concepts,profile,r));let current=1;if(rounds[0].complete)current=2;if(rounds[1].complete)current=3;if(rounds[2].complete)current=4;return{rounds,current,complete:current===4,totalRequired:concepts.length*3};}
function pendingConcepts(concepts,profile,round){
 const course=normalizeProfile(profile),done=new Set(firstAttempts(course,round).map(x=>x.conceptId));
 return concepts.filter(x=>!done.has(x.id));
}
function makeSession(concepts,profile,count=5,time=Date.now()){
 const pr=progress(concepts,profile);if(pr.current===4)return null;const round=pr.current,pending=pendingConcepts(concepts,profile,round);if(!pending.length)return null;
 const rng=seeded(hash('session|'+round+'|'+pending.length+'|'+Math.floor(time/86400000)));
 const chosen=shuffle(pending,rng).slice(0,Math.min(count,pending.length));
 return{id:'course_'+round+'_'+time,round,conceptIds:chosen.map(x=>x.id),index:0,answers:{},confidence:{},committed:{},startedAt:time,updatedAt:time,delayed:round===3};
}
function currentQuestion(concepts,session){return question(concepts,session.conceptIds[session.index],session.round);}
function commit(concepts,profile,session,selected,confidence,time=Date.now()){
 const course=normalizeProfile(profile),q=currentQuestion(concepts,session),cid=q.conceptId;if(session.committed[cid])return null;
 const s=Number.isInteger(selected)?selected:null,correct=s===q.correct,rec={id:'cr_'+time+'_'+cid,sessionId:session.id,conceptId:cid,round:session.round,selected:s,correct,confidence:confidence||'unknown',timestamp:new Date(time).toISOString(),questionId:q.id};
 course.history.push(rec);session.answers[cid]=s;session.confidence[cid]=confidence||'unknown';session.committed[cid]=true;session.updatedAt=time;return{record:rec,question:q};
}
function finish(concepts,profile,session,time=Date.now()){
 const course=normalizeProfile(profile);for(const cid of session.conceptIds){if(!session.committed[cid]){session.index=session.conceptIds.indexOf(cid);commit(concepts,profile,session,null,'unknown',time);}}
 const rows=course.history.filter(h=>h.sessionId===session.id);
 const latest=new Map();for(const h of rows)latest.set(h.conceptId,h);const details=session.conceptIds.map(cid=>latest.get(cid)).filter(Boolean),correct=details.filter(x=>x.correct).length;
 const result={id:session.id,round:session.round,total:session.conceptIds.length,correct,accuracy:session.conceptIds.length?Math.round(correct/session.conceptIds.length*100):0,elapsedSec:Math.max(0,Math.floor((time-session.startedAt)/1000)),details,finishedAt:new Date(time).toISOString()};
 course.lastResult=result;course.session=null;return result;
}
function reinforcement(concepts,profile,count=10,time=Date.now()){
 const course=normalizeProfile(profile),latest=new Map();for(const h of course.history)latest.set(h.conceptId,h);
 const ids=concepts.filter(c=>{const h=latest.get(c.id);return h&&(!h.correct||h.confidence!=='sure');}).map(c=>c.id);
 const round=progress(concepts,profile).current===4?3:Math.max(1,progress(concepts,profile).current-1),rng=seeded(hash('reinforce|'+Math.floor(time/86400000)));
 const chosen=shuffle(ids,rng).slice(0,count);if(!chosen.length)return null;
 return{id:'reinforce_'+time,round,conceptIds:chosen,index:0,answers:{},confidence:{},committed:{},startedAt:time,updatedAt:time,delayed:false,reinforcement:true};
}
function readiness(concepts,profile){
 const course=normalizeProfile(profile),p3=progress(concepts,profile).rounds?.[2];
 const mocks=(profile.sessions||[]).filter(x=>x.appVersion>=7&&x.kind==='mock'&&x.total===40).slice(-3);
 return{round3Complete:!!p3?.complete,round3Accuracy:p3?.accuracy??null,mockCount:mocks.length,mocks:mocks.map(x=>x.correct),ready:!!p3?.complete&&(p3.accuracy??0)>=85&&mocks.length===3&&mocks.every(x=>x.correct>=32)};
}
return{LETTERS,hash,seeded,shuffle,normalizeProfile,question,roundProgress,progress,pendingConcepts,makeSession,currentQuestion,commit,finish,reinforcement,readiness};
});
