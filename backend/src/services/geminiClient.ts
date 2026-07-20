import {
  FunctionCallingConfigMode,
  FunctionDeclaration,
  GenerateContentResponse,
  GoogleGenAI,
  ThinkingLevel,
  Type,
} from "@google/genai";
import { config } from "../config";

// Google AI Studio's Gemini API free tier — not Google Cloud/Maps Platform
// billing (the thing dropped for maps, see CLAUDE.md). No billing card
// required for this free tier as of when this was wired up.
const ai = config.geminiApiKey ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : null;

// gemini-3.5-flash alone hit a live 429 RESOURCE_EXHAUSTED after ~20
// requests — its free tier is only 20 requests/DAY, shared across every user
// of the deployed backend. gemini-2.5-flash-lite was tried as the fix but
// ALSO 404'd live ("no longer available to new users") — Google appears to
// have cut off the entire 2.x generation for new API keys, not just
// gemini-2.5-flash. gemini-3.1-flash-lite is the 3.x-generation equivalent
// (explicitly the cost-efficient tier, "a fraction of the cost" per Google's
// own model docs) and isn't in the restricted 2.x generation, so it goes
// first; gemini-3.5-flash stays as a fallback since it's a known-working
// model from earlier live testing, just with a much tighter daily quota.
// Ordered fallback, not just a single swap, because a model that works today
// can vanish without warning — this project has now hit that twice.
const MODEL_CANDIDATES = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

// Matches NavigationScreen.tsx's GeoSite ids/coordinates — kept in sync by
// hand since there's no shared package between app/ and backend/.
export const NAVIGABLE_SITE_IDS = ["haram", "mina", "arafat", "muzdalifah", "nabawi", "quba", "thawr"] as const;
export type NavigableSiteId = (typeof NAVIGABLE_SITE_IDS)[number];

const SITE_LABELS: Record<NavigableSiteId, Record<"en" | "ar", string>> = {
  haram: { en: "Masjid al-Haram", ar: "المسجد الحرام" },
  mina: { en: "Mina", ar: "منى" },
  arafat: { en: "Arafat", ar: "عرفات" },
  muzdalifah: { en: "Muzdalifah", ar: "مزدلفة" },
  nabawi: { en: "Masjid an-Nabawi", ar: "المسجد النبوي" },
  quba: { en: "Quba Mosque", ar: "مسجد قباء" },
  thawr: { en: "Jabal Thawr", ar: "جبل ثور" },
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
- Muzdalifah: an open plain between Mina and Arafat; pilgrims spend the night there after the Day of Arafat and gather pebbles for Ramy al-Jamarat.
- Jabal al-Nour: a mountain near Makkah containing the Cave of Hira, where the first revelation of the Quran is said to have come to the Prophet Muhammad.
- Jabal Thawr: a mountain south of Makkah containing the Cave of Thawr, where the Prophet Muhammad and Abu Bakr hid for three nights during the Hijrah (migration) to Madinah.
- Masjid an-Nabawi (the Prophet's Mosque, in Madinah): built by the Prophet Muhammad after the Hijrah; his final resting place; the second-holiest site in Islam.
- Quba Mosque (in Madinah): the first mosque built in Islamic history, established by the Prophet Muhammad on his arrival in Madinah during the Hijrah.
`.trim();

const NAVIGABLE_SITE_LIST_EN = "Masjid al-Haram, Mina, Arafat, Muzdalifah, Masjid an-Nabawi, Quba Mosque, or Jabal Thawr";
const NAVIGABLE_SITE_LIST_AR = "المسجد الحرام، منى، عرفات، مزدلفة، المسجد النبوي، مسجد قباء، أو جبل ثور";

const SYSTEM_PROMPTS: Record<"en" | "ar", string> = {
  en: `You are Rafiqq, a warm, concise voice guide for Hajj and Umrah pilgrims. Help with directions, the history and significance of holy sites, and general wellbeing questions. Keep answers short and spoken-friendly — this will be read aloud. If asked something outside your knowledge or safety-critical (medical emergencies), say so plainly and recommend the pilgrim seek in-person help.\n\n${SITE_FACTS}\n\nCall navigate_to_site when the pilgrim asks for directions to, or to go/navigate to, one of: ${NAVIGABLE_SITE_LIST_EN}. Call call_emergency when the pilgrim indicates a real emergency, danger, injury, medical distress, being lost and in trouble, or explicitly asks for emergency help/police/ambulance/999 — not for casual expressions like being tired or thirsty.`,
  ar: `أنت رفيق، مرشد صوتي دافئ ومختصر لحجاج ومعتمري بيت الله الحرام. ساعدهم في الاتجاهات، وتاريخ وأهمية الأماكن المقدسة، والأسئلة العامة المتعلقة بالراحة. اجعل إجاباتك قصيرة ومناسبة للنطق بصوت عالٍ. إذا سُئلت عن أمر خارج معرفتك أو حالة طبية طارئة، وضّح ذلك وانصح الحاج بطلب مساعدة فورية من شخص حاضر.\n\n${SITE_FACTS}\n\nاستدعِ navigate_to_site عندما يطلب الحاج الاتجاهات إلى أحد هذه الأماكن أو التوجه إليها: ${NAVIGABLE_SITE_LIST_AR}. استدعِ call_emergency فقط عند وجود حالة طوارئ حقيقية، خطر، إصابة، ضائقة طبية، أو ضياع وخطر حقيقي، أو طلب صريح للمساعدة الطارئة/الشرطة/الإسعاف/999 — وليس لتعبيرات عادية مثل التعب أو العطش.`,
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

// 503 (transient overload) is worth a short retry on the SAME model. 429
// (quota exhausted) and 404 (model no longer available) are not — retrying
// the same model won't help, so those fall through to the NEXT model in
// MODEL_CANDIDATES instead (see the loop below).
const RETRY_DELAYS_MS = [500, 1500];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAgentReply(userText: string, language: "en" | "ar"): Promise<AgentReply> {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  let response: GenerateContentResponse | undefined;
  let lastError: unknown;

  modelLoop: for (const model of MODEL_CANDIDATES) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: userText,
          config: {
            systemInstruction: SYSTEM_PROMPTS[language],
            maxOutputTokens: 1024,
            // Some Gemini models "think" before answering by default, which
            // was eating the whole token budget and truncating replies
            // mid-sentence. MINIMAL keeps this a snappy voice assistant.
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            tools: [{ functionDeclarations: [CALL_EMERGENCY_TOOL, NAVIGATE_TO_SITE_TOOL] }],
            // AUTO (the default) lets the model choose between calling a function
            // or answering in plain text — most requests are just questions.
            toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
          },
        });
        break modelLoop;
      } catch (err) {
        lastError = err;
        const status = (err as { status?: number }).status;
        if (status === 503 && attempt < RETRY_DELAYS_MS.length) {
          await sleep(RETRY_DELAYS_MS[attempt]);
          continue;
        }
        console.warn(`[geminiClient] ${model} failed (status ${status ?? "?"}), trying next candidate if any:`, (err as Error).message);
        break; // try the next model in MODEL_CANDIDATES
      }
    }
  }

  if (!response) {
    throw lastError instanceof Error ? lastError : new Error("All Gemini model candidates failed");
  }

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
