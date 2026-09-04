import { classifyChatIntent, toLegacyIntent } from "./chat/intents";

export type Intent = "QUERY" | "MUTATE" | "SOS";

export type IntentResult = { intent: Intent; reason: string };

/**
 * Legacy 3-way classifier. Prefer classifyChatIntent from lib/chat/intents.
 */
export function classifyIntent(raw: string): IntentResult {
  const c = classifyChatIntent(raw);
  return { intent: toLegacyIntent(c.intent), reason: c.reason };
}
