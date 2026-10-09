/* SARAS CITY — stage3.js  (Stage 3: Full Advanced)
   Needs core.js + stage2.js.  Police & wanted stars, fists + pistol, thugs & boss,
   chase / race / evade / fight missions, garage (cars + colours), radio, wasted / busted. */
(function(){
'use strict';
const G=window.G;if(!G||!G.T||!G.stepTypes||G.stage<2){console.warn('stage3.js ko stage2.js chahiye');return;}
G.stage=3;
const T=G.T,$=G.$,clamp=G.clamp,wrapA=G.wrapA,PI=Math.PI,rnd=G.rnd,pick=G.pick,scene=G.scene,car=G.car,me=G.me,C=G.C,roadC=C.roadC,A=G.actions,LM=G.landmarks,SV=G.save,ST=G.stepTypes,M=G.M;
const lm=id=>LM.find(l=>l.id===id),inst=(fn,name)=>a=>{fn(a||{});return{name,update:()=>true};};
if(SV.pistol==null)SV.pistol=false;if(SV.ammo==null)SV.ammo=0;if(!SV.car)SV.car={shape:'sedan',color:'#c9372c',owned:['sedan']};
let weapon='fists',atkCD=0,hurtT=0,repCD=0,healCD=0;G.getWeapon=()=>weapon;

/* ───────── hurt overlay ───────── */
const hurtEl=document.createElement('div');hurtEl.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9;transition:box-shadow .25s;box-shadow:inset 0 0 140px 30px rgba(255,40,40,0)';document.body.appendChild(hurtEl);
function hurtFx(){hurtEl.style.boxShadow='inset 0 0 140px 40px rgba(255,40,40,.55)';setTimeout(()=>{hurtEl.style.boxShadow='inset 0 0 140px 30px rgba(255,40,40,0)';},260);}
const dying={v:false};
function hurtMe(n){if(dying.v||G.indoor)return;me.hp=Math.max(0,me.hp-n);hurtT=8;hurtFx();G.vib(110);G.camState.shake=Math.max(G.camState.shake,.35);G.burst(300,.12,.2);if(me.hp<=0)wasted();}
G.hurtMe=hurtMe;

/* ───────── wanted level + police ───────── */
const WD={stars:0,lost:0,bust:0,spawnT:2,sirenT:0,flashT:0,busting:false},cops=[],copGroup=new T.Group();scene.add(copGroup);
function setWanted(n){n=clamp(Math.round(n),0,5);if(n>WD.stars){WD.lost=0;G.vib([180,70,180]);}WD.stars=n;G.statHud();}
G.setWanted=setWanted;G.wanted=()=>WD.stars;
G.crime=lv=>{if(G.indoor)return;if(lv>WD.stars){const was=WD.stars;setWanted(lv);G.toast('Wanted: '+'★'.repeat(WD.stars),1800);if(!was)G.event('wanted',null,true);}else WD.lost=0;};
G.statExtra=()=>(WD.stars?' · <b style="color:#ff6b5e">'+'★'.repeat(WD.stars)+'</b>':'')+(weapon==='pistol'?' · 🔫<b>'+SV.ammo+'</b>':'');
G.onPedHit=()=>G.crime(1);
G.onCrash=(c,hs)=>{if(c!==car||hs<5||!G.lastInp||Math.abs(G.lastInp.thr)<.2)return;for(const n of G.npcs)if(Math.hypot(n.x-car.x,n.z-car.z)<4.4){G.crime(1);break;}};
G.extraBlock=(n,chk)=>{for(const c of cops)if(chk(c.x,c.z))return true;return false;};

function clearLine(x0,z0,x1,z1){const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/3);for(let k=1;k<n;k++){const px=x0+(x1-x0)*k/n,pz=z0+(z1-z0)*k/n;for(const b of G.colliders)if(px>b.x0&&px<b.x1&&pz>b.z0&&pz<b.z1)return false;}return true;}
function pursueInp(c,pts,vmax,cv){while(c.idx<pts.length-1&&Math.hypot(pts[c.idx].x-c.x,pts[c.idx].z-c.z)<7+Math.abs(c.vf)*.25)c.idx++;const p=pts[c.idx];if(!p)return{thr:0,steer:0,hb:false};
 const err=wrapA(Math.atan2(p.x-c.x,p.z-c.z)-c.h),vt=Math.abs(err)>.65?cv:vmax;let thr=clamp((vt-c.vf)*.3,-1,1);if(thr<0&&c.vf<.4)thr=0;return{thr,steer:clamp(2.2*err,-1,1),hb:false};}
function driveAI(c,pts,vmax,cv,dt){let inp=pursueInp(c,pts,vmax,cv);
 if(c.rev>0){c.rev-=dt;inp={thr:-.8,steer:-inp.steer,hb:false};}else if(Math.abs(c.vf)<.7&&inp.thr>.3){c.stuck+=dt;if(c.stuck>1.8){c.rev=1.2;c.stuck=0;}}else c.stuck=0;
 G.stepCar(c,inp,dt);G.syncCarMesh(c,dt);}

function spawnCop(){const c=G.buildCar('#14181f',{shape:'sedan',lights:false}),m1=new T.MeshBasicMaterial({color:'#ff2020'}),m2=new T.MeshBasicMaterial({color:'#2060ff'});
 const b1=new T.Mesh(new T.BoxGeometry(.5,.14,.3),m1),b2=new T.Mesh(new T.BoxGeometry(.5,.14,.3),m2);b1.position.set(-.3,1.62,-.1);b2.position.set(.3,1.62,-.1);c.body.add(b1,b2);
 if(!c.mesh.userData.hasModel){const st=new T.Mesh(new T.BoxGeometry(1.95,.18,1.2),new T.MeshPhongMaterial({color:'#f0f0f0'}));st.position.set(0,.65,0);c.body.add(st);}
 c.cop=true;c.bm=[m1,m2];c.maxV=33+WD.stars*1.6;c.acc=1.1;c.hp=120;c.idx=0;c.pts=[];c.rt=0;c.stuck=0;c.rev=0;c.hitT=0;c.hitT2=0;c.away=0;
 let tries=0,i,j;const f=G.focusPos();do{i=Math.floor(rnd(0,8));j=Math.floor(rnd(0,8));tries++;}while((Math.hypot(roadC(i)-f.x,roadC(j)-f.z)<110||Math.hypot(roadC(i)-f.x,roadC(j)-f.z)>240)&&tries<80);
 c.x=roadC(i)+3.8;c.z=roadC(j)+3.8;c.h=0;c.steer=0;c.vx=c.vz=c.vf=c.vl=0;copGroup.add(c.mesh);c.mk={id:'cop',x:c.x,z:c.z,color:'#3b82f6'};G.markers.push(c.mk);cops.push(c);}
function removeCop(c){copGroup.remove(c.mesh);const i=cops.indexOf(c);if(i>=0)cops.splice(i,1);const k=G.markers.indexOf(c.mk);if(k>=0)G.markers.splice(k,1);}
function clearCops(){while(cops.length)removeCop(cops[0]);}
function copStep(c,dt){const onCar=G.mode==='car',tgt=onCar?car:me,d=Math.hypot(tgt.x-c.x,tgt.z-c.z);c.rt-=dt;c.hitT-=dt;
 if(c.rt<=0){c.rt=1.8;c.pts=G.route(c.x,c.z,c.h,tgt.x,tgt.z,0).pts;c.idx=0;}
 let pts=c.pts;if(d<45&&clearLine(c.x,c.z,tgt.x,tgt.z))pts=[{x:tgt.x,z:tgt.z}];
 const old=c.idx;if(pts!==c.pts)c.idx=0;
 const near=d<12,vmax=(onCar&&Math.abs(car.vf)<5&&d<6.5)?0:(near&&onCar&&Math.abs(car.vf)<8?Math.max(6,Math.abs(car.vf)+4):c.maxV);
 driveAI(c,pts,vmax,10,dt);if(pts!==c.pts)c.idx=old;
 /* ram the player's car */
 const dx=car.x-c.x,dz=car.z-c.z,dd=Math.hypot(dx,dz);
 if(dd<3.6&&dd>.01){const nx=dx/dd,nz=dz/dd,ov=3.6-dd;car.x+=nx*ov*.3;car.z+=nz*ov*.3;c.x-=nx*ov*.7;c.z-=nz*ov*.7;const rel=(car.vx-c.vx)*nx+(car.vz-c.vz)*nz;
  if(rel<-2.5&&c.hitT2<=0){c.hitT2=.5;const imp=Math.min(-rel,9);car.vx+=nx*imp*.25;car.vz+=nz*imp*.25;c.vx-=nx*imp*.6;c.vz-=nz*imp*.6;car.hp=Math.max(0,car.hp-imp*.7);c.hp-=imp*.9;c.hurtBy=true;G.camState.shake=Math.min(1,imp*.08);G.burst(450,.25,Math.min(.4,imp*.04));}}
 c.hitT2-=dt;
 if(!onCar&&!G.indoor&&Math.hypot(me.x-c.x,me.z-c.z)<2&&Math.abs(c.vf)>4&&c.hitT<=0){c.hitT=.9;hurtMe(14);}
 if(c.hp<=0){if(c.hurtBy)G.crime(Math.min(5,WD.stars+1));G.toast('Police gaari tabah!',1500);removeCop(c);}
 c.mk.x=c.x;c.mk.z=c.z;}
function busted(){if(WD.busting||dying.v)return;WD.busting=true;const fine=Math.min(SV.money,150+Math.floor(SV.money*.1));
 G.fade(()=>{G.addMoney(-fine);clearCops();setWanted(0);G.cancelAll();if(M.active)G.finishMission(false,'Police ne pakad liya');G.teleportCar('police');WD.busting=false;G.toast('BUSTED! Jurmana Rs '+fine,3400);setTimeout(()=>G.event('busted',null,true),700);},500);}
function wasted(){if(dying.v)return;dying.v=true;
 G.fade(()=>{const fine=Math.min(SV.money,100+Math.floor(SV.money*.05));G.addMoney(-fine);clearCops();setWanted(0);G.cancelAll();if(M.active)G.finishMission(false,'Saras behosh ho gayi');
  if(G.indoor)G.exitHome();me.hp=70;G.teleportCar('hospital');dying.v=false;G.toast('WASTED! Hospital ka bill Rs '+fine,3400);setTimeout(()=>G.event('wasted',null,true),700);},700);}
function policeLogic(dt){
 if(WD.stars===0){for(const c of cops.slice()){c.away+=dt;const f=G.focusPos();if(c.away>14||Math.hypot(c.x-f.x,c.z-f.z)>170)removeCop(c);else copStep(c,dt);}return;}
 const want=Math.min(6,1+WD.stars);WD.spawnT-=dt;if(!G.indoor&&cops.length<want&&WD.spawnT<=0){spawnCop();WD.spawnT=3.2;}
 let nearest=1e9;for(const c of cops){c.away=0;copStep(c,dt);nearest=Math.min(nearest,Math.hypot(c.x-G.focusPos().x,c.z-G.focusPos().z));}
 for(let a=0;a<cops.length;a++)for(let b=a+1;b<cops.length;b++){const p=cops[a],q=cops[b],dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<3.4&&d>.01){const o=(3.4-d)/2;p.x-=dx/d*o;p.z-=dz/d*o;q.x+=dx/d*o;q.z+=dz/d*o;}}
 /* lose the cops */
 const seen=nearest<55&&!G.indoor;WD.lost=seen?Math.max(0,WD.lost-dt):WD.lost+dt*(G.indoor?3:1);
 if(WD.lost>14){WD.lost=0;setWanted(WD.stars-1);G.toast(WD.stars?'Wanted kam hua':'Police se bach gaye! 🎉',1800);if(!WD.stars)G.event('lose_cops',null,true);}
 /* arrest */
 const catchD=G.mode==='car'?(Math.abs(car.vf)<4.5?7:0):4.6;WD.bust=(nearest<catchD&&!G.indoor)?WD.bust+dt:Math.max(0,WD.bust-dt*2);if(WD.bust>3){WD.bust=0;busted();}
 /* siren + flash */
 WD.flashT-=dt;if(WD.flashT<=0){WD.flashT=.22;WD.fl=!WD.fl;for(const c of cops){c.bm[0].color.set(WD.fl?'#ff2020':'#3a0a0a');c.bm[1].color.set(WD.fl?'#0a1a3a':'#2060ff');}}
 WD.sirenT-=dt;if(WD.sirenT<=0&&nearest<130){WD.sirenT=.45;WD.sw=!WD.sw;G.tone(WD.sw?760:960,.4,Math.max(.01,.05-nearest*.0003),'sawtooth');}}

