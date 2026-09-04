import { NextResponse } from "next/server";
import { runOrchestration } from "@/lib/agents-runtime";
import { classifyIntent } from "@/lib/intent";
import type { ConsoleSnapshot } from "@/lib/snapshot";
import { featherlessComplete } from "@/lib/featherless";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    message?: string;
    snapshot?: ConsoleSnapshot;
  };
  const message = (body.message ?? "").trim();
  if (!message || !body.snapshot) {
    return NextResponse.json({ error: "message and snapshot required" }, { status: 400 });
  }

  const local = runOrchestration(body.snapshot, message);
  const intentCheck = classifyIntent(message);

  const polished = await featherlessComplete(
    [
      {
        role: "system",
        content: `You are the ResQ Master narrator. Intent already classified as ${local.intent} (${intentCheck.reason}).
If intent is QUERY you must NOT claim the map/data was changed.
If intent is MUTATE or SOS, summarize the agent run in 3-5 sentences. Never issue evacuation orders or real dispatch.
Agent trace:\n${local.thinking.map((s) => `${s.agent}: ${s.text}`).join("\n")}
Facts: river ${local.snapshot.riverM}m, rain ${local.snapshot.rainfallMm}mm, risk ${local.snapshot.riskIndex}, top shelter ${local.snapshot.safePlaces[0]?.name}.`,
      },
      { role: "user", content: message },
    ],
    320
  );

  return NextResponse.json({
    ...local,
    reply: polished || local.reply,
    model: polished ? "featherless" : "deterministic-agents",
  });
}
