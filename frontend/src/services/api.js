import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = `${BASE_URL}/api`;

export async function analyzeVideos(videoA, videoB) {
  const res = await axios.post(`${API}/analyze`, {
    videoA,
    videoB,
  });
  return res.data;
}

// 👈 Updated to accept sessionId
export async function askQuestion(question, sessionId) {
  const res = await axios.post(`${API}/chat`, {
    question,
    sessionId, // 👈 Send to backend
  });
  return res.data;
}

// 👈 Updated to accept sessionId
export async function streamQuestion(question, sessionId, onChunk, onDone) {
  const response = await fetch(`${API}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      sessionId, // 👈 Send to backend
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
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