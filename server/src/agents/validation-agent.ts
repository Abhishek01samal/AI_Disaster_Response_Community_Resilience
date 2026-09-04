import { prisma } from "../lib/prisma.js";
import { redisClient } from "../lib/redis.js";
import { haversineDistanceKm } from "../utils/geo.js";
import {
  validationOutputSchema,
  type RefinementOutput,
  type ValidationOutput,
} from "./schemas.js";

/**
 * Agent boundary: Validation is a deterministic gate. It never uses an LLM —
 * schema shape, geo bounds, timestamp sanity, source legitimacy, rate
 * limiting, and duplicate detection are all things a rule engine can check
 * reliably and auditably, and a safety gate should never be at the mercy of
 * model hallucination.
 *
 * Roughly bounds Nadipur district (dummy scenario) for a sanity check on
 * reported coordinates. In production this would come from a district
 * boundary table.
 */
const NADIPUR_BOUNDS = {
  minLat: 19.5,
  maxLat: 20.8,
  minLng: 84.8,
  maxLng: 86.3,
};

const DUPLICATE_WINDOW_MINUTES = 45;
const DUPLICATE_RADIUS_KM = 1.5;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REPORTS = 5;

export async function runValidationAgent(
  refined: RefinementOutput
): Promise<ValidationOutput> {
  const schemaValid = Boolean(
    refined.eventId && refined.eventType && refined.location && refined.source
  );

  const locationValid =
    Number.isFinite(refined.location.lat) &&
    Number.isFinite(refined.location.lng) &&
    refined.location.lat >= NADIPUR_BOUNDS.minLat &&
    refined.location.lat <= NADIPUR_BOUNDS.maxLat &&
    refined.location.lng >= NADIPUR_BOUNDS.minLng &&
    refined.location.lng <= NADIPUR_BOUNDS.maxLng;

  const timestampValid = isTimestampSane(refined.timestamp);

  const sourceValid = [
    "OFFICIAL",
    "VERIFIED",
    "COMMUNITY",
    "AI_SIGNAL",
  ].includes(refined.source.type);

  const contentRelevant =
    refined.normalizedText.trim().length >= 5 &&
    refined.eventType !== undefined;

  const rateLimitPassed = await checkRateLimit(refined.source.sourceId);

  const duplicateCheckPassed = !(await isLikelyDuplicate(refined));

  const checks = {
    schemaValid,
    locationValid,
    timestampValid,
    sourceValid,
    contentRelevant,
    rateLimitPassed,
    duplicateCheckPassed,
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.values(checks).length;

  let validationStatus: ValidationOutput["validationStatus"];
  if (!schemaValid || !sourceValid || !rateLimitPassed) {
    validationStatus = "INVALID";
  } else if (passedCount === totalChecks) {
    validationStatus = "VALID";
  } else {
    validationStatus = "UNCERTAIN";
  }

  const requiresHumanReview =
    validationStatus !== "VALID" || refined.confidence < 0.6;

  const output: ValidationOutput = {
    eventId: refined.eventId,
    validationStatus,
    checks,
    confidence: refined.confidence,
    requiresHumanReview,
    validatedAt: new Date().toISOString(),
  };

  return validationOutputSchema.parse(output);
}

function isTimestampSane(timestamp: string): boolean {
  const time = Date.parse(timestamp);
  if (Number.isNaN(time)) return false;

  const now = Date.now();
  const fiveMinutesFuture = now + 5 * 60 * 1000;
  const sevenDaysPast = now - 7 * 24 * 60 * 60 * 1000;

  return time <= fiveMinutesFuture && time >= sevenDaysPast;
}

async function checkRateLimit(sourceId: string): Promise<boolean> {
  try {
    const key = `resq:report-rate:${sourceId}`;
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }
    return count <= RATE_LIMIT_MAX_REPORTS;
  } catch {
    // If Redis is unreachable, fail open on rate limiting rather than
    // blocking the whole disaster pipeline on an infra hiccup.
    return true;
  }
}

async function isLikelyDuplicate(refined: RefinementOutput): Promise<boolean> {
  try {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000);

    const recentIncidents = await prisma.incident.findMany({
      where: {
        incidentType: refined.eventType as any,
        reportedAt: { gte: since },
      },
      include: { location: true },
      take: 25,
      orderBy: { reportedAt: "desc" },
    });

    return recentIncidents.some(
      (incident: {
        location?: { latitude: number; longitude: number } | null;
      }) => {
        if (!incident.location) return false;
        const distance = haversineDistanceKm(
          { lat: incident.location.latitude, lng: incident.location.longitude },
          { lat: refined.location.lat, lng: refined.location.lng }
        );
        return distance <= DUPLICATE_RADIUS_KM;
      }
    );
  } catch {
    // If the incident isn't a recognized enum value or the DB call fails,
    // don't block the pipeline on the duplicate check alone.
    return false;
  }
}
