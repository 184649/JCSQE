'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const sources=['advanced-syllabus-v16.js','cram-q1-v17.js','cram-q2-v17.js','cram-q3a-v17.js','cram-q3b-v17.js','cram-q3c-v17.js','cram-q4-v17.js','cram-q5-v17.js','cram-bank-v17.js'];
function loadScripts(ctx,names){for(const name of names){const script=fs.readFileSync(path.join(root,name),'utf8');vm.runInContext(script,ctx,{filename:name});}}
function bankContext(){const ctx=vm.createContext({window:{}});loadScripts(ctx,sources);return ctx;}
test('80 independent, syllabus-mapped items split evenly into two distinct timed forms',()=>{
 const c=bankContext().window.JCSQECram,all=[...c.forms.A,...c.forms.B];
 assert.equal(all.length,80);assert.equal(c.forms.A.length,40);assert.equal(c.forms.B.length,40);
 assert.equal(new Set(all.map(q=>q.id)).size,80);
 assert.equal(new Set(all.map(q=>q.text)).size,80);
 const expected={1:8,2:16,3:36,4:10,5:10},actual={};
 for(const q of all){
  actual[q.chapterId]=(actual[q.chapterId]||0)+1;
  assert.equal(q.options.length,4,q.id);
  assert.equal(q.notes.length,4,q.id);
  assert.equal(new Set(q.options).size,4,q.id);
  assert.ok(q.correct>=0&&q.correct<4,q.id);
  assert.ok(q.why.length>=10,q.id);
  assert.ok(q.notes.every(Boolean),q.id);
 }
 assert.deepEqual(actual,expected);
 assert.equal(c.forms.A.filter(q=>q.chapterId===3).length,18);
 assert.equal(c.forms.B.filter(q=>q.chapterId===3).length,18);
});
test('homepage and saved answering survive a simulated reload without touching old history',()=>{
 const data=new Map(),id='p_old',hist=[{id:'legacy-old-answer',correct:true}];
 data.set('jcsqe-shokyu-state-v3',JSON.stringify({version:7,activeProfileId:id,profiles:{[id]:{history:hist,sessions:[],bookmarks:[]}}}));
 function app(){
  const listeners={},el={innerHTML:'',addEventListener:(n,fn)=>{listeners[n]=fn;}};
  const doc={getElementById:x=>x==='cram-app'?el:null,documentElement:{dataset:{}}};
  const store={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const ctx=vm.createContext({window:{},document:doc,localStorage:store,clearInterval:()=>{},setInterval:()=>0,confirm:()=>true,Intl,Date,Math});
  loadScripts(ctx,sources);loadScripts(ctx,['cram-ui-v17.js']);
  function click(act,extra={}){const t={dataset:{act,...extra},disabled:false};t.closest=()=>t;listeners.click({target:t});}
  return{ctx,el,click};
 }
 let s=app();assert.match(s.el.innerHTML,/40問/);
 s.click('start',{form:'A'});
 const q=s.ctx.window.JCSQECram.forms.A[0];
 s.click('answer',{opt:String(q.correct)});
 const before=JSON.parse(data.get('jcsqe-shokyu-state-v3'));
 assert.equal(before.profiles[id].cramStudy.active.answers[q.id],q.correct);
 assert.deepEqual(before.profiles[id].history,hist);
 s=app();
 assert.match(s.el.innerHTML,/再開/);
 s.click('resume');
 assert.match(s.el.innerHTML,/初見A/);
 assert.equal(JSON.parse(data.get('jcsqe-shokyu-state-v3')).profiles[id].cramStudy.active.answers[q.id],q.correct);
});
