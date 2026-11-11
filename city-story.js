/* Saras City: Andheray ke Paar. Original 24-mission campaign. */
(function(){
'use strict';
const G=window.G,C=window.SarasCampaign;if(!G||!C||!G.missions)return;
if(G.save.campaignVersion!==C.version){
 try{localStorage.setItem('saras_campaign_v1_backup',JSON.stringify(G.save));}catch(e){}
 G.save.mi=0;G.save.campaignVersion=C.version;G.saveGame();
}
G.save.mi=Math.max(0,Math.min(C.missions.length,Number(G.save.mi)||0));
const lm=id=>G.landmarks.find(l=>l.id===id);
let introTimer=0;
G.missions.splice(0,G.missions.length,...C.missions);
G.stepTypes.intel={
 start(s,st){s.target=lm(st.lm).stop;s.elapsed=0;s.last=null;s.bc=G.beacon(s.target.x,s.target.z,'#56e8c8',90,1.8);s.mk={id:'obj',...s.target,color:'#56e8c8',big:1};G.markers.push(s.mk);},
 update(s,st,dt){const p=G.focusPos(),near=Math.hypot(p.x-s.target.x,p.z-s.target.z)<9,moved=s.last?Math.hypot(p.x-s.last.x,p.z-s.last.z)>dt*1.5:false;s.last={x:p.x,z:p.z};if(near&&G.mode==='foot'&&!moved)s.elapsed+=dt;else s.elapsed=Math.max(0,s.elapsed-dt);return s.elapsed>=st.seconds?'done':null;},
 end(s){s.bc?.parent?.remove(s.bc);const i=G.markers.indexOf(s.mk);if(i>=0)G.markers.splice(i,1);}
};
const style=document.createElement('link');style.rel='stylesheet';style.href='premium.css';document.head.appendChild(style);
const journal=document.createElement('section');journal.id='cityJournal';journal.hidden=true;journal.setAttribute('role','dialog');journal.setAttribute('aria-modal','true');journal.setAttribute('aria-label','Mission journal');document.body.appendChild(journal);
const toolbar=document.createElement('nav');toolbar.id='premiumToolbar';toolbar.setAttribute('aria-label','Game tools');toolbar.innerHTML='<button id="storyOpen">STORY · 24</button><button id="cameraCycle">CAM · FOLLOW</button><button id="assistantOpen">SARAS AI</button>';document.body.appendChild(toolbar);
const intro=document.createElement('aside');intro.id='missionIntro';intro.setAttribute('aria-live','polite');document.body.appendChild(intro);
const objective=document.createElement('div');objective.id='premiumObjective';document.body.appendChild(objective);
G.missions.forEach((d,i)=>{
 d.onStart=()=>{
  G.me.hp=Math.max(80,G.me.hp);G.car.hp=Math.max(65,G.car.hp);
  G.setWeather(d.weather,600);G.time=d.night?21.5:8.5;G.staticRendered=false;
  if(d.steps.some(s=>s.type==='evade'))G.setWanted(2);else G.setWanted(0);
  intro.replaceChildren();const small=document.createElement('small'),h=document.createElement('h2'),p=document.createElement('p');
  small.textContent=C.chapters[d.chapter]+' · MISSION '+String(i+1).padStart(2,'0')+(G.M.replay?' · REPLAY':'');
  h.textContent=d.title;p.textContent=d.intro;intro.append(small,h,p);intro.classList.add('on');clearTimeout(introTimer);introTimer=setTimeout(()=>intro.classList.remove('on'),5200);
 };
 d.onEnd=ok=>{G.setWanted(0);intro.classList.remove('on');if(ok&&i===23)G.toast('ANDHERAY KE PAAR · Campaign complete! Free roam aur replay unlocked.',6000);};
 d.extraHud=()=>{const st=d.steps[G.M.step],s=G.M.s;if(st?.type==='intel')return '<small>On foot, marker ke paas ruk kar inspect karo · '+Math.min(100,Math.round((s?.elapsed||0)/st.seconds*100))+'%</small>';if(st?.type==='kill')return '<small>Attackers: '+(s?.alive??'…')+' · F / Attack</small>';return '';};
});
let previousFocus,previousPause=false;
function close(){journal.hidden=true;G.paused=previousPause;G.staticRendered=false;previousFocus?.focus();}
function start(d){if(G.M.active){G.toast('Active mission pehle finish ya cancel karo.');return;}close();if(!G.started)G.$('bGo').click();G.startMission(d);}
function open(){
 previousFocus=document.activeElement;previousPause=!!G.paused;G.paused=true;journal.hidden=false;
 journal.innerHTML='<article><button id="journalClose" class="close" aria-label="Close missions">×</button><small>ORIGINAL PAKISTANI OPEN WORLD · CAMPAIGN 02</small><h1>Andheray ke Paar</h1><p>24 missions. Aik shehar. Har suraagh tumhein sach ke qareeb le jata hai.</p><progress id="campaignProgress" max="24"></progress><p id="campaignCount"></p><div id="currentMission"></div><div class="journalActions"><button id="offlineDownload">Download offline</button><button id="fullScreen">Fullscreen</button><button id="settingsOpen">Settings / Voice</button></div><p id="offlineStatus" role="status"></p><details><summary>Controls & help</summary><p>WASD / arrows: move · E: vehicle / house · F: attack · Q: weapon · M: map · T: type · V: mic · B: camera. Phone: left joystick, right side camera drag, on-screen action buttons. Intel missions: marker ke paas on foot ruk kar progress complete karo. Completed missions replay ho sakte hain; future missions locked hain.</p><p>Progress isi browser mein save hoti hai. New campaign ke liye old progress ka local backup rakha gaya hai. Offline play pehle download complete hone ke baad available hai.</p></details><div id="campaignRows"></div></article>';
 journal.querySelector('#campaignProgress').value=G.save.mi;journal.querySelector('#campaignCount').textContent=G.save.mi+'/24 complete · Rs '+G.save.money;
 const active=G.M.active,current=journal.querySelector('#currentMission');
 if(active){const p=document.createElement('p');p.textContent='ACTIVE: '+active.title+' · '+(active.steps[G.M.step]?.text||'');current.appendChild(p);const b=document.createElement('button');b.textContent='Cancel active mission';b.onclick=()=>{G.finishMission(false,'cancel kiya');close();};current.appendChild(b);}
 const list=journal.querySelector('#campaignRows');
 C.chapters.forEach((chapter,n)=>{const h=document.createElement('h3');h.textContent=chapter;list.appendChild(h);
 G.missions.forEach((d,i)=>{if(d.chapter!==n)return;const row=document.createElement('div');row.className='campaignRow'+(i>G.save.mi?' locked':'');const label=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=String(i+1).padStart(2,'0')+' · '+d.title;small.textContent=i>G.save.mi?'Locked — previous mission complete karo':d.intro;label.append(strong,small);const b=document.createElement('button');b.disabled=i>G.save.mi||!!active;b.textContent=i<G.save.mi?'Replay':i===G.save.mi?'Start':'Locked';b.onclick=()=>start(d);row.append(label,b);list.appendChild(row);});});
 journal.querySelector('#journalClose').onclick=close;
 journal.querySelector('#fullScreen').onclick=async()=>{try{await document.documentElement.requestFullscreen();await screen.orientation?.lock?.('landscape');}catch(e){G.toast('Browser install/menu se fullscreen use karo.');}};
 journal.querySelector('#settingsOpen').onclick=()=>{close();G.$('bSet').click();};
 journal.querySelector('#offlineDownload').onclick=async()=>{
 const status=journal.querySelector('#offlineStatus');status.textContent='Downloading complete game package…';
 try{if(!navigator.serviceWorker)throw Error('unsupported');const reg=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),18000))]);const ch=new MessageChannel();const timeout=setTimeout(()=>status.textContent='Download not confirmed — internet connect karke retry karo.',30000);ch.port1.onmessage=e=>{clearTimeout(timeout);status.textContent=e.data.ok?'Offline ready. Airplane mode mein reopen karke check karo.':'Download incomplete. Internet/storage check karo.';ch.port1.close();};reg.active.postMessage({type:'DOWNLOAD_OFFLINE'},[ch.port2]);}catch(e){status.textContent='Offline package unavailable. HTTPS aur internet connection check karo.';}};
 journal.querySelector('#journalClose').focus();
}
journal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}if(e.key==='Tab'){const items=[...journal.querySelectorAll('button:not(:disabled),summary')];if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}}});
G.openJournal=open;toolbar.querySelector('#storyOpen').onclick=open;
let cameraMode=0;const modes=['FOLLOW','HOOD','TACTICAL','CINEMATIC'];
const baseCamera=G.camHook,target=new G.T.Vector3(),aim=new G.T.Vector3();
function cycle(){cameraMode=(cameraMode+1)%modes.length;toolbar.querySelector('#cameraCycle').textContent='CAM · '+modes[cameraMode];G.staticRendered=false;G.toast('Camera: '+modes[cameraMode],1200);}
G.cyclePremiumCamera=cycle;toolbar.querySelector('#cameraCycle').onclick=cycle;
G.camHook=function(dt){
 if(!cameraMode||G.indoor||G.mode==='foot'&&cameraMode===1)return baseCamera?baseCamera(dt):false;
 const p=G.focusPos(),h=G.focusH(),fx=Math.sin(h),fz=Math.cos(h),rx=Math.cos(h),rz=-Math.sin(h);
 if(cameraMode===1){target.set(p.x+fx*2.5,1.65,p.z+fz*2.5);aim.set(p.x+fx*18,1.5,p.z+fz*18);}
 else if(cameraMode===2){target.set(p.x-fx*9,13,p.z-fz*9);aim.set(p.x+fx*2,0,p.z+fz*2);}
 else{target.set(p.x-fx*7+rx*4.5,3.6,p.z-fz*7+rz*4.5);aim.set(p.x+fx*4,1.1,p.z+fz*4);}
 const blocked=G.colliders.some(b=>target.x>b.x0&&target.x<b.x1&&target.z>b.z0&&target.z<b.z1);
 if(blocked)return baseCamera?baseCamera(dt):false;
 G.camState.pos.lerp(target,1-Math.exp(-dt*8));G.camera.position.copy(G.camState.pos);G.camera.lookAt(aim);G.camState.fov=cameraMode===1?78:cameraMode===2?60:65;return true;
};
G.actions.premium_camera=()=>{cycle();return {update:()=>true};};
G.promptExtras.push('{"a":"premium_camera"} switches the cinematic game camera. Missions must be started in order. Completed missions can be replayed; future missions are locked.');
G.stateExtras.push(()=>({assistant_mode:!!G.assistantMode,campaign:C.title,mission_completed:G.save.mi,mission_total:24,camera:modes[cameraMode]}));
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(e.key.toLowerCase()==='b')cycle();if(e.key.toLowerCase()==='e'&&!G.paused){if(G.indoor)G.actions.exit_home({});else if(G.mode==='car')G.exitCar();else G.enterCar();}});
let hudTime=0;
G.hooks.update.push(dt=>{hudTime-=dt;if(hudTime>0)return;hudTime=.3;const d=G.M.active;objective.hidden=!d;if(d){objective.replaceChildren();const s=document.createElement('small'),p=document.createElement('strong');s.textContent=(G.M.replay?'REPLAY':'MISSION '+(G.missions.indexOf(d)+1))+' · '+d.title;p.textContent=d.steps[G.M.step]?.text||'';objective.append(s,p);}});
G.hooks.ready.push(()=>{
 G.$('bMis').addEventListener('click',()=>{G.$('mlist').classList.remove('on');open();});
 const startPanel=G.$('start');startPanel.querySelector('h1').textContent='SARAS CITY';G.$('stagetag').textContent='ANDHERAY KE PAAR · 24 STORY MISSIONS';
 const b=document.createElement('button');b.className='btn';b.textContent='Campaign / Replay / Offline';b.onclick=open;startPanel.querySelector('.card').appendChild(b);
 const ab=document.createElement('button');ab.className='btn';ab.textContent='Saras Assistant';ab.onclick=()=>G.openAssistant?.();startPanel.querySelector('.card').appendChild(ab);
 G.$('bGo').addEventListener('click',()=>{G.staticRendered=false;});
});
})();
