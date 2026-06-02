import express from "express";
import { askRag } from "../services/rag.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { question, sessionId } = req.body;

    // 1. Validate the question
    if (!question || typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({
        error: "Missing or empty 'question' in request body.",
      });
    }

    // 2. Validate the sessionId (Crucial for Qdrant and Redis!)
    if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
      return res.status(400).json({
        error: "Missing or invalid 'sessionId'. Please ensure you analyzed the videos first.",
      });
    }

    console.log(`💬 CHAT HIT — Session: ${sessionId} | Question: ${question}`);

    // 3. Pass BOTH the question and the sessionId to your RAG service
    const result = await askRag(question, sessionId);

    console.log("CHAT ANSWER (preview):", result.answer?.slice(0, 100));

    // Unique sources only
    const sources = [
      ...new Set(
        result.docs.map((doc) => `Video ${doc.metadata.video_id}`)
      ),
    ];

    res.json({
      answer: result.answer,
      sources,
    });
  } catch (err) {
    console.error("❌ CHAT ERROR:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;