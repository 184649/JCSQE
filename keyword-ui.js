/* Additive presentation adapter; scoring, session state and localStorage are untouched. */
(() => {
'use strict';
const K=window.JCSQEKeywords;
if(!K)return;
if(window.JCSQETextbook)window.JCSQETextbook.optionNote=(q,index)=>K.notes(q,index);
const C=window.JCSQEStudy;
if(C){const catalog=C.catalog;C.catalog=(...args)=>{const c=catalog(...args);return {...c,groups:c.groups.map(g=>({...g,question:K.decorate(g.question)})),questions:new Map([...c.questions].map(([id,q])=>[id,K.decorate(q)]))};};}
const D=window.JCSQEDojo;
if(D){const build=D.build;D.build=(...args)=>{const b=build(...args),all=b.all.map(K.decorate),byId=new Map(all.map(q=>[q.id,q]));return {...b,all,byId,syllabus:b.syllabus.map(q=>byId.get(q.id)),cases:b.cases.map(q=>byId.get(q.id))};};}
const Q=window.JCSQECourse;
if(Q)for(const name of ['question','currentQuestion']){const fn=Q[name];Q[name]=(...args)=>K.decorate(fn(...args));}
function layout(){
 for(const book of document.querySelectorAll('.textbook-deep:not([data-keyword-layout])')){
  book.dataset.keywordLayout='15.8';
  const first=book.querySelector('.textbook-option');if(!first)continue;
  const section=first.closest('.textbook-section'),parent=book.parentElement;if(!section||!parent)continue;
  section.classList.add('keyword-options');section.dataset.keywordVersion='15.8';
  const heading=section.querySelector('h4');if(heading)heading.textContent='各選択肢のキーワード解説';
  for(const card of section.querySelectorAll('.textbook-option')){
   card.classList.add('keyword-card');
   const label=card.querySelector('.verdict');if(label)label.textContent=card.classList.contains('correct')?'この設問の正解':'この設問では不正解';
   const reason=document.createElement('details');reason.className='keyword-reason';const summary=document.createElement('summary');summary.textContent='今回の選択肢の判断';reason.append(summary);
   for(const paragraph of [...card.children].filter(x=>x.tagName==='P')){
    if(paragraph.firstElementChild?.textContent==='判定理由：')paragraph.firstElementChild.remove();
    const text=paragraph.textContent;
    if(text.startsWith('今回の判断：')){paragraph.textContent=text.slice('今回の判断：'.length);reason.append(paragraph);continue;}
    paragraph.classList.add('keyword-definition');
    const colon=text.indexOf('：');if(colon>0&&colon<65){const strong=document.createElement('strong');strong.textContent=text.slice(0,colon);paragraph.replaceChildren(strong,document.createTextNode('\n'+text.slice(colon+1)));}
   }
   if(reason.children.length>1)card.append(reason);
  }
  const core=[...parent.children].find(x=>x.classList.contains('core-explanation'));
  parent.insertBefore(section,core||book);
  if(core){const details=document.createElement('details');details.className='deep keyword-steps';const summary=document.createElement('summary');summary.textContent='正誤の理由・計算手順を確認';details.append(summary);parent.insertBefore(details,core);details.append(core);const label=core.querySelector('.core-wrong>b');if(label)label.textContent='選択した答えと設問の違い';}
  const bookSummary=book.querySelector(':scope > summary');if(bookSummary)bookSummary.textContent='関連用語・補足を読む';
 }
}
window.JCSQEKeywordLayout=layout;
const observer=new MutationObserver(()=>layout());
observer.observe(document.body,{childList:true,subtree:true});layout();
})();
