/* SARAS CITY — core.js  (Stage 1: Basic)
   3D city, real car physics, weather + day/night, voice in/out,
   AI command understanding (Groq / Gemini / OpenRouter) + offline fallback. */
(function(){
'use strict';
const T=window.THREE,MU=T.MathUtils,PI=Math.PI,$=id=>document.getElementById(id);
const G=window.G={stage:1,mode:'car',indoor:false,hooks:{update:[],ready:[]},actions:{},promptExtras:[],stateExtras:[],
  markers:[],colliders:[],circles:[],circleProviders:[],landmarks:[],userLang:'ur',started:false,uiOn:true,time:9,carLights:null};
const clamp=MU.clamp,wrapA=a=>{while(a>PI)a-=2*PI;while(a<-PI)a+=2*PI;return a;};
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
Object.assign(G,{T,clamp,wrapA,rnd,pick,$});
let sd=7;const R=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const rr=(a,b)=>a+R()*(b-a);

/* ───────── settings ───────── */
const DEF={keys:{groq:'',gemini:'',openrouter:''},models:{groq:'llama-3.3-70b-versatile',gemini:'gemini-2.5-flash',openrouter:'meta-llama/llama-3.3-70b-instruct:free'},rec:'hi-IN',mic:true,tts:true,quality:'high',autoWeather:true,always:true,wake:false,chatty:true};
let S=JSON.parse(JSON.stringify(DEF));
try{const s=JSON.parse(localStorage.getItem('saras_settings')||'{}');S=Object.assign(S,s);S.keys=Object.assign({},DEF.keys,s.keys||{});S.models=Object.assign({},DEF.models,s.models||{});}catch(e){}
G.S=S;G.saveS=()=>{try{localStorage.setItem('saras_settings',JSON.stringify(S));}catch(e){}};
try{if(!localStorage.getItem('saras_settings')){const dm=navigator.deviceMemory||4;S.quality=dm<=4?'low':dm<=6?'med':'high';}}catch(e){}
const Q=S.quality==='low'?0:S.quality==='med'?1:2;

/* ───────── renderer / scene ───────── */
const canvas=$('gl');
const renderer=new T.WebGLRenderer({canvas,antialias:Q>0,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,Q===2?2:Q===1?1.5:1));
renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=Q>0;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(65,1,.3,Q===0?750:1500);
scene.fog=new T.FogExp2(0xbfe3ff,.0014);
const cityGroup=new T.Group(),beaconGroup=new T.Group();scene.add(cityGroup,beaconGroup);
Object.assign(G,{renderer,scene,camera,city:cityGroup,beaconGroup});
function resize(){renderer.setSize(window.innerWidth,window.innerHeight,false);camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();

const skyU={top:{value:new T.Color('#2e7ed6')},bot:{value:new T.Color('#cfe8fb')}};
const sky=new T.Mesh(new T.SphereGeometry(1000,24,12),new T.ShaderMaterial({uniforms:skyU,side:T.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:'uniform vec3 top;uniform vec3 bot;varying float h;void main(){float t=pow(clamp(h,0.0,1.0),0.5);gl_FragColor=vec4(mix(bot,top,t),1.0);}'}));
sky.frustumCulled=false;scene.add(sky);G.skyU=skyU;
const stars=(()=>{const n=500,a=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*2*PI,v=Math.random()*.9+.05,r=950;a[i*3]=Math.cos(u)*Math.sqrt(1-v*v)*r;a[i*3+1]=v*r;a[i*3+2]=Math.sin(u)*Math.sqrt(1-v*v)*r;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(a,3));const p=new T.Points(g,new T.PointsMaterial({color:0xffffff,size:2.2,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));p.frustumCulled=false;scene.add(p);return p;})();

const hemi=new T.HemisphereLight(0xffffff,0x445566,.6);scene.add(hemi);
const sun=new T.DirectionalLight(0xffffff,1.2);sun.castShadow=Q>0;
sun.shadow.mapSize.set(Q===2?2048:1024,Q===2?2048:1024);const sc=sun.shadow.camera;sc.left=-70;sc.right=70;sc.top=70;sc.bottom=-70;sc.near=1;sc.far=420;sun.shadow.bias=-.0006;
scene.add(sun,sun.target);G.sunLight=sun;
const moon=new T.DirectionalLight(0x9db7ff,0);scene.add(moon,moon.target);

/* ───────── helpers ───────── */
function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;
 if(rep){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}return t;}
function signSprite(text,color,w,h){w=w||22;h=h||5.5;const tex=ctex(512,128,g=>{g.fillStyle='rgba(8,12,16,.88)';g.fillRect(0,0,512,128);g.strokeStyle=color;g.lineWidth=8;g.strokeRect(4,4,504,120);
 g.fillStyle='#fff';g.font='bold 58px Segoe UI,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,68);});
 const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(w,h,1);return s;}
function beacon(x,z,color,h,r){h=h||90;r=r||1.6;const m=new T.Mesh(new T.CylinderGeometry(r,r,h,12,1,true),new T.MeshBasicMaterial({color,transparent:true,opacity:.24,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}));
 m.position.set(x,h/2,z);beaconGroup.add(m);return m;}
Object.assign(G,{ctex,signSprite,beacon,rr,R});

/* ───────── city layout ───────── */
const NB=7,BS=60,RW=16,P=BS+RW,SIZE=NB*P+RW;
const roadC=i=>i*P+RW/2,blk0=i=>i*P+RW,blkC=i=>blk0(i)+BS/2;
G.C={NB,BS,RW,P,SIZE,roadC,blk0,blkC};
const LM=[
 {id:'home',name:'Ghar 1',bx:0,bz:6,color:'#4ade80',kind:'house'},
 {id:'petrol',name:'Petrol Pump',bx:2,bz:5,color:'#fbbf24',kind:'pump'},
 {id:'hospital',name:'Hospital',bx:5,bz:5,color:'#f87171',kind:'hospital'},
 {id:'police',name:'Police Station',bx:3,bz:3,color:'#60a5fa',kind:'police'},
 {id:'bazaar',name:'Bazaar',bx:1,bz:2,color:'#fb923c',kind:'bazaar'},
 {id:'mall',name:'City Mall',bx:5,bz:1,color:'#c084fc',kind:'mall'},
 {id:'park',name:'Central Park',bx:3,bz:1,color:'#86efac',kind:'park'},
 {id:'stadium',name:'Stadium',bx:0,bz:0,color:'#22d3ee',kind:'stadium'},
 {id:'home2',name:'Ghar 2',bx:6,bz:0,color:'#4ade80',kind:'house'},
 {id:'home3',name:'Ghar 3',bx:6,bz:6,color:'#4ade80',kind:'house'}];
LM.forEach(l=>{l.x=blkC(l.bx);l.z=blkC(l.bz);l.stop={x:l.x,z:roadC(l.bz+1)};l.door={x:l.x,z:l.z+9.5};});
G.landmarks=LM;
const LMHI={home:'घर',petrol:'पेट्रोल पंप',hospital:'अस्पताल',police:'थाना',bazaar:'बाज़ार',mall:'मॉल',park:'पार्क',stadium:'स्टेडियम',home2:'दूसरा घर',home3:'तीसरा घर'};G.LMHI=LMHI;
const lmAt=(bx,bz)=>LM.find(l=>l.bx===bx&&l.bz===bz);
const PARKS=new Set(['4,3','2,2','1,4']);

/* materials + textures */
const BASES=['#9aa3ab','#b8aa94','#7f8c99','#a38f86','#8a9a8f','#d4cdbf'];
const bMats=BASES.map(b=>{
 const map=ctex(256,256,g=>{g.fillStyle=b;g.fillRect(0,0,256,256);for(let n=0;n<500;n++){g.fillStyle=n%2?'rgba(0,0,0,.05)':'rgba(255,255,255,.05)';g.fillRect(Math.random()*256,Math.random()*256,3,3);}
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const x=i*64+14,y=j*64+10,gr=g.createLinearGradient(x,y,x+36,y+44);gr.addColorStop(0,'#35566f');gr.addColorStop(1,'#0f1b27');g.fillStyle=gr;g.fillRect(x,y,36,44);
   g.fillStyle='rgba(255,255,255,.14)';g.fillRect(x,y,36,5);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x-2,y+44,40,3);}},true);
 const em=ctex(256,256,g=>{g.fillStyle='#000';g.fillRect(0,0,256,256);for(let i=0;i<4;i++)for(let j=0;j<4;j++)if(R()<.55){g.fillStyle=R()<.8?'#ffd68a':'#bfe3ff';g.fillRect(i*64+14,j*64+10,36,44);}},true);
 return new T.MeshStandardMaterial({map,emissiveMap:em,emissive:0xffffff,emissiveIntensity:0,roughness:.88,metalness:.05});});
G.bMats=bMats;const roofM=new T.MeshStandardMaterial({color:'#3a3d42',roughness:1});
const slabM=new T.MeshStandardMaterial({color:'#8e9297',roughness:1}),grassM=new T.MeshStandardMaterial({color:'#3c6b3f',roughness:1});
const stdM=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r==null?.9:r});

function addBox(x,y,z,w,h,d,mat,col){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;cityGroup.add(m);
 if(col!==false)G.colliders.push({x0:x-w/2-.2,x1:x+w/2+.2,z0:z-d/2-.2,z1:z+d/2+.2});return m;}
function bldg(x,z,w,d,h,k){const g=new T.BoxGeometry(w,h,d),uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++){const f=(i/4)|0;if(f>=2&&f<4)continue;uv.setXY(i,uv.getX(i)*((f<2?d:w)/16),uv.getY(i)*(h/16));}
 const m=new T.Mesh(g,[bMats[k],bMats[k],roofM,roofM,bMats[k],bMats[k]]);m.position.set(x,h/2+.3,z);m.castShadow=m.receiveShadow=true;cityGroup.add(m);
 G.colliders.push({x0:x-w/2-.2,x1:x+w/2+.2,z0:z-d/2-.2,z1:z+d/2+.2});return m;}
const treeSpots=[];

/* ground, roads */
const ground=new T.Mesh(new T.PlaneGeometry(3200,3200).rotateX(-PI/2),stdM('#46503f',1));ground.receiveShadow=true;cityGroup.add(ground);G.ground=ground;
const asph=(vert)=>ctex(128,128,g=>{g.fillStyle='#34373b';g.fillRect(0,0,128,128);for(let n=0;n<900;n++){const v=40+Math.random()*30|0;g.fillStyle=`rgba(${v},${v},${v},.35)`;g.fillRect(Math.random()*128,Math.random()*128,2,2);}
 if(vert===null)return;g.fillStyle='#ece9e0';
 if(vert){g.fillRect(62,0,4,64);g.fillRect(4,0,2,128);g.fillRect(122,0,2,128);}else{g.fillRect(0,62,64,4);g.fillRect(0,4,128,2);g.fillRect(0,122,128,2);}},true);
