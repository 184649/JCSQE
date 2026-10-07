/* v15 benchmark bank.
   Uses the 170 syllabus checkpoints already bundled with this site.
   Official public questions are used only as difficulty/style anchors; no official question text is copied. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports={build:factory};
 else root.JCSQEBenchmarkBank=factory(root.JCSQE_SYLLABUS_CONCEPTS||[]);
})(typeof window!=='undefined'?window:globalThis,function(concepts){
'use strict';
const rows=(concepts||[]).map(x=>({...x}));
if(rows.length!==170)throw new Error('benchmark: syllabus checkpoints must be 170');
let serial=1;const qs=[],id=()=>`B15-${String(serial++).padStart(3,'0')}`;
const peers=q=>{
 const fam=rows.filter(x=>x.id!==q.id&&x.family===q.family);
 const chap=rows.filter(x=>x.id!==q.id&&x.chapter===q.chapter&&!fam.some(y=>y.id===x.id));
 return [...fam,...chap];
};
const customStatements={
 C014:[
  '品質計画には、品質目標、品質を作り込む方策、検証・妥当性確認・試験などの評価活動、合否判定基準などを含め、状況の変化に応じて見直す。',
  '品質計画は開発開始時に一度確定すれば、その後に要求やプロセスが変更されても変更しない。',
  '品質計画では品質を作り込む活動を定めるが、品質を評価する活動や合否判定基準は別管理とし、計画には含めない。',
  '品質目標は自組織内部の過去実績だけから定め、他組織や市場水準との比較は品質計画では行わない。'
 ],
 C021:[
  'QMSは、品質方針や品質目標を実現するために、組織のプロセス、責任、資源、評価、改善を体系的に運用する仕組みである。',
  'QMSを構築し文書化すれば、その組織が開発する個別製品に欠陥が存在しないことが保証される。',
  'QMSの目的は手順書を整備することであり、品質目標の達成状況や改善効果の評価はQMSの対象外である。',
  'QMSは製品ごとのテスト結果を管理する仕組みであり、組織レベルの方針やプロセス改善は扱わない。'
 ],
 C023:[
  'ISMSは、情報セキュリティのリスクを踏まえ、方針、管理策、評価、改善を組織として継続的に運用するマネジメントシステムである。',
  'ISMSは機密性だけを管理対象とし、完全性や可用性に関するリスクは対象外とする。',
  'ISMSを認証取得すれば、認証範囲内のシステムに脆弱性が存在しないことが保証される。',
  'ISMSは事故発生後の復旧手順だけを対象とし、平常時のリスク評価や予防的管理策は扱わない。'
 ],
 C030:[
  'CMMIは、組織の開発・管理などのプロセス能力や成熟度を評価・改善するために利用できるモデルである。',
  'CMMIはテストプロセスだけの成熟度を段階的に評価することを目的としたモデルである。',
  'CMMIは自動車向けソフトウェア開発プロセスの能力評価だけを対象とする業界固有モデルである。',
  'CMMIで高い成熟度を得れば、個別製品の受入試験や品質評価を省略してよい。'
 ],
 C043:[
  'Quality Gateは、あらかじめ定めた品質基準を節目で確認し、次工程へ進むかを判断する仕組みである。',
  'Quality Gateでは、納期が迫った場合には未達の品質基準を自動的に達成扱いへ変更する。',
  'Quality Gateの基準は担当者が案件ごとにその場で変更し、事前に合意しないことが望ましい。',
  'Quality Gateはリリース後の利用者満足度だけを測り、工程移行の判断には用いない。'
 ],
 C044:[
  '外部委託では、委託範囲、責任分担、要求、受入条件、変更時の扱いを明確にし、発注側も成果やリスクを管理する。',
  '外部委託した範囲の品質責任はすべて委託先へ移るため、発注側は受入確認や進捗・品質の監視を行わない。',
  '外部委託では契約後の要求変更は認めず、必要な変更が生じた場合も契約内容や計画を見直さない。',
  '外部委託の管理では契約金額を最優先し、成果物の品質基準や受入条件は委託先へ一任する。'
 ],
 C045:[
  'リスクマネジメントでは、将来起こり得るリスクを識別し、分析・評価し、対応を選択し、その後も監視・見直しを行う。',
  'リスクマネジメントは既に発生した障害の原因分析だけを対象とし、未発生の事象は扱わない。',
  '発生確率が低いリスクは影響度にかかわらず一律に無視するのがリスクマネジメントの原則である。',
  'リスクマネジメントはテスト工程だけで実施し、企画・要求・設計・運用では実施しない。'
 ],
 C049:[
  '構成管理では、構成品目を識別し、ベースラインを設定し、変更を統制し、状態を記録・報告し、構成の整合性を確認する。',
  '構成管理では常に最新版だけを保管すればよく、過去版やベースライン、変更履歴を追跡できる必要はない。',
  'ベースラインへの変更可否は、影響評価や正式な承認を行わず、変更を実装する開発者本人が最終判断する。',
  '構成管理の対象はソースコードに限定し、設計書、設定、ライブラリ、ビルド環境などは対象外とする。'
 ],
 C081:[
  'GQMでは、まずGoalを定め、その達成を判断するQuestionを設定し、Questionへ答えるためのMetricを導く。',
  'GQMでは、収集しやすいMetricを先に決め、そのMetricに合うGoalを後から定義する。',
  'GQMのQはQualityを意味し、Goal－Quality－Metricの3層で構成される。',
  'GQMでは一つのGoalから導かれるMetricは必ず一つであり、複数のQuestionやMetricを対応付けない。'
 ],
 C083:[
  'MTBFは、修理可能な対象について、故障と次の故障の間の平均稼働時間を表す代表的な信頼性指標である。',
  'MTBFは、故障が発生してから修理を完了し利用可能になるまでの平均修復時間を表す。',
  'MTBFは、可用性を百分率で直接表す指標であり、故障間の稼働時間とは関係しない。',
  '故障発生頻度が変わらなくても修理作業を高速化すれば、MTBFは同じ割合で必ず大きくなる。'
 ],
 C092:[
  'Verificationは、成果物が仕様や設計など規定された要求事項を満たしているかを確認する活動である。',
  'Verificationは、実利用者の業務目的や意図した利用状況を満たしているかだけを確認する活動である。',
  'Verificationは実行可能なソフトウェアを用いる動的テストに限定され、レビューや静的解析は含まれない。',
  'VerificationはValidationが完了した後にだけ実施する活動であり、開発途中の成果物には適用しない。'
 ],
 C093:[
  'Validationは、最終的なシステムや成果物が、意図した用途や利用者のニーズを満たしているかを確認する活動である。',
  'Validationは、設計書やコードが上位仕様書の記述どおりであることだけを確認する活動である。',
  'Validationは静的レビューだけで実施し、実利用者や本番に近い利用状況での確認は行わない。',
  'Validationは必ず運用開始後に行うものであり、リリース前の受入れ・利用シナリオ確認では実施しない。'
 ],
 C119:[
  'CIでは、変更を頻繁に統合し、ビルドやテストなどを自動化して、統合結果を早く開発者へフィードバックする。',
  'CIの特徴は、開発環境から本番環境へのデプロイまでを自動化することにあり、統合頻度は重要ではない。',
  'CIでビルドやテストを自動化すれば、成功・失敗の結果を人が確認し改善へつなげる必要はなくなる。',
  'CIは統合による競合を減らすため、各開発者が長期間変更を保持し、月末など決めた日にまとめて統合する。'
 ],
 C127:[
  'SLAは、サービス提供者と利用者の間で、可用性や応答時間などのサービス水準、測定条件などを合意するものである。',
  'SLAは、サービス提供組織が内部で設定する努力目標であり、利用者との合意を必要としない。',
  'SLAを締結したサービスでは、合意値を一度でも下回らないことが技術的に保証される。',
  'SLAはサービス改善のための管理活動そのものを指し、合意内容を文書化したものではない。'
 ],
 C139:[
  'ベンチマーキングは、他組織や優れた実践、自組織の他部門などとの比較から、目標設定や改善の手掛かりを得る方法である。',
  'ベンチマーキングでは他組織の事例や水準を参照せず、自組織の過去実績だけで目標を決定する。',
  'ベンチマーキングは、競合組織の手順をそのまま複製することを目的とし、自組織への適用可能性は検討しない。',
  'ベンチマーキングはソフトウェアの実行性能を計測するベンチマークテストと同義であり、組織改善には用いない。'
 ],
 C141:[
  'ITILは、ITサービスマネジメントのプロセスや実践に関するベストプラクティスを体系化したガイダンスである。',
  'ITILはソフトウェア開発ライフサイクルの工程と成果物を定める開発プロセス規格である。',
  'ITILはITサービスマネジメントシステムの第三者認証要求事項を定めるISO規格そのものである。',
  'ITILは障害発生時の復旧だけを扱い、サービス設計、変更、継続的改善などは対象外とする。'
 ],
 C046:[
  'FMEAは、構成要素などの故障モードを起点に、その原因や上位への影響を分析し、リスク低減につなげる。',
  'FMEAは、重大事故などの頂上事象を起点に、AND・ORで原因の組合せを論理的に分解する。',
  'FMEAは、More、Less、Noなどのガイドワードを使い、設計意図からの逸脱を体系的に洗い出す。',
  'FMEAでは故障モードの影響は扱わず、発生確率だけを計算して優先順位を決める。'
 ],
 C047:[
  'FTAは、望ましくない頂上事象を起点に、AND・ORなどで原因の組合せをトップダウンに分解する。',
  'FTAは、部品ごとの故障モードを列挙して、それぞれが上位機能へ与える影響を順に分析する。',
  'FTAは、ガイドワードを用いて設計意図からの逸脱を列挙し、危険性を検討する。',
  'FTAでは原因事象間の論理関係を扱わず、原因候補を箇条書きにするだけで分析を完了する。'
 ],
 C109:[
  'Privacy by Designは、企画・設計の初期段階からプライバシー保護を仕組みに組み込み、必要最小限のデータ利用などを考慮する。',
  'Privacy by Designは、導入直前にプライバシー影響を評価するPIAを実施することだけを意味する。',
  'Privacy by Designは、匿名化や暗号化など一つのPETを導入すれば完了し、その他の設計判断は対象外である。',
  'Privacy by Designは、プライバシー事故が発生した後に復旧・補償を行う事後対応の考え方である。'
 ],
 C157:[
  'PIAは、新しいシステムや変更が個人のプライバシーへ与える影響を事前に整理し、リスク、低減策、残余リスクを評価する活動である。',
  'PIAは、設計の全段階でプライバシー保護を組み込むという設計原則そのものを指す。',
  'PIAは、匿名化や暗号化などの保護技術を実装する技術方式の総称である。',
  'PIAは、機密性・完全性・可用性だけを対象とする情報セキュリティ監査であり、個人へのプライバシー影響は扱わない。'
 ]
};
function sameFamilyPeers(q,index){
 const fam=rows.filter(x=>x.id!==q.id&&x.family===q.family);
 const chap=rows.filter(x=>x.id!==q.id&&x.chapter===q.chapter&&!fam.some(y=>y.id===x.id));
 return [...fam,...chap].slice(index%Math.max(1,fam.length+chap.length)).concat([...fam,...chap]).filter((x,i,a)=>x&&a.findIndex(y=>y.id===x.id)===i);
}
function rotateChoice(options,correct,shift){
 const items=options.map((text,i)=>({text,ok:i===correct}));
 const n=((shift%items.length)+items.length)%items.length,out=items.slice(n).concat(items.slice(0,n));
 return {options:out.map(x=>x.text),correct:out.findIndex(x=>x.ok)};
}
// v15 mix: public-past-paper style rather than definition-only drills.
// 15% multi-blank combinations, 20% same-topic statement judgement,
// 50% scenario/method selection, 15% calculation/test-design/application.
const conceptGroups=[
 ['C002','C003','C007','C008','C009','C010','C011'],
 ['C001','C055','C056','C057','C058','C059','C060'],
 ['C004','C005','C006','C092','C093'],
 ['C012','C013','C014','C015','C016','C021','C022','C043','C139'],
 ['C017','C018','C033','C034','C136'],
 ['C019','C020','C131','C132','C133'],
 ['C023','C105','C106','C107','C108','C155','C156'],
 ['C024','C025','C026','C027','C028','C029','C134'],
 ['C030','C031','C032','C135'],
 ['C033','C034','C136','C017','C018'],
 ['C035','C036','C037','C038','C137'],
 ['C039','C138','C139','C014','C044'],
 ['C040','C041','C042','C109','C157'],
 ['C045','C046','C047','C048'],
 ['C101','C102','C103','C104'],
 ['C049','C050','C051','C052','C053','C054'],
 ['C061','C062','C076','C077'],
 ['C063','C064','C065','C066'],
 ['C067','C068','C069','C070','C071','C072','C073','C074','C075','C076','C077','C078','C079'],
 ['C080','C134','C140','C022','C145'],
 ['C141','C142','C143','C144','C145','C170','C127'],
 ['C081','C082','C083','C146','C147','C148','C149','C150','C151'],
 ['C084','C085','C086','C087','C088','C089'],
 ['C094','C095','C096','C097'],
 ['C098','C099','C100','C060'],
 ['C109','C110','C157','C158'],
 ['C111','C112','C113','C114','C115','C116','C159','C160','C161','C162'],
 ['C117','C118','C163','C164','C166'],
 ['C119','C120','C121','C122','C123','C165','C166'],
 ['C124','C125','C126','C127','C128','C167','C168'],
 ['C129','C130','C169','C166'],
 ['C131','C132','C133','C019','C020'],
 ['C138','C139','C014','C043','C044'],
 ['C090','C091','C154','C152','C153']
]
const byId=new Map(rows.map(x=>[x.id,x]));
function groupRows(q){
 const ids=(conceptGroups.find(g=>g.includes(q.id))||[]);
 const xs=ids.map(id=>byId.get(id)).filter(Boolean);
 if(xs.length>=4)return xs;
 const fam=rows.filter(x=>x.family===q.family);
 if(fam.length>=4)return fam;
 return rows.filter(x=>x.chapter===q.chapter);
}
function relatedPool(q){
 return groupRows(q).filter(x=>x.id!==q.id);
}
function chooseFour(q,seed){
 const out=[q],pool=relatedPool(q);
 for(let k=0;k<pool.length&&out.length<4;k++){const x=pool[(seed+k)%pool.length];if(!out.some(y=>y.id===x.id))out.push(x);}
 if(out.length<4)throw new Error('related concept group too small: '+q.id);
 return out;
}
function needFrom(def){return String(def).replace(/。$/,'');}
function scenarioLead(q,variant){
 const need=needFrom(q.definition);
 const forms=[
  `次の目的・状況に最も直接対応するものを選べ。\n「${need}」`,
  `あるプロジェクトで次の活動が必要になった。最も適切なものを選べ。\n「${need}」`,
  `次の説明に合う考え方・技法として、最も適切なものを選べ。\n「${need}」`
 ];
 return forms[variant%forms.length];
}

// A. 60 multi-blank combination questions.
// Public past exams include multi-blank combinations; each answer option below changes every slot,
// so duplicated wording cannot collapse the question into an effective two-choice item.
const multiCandidates=rows.filter(q=>relatedPool(q).length>=3).sort((a,b)=>(b.level==='L3')-(a.level==='L3')||(b.level==='L2')-(a.level==='L2')||a.id.localeCompare(b.id)).slice(0,100);
for(let i=0;i<multiCandidates.length;i++){
 const q=multiCandidates[i],cs=chooseFour(q,i+3),terms=cs.map(x=>x.term);
 const perms=[[0,1,2,3],[1,0,3,2],[2,3,0,1],[3,2,1,0]];
 const combos=perms.map(p=>p.map((n,j)=>`(${j+1})${terms[n]}`).join(' / '));
 const comboReasons=perms.map((p,pi)=>{
   if(pi===0)return `4枠すべて正しい。\n${cs.map((x,j)=>`（${j+1}）${x.term}：${x.definition}`).join(' ')}`;
   const diffs=[];
   for(let j=0;j<4;j++)if(p[j]!==j)diffs.push(`（${j+1}）は「${terms[p[j]]}」ではなく「${terms[j]}」。${cs[j].definition}`);
   return diffs.join(' ');
 });
 const shift=i%4,o=rotateChoice(combos,0,shift);
 qs.push({id:id(),type:'multi-blank',targetConceptIds:cs.map(x=>x.id),chapter:q.chapter,family:q.family,level:q.level,syllabus:q.syllabus,
  text:`次の（1）～（4）の説明に対応する用語の組合せとして、もっとも適切なものを選べ。\n\n${cs.map((x,j)=>`（${j+1}）${needFrom(x.definition)}`).join('\n')}`,
  options:o.options,correct:o.correct,
  brief:'4つの近接概念を同時に区別する。1枠ずつ定義へ照合してから組合せを選ぶ。',
  detail:`正しい対応は ${terms.map((t,j)=>`（${j+1}）${t}`).join('、')}。各枠を独立して確定すると、選択肢の並びに引っ張られにくい。`,
  reasons:o.options.map(x=>comboReasons[combos.indexOf(x)])});
}

// B. 80 same-topic statement questions.
// This follows public GQM / quality-plan / configuration-management questions:
// all four choices discuss the same topic; only scope, purpose or responsibility makes one correct.
const statementCandidates=Object.keys(customStatements).map(id=>byId.get(id)).filter(Boolean);
for(let i=0;i<statementCandidates.length;i++){
 const q=statementCandidates[i],statements=customStatements[q.id];
 const o=rotateChoice(statements,0,(i*3+1)%4);
 qs.push({id:id(),type:'same-topic-statement',targetConceptIds:[q.id],chapter:q.chapter,family:q.family,level:q.level,syllabus:q.syllabus,
  text:`「${q.term}」に関する説明として、もっとも適切なものを選べ。`,
  options:o.options,correct:o.correct,
  brief:`${q.term}について、同じ分野の記述から対象・目的・適用範囲を区別する。`,
  detail:`適切なのは「${q.definition}」という内容。`,
  reasons:o.options.map(x=>x===statements[0]?`${q.term}の対象・目的を正しく説明している。`:`同じ分野の別概念の対象・目的を混同している。問題文の主語である${q.term}には適合しない。`)});
}

// C. 200 scenario / method-selection questions.
// These mirror the public multivariate-analysis style: understand the objective first,
// then select among close methods from the same family/chapter.
const scenarioTargets=rows.concat(rows.filter(x=>x.level==='L3'),rows.filter(x=>x.level==='L2').slice(0,20),rows.filter(x=>x.level==='L1').slice(0,7));
const scenarioSeen=new Map();
for(let i=0;i<scenarioTargets.length;i++){
 const q=scenarioTargets[i],occ=scenarioSeen.get(q.id)||0;scenarioSeen.set(q.id,occ+1);
 const cs=chooseFour(q,i+11),raw=cs.map(x=>x.term),shift=(i*2+1)%4,o=rotateChoice(raw,0,shift);
 qs.push({id:id(),type:'scenario-selection',targetConceptIds:[q.id],optionConceptIds:cs.map(x=>x.id),chapter:q.chapter,family:q.family,level:q.level,syllabus:q.syllabus,
  text:scenarioLead(q,occ),
  options:o.options,correct:o.correct,
  brief:`目的を先に読み、${q.term}と近接概念の適用範囲を比較する。`,
  detail:`設問の目的は「${q.definition}」に対応するため、${q.term}が最も直接的。`,
  reasons:o.options.map(t=>{const x=cs.find(z=>z.term===t);return t===q.term
    ?`${q.term}は「${q.definition}」という概念で、設問の目的・対象に直接一致する。`
    :`${t}は「${x?.definition||'別の目的・対象を扱う概念'}」。一方、この設問が求めているのは「${q.definition}」なので、使う場面・対象・目的のいずれかが一致しない。`;})});
}
const add=x=>qs.push({...x,id:id(),type:'applied'});
const four=(fn)=>{for(let v=0;v<4;v++)add(fn(v));};

four(v=>{const hi=[10000,18,365,5000][v],lo=[1000,0,1,500][v];return{chapter:'品質技術',family:'テスト設計',level:'L3',syllabus:'3.8.1',
 text:`整数入力は${lo}以上${hi}以下を受理する。実装は上限だけ「${hi}未満」と誤っていた。この欠陥をもっとも直接検出する入力はどれか。`,
 options:[String(hi-1),String(hi),String(hi+1),String(Math.floor((lo+hi)/2))],correct:1,
 brief:'等号の抜けは境界値そのもので仕様と実装の結果が分かれる。',detail:`仕様では${hi}を受理するが誤実装では拒否する。`,
 reasons:['両方で受理する。','仕様と誤実装で結果が分かれる。','両方で範囲外。','上限の誤りを直接通らない。']};});
four(v=>{const lo=[5,10,1,100][v],hi=[12,20,9,999][v];return{chapter:'品質技術',family:'テスト設計',level:'L3',syllabus:'3.8.1',
 text:`整数入力は${lo}～${hi}を受理し、${lo}未満と${hi}超では異なるエラーになる。三つの同値クラスを各1回確認できる最小の組合せはどれか。`,
 options:[`${lo}, ${Math.floor((lo+hi)/2)}, ${hi}`,`${lo-1}, ${lo}, ${hi}`,`${lo-1}, ${Math.floor((lo+hi)/2)}, ${hi+1}`,`${lo-1}, ${hi+1}, ${hi+2}`],correct:2,
 brief:'各同値クラスから代表値を1つずつ選ぶ。',detail:`クラスは「${lo}未満」「${lo}～${hi}」「${hi}超」。`,
 reasons:['有効クラスだけ。','上側無効クラスがない。','3クラスを各1つ含む。','有効クラスがない。']};});
four(v=>{const label=['会員条件と購入条件','利用資格と本人確認','在庫条件と承認条件','レビュー条件と欠陥条件'][v];return{chapter:'品質技術',family:'テスト設計',level:'L3',syllabus:'3.8.1',
 text:`${label}の両方を満たすときだけ処理Xを行う仕様である。実装が誤ってANDではなくORだった。既に「両方真」と「両方偽」は試した。追加で欠陥を検出できるケースはどれか。`,
 options:['A=true, B=true','A=false, B=false','A=true, B=false','既存2ケースだけで十分'],correct:2,
 brief:'ANDとORの差は片方だけ真のケースで現れる。',detail:'片方だけ真ならANDは偽、ORは真になる。',
 reasons:['両方で真。','両方で偽。','結果が分かれる。','片方だけ真を試す必要がある。']};});
four(v=>{const x=[[-1,1],[-2,3],[-5,2],[-10,7]][v];return{chapter:'品質技術',family:'テスト設計',level:'L3',syllabus:'3.8.1',
 text:`x=${x[0]}とx=${x[1]}を実行した。判定「x<0」「x>0」の各真偽4結果を分母にした判定結果網羅率はどれか。\nif(x<0){...}else if(x>0){...}else{...}`,
 options:['50%','75%','100%','25%'],correct:1,brief:'真偽4結果のうち実行した結果を数える。',detail:'第1判定は真・偽、第2判定は真を通るため3/4=75%。',
 reasons:['3結果を通る。','3/4で正しい。','第2判定偽が未実行。','少なく数えすぎ。']};});
four(v=>{const n=[400,250,500,800][v],bad=[20,10,30,32][v],def=[35,18,45,50][v];return{chapter:'品質技術',family:'データ解析',level:'L3',syllabus:'3.9.4',
 text:`検査${n}件のうち不適合が1つ以上ある対象は${bad}件、不適合そのものは${def}個だった。「不適合な対象の割合」をp管理図へ記す値はどれか。`,
 options:[`${bad}/${n}`,`${def}/${n}`,`${def}/${bad}`,`${n}/${bad}`],correct:0,brief:'p管理図は不適合単位の割合。',detail:`分子${bad}、分母${n}。`,
 reasons:['正しい。','欠陥個数を分子にしている。','単位当たり欠陥数に近い。','分子分母が逆。']};});
four(v=>{const aa=[1.5,2,0.8,3][v],bb=[2,1,4,5][v],x=[4,5,10,3][v],y=aa*x+bb;return{chapter:'品質技術',family:'データ解析',level:'L3',syllabus:'3.9.4',
 text:`回帰式 y=${aa}x+${bb} にデータ範囲内のx=${x}を代入した予測値はどれか。`,options:[String(y),String(aa*x),String(y+aa),String(y+5)],correct:0,
 brief:'回帰式には切片まで含めて代入する。',detail:`y=${aa}×${x}+${bb}=${y}。`,reasons:['正しい。','切片を落としている。','不要な項を足す。','式を使っていない。']};});
four(v=>{const kx=[12,20,8,15][v],dx=[36,50,24,60][v],ky=[8,10,6,12][v],dy=[32,30,24,60][v],rx=dx/kx,ry=dy/ky;return{chapter:'品質技術',family:'測定',level:'L2',syllabus:'3.1.2 / 3.1.3',
 text:`同じ検出基準でXは${kx}KLOCから${dx}件、Yは${ky}KLOCから${dy}件の欠陥が見つかった。欠陥密度の比較として正しいものはどれか。`,
 options:[`X=${rx}件/KLOC、Y=${ry}件/KLOC`,`X=${dx}、Y=${dy}件/KLOC`,`X=${kx/dx}、Y=${ky/dy}件/KLOC`,'総欠陥数だけで密度を比較する'],correct:0,
 brief:'欠陥密度は欠陥数÷規模。',detail:`X=${rx}、Y=${ry}件/KLOC。`,reasons:['正しい。','総数を密度にしている。','分子と分母が逆になっている。','規模差を無視。']};});
four(v=>{const u=[[90,150],[80,120],[100,140],[75,165]][v],m=(u[0]+u[1])/2;return{chapter:'品質の概念',family:'信頼性',level:'L2',syllabus:'1.3',
 text:`装置が${u[0]}時間稼働して故障し、修理後さらに${u[1]}時間稼働して故障した。MTBFを総稼働時間÷故障回数で求めるといくつか。`,
 options:[`${m}時間`,`${u[0]+u[1]}時間`,`${m+10}時間`,'10時間'],correct:0,brief:'MTBF=総稼働時間÷故障回数。',detail:`${u[0]+u[1]}÷2=${m}時間。`,
 reasons:['正しい。','故障回数で割っていない。','修理時間を混ぜる。','修理時間と混同。']};});
four(v=>{const tp=[30,48,72,45][v],fp=[10,12,18,15][v],fn=[20,16,8,5][v],p=Math.round(tp/(tp+fp)*1000)/10,r=Math.round(tp/(tp+fn)*1000)/10;return{chapter:'新領域',family:'AI品質',level:'L1',syllabus:'5.1.1',
 text:`分類モデルでTP=${tp}, FP=${fp}, FN=${fn}。PrecisionとRecallの正しい組合せはどれか。`,options:[`Precision ${p}%、Recall ${r}%`,`Precision ${r}%、Recall ${p}%`,`Precision ${Math.round(tp/(tp+fp+fn)*1000)/10}%、Recall 同じ`,`Precision 100%、Recall ${r}%`],correct:0,
 brief:'Precision=TP/(TP+FP)、Recall=TP/(TP+FN)。',detail:`Precision=${p}%、Recall=${r}%。`,reasons:['正しい。','二つの対応を逆にしている。','分母が違う。','FPがある。']};});
four(v=>{const top=['誤投薬','二重請求','警報喪失','データ消失'][v];return{chapter:'品質技術',family:'リスク分析',level:'L3',syllabus:'3.7.3',
 text:`「${top}」を頂上事象に置き、AND/ORで原因の組合せを分解する技法はどれか。`,options:['FTA','FMEA','HAZOP','リスクマトリクス'],correct:0,
 brief:'頂上事象から原因へ遡るのはFTA。',detail:'FMEAは故障モード起点で影響へ進む。',reasons:['正しい。','分析方向が逆。','ガイドワードで逸脱を調べる。','優先度付け。']};});
four(v=>{const c=['夜勤担当の実務','配車担当の地域制約','医師の診療手順','倉庫担当の棚卸手順'][v];return{chapter:'品質の概念',family:'V&V',level:'L2',syllabus:'1.3.4',
 text:`仕様どおり動作することは確認済みだが、実利用者から「${c}に合わない」と指摘された。次に中心となる確認はどれか。`,
 options:['利用目的への適合を確認するValidation','仕様適合を再確認するVerificationだけ','命令網羅率だけを上げる','構成管理台帳だけを見る'],correct:0,
 brief:'仕様適合と利用目的適合は別。',detail:'今回は利用目的への適合が問題。',reasons:['正しい。','同じ基準を重ねるだけ。','内部構造の話。','版管理の話。']};});
four(v=>{const p=[
 ['要求と異なる税額計算を修正','正常な検索をさらに高速化','是正保守','完全化保守'],
 ['OS変更へ対応','正常機能の使い勝手を改善','適応保守','完全化保守'],
 ['発見済みバグを修正','将来故障しそうな内部構造を整理','是正保守','予防保守'],
 ['外部API廃止へ対応','要求を満たす画面を利用者要望で改善','適応保守','完全化保守']][v];return{chapter:'品質技術',family:'保守',level:'L2',syllabus:'3.10.2',
 text:`変更A「${p[0]}」、変更B「${p[1]}」。分類として適切なのはどれか。`,options:[`A=${p[2]}、B=${p[3]}`,`A=${p[3]}、B=${p[2]}`,'AもBも是正保守','AもBも適応保守'],correct:0,
 brief:'保守分類は変更理由で決める。',detail:`A=${p[2]}、B=${p[3]}。`,reasons:['正しい。','二つの対応を逆にしている。','両方が欠陥修正ではない。','両方が環境変化対応ではない。']};});
four(v=>{const g=['必要最小限だけ収集する設計','導入前に影響と残余リスクを評価','匿名化・暗号化技術を適用','初期設定を非公開側にする設計'],ans=[0,1,2,0],o=['Privacy by Design','PIA','PET','ISMSリスクアセスメント'];return{chapter:'専門品質',family:'プライバシー',level:'L2',syllabus:'4.4.2',
 text:`「${g[v]}」にもっとも直接対応するものはどれか。`,options:o,correct:ans[v],brief:'設計原則・影響評価・保護技術を区別する。',detail:`${o[ans[v]]}に対応する。`,reasons:o.map((x,i)=>i===ans[v]?'直接一致。':'関連するが活動種類が違う。')};});
four(v=>{const d=['有限状態を全探索して禁止状態への到達を確認','数理的な言語で仕様を記述','公理と推論規則で性質を証明','実行モデルを動かして挙動を観察'],o=['モデル検査','形式仕様記述','定理証明','シミュレーション'];return{chapter:'品質技術',family:'形式手法',level:'L1',syllabus:'3.3.1 / 3.3.2',
 text:`「${d[v]}」にもっとも対応するものはどれか。`,options:o,correct:v,brief:'記述・状態探索・論理証明・実行観察を区別する。',detail:`${o[v]}に対応する。`,reasons:o.map((x,i)=>i===v?'正しい。':'別の方法。')};});
add({chapter:'新領域',family:'クラウド',level:'L2',syllabus:'5.4',
 text:'IaaSの仮想マシンで、自社が導入したゲストOSとアプリを運用している。契約にOS運用代行は含まれない。OSの脆弱性修正について最も適切なものはどれか。',
 options:[
  '物理ホストを事業者が管理しているため、ゲストOSのパッチも事業者だけが実施する',
  'ゲストOSは自社の管理範囲として、パッチ適用と影響確認を自社で管理する',
  'クラウド上のOSはサービス境界外なので、アプリだけ更新すればよい',
  'OSのパッチ適用はエンドユーザー個人へ委ね、仮想マシン所有者は管理しない'
 ],correct:1,brief:'IaaSは責任が消えるのではなく分担される。契約上の管理範囲を読む。',
 detail:'設問ではOS運用代行が契約に含まれず、自社がゲストOSを導入しているため、ゲストOSの更新は利用者側の管理範囲になる。',
 reasons:['IaaS事業者の物理基盤管理とゲストOS管理を混同している。','契約条件と一般的なIaaSの責任分担に合う。','クラウドであることはゲストOSの脆弱性対応を不要にしない。','管理主体をエンドユーザーへ丸投げしており、運用責任の整理にならない。']});

add({chapter:'新領域',family:'DevOps',level:'L2',syllabus:'5.3.3',
 text:'各開発者が数週間変更を保持し、月末にまとめて統合しているため、多数の競合と不整合が同時に見つかる。CIの考え方に沿う改善として最も適切なものはどれか。',
 options:[
  '統合頻度は維持し、月末のビルドだけ自動化する',
  '小さな変更を頻繁に共有し、各統合で自動ビルド・テストを行い、失敗を早く修正する',
  '個人ブランチの単体テストだけを増やし、統合は従来どおり月末に行う',
  '統合は毎日行うが、失敗したビルドは次の月末までまとめて修正する'
 ],correct:1,brief:'CIは自動化だけでなく、頻繁な統合と速いフィードバックが中心。',
 detail:'差分を小さく保って頻繁に統合し、統合ごとの自動検査結果をすぐ修正へつなげることで、不整合の原因を追いやすくする。',
 reasons:['自動化しても統合間隔が長いままでは問題発見が遅い。','CIの目的と運用に一致する。','個人ブランチ内だけでは統合時の競合や依存不整合を早期検出できない。','統合失敗を長期間放置すると速いフィードバックを改善へつなげられない。']});

add({chapter:'新領域',family:'DevOps',level:'L2',syllabus:'5.3.3',
 text:'新機能を一部利用者へ先行提供したところ、事前に定めたエラー率の上限を超え、従来版より悪化していた。全面展開前の判断として最も適切なものはどれか。',
 options:[
  '先行群が小さいため、上限超過を無視して対象を50%まで拡大し、母数を増やしてから判断する',
  '応答時間が改善していればエラー率悪化と相殺できるとして全面展開する',
  '展開を停止し、統計的な不確実性も確認しつつ切戻し・原因調査を行う',
  '従来版との比較は行わず、新版単独のエラー率だけで判断する'
 ],correct:2,brief:'段階展開では、事前のガードレールを次の展開判断に使う。',
 detail:'カナリア提供は影響範囲を限定したまま観測し、基準を超えた場合に停止・切戻しできることが価値になる。',
 reasons:['明確なガードレール違反を無視して影響範囲を広げるのは目的に反する。','異なる品質指標を事前ルールなしに単純相殺しない。','段階展開の運用として最も適切。','比較対象があるなら差分は重要な判断材料であり、捨てる理由はない。']});

add({chapter:'新領域',family:'クラウド',level:'L2',syllabus:'5.4',
 text:'SLAは月間稼働率99.9%以上とする。30日間で計画停止などの除外はなく、停止時間は30分だった。稼働率を「(総時間−停止時間)/総時間」で求めると、最も適切な説明はどれか。',
 options:[
  '約99.9306%であり、99.9%以上を満たす',
  '約99.9000%であり、ちょうど境界上となる',
  '約99.9306%だが、小数第1位へ丸めると99.9%なので未達と扱う',
  '約99.9653%であり、停止時間の半分だけを分母から除外する'
 ],correct:0,brief:'SLAは契約で定めた分母・除外条件・単位をそろえて計算する。',
 detail:'30日=43,200分なので、(43,200−30)/43,200×100≒99.9306%。この条件では99.9%以上を満たす。',
 reasons:['式と条件に沿った計算で正しい。','30分は43,200分の0.1%ではなく約0.0694%。','元の計算値が99.9%以上であり、恣意的な丸めで未達へ変えない。','停止時間の扱いを契約式から勝手に変更している。']});

if(qs.length!==400)throw new Error('benchmark total '+qs.length);
const formSets=Array.from({length:10},(_,i)=>({form:i+1,ids:[],chapter:{},level:{}}));
function distribute(items,cap){
 for(const q of items){
  const candidates=formSets.filter(f=>f.ids.filter(id=>{const z=qs.find(x=>x.id===id);return z&&z.type===q.type;}).length<cap);
  candidates.sort((a,b)=>{
   const sa=10*(a.chapter[q.chapter]||0)+7*(a.level[q.level]||0)+a.ids.length;
   const sb=10*(b.chapter[q.chapter]||0)+7*(b.level[q.level]||0)+b.ids.length;
   return sa-sb||a.form-b.form;
  });
  const f=candidates[0];f.ids.push(q.id);f.chapter[q.chapter]=(f.chapter[q.chapter]||0)+1;f.level[q.level]=(f.level[q.level]||0)+1;
 }
}
distribute(qs.slice(0,100),10);distribute(qs.slice(100,120),2);distribute(qs.slice(120,340),22);distribute(qs.slice(340,400),6);
for(const f of formSets){delete f.chapter;delete f.level;if(f.ids.length!==40)throw new Error('form length');}
return {version:'15.0',published:true,total:400,forms:10,questions:qs,formSets,
 calibration:{label:'公式公開過去問の出題形式・難度アンカー準拠',note:'日科技連の初級サンプル問題と第18・20・22・26回の公開解説に見られる形式（同一テーマの記述判定、複数穴の組合せ、近接技法の選択、計算・テスト設計）をアンカーにした独自問題。公式問題の転載ではなく、本番得点の保証ではない。',
  officialExam:{questions:40,minutes:60,levels:['L1','L2','L3'],passLine:'70%程度'},
  anchors:['https://www.juse.jp/jcsqe/content/jcsqe_beginner_sample.pdf','https://www.juse.jp/jcsqe/study/past/18_syokyu_discription.pdf','https://www.juse.jp/jcsqe/study/past/20_syokyu_discription.pdf','https://www.juse.jp/jcsqe/study/past/22_syokyu_discription.pdf','https://www.juse.jp/jcsqe/study/past/26_syokyu_discription.pdf']}};
});