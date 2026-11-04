const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "";

app.use(cors());

// ---------- সোর্স (API) তালিকা ----------
const APIs = {
    TikTok:    "https://api.nexray.eu.cc/search/tiktok?q=",
    Pinterest: "https://api.nexray.eu.cc/search/pinterestvideo?q=",
    YouTube:   "https://api.nexray.eu.cc/search/youtube?q=",
    CapCut:    "https://api.nexray.eu.cc/search/capcut?q=",
    Anime:     "https://azadx69x.is-a.dev/api/anime-video?q=",
    AMV:       "https://azadx69x.is-a.dev/api/amv?q="
};

// ---------- ক্যাটাগরি অনুযায়ী কোন API ব্যবহার হবে ----------
// keywords : ইউজারের লেখা এই শব্দ থাকলে ক্যাটাগরি ধরা হবে (বাংলা সহ)
// providers: শুধু এই API গুলোতে খোঁজা হবে
// terms    : ইউজার শুধু ক্যাটাগরির নাম লিখলে এর মধ্যে থেকে র‍্যান্ডম সার্চ শব্দ যাবে
const CATEGORIES = {
    anime: {
        keywords: ["anime", "এনিমে", "অ্যানিমে", "naruto", "one piece", "manga"],
        providers: ["Anime", "AMV", "TikTok"],
        terms: ["anime", "anime fight", "anime edit", "anime scene"]
    },
    amv: {
        keywords: ["amv"],
        providers: ["AMV", "CapCut", "TikTok"],
        terms: ["anime amv", "amv edit", "amv fight"]
    },
    edit: {
        keywords: ["edit", "এডিট", "capcut", "status", "স্ট্যাটাস"],
        providers: ["CapCut", "TikTok", "Pinterest"],
        terms: ["edit", "capcut edit", "video edit", "status edit"]
    },
    funny: {
        keywords: ["funny", "comedy", "joke", "meme", "ফানি", "হাসি", "হাসির", "মজা", "মজার", "কমেডি"],
        providers: ["TikTok", "YouTube", "Pinterest"],
        terms: ["funny video", "funny moments", "comedy shorts", "funny reels", "try not to laugh"]
    },
    bike: {
        keywords: ["bike", "bikes", "motorcycle", "stunt", "বাইক"],
        providers: ["TikTok", "YouTube", "Pinterest"],
        terms: ["bike stunt", "superbike", "bike ride reels", "motorcycle edit"]
    },
    car: {
        keywords: ["car", "cars", "supercar", "গাড়ি", "গাড়ী"],
        providers: ["TikTok", "YouTube", "Pinterest"],
        terms: ["car edit", "supercar", "luxury car", "car drift"]
    },
    islamic: {
        keywords: ["islamic", "islam", "ইসলামিক", "ইসলাম", "quran", "কুরআন", "naat", "নাত", "waz", "ওয়াজ", "dua"],
        providers: ["YouTube", "TikTok", "Pinterest"],
        terms: ["islamic video", "islamic reminder", "quran recitation", "islamic status", "naat"]
    },
    dance: {
        keywords: ["dance", "dancing", "ড্যান্স", "ডান্স", "নাচ", "choreography"],
        providers: ["TikTok", "YouTube", "Pinterest", "CapCut"],
        terms: ["trending dance", "dance reels", "viral dance challenge", "wedding dance", "group dance performance", "stage dance performance"],
        fixedTerms: true, // ইউজারের বাড়তি শব্দ সার্চে যাবে না, সবসময় নির্দিষ্ট term ব্যবহার হবে
        girlTerms: ["girls dance reels", "girls group dance", "girl dance cover", "bangla girls dance", "girls wedding dance", "girl classical dance"]
    },
    girls: {
        keywords: ["girls", "girl", "মেয়ে", "মেয়েদের"],
        providers: ["TikTok", "YouTube", "Pinterest", "CapCut"],
        terms: ["girls dance reels", "girls group dance", "girl song cover", "girl singing", "bangla girls song", "girls lip sync song"],
        fixedTerms: true
    },
    music: {
        keywords: ["music", "song", "songs", "গান", "মিউজিক", "lofi", "lyrics"],
        providers: ["YouTube", "TikTok", "CapCut"],
        terms: ["music video", "new song", "lofi song", "song lyrics video"]
    },
    sad: {
        keywords: ["sad", "কষ্ট", "দুঃখ", "heartbreak", "breakup"],
        providers: ["TikTok", "CapCut", "Pinterest", "YouTube"],
        terms: ["sad status", "sad edit", "heartbreak video", "sad song status"]
    },
    attitude: {
        keywords: ["attitude", "এটিটিউড", "sigma", "boss", "swag"],
        providers: ["TikTok", "CapCut", "Pinterest"],
        terms: ["attitude status", "sigma edit", "boss attitude", "swag edit"]
    },
    love: {
        keywords: ["love", "romantic", "প্রেম", "ভালোবাসা", "couple"],
        providers: ["TikTok", "CapCut", "Pinterest", "YouTube"],
        terms: ["love status", "romantic video", "couple goals", "love edit"]
    },
    football: {
        keywords: ["football", "soccer", "ফুটবল", "messi", "ronaldo", "neymar"],
        providers: ["TikTok", "YouTube", "CapCut"],
        terms: ["football skills", "football edit", "football goals", "football highlights"]
    },
    hot: {
        keywords: ["hot", "trending", "viral", "ট্রেন্ডিং", "ভাইরাল"],
        providers: ["TikTok", "YouTube", "Pinterest"],
        terms: ["trending video", "viral reels", "viral shorts", "trending now"]
    }
};