const tV=asph(true),tH=asph(false),tP=asph(null);
tV.repeat.set(1,SIZE/16);tH.repeat.set(SIZE/16,1);
const roadMats=[new T.MeshStandardMaterial({map:tV,roughness:.9}),new T.MeshStandardMaterial({map:tH,roughness:.9}),new T.MeshStandardMaterial({map:tP,roughness:.9})];
for(let i=0;i<=NB;i++){
 const zr=new T.Mesh(new T.PlaneGeometry(RW,SIZE).rotateX(-PI/2),roadMats[0]);zr.position.set(roadC(i),.02,SIZE/2);zr.receiveShadow=true;cityGroup.add(zr);
 const xr=new T.Mesh(new T.PlaneGeometry(SIZE,RW).rotateX(-PI/2),roadMats[1]);xr.position.set(SIZE/2,.02,roadC(i));xr.receiveShadow=true;cityGroup.add(xr);}
{const N=(NB+1)*(NB+1),im=new T.InstancedMesh(new T.PlaneGeometry(RW,RW).rotateX(-PI/2),roadMats[2],N),m=new T.Matrix4();let k=0;
 for(let i=0;i<=NB;i++)for(let j=0;j<=NB;j++){m.makeTranslation(roadC(i),.035,roadC(j));im.setMatrixAt(k++,m);}im.receiveShadow=true;im.frustumCulled=false;cityGroup.add(im);
 const zebra=ctex(128,32,g=>{g.clearRect(0,0,128,32);g.fillStyle='rgba(236,234,225,.92)';for(let q=0;q<8;q++)g.fillRect(q*16+3,0,10,32);},true);
 const cz=new T.InstancedMesh(new T.PlaneGeometry(RW-1.5,3).rotateX(-PI/2),new T.MeshStandardMaterial({map:zebra,transparent:true,roughness:.9,polygonOffset:true,polygonOffsetFactor:-2}),N*4);
 const dm=new T.Object3D();let n=0;const off=RW/2+1.9;
 for(let i=0;i<=NB;i++)for(let j=0;j<=NB;j++){const cx=roadC(i),cz2=roadC(j);
  const arms=[[0,-off,j>0,0],[0,off,j<NB,0],[off,0,i<NB,PI/2],[-off,0,i>0,PI/2]];
  for(const a of arms){if(!a[2])continue;dm.position.set(cx+a[0],.045,cz2+a[1]);dm.rotation.set(0,a[3],0);dm.updateMatrix();cz.setMatrixAt(n++,dm.matrix);}}
 cz.count=n;cz.frustumCulled=false;cityGroup.add(cz);}
G.roadMats=roadMats;

/* sign / beacon helper for landmark */
function lmSign(l,y){const s=signSprite(l.name,l.color);s.position.set(l.x,y,l.z);cityGroup.add(s);}
/* landmark buildings */
const LB={
 house(l){const c=pick(['#e8d9b8','#d9c3a5','#cfd8c4']);addBox(l.x,4.3,l.z,20,8,15,stdM(c));
  const roof=new T.Mesh(new T.ConeGeometry(15,6,4),stdM('#8a4b3a'));roof.rotation.y=PI/4;roof.scale.set(1.05,1,.78);roof.position.set(l.x,11.3,l.z);roof.castShadow=true;cityGroup.add(roof);
  addBox(l.x,2.3,l.z+7.6,3,4,.3,stdM('#3b2a20'),false);addBox(l.x-6,2.6,l.z+7.6,3,2.6,.3,new T.MeshStandardMaterial({color:'#7db7d9',emissive:'#ffd68a',emissiveIntensity:0,roughness:.2}),false);lmSign(l,16);},
 pump(l){addBox(l.x,6.2,l.z,30,.7,16,stdM('#e9ecef'),false);
  for(const[sx,sz]of[[-13,-6],[13,-6],[-13,6],[13,6]])addBox(l.x+sx,3,l.z+sz,.9,6,.9,stdM('#c9ccd1'));
  for(const sx of[-8,0,8])addBox(l.x+sx,1.1,l.z,1.1,2.2,.9,stdM('#d94b3d'));
  addBox(l.x,2.6,l.z-18,16,5.2,9,stdM('#dfe4e8'));addBox(l.x,5.3,l.z-18,17,.4,10,stdM('#d94b3d'),false);lmSign(l,11);},
 hospital(l){bldg(l.x,l.z,42,30,26,5);addBox(l.x,26.6,l.z,10,.7,3,stdM('#e34b4b'),false);addBox(l.x,26.6,l.z,3,.7,10,stdM('#e34b4b'),false);lmSign(l,32);},
 police(l){bldg(l.x,l.z,36,28,15,2);addBox(l.x-3,15.7,l.z,3,.7,1.2,new T.MeshBasicMaterial({color:'#2f6bff'}),false);addBox(l.x+3,15.7,l.z,3,.7,1.2,new T.MeshBasicMaterial({color:'#ff3b3b'}),false);lmSign(l,21);},
 bazaar(l){bldg(l.x,l.z-6,46,22,8,1);const cols=['#e4572e','#f3a712','#29bf12','#3a86ff','#c1121f','#8338ec'];
  for(let k=0;k<8;k++)addBox(l.x-20+k*5.7,4.3,l.z+7,5.4,.4,5,stdM(cols[k%6]),false);lmSign(l,13);},
 mall(l){bldg(l.x,l.z,50,42,16,3);addBox(l.x,17,l.z,52,.8,44,stdM('#6d28d9'),false);lmSign(l,23);},
 park(l){parkFill(l,true);const pond=new T.Mesh(new T.CircleGeometry(9,24).rotateX(-PI/2),new T.MeshStandardMaterial({color:'#2b6f9e',roughness:.15,metalness:.2}));pond.position.set(l.x,.34,l.z);cityGroup.add(pond);
  G.circles.push({x:l.x,z:l.z,r:9.5});addBox(l.x,.9,l.z,2,1.2,2,stdM('#b8bcc2'),false);lmSign(l,10);},
 stadium(l){const ring=new T.Mesh(new T.CylinderGeometry(25,27,10,28,1,true),new T.MeshStandardMaterial({color:'#c9ced6',roughness:.8,side:T.DoubleSide}));ring.position.set(l.x,5.3,l.z);ring.castShadow=ring.receiveShadow=true;cityGroup.add(ring);
  const field=new T.Mesh(new T.CircleGeometry(22,28).rotateX(-PI/2),stdM('#2f7d3a',1));field.position.set(l.x,.35,l.z);field.receiveShadow=true;cityGroup.add(field);
  for(let k=0;k<28;k++){const a=k/28*2*PI;G.circles.push({x:l.x+Math.cos(a)*26,z:l.z+Math.sin(a)*26,r:4.2});}
  for(const[sx,sz]of[[-22,-22],[22,-22],[-22,22],[22,22]])addBox(l.x+sx,12,l.z+sz,1,24,1,stdM('#8a8f96'),false);lmSign(l,18);}
};
function parkFill(l,named){const x0=blk0(l.bx),z0=blk0(l.bz);const s=new T.Mesh(new T.BoxGeometry(BS,.3,BS),grassM);s.position.set(l.x,.15,l.z);s.receiveShadow=true;cityGroup.add(s);
 for(let k=0;k<(named?16:12);k++){const a=rr(0,2*PI),d=rr(named?13:6,26);treeSpots.push([l.x+Math.cos(a)*d,l.z+Math.sin(a)*d,rr(1,1.5)]);}
 for(let k=0;k<4;k++)addBox(x0+10+k*13,.65,z0+BS-6,3,.6,.9,stdM('#7a5a3a'),false);}

/* fill blocks */
for(let bx=0;bx<NB;bx++)for(let bz=0;bz<NB;bz++){
 const l=lmAt(bx,bz),x=blkC(bx),z=blkC(bz),x0=blk0(bx),z0=blk0(bz),isPark=PARKS.has(bx+','+bz);
 if(l&&l.kind==='park'){LB.park(l);continue;}
 if(isPark){parkFill({bx,bz,x,z},false);continue;}
 const slab=new T.Mesh(new T.BoxGeometry(BS,.3,BS),slabM);slab.position.set(x,.15,z);slab.receiveShadow=true;cityGroup.add(slab);
 for(let k=0;k<5;k++){treeSpots.push([x0+6+k*12+rr(-2,2),z0+2.2,1]);treeSpots.push([x0+6+k*12+rr(-2,2),z0+BS-2.2,1]);treeSpots.push([x0+2.2,z0+8+k*10+rr(-2,2),1]);treeSpots.push([x0+BS-2.2,z0+8+k*10+rr(-2,2),1]);}
 if(l){LB[l.kind](l);continue;}
 const dd=Math.abs(bx-3)+Math.abs(bz-3),hmax=dd<=2?85:dd<=4?46:24,hmin=dd<=2?35:dd<=4?16:8;
 for(const[ox,oz]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const w=rr(19,25),d=rr(19,25),h=rr(hmin,hmax);bldg(x+ox*14.5,z+oz*14.5,w,d,h,Math.floor(R()*6));}
}
/* trees, lamps */
{const tr=treeSpots.filter(s=>!G.colliders.some(b=>s[0]>b.x0-1.5&&s[0]<b.x1+1.5&&s[1]>b.z0-1.5&&s[1]<b.z1+1.5)),n=tr.length;
 const trunk=new T.InstancedMesh(new T.CylinderGeometry(.22,.32,3,6).translate(0,1.5,0),stdM('#5a4128'),n),leaf=new T.InstancedMesh(new T.IcosahedronGeometry(2.1,0).translate(0,4.6,0),new T.MeshStandardMaterial({roughness:.95,flatShading:true}),n);
 const dm=new T.Object3D(),col=new T.Color();
 tr.forEach((s,i)=>{dm.position.set(s[0],.3,s[1]);dm.scale.setScalar(s[2]);dm.rotation.y=R()*6;dm.updateMatrix();trunk.setMatrixAt(i,dm.matrix);leaf.setMatrixAt(i,dm.matrix);
  col.setHSL(.27+R()*.08,.45+R()*.15,.25+R()*.1);leaf.setColorAt(i,col);G.circles.push({x:s[0],z:s[1],r:.55});});
 trunk.castShadow=leaf.castShadow=true;trunk.frustumCulled=leaf.frustumCulled=false;cityGroup.add(trunk,leaf);}
const lampHeads=[];
{const spots=[],nearInter=v=>{for(let i=0;i<=NB;i++)if(Math.abs(v-roadC(i))<RW/2+3.5)return true;return false;};
 for(let j=0;j<=NB;j++){let side=1;for(let v=16;v<SIZE-10;v+=34){if(nearInter(v))continue;side=-side;spots.push([v,roadC(j)+side*(RW/2+.9)]);spots.push([roadC(j)+side*(RW/2+.9),v]);}}
 const poles=new T.InstancedMesh(new T.CylinderGeometry(.12,.16,7.5,6).translate(0,3.75,0),stdM('#454b52'),spots.length),dm=new T.Object3D();
 spots.forEach((s,i)=>{dm.position.set(s[0],.3,s[1]);dm.updateMatrix();poles.setMatrixAt(i,dm.matrix);lampHeads.push(s[0],7.8,s[1]);G.circles.push({x:s[0],z:s[1],r:.35});});
 poles.frustumCulled=false;cityGroup.add(poles);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(lampHeads),3));
 const glow=ctex(64,64,c=>{const gr=c.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,220,150,1)');gr.addColorStop(.35,'rgba(255,200,120,.45)');gr.addColorStop(1,'rgba(255,200,120,0)');c.fillStyle=gr;c.fillRect(0,0,64,64);});
 const lampPts=new T.Points(g,new T.PointsMaterial({map:glow,size:16,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true,fog:false}));lampPts.frustumCulled=false;cityGroup.add(lampPts);G.lampPts=lampPts;}
/* beacons + hills */
LM.forEach(l=>{if(l.id==='home2'||l.id==='home3')return;beacon(l.x,l.z,l.color,70,1.4);});
for(let k=0;k<26;k++){const a=k/26*2*PI+rr(-.1,.1),d=rr(820,1000),h=rr(90,230),m=new T.Mesh(new T.ConeGeometry(rr(90,170),h,5),new T.MeshStandardMaterial({color:'#4b5a63',roughness:1,flatShading:true}));m.position.set(SIZE/2+Math.cos(a)*d,h/2-6,SIZE/2+Math.sin(a)*d);cityGroup.add(m);}

