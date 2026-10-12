'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
global.window={};require('../syllabus-course.js');
const concepts=global.window.JCSQE_SYLLABUS_CONCEPTS;
const raw=require('../benchmark-bank.js').build(concepts);
const T=require('../textbook-v15.js')(concepts);

test('every v15 question has a non-generic core explanation',()=>{
  for(const q of raw.questions){
    const wrong=[0,1,2,3].find(i=>i!==q.correct);
    const x=T.coreExplanation(q,wrong);
    assert(x.rule.length>=20,q.id+' rule');
    assert(x.clue.length>=3,q.id+' clue');
    assert(Array.isArray(x.path)&&x.path.length>=3,q.id+' path');
    assert(x.whyCorrect.length>=15,q.id+' whyCorrect');
    assert(x.whySelectedWrong.length>=15,q.id+' whyWrong');
    assert(x.repair.length>=15,q.id+' repair');
    assert(x.boundary.length>=10,q.id+' boundary');
    assert(x.memory.length>=5,q.id+' memory');
  }
});

test('scenario explanations contrast the chosen concept with the target concept',()=>{
  for(const q of raw.questions.filter(q=>q.type==='scenario-selection')){
    const wrong=[0,1,2,3].find(i=>i!==q.correct);
    const x=T.coreExplanation(q,wrong);
    const selected=T.optionConcept(q,wrong),target=T.lesson(q).targets[0];
    assert(selected&&target,q.id);
    assert(x.whySelectedWrong.includes(selected.term),q.id);
    assert(x.whySelectedWrong.includes(target.definition),q.id);
    assert(x.repair.includes(selected.definition),q.id);
  }
});

test('multi-blank explanations identify concrete wrong slots',()=>{
  for(const q of raw.questions.filter(q=>q.type==='multi-blank')){
    const wrong=[0,1,2,3].find(i=>i!==q.correct);
    const x=T.coreExplanation(q,wrong);
    assert(/（[1-4]）/.test(x.whySelectedWrong),q.id);
    assert(/→/.test(x.repair),q.id);
  }
});

test('same-topic explanations return to the authoritative definition',()=>{
  for(const q of raw.questions.filter(q=>q.type==='same-topic-statement')){
    const wrong=[0,1,2,3].find(i=>i!==q.correct);
    const target=T.lesson(q).targets[0],x=T.coreExplanation(q,wrong);
    assert(target,q.id);
    assert(x.rule.includes(target.term),q.id);
    assert(x.repair.includes(target.definition),q.id);
    assert(x.whySelectedWrong.includes(q.reasons[wrong]),q.id);
  }
});

test('applied explanations name both the wrong mechanism and the correct one',()=>{
  for(const q of raw.questions.filter(q=>q.type==='applied')){
    const wrong=[0,1,2,3].find(i=>i!==q.correct);
    const x=T.coreExplanation(q,wrong);
    assert(x.whySelectedWrong.includes(q.reasons[wrong]),q.id);
    assert(x.whyCorrect.includes(q.reasons[q.correct]),q.id);
    assert(x.repair.includes(q.options[q.correct]),q.id);
  }
});
