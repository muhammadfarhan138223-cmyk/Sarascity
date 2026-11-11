const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('core.js','utf8'),mic=src.slice(src.indexOf('let rec=null'),src.indexOf('/* ───────── LLM brain'));
const calls=[],timers=[],events={};let time=100000;
class Recognition{constructor(){Recognition.latest=this;}start(){this.onstart?.()}abort(){this.onend?.()}}
const document={hidden:false,body:{classList:{toggle(){}}},addEventListener(name,fn){events[name]=fn}};
const $=()=>({classList:{add(){},remove(){},toggle(){}}}),G={},S={mic:true,rec:'hi-IN',wake:true};
new Function('window','document','G','S','$','initAudio','toast','say','handle','setTimeout','clearTimeout','Date','let ttsBusy=false,busyThink=false;'+mic)({SpeechRecognition:Recognition},document,G,S,$,()=>{},()=>{},()=>{},t=>calls.push(t),(fn,delay)=>{timers.push({fn,delay});return timers.length},()=>{},{now:()=>time});
G.setListen(true);assert.equal(G.voiceState.state,'listening');G.submitVoice('ghar jao');assert.equal(calls.length,0);G.submitVoice('Hey Saras');assert.equal(G.voiceState.state,'awake');
time+=100;G.submitVoice('ghar jao');assert.equal(calls[0],'ghar jao');time+=100;G.submitVoice('ghar jao');assert.equal(calls.length,1);
time+=15000;G.submitVoice('park jao');assert.equal(calls.length,1);G.submitVoice('Hey Saras park jao');assert.equal(calls[1],'park jao');
Recognition.latest.onerror({error:'not-allowed'});assert.equal(G.voiceState.state,'blocked');assert.equal(G.micEnabled,false);
G.setListen(false);G.setListen(true);document.hidden=true;events.visibilitychange();assert.equal(G.voiceState.state,'suspended');document.hidden=false;events.visibilitychange();assert.equal(G.voiceState.state,'listening');
Recognition.latest.onerror({error:'network'});Recognition.latest.onend();assert.ok(timers.at(-1).delay>=1000);console.log('11 microphone wake, permission, visibility and retry checks passed.');
