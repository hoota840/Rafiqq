import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { config } from "../config";

// Google AI Studio's Gemini API free tier — not Google Cloud/Maps Platform
// billing (the thing dropped for maps, see CLAUDE.md). No billing card
// required for this free tier as of when this was wired up.
const ai = config.geminiApiKey ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : null;

const MODEL = "gemini-3.5-flash";

const SYSTEM_PROMPTS: Record<"en" | "ar", string> = {
  en: "You are Rafiqq, a warm, concise voice guide for Hajj and Umrah pilgrims. Help with directions, the history and significance of holy sites, and general wellbeing questions. Keep answers short and spoken-friendly — this will be read aloud. If asked something outside your knowledge or safety-critical (medical emergencies), say so plainly and recommend the pilgrim seek in-person help.",
  ar: "أنت رفيق، مرشد صوتي دافئ ومختصر لحجاج ومعتمري بيت الله الحرام. ساعدهم في الاتجاهات، وتاريخ وأهمية الأماكن المقدسة، والأسئلة العامة المتعلقة بالراحة. اجعل إجاباتك قصيرة ومناسبة للنطق بصوت عالٍ. إذا سُئلت عن أمر خارج معرفتك أو حالة طبية طارئة، وضّح ذلك وانصح الحاج بطلب مساعدة فورية من شخص حاضر.",
};

export async function getAgentReply(
  userText: string,
  language: "en" | "ar"
): Promise<string> {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userText,
    config: {
      systemInstruction: SYSTEM_PROMPTS[language],
      maxOutputTokens: 1024,
      // gemini-3.5-flash "thinks" before answering by default, which was
      // eating the whole token budget and truncating replies mid-sentence.
      // MINIMAL keeps this a snappy voice assistant, not a reasoning model.
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });

  return response.text ?? "";
}
