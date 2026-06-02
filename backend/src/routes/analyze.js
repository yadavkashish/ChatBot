import express from "express";
import { v4 as uuidv4 } from "uuid"; 
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
    
    // 1. GENERATE UNIQUE SESSION ID
    const sessionId = uuidv4(); 

    console.time("⏱️ ANALYSIS TOTAL TIME");

    const platformA = isYoutube(videoA) ? "youtube" : "instagram";
    const platformB = isYoutube(videoB) ? "youtube" : "instagram";

    // ==========================
    // Parallel Fetch
    // ==========================
    const [
      metadataA,
      metadataB,
      transcriptA,
      transcriptB,
    ] = await Promise.all([
      platformA === "youtube" ? getYoutubeMetadata(videoA) : getInstagramMetadata(videoA),
      platformB === "youtube" ? getYoutubeMetadata(videoB) : getInstagramMetadata(videoB),
      getTranscript(videoA),
      getTranscript(videoB),
    ]);

    console.log(`🚀 Analyzing: [@${metadataA.creator}] vs [@${metadataB.creator}]`);

    // ==========================
    // Chunking
    // ==========================
    const [docsA, docsB] = await Promise.all([
      chunkText(transcriptA || ""),
      chunkText(transcriptB || ""),
    ]);

    const engagementA = getEngagementRate(metadataA.views, metadataA.likes, metadataA.comments);
    const engagementB = getEngagementRate(metadataB.views, metadataB.likes, metadataB.comments);

    // 2. ATTACH SESSION ID TO METADATA
    docsA.forEach((doc, index) => {
      doc.metadata = {
        sessionId, 
        video_id: "A",
        platform: platformA,
        chunk: index + 1,
        creator: metadataA.creator,
        views: metadataA.views || 0,
        likes: metadataA.likes || 0,
        comments: metadataA.comments || 0,
        followers: metadataA.followers || metadataA.subscribers || 0,
        duration: metadataA.duration,
        uploadDate: metadataA.uploadDate,
        engagementRate: engagementA,
      };
    });

    docsB.forEach((doc, index) => {
      doc.metadata = {
        sessionId, 
        video_id: "B",
        platform: platformB,
        chunk: index + 1,
        creator: metadataB.creator,
        views: metadataB.views || 0,
        likes: metadataB.likes || 0,
        comments: metadataB.comments || 0,
        followers: metadataB.followers || metadataB.subscribers || 0,
        duration: metadataB.duration,
        uploadDate: metadataB.uploadDate,
        engagementRate: engagementB,
      };
    });

    // ==========================
    // Vector Database Insert 
    // ==========================
    await QdrantVectorStore.fromDocuments(
      [...docsA, ...docsB],
      embeddings,
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: "creator-analysis",
      }
    );

    const qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });

    try {
      await qdrantClient.createPayloadIndex("creator-analysis", {
        field_name: "metadata.sessionId",
        field_schema: "keyword",
      });
      console.log("✅ Qdrant Index verified for session data");
    } catch (e) {
      // Safely ignore if the index already exists
    }

    console.log(`💾 Sync Complete: Vectorized ${docsA.length + docsB.length} chunks.`);

    console.timeEnd("⏱️ ANALYSIS TOTAL TIME");

    // 3. SEND SESSION ID & MAPPED DATA TO FRONTEND
    res.json({
      success: true,
      sessionId: sessionId, 
      videoA: {
        ...metadataA,
        followers: metadataA.followers || metadataA.subscribers || 0, // Mapped for React
        platform: platformA,
        engagementRate: engagementA,
      },
      videoB: {
        ...metadataB,
        followers: metadataB.followers || metadataB.subscribers || 0, // Mapped for React
        platform: platformB,
        engagementRate: engagementB,
      },
    });

  } catch (error) {
    console.error("❌ ANALYZE ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;