/* ───────── car model ───────── */
const SHAPES={sedan:{W:1.9,L:4.3,bh:.6,ch:.6,cz:-.2,cl:2.0},sports:{W:1.95,L:4.4,bh:.5,ch:.46,cz:-.1,cl:1.7},suv:{W:2.0,L:4.5,bh:.82,ch:.74,cz:-.3,cl:2.5},hatch:{W:1.75,L:3.7,bh:.6,ch:.62,cz:-.35,cl:1.9}};
function buildCar(color,o){o=o||{};const sp=SHAPES[o.shape||'sedan'],g=new T.Group(),b=new T.Group();g.add(b);
 const paint=new T.MeshPhongMaterial({color,shininess:90,specular:0x777777}),dark=new T.MeshPhongMaterial({color:0x14171b,shininess:30}),glass=new T.MeshPhongMaterial({color:0x1b2733,shininess:140,specular:0xbbbbbb,transparent:true,opacity:.84});
 const part=(w,h,d,m,x,y,z)=>{const q=new T.Mesh(new T.BoxGeometry(w,h,d),m);q.position.set(x,y,z);q.castShadow=true;b.add(q);return q;};
 const by=.3+sp.bh/2;part(sp.W,sp.bh,sp.L,paint,0,by,0);part(sp.W-.12,.2,sp.L*.3,paint,0,.3+sp.bh+.1,sp.L*.3);
 part(sp.W-.2,sp.ch,sp.cl,glass,0,.3+sp.bh+sp.ch/2,sp.cz);part(sp.W-.15,.07,sp.cl-.1,paint,0,.3+sp.bh+sp.ch+.035,sp.cz);
 part(sp.W+.05,.22,.25,dark,0,.42,sp.L/2);part(sp.W+.05,.22,.25,dark,0,.42,-sp.L/2);
 const head=new T.MeshBasicMaterial({color:0xcfd6dc}),tail=new T.MeshBasicMaterial({color:0x5a0000});
 for(const s of[-1,1]){part(.4,.16,.1,head,s*(sp.W/2-.3),.62,sp.L/2+.02);part(.4,.14,.1,tail,s*(sp.W/2-.3),.64,-sp.L/2-.02);}
 const tire=new T.MeshPhongMaterial({color:0x0e0e10,shininess:10}),hub=new T.MeshPhongMaterial({color:0xb8bec6,shininess:80}),fw=[],rw=[],spin=[];
 for(const sx of[-1,1])for(const sz of[1,-1]){const wg=new T.Group();wg.position.set(sx*(sp.W/2-.02),.36,sz*(sp.L/2-.85));const t=new T.Mesh(new T.CylinderGeometry(.36,.36,.26,16).rotateZ(PI/2),tire);t.castShadow=true;
  const hh=new T.Mesh(new T.CylinderGeometry(.2,.2,.28,10).rotateZ(PI/2),hub);t.add(hh);wg.add(t);g.add(wg);spin.push(t);(sz>0?fw:rw).push(wg);}
 const spots=[];
 if(o.lights!==false){for(const s of[-1,1]){const sl=new T.SpotLight(0xfff0cf,0,60,.5,.6,1.4);sl.position.set(s*.6,.8,sp.L/2);const tg=new T.Object3D();tg.position.set(s*.6,.2,sp.L/2+16);g.add(sl,tg);sl.target=tg;spots.push(sl);}}
 const car={mesh:g,body:b,fw,rw,spin,head,tail,spots,paint,shape:o.shape||'sedan',x:0,z:0,h:0,vx:0,vz:0,vf:0,vl:0,steer:0,hp:100,brake:false,lightsOn:false,spinA:0,
  setLights(on){if(on===this.lightsOn)return;this.lightsOn=on;this.spots.forEach(s=>s.intensity=on?2.2:0);this.head.color.set(on?0xfff4c8:0xcfd6dc);}};
 return car;}
G.buildCar=buildCar;G.SHAPES=SHAPES;

/* ───────── player car + physics ───────── */
const car=G.car=buildCar('#c9372c',{shape:'sedan'});
scene.add(car.mesh);car.x=46;car.z=536.2;car.h=PI/2;
const W={type:'clear',cloud:0,rain:0,fog:.0013,dark:0,storm:0,wet:0};G.W=W;
const WT={clear:{cloud:0,rain:0,fog:.0013,dark:0,storm:0},cloudy:{cloud:.6,rain:0,fog:.0022,dark:.25,storm:0},rain:{cloud:.85,rain:.75,fog:.004,dark:.5,storm:0},storm:{cloud:1,rain:1,fog:.0055,dark:.7,storm:1},fog:{cloud:.5,rain:0,fog:.012,dark:.3,storm:0}};
let WTarget=WT.clear,weatherHold=0;
G.setWeather=function(type,hold){if(!WT[type])return false;W.type=type;WTarget=WT[type];weatherHold=hold==null?240:hold;return true;};

function resolve(px,pz,r){let nx=0,nz=0,hit=false;
 for(const b of G.colliders){if(px<b.x0-r||px>b.x1+r||pz<b.z0-r||pz>b.z1+r)continue;
  const cx=clamp(px,b.x0,b.x1),cz=clamp(pz,b.z0,b.z1);let dx=px-cx,dz=pz-cz,d=Math.hypot(dx,dz);
  if(d>=r)continue;
  if(d<1e-4){const l=px-b.x0,rt=b.x1-px,tp=pz-b.z0,bt=b.z1-pz,m=Math.min(l,rt,tp,bt);dx=m===l?-1:m===rt?1:0;dz=m===tp?-1:m===bt?1:0;d=0;}else{dx/=d;dz/=d;}
  const pen=r-d;px+=dx*pen;pz+=dz*pen;nx+=dx;nz+=dz;hit=true;}
 const cc=(c)=>{const dx=px-c.x,dz=pz-c.z,rs=r+c.r;if(Math.abs(dx)>rs||Math.abs(dz)>rs)return;const d=Math.hypot(dx,dz);if(d>=rs)return;const ux=d>1e-4?dx/d:1,uz=d>1e-4?dz/d:0;px+=ux*(rs-d);pz+=uz*(rs-d);nx+=ux;nz+=uz;hit=true;};
 for(const c of G.circles)cc(c);
 for(const pv of G.circleProviders){const l=pv();for(const c of l)cc(c);}
 const m=Math.hypot(nx,nz);return{x:px,z:pz,hit,nx:m?nx/m:0,nz:m?nz/m:0};}
G.resolve=resolve;
function collideCar(c){let hs=0;const fx=Math.sin(c.h),fz=Math.cos(c.h);
 for(const o of[1.3,-1.3]){const res=resolve(c.x+fx*o,c.z+fz*o,1.05);if(!res.hit)continue;c.x+=res.x-(c.x+fx*o);c.z+=res.z-(c.z+fz*o);
  const vn=c.vx*res.nx+c.vz*res.nz;if(vn<0){c.vx-=1.3*vn*res.nx;c.vz-=1.3*vn*res.nz;hs=Math.max(hs,-vn);}}
 c.x=clamp(c.x,-60,SIZE+60);c.z=clamp(c.z,-60,SIZE+60);
 if(hs>3.5){c.hp=Math.max(0,c.hp-(hs-3)*2.4);if(c===car){camState.shake=Math.min(1.2,hs*.08);burst(500,.35,Math.min(.5,hs*.04));if(hs>7)G.event('crash');}if(G.onCrash)G.onCrash(c,hs);}
 return hs;}
G.stepCar=function(c,inp,dt){const wet=W.wet,hb=!!inp.hb,maxV=(c.maxV||42)*(c.hp<35?.75:1),acc=c.acc||1;
 const tg=clamp(inp.steer||0,-1,1);c.steer+=(tg-c.steer)*Math.min(1,dt*(tg===0?6:9));
 let fx=Math.sin(c.h),fz=Math.cos(c.h),lx=Math.cos(c.h),lz=-Math.sin(c.h);
 let vf=c.vx*fx+c.vz*fz,vl=c.vx*lx+c.vz*lz;
 const ms=.5/(1+Math.pow(Math.abs(vf)/14,2)),yaw=vf*Math.tan(ms*c.steer)/2.7*(hb?1.5:1);
 c.h+=yaw*dt;fx=Math.sin(c.h);fz=Math.cos(c.h);lx=Math.cos(c.h);lz=-Math.sin(c.h);vf=c.vx*fx+c.vz*fz;vl=c.vx*lx+c.vz*lz;
 const thr=clamp(inp.thr||0,-1,1);let a=0;
 if(thr>0)a=thr*13*acc*Math.max(0,1-vf/maxV)*(1-.3*wet);
 else if(thr<0){if(vf>.6)a=-22*(-thr)*(1-.15*wet);else a=thr*6*Math.max(0,1+vf/9);}
 a-=vf*.035+Math.sign(vf)*.25;if(thr===0&&!hb)a-=Math.sign(vf)*1.2;if(hb)a-=Math.sign(vf)*18;
 vf+=a*dt;if(Math.abs(vf)<.05&&thr===0)vf=0;
 const grip=c.grip||(8.5-5*wet-(W.storm?1.2:0));vl*=Math.exp(-(hb?1.4:grip)*dt);
 c.vx=fx*vf+lx*vl;c.vz=fz*vf+lz*vl;c.x+=c.vx*dt;c.z+=c.vz*dt;c.vf=vf;c.vl=vl;c.brake=(thr<0&&vf>.6)||hb;c.thr=thr;c.acc2=a;
 return collideCar(c);};
G.syncCarMesh=function(c,dt){c.mesh.position.set(c.x,0,c.z);c.mesh.rotation.y=c.h;c.spinA+=c.vf*dt/.36;
 for(const t of c.spin)t.rotation.x=c.spinA;for(const w of c.fw)w.rotation.y=c.steer*.45;
 c.body.rotation.x+=((-clamp(c.acc2||0,-8,8)*.004)-c.body.rotation.x)*Math.min(1,dt*6);c.body.rotation.z+=((clamp(c.vl,-6,6)*.012)-c.body.rotation.z)*Math.min(1,dt*6);
 c.tail.color.set(c.brake?0xff2a1a:(c.lightsOn?0x9a0a0a:0x5a0000));};

/* road helpers + routing */
function nearNode(x,z){return[clamp(Math.round((x-RW/2)/P),0,NB),clamp(Math.round((z-RW/2)/P),0,NB)];}
function roadPoint(x,z){const i=clamp(Math.round((x-RW/2)/P),0,NB),j=clamp(Math.round((z-RW/2)/P),0,NB);
 if(Math.abs(x-roadC(i))<=Math.abs(z-roadC(j))){const zc=clamp(z,roadC(0),roadC(NB)),j0=clamp(Math.floor((zc-RW/2)/P),0,NB-1);return{x:roadC(i),z:zc,ends:[[i,j0],[i,j0+1]]};}
 const xc=clamp(x,roadC(0),roadC(NB)),i0=clamp(Math.floor((xc-RW/2)/P),0,NB-1);return{x:xc,z:roadC(j),ends:[[i0,j],[i0+1,j]]};}
function dijkstra(si,sj,sd,gi,gj){const N=NB+1,INF=1e9,cost=new Array(N*N*4).fill(INF),prev=new Array(N*N*4).fill(-1),done=new Array(N*N*4).fill(false),D=[[1,0],[0,1],[-1,0],[0,-1]];
 const id=(i,j,d)=>(i*N+j)*4+d;cost[id(si,sj,sd)]=0;
 for(;;){let b=-1,bc=INF;for(let k=0;k<cost.length;k++)if(!done[k]&&cost[k]<bc){bc=cost[k];b=k;}if(b<0)break;done[b]=true;
  const d=b%4,ij=(b-d)/4,j=ij%N,i=(ij-j)/N;
  if(i===gi&&j===gj){const out=[];let k=b;while(k>=0){const dd=k%4,q=(k-dd)/4,jj=q%N,ii=(q-jj)/N;out.push([ii,jj]);k=prev[k];}out.reverse();
   return{nodes:out.filter((n,ix)=>ix===0||n[0]!==out[ix-1][0]||n[1]!==out[ix-1][1]),cost:bc};}
  for(let nd=0;nd<4;nd++){if(nd===(d+2)%4)continue;const ni=i+D[nd][0],nj=j+D[nd][1];if(ni<0||nj<0||ni>NB||nj>NB)continue;const c=bc+1+(nd!==d?.7:0),k=id(ni,nj,nd);if(c<cost[k]){cost[k]=c;prev[k]=b;}}}
 return null;}
