/* v17 additive main-screen shortcut. Does not alter study state. */
(()=>{'use strict';
const app=document.getElementById('app');if(!app)return;
let queued=false;
function place(){
 const main=app.querySelector('main#main');if(!main||main.querySelector('#cram-shortcut-v17'))return;
 const benchmark=main.querySelector('section[aria-label="本番校正10回"]');
 if(!benchmark)return;
 const sec=document.createElement('section');
 sec.id='cram-shortcut-v17';sec.className='panel';sec.setAttribute('aria-label','試験直前の実戦80問');
 sec.innerHTML='<span class="tag">NEW · 2026/11/14 直前対策</span><h2 style="margin-top:12px">公式公開過去問の形式で、難しい問題を解く</h2><p>従来の単語暗記だけでなく、複数記述の比較、技法選択、計算、空欄組合せを重点化。<b>新作80問・初見40問×2回・60分タイマー・全選択肢の解説・12日間の復習計画</b>。</p><p><a class="primary" href="./cram.html" style="display:inline-block;text-decoration:none">直前の実戦特訓を開く →</a></p><p class="muted">公式問題を転載せず独自作成。本番と同難度であることや得点を保証するものではありません。既存の学習履歴を残して追加します。</p>';
 benchmark.before(sec);
}
new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;place();});}).observe(app,{childList:true,subtree:true});
place();
})();