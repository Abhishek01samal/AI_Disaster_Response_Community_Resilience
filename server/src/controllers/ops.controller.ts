import AsyncHandler from "../utils/async-handler.js";
import ApiResponse from "../utils/api-response.js";
import { featherlessChat } from "../lib/llm.js";
import { GUIDANCE_CHAT_SYSTEM_PROMPT } from "../agents/prompts.js";
import { prisma } from "../lib/prisma.js";
import type { ChatBody, ConfirmMatchBody } from "../validators/ingestion.js";

const GUIDANCE_FALLBACKS: [RegExp, string][] = [
  [
    /sos|emergency|help|trapped/i,
    "Open Incident Map, select the nearest marker and press Send SOS. Live location is shared only while the SOS is active and is revocable. The Response Agent then queues the case — this assistant cannot dispatch a unit.",
  ],
  [
    /shelter|camp|safe|relief/i,
    "Relief lists camp capacity, needs and offers. The safe-action engine currently ranks Municipal High School (94, 0.8 km) first, then Grain Depot Hall. Community Centre East is at 97% — new intake should redirect.",
  ],
  [
    /alert|warning|flood|river|rain/i,
    "Red warning: Nadipur River 8.42 m vs 8.00 m danger mark. Move to the highest accessible floor, avoid the embankment road, and follow official items on Situation. AI SIGNAL items are not official.",
  ],
  [
    /map|incident|report/i,
    "Incident Map layers hazards, routes, shelters, SOS and reports. File a community report from the Situation section — Data Refinement will structure it; it stays COMMUNITY until verified.",
  ],
  [
    /verify|source|trust|rumou?r/i,
    "Every record carries OFFICIAL, VERIFIED, COMMUNITY, AI SIGNAL or STALE. Community items are signals, not facts.",
  ],
];

function fallbackReply(input: string): string {
  for (const [re, text] of GUIDANCE_FALLBACKS) {
    if (re.test(input)) return text;
  }
  return "I can help with SOS, shelters, current alerts, the incident map, and verification states. For urgent help use Send SOS on the Incident Map. I do not dispatch units.";
}

/**
 * Guidance chatbot. Uses the same Featherless model as the agents.
 * Falls back to deterministic replies if the model is unavailable.
 */
const chatGuidance = AsyncHandler(async (req: any, res: any) => {
  const body: ChatBody = req.body;
  const history = (body.history ?? []).slice(-8);

  const llmText = await featherlessChat(
    [
      { role: "system", content: GUIDANCE_CHAT_SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: body.message },
    ],
    { maxTokens: 420, temperature: 0.2 }
  );

  const reply = llmText || fallbackReply(body.message);

  return res.status(200).json(
    new ApiResponse(200, "Guidance reply", {
      reply,
      model: llmText ? "featherless" : "deterministic-fallback",
    })
  );
});

/**
 * Human confirmation of an AI-proposed resource match. Never auto-allocates.
 */
const confirmResourceMatch = AsyncHandler(async (req: any, res: any) => {
  const body: ConfirmMatchBody = req.body;
  const user = req.user;

  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      body.matchId
    );

  if (!uuidLike) {
    try {
      await prisma.auditEvent.create({
        data: {
          userId: user.id,
          action: "RESOURCE_MATCH_CONFIRMED_UI",
          entityType: "ResourceMatch",
          entityId: body.matchId,
          metadata: { demoKey: body.matchId, decision: body.decision },
        },
      });
    } catch {
      /* audit table may not be migrated yet */
    }

    return res.status(200).json(
      new ApiResponse(200, "Match decision recorded", {
        matchId: body.matchId,
        persisted: false,
        decision: body.decision,
      })
    );
  }

  const existing = await prisma.resourceMatch.findUnique({
    where: { id: body.matchId },
  });

  if (!existing) {
    return res.status(200).json(
      new ApiResponse(200, "Match decision recorded (no persisted row)", {
        matchId: body.matchId,
        persisted: false,
        decision: body.decision,
      })
    );
  }

  const updated = await prisma.resourceMatch.update({
    where: { id: body.matchId },
    data: {
      status: body.decision === "REJECT" ? "REJECTED" : "APPROVED",
      humanConfirmed: body.decision !== "REJECT",
      confirmedBy: user.id,
      confirmedAt: new Date(),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      action:
        body.decision === "REJECT"
          ? "RESOURCE_MATCH_REJECTED"
          : "RESOURCE_MATCH_CONFIRMED",
      entityType: "ResourceMatch",
      entityId: updated.id,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Match updated", {
      matchId: updated.id,
      persisted: true,
      status: updated.status,
    })
  );
});

export { chatGuidance, confirmResourceMatch };
