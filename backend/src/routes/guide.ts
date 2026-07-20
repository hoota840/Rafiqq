import { Router } from "express";

const router = Router();

/**
 * Short, commonly-known facts — NOT a vetted, scholarly-reviewed corpus (see
 * /data/content/README.md, still an open blocker). Kept consistent with the
 * same fact sheet embedded in the voice assistant's system prompt
 * (backend/src/services/geminiClient.ts) so the two don't contradict each
 * other. Replace with the vetted corpus before this is shown to real
 * pilgrims at scale — historical/religious content needs source
 * verification, not model or hand-written recall, however uncontroversial.
 */
const STUB_SITES: Record<string, { en: string; ar: string }> = {
  kaaba: {
    en: "The Kaaba is the sacred house at the center of Masjid al-Haram, the direction Muslims face in prayer worldwide. It's draped in the black Kiswah cloth and is associated with Prophet Ibrahim (Abraham) and his son Ismail.",
    ar: "الكعبة المشرفة هي البيت الحرام الذي يتوسط المسجد الحرام، وهي القبلة التي يتجه إليها المسلمون في صلاتهم حول العالم. تُكسى بثوب الكسوة الأسود، وترتبط بالنبي إبراهيم عليه السلام وابنه إسماعيل.",
  },
  haram: {
    en: "Masjid al-Haram is the Grand Mosque in Makkah, surrounding the Kaaba — the direction all Muslims face in prayer. It's the site of tawaf (circling the Kaaba) and sa'i.",
    ar: "المسجد الحرام هو المسجد الكبير في مكة المكرمة، ويحيط بالكعبة المشرفة، القبلة التي يتجه إليها جميع المسلمين في صلاتهم. وهو موقع الطواف والسعي.",
  },
  mina: {
    en: "Mina is a few kilometers east of Makkah, where pilgrims stay during the days of Hajj. It's the site of Ramy al-Jamarat, the symbolic stoning of the devil at the Jamarat pillars.",
    ar: "منى تقع على بعد بضعة كيلومترات شرق مكة المكرمة، حيث يقيم الحجاج خلال أيام الحج. وهي موقع رمي الجمرات، الرمز الرمزي لرجم الشيطان عند جمرات العقبة.",
  },
  arafat: {
    en: "Arafat is a plain east of Mina. Standing there on the Day of Arafat (Wuquf) is the pivotal ritual of Hajj — the Prophet Muhammad delivered his Farewell Sermon there.",
    ar: "عرفات سهل يقع شرق منى. الوقوف بها يوم عرفة هو الركن الأساسي في الحج، وقد ألقى النبي محمد صلى الله عليه وسلم خطبة الوداع هناك.",
  },
  muzdalifah: {
    en: "Muzdalifah is an open plain between Mina and Arafat. Pilgrims spend the night there after the Day of Arafat and gather pebbles for Ramy al-Jamarat.",
    ar: "مزدلفة سهل مفتوح بين منى وعرفات. يبيت الحجاج فيها بعد يوم عرفة ويجمعون الحصى لرمي الجمرات.",
  },
  jabal_al_nour: {
    en: "Jabal al-Nour houses the Cave of Hira, where the first revelation of the Quran is said to have come to the Prophet Muhammad.",
    ar: "يضم جبل النور غار حراء، حيث يُذكر أن الوحي الأول من القرآن الكريم قد نزل على النبي محمد صلى الله عليه وسلم.",
  },
  thawr: {
    en: "Jabal Thawr is a mountain south of Makkah containing the Cave of Thawr, where the Prophet Muhammad and Abu Bakr hid for three nights during the Hijrah to Madinah.",
    ar: "جبل ثور جبل يقع جنوب مكة المكرمة ويضم غار ثور، حيث اختبأ النبي محمد صلى الله عليه وسلم وأبو بكر الصديق ثلاث ليالٍ أثناء هجرتهما إلى المدينة.",
  },
  nabawi: {
    en: "Masjid an-Nabawi, the Prophet's Mosque, is in Madinah. Built by the Prophet Muhammad after the Hijrah, it holds his final resting place and is the second-holiest site in Islam.",
    ar: "المسجد النبوي يقع في المدينة المنورة، بناه النبي محمد صلى الله عليه وسلم بعد الهجرة، ويضم مثواه الأخير، وهو ثاني أقدس موقع في الإسلام.",
  },
  quba: {
    en: "Quba Mosque in Madinah is the first mosque built in Islamic history, established by the Prophet Muhammad on his arrival in Madinah during the Hijrah.",
    ar: "مسجد قباء في المدينة المنورة هو أول مسجد بُني في التاريخ الإسلامي، أسسه النبي محمد صلى الله عليه وسلم عند وصوله إلى المدينة في هجرته.",
  },
};

/** GET /api/guide/site/:id */
router.get("/site/:id", (req, res) => {
  const site = STUB_SITES[req.params.id];
  if (!site) {
    return res.status(404).json({ error: "Unknown site", placeholder: true });
  }
  res.json({ placeholder: true, ...site });
});

export default router;
