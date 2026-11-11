const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('campaign-data.js','utf8'),sandbox);const campaign=sandbox.window.SarasCampaign;
assert.equal(campaign.missions.length,24);assert.equal(new Set(campaign.missions.map(d=>d.id)).size,24);
const stage=fs.readFileSync('stage2.js','utf8'),a=stage.indexOf('function startMission('),b=stage.indexOf('function finishMission(',a),c=stage.indexOf('G.startMission=',b);
const factory=new Function('G','defs','SV','M','clearGiver','beginStep','endStep','setGiver','setTimeout','return {start:'+stage.slice(a,b).trim()+',finish:'+stage.slice(b,c).trim()+'};');
const SV={mi:0,money:0,xp:0},M={active:null},G={toast(){},say(){},addMoney(n){SV.money+=n},addXP(n){SV.xp+=n},saveGame(){},tone(){},vib(){},setMission(){},burst(){},event(){}};
const flow=factory(G,campaign.missions,SV,M,()=>{},()=>{},()=>{},()=>{},()=>{});assert.equal(flow.start(campaign.missions[1]),false);assert.equal(flow.start({id:'unknown'}),false);
for(let i=0;i<24;i++){assert.equal(flow.start(campaign.missions[i]),true);flow.finish(true);assert.equal(SV.mi,i+1);}
const before=JSON.stringify(SV);flow.start(campaign.missions[0]);flow.finish(true);assert.equal(JSON.stringify(SV),before);console.log('Campaign gates, 24 completions and replay reward protection passed.');
