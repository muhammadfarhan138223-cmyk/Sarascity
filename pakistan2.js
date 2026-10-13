/* SARAS CITY — pakistan2.js  (Pakistani street life)
   Makes the same city feel like a Pakistani town:
   • shop signboards (Urdu + Roman) and coloured awnings on building fronts
   • concrete electric poles with hanging wires
   • black water tanks + dishes on the roofs
   • chowks (roundabout islands with a monument) at big junctions
   • 14-August style bunting strings across the roads
   • green Urdu road-name boards at every junction (also drawn on the big map)
   • Pakistani mission names + new missions (Baraat, Cricket ticket, Eid race)
   Needs core.js (building list). Missions need stage2.js. */
(function(){
'use strict';
const G=window.G;if(!G||!G.T||!G.bldList)return;
const T=G.T,PI=Math.PI,pick=G.pick,rnd=G.rnd,S=G.S,C=G.C,NB=C.NB,P=C.P,SIZE=C.SIZE,RW=C.RW,roadC=C.roadC,blkC=C.blkC,city=G.city;
const Q=S.quality==='low'?0:S.quality==='med'?1:2,MU=T.BufferGeometryUtils;
const FONT='"Noto Nastaliq Urdu","Noto Naskh Arabic","Jameel Noori Nastaleeq","Segoe UI",Tahoma,Arial,sans-serif';
const dm=new T.Object3D();
function addMerged(geos,mat){if(!geos.length)return null;let m=null;try{if(MU&&MU.mergeBufferGeometries&&geos.length>1){m=new T.Mesh(MU.mergeBufferGeometries(geos,false),mat);city.add(m);return m;}}catch(e){}
 geos.forEach(g=>city.add(new T.Mesh(g,mat)));return null;}
function inst(geo,mat,rows){if(!rows.length)return null;const im=new T.InstancedMesh(geo,mat,rows.length),col=new T.Color();
 rows.forEach((r,i)=>{dm.position.set(r.x,r.y,r.z);dm.rotation.order=r.order||'XYZ';dm.rotation.set(r.rx||0,r.ry||0,r.rz||0);dm.scale.set(r.sx||1,r.sy||1,r.sz||1);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);if(r.c){col.set(r.c);im.setColorAt(i,col);}});
 im.frustumCulled=false;im.castShadow=false;city.add(im);dm.rotation.order='XYZ';return im;}
function cellUV(g,i,rows){const col=i%2,row=Math.floor(i/2),uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,(col+uv.getX(k))/2,1-(row+1-uv.getY(k))/rows);}

/* ───────── 1. shop signs + awnings on building fronts ───────── */
const SHOPS=[['Hotel','ہوٹل','#b91c1c'],['Chai · Paratha','چائے پراٹھا','#065f46'],['Karyana Store','کریانہ سٹور','#1d4ed8'],['Mobile Shop','موبائل شاپ','#7c3aed'],
 ['Dawa Khana','دوا خانہ','#047857'],['Bakery','بیکری','#c2410c'],['Tailors','درزی','#0f766e'],['Cloth House','کلاتھ ہاؤس','#9d174d'],
 ['Biryani Corner','بریانی کارنر','#a16207'],['Juice Corner','جوس کارنر','#15803d'],['Kabab House','کباب ہاؤس','#991b1b'],['Fruit Chaat','فروٹ چاٹ','#be185d'],
 ['Electronics','الیکٹرانکس','#1e40af'],['Barber Shop','حجام','#374151'],['General Store','جنرل سٹور','#0e7490'],['Mithai Shop','مٹھائی','#b45309']];
function cellsTex(list,bgFn){return G.ctex(1024,1024,g=>{list.forEach((d,i)=>{const cx=(i%2)*512,cy=Math.floor(i/2)*128;g.fillStyle=bgFn(d);g.fillRect(cx,cy,512,128);g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(cx+7,cy+7,498,114);
  g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.direction='rtl';g.font='bold 52px '+FONT;g.fillText(d[1],cx+256,cy+50);g.direction='ltr';g.font='bold 26px Arial,sans-serif';g.fillStyle='#ffe9a8';g.fillText(d[0],cx+256,cy+99);});});}
