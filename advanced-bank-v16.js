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
 '4.1':['https://www.iso.org/standard/77520.html'],
 '4.2':['https://webstore.iec.ch/en/publication/5517'],
 '4.3':['https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats'],
 '4.4':['https://csrc.nist.gov/pubs/sp/800/226/final','https://csrc.nist.gov/glossary/term/k_anonymity','https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/'],
 '5.1':['https://airc.nist.gov/airmf-resources/airmf/5-sec-core/'],
 '5.2':['https://www.rfc-editor.org/info/rfc7252/'],
 '5.4':['https://csrc.nist.gov/pubs/sp/800/145/final'],
 '5.5':['https://scvs.owasp.org/scvs/using-scvs/','https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html']
};
// Authored editorial refinements after the first content check. These do not generate extra questions.
const editorial={
 'H16-112':{options:{1:'X＝Validation、Y＝Validation',2:'X＝Verification、Y＝Verification'}},
 'H16-231':{solution:'レベルは対象範囲、タイプは評価目的、技法はケースの導出方法という別の軸で整理する。'},
 'H16-334':{notes:{2:'境界の内側：x=11ではx>=10とx>10が両方とも真になるため、演算子の違いを検出できない。'}},
 'H16-337':{solution:'テスト環境とデータの管理も自動化品質の一部である。前のテストの残存状態へ依存せず、各ケースの前提を再現可能にする。'},
 'H16-342':{notes:{2:'予測と観測：モデルによる推定値と、実際に検出・確認した実測値は区別して報告する。'}},
 'H16-352':{notes:{2:'因子分析：多数の観測変数の相関を説明する共通の潜在因子を調べる。二つのカテゴリの度数表の独立性検定とは異なる。'}},
 'H16-354':{notes:{2:'ヒストグラム：数値を区間に分けて度数分布を示す図。計画中の不測事態と対応策の検討図ではない。'}},
 'H16-356':{notes:{1:'判別分析：既知のグループを分ける規則を求め、対象の所属を判定する方法。指標の次元を縮約する目的とは異なる。'}},
 'H16-357':{solution:'バックアップを保存できたことと、そのデータから必要な状態へ戻せることは別に確認する。復元結果と復旧時間を目標へ照合する。'},
 'H16-413':{notes:{2:'同値類の下限：最大グループが5人でも、2人のグループがあれば全グループが5人以上という条件は満たさない。'}},
 'H16-505':{solution:'試行での成功と本番での継続的な品質を分ける。地域・季節・利用者の違いを反映した評価と、運用後の監視・責任分担が必要である。'},
 'H16-510':{solution:'大量機器では版や適用状況を追跡し、更新失敗、未更新の残存リスク、保守終了後の扱いまで含めて管理する。'},
 'H16-512':{solution:'適応性と品質の統制を両立する。短い反復で要求と品質の証拠を確認し、必要な合意や記録も更新して次の計画へ反映する。'},
 'H16-515':{notes:{1:'モデル検査：形式モデル上の状態と遷移を調べ、指定した性質を検証する。本番利用者の一部への先行展開とは異なる。'}},
 'H16-517':{solution:'SLAの数値の大きさだけでなく、保証対象の範囲と測定条件を読む。基盤の契約と、依存先を含むサービス全体の品質を区別する。'},
 'H16-521':{solution:'権利条件、利用目的への適合、保守の継続性を分けて確認する。ソース公開や無償という事実だけから品質の保証を導かない。'},
 'H16-522':{solution:'部品名だけでなく版、利用箇所、直接・間接の依存関係まで追跡することで、公表された問題の影響範囲を調べやすくする。'},
 'H16-523':{notes:{3:'ソフトウェア規模：コード行数などで実装量を測る指標。コード量の多さだけで品質や保守の継続性は判断できない。'}}
};
const ids=new Set(),stems=new Set();
const questions=rows.map(row=>{
 const [id,refs,format,text,originalChoices,correct,originalSolution]=row,fix=editorial[id]||{};
 const choices=originalChoices.map((choice,i)=>[fix.options?.[i]??choice[0],fix.notes?.[i]??choice[1]]),solution=fix.solution??originalSolution;
 const syllabusIds=refs.split(/\s+/),units=syllabusIds.map(x=>scope.byId.get(x));
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
