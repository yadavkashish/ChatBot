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

      if (
        !question ||
        typeof question !== "string" ||
        question.trim() === ""
      ) {
        return res
          .status(400)
          .json({
            error:
              "Missing or empty 'question' in request body.",
          });
      }

      console.log(
        "CHAT HIT — question:",
        question
      );

      const result =
        await askRag(
          question
        );

      console.log(
        "CHAT ANSWER (preview):",
        result.answer?.slice(
          0,
          100
        )
      );

      // Unique sources only
      const sources = [
        ...new Set(
          result.docs.map(
            doc =>
              `Video ${doc.metadata.video_id}`
          )
        ),
      ];

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