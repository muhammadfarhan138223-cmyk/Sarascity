/* SARAS CITY — stage2.js  (Stage 2: Medium)
   Saras on foot, enter/exit car, traffic + pedestrians, homes with interiors,
   money/XP/levels, missions (pickup / delivery / race), save game. */
(function(){
'use strict';
const G=window.G;if(!G||!G.T)return;G.stage=2;
const T=G.T,$=G.$,clamp=G.clamp,wrapA=G.wrapA,PI=Math.PI,rnd=G.rnd,pick=G.pick,scene=G.scene,camera=G.camera,car=G.car,C=G.C,roadC=C.roadC,A=G.actions,AP=G.AP,LM=G.landmarks,S=G.S;
const lm=id=>LM.find(l=>l.id===id);
const inst=(fn,name)=>a=>{fn(a||{});return{name,update:()=>true};};

/* ───────── save / money / xp ───────── */
const SV=G.save=Object.assign({money:500,xp:0,mi:0,home:'home',owned:['home']},(()=>{try{return JSON.parse(localStorage.getItem('saras_save')||'{}');}catch(e){return{};}})());
G.saveGame=()=>{try{localStorage.setItem('saras_save',JSON.stringify(SV));}catch(e){}};
const lvl=()=>1+Math.floor(Math.sqrt(SV.xp/120));G.level=lvl;
function statHud(){G.setStat('💰 <b>Rs '+SV.money+'</b> · Lv <b>'+lvl()+'</b>'+(G.statExtra?G.statExtra():''));}G.statHud=statHud;
G.addMoney=n=>{SV.money=Math.max(0,SV.money+n);statHud();};
G.addXP=n=>{const l=lvl();SV.xp+=n;statHud();if(lvl()>l){G.toast('LEVEL UP! Level '+lvl()+' 🎉',2600);G.tone(660,.15,.07,'triangle');setTimeout(()=>G.tone(990,.25,.07,'triangle'),160);}};

/* ───────── person model ───────── */
function buildPerson(shirt,pants,skin,hair,sc){const g=new T.Group(),lam=c=>new T.MeshLambertMaterial({color:c});
 const add=(geo,mat,x,y,z,par)=>{const q=new T.Mesh(geo,mat);q.position.set(x,y,z);q.castShadow=true;(par||g).add(q);return q;};
 add(new T.BoxGeometry(.55,.72,.3),lam(shirt),0,1.16,0);add(new T.SphereGeometry(.2,10,8),lam(skin),0,1.72,0);add(new T.BoxGeometry(.4,.12,.4),lam(hair),0,1.9,0);
 const limb=(w,h,d,mat,x,y,oy)=>{const p=new T.Group();p.position.set(x,y,0);g.add(p);add(new T.BoxGeometry(w,h,d),mat,0,oy,0,p);return p;};
 const legL=limb(.23,.8,.25,lam(pants),-.15,.8,-.4),legR=limb(.23,.8,.25,lam(pants),.15,.8,-.4),armL=limb(.16,.66,.18,lam(shirt),-.37,1.48,-.3),armR=limb(.16,.66,.18,lam(shirt),.37,1.48,-.3);
 g.scale.setScalar(sc||1);return{mesh:g,legL,legR,armL,armR,phase:0,x:0,z:0,h:0};}
function animPerson(p,speed,dt){p.phase+=speed*dt*2.4;const a=Math.sin(p.phase)*.75*clamp(speed/3,0,1);p.legL.rotation.x=a;p.legR.rotation.x=-a;p.armL.rotation.x=-a*.8;p.armR.rotation.x=a*.8;}
function placePerson(p){p.mesh.position.x=p.x;p.mesh.position.z=p.z;p.mesh.rotation.y=p.h;}
G.buildPerson=buildPerson;G.animPerson=animPerson;G.placePerson=placePerson;

/* ───────── Saras on foot ───────── */
const me=G.me=buildPerson('#2b6cb0','#2d3748','#d9a47f','#1b1b1b');me.hp=100;me.mesh.visible=false;scene.add(me.mesh);
let runTog=false,homeCD=0;
G.focusPos=()=>G.mode==='foot'?{x:me.x,z:me.z}:{x:car.x,z:car.z};G.focusH=()=>G.mode==='foot'?me.h:car.h;
function toFoot(x,z,h){me.x=x;me.z=z;me.h=h;me.mesh.visible=true;placePerson(me);G.mode='foot';car.vx=car.vz=car.vf=car.vl=0;G.cancelAll();G.snapCam();}
function toCar(){me.mesh.visible=false;G.mode='car';G.cancelAll();G.snapCam();}
function exitCar(){if(G.mode!=='car')return false;if(Math.abs(car.vf)>4){G.toast('Pehle gaari roko');return false;}toFoot(car.x+Math.cos(car.h)*2.3,car.z-Math.sin(car.h)*2.3,car.h);return true;}
function enterCar(){if(G.mode!=='foot'||G.indoor)return false;if(Math.hypot(me.x-car.x,me.z-car.z)>7.5){G.toast('Gaari door hai — pehle uske paas jao');return false;}toCar();return true;}
Object.assign(G,{toFoot,toCar,exitCar,enterCar});

const footAct={};
function walkAct(a){let t=0;const secs=clamp(+a.secs||1,.1,15),thr=a.dir==='back'?-1:1;return{name:'walk',update(dt){t+=dt;me.auto={thr,steer:clamp(+a.steer||0,-1,1),run:!!a.run};return t>=secs;}};}
footAct.speed=a=>walkAct({secs:3,dir:'forward',run:(+a.kmh||0)>55});
footAct.reverse=a=>walkAct({secs:a.secs||1.5,dir:'back'});
footAct.stop=()=>({name:'stop',update:()=>true});footAct.park=footAct.stop;
footAct.drive=a=>walkAct({secs:a.secs||1,dir:(+a.throttle<0)?'back':'forward',steer:a.steer});
footAct.turn=a=>{const around=['around','back','uturn'].includes(a.dir),dir=a.dir==='right'?-1:1,deg=(around?180:clamp(+a.deg||90,10,180))*PI/180;let target=null,t=0;
 return{name:'turn',update(dt){t+=dt;if(target===null)target=me.h+dir*deg;const err=wrapA(target-me.h);me.auto={thr:0,steer:clamp(err*3,-1,1),run:false};return Math.abs(err)<.06||t>6;}};};
footAct.goto=a=>{let pts,name;
 if(a.place==='car'){const r=G.route(me.x,me.z,me.h,car.x,car.z,9.6);pts=r.pts.concat([{x:car.x,z:car.z}]);name='gaari';}
 else{const l=lm(a.place)||(a.place&&LM.find(x=>x.name.toLowerCase()===String(a.place).toLowerCase()));let tx,tz;
  if(l){tx=l.stop.x;tz=l.stop.z;name=l.name;}else if(a.x!=null){tx=+a.x;tz=+a.z;name='Target';}else{G.toast('Jagah samajh nahi aayi');return{update:()=>true};}
  pts=G.route(me.x,me.z,me.h,tx,tz,9.6).pts;if(l&&l.kind==='house')pts=pts.concat([{x:l.door.x,z:l.door.z}]);}
 let i=0,t=0;const end=pts[pts.length-1];
 return{name:'walk to '+name,update(dt){t+=dt;while(i<pts.length-1&&Math.hypot(pts[i].x-me.x,pts[i].z-me.z)<2.2)i++;const p=pts[i],d=Math.hypot(end.x-me.x,end.z-me.z),err=wrapA(Math.atan2(p.x-me.x,p.z-me.z)-me.h);
  me.auto={thr:Math.abs(err)>1.2?.15:1,steer:clamp(err*3,-1,1),run:d>25};return(a.place==='car'&&d<3.4)||d<2.2||t>140;}};};
for(const k of Object.keys(footAct)){const o=A[k];A[k]=a=>G.mode==='foot'?footAct[k](a||{}):o(a);}
A.walk=a=>G.mode==='foot'?walkAct(a||{}):{name:'noop',update:()=>true};

function footStep(dt){me.auto=null;const man=G.manualInp();let thr=man.thr,st=man.steer,run=runTog||G.keys.shift;
 if(man.active){if(AP.cur||AP.queue.length)G.cancelAll();}else{G.stepQueue(dt);if(me.auto){thr=me.auto.thr;st=me.auto.steer;run=me.auto.run;}}
 me.h+=st*(me.turnRate||2.5)*dt;const sp=thr>0?(run?7:3.4):thr<0?-2:0,nx=me.x+Math.sin(me.h)*sp*dt,nz=me.z+Math.cos(me.h)*sp*dt;
 if(G.indoor)roomMove(nx,nz);else{const r=G.resolve(nx,nz,.42);me.x=clamp(r.x,-40,C.SIZE+40);me.z=clamp(r.z,-40,C.SIZE+40);}
 G.footSpeed=Math.abs(sp);animPerson(me,Math.abs(sp),dt);placePerson(me);
 if(!G.indoor&&homeCD<=0&&sp>0){const l=lm(SV.home);if(Math.hypot(me.x-l.door.x,me.z-l.door.z)<1.8)enterHome();}}
G.camHook=dt=>{if(G.mode!=='foot')return false;const fx=Math.sin(me.h),fz=Math.cos(me.h);let tx=me.x-fx*4.4,tz=me.z-fz*4.4,ty=2.3;
 if(G.indoor){tx=clamp(tx,ROOM.cx-6.5,ROOM.cx+6.5);tz=clamp(tz,ROOM.cz-4.5,ROOM.cz+4.6);ty=2.4;}
 const cs=G.camState;if(cs.snap){cs.pos.set(tx,ty,tz);cs.snap=false;}else cs.pos.lerp(G.camTmp.set(tx,ty,tz),1-Math.exp(-dt*6));
 camera.position.copy(cs.pos);camera.lookAt(me.x+fx*1.5,1.3,me.z+fz*1.5);cs.fov=60;return true;};

/* ───────── traffic ───────── */
const D=[[1,0],[0,1],[-1,0],[0,-1]],HD=[PI/2,0,-PI/2,PI],NBn=C.NB,inB=(i,j)=>i>=0&&j>=0&&i<=NBn&&j<=NBn,lo=(d,L)=>[D[d][1]*L,-D[d][0]*L];
const trafficGroup=new T.Group(),pedGroup=new T.Group();scene.add(trafficGroup,pedGroup);
const npcs=G.npcs=[],npcCircles=[];
function spawnNpc(){const n=G.buildCar(pick(['#2f6fb5','#e8e8e8','#222','#b8b8b8','#c28a1c','#2f8f5b','#8a2f5b','#d9d9a0']),{shape:pick(G.npcShapes||['sedan','hatch','suv','sports']),lights:false});
 trafficGroup.add(n.mesh);n.npc=true;n.vmax=rnd(9,14)*(n.speedK||1);n.v=0;n.stuck=0;n.ghost=0;let i,j,d,k=0;
 do{i=Math.floor(rnd(0,NBn+1));j=Math.floor(rnd(0,NBn+1));d=Math.floor(rnd(0,4));k++;}while((!inB(i+D[d][0],j+D[d][1])||Math.hypot(roadC(i)-car.x,roadC(j)-car.z)<80)&&k<40);
 n.d=d;n.to=[i+D[d][0],j+D[d][1]];const f=rnd(.15,.85),o=lo(d,3.8);n.x=roadC(i)+D[d][0]*C.P*f+o[0];n.z=roadC(j)+D[d][1]*C.P*f+o[1];n.h=HD[d];npcs.push(n);return n;}
const npcTarget=n=>{const o=lo(n.d,3.8);return{x:roadC(n.to[0])+o[0],z:roadC(n.to[1])+o[1]};};
function npcStep(n,dt){let tg=npcTarget(n);
 if(Math.hypot(tg.x-n.x,tg.z-n.z)<6){const i=n.to[0],j=n.to[1],opts=[0,1,2,3].filter(k=>k!==(n.d+2)%4&&inB(i+D[k][0],j+D[k][1])),w=opts.map(k=>k===n.d?3:1);let r=Math.random()*w.reduce((a,b)=>a+b,0),pk=opts[0];
  for(let q=0;q<opts.length;q++){r-=w[q];if(r<=0){pk=opts[q];break;}}if(n.choose)pk=n.choose(n,opts);n.d=pk;n.to=[i+D[pk][0],j+D[pk][1]];tg=npcTarget(n);}
 const err=wrapA(Math.atan2(tg.x-n.x,tg.z-n.z)-n.h);n.h+=clamp(err,-1.5*dt,1.5*dt);n.steer=clamp(err*1.5,-1,1);let vt=Math.abs(err)>.5?5:n.vmax;
 if(n.ghost>0)n.ghost-=dt;else if(!n.noBlock){const fx=Math.sin(n.h),fz=Math.cos(n.h);let blocked=false;
  const chk=(ox,oz)=>{const dx=ox-n.x,dz=oz-n.z,fwd=dx*fx+dz*fz,lat=Math.abs(dx*fz-dz*fx);return fwd>1&&fwd<12&&lat<2.3;};
  if(chk(car.x,car.z)||(G.mode==='foot'&&chk(me.x,me.z)))blocked=true;for(const o of npcs)if(o!==n&&chk(o.x,o.z)){blocked=true;break;}
  if(G.extraBlock&&G.extraBlock(n,chk))blocked=true;
  if(blocked)vt=0;n.stuck=blocked&&n.v<.3?n.stuck+dt:0;if(n.stuck>6){n.ghost=4;n.stuck=0;}}
 n.v+=clamp(vt-n.v,-9*dt,4*dt);n.x+=Math.sin(n.h)*n.v*dt;n.z+=Math.cos(n.h)*n.v*dt;n.vf=n.v;n.vl=0;n.brake=vt<n.v-.5;n.acc2=0;G.syncCarMesh(n,dt);}
G.circleProviders.push(()=>npcCircles);G.npcStep=npcStep;

/* pedestrians */
const peds=G.peds=[];
function perim(bx,bz,s){const x0=C.blk0(bx)+1.6,z0=C.blk0(bz)+1.6,L=C.BS-3.2;s=((s%(4*L))+4*L)%(4*L);const k=Math.floor(s/L),u=s-k*L;
 return k===0?[x0+u,z0,PI/2]:k===1?[x0+L,z0+u,0]:k===2?[x0+L-u,z0+L,-PI/2]:[x0,z0+L-u,PI];}
function spawnPed(){const p=G.buildPerson(pick(['#c0392b','#2980b9','#27ae60','#f39c12','#8e44ad','#7f8c8d','#16a085','#d35400']),pick(['#2c3e50','#34495e','#5d4037','#455a64']),pick(['#e0ac89','#c68642','#8d5524','#f1c27d']),pick(['#111','#3b2f2f','#6b4b2a']),rnd(.93,1.05));
 pedGroup.add(p.mesh);p.bx=Math.floor(rnd(0,C.NB));p.bz=Math.floor(rnd(0,C.NB));p.s=rnd(0,200);p.dir=Math.random()<.5?1:-1;p.sp=rnd(1.1,1.6);p.down=0;p.ped=true;peds.push(p);}
function pedStep(dt){for(const p of peds){
 if(p.down>0){p.down-=dt;if(p.down<=0){p.mesh.rotation.x=0;p.mesh.position.y=0;p.bx=Math.floor(rnd(0,C.NB));p.bz=Math.floor(rnd(0,C.NB));p.s=rnd(0,200);}continue;}
 p.s+=p.dir*p.sp*dt;const q=perim(p.bx,p.bz,p.s);p.x=q[0];p.z=q[1];p.h=q[2]+(p.dir<0?PI:0);animPerson(p,p.sp*2,dt);placePerson(p);
 if(G.mode==='car'&&Math.abs(car.vf)>3&&Math.hypot(p.x-car.x,p.z-car.z)<1.9){p.down=6;p.mesh.rotation.x=-1.5;p.mesh.position.y=.2;p.mesh.rotation.y=car.h;G.burst(400,.2,.15);if(G.onPedHit)G.onPedHit(p);}}}
G.knockPed=p=>{p.down=6;p.mesh.rotation.x=-1.5;p.mesh.position.y=.2;};

/* ───────── homes / interior ───────── */
const INT=new T.Group();INT.position.set(3000,0,3000);INT.visible=false;scene.add(INT);
const ROOM={cx:3000,cz:3000};let roomBoxes=[],tvMat=null,tvOn=false,tvT=0;
function buildRoom(id){while(INT.children.length)INT.remove(INT.children[0]);roomBoxes=[];
 const th={home:{floor:'#8b5e3c',wall:'#e9dcc3',sofa:'#3f6b8a',acc:'#c0392b'},home2:{floor:'#6d7378',wall:'#dfe3e6',sofa:'#2d3436',acc:'#00b894'},home3:{floor:'#2b2118',wall:'#3a3a45',sofa:'#7a1f2b',acc:'#d4af37'}}[id]||{floor:'#8b5e3c',wall:'#e9dcc3',sofa:'#3f6b8a',acc:'#c0392b'};
 const M=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r==null?.85:r});
 const box=(w,h,d,mat,x,y,z,solid)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);INT.add(m);if(solid)roomBoxes.push({x0:ROOM.cx+x-w/2-.1,x1:ROOM.cx+x+w/2+.1,z0:ROOM.cz+z-d/2-.1,z1:ROOM.cz+z+d/2+.1});return m;};
 box(14,.2,10,M(th.floor,.55),0,-.1,0);box(14,.2,10,M('#f3f3f0'),0,3.5,0);
 box(14,3.4,.3,M(th.wall),0,1.7,-5.15);box(14,3.4,.3,M(th.wall),0,1.7,5.15);box(.3,3.4,10,M(th.wall),-7.15,1.7,0);box(.3,3.4,10,M(th.wall),7.15,1.7,0);
 box(1.8,2.6,.1,M('#5b3a29'),0,1.3,4.98);box(.2,.2,.2,M(th.acc),.6,1.3,4.9);
 const win=new T.MeshBasicMaterial({color:G.night>.5?'#1a2a55':'#bfe3ff'});box(3.2,1.6,.05,win,-3.5,1.9,-4.98);box(3.2,1.6,.05,win,3.5,1.9,-4.98);
 box(2.2,.5,3.2,M('#f2f2f2'),-5,.25,-2.8,true);box(2.2,.15,.9,M(th.acc),-5,.55,-1.7);box(1,.18,.6,M('#ffffff'),-5,.62,-4);
 tvMat=new T.MeshBasicMaterial({color:'#05070a'});box(2.4,1.3,.12,M('#111'),3.5,1.3,-4.7);box(2.2,1.1,.05,tvMat,3.5,1.3,-4.62);
 box(3.2,.8,1.1,M(th.sofa),3.5,.4,.8,true);box(3.2,.8,.25,M(th.sofa),3.5,.8,1.35);box(1.6,.5,.8,M('#5a4a3a'),3.5,.25,-1.7,true);box(4,.02,3,M(th.acc,1),3.5,.01,-.8);
 box(.5,1.7,.5,M('#cfcfcf'),-6.3,.85,3.8,true);box(.7,.4,.7,new T.MeshBasicMaterial({color:'#ffe2a8'}),-6.3,1.9,3.8);
 if(id==='home3'){box(.6,2.4,.6,M('#d4af37',.3),6.2,1.2,-4.2,true);box(.6,2.4,.6,M('#d4af37',.3),-6.2,1.2,-4.2,true);}
 for(const p of[[0,2.9,0],[-4,2.6,-2],[4,2.6,2]]){const l=new T.PointLight(0xffd9a0,.9,18,1.6);l.position.set(p[0],p[1],p[2]);INT.add(l);}}
