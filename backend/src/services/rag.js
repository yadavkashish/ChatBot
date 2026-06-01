import dotenv from "dotenv";
dotenv.config();

import {
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";

import { getStore }
from "./qdrant.js";

console.log(
  "GEMINI KEY EXISTS:",
  !!process.env.GEMINI_API_KEY
);

console.log(
  "KEY PREFIX:",
  process.env.GEMINI_API_KEY?.slice(
    0,
    10
  )
);

const llm =
  new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", // Restored: this was the working model
    apiKey:
      process.env.GEMINI_API_KEY,
  });

const chatHistory = [];

export async function askRag(
  question
) {

  console.log(
    "askRag called with:",
    question
  );

  const store =
    await getStore();

  const retriever =
    store.asRetriever({
      k: 20,
    });

  const retrievedDocs =
    await retriever.invoke(
      question
    );

  console.log(
    "Retrieved docs count:",
    retrievedDocs.length
  );

  const videoADocs =
    retrievedDocs.filter(
      doc =>
        doc.metadata.video_id === "A"
    );

  const videoBDocs =
    retrievedDocs.filter(
      doc =>
        doc.metadata.video_id === "B"
    );

  const metadataA =
    global.videoAnalysis?.A ||
    videoADocs[0]?.metadata ||
    {};

  const metadataB =
    global.videoAnalysis?.B ||
    videoBDocs[0]?.metadata ||
    {};

  const transcriptA =
    videoADocs
      .slice(0, 3)
      .map(
        doc => doc.pageContent
      )
      .join("\n\n");

  const transcriptB =
    videoBDocs
      .slice(0, 3)
      .map(
        doc => doc.pageContent
      )
      .join("\n\n");

  chatHistory.push({
    role: "user",
    content: question,
  });

  const prompt = `
You are a senior creator strategist and content analyst.

Chat History:
${JSON.stringify(chatHistory)}

Video A Metadata:
${JSON.stringify(metadataA, null, 2)}

Video B Metadata:
${JSON.stringify(metadataB, null, 2)}

Video A Transcript:
${transcriptA}

Video B Transcript:
${transcriptB}

User Question:
${question}

Instructions:

- Answer conversationally.
- Maximum 4-6 sentences unless the user asks for detailed analysis.
- Be direct and concise.
- Do not write reports.
- Do not write introductions or conclusions.
- Do not use headings.
- Answer the exact question first.
- Then provide reasoning.
- If comparison is requested, compare both videos.
- Sound like ChatGPT, not an analytics report.
`;

  let response;

  try {

    console.log(
      "Invoking LLM..."
    );

    response =
      await llm.invoke(
        prompt
      );

    console.log(
      "LLM response received:",
      !!response?.content
    );

  } catch (err) {

    console.error(
      "LLM ERROR:",
      err
    );

    return {

      answer: `Gemini API error: ${err.message}`,

      docs:
        retrievedDocs,
    };
  }

  chatHistory.push({
    role: "assistant",
    content:
      response.content,
  });

  return {
    answer:
      response.content,
    docs:
      retrievedDocs,
  };
}