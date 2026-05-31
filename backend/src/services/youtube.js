import { google } from "googleapis";

function extractYoutubeId(url) {
  const match = url.match(
    /(?:v=|\/)([0-9A-Za-z_-]{11})/
  );

  return match ? match[1] : null;
}

export async function getYoutubeMetadata(
  url
) {
  try {

    console.log(
      "YT KEY LOADED:",
      !!process.env.YOUTUBE_API_KEY
    );

    const videoId =
      extractYoutubeId(url);

    if (!videoId) {
      throw new Error(
        "Invalid YouTube URL"
      );
    }

    const youtube =
      google.youtube({
        version: "v3",
      });

    const response =
      await youtube.videos.list({
        key:
          process.env
            .YOUTUBE_API_KEY,

        part: [
          "snippet",
          "statistics",
          "contentDetails",
        ],

        id: [videoId],
      });

    const video =
      response.data.items?.[0];

    if (!video) {
      throw new Error(
        "Video not found"
      );
    }

    // Get subscriber count
    const channelResponse =
      await youtube.channels.list({
        key:
          process.env
            .YOUTUBE_API_KEY,

        part: [
          "statistics",
        ],

        id: [
          video.snippet.channelId,
        ],
      });

    const subscribers =
      Number(
        channelResponse
          .data
          .items?.[0]
          ?.statistics
          ?.subscriberCount || 0
      );

    // Extract hashtags
    const description =
      video.snippet
        ?.description || "";

    const hashtags =
      description.match(
        /#\w+/g
      ) || [];

    return {

      title:
        video.snippet?.title ||
        "",

      creator:
        video.snippet
          ?.channelTitle ||
        "Unknown",

      subscribers,

      hashtags,

      uploadDate:
        video.snippet
          ?.publishedAt ||
        null,

      views:
        Number(
          video.statistics
            ?.viewCount || 0
        ),

      likes:
        Number(
          video.statistics
            ?.likeCount || 0
        ),

      comments:
        Number(
          video.statistics
            ?.commentCount || 0
        ),

      duration:
        video.contentDetails
          ?.duration || "",
    };

  } catch (error) {

    console.error(
      "YOUTUBE METADATA ERROR:"
    );

    console.error(
      error.message
    );

    throw error;
  }
}