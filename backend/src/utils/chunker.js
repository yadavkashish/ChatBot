import {
  RecursiveCharacterTextSplitter,
}
from "@langchain/textsplitters";

export async function chunkText(
  text
) {
  const splitter =
    new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

  return splitter.createDocuments([
    text,
  ]);
}