function roomMove(nx,nz){nx=clamp(nx,ROOM.cx-6.5,ROOM.cx+6.5);nz=clamp(nz,ROOM.cz-4.5,ROOM.cz+4.9);
 for(const b of roomBoxes){const cx=clamp(nx,b.x0,b.x1),cz=clamp(nz,b.z0,b.z1),dx=nx-cx,dz=nz-cz,d=Math.hypot(dx,dz);if(d<.42){if(d<1e-4){nx=b.x0-.42;}else{nx+=dx/d*(.42-d);nz+=dz/d*(.42-d);}}}
 me.x=nx;me.z=nz;if(me.z>ROOM.cz+4.3&&Math.abs(me.x-ROOM.cx)<1.5)exitHome();}
function parkCarAtHome(l){car.x=l.stop.x;car.z=l.stop.z-3.8;car.h=PI/2;car.vx=car.vz=car.vf=car.vl=0;car.steer=0;}
function enterHome(){if(G.indoor)return false;const l=lm(SV.home),f=G.focusPos();if(Math.hypot(f.x-l.x,f.z-l.z)>46){G.toast('Pehle ghar ('+l.name+') ke paas jao');return false;}
 G.fade(()=>{parkCarAtHome(l);G.indoor=true;INT.visible=true;buildRoom(SV.home);trafficGroup.visible=pedGroup.visible=false;car.mesh.visible=false;
  me.mesh.visible=true;G.mode='foot';me.x=ROOM.cx;me.z=ROOM.cz+2.8;me.h=PI;placePerson(me);G.cancelAll();G.snapCam();$('mini').style.visibility='hidden';});return true;}
