
// Dakai Backend - server.js
// Run: npm install express cors yt-dlp-exec
const express = require('express');
const cors = require('cors');
const YTDlpWrap = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// API to fetch and clip
app.post('/api/clip', async (req, res) => {
  const { url, duration = 15, ratio = '9:16' } = req.body;
  
  if (!url) return res.status(400).json({ error: 'URL required' });
  
  try {
    console.log(`Fetching: ${url}`);
    const videoId = Date.now().toString();
    const outputPath = path.join(TEMP_DIR, `${videoId}.mp4`);
    
    // yt-dlp will download from YouTube, Kick, Twitch, Instagram, TikTok - all platforms
    await YTDlpWrap.exec([
      url,
      '-o', outputPath,
      '--no-playlist',
      '-f', 'best[ext=mp4]/best',
      '--merge-output-format', 'mp4'
    ]);
    
    // Send file back to frontend
    res.sendFile(outputPath, () => {
      // Cleanup after 1 min
      setTimeout(() => fs.existsSync(outputPath) && fs.unlinkSync(outputPath), 60000);
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch video', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Dakai Backend Running', supported: ['youtube','kick','twitch','instagram','tiktok'] });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Dakai backend running on http://localhost:${PORT}`));
