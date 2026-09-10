(function(root, factory){
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.JCSQELogic = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){
  const LETTERS = ['A','B','C','D'];
  function clamp(n,min,max){ return Math.min(max,Math.max(min,n)); }
  function percent(n,d){ return d ? Math.round((n/d)*100) : 0; }
  function isoDay(value){ const d=new Date(value); if(Number.isNaN(d.getTime())) return ''; const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
  function emptyStats(){ return {answered:0,correct:0,accuracy:0,uniqueAnswered:0,wrongUnique:0}; }
  function calculateStats(questions, history){
    if(!Array.isArray(history) || history.length===0) return emptyStats();
    const valid = history.filter(h=>h && typeof h.questionId==='string' && typeof h.correct==='boolean');
    const correct = valid.filter(h=>h.correct).length;
    const latest = new Map(); valid.forEach(h=>latest.set(h.questionId,h));
    const wrongUnique=[...latest.values()].filter(h=>!h.correct).length;
    return {answered:valid.length,correct,accuracy:percent(correct,valid.length),uniqueAnswered:latest.size,wrongUnique};
  }
  function categoryStats(questions, history){
    const qMap=new Map(questions.map(q=>[q.id,q]));
    const map=new Map();
    history.forEach(h=>{
      const q=qMap.get(h.questionId); if(!q) return;
      const k=q.category; if(!map.has(k)) map.set(k,{category:k,answered:0,correct:0,accuracy:0});
      const s=map.get(k); s.answered++; if(h.correct) s.correct++;
    });
    for(const s of map.values()) s.accuracy=percent(s.correct,s.answered);
    return [...map.values()].sort((a,b)=>a.accuracy-b.accuracy || b.answered-a.answered || a.category.localeCompare(b.category,'ja'));
  }
  function latestByQuestion(history){ const m=new Map(); history.forEach(h=>m.set(h.questionId,h)); return m; }
  function wrongQuestionIds(history){
    return [...latestByQuestion(history).values()].filter(h=>!h.correct).map(h=>h.questionId);
  }
  function weakScores(questions, history){
    const qHist=new Map();
    history.forEach(h=>{ if(!qHist.has(h.questionId)) qHist.set(h.questionId,[]); qHist.get(h.questionId).push(h); });
    const cat=categoryStats(questions,history); const catAcc=new Map(cat.map(x=>[x.category,x.accuracy]));
    return questions.map(q=>{
      const arr=qHist.get(q.id)||[]; const last=arr[arr.length-1];
      let score=1;
      if(arr.length===0) score+=3;
      else {
        const acc=percent(arr.filter(x=>x.correct).length,arr.length);
        score += (100-acc)/20;
        if(last && !last.correct) score+=4;
        score += Math.min(arr.length,5)*0.15;
      }
      if(catAcc.has(q.category)) score += (100-catAcc.get(q.category))/35;
      else score += 1.5;
      return {id:q.id,score};
    });
  }
  function weightedSample(items, count, randomFn=Math.random){
    const pool=items.map(x=>({...x,weight:Math.max(0.01,Number(x.score||x.weight||1))})); const out=[];
    while(pool.length && out.length<count){
      const total=pool.reduce((s,x)=>s+x.weight,0); let r=randomFn()*total; let idx=0;
      for(;idx<pool.length;idx++){ r-=pool[idx].weight; if(r<=0) break; }
      if(idx>=pool.length) idx=pool.length-1;
      out.push(pool[idx]); pool.splice(idx,1);
    }
    return out;
  }
  function pickWeakQuestions(questions, history, count, randomFn=Math.random){
    const scores=weakScores(questions,history); const picked=weightedSample(scores,count,randomFn); const qMap=new Map(questions.map(q=>[q.id,q])); return picked.map(x=>qMap.get(x.id)).filter(Boolean);
  }
  function pickRandomQuestions(questions,count,randomFn=Math.random){
    const a=[...questions];
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(randomFn()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a.slice(0,Math.min(count,a.length));
  }
  function dailySeries(history, days=14, now=new Date()){
    const end=new Date(now); end.setHours(0,0,0,0); const rows=[];
    for(let i=days-1;i>=0;i--){ const d=new Date(end); d.setDate(end.getDate()-i); rows.push({date:isoDay(d),label:`${d.getMonth()+1}/${d.getDate()}`,answered:0,correct:0,accuracy:0}); }
    const map=new Map(rows.map(r=>[r.date,r]));
    history.forEach(h=>{ const k=isoDay(h.timestamp); const r=map.get(k); if(r){r.answered++; if(h.correct)r.correct++;}});
    rows.forEach(r=>r.accuracy=percent(r.correct,r.answered)); return rows;
  }
  function scoreAnswers(questionIds, answers, questionMap){
    let correct=0; const details=[];
    questionIds.forEach(id=>{ const q=questionMap.get(id); if(!q)return; const selected=answers[id]; const ok=selected===q.correct; if(ok)correct++; details.push({questionId:id,selected,correct:ok}); });
    return {correct,total:details.length,accuracy:percent(correct,details.length),details};
  }
  function sessionCategoryStats(details, questionMap){
    const map=new Map(); details.forEach(d=>{ const q=questionMap.get(d.questionId); if(!q)return; if(!map.has(q.category))map.set(q.category,{category:q.category,total:0,correct:0,accuracy:0}); const s=map.get(q.category); s.total++; if(d.correct)s.correct++;});
    for(const s of map.values())s.accuracy=percent(s.correct,s.total); return [...map.values()].sort((a,b)=>a.accuracy-b.accuracy||b.total-a.total);
  }
  function validateQuestions(questions){
    const errors=[]; if(!Array.isArray(questions)) return ['questions is not an array'];
    const ids=new Set(); const exams=new Map();
    questions.forEach((q,i)=>{
      if(!q||typeof q!=='object'){errors.push(`q${i}: invalid`);return;}
      if(!q.id||ids.has(q.id))errors.push(`${q.id||i}: duplicate/missing id`); ids.add(q.id);
      if(!Number.isInteger(q.exam)||q.exam<1||q.exam>10)errors.push(`${q.id}: invalid exam`);
      if(!Number.isInteger(q.number)||q.number<1||q.number>40)errors.push(`${q.id}: invalid number`);
      if(!q.text)errors.push(`${q.id}: missing text`); if(!q.category)errors.push(`${q.id}: missing category`);
      if(!Array.isArray(q.options)||q.options.length!==4||q.options.some(x=>!String(x).trim()))errors.push(`${q.id}: invalid options`);
      if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3)errors.push(`${q.id}: invalid correct`);
      if(!q.explanation)errors.push(`${q.id}: missing explanation`);
      exams.set(q.exam,(exams.get(q.exam)||0)+1);
    });
    for(let e=1;e<=10;e++) if(exams.get(e)!==40) errors.push(`exam ${e}: ${exams.get(e)||0} questions`);
    if(questions.length!==400) errors.push(`total ${questions.length}`);
    return errors;
  }
  return {LETTERS,clamp,percent,calculateStats,categoryStats,wrongQuestionIds,weakScores,weightedSample,pickWeakQuestions,pickRandomQuestions,dailySeries,scoreAnswers,sessionCategoryStats,validateQuestions};
});
