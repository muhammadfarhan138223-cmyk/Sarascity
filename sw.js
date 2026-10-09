/* Saras City service worker: offline cache (game files + 3D libraries). AI API calls are never cached. */
const V='saras-v1';
const CORE=['./','index.html','core.js','stage2.js','stage3.js','stage4.js','stage5.js','stage6.js','stage7.js','person.glb','models.json','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>0)))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(/generativelanguage|groq\.com|openrouter\.ai/.test(u.host))return;
 if(u.origin===location.origin){ /* our own files: network first (always fresh when online), cache when offline */
  e.respondWith(fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}return res;}).catch(()=>caches.match(r).then(h=>h||caches.match('index.html'))));return;}
 e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}return res;})));});
