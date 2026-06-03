import axios from "axios";
import dotenv from "dotenv";
import pLimit from "p-limit";

dotenv.config();

const headers = {
  "Content-Type": "application/json",
  "x-rapidapi-key": process.env.RAPIDAPI_KEY,
  "x-rapidapi-host": "instagram120.p.rapidapi.com",
};

const creatorCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; 

function emptyMetadata() {
  return {
    creator: "Unknown", followers: 0, likes: 0, comments: 0, views: 0,
    duration: "N/A", uploadDate: null, caption: "", hashtags: [], videoUrl: "", thumbnail: "",
  };
}

function extractShortcode(url) {
  const cleanUrl = url.split("?")[0].replace(/\/$/, "");
  const match = cleanUrl.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
  if (!match) throw new Error(`Invalid Instagram URL: ${url}`);
  return match[1];
}

function formatInstagramDuration(rawDuration) {
  let totalSeconds = Number(rawDuration) || 0;
  if (totalSeconds > 10000) totalSeconds = totalSeconds / 1000;
  totalSeconds = Math.floor(totalSeconds);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function fetchWithRetry(url, payload, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.post(url, payload, { headers });
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        const waitTime = Math.pow(2, i + 1) * 1000;
        console.warn(`[API 429] Rate limited. Retrying in ${waitTime}ms...`);
        await new Promise((res) => setTimeout(res, waitTime));
      } else {
        throw error;
      }
    }
  }
}

export async function getInstagramMetadata(reelUrl) {
  try {
    const shortcode = extractShortcode(reelUrl);

    // 1. FAST CRITICAL CALL: Get direct media data first
    const mediaResponse = await fetchWithRetry(
      "https://instagram120.p.rapidapi.com/api/instagram/mediaByShortcode",
      { shortcode }
    );

    const media = mediaResponse.data?.[0];
    if (!media) throw new Error("No media found");

    const username = media?.meta?.username || "Unknown";
    let followers = 0;
    let supplementalViews = 0;
    const now = Date.now();

    // 2. PARALLEL DECOUPLED FETCHING FOR SLOW METRICS
    if (creatorCache.has(username) && now - creatorCache.get(username).timestamp < CACHE_TTL) {
      const cached = creatorCache.get(username);
      followers = cached.followers;
      const matchingReel = cached.reels?.find((item) => item?.node?.media?.code === shortcode);
      supplementalViews = matchingReel?.node?.media?.play_count || matchingReel?.node?.media?.view_count || 0;
    } else {
      const [profileRes, reelsRes] = await Promise.allSettled([
        fetchWithRetry("https://instagram120.p.rapidapi.com/api/instagram/profile", { username }, 2),
        fetchWithRetry("https://instagram120.p.rapidapi.com/api/instagram/reels", { username, maxId: "" }, 2)
      ]);

      if (profileRes.status === "fulfilled") {
        const pData = profileRes.value.data;
        
        followers = 
          pData?.result?.edge_followed_by?.count || 
          pData?.result?.follower_count || 
          pData?.data?.user?.edge_followed_by?.count || 
          pData?.graphql?.user?.edge_followed_by?.count || 
          pData?.follower_count || 
          pData?.followers || 
          0;

        if (followers === 0) {
          console.warn(`⚠️ [IG API] Profile fetched, but followers is 0. Raw Data Snippet:`, JSON.stringify(pData).slice(0, 200));
        }
      } else {
        console.warn(`❌ [IG API] Profile request failed entirely:`, profileRes.reason?.message);
      }

      let reels = [];
      if (reelsRes.status === "fulfilled") {
        reels = reelsRes.value.data?.result?.edges || [];
        const matchingReel = reels.find((item) => item?.node?.media?.code === shortcode);
        supplementalViews = matchingReel?.node?.media?.play_count || matchingReel?.node?.media?.view_count || 0;
      }

      creatorCache.set(username, { followers, reels, timestamp: now });
    }

    // 3. WIDE-NET METRIC EXTRACTION (UPDATED FOR HASHTAGS)
    
    // 👈 FIX 1: Look in all the places IG might hide the caption text
    const finalCaption = 
      media?.caption?.text || 
      media?.edge_media_to_caption?.edges?.[0]?.node?.text || 
      media?.meta?.caption || 
      media?.meta?.title || 
      media?.title || 
      "";

    // 👈 FIX 2: Upgraded regex to catch unicode (international) characters and numbers in hashtags
    const hashtags = finalCaption.match(/#[\p{L}\p{N}_]+/gu) || [];
    
    const rawDuration = media?.video_duration || media?.videoDuration || media?.clips_metadata?.video_duration || 0;

    const finalViews = media?.play_count || 
                       media?.view_count || 
                       media?.video_view_count || 
                       media?.meta?.viewCount || 
                       media?.meta?.playCount || 
                       supplementalViews || 0;

    return {
      creator: username,
      followers,
      likes: media?.like_count || media?.meta?.likeCount || 0,
      comments: media?.comment_count || media?.meta?.commentCount || 0,
      views: finalViews, 
      duration: rawDuration ? formatInstagramDuration(rawDuration) : "N/A", 
      uploadDate: media?.meta?.takenAt ? new Date(media.meta.takenAt * 1000).toISOString() : null,
      caption: finalCaption, // 👈 Ensures we save the actual caption to the DB too
      hashtags,
      videoUrl: media?.urls?.[0]?.url || "",
      thumbnail: media?.pictureUrl || "",
    };
  } catch (error) {
    console.error("Instagram fetch error:", error.message);
    return emptyMetadata();
  }
}

const limit = pLimit(3);
export async function processInstagramBatch(urls) {
  const promises = urls.map((url) => limit(() => getInstagramMetadata(url)));
  return Promise.all(promises);
}