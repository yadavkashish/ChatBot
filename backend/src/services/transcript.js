import { YoutubeTranscript }
from "youtube-transcript";

import {
  getInstagramMetadata,
}
from "./instagram.js";

function extractYoutubeId(url) {
  const match = url.match(
    /(?:v=|\/)([0-9A-Za-z_-]{11})/
  );

  return match ? match[1] : null;
}

async function getYoutubeTranscript(
  url
) {
  const videoId =
    extractYoutubeId(url);

  const transcript =
    await YoutubeTranscript.fetchTranscript(
      videoId
    );

  return transcript
    .map(
      item => item.text
    )
    .join(" ");
}

async function getInstagramTranscript(
  reelUrl
) {
  const metadata =
    await getInstagramMetadata(
      reelUrl
    );

  return (
    metadata.caption ||
    "Instagram caption unavailable"
  );
}

export async function getTranscript(
  url
) {

  if (
    url.includes(
      "youtube.com"
    ) ||
    url.includes(
      "youtu.be"
    )
  ) {
    return await getYoutubeTranscript(
      url
    );
  }

  if (
    url.includes(
      "instagram.com"
    )
  ) {
    return await getInstagramTranscript(
      url
    );
  }

  return "";
}