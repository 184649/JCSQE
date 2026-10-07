'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
global.window={};require('../syllabus-course.js');
const rawBenchmark=require('../benchmark-bank.js').build(global.window.JCSQE_SYLLABUS_CONCEPTS);
const adapt=require('../practice-bank-v15.js');
const E=require('../applied-engine.js');
const B=E.bank(adapt(rawBenchmark,global.window.JCSQE_SYLLABUS_CONCEPTS));
delete global.window;
const T=Date.parse('2026-10-07T08:00:00+09:00');
function rng(seed=1){let x=seed>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}
function profile(){return {name:'fixture',history:[],sessions:[],bookmarks:[],exposures:{}};}
test('continuous practice adapts the full v15 400-question bank',()=>{
 assert.equal(B.questions.length,400);
 assert.equal(new Set(B.questions.map(q=>q.id)).size,400);
 assert(B.topics.length>169);
 assert.equal(B.chapters.length,5);
 for(const q of B.questions){assert.match(q.id,/^B15-\d{3}$/);assert(q.topicKey);assert(q.task);assert.equal(q.options.length,4);assert.equal(q.reasons.length,4);}
});
test('continuous practice starts with one question and appends without repeats',()=>{
 const p=profile();const s=E.createSession(B,p,{count:1,mode:'smart',kind:'practice',continuous:true},T,rng(5)).session;
 assert(s);assert.equal(s.questionIds.length,1);assert.equal(s.continuous,true);
 for(let i=0;i<60;i++){
  const cur=E.current(p),q=cur.q;E.answer(p,q.correct,'sure',T+100+i*1000);
  if(i<59){const n=E.continuePractice(B,p,T+200+i*1000,rng(100+i));assert(n.session);}
 }
 const ids=E.active(p).questionIds;
 assert.equal(ids.length,60);
 assert.equal(new Set(ids).size,60);
});
test('the first continuous cycle can cover all 400 unique questions before repeating',()=>{
 const p=profile();E.createSession(B,p,{count:1,mode:'smart',kind:'practice',continuous:true},T,rng(2));
 for(let i=0;i<400;i++){
  const {q}=E.current(p);E.answer(p,q.correct,'sure',T+i*1000);
  if(i<399)E.continuePractice(B,p,T+i*1000+100,rng(i+20));
 }
 const s=E.active(p);assert.equal(s.questionIds.length,400);assert.equal(new Set(s.questionIds).size,400);
 const next=E.continuePractice(B,p,T+401000,rng(999));
 assert(next.session);assert.equal(next.rolled,true);assert.equal(E.profile(p).sessions.length,1);
 assert.equal(E.active(p).questionIds.length,1);
});
test('new-only mode never silently uses answered questions',()=>{
 const p=profile();E.createSession(B,p,{count:1,mode:'new',kind:'practice',continuous:true},T,rng(3));
 for(let i=0;i<20;i++){
  const {q}=E.current(p);E.answer(p,q.correct,'sure',T+i*1000);
  if(i<19)E.continuePractice(B,p,T+i*1000+100,rng(30+i));
 }
 assert.equal(new Set(E.active(p).questionIds).size,20);
 assert(E.active(p).questionIds.every(id=>/^B15-/.test(id)));
});
test('practice UI exposes one start action and no count selector',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
 const ui=fs.readFileSync(path.join(root,'applied-ui.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'practice.html'),'utf8');
 assert(ui.includes("start-continuous"));
 assert(!ui.includes('data-count='));
 assert(!ui.includes('[3,5,10]'));
 assert(html.includes('practice-bank-v15.js?v=15.1'));
 assert(html.includes('benchmark-bank.js?v=15.2'));
});
