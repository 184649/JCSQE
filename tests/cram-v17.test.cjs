'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'..');
const files=['advanced-syllabus-v16.js','cram-q1-v17.js','cram-q2-v17.js','cram-q3a-v17.js','cram-q3b-v17.js','cram-q4-v17.js','cram-q5-v17.js','cram-q-extra-v17.js','cram-bank-v17.js'];
function load(){
 const context={};context.window=context;vm.createContext(context);
 for(const filename of files)vm.runInContext(fs.readFileSync(path.join(dir,filename),'utf8'),context,{filename});
 return context.JCSQECram;
}
test('80 original tasks, stable and disjoint forms',()=>{
 const b=load();
 assert.equal(b.questions.length,80);
 assert.equal(b.forms.A.length,40);
 assert.equal(b.forms.B.length,40);
 assert.equal(new Set(b.questions.map(q=>q.id)).size,80);
 assert.equal(new Set(b.questions.map(q=>q.text)).size,80);
 const formA=new Set(b.forms.A.map(q=>q.id)),formB=new Set(b.forms.B.map(q=>q.id));
 assert.equal([...formA].filter(id=>formB.has(id)).length,0);
 assert.deepEqual([...formA,...formB].sort(),Array.from(b.questions,q=>q.id).sort());
});
test('All five syllabus chapters have balanced representation in both mocks',()=>{
 const b=load(),expected=[4,8,16,6,6];
 for(const f of [b.forms.A,b.forms.B])for(let i=1;i<=5;i++)assert.equal(f.filter(q=>q.chapterId===i).length,expected[i-1]);
});
test('All selections, answer explanations, levels, and topic mappings are usable',()=>{
 const b=load();
 for(const q of b.questions){
  assert.match(q.id,/^X17-[1-5]\d{2}$/);
  assert.ok(q.text.length>=25,q.id+': short stem');
  assert.equal(q.options.length,4,q.id);
  assert.equal(q.notes.length,4,q.id);
  assert.equal(new Set(q.options).size,4,q.id);
  assert.ok(q.options.every(Boolean),q.id);
  assert.ok(q.notes.every(Boolean),q.id);
  assert.ok(q.why.length>=8,q.id);
  assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<=3,q.id);
  assert.match(q.syllabus,/^\d+(?:\.\d+)*$/);
  assert.match(q.level,/^L[123]$/);
 }
});
test('Original application assets and local state compatibility are retained',()=>{
 const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 const cram=fs.readFileSync(path.join(dir,'cram.html'),'utf8');
 const sw=fs.readFileSync(path.join(dir,'sw.js'),'utf8');
 assert.match(html,/cram-link-v17\.js/);
 assert.match(cram,/cram-q-extra-v17\.js/);
 assert.match(sw,/cram\.html/);
 assert.match(sw,/url\.pathname\.endsWith\('\/cram\.html'\)/);
 assert.match(sw,/cram-q-extra-v17\.js/);
 assert.match(fs.readFileSync(path.join(dir,'cram-ui-v17.js'),'utf8'),/jcsqe-shokyu-state-v3/);
});
test('Cram browser assets parse without syntax errors',()=>{
 for(const filename of ['cram-ui-v17.js','cram-bank-v17.js','cram-link-v17.js',...files.filter(x=>x.startsWith('cram-q'))]){
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(dir,filename),'utf8'),{filename}));
 }
});