const dirOf=h=>{const fx=Math.sin(h),fz=Math.cos(h);return Math.abs(fx)>Math.abs(fz)?(fx>0?0:2):(fz>0?1:3);};
function route(x,z,h,tx,tz,laneOff){laneOff=laneOff==null?3.8:laneOff;const rp=roadPoint(tx,tz),fx=Math.sin(h),fz=Math.cos(h);
 let best=null,bc=1e9;
 for(let i=0;i<=NB;i++)for(let j=0;j<=NB;j++){const dx=roadC(i)-x,dz=roadC(j)-z,d=Math.hypot(dx,dz);if(d>130)continue;const ang=d>1?Math.acos(clamp((dx*fx+dz*fz)/d,-1,1)):0,c=d+(ang>1.2?70:0);if(c<bc){bc=c;best=[i,j];}}
 if(!best)best=nearNode(x,z);
 const sd2=dirOf(h);let res=null;for(const e of rp.ends){const r=dijkstra(best[0],best[1],sd2,e[0],e[1]);if(r&&(!res||r.cost<res.cost))res=r;}
 const nodes=res?res.nodes:[best],pts=[];
 for(let k=0;k<nodes.length-1;k++){const ax=roadC(nodes[k][0]),az=roadC(nodes[k][1]),bx=roadC(nodes[k+1][0]),bz=roadC(nodes[k+1][1]),L=Math.hypot(bx-ax,bz-az)||1,dx=(bx-ax)/L,dz=(bz-az)/L,ox=dz*laneOff,oz=-dx*laneOff;
  pts.push({x:ax+ox,z:az+oz},{x:bx+ox,z:bz+oz});}
 const ln=nodes[nodes.length-1],lx=roadC(ln[0]),lz=roadC(ln[1]),L=Math.hypot(rp.x-lx,rp.z-lz);
 if(L>1){const dx=(rp.x-lx)/L,dz=(rp.z-lz)/L;pts.push({x:rp.x+dz*laneOff,z:rp.z-dx*laneOff});}else if(!pts.length)pts.push({x:rp.x,z:rp.z});
 return{pts,dest:{x:rp.x,z:rp.z}};}
Object.assign(G,{route,roadPoint,nearNode});

/* ───────── audio ───────── */
let AC=null,noiseBuf=null,eng=null,rainG=null;
function initAudio(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();const len=AC.sampleRate*2;noiseBuf=AC.createBuffer(1,len,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
 const o=AC.createOscillator(),o2=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=520;g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g);g.connect(AC.destination);o.start();o2.start();eng={o,o2,f,g};
 const rs=AC.createBufferSource();rs.buffer=noiseBuf;rs.loop=true;const rf=AC.createBiquadFilter();rf.type='lowpass';rf.frequency.value=2600;rainG=AC.createGain();rainG.gain.value=0;rs.connect(rf);rf.connect(rainG);rainG.connect(AC.destination);rs.start();}catch(e){AC=null;}}
function burst(freq,dur,vol,type){if(!AC)return;const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq;const g=AC.createGain();g.gain.setValueAtTime(vol,AC.currentTime);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+dur);s.connect(f);f.connect(g);g.connect(AC.destination);s.start();s.stop(AC.currentTime+dur+.05);}
function tone(freq,dur,vol,type,f2){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.setValueAtTime(freq,AC.currentTime);if(f2)o.frequency.linearRampToValueAtTime(f2,AC.currentTime+dur);g.gain.setValueAtTime(vol,AC.currentTime);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+dur);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+dur+.05);}
Object.assign(G,{burst,tone,initAudio,audioCtx:()=>AC,noiseBuf:()=>noiseBuf});
const honk=()=>{tone(420,.55,.07,'square');tone(530,.55,.05,'square');};

/* ───────── input ───────── */
const keys={};let touch={l:false,r:false,gas:false,brake:false,hb:false};
G.keys=keys;G.touch=touch;
function manualInp(){const thr=(keys.w||keys.arrowup||touch.gas?1:0)-(keys.s||keys.arrowdown||touch.brake?1:0),st=(keys.a||keys.arrowleft||touch.l?1:0)-(keys.d||keys.arrowright||touch.r?1:0),hb=!!(keys[' ']||touch.hb);
 return{thr,steer:st,hb,active:thr!==0||st!==0||hb};}
G.manualInp=manualInp;
function bindHold(id,key){const b=$(id);if(!b)return;const on=e=>{e.preventDefault();touch[key]=true;b.classList.add('on');initAudio();},off=e=>{e.preventDefault();touch[key]=false;b.classList.remove('on');};
 b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);b.addEventListener('contextmenu',e=>e.preventDefault());}

/* ───────── autopilot ───────── */
const AP={queue:[],cur:null,cruise:null};G.AP=AP;
const spd=kmh=>{const v=car.vf*3.6,e=kmh-v;let t=clamp(e*.1,-1,1);if(t<0&&car.vf<.5)t=0;return t;};
function cardinal(h){return Math.round(h/(PI/2))*(PI/2);}
function laneInp(c){const h=c.h,hc=cardinal(h),fx=Math.round(Math.sin(hc)),fz=Math.round(Math.cos(hc)),l=[fz,-fx];let e;
 if(fx===0){const i=clamp(Math.round((c.x-RW/2)/P),0,NB),lane=roadC(i)+l[0]*3.8;e=(c.x-lane)*l[0];}
 else{const j=clamp(Math.round((c.z-RW/2)/P),0,NB),lane=roadC(j)+l[1]*3.8;e=(c.z-lane)*l[1];}
 const target=hc-clamp(e*.07,-.45,.45);return{steer:clamp(2.4*wrapA(target-h),-1,1)};}
function nextCross(c){const hc=cardinal(c.h),fx=Math.round(Math.sin(hc)),fz=Math.round(Math.cos(hc));let best=1e9;
 for(let k=0;k<=NB;k++){const d=fx?fx*(roadC(k)-c.x):fz*(roadC(k)-c.z);if(d>1&&d<best)best=d;}return best;}
function aheadDyn(c){const fx=Math.sin(c.h),fz=Math.cos(c.h);if(!G.circleProviders.length)return 99;
 for(let d=3;d<=40;d+=2){const px=c.x+fx*d,pz=c.z+fz*d;for(const pv of G.circleProviders)for(const o of pv()){if(o.self===c)continue;if(Math.hypot(px-o.x,pz-o.z)<o.r+1.4)return d;}}return 99;}
function staticAhead(maxD){const fx=Math.sin(car.h),fz=Math.cos(car.h);for(let d=2;d<=maxD;d+=1.5){const px=car.x+fx*d,pz=car.z+fz*d;
 for(const b of G.colliders)if(px>b.x0&&px<b.x1&&pz>b.z0&&pz<b.z1)return d;}return maxD+1;}
function autoInputs(){let o=null;
 if(AP.cur&&AP.cur.ctl)o=AP.cur.ctl();else if(AP.cruise!=null){const l=laneInp(car);o={steer:l.steer,kmh:AP.cruise};}
 if(!o)return null;if(o.raw)return o.raw;
 let kmh=o.kmh;const d=aheadDyn(car),need=car.vf*car.vf/14+7;if(d<need)kmh=Math.min(kmh,Math.max(0,(d-6)*2));
 return{thr:spd(kmh),steer:o.steer,hb:!!o.hb};}
const A=G.actions,instant=(fn,name)=>a=>{fn(a||{});return{name,update:()=>true};};
A.speed=instant(a=>{AP.cruise=a.kmh==null?40:clamp(+a.kmh||0,0,110);},'speed');
const stopAct=()=>{AP.cruise=0;let t=0;return{name:'stop',update(dt){t+=dt;return(Math.abs(car.vf)<.4)||t>9;}};};
A.stop=stopAct;A.park=stopAct;
A.drive=a=>{let t=0;const secs=clamp(+a.secs||1,.1,15);return{name:'drive',ctl:()=>({raw:{thr:clamp(+a.throttle||0,-1,1),steer:clamp(+a.steer||0,-1,1),hb:!!a.hb}}),update(dt){t+=dt;return t>=secs;}};};
A.reverse=a=>A.drive({throttle:-.7,steer:a&&a.steer||0,secs:a&&a.secs||2.2});
A.wait=a=>{let t=0;const s=clamp(+a.secs||1,.1,30);return{name:'wait',update(dt){t+=dt;return t>=s;}};};
A.turn=a=>{const around=['around','back','uturn'].includes(a.dir),dir=a.dir==='right'?-1:1,deg=(around?180:clamp(+a.deg||90,10,180))*PI/180;
 const now=around||a.at==='now';let phase=now?1:0,target=null,t=0;const restore=!AP.cruise;if(restore)AP.cruise=25;
 const done=()=>{if(restore)AP.cruise=null;};
 return{name:'turn',ctl(){if(phase===0){const d=nextCross(car);if(d>9500||d<=(dir>0?10:9))phase=1;else return{steer:laneInp(car).steer,kmh:d<30?Math.min(AP.cruise||25,22):(AP.cruise||25)};}
  if(target===null)target=car.h+dir*deg;return{steer:clamp(2.6*wrapA(target-car.h),-1,1),kmh:around?12:Math.min(AP.cruise||25,22)};},
  update(dt){t+=dt;if(phase===1&&target!==null&&Math.abs(wrapA(target-car.h))<.1){done();return true;}if(t>30){done();return true;}return false;},cancel:done};};
A.goto=a=>{const lm=LM.find(l=>l.id===a.place||(a.place&&l.name.toLowerCase()===String(a.place).toLowerCase()));let tx,tz,name;
 if(lm){tx=lm.stop.x;tz=lm.stop.z;name=lm.name;}else if(a.x!=null&&a.z!=null){tx=+a.x;tz=+a.z;name='Target';}else{toast('Jagah samajh nahi aayi');return{update:()=>true};}
 const r=route(car.x,car.z,car.h,tx,tz),pts=r.pts,dest=r.dest;let idx=0;const kmh=clamp(+a.kmh||45,15,90);
 const mk={id:'ap_dest',x:dest.x,z:dest.z,color:'#ffd23f',label:name};G.markers.push(mk);const clean=()=>{const i=G.markers.indexOf(mk);if(i>=0)G.markers.splice(i,1);};
 return{name:'goto '+name,ctl(){const dist=Math.hypot(dest.x-car.x,dest.z-car.z);while(idx<pts.length-1&&Math.hypot(pts[idx].x-car.x,pts[idx].z-car.z)<6+car.vf*.3)idx++;
   const p=pts[idx],err=wrapA(Math.atan2(p.x-car.x,p.z-car.z)-car.h);let v=kmh;if(Math.abs(err)>.4)v=Math.min(v,22);v=Math.min(v,Math.max(0,(dist-4)*3));return{steer:clamp(2.4*err,-1,1),kmh:v};},
  update(){const dist=Math.hypot(dest.x-car.x,dest.z-car.z);if(dist<9&&Math.abs(car.vf)<1.5||dist<5){AP.cruise=0;clean();G.event('arrive',{name,hi:lm?LMHI[lm.id]:'यहाँ'},true);return true;}return false;},cancel:clean};};
A.honk=instant(()=>honk(),'honk');
A.lights=instant(a=>{G.carLights=a.on===false?false:true;},'lights');
A.weather=instant(a=>{if(!G.setWeather(a.type,300))toast('Mausam samajh nahi aaya');},'weather');
A.time=instant(a=>{const P2={morning:7,noon:12,evening:18.3,night:22,midnight:0,dawn:5.8};G.time=a.hour!=null?((+a.hour%24)+24)%24:(P2[a.preset]!=null?P2[a.preset]:G.time);},'time');
A.camera=instant(a=>{camState.mode=a.mode==='far'?1:a.mode==='hood'?2:a.mode==='chase'?0:(camState.mode+1)%3;},'camera');
A.ui=instant(a=>{G.setUI(a.controls!==false);},'ui');
A.mic=instant(a=>{S.mic=a.on!==false;G.saveS();applyMicUI();},'mic');
A.respawn=instant(()=>respawnCar(),'respawn');
A.look=a=>{let done=false;describeScene(a.q||'').then(()=>{done=true;},()=>{done=true;});return{name:'look',update:()=>done};};
function respawnCar(){const rp=roadPoint(car.x,car.z),hc=cardinal(car.h);car.x=rp.x+Math.cos(hc)*3.8;car.z=rp.z-Math.sin(hc)*3.8;car.h=hc;car.vx=car.vz=car.vf=car.vl=0;car.steer=0;if(car.hp<30)car.hp=30;G.snapCam();}
G.respawnCar=respawnCar;
const DRIVE=new Set(['speed','drive','reverse','turn','goto','stop','park','wait','walk']);G.DRIVE=DRIVE;

