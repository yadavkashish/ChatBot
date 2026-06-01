import express from "express";
import { getTranscript }
from "../services/transcript.js";

import { getYoutubeMetadata }
from "../services/youtube.js";

import { getInstagramMetadata }
from "../services/instagram.js";

import { chunkText }
from "../utils/chunker.js";

import { getEngagementRate }
from "../utils/engagement.js";

import { QdrantVectorStore }
from "@langchain/qdrant";

import { embeddings }
from "../services/embeddings.js";

const router = express.Router();

function isYoutube(url) {
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  );
}

router.post("/", async (req, res) => {
  try {

    const {
      videoA,
      videoB,
    } = req.body;

    console.time("ANALYSIS");

    // ==========================
    // Parallel Fetch
    // ==========================

    const [
      metadataA,
      metadataB,
      transcriptA,
      transcriptB,
    ] = await Promise.all([

      isYoutube(videoA)
        ? getYoutubeMetadata(videoA)
        : getInstagramMetadata(videoA),

      isYoutube(videoB)
        ? getYoutubeMetadata(videoB)
        : getInstagramMetadata(videoB),

      getTranscript(videoA),

      getTranscript(videoB),
    ]);

    console.log(
      "Metadata A:",
      metadataA
    );

    console.log(
      "Metadata B:",
      metadataB
    );

    console.log(
      "Transcript A Length:",
      transcriptA?.length
    );

    console.log(
      "Transcript B Length:",
      transcriptB?.length
    );

    // ==========================
    // Chunking
    // ==========================

    const [
      docsA,
      docsB,
    ] = await Promise.all([

      chunkText(
        transcriptA || ""
      ),

      chunkText(
        transcriptB || ""
      ),
    ]);

    console.log(
      "Docs A:",
      docsA.length
    );

    console.log(
      "Docs B:",
      docsB.length
    );

    const engagementA =
      getEngagementRate(
        metadataA.views,
        metadataA.likes,
        metadataA.comments
      );

    const engagementB =
      getEngagementRate(
        metadataB.views,
        metadataB.likes,
        metadataB.comments
      );

    docsA.forEach(
      (doc, index) => {

        doc.metadata = {

          video_id: "A",

          chunk:
            index + 1,

          creator:
            metadataA.creator,

          views:
            metadataA.views || 0,

          likes:
            metadataA.likes || 0,

          comments:
            metadataA.comments || 0,

          followers:
            metadataA.followers ||
            metadataA.subscribers ||
            0,

          duration:
            metadataA.duration,

          uploadDate:
            metadataA.uploadDate,

          engagementRate:
            engagementA,
        };
      }
    );

    docsB.forEach(
      (doc, index) => {

        doc.metadata = {

          video_id: "B",

          chunk:
            index + 1,

          creator:
            metadataB.creator,

          views:
            metadataB.views || 0,

          likes:
            metadataB.likes || 0,

          comments:
            metadataB.comments || 0,

          followers:
            metadataB.followers ||
            metadataB.subscribers ||
            0,

          duration:
            metadataB.duration,

          uploadDate:
            metadataB.uploadDate,

          engagementRate:
            engagementB,
        };
      }
    );

    // ==========================
    // Vector Insert
    // ==========================

    await QdrantVectorStore.fromDocuments(
      [
        ...docsA,
        ...docsB,
      ],
      embeddings,
      {
        url:
          process.env.QDRANT_URL,

        apiKey:
          process.env
            .QDRANT_API_KEY,

        collectionName:
          "creator-analysis",
      }
    );

    console.log(
      "Inserted docs:",
      docsA.length +
      docsB.length
    );

    // ==========================
    // Global Metadata
    // ==========================

    global.videoAnalysis = {

      A: {

        ...metadataA,

        followers:
          metadataA.followers ||
          metadataA.subscribers ||
          0,

        engagementRate:
          engagementA,
      },

      B: {

        ...metadataB,

        followers:
          metadataB.followers ||
          metadataB.subscribers ||
          0,

        engagementRate:
          engagementB,
      },
    };

    console.timeEnd(
      "ANALYSIS"
    );

    res.json({

      success: true,

      videoA: {

        ...metadataA,

        followers:
          metadataA.followers ||
          metadataA.subscribers ||
          0,

        engagementRate:
          engagementA,
      },

      videoB: {

        ...metadataB,

        followers:
          metadataB.followers ||
          metadataB.subscribers ||
          0,

        engagementRate:
          engagementB,
      },
    });

  } catch (error) {

    console.error(
      "ANALYZE ERROR:",
      error
    );

    res.status(500).json({
      error:
        error.message,
    });
  }
});

export default router;