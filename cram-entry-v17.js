/* Non-invasive launcher for the 12-day official-style practice.
   The legacy exercises and their history remain unchanged. */
(()=>{'use strict';
const root=document.getElementById('app');if(!root)return;
function paint(){
 const main=root.querySelector('main#main');if(!main||main.querySelector('[data-cram-entry]'))return;
 if(!main.querySelector('.hero .eyebrow')||!main.querySelector('[aria-label="本番校正10回"]'))return;
 const card=document.createElement('section');card.className='panel';card.dataset.cramEntry='17.0';
 card.style.borderColor='var(--brand)';
 card.innerHTML='<span class="tag">11月14日までの短期集中 · 公式公開問題の形式を参考</span><h2 style="margin-top:12px">本番形式の初見40問 × 2回</h2><p>従来の用語問題より判断・比較・複数条件・計算を重視した独自80問。誤答はシラバス番号で分析し、12日間の学習計画に反映できます。これまでの履歴は保持します。</p><a class="primary" style="display:inline-block;text-decoration:none;padding:12px 17px;border-radius:12px" href="./cram.html">実戦80問と12日間の計画を開く</a><p class="muted" style="margin-top:12px">公式試験の出題・難易度を保証する教材ではありません。</p>';
 const marker=main.querySelector('[aria-label="本番校正10回"]')||main.firstChild;
 main.insertBefore(card,marker);
}
const o=new MutationObserver(()=>{queueMicrotask(paint);});o.observe(root,{childList:true,subtree:true});paint();
})();