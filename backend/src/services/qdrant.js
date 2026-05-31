import { QdrantVectorStore }
from "@langchain/qdrant";

import { embeddings }
from "./embeddings.js";

export async function getStore() {
  return await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      collectionName: "creator-analysis",
    }
  );
}