function exitHome(){if(!G.indoor)return false;const l=lm(SV.home);homeCD=4;
 G.fade(()=>{G.indoor=false;INT.visible=false;trafficGroup.visible=pedGroup.visible=true;car.mesh.visible=true;parkCarAtHome(l);me.x=l.door.x;me.z=l.door.z+1;me.h=0;placePerson(me);G.mode='foot';G.cancelAll();G.snapCam();$('mini').style.visibility='visible';});return true;}
Object.assign(G,{enterHome,exitHome});
function sleepNow(){if(!G.indoor){G.toast('Ghar ke andar jao, phir so sakte ho');return;}
 G.fade(()=>{G.time=7;me.hp=100;car.hp=100;G.setWeather(pick(['clear','clear','cloudy','rain']),200);G.saveGame();G.toast('Subah ho gayi ☀ — health aur gaari theek, game save',2800);setTimeout(()=>G.event('sleep',null,true),600);},700);}
function changeHome(to){const l=lm(to);if(!l||l.kind!=='house'){G.toast('Aisa ghar nahi hai');return;}
 if(!SV.owned.includes(to)){const price=to==='home2'?4000:12000;if(SV.money<price){G.toast('Paise kam hain — '+l.name+' ka daam Rs '+price,2800);return;}G.addMoney(-price);SV.owned.push(to);}
 SV.home=to;G.saveGame();homeMk.x=l.stop.x;homeMk.z=l.stop.z;
 if(G.indoor)G.fade(()=>{buildRoom(to);parkCarAtHome(l);me.x=ROOM.cx;me.z=ROOM.cz+2.8;me.h=PI;});
 G.toast('Ab aapka ghar: '+l.name,2400);}
