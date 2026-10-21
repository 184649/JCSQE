const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const A=require('../acronym-explanations.js');
test('dictionary records have distinct abbreviations, English expansions and Japanese meanings',()=>{
 assert.ok(A.entries.length>=70);assert.equal(new Set(A.entries.map(x=>x.short)).size,A.entries.length);
 for(const e of A.entries){assert.ok(/[A-Za-z]/.test(e.english),e.short);assert.ok(/[\u3040-\u9fff]/.test(e.japanese),e.short);}
});
test('main terms render English and Japanese without replacing the existing definition',()=>{
 const lines=A.explainLines(['FMEA：故障モードから影響を分析する。','GQM：目標から質問と測定指標を選ぶ。']);
 assert.match(lines[0],/FMEA：正式名称\nFMEA = Failure Mode and Effects Analysis/);
 assert.match(lines[0],/故障モード影響解析/);assert.match(lines[0],/意味：故障モードから影響/);
 assert.match(lines[1],/Goal Question Metric/);assert.match(lines[1],/QはQualityではなくQuestion/);
});
test('mixed case and slash-separated abbreviations are all recognized',()=>{
 const names=A.find('ISO/IEC/IEEE 29119、SQuaRE、TMMi、SysML、CoAP、IaaS、V＆V').map(x=>x.short);
 assert.deepEqual(names,['ISO','IEC','IEEE','SQuaRE','TMMi','SysML','CoAP','IaaS','V&V']);
});
test('short tokens never match inside ordinary words or longer abbreviations',()=>{
 assert.deepEqual(A.find('AIR SQAAPI TPS ISOFILE MODEL LOST PETROL some it and or').map(x=>x.short),[]);
 assert.deepEqual(A.find('ITSM DTLS KLOC FPR').map(x=>x.short),['ITSM','DTLS','KLOC','FPR']);
 assert.deepEqual(A.find('10KLOC ISO9001').map(x=>x.short),['KLOC','ISO']);
});
test('FP is resolved for function size and classification separately',()=>{
 assert.equal(A.find('FP','ファンクションポイントで機能規模を測る')[0].english,'Function Point');
 assert.equal(A.find('FP','TP=30, FP=10, FN=20の分類モデル')[0].english,'False Positive');
});
test('ISO and overloaded abbreviations have honest context notes',()=>{
 assert.match(A.find('ISO')[0].note,/頭文字.*ではなく/);
 assert.match(A.find('MTTR')[0].note,/Repair/);assert.match(A.find('CD')[0].note,/文脈/);
 assert.equal(A.find('Verification Validation AND OR').length,0);
});
test('an abbreviation is expanded once per choice, unknown abbreviations are not invented',()=>{
 const out=A.explainLines(['QMS：QMSを組織として管理する。','QMSは個別製品の保証ではない。','ZZQ：未登録の用語。']);
 assert.equal((out.join('\n').match(/Quality Management System/g)||[]).length,1);
 assert.equal(out[2],'ZZQ：未登録の用語。');
});
test('adapter is idempotent, keeps questions and scoring unchanged, and expands legacy explanations',()=>{
 const K={notes:(q,i)=>[q.options[i]+'：基礎的な意味。'],decorate:q=>q};A.install(K);A.install(K);
 const q={id:'TEST',text:'変更しない問題文',options:['FMEA','FTA','QFD','GQM'],correct:2,explanation:'元の補足'};const before=JSON.stringify(q),d=K.decorate(q);
 assert.equal(JSON.stringify(q),before);for(const k of ['id','text','correct'])assert.equal(d[k],q[k]);assert.deepEqual(d.options,q.options);
 assert.match(d.explanation,/Failure Mode and Effects Analysis/);assert.match(d.explanation,/Fault Tree Analysis/);
 assert.match(d.explanation,/Quality Function Deployment/);assert.match(d.explanation,/Goal Question Metric/);
 assert.equal(K.decorate(d),d);assert.match(d.explanation,/元の補足$/);
});
const root=path.resolve(__dirname,'..');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'syllabus-course.js'),'utf8'),ctx);
const concepts=JSON.parse(JSON.stringify(ctx.window.JCSQE_SYLLABUS_CONCEPTS));
const K=require('../keyword-explanations.js')(concepts);A.install(K);const bank=require('../benchmark-bank.js').build(concepts);
test('all 400 actual questions keep their answer keys and each option receives applicable expansions',()=>{
 const before=JSON.stringify(bank);let expanded=0;
 for(const q of bank.questions){for(let i=0;i<4;i++){const text=K.notes(q,i).join('\n');assert.ok(text.length>0);if(text.includes('正式名称'))expanded++;}
  const d=K.decorate(q);assert.equal(d.correct,q.correct);assert.equal(d.text,q.text);assert.deepEqual(d.options,q.options);
 }assert.equal(JSON.stringify(bank),before);assert.ok(expanded>300);console.log('Acronym-expanded option explanations:',expanded);
});
test('three entry pages load expansions before keyword UI and the worker caches the module',()=>{
 for(const name of ['index.html','practice.html','benchmark.html']){const html=fs.readFileSync(path.join(root,name),'utf8');
  assert.ok(html.indexOf('keyword-explanations.js')<html.indexOf('acronym-explanations.js'),name);
  assert.ok(html.indexOf('acronym-explanations.js')<html.indexOf('keyword-ui.js'),name);
 }assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/acronym-explanations\.js\?v=15\.9/);
});
