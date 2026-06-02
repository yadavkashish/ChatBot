import axios from "axios";
import { getInstagramMetadata } from "./instagram.js";

function extractYoutubeId(url) {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
}

// ----------------------------------
// YouTube Fetcher (RapidAPI: youtube-transcript3)
// ----------------------------------
async function getYoutubeTranscript(url) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return "";

  try {
    console.log(`📥 Fetching transcript via RapidAPI for: ${videoId}`);
    
    const response = await axios.get(
      "https://youtube-transcript3.p.rapidapi.com/api/transcript",
      {
        params: { videoId: videoId },
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
        },
      }
    );

    const data = response.data;

    // 1. Check if the API explicitly failed (e.g., no captions exist)
    if (data && data.success === false) {
      console.warn(`⚠️ Transcript unavailable for ${videoId}:`, data.error?.trim() || "No captions found.");
      return "";
    }

    // 2. If successful, map the text blocks into a single string
    if (data && data.transcript && Array.isArray(data.transcript)) {
      return data.transcript.map((item) => item.text).join(" ");
    }
    
    // Fallback if the structure is slightly different
    return "";

  } catch (error) {
    console.warn(`⚠️ Transcript API request failed for ${videoId}:`, error.message);
    return ""; // Safely fallback so the app doesn't crash
  }
}

// ----------------------------------
// Instagram Fetcher
// ----------------------------------
async function getInstagramTranscript(reelUrl) {
  const metadata = await getInstagramMetadata(reelUrl);
  return metadata.caption || "Instagram caption unavailable";
}

// ----------------------------------
// Main Router
// ----------------------------------
export async function getTranscript(url) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return await getYoutubeTranscript(url);
  }

  if (url.includes("instagram.com")) {
    return await getInstagramTranscript(url);
  }

  return "";
}