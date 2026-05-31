import express from "express";

import {
  askRag,
}
from "../services/rag.js";

const router =
  express.Router();

router.post(
  "/",
  async (req, res) => {

    try {

      const {
        question,
      } = req.body;

      const result =
        await askRag(
          question
        );

      const sources =
        result.docs
          .slice(0, 5)
          .map(
            doc =>
              `Video ${doc.metadata.video_id}
               (Chunk ${doc.metadata.chunk})`
          );

      res.json({
        answer:
          result.answer,

        sources,
      });

    } catch (err) {

      console.error(
        "CHAT ERROR:",
        err
      );

      res.status(500).json({
        error:
          err.message,
      });
    }
  }
);

export default router;