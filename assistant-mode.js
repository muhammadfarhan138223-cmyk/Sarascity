/* Foreground Saras assistant. Web browsers cannot act as an Android system assistant. */
(function(){
'use strict';
const G=window.G;if(!G)return;
const overlay=document.createElement('section');overlay.id='sarasAssistant';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Saras voice assistant');
overlay.innerHTML='<div class="assistantCard"><small>SARAS · YOUR CITY COMPANION</small><div class="voiceOrb" aria-hidden="true"></div><h1>Hey Saras.</h1><p id="sarasStatus" role="status">Tap Enable mic, then say Hey Saras.</p><div id="sarasTranscript" aria-live="polite"></div><div class="assistantControls"><button id="assistantMic">Enable mic</button><button id="assistantStop">Stop voice</button><button id="assistantBack">Back to game</button><button id="assistantSettings">Voice settings</button><select id="assistantLanguage" aria-label="Recognition language"><option value="hi-IN">Urdu / Hinglish speech</option><option value="ur-PK">Urdu Pakistan</option><option value="en-US">English</option></select></div><form class="assistantForm" id="assistantForm"><input id="assistantText" placeholder="Type a question or game command…" aria-label="Message Saras" autocomplete="off"><button type="submit">Send</button></form><p class="caption">Wake word works while this app is open. Screen lock / another app can suspend microphone access. Return here to resume. Use Settings to add your AI keys for varied online answers.</p></div>';
document.body.appendChild(overlay);
const glow=document.createElement('div');glow.id='sarasGlow';glow.setAttribute('aria-hidden','true');document.body.appendChild(glow);
const $=id=>overlay.querySelector('#'+id);
let wakeLock=null,saved=null,focusBefore=null,unlockUntil=0;
function transcript(text){if(!text)return;const el=$('sarasTranscript');el.textContent=text;el.classList.remove('fresh');requestAnimationFrame(()=>el.classList.add('fresh'));}
G.onVoiceState=function(s){document.body.dataset.sarasState=s.state;$('sarasStatus').textContent=s.message;$('assistantMic').textContent=G.micEnabled?'Pause mic':'Enable mic';if(s.transcript)transcript(s.transcript);};
G.openAssistant=async function(){
 if(!overlay.hidden)return;
 saved={paused:!!G.paused,wake:G.S.wake,always:G.S.always};focusBefore=document.activeElement;
 G.assistantMode=true;G.paused=true;G.S.wake=true;G.S.always=true;G.S.mic=true;overlay.hidden=false;G.staticRendered=false;
 $('assistantLanguage').value=G.S.rec||'hi-IN';G.setListen(true);
 try{wakeLock=await navigator.wakeLock?.request('screen');}catch(e){}
 $('assistantMic').focus();
};
function leave(stopVoice=false){if(overlay.hidden)return;overlay.hidden=true;G.assistantMode=false;G.paused=saved?.paused||false;G.S.wake=saved?.wake??false;G.S.always=saved?.always??false;G.staticRendered=false;wakeLock?.release();wakeLock=null;if(stopVoice){G.setListen(false);G.stopNaturalSpeech?.();try{speechSynthesis.cancel();}catch(e){}}focusBefore?.focus();}
G.resumeGameFromAssistant=()=>{leave();if(!G.started)G.$('bGo').click();};
$('assistantBack').onclick=()=>leave(true);
$('assistantMic').onclick=()=>{G.S.mic=true;G.setListen(!G.micEnabled);};
$('assistantStop').onclick=()=>{G.stopSpeaking?.();G.stopNaturalSpeech?.();try{speechSynthesis.cancel();}catch(e){}document.body.dataset.sarasState='idle';G.voiceStatus('idle','Voice stopped. Tap Enable mic to listen again.');G.setListen(false);};
$('assistantSettings').onclick=()=>{leave(true);G.$('bSet').click();};
$('assistantLanguage').onchange=()=>{const was=G.micEnabled;G.setListen(false);G.S.rec=$('assistantLanguage').value;G.saveS();if(was)G.setListen(true);};
$('assistantForm').onsubmit=e=>{e.preventDefault();const input=$('assistantText'),text=input.value.trim();if(!text||G.aiBusy)return;input.value='';transcript(text);G.handle(text);};
overlay.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')leave(true);if(e.key==='Tab'){const all=[...overlay.querySelectorAll('button,select,input')];if(e.shiftKey&&document.activeElement===all[0]){e.preventDefault();all.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===all.at(-1)){e.preventDefault();all[0].focus();}}});
const awake=()=>{if(document.hidden){wakeLock?.release();wakeLock=null;}else if(G.assistantMode)navigator.wakeLock?.request('screen').then(lock=>wakeLock=lock).catch(()=>{});};
document.addEventListener('visibilitychange',awake);
G.hooks.ready.push(()=>{
 document.getElementById('assistantOpen').onclick=()=>G.openAssistant();
 const sub=G.$('sub');if(sub&&window.MutationObserver)new MutationObserver(()=>{const bot=sub.querySelector('.bot');if(bot)transcript(bot.textContent.replace(/^Saras\s*[·:]?\s*/,''));}).observe(sub,{childList:true,subtree:true,characterData:true});
 G.onVoiceState(G.voiceState||{state:'idle',message:'Mic off'});
});
// Varied in-world observations are generated online with no gameplay actions.
G.introduceMission=d=>{if(navigator.onLine&&G.S.mode!=='offline'&&Object.values(G.S.keys).some(Boolean)&&!G.aiBusy)G.handle('[COMPANION EVENT] Mission briefing: '+d.title+'. '+d.intro+'. Say a fresh short encouragement tied to this objective. No actions.');else G.say(d.intro);};
const oldEvent=G.event;let eventTime=0,lastOffline=-1;
const lines={
 mission_pass:['Zabardast. Aik aur suraagh mil gaya—journal mein agla kaam dekho.','Kaam ho gaya. Ab shehar ki kahani ka agla darwaza khulta hai.','Shabaash! Is dafa raasta bhi yaad raha aur kaam bhi waqt par hua.'],
 mission_fail:['Koi baat nahi. Journal se dobara try karo; is baar raasta soch kar.','Ye shehar asaan nahi. Gaari aur health check karke dobara chalte hain.','Mission reh gaya, kahani nahi. Aik aur koshish karte hain.'],
 idle:['Shehar ki har gali ka apna raaz hai. Agla suraagh journal mein hai.','Thora sukoon bhi zaroori hai. Jab chaho agla mission shuru karte hain.','Road khuli lag rahi hai. Ghoomna hai ya kahani aage barhani hai?'],
 night:['Raat mein raaste alag lagte hain. Speed sambhal kar.','Shehar ki lights on hain. Nazar road par rakho.','Andhera hai, lekin humara raasta saaf rehna chahiye.'],
 rain:['Baarish shuru hai. Mod par speed kam rakhna.','Road geeli hai. Aaj brakes ko thora waqt dena.','Baarish ka maza apni jagah—gaari ko sambhalna bhi zaroori hai.']
};
G.event=function(key,data,important){
 if(!G.started)return;const now=Date.now(),online=navigator.onLine&&G.S.mode!=='offline'&&Object.values(G.S.keys).some(Boolean);
 if(online&&!G.aiBusy&&(important||now-eventTime>35000)){eventTime=now;G.handle('[COMPANION EVENT] '+JSON.stringify({event:key,detail:data||{},mission:G.M.active?.title||'free roam'})+'. Give one fresh, natural contextual sentence. No actions.');return;}
 if(online)return;
 if(lines[key]&&(important||now-eventTime>18000)){eventTime=now;let index=Math.floor(Math.random()*lines[key].length);if(index===lastOffline)index=(index+1)%lines[key].length;lastOffline=index;G.say(lines[key][index]);return;}
 oldEvent?.(key,data,important);
};
G.varyOfflinePlan=p=>{if(!p.say||!p.actions?.length)return p;const replies=['Theek hai, chalo.','Samajh gayi—abhi karti hoon.','Ji, raasta sambhalte hain.','Bilkul, tumhare saath hoon.'];unlockUntil=(unlockUntil+1)%replies.length;return {...p,say:p.say+' '+replies[unlockUntil],speak:(p.speak||p.say)+' '+['ठीक है, चलो।','जी, अभी करती हूँ।','समझ गई, चलिए।','मैं आपके साथ हूँ।'][unlockUntil]};};
})();
