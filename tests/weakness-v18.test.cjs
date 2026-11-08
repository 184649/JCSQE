'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const files=['advanced-syllabus-v16.js','weakness-q1-v18.js','weakness-q2-v18.js','weakness-q3-v18.js','weakness-q4-v18.js','weakness-bank-v18.js'];
const src=x=>fs.readFileSync(path.join(root,x),'utf8');
function bank(){
 const context={};context.window=context;vm.createContext(context);
 for(const file of files)vm.runInContext(src(file),context,{filename:file});
 return context.JCSQEWeakness;
}
test('Exactly 40 new, unique, syllabus-mapped questions with all option reasons',()=>{
 const B=bank(),ids=B.questions.map(x=>x.id),texts=B.questions.map(x=>x.text);
 assert.equal(B.questions.length,40);
 assert.equal(new Set(ids).size,40);
 assert.equal(new Set(texts).size,40);
 assert.equal(B.categories.length,7);
 for(const q of B.questions){
  assert.match(q.id,/^W18-\d{3}$/);
  assert.match(q.syllabus,/^\d+(?:\.\d+)*$/);
  assert.match(q.level,/^L[123]$/);
  assert.ok(q.text.length>25,q.id);
  assert.equal(q.options.length,4,q.id);
  assert.equal(q.notes.length,4,q.id);
  assert.equal(new Set(q.options).size,4,q.id);
  assert.ok(q.notes.every(x=>x&&x.length>=6),q.id);
  assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4,q.id);
  assert.ok(q.why.length>10,q.id);
 }
});
test('Page and homepage preserve the existing application and add offline support',()=>{
 const html=src('weakness.html'),index=src('index.html'),sw=src('sw.js');
 for(const file of files.filter(x=>x.startsWith('weakness-')))assert.ok(html.includes(file),file);
 assert.ok(html.includes('weakness-ui-v18.js'));
 assert.ok(index.includes('weakness-link-v18.js'));
 assert.ok(sw.includes('./weakness.html'));
 assert.ok(sw.includes("url.pathname.endsWith('/weakness.html')"));
 assert.ok(src('weakness-ui-v18.js').includes('jcsqe-shokyu-state-v3'));
});
test('A question is saved, reviewed and resumed without replacing earlier history',()=>{
 const window={},handlers={},rootNode={innerHTML:'',addEventListener:(k,fn)=>handlers[k]=fn},
 document={getElementById:()=>rootNode,documentElement:{dataset:{}}};
 const KEY='jcsqe-shokyu-state-v3';
 const old={version:7,activeProfileId:'p_test',profiles:{p_test:{name:'テスト',history:[{id:'old'}],sessions:[{id:'oldsession'}],appliedStudy:{history:[{id:'applied'}]},cramStudy:{forms:{A:{correct:32}}}}}};
 const values=new Map([[KEY,JSON.stringify(old)]]);
 const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 window.addEventListener=()=>{};window.prompt=()=>{};
 const ctx={window,document,localStorage,navigator:{},Date,Math,JSON,URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},Blob:class{},setTimeout:()=>{},location:{reload:()=>{}}};
 vm.createContext(ctx);
 for(const file of files)vm.runInContext(src(file),ctx,{filename:file});
 vm.runInContext(src('weakness-ui-v18.js'),ctx,{filename:'weakness-ui-v18.js'});
 const click=(act,extra={})=>handlers.click({target:{closest:()=>({dataset:{act,...extra},disabled:false})}});
 assert.match(rootNode.innerHTML,/演習を選ぶ/);
 click('start');
 let saved=JSON.parse(values.get(KEY)),p=saved.profiles.p_test,s=p.weaknessStudy.session;
 assert.equal(s.ids.length,40);
 const id=s.ids[0],correct=window.JCSQEWeakness.byId[id].correct;
 click('choose',{original:String(correct)});
 saved=JSON.parse(values.get(KEY));p=saved.profiles.p_test;
 assert.equal(p.weaknessStudy.attempts.length,1);
 assert.equal(p.weaknessStudy.attempts[0].correct,true);
 assert.match(rootNode.innerHTML,/選択肢の判定理由/);
 assert.equal(p.history[0].id,'old');
 assert.equal(p.sessions[0].id,'oldsession');
 assert.equal(p.appliedStudy.history[0].id,'applied');
 assert.equal(p.cramStudy.forms.A.correct,32);
 click('next');
 saved=JSON.parse(values.get(KEY));assert.equal(saved.profiles.p_test.weaknessStudy.session.index,1);
});
test('Browser scripts are syntactically valid',()=>{
 for(const file of [...files,'weakness-ui-v18.js','weakness-link-v18.js','sw.js'])assert.doesNotThrow(()=>new vm.Script(src(file),{filename:file}));
});