function runPlan(p){say(p.say,p.speak,p.speak_lang);const acts=(p.actions||[]).filter(a=>a&&typeof a.a==='string');
 if(acts.some(a=>DRIVE.has(a.a)))cancelAll();acts.forEach(a=>AP.queue.push(a));}
function cancelAll(){AP.queue.length=0;if(AP.cur&&AP.cur.cancel)AP.cur.cancel();AP.cur=null;AP.cruise=null;}
G.cancelAll=cancelAll;G.runPlan=runPlan;G.stepQueue=(dt)=>stepQueue(dt);
function stepQueue(dt){if(!AP.cur&&AP.queue.length){const a=AP.queue.shift(),f=A[a.a];if(f){try{AP.cur=f(a)||null;}catch(e){console.warn('action',a,e);AP.cur=null;}}}
 if(AP.cur){let d=true;try{d=AP.cur.update?AP.cur.update(dt):true;}catch(e){console.warn(e);}if(d){AP.cur=null;}}}

/* ───────── camera ───────── */
const camTmp=new T.Vector3(),camState={mode:0,pos:new T.Vector3(),shake:0,fovAdd:0};G.camTmp=camTmp;G.camState=camState;
G.snapCam=()=>{camState.snap=true;};
G.focusPos=()=>({x:car.x,z:car.z});G.focusH=()=>car.h;
function carCam(dt){const c=car,fx=Math.sin(c.h),fz=Math.cos(c.h),m=camState.mode;let fov=62+clamp(Math.abs(c.vf)*.7,0,18);
 if(m===2){camera.position.set(c.x+fx*.35,1.38,c.z+fz*.35);camera.lookAt(c.x+fx*20,1.25,c.z+fz*20);}
 else{const d=m===1?15:8.4,hh=m===1?7.5:3.3,tx=c.x-fx*d,tz=c.z-fz*d;
  if(camState.snap){camState.pos.set(tx,hh,tz);camState.snap=false;}else camState.pos.lerp(camTmp.set(tx,hh,tz),1-Math.exp(-dt*5));
  camera.position.copy(camState.pos);camera.lookAt(c.x+fx*5,1.5,c.z+fz*5);}
 camState.fov=fov+camState.fovAdd;}
function applyCam(dt){if(!(G.camHook&&G.camHook(dt)))carCam(dt);
 if(camState.shake>0){camera.position.x+=(Math.random()-.5)*camState.shake;camera.position.y+=(Math.random()-.5)*camState.shake;camState.shake=Math.max(0,camState.shake-dt*2.2);}
 const f=camState.fov||62;if(Math.abs(camera.fov-f)>.05){camera.fov+=(f-camera.fov)*Math.min(1,dt*4);camera.updateProjectionMatrix();}}

/* ───────── sky / weather update ───────── */
const KF=[[0,'#04070f','#101a30',0,.22,1],[5,'#16203d','#3c4a6e',0,.25,.85],[6,'#3a4f86','#f2a36b',.5,.4,.35],[8,'#3f7fcb','#cfe3f2',1.1,.62,0],[12,'#2e7ed6','#cfe8fb',1.35,.7,0],[16.5,'#3c78bd','#f5deb5',1.15,.64,0],[18.3,'#3f4f93','#f08a52',.55,.42,.3],[19.5,'#161a3d','#4a3f6a',0,.28,.85],[21,'#060a18','#141c34',0,.22,1],[24,'#04070f','#101a30',0,.22,1]]
 .map(k=>({t:k[0],top:new T.Color(k[1]),bot:new T.Color(k[2]),sun:k[3],hemi:k[4],night:k[5]}));
const tmpC1=new T.Color(),tmpC2=new T.Color(),cFlashT=new T.Color('#dfe8ff'),cFlashB=new T.Color('#e8eeff'),cWhite=new T.Color('#ffffff'),bgIndoor=new T.Color('#14110e'),cTop=new T.Color(),cBot=new T.Color(),grey=new T.Color('#69737c'),sunWarm=new T.Color('#fff1d8'),sunDusk=new T.Color('#ff9a5a');
let flash=0,flashT=6,thunderQ=[];G.night=0;
function skyUpdate(dt){
 for(const k of['cloud','rain','fog','dark','storm'])W[k]+=(WTarget[k]-W[k])*Math.min(1,dt*.35);
 W.wet+=((W.rain>.2?1:0)-W.wet)*Math.min(1,dt*(W.rain>.2?.25:.06));
 let a=KF[0],b=KF[1];for(let i=0;i<KF.length-1;i++)if(G.time>=KF[i].t&&G.time<=KF[i+1].t){a=KF[i];b=KF[i+1];break;}
 const f=(G.time-a.t)/(b.t-a.t||1);cTop.copy(a.top).lerp(b.top,f);cBot.copy(a.bot).lerp(b.bot,f);
 const sunI=a.sun+(b.sun-a.sun)*f,hemiI=a.hemi+(b.hemi-a.hemi)*f,night=a.night+(b.night-a.night)*f;G.night=night;
 const dk=W.dark,lum=1-night*.8;cTop.lerp(tmpC1.copy(grey).multiplyScalar(.55*lum+.1),dk*.85);cBot.lerp(tmpC2.copy(grey).multiplyScalar(.8*lum+.12),dk*.85);
 if(W.storm){flashT-=dt;if(flashT<=0){flash=1;flashT=rnd(3,9);thunderQ.push(rnd(.4,2.2));}}
 flash=Math.max(0,flash-dt*3.5);for(let i=thunderQ.length-1;i>=0;i--){thunderQ[i]-=dt;if(thunderQ[i]<=0){burst(220,2.2,.5);thunderQ.splice(i,1);}}
 if(flash>0){cTop.lerp(cFlashT,flash*.6);cBot.lerp(cFlashB,flash*.6);}
 skyU.top.value.copy(cTop);skyU.bot.value.copy(cBot);scene.fog.color.copy(cBot);scene.fog.density=W.fog+(G.indoor?-W.fog:0);
 const day=G.time>=6&&G.time<=18,t2=day?(G.time-6)/12:(((G.time<6?G.time+24:G.time))-18)/12,el=Math.max(.1,Math.sin(t2*PI)),az=Math.cos(t2*PI);
 const fp=G.focusPos();sun.position.set(fp.x+(day?az:-az)*130,el*150+10,fp.z+70);sun.target.position.set(fp.x,0,fp.z);
 moon.position.set(fp.x+(day?-az:az)*130,el*150+10,fp.z-70);moon.target.position.set(fp.x,0,fp.z);
 sun.color.copy(sunWarm).lerp(sunDusk,clamp(night*1.2,0,1)*(sunI>0?1:0));sun.intensity=G.indoor?0:sunI*(1-dk*.72);moon.intensity=G.indoor?0:night*.34*(1-dk*.5);
 hemi.intensity=G.indoor?.28:hemiI*(1-dk*.15)+flash*2.2;hemi.color.copy(cTop).lerp(cWhite,.55);
 stars.material.opacity=clamp(night*1.1-dk,0,1);
 const em=clamp(night*1.15+dk*.35,0,1)*(G.indoor?0:1);for(const m of bMats)m.emissiveIntensity=em;if(G.lampPts)G.lampPts.material.opacity=clamp(night*1.3+dk*.4,0,1)*(G.indoor?0:1);
 roadMats.forEach(m=>{m.roughness=.92-.5*W.wet;m.color.setScalar(1-.28*W.wet);});
 const wantL=G.carLights!=null?G.carLights:(night>.35||W.rain>.3||dk>.5);car.setLights(!!wantL);
 sky.position.copy(camera.position);stars.position.copy(camera.position);
 if(rainG)rainG.gain.setTargetAtTime(G.indoor?.02:W.rain*.11,AC.currentTime,.3);}
/* rain streaks */
const RN=2200,rainPos=new Float32Array(RN*6),rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rainPos,3));
const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xcfe0f5,transparent:true,opacity:.34,depthWrite:false,fog:false}));rain.frustumCulled=false;scene.add(rain);
const rd=[];for(let i=0;i<RN;i++)rd.push({x:rnd(-30,30),y:rnd(-10,20),z:rnd(-30,30)});
function rainUpdate(dt){const n=G.indoor?0:Math.floor(RN*clamp(W.rain,0,1)*(Q===0?.28:1));rain.visible=n>0;if(!n)return;rain.position.copy(camera.position);rainGeo.setDrawRange(0,n*2);
 const wx=W.storm?.9:.3;for(let i=0;i<n;i++){const d=rd[i];d.y-=38*dt;if(d.y<-10){d.y=20;d.x=rnd(-30,30);d.z=rnd(-30,30);}
  const o=i*6;rainPos[o]=d.x;rainPos[o+1]=d.y;rainPos[o+2]=d.z;rainPos[o+3]=d.x+wx*.5;rainPos[o+4]=d.y+1;rainPos[o+5]=d.z;}
 rainGeo.attributes.position.needsUpdate=true;}

/* ───────── HUD / minimap ───────── */
const mini=$('mini'),mctx=mini.getContext('2d'),SC=.5;
const staticMap=document.createElement('canvas');staticMap.width=staticMap.height=Math.ceil(SIZE*SC);
(function(){const g=staticMap.getContext('2d');g.fillStyle='#1f2a24';g.fillRect(0,0,staticMap.width,staticMap.height);
 for(let bx=0;bx<NB;bx++)for(let bz=0;bz<NB;bz++){const park=PARKS.has(bx+','+bz)||(lmAt(bx,bz)&&lmAt(bx,bz).kind==='park');g.fillStyle=park?'#2f5c3a':'#2c3541';g.fillRect(blk0(bx)*SC,blk0(bz)*SC,BS*SC,BS*SC);}
 g.fillStyle='#5a6068';for(let i=0;i<=NB;i++){g.fillRect((roadC(i)-RW/2)*SC,0,RW*SC,staticMap.height);g.fillRect(0,(roadC(i)-RW/2)*SC,staticMap.width,RW*SC);}
 g.fillStyle='#8a9098';for(let i=0;i<=NB;i++){g.fillRect(roadC(i)*SC-.5,0,1,staticMap.height);g.fillRect(0,roadC(i)*SC-.5,staticMap.width,1);}
 g.font='bold 15px sans-serif';g.textAlign='center';g.textBaseline='middle';
 for(const l of LM){g.fillStyle=l.color;g.beginPath();g.arc(l.x*SC,l.z*SC,7,0,7);g.fill();g.fillStyle='#10171d';g.fillText(l.id.startsWith('home')?'H':l.name[0],l.x*SC,l.z*SC+1);}})();
function drawMini(){const g=mctx,w=mini.width,fp=G.focusPos(),h=G.focusH(),sc=SC*(w/180)*.95;
 g.clearRect(0,0,w,w);g.save();g.beginPath();g.arc(w/2,w/2,w/2-2,0,7);g.clip();g.fillStyle='#10171d';g.fillRect(0,0,w,w);
 g.translate(w/2,w/2);g.rotate(h-PI);g.scale(sc/SC,sc/SC);g.translate(-fp.x*SC,-fp.z*SC);g.drawImage(staticMap,0,0);
 for(const m of G.markers){const x=m.x*SC,z=m.z*SC;g.fillStyle=m.color||'#fff';g.strokeStyle='#000';g.lineWidth=2;g.beginPath();g.arc(x,z,(m.big?9:6),0,7);g.fill();g.stroke();}
 g.restore();
 g.save();g.translate(w/2,w/2);g.fillStyle='#4fd1e8';g.strokeStyle='#071016';g.lineWidth=3;g.beginPath();g.moveTo(0,-14);g.lineTo(10,11);g.lineTo(0,6);g.lineTo(-10,11);g.closePath();g.stroke();g.fill();g.restore();}
