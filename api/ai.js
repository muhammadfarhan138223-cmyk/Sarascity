// Bring-your-own-key relay. Keys are used for this request only and never logged.
const endpoints = {
  groq: /^https:\/\/api\.groq\.com\/openai\/v1\/(models|chat\/completions)$/,
  openrouter: /^https:\/\/openrouter\.ai\/api\/v1\/(models|chat\/completions)$/,
  gemini: /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models(?:\/[A-Za-z0-9_.%-]+:generateContent)?$/
};
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error: 'POST required'});
  if (req.headers.origin && req.headers.origin !== 'https://' + req.headers.host && req.headers.origin !== 'http://' + req.headers.host) return res.status(403).json({error: 'Origin rejected'});
  try {
    const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!input || JSON.stringify(input).length > 350000) return res.status(413).json({error: 'Request too large'});
    const url = new URL(input.url);
    url.search = '';
    const provider = Object.keys(endpoints).find(p => endpoints[p].test(url.href));
    if (!provider) return res.status(400).json({error: 'Unsupported AI endpoint'});
    const method = input.method || 'GET';
    if (!['GET','POST'].includes(method)) return res.status(400).json({error: 'Unsupported method'});
    const key = input.key;
    if (typeof key !== 'string' || !key.trim() || key.length > 1024 || /[\r\n]/.test(key)) return res.status(400).json({error: 'Your API key is required'});
    const headers = {'Content-Type': 'application/json'};
    if (provider === 'gemini') headers['x-goog-api-key'] = key;
    else headers.Authorization = 'Bearer ' + key;
    const upstream = await fetch(url, {method, headers, redirect:'error', signal:AbortSignal.timeout(18000), ...(method === 'POST' ? {body: JSON.stringify(input.body)} : {})});
    if (!upstream.ok) return res.status(upstream.status).json({error: {message: upstream.status === 429 ? 'Provider quota reached. Try another configured provider.' : 'AI provider rejected the request (' + upstream.status + '). Check your key and model.'}});
    return res.status(200).json(await upstream.json());
  } catch (error) {
    return res.status(error.name === 'TimeoutError' ? 504 : 400).json({error: 'AI request failed. Check connection and settings.'});
  }
};
