import { Router } from "express";
import { getNearbySites } from "../services/overpassClient";

const router = Router();

/**
 * GET /api/navigation/sites — real hospitals, police stations, Tawafa
 * establishment headquarters, and pilgrim guidance centres around Masjid
 * al-Haram/Mina/Muzdalifah/Arafat, sourced live (cached 24h) from
 * OpenStreetMap's free Overpass API. See services/overpassClient.ts.
 */
router.get("/sites", async (_req, res) => {
  const sites = await getNearbySites();
  res.json({ sites });
});

/**
 * PLACEHOLDER — turn-by-turn routing needs a real positioning/routing
 * provider (see /data/maps); GPS alone is not reliable inside Masjid
 * al-Haram or in dense crowd conditions at Mina/Arafat. Unlike /sites above,
 * this one is still a stub.
 */
router.post("/route", (req, res) => {
  const { from, to } = req.body as { from?: string; to?: string };
  res.json({
    placeholder: true,
    message: "Navigation API not connected yet — replace with a real maps/positioning provider.",
    from,
    to,
    steps: [
      "PLACEHOLDER STEP: head toward King Abdulaziz Gate",
      "PLACEHOLDER STEP: continue straight for 200m",
    ],
  });
});

export default router;
