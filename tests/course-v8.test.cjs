const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),Course=require(path.join(root,'course-engine.js'));
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'syllabus-course.js'),'utf8'),ctx);
const concepts=JSON.parse(JSON.stringify(ctx.window.JCSQE_SYLLABUS_CONCEPTS));
const profile=()=>({sessions:[],course:{history:[],session:null}}),T=Date.parse('2026-09-27T12:00:00Z');

test('course has 130 unique syllabus checkpoints across five major chapters',()=>{
 assert.equal(concepts.length,130);assert.equal(new Set(concepts.map(x=>x.id)).size,130);
 assert.deepEqual([...new Set(concepts.map(x=>x.chapter))].sort(),['品質の概念','品質マネジメント','品質技術','専門品質','新領域'].sort());
 assert.ok(concepts.every(x=>/^L[123]$/.test(x.level)&&x.term&&x.definition&&x.syllabus&&x.source.startsWith('https://')));
});
test('all three round variants have one registered answer and four unique options',()=>{
 for(const c of concepts)for(const r of [1,2,3]){const q=Course.question(concepts,c.id,r);assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.correct>=0&&q.correct<4);assert.ok(q.options[q.correct]);}
});
test('three rounds use different prompts for the same checkpoint',()=>{
 const q=[1,2,3].map(r=>Course.question(concepts,'C092',r));assert.equal(new Set(q.map(x=>x.text)).size,3);assert.equal(q[0].term,'Verification');
});
test('round 2 and 3 stay locked until every checkpoint in prior round has first attempt',()=>{
 const p=profile();let pr=Course.progress(concepts,p);assert.equal(pr.current,1);
 for(const c of concepts)p.course.history.push({conceptId:c.id,round:1,correct:true,confidence:'sure',timestamp:new Date(T).toISOString()});
 pr=Course.progress(concepts,p);assert.equal(pr.current,1);assert.equal(pr.waitingCheckpoint,1);assert.equal(pr.rounds[0].coverageComplete,true);assert.equal(pr.rounds[0].complete,false);p.sessions.push({kind:'mock',total:40,correct:32,courseCheckpointRound:1});pr=Course.progress(concepts,p);assert.equal(pr.current,2);assert.equal(pr.rounds[0].complete,true);
 for(const c of concepts)p.course.history.push({conceptId:c.id,round:2,correct:true,confidence:'sure',timestamp:new Date(T+86400000).toISOString()});
 pr=Course.progress(concepts,p);assert.equal(pr.waitingCheckpoint,2);p.sessions.push({kind:'mock',total:40,correct:35,courseCheckpointRound:2});pr=Course.progress(concepts,p);assert.equal(pr.current,3);
});
test('five-question commute session records sure, guess and unknown without double commit',()=>{
 const p=profile(),s=Course.makeSession(concepts,p,5,T);assert.equal(s.conceptIds.length,5);assert.equal(s.round,1);
 let q=Course.currentQuestion(concepts,s);assert.ok(Course.commit(concepts,p,s,q.correct,'sure',T+1000));assert.equal(Course.commit(concepts,p,s,q.correct,'sure',T+2000),null);
 s.index=1;q=Course.currentQuestion(concepts,s);Course.commit(concepts,p,s,(q.correct+1)%4,'guess',T+3000);
 const r=Course.finish(concepts,p,s,T+5000);assert.equal(r.total,5);assert.equal(r.details.length,5);assert.equal(p.course.history.length,5);assert.equal(r.details.filter(x=>x.confidence==='unknown').length,3);
});
test('round 3 hides feedback flag at session level',()=>{
 const p=profile();for(const r of [1,2]){for(const c of concepts)p.course.history.push({conceptId:c.id,round:r,correct:true,confidence:'sure',timestamp:new Date(T+r*86400000).toISOString()});p.sessions.push({kind:'mock',total:40,correct:34,courseCheckpointRound:r});}
 const s=Course.makeSession(concepts,p,5,T+3*86400000);assert.equal(s.round,3);assert.equal(s.delayed,true);
});
test('site readiness requires all three rounds, round3 >=85%, and three recent 32/40 mocks',()=>{
 const p=profile();for(const r of [1,2,3])for(const [i,c] of concepts.entries())p.course.history.push({conceptId:c.id,round:r,correct:r<3||i<115,confidence:'sure',timestamp:new Date(T+r*86400000+i).toISOString()});
 assert.equal(Course.readiness(concepts,p).ready,false);
 p.sessions=[1,2,3].map((round,i)=>({appVersion:8,kind:'mock',total:40,correct:[32,35,36][i],courseCheckpointRound:round,finishedAt:new Date(T+i*86400000).toISOString()}));
 const ready=Course.readiness(concepts,p);assert.ok(ready.round3Accuracy>=85);assert.equal(ready.ready,true);
});
