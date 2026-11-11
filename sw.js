/* Complete offline package. API traffic is never cached. */
const VERSION='saras-campaign-1-v1';
const CORE=['./','index.html','core.js','stage2.js','stage3.js','stage4.js','stage5.js','stage6.js','pakistan.js','gameplay.js','pakistan2.js','city-story.js','natural-voice.js','models.json','manifest.json','icon.svg','icon-192.png','icon-512.png',
'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js'];
async function download(){const cache=await caches.open(VERSION);await Promise.all(CORE.map(async path=>{const response=await fetch(new Request(path,{mode:'cors',cache:'reload'}));if(!response.ok)throw new Error('Required file missing');await cache.put(path,response);}));}
self.addEventListener('install',event=>{event.waitUntil(download().then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('saras-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='DOWNLOAD_OFFLINE')event.waitUntil(download().then(()=>event.ports[0]?.postMessage({ok:true})).catch(()=>event.ports[0]?.postMessage({ok:false,error:'Internet ya storage check karke retry karo.'})));});
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.pathname.startsWith('/api/'))return;
if(url.origin===self.location.origin){event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(request,copy));}return response;}).catch(async()=>{const cached=await caches.match(request);if(cached)return cached;if(request.mode==='navigate')return caches.match('index.html');return Response.error();}));}
else if(CORE.includes(url.href)){event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));}
});

