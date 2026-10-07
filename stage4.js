/* SARAS CITY — stage4.js  (Realism pack)
   1) Real .glb models: put car_sedan.glb, car_sports.glb, car_suv.glb, car_hatch.glb, person.glb
      next to index.html — they are picked up automatically (missing files = procedural model stays).
   2) Code-made realism: sky reflections on paint/glass (PBR + clearcoat), mirrors, grille, plates, rims,
      door seams, spoiler, bump-mapped buildings/roads, textured ground, headlight beams, wet-road reflections.
   Works on top of core.js (stage2/3 optional). Edit models.json to fix model size / direction. */
(function(){
'use strict';
const G=window.G;if(!G||!G.T||!G.skyU)return;
const T=G.T,scene=G.scene,renderer=G.renderer,PI=Math.PI,S=G.S,car=G.car;
G.realism=true;
const Q=S.quality==='low'?0:S.quality==='med'?1:2;
const MODELS={
 sedan:{file:'car_sedan.glb',len:4.5},sports:{file:'car_sports.glb',len:4.5},suv:{file:'car_suv.glb',len:4.8},hatch:{file:'car_hatch.glb',len:3.9},
 person:{file:'person.glb',height:1.8}};
/* optional per-model fixes (models.json):  flip:true -> model faces backwards, rot:radians, len:metres, y:lift, paint:"regex of body material name", envI:reflection strength */

/* ───────── sky environment (reflections) ───────── */
let pmrem=null,envScene=null,envUni=null,sunDisc=null,envMats=[];G.env=null;G.envRT=null;
try{
 if(Q===0)throw new Error('low quality: reflections off');
 pmrem=new T.PMREMGenerator(renderer);envScene=new T.Scene();
 envUni={top:{value:new T.Color('#2e7ed6')},bot:{value:new T.Color('#cfe8fb')}};
 envScene.add(new T.Mesh(new T.SphereGeometry(80,24,12),new T.ShaderMaterial({uniforms:envUni,side:T.BackSide,depthWrite:false,
  vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bot;varying float h;void main(){float t=pow(clamp(h,0.0,1.0),0.5);vec3 c=mix(bot,top,t);if(h<0.0)c=bot*0.45;gl_FragColor=vec4(c,1.0);}'})));
 sunDisc=new T.Mesh(new T.SphereGeometry(7,12,8),new T.MeshBasicMaterial({color:'#fff4d8'}));envScene.add(sunDisc);
}catch(e){console.warn('env map unavailable',e);pmrem=null;}
function refreshEnv(){if(!pmrem)return;try{
 envUni.top.value.copy(G.skyU.top.value);envUni.bot.value.copy(G.skyU.bot.value);
 const sl=G.sunLight;const dx=sl.position.x-sl.target.position.x,dy=sl.position.y,dz=sl.position.z-sl.target.position.z,l=Math.hypot(dx,dy,dz)||1;
 sunDisc.position.set(dx/l*65,dy/l*65,dz/l*65);sunDisc.visible=sl.intensity>.25&&dy>0;sunDisc.material.color.copy(sl.color);
 const rt=pmrem.fromScene(envScene,.02),old=G.envRT;G.envRT=rt;G.env=rt.texture;
 for(const m of envMats){const first=!m.envMap;m.envMap=G.env;if(first)m.needsUpdate=true;}
 for(const m of G.roadMats||[]){const first=!m.envMap;m.envMap=G.env;if(first)m.needsUpdate=true;}
 if(old)old.dispose();}catch(e){console.warn('env refresh failed',e);pmrem=null;}}
refreshEnv();

/* ───────── procedural car upgrades ───────── */
const cars=[];
const plateTex=G.ctex(128,32,g=>{g.fillStyle='#f4f4ee';g.fillRect(0,0,128,32);g.fillStyle='#1a1a1a';g.font='bold 21px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('SARAS 786',64,17);g.strokeStyle='#1a1a1a';g.lineWidth=2;g.strokeRect(1,1,126,30);});
const plateMat=new T.MeshBasicMaterial({map:plateTex});
function upgradeMaterials(c,lite){const pm=c.paint;if(!pm||Q===0)return;
 const phys=new T.MeshPhysicalMaterial({color:pm.color.clone(),metalness:.55,roughness:.28,clearcoat:lite?0:1,clearcoatRoughness:.05,envMap:G.env||null,envMapIntensity:1.15});
 const glass=new T.MeshPhysicalMaterial({color:0x10161d,metalness:.1,roughness:.04,transparent:true,opacity:.82,envMap:G.env||null,envMapIntensity:1.4});
 c.body.traverse(o=>{if(!o.isMesh)return;if(o.material===pm)o.material=phys;else if(o.material&&o.material.transparent&&o.material.opacity<1&&o.material.shininess!==undefined&&o.material.color.getHex()===0x1b2733)o.material=glass;});
 c.paint=phys;envMats.push(phys,glass);}
function addDetails(c){const sp=G.SHAPES[c.shape]||G.SHAPES.sedan,b=c.body,dark=new T.MeshPhongMaterial({color:0x0b0d10,shininess:25}),chrome=new T.MeshPhongMaterial({color:0xcfd5dc,shininess:120,specular:0xffffff});
 const add=(w,h,d,m,x,y,z)=>{const q=new T.Mesh(new T.BoxGeometry(w,h,d),m);q.position.set(x,y,z);q.castShadow=true;b.add(q);return q;};
 for(const s of[-1,1]){add(.17,.12,.24,c.paint,s*(sp.W/2+.1),.3+sp.bh+.12,sp.cz+sp.cl/2-.12);add(.04,.06,.14,dark,s*(sp.W/2+.04),.3+sp.bh+.1,sp.cz+sp.cl/2-.12);
  for(const z of[sp.cz-sp.cl/2+.1,sp.cz+.15,sp.cz+sp.cl/2-.1])add(.012,sp.bh*.92,.018,dark,s*(sp.W/2+.003),.3+sp.bh/2+.02,z);add(.04,.04,.18,chrome,s*(sp.W/2+.01),.3+sp.bh*.62,sp.cz+.55);}
 add(sp.W*.55,.17,.06,dark,0,.52,sp.L/2+.04);for(let k=-2;k<=2;k++)add(.018,.14,.07,chrome,k*.18,.52,sp.L/2+.05);
 add(.52,.13,.02,plateMat,0,.37,sp.L/2+.14);add(.52,.13,.02,plateMat,0,.4,-sp.L/2-.14);
 add(.1,.1,.18,dark,.55,.27,-sp.L/2-.05);add(.1,.1,.18,dark,-.55,.27,-sp.L/2-.05);
 if(c.shape==='sports'){add(sp.W*.9,.05,.36,c.paint,0,.3+sp.bh+.33,-sp.L/2+.45);add(.05,.3,.05,dark,.55,.3+sp.bh+.17,-sp.L/2+.45);add(.05,.3,.05,dark,-.55,.3+sp.bh+.17,-sp.L/2+.45);}
 if(c.shape==='suv'){for(const s of[-1,1])add(.05,.05,sp.cl*.85,dark,s*(sp.W/2-.22),.3+sp.bh+sp.ch+.09,sp.cz);}
 const spoke=new T.BoxGeometry(.02,.3,.04);
 c.spin.forEach(t=>{const sx=Math.sign(t.parent.position.x)||1;for(let k=0;k<5;k++){const sk=new T.Mesh(spoke,chrome);sk.position.set(sx*.14,0,0);sk.rotation.x=k*(2*PI/5);t.add(sk);}});}
function attachModel(c){const key=c.shape,pr=loaded[key];if(!pr||c.mesh.userData.hasModel||!c.body)return;const cfg=MODELS[key]||{};
 const inst=pr.clone(true),rx=new RegExp(cfg.paint||'body|paint|carpaint|exterior','i'),col=c.paint&&c.paint.color;
 inst.traverse(o=>{if(!o.isMesh||!o.material)return;const arr=Array.isArray(o.material)?o.material:[o.material];
  const nm=arr.map(m=>{if(col&&rx.test(m.name||'')){const mm=m.clone();mm.color.copy(col);return mm;}return m;});o.material=Array.isArray(o.material)?nm:nm[0];});
 for(const q of c.body.children.slice())q.visible=false;for(const w of(c.fw||[]).concat(c.rw||[]))w.visible=false;
 c.mesh.add(inst);c.mesh.userData.hasModel=true;}
const origBuild=G.buildCar;
G.buildCar=function(color,o){const c=origBuild(color,o);finishCar(c,o&&o.lights===false);return c;};
function finishCar(c,lite){upgradeMaterials(c,lite);if(!lite&&Q>0)addDetails(c);cars.push(c);attachModel(c);}

/* ───────── real model loading (.glb) ───────── */
const loaded={};let personRoot=null,personClips=[];const loader=T.GLTFLoader?new T.GLTFLoader():null;
function normalizeCar(gltf,cfg){const root=gltf.scene,wrap=new T.Group();wrap.add(root);const v=new T.Vector3();
 let box=new T.Box3().setFromObject(wrap);box.getSize(v);let rot=cfg.rot||0;if(v.x>v.z*1.05)rot+=PI/2;if(cfg.flip)rot+=PI;root.rotation.y=rot;
 box=new T.Box3().setFromObject(wrap);box.getSize(v);root.scale.multiplyScalar((cfg.len||4.5)/Math.max(v.z,.01));
 box=new T.Box3().setFromObject(wrap);const ctr=new T.Vector3();box.getCenter(ctr);root.position.x-=ctr.x;root.position.z-=ctr.z;root.position.y-=box.min.y-(cfg.y||0);
 root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m&&m.isMeshStandardMaterial){m.envMap=G.env||null;m.envMapIntensity=cfg.envI||1;m.needsUpdate=true;envMats.push(m);}});});
 return wrap;}
function loadModels(cfgs){if(!loader){console.warn('GLTFLoader nahi mila — real models skip');return;}
 for(const key of Object.keys(MODELS)){const cfg=Object.assign(MODELS[key],cfgs&&cfgs[key]||{});MODELS[key]=cfg;
  loader.load(cfg.file,gltf=>{try{
    if(key==='person'){personRoot=gltf.scene;personClips=gltf.animations||[];setupPerson(cfg);}
    else{loaded[key]=normalizeCar(gltf,cfg);for(const c of cars)if(c.shape===key&&c.mesh.parent)attachModel(c);}
    if(G.toast)G.toast('Real model load hua: '+cfg.file,1800);console.info('model ok',cfg.file);}catch(e){console.warn('model error',cfg.file,e);}},undefined,()=>{});}}
let mixer=null,acts={},curAct=null;
function setupPerson(cfg){if(!G.me||!personRoot||G.me.mesh.userData.hasModel)return;const me=G.me,root=personRoot,v=new T.Vector3(),wrap=new T.Group();wrap.add(root);root.rotation.y=cfg.rot||0;
 let box=new T.Box3().setFromObject(wrap);box.getSize(v);root.scale.multiplyScalar((cfg.height||1.8)/Math.max(v.y,.01));
 box=new T.Box3().setFromObject(wrap);const c=new T.Vector3();box.getCenter(c);root.position.x-=c.x;root.position.z-=c.z;root.position.y-=box.min.y;
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});
 for(const ch of me.mesh.children.slice())ch.visible=false;me.mesh.add(wrap);me.mesh.userData.hasModel=true;
 if(personClips.length){mixer=new T.AnimationMixer(root);const f=re=>personClips.find(k=>re.test(k.name));
  const idle=f(/idle|stand|breath/i),walk=f(/walk/i),run=f(/run|sprint|jog/i);
  if(idle)acts.idle=mixer.clipAction(idle);if(walk)acts.walk=mixer.clipAction(walk);if(run)acts.run=mixer.clipAction(run);
  if(!acts.idle&&acts.walk)acts.idle=acts.walk;curAct=acts.idle||null;if(curAct)curAct.play();}}
function personAnim(dt){if(!mixer||G.mode!=='foot')return;const sp=G.footSpeed||0;let want=sp<.3?acts.idle:sp>5?(acts.run||acts.walk):(acts.walk||acts.idle);
 if(want&&want!==curAct){want.reset().play();if(curAct)curAct.crossFadeTo(want,.2,false);curAct=want;}
 if(curAct&&curAct===acts.walk)curAct.timeScale=Math.max(.5,sp/3.4);mixer.update(dt);}

/* ───────── world realism ───────── */
const cones=[];
function setupWorld(){
 if(Q===0)return;
 for(const m of G.bMats||[]){if(m.map){m.bumpMap=m.map;m.bumpScale=1.3;m.needsUpdate=true;}}
 for(const m of G.roadMats||[]){if(m.map){m.bumpMap=m.map;m.bumpScale=.5;m.envMap=G.env||null;m.envMapIntensity=0;m.needsUpdate=true;}}
 if(G.ground){const gt=G.ctex(256,256,g=>{g.fillStyle='#fff';g.fillRect(0,0,256,256);for(let i=0;i<2600;i++){const v=170+Math.random()*85|0;g.fillStyle='rgba('+v+','+v+','+(v-14)+','+(.18+Math.random()*.25)+')';g.fillRect(Math.random()*256,Math.random()*256,2+Math.random()*3,2+Math.random()*3);}},true);
  gt.repeat.set(260,260);G.ground.material.map=gt;G.ground.material.needsUpdate=true;}
 const geo=new T.CylinderGeometry(.3,3.6,17,16,1,true).translate(0,-8.5,0).rotateX(-PI/2);
 for(const s of[-1,1]){const m=new T.Mesh(geo,new T.MeshBasicMaterial({color:0xfff0c8,transparent:true,opacity:.075,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));m.position.set(s*.62,.8,2.2);m.visible=false;m.frustumCulled=false;cones.push(m);}}
let envT=22;
G.hooks.update.push(dt=>{envT-=dt;if(envT<=0){envT=22;refreshEnv();}
 const wet=G.W?G.W.wet:0;for(const m of G.roadMats||[])m.envMapIntensity=wet*.9;
 for(const m of cones){if(m.parent!==car.mesh)car.mesh.add(m);m.visible=!G.indoor&&G.mode==='car'&&!!car.lightsOn;}
 personAnim(dt);
 if(cars.length>80){for(let i=cars.length-1;i>=0;i--)if(!cars[i].mesh.parent&&cars[i]!==car)cars.splice(i,1);}});
G.hooks.ready.push(()=>{
 setupWorld();
 if(!cars.includes(car)){finishCar(car,false);}
 if(G.$('stagetag'))G.$('stagetag').textContent+=' + Realism';
 if(typeof fetch==='function'){fetch('models.json').then(r=>r.ok?r.json():null).catch(()=>null).then(j=>loadModels(j));}else loadModels(null);
 refreshEnv();});
})();
