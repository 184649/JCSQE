'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const E=require('../applied-engine.js');const data=require('../applied-bank.js');const B=E.bank(data);
const T=Date.parse('2026-10-04T09:00:00+09:00');
function rng(seed=1){let x=seed>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}
function profile(){return {name:'既存プロフィール',history:[{questionId:'E01Q01',correct:true}],sessions:[{id:'legacy-mock',correct:20}],bookmarks:['S7-001'],exposures:{E01Q01:1},activeSession:{id:'old-paused',questionIds:['E01Q01'],answers:{}},course:{history:[{old:true}]},dojo:{history:[{itemId:'DOJO-DEF-C001',correct:true}]}};}
function complete(p,now=T+10000,choice='correct'){let s=E.active(p);for(let i=0;i<s.questionIds.length;i++){if(i!==s.index)E.go(p,i,now+i*1000);const q=E.current(p).q;E.answer(p,choice==='correct'?q.correct:null,choice==='correct'?'sure':'unknown',now+i*1000+500);}return E.finish(p,now+s.questionIds.length*1000);}
test('v12 has 64 understanding-first tasks / 32 topics with distinction notes',()=>{
 assert.equal(B.questions.length,64);assert.equal(B.topics.length,32);assert.equal(B.chapters.length,5);
 const tasks=new Set();for(const q of B.questions){assert.match(q.id,/^A12-\d{3}$/);assert.equal(q.revision,2);assert.equal(q.hardness,'理解重視');assert(q.brief.length<=80);assert.equal(q.reasons.length,4);assert(q.reasons.every(x=>x.length>=8));assert(q.distinction.length>=30);assert(q.source.startsWith('https://www.juse.jp/'));assert(q.sourceNote);tasks.add(q.task);}
 assert(tasks.size>=12);for(const t of B.topics){const a=B.questions.filter(q=>q.topicKey===t);assert.equal(a.length,2);assert.notEqual(a[0].task,a[1].task);}
});
test('all numeric oracle expressions independently evaluated',()=>{
 const all=B.questions.filter(q=>q.calculation);assert(all.length>=9);
 for(const q of all){const c=q.calculation;assert(/^[\d.()+*/ -]+$/.test(c.expression));const n=Function('return ('+c.expression+')')();assert(Math.abs(n-c.value)<1e-9,q.id);}
});
test('no synthetic definition/pair/wrong generation and exact text repetition',()=>{
 const texts=B.questions.map(q=>q.text.normalize('NFKC').replace(/\s/g,''));assert.equal(new Set(texts).size,64);
 for(const q of B.questions)assert(!/^次の「用語/.test(q.text));
});
test('10-question sessions span topics without adjacent repeats in 300 seeds',()=>{
 for(let seed=1;seed<=300;seed++){const p=profile();const x=E.choose(B,p,{count:10},T,rng(seed));assert.equal(x.items.length,10);assert.equal(new Set(x.items.map(q=>q.topicKey)).size,10);assert.equal(new Set(x.items.map(q=>q.chapter)).size,5);}
});
test('40-question sessions: max 2 per theme, no adjacent repeats, shuffled order',()=>{
 let displays=[0,0,0,0];for(let seed=1;seed<=100;seed++){const p=profile();const {session:s}=E.createSession(B,p,{count:40,mode:'mixed',kind:'mock'},T,rng(seed));assert.equal(s.questionIds.length,40);const counts={};let prev;
 for(const id of s.questionIds){const q=s.snapshots[id];counts[q.topicKey]=(counts[q.topicKey]||0)+1;assert.notEqual(q.topicKey,prev);prev=q.topicKey;displays[s.orders[id].indexOf(q.correct)]++;}assert(Math.max(...Object.values(counts))<=2);}
 for(const n of displays)assert(n>850&&n<1150,displays.join(','));
});
test('one click commits once, order maps correctly, reveal occurs only afterwards',()=>{
 const p=profile();E.createSession(B,p,{count:3},T,rng(5));let v=E.view(p);assert.equal(v.revealed,false);assert(!('feedback'in v));assert(v.options.every(o=>!('correct'in o)));
 const q=E.current(p).q;assert(E.answer(p,q.correct,'sure',T+5000));assert(!E.answer(p,(q.correct+1)%4,'guess',T+7000));assert.equal(E.profile(p).history.length,1);
 v=E.view(p);assert(v.revealed);assert.equal(v.options.filter(o=>o.correct).length,1);assert(v.options.find(o=>o.correct).selected);assert.equal(E.profile(p).history[0].seconds,5);
});
test('original state fields and all other learning engines survive new sessions',()=>{
 const p=profile(),before=structuredClone(p);E.createSession(B,p,{count:5},T,rng(22));complete(p);const after={...p};delete after.appliedStudy;assert.deepEqual(after,before);assert.equal(p.appliedStudy.history.length,5);
});
test('snapshot and orders survive reload and source revision changes',()=>{
 const p=profile();const {session:s}=E.createSession(B,p,{count:5},T,rng(7));const first=E.view(p);E.pause(p,T+1000);const restored=JSON.parse(JSON.stringify(p));E.resume(restored,T+5000);assert.deepEqual(E.view(restored),first);assert.equal(E.active(restored).id,s.id);
 const id=E.current(restored).id;assert.equal(E.current(restored).q.text,s.snapshots[id].text);
 assert.throws(()=>E.createSession(B,restored,{count:5},T+7000),/途中/);
});
test('unshown allocations are not labelled first exposure at premature finish',()=>{
 const p=profile();E.createSession(B,p,{count:5},T,rng(9));assert.equal(Object.keys(E.profile(p).exposures).length,1);const r=E.finish(p,T+1000);assert.equal(r.details.filter(x=>x.observed).length,1);assert.equal(r.details.filter(x=>x.firstExposure).length,1);assert(r.details.slice(1).every(x=>!x.observed));
});
test('weak topic: two days later chooses different unseen task, same-day not delayed',()=>{
 const p=profile();E.createSession(B,p,{count:1,topic:'fmea-fta'},T,rng(2));const q=E.current(p).q;E.answer(p,(q.correct+1)%4,'sure',T+5000);E.finish(p,T+6000);
 assert.equal(E.choose(B,p,{mode:'due',count:1},T+E.DAY,rng(1)).items.length,0);
 const x=E.choose(B,p,{mode:'due',count:1},T+2*E.DAY+7000,rng(3));assert.equal(x.items[0].topicKey,q.topicKey);assert.notEqual(x.items[0].id,q.id);
 E.createSession(B,p,{mode:'due',count:1},T+2*E.DAY+7000,rng(3));complete(p,T+2*E.DAY+9000);assert(E.profile(p).history.at(-1).otherCaseAfterDelay);
});
test('delayed concept evidence excludes same case repetition and same-day correction',()=>{
 const p=profile(),a=E.profile(p),qs=B.questions.filter(q=>q.topicKey==='gqm');
 const rec=(q,at,correct=true,confidence='sure')=>({questionId:q.id,topicKey:q.topicKey,at,correct,confidence});
 a.history.push(rec(qs[0],T),rec(qs[1],T+10000));assert(!E.topicStatus(B,p,T).get('gqm').confirmedAcrossCases);
 a.history.push(rec(qs[0],T+3*E.DAY));assert(!E.topicStatus(B,p,T).get('gqm').confirmedAcrossCases);
 a.history.push(rec(qs[1],T+4*E.DAY));assert(E.topicStatus(B,p,T).get('gqm').confirmedAcrossCases);
 a.history.push(rec(qs[0],T+5*E.DAY,false));assert(!E.topicStatus(B,p,T).get('gqm').confirmedAcrossCases);
});
test('smart practice avoids just answered themes when alternatives exist',()=>{
 const p=profile();E.createSession(B,p,{count:10},T,rng(30));const first=new Set(E.active(p).questionIds.map(id=>E.active(p).snapshots[id].topicKey));complete(p);
 const second=E.choose(B,p,{count:10,mode:'smart'},T+30000,rng(31));assert(second.items.every(q=>!first.has(q.topicKey)));
});
test('initial vs repeat stats do not use previous bank scores',()=>{
 const p=profile();assert.equal(E.stats(B,p,T).first.total,0);E.createSession(B,p,{count:1,topic:'vv'},T,rng(6));const q=E.current(p).q;complete(p);assert.equal(E.stats(B,p,T).first.total,1);
 E.profile(p).bookmarks=[q.id];E.createSession(B,p,{count:1,mode:'bookmarks'},T+30000,rng(6));complete(p,T+40000);assert.equal(E.stats(B,p,T).repeat.total,1);
});
test('v11 history is preserved but does not inflate v12 first/repeat/due statistics',()=>{
 const p=profile(),a=E.profile(p);
 a.history.push({questionId:'A11-001',topicKey:'vv',correct:false,confidence:'sure',observed:true,firstExposure:true,at:T-10*E.DAY});
 a.exposures['A11-001']=T-10*E.DAY;
 const st=E.stats(B,p,T);
 assert.equal(st.first.total,0);assert.equal(st.repeat.total,0);assert.equal(st.newCount,64);assert.equal(st.dueTopics,0);assert.equal(st.weakTopics,0);
});

