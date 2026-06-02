import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import analyzeRoute from "./src/routes/analyze.js";
import chatRoute from "./src/routes/chat.js";

const app = express();

app.use(
  cors({
    origin: "https://chat-bot-beta-liart.vercel.app",
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