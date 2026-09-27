/* Scoped cache: never delete caches belonging to other GitHub Pages apps. */
const CACHE='jcsqe-shokyu-v7-20260927';
const ASSETS=['./index.html','./study.css?v=7','./questions.js?v=4','./supplement.js?v=7','./study-core.js?v=7','./study-app.js?v=7','./manifest.webmanifest?v=7','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('jcsqe-shokyu-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('./index.html',copy)));}return res;}).catch(()=>caches.open(CACHE).then(cache=>cache.match('./index.html'))));return;
 }
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok)event.waitUntil(cache.put(req,res.clone()));return res;}))));
});