(function shopFronts(){
 const mat=new T.MeshBasicMaterial({map:cellsTex(SHOPS,d=>d[2]),side:T.DoubleSide}),geos=[],aw=[],cols=['#c0392b','#1d6fb8','#2e8b57','#e0a30b','#7a3fb3','#e8e8e8'];
 for(const b of G.bldList){if(b.h>46||b.h<5||Math.random()>(Q===0?.45:.8))continue;
  const bx=Math.floor((b.x-16)/76),bz=Math.floor((b.z-16)/76),ox=b.x-blkC(bx),oz=b.z-blkC(bz),faces=[];
  if(Math.abs(ox)>5)faces.push([Math.sign(ox),0]);if(Math.abs(oz)>5)faces.push([0,Math.sign(oz)]);
  for(const f of faces){if(Math.random()>.8)continue;const fw=f[0]?b.d:b.w,w=Math.min(4.2,fw-2);if(w<2)continue;const lat=rnd(-(fw/2-w/2-.3),fw/2-w/2-.3),
    cx=b.x+f[0]*(b.w/2+.08)+(f[0]?0:lat),cz=b.z+f[1]*(b.d/2+.08)+(f[1]?lat:0),ang=f[0]>0?PI/2:f[0]<0?-PI/2:f[1]>0?0:PI;
   const g=new T.PlaneGeometry(w,w/4);cellUV(g,Math.floor(Math.random()*16),8);g.rotateY(ang);g.translate(cx,3.5,cz);geos.push(g);
   aw.push({x:cx+f[0]*.7,y:2.7,z:cz+f[1]*.7,ry:ang,rx:.22,order:'YXZ',sx:w+.3,sy:1,sz:1.4,c:pick(cols)});}}
 addMerged(geos,mat);inst(new T.BoxGeometry(1,.1,1),new T.MeshLambertMaterial({color:0xffffff}),aw);})();

/* ───────── 2. electric poles + hanging wires ───────── */
(function poles(){
 const rows=[],pts=[],vx=[],near=v=>{for(let k=0;k<=NB;k++)if(Math.abs(v-roadC(k))<RW/2+4)return true;return false;},H=7.5;
 const line=(fix,axis)=>{const arr=[];for(let v=22;v<SIZE-20;v+=38){if(near(v))continue;arr.push(v);}
  arr.forEach(v=>{const x=axis==='x'?v:fix,z=axis==='x'?fix:v;rows.push({x,y:.3,z,ry:axis==='x'?PI/2:0});G.circles.push({x,z,r:.3});pts.push({x,z,axis});});
  for(let i=0;i<arr.length-1;i++){const a=axis==='x'?[arr[i],fix]:[fix,arr[i]],b=axis==='x'?[arr[i+1],fix]:[fix,arr[i+1]],span=Math.hypot(b[0]-a[0],b[1]-a[1]);
   for(const lo of[-.95,0,.95]){const ox=axis==='x'?0:lo,oz=axis==='x'?lo:0;let px=a[0]+ox,pz=a[1]+oz,py=H;
    for(let s=1;s<=6;s++){const t=s/6,nx=a[0]+(b[0]-a[0])*t+ox,nz=a[1]+(b[1]-a[1])*t+oz,ny=H-Math.min(1.4,span*.03)*4*t*(1-t);vx.push(px,py,pz,nx,ny,nz);px=nx;pz=nz;py=ny;}}}};
 for(let k=0;k<=NB;k++){line(roadC(k)+RW/2+1.7,'x');line(roadC(k)+RW/2+1.7,'z');}
 const pole=new T.BoxGeometry(.32,8,.32).translate(0,4,0),arm=new T.BoxGeometry(2.4,.14,.14).translate(0,7.4,0);let geo=pole;
 try{if(MU&&MU.mergeBufferGeometries)geo=MU.mergeBufferGeometries([pole,arm],false)||pole;}catch(e){}
 inst(geo,new T.MeshLambertMaterial({color:0x9a9a94}),rows);
 const wg=new T.BufferGeometry();wg.setAttribute('position',new T.BufferAttribute(new Float32Array(vx),3));const wl=new T.LineSegments(wg,new T.LineBasicMaterial({color:0x151515}));wl.frustumCulled=false;city.add(wl);})();

