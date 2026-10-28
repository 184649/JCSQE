/* New tasks use their authored per-option explanations, never heuristics meant for old numeric examples. */
(()=>{'use strict';
const K=window.JCSQEKeywords,T=window.JCSQETextbook;
const isNew=q=>/^H16-\d{3}$/.test(q?.id||'')&&Array.isArray(q.advancedNotes);
if(K){const previous=K.notes;K.notes=(q,i)=>isNew(q)?[q.advancedNotes[i],'今回の判断：'+q.answerReason]:previous(q,i);}
if(T){
 const previousLesson=T.lesson,previousCore=T.coreExplanation;
 const term=x=>{const at=x.indexOf('：');return{term:at<0?'確認する概念':x.slice(0,at),definition:at<0?x:x.slice(at+1)};};
 T.lesson=q=>{if(!isNew(q))return previousLesson(q);const related=q.advancedNotes.map(x=>({...term(x),level:q.level,syllabus:q.syllabus}));return {
  targets:[related[q.correct]],related,chapter:{overview:'設問の前提・目的を確認し、選択肢にある概念を比較します。',exam:'条件と定義の対応を説明できるか確認してください。'},
  family:{overview:q.answerReason,trap:'強化問題の難度は独自設定です。シラバスの知識レベルとは別に扱います。'},
  type:{title:q.format,steps:[q.answerReason]},syllabus:q.syllabus,level:q.level,source:q.source};};
 T.coreExplanation=(q,selected)=>{if(!isNew(q))return previousCore(q,selected);const note=Number.isInteger(selected)?q.advancedNotes[selected]:'';return{
  rule:q.answerReason,clue:q.text.split('\n')[0],path:q.answerReason.split('。').map(x=>x.trim()).filter(Boolean).map(x=>x+'。'),
  whyCorrect:q.advancedNotes[q.correct],whySelectedWrong:note,repair:'問題文の条件と各選択肢の正しい意味を照合してください。',
  boundary:q.advancedNotes.filter((_,i)=>i!==q.correct).join('\n'),memory:q.answerReason};};
}
})();
