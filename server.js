
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory log
let lastError = null;

app.get('/', (req, res) => {
  res.json({ 
    status: 'Dakai Backend Running ✅', 
    version: '2.0 - Cobalt + yt-dlp fallback',
    supported: ['youtube','instagram','tiktok','facebook','twitter','kick','twitch'],
    lastError: lastError,
    endpoints: {
      'POST /api/clip': 'Body: {url: "https://..."} -> returns video file'
    }
  });
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/clip', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  
  console.log(`[DAKAI] Fetching: ${url}`);
  
  try {
    // Method 1: Try Cobalt API (works for YouTube, Instagram, TikTok without binary)
    console.log('[DAKAI] Trying Cobalt API...');
    try {
      const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url: url, vQuality: '720', filenamePattern: 'basic' })
      });
      const cobaltData = await cobaltRes.json();
      console.log('[DAKAI] Cobalt response:', cobaltData);
      
      if (cobaltData.url) {
        console.log(`[DAKAI] Cobalt success, proxying video: ${cobaltData.url}`);
        // Fetch the direct video URL and pipe it
        const videoRes = await fetch(cobaltData.url);
        if (!videoRes.ok) throw new Error('Failed to fetch direct URL');
        
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'attachment; filename="dakai_clip.mp4"');
        // Pipe
        const arrayBuffer = await videoRes.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }
    } catch (cobaltErr) {
      console.log('[DAKAI] Cobalt failed:', cobaltErr.message);
      lastError = `Cobalt failed: ${cobaltErr.message}`;
    }

    // Method 2: Direct mp4 link (if user pasted direct link)
    if (url.match(/\.mp4|\.webm|\.mov/i)) {
      console.log('[DAKAI] Direct mp4 link detected');
      const videoRes = await fetch(url);
      const arrayBuffer = await videoRes.arrayBuffer();
      res.setHeader('Content-Type', 'video/mp4');
      return res.send(Buffer.from(arrayBuffer));
    }

    // Method 3: yt-dlp fallback (needs binary, may fail on free tier but try)
    console.log('[DAKAI] Trying yt-dlp fallback...');
    try {
      const ytdlp = require('yt-dlp-exec');
      const videoId = Date.now().toString();
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const outputPath = path.join(tempDir, `${videoId}.mp4`);
      
      await ytdlp(url, {
        output: outputPath,
        noPlaylist: true,
        format: 'best[ext=mp4]/best',
        mergeOutputFormat: 'mp4'
      });
      
      console.log('[DAKAI] yt-dlp success');
      return res.sendFile(outputPath, () => {
        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 60000);
      });
    } catch (ytdlpErr) {
      console.log('[DAKAI] yt-dlp failed:', ytdlpErr.message);
      lastError = `yt-dlp failed: ${ytdlpErr.message}`;
      throw ytdlpErr;
    }

  } catch (err) {
    console.error('[DAKAI] All methods failed:', err);
    lastError = err.message;
    res.status(500).json({ 
      error: 'Failed to fetch video', 
      details: err.message,
      hint: 'Try a YouTube or direct mp4 link. Kick/Twitch may need direct mp4. Check / logs for details.',
      supported: 'For best results use YouTube, Instagram, TikTok links via Cobalt'
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Dakai backend v2 running on ${PORT}`));
