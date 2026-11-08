/* Additive weak-point shortcut; never changes saved study data. */
(()=>{'use strict';
const app=document.getElementById('app');if(!app)return;
let queued=false;
function place(){
 const main=app.querySelector('main#main');if(!main||main.querySelector('#weakness-shortcut-v18'))return;
 const cram=main.querySelector('#cram-shortcut-v17'),benchmark=main.querySelector('section[aria-label="本番校正10回"]');
 const anchor=cram||benchmark;if(!anchor)return;
 const sec=document.createElement('section');
 sec.id='weakness-shortcut-v18';sec.className='panel';sec.setAttribute('aria-label','弱点補強40問');
 sec.innerHTML='<span class="tag">NEW · 弱点補強v18</span><h2 style="margin-top:12px">実戦で間違えやすい知識だけを補強する</h2><p>レビュー・FTA/FMEA・テスト網羅率・統計／計算・AI評価・プライバシー・権利と変更管理の<b>独自40問</b>。初見優先、誤答復習、全4選択肢の解説に対応。</p><p><a class="primary" href="./weakness.html" style="display:inline-block;text-decoration:none">弱点補強40問を解く →</a></p><p class="muted">既存の成績を消さず、同じブラウザ内の学習プロフィールに追加保存します。</p>';
 if(cram)cram.after(sec);else benchmark.before(sec);
}
new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;place();});}).observe(app,{childList:true,subtree:true});place();
})();
