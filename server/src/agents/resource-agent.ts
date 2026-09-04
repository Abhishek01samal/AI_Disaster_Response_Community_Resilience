import logger from "../lib/logger.js";
import { openaiModelConfig } from "../lib/ai-model.js";
import { RESOURCE_NARRATIVE_SYSTEM_PROMPT } from "./prompts.js";
import {
  resourceInputSchema,
  resourceOutputSchema,
  type ResourceInput,
  type ResourceOutput,
} from "./schemas.js";

/**
 * Agent boundary: AI-assisted matching PROPOSES allocations; it never
 * finalizes them. The actual need<->offer matching (who gets what, how
 * much) is a deterministic greedy algorithm — quantities and allocations
 * must be reproducible and auditable. An LLM is only optionally used to
 * phrase the human-readable "reasons" for each proposed match; if that call
 * fails or is unavailable, deterministic reasons are used instead.
 * `requiresHumanConfirmation` is always true — resource allocation is a
 * high-impact action per the project's development principle.
 */
export async function runResourceReliefAgent(
  rawInput: ResourceInput,
  step?: any
): Promise<ResourceOutput> {
  const input = resourceInputSchema.parse(rawInput);

  const remainingOfferQty = new Map(
    input.offers.map((o) => [o.offerId, o.quantity])
  );
  const matches: ResourceOutput["matches"] = [];
  const unmatchedNeeds: ResourceOutput["unmatchedNeeds"] = [];

  for (const need of input.needs) {
    let remaining = need.quantity;

    const candidateOffers = input.offers
      .filter(
        (o) =>
          o.type === need.type && (remainingOfferQty.get(o.offerId) ?? 0) > 0
      )
      .sort(
        (a, b) =>
          (remainingOfferQty.get(b.offerId) ?? 0) -
          (remainingOfferQty.get(a.offerId) ?? 0)
      );

    for (const offer of candidateOffers) {
      if (remaining <= 0) break;
      const available = remainingOfferQty.get(offer.offerId) ?? 0;
      if (available <= 0) continue;

      const matchedQuantity = Math.min(available, remaining);
      remainingOfferQty.set(offer.offerId, available - matchedQuantity);
      remaining -= matchedQuantity;

      const coverageRatio = matchedQuantity / need.quantity;
      const sameLocation =
        need.locationId &&
        offer.locationId &&
        need.locationId === offer.locationId;
      let matchScore = 50 + Math.round(coverageRatio * 40);
      if (sameLocation) matchScore += 10;
      matchScore = Math.max(0, Math.min(100, matchScore));

      const reasons = [
        "Same resource type",
        matchedQuantity >= need.quantity
          ? "Sufficient quantity"
          : "Partial quantity available",
        sameLocation ? "Same location" : "Location reachable",
      ];

      matches.push({
        needId: need.needId,
        offerId: offer.offerId,
        matchedQuantity,
        matchScore,
        status: "PROPOSED",
        reasons,
      });
    }

    if (remaining > 0) {
      unmatchedNeeds.push({
        needId: need.needId,
        remainingQuantity: Math.round(remaining * 100) / 100,
        unit: need.unit,
      });
    }
  }

  // Optional AI narrative pass: only reasons text is (maybe) improved,
  // never the matches/quantities/scores themselves.
  if (step && matches.length > 0) {
    try {
      const enrichedReasons = await generateNarrativeReasons(matches, step);
      for (const match of matches) {
        const enriched = enrichedReasons.find((r) => r.needId === match.needId);
        if (enriched?.reasons?.length) {
          match.reasons = enriched.reasons.slice(0, 3);
        }
      }
    } catch (err) {
      logger.warn(
        `Resource narrative AI pass skipped: ${(err as Error).message}`
      );
    }
  }

  const output: ResourceOutput = {
    eventId: input.eventId,
    matches,
    unmatchedNeeds,
    requiresHumanConfirmation: true,
    timestamp: new Date().toISOString(),
  };

  return resourceOutputSchema.parse(output);
}

async function generateNarrativeReasons(
  matches: ResourceOutput["matches"],
  step: any
): Promise<{ needId: string; reasons: string[] }[]> {
  const model = step.ai.models.openai(openaiModelConfig({ maxTokens: 500 }));

  const response = await step.ai.infer("resource-narrative-llm-call", {
    model,
    body: {
      system: RESOURCE_NARRATIVE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Proposed matches:\n${JSON.stringify(matches, null, 2)}`,
        },
      ],
    },
  });

  const content = response?.content;
  const text = Array.isArray(content)
    ? content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n")
    : "";

  const cleaned = text
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