const WXI={clear:'☀ Clear',cloudy:'☁ Cloudy',rain:'🌧 Rain',storm:'⛈ Storm',fog:'🌫 Fog'};
function fmtTime(){const h=Math.floor(G.time),m=Math.floor((G.time-h)*60);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}
let hudT=0;
function hud(dt){const sp=G.mode==='car'?Math.abs(car.vf)*3.6:(G.footSpeed||0)*3.6;$('kmh').textContent=Math.round(sp);
 hudT-=dt;if(hudT<=0){hudT=.25;$('clock').textContent='🕒 '+fmtTime();$('wx').textContent=WXI[W.type]||W.type;$('hpi').style.width=(G.hudHp!=null?G.hudHp:car.hp)+'%';$('hpi').style.background=(G.hudHp!=null?G.hudHp:car.hp)<30?'#ff6b5e':'#4fd1e8';}}
G.setStat=html=>{const e=$('xstats');e.style.display=html?'block':'none';e.innerHTML=html||'';};
G.setMission=html=>{const e=$('mission');e.classList.toggle('on',!!html);e.innerHTML=html||'';};
let toastT=0;function toast(m,ms){const e=$('toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),ms||2200);}G.toast=toast;
G.setUI=on=>{G.uiOn=on;document.body.classList.toggle('clear',!on);};
G.fade=(fn,ms)=>{const f=$('fade');f.classList.add('on');setTimeout(()=>{try{fn();}catch(e){console.warn(e);}setTimeout(()=>f.classList.remove('on'),120);},ms||480);};

/* ───────── voice out / in ───────── */
let subT=0;
function say(text,speak,lang,you){const e=$('sub');if(!text&&!you)return;e.innerHTML=(you?`<div class="you">🎤 ${esc(you)}</div>`:'')+(text?`<div class="glass bot"><em>Saras</em> · ${esc(text)}</div>`:'');e.classList.add('on');
 clearTimeout(subT);subT=setTimeout(()=>e.classList.remove('on'),3800+(text||'').length*55);if(S.tts&&(speak||text))tts(speak||text,lang||'en-US');}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
G.say=say;
let voices=[];const loadV=()=>{try{voices=speechSynthesis.getVoices();}catch(e){}};if('speechSynthesis'in window){loadV();speechSynthesis.onvoiceschanged=loadV;}
function tts(text,lang){if(!('speechSynthesis'in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;
 const base=lang.slice(0,2),c=voices.filter(v=>v.lang.toLowerCase().startsWith(base));const v=c.find(x=>/female|zira|heera|neerja|swara|google/i.test(x.name))||c[0];if(v)u.voice=v;u.rate=.98;u.pitch=1.1;u.onstart=()=>{ttsBusy=true;ttsT=performance.now();stopRec();};const done=()=>{ttsBusy=false;if(wantListen)setTimeout(startRec,450);};u.onend=done;u.onerror=done;speechSynthesis.speak(u);}catch(e){ttsBusy=false;}}
let ttsBusy=false,ttsT=0;
let rec=null,listening=false,wantListen=false,pendingText='';const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function applyMicUI(){document.body.classList.toggle('nomic',!S.mic);if(!S.mic)setListen(false);}
function startRec(){if(!SR||!S.mic||!wantListen||rec||ttsBusy)return;const r=new SR();rec=r;r.lang=S.rec;r.interimResults=true;r.continuous=true;r.maxAlternatives=1;
 r.onstart=()=>{listening=true;$('mic').classList.add('on');};
 r.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];if(x.isFinal)heard(x[0].transcript);else interim+=x[0].transcript;}if(interim&&!ttsBusy)say('',null,null,interim);};
 r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){wantListen=false;toast('Mic ki ijazat do (browser settings)',2800);}};
 r.onend=()=>{listening=false;if(rec===r)rec=null;if(!wantListen)$('mic').classList.remove('on');if(wantListen&&S.mic&&!ttsBusy)setTimeout(startRec,400);};
 try{r.start();}catch(e){rec=null;}}
function stopRec(){const r=rec;if(r){try{r.stop();}catch(e){}}}
function setListen(on){wantListen=!!on&&S.mic&&!!SR;$('mic').classList.toggle('on',wantListen);if(wantListen)startRec();else stopRec();}
function toggleMic(){initAudio();if(!SR){toast('Is browser mein voice nahi — Chrome use karo, ya type karo',2600);return;}if(!S.mic){toast('Mic band hai (Settings mein on karo)');return;}setListen(!wantListen);toast(wantListen?'🎤 Mic hamesha on':'Mic pause',1200);}
function heard(t){t=(t||'').trim();if(!t)return;
 if(S.wake){const m=t.match(/\b(saras|sarus|sarah|sara)\b|सरस|سرس/i);if(!m)return;t=t.replace(m[0],'').trim()||'haan';}
 if(busyThink){pendingText=t;return;}handle(t);}
G.setListen=setListen;
if(typeof document.addEventListener==='function')document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRec();else if(wantListen)startRec();});

/* ───────── LLM brain ───────── */
const hist=[];let busyThink=false;
const isEn=t=>!/[^\x00-\x7F]/.test(t)&&!/\b(aage|agay|jao|karo|kar do|ruk|ruko|rukho|peeche|baen|dayen|mudo|chalo|batao|dekho|kya|hai|mujhe|ko|ki|se|ghar|barish|toofan|raat|subah|jaldi|seedha|gaari|gadi|rok|rakho)\b/i.test(t);
const compass=h=>{const d=(Math.atan2(Math.sin(h),-Math.cos(h))*180/PI+360)%360;return['north','north-east','east','south-east','south','south-west','west','north-west'][Math.round(d/45)%8];};
const relName=r=>Math.abs(r)<.6?'ahead':Math.abs(r)>2.4?'behind':r>0?'left':'right';
function stateForLLM(){const f=G.focusPos(),h=G.focusH();
 const near=LM.map(l=>{const dx=l.x-f.x,dz=l.z-f.z;return{id:l.id,name:l.name,m:Math.round(Math.hypot(dx,dz)),dir:relName(wrapA(Math.atan2(dx,dz)-h))};}).sort((a,b)=>a.m-b.m).slice(0,6);
 const s={mode:G.mode,speed_kmh:Math.round(Math.abs(car.vf)*3.6),heading:compass(h),weather:W.type,time:fmtTime(),hud_visible:G.uiOn,
  autopilot:AP.cur?(AP.cur.name||'busy'):(AP.cruise?'cruise '+AP.cruise+'kmh':'idle'),clear_road_ahead_m:Math.round(Math.min(80,staticAhead(80))),nearest_places:near};
 G.stateExtras.forEach(fn=>{try{Object.assign(s,fn());}catch(e){}});return s;}
