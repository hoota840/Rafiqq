import { Router } from "express";

const router = Router();

/**
 * PLACEHOLDER — no real holy-site map/positioning data source is connected yet
 * (see /data/maps). Replace this stub with a real routing/positioning provider
 * once that data is sourced; GPS alone is not reliable inside Masjid al-Haram
 * or in dense crowd conditions at Mina/Arafat.
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
