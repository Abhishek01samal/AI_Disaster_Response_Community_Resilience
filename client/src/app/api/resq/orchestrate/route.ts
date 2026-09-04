import { NextResponse } from "next/server";
import { runChatTurn, chatFactsForComposer } from "@/lib/chat/engine";
import { buildComposerSystemPrompt } from "@/lib/chat/composer";
import { emptySession, type ConversationSession } from "@/lib/chat/types";
import type { ConsoleSnapshot } from "@/lib/snapshot";
import { featherlessComplete } from "@/lib/featherless";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    message?: string;
    snapshot?: ConsoleSnapshot;
    session?: ConversationSession;
  };
  const message = (body.message ?? "").trim();
  if (!message || !body.snapshot) {
    return NextResponse.json({ error: "message and snapshot required" }, { status: 400 });
  }

  const session = body.session ?? emptySession();
  const local = runChatTurn(body.snapshot, message, session);

  if (local.intent === "LOAD_REGION") {
    return NextResponse.json({
      ...local,
      model: "live-ingest",
    });
  }

  const facts = chatFactsForComposer(local);
  const polished = await featherlessComplete(
    [
      {
        role: "system",
        content: buildComposerSystemPrompt(facts, local.intent),
      },
      {
        role: "user",
        content: `User said: ${message}\n\nDeterministic draft to polish (keep all numbers/sources/IDs unchanged):\n${local.reply}`,
      },
    ],
    420
  );

  // Never let the LLM invent numbers — if polish drops key facts, keep deterministic reply
  const reply = polishIsSafe(polished, local.reply) ? polished! : local.reply;

  return NextResponse.json({
    ...local,
    reply,
    model: polished && reply === polished ? "featherless-composer" : "deterministic-agents",
  });
}

function polishIsSafe(polished: string | null, draft: string): boolean {
  if (!polished || polished.length < 20) return false;
  // Reject if model invents an evacuation order or real dispatch claim
  if (/\b(evacuat(e|ion) order|ambulance (has been|was) dispatch|rescue guaranteed)\b/i.test(polished)) {
    return false;
  }
  // Prefer polish when draft had an SOS id — ensure id preserved
  const sos = draft.match(/SOS-\d+/i);
  if (sos && !polished.includes(sos[0])) return false;
  return true;
}
