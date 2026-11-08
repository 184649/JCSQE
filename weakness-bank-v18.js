/* v18 weakness-specific original practice bank. No personal learning records are embedded. */
(function(root){'use strict';
const parts=root.JCSQEWeaknessParts||[], scope=root.JCSQEAdvancedScope;
if(parts.length!==4||!scope?.byId)throw Error('弱点演習の問題・シラバス読込が不足しています。');
const rows=parts.flat(), ids=new Set(), stems=new Set();
const questions=rows.map((row,i)=>{
 const [category,syllabus,text,options,correct,notes,why]=row, id='W18-'+String(i+1).padStart(3,'0');
 if(!scope.byId.has(syllabus)||stems.has(text)||!Array.isArray(options)||options.length!==4||new Set(options).size!==4||!Array.isArray(notes)||notes.length!==4||notes.some(x=>!x)||!Number.isInteger(correct)||correct<0||correct>=4||!why)throw Error('弱点問題の検証エラー：'+id);
 ids.add(id);stems.add(text);const level=scope.byId.get(syllabus).level;
 return Object.freeze({id,category,syllabus,level,text,options:Object.freeze(options),correct,notes:Object.freeze(notes),why});
});
if(questions.length!==40||ids.size!==40)throw Error('弱点問題が40問ではありません。');
root.JCSQEWeakness=Object.freeze({version:'18.0',questions:Object.freeze(questions),byId:Object.freeze(Object.fromEntries(questions.map(x=>[x.id,x]))),categories:Object.freeze([...new Set(questions.map(x=>x.category))]),reference:'https://www.juse.jp/jcsqe/study/past/',syllabusUrl:scope.source});
})(typeof window!=='undefined'?window:globalThis);