/* ───────── thugs, combat ───────── */
const thugs=[],thugGroup=new T.Group();scene.add(thugGroup);
function spawnThug(x,z,boss){const p=G.buildPerson(boss?'#8b1a1a':'#1f2937',boss?'#222':'#374151','#d9a47f','#111',boss?1.28:1);thugGroup.add(p.mesh);
 Object.assign(p,{x,z,h:rnd(-PI,PI),hp:boss?170:45,boss:!!boss,state:'idle',cd:0,down:0,dead:false,dmg:boss?12:7,sp:boss?4.6:4,armT:0});G.placePerson(p);thugs.push(p);return p;}
function thugHit(p,dmg){if(p.dead)return;p.hp-=dmg;p.state='chase';G.burst(600,.1,.25);if(p.hp<=0){p.dead=true;p.down=0;p.mesh.rotation.x=-1.5;p.mesh.position.y=.15;G.tone(200,.2,.05,'sine',80);}}
function thugStep(p,dt){if(p.dead){p.down+=dt;if(p.down>8){thugGroup.remove(p.mesh);const i=thugs.indexOf(p);if(i>=0)thugs.splice(i,1);}return;}
 p.cd-=dt;const f=G.mode==='foot'?me:car,dx=f.x-p.x,dz=f.z-p.z,d=Math.hypot(dx,dz);
 if(G.indoor){G.placePerson(p);return;}
 if(p.state==='idle'&&d<(p.aggro||26))p.state='chase';
 if(p.state==='chase'){p.h+=clamp(wrapA(Math.atan2(dx,dz)-p.h),-5*dt,5*dt);
  if(d>1.5){const r=G.resolve(p.x+Math.sin(p.h)*p.sp*dt,p.z+Math.cos(p.h)*p.sp*dt,.42);p.x=r.x;p.z=r.z;G.animPerson(p,p.sp,dt);}
  else{G.animPerson(p,0,dt);if(p.cd<=0&&G.mode==='foot'){p.cd=1.1;p.armT=.25;hurtMe(p.dmg);}}
  if(G.mode==='car'&&Math.abs(car.vf)>5&&d<2.2){thugHit(p,60+Math.abs(car.vf)*2);G.crime(1);}}
 if(p.armT>0){p.armT-=dt;p.armR.rotation.x=-1.6;}G.placePerson(p);}
