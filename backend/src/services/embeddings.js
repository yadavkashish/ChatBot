import { pipeline } from "@xenova/transformers";

let extractor;

async function getExtractor() {
  if (!extractor) {
    console.log(
      "Loading embedding model..."
    );

    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    console.log(
      "Embedding model loaded"
    );
  }

  return extractor;
}

export class LocalEmbeddings {

  async embedQuery(text) {
    const model =
      await getExtractor();

    const result =
      await model(text, {
        pooling: "mean",
        normalize: true,
      });

    return Array.from(
      result.data
    );
  }

  async embedDocuments(texts) {
    const model =
      await getExtractor();

    const results =
      await Promise.all(
        texts.map(text =>
          model(text, {
            pooling: "mean",
            normalize: true,
          })
        )
      );

    return results.map(
      result =>
        Array.from(result.data)
    );
  }
}

export const embeddings =
  new LocalEmbeddings();