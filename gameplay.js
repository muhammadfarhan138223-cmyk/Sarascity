/* SARAS CITY — gameplay.js  (Vice-City style)
   • The game starts with Saras standing on the street in front of her home (not inside the car).
   • You can get into ANY vehicle: walk up to a car / rickshaw / bike / truck (stand in front to stop it) and press 🚪
     — the driver is pulled out and runs away. The car you were driving stays parked where you left it
     and you can walk back to it and take it again.
   • Traffic vehicles now show a driver inside.
   Needs stage2.js (on-foot mode). */
(function(){
'use strict';
const G=window.G;if(!G||!G.T||!G.me||!G.toFoot||!G.enterCar)return;
const T=G.T,car=G.car,me=G.me,scene=G.scene,PI=Math.PI,LM=G.landmarks,SHAPES=G.SHAPES||{},pick=G.pick;
const parked=G.parked=[],pcirc=[],fleers=[];
const SPEC={rickshaw:{maxV:24,acc:.8},truck:{maxV:30,acc:.6},bike:{maxV:38,acc:1.1},sedan:{maxV:42,acc:1},hatch:{maxV:40,acc:1.05},suv:{maxV:38,acc:.95},sports:{maxV:50,acc:1.25}};
const KEYS=['mesh','body','fw','rw','spin','head','tail','spots','paint','shape','setLights','half','cr','hp','lightsOn'];
G.circleProviders.push(()=>pcirc);
const prevBlock=G.extraBlock;
G.extraBlock=(n,chk)=>{for(const p of parked)if(chk(p.x,p.z))return true;return prevBlock?prevBlock(n,chk):false;};
function rebuild(){pcirc.length=0;for(const p of parked){const hf=p.half||1.2,fx=Math.sin(p.h)*hf,fz=Math.cos(p.h)*hf;pcirc.push({x:p.x+fx,z:p.z+fz,r:p.cr||1.1,self:p},{x:p.x-fx,z:p.z-fz,r:p.cr||1.1,self:p});}}

/* ───────── drivers inside traffic vehicles ───────── */
const torsoG=new T.BoxGeometry(.42,.5,.26),headG=new T.SphereGeometry(.17,8,6);
const SHIRTS=['#f1efe6','#cfd8dc','#8b7a5c','#1f3b5c','#2e5a45','#5a2a2a'],SEAT={rickshaw:[0,1.22,.25],truck:[-.55,2.4,2.9]};
function addDriver(c){if(c.driver||c.shape==='bike')return;let p=SEAT[c.shape];if(!p){const sp=SHAPES[c.shape];if(!sp)return;p=[-.42,.3+sp.bh+.06,sp.cz+.2];}
 const g=new T.Group(),t=new T.Mesh(torsoG,new T.MeshLambertMaterial({color:pick(SHIRTS)})),h=new T.Mesh(headG,new T.MeshLambertMaterial({color:pick(['#c68a5e','#d9a47f','#8d5524'])}));
 t.position.y=.25;h.position.y=.62;g.add(t,h);g.position.set(p[0],p[1],p[2]);(c.body||c.mesh).add(g);c.driver=g;}

/* ───────── pulled-out driver runs away ───────── */
function eject(v){if(!G.buildPerson)return;const p=G.buildPerson('#c0392b','#2d3748','#d9a47f','#111',1);scene.add(p.mesh);
 const lx=-Math.cos(v.h),lz=Math.sin(v.h);p.x=v.x+lx*2.2;p.z=v.z+lz*2.2;p.h=Math.atan2(lx,lz);p.t=0;G.placePerson(p);fleers.push(p);}

/* ───────── swap into any vehicle ───────── */
function nearest(){let best=null;const consider=(v,list)=>{const d=Math.hypot(me.x-v.x,me.z-v.z)-(v.half||1.2);if(d<3.4&&(!best||d<best.d))best={v,list,d};};
 for(const n of G.npcs)consider(n,'npc');for(const p of parked)consider(p,'parked');return best;}
function swapInto(e){const v=e.v,prev={};
 for(const k of KEYS)prev[k]=car[k];prev.maxV=car.maxV;prev.acc=car.acc;prev.x=car.x;prev.z=car.z;prev.h=car.h;prev.vx=prev.vz=prev.vf=prev.vl=0;prev.steer=0;
 try{if(prev.setLights)prev.setLights(false);}catch(x){}(prev.spots||[]).forEach(s=>{s.visible=false;});
 parked.push(prev);
 if(e.list==='npc'){const i=G.npcs.indexOf(v);if(i>=0)G.npcs.splice(i,1);}else{const i=parked.indexOf(v);if(i>=0)parked.splice(i,1);}
 rebuild();
 let had=false;if(v.driver){had=true;const d=v.driver;if(d.parent)d.parent.remove(d);v.driver=null;eject(v);}
 for(const k of KEYS)car[k]=v[k];const sp=SPEC[v.shape]||SPEC.sedan;car.maxV=v.maxV||sp.maxV;car.acc=v.acc||sp.acc;car._nb=null;
 car.x=v.x;car.z=v.z;car.h=v.h;car.vx=car.vz=car.vf=car.vl=0;car.steer=0;car.thr=0;car.brake=false;car.spinA=v.spinA||0;
 (car.spots||[]).forEach(s=>{s.visible=true;});scene.add(car.mesh);car.mesh.visible=true;
 G.toCar();G.snapCam();G.toast(had?'Gaari le li — driver bhaag gaya! 🚗':'Gaari mein baith gaye 🚗',1800);if(G.vib)G.vib(had?[40,30,40]:30);}
const origEnter=G.enterCar;
G.enterCar=function(){if(G.mode!=='foot'||G.indoor)return false;
 const dCar=Math.hypot(me.x-car.x,me.z-car.z)-(car.half||1.2),b=nearest();
 if(dCar<=3.4&&(!b||dCar<=b.d))return origEnter();
 if(b){swapInto(b);return true;}
 if(dCar<=6)return origEnter();
 G.toast('Koi gaari paas nahi — kisi gaari ke qareeb jao aur 🚪 dabao',2400);return false;};

/* ───────── frame + start ───────── */
G.hooks.update.push(dt=>{for(let i=fleers.length-1;i>=0;i--){const p=fleers[i];p.t+=dt;if(p.t<5){p.x+=Math.sin(p.h)*5*dt;p.z+=Math.cos(p.h)*5*dt;G.animPerson(p,5,dt);G.placePerson(p);}
 if(p.t>7){scene.remove(p.mesh);fleers.splice(i,1);}}});
G.promptExtras.push('GETTING INTO VEHICLES: the player can enter ANY vehicle (cars, rickshaws, bikes, trucks): {"a":"enter_car"} on foot gets into the nearest vehicle within ~3 m (the driver is pulled out). To stop a moving vehicle the player can stand in front of it. If no vehicle is near, first {"a":"goto","place":"car"} (the last car they drove) then enter_car.');
G.hooks.ready.push(()=>{for(const n of G.npcs)addDriver(n);
 const l=LM.find(x=>x.id===(G.save&&G.save.home))||LM[0];
 car.x=l.stop.x;car.z=l.stop.z-3.8;car.h=PI/2;car.vx=car.vz=car.vf=car.vl=0;car.steer=0;
 G.toFoot(l.door.x,l.door.z+4,0);G.snapCam();
 if(G.$('stagetag'))G.$('stagetag').textContent+=' + Gameplay';});
})();