test('new mock refuses to repeat after 40 seen; mixed remains available',()=>{
 const p=profile();E.createSession(B,p,{count:40,kind:'mock',mode:'new'},T,rng(44));complete(p);assert.equal(E.stats(B,p,T).newCount,24);
 let x=E.createSession(B,p,{count:40,kind:'mock',mode:'new'},T+500000,rng(4));assert.equal(x.session,null);assert.match(x.warning,/24問/);
 x=E.createSession(B,p,{count:40,kind:'mock',mode:'mixed'},T+500001,rng(5));assert.equal(x.session.questionIds.length,40);
});
test('mock keeps correctness hidden through answering, jumping and paused reload',()=>{
 const p=profile();E.createSession(B,p,{count:40,kind:'mock',mode:'new'},T,rng(3));E.answer(p,E.current(p).q.correct,'guess',T+5000);assert.equal(E.profile(p).history.length,0);let v=E.view(p);assert(!v.revealed);assert(!v.feedback);assert(v.options.every(o=>!('correct'in o)));
 E.go(p,2,T+6000);E.go(p,0,T+7000);v=E.view(p);assert(!v.feedback);assert.equal(v.confidence,'guess');E.pause(p,T+8000);E.resume(p,T+600000);assert(!E.view(p).revealed);
 const r=E.finish(p,T+600001);assert.equal(r.details.length,40);assert.equal(r.correct,1);
});
test('60-minute deadline includes paused time; late answer rejected',()=>{
 const p=profile();E.createSession(B,p,{count:40,kind:'mock'},T,rng(9));E.pause(p,T+1000);E.resume(p,T+60*60000);assert.equal(E.answer(p,E.current(p).q.correct,'sure',T+60*60000+1),false);
 const r=E.finish(p,T+60*60000+2);assert.equal(r.correct,0);assert(r.elapsedSec>=3600);
});
test('reading explanations is excluded from practice answer timer after resume',()=>{
 const p=profile();E.createSession(B,p,{count:1},T,rng(5));E.answer(p,E.current(p).q.correct,'sure',T+2000);E.pause(p,T+5000);E.resume(p,T+8000);const r=E.finish(p,T+40000);assert.equal(r.elapsedSec,2);
});
test('invalid choice/confidence and invalid bank are rejected',()=>{
 const p=profile();E.createSession(B,p,{count:1},T);assert.throws(()=>E.answer(p,4,'sure',T+1));assert.throws(()=>E.answer(p,0,'pretend',T+1));assert.throws(()=>E.bank([...data.questions,data.questions[0]]));
});
test('copying a selected past result is read-only',()=>{
 const p=profile();E.createSession(B,p,{count:1},T,rng(1));const r=complete(p);E.createSession(B,p,{count:1},T+50000,rng(2));complete(p,T+60000);const old=JSON.stringify(p);assert(E.resultText(p,r).includes(r.id));assert.equal(JSON.stringify(p),old);
});
test('new launcher retains legacy script URLs and scoped offline pages',()=>{
 const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const name of ['questions.js?v=4','supplement.js?v=7','syllabus-course.js?v=9','course-engine.js?v=9','dojo-engine.js?v=9','study-core.js?v=9','study-app.js?v=10.1','applied-entry.js?v=12.1'])assert(html.includes(name));
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert(sw.includes("url.pathname.endsWith('/practice.html')?'./practice.html':'./index.html'"));assert(sw.includes("key.startsWith('jcsqe-shokyu-')"));
  assert(html.includes('study.css?v=10.2'));
  const practice=fs.readFileSync(path.join(root,'practice.html'),'utf8');assert(practice.includes('applied-hard-overrides.js?v=12.0'));assert(practice.includes('applied-bank.js?v=12.0'));assert(practice.includes('applied-explanation-guide.js?v=12.1'));assert(practice.includes('applied-ui.js?v=12.1'));
  const entry=fs.readFileSync(path.join(root,'applied-entry.js'),'utf8');assert(entry.includes('data-applied-plan-date'));assert(entry.includes('未実施・開始'));
  const ui=fs.readFileSync(path.join(root,'applied-ui.js'),'utf8');assert(ui.includes('data-plan-date'));assert(ui.includes('plannedDate'));assert(ui.includes('あなたの選択肢が誤りになる決定的理由'));assert(ui.includes('正解との直接比較'));assert(ui.includes('4択を同じ基準で検証'));
});


test('explanation guide covers all v12 topics with a rule and decision steps',()=>{
 const G=require('../applied-explanation-guide.js');
 for(const topic of B.topics){assert(G[topic],topic);assert(G[topic].rule.length>=30,topic);assert(G[topic].trap.length>=20,topic);assert(Array.isArray(G[topic].steps));assert(G[topic].steps.length>=3,topic);}
});

test('unshown questions stay new and do not pollute repeat, weak, or delayed statistics',()=>{
 const p=profile();E.createSession(B,p,{count:5},T,rng(9));const shown=E.current(p).q;E.finish(p,T+1000);
 const st=E.stats(B,p,T+1001);assert.equal(st.newCount,63);assert.equal(st.answered,1);assert.equal(st.first.total,1);assert.equal(st.repeat.total,0);
 assert.equal(st.weakTopics,1);assert.equal(E.latest(p).size,1);
 const unshown=B.questions.find(q=>E.profile(p).history.some(h=>h.questionId===q.id&&!h.observed));
 const x=E.choose(B,p,{mode:'new',topic:unshown.topicKey,count:2},T+1002,rng(2));assert(x.items.some(q=>q.id===unshown.id));
 assert(E.resultText(p).includes('未表示・未回答'));assert.equal(E.topicStatus(B,p).get(shown.topicKey).weak,true);
});
