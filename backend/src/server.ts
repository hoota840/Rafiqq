import express from "express";
import cors from "cors";
import { config } from "./config";
import voiceRouter from "./routes/voice";
import navigationRouter from "./routes/navigation";
import guideRouter from "./routes/guide";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/navigation", navigationRouter);
app.use("/api/guide", guideRouter);
app.use("/api/health", healthRouter);

app.get("/", (_req, res) => res.json({ status: "ok", service: "rafiqq-backend" }));

app.listen(config.port, () => {
  console.log(`Rafiqq backend listening on port ${config.port}`);
});