/* ───────── 3. roof water tanks + dishes ───────── */
(function roofs(){const tanks=[],dishes=[],tc=['#1b1b1e','#1b1b1e','#1b1b1e','#2563eb','#e8e8e8'];
 for(const b of G.bldList){if(b.h>40)continue;const n=1+(Math.random()<.4?1:0);
  for(let i=0;i<n;i++){const x=b.x+rnd(-b.w/2+2,b.w/2-2),z=b.z+rnd(-b.d/2+2,b.d/2-2);if(Math.random()<.75)tanks.push({x,y:b.h+.3,z,c:pick(tc)});}
  if(Math.random()<.5)dishes.push({x:b.x+rnd(-b.w/2+1.5,b.w/2-1.5),y:b.h+.3,z:b.z+rnd(-b.d/2+1.5,b.d/2-1.5),ry:rnd(0,PI*2)});}
 inst(new T.CylinderGeometry(.85,.85,1.3,10).translate(0,.9,0),new T.MeshLambertMaterial({color:0xffffff}),tanks);
 inst(new T.ConeGeometry(.55,.35,10).rotateX(-1.1).translate(0,1.1,0),new T.MeshLambertMaterial({color:0xe9e9e4}),dishes);})();

/* ───────── 4. chowks (roundabout islands + monument) ───────── */
const CHOWK=[[3,3,'Jinnah Chowk','جناح چوک'],[1,1,'Iqbal Chowk','اقبال چوک'],[5,5,'Liaquat Chowk','لیاقت چوک'],[1,5,'Fatima Chowk','فاطمہ چوک'],[5,1,'Bazaar Chowk','بازار چوک']];
(function chowks(){const stone=new T.MeshStandardMaterial({color:'#e4dcc8',roughness:.9}),gold=new T.MeshBasicMaterial({color:'#e8b923'}),grass=new T.MeshStandardMaterial({color:'#3f7a45',roughness:1});
 for(const c of CHOWK){const x=roadC(c[0]),z=roadC(c[1]);
  const base=new T.Mesh(new T.CylinderGeometry(2.1,2.3,.5,20),stone);base.position.set(x,.3,z);base.castShadow=base.receiveShadow=true;city.add(base);
  const turf=new T.Mesh(new T.CylinderGeometry(1.7,1.7,.55,20),grass);turf.position.set(x,.33,z);city.add(turf);
  const pil=new T.Mesh(new T.BoxGeometry(.8,6,.8),stone);pil.position.set(x,3.3,z);pil.castShadow=true;city.add(pil);
  const top=new T.Mesh(new T.SphereGeometry(.65,12,8),gold);top.position.set(x,6.7,z);city.add(top);
  const cr=new T.Mesh(new T.TorusGeometry(.5,.12,8,16,PI*1.6),gold);cr.position.set(x,7.7,z);cr.rotation.z=PI*.7;city.add(cr);
  G.circles.push({x,z,r:1.9});
  const tex=G.ctex(512,128,g=>{g.fillStyle='rgba(6,70,40,.95)';g.fillRect(0,0,512,128);g.strokeStyle='#fff';g.lineWidth=7;g.strokeRect(5,5,502,118);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.direction='rtl';g.font='bold 54px '+FONT;g.fillText(c[3],256,50);g.direction='ltr';g.font='bold 30px Arial,sans-serif';g.fillStyle='#ffe9a8';g.fillText(c[2],256,98);});
  const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));sp.scale.set(10,2.5,1);sp.position.set(x,10.3,z);city.add(sp);}})();

