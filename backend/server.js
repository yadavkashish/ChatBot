import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import analyzeRoute from "./src/routes/analyze.js";
import chatRoute from "./src/routes/chat.js";

const app = express();

// Define your allowed origins
const allowedOrigins = [
  "https://chat-bot-beta-liart.vercel.app", // Production
  "http://localhost:3000",                  // Local dev (React/Next)
  "http://localhost:5173"                   // Local dev (Vite)
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/analyze", analyzeRoute);
app.use("/api/chat", chatRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`running on ${PORT}`);
});