/* Display-only keyword explanations. Question text, answers, IDs and histories are not changed. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory;
 else root.JCSQEKeywords=factory(root.JCSQE_SYLLABUS_CONCEPTS||[]);
})(typeof window!=='undefined'?window:globalThis,function(concepts){
'use strict';
const norm=x=>String(x||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
const entries=(concepts||[]).map(x=>({...x})),byId=new Map(entries.map(x=>[x.id,x]));
const extra=[
 ['MTTR','故障した対象を修復するために要する時間の平均。修復時間の合計を修復件数で割る。故障間の稼働時間を表すMTBFとは区別する。','平均修復時間'],
 ['稼働率','観測時間のうち利用可能であった時間の割合。基本式は稼働時間÷観測時間。SLAでは契約の測定期間・除外条件に従う。','可用率'],
 ['命令網羅','実行可能な命令をどれだけ実行したかを見る網羅基準。命令網羅率は実行した命令数÷対象となる命令数。','命令網羅率|ステートメントカバレッジ'],
 ['分岐網羅','制御の分岐先をどれだけ通過したかを見る網羅基準。この教材の単純なif文では、各判定の真と偽をそれぞれ数える。','分岐網羅率|判定結果網羅|判定結果網羅率|ブランチカバレッジ'],
 ['条件網羅','複合条件を構成する個々の条件が真と偽の両方になったかを見る網羅基準。判定全体の結果を数える基準とは別である。','条件網羅率'],
 ['AND','論理積。すべての条件が真のときだけ、全体が真になる。','論理積'],
 ['OR','論理和。少なくとも一つの条件が真なら、全体が真になる。','論理和'],
 ['p管理図','検査した対象のうち、不適合品が占める割合を監視する管理図。p＝不適合品数÷検査数。一つの品に複数の不適合があっても、不適合品は1個と数える。',''],
 ['np管理図','検査数が一定のとき、不適合品の個数を監視する管理図。割合を扱うp管理図と区別する。',''],
 ['c管理図','一定の検査単位に含まれる不適合の個数を監視する管理図。一つの対象に複数の不適合があれば、それぞれを数える。',''],
 ['u管理図','単位当たりの不適合数を監視する管理図。u＝不適合数÷検査単位数。不適合品の割合ではない。',''],
 ['回帰式','説明変数から目的変数を説明・予測する式。例えばy=ax+bでは、aが傾き、bが切片で、予測時は両方の項を使う。','単回帰分析'],
 ['平均値','観測値の合計を観測数で割った値。大きく離れた観測値の影響を受ける。','算術平均'],
 ['中央値','値を小さい順に並べたときの中央の値。偶数個の場合は中央の2値の平均とするのが一般的。','メディアン'],
 ['クラスター分析','複数の特徴が似ている対象を、同じグループに分ける分析手法。目的変数を予測する重回帰分析とは目的が違う。','クラスタ分析'],
 ['相関','二つの変数が一緒に変動する関係。相関が観察されただけでは、一方が他方の原因だとは証明できない。','相関分析'],
 ['リスクマトリクス','リスクの発生可能性と影響度を縦横の軸に置き、リスクの大きさや対応優先度を整理する表。','リスクマトリックス'],
 ['PET','Privacy-Enhancing Technologies。個人情報の利用に伴うプライバシーリスクを減らす技術の総称。匿名化や暗号技術などを含む。','プライバシー保護技術'],
 ['シミュレーション','対象をモデル化し、条件を与えて動かすことで振る舞いを観察する方法。試した条件の観察と、すべての状態を調べるモデル検査は区別する。',''],
 ['TP','真陽性。実際に陽性であり、モデルも陽性と予測した件数。','真陽性'],
 ['FP','偽陽性。実際は陰性なのに、モデルが陽性と予測した件数。','偽陽性'],
 ['FN','偽陰性。実際は陽性なのに、モデルが陰性と予測した件数。','偽陰性'],
 ['TN','真陰性。実際に陰性であり、モデルも陰性と予測した件数。','真陰性'],
 ['予防コスト','欠陥や不適合を未然に防ぐための費用。品質教育、標準化、予防的な改善などが例。',''],
 ['評価コスト','要求や基準への適合を調べるための費用。検査やテストなどが例。',''],
 ['内部失敗コスト','顧客への提供前に見つかった欠陥・不適合が原因で生じる費用。修正や再テストなどが例。',''],
 ['外部失敗コスト','顧客への提供後に見つかった欠陥・不適合が原因で生じる費用。障害対応や補償などが例。',''],
 ['静的テスト','ソフトウェアを実行せずに、成果物の欠陥や品質を確認する活動。レビューや静的解析を含む。',''],
 ['動的テスト','ソフトウェアを実行して、入力に対する出力や振る舞いを確認する活動。',''],
 ['単体テスト','個々の関数やモジュールなど、比較的小さな構成要素を対象に行うテスト。','ユニットテスト|コンポーネントテスト'],
 ['結合テスト','構成要素を組み合わせ、インタフェースや相互作用、データ受け渡しを確認するテスト。','統合テスト'],
 ['システムテスト','システム全体を対象に、機能・性能などの要求を満たしているか確認するテスト。',''],
 ['受入テスト','利用者・顧客の要求や業務上の受入条件を満たすか確認するテスト。','受け入れテスト'],
 ['回帰テスト','変更によって既存の機能へ悪影響が生じていないか確認するテスト。修正箇所が直ったかだけの確認とは異なる。','リグレッションテスト'],
 ['再テスト','修正した欠陥が解消されたかを、以前失敗したテストなどで確認すること。','確認テスト'],
 ['フェイルセーフ','故障や異常が発生した際、危険な状態にならないよう、安全側へ移行させる考え方。',''],
 ['機密性','許可されていない主体に、情報を利用・開示させない性質。',''],
 ['インテグリティ','権限のない変更や破壊から情報・システムを保護する性質。','完全性'],
 ['可用性','必要なときに、許可された利用者が機能や情報を利用できる性質。',''],
 ['成熟性','この教材が参照する従来の製品品質モデルでは、通常の運用条件で信頼性の要求を満たす度合い。',''],
 ['障害許容性','故障・障害が発生していても、指定された水準で機能を続けられる性質。','フォールトトレランス'],
 ['回復性','障害発生後に、影響を受けたデータや必要な状態を回復できる性質。',''],
 ['モジュール性','一つの構成要素への変更が、ほかの構成要素に及ぼす影響を抑えられる性質。',''],
 ['解析性','変更の影響や障害原因、修正すべき箇所を調査・評価しやすい性質。',''],
 ['試験性','テスト基準を設定し、それを満たすか効率よくテストできる性質。','テスト容易性'],
 ['真正性','主体や資源が、主張どおりのものであると確認できる性質。',''],
 ['責任追跡性','主体が行った操作を、その主体まで一意にたどれる性質。',''],
 ['否認防止性','行為や事象が生じたことを証明し、後からそれを否定することを防ぐ性質。','']
];
for(const [term,definition,aliases] of extra)entries.push({id:'K:'+term,term,definition,aliases:aliases.split('|').filter(Boolean)});
const patches={
 'Verification':{definition:'定められた要求・仕様に、成果物が適合しているかを確かめること。例：要求仕様書と設計書を照合する。「仕様どおりか」が判断基準。',aliases:['検証']},
 'Validation':{definition:'成果物が、利用者のニーズや意図した利用目的を満たすかを確かめること。例：実際の業務を試作品で行えるか確認する。「必要なものか」が判断基準。',aliases:['妥当性確認']},
 '適合率（Precision）':{aliases:['Precision','適合率'],formula:'適合率＝TP÷(TP＋FP)。陽性と予測したものを分母にする。'},
 '再現率（Recall）':{aliases:['Recall','再現率'],formula:'再現率＝TP÷(TP＋FN)。実際に陽性だったものを分母にする。'},
 'プライバシー・バイ・デザイン':{aliases:['Privacy by Design']},
 'QMS':{aliases:['品質マネジメントシステム']},
 'リスクマネジメント':{aliases:['リスク管理']},
 'Pairwise法':{aliases:['ペアワイズ法','ペアワイズ','Pairwise']},
 'LOC':{aliases:['KLOC'],formula:'1 KLOCは1,000行。行数を単位とする規模指標で、規模だけで品質は判定しない。'},
 'MTBF':{definition:'修理可能な対象の、故障間の平均稼働時間。この教材の計算では、総稼働時間÷故障回数で求める。修復にかかった時間を分子へ混ぜない。'},
 '欠陥密度':{formula:'欠陥密度＝検出欠陥数÷対象規模。件/KLOCなど、分母の単位をそろえる。'}
};
for(const e of entries){const patch=patches[e.term];if(patch)Object.assign(e,patch);}
const byTerm=new Map(),byDefinition=new Map((concepts||[]).map(x=>[norm(x.definition),byId.get(x.id)]));
for(const e of entries){for(const name of [e.term,...(e.aliases||[])])byTerm.set(norm(name),e);byDefinition.set(norm(e.definition),e);}
const tokens=[...byTerm.entries()].sort((a,b)=>b[0].length-a[0].length);
function unique(xs){return [...new Map(xs.filter(Boolean).map(x=>[x.id,x])).values()];}
function named(text){
 const s=norm(text),spans=[],out=[];
 for(const [name,e] of tokens){let pos=s.indexOf(name);while(pos!==-1){const end=pos+name.length;const ascii=/^[a-z0-9][a-z0-9 /.-]*$/.test(name);
  const left=s[pos-1]||'',right=s[end]||'';
  if((!ascii||(!/[a-z0-9_]/.test(left)&&!/[a-z0-9_]/.test(right)))&&!spans.some(([a,b])=>pos>=a&&end<=b)){out.push(e);spans.push([pos,end]);break;}pos=s.indexOf(name,end);
 }}return unique(out);
}
function option(q,index){
 const text=String(q.options?.[index]||'');let terms=[],shared=false,note='';
 const exact=byTerm.get(norm(text))||byDefinition.get(norm(text));
 if(exact)terms=[exact];
 else if(text.includes(' — ')){
  const [label,...rest]=text.split(' — ');terms=named(label);const def=byDefinition.get(norm(rest.join(' — ')));
  if(def&&terms.length&&terms.every(t=>t.id!==def.id))note='選択肢に書かれた説明は「'+def.term+'」の説明です。用語の正しい意味は上記です。';
 }else terms=named(text);
 if(q.type==='same-topic-statement')terms=unique([...(q.targetConceptIds||[]).map(id=>byId.get(id)),...terms]);
 if(!terms.length){terms=(q.targetConceptIds||[]).map(id=>byId.get(id)).filter(Boolean);shared=true;}
 if(!terms.length){terms=named(q.text);shared=true;}
 if(!terms.length){terms=entries.filter(x=>x.family&&(x.family===(q.family||q.topic||q.category))).slice(0,3);shared=true;}
 if(shared&&terms.length)note='この選択肢は数値・記述なので、判断の基準となる共通のキーワードを示します。';
 return {option:text,terms:unique(terms),shared,note,reason:q.reasons?.[index]||'',unmapped:!terms.length};
}
function notes(q,index){const x=option(q,index);const out=x.terms.map(t=>t.term+'：'+t.definition+(t.formula?'\n'+t.formula:''));
 if(!out.length)out.push('用語の対応は未確認です。推測した定義は表示せず、既存の解説を下に残しています。');
 if(x.note)out.push(x.note);if(x.reason)out.push('今回の判断：'+x.reason);return out;
}
function questionText(q){return q.options.map((value,i)=>'選択肢「'+value+'」\n'+notes(q,i).join('\n')).join('\n\n');}
function decorate(q){if(!q||!Array.isArray(q.options)||q.keywordExplanationVersion)return q;return {...q,keywordExplanationVersion:'15.8',explanation:'【各選択肢のキーワード】\n'+questionText(q)+'\n\n【この問題の補足】\n'+(q.explanation||'')};}
return {version:'15.8',option,notes,named,questionText,decorate};
});
