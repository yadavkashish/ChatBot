import axios from "axios";
import dotenv from "dotenv";
import pLimit from "p-limit";

dotenv.config();

const headers = {
  "Content-Type": "application/json",
  "x-rapidapi-key": process.env.RAPIDAPI_KEY,
  "x-rapidapi-host": "instagram120.p.rapidapi.com",
};

// ----------------------------------
// 1. In-Memory Cache Setup
// ----------------------------------
const creatorCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; 

function emptyMetadata() {
  return {
    creator: "Unknown",
    followers: 0,
    likes: 0,
    comments: 0,
    views: 0,
    uploadDate: null,
    caption: "",
    hashtags: [],
    videoUrl: "",
    thumbnail: "",
  };
}

function extractShortcode(url) {
  const cleanUrl = url.split("?")[0].replace(/\/$/, "");
  const match = cleanUrl.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
  if (!match) throw new Error(`Invalid Instagram URL: ${url}`);
  return match[1];
}

// ----------------------------------
// 2. Smart Fetch with Retry 
// ----------------------------------
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

// ----------------------------------
// 3. Main Fetch Function
// ----------------------------------
export async function getInstagramMetadata(reelUrl) {
  try {
    const shortcode = extractShortcode(reelUrl);

    const mediaResponse = await fetchWithRetry(
      "https://instagram120.p.rapidapi.com/api/instagram/mediaByShortcode",
      { shortcode }
    );

    const media = mediaResponse.data?.[0];
    if (!media) throw new Error("No media found");

    const username = media?.meta?.username || "Unknown";
    let followers = 0;
    let views = 0;
    const now = Date.now();

    // ----------------------------------
    // 4. Cache Check vs API Fetch
    // ----------------------------------
    if (creatorCache.has(username) && now - creatorCache.get(username).timestamp < CACHE_TTL) {
      const cached = creatorCache.get(username);
      followers = cached.followers;

      const matchingReel = cached.reels?.find((item) => item?.node?.media?.code === shortcode);
      views = matchingReel?.node?.media?.play_count || matchingReel?.node?.media?.view_count || 0;
    } else {
      let reels = [];

      try {
        const profileResponse = await fetchWithRetry(
          "https://instagram120.p.rapidapi.com/api/instagram/profile",
          { username },
          1 
        );
        followers =
          profileResponse.data?.result?.edge_followed_by?.count ||
          profileResponse.data?.result?.follower_count ||
          0;
      } catch (err) {
        // Silently fail to keep logs clean
      }

      try {
        const reelsResponse = await fetchWithRetry(
          "https://instagram120.p.rapidapi.com/api/instagram/reels",
          { username, maxId: "" },
          1 
        );
        reels = reelsResponse.data?.result?.edges || [];
        const matchingReel = reels.find((item) => item?.node?.media?.code === shortcode);
        views = matchingReel?.node?.media?.play_count || matchingReel?.node?.media?.view_count || 0;
      } catch (err) {
         // Silently fail to keep logs clean
      }

      creatorCache.set(username, { followers, reels, timestamp: now });
    }

    // ----------------------------------
    // 5. Construct Final Payload
    // ----------------------------------
    const caption = media?.meta?.title || "";
    const hashtags = caption.match(/#\w+/g) || [];

    return {
      creator: username,
      followers,
      likes: media?.meta?.likeCount || 0,
      comments: media?.meta?.commentCount || 0,
      views: views || media?.meta?.viewCount || media?.meta?.playCount || 0,
      uploadDate: media?.meta?.takenAt ? new Date(media.meta.takenAt * 1000).toISOString() : null,
      caption,
      hashtags,
      videoUrl: media?.urls?.[0]?.url || "",
      thumbnail: media?.pictureUrl || "",
    };
  } catch (error) {
    console.error(
      "Instagram fetch error:",
      error.response?.status,
      error.response?.data || error.message
    );
    return emptyMetadata();
  }
}

// ----------------------------------
// 6. Batch Processor 
// ----------------------------------
const limit = pLimit(3);

export async function processInstagramBatch(urls) {
  const promises = urls.map((url) =>
    limit(async () => {
      return await getInstagramMetadata(url);
    })
  );

  const results = await Promise.all(promises);
  return results;
}