const homeMk={id:'homeMk',x:0,z:0,color:'#4ade80'};

/* ───────── missions ───────── */
const defs=G.missions=[];
const cp=[[2,1],[5,2],[6,5],[3,6],[1,4],[0,0]].map((q,k)=>({type:'goto',x:roadC(q[0]),z:roadC(q[1]),radius:17,veh:'car',text:'Checkpoint '+(k+1)+'/6'}));
defs.push(
 {id:'m1',title:'Pehla Safar',giver:'home',intro:'Chalo, pehle Petrol Pump tak chalte hain.',steps:[{type:'goto',lm:'petrol',veh:'car',text:'Gaari se Petrol Pump pahuncho'}],reward:{money:300,xp:40}},
 {id:'m2',title:'Parcel Delivery',giver:'petrol',time:200,intro:'Bazaar se parcel uthao aur Hospital pahunchao. Waqt kam hai!',steps:[{type:'goto',lm:'bazaar',veh:'any',text:'Bazaar se parcel uthao'},{type:'goto',lm:'hospital',veh:'any',text:'Parcel Hospital pahunchao'}],reward:{money:700,xp:80}},
 {id:'m3',title:'Taxi Service',giver:'hospital',time:210,needCar:true,intro:'Mall par ek passenger intezar kar raha hai. Aaram se chalana!',steps:[{type:'pickup',lm:'mall',text:'Mall par passenger ko uthao (gaari roko)'},{type:'goto',lm:'stadium',veh:'car',text:'Passenger ko Stadium chhodo'}],reward:{money:900,xp:110}},
 {id:'m4',title:'City Race',giver:'stadium',time:160,needCar:true,intro:'6 checkpoints, 160 second. Full speed!',steps:cp,reward:{money:1500,xp:160}});
