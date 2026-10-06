/* v14 benchmark engine: fixed 10x40 first-attempt forms, 60-minute timing, readiness trend. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.JCSQEBenchmark=factory();})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)), letters='ABCD';
function shuffle(a,random=Math.random){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
function bank(data){
 if(!data||data.questions?.length!==400||data.formSets?.length!==10)throw Error('本番演習データを確認できません。');
 const byId=new Map(data.questions.map(q=>[q.id,q]));
 for(const f of data.formSets){if(f.ids.length!==40||new Set(f.ids).size!==40||f.ids.some(id=>!byId.has(id)))throw Error('本番演習の回構成を確認できません。');}
 if(new Set(data.formSets.flatMap(f=>f.ids)).size!==400)throw Error('10回400問に重複があります。');
 return {...data,byId};
}
function state(p){
 if(!p.benchmarkStudy)p.benchmarkStudy={schema:1,serial:0,active:null,sessions:[]};
 const b=p.benchmarkStudy;
 if(b.schema!==1||!Array.isArray(b.sessions))throw Error('本番演習の保存形式を確認できません。');
 return b;
}
function currentSessions(p){return state(p).sessions.filter(x=>x.bankVersion==='14.0');}
function firstSessions(p){const out=[];for(const s of currentSessions(p).filter(x=>x.firstAttempt).sort((a,b)=>a.finishedAt-b.finishedAt))if(!out.some(y=>y.form===s.form))out.push(s);return out;}
function startedForms(p){return new Set(currentSessions(p).filter(x=>x.firstAttempt).map(x=>x.form));}
function nextForm(p){const done=startedForms(p);for(let i=1;i<=10;i++)if(!done.has(i))return i;return null;}
function start(data,p,form,now=Date.now(),random=Math.random){
 const b=bank(data),st=state(p);if(st.active)throw Error('途中の本番演習があります。');
 form=Number(form);if(!Number.isInteger(form)||form<1||form>10)throw Error('回数が不正です。');
 const spec=b.formSets.find(x=>x.form===form),firstAttempt=!st.sessions.some(x=>x.bankVersion===data.version&&x.form===form&&x.firstAttempt);
 const serial=++st.serial,ids=spec.ids.slice(),orders={};
 for(const id of ids)orders[id]=shuffle([0,1,2,3],random);
 st.active={id:`bench-${now}-${serial}`,bankVersion:data.version,form,firstAttempt,ids,index:0,orders,answers:{},startedAt:now,durationMs:3600000,finishedAt:null};
 return st.active;
}
function active(p){return state(p).active;}
function view(data,p,now=Date.now()){
 const b=bank(data),s=active(p);if(!s)return null;const id=s.ids[s.index],q=b.byId.get(id),order=s.orders[id];
 return {id,index:s.index,total:40,form:s.form,firstAttempt:s.firstAttempt,remainingSec:Math.max(0,Math.floor((s.durationMs-(now-s.startedAt))/1000)),
  text:q.text,chapter:q.chapter,level:q.level,options:order.map((original,display)=>({display,original,text:q.options[original],selected:s.answers[id]===original})),
  answered:Object.hasOwn(s.answers,id)};
}
function answer(p,choice,now=Date.now()){
 const s=active(p);if(!s||now-s.startedAt>=s.durationMs)return false;
 if(!Number.isInteger(choice)||choice<0||choice>3)return false;
 const id=s.ids[s.index];s.answers[id]=choice;return true;
}
function unknown(p,now=Date.now()){const s=active(p);if(!s||now-s.startedAt>=s.durationMs)return false;const id=s.ids[s.index];s.answers[id]=null;return true;}
function go(p,index){const s=active(p);if(!s||!Number.isInteger(index)||index<0||index>=40)return false;s.index=index;return true;}
function summarizeChapter(details){
 const map={};for(const d of details){const x=map[d.chapter]||(map[d.chapter]={correct:0,total:0});x.total++;if(d.correct)x.correct++;}
 for(const x of Object.values(map))x.accuracy=Math.round(x.correct/x.total*1000)/10;return map;
}
function finish(data,p,now=Date.now()){
 const b=bank(data),st=state(p),s=st.active;if(!s)return null;
 const details=s.ids.map(id=>{const q=b.byId.get(id),selected=Object.hasOwn(s.answers,id)?s.answers[id]:null;return{id,chapter:q.chapter,family:q.family,level:q.level,targetConceptIds:q.targetConceptIds||[],selected,correct:selected===q.correct,order:s.orders[id],question:clone(q)};});
 const correct=details.filter(x=>x.correct).length,elapsedSec=Math.min(3600,Math.round((now-s.startedAt)/1000)),unknown=details.filter(x=>x.selected===null).length;
 const result={id:s.id,bankVersion:s.bankVersion||data.version,form:s.form,firstAttempt:s.firstAttempt,correct,total:40,accuracy:correct*2.5,elapsedSec,unknown,startedAt:s.startedAt,finishedAt:now,chapters:summarizeChapter(details),details};
 st.sessions.push(result);st.active=null;return result;
}
function chapterTrend(sessions){
 const out={};for(const s of sessions)for(const [k,v] of Object.entries(s.chapters||{})){const x=out[k]||(out[k]={correct:0,total:0});x.correct+=v.correct;x.total+=v.total;}
 for(const x of Object.values(out))x.accuracy=x.total?Math.round(x.correct/x.total*1000)/10:0;return out;
}
function conceptStability(p){
 const first=firstSessions(p),map=new Map();
 for(const s of first)for(const d of s.details||[])for(const id of d.targetConceptIds||[]){
   const x=map.get(id)||{id,attempts:0,correct:0,history:[]};x.attempts++;if(d.correct)x.correct++;x.history.push(d.correct);map.set(id,x);
 }
 const repeated=[...map.values()].filter(x=>x.attempts>=2);
 const stable=repeated.filter(x=>x.history.slice(-2).every(Boolean));
 const unstable=repeated.filter(x=>x.history.includes(true)&&x.history.includes(false));
 const weak=repeated.filter(x=>x.history.slice(-2).every(v=>!v));
 return {tested:map.size,repeated:repeated.length,stable:stable.length,unstable:unstable.length,weak:weak.length,stabilityRate:repeated.length?Math.round(stable.length/repeated.length*1000)/10:null,items:[...map.values()]};
}
function readiness(p){
 const first=firstSessions(p),last3=first.slice(-3),chapters=chapterTrend(last3),stability=conceptStability(p);
 const chapterFloor=Object.keys(chapters).length>=5&&Object.values(chapters).every(x=>x.accuracy>=70);
 const stabilityOK=stability.repeated<10||stability.stabilityRate>=80;
 const stable80=last3.length===3&&last3.every(x=>x.correct>=32&&x.elapsedSec<=3600)&&chapterFloor&&stabilityOK;
 const avg3=last3.length?Math.round(last3.reduce((a,x)=>a+x.correct,0)/last3.length*10)/10:null;
 let label='校正中',description='まず本番形式の初回40問を積み上げます。';
 if(first.length>=3){
  if(stable80){label='本番80%圏・高信頼';description='直近3回すべて32/40以上、60分以内、主要5分野すべて70%以上です。公開過去問準拠の独自演習上では80%水準が安定しています。';}
  else if(avg3!==null&&avg3>=32){label='80%付近・安定性確認中';description='直近3回平均は32/40以上ですが、回ごとの安定性または分野別条件が未達です。';}
  else {label='弱点補強中';description='直近3回の平均または分野別得点が80%目標に届いていません。';}
 }
 return {label,description,firstCompleted:first.length,nextForm:nextForm(p),last3:last3.map(x=>x.correct),avg3,stable80,chapters,stability};
}
function accumulation(p){
 const b=state(p),first=firstSessions(p),uniqueBenchmark=first.length*40,stability=conceptStability(p);
 const legacy=Array.isArray(p.history)?p.history.length:0,course=Array.isArray(p.course?.history)?p.course.history.length:0,dojo=Array.isArray(p.dojo?.history)?p.dojo.history.length:0,applied=Array.isArray(p.appliedStudy?.history)?p.appliedStudy.history.filter(x=>x.observed!==false).length:0;
 const delayedTopics=new Set((p.appliedStudy?.history||[]).filter(x=>x.otherCaseAfterDelay&&x.correct&&x.confidence==='sure').map(x=>x.topicKey)).size;
 return {benchmarkQuestions:uniqueBenchmark,benchmarkForms:first.length,totalAnswers:legacy+course+dojo+applied+uniqueBenchmark,delayedTopics,stability};
}
function resultText(result){
 return [`JCSQE 本番校正演習 v14 / 第${result.form}回`,`${result.correct}/40 (${result.accuracy}%) / ${result.elapsedSec}秒 / ${result.firstAttempt?'初回':'再受験'}`,`未回答 ${result.unknown||0}問`].join('\n');
}
return {bank,state,start,active,view,answer,unknown,go,finish,firstSessions,nextForm,readiness,conceptStability,accumulation,resultText,letters};
});