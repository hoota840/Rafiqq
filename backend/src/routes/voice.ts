import { Router } from "express";
import { getAgentReply } from "../services/claudeClient";

const router = Router();

/** POST /api/voice/text — { text, language } => { reply }. STT/TTS happen on-device in the app. */
router.post("/text", async (req, res) => {
  try {
    const { text, language = "en" } = req.body as { text?: string; language?: "en" | "ar" };
    if (!text) {
      return res.status(400).json({ error: "Missing 'text'" });
    }
    const reply = await getAgentReply(text, language);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
