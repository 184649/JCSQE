'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
global.window={};require('../syllabus-course.js');
const concepts=global.window.JCSQE_SYLLABUS_CONCEPTS;
const raw=require('../benchmark-bank.js').build(concepts);
const T=require('../textbook-v15.js')(concepts);

test('every v15 question has a textbook lesson with chapter, family and solving steps',()=>{
 for(const q of raw.questions){
  const l=T.lesson(q);
  assert(l.chapter?.overview?.length>20,q.id);
  assert(l.family?.overview?.length>20,q.id+' '+q.family);
  assert(l.type?.steps?.length>=3,q.id);
  assert(l.type.tip?.length>10,q.id);
  assert(l.source.includes('juse.jp'),q.id);
 }
});
test('every question family has a dedicated textbook guide',()=>{
 const families=[...new Set(raw.questions.map(q=>q.family))];
 for(const f of families)assert(T.familyGuides[f],f);
});
test('scenario selection explains each displayed option with its actual concept definition',()=>{
 for(const q of raw.questions.filter(x=>x.type==='scenario-selection')){
  for(let i=0;i<4;i++){
   const concept=T.optionConcept(q,i);
   assert(concept,q.id+' '+i);
   assert.equal(concept.term,q.options[i],q.id+' '+i);
   const note=T.optionNote(q,i).join(' ');
   assert(note.includes(concept.definition),q.id+' '+i);
  }
 }
});
test('multi-blank wrong answers name the incorrect slots instead of saying only that the answer is wrong',()=>{
 for(const q of raw.questions.filter(x=>x.type==='multi-blank')){
  for(let i=0;i<4;i++){
   const note=T.optionNote(q,i).join(' ');
   assert(note.length>40,q.id+' '+i);
   if(i!==q.correct)assert(/（[1-4]）/.test(note),q.id+' '+i);
  }
 }
});
test('practice and benchmark UIs render textbook sections',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
 const practice=fs.readFileSync(path.join(root,'applied-ui.js'),'utf8');
 const benchmark=fs.readFileSync(path.join(root,'benchmark-ui.js'),'utf8');
 const phtml=fs.readFileSync(path.join(root,'practice.html'),'utf8');
 const bhtml=fs.readFileSync(path.join(root,'benchmark.html'),'utf8');
 for(const heading of ['1. まず、この分野を理解する','5. 似た概念を表で整理する','6. 4択を1つずつ検証する','8. この問題から持ち帰ること'])assert(practice.includes(heading),heading);
 for(const heading of ['1. 分野の全体像','5. 似た概念との比較','6. 4択を1つずつ検証','8. 覚える要点'])assert(benchmark.includes(heading),heading);
 assert(phtml.includes('textbook-v15.js?v=15.2'));
 assert(bhtml.includes('textbook-v15.js?v=15.2'));
});
