import { Router } from "express";

const router = Router();

/**
 * PLACEHOLDER content — NOT scholarly-reviewed. Replace with the vetted
 * corpus described in /data/content before this is shown to real pilgrims;
 * historical/religious content needs source verification, not model recall.
 */
const STUB_SITES: Record<string, { en: string; ar: string }> = {
  kaaba: {
    en: "PLACEHOLDER: The Kaaba is the sacred house at the center of Masjid al-Haram, the direction Muslims face in prayer worldwide.",
    ar: "نص مؤقت: الكعبة المشرفة هي البيت الحرام الذي يتوسط المسجد الحرام، وهي القبلة التي يتجه إليها المسلمون في صلاتهم حول العالم.",
  },
  jabal_al_nour: {
    en: "PLACEHOLDER: Jabal al-Nour houses the Cave of Hira, where the first revelation is said to have occurred.",
    ar: "نص مؤقت: يضم جبل النور غار حراء، حيث يُذكر أن الوحي الأول قد نزل.",
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