function buildSystem(){return `You are Saras, the polite, warm, slightly witty in-game companion who drives/plays inside a 3D open-world city game together with the player. You understand English, Hindi, Urdu (Roman Urdu, Devanagari, Urdu script) and mixes. Understand INTENT, not exact words: "jaldi aage jao", "agey ki taraf chalo", "go ahead and see what's there", "thoda aage ja ke dekho" are all natural requests that you turn into sensible actions. The player controls everything by talking, so be flexible and helpful. Never refuse harmless game commands.

Reply with ONLY valid JSON (no markdown):
{"say":"...","speak":"...","speak_lang":"en-US or hi-IN","actions":[ ... ]}
- say: 2-3 friendly, CHATTY sentences (max ~45 words) shown as subtitle: acknowledge what you are doing, then add a small observation, tip or light joke about the city / weather / drive, and now and then end with a short follow-up question. Stay polite and warm. Use the player's language (Roman Urdu if they wrote Roman Urdu / Hindi-Urdu speech, English if English).
- speak: the same sentence for text-to-speech. English reply -> English text, speak_lang "en-US". Urdu/Hindi reply -> write it in Devanagari script so a Hindi voice pronounces it well, speak_lang "hi-IN".
- actions: executed IN ORDER. Use [] when only chatting or when you need no game action.

ACTIONS (car):
{"a":"speed","kmh":N}  cruise along the current road at N km/h (lane-keeping, left-hand traffic). "jao/chalo" ~40, "jaldi/tez" ~70, "aahista/slow" ~20, kmh 0 = stop.
{"a":"turn","dir":"left|right|around","deg":90,"at":"intersection|now"}  turns at the next intersection by default (use "now" for immediate); "around" = U-turn.
{"a":"goto","place":"<id>","kmh":45}  drive by road to a place id (see nearest_places / list below).
{"a":"stop"}  brake to a halt. {"a":"reverse","secs":2}  {"a":"wait","secs":N}
{"a":"drive","throttle":-1..1,"steer":-1..1,"secs":N,"hb":false}  raw control for stunts/drifts (steer + = left).
{"a":"look","q":"..."}  Saras looks through the camera and describes what she sees (use for "dekho/see/check what's there"; put it AFTER a move to inspect).
{"a":"honk"} {"a":"lights","on":true|false} {"a":"camera","mode":"chase|far|hood"} {"a":"respawn"} (puts the car back upright on the road)
{"a":"weather","type":"clear|cloudy|rain|storm|fog"} {"a":"time","preset":"morning|noon|evening|night"} or {"a":"time","hour":0-23}
{"a":"ui","controls":false}  hides all on-screen buttons/HUD ("clear screen", "buttons hatao"); {"a":"ui","controls":true} shows them again.
{"a":"mic","on":false}  turns voice recognition off.
PLACES (ids): home, petrol (Petrol Pump), hospital, police (Police Station), bazaar, mall (City Mall), park (Central Park), stadium, home2, home3.
RULES: Combine actions naturally, e.g. "aage jaake dekho kya hai" -> speed 30, wait 3, stop, look. "jao jaldi aage" -> speed 70. "left le lo" -> turn left. Keep cruising speed sensible (max ~90). After the player says stop/ruko always include {"a":"stop"}. If asked who you are: you are Saras. If something is impossible, say so kindly in 'say' with actions [].
${G.promptExtras.join('\n')}`;}
async function fetchT(url,opt,ms){const ac=new AbortController(),t=setTimeout(()=>ac.abort(),ms||10000);try{const r=await fetch(url,Object.assign({signal:ac.signal},opt));if(!r.ok)throw new Error(r.status+' '+(await r.text()).slice(0,140));return await r.json();}finally{clearTimeout(t);}}
const CALL={
 async groq(sys,msgs){const j=await fetchT('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.keys.groq},body:JSON.stringify({model:S.models.groq,messages:[{role:'system',content:sys},...msgs],temperature:.35,max_tokens:500,response_format:{type:'json_object'}})},9000);return j.choices[0].message.content;},
 async openrouter(sys,msgs){const j=await fetchT('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.keys.openrouter,'X-Title':'Saras City'},body:JSON.stringify({model:S.models.openrouter,messages:[{role:'system',content:sys},...msgs],temperature:.35,max_tokens:500})},14000);return j.choices[0].message.content;},
 async gemini(sys,msgs,img){const contents=msgs.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
  if(img)contents[contents.length-1].parts.push({inlineData:{mimeType:'image/jpeg',data:img}});
  const j=await fetchT(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(S.models.gemini)}:generateContent?key=${encodeURIComponent(S.keys.gemini)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents,generationConfig:{temperature:.35,maxOutputTokens:600,responseMimeType:'application/json'}})},11000);
  return j.candidates[0].content.parts.map(p=>p.text||'').join('');}};
function parseJSON(raw){try{const s=raw.indexOf('{'),e=raw.lastIndexOf('}');const j=JSON.parse(raw.slice(s,e+1));return j&&typeof j==='object'?j:null;}catch(e){return null;}}
let lastSrc='';
async function think(text,opt){opt=opt||{};const sys=buildSystem(),user=`STATE: ${JSON.stringify(stateForLLM())}\nPLAYER: ${text}`,msgs=[...hist.slice(-8),{role:'user',content:user}];
 const order=(opt.order||['groq','gemini','openrouter']).filter(p=>S.keys[p]);
 for(const p of order){try{const raw=await CALL[p](sys,msgs,opt.img);const j=parseJSON(raw);if(j){hist.push({role:'user',content:'PLAYER: '+text},{role:'assistant',content:raw.slice(0,420)});if(hist.length>16)hist.splice(0,hist.length-16);lastSrc=p;return j;}}
  catch(e){console.warn('LLM '+p+' failed',e);toast(p+' fail — agla try kar raha hoon',1500);}}
 return null;}
async function handle(text){text=(text||'').trim();if(!text||busyThink)return;busyThink=true;G.userLang=isEn(text)?'en':'ur';say('',null,null,text);$('think').classList.add('on');
 let plan=null;try{plan=await think(text);}catch(e){}
 $('think').classList.remove('on');if(!plan){plan=offline(text);lastSrc='offline';}
 busyThink=false;CH.idle=0;runPlan(plan);if(pendingText){const t=pendingText;pendingText='';setTimeout(()=>handle(t),60);}}
G.handle=handle;

/* look: vision via Gemini, else text brain, else state */
function screenshot(){return new Promise(res=>{G.shotReq=res;setTimeout(()=>{if(G.shotReq){G.shotReq=null;res(null);}},500);});}
async function describeScene(q){const en=G.userLang==='en';let plan=null;
 if(S.keys.gemini){try{const img=await screenshot();if(img){plan=await think(`(SYSTEM) Describe in 1-2 short sentences what Saras sees right now through the car camera (this screenshot). ${q||''} No driving actions needed, return actions [].`,{order:['gemini'],img:img.split(',')[1]});}}catch(e){}}
 if(!plan&&(S.keys.groq||S.keys.openrouter||S.keys.gemini))plan=await think(`(SYSTEM) Describe in 1-2 short sentences what Saras sees ahead using STATE (distance ahead, nearby places, weather, time). ${q||''} Return actions [].`);
 if(!plan){const d=Math.round(staticAhead(80)),n=stateForLLM().nearest_places[0];plan={say:en?`The road is clear for about ${d} m. ${n.name} is ${n.m} m ${n.dir}.`:`Samne takreeban ${d} meter raasta saaf hai. ${n.name} ${n.m} meter ${n.dir==='ahead'?'aage':n.dir==='left'?'baen taraf':n.dir==='right'?'dayen taraf':'peeche'} hai.`};}
 say(plan.say,plan.speak,plan.speak_lang);}

/* offline parser */
const LMW={home:/\b(ghar|home|house)\b|گھر|घर/,petrol:/petrol|pump|پمپ|पेट्रोल|पंप/,hospital:/hospital|aspatal|ہسپتال|अस्पताल/,police:/police|thana|پولیس|पुलिस|थाना/,bazaar:/bazaar|bazar|market|بازار|बाज़ार|बाजार/,mall:/\bmall\b|مال|मॉल/,park:/\bpark\b|bagh|پارک|पार्क|बाग/,stadium:/stadium|ground|اسٹیڈیم|स्टेडियम/};
function seg(s){const a=[],has=r=>r.test(s);
 if(has(/clear screen|screen (saaf|clear|khali)|buttons? (hatao|chupao|band|hide)|hide (the )?(ui|controls|buttons)|ui off|साफ़ स्क्रीन|बटन हटाओ/))return[{a:'ui',controls:false}];
 if(has(/(buttons?|controls?) (dikhao|show|wapas|on)|show (the )?(ui|controls|buttons)|बटन दिखाओ/))return[{a:'ui',controls:true}];
 if(has(/toofan|storm|طوفان|तूफ़ान|तूफान/))return[{a:'weather',type:'storm'}];
 if(has(/barish|baarish|rain|بارش|बारिश/))return[{a:'weather',type:'rain'}];
 if(has(/dhund|fog|کہر|धुंध/))return[{a:'weather',type:'fog'}];
 if(has(/badal|cloud|ابر|बादल/))return[{a:'weather',type:'cloudy'}];
 if(has(/saaf mausam|clear weather|sunny|dhoop|धूप/))return[{a:'weather',type:'clear'}];
 if(has(/raat|night|رات|रात/))return[{a:'time',preset:'night'}];
 if(has(/subah|morning|صبح|सुबह/))return[{a:'time',preset:'morning'}];
 if(has(/dopahar|noon|دوپہر|दोपहर/))return[{a:'time',preset:'noon'}];
 if(has(/shaam|evening|شام|शाम/))return[{a:'time',preset:'evening'}];
 if(has(/lights? (on|jala)|batti|headlight|लाइट/))return[{a:'lights',on:true}];
 if(has(/horn|honk|ہارن|हॉर्न/))return[{a:'honk'}];
 if(has(/dekho|dekh|look|see|check|photo|camera dekh|kya hai|دیکھ|देख/)&&!has(/camera (badlo|change)/))return[{a:'look'}];
 const intent=has(/jao|jana|chalo|le chalo|pahunch|pohanch|take me|go to|drive to|navigate|لے چلو|جاؤ|चलो|जाओ|ले चलो/);
 if(intent)for(const k in LMW)if(has(LMW[k]))return[{a:'goto',place:k}];
 if(has(/u.?turn|wapas mudo|wapis mudo|ghoom jao|پلٹ|واپس مڑو|पलट|वापस मुड़/))return[{a:'turn',dir:'around'}];
 if(has(/\bleft\b|baen|bayen|baayen|ulte|بائیں|बाएं|बायें|बाईं/))return[{a:'turn',dir:'left'}];
 if(has(/\bright\b|dayen|dayein|daayen|dahine|دائیں|दाएं|दायें|दाईं/))return[{a:'turn',dir:'right'}];
 if(has(/\b(stop|ruk|ruko|rukho|roko|rok do|halt|brake)\b|رک|روکو|रुक|रोको/))return[{a:'stop'}];
 if(has(/peeche|pichay|piche|back up|reverse|پیچھے|पीछे/))return[{a:'reverse',secs:2.5}];
 if(has(/aage|agay|aagay|forward|straight|seedha|seedhe|drive|chalo|chalao|\bgo\b|jao|آگے|आगे|चलो|चलाओ|सीधा/)){
  const k=has(/jaldi|fast|tez|تیز|तेज़|तेज|speed up|zyada|zyaada/)?70:has(/slow|ahista|aahista|dheere|dhire|آہستہ|धीरे/)?20:40;return[{a:'speed',kmh:k}];}
 return a;}
function offline(text){const t=text.toLowerCase(),en=isEn(text),acts=[];
 for(const p of t.split(/\bthen\b|\bphir\b|\bfir\b|\baur\b|\band\b|[,;।]|फिर|और|پھر|اور/))acts.push(...seg(p));
 if(!acts.length)return en?{say:'Sorry, I did not get that. Add an AI key in Settings so I can understand freely.',speak:'Sorry, I did not get that.',speak_lang:'en-US',actions:[]}:{say:'Maaf kijiye, samajh nahi aaya. Settings mein AI key daalein to main khul kar samjhungi.',speak:'माफ़ कीजिए, समझ नहीं आया।',speak_lang:'hi-IN',actions:[]};
 {const k=Math.floor(Math.random()*3);return en?{say:['Sure, on it!','Of course, let us go!','Alright, here we go!'][k],speak:['Sure, on it!','Of course, let us go!','Alright, here we go!'][k],speak_lang:'en-US',actions:acts}:{say:['Ji, abhi karti hoon!','Zaroor, chalte hain!','Theek hai, dekhte hain!'][k],speak:['जी, अभी करती हूँ!','ज़रूर, चलते हैं!','ठीक है, देखते हैं!'][k],speak_lang:'hi-IN',actions:acts};}}

/* ───────── Saras ki baatein (ambient chatter) ───────── */
const CH={last:0,idle:0,seen:{},prevW:'clear',prevN:false,fast:0,lowhp:false,warm:12};
const L={
 rain:{ur:[['Lagta hai barish shuru ho gayi. Gaari aahista chalana, sadak phisalan wali hogi!','लगता है बारिश शुरू हो गई। गाड़ी आहिस्ता चलाना, सड़क फिसलन वाली होगी!'],['Wah, barish! Mujhe ye mausam bahut pasand hai, bas dhyan se chalana.','वाह, बारिश! मुझे ये मौसम बहुत पसंद है, बस ध्यान से चलाना।']],en:[['Looks like it started raining. Take it easy, the road will be slippery!'],['Rain! I love this weather, just drive carefully.']]},
 storm:{ur:[['Wah, toofan aa gaya! Bijli chamak rahi hai, zara ehtiyaat se chalana.','वाह, तूफ़ान आ गया! बिजली चमक रही है, ज़रा एहतियात से चलाना।']],en:[['Wow, a storm! Lightning everywhere, be careful out there.']]},
 fog:{ur:[['Dhund chha gayi hai. Samne kam dikh raha hai, gaari dheere karo.','धुंध छा गई है। सामने कम दिख रहा है, गाड़ी धीरे करो।']],en:[['It is getting foggy. Visibility is low, slow down a little.']]},
 clear:{ur:[['Mausam saaf ho gaya, kitni achi dhoop hai!','मौसम साफ़ हो गया, कितनी अच्छी धूप है!']],en:[['The sky has cleared up, lovely weather!']]},
 cloudy:{ur:[['Badal chha gaye hain, thandi hawa chal rahi hogi.','बादल छा गए हैं, ठंडी हवा चल रही होगी।']],en:[['Clouds are rolling in, nice and cool.']]},
 night:{ur:[['Raat ho gayi hai, maine headlights on kar di hain. Shehar ki batti kitni khoobsurat lag rahi hai!','रात हो गई है, मैंने हेडलाइट्स ऑन कर दी हैं। शहर की बत्तियाँ कितनी ख़ूबसूरत लग रही हैं!']],en:[['Night has fallen and the headlights are on. The city lights look beautiful!']]},
 morning:{ur:[['Subah ho gayi! Kitna sukoon bhara din hai, kahan chalna hai?','सुबह हो गई! कितना सुकून भरा दिन है, कहाँ चलना है?']],en:[['Good morning! What a calm day, where to?']]},
 fast:{ur:[['Itni tez? Seat belt bandh lo, mere dost!','इतनी तेज़? सीट बेल्ट बाँध लो, मेरे दोस्त!']],en:[['That is fast! Hold on tight, friend!']]},
 crash:{ur:[['Oh no! Gaari ko theek se sambhalo, warna repair mehngi padegi.','ओह नो! गाड़ी को ठीक से संभालो, वरना रिपेयर महंगी पड़ेगी।']],en:[['Ouch! Careful, repairs get expensive.']]},
 arrive:{ur:[['Hum {name} pahunch gaye! Ab aage kya karna hai?','हम {hi} पहुँच गए! अब आगे क्या करना है?']],en:[['We have arrived at {name}! What next?']]},
 near:{ur:[['Dekhiye, yahan {name} hai. Chalna ho to bataiye.','देखिए, यहाँ {hi} है। चलना हो तो बताइए।']],en:[['Look, {name} is right here. Tell me if you want to stop by.']]},
 lowhp:{ur:[['Gaari ki halat kharab ho rahi hai. Petrol Pump par jaa kar repair karwa lein.','गाड़ी की हालत ख़राब हो रही है। पेट्रोल पंप पर जाकर रिपेयर करवा लें।']],en:[['The car is badly damaged. Let us repair it at the Petrol Pump.']]},
 idle:{ur:[['Shehar kitna khoobsurat hai na? Mujhe aapke saath ghoomna acha lag raha hai.','शहर कितना ख़ूबसूरत है ना? मुझे आपके साथ घूमना अच्छा लग रहा है।'],['Koi mission shuru karein, ya bas aise hi ghoomte hain?','कोई मिशन शुरू करें, या बस ऐसे ही घूमते हैं?'],['Agar kuch chahiye ho to bas boliye, main yahin hoon.','अगर कुछ चाहिए हो तो बस बोलिए, मैं यहीं हूँ।']],en:[['Isn\'t the city beautiful? I enjoy cruising with you.'],['Shall we start a mission, or just wander around?'],['If you need anything, just say so, I am right here.']]},
 mission_pass:{ur:[['Shabaash! Mission poora ho gaya. Aap kamaal ho!','शाबाश! मिशन पूरा हो गया। आप कमाल हो!']],en:[['Well done! Mission complete. You are amazing!']]},
 mission_fail:{ur:[['Koi baat nahi, dobara koshish karte hain. Is baar pakka ho jayega!','कोई बात नहीं, दोबारा कोशिश करते हैं। इस बार पक्का हो जाएगा!']],en:[['No worries, let us try again. We will nail it this time!']]},
 wanted:{ur:[['Oh no, police peechay lag gayi! Tez chalo ya kahin chhup jao!','ओह नो, पुलिस पीछे लग गई! तेज़ चलो या कहीं छुप जाओ!']],en:[['Oh no, the police are after us! Drive fast or hide somewhere!']]},
 lose_cops:{ur:[['Wah! Police se bach gaye. Pheww!','वाह! पुलिस से बच गए। फ़ुस्स!']],en:[['Yes! We lost the police. Phew!']]},
 busted:{ur:[['Police ne pakad liya... jurmana dena pada. Agli baar ehtiyaat!','पुलिस ने पकड़ लिया... जुर्माना देना पड़ा। अगली बार एहतियात!']],en:[['Busted... we had to pay a fine. More careful next time!']]},
 wasted:{ur:[['Aap behosh ho gaye the. Hospital mein hain, ab theek hain.','आप बेहोश हो गए थे। अस्पताल में हैं, अब ठीक हैं।']],en:[['You passed out. We are at the hospital, all fine now.']]},
 sleep:{ur:[['Subah ho gayi. Aaram se so liye, ab taazadam hain!','सुबह हो गई। आराम से सो लिए, अब ताज़ादम हैं!']],en:[['Good morning! Rested and ready.']]}};
G.event=function(key,d,imp){if(!G.started)return;if(!imp&&(!S.chatty||ttsBusy))return;const now=performance.now()/1000;if(!imp&&now-CH.last<14)return;
 const set=L[key];if(!set)return;const en=G.userLang==='en',arr=en?set.en:set.ur;if(!arr)return;const pk=arr[Math.floor(Math.random()*arr.length)];
 let s=pk[0],sp=pk[1]||pk[0];if(d){const nm=d.name||'',hi=d.hi||nm;s=s.replace('{name}',nm);sp=sp.replace('{name}',nm).replace('{hi}',hi);}
 CH.last=now;CH.idle=0;say(s,sp,en?'en-US':'hi-IN');};
function chatUpdate(dt){if(!G.started)return;if(ttsBusy&&performance.now()-ttsT>25000){ttsBusy=false;if(wantListen)startRec();}
 CH.warm-=dt;CH.idle+=dt;const mi=G.lastInp;if(mi&&G.mode==='car'&&(Math.abs(mi.thr)>.1||Math.abs(mi.steer)>.1)&&!AP.cur)CH.idle=Math.max(0,CH.idle-dt*.7);if(CH.warm>0)return;
 if(W.type!==CH.prevW){CH.prevW=W.type;if(L[W.type])G.event(W.type);}
 const n=G.night>.6;if(n!==CH.prevN){CH.prevN=n;G.event(n?'night':'morning');}
 const kmh=Math.abs(car.vf)*3.6;if(G.mode==='car'&&kmh>115){CH.fast+=dt;if(CH.fast>2){CH.fast=-40;G.event('fast');}}else if(CH.fast>0)CH.fast=0;
 if(!CH.lowhp&&car.hp<30&&car.hp>0){CH.lowhp=true;G.event('lowhp');}if(car.hp>60)CH.lowhp=false;
 if(!G.indoor&&G.mode==='car'){const f=G.focusPos(),now=performance.now()/1000;for(const l of LM){if(l.id==='home2'||l.id==='home3')continue;if(Math.hypot(f.x-l.x,f.z-l.z)<45&&(!CH.seen[l.id]||now-CH.seen[l.id]>240)){CH.seen[l.id]=now;G.event('near',{name:l.name,hi:LMHI[l.id]});break;}}}
 if(CH.idle>55){CH.idle=0;G.event('idle');}}

/* ───────── main update ───────── */
function carStep(dt){const man=manualInp();let inp;
 if(man.active){if(AP.cur||AP.queue.length||AP.cruise!=null){cancelAll();toast('Manual control',900);}inp=man;}
 else{stepQueue(dt);inp=autoInputs()||{thr:0,steer:0,hb:false};}
 G.stepCar(car,inp,dt);G.syncCarMesh(car,dt);G.lastInp=inp;
 if(AC&&eng){const v=Math.abs(car.vf),gear=Math.min(5,Math.floor(v/8)),fr=45+((v%8)/8)*55+gear*7,on=G.mode==='car'&&!G.indoor&&G.started;
  eng.o.frequency.setTargetAtTime(fr,AC.currentTime,.05);eng.o2.frequency.setTargetAtTime(fr*.5,AC.currentTime,.05);eng.f.frequency.setTargetAtTime(300+fr*8+Math.abs(inp.thr)*400,AC.currentTime,.08);
  eng.g.gain.setTargetAtTime(on?.025+.05*Math.abs(inp.thr)+v*.0009:0,AC.currentTime,.1);}}
let autoWT=200;
function update(dt){
 G.time=(G.time+dt*24/720)%24;
 if(S.autoWeather){weatherHold-=dt;autoWT-=dt;if(autoWT<=0&&weatherHold<=0){autoWT=rnd(160,320);const r=Math.random(),ty=r<.45?'clear':r<.62?'cloudy':r<.8?'rain':r<.9?'fog':'storm';W.type=ty;WTarget=WT[ty];}}
 for(const h of G.hooks.update)h(dt);
 if(G.mode==='car')carStep(dt);else{G.syncCarMesh(car,dt);if(G.footAP)G.footAP(dt);}
 applyCam(dt);skyUpdate(dt);rainUpdate(dt);hud(dt);chatUpdate(dt);if(G.uiOn&&(Q>0||((G.miniN=(G.miniN||0)+1)&1)===0))drawMini();
 cityGroup.visible=!G.indoor;beaconGroup.visible=!G.indoor;sky.visible=!G.indoor;scene.background=G.indoor?bgIndoor:null;}
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{update(dt);}catch(e){console.error(e);}
 renderer.render(scene,camera);
 if(G.shotReq){try{const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*canvas.height/canvas.width)||288;c.getContext('2d').drawImage(canvas,0,0,c.width,c.height);const r=G.shotReq;G.shotReq=null;r(c.toDataURL('image/jpeg',.6));}catch(e){const r=G.shotReq;G.shotReq=null;r&&r(null);}}}

/* ───────── boot / UI wiring ───────── */
G.boot=function(){
 $('loadmsg').remove();
 const info=`Stage ${G.stage} · ${['','Basic','Medium','Full'][G.stage]||''}`;$('stagetag').textContent=info;$('stageinfo').textContent='Loaded: '+info+' (stage2.js / stage3.js file daalne par khud on ho jate hain)';
 bindHold('bL','l');bindHold('bR','r');bindHold('bGas','gas');bindHold('bBrake','brake');bindHold('bHB','hb');
 $('bHorn').addEventListener('pointerdown',e=>{e.preventDefault();initAudio();honk();});
 $('bCam').addEventListener('click',()=>{camState.mode=(camState.mode+1)%3;});
 $('mic').addEventListener('click',toggleMic);
 $('bClear').addEventListener('click',()=>{G.setUI(false);toast('Screen clear — top-right corner double tap se wapas',2200);});
 let lastTap=0;$('restore').addEventListener('pointerdown',()=>{const n=Date.now();if(n-lastTap<450)G.setUI(true);lastTap=n;});
 const tb=$('typebar');$('bType').addEventListener('click',()=>{tb.classList.toggle('on');if(tb.classList.contains('on'))$('txt').focus();});
 const send=()=>{const v=$('txt').value.trim();if(v){$('txt').value='';handle(v);}};$('bSend').addEventListener('click',send);$('txt').addEventListener('keydown',e=>{if(e.key==='Enter')send();e.stopPropagation();});
 const st=$('settings');$('bSet').addEventListener('click',()=>{$('kGroq').value=S.keys.groq;$('kGem').value=S.keys.gemini;$('kOr').value=S.keys.openrouter;$('mGroq').value=S.models.groq;$('mGem').value=S.models.gemini;$('mOr').value=S.models.openrouter;
  $('sRec').value=S.rec;$('cMic').checked=S.mic;$('cTts').checked=S.tts;$('sQ').value=S.quality;$('cAuto').checked=S.autoWeather;$('cAlways').checked=S.always;$('cWake').checked=S.wake;$('cChat').checked=S.chatty;st.classList.add('on');});
 $('bCancel').addEventListener('click',()=>st.classList.remove('on'));
 $('bSave').addEventListener('click',()=>{S.keys={groq:$('kGroq').value.trim(),gemini:$('kGem').value.trim(),openrouter:$('kOr').value.trim()};S.models={groq:$('mGroq').value.trim()||DEF.models.groq,gemini:$('mGem').value.trim()||DEF.models.gemini,openrouter:$('mOr').value.trim()||DEF.models.openrouter};
  const q0=S.quality;S.rec=$('sRec').value;S.mic=$('cMic').checked;S.tts=$('cTts').checked;S.quality=$('sQ').value;S.autoWeather=$('cAuto').checked;S.always=$('cAlways').checked;S.wake=$('cWake').checked;S.chatty=$('cChat').checked;G.saveS();applyMicUI();if(S.mic&&S.always&&G.started)setListen(true);else if(!S.always)setListen(false);st.classList.remove('on');
  if(q0!==S.quality){toast('Graphics change ke liye page reload karo',2600);}else toast('Settings save ho gayi');});
 $('bWipe').addEventListener('click',()=>{if(confirm('Game save reset karein? (API keys rehengi)')){try{localStorage.removeItem('saras_save');}catch(e){}location.reload();}});
 window.addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();keys[k]=true;
  if(k==='h')G.setUI(!G.uiOn);else if(k==='v')toggleMic();else if(k==='t'){e.preventDefault();$('typebar').classList.add('on');$('txt').focus();}else if(k==='c')camState.mode=(camState.mode+1)%3;else if(k==='r')respawnCar();else if(k==='escape')$('settings').classList.remove('on');
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();});
 window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
 applyMicUI();
 $('bGo').addEventListener('click',()=>{$('start').classList.remove('on');G.started=true;initAudio();try{speechSynthesis.cancel();}catch(e){}
  CH.seen.home=performance.now()/1000;if(S.always&&S.mic&&SR)setListen(true);const ur=G.userLang!=='en';say('Salam! Main Saras hoon. Bataiye, kahan chalna hai?','सलाम! मैं सरस हूँ। बताइए, कहाँ चलना है?','hi-IN');
  if(!S.keys.groq&&!S.keys.gemini&&!S.keys.openrouter)setTimeout(()=>toast('⚙ Settings mein API key daalo to Saras khul kar samjhegi',3200),2500);});
 $('start').classList.add('on');
 for(const h of G.hooks.ready){try{h();}catch(e){console.error(e);}}
 G.snapCam();requestAnimationFrame(frame);};
})();
