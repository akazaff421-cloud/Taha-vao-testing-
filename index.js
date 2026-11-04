const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

// 🔥 Universal Video URL Finder
function extractVideoUrl(data) {
    let urls = [];
    function search(obj) {
        if (!obj) return;
        if (typeof obj === 'string' && obj.startsWith('http')) {
            if (obj.includes('.mp4') || obj.includes('.m3u8')) urls.push(obj);
        } else if (typeof obj === 'object') {
            for (let key in obj) {
                if (key.toLowerCase().includes('video') || key.toLowerCase().includes('url') || key.toLowerCase().includes('download') || key.toLowerCase().includes('play')) {
                    if (typeof obj[key] === 'string' && obj[key].startsWith('http')) urls.push(obj[key]);
                }
                search(obj[key]);
            }
        }
    }
    search(data);
    return urls.find(u => u.includes('.mp4')) || urls[0] || null;
}

// 📌 Saari APIs ki list
const APIs = [
    { name: "TikTok", url: "https://api.nexray.eu.cc/search/tiktok?q=" },
    { name: "Pinterest", url: "https://api.nexray.eu.cc/search/pinterestvideo?q=" },
    { name: "YouTube", url: "https://api.nexray.eu.cc/search/youtube?q=" },
    { name: "CapCut", url: "https://api.nexray.eu.cc/search/capcut?q=" },
    { name: "Anime", url: "https://azadx69x.is-a.dev/api/anime-video?q=" },
    { name: "AMV", url: "https://azadx69x.is-a.dev/api/amv?q=" },
    { name: "Anime_Edits", url: "https://eliteprotech-apis.zone.id/download/nsfw?q=" }
];

app.get("/", (req, res) => {
    res.json({ status: "ok", author: "TAHA KHAN", message: "Video Album API is running!", endpoint: "/api/video?q=anime" });
});

app.get("/api/video", async (req, res) => {
    const query = req.query.q || req.query.category || "anime";
    
    for (const api of APIs) {
        try {
            // Timeout 4 second kar diya hai taake bot na atke
            const { data } = await axios.get(`${api.url}${encodeURIComponent(query)}`, { timeout: 4000 });
            const videoUrl = extractVideoUrl(data);
            
            if (videoUrl) {
                return res.json({
                    status: true,
                    author: "TAHA KHAN",
                    provider: api.name,
                    query: query,
                    video_url: videoUrl
                });
            }
        } catch (e) {
            console.log(`[Fail] ${api.name} API - ${e.message}`);
        }
    }

    // 🔥 FALLBACK: Agar saari APIs fail ho jayein, toh ek default video de do
    return res.json({
        status: true,
        author: "TAHA KHAN",
        provider: "Fallback",
        query: query,
        video_url: "https://files.catbox.moe/4oshfr.mp4" // Ek random funny video
    });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