const tracers=[];
function tracer(x0,z0,x1,z1){const g=new T.BufferGeometry().setFromPoints([new T.Vector3(x0,1.3,z0),new T.Vector3(x1,1.3,z1)]),l=new T.Line(g,new T.LineBasicMaterial({color:0xffe08a}));l.frustumCulled=false;scene.add(l);tracers.push({l,t:.07});}
function attack(){if(G.indoor||G.mode!=='foot'){G.toast('Pehle gaari se utro (🚪)');return;}if(atkCD>0)return;const fx=Math.sin(me.h),fz=Math.cos(me.h),lv=G.level();
 if(weapon==='fists'){atkCD=.45;me.atk=.22;let hit=false;
  for(const t of thugs){if(t.dead)continue;const dx=t.x-me.x,dz=t.z-me.z,d=Math.hypot(dx,dz);if(d<2.4&&(dx*fx+dz*fz)/(d||1)>.35){thugHit(t,20+lv*1.5);t.x+=fx*.7;t.z+=fz*.7;hit=true;}}
  for(const p of G.peds){if(p.down>0)continue;const dx=p.x-me.x,dz=p.z-me.z,d=Math.hypot(dx,dz);if(d<2.3&&(dx*fx+dz*fz)/(d||1)>.35){G.knockPed(p);G.crime(1);hit=true;}}
  for(const c of cops){const dx=c.x-me.x,dz=c.z-me.z;if(Math.hypot(dx,dz)<3){c.hp-=4;c.hurtBy=true;G.crime(Math.min(5,WD.stars+1));hit=true;}}
  G.burst(hit?500:900,.08,hit?.3:.08);return;}
 if(SV.ammo<=0){G.toast('Goliyan khatam — "goliyan kharido" bolo (Rs 100)');return;}
 SV.ammo--;atkCD=.3;me.atk=.15;G.vib(35);G.statHud();
 let best=null,ba=.5;const cand=[];for(const t of thugs)if(!t.dead)cand.push({o:t,k:'t'});for(const p of G.peds)if(p.down<=0)cand.push({o:p,k:'p'});for(const c of cops)cand.push({o:c,k:'c'});
 for(const q of cand){const dx=q.o.x-me.x,dz=q.o.z-me.z,d=Math.hypot(dx,dz);if(d>42)continue;const a=Math.abs(wrapA(Math.atan2(dx,dz)-me.h));if(a<ba){ba=a;best=q;}}
 let dist=40;if(best){me.h=Math.atan2(best.o.x-me.x,best.o.z-me.z);dist=Math.hypot(best.o.x-me.x,best.o.z-me.z);
  if(best.k==='t')thugHit(best.o,28+lv);else if(best.k==='p'){G.knockPed(best.o);G.crime(2);}else{best.o.hp-=30;best.o.hurtBy=true;G.crime(Math.min(5,WD.stars+2));}}
 const ex=Math.sin(me.h),ez=Math.cos(me.h);tracer(me.x+ex*.5,me.z+ez*.5,me.x+ex*dist,me.z+ez*dist);G.tone(190,.12,.1,'sawtooth',60);G.burst(1800,.07,.2);}