const HI1=['चलो, पहले पेट्रोल पंप तक चलते हैं।','बाज़ार से पार्सल उठाओ और अस्पताल पहुँचाओ। वक़्त कम है!','मॉल पर एक सवारी इंतज़ार कर रही है। आराम से चलाना!','छह चेकपॉइंट, एक सौ साठ सेकंड। पूरी रफ़्तार से!'];defs.forEach((d,i)=>{d.hi=HI1[i];});
const tgtOf=st=>st.lm?lm(st.lm).stop:{x:st.x,z:st.z};
const ST=G.stepTypes={
 goto:{start(s,st){s.t=tgtOf(st);s.bc=G.beacon(s.t.x,s.t.z,'#ffd23f',130,2.4);s.mk={id:'obj',x:s.t.x,z:s.t.z,color:'#ffd23f',big:1};G.markers.push(s.mk);},
  update(s,st){if(st.veh==='car'&&G.mode!=='car')return null;const f=G.focusPos();return Math.hypot(f.x-s.t.x,f.z-s.t.z)<(st.radius||14)?'done':null;},
  end(s){if(s.bc)s.bc.parent.remove(s.bc);const i=G.markers.indexOf(s.mk);if(i>=0)G.markers.splice(i,1);}},
 pickup:{start(s,st){s.t=tgtOf(st);s.bc=G.beacon(s.t.x,s.t.z,'#ffd23f',130,2.4);s.mk={id:'obj',x:s.t.x,z:s.t.z,color:'#ffd23f',big:1};G.markers.push(s.mk);
   s.p=G.buildPerson('#e67e22','#2c3e50','#e0ac89','#222');s.p.x=s.t.x+1.5;s.p.z=s.t.z-9.2;s.p.h=PI;scene.add(s.p.mesh);placePerson(s.p);},
  update(s){if(G.mode==='car'&&Math.hypot(car.x-s.t.x,car.z-s.t.z)<11&&Math.abs(car.vf)<2.6){G.toast('Passenger baith gaya 🚖');G.tone(780,.12,.06,'triangle');return'done';}return null;},
  end(s){scene.remove(s.p.mesh);if(s.bc)s.bc.parent.remove(s.bc);const i=G.markers.indexOf(s.mk);if(i>=0)G.markers.splice(i,1);}}};
