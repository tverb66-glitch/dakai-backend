
# DAKAI Backend Setup - Link Clipping Fix

## Problem
Browser directly YouTube/Kick/Instagram se video nahi kheech sakta (CORS + DRM block).
Isliye backend chahiye jo yt-dlp se download karke frontend ko de.

## Setup (2 min)
1. Node.js install karo
2. Terminal me:
   npm install
   npm start
   -> http://localhost:3001 chalega

3. yt-dlp install karna padega:
   Windows: pip install yt-dlp  OR  npm install yt-dlp-exec auto handles it
   Linux/Mac: sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp

## Deploy (Free)
- Railway.app ya Render.com pe deploy karo
- Root me ye files daalo, deploy -> URL milega like https://dakai-backend.up.railway.app
- Wo URL ko Dakai frontend me "Backend API URL" input me daal do

## Frontend me kaise connect?
Frontend me jo maine input diya hai:
BACKEND API URL: https://your-backend-url/api/clip

Paste karte hi save ho jayega localStorage me. Uske baad koi bhi YouTube/Kick/Twitch link paste karte hi:
Frontend -> Backend ko URL bhejega -> Backend yt-dlp se video download -> Frontend ko wapas bhejega -> Clipping shuru

Supported: YouTube, Kick.com, Twitch.tv, Instagram, TikTok, Facebook
