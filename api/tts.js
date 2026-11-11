// Gemini speech generation with bounded retries and model cooldowns.
const cooldowns = new Map(); // Best effort, per warm instance; provider quotas remain authoritative.
const MODELS = ['gemini-3.8-flash-lite-tts','gemini-3.8-flash-tts','gemini-3.1-flash-tts-preview','gemini-2.5-flash-preview-tts','gemini-2.5-pro-preview-tts'];
module.exports = async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'POST required'});
  if(req.headers.origin && req.headers.origin!=='https://'+req.headers.host && req.headers.origin!=='http://'+req.headers.host)return res.status(403).json({error:'Origin rejected'});
  try {
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(!body||typeof body.key!=='string'||body.key.length>1024||!body.key.trim()||/[\r\n]/.test(body.key))return res.status(400).json({error:'Gemini API key required'});
    if(typeof body.text!=='string'||!body.text.trim()||body.text.length>650)return res.status(400).json({error:'Speech must be 1–650 characters'});
    const voices=['Kore','Aoede','Leda','Zephyr','Puck'];const voice=voices.includes(body.voice)?body.voice:'Aoede';
    const requested=Array.isArray(body.models)?body.models.filter(m=>typeof m==='string'&&/^gemini-[a-z0-9.-]*tts[a-z0-9.-]*$/.test(m)).slice(0,3):[];
    const models=[...new Set([...requested,...MODELS])].filter(m=>body.allowPro===true||!m.includes('pro-'));
    const keyHash=require('node:crypto').createHash('sha256').update(body.key).digest('hex').slice(0,24);
    if(cooldowns.size>500)cooldowns.clear();
    let attempts=0,lastStatus=503;const deadline=Date.now()+24000;
    for(const model of models){
      const slot=keyHash+model;if((cooldowns.get(slot)||0)>Date.now())continue;
      if(attempts++>=4||Date.now()>deadline-2000)break;
      try {
        const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{
          method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':body.key},signal:AbortSignal.timeout(Math.min(11000,deadline-Date.now())),
          body:JSON.stringify({contents:[{parts:[model.startsWith('gemini-3.8-')?{text:body.text,speech_metadata:{style:'Warm, natural and playful Pakistani game companion. Clear pronunciation in the language of the text.'}}:{text:'Speak warmly and naturally as Saras, a friendly Pakistani game companion. Read only this text in its language:\n'+body.text}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:model.startsWith('gemini-3.8-')?{voice}:{prebuiltVoiceConfig:{voiceName:voice}}}}})
        });
        if(!response.ok){lastStatus=response.status;cooldowns.set(slot,Date.now()+(response.status===429?120000:60000));if([401,403].includes(response.status))break;continue;}
        const data=await response.json();const part=data.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.data);
        if(!part)continue;
        return res.status(200).json({audio:part.inlineData.data,mimeType:part.inlineData.mimeType,model,voice});
      }catch(error){cooldowns.set(slot,Date.now()+60000);}
    }
    return res.status(lastStatus===429?429:503).json({error:'Natural voice unavailable. Device voice fallback is available.',retryAfter:120});
  }catch(error){return res.status(400).json({error:'Invalid speech request'});}
};