const M=G.M={active:null,step:0,s:null,left:0,cd:18};
let giverMk=null,giverBc=null;
function setGiver(){clearGiver();const d=defs[SV.mi];if(!d)return;const l=lm(d.giver);giverMk={id:'giver',x:l.stop.x,z:l.stop.z,color:'#ff8a3d',big:1};G.markers.push(giverMk);giverBc=G.beacon(l.stop.x,l.stop.z,'#ff8a3d',110,2.2);}
function clearGiver(){if(giverBc){giverBc.parent.remove(giverBc);giverBc=null;}if(giverMk){const i=G.markers.indexOf(giverMk);if(i>=0)G.markers.splice(i,1);giverMk=null;}}
function beginStep(){const d=M.active,st=d.steps[M.step],h=ST[st.type];M.s={};if(!h){console.warn('step type missing',st.type);return;}h.start(M.s,st,d);}
function endStep(){if(M.active&&M.active.steps[M.step]){const st=M.active.steps[M.step],h=ST[st.type];if(h&&h.end)h.end(M.s,st);M.s={};}}
function startMission(d){if(M.active)return false;if(!d){G.toast('Saare missions khatam! 🏆');return false;}clearGiver();M.active=d;M.step=0;M.left=d.time||0;if(d.onStart)d.onStart();beginStep();G.say(d.intro,d.hi||null,d.hi?'hi-IN':null);G.toast('MISSION: '+d.title,2600);return true;}
function finishMission(ok,why){if(!M.active)return;const d=M.active;endStep();if(d.onEnd)d.onEnd(ok);M.active=null;M.cd=8;
 if(ok){G.addMoney(d.reward.money);G.addXP(d.reward.xp);SV.mi++;G.saveGame();G.toast('MISSION PASSED! +Rs '+d.reward.money+' · +'+d.reward.xp+' XP',3200);G.tone(784,.12,.07,'triangle');G.vib([80,50,80,50,220]);setTimeout(()=>G.tone(1046,.25,.07,'triangle'),140);setTimeout(()=>G.event('mission_pass',null,true),900);}
 else{G.toast('Mission fail: '+(why||''),3000);G.burst(300,.4,.2);setTimeout(()=>G.event('mission_fail',null,true),900);}
 G.setMission('');setGiver();}
G.startMission=startMission;G.finishMission=finishMission;
const mm=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
let mHud=0;
function missionStep(dt){M.cd-=dt;
 if(M.active){const d=M.active,st=d.steps[M.step],h=ST[st.type];
  if(d.time){M.left-=dt;if(M.left<=0){finishMission(false,'waqt khatam');return;}}
  if(d.needCar&&car.hp<=8){finishMission(false,'gaari kharab ho gayi');return;}
  if(d.failIf){const r=d.failIf();if(r){finishMission(false,r);return;}}
  const r=h?h.update(M.s,st,dt,d):null;
  if(r==='fail'){finishMission(false,(M.s&&M.s.why)||'');return;}
  if(r==='done'){endStep();M.step++;if(M.step>=d.steps.length){finishMission(true);return;}beginStep();}
  mHud-=dt;if(mHud<=0){mHud=.4;const st2=d.steps[M.step];G.setMission('<b>'+d.title+'</b><small>'+(st2.text||'')+((st2.veh==='car'&&G.mode!=='car')?' — pehle gaari mein baitho 🚗':'')+'</small>'+(d.time?'<small>⏱ '+mm(Math.max(0,M.left))+'</small>':'')+(d.extraHud?d.extraHud():''));}
 }else if(giverMk&&M.cd<=0&&!G.indoor){const f=G.focusPos();if(Math.hypot(f.x-giverMk.x,f.z-giverMk.z)<12)startMission(defs[SV.mi]);}}

/* ───────── frame update ───────── */
let tvT2=0;
G.hooks.update.push(dt=>{
 homeCD-=dt;if(G.mode==='foot')footStep(dt);G.hudHp=G.mode==='foot'?me.hp:null;
 if(!G.indoor){npcCircles.length=0;for(const n of npcs){npcStep(n,dt);const fx=Math.sin(n.h),fz=Math.cos(n.h);npcCircles.push({x:n.x+fx*(n.half||1.2),z:n.z+fz*(n.half||1.2),r:n.cr||1.1,self:n},{x:n.x-fx*(n.half||1.2),z:n.z-fz*(n.half||1.2),r:n.cr||1.1,self:n});}pedStep(dt);}
 else{tvT2-=dt;if(tvMat&&tvT2<=0){tvT2=.6;tvMat.color.set(tvOn?pick(['#4aa3ff','#ff7a59','#7affb2','#c084fc']):'#05070a');}}
 missionStep(dt);});

/* ───────── actions, buttons, prompt ───────── */
A.exit_car=inst(()=>exitCar(),'exit_car');A.enter_car=inst(()=>enterCar(),'enter_car');
A.enter_home=inst(()=>enterHome(),'enter_home');A.exit_home=inst(()=>exitHome(),'exit_home');
A.sleep=inst(()=>sleepNow(),'sleep');A.tv=inst(a=>{tvOn=a.on!==false;},'tv');A.save=inst(()=>{G.saveGame();G.toast('Game save ho gaya 💾');},'save');
A.change_home=inst(a=>changeHome(a.to),'change_home');
A.start_mission=inst(()=>{if(M.active)G.toast('Mission pehle se chal raha hai');else startMission(defs[SV.mi]);},'start_mission');
A.cancel_mission=inst(()=>{if(M.active)finishMission(false,'cancel kiya');},'cancel_mission');
A.missions=inst(()=>{const d=M.active||defs[SV.mi];G.say(d?(M.active?'Mission chal raha hai: ':'Agla mission: ')+d.title+(M.active?'':' — '+lm(d.giver).name+' par jao.'):'Saare missions khatam ho gaye!',null,null);},'missions');
G.promptExtras.push(`STAGE 2 ACTIONS:
The player can be IN the car (mode "car") or ON FOOT (mode "foot"); everything in the car list also works on foot where it makes sense (goto walks, turn rotates, stop halts).
{"a":"exit_car"} get out; {"a":"enter_car"} get in (must be within ~7 m; if far, first {"a":"goto","place":"car"} on foot, then enter_car).
{"a":"walk","dir":"forward|back","secs":N,"run":false}  walk/run on foot.
{"a":"enter_home"} go inside the active home (must be within ~45 m of it; otherwise goto it first) / {"a":"exit_home"} / {"a":"sleep"} (inside home: skips to morning, heals, saves) / {"a":"tv","on":true} / {"a":"save"}
{"a":"change_home","to":"home|home2|home3"} moves to another house (home2 costs Rs 4000, home3 Rs 12000, bought once).
{"a":"start_mission"} start the next mission now / {"a":"cancel_mission"} / {"a":"missions"} tells the player the mission status.
Missions: pickup/delivery/taxi/race with timers; yellow beacons mark objectives. If the player asks "kya karun / koi kaam do", suggest or start the next mission.`);
G.stateExtras.push(()=>{const d=M.active,nd=defs[SV.mi],l=lm(SV.home);return{on_foot:G.mode==='foot',indoors_home:G.indoor,car_dist_m:Math.round(Math.hypot(me.x-car.x,me.z-car.z)),money:SV.money,level:lvl(),active_home:SV.home,home_dist_m:Math.round(Math.hypot(G.focusPos().x-l.x,G.focusPos().z-l.z)),
 mission:d?{title:d.title,objective:d.steps[M.step].text,time_left_s:d.time?Math.round(M.left):null}:null,next_mission:nd?{title:nd.title,at:nd.giver}:null};});
G.teleportCar=function(id){const l=lm(id);parkCarAtHome({stop:l.stop});if(G.mode==='foot'&&!G.indoor)toCar();car.hp=Math.max(car.hp,60);G.snapCam();};
G.hooks.ready.push(()=>{
 const xb=$('xbtns'),mk=(label,fn,t)=>{const b=document.createElement('button');b.className='cb sm';b.textContent=label;b.setAttribute('aria-label',t);b.addEventListener('click',fn);xb.appendChild(b);return b;};
 mk('🚪',()=>{if(G.indoor){exitHome();return;}if(G.mode==='car'){exitCar();return;}const l=lm(SV.home);if(Math.hypot(me.x-l.door.x,me.z-l.door.z)<5){enterHome();return;}enterCar();},'Gaari / Ghar');
 mk('🏃',()=>{runTog=!runTog;G.toast(runTog?'Daudna on':'Daudna off',900);},'Run');
 const nn=S.quality==='low'?3:S.quality==='med'?7:12,np=S.quality==='low'?8:S.quality==='med'?16:24;for(let i=0;i<nn;i++)spawnNpc();for(let i=0;i<np;i++)spawnPed();
 const l=lm(SV.home);homeMk.x=l.stop.x;homeMk.z=l.stop.z;G.markers.push(homeMk);
 if(SV.home!=='home')parkCarAtHome(l);statHud();setGiver();M.cd=18;G.snapCam();
 if(SV.mi>0)setTimeout(()=>G.toast('Game load ho gaya — Level '+lvl()+', mission '+(SV.mi+1),2600),1200);});
})();
