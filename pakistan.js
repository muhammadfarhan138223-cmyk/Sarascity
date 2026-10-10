/* SARAS CITY — pakistan.js  (Pakistan pack)
   • Saras = your person.glb (blocky mannequin) dressed in shalwar kameez + dupatta, with code-made walk/run/punch/aim animation.
   • Everyone else: procedural people in shalwar kameez / topi / dupatta.
   • Traffic: auto-rickshaws, Honda-70 bikes with riders, truck-art trucks, Mehran-style hatchbacks.
   • City: Urdu signboards, Jinnah Masjid (dome + minarets), waving Pakistani flags, Pakistani landmark names (Urdu + Roman), Rs currency.
   Needs core.js (+ stage2 for people/traffic).  person.glb must sit next to index.html (optional). */
(function(){
'use strict';
const G=window.G;if(!G||!G.T)return;
const T=G.T,clamp=G.clamp,PI=Math.PI,pick=G.pick,rnd=G.rnd,scene=G.scene,S=G.S,LM=G.landmarks,C=G.C,roadC=C.roadC,blkC=C.blkC,blk0=C.blk0,SC=G.SC||.5;
G.pkChars=true;G.pakistan=true;
const Q=S.quality==='low'?0:S.quality==='med'?1:2;
const FONT='"Noto Nastaliq Urdu","Noto Naskh Arabic","Jameel Noori Nastaleeq","Segoe UI",Tahoma,Arial,sans-serif';
const lamb=c=>new T.MeshLambertMaterial({color:c}),phong=(c,s)=>new T.MeshPhongMaterial({color:c,shininess:s||40});
const MU=T.BufferGeometryUtils;

/* ───────── 1. Pakistani landmark names + Urdu signs ───────── */
const NAMES={hospital:['Civil Hospital','سول ہسپتال','सिविल अस्पताल'],police:['Thana','تھانہ','थाना'],bazaar:['Sadar Bazaar','صدر بازار','सदर बाज़ार'],mall:['Plaza','پلازہ','प्लाज़ा'],
 park:['Jinnah Park','جناح پارک','जिन्ना पार्क'],stadium:['Cricket Ground','کرکٹ گراؤنڈ','क्रिकेट ग्राउंड'],petrol:['Petrol Pump','پیٹرول پمپ','पेट्रोल पंप'],
 home:['Ghar 1','گھر ۱','घर'],home2:['Ghar 2','گھر ۲','दूसरा घर'],home3:['Ghar 3','گھر ۳','तीसरा घर'],masjid:['Jinnah Masjid','جناح مسجد','जिन्ना मस्जिद']};
function signTex(en,ur,color){return G.ctex(512,128,g=>{g.fillStyle='rgba(8,12,16,.92)';g.fillRect(0,0,512,128);g.strokeStyle=color;g.lineWidth=8;g.strokeRect(4,4,504,120);g.textAlign='center';g.textBaseline='middle';
 g.fillStyle='#fff';g.direction='rtl';g.font='bold 54px '+FONT;g.fillText(ur,256,50);g.direction='ltr';g.font='bold 30px Segoe UI,Arial,sans-serif';g.fillStyle=color;g.fillText(en,256,98);});}
for(const l of LM){const n=NAMES[l.id];if(n){l.name=n[0];if(G.LMHI)G.LMHI[l.id]=n[2];}}
G.city.children.forEach(o=>{if(!o.isSprite||!o.material||!o.material.map)return;const l=LM.find(q=>Math.abs(q.x-o.position.x)<.6&&Math.abs(q.z-o.position.z)<.6);
 if(l&&NAMES[l.id]){o.material.map=signTex(NAMES[l.id][0],NAMES[l.id][1],l.color);o.material.needsUpdate=true;}});
/* warmer, painted-wall colours */
(G.bMats||[]).forEach((m,k)=>m.color.set(['#ffffff','#fff0d2','#ffdfb4','#e6f2dc','#ffe0d8','#e8d4b4'][k%6]));

/* ───────── 2. Jinnah Masjid (replaces the trees of park block 2,2) ───────── */
const MQ={id:'masjid',name:NAMES.masjid[0],bx:2,bz:2,color:'#16a34a',kind:'mosque'};MQ.x=blkC(2);MQ.z=blkC(2);MQ.stop={x:MQ.x,z:roadC(3)};MQ.door={x:MQ.x,z:MQ.z+16};
(function buildMosque(){
 const m4=new T.Matrix4(),hx=19,hz=16;
 G.city.children.forEach(o=>{if(!o.isInstancedMesh||!o.geometry)return;const gt=o.geometry.type,pr=o.geometry.parameters;
  if(gt!=='IcosahedronGeometry'&&!(gt==='CylinderGeometry'&&pr&&Math.abs(pr.radiusTop-.22)<.01))return;
  for(let i=0;i<o.count;i++){o.getMatrixAt(i,m4);const x=m4.elements[12],z=m4.elements[14];if(Math.abs(x-MQ.x)<hx&&Math.abs(z-MQ.z)<hz){m4.makeScale(0,0,0);o.setMatrixAt(i,m4);}}o.instanceMatrix.needsUpdate=true;});
 for(let i=G.circles.length-1;i>=0;i--){const c=G.circles[i];if(c.r===.55&&Math.abs(c.x-MQ.x)<hx&&Math.abs(c.z-MQ.z)<hz)G.circles.splice(i,1);}
 const cream=new T.MeshStandardMaterial({color:'#efe6d2',roughness:.9}),green=new T.MeshStandardMaterial({color:'#1b8f58',roughness:.45,metalness:.2}),dark=new T.MeshStandardMaterial({color:'#2b3a33',roughness:.9}),gold=new T.MeshBasicMaterial({color:'#e8b923'}),glow=new T.MeshBasicMaterial({color:'#3dff9a'});
 const add=(geo,mat,x,y,z,col)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;G.city.add(m);if(col)G.colliders.push(col);return m;};
 const X=MQ.x,Z=MQ.z;
 add(new T.BoxGeometry(26,7,20),cream,X,3.8,Z,{x0:X-13.2,x1:X+13.2,z0:Z-10.2,z1:Z+10.2});
 add(new T.BoxGeometry(4,5,.4),dark,X,2.8,Z+10.1);for(const s of[-1,1])add(new T.BoxGeometry(2.4,3.6,.4),dark,X+s*8,2.4,Z+10.1);add(new T.BoxGeometry(26.4,.5,20.4),green,X,7.5,Z);
 add(new T.CylinderGeometry(7.2,7.4,2.4,24),cream,X,8.6,Z);
 add(new T.SphereGeometry(7.2,24,12,0,PI*2,0,PI/2),green,X,9.8,Z);
 add(new T.CylinderGeometry(.14,.14,3.4,8),gold,X,17.6,Z);add(new T.SphereGeometry(.55,10,8),gold,X,19.4,Z);
 const cres=new T.Mesh(new T.TorusGeometry(.95,.2,8,18,PI*1.6),gold);cres.position.set(X,20.6,Z);cres.rotation.set(0,0,PI*.7);G.city.add(cres);
 for(const s of[-1,1]){add(new T.SphereGeometry(3.1,16,8,0,PI*2,0,PI/2),green,X+s*8.2,7.8,Z+5,null);}
 for(const sx of[-1,1])for(const sz of[-1,1]){const mx=X+sx*14.5,mz=Z+sz*11.5;
  add(new T.CylinderGeometry(1.15,1.5,22,12),cream,mx,11.3,mz,{x0:mx-1.7,x1:mx+1.7,z0:mz-1.7,z1:mz+1.7});add(new T.CylinderGeometry(2,2,.45,14),green,mx,17,mz);
  add(new T.SphereGeometry(1.3,12,8,0,PI*2,0,PI/2),green,mx,22.3,mz);add(new T.SphereGeometry(.34,8,6),glow,mx,24.3,mz);}
 const sp=new T.Sprite(new T.SpriteMaterial({map:signTex(MQ.name,NAMES.masjid[1],MQ.color),transparent:true,depthWrite:false}));sp.scale.set(22,5.5,1);sp.position.set(MQ.x,28,MQ.z);G.city.add(sp);
 G.beacon(MQ.x,MQ.z,MQ.color,70,1.4);
 LM.push(MQ);
 try{const g=G.staticMap.getContext('2d');g.fillStyle=MQ.color;g.beginPath();g.arc(MQ.x*SC,MQ.z*SC,7,0,7);g.fill();g.fillStyle='#10171d';g.font='bold 15px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('M',MQ.x*SC,MQ.z*SC+1);}catch(e){}
})();

/* ───────── 3. Urdu signboards (one atlas, one draw call) ───────── */
(function signs(){
 const D=[['Hotel','ہوٹل','#b91c1c'],['Chai · Paratha','چائے پراٹھا','#065f46'],['Karyana Store','کریانہ سٹور','#1d4ed8'],['Mobile Shop','موبائل شاپ','#7c3aed'],
  ['Dawa Khana','دوا خانہ','#047857'],['Bakery','بیکری','#c2410c'],['Tailors','درزی','#0f766e'],['Pakistan Zindabad','پاکستان زندہ باد','#166534']];
 const atlas=G.ctex(1024,512,g=>{D.forEach((d,i)=>{const cx=(i%2)*512,cy=Math.floor(i/2)*128;g.fillStyle=d[2];g.fillRect(cx,cy,512,128);g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(cx+7,cy+7,498,114);
  g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.direction='rtl';g.font='bold 52px '+FONT;g.fillText(d[1],cx+256,cy+50);g.direction='ltr';g.font='bold 26px Arial,sans-serif';g.fillStyle='#ffe9a8';g.fillText(d[0],cx+256,cy+99);});});
 const mat=new T.MeshBasicMaterial({map:atlas,side:T.DoubleSide}),geos=[],poles=[];let n=0;
 const edge=[[0,-1,PI,0],[0,1,0,0],[-1,0,-PI/2,0],[1,0,PI/2,0]];
 for(let bx=0;bx<C.NB;bx++)for(let bz=0;bz<C.NB;bz++){
  if(LM.some(l=>l.bx===bx&&l.bz===bz)||['4,3','2,2','1,4'].includes(bx+','+bz))continue;
  const per=Q===0?.5:1;if(Math.random()>.9*per)continue;
  const e=pick(edge),cx=blkC(bx),cz=blkC(bz),off=C.BS/2-1.2,lat=rnd(-18,18);
  let x=cx+e[0]*off+(e[0]===0?lat:0),z=cz+e[1]*off+(e[1]===0?lat:0);
  const i=Math.floor(Math.random()*8),col=i%2,row=Math.floor(i/2);
  const g=new T.PlaneGeometry(4.2,1.05),uv=g.attributes.uv;for(let k=0;k<uv.count;k++){uv.setXY(k,(col+uv.getX(k))/2,1-(row+1-uv.getY(k))/4);}
  g.rotateY(e[2]);g.translate(x,3.5,z);geos.push(g);poles.push([x,z]);n++;
  G.circles.push({x,z,r:.25});}
 try{if(MU&&MU.mergeBufferGeometries&&geos.length>1){const m=new T.Mesh(MU.mergeBufferGeometries(geos,false),mat);G.city.add(m);G.signMesh=m;}else geos.forEach(g=>{const m=new T.Mesh(g,mat);G.city.add(m);});}catch(e){geos.forEach(g=>G.city.add(new T.Mesh(g,mat)));}
 const pg=new T.BoxGeometry(.14,3,.14).translate(0,1.8,0),im=new T.InstancedMesh(pg,new T.MeshStandardMaterial({color:'#4a4f55',roughness:.8}),Math.max(1,poles.length)),dm=new T.Object3D();
 poles.forEach((p,i)=>{dm.position.set(p[0],.3,p[1]);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);});im.frustumCulled=false;G.city.add(im);G.signMat=mat;
})();

/* ───────── 4. Pakistani flags ───────── */
const flagTex=G.ctex(256,170,g=>{g.fillStyle='#01411c';g.fillRect(0,0,256,170);g.fillStyle='#fff';g.fillRect(0,0,64,170);g.fillStyle='#fff';g.beginPath();g.arc(160,85,40,0,7);g.fill();
 g.fillStyle='#01411c';g.beginPath();g.arc(174,78,35,0,7);g.fill();g.fillStyle='#fff';g.beginPath();for(let k=0;k<10;k++){const r=k%2?7:17,a=-PI/2+k*PI/5+.5;g.lineTo(200+Math.cos(a)*r,62+Math.sin(a)*r);}g.closePath();g.fill();});
const flags=[];
function addFlag(x,y,z,h){const pole=new T.Mesh(new T.CylinderGeometry(.12,.16,h,8),phong('#c9ced4',60));pole.position.set(x,y+h/2,z);G.city.add(pole);
 const fg=new T.PlaneGeometry(3.6,2.4,8,3).translate(1.8,0,0),fm=new T.Mesh(fg,new T.MeshBasicMaterial({map:flagTex,side:T.DoubleSide}));fm.position.set(x,y+h-1.3,z);G.city.add(fm);
 flags.push({m:fm,base:Float32Array.from(fg.attributes.position.array)});}
{const L=id=>LM.find(l=>l.id===id);
 const hp=L('hospital'),po=L('police'),ml=L('mall'),st=L('stadium'),pk=L('park');
 if(hp)addFlag(hp.x+14,26.6,hp.z,8);if(po)addFlag(po.x+10,15.4,po.z,8);if(ml)addFlag(ml.x+16,17.4,ml.z,8);if(st)addFlag(st.x,.4,st.z,20);if(pk)addFlag(pk.x+14,.4,pk.z+14,16);addFlag(MQ.x-14.5,0,MQ.z+11.5+4,12);}
function flagWave(t){for(const f of flags){const a=f.m.geometry.attributes.position,b=f.base;for(let i=0;i<a.count;i++){const x=b[i*3];a.array[i*3+2]=Math.sin(t*3.2+x*1.7)*.22*(x/3.6);}a.needsUpdate=true;}}

/* ───────── 5. Pakistani people (shalwar kameez / topi / dupatta) ───────── */
const origBP=G.buildPerson;
const MEN=['#f1efe6','#e9e4d3','#cfd8dc','#9aa6a0','#8b7a5c','#1f3b5c','#2e5a45','#5a2a2a'],WOM=['#c0392b','#2a7f62','#1f5fa8','#d97706','#8e44ad','#d1478b','#0f766e'],DUP=['#f4ead5','#ffffff','#e5b8d0','#c9e4de'];
function decorate(p,o){const g=p.mesh,add=(w,h,d,c,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),lamb(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
 add(.66,.66,.38,o.suit,0,.7,0);for(const l of[p.legL,p.legR])l.scale.set(1.45,1,1.45);
 if(o.female){const d=pick(DUP);add(.95,.05,.52,d,0,1.5,0);add(.5,.75,.05,d,0,1.15,-.24);add(.46,.2,.46,d,0,1.74,-.04);}
 else if(o.dark)add(.42,.08,.42,'#222',0,1.96,0);
 else if(Math.random()<.65)add(.44,.13,.44,pick(['#f4f1e8','#1c1c1c','#6b4a2b']),0,1.99,0);}
if(origBP){G.buildPerson=function(shirt,pants,skin,hair,sc){const dark=(shirt==='#1f2937'||shirt==='#8b1a1a'),female=!dark&&Math.random()<.33,suit=dark?shirt:pick(female?WOM:MEN);
  const p=origBP(suit,female?suit:(dark?'#2a2a2a':(Math.random()<.55?suit:'#efece3')),skin,female?'#161010':hair,sc);decorate(p,{suit,female,dark});return p;};}

/* ───────── 6. Pakistani vehicles ───────── */
function box(par,w,h,d,mat,x,y,z){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;par.add(m);return m;}
function wheel(par,r,w,x,y,z){const wg=new T.Group();wg.position.set(x,y,z);const t=new T.Mesh(new T.CylinderGeometry(r,r,w,12).rotateZ(PI/2),new T.MeshPhongMaterial({color:'#0e0e10'}));t.castShadow=true;wg.add(t);par.add(wg);return{wg,t};}
function vehicle(g,b,fw,rw,spin,head,tail,extra){return Object.assign({mesh:g,body:b,fw,rw,spin,head,tail,spots:[],paint:null,x:0,z:0,h:0,vx:0,vz:0,vf:0,vl:0,steer:0,hp:100,brake:false,lightsOn:false,spinA:0,acc2:0,setLights(){}},extra);}
function rickshaw(){const g=new T.Group(),b=new T.Group();g.add(b);const body=phong(pick(['#f2c500','#1f9d55','#e9a800']),60),blk=phong('#141414',20),gl=new T.MeshPhongMaterial({color:0x223344,transparent:true,opacity:.6}),hm=new T.MeshBasicMaterial({color:0xcfd6dc}),tm=new T.MeshBasicMaterial({color:0x5a0000});
 box(b,1.4,.75,2.1,body,0,.75,-.1);box(b,1.3,.5,.55,body,0,.6,1.0);box(b,.9,.55,.07,gl,0,1.25,.85);box(b,1.6,.09,2.1,blk,0,1.8,-.15);
 for(const sx of[-1,1])for(const sz of[-.9,.8])box(b,.06,1.05,.06,blk,sx*.65,1.28,sz);
 box(b,1.2,.3,.6,phong('#7a1f1f'),0,1.05,-.6);box(b,1.42,.1,2.12,phong('#c0392b'),0,.98,-.1);box(b,.3,.2,.1,hm,0,.78,1.3);box(b,.4,.15,.08,tm,0,.85,-1.17);
 const f=wheel(g,.3,.18,0,.3,1.05),r1=wheel(g,.3,.2,-.68,.3,-.55),r2=wheel(g,.3,.2,.68,.3,-.55);
 return vehicle(g,b,[f.wg],[r1.wg,r2.wg],[f.t,r1.t,r2.t],hm,tm,{shape:'rickshaw',half:.5,cr:1.0,speedK:.8});}
function bike(){const g=new T.Group(),b=new T.Group();g.add(b);const pa=phong(pick(['#b91c1c','#1d4ed8','#111827','#15803d']),70),blk=phong('#111',20),sil=phong('#c9ced4',90),hm=new T.MeshBasicMaterial({color:0xfff3c8}),tm=new T.MeshBasicMaterial({color:0x5a0000});
 box(b,.28,.5,1.3,pa,0,.62,-.05);box(b,.34,.22,.5,pa,0,.98,.2);box(b,.3,.1,.62,blk,0,.92,-.4);box(b,.08,.75,.08,sil,0,.58,.66);box(b,.72,.06,.06,sil,0,1.06,.62);box(b,.16,.16,.1,hm,0,.92,.78);box(b,.14,.1,.06,tm,0,.8,-.72);box(b,.09,.09,.6,sil,.2,.35,-.5);
 const f=wheel(g,.32,.1,0,.32,.68),r=wheel(g,.32,.12,0,.32,-.62);
 if(G.buildPerson){const rider=G.buildPerson('#5a6b7a','#5a6b7a','#c68a5e','#111',.88);rider.mesh.position.set(0,.14,-.28);rider.legL.rotation.x=rider.legR.rotation.x=-1.15;rider.armL.rotation.x=rider.armR.rotation.x=-1.0;b.add(rider.mesh);}
 return vehicle(g,b,[f.wg],[r.wg],[f.t,r.t],hm,tm,{shape:'bike',half:.45,cr:.8,speedK:1.15});}
let artTex=[];
function truckArt(){if(artTex.length<3){artTex.push(G.ctex(512,256,g=>{g.fillStyle=pick(['#c2410c','#1d4ed8','#15803d','#b91c1c','#7e22ce']);g.fillRect(0,0,512,256);
  for(let x=0;x<512;x+=64){g.fillStyle=(x/64)%2?'rgba(255,214,0,.35)':'rgba(255,255,255,.16)';g.fillRect(x,0,32,256);}
  g.strokeStyle='#ffd60a';g.lineWidth=10;g.strokeRect(8,8,496,240);g.strokeStyle='#fff';g.lineWidth=3;g.strokeRect(22,22,468,212);
  for(const[cx,cy]of[[90,135],[256,135],[422,135]]){for(let k=0;k<10;k++){g.fillStyle=k%2?'#ffd60a':'#ff4d6d';g.beginPath();g.ellipse(cx+Math.cos(k*.628)*30,cy+Math.sin(k*.628)*30,16,9,k*.628,0,7);g.fill();}g.fillStyle='#fff';g.beginPath();g.arc(cx,cy,14,0,7);g.fill();g.fillStyle='#c2410c';g.beginPath();g.arc(cx,cy,7,0,7);g.fill();}
  g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.direction='rtl';g.font='bold 40px '+FONT;g.fillText(pick(['ماں کی دعا','پاکستان زندہ باد','ہارن دے کر پاس کریں','جنت کی ہوا']),256,52);
  g.direction='ltr';g.font='bold 26px Arial';g.fillText(pick(['Mehnat Ki Kamai','Allah Hafiz','Pakistan Zindabad','Horn Please']),256,222);}));}
 return artTex[Math.floor(Math.random()*artTex.length)];}
function truck(){const g=new T.Group(),b=new T.Group();g.add(b);const cabC=phong(pick(['#0f766e','#1d4ed8','#b91c1c','#a16207']),60),dark=phong('#1b1b1f',20),gl=new T.MeshPhongMaterial({color:0x223344,transparent:true,opacity:.65}),hm=new T.MeshBasicMaterial({color:0xcfd6dc}),tm=new T.MeshBasicMaterial({color:0x5a0000});
 const art=new T.MeshBasicMaterial({map:truckArt()}),top=phong('#cfcfcf',10);
 box(b,2.2,.4,8.6,dark,0,.8,0);box(b,2.3,1.9,2.1,cabC,0,1.9,2.9);box(b,2.1,.7,.08,gl,0,2.35,3.96);box(b,2.4,.35,.35,phong('#ffd60a',60),0,.65,4.1);box(b,.4,.2,.1,hm,-.7,1.2,4.12);box(b,.4,.2,.1,hm,.7,1.2,4.12);
 const cargo=new T.Mesh(new T.BoxGeometry(2.6,2.6,5.4),[art,art,top,dark,art,art]);cargo.position.set(0,2.35,-1.0);cargo.castShadow=true;b.add(cargo);box(b,.5,.2,.08,tm,-.8,1.0,-3.75);box(b,.5,.2,.08,tm,.8,1.0,-3.75);
 const wf1=wheel(g,.5,.34,-1.05,.5,3.0),wf2=wheel(g,.5,.34,1.05,.5,3.0),wr=[[-1.05,-1.4],[1.05,-1.4],[-1.05,-2.8],[1.05,-2.8]].map(p=>wheel(g,.5,.34,p[0],.5,p[1]));
 return vehicle(g,b,[wf1.wg,wf2.wg],wr.map(w=>w.wg),[wf1.t,wf2.t].concat(wr.map(w=>w.t)),hm,tm,{shape:'truck',half:3.0,cr:1.55,speedK:.75});}
const origCar=G.buildCar,PKV={rickshaw,bike,truck};
G.buildCar=function(color,o){if(o&&PKV[o.shape])return PKV[o.shape]();return origCar(color,o);};
G.npcShapes=Q===0?['rickshaw','rickshaw','bike','bike','hatch','sedan']:['rickshaw','rickshaw','rickshaw','bike','bike','bike','truck','hatch','hatch','sedan','suv'];

/* ───────── 7. Saras from your person.glb ───────── */
const SAR={skin:'#c68a5e',suit:'#0f8a5f',shalwar:'#f3efe6',dupatta:'#f4ead5',hair:'#141010'},COLORS={white:'#f1efe6',black:'#1c1c20',blue:'#1f5fa8',green:'#0f8a5f',red:'#c0392b',pink:'#d1478b',maroon:'#7a1f2b',sky:'#4aa3df',yellow:'#e0b422',purple:'#7a3fb3',orange:'#e07a1f'};
let av=null;
function buildArticulated(root,opt){
 const nodes={},pos={};root.traverse(o=>{if(o.name)nodes[o.name]=o;});
 const need=['Head','BODY1','BODY2','Neck','A1','A2','A3','B1','B2','B3','C1','C2','C3','D1','D2','D3','PointA1','PointA2','PointA3','PointB1','PointB2','PointB3','PointC1','PointC2','PointD1','PointD2'];
 for(const n of need)if(!nodes[n]){console.info('person.glb: part missing -> '+n+' (unknown model, not touching)');return null;}
 for(const n of need)pos[n]={x:nodes[n].position.x,y:nodes[n].position.y,z:nodes[n].position.z};
 const rig=new T.Group(),mat=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r||.85}),M={skin:mat(opt.skin),suit:mat(opt.suit),shalwar:mat(opt.shalwar),shoe:mat('#3b2a1e'),hair:mat(opt.hair),dup:mat(opt.dupatta,.95)};
 const paint=(n,m)=>nodes[n].traverse(o=>{if(o.isMesh)o.material=m;});
 const pivot=(parent,x,y,z)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;};
 const mount=(n,parent,px,py,pz)=>{const o=nodes[n];if(o.parent)o.parent.remove(o);o.position.set(pos[n].x-px,pos[n].y-py,pos[n].z-pz);parent.add(o);};
 for(const n of['Head','Neck'])paint(n,M.skin);for(const n of['BODY1','BODY2','A1','A2','B1','B2','PointA1','PointB1','PointA2','PointB2','C1','D1','PointC1','PointD1'])paint(n,M.suit);
 for(const n of['A3','B3','PointA3','PointB3'])paint(n,M.skin);for(const n of['C2','D2','PointC2','PointD2'])paint(n,M.shalwar);for(const n of['C3','D3'])paint(n,M.shoe);
 nodes.C2.scale.set(1.6,1,1.6);nodes.D2.scale.set(1.6,1,1.6);
 for(const n of['Head','Neck','BODY1','BODY2']){if(nodes[n].parent)nodes[n].parent.remove(nodes[n]);rig.add(nodes[n]);}
 const arm=(p1,p2,p3,a1,a2,a3,sgn)=>{const sh=pos[p1],el=pos[p2],wr=pos[p3],swing=pivot(rig,sh.x,sh.y,sh.z),lower=pivot(swing,0,0,0);
  mount(a1,lower,sh.x,sh.y,sh.z);mount(p1,lower,sh.x,sh.y,sh.z);const elbow=pivot(lower,el.x-sh.x,el.y-sh.y,el.z-sh.z);mount(p2,elbow,el.x,el.y,el.z);mount(a2,elbow,el.x,el.y,el.z);
  const wrist=pivot(elbow,wr.x-el.x,wr.y-el.y,wr.z-el.z);mount(p3,wrist,wr.x,wr.y,wr.z);mount(a3,wrist,wr.x,wr.y,wr.z);lower.rotation.z=-sgn*1.4;return{swing,lower,elbow};};
 const leg=(t,p1,s,p2,f)=>{const hx=pos[t].x,hy=2.65,kn=pos[p1],an=pos[p2],hip=pivot(rig,hx,hy,0);mount(t,hip,hx,hy,0);
  const knee=pivot(hip,0,kn.y-hy,0);mount(p1,knee,kn.x,kn.y,0);mount(s,knee,kn.x,kn.y,0);const ank=pivot(knee,0,an.y-kn.y,0);mount(p2,ank,an.x,an.y,0);mount(f,ank,an.x,an.y,0);return{hip,knee,ank};};
 const armR=arm('PointA1','PointA2','PointA3','A1','A2','A3',1),armL=arm('PointB1','PointB2','PointB3','B1','B2','B3',-1),legR=leg('C1','PointC1','C2','PointC2','C3'),legL=leg('D1','PointD1','D2','PointD2','D3');
 /* clothes + hair */
 const add=(w,h,d,m,x,y,z)=>{const q=new T.Mesh(new T.BoxGeometry(w,h,d),m);q.position.set(x,y,z);q.castShadow=true;rig.add(q);return q;};
 const hd=pos.Head;add(4.35,3.9,4.25,M.suit,0,.7,0);                                   // long kameez to the knees
 add(2.95,1.0,2.95,M.hair,hd.x,hd.y+1.0,hd.z);add(2.95,2.4,.7,M.hair,hd.x,hd.y-.2,hd.z+1.15);add(.7,2.2,.5,M.hair,hd.x,hd.y-2.4,hd.z+1.1);   // hair + plait
 const dupT=add(3.15,.45,3.15,M.dup,hd.x,hd.y+1.3,hd.z),dupB=add(3.2,2.7,.45,M.dup,hd.x,hd.y-.05,hd.z+1.45);                              // dupatta over the head
 add(4.4,.6,4.4,M.dup,0,8.0,0);add(3.3,5.4,.4,M.dup,0,5.5,2.2);                         // dupatta over shoulders + hanging at the back
 return{rig,M,armR,armL,legR,legL,ph:0,y0:0,aim:0,pun:0};}
