import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";

const anthropic = config.anthropicApiKey
  ? new Anthropic({ apiKey: config.anthropicApiKey })
  : null;

const SYSTEM_PROMPTS: Record<"en" | "ar", string> = {
  en: "You are Rafiqq, a warm, concise voice guide for Hajj and Umrah pilgrims. Help with directions, the history and significance of holy sites, and general wellbeing questions. Keep answers short and spoken-friendly — this will be read aloud. If asked something outside your knowledge or safety-critical (medical emergencies), say so plainly and recommend the pilgrim seek in-person help.",
  ar: "أنت رفيق، مرشد صوتي دافئ ومختصر لحجاج ومعتمري بيت الله الحرام. ساعدهم في الاتجاهات، وتاريخ وأهمية الأماكن المقدسة، والأسئلة العامة المتعلقة بالراحة. اجعل إجاباتك قصيرة ومناسبة للنطق بصوت عالٍ. إذا سُئلت عن أمر خارج معرفتك أو حالة طبية طارئة، وضّح ذلك وانصح الحاج بطلب مساعدة فورية من شخص حاضر.",
};

export async function getAgentReply(
  userText: string,
  language: "en" | "ar"
): Promise<string> {
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 300,
    system: SYSTEM_PROMPTS[language],
    messages: [{ role: "user", content: userText }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}
