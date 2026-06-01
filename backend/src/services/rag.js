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
    model: "gemini-2.5-flash",
    apiKey:
      process.env.GEMINI_API_KEY,
  });

const chatHistory = [];

export async function askRag(
  question
) {

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
- Maximum 4-6 sentences unless asked for detailed analysis.
- Be direct.
- Compare both videos when relevant.
- Use available metadata.
- Never invent numbers.
`;

  let response;

  try {

    response =
      await llm.invoke(
        prompt
      );

  } catch (err) {

    console.error(
      "LLM ERROR:",
      err
    );

    return {

      answer: `
Gemini API authentication failed.

Check:

1. GEMINI_API_KEY exists in .env
2. The key is from Google AI Studio
3. The key is active
4. Backend restarted after updating .env

Current question:
${question}
`,

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