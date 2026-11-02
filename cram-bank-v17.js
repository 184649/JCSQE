/* JCSQE final-cram v17.0 — 80 original authored tasks, split into two unseen 40-question forms.
   Official published questions are NOT copied. */
(()=>{'use strict';
const parts=window.JCSQECramParts||[];
if(parts.length!==7)throw Error('実戦問題の分野別ファイルが不足しています。');
const rows=parts.flat(), ids=new Set(), stems=new Set(), scope=window.JCSQEAdvancedScope;
const chapterNames={1:'品質の概念',2:'品質マネジメント',3:'品質技術',4:'専門品質',5:'新領域'};
const expected={1:8,2:16,3:36,4:10,5:10}, groups={1:[],2:[],3:[],4:[],5:[]};
for(const row of rows){
 const [id,syllabus,level,kind,text,options,notes,correct,why]=row;
 const chap=Number((id||'').match(/^X17-([1-5])\d{2}$/)?.[1]);
 if(!chap||!scope?.byId?.has(syllabus)||scope.byId.get(syllabus).level!==level||
   ids.has(id)||stems.has(text)||typeof text!=='string'||text.length<25||
   !Array.isArray(options)||options.length!==4||new Set(options).size!==4||
   !Array.isArray(notes)||notes.length!==4||notes.some(x=>!x)||
   !Number.isInteger(correct)||correct<0||correct>3||!why)throw Error('問題検証エラー：'+id);
 ids.add(id);stems.add(text);
 groups[chap].push(Object.freeze({id,syllabus,level,kind,chapter:chapterNames[chap],chapterId:chap,text,options:Object.freeze(options),notes:Object.freeze(notes),correct,why}));
}
const forms={A:[],B:[]};
for(const k of [1,2,3,4,5]){
 const group=groups[k].sort((a,b)=>a.id.localeCompare(b.id));
 if(group.length!==expected[k])throw Error('問題配分に不足:'+k+' '+group.length);
 group.forEach((q,i)=>forms[i%2===0?'A':'B'].push(q));
}
if(forms.A.length!==40||forms.B.length!==40)throw Error('模試形式ごとの問題数が40ではありません。');
window.JCSQECram=Object.freeze({version:'17.0',chapters:chapterNames,questions:Object.freeze(rows.map(r=>groups[Number(r[0].split('-')[1][0])].find(q=>q.id===r[0]))),forms:{A:Object.freeze(forms.A),B:Object.freeze(forms.B)},byId:Object.freeze(Object.fromEntries([...forms.A,...forms.B].map(x=>[x.id,x]))),reference:'https://www.juse.jp/jcsqe/study/past/',syllabusUrl:'https://www.juse.jp/jcsqe/content/jcsqe_beginner_syllabus_ver_3_0.pdf'});
})();