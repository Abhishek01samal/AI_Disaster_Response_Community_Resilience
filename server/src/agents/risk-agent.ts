import logger from "../lib/logger.js";
import { openaiModelConfig } from "../lib/ai-model.js";
import { RISK_INTELLIGENCE_SYSTEM_PROMPT } from "./prompts.js";
import {
  riskInputSchema,
  riskOutputSchema,
  type RiskInput,
  type RiskOutput,
} from "./schemas.js";

/**
 * Agent boundary: Risk interprets evidence and produces an intelligence
 * SIGNAL (sourceState is always AI_SIGNAL). It never converts its own
 * output into official/verified truth — that authority stays with
 * OFFICIAL/VERIFIED sources and, ultimately, the Evaluation Agent's
 * deterministic human-review gate.
 */
export async function runRiskIntelligenceAgent(
  rawInput: RiskInput,
  step: any
): Promise<RiskOutput> {
  const input = riskInputSchema.parse(rawInput);

  // No evidence at all -> don't let the model guess. Return a conservative,
  // fully deterministic LOW-confidence signal instead of calling the LLM.
  if (input.reports.length === 0 && input.officialAlerts.length === 0) {
    return riskOutputSchema.parse({
      eventId: input.eventId,
      riskLevel: "LOW",
      hazardType: input.hazardType,
      affectedZones: [],
      priorityScore: 10,
      confidence: 0.2,
      sourceState: "AI_SIGNAL",
      reasons: ["No corroborating reports or official alerts were available."],
      duplicateCluster: null,
      timestamp: new Date().toISOString(),
    });
  }

  const model = step.ai.models.openai(openaiModelConfig({ maxTokens: 800 }));

  const userPrompt = `Assess risk for this hazard using ONLY the evidence given below.

Evidence:
${JSON.stringify(input, null, 2)}

Required JSON output shape:
{
  "eventId": "${input.eventId}",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "hazardType": "${input.hazardType}",
  "affectedZones": string[],
  "priorityScore": number (0-100),
  "confidence": number (0-1),
  "sourceState": "AI_SIGNAL",
  "reasons": string[],
  "duplicateCluster": null
}`;

  const response = await step.ai.infer("risk-intelligence-llm-call", {
    model,
    body: {
      system: RISK_INTELLIGENCE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    },
  });

  const parsedJson = safeJsonParse(extractText(response));

  const candidate = {
    ...parsedJson,
    eventId: input.eventId,
    hazardType: input.hazardType,
    sourceState: "AI_SIGNAL",
    duplicateCluster: null,
    timestamp: new Date().toISOString(),
  };

  const result = riskOutputSchema.safeParse(candidate);

  if (!result.success) {
    logger.error(
      `Risk Intelligence Agent produced an invalid output: ${JSON.stringify(result.error.issues)}`
    );
    // Conservative deterministic fallback: never silently promote to
    // HIGH/CRITICAL when the model output couldn't be trusted.
    const hasOfficialRed = input.officialAlerts.some(
      (a) => a.severity?.toUpperCase() === "RED"
    );
    return riskOutputSchema.parse({
      eventId: input.eventId,
      riskLevel: hasOfficialRed ? "HIGH" : "MEDIUM",
      hazardType: input.hazardType,
      affectedZones: [],
      priorityScore: hasOfficialRed ? 70 : 40,
      confidence: 0.3,
      sourceState: "AI_SIGNAL",
      reasons: [
        "AI risk synthesis failed schema validation; used a conservative deterministic fallback.",
      ],
      duplicateCluster: null,
      timestamp: new Date().toISOString(),
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
