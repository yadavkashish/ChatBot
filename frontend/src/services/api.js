import axios from "axios";

const API = "http://localhost:5000/api";

export async function analyzeVideos(videoA, videoB) {
  const res = await axios.post(
    `${API}/analyze`,
    {
      videoA,
      videoB,
    }
  );

  return res.data;
}

export async function askQuestion(question) {
  const res = await axios.post(
    `${API}/chat`,
    {
      question,
    }
  );

  return res.data;
}