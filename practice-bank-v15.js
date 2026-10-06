/* v15.1 continuous-practice adapter.
   Reuses the 400-question v15 benchmark bank for ordinary dojo-style practice. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory;
  else root.JCSQEPracticeBank=factory(root.JCSQEBenchmarkBank,root.JCSQE_SYLLABUS_CONCEPTS||[]);
})(typeof window!=='undefined'?window:globalThis,function(raw,concepts){
'use strict';
if(!raw||!Array.isArray(raw.questions)||raw.questions.length!==400) throw new Error('v15演習問題400問を確認できません。');
const byConcept=new Map((concepts||[]).map(x=>[x.id,x]));
const source='https://www.juse.jp/jcsqe/content/jcsqe_beginner_syllabus_ver_3_0.pdf';
const questions=raw.questions.map(q=>{
  const cid=(q.targetConceptIds||[])[0]||(q.optionConceptIds||[])[0]||q.family;
  const concept=byConcept.get(cid);
  return {
    ...q,
    topicKey:String(cid),
    topic:concept?.term||q.family||q.chapter,
    task:q.type||'practice',
    revision:15,
    source,
    sourceType:'独自作成・公式公開過去問形式準拠',
    sourceNote:'公式公開問題の出題形式・選択肢設計を参考にした独自問題。公式問題そのものではありません。',
    distinction:q.detail
  };
});
return {
  version:'15.1',
  sourceType:'独自作成・公式公開過去問形式準拠',
  coverageNote:'400問。通常演習では重複を避けて連続出題し、一巡後は次の周へ進みます。',
  questions
};
});