# Saras City — Campaign 01

An original Pakistani browser open-world prototype by Farhan Balouch. Existing procedural 3D city, Pakistani street life, walking, vehicles, police and missions are retained. This release adds a story journal, four delivery missions, an explicit offline package and optional backend AI/voice routing.

## Play

- Start with **Khelo**, or choose **Story, controls & offline → Start next mission**.
- PC: WASD/arrows, E enter/exit vehicle, M map, T text command, V microphone.
- Mobile: left joystick, right drag camera, on-screen vehicle controls.
- **STORY / HELP** pauses the world and shows the next objective.
- Progress saves in this browser after completing missions. Clearing site data removes saves and keys.

## Natural voice and AI

Settings → enter your own Gemini key → Save. Under **Natural Gemini voice**, choose Aoede/Kore/Leda/Zephyr/Puck, Save voice and Test voice. TTS model order is editable. Current defaults try Flash-Lite, Flash, then older compatible Gemini TTS models. Legacy models and Gemini 3.8 have distinct request formats, handled on the server. WAV and PCM responses are supported.

Text commands retain Groq/Gemini/OpenRouter provider and model fallbacks. Text and voice use separate routes, so a speech failure does not cancel gameplay commands. Natural speech falls back to device voices when offline, unconfigured or unavailable. Short repeated speech clips are cached in memory; failed models get a temporary cooldown. Pro TTS is opt-in. Routing improves availability; it does not increase or bypass provider/account quotas, and no model is guaranteed free. No developer API key is bundled.

Keys are stored in localStorage on the user's browser and sent over HTTPS to the same-origin backend and selected provider for each request. Server code does not persist or log keys. Use a trusted device; other scripts on the same origin can access browser storage. Natural TTS is optional. Microphone recognition depends on browser support and may require internet. Voice providers and access tiers change; edit model IDs in Settings as needed.

## Offline

Open online once and select **Download for offline**. Wait for **Offline ready**, then reopen the game in airplane mode to verify on your device. The required JavaScript and Three.js libraries are cached explicitly. Failed required downloads never report success. Optional GLB models are cosmetic and procedural models remain the fallback. Browser storage eviction can remove downloads. AI generation requires internet.

## Deployment and checks

Vercel: import this repository, framework **Other**, no build command, root directory repository root. Serverless routes are `/api/ai` and `/api/tts`. Neither requires project environment secrets: every user supplies their own key. `node --test tests/backend.test.js` verifies backend allowlisting, origin rejection, voice fallback and cooldown behavior using mocked providers. `node --check` validates source syntax.

This is an early playable browser prototype, not a finished Vice City scale production game or native Android APK. A larger map, polished original assets, deeper story scenes, traffic AI and real-device optimization remain future work. Original city/game assets should be used; do not import GTA assets.
