import { randomUUID } from "crypto";
import AsyncHandler from "../utils/async-handler.js";
import ApiResponse from "../utils/api-response.js";
import { inngest } from "../lib/inngest.js";
import type {
  SubmitReportBody,
  SubmitSosBody,
} from "../validators/ingestion.js";

/**
 * @route POST /api/v1/reports
 * @description Ingest a raw community/official report and trigger the full
 *              disaster-response agent pipeline (Data Refinement -> Validation
 *              -> Master -> Risk/Route/Resource/Response -> Evaluation).
 * @access private
 */
const submitReport = AsyncHandler(async (req: any, res: any) => {
  const body: SubmitReportBody = req.body;
  const user = req.user;

  const sourceType = deriveSourceType(user.role);

  const event = await inngest.send({
    name: "resq/report.received",
    data: {
      rawId: `raw-${randomUUID().slice(0, 8)}`,
      rawText: body.rawText,
      language: body.language ?? "en",
      source: { type: sourceType, sourceId: user.id },
      locationText: body.locationText,
      receivedAt: new Date().toISOString(),
      // Coordinates are optional at ingestion time; the Data Refinement
      // Agent will only use them if present, never invent its own.
      ...(body.lat !== undefined && body.lng !== undefined
        ? { locationHint: { lat: body.lat, lng: body.lng } }
        : {}),
      userId: user.id,
      role: user.role,
    } as any,
  });

  return res
    .status(202)
    .json(
      new ApiResponse(
        202,
        "Report accepted. Disaster-response pipeline started.",
        { eventIds: event.ids }
      )
    );
});

/**
 * @route POST /api/v1/sos
 * @description Ingest an SOS button press and trigger the time-critical
 *              Emergency Response agent pipeline directly.
 * @access private
 */
const submitSos = AsyncHandler(async (req: any, res: any) => {
  const body: SubmitSosBody = req.body;
  const user = req.user;

  const sosRequest = {
    sosId: `sos-${randomUUID().slice(0, 8)}`,
    userId: user.id,
    emergencyType: body.emergencyType,
    peopleAffected: body.peopleAffected,
    trapped: body.trapped,
    medicalHelpRequired: body.medicalHelpRequired,
    locationConsent: body.locationConsent,
    location: { lat: body.lat, lng: body.lng },
    timestamp: new Date().toISOString(),
  };

  const event = await inngest.send({
    name: "resq/sos.requested",
    data: { sosRequest, userId: user.id },
  });

  return res
    .status(202)
    .json(
      new ApiResponse(
        202,
        "SOS received. Emergency response dispatch started.",
        { eventIds: event.ids, sosId: sosRequest.sosId }
      )
    );
});

function deriveSourceType(role: string): "OFFICIAL" | "VERIFIED" | "COMMUNITY" {
  if (
    role === "GovernmentOfficer" ||
    role === "ReliefOperator" ||
    role === "MedicalOperator"
  ) {
    return "OFFICIAL";
  }
  if (role === "Volunteer" || role === "Responder") {
    return "VERIFIED";
  }
  return "COMMUNITY";
}

export { submitReport, submitSos };
