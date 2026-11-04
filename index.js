const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "";

app.use(cors());

const APIs = [
    { name: "TikTok", url: "https://api.nexray.eu.cc/search/tiktok?q=" },
    { name: "Pinterest", url: "https://api.nexray.eu.cc/search/pinterestvideo?q=" },
    { name: "YouTube", url: "https://api.nexray.eu.cc/search/youtube?q=" },
    { name: "CapCut", url: "https://api.nexray.eu.cc/search/capcut?q=" },
    { name: "Anime", url: "https://azadx69x.is-a.dev/api/anime-video?q=" },
    { name: "AMV", url: "https://azadx69x.is-a.dev/api/amv?q=" }
];

const MAX_SIZE = 30 * 1024 * 1024; // ৩০MB এর বেশি ভিডিও বাদ
const sent = new Set();            // সম্প্রতি পাঠানো ভিডিওর তালিকা
const SENT_LIMIT = 300;

function isVideoUrl(s) {
    if (!/^https?:\/\//i.test(s)) return false;
    if (/\.(jpe?g|png|webp|gif|mp3|m4a)(\?|#|$)/i.test(s)) return false;
    return /\.mp4(\?|#|$)/i.test(s) || /mime_type=video_mp4/i.test(s) || /\/video\/tos\//i.test(s);
}

function extractVideoUrls(data) {
    const found = new Set();
    (function walk(obj) {
        if (!obj) return;
        if (typeof obj === "string") {
            if (isVideoUrl(obj)) found.add(obj);
        } else if (Array.isArray(obj)) {
            obj.forEach(walk);
        } else if (typeof obj === "object") {
            if (typeof obj.size_nowm === "number" && obj.size_nowm > MAX_SIZE) return;
            Object.values(obj).forEach(walk);
        }
    })(data);
    return [...found];
}

const keyOf = (u) => u.split("?")[0];

app.get("/", (req, res) => {
    res.json({ status: "ok", author: "TAHA KHAN", endpoint: "/api/video?q=anime" });
});

app.get("/api/video", async (req, res) => {
    if (API_KEY && req.query.key !== API_KEY) {
        return res.status(401).json({ status: false, message: "Invalid key" });
    }

    const query = (req.query.q || req.query.category || "anime").toString().slice(0, 100);

    const settled = await Promise.allSettled(
        APIs.map(async (api) => {
            const { data } = await axios.get(api.url + encodeURIComponent(query), { timeout: 8000 });
            return extractVideoUrls(data).map((video_url) => ({ provider: api.name, video_url }));
        })
    );

    const pool = settled.filter((r) => r.status === "fulfilled").flatMap((r) => r.value);
    if (!pool.length) {
        return res.status(502).json({ status: false, message: "কোনো সোর্স থেকে ভিডিও পাওয়া যায়নি" });
    }

    let fresh = pool.filter((v) => !sent.has(keyOf(v.video_url)));
    if (!fresh.length) fresh = pool;

    const pick = fresh[Math.floor(Math.random() * fresh.length)];

    sent.add(keyOf(pick.video_url));
    if (sent.size > SENT_LIMIT) sent.delete(sent.values().next().value);

    return res.json({ status: true, author: "TAHA KHAN", query, ...pick });
});

app.listen(PORT, () => console.log("Server running on " + PORT));
