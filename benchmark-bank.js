/* v13 benchmark bank.
   Uses the 170 syllabus checkpoints already bundled with this site.
   Official public questions are used only as difficulty/style anchors; no official question text is copied. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports={build:factory};
 else root.JCSQEBenchmarkBank=factory(root.JCSQE_SYLLABUS_CONCEPTS||[]);
})(typeof window!=='undefined'?window:globalThis,function(concepts){
'use strict';
const rows=(concepts||[]).map(x=>({...x}));
if(rows.length!==170)throw new Error('benchmark: syllabus checkpoints must be 170');
let serial=1;const qs=[],id=()=>`B13-${String(serial++).padStart(3,'0')}`;
const peers=q=>{
 const fam=rows.filter(x=>x.id!==q.id&&x.family===q.family);
 const chap=rows.filter(x=>x.id!==q.id&&x.chapter===q.chapter&&!fam.some(y=>y.id===x.id));
 return [...fam,...chap];
};
for(let i=0;i<rows.length;i++){
 const q=rows[i],p=peers(q)[i%peers(q).length];
 qs.push({id:id(),type:'contrast',chapter:q.chapter,family:q.family,level:q.level,syllabus:q.syllabus,
  text:`次の説明①・②と用語の対応として、もっとも適切なものを選べ。\n\n① ${q.definition}\n② ${p.definition}`,
  options:[`① ${q.term} ／ ② ${p.term}`,`① ${p.term} ／ ② ${q.term}`,`① ${q.term} ／ ② ${q.term}`,`① ${p.term} ／ ② ${p.term}`],correct:0,
  brief:`①=${q.term}、②=${p.term}。同じ分野の近い概念を対象・目的・利用場面で区別する。`,
  detail:`①は「${q.term}」、②は「${p.term}」の定義に対応する。`,
  reasons:[`両方の対応が正しい。`,`①と②を逆にしている。`,`②は${p.term}であり両方を${q.term}にはできない。`,`①は${q.term}であり両方を${p.term}にはできない。`]});
}
for(let i=0;i<rows.length;i++){
 const q=rows[i],ps=peers(q),a=[q];
 for(const p of ps){if(a.length===4)break;if(!a.some(x=>x.id===p.id))a.push(p);}
 for(let k=0;a.length<4;k++){const p=rows[(i+k+17)%rows.length];if(!a.some(x=>x.id===p.id))a.push(p);}
 const bad=(i*3+1)%4,donor=(bad+1)%4;
 qs.push({id:id(),type:'mismatch',chapter:q.chapter,family:q.family,level:q.level,syllabus:q.syllabus,
  text:'次の用語と説明の組合せのうち、もっとも不適切なものを選べ。',
  options:a.map((x,j)=>`${x.term} ― ${j===bad?a[donor].definition:x.definition}`),correct:bad,
  brief:'同一分野の用語を、説明の対象・目的・使い方まで一致するかで判断する。',
  detail:`不適切なのは${'ABCD'[bad]}。${a[bad].term}に${a[donor].term}の説明を割り当てている。`,
  reasons:a.map((x,j)=>j===bad?`${x.term}の説明ではない。この説明は${a[donor].term}に対応する。`:`${x.term}と説明が対応している。`)});
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
four(v=>{const aa=[1.5,2,0.8,3][v],bb=[2,1,4,0][v],x=[4,5,10,3][v],y=aa*x+bb;return{chapter:'品質技術',family:'データ解析',level:'L3',syllabus:'3.9.4',
 text:`回帰式 y=${aa}x+${bb} にデータ範囲内のx=${x}を代入した予測値はどれか。`,options:[String(y),String(aa*x),String(y+aa),String(bb+x)],correct:0,
 brief:'回帰式には切片まで含めて代入する。',detail:`y=${aa}×${x}+${bb}=${y}。`,reasons:['正しい。','切片を落としている。','不要な項を足す。','式を使っていない。']};});
four(v=>{const kx=[12,20,8,15][v],dx=[36,50,24,60][v],ky=[8,10,6,12][v],dy=[32,30,24,60][v],rx=dx/kx,ry=dy/ky;return{chapter:'品質技術',family:'測定',level:'L2',syllabus:'3.1.2 / 3.1.3',
 text:`同じ検出基準でXは${kx}KLOCから${dx}件、Yは${ky}KLOCから${dy}件の欠陥が見つかった。欠陥密度の比較として正しいものはどれか。`,
 options:[`X=${rx}件/KLOC、Y=${ry}件/KLOC`,`X=${dx}、Y=${dy}件/KLOC`,`X=${kx/dx}、Y=${ky/dy}件/KLOC`,'総欠陥数だけで密度を比較する'],correct:0,
 brief:'欠陥密度は欠陥数÷規模。',detail:`X=${rx}、Y=${ry}件/KLOC。`,reasons:['正しい。','総数を密度にしている。','逆数。','規模差を無視。']};});
four(v=>{const u=[[90,150],[80,120],[100,140],[75,165]][v],m=(u[0]+u[1])/2;return{chapter:'品質の概念',family:'信頼性',level:'L2',syllabus:'1.3',
 text:`装置が${u[0]}時間稼働して故障し、修理後さらに${u[1]}時間稼働して故障した。MTBFを総稼働時間÷故障回数で求めるといくつか。`,
 options:[`${m}時間`,`${u[0]+u[1]}時間`,`${m+10}時間`,'10時間'],correct:0,brief:'MTBF=総稼働時間÷故障回数。',detail:`${u[0]+u[1]}÷2=${m}時間。`,
 reasons:['正しい。','故障回数で割っていない。','修理時間を混ぜる。','修理時間と混同。']};});
four(v=>{const tp=[30,48,72,45][v],fp=[10,12,18,15][v],fn=[20,12,8,5][v],p=Math.round(tp/(tp+fp)*1000)/10,r=Math.round(tp/(tp+fn)*1000)/10;return{chapter:'新領域',family:'AI品質',level:'L1',syllabus:'5.1.1',
 text:`分類モデルでTP=${tp}, FP=${fp}, FN=${fn}。PrecisionとRecallの正しい組合せはどれか。`,options:[`Precision ${p}%、Recall ${r}%`,`Precision ${r}%、Recall ${p}%`,`Precision ${Math.round(tp/(tp+fp+fn)*1000)/10}%、Recall 同じ`,`Precision 100%、Recall ${r}%`],correct:0,
 brief:'Precision=TP/(TP+FP)、Recall=TP/(TP+FN)。',detail:`Precision=${p}%、Recall=${r}%。`,reasons:['正しい。','逆。','分母が違う。','FPがある。']};});
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
 brief:'保守分類は変更理由で決める。',detail:`A=${p[2]}、B=${p[3]}。`,reasons:['正しい。','逆。','両方が欠陥修正ではない。','両方が環境変化対応ではない。']};});
four(v=>{const g=['必要最小限だけ収集する設計','導入前に影響と残余リスクを評価','匿名化・暗号化技術を適用','初期設定を非公開側にする設計'],ans=[0,1,2,0],o=['Privacy by Design','PIA','PET','ISMSリスクアセスメント'];return{chapter:'専門品質',family:'プライバシー',level:'L2',syllabus:'4.4.2',
 text:`「${g[v]}」にもっとも直接対応するものはどれか。`,options:o,correct:ans[v],brief:'設計原則・影響評価・保護技術を区別する。',detail:`${o[ans[v]]}に対応する。`,reasons:o.map((x,i)=>i===ans[v]?'直接一致。':'関連するが活動種類が違う。')};});
four(v=>{const d=['有限状態を全探索して禁止状態への到達を確認','数理的な言語で仕様を記述','公理と推論規則で性質を証明','実行モデルを動かして挙動を観察'],o=['モデル検査','形式仕様記述','定理証明','シミュレーション'];return{chapter:'品質技術',family:'形式手法',level:'L1',syllabus:'3.3.1 / 3.3.2',
 text:`「${d[v]}」にもっとも対応するものはどれか。`,options:o,correct:v,brief:'記述・状態探索・論理証明・実行観察を区別する。',detail:`${o[v]}に対応する。`,reasons:o.map((x,i)=>i===v?'正しい。':'別の方法。')};});
four(v=>{const d=['IaaSで自社導入OSのパッチ管理','小さい変更を頻繁に統合しビルド・試験','先行利用者で異常を検知し展開停止','月間稼働率を契約式で評価'],o=['契約で代行がなければ利用者側でゲストOS更新を管理','CIとして統合ごとに自動検査し早期修正','カナリア展開の基準に従い停止・切戻し','SLA定義の分母・除外条件で計算'];return{chapter:'新領域',family:v===0||v===3?'クラウド':'DevOps',level:'L2',syllabus:v===0||v===3?'5.4':'5.3.3',
 text:`次の状況にもっとも適切な対応はどれか。\n${d[v]}`,options:o,correct:v,brief:'責任分界・CI・段階展開・SLAを区別する。',detail:`${o[v]}が中心。`,reasons:o.map((x,i)=>i===v?'直接対応。':'別の運用概念。')};});

if(qs.length!==400)throw new Error('benchmark total '+qs.length);
const formSets=Array.from({length:10},(_,i)=>({form:i+1,ids:[]}));
for(let i=0;i<170;i++)formSets[i%10].ids.push(qs[i].id);
for(let i=170;i<340;i++)formSets[(i-170)%10].ids.push(qs[i].id);
for(let i=340;i<400;i++)formSets[(i-340)%10].ids.push(qs[i].id);
for(const f of formSets)if(f.ids.length!==40)throw new Error('form length');
return {version:'13.0',published:true,total:400,forms:10,questions:qs,formSets,
 calibration:{label:'公式公開問題準拠',note:'日科技連が公開する初級サンプル問題・過去の出題解説を難易度・選択肢設計・説明粒度のアンカーにした独自問題。公式問題そのものではなく、本番得点の保証ではない。',
  officialExam:{questions:40,minutes:60,levels:['L1','L2','L3'],passLine:'70%程度'},
  anchors:['https://www.juse.jp/jcsqe/content/jcsqe_beginner_sample.pdf','https://www.juse.jp/jcsqe/study/past/','https://www.juse.jp/jcsqe/study/past/22_syokyu_discription.pdf','https://www.juse.jp/jcsqe/study/past/26_syokyu_discription.pdf']}};
});