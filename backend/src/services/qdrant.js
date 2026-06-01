import { QdrantVectorStore }
from "@langchain/qdrant";

import { embeddings }
from "./embeddings.js";

export async function getStore() {
  try {

    return await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url:
          process.env.QDRANT_URL,

        apiKey:
          process.env.QDRANT_API_KEY, // Fixed: was missing, caused auth failure

        collectionName:
          "creator-analysis",
      }
    );

  } catch (err) {

    console.error(
      "Qdrant getStore error:",
      err.message
    );

    // Give a clear message if collection doesn't exist yet
    if (
      err.message?.includes(
        "Not found"
      ) ||
      err.message?.includes(
        "doesn't exist"
      ) ||
      err.message?.includes(
        "404"
      )
    ) {
      throw new Error(
        "No analysis data found. Please call /analyze with two video URLs first."
      );
    }

    throw err;
  }
}