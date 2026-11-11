/* Original Saras City campaign and a lightweight journal. No network required. */
(function () {
  'use strict';
  const G = window.G;
  if (!G || !G.missions) return;
  const chapters = [
    ['Naya shehar, nayi umeed', 'Saras apne mohally mein delivery ka chhota kaam shuru karti hai. Pehli kamai se ghar ki workshop dobara kholni hai.'],
    ['Shehar ki dharkan', 'Bazaar, hospital aur cricket ground ke safar mein Saras ko shehar ke logon ka bharosa milta hai.'],
    ['Apna raasta', 'Ab apni workshop ke liye aakhri deliveries aur shehar bhar ke doston ko aik saath lana hai.']
  ];
  const names = {
    m1: ['Pehli kamai', 'Workshop ka generator band hai. Petrol Pump se fuel laane ke liye apni gaari mein niklo.'],
    m2: ['Amanat', 'Sadar Bazaar ke dukandaar ne hospital ka zaroori parcel diya hai. Use waqt par pahunchao.'],
    m3: ['Naya bharosa', 'Plaza par cricket coach intezar kar raha hai. Use ground tak chhoro; isi se tumhara naya kaam chalega.'],
    m4: ['Shehar ka challenge', 'Cricket club ne workshop fund ke liye checkpoint race rakhi hai. Raaste yaad karo aur waqt par finish karo.']
  };
  G.missions.forEach(d => { if (names[d.id]) [d.title, d.intro] = names[d.id]; });
  const extra = [
    ['sc_supply', 'Workshop ka samaan', 'bazaar', 'Bazaar se spare parts lekar Petrol Pump wale mechanic ko do.', ['bazaar','petrol'], 1100, 230],
    ['sc_care', 'Mohally ka saath', 'hospital', 'Hospital se dawa ka parcel ghar tak pahunchao. Phir Jinnah Park par volunteer se milo.', ['hospital','home','park'], 1300, 300],
    ['sc_team', 'Match ka din', 'stadium', 'Plaza se team ka samaan lo aur Cricket Ground tak le aao.', ['mall','stadium'], 1500, 220],
    ['sc_home', 'Roshan workshop', 'home', 'Aakhri spare parts Petrol Pump se uthao. Ghar wapas jaa kar apni workshop ka naya safar shuru karo.', ['petrol','home'], 2500, 300]
  ];
  extra.forEach(([id,title,giver,intro,stops,money,time]) => G.missions.push({id,title,giver,intro,time,steps:stops.map((lm,i)=>({type:'goto',lm,veh:'any',text:(i===stops.length-1?'Delivery: ':'Samaan uthao: ')+(G.landmarks.find(l=>l.id===lm)||{}).name})),reward:{money,xp:160}}));
  const style = document.createElement('style');
  style.textContent = '#start .card{max-width:620px;border:1px solid #bc9a55;background:linear-gradient(145deg,#092a29f5,#0b131cf5);box-shadow:0 25px 100px #0009}#start h1{font-size:clamp(30px,7vw,54px);letter-spacing:3px}#start .tag{color:#eac47b}#cityJournalButton{position:fixed;left:12px;top:100px;z-index:12;padding:9px 12px;background:#092a29eb;color:#f7d995;border:1px solid #c8ae65;border-radius:12px}#cityJournal{position:fixed;inset:0;z-index:70;background:#030b11d9;display:grid;place-items:center;padding:18px}#cityJournal[hidden]{display:none}#cityJournal article{width:min(660px,100%);max-height:88dvh;overflow:auto;box-sizing:border-box;background:#101e24;color:#e8eeec;border:1px solid #426459;border-radius:20px;padding:24px;font:15px/1.6 system-ui}#cityJournal h1{color:#f0cd84;font-size:30px;margin:4px 0}#cityJournal button{padding:10px 15px;margin:5px;border:1px solid #7a987f;border-radius:9px;background:#183f35;color:#fff;font:inherit;cursor:pointer}#cityJournal progress{width:100%;accent-color:#e4bc6e}#cityJournal .mission{border-top:1px solid #ffffff20;padding:12px 0}#cityJournal small{color:#a7c2b9}#cityOffline{color:#e4bc6e} @media(max-height:500px){#cityJournal article{max-height:94dvh;padding:15px}#cityJournalButton{top:75px;font-size:11px}}';
  document.head.appendChild(style);
  const button = document.createElement('button'); button.id='cityJournalButton';button.textContent='STORY / HELP';button.type='button';document.body.appendChild(button);
  const panel = document.createElement('section');panel.id='cityJournal';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Story journal');document.body.appendChild(panel);
  let lastFocus;
  function open() {
    lastFocus=document.activeElement; G.paused=true; panel.hidden=false;
    const index=Math.min(G.save.mi,G.missions.length), done=index>=G.missions.length;
    const chapter=chapters[Math.min(2,Math.floor(index/Math.max(1,G.missions.length/3)))];
    panel.innerHTML='<article><button id="cityClose" style="float:right" aria-label="Close journal">Close ×</button><small>SARAS CITY · PAKISTAN · CAMPAIGN 01</small><h1>'+chapter[0]+'</h1><p>'+chapter[1]+'</p><progress value="'+index+'" max="'+G.missions.length+'"></progress><small>'+index+' / '+G.missions.length+' missions complete · Rs '+G.save.money+'</small><div id="cityMission"></div><h3>Controls</h3><p>PC: WASD / arrows · Shift run · E interact / vehicle · M map · T type · V microphone. Mobile: left joystick to walk, right side drag to look, door button for vehicles. Follow the mission marker on the map.</p><h3>Offline & voice</h3><p>Story, traffic aur driving offline chalti hain jab game download complete ho. AI ko internet aur Settings mein apni API key chahiye. Microphone recognition browser ke mutabiq internet maang sakti hai. Online natural voice ke liye Settings mein Gemini key aur voice routing use karo. Offline mein device voice available hai.</p><p id="cityOffline">Offline package check karne ke liye download dabao.</p><button id="cityDownload">Download for offline</button><button id="cityFullscreen">Fullscreen</button><p><small>Original browser game prototype. Progress isi browser mein save hoti hai.</small></p></article>';
    const area=panel.querySelector('#cityMission'), active=G.M.active, d=active||G.missions[index];
    if(done&&!active)area.innerHTML='<h3>Workshop roshan ho gayi!</h3><p>Campaign complete. Ab shehar explore karo aur free roam enjoy karo.</p>';
    else if(d){const title=document.createElement('h2');title.textContent=d.title;area.appendChild(title);const p=document.createElement('p');p.textContent=d.intro;area.appendChild(p);const b=document.createElement('button');b.textContent=active?'Continue mission':'Start next mission';b.onclick=()=>{close();if(!G.started)G.$('bGo').click();if(!active)G.startMission(d);};area.appendChild(b);if(active){const p=document.createElement('p');p.textContent='Current: '+((d.steps[G.M.step]||{}).text||'Follow the marker');area.appendChild(p);}}
    panel.querySelector('#cityClose').onclick=close;
    panel.querySelector('#cityFullscreen').onclick=async()=>{try{await document.documentElement.requestFullscreen();if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch(e){G.toast('Browser menu se fullscreen / install use karo.');}};
    panel.querySelector('#cityDownload').onclick=async()=>{const status=panel.querySelector('#cityOffline');if(!('serviceWorker' in navigator)){status.textContent='Is browser mein offline install available nahi.';return;}status.textContent='Downloading game files…';try{const reg=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),20000))]);const worker=reg.active;const channel=new MessageChannel();channel.port1.onmessage=e=>{status.textContent=e.data.ok?'Offline ready. Ab airplane mode mein game dobara khol sakte ho.':'Download incomplete: '+e.data.error;};worker.postMessage({type:'DOWNLOAD_OFFLINE'},[channel.port2]);}catch(e){status.textContent='Download failed. Internet connect karke retry karo.';}};
    panel.querySelector('#cityClose').focus();
  }
  function close(){G.paused=false;panel.hidden=true;lastFocus?.focus();}
  button.onclick=open;
  window.addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='e'||G.paused||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(G.indoor)G.actions.exit_home({});else if(G.mode==='car')G.exitCar();else G.enterCar();});
  panel.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const els=[...panel.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0].focus();}}});
  // Stop held touch inputs when the browser interrupts a gesture.
  window.addEventListener('blur',()=>{Object.keys(G.keys).forEach(k=>G.keys[k]=false);});
  G.hooks.ready.push(()=>{const start=G.$('start');const title=start.querySelector('h1');if(title)title.textContent='SARAS CITY';const tag=start.querySelector('.tag');if(tag)tag.textContent='Apna shehar. Apni kahani.';const b=document.createElement('button');b.className='btn';b.textContent='Story, controls & offline';b.onclick=open;start.querySelector('.card').appendChild(b);G.$('stagetag').textContent='Saras City · Campaign 01';});
})();
