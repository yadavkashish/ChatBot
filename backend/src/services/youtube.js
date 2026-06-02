import { google } from "googleapis";
import pLimit from "p-limit";
import { YoutubeTranscript } from "youtube-transcript";

// 1. Concurrency Limiters
const apiLimit = pLimit(5); // Official API can handle multiple concurrent requests
const scraperLimit = pLimit(1); // Scraper strictly 1 at a time to prevent Captcha blocks

function extractYoutubeId(url) {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
}

// Add this helper function at the top of youtube.js
function parseYouTubeDuration(durationStr) {
  if (!durationStr) return "0:00";
  
  // Safe Regex: Handles missing minutes or seconds perfectly
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

  // Format to HH:MM:SS or MM:SS
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// In your getYoutubeMetadata return object, keep it exactly like this:
// duration: parseYouTubeDuration(video.contentDetails?.duration),

// 2. Safe, throttled transcript fetcher
async function getSafeTranscript(videoId) {
  return scraperLimit(async () => {
    try {
      // 2-second cooldown to avoid triggering YouTube's anti-bot system
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      console.log(`📥 Scraping transcript for video: ${videoId}`);
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      return transcript.map((t) => t.text).join(" ");
    } catch (error) {
      // Return empty string instead of crashing so the rest of the metadata still works
      console.warn(`⚠️ Transcript fetch failed for ${videoId} (likely rate-limited):`, error.message);
      return ""; 
    }
  });
}

// 3. Main Metadata Fetcher
export async function getYoutubeMetadata(url) {
  return apiLimit(async () => {
    try {
      console.log("YT KEY LOADED:", !!process.env.YOUTUBE_API_KEY);
      
      const videoId = extractYoutubeId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      const youtube = google.youtube({ version: "v3" });

      // Fetch video details
      const response = await youtube.videos.list({
        key: process.env.YOUTUBE_API_KEY,
        part: ["snippet", "statistics", "contentDetails"],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video) {
        throw new Error("Video not found");
      }

      // Fetch subscriber count gracefully
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

      const description = video.snippet?.description || "";
      const hashtags = description.match(/#\w+/g) || [];

      // Fetch transcript using the safe throttled function
      const transcript = await getSafeTranscript(videoId);

      return {
        title: video.snippet?.title || "",
        creator: video.snippet?.channelTitle || "Unknown",
        subscribers,
        hashtags,
        uploadDate: video.snippet?.publishedAt || null,
        views: Number(video.statistics?.viewCount || 0),
        likes: Number(video.statistics?.likeCount || 0),
        comments: Number(video.statistics?.commentCount || 0),
        duration: parseYouTubeDuration(video.contentDetails?.duration), // Now returns proper seconds!
        transcript,
      };
    } catch (error) {
      console.error("YOUTUBE METADATA ERROR:", error.message);
      throw error;
    }
  });
}

// 4. Batch Processor (Use this in your Route Controller)
export async function processYoutubeBatch(urls) {
  console.log(`Starting batch process for ${urls.length} YouTube URLs...`);
  
  // Maps all URLs through our concurrency-limited workers safely
  const promises = urls.map((url) =>
    getYoutubeMetadata(url).catch((err) => {
      console.error(`Skipping broken URL (${url}):`, err.message);
      return null; // Don't let one bad URL break Promise.all
    })
  );

  const results = await Promise.all(promises);
  return results.filter(Boolean); // Filter out any URLs that failed completely
}