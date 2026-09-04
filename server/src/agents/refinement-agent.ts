import { randomUUID } from "crypto";
import logger from "../lib/logger.js";
import { openaiModelConfig } from "../lib/ai-model.js";
import { DATA_REFINEMENT_SYSTEM_PROMPT } from "./prompts.js";
import {
  refinementInputSchema,
  refinementOutputSchema,
  type RefinementInput,
  type RefinementOutput,
} from "./schemas.js";

/**
 * Agent boundary (from the reference spec): Refinement structures and
 * normalizes data. It does NOT declare official truth or make emergency
 * decisions. Its output is always UNVERIFIED/PENDING until a deterministic
 * downstream agent (Validation) confirms it.
 */
export async function runDataRefinementAgent(
  rawInput: RefinementInput,
  step: any
): Promise<RefinementOutput> {
  const input = refinementInputSchema.parse(rawInput);

  const model = step.ai.models.openai(openaiModelConfig({ maxTokens: 700 }));

  const userPrompt = `Normalize this raw report into the required JSON shape.

Raw input:
${JSON.stringify(input, null, 2)}
${input.locationHint ? `\nGround-truth coordinates (use these verbatim, do not alter): ${JSON.stringify(input.locationHint)}` : ""}

Required JSON output shape:
{
  "eventId": string,          // generate a new id, format "evt-<short-random>"
  "eventType": one of FLOOD_REPORT | MEDICAL | FIRE | TRAPPED | MISSING_PERSON | ROAD_BLOCKAGE | INFRASTRUCTURE_DAMAGE | STRUCTURAL_DANGER | LANDSLIDE | OTHER,
  "normalizedText": string,
  "location": { "name": string | null, "lat": number, "lng": number },
  "source": { "type": "${input.source.type}", "sourceId": "${input.source.sourceId}", "verification": "UNVERIFIED" | "PENDING" },
  "timestamp": "${input.receivedAt}",
  "confidence": number between 0 and 1,
  "possibleDuplicate": boolean,
  "evidence": { "originalText": "${input.rawText.replace(/"/g, "'")}" }
}`;

  const response = await step.ai.infer("data-refinement-llm-call", {
    model,
    body: {
      system: DATA_REFINEMENT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    },
  });

  const rawText = extractText(response);
  const parsedJson = safeJsonParse(rawText);

  // Fill in / correct fields deterministically so a flaky LLM response
  // can't corrupt identity fields (eventId uniqueness, echoed evidence,
  // echoed source) that the rest of the system depends on.
  const candidate = {
    ...parsedJson,
    eventId:
      typeof parsedJson?.eventId === "string" && parsedJson.eventId.length > 0
        ? parsedJson.eventId
        : `evt-${randomUUID().slice(0, 8)}`,
    source: {
      type: input.source.type,
      sourceId: input.source.sourceId,
      verification:
        parsedJson?.source?.verification === "PENDING"
          ? "PENDING"
          : "UNVERIFIED",
    },
    timestamp: input.receivedAt,
    evidence: { originalText: input.rawText },
    ...(input.locationHint
      ? {
          location: {
            name: parsedJson?.location?.name,
            lat: input.locationHint.lat,
            lng: input.locationHint.lng,
          },
        }
      : {}),
  };

  const result = refinementOutputSchema.safeParse(candidate);

  if (!result.success) {
    logger.error(
      `Data Refinement Agent produced an invalid output: ${JSON.stringify(result.error.issues)}`
    );
    // Deterministic, safe fallback: structure what we can without the LLM's
    // classification so the pipeline can still run validation (which will
    // very likely flag this as UNCERTAIN / low confidence).
    return refinementOutputSchema.parse({
      eventId: candidate.eventId,
      eventType: "OTHER",
      normalizedText: input.rawText,
      location: { name: input.locationText, lat: 0, lng: 0 },
      source: candidate.source,
      timestamp: input.receivedAt,
      confidence: 0.1,
      possibleDuplicate: false,
      evidence: { originalText: input.rawText },
    });
  }

  return result.data;
}

function extractText(inferResponse: any): string {
  const content = inferResponse?.content;
  if (Array.isArray(content)) {
    return content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");
  }
  return typeof inferResponse === "string" ? inferResponse : "";
}

function safeJsonParse(text: string): any {
  const cleaned = text
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return {};
      }
    }
    return {};
  }
}