// কোনো ক্যাটাগরি না মিললে এই সোর্সগুলো (Anime/AMV ইচ্ছে করেই বাদ)
const GENERAL_PROVIDERS = ["TikTok", "Pinterest", "YouTube", "CapCut"];

const MAX_SIZE = 30 * 1024 * 1024; // ৩০MB এর বেশি ভিডিও বাদ
const sent = new Set();            // সম্প্রতি পাঠানো ভিডিওর তালিকা
const SENT_LIMIT = 500;

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
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ইউজারের লেখা থেকে ক্যাটাগরি বের করা
function detectCategory(q) {
    const text = q.toLowerCase();
    const words = text.split(/\s+/);
    for (const [name, cat] of Object.entries(CATEGORIES)) {
        const hit = cat.keywords.some((k) =>
            k.includes(" ") || /[^\x00-\x7F]/.test(k) ? text.includes(k) : words.includes(k)
        );
        if (hit) return name;
    }
    return null;
}

async function fetchFrom(providerNames, term) {
    const settled = await Promise.allSettled(
        providerNames.map(async (name) => {
            const { data } = await axios.get(APIs[name] + encodeURIComponent(term), { timeout: 8000 });
            return extractVideoUrls(data).map((video_url) => ({ provider: name, video_url }));
        })
    );
    return settled.filter((r) => r.status === "fulfilled").flatMap((r) => r.value);
}

// আগে প্রোভাইডার র‍্যান্ডম বাছা, তারপর তার ভিডিও — যাতে একটা সোর্স সব দখল না করে
function pickVideo(pool) {
    const fresh = pool.filter((v) => !sent.has(keyOf(v.video_url)));
    const list = fresh.length ? fresh : pool;
    const byProvider = {};
    list.forEach((v) => (byProvider[v.provider] = byProvider[v.provider] || []).push(v));
    return rand(byProvider[rand(Object.keys(byProvider))]);
}

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        author: "TAHA KHAN",
        endpoint: "/api/video?q=funny",
        categories: Object.keys(CATEGORIES)
    });
});

app.get("/api/video", async (req, res) => {
    if (API_KEY && req.query.key !== API_KEY) {
        return res.status(401).json({ status: false, message: "Invalid key" });
    }

    const query = (req.query.q || req.query.category || "").toString().trim().slice(0, 100);
    const category = detectCategory(query);
    const cat = category ? CATEGORIES[category] : null;

    // সার্চ শব্দ: শুধু ক্যাটাগরির নাম লিখলে র‍্যান্ডম term, নইলে ইউজারের নিজের শব্দ
    const useCatTerms = cat && (cat.fixedTerms || cat.keywords.includes(query.toLowerCase()));
    const wantsGirls = cat && cat.girlTerms && /girl|মেয়ে|মেয়েদের/i.test(query);
    const term = !query ? rand(CATEGORIES.hot.terms)
        : wantsGirls ? rand(cat.girlTerms)
        : useCatTerms ? rand(cat.terms)
        : query;
    const providers = cat ? cat.providers : GENERAL_PROVIDERS;

    let pool = await fetchFrom(providers, term);

    // কিছু না পেলে ক্যাটাগরির অন্য term দিয়ে আবার চেষ্টা
    if (!pool.length && cat) {
        pool = await fetchFrom(providers, rand(cat.terms));
    }
    // তবুও না পেলে জেনারেল সোর্সে (anime বাদে অন্য ক্যাটাগরিতে Anime/AMV কখনো যাবে না)
    if (!pool.length) {
        const backup = GENERAL_PROVIDERS.filter((p) => !providers.includes(p));
        if (backup.length) pool = await fetchFrom(backup, term);
    }

    if (!pool.length) {
        return res.status(502).json({ status: false, message: "কোনো সোর্স থেকে ভিডিও পাওয়া যায়নি" });
    }

    const pick = pickVideo(pool);

    sent.add(keyOf(pick.video_url));
    if (sent.size > SENT_LIMIT) sent.delete(sent.values().next().value);

    return res.json({
        status: true,
        author: "TAHA KHAN",
        query,
        category: category || "general",
        searched: term,
        ...pick
    });
});

app.listen(PORT, () => console.log("Server running on " + PORT));
