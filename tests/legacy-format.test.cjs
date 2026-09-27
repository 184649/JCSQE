const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),C=require(path.join(root,'study-core.js')),ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'questions.js'),'utf8'),ctx);const qs=JSON.parse(JSON.stringify(ctx.window.JCSQE_QUESTIONS));
test('all ten legacy Q40 separators are display-only artifacts, with unchanged answers and source',()=>{
 const before=JSON.stringify(qs),c=C.catalog(qs);
 for(const raw of qs.filter(q=>q.number===40)){
  const display=c.questions.get(raw.id);
  assert.equal(display.correct,raw.correct);
  assert.equal(display.text,raw.text);
  for(let i=0;i<4;i++)assert.equal(display.options[i],raw.options[i].replace(/\s+-{3,}\s*$/,''));
  assert.equal(display.explanation,raw.explanation.replace(/\s+-{3,}\s*$/,''));
  assert.ok(c.byId.get(raw.id).ids.length>1);
 }
 assert.equal(JSON.stringify(qs),before);
 assert.equal(c.groups.length,52);
 const a=qs[0],b={...a,options:a.options.map((x,i)=>i===3?x+' ---':x)};
 assert.equal(C.fingerprint(a),C.fingerprint(b));
});