/* ───────── 5. 14-August bunting across roads ───────── */
(function bunting(){const n=Q===0?5:10,vx=[],flags=[],fc=['#0b6b2a','#ffffff','#0b6b2a','#e8e8e8','#0b6b2a'];
 for(let k=0;k<n;k++){const j=1+Math.floor(Math.random()*(NB-1)),i=Math.floor(Math.random()*NB),x=roadC(i)+P/2,zc=roadC(j),y=6.6;let px=x,pz=zc-10.4,py=y;
  for(let s=1;s<=10;s++){const t=s/10,nz=zc-10.4+20.8*t,ny=y-.7*4*t*(1-t);vx.push(px,py,pz,x,ny,nz);px=x;pz=nz;py=ny;}
  for(let f=0;f<14;f++){const t=(f+.5)/14,nz=zc-10.4+20.8*t,ny=y-.7*4*t*(1-t);flags.push({x,y:ny,z:nz,ry:PI/2,c:fc[f%5]});}}
 const lg=new T.BufferGeometry();lg.setAttribute('position',new T.BufferAttribute(new Float32Array(vx),3));const ln=new T.LineSegments(lg,new T.LineBasicMaterial({color:0x222222}));ln.frustumCulled=false;city.add(ln);
 const tri=new T.BufferGeometry();tri.setAttribute('position',new T.BufferAttribute(new Float32Array([-.28,0,0,.28,0,0,0,-.55,0]),3));
 inst(tri,new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide}),flags);})();

/* ───────── 6. green Urdu road-name boards at every junction ───────── */
const ZN=[['Jinnah Road','جناح روڈ'],['Iqbal Road','اقبال روڈ'],['Liaquat Road','لیاقت روڈ'],['Fatima Jinnah Rd','فاطمہ جناح روڈ'],['Canal Road','کینال روڈ'],['Station Road','سٹیشن روڈ'],['Mall Road','مال روڈ'],['Bazaar Road','بازار روڈ']];
const XN=[['GT Road','جی ٹی روڈ'],['Lahore Road','لاہور روڈ'],['Multan Road','ملتان روڈ'],['Karachi Road','کراچی روڈ'],['Hospital Road','ہسپتال روڈ'],['College Road','کالج روڈ'],['Stadium Road','سٹیڈیم روڈ'],['Sadar Road','صدر روڈ']];
G.roadNames={z:ZN.map(n=>n[0]),x:XN.map(n=>n[0])};
(function roadBoards(){
 const list=ZN.concat(XN),mat=new T.MeshBasicMaterial({map:cellsTex(list,()=>'#0b5d33'),side:T.DoubleSide}),geos=[],posts=[];
 for(let i=0;i<=NB;i++)for(let j=0;j<=NB;j++){if(Q===0&&(i+j)%2)continue;const cx=roadC(i),cz=roadC(j),o=RW/2+1.1;
  const a=new T.PlaneGeometry(2.8,.7);cellUV(a,i%8,8);a.translate(cx+o,3.0,cz-o);geos.push(a);posts.push({x:cx+o,y:.3,z:cz-o});
  const b=new T.PlaneGeometry(2.8,.7);cellUV(b,8+(j%8),8);b.rotateY(PI/2);b.translate(cx-o,3.0,cz+o);geos.push(b);posts.push({x:cx-o,y:.3,z:cz+o});}
 addMerged(geos,mat);inst(new T.CylinderGeometry(.06,.06,3,6).translate(0,1.5,0),new T.MeshLambertMaterial({color:0x666a70}),posts);})();

