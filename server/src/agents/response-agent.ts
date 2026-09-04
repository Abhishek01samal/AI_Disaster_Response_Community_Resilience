import { estimateMinutes } from "../utils/geo.js";
import {
  responseInputSchema,
  responseOutputSchema,
  type ResponseInput,
  type ResponseOutput,
} from "./schemas.js";

/**
 * Agent boundary: dispatch of a physical responder is a high-impact,
 * potentially life-critical action. It is intentionally 100% deterministic
 * — nearest-available-responder selection and ETA math — with NO LLM in
 * the loop. `simulated: true` must remain visible whenever the ambulance
 * layer is simulated (no real-world dispatch integration is connected).
 */
export function runEmergencyResponseAgent(
  rawInput: ResponseInput
): ResponseOutput {
  const input = responseInputSchema.parse(rawInput);
  const now = new Date().toISOString();

  if (!input.sosRequest) {
    return responseOutputSchema.parse({
      sosId: null,
      priority: null,
      status: "NOT_REQUIRED",
      responder: null,
      etaMinutes: null,
      locationShared: false,
      simulated: true,
      reason: ["No SOS/emergency-response request applies to this event."],
      timestamp: now,
    });
  }

  const sos = input.sosRequest;
  const priority = derivePriority(sos);

  const available = input.availableResponders
    .filter((r) => r.status?.toUpperCase() === "AVAILABLE")
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const chosen = available[0];

  if (!chosen) {
    return responseOutputSchema.parse({
      sosId: sos.sosId,
      priority,
      status: "NO_RESPONDER_AVAILABLE",
      responder: null,
      etaMinutes: null,
      locationShared: sos.locationConsent,
      simulated: true,
      reason: ["No responders are currently available."],
      timestamp: now,
    });
  }

  const reason: string[] = [];
  if (sos.medicalHelpRequired) reason.push("Medical assistance requested");
  if (sos.trapped) reason.push("Reporter indicates they are trapped");
  reason.push("Nearest available responder selected");

  const output: ResponseOutput = {
    sosId: sos.sosId,
    priority,
    status: "RESPONDER_REQUESTED",
    responder: { responderId: chosen.responderId, type: chosen.type },
    etaMinutes: estimateMinutes(chosen.distanceKm, 35),
    locationShared: sos.locationConsent,
    simulated: true,
    reason,
    timestamp: now,
  };

  return responseOutputSchema.parse(output);
}

function derivePriority(
  sos: ResponseInput["sosRequest"]
): ResponseOutput["priority"] {
  if (!sos) return null;
  if (sos.trapped || sos.medicalHelpRequired) return "P0";
  if (sos.peopleAffected >= 4) return "P1";
  return "P2";
}
