import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const headers = {
  "Content-Type": "application/json",
  "x-rapidapi-key": process.env.RAPIDAPI_KEY,
  "x-rapidapi-host": "instagram120.p.rapidapi.com",
};

function emptyMetadata() {
  return {
    creator: "Unknown",
    followers: 0,
    likes: 0,
    comments: 0,
    views: 0,
    duration: "Unknown",
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

  if (!match) {
    throw new Error(`Invalid Instagram URL: ${url}`);
  }

  return match[1];
}

export async function getInstagramMetadata(reelUrl) {
  try {
    console.log("Processing Instagram URL:", reelUrl);

    const shortcode = extractShortcode(reelUrl);
    console.log("Shortcode:", shortcode);

    // ----------------------------------
    // Reel Metadata
    // ----------------------------------
    const mediaResponse = await axios.post(
      "https://instagram120.p.rapidapi.com/api/instagram/mediaByShortcode",
      { shortcode },
      { headers }
    );

    const media = mediaResponse.data?.[0];

    if (!media) {
      throw new Error("No media found");
    }

    // THIS WILL PRINT THE OBJECT TO YOUR TERMINAL
    console.log("----- MEDIA OBJECT START -----");
    console.log(JSON.stringify(media, null, 2));
    console.log("----- MEDIA OBJECT END -----");

    const username = media?.meta?.username;

    // ----------------------------------
    // Followers
    // ----------------------------------
    let followers = 0;
    try {
      const profileResponse = await axios.post(
        "https://instagram120.p.rapidapi.com/api/instagram/profile",
        { username },
        { headers }
      );

      followers =
        profileResponse.data?.result?.edge_followed_by?.count ||
        profileResponse.data?.result?.follower_count ||
        profileResponse.data?.result?.user?.follower_count ||
        0;
    } catch (err) {
      console.log("Profile fetch failed:", err.message);
    }

    // ----------------------------------
    // Reel Views
    // ----------------------------------
    let views = 0;
    try {
      const reelsResponse = await axios.post(
        "https://instagram120.p.rapidapi.com/api/instagram/reels",
        { username, maxId: "" },
        { headers }
      );

      const reels = reelsResponse.data?.result?.edges || [];
      const matchingReel = reels.find(
        (item) => item?.node?.media?.code === shortcode
      );

      views =
        matchingReel?.node?.media?.play_count ||
        matchingReel?.node?.media?.view_count ||
        0;
    } catch (err) {
      console.log("Views fetch failed:", err.message);
    }

    // ----------------------------------
    // Duration Extraction
    // ----------------------------------
    let duration =
      media?.meta?.duration_s ||
      media?.meta?.duration ||
      media?.meta?.videoDuration ||
      media?.meta?.video_duration ||
      media?.duration ||
      media?.videoDuration ||
      0;

    // Fallback: Try to extract from the video URL if direct property fails
    if (!duration) {
      try {
        const decodedUrl = decodeURIComponent(media?.urls?.[0]?.url || "");
        const match = decodedUrl.match(/duration_s["=:]+(\d+)/);
        if (match) {
          duration = Number(match[1]);
        }
      } catch (err) {
        console.log("Regex duration extraction failed");
      }
    }

    // ----------------------------------
    // Caption + Hashtags
    // ----------------------------------
    const caption = media?.meta?.title || "";
    const hashtags = caption.match(/#\w+/g) || [];

    // ----------------------------------
    // Return Metadata
    // ----------------------------------
    return {
      creator: username || "Unknown",
      followers,
      likes: media?.meta?.likeCount || 0,
      comments: media?.meta?.commentCount || 0,
      views,
      duration: duration > 0 ? `${duration}s` : "Unknown",
      uploadDate: media?.meta?.takenAt
        ? new Date(media.meta.takenAt * 1000).toISOString()
        : null,
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