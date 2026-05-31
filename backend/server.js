import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import analyzeRoute from "./src/routes/analyze.js";
import chatRoute from "./src/routes/chat.js";



const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/analyze", analyzeRoute);
app.use("/api/chat", chatRoute);

app.listen(process.env.PORT, () => {
  console.log(
    `running on ${process.env.PORT}`
  );
});