function setWeapon(w){if(w==='pistol'&&!SV.pistol){if(SV.money>=300){G.addMoney(-300);SV.pistol=true;SV.ammo+=24;G.saveGame();G.toast('Pistol khareed liya (Rs 300)',2200);}else{G.toast('Pistol Rs 300 ka hai — paise kam hain',2200);return;}}
 weapon=w;btnAtk.textContent=w==='pistol'?'🔫':'👊';G.statHud();G.toast(w==='pistol'?'Pistol nikal liya':'Haath (fists)',1000);}
function buyAmmo(){if(SV.money<100){G.toast('Goliyan Rs 100 ki hain — paise kam hain');return;}if(!SV.pistol){G.toast('Pehle pistol lo');return;}G.addMoney(-100);SV.ammo+=24;G.saveGame();G.statHud();G.toast('+24 goliyan',1400);}

/* ───────── garage ───────── */
const CAR_PRICE={sedan:0,hatch:800,suv:2500,sports:6000},CAR_SPEC={sedan:{maxV:42,acc:1},hatch:{maxV:40,acc:1.05},suv:{maxV:38,acc:.95},sports:{maxV:50,acc:1.25}};
const COLORS={red:'#c9372c',blue:'#2457c5',black:'#15171a',white:'#ececec',silver:'#aeb4ba',green:'#2e8a4f',yellow:'#e6b422',orange:'#e3792b',purple:'#7a3fb3',pink:'#e66fa8',grey:'#6b7279',gray:'#6b7279'};
function applyCar(shape,color){const nc=G.buildCar(color,{shape});scene.remove(car.mesh);for(const k of['mesh','body','fw','rw','spin','head','tail','spots','paint','shape'])car[k]=nc[k];
 scene.add(car.mesh);car.mesh.visible=!G.indoor;Object.assign(car,CAR_SPEC[shape]);car.lightsOn=false;}