/* ───────── 7. Pakistani missions ───────── */
(function missions(){const D=G.missions;if(!D)return;
 const ren={m1:['Subah ka Safar','Chalo, pehle Petrol Pump se tel dalwa lete hain.','चलो, पहले पेट्रोल पंप से तेल डलवा लेते हैं।'],
  m2:['Biryani ki Delivery','Sadar Bazaar se garma garam biryani uthao aur Civil Hospital pahunchao — thandi na ho jaye!','सदर बाज़ार से गरमा गरम बिरयानी उठाओ और सिविल अस्पताल पहुँचाओ, ठंडी न हो जाए!'],
  m3:['Rickshaw Sawari','Plaza par ek sawari intezar kar rahi hai. Aaram se chalana, Cricket Ground chhodna hai.','प्लाज़ा पर एक सवारी इंतज़ार कर रही है। आराम से चलाना, क्रिकेट ग्राउंड छोड़ना है।'],
  m4:['Chowk se Chowk Race','Chhe chowkon ki race, bas 160 second! Horn bajao aur nikal jao.','छह चौकों की रेस, बस एक सौ साठ सेकंड! हॉर्न बजाओ और निकल जाओ।']};
 for(const d of D){const r=ren[d.id];if(r){d.title=r[0];d.intro=r[1];d.hi=r[2];}}
 const add=d=>{if(!D.some(x=>x.id===d.id))D.push(d);};
 add({id:'m10',title:'Baraat ki Gaari',giver:'bazaar',time:220,needCar:true,intro:'Dulha Sadar Bazaar mein intezar kar raha hai. Aaram se gaari chalana aur Jinnah Masjid pahunchana, nikaah ka waqt ho raha hai!',hi:'दूल्हा सदर बाज़ार में इंतज़ार कर रहा है। आराम से गाड़ी चलाना और जिन्ना मस्जिद पहुँचना, निकाह का वक़्त हो रहा है!',
  steps:[{type:'pickup',lm:'bazaar',text:'Bazaar mein dulhe ko uthao (gaari roko)'},{type:'goto',lm:'masjid',veh:'car',text:'Dulhe ko Jinnah Masjid pahunchao'}],reward:{money:2000,xp:220}});
 add({id:'m11',title:'Cricket Match ka Ticket',giver:'park',time:170,intro:'Match shuru hone wala hai! Sadar Bazaar se ticket lo aur jaldi Cricket Ground pahuncho.',hi:'मैच शुरू होने वाला है! सदर बाज़ार से टिकट लो और जल्दी क्रिकेट ग्राउंड पहुँचो।',
  steps:[{type:'goto',lm:'bazaar',veh:'any',text:'Sadar Bazaar se ticket uthao'},{type:'goto',lm:'stadium',veh:'any',text:'Ticket Cricket Ground pahunchao'}],reward:{money:1500,xp:170}});
 if(G.stepTypes&&G.stepTypes.race)add({id:'m12',title:'Eid ki Shopping Race',giver:'mall',time:210,needCar:true,intro:'Eid se pehle aakhri race! Teen rival, chhe chowk. Sab se pehle pahuncho.',hi:'ईद से पहले आख़िरी रेस! तीन प्रतिद्वंद्वी, छह चौक। सबसे पहले पहुँचो।',
  steps:[{type:'race',cps:[[2,2],[6,2],[6,6],[2,6],[1,3],[4,4]],text:'Race: chowk pakdo (pehle pahuncho)'}],reward:{money:3200,xp:320},extraHud:()=>'<small>Checkpoint '+Math.min(6,((G.M&&G.M.s&&G.M.s.k)||0)+1)+'/6</small>'});
})();
if(G.promptExtras)G.promptExtras.push('Roads have Pakistani names (z roads west->east: '+ZN.map(n=>n[0]).join(', ')+'; x roads north->south: '+XN.map(n=>n[0]).join(', ')+'). Chowks (roundabouts): Jinnah, Iqbal, Liaquat, Fatima, Bazaar. You may mention them naturally.');
G.hooks.ready.push(()=>{if(G.$('stagetag'))G.$('stagetag').textContent+=' + Street';});
})();
