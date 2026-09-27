const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),C=require(path.join(root,'study-core.js')),Dojo=require(path.join(root,'dojo-engine.js'));
const ctx={window:{}};vm.createContext(ctx);for(const f of ['questions.js','supplement.js','syllabus-course.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const legacy=JSON.parse(JSON.stringify(ctx.window.JCSQE_QUESTIONS)),supp=JSON.parse(JSON.stringify(ctx.window.JCSQE_SUPPLEMENT)),concepts=JSON.parse(JSON.stringify(ctx.window.JCSQE_SYLLABUS_CONCEPTS)),catalog=C.catalog([...legacy,...supp]),bank=Dojo.build(concepts,catalog),T=Date.parse('2026-09-27T12:30:00Z');
const profile=()=>({dojo:{history:[],bookmarks:[],session:null}});

test('dojo builds 772 drill items from 170 checkpoints and 92 deduplicated case items',()=>{
 assert.equal(concepts.length,170);assert.equal(catalog.groups.length,92);assert.equal(bank.syllabus.length,680);assert.equal(bank.cases.length,92);assert.equal(bank.total,772);assert.equal(new Set(bank.all.map(x=>x.id)).size,772);
});
test('all syllabus variants have four unique options and one registered answer',()=>{
 for(const q of bank.syllabus){assert.equal(q.options.length,4,q.id);assert.equal(new Set(q.options).size,4,q.id);assert.ok(q.correct>=0&&q.correct<4,q.id);assert.ok(q.explanation);}
});
test('each checkpoint has four genuinely different prompt forms',()=>{
 for(const c of concepts){const xs=bank.syllabus.filter(x=>x.conceptId===c.id);assert.equal(xs.length,4);assert.equal(new Set(xs.map(x=>x.text)).size,4);}
});
test('filters support unanswered, wrong, uncertain, source, chapter, level and bookmarks',()=>{
 const p=profile(),sample=bank.syllabus.find(x=>x.level==='L2');assert.ok(sample);assert.equal(Dojo.filter(bank,p,{status:'unanswered'}).length,772);
 p.dojo.history.push({itemId:sample.id,correct:false,confidence:'guess',timestamp:new Date(T).toISOString()});p.dojo.bookmarks.push(sample.id);
 assert.ok(Dojo.filter(bank,p,{status:'wrong'}).some(x=>x.id===sample.id));assert.ok(Dojo.filter(bank,p,{status:'uncertain'}).some(x=>x.id===sample.id));assert.ok(Dojo.filter(bank,p,{status:'bookmarked'}).some(x=>x.id===sample.id));assert.ok(Dojo.filter(bank,p,{source:'syllabus'}).every(x=>x.kind==='syllabus'));assert.ok(Dojo.filter(bank,p,{chapter:sample.chapter}).every(x=>x.chapter===sample.chapter));assert.ok(Dojo.filter(bank,p,{level:'L2'}).every(x=>x.level==='L2'));
});
test('question session shuffles options while preserving score mapping and records unknowns',()=>{
 const p=profile(),s=Dojo.makeSession(bank,p,{source:'all',status:'all',order:'random'},10,T);assert.equal(s.itemIds.length,10);
 for(const id of s.itemIds){assert.deepEqual([...s.orders[id]].sort(),[0,1,2,3]);}
 let item=Dojo.current(bank,s);Dojo.commit(bank,p,s,item.correct,'sure',T+1000);s.index=1;item=Dojo.current(bank,s);Dojo.commit(bank,p,s,(item.correct+1)%4,'guess',T+2000);
 const r=Dojo.finish(bank,p,s,T+5000);assert.equal(r.total,10);assert.equal(r.details.length,10);assert.equal(r.details.filter(x=>x.confidence==='unknown').length,8);assert.equal(p.dojo.history.length,10);
});
test('new-first prioritizes unanswered items and repeat practice can continue after a session',()=>{
 const p=profile(),first=Dojo.makeSession(bank,p,{order:'new-first'},20,T);for(let i=0;i<first.itemIds.length;i++){first.index=i;const q=Dojo.current(bank,first);Dojo.commit(bank,p,first,q.correct,'sure',T+i+1);}Dojo.finish(bank,p,first,T+1000);
 const second=Dojo.makeSession(bank,p,{order:'new-first'},20,T+2000);assert.ok(second.itemIds.every(id=>!first.itemIds.includes(id)));
});
test('weak-first puts wrong or uncertain answered items ahead of mastered items when both exist',()=>{
 const p=profile(),a=bank.all[0],b=bank.all[1];p.dojo.history.push({itemId:a.id,correct:true,confidence:'sure',timestamp:new Date(T).toISOString()},{itemId:b.id,correct:false,confidence:'guess',timestamp:new Date(T+1).toISOString()});
 const xs=Dojo.choose(bank,p,{order:'weak-first'},20,T+10);assert.ok(xs.findIndex(x=>x.id===b.id)<xs.findIndex(x=>x.id===a.id)||!xs.some(x=>x.id===a.id));
});
