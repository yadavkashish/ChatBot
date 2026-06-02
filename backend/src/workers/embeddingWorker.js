import { parentPort } from "worker_threads";
import { pipeline } from "@xenova/transformers";

let extractor;

async function getExtractor() {
  if (!extractor) {
    // This now loads in the background thread!
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

parentPort.on("message", async (message) => {
  try {
    const { id, texts } = message;
    const model = await getExtractor();
    
    // Process all chunks
    const results = await Promise.all(
      texts.map(text => model(text, { pooling: "mean", normalize: true }))
    );
    
    const vectors = results.map(result => Array.from(result.data));
    
    // Send vectors back to the main Express thread
    parentPort.postMessage({ id, vectors });
  } catch (error) {
    parentPort.postMessage({ id, error: error.message });
  }
});