function changeCar(model,color){const l=lm(SV.home),f=G.focusPos();if(!G.indoor&&Math.hypot(f.x-l.x,f.z-l.z)>46){G.toast('Garage ghar par hai — pehle ghar jao');return;}
 let shape=SV.car.shape,col=SV.car.color;
 if(model&&CAR_PRICE[model]!=null&&model!==shape){if(!SV.car.owned.includes(model)){if(SV.money<CAR_PRICE[model]){G.toast(model+' ka daam Rs '+CAR_PRICE[model]+' — paise kam hain',2600);return;}G.addMoney(-CAR_PRICE[model]);SV.car.owned.push(model);}shape=model;}
 if(color){const c=COLORS[String(color).toLowerCase()]||(/^#[0-9a-f]{6}$/i.test(color)?color:null);if(c)col=c;}
 SV.car.shape=shape;SV.car.color=col;G.saveGame();applyCar(shape,col);G.toast('Gaari: '+shape,1800);}

/* ───────── radio ───────── */
const RAD={on:false,st:0,t:0,step:0},SCALES=[[0,3,5,7,10,12],[0,2,4,7,9,12],[0,2,3,7,8,12]],BPM=[104,120,92],BASE=[110,98,123],NAMES=['Saras FM','City Beats','Chill 92'];
function radio(state){if(state==='off')RAD.on=false;else if(state==='next'){if(!RAD.on)RAD.on=true;else RAD.st=(RAD.st+1)%3;}else RAD.on=true;G.initAudio();G.toast(RAD.on?'📻 '+NAMES[RAD.st]:'📻 Radio band',1400);}
function radioTick(dt){if(!RAD.on||!G.audioCtx())return;RAD.t-=dt;if(RAD.t>0)return;const sc=SCALES[RAD.st];RAD.t=60/BPM[RAD.st]/2;RAD.step++;const b=BASE[RAD.st],n=sc[(RAD.step*3+(RAD.step>>3))%sc.length];
 G.tone(b*Math.pow(2,n/12)*(RAD.step%16<8?1:1.5),.22,.016,'triangle');if(RAD.step%4===0)G.tone(b/2,.28,.035,'sine');if(RAD.step%2===1)G.burst(7000,.04,.015,'highpass');
 if(RAD.step%8===0)G.tone(b*Math.pow(2,sc[(RAD.step/8|0)%sc.length]/12)*2,.4,.01,'square');}

/* ───────── new step types ───────── */
const sidewalkOf=l=>({x:l.stop.x,z:l.stop.z-9.5});
ST.kill={start(s,st){const l=lm(st.lm),o=sidewalkOf(l);s.list=[];for(let k=0;k<(st.n||5);k++)s.list.push(spawnThug(o.x-7+k*3.2,o.z-(k%2)*2.2-1,false));if(st.boss)s.list.push(spawnThug(o.x,o.z-5,true));
  if(!SV.pistol){SV.pistol=true;SV.ammo=Math.max(SV.ammo,24);G.toast('Pistol mil gaya! (Q / 🔄 se badlo)',2800);}
  s.bc=G.beacon(l.stop.x,l.stop.z,'#ff4d4d',130,2.4);s.mk={id:'obj',x:l.stop.x,z:l.stop.z,color:'#ff4d4d',big:1};G.markers.push(s.mk);s.alive=s.list.length;},
 update(s){s.alive=s.list.filter(t=>!t.dead).length;return s.alive===0?'done':null;},
 end(s){if(s.bc)s.bc.parent.remove(s.bc);const i=G.markers.indexOf(s.mk);if(i>=0)G.markers.splice(i,1);for(const t of s.list||[]){thugGroup.remove(t.mesh);const k=thugs.indexOf(t);if(k>=0)thugs.splice(k,1);}}};
const extraCircles=[];G.circleProviders.push(()=>extraCircles);
ST.chase={start(s,st){const l=lm(st.lm),t=G.buildCar('#e8e8e8',{shape:'hatch',lights:false}),dirs=[[1,0],[0,1],[-1,0],[0,-1]];scene.add(t.mesh);
  Object.assign(t,{npc:true,vmax:st.speed||21,v:0,stuck:0,ghost:0,noBlock:true,d:0,to:[l.bx+1,l.bz+1],x:l.stop.x,z:l.stop.z-3.8,h:PI/2});
  t.choose=(n,opts)=>{const f=G.focusPos();let best=opts[0],bd=-1;for(const k of opts){const d=Math.hypot(roadC(n.to[0]+dirs[k][0])-f.x,roadC(n.to[1]+dirs[k][1])-f.z)+rnd(0,40);if(d>bd){bd=d;best=k;}}return best;};
  s.t=t;s.near=0;s.far=0;s.caught=false;s.mk={id:'thief',x:t.x,z:t.z,color:'#ef4444',big:1};G.markers.push(s.mk);G.toast('Chor ko pakdo — uski gaari ke paas raho!',2600);},
 update(s,st,dt){const t=s.t;if(!s.caught)G.npcStep(t,dt);else{t.v=0;G.syncCarMesh(t,dt);}
  extraCircles.length=0;extraCircles.push({x:t.x,z:t.z,r:1.9,self:t});s.mk.x=t.x;s.mk.z=t.z;const d=Math.hypot(car.x-t.x,car.z-t.z);
  if(G.mode==='car'&&d<13)s.near+=dt;else s.near=Math.max(0,s.near-dt*.6);s.far=d>190?s.far+dt:0;
  if(s.near>4.5){s.caught=true;G.toast('Chor pakda gaya! 🚔',2200);return'done';}if(s.far>8){s.why='chor bhaag gaya';return'fail';}return null;},
 end(s){scene.remove(s.t.mesh);extraCircles.length=0;const i=G.markers.indexOf(s.mk);if(i>=0)G.markers.splice(i,1);}};
ST.evade={start(){setWanted(Math.max(WD.stars,3));G.toast('Police peechay hai! ⭐',2200);},update(){return WD.stars===0?'done':null;},end(){}};
ST.race={start(s,st){s.k=0;s.t0=3.2;s.riv=[];s.pts=st.cps.map(q=>({x:roadC(q[0]),z:roadC(q[1])}));
  const hc=Math.round(car.h/(PI/2))*(PI/2),fx=Math.sin(hc),fz=Math.cos(hc);
  for(let k=0;k<3;k++){const c=G.buildCar(pick(['#2a62d0','#e0b020','#2aa86a','#9b30d0']),{shape:pick(['sports','sedan','hatch']),lights:false});c.maxV=35+k*1.5;c.acc=1.1;c.x=car.x-fx*(8+k*8);c.z=car.z-fz*(8+k*8);c.h=hc;c.vx=c.vz=c.vf=c.vl=0;c.steer=0;c.rk=0;c.pts=[];c.idx=0;c.stuck=0;c.rev=0;c.fin=false;scene.add(c.mesh);s.riv.push(c);}
  s.mk={id:'obj',x:s.pts[0].x,z:s.pts[0].z,color:'#ffd23f',big:1};G.markers.push(s.mk);s.bc=G.beacon(s.pts[0].x,s.pts[0].z,'#ffd23f',130,2.4);G.M.s=s;},
 update(s,st,dt){s.t0-=dt;if(s.t0>0){G.toast('Race shuru: '+Math.ceil(s.t0),400);return null;}
  for(const c of s.riv){if(c.fin)continue;const p=s.pts[c.rk];if(!c.pts.length||c.newT){c.pts=G.route(c.x,c.z,c.h,p.x,p.z,2.6).pts;c.idx=0;c.newT=false;}
   driveAI(c,c.pts,c.maxV*.82,12,dt);if(Math.hypot(c.x-p.x,c.z-p.z)<17){c.rk++;c.newT=true;if(c.rk>=s.pts.length){c.fin=true;s.why='Rival jeet gaya';return'fail';}}}
  const f=G.focusPos(),p=s.pts[s.k];if(G.mode==='car'&&Math.hypot(f.x-p.x,f.z-p.z)<17){s.k++;G.tone(880,.1,.06,'triangle');if(s.k>=s.pts.length)return'done';const q=s.pts[s.k];s.mk.x=q.x;s.mk.z=q.z;s.bc.position.set(q.x,65,q.z);}
  return null;},
 end(s){for(const c of s.riv||[])scene.remove(c.mesh);if(s.bc)s.bc.parent.remove(s.bc);const i=G.markers.indexOf(s.mk);if(i>=0)G.markers.splice(i,1);}};
const HI3={m5:'स्टेडियम के पास गुंडे लोगों को तंग कर रहे हैं। गाड़ी से उतरो और उन्हें सबक सिखाओ!',m6:'एक चोर मॉल से गाड़ी लेकर भाग रहा है। पीछा करो और उसके पास रहो!',m7:'तुम पकड़े जाने वाले हो! पुलिस पीछे है, पहले घर पहुँचो, फिर सितारे ख़त्म करो।',m8:'तीन प्रतिद्वंद्वी, छह चेकपॉइंट। सबसे पहले पहुँचो!',m9:'शहर का सबसे बड़ा डॉन मॉल के पास अपने गुंडों के साथ है। यह आख़िरी लड़ाई है!'};
const raceCps=[[5,3],[6,5],[4,6],[2,5],[1,3],[3,2]];
G.missions.push(
 {id:'m5',title:'Gunde Bhagao',giver:'park',time:270,intro:'Stadium ke paas gunde logon ko tang kar rahe hain. Gaari se utro aur unhe sabaq sikhao!',steps:[{type:'kill',lm:'stadium',n:5,text:'Stadium ke gundon ko haraao (F = maro)'}],reward:{money:1300,xp:180},extraHud:()=>'<small>Dushman bache: '+((M.s&&M.s.alive)!=null?M.s.alive:'?')+'</small>'},
 {id:'m6',title:'Chor Ka Peecha',giver:'police',time:180,needCar:true,intro:'Ek chor Mall se gaari le kar bhaag raha hai. Peecha karo aur uske paas raho!',steps:[{type:'chase',lm:'mall',speed:21,text:'Chor ki gaari ke 13m ke andar raho (laal marker)'}],reward:{money:1800,xp:200}},
 {id:'m7',title:'Police Se Bacho',giver:'hospital',time:240,needCar:true,intro:'Tum pakde jane wale ho! Police peechay hai — pehle ghar pahuncho, phir ⭐ khatam karo.',onStart:()=>setWanted(3),steps:[{type:'goto',lm:'home',veh:'car',radius:16,text:'Police se bachte hue Ghar pahuncho'},{type:'evade',text:'Police se chhupo (ghar mein ja kar bhi bach sakte ho)'}],reward:{money:2200,xp:240}},
 {id:'m8',title:'Street Race',giver:'mall',time:200,needCar:true,intro:'3 rivals, 6 checkpoints. Sabse pehle pahuncho — ya haaro!',steps:[{type:'race',cps:raceCps,text:'Race: checkpoints pakdo (pehle pahuncho)'}],reward:{money:2800,xp:300},extraHud:()=>'<small>Checkpoint '+Math.min(6,((M.s&&M.s.k)||0)+1)+'/6</small>'},
 {id:'m9',title:'Bada Don',giver:'stadium',time:330,intro:'Shehar ka sabse bada don Mall ke paas apne gundon ke saath hai. Ye aakhri ladai hai!',steps:[{type:'kill',lm:'mall',n:4,boss:true,text:'Mall ke Don aur uske gunde khatam karo'}],reward:{money:5000,xp:500},extraHud:()=>'<small>Dushman bache: '+((M.s&&M.s.alive)!=null?M.s.alive:'?')+'</small>'});

G.missions.forEach(d=>{if(HI3[d.id])d.hi=HI3[d.id];});
/* ───────── per-frame ───────── */
const hookPrev=G.extraBlock;
G.hooks.update.push(dt=>{
 atkCD-=dt;repCD-=dt;healCD-=dt;
 if(me.atk>0){me.atk-=dt;me.armR.rotation.x=-1.7;}
 policeLogic(dt);for(const t of thugs.slice())thugStep(t,dt);radioTick(dt);
 for(let i=tracers.length-1;i>=0;i--){tracers[i].t-=dt;if(tracers[i].t<=0){scene.remove(tracers[i].l);tracers.splice(i,1);}}
 hurtT-=dt;if(hurtT<=0&&me.hp<100&&!dying.v)me.hp=Math.min(100,me.hp+dt*1.5);
 if(G.mode==='car'&&car.hp<=0)car.maxV=20;else if(car.hp>0&&car.maxV<CAR_SPEC[car.shape].maxV)Object.assign(car,CAR_SPEC[car.shape]);
 if(!G.indoor){const pl=lm('petrol').stop,hs=lm('hospital').stop;
  if(G.mode==='car'&&repCD<=0&&car.hp<99&&Math.hypot(car.x-pl.x,car.z-pl.z)<14&&Math.abs(car.vf)<3){const cost=Math.min(SV.money,Math.ceil((100-car.hp)*3));car.hp=100;G.addMoney(-cost);repCD=6;G.toast('Gaari repair ho gayi (-Rs '+cost+') 🔧',2200);G.tone(660,.12,.05,'triangle');}
  const f=G.focusPos();if(healCD<=0&&me.hp<99&&Math.hypot(f.x-hs.x,f.z-hs.z)<16){const cost=Math.min(SV.money,60);me.hp=100;G.addMoney(-cost);healCD=8;G.toast('Hospital: health full (-Rs '+cost+') ❤',2200);}}});

/* ───────── actions, buttons, prompt ───────── */
A.attack=inst(()=>attack(),'attack');A.weapon=inst(a=>setWeapon(a.type==='pistol'?'pistol':'fists'),'weapon');A.buy_ammo=inst(()=>buyAmmo(),'buy_ammo');
A.radio=inst(a=>radio(a.state||'on'),'radio');A.repair=a=>A.goto({place:'petrol'});A.change_car=inst(a=>changeCar(a.model,a.color),'change_car');
G.promptExtras.push(`STAGE 3 ACTIONS:
{"a":"attack"} punch (fists) or fire (pistol) at the nearest enemy in front — only ON FOOT (exit the car first). {"a":"weapon","type":"fists|pistol"} (pistol costs Rs 300 once) / {"a":"buy_ammo"} (Rs 100 for 24 bullets).
{"a":"radio","state":"on|off|next"} / {"a":"repair"} drives/walks to the Petrol Pump where the car is repaired automatically for money.
{"a":"change_car","model":"sedan|hatch|suv|sports","color":"red|blue|black|white|silver|green|yellow|orange|purple|pink"} only near home (hatch Rs 800, suv Rs 2500, sports Rs 6000, recolouring is free).
POLICE: crimes (hitting pedestrians, crashing into traffic, attacking people/police) raise wanted stars; cops chase. To escape: drive away out of sight for ~15s, or hide inside the home. If stars>0 and the player asks for help, give short practical advice and/or drive away (speed 80+, turns). BUSTED = fine, WASTED = hospital bill.
Missions now include fights (Gunde Bhagao, Bada Don: get out of the car and punch/shoot), a chase (Chor Ka Peecha), evading police and a street race.`);
G.stateExtras.push(()=>({wanted_stars:WD.stars,weapon,pistol_owned:SV.pistol,ammo:SV.ammo,saras_health:Math.round(me.hp),car_health:Math.round(car.hp),car_model:SV.car.shape,
 enemies_near:thugs.filter(t=>!t.dead&&Math.hypot(t.x-G.focusPos().x,t.z-G.focusPos().z)<45).length,cops_near:cops.filter(c=>Math.hypot(c.x-G.focusPos().x,c.z-G.focusPos().z)<90).length,radio:RAD.on?NAMES[RAD.st]:'off'}));
let btnAtk=null;
G.hooks.ready.push(()=>{const xb=$('xbtns'),mk=(l,fn,t)=>{const b=document.createElement('button');b.className='cb sm';b.textContent=l;b.setAttribute('aria-label',t);b.addEventListener('click',fn);xb.appendChild(b);return b;};
 btnAtk=mk('👊',attack,'Attack');mk('🔄',()=>setWeapon(weapon==='fists'?'pistol':'fists'),'Weapon');mk('📻',()=>radio('next'),'Radio');
 window.addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();if(k==='f')attack();else if(k==='q')setWeapon(weapon==='fists'?'pistol':'fists');else if(k==='b')radio('next');});
 if(SV.car.shape!=='sedan'||SV.car.color!=='#c9372c')applyCar(SV.car.shape,SV.car.color);G.statHud();});
})();
