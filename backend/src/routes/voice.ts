import { Router } from "express";
import { getAgentReply } from "../services/geminiClient";

const router = Router();

/**
 * POST /api/voice/text — { text, language } => { reply, action }. STT/TTS
 * happen on-device in the app. `action` is null for a plain answer, or
 * { type: "call_emergency" } / { type: "navigate_to_site", siteId } when the
 * pilgrim's speech was recognized as an in-app command — the app is
 * responsible for actually performing it (opening the dialer, scrolling to
 * and selecting a site on the map).
 */
router.post("/text", async (req, res) => {
  try {
    const { text, language = "en" } = req.body as { text?: string; language?: "en" | "ar" };
    if (!text) {
      return res.status(400).json({ error: "Missing 'text'" });
    }
    const { reply, action } = await getAgentReply(text, language);
    res.json({ reply, action });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
