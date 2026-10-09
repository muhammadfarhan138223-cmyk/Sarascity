/* SARAS CITY — stage6.js  (Controls + Map pack)
   - On foot: PUBG/Free-Fire style controls — left joystick moves, drag on the right side to look 360°.
     Car-controls hide automatically while on foot. In the car, drag on the right side to look around.
   - Full map: tap the mini-map (or press M). Tap anywhere = marker. Names of every place shown.
   - Marker: glowing animated arrows on the road to the marker (also drawn on both maps).
   - Missions list (📋): status, rewards, "marker lagao" / "shuru karo".  */
(function(){
'use strict';
const G=window.G;if(!G||!G.T||!G.staticMap)return;
const T=G.T,$=G.$,clamp=G.clamp,wrapA=G.wrapA,PI=Math.PI,scene=G.scene,camera=G.camera,car=G.car,LM=G.landmarks,C=G.C,S=G.S,A=G.actions,SC=G.SC;

/* ───────── touch pads: joystick + look ───────── */
const joyzone=document.createElement('div');joyzone.id='joyzone';
const lookpad=document.createElement('div');lookpad.id='lookpad';
const joy=document.createElement('div');joy.id='joy';joy.innerHTML='<i></i>';
const firstEl=$('mini');document.body.insertBefore(lookpad,firstEl);document.body.insertBefore(joyzone,firstEl);document.body.insertBefore(joy,firstEl);
const J={x:0,y:0,id:null,ox:0,oy:0},knob=joy.firstChild;
joyzone.addEventListener('pointerdown',e=>{if(G.mode!=='foot'||J.id!==null)return;e.preventDefault();J.id=e.pointerId;try{joyzone.setPointerCapture(e.pointerId);}catch(x){}J.ox=e.clientX;J.oy=e.clientY;joy.style.left=(J.ox-62)+'px';joy.style.top=(J.oy-62)+'px';joy.style.bottom='auto';});
joyzone.addEventListener('pointermove',e=>{if(e.pointerId!==J.id)return;const dx=e.clientX-J.ox,dy=e.clientY-J.oy,r=Math.hypot(dx,dy),mx=56,k=r>mx?mx/r:1;J.x=dx*k/mx;J.y=-dy*k/mx;knob.style.transform='translate('+dx*k+'px,'+dy*k+'px)';});
const jend=e=>{if(e.pointerId!==J.id)return;J.id=null;J.x=J.y=0;knob.style.transform='translate(0,0)';joy.style.left='';joy.style.top='';joy.style.bottom='';};
joyzone.addEventListener('pointerup',jend);joyzone.addEventListener('pointercancel',jend);
const cam=G.cam={yaw:0,pitch:.32,dist:4.6,look:0,carYaw:0,carPitch:0,drag:false,lastMode:'car'};let lk=null;
lookpad.addEventListener('pointerdown',e=>{if(lk!==null||G.indoor)return;lk={id:e.pointerId,x:e.clientX,y:e.clientY};try{lookpad.setPointerCapture(e.pointerId);}catch(x){}cam.drag=true;});
lookpad.addEventListener('pointermove',e=>{if(!lk||e.pointerId!==lk.id)return;const dx=e.clientX-lk.x,dy=e.clientY-lk.y;lk.x=e.clientX;lk.y=e.clientY;
 if(G.mode==='foot'){cam.yaw-=dx*.0068;cam.pitch=clamp(cam.pitch+dy*.0045,-.12,1.05);}
 else{cam.carYaw=clamp(cam.carYaw-dx*.0068,-3.14,3.14);cam.carPitch=clamp(cam.carPitch+dy*.003,-.05,.8);cam.look=2.2;}});
const lend=e=>{if(lk&&e.pointerId===lk.id){lk=null;cam.drag=false;}};lookpad.addEventListener('pointerup',lend);lookpad.addEventListener('pointercancel',lend);

/* camera-relative walking: joystick (or WASD) -> direction relative to where the camera looks */
const origMan=G.manualInp;let shiftPhys=false;
window.addEventListener('keydown',e=>{if(e.key==='Shift')shiftPhys=true;});window.addEventListener('keyup',e=>{if(e.key==='Shift')shiftPhys=false;});
G.manualInp=function(){
 if(G.mode!=='foot')return origMan();
 const k=G.keys,me=G.me;let jx=J.x+((k.d?1:0)-(k.a?1:0)),jy=J.y+((k.w||k.arrowup?1:0)-(k.s||k.arrowdown?1:0));const mag=Math.min(1,Math.hypot(jx,jy));
 if(mag<.12){k.shift=shiftPhys;me.turnRate=2.5;return{thr:0,steer:0,hb:false,active:false};}
 const yaw=G.indoor?me.h:cam.yaw,fx=Math.sin(yaw),fz=Math.cos(yaw),lx=Math.cos(yaw),lz=-Math.sin(yaw),dx=fx*jy-lx*jx,dz=fz*jy-lz*jx,err=wrapA(Math.atan2(dx,dz)-me.h);
 k.shift=shiftPhys||mag>.88;me.turnRate=8;
 return{thr:Math.abs(err)>1.3?.2:Math.max(.5,mag),steer:clamp(err*3.5,-1,1),hb:false,active:true};};

/* ───────── cameras: foot (free look) + car look-around ───────── */
const prevHook=G.camHook,tmpV=new T.Vector3();
G.camHook=function(dt){
 if(G.mode==='foot'&&!G.indoor){const me=G.me,cs=G.camState;
  if(me.auto&&!cam.drag)cam.yaw+=wrapA(me.h-cam.yaw)*Math.min(1,dt*2.2);
  const cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),bx=-Math.sin(cam.yaw)*cp,bz=-Math.cos(cam.yaw)*cp,rx=-Math.cos(cam.yaw),rz=Math.sin(cam.yaw);
  let d=cam.dist;for(;d>1.3;d-=.35){const px=me.x+bx*d,pz=me.z+bz*d;let hit=false;for(const b of G.colliders){if(px>b.x0&&px<b.x1&&pz>b.z0&&pz<b.z1){hit=true;break;}}if(!hit)break;}
  const tx=me.x+bx*d+rx*.5,ty=1.5+sp*d,tz=me.z+bz*d+rz*.5;
  if(cs.snap){cs.pos.set(tx,ty,tz);cs.snap=false;}else cs.pos.lerp(tmpV.set(tx,ty,tz),1-Math.exp(-dt*16));
  camera.position.copy(cs.pos);camera.lookAt(me.x+Math.sin(cam.yaw)*4+rx*.5,1.3,me.z+Math.cos(cam.yaw)*4+rz*.5);cs.fov=62;return true;}
 if(G.mode==='car'&&(cam.look>0||cam.drag||Math.abs(cam.carYaw)>.03||Math.abs(cam.carPitch)>.03)){const cs=G.camState;
  if(!cam.drag){cam.look-=dt;if(cam.look<=0){const f=Math.max(0,1-dt*3.2);cam.carYaw*=f;cam.carPitch*=f;}}
  if(!cam.drag&&Math.abs(cam.carYaw)<.03&&Math.abs(cam.carPitch)<.03){cam.carYaw=cam.carPitch=0;cam.look=0;return prevHook?prevHook(dt):false;}
  const h=car.h+cam.carYaw,d=8.4,hh=3.3+cam.carPitch*7;tmpV.set(car.x-Math.sin(h)*d,hh,car.z-Math.cos(h)*d);cs.pos.lerp(tmpV,1-Math.exp(-dt*8));
  camera.position.copy(cs.pos);camera.lookAt(car.x+Math.sin(car.h)*3,1.5,car.z+Math.cos(car.h)*3);cs.fov=62+clamp(Math.abs(car.vf)*.7,0,18);return true;}
 return prevHook?prevHook(dt):false;};

/* ───────── marker + glowing road arrows ───────── */
const WP={on:false,x:0,z:0,pts:[],t:0,mk:null,bc:null};G.WP=WP;
const MAXC=170,chevGeo=new T.BufferGeometry();
chevGeo.setAttribute('position',new T.BufferAttribute(new Float32Array([-1,0,-.9, 0,0,1.1, 0,0,.25,  0,0,.25, 0,0,1.1, 1,0,-.9]),3));
const chev=new T.InstancedMesh(chevGeo,new T.MeshBasicMaterial({color:0xffffff,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}),MAXC);
chev.frustumCulled=false;chev.count=0;chev.visible=false;scene.add(chev);
const dum=new T.Object3D(),cc=new T.Color();let chevPos=[],tt=0;chev.setColorAt(0,cc.setRGB(0,0,0));
function nearLandmark(x,z){let b=null,bd=24;for(const l of LM){const d=Math.hypot(l.x-x,l.z-z);if(d<bd){bd=d;b=l;}}return b;}
function setWaypoint(x,z){const l=nearLandmark(x,z);if(l){x=l.stop.x;z=l.stop.z;}
 WP.x=x;WP.z=z;WP.on=true;WP.t=0;WP.label=l?l.name:'Marker';
 if(!WP.mk){WP.mk={id:'wp',x,z,color:'#22d3ee',big:1};G.markers.push(WP.mk);}WP.mk.x=x;WP.mk.z=z;
 if(!WP.bc)WP.bc=G.beacon(x,z,'#22d3ee',120,1.8);WP.bc.position.set(x,60,z);buildRoute();G.toast('📍 Marker laga: '+WP.label,1700);}
function clearWaypoint(){WP.on=false;WP.pts=[];chevPos=[];chev.count=0;chev.visible=false;if(WP.mk){const i=G.markers.indexOf(WP.mk);if(i>=0)G.markers.splice(i,1);WP.mk=null;}if(WP.bc){WP.bc.parent&&WP.bc.parent.remove(WP.bc);WP.bc=null;}}
function buildRoute(){if(!WP.on)return;const f=G.focusPos(),r=G.route(f.x,f.z,G.focusH(),WP.x,WP.z,G.mode==='car'?3.8:9.6);WP.pts=[{x:f.x,z:f.z}].concat(r.pts);
 chevPos=[];let carry=0;
 for(let i=0;i<WP.pts.length-1&&chevPos.length<MAXC;i++){const a=WP.pts[i],b=WP.pts[i+1],L=Math.hypot(b.x-a.x,b.z-a.z);if(L<.01)continue;const ang=Math.atan2(b.x-a.x,b.z-a.z);let s=carry;
  for(;s<L&&chevPos.length<MAXC;s+=5.5)chevPos.push({x:a.x+(b.x-a.x)*s/L,z:a.z+(b.z-a.z)*s/L,a:ang});carry=s-L;}
 chev.count=chevPos.length;for(let i=0;i<chevPos.length;i++){const p=chevPos[i];dum.position.set(p.x,.2,p.z);dum.rotation.set(0,p.a,0);dum.scale.set(1.1,1,1.1);dum.updateMatrix();chev.setMatrixAt(i,dum.matrix);}chev.instanceMatrix.needsUpdate=true;}
function routeAnim(dt){if(!WP.on||G.indoor){chev.visible=false;return;}chev.visible=chevPos.length>0;tt+=dt;
 for(let i=0;i<chevPos.length;i++){const w=Math.max(0,Math.sin(i*.42-tt*6.5)),b=.1+.9*w*w*w;chev.setColorAt(i,cc.setRGB(.05*b,.85*b,b));}
 if(chev.instanceColor)chev.instanceColor.needsUpdate=true;
 WP.t-=dt;const f=G.focusPos();
 if(Math.hypot(f.x-WP.x,f.z-WP.z)<(G.mode==='car'?14:5)){G.toast('📍 Marker par pahunch gaye!',2000);G.vib([60,40,60]);clearWaypoint();}
 else if(WP.t<=0){WP.t=1.6;buildRoute();}}
G.mapOverlay=(g,sc)=>{if(!WP.on||WP.pts.length<2)return;g.save();g.strokeStyle='#22d3ee';g.lineWidth=4;g.lineJoin='round';g.setLineDash([10,7]);g.lineDashOffset=-tt*40;g.beginPath();WP.pts.forEach((p,i)=>i?g.lineTo(p.x*sc,p.z*sc):g.moveTo(p.x*sc,p.z*sc));g.stroke();g.restore();};

/* ───────── full map ───────── */
const mc=$('mapc'),mx=mc.getContext('2d'),mm=$('bigmap'),MZ={zoom:1,cx:C.SIZE/2,cz:C.SIZE/2};let mTimer=null,pdown=null;
const LBL={obj:'Mission',giver:'Mission shuru',wp:'Marker',thief:'Chor',homeMk:'Ghar',ap_dest:'Saras ki manzil'};
function mapSize(){const r=Math.max(260,Math.min(window.innerWidth-30,window.innerHeight-135,700)),dp=Math.min(window.devicePixelRatio||1,2);mc.width=mc.height=Math.round(r*dp);mc.style.width=mc.style.height=r+'px';}
const s2=()=>mc.width/C.SIZE*MZ.zoom,w2c=(x,z)=>{const s=s2();return[(x-MZ.cx)*s+mc.width/2,(z-MZ.cz)*s+mc.width/2];};
function drawMap(){const W=mc.width,s=s2(),g=mx;g.setTransform(1,0,0,1,0,0);g.setLineDash([]);g.fillStyle='#10171d';g.fillRect(0,0,W,W);
 g.save();g.translate(W/2,W/2);g.scale(s/SC,s/SC);g.translate(-MZ.cx*SC,-MZ.cz*SC);g.drawImage(G.staticMap,0,0);g.restore();
 const fs=Math.max(11,W/38);g.font='bold '+fs+'px Segoe UI,Arial,sans-serif';g.textAlign='center';g.textBaseline='top';
 if(WP.on&&WP.pts.length>1){g.save();g.strokeStyle='#22d3ee';g.lineWidth=Math.max(3,W/130);g.lineJoin='round';g.setLineDash([W/40,W/70]);g.lineDashOffset=-tt*60-Date.now()/30%1000;g.beginPath();WP.pts.forEach((p,i)=>{const c=w2c(p.x,p.z);if(i)g.lineTo(c[0],c[1]);else g.moveTo(c[0],c[1]);});g.stroke();g.restore();}
 g.lineWidth=4;g.strokeStyle='rgba(0,0,0,.85)';for(const l of LM){const c=w2c(l.x,l.z);g.fillStyle='#fff';g.strokeText(l.name,c[0],c[1]+fs*.9);g.fillText(l.name,c[0],c[1]+fs*.9);}
 for(const m of G.markers){const c=w2c(m.x,m.z);g.fillStyle=m.color||'#fff';g.strokeStyle='#000';g.lineWidth=3;g.beginPath();g.arc(c[0],c[1],m.big?fs*.55:fs*.4,0,7);g.fill();g.stroke();
  const nm=m.id==='cop'?'':LBL[m.id];if(nm){g.lineWidth=4;g.strokeStyle='rgba(0,0,0,.85)';g.fillStyle='#fff';g.strokeText(nm,c[0],c[1]-fs*1.9);g.fillText(nm,c[0],c[1]-fs*1.9);}}
 const f=G.focusPos(),h=G.focusH(),c=w2c(f.x,f.z);g.save();g.translate(c[0],c[1]);g.rotate(Math.atan2(Math.sin(h),-Math.cos(h)));g.fillStyle='#4fd1e8';g.strokeStyle='#071016';g.lineWidth=3;
 g.beginPath();g.moveTo(0,-fs*.9);g.lineTo(fs*.6,fs*.6);g.lineTo(0,fs*.25);g.lineTo(-fs*.6,fs*.6);g.closePath();g.stroke();g.fill();g.restore();}
function openMap(){mm.classList.add('on');mapSize();MZ.zoom=1.15;const f=G.focusPos();MZ.cx=f.x;MZ.cz=f.z;drawMap();clearInterval(mTimer);mTimer=setInterval(drawMap,200);}
function closeMap(){mm.classList.remove('on');clearInterval(mTimer);}
mc.addEventListener('pointerdown',e=>{pdown={x:e.clientX,y:e.clientY,moved:false,cx:MZ.cx,cz:MZ.cz};try{mc.setPointerCapture(e.pointerId);}catch(x){}});
mc.addEventListener('pointermove',e=>{if(!pdown)return;const dx=e.clientX-pdown.x,dy=e.clientY-pdown.y;if(Math.hypot(dx,dy)>7)pdown.moved=true;
 if(pdown.moved){const r=mc.getBoundingClientRect(),k=mc.width/r.width,s=s2();MZ.cx=clamp(pdown.cx-dx*k/s,0,C.SIZE);MZ.cz=clamp(pdown.cz-dy*k/s,0,C.SIZE);drawMap();}});
mc.addEventListener('pointerup',e=>{if(!pdown)return;const was=pdown;pdown=null;if(was.moved)return;const r=mc.getBoundingClientRect(),k=mc.width/r.width,px=(e.clientX-r.left)*k,py=(e.clientY-r.top)*k,s=s2();
 setWaypoint(MZ.cx+(px-mc.width/2)/s,MZ.cz+(py-mc.width/2)/s);drawMap();});
mc.addEventListener('pointercancel',()=>{pdown=null;});

/* ───────── missions list ───────── */
function mkBtn(t,fn){const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',fn);return b;}
function closeMissions(){$('mlist').classList.remove('on');}
function objectiveTarget(d){const st=d.steps[G.M.step];if(!st)return null;if(st.type==='race'&&G.M.s&&G.M.s.pts)return G.M.s.pts[Math.min(G.M.s.k||0,G.M.s.pts.length-1)];
 if(st.lm)return LM.find(x=>x.id===st.lm).stop;if(st.x!=null)return{x:st.x,z:st.z};return null;}
function openMissions(){const D=G.missions;if(!D){G.toast('Missions Stage 2 mein hain (stage2.js daalo)');return;}const SV=G.save,body=$('mlistbody');body.innerHTML='';
 D.forEach((d,i)=>{const done=i<SV.mi,act=G.M&&G.M.active===d,cur=i===SV.mi&&!act,row=document.createElement('div');row.className='mrow'+((cur||act)?' cur':'')+(i>SV.mi?' lock':'');
  const l=LM.find(x=>x.id===d.giver);
  row.innerHTML='<span class="st">'+(done?'✅ Ho gaya':act?'▶ Chal raha':cur?'⭐ Agla':'🔒')+'</span><b>'+(i+1)+'. '+d.title+'</b><small>'+d.intro+'</small><small>📍 '+(l?l.name:'')+' · 💰 Rs '+d.reward.money+' · ⭐ '+d.reward.xp+' XP'+(d.time?' · ⏱ '+Math.round(d.time/6)/10+' min':'')+'</small>';
  if(cur||act){const acts=document.createElement('div');acts.className='acts';
   acts.appendChild(mkBtn('📍 Marker lagao',()=>{const t=act?objectiveTarget(d):(l?l.stop:null);if(t)setWaypoint(t.x,t.z);closeMissions();}));
   if(act)acts.appendChild(mkBtn('❌ Cancel',()=>{G.finishMission(false,'cancel kiya');closeMissions();}));
   else acts.appendChild(mkBtn('▶ Abhi shuru karo',()=>{closeMissions();G.startMission(d);}));row.appendChild(acts);}
  body.appendChild(row);});
 $('mlist').classList.add('on');}

/* ───────── actions + prompt + frame hook ───────── */
const none=()=>({update:()=>true});
A.mark=a=>{const l=LM.find(x=>x.id===a.place||(a.place&&x.name.toLowerCase()===String(a.place).toLowerCase()));if(l)setWaypoint(l.stop.x,l.stop.z);else if(a.x!=null&&a.z!=null)setWaypoint(+a.x,+a.z);else G.toast('Jagah samajh nahi aayi');return none();};
A.clear_marker=()=>{clearWaypoint();return none();};
A.goto_marker=()=>{if(!WP.on){G.toast('Pehle map par marker lagao');return none();}return A.goto({x:WP.x,z:WP.z});};
A.open_map=()=>{openMap();return none();};A.show_missions=()=>{openMissions();return none();};
A.sound=a=>{if(['all','vib','off'].includes(a.mode)){S.snd=a.mode;G.saveS();G.applySnd();$('bSnd').textContent={all:'🔊',vib:'📳',off:'🔇'}[S.snd];}return none();};
G.DRIVE.add('goto_marker');
G.promptExtras.push(`MAP & MARKERS: {"a":"mark","place":"<id>"} puts a cyan marker with glowing arrows on the road to that place so the player can follow it manually (use for "raasta dikhao / mark karo / kahan hai X"); {"a":"goto_marker"} drives/walks to the current marker; {"a":"clear_marker"}; {"a":"open_map"} opens the full map; {"a":"show_missions"} opens the mission list; {"a":"sound","mode":"all|vib|off"} = all sounds / vibration only / silent. {"a":"goto","x":N,"z":N} also accepts map coordinates.`);
G.stateExtras.push(()=>({marker:WP.on?{label:WP.label,dist_m:Math.round(Math.hypot(G.focusPos().x-WP.x,G.focusPos().z-WP.z))}:null}));
G.hooks.update.push(dt=>{
 if(G.mode!==cam.lastMode){if(G.mode==='foot'){cam.yaw=G.me.h;cam.pitch=.32;G.camState.snap=true;}else{J.id=null;J.x=J.y=0;}cam.lastMode=G.mode;document.body.classList.toggle('foot',G.mode==='foot');}
 if(G.mode==='foot'){const k=G.keys;cam.yaw+=((k.arrowleft?1:0)-(k.arrowright?1:0))*2.2*dt;if(G.indoor)cam.yaw=G.me.h;}
 routeAnim(dt);});
G.hooks.ready.push(()=>{
 $('mini').addEventListener('click',openMap);$('mini').style.cursor='pointer';
 $('mClose').addEventListener('click',closeMap);$('mZin').addEventListener('click',()=>{MZ.zoom=Math.min(5,MZ.zoom*1.4);drawMap();});$('mZout').addEventListener('click',()=>{MZ.zoom=Math.max(.8,MZ.zoom/1.4);drawMap();});
 $('mMe').addEventListener('click',()=>{const f=G.focusPos();MZ.cx=f.x;MZ.cz=f.z;drawMap();});$('mClr').addEventListener('click',()=>{clearWaypoint();drawMap();});
 $('mGo').addEventListener('click',()=>{if(!WP.on){G.toast('Pehle map par marker lagao');return;}closeMap();G.runPlan({say:'Theek hai, marker par le chalti hoon.',speak:'ठीक है, मार्कर पर ले चलती हूँ।',speak_lang:'hi-IN',actions:[{a:'goto',x:WP.x,z:WP.z}]});});
 $('bMis').addEventListener('click',openMissions);$('mlClose').addEventListener('click',closeMissions);
 window.addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();if(k==='m'){if(mm.classList.contains('on'))closeMap();else openMap();}else if(k==='escape'){closeMap();closeMissions();}});
 if($('stagetag'))$('stagetag').textContent+=' + Map';});
})();
