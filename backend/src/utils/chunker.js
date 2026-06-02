import {
  RecursiveCharacterTextSplitter,
} from "@langchain/textsplitters";

export async function chunkText(
  text
) {

  // Prevent huge transcripts
  const limitedText =
    text.slice(
      0,
      120000
    );

  const splitter =
    new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 150,
    });

  return await splitter.createDocuments([
    limitedText,
  ]);
}