import { Router } from "express";

const router = Router();

type AlertSource = "manual" | "phone_sensor" | "wearable";

type EscalationState = {
  status: "alert" | "confirmed_ok" | "escalated";
  triggeredAt: number;
  reason: string;
  source: AlertSource;
};

const escalations = new Map<string, EscalationState>();
const CONFIRMATION_WINDOW_MS = 60_000;

/**
 * PLACEHOLDER — implements only the alert -> confirm -> auto-escalate STATE
 * MACHINE described in /CLAUDE.md. Manual reports and the phone's own motion
 * sensors are the primary signal; a connected wearable is an optional,
 * secondary source (`source: "wearable"`) layered on top, not required. No
 * real phone-sensor fall detection, wearable vitals feed, or emergency-dispatch
 * integration are wired up yet, so the timeout branch below always escalates
 * rather than checking live sensor state. Do not rely on this for real safety
 * decisions until those are connected.
 */

/** POST /api/health/alert — { pilgrimId, reason, source? } */
router.post("/alert", (req, res) => {
  const { pilgrimId, reason, source } = req.body as {
    pilgrimId?: string;
    reason?: string;
    source?: AlertSource;
  };
  if (!pilgrimId) {
    return res.status(400).json({ error: "Missing 'pilgrimId'" });
  }
  escalations.set(pilgrimId, {
    status: "alert",
    triggeredAt: Date.now(),
    reason: reason ?? "",
    source: source ?? "manual",
  });
  res.json({ placeholder: true, status: "alert", confirmationWindowMs: CONFIRMATION_WINDOW_MS });
});

/** POST /api/health/confirm — { pilgrimId, outcome: "ok" | "help_needed" } */
router.post("/confirm", (req, res) => {
  const { pilgrimId, outcome } = req.body as { pilgrimId?: string; outcome?: string };
  if (!pilgrimId) {
    return res.status(400).json({ error: "Missing 'pilgrimId'" });
  }
  const state = escalations.get(pilgrimId);
  if (!state) {
    return res.status(404).json({ error: "No active alert for this pilgrim" });
  }
  state.status = outcome === "help_needed" ? "escalated" : "confirmed_ok";
  res.json({ placeholder: true, status: state.status });
});

/** GET /api/health/status/:pilgrimId */
router.get("/status/:pilgrimId", (req, res) => {
  const state = escalations.get(req.params.pilgrimId);
  if (!state) {
    return res.json({ status: "none" });
  }
  if (state.status === "alert" && Date.now() - state.triggeredAt > CONFIRMATION_WINDOW_MS) {
    // PLACEHOLDER: real version should only escalate here if the phone's
    // motion sensors still indicate distress (primary signal), optionally
    // corroborated by a connected wearable's vitals (secondary signal). No
    // live sensor feed exists yet, so this stub always escalates on timeout.
    state.status = "escalated";
  }
  res.json({ placeholder: true, ...state });
});

export default router;