function animate(a,sp,dt,atk,armed){a.ph+=dt*(2.4+sp*.95);const m=clamp(sp/2.5,0,1),run=clamp((sp-3.6)/3.4,0,1),amp=(.5+.35*run)*m,s=Math.sin(a.ph),c=Math.cos(a.ph);
 a.legR.hip.rotation.x=s*amp;a.legL.hip.rotation.x=-s*amp;a.legR.knee.rotation.x=-Math.max(0,-c)*amp*1.5*(1+run);a.legL.knee.rotation.x=-Math.max(0,c)*amp*1.5*(1+run);
 let aR=-s*amp*.9,aL=s*amp*.9;a.aim+=((armed?1:0)-a.aim)*Math.min(1,dt*10);
 aR+=(1.5-aR)*a.aim;aL+=(1.4-aL)*a.aim;
 if(atk>0){a.pun=Math.sin(clamp((.22-atk)/.22,0,1)*PI);aR+=(1.9-aR)*a.pun;}
 a.armR.swing.rotation.x=aR;a.armL.swing.rotation.x=aL;a.rig.position.y=Math.abs(s)*.22*m;}
G._pk={buildArticulated,animate,decorate,NAMES,COLORS};
function loadSaras(){const L=T.GLTFLoader;if(!L||!G.me)return;
 new L().load('person.glb',gltf=>{try{const a=buildArticulated(gltf.scene,SAR);if(!a)return;const me=G.me,s=1.72/17.93,wrap=new T.Group();wrap.add(a.rig);wrap.scale.setScalar(s);wrap.rotation.y=PI;wrap.position.y=6.5*s;
  for(const ch of me.mesh.children.slice())ch.visible=false;me.mesh.add(wrap);me.mesh.userData.hasModel=true;av=a;if(G.toast)G.toast('Saras: person.glb load ho gaya',1800);console.info('person.glb articulated: ok');}catch(e){console.warn('person.glb error',e);}},undefined,()=>{});}
