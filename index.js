const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

// 🔥 URL Finder
function extractVideoUrl(data) {
    let urls = [];
    function search(obj) {
        if (!obj) return;
        if (typeof obj === 'string' && obj.startsWith('http')) {
            if (obj.includes('.mp4') || obj.includes('.m3u8')) urls.push(obj);
        } else if (typeof obj === 'object') {
            for (let key in obj) {
                if (key.toLowerCase().includes('video') || key.toLowerCase().includes('url') || key.toLowerCase().includes('download')) {
                    if (typeof obj[key] === 'string' && obj[key].startsWith('http')) urls.push(obj[key]);
                }
                search(obj[key]);
            }
        }
    }
    search(data);
    return urls.find(u => u.includes('.mp4')) || urls[0] || null;
}

// 📌 Sirf 3 Fast APIs (Timeout fix)
const APIs = [
    { name: "TikTok", url: "https://api.nexray.eu.cc/search/tiktok?q=" },
    { name: "Pinterest", url: "https://api.nexray.eu.cc/search/pinterestvideo?q=" },
    { name: "Anime", url: "https://azadx69x.is-a.dev/api/anime-video?q=" }
];

app.get("/", (req, res) => {
    res.json({ status: "ok", author: "TAHA KHAN", message: "Video API is running!" });
});

app.get("/api/video", async (req, res) => {
    const query = req.query.q || "anime";
    
    for (const api of APIs) {
        try {
            // Timeout sirf 3 second (Taake Vercel 10s pe kill na kare)
            const { data } = await axios.get(`${api.url}${encodeURIComponent(query)}`, { timeout: 3000 });
            const videoUrl = extractVideoUrl(data);
            
            if (videoUrl) {
                return res.json({ status: true, provider: api.name, video_url: videoUrl });
            }
        } catch (e) {}
    }

    // Agar sab fail ho jayein to Fallback Video
    return res.json({
        status: true,
        provider: "Fallback",
        video_url: "https://files.catbox.moe/4oshfr.mp4" 
    });
});

app.listen(PORT);
