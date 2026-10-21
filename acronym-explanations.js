/* v15.9: expansion of abbreviations in answer explanations only.
 * Original questions, answer keys, option order and storage are never modified.
 * English names are identifiers, not new versions of the exam syllabus.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else {root.JCSQEAcronyms=api;api.install(root.JCSQEKeywords);}
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const rows=[
 ['QCD','Quality, Cost, Delivery','品質・コスト・納期'],
 ['QMS','Quality Management System','品質マネジメントシステム'],
 ['ISMS','Information Security Management System','情報セキュリティマネジメントシステム'],
 ['ISO','International Organization for Standardization','国際標準化機構','ISOは英語名称の頭文字を並べた略語ではなく、各言語で共通の短い名称。'],
 ['IEC','International Electrotechnical Commission','国際電気標準会議'],
 ['IEEE','Institute of Electrical and Electronics Engineers','電気・電子分野の専門家組織'],
 ['JIS','Japanese Industrial Standards','日本産業規格'],
 ['CMMI','Capability Maturity Model Integration','能力成熟度モデル統合'],
 ['SPICE','Software Process Improvement and Capability dEtermination','ソフトウェアプロセス改善と能力判定','Automotive SPICEは自動車分野への適用。新しい資料ではSystems/Softwareから始まる表記もある。'],
 ['TMMi','Test Maturity Model integration','テスト成熟度モデル統合'],
 ['TPI','Test Process Improvement','テストプロセス改善'],
 ['IDEAL','Initiating, Diagnosing, Establishing, Acting, Learning','開始・診断・確立・実行・学習'],
 ['PSP','Personal Software Process','個人ソフトウェアプロセス'],
 ['TSP','Team Software Process','チームソフトウェアプロセス'],
 ['PDCA','Plan, Do, Check, Act','計画・実行・確認・改善'],
 ['OODA','Observe, Orient, Decide, Act','観察・情勢判断・意思決定・行動'],
 ['PL','Product Liability','製造物責任','PL法のPL。ここでは法律名に含まれる略語の意味を示す。'],
 ['PMBOK','Project Management Body of Knowledge','プロジェクトマネジメント知識体系'],
 ['FMEA','Failure Mode and Effects Analysis','故障モード影響解析'],
 ['FMECA','Failure Mode, Effects and Criticality Analysis','故障モード・影響・致命度解析'],
 ['FTA','Fault Tree Analysis','フォールトツリー解析（故障の木解析）'],
 ['HAZOP','Hazard and Operability Study','ハザードと運用性の検討','HAZardとOPerabilityの語から作られた名称。'],
 ['QFD','Quality Function Deployment','品質機能展開'],
 ['GQM','Goal Question Metric','目標・質問・測定指標','目標から質問を決め、その回答に必要な測定指標を選ぶ。QはQualityではなくQuestion。'],
 ['PBR','Perspective-Based Reading','観点に基づく読解・レビュー'],
 ['CBR','Checklist-Based Reading','チェックリストに基づく読解・レビュー','この教材のレビュー技法での意味。'],
 ['CFD','Cause Flow Diagram','原因流れ図','この教材のテスト設計技法での意味。流体解析の略語とは区別する。'],
 ['MBD','Model-Based Development','モデルベース開発','この教材ではDevelopment。分野によってはModel-Based Designという表記も用いる。'],
 ['SysML','Systems Modeling Language','システムモデリング言語'],
 ['UML','Unified Modeling Language','統一モデリング言語'],
 ['TDD','Test-Driven Development','テスト駆動開発'],
 ['V&V','Verification and Validation','検証と妥当性確認'],
 ['LOC','Lines of Code','ソースコード行数'],
 ['KLOC','Kilo Lines of Code','ソースコード1,000行単位','Kはkilo（千）。1 KLOC＝1,000行。'],
 ['MTBF','Mean Time Between Failures','平均故障間隔（平均稼働時間）'],
 ['MTTR','Mean Time To Repair','平均修復時間','この教材ではRepair。サービス運用の資料ではRecoveryやRestoreなどを指す場合もある。'],
 ['MTTF','Mean Time To Failure','平均故障寿命'],
 ['SQuaRE','Systems and software Quality Requirements and Evaluation','システム及びソフトウェアの品質要求及び評価'],
 ['SQuBOK','Software Quality Body of Knowledge','ソフトウェア品質知識体系'],
 ['SWEBOK','Software Engineering Body of Knowledge','ソフトウェアエンジニアリング知識体系'],
 ['UX','User Experience','ユーザー体験'],
 ['UI','User Interface','ユーザーインタフェース'],
 ['HCD','Human-Centred Design','人間中心設計'],
 ['STRIDE','Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege','なりすまし・改ざん・否認・情報漏えい・サービス拒否・権限昇格','6種類の脅威の頭文字を組み合わせた名称。'],
 ['PIA','Privacy Impact Assessment','プライバシー影響評価'],
 ['PET','Privacy-Enhancing Technologies','プライバシー保護技術','単数形のTechnologyや複数形の略記PETsもある。'],
 ['AI','Artificial Intelligence','人工知能'],
 ['ML','Machine Learning','機械学習'],
 ['TP','True Positive','真陽性'],
 ['FP','False Positive','偽陽性','分類指標の文脈。機能規模の文脈ではFunction Point（ファンクションポイント）を指す。'],
 ['FN','False Negative','偽陰性'],
 ['TN','True Negative','真陰性'],
 ['TPR','True Positive Rate','真陽性率（再現率）'],
 ['FPR','False Positive Rate','偽陽性率'],
 ['AUC','Area Under the Curve','曲線下の面積','この教材の分類指標では通常ROC曲線の下の面積を指す。'],
 ['ROC','Receiver Operating Characteristic','受信者動作特性'],
 ['IoT','Internet of Things','モノのインターネット'],
 ['CoAP','Constrained Application Protocol','制約のある機器向けのアプリケーション通信プロトコル'],
 ['DTLS','Datagram Transport Layer Security','データグラム通信向けの通信保護プロトコル'],
 ['TLS','Transport Layer Security','通信を保護するプロトコル'],
 ['UDP','User Datagram Protocol','データグラムを送受信する通信プロトコル'],
 ['TCP','Transmission Control Protocol','信頼性のあるデータ転送を提供する通信プロトコル'],
 ['CI','Continuous Integration','継続的インテグレーション'],
 ['CD','Continuous Delivery / Continuous Deployment','継続的デリバリー／継続的デプロイ','文脈で区別する。Deliveryはリリース可能な状態の維持、Deploymentは本番への自動反映までを含む。'],
 ['DevOps','Development and Operations','開発と運用','DevelopmentとOperationsを組み合わせた名称。'],
 ['SaaS','Software as a Service','ソフトウェアをサービスとして提供'],
 ['PaaS','Platform as a Service','実行・開発基盤をサービスとして提供'],
 ['IaaS','Infrastructure as a Service','計算・ストレージ・ネットワーク基盤をサービスとして提供'],
 ['SLA','Service Level Agreement','サービスレベル合意'],
 ['SLM','Service Level Management','サービスレベル管理'],
 ['ITIL','Information Technology Infrastructure Library','ITサービス管理の実践をまとめた体系','名称の由来を示す。製品・サービス名としてITILの表記も使われる。'],
 ['ITSM','Information Technology Service Management','ITサービスマネジメント'],
 ['IT','Information Technology','情報技術'],
 ['OSS','Open Source Software','オープンソースソフトウェア'],
 ['MSR','Mining Software Repositories','ソフトウェアリポジトリのマイニング（分析）'],
 ['API','Application Programming Interface','プログラム間の呼出し・連携インタフェース'],
 ['OS','Operating System','基本ソフトウェア'],
 ['KPI','Key Performance Indicator','重要業績評価指標'],
 ['QA','Quality Assurance','品質保証'],
 ['QC','Quality Control','品質管理']
 ];
 const entries=rows.map(([short,english,japanese,note=''])=>Object.freeze({short,english,japanese,note}));
 const word=c=>/[A-Za-z0-9_]/.test(c||'');
 const aliases=[...entries.map(e=>[e.short,e]),['TMMI',entries.find(e=>e.short==='TMMi')],['PETs',entries.find(e=>e.short==='PET')],['V＆V',entries.find(e=>e.short==='V&V')]].sort((a,b)=>b[0].length-a[0].length);
 function find(text,context=''){
  const s=String(text||'').normalize('NFKC').replace(/https?:\/\/\S+/g,''),matches=[];
  for(const [name,e] of aliases){let at=s.indexOf(name);while(at!==-1){const end=at+name.length,left=s[at-1],right=s[end];
   const boundaryLeft=!word(left)||(e.short==='KLOC'&&/\d/.test(left||''));
   const boundaryRight=!word(right)||(['ISO','IEC','IEEE'].includes(e.short)&&/\d/.test(right||''));
   if(boundaryLeft&&boundaryRight&&!matches.some(m=>at>=m.at&&end<=m.end)){matches.push({at,end,e});break;}
   at=s.indexOf(name,end);
  }}
  const unique=new Map();
  for(const m of matches.sort((a,b)=>a.at-b.at)){
   let e=m.e;
   if(e.short==='FP'&&/ファンクションポイント|機能規模|機能点/.test(context)&&!/(?:TP|FN|TN|偽陽性|適合率|再現率|分類モデル)/.test(context))e={...e,english:'Function Point',japanese:'ファンクションポイント',note:'利用者から見た機能を基に測る機能規模の単位。分類指標のFalse Positiveとは区別する。'};
   unique.set(e.short,e);
  }
  return [...unique.values()];
 }
 function description(e){return e.short+' = '+e.english+'（'+e.japanese+'）'+(e.note?'\n補足：'+e.note:'');}
 function explainLines(lines,context=''){
  const seen=new Set();
  return (lines||[]).map(line=>{
   const text=String(line),colon=text.indexOf('：'),head=colon>=0?text.slice(0,colon):'',body=colon>=0?text.slice(colon+1):text;
   const found=find(text,context).filter(e=>!seen.has(e.short));for(const e of found)seen.add(e.short);
   if(!found.length)return text;
   const primary=find(head,context).map(e=>e.short),front=found.filter(e=>primary.includes(e.short)),rest=found.filter(e=>!primary.includes(e.short));
   let out=front.length?head+'：正式名称\n'+front.map(description).join('\n')+'\n意味：'+body:text;
   if(rest.length)out+='\n略語の正式名称：\n'+rest.map(description).join('\n');
   return out;
  });
 }
 function install(K){
  if(!K||K.acronymVersion==='15.9')return;
  const originalNotes=K.notes;
  K.notes=(q,index)=>explainLines(originalNotes(q,index),[q.text,q.family,q.topic,q.category].filter(Boolean).join('\n'));
  K.questionText=q=>q.options.map((value,i)=>'選択肢「'+value+'」\n'+K.notes(q,i).join('\n')).join('\n\n');
  K.decorate=q=>{
   if(!q||!Array.isArray(q.options)||q.acronymExplanationVersion==='15.9')return q;
   let base=q.explanation||'';
   if(q.keywordExplanationVersion){const mark='\n\n【この問題の補足】\n',at=base.lastIndexOf(mark);if(at>=0)base=base.slice(at+mark.length);}
   return {...q,keywordExplanationVersion:'15.8',acronymExplanationVersion:'15.9',explanation:'【各選択肢のキーワード】\n'+K.questionText(q)+'\n\n【この問題の補足】\n'+base};
  };
  K.acronymVersion='15.9';
 }
 return {version:'15.9',entries,find,description,explainLines,install};
});
