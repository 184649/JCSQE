/* Distinct authored v16 tasks. No source-bank edits, counters, storage writes or automatic question multiplication. */
(function(root,f){
 if(typeof module==='object'&&module.exports)module.exports=f;
 else root.JCSQEAdvancedBank=f(root.JCSQEAdvancedScope,(root.JCSQEAdvancedParts||[]).flat());
})(typeof window!=='undefined'?window:globalThis,function(scope,rows){
'use strict';
if(!scope?.byId||!Array.isArray(rows)||!rows.length)throw Error('強化教材を読み込めません。');
const sources={
 '1.3.4':['https://www.nasa.gov/reference/5-3-product-verification/','https://www.nasa.gov/reference/5-4-product-validation/'],
 '2.7':['https://laws.e-gov.go.jp/law/345AC0000000048','https://laws.e-gov.go.jp/law/406AC0000000085'],
 '3.5.1':['https://www.sei.cmu.edu/library/the-architecture-tradeoff-analysis-method/'],
 '3.7.3':['https://asq.org/quality-resources/fmea','https://webstore.iec.ch/en/publication/4311'],
 '3.8':['https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf'],
 '3.9.4':['https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc33.htm','https://asq.org/quality-resources/seven-basic-quality-tools','https://asq.org/quality-resources/new-management-planning-tools'],
 '4.1':['https://www.nist.gov/itl/iad/human-centered-technologies/human-factors-human-centered-design'],
 '4.2':['https://webstore.iec.ch/en/publication/5517'],
 '4.3':['https://www.microsoft.com/en-us/securityengineering/sdl/practices/secure-by-design'],
 '4.4':['https://csrc.nist.gov/pubs/sp/800/226/final','https://csrc.nist.gov/glossary/term/k_anonymity','https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/'],
 '5.1':['https://airc.nist.gov/airmf-resources/airmf/5-sec-core/'],
 '5.2':['https://www.rfc-editor.org/info/rfc7252/'],
 '5.4':['https://csrc.nist.gov/pubs/sp/800/145/final'],
 '5.5':['https://scvs.owasp.org/scvs/using-scvs/','https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html']
};
const ids=new Set(),stems=new Set();
const questions=rows.map(row=>{
 const [id,refs,format,text,choices,correct,solution]=row,syllabusIds=refs.split(/\s+/),units=syllabusIds.map(x=>scope.byId.get(x));
 if(ids.has(id)||stems.has(text)||!/^H16-\d{3}$/.test(id)||units.some(x=>!x)||choices.length!==4||new Set(choices.map(x=>x[0])).size!==4||!Number.isInteger(correct)||correct<0||correct>3||!solution||choices.some(x=>x.length!==2||!x[0]||!x[1]))throw Error('強化問題の形式不正: '+id);
 ids.add(id);stems.add(text);
 const unit=units[0],references=[...new Set(syllabusIds.flatMap(s=>Object.entries(sources).filter(([k])=>s===k||s.startsWith(k+'.')).flatMap(([,v])=>v)))];
 return {id,revision:16,chapter:unit.chapter,topicKey:'H16:'+unit.id,topic:unit.id+' '+unit.title,family:unit.title,
  task:format,type:'advanced-authored',format,difficulty:'強化',level:unit.level,
  text,options:choices.map(x=>x[0]),correct,reasons:choices.map(x=>x[1]),advancedNotes:choices.map(x=>x[1]),
  answerReason:solution,brief:solution,detail:solution,explanation:solution,distinction:solution,
  syllabus:syllabusIds.join(' / '),syllabusIds,syllabusPages:units.map(x=>x.page),
  source:scope.source,sourceType:'独自作成・強化問題',sourceNote:'公式シラバスの範囲を基準とした独自問題。本番・市販問題集と同じ難易度を実測したものではありません。',
  references,targetConceptIds:[],optionConceptIds:[]};
});
const byId=new Map(questions.map(q=>[q.id,q]));
function relates(q,id){return q.syllabusIds.some(s=>s===id||s.startsWith(id+'.'));}
function scoped(id){if(!id)return questions.slice();if(!scope.byId.has(id))throw Error('存在しないシラバス項目です。');return questions.filter(q=>relates(q,id));}
function coverage(profile={}){
 const latest=new Map(),history=Array.isArray(profile.appliedStudy?.history)?profile.appliedStudy.history:[];
 for(const h of history){if(!byId.has(h.questionId)||h.observed===false||typeof h.correct!=='boolean')continue;const old=latest.get(h.questionId);if(!old||Number(h.at||0)>=Number(old.at||0))latest.set(h.questionId,h);}
 const units=scope.units.map(u=>{const qs=scoped(u.id),answered=qs.filter(q=>latest.has(q.id)),correct=answered.filter(q=>latest.get(q.id).correct).length;return{...u,total:qs.length,answered:answered.length,correct,needs:answered.length-correct,status:!qs.length?'問題未配置':!answered.length?'未回答':answered.length<qs.length?'学習途中':correct<qs.length?'要復習':'一巡正解'};});
 return {units,totalUnits:units.length,coveredUnits:units.filter(u=>u.total>0).length,leafUnits:units.filter(u=>u.leaf).length,coveredLeaves:units.filter(u=>u.leaf&&u.total>0).length,
   questionCount:questions.length,answered:latest.size,correct:[...latest.values()].filter(h=>h.correct).length,
   notice:scope.notice};
}
return {version:'16.0',questions,byId,scope,relates,scoped,coverage,sourceType:'独自作成・強化問題',coverageNote:'項目対応と学習実績を分けて表示します。'};
});
