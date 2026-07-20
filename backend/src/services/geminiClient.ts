import { FunctionCallingConfigMode, FunctionDeclaration, GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { config } from "../config";

// Google AI Studio's Gemini API free tier — not Google Cloud/Maps Platform
// billing (the thing dropped for maps, see CLAUDE.md). No billing card
// required for this free tier as of when this was wired up.
const ai = config.geminiApiKey ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : null;

const MODEL = "gemini-3.5-flash";

// Matches NavigationScreen.tsx's GeoSite ids/coordinates — kept in sync by
// hand since there's no shared package between app/ and backend/.
export const NAVIGABLE_SITE_IDS = ["haram", "mina", "arafat"] as const;
export type NavigableSiteId = (typeof NAVIGABLE_SITE_IDS)[number];

const SITE_LABELS: Record<NavigableSiteId, Record<"en" | "ar", string>> = {
  haram: { en: "Masjid al-Haram", ar: "المسجد الحرام" },
  mina: { en: "Mina", ar: "منى" },
  arafat: { en: "Arafat", ar: "عرفات" },
};

// Short, commonly-known facts to ground spoken answers instead of letting the
// model free-generate history/significance content. NOT a vetted, scholarly-
// reviewed corpus (see data/content/README.md — that's still an open
// blocker) — this is a small hand-written fact sheet covering the sites
// already named elsewhere in the app (NavigationScreen + GuideScreen), kept
// consistent across both rather than left to the model's general knowledge.
const SITE_FACTS = `
Known site facts (use these, don't invent other details about these specific sites):
- Masjid al-Haram (the Grand Mosque, in Makkah): surrounds the Kaaba; the direction (qibla) all Muslims face in prayer; site of tawaf (circling the Kaaba) and sa'i.
- The Kaaba: the cube-shaped structure at the center of Masjid al-Haram, draped in the black Kiswah cloth; associated with Prophet Ibrahim (Abraham) and his son Ismail.
- Mina: a few km east of Makkah; where pilgrims stay during the days of Hajj; site of Ramy al-Jamarat (the symbolic stoning of the devil at the Jamarat pillars).
- Arafat: a plain east of Mina; the Day of Arafat (standing/Wuquf there) is the pivotal day of Hajj; where the Prophet Muhammad delivered his Farewell Sermon.
- Jabal al-Nour: a mountain near Makkah containing the Cave of Hira, where the first revelation of the Quran is said to have come to the Prophet Muhammad.
`.trim();

const SYSTEM_PROMPTS: Record<"en" | "ar", string> = {
  en: `You are Rafiqq, a warm, concise voice guide for Hajj and Umrah pilgrims. Help with directions, the history and significance of holy sites, and general wellbeing questions. Keep answers short and spoken-friendly — this will be read aloud. If asked something outside your knowledge or safety-critical (medical emergencies), say so plainly and recommend the pilgrim seek in-person help.\n\n${SITE_FACTS}\n\nCall navigate_to_site when the pilgrim asks for directions to, or to go/navigate to, one of: Masjid al-Haram, Mina, or Arafat. Call call_emergency when the pilgrim indicates a real emergency, danger, injury, medical distress, being lost and in trouble, or explicitly asks for emergency help/police/ambulance/999 — not for casual expressions like being tired or thirsty.`,
  ar: `أنت رفيق، مرشد صوتي دافئ ومختصر لحجاج ومعتمري بيت الله الحرام. ساعدهم في الاتجاهات، وتاريخ وأهمية الأماكن المقدسة، والأسئلة العامة المتعلقة بالراحة. اجعل إجاباتك قصيرة ومناسبة للنطق بصوت عالٍ. إذا سُئلت عن أمر خارج معرفتك أو حالة طبية طارئة، وضّح ذلك وانصح الحاج بطلب مساعدة فورية من شخص حاضر.\n\n${SITE_FACTS}\n\nاستدعِ navigate_to_site عندما يطلب الحاج الاتجاهات إلى أحد هذه الأماكن أو التوجه إليها: المسجد الحرام، منى، أو عرفات. استدعِ call_emergency فقط عند وجود حالة طوارئ حقيقية، خطر، إصابة، ضائقة طبية، أو ضياع وخطر حقيقي، أو طلب صريح للمساعدة الطارئة/الشرطة/الإسعاف/999 — وليس لتعبيرات عادية مثل التعب أو العطش.`,
};

const CALL_EMERGENCY_TOOL: FunctionDeclaration = {
  name: "call_emergency",
  description:
    "Call this when the pilgrim indicates a real emergency, danger, injury, medical distress, or explicitly asks to call emergency services, police, ambulance, or 999.",
};

const NAVIGATE_TO_SITE_TOOL: FunctionDeclaration = {
  name: "navigate_to_site",
  description: "Call this when the pilgrim asks for directions to, or to navigate/go to, one of the known map sites.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      siteId: {
        type: Type.STRING,
        description: "Which site to navigate to.",
        enum: [...NAVIGABLE_SITE_IDS],
      },
    },
    required: ["siteId"],
  },
};

export type VoiceAction =
  | { type: "call_emergency" }
  | { type: "navigate_to_site"; siteId: NavigableSiteId };

export type AgentReply = { reply: string; action: VoiceAction | null };

const CONFIRMATION_PHRASES = {
  call_emergency: { en: "Calling emergency now.", ar: "جارٍ الاتصال بالطوارئ الآن." },
  navigate_to_site: {
    en: (siteId: NavigableSiteId) => `Navigating to ${SITE_LABELS[siteId].en}.`,
    ar: (siteId: NavigableSiteId) => `جارٍ التوجه إلى ${SITE_LABELS[siteId].ar}.`,
  },
};

export async function getAgentReply(userText: string, language: "en" | "ar"): Promise<AgentReply> {
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
      tools: [{ functionDeclarations: [CALL_EMERGENCY_TOOL, NAVIGATE_TO_SITE_TOOL] }],
      // AUTO (the default) lets the model choose between calling a function
      // or answering in plain text — most requests are just questions.
      toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
    },
  });

  const call = response.functionCalls?.[0];
  if (call?.name === "call_emergency") {
    return { reply: CONFIRMATION_PHRASES.call_emergency[language], action: { type: "call_emergency" } };
  }
  if (call?.name === "navigate_to_site") {
    const siteId = call.args?.siteId as NavigableSiteId | undefined;
    if (siteId && (NAVIGABLE_SITE_IDS as readonly string[]).includes(siteId)) {
      return {
        reply: CONFIRMATION_PHRASES.navigate_to_site[language](siteId),
        action: { type: "navigate_to_site", siteId },
      };
    }
  }

  return { reply: response.text ?? "", action: null };
}
