/* Scoped cache: never delete caches belonging to other GitHub Pages apps. */
const CACHE='jcsqe-shokyu-v15-2-20261007';
const ASSETS=['./practice.html','./benchmark.html','./benchmark.css?v=15.0','./benchmark-bank.js?v=15.2','./benchmark-engine.js?v=15.0','./textbook-v15.js?v=15.2','./benchmark-ui.js?v=15.2','./applied.css?v=15.2','./practice-bank-v15.js?v=15.1','./applied-engine.js?v=15.1','./applied-explanation-guide.js?v=12.2','./applied-ui.js?v=15.2','./applied-entry.js?v=15.1','./index.html','./study.css?v=10.2','./questions.js?v=4','./supplement.js?v=7','./syllabus-course.js?v=9','./course-engine.js?v=9','./dojo-engine.js?v=9','./study-core.js?v=9','./study-app.js?v=15.0','./manifest.webmanifest?v=10','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('jcsqe-shokyu-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(req.mode==='navigate'){
  const pageKey=url.pathname.endsWith('/practice.html')?'./practice.html':url.pathname.endsWith('/benchmark.html')?'./benchmark.html':'./index.html';
  event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(pageKey,copy)));}return res;}).catch(()=>caches.open(CACHE).then(cache=>cache.match(pageKey))));return;
 }
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok)event.waitUntil(cache.put(req,res.clone()));return res;}))));
});
