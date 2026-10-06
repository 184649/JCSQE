'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
global.window={};require('../syllabus-course.js');
const raw=require('../benchmark-bank.js').build(global.window.JCSQE_SYLLABUS_CONCEPTS);
const E=require('../benchmark-engine.js'),B=E.bank(raw);
delete global.window;
const T=Date.parse('2026-10-06T09:00:00+09:00');
function rng(seed=1){let x=seed>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}
function p(){return {name:'fixture',history:[],sessions:[],bookmarks:[],exposures:{},appliedStudy:{schema:11,history:[],sessions:[],exposures:{},bookmarks:[],active:null,serial:0}};}
function completeForm(profile,form,score=40,now=T+form*100000){
 E.start(B,profile,form,now,rng(form));
 const s=E.active(profile);
 for(let i=0;i<40;i++){E.go(profile,i);const q=B.byId.get(s.ids[i]);const answer=i<score?q.correct:(q.correct+1)%4;E.answer(profile,answer,'sure',now+1000+i*100);}
 return E.finish(B,profile,now+50000);
}
test('benchmark bank has exactly 10 disjoint 40-question forms / 400 questions',()=>{
 assert.equal(B.questions.length,400);assert.equal(B.formSets.length,10);
 assert.equal(new Set(B.questions.map(q=>q.id)).size,400);
 const used=B.formSets.flatMap(x=>x.ids);assert.equal(used.length,400);assert.equal(new Set(used).size,400);
 for(const f of B.formSets){assert.equal(f.ids.length,40);const qs=f.ids.map(id=>B.byId.get(id));assert.equal(new Set(qs.map(q=>q.chapter)).size,5);assert.deepEqual(new Set(qs.map(q=>q.level)),new Set(['L1','L2','L3']));}
});
test('every benchmark item has four unique options and explicit explanations',()=>{
 for(const q of B.questions){assert.equal(q.options.length,4,q.id);assert.equal(new Set(q.options).size,4,q.id);assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4,q.id);assert.equal(q.reasons.length,4,q.id);assert(q.reasons.every(x=>x.length>=4),q.id);assert(q.brief&&q.detail,q.id);}
});
test('bank construction includes 170 contrast, 170 mismatch and 60 applied items',()=>{
 const c={};for(const q of B.questions)c[q.type]=(c[q.type]||0)+1;assert.deepEqual(c,{contrast:170,mismatch:170,applied:60});
});
test('official calibration metadata is explicit and never claims a score guarantee',()=>{
 assert.equal(B.calibration.officialExam.questions,40);assert.equal(B.calibration.officialExam.minutes,60);
 assert.match(B.calibration.label,/公式公開問題準拠/);assert.match(B.calibration.note,/保証ではない/);assert(B.calibration.anchors.length>=4);
});
test('mock hides correctness until finish and allows answer changes',()=>{
 const profile=p();E.start(B,profile,1,T,rng(1));let v=E.view(B,profile,T+1000);
 assert(!('correct' in v.options[0]));const q=B.byId.get(v.id);E.answer(profile,(q.correct+1)%4,'guess',T+2000);E.answer(profile,q.correct,'sure',T+3000);v=E.view(B,profile,T+3000);assert(v.answered);assert.equal(v.confidence,'sure');
 const r=E.finish(B,profile,T+4000);assert.equal(r.total,40);assert.equal(r.correct,1);assert.equal(r.details.length,40);
});
test('first attempts and retakes are separated',()=>{
 const profile=p();const first=completeForm(profile,1,40,T+10000);assert(first.firstAttempt);
 const second=completeForm(profile,1,40,T+100000);assert.equal(second.firstAttempt,false);
 assert.equal(E.firstSessions(profile).length,1);assert.equal(E.nextForm(profile),2);
});
test('readiness requires three consecutive >=32 plus five-chapter floor',()=>{
 const profile=p();completeForm(profile,1,40,T+10000);completeForm(profile,2,40,T+100000);completeForm(profile,3,40,T+200000);
 const r=E.readiness(profile);assert.equal(r.stable80,true);assert.equal(r.label,'本番80%圏・高信頼');assert.deepEqual(r.last3,[40,40,40]);
 const profile2=p();completeForm(profile2,1,40,T+10000);completeForm(profile2,2,31,T+100000);completeForm(profile2,3,40,T+200000);
 assert.equal(E.readiness(profile2).stable80,false);
});
test('accumulation reports benchmark progress separately from other histories',()=>{
 const profile=p();profile.history=[{},{}];profile.course={history:[{}]};profile.dojo={history:[{},{}]};profile.appliedStudy.history=[{observed:true,otherCaseAfterDelay:true,correct:true,confidence:'sure',topicKey:'vv'}];
 completeForm(profile,1,40,T+10000);
 const a=E.accumulation(profile);assert.equal(a.benchmarkForms,1);assert.equal(a.benchmarkQuestions,40);assert.equal(a.totalAnswers,46);assert.equal(a.delayedTopics,1);
});
