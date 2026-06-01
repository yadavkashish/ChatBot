import axios from "axios";

// Securely pull the backend URL from your .env file
// Make sure to add VITE_API_URL=https://your-production-url.com in your .env
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = `${BASE_URL}/api`;

export async function analyzeVideos(videoA, videoB) {
  const res = await axios.post(`${API}/analyze`, {
    videoA,
    videoB,
  });

  return res.data;
}

// Legacy non-streaming
export async function askQuestion(question) {
  const res = await axios.post(`${API}/chat`, {
    question,
  });

  return res.data;
}

// Streaming version
export async function streamQuestion(question, onChunk, onDone) {
  const response = await fetch(`${API}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, {
      stream: true,
    });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      if (!event.startsWith("data:")) continue;

      try {
        const data = JSON.parse(event.replace("data:", ""));

        if (data.done) {
          onDone?.(data.sources);
        } else if (data.content) {
          onChunk?.(data.content);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}