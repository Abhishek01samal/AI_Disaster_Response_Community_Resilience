import { ENV } from "./env.js";
import logger from "./logger.js";

export type ChatTurn = { role: "system" | "user" | "assistant"; content: string };

/**
 * Single LLM gateway. All ResQ model calls that are not Inngest `step.ai`
 * go through Featherless (OpenAI-compatible) using the configured model
 * and API key only — no other providers.
 */
export async function featherlessChat(
  messages: ChatTurn[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string | null> {
  if (!ENV.FEATHERLESS_API_KEY) {
    logger.warn("FEATHERLESS_API_KEY missing — skipping live LLM call");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch("https://api.featherless.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.FEATHERLESS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ENV.AI_MODEL || "Qwen/Qwen2.5-7B-Instruct",
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 450,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error(`Featherless chat failed (${res.status}): ${body.slice(0, 400)}`);
      return null;
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    logger.error(`Featherless chat error: ${(err as Error).message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