function retrofitMe(){const me=G.me;if(!me)return;me.mesh.traverse(o=>{if(!o.isMesh||!o.material||!o.material.color)return;const h=o.material.color.getHex();if(h===0x2b6cb0)o.material.color.set(SAR.suit);else if(h===0x2d3748)o.material.color.set('#f3efe6');});decorate(me,{suit:SAR.suit,female:true,dark:false});}

/* ───────── 8. actions, prompt, frame hook ───────── */
const A=G.actions;
A.outfit=a=>{const c=COLORS[String(a.color||'').toLowerCase()]||(/^#[0-9a-f]{6}$/i.test(a.color||'')?a.color:null);if(c){SAR.suit=c;if(av)av.M.suit.color.set(c);G.toast('Saras ne naya libaas pehna 👗',1600);}return{update:()=>true};};
G.promptExtras.push(`SETTING: this is a Pakistani city (Saras City): chai dhabas, auto-rickshaws, Honda-70 bikes, truck art, Urdu signboards, Jinnah Masjid, Sadar Bazaar, Civil Hospital, Thana (police), Cricket Ground, Jinnah Park. Currency is Rupees (Rs). Saras wears a shalwar kameez with a dupatta and speaks warmly with Pakistani flavour (e.g. "ji", "jee zaroor", "chai peete hain?"). New place id: masjid (Jinnah Masjid). Place names were localised: hospital=Civil Hospital, police=Thana, bazaar=Sadar Bazaar, mall=Plaza, park=Jinnah Park, stadium=Cricket Ground.
{"a":"outfit","color":"white|black|blue|green|red|pink|maroon|sky|yellow|purple|orange"} changes the colour of Saras's kameez.`);
let tt=0;
G.hooks.update.push(dt=>{tt+=dt;flagWave(tt);if(G.signMat)G.signMat.color.setScalar(.8+.2*(G.night||0));
 if(av&&G.me&&G.mode==='foot')animate(av,G.footSpeed||0,dt,G.me.atk||0,G.getWeapon&&G.getWeapon()==='pistol');});
G.hooks.ready.push(()=>{if(G.me){retrofitMe();loadSaras();}if(G.$('stagetag'))G.$('stagetag').textContent+=' + Pakistan';});
})();
