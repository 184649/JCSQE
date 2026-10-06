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
 C023:[
  'ISMSは、情報セキュリティに関する方針・リスク・対策・評価・改善を組織として継続的に管理する仕組みである。',
  'ISMSは、個別ソフトウェア製品の脆弱性が存在しないことを第三者が保証する制度である。',
  'ISMSは、機密性だけを対象とし、完全性や可用性は対象外とする管理体系である。',
  'ISMSは、セキュリティ事故が発生した後の技術的復旧だけを対象とする活動である。'
 ],
 C039:[
  'スキル標準は、職務や役割に必要な能力を体系化し、育成や能力評価の基準として利用できる。',
  'スキル標準は、個々の製品の品質特性を数値化するためのプロダクトメトリクスである。',
  'スキル標準は、開発プロセスの成熟度を段階的に認証するプロセス評価モデルである。',
  'スキル標準は、資格保有者だけを対象にした法的な業務独占基準である。'
 ],
 C043:[
  'Quality Gateは、あらかじめ定めた品質基準を節目で確認し、次工程へ進むかを判断する仕組みである。',
  'Quality Gateは、品質基準を満たさなくても納期が迫れば自動的に通過させる仕組みである。',
  'Quality Gateは、リリース後に利用者満足度だけを測る評価方法である。',
  'Quality Gateは、各担当者が個別判断で基準を変更することを前提とした仕組みである。'
 ],
 C044:[
  '外部委託では、委託範囲や責任分担、受入れ条件などを明確にし、委託先の成果を管理する必要がある。',
  '外部委託した範囲の品質責任はすべて委託先へ移るため、発注側の受入れや監視は不要となる。',
  '外部委託では、契約後に要求が変化しても委託内容を見直してはならない。',
  '外部委託では、成果物の品質よりも契約金額だけを管理対象とする。'
 ],
 C045:[
  'リスクマネジメントは、リスクを識別・分析・評価し、対応を選択して継続的に管理する活動である。',
  'リスクマネジメントは、発生済みの障害だけを記録し、将来起こり得る事象は扱わない。',
  'リスクマネジメントでは、発生確率が低いリスクは影響度に関係なく無視する。',
  'リスクマネジメントは、テスト工程だけで実施し、企画・設計・運用では扱わない。'
 ],
 C138:[
  'PMBOKは、プロジェクトマネジメントの知識や実践を体系化したガイドとして利用される。',
  'PMBOKは、ソフトウェア製品品質の8特性だけを定義する品質モデルである。',
  'PMBOKは、テストプロセス成熟度だけを評価するモデルである。',
  'PMBOKは、プログラムのソースコード規約を定める国際規格である。'
 ],
 C139:[
  'ベンチマーキングは、他組織や優れた実践などとの比較から改善の手掛かりを得る方法である。',
  'ベンチマーキングでは、他組織の事例を参照すると独自性が失われるため比較してはならない。',
  'ベンチマーキングは、ソフトウェアの命令網羅率を計測するテスト技法である。',
  'ベンチマーキングは、個人情報の影響を導入前に評価する活動である。'
 ],
 C083:[
  'MTBFは、修理可能な対象について故障間の平均稼働時間を表す信頼性指標である。',
  'MTBFは、故障してから修理が完了するまでの平均時間を表す指標である。',
  'MTBFは、単位規模当たりの欠陥件数を表す品質指標である。',
  'MTBFは、サービス契約で合意した月間稼働率そのものを表す指標である。'
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
const relatedFamilies={
 '品質基礎':['品質の定義','品質マネジメント'],'欠陥用語':['V&V','テスト設計'],
 'セキュリティ管理':['QMS','リスク管理','セキュリティ'],'教育':['品質マネジメント','プロジェクト管理'],
 '意思決定':['リスク管理','品質マネジメント'],'調達':['品質マネジメント','検査監査'],
 '品質計画':['品質マネジメント','測定'],'プロジェクト管理':['品質マネジメント','改善サイクル'],
 'モデル化':['形式手法','設計実装'],'ライフサイクル':['開発モデル','保守']
};
function relatedPool(q){
 const fam=rows.filter(x=>x.id!==q.id&&x.family===q.family);
 const rel=(relatedFamilies[q.family]||[]).flatMap(f=>rows.filter(x=>x.family===f&&x.id!==q.id));
 const chap=rows.filter(x=>x.id!==q.id&&x.chapter===q.chapter&&!fam.some(y=>y.id===x.id)&&!rel.some(y=>y.id===x.id));
 return [...fam,...rel,...chap].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
}
function chooseFour(q,seed){
 const out=[q],pool=relatedPool(q);
 for(let k=0;k<pool.length&&out.length<4;k++){const x=pool[(seed+k)%pool.length];if(!out.some(y=>y.id===x.id))out.push(x);}
 for(let k=0;out.length<4&&k<rows.length;k++){const x=rows[(seed*7+k*13)%rows.length];if(!out.some(y=>y.id===x.id))out.push(x);}
 return out;
}
function needFrom(def){
 let x=String(def).replace(/。$/,'');
 x=x.replace(/ための(技法|方法|活動|モデル|枠組み)$/,'こと');
 x=x.replace(/する(技法|方法|活動|モデル|枠組み)$/,'したい');
 x=x.replace(/を表す(代表的な)?(指標|尺度)$/,'を把握したい');
 x=x.replace(/である$/,'を必要としている');
 return x;
}
function scenarioLead(q,variant){
 const need=needFrom(q.definition);
 const lead={
  '品質の概念':'品質責任者','品質マネジメント':'品質管理チーム','品質技術':'品質技術チーム',
  '専門品質':'専門品質チーム','新領域':'開発・運用チーム'
 }[q.chapter]||'プロジェクトチーム';
 const tails=[
  `${lead}は、${need}。この目的に最も直接適する考え方・技法はどれか。`,
  `ある案件で「${need}」ことが課題になった。最も適切な対応・技法はどれか。`,
  `レビューの結果、${need}ことが必要と判断された。採用するものとして最も適切なのはどれか。`
 ];
 return tails[variant%tails.length];
}

// A. 60 multi-blank combination questions.
// Public past exams include multi-blank combinations; each answer option below changes every slot,
// so duplicated wording cannot collapse the question into an effective two-choice item.
const multiCandidates=rows.filter(q=>relatedPool(q).length>=3).sort((a,b)=>(b.level==='L3')-(a.level==='L3')||(b.level==='L2')-(a.level==='L2')||a.id.localeCompare(b.id)).slice(0,60);
for(let i=0;i<multiCandidates.length;i++){
 const q=multiCandidates[i],cs=chooseFour(q,i+3),terms=cs.map(x=>x.term);
 const perms=[[0,1,2,3],[1,0,3,2],[2,3,0,1],[3,2,1,0]];
 const combos=perms.map(p=>p.map((n,j)=>`(${j+1})${terms[n]}`).join(' / '));
 const shift=i%4,o=rotateChoice(combos,0,shift);
 qs.push({id:id(),type:'multi-blank',targetConceptIds:cs.map(x=>x.id),chapter:q.chapter,family:q.family,level:q.level,syllabus:q.syllabus,
  text:`次の（1）～（4）の状況・目的に対応する用語の組合せとして、もっとも適切なものを選べ。\n\n${cs.map((x,j)=>`（${j+1}）${scenarioLead(x,j).replace(/。この目的.+$/,'')}`).join('\n')}`,
  options:o.options,correct:o.correct,
  brief:'4つの近接概念を同時に区別する。各選択肢は4枠すべての対応が異なる。',
  detail:`正しい対応は ${terms.map((t,j)=>`（${j+1}）${t}`).join('、')}。`,
  reasons:o.options.map(x=>x===combos[0]?'4つすべての対応が正しい。':`少なくとも2つ以上の対応が入れ替わっている。正しくは ${terms.map((t,j)=>`（${j+1}）${t}`).join('、')}。`)});
}

// B. 80 same-topic statement questions.
// This follows public GQM / quality-plan / configuration-management questions:
// all four choices discuss the same topic; only scope, purpose or responsibility makes one correct.
const statementCandidates=[...rows].sort((a,b)=>(customStatements[b.id]?1:0)-(customStatements[a.id]?1:0)||(b.level==='L3')-(a.level==='L3')||(b.level==='L2')-(a.level==='L2')||a.id.localeCompare(b.id)).slice(0,80);
for(let i=0;i<statementCandidates.length;i++){
 const q=statementCandidates[i];
 let statements=customStatements[q.id];
 if(!statements){
  const ps=relatedPool(q).slice(0,3);
  while(ps.length<3)ps.push(rows[(i+ps.length*19)%rows.length]);
  statements=[
   `${q.term}は、${q.definition}`,
   `${q.term}は、${ps[0].definition}`,
   `${q.term}の主な対象は、${ps[1].definition}`,
   `${q.term}を適用する主目的は、${ps[2].definition}`
  ];
 }
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
const scenarioTargets=rows.concat(rows.filter(x=>x.level==='L3').slice(0,23),rows.filter(x=>x.level==='L2').slice(0,7));
for(let i=0;i<scenarioTargets.length;i++){
 const q=scenarioTargets[i],cs=chooseFour(q,i+11),raw=cs.map(x=>x.term),shift=(i*2+1)%4,o=rotateChoice(raw,0,shift);
 qs.push({id:id(),type:'scenario-selection',targetConceptIds:[q.id],chapter:q.chapter,family:q.family,level:q.level,syllabus:q.syllabus,
  text:scenarioLead(q,i),
  options:o.options,correct:o.correct,
  brief:`目的を先に読み、${q.term}と近接概念の適用範囲を比較する。`,
  detail:`設問の目的は「${q.definition}」に対応するため、${q.term}が最も直接的。`,
  reasons:o.options.map(t=>t===q.term?`${q.term}は設問の目的・対象に直接一致する。`:`${t}も同じ分野に関連するが、設問が求める目的・対象とは異なる。`)});
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
four(v=>({chapter:'品質技術',family:'テスト設計',level:'L3',syllabus:'3.8.1',
 text:'条件Aと条件Bの両方が真のときだけ処理Xを行う仕様である。実装が誤ってANDではなくORだった。既に「両方真」と「両方偽」は試した。追加で欠陥を検出できるケースはどれか。',
 options:['A=true, B=true','A=false, B=false','A=true, B=false','既存2ケースだけで十分'],correct:2,
 brief:'ANDとORの差は片方だけ真のケースで現れる。',detail:'片方だけ真ならANDは偽、ORは真になる。',
 reasons:['両方で真。','両方で偽。','結果が分かれる。','片方だけ真を試す必要がある。']}));
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
four(v=>{const d=['IaaSで自社導入OSのパッチ管理','小さい変更を頻繁に統合しビルド・試験','先行利用者で異常を検知し展開停止','月間稼働率を契約式で評価'],o=['契約で代行がなければ利用者側でゲストOS更新を管理','CIとして統合ごとに自動検査し早期修正','カナリア展開の基準に従い停止・切戻し','SLA定義の分母・除外条件で計算'];return{chapter:'新領域',family:v===0||v===3?'クラウド':'DevOps',level:'L2',syllabus:v===0||v===3?'5.4':'5.3.3',
 text:`次の状況にもっとも適切な対応はどれか。\n${d[v]}`,options:o,correct:v,brief:'責任分界・CI・段階展開・SLAを区別する。',detail:`${o[v]}が中心。`,reasons:o.map((x,i)=>i===v?'直接対応。':'別の運用概念。')};});

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
distribute(qs.slice(0,60),6);distribute(qs.slice(60,140),8);distribute(qs.slice(140,340),20);distribute(qs.slice(340,400),6);
for(const f of formSets){delete f.chapter;delete f.level;if(f.ids.length!==40)throw new Error('form length');}
return {version:'15.0',published:true,total:400,forms:10,questions:qs,formSets,
 calibration:{label:'公式公開過去問の出題形式・難度アンカー準拠',note:'日科技連の初級サンプル問題と第18・20・22・26回の公開解説に見られる形式（同一テーマの記述判定、複数穴の組合せ、近接技法の選択、計算・テスト設計）をアンカーにした独自問題。公式問題の転載ではなく、本番得点の保証ではない。',
  officialExam:{questions:40,minutes:60,levels:['L1','L2','L3'],passLine:'70%程度'},
  anchors:['https://www.juse.jp/jcsqe/content/jcsqe_beginner_sample.pdf','https://www.juse.jp/jcsqe/study/past/18_syokyu_discription.pdf','https://www.juse.jp/jcsqe/study/past/20_syokyu_discription.pdf','https://www.juse.jp/jcsqe/study/past/22_syokyu_discription.pdf','https://www.juse.jp/jcsqe/study/past/26_syokyu_discription.pdf']}};
});