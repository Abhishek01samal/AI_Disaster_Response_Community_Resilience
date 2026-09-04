import {
  routeInputSchema,
  routeOutputSchema,
  type RouteInput,
  type RouteOutput,
} from "./schemas.js";

export function runSafeRouteAgent(rawInput: RouteInput): RouteOutput {
  const input = routeInputSchema.parse(rawInput);

  const rankedLocations = input.safeLocations
    .map((location) => {
      const score =
        (location.officiallyDesignated ? 30 : 0) +
        (location.accessibility ? 20 : 0) +
        (location.capacity ?? 0) / 100 +
        (input.risk.riskLevel === "HIGH" || input.risk.riskLevel === "CRITICAL"
          ? 10
          : 0);

      return {
        locationId: location.locationId,
        name: location.name,
        score: Math.min(100, Math.round(score)),
        reason: location.officiallyDesignated
          ? "Officially designated safe location"
          : "Available shelter capacity",
      };
    })
    .sort((a, b) => b.score - a.score);

  const recommendedLocation = rankedLocations[0]
    ? {
        locationId: rankedLocations[0].locationId,
        name: rankedLocations[0].name,
        confidence: 0.72,
        reason:
          "Highest-scoring safe location based on capacity and designation.",
      }
    : null;

  return routeOutputSchema.parse({
    eventId: input.eventId,
    recommendedLocation,
    rankedLocations,
    confidence: recommendedLocation ? 0.72 : 0.2,
    timestamp: new Date().toISOString(),
  });
}
