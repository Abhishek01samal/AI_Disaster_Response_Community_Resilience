import { readFileSync, existsSync } from "fs";
import { join } from "path";

function loadKeys(): { key?: string; model: string } {
  let key = process.env.FEATHERLESS_API_KEY;
  let model = process.env.AI_MODEL || "Qwen/Qwen2.5-7B-Instruct";
  const envPath = join(process.cwd(), "..", "server", ".env");
  if (!key && existsSync(envPath)) {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (k === "FEATHERLESS_API_KEY") key = v;
      if (k === "AI_MODEL" && v) model = v;
    }
  }
  return { key, model };
}

export async function featherlessComplete(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens = 500
): Promise<string | null> {
  const { key, model } = loadKeys();
  if (!key) return null;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch("https://api.featherless.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
