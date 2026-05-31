import express from "express";
import { getTranscript } from "../services/transcript.js";
import { getYoutubeMetadata } from "../services/youtube.js";
import { getInstagramMetadata } from "../services/instagram.js";
import { chunkText } from "../utils/chunker.js";
import { getEngagementRate } from "../utils/engagement.js";
import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "../services/embeddings.js";
import { QdrantClient } from "@qdrant/js-client-rest";

const router = express.Router();

function isYoutube(url) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

router.post("/", async (req, res) => {
  try {
    const { videoA, videoB } = req.body;

    const metadataA = isYoutube(videoA)
      ? await getYoutubeMetadata(videoA)
      : await getInstagramMetadata(videoA);

    const metadataB = isYoutube(videoB)
      ? await getYoutubeMetadata(videoB)
      : await getInstagramMetadata(videoB);

    console.log("Metadata A:", metadataA);
    console.log("Metadata B:", metadataB);

    const transcriptA = await getTranscript(videoA);
    const transcriptB = await getTranscript(videoB);

    console.log("Transcript A Length:", transcriptA?.length);
    console.log("Transcript B Length:", transcriptB?.length);

    const docsA = await chunkText(transcriptA || "");
    const docsB = await chunkText(transcriptB || "");

    console.log("Docs A:", docsA.length);
    console.log("Docs B:", docsB.length);

    docsA.forEach((doc, index) => {
      doc.metadata = {
        video_id: "A",
        chunk: index + 1,
        creator: metadataA.creator,
        views: metadataA.views || 0,
        likes: metadataA.likes || 0,
        comments: metadataA.comments || 0,
        followers: metadataA.followers || metadataA.subscribers || 0,
        duration: metadataA.duration,
        uploadDate: metadataA.uploadDate,
        engagementRate: getEngagementRate(
          metadataA.views,
          metadataA.likes,
          metadataA.comments
        ),
      };
    });

    docsB.forEach((doc, index) => {
      doc.metadata = {
        video_id: "B",
        chunk: index + 1,
        creator: metadataB.creator,
        views: metadataB.views || 0,
        likes: metadataB.likes || 0,
        comments: metadataB.comments || 0,
        followers: metadataB.followers || metadataB.subscribers || 0, // Updated line here
        duration: metadataB.duration,
        uploadDate: metadataB.uploadDate,
        engagementRate: getEngagementRate(
          metadataB.views,
          metadataB.likes,
          metadataB.comments
        ),
      };
    });

    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });

    try {
      await qdrant.deleteCollection("creator-analysis");
      console.log("Old collection deleted");
    } catch (err) {
      console.log("Collection does not exist yet");
    }

    await QdrantVectorStore.fromDocuments(
      [...docsA, ...docsB],
      embeddings,
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: "creator-analysis",
      }
    );

    console.log("Inserted docs:", docsA.length + docsB.length);

    // Store metadata globally for RAG
    global.videoAnalysis = {
      A: {
        ...metadataA,
        followers: metadataA.followers || metadataA.subscribers || 0,
        engagementRate: getEngagementRate(
          metadataA.views,
          metadataA.likes,
          metadataA.comments
        ),
      },
      B: {
        ...metadataB,
        followers: metadataB.followers || metadataB.subscribers || 0,
        engagementRate: getEngagementRate(
          metadataB.views,
          metadataB.likes,
          metadataB.comments
        ),
      },
    };

    console.log("VIDEO A SENT:", global.videoAnalysis.A);
    console.log("VIDEO B SENT:", global.videoAnalysis.B);

    res.json({
      success: true,
      videoA: {
        ...metadataA,
        followers: metadataA.followers || metadataA.subscribers || 0,
        engagementRate: getEngagementRate(
          metadataA.views,
          metadataA.likes,
          metadataA.comments
        ),
      },
      videoB: {
        ...metadataB,
        followers: metadataB.followers || metadataB.subscribers || 0,
        engagementRate: getEngagementRate(
          metadataB.views,
          metadataB.likes,
          metadataB.comments
        ),
      },
    });

  } catch (error) {
    console.error("ANALYZE ERROR:", error);
    console.error(error.stack);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;