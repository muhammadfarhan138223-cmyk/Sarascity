/* SARAS CITY — stage5.js  (Speed + Action pack)
   Faster on weak phones: merges ~300 city meshes into a handful of draw calls, adaptive resolution
   (keeps FPS up automatically), FPS counter.  More action: NITRO (⚡ / key N), speed lines,
   FOV kick, drift smoke and nitro flames.  Add ?nomerge to the URL to turn the mesh merging off. */
(function(){
'use strict';
const G=window.G;if(!G||!G.T)return;
const T=G.T,scene=G.scene,renderer=G.renderer,S=G.S,car=G.car,clamp=G.clamp,$=G.$;
const Q=S.quality==='low'?0:S.quality==='med'?1:2,LOW=Q===0;

/* ───────── 1. fewer draw calls ───────── */
function mergeCity(){const U=T.BufferGeometryUtils;if(!U||!U.mergeBufferGeometries||/nomerge/.test(location.search||'')){console.info('merge skipped');return;}
 const city=G.city,kids=city.children.slice(),sides=new Map(),roofs={geos:[],srcs:[],mat:null},flat=new Map();
 for(const m of kids){if(!m.isMesh||m.isInstancedMesh||!m.geometry||m.userData.keep)continue;m.updateMatrixWorld(true);const mat=m.material,geo=m.geometry;
  if(Array.isArray(mat)&&mat.length===6&&geo.type==='BoxGeometry'&&geo.index&&geo.index.count===36){
   const ix=geo.index.array,gs=geo.clone(),gr=geo.clone();gs.setIndex(Array.from(ix.slice(0,12)).concat(Array.from(ix.slice(24,36))));gr.setIndex(Array.from(ix.slice(12,24)));
   gs.clearGroups();gr.clearGroups();gs.applyMatrix4(m.matrixWorld);gr.applyMatrix4(m.matrixWorld);
   if(!sides.has(mat[0]))sides.set(mat[0],{geos:[],srcs:[]});const e=sides.get(mat[0]);e.geos.push(gs);e.srcs.push(m);roofs.geos.push(gr);roofs.srcs.push(m);roofs.mat=mat[2];continue;}
  if(!Array.isArray(mat)&&geo.index&&['BoxGeometry','PlaneGeometry','CylinderGeometry'].includes(geo.type)){
   const key=mat.uuid+'|'+(m.castShadow?1:0)+(m.receiveShadow?1:0);if(!flat.has(key))flat.set(key,{mat,cs:m.castShadow,rs:m.receiveShadow,geos:[],srcs:[]});
   const e=flat.get(key),g2=geo.clone();g2.applyMatrix4(m.matrixWorld);e.geos.push(g2);e.srcs.push(m);}}
 let before=kids.length,done=0;
 const commit=(geos,srcs,mat,cs,rs)=>{if(geos.length<2)return;let mg=null;try{mg=U.mergeBufferGeometries(geos,false);}catch(e){}
  if(!mg){console.warn('merge failed for a group');return;}const mesh=new T.Mesh(mg,mat);mesh.castShadow=cs;mesh.receiveShadow=rs;city.add(mesh);
  for(const s of srcs){city.remove(s);if(!Array.isArray(s.material)||true)s.geometry.dispose();}geos.forEach(g=>g.dispose());done+=srcs.length;};
 for(const[mat,e]of sides)commit(e.geos,e.srcs,mat,true,true);
 /* roofs belong to the same source meshes; those are already removed above, so just add the roof mesh */
 try{const rg=U.mergeBufferGeometries(roofs.geos,false);if(rg&&roofs.mat){const rm=new T.Mesh(rg,roofs.mat);rm.castShadow=true;rm.receiveShadow=true;city.add(rm);}}catch(e){console.warn('roof merge failed',e);}
 for(const e of flat.values())if(e.geos.length>=3)commit(e.geos,e.srcs,e.mat,e.cs,e.rs);
 console.info('city meshes merged:',done,'(of',before,'objects)');}

/* ───────── 2. resolution scaler + FPS ───────── */
let scale=S.res||(LOW?.7:Q===1?.85:1),autoRes=S.autoRes!==false,showFps=S.showFps!==false;const maxScale=LOW?.85:1,basePR=Math.min(window.devicePixelRatio||1,Q===2?2:Q===1?1.5:1);
function applyScale(){scale=clamp(scale,.45,1);renderer.setPixelRatio(basePR*scale);window.dispatchEvent(new Event('resize'));}
const fpsEl=document.createElement('div');fpsEl.className='hudx';fpsEl.style.cssText='position:fixed;left:6px;bottom:2px;font:10px monospace;color:#8fb0b0;opacity:.7;pointer-events:none;z-index:6';document.body.appendChild(fpsEl);
let acc=0,frames=0,last=performance.now(),warm=6,lowN=0,highN=0,fps=60;
function fpsTick(dt){const now=performance.now();frames++;acc+=(now-last)/1000;last=now;warm-=dt;
 if(acc>=2){fps=frames/acc;frames=0;acc=0;G.fps=fps;fpsEl.textContent=Math.round(fps)+' fps · '+Math.round(scale*100)+'%';fpsEl.style.display=showFps?'block':'none';
  if(autoRes&&warm<=0){if(fps<27){lowN++;highN=0;if(lowN>=2&&scale>.46){scale-=.08;applyScale();lowN=0;}}else if(fps>56){highN++;lowN=0;if(highN>=3&&scale<maxScale){scale=Math.min(maxScale,scale+.04);applyScale();highN=0;}}else{lowN=0;highN=0;}}}}

/* ───────── 3. action: nitro, speed lines, smoke ───────── */
let fuel=100,held=false,nitroT=0;
const fx=document.createElement('div');fx.className='hudx';
fx.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(255,255,255,0) 0deg 3deg,rgba(255,255,255,.55) 3deg 3.7deg,rgba(255,255,255,0) 3.7deg 7deg);-webkit-mask-image:radial-gradient(circle at 50% 50%,transparent 40%,#000 85%);mask-image:radial-gradient(circle at 50% 50%,transparent 40%,#000 85%)';document.body.appendChild(fx);
let fxOp=0;
const bar=document.createElement('div');bar.style.cssText='width:92px;height:5px;border-radius:3px;background:rgba(255,255,255,.15);margin:4px auto 0;overflow:hidden';bar.innerHTML='<i style="display:block;height:100%;width:100%;background:#ffb224"></i>';
const puffTex=G.ctex(64,64,g=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
const puffs=[],NP=LOW?10:24;
for(let i=0;i<NP;i++){const sp=new T.Sprite(new T.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false,opacity:0}));sp.visible=false;scene.add(sp);puffs.push({sp,life:0,max:1,s0:1,rise:1,a:.5});}
function emit(x,y,z,color,size,life,rise,alpha){const p=puffs.find(q=>q.life<=0);if(!p)return;p.life=p.max=life;p.s0=size;p.rise=rise;p.a=alpha;p.sp.position.set(x,y,z);p.sp.material.color.set(color);p.sp.visible=true;}
let emitT=0,wasOn=false;
function actionTick(dt){
 const act=nitroT>0;nitroT-=dt;
 const on=(held||act)&&fuel>2&&G.mode==='car'&&!G.indoor&&car.vf>3;
 if(on){if(!car._nb||car._nb.shape!==car.shape)car._nb={m:car.maxV||42,a:car.acc||1,shape:car.shape};car.maxV=car._nb.m*1.45;car.acc=car._nb.a*2;fuel=Math.max(0,fuel-35*dt);G.camState.fovAdd=Math.min(11,G.camState.fovAdd+dt*40);G.camState.shake=Math.max(G.camState.shake,.06);
  if(!wasOn){G.burst(1500,.45,.12,'bandpass');G.vib(70);}}
 else{if(car._nb){car.maxV=car._nb.m;car.acc=car._nb.a;car._nb=null;}G.camState.fovAdd=Math.max(0,G.camState.fovAdd-dt*30);fuel=Math.min(100,fuel+9*dt);}
 wasOn=on;bar.firstChild.style.width=fuel+'%';
 const kmh=Math.abs(car.vf)*3.6,want=clamp((kmh-90)/110,0,.5)*(LOW?.7:1)+(on?.3:0);if(Math.abs(want-fxOp)>.02){fxOp=want;fx.style.opacity=String(want);}
 emitT-=dt;if(emitT<=0&&G.mode==='car'&&!G.indoor){emitT=.05;const h=car.h,fxv=Math.sin(h),fz=Math.cos(h),lx=Math.cos(h),lz=-Math.sin(h);
  const drift=(Math.abs(car.vl)>3.2&&Math.abs(car.vf)>6)||(G.lastInp&&G.lastInp.hb&&Math.abs(car.vf)>8);
  if(drift)for(const s of[-1,1])emit(car.x-fxv*1.35+lx*s*.95,.25,car.z-fz*1.35+lz*s*.95,'#d9dde2',1.1,.9,1.1,.5);
  if(on){emit(car.x-fxv*2.4,.5,car.z-fz*2.4,'#ffb347',1.0,.22,.2,.9);emit(car.x-fxv*2.2,.5,car.z-fz*2.2,'#6ec6ff',.55,.16,.1,.9);}}
 for(const p of puffs){if(p.life<=0)continue;p.life-=dt;if(p.life<=0){p.sp.visible=false;continue;}const k=p.life/p.max;p.sp.position.y+=p.rise*dt;p.sp.scale.setScalar(p.s0*(1+(1-k)*1.8));p.sp.material.opacity=k*p.a;}}

/* ───────── hooks ───────── */
G.hooks.update.push(dt=>{fpsTick(dt);actionTick(dt);});
G.actions.nitro=a=>{nitroT=clamp(+a.secs||2.5,.5,6);return{name:'nitro',update:()=>true};};
G.promptExtras.push('NITRO: {"a":"nitro","secs":3} gives a speed boost (put it BEFORE a {"a":"drive","throttle":1,"steer":0,"secs":3} action so they run together; autopilot cruise speed is capped, so use drive for sprints). Great for races, chases and escaping police.');
G.hooks.ready.push(()=>{
 try{mergeCity();}catch(e){console.warn('merge error',e);}
 applyScale();
 const sp=$('speedo');if(sp)sp.appendChild(bar);
 const xb=$('xbtns');if(xb){const b=document.createElement('button');b.className='cb sm';b.textContent='⚡';b.setAttribute('aria-label','Nitro');
  const on=e=>{e.preventDefault();held=true;b.classList.add('on');G.initAudio();},off=e=>{e.preventDefault();held=false;b.classList.remove('on');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);b.addEventListener('contextmenu',e=>e.preventDefault());xb.appendChild(b);}
 window.addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;if(e.key.toLowerCase()==='n')held=true;});window.addEventListener('keyup',e=>{if(e.key.toLowerCase()==='n')held=false;});
 const info=$('stageinfo');if(info&&info.parentNode){const box=document.createElement('div');
  box.innerHTML='<h3>Speed</h3><label>Resolution (kam = zyada tez)</label><select id="sRes"><option value="0.5">50%</option><option value="0.6">60%</option><option value="0.7">70%</option><option value="0.85">85%</option><option value="1">100%</option></select>'+
   '<div class="chk"><input type="checkbox" id="cAutoRes"><label for="cAutoRes" style="margin:0;color:var(--ink);font-size:15px">Resolution khud adjust ho (FPS ke hisaab se)</label></div>'+
   '<div class="chk"><input type="checkbox" id="cFps"><label for="cFps" style="margin:0;color:var(--ink);font-size:15px">FPS dikhao</label></div>';
  info.parentNode.insertBefore(box,info);
  $('bSet').addEventListener('click',()=>{const best=['0.5','0.6','0.7','0.85','1'].reduce((a,b)=>Math.abs(+b-scale)<Math.abs(+a-scale)?b:a);$('sRes').value=best;$('cAutoRes').checked=autoRes;$('cFps').checked=showFps;});
  $('bSave').addEventListener('click',()=>{S.res=+$('sRes').value||scale;S.autoRes=$('cAutoRes').checked;S.showFps=$('cFps').checked;G.saveS();scale=S.res;autoRes=S.autoRes;showFps=S.showFps;warm=4;applyScale();});}
 if($('stagetag'))$('stagetag').textContent+=' + Speed';});
})();
