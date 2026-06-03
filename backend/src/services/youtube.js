import { google } from "googleapis";
import pLimit from "p-limit";

// Only need to limit the official Google API now
const apiLimit = pLimit(5); 

function extractYoutubeId(url) {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
}

function parseYouTubeDuration(durationStr) {
  if (!durationStr) return "0:00";
  
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export async function getYoutubeMetadata(url) {
  return apiLimit(async () => {
    try {
      console.log("YT KEY LOADED:", !!process.env.YOUTUBE_API_KEY);
      
      const videoId = extractYoutubeId(url);
      if (!videoId) throw new Error("Invalid YouTube URL");

      const youtube = google.youtube({ version: "v3" });

      const response = await youtube.videos.list({
        key: process.env.YOUTUBE_API_KEY,
        part: ["snippet", "statistics", "contentDetails"],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video) throw new Error("Video not found");

      let subscribers = 0;
      try {
        const channelResponse = await youtube.channels.list({
          key: process.env.YOUTUBE_API_KEY,
          part: ["statistics"],
          id: [video.snippet.channelId],
        });
        subscribers = Number(channelResponse.data.items?.[0]?.statistics?.subscriberCount || 0);
      } catch (err) {
        console.log("Channel fetch failed:", err.message);
      }

      // 👈 FIX 1: Upgraded regex to catch ALL unicode characters in description hashtags
      const description = video.snippet?.description || "";
      const descHashtags = description.match(/#[\p{L}\p{N}_]+/gu) || [];

      // 👈 FIX 2: Grab YouTube's hidden backend tags and format them with a '#'
      const nativeTags = (video.snippet?.tags || []).map(tag => `#${tag.replace(/\s+/g, '')}`);

      // 👈 FIX 3: Merge both lists and remove duplicates using a Set
      const combinedHashtags = [...new Set([...descHashtags, ...nativeTags])];

      return {
        title: video.snippet?.title || "",
        creator: video.snippet?.channelTitle || "Unknown",
        subscribers,
        hashtags: combinedHashtags, // 👈 Now contains all possible tags
        uploadDate: video.snippet?.publishedAt || null,
        views: Number(video.statistics?.viewCount || 0),
        likes: Number(video.statistics?.likeCount || 0),
        comments: Number(video.statistics?.commentCount || 0),
        duration: parseYouTubeDuration(video.contentDetails?.duration),
      };
    } catch (error) {
      console.error("YOUTUBE METADATA ERROR:", error.message);
      throw error;
    }
  });
}

export async function processYoutubeBatch(urls) {
  console.log(`Starting batch process for ${urls.length} YouTube URLs...`);
  
  const promises = urls.map((url) =>
    getYoutubeMetadata(url).catch((err) => {
      console.error(`Skipping broken URL (${url}):`, err.message);
      return null;
    })
  );

  const results = await Promise.all(promises);
  return results.filter(Boolean);
}