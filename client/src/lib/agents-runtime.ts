/**
 * Compatibility shim — orchestration now lives in lib/chat/engine.
 * Keeps older QUERY|MUTATE|SOS shape for any leftover callers.
 */
import { runChatTurn } from "./chat/engine";
import { toLegacyIntent } from "./chat/intents";
import { emptySession, type ConversationSession } from "./chat/types";
import type { AgentStep, ConsoleSnapshot } from "./snapshot";
import type { Intent } from "./intent";

export type OrchestrationResult = {
  intent: Intent;
  chatIntent?: string;
  reason: string;
  thinking: AgentStep[];
  reply: string;
  snapshot: ConsoleSnapshot;
  changed: boolean;
  session?: ConversationSession;
  options?: { id: string; label: string; value: string }[];
  card?: unknown;
  showDisclaimer?: boolean;
  pendingWrite?: unknown;
};

/** @deprecated Prefer runChatTurn — kept for API compatibility. */
export function runOrchestration(
  snapshot: ConsoleSnapshot,
  prompt: string,
  session: ConversationSession = emptySession()
): OrchestrationResult {
  const turn = runChatTurn(snapshot, prompt, session);
  return {
    intent: toLegacyIntent(turn.intent),
    chatIntent: turn.intent,
    reason: turn.reason,
    thinking: turn.thinking,
    reply: turn.reply,
    snapshot: turn.snapshot,
    changed: turn.changed,
    session: turn.session,
    options: turn.options,
    card: turn.card,
    showDisclaimer: turn.showDisclaimer,
    pendingWrite: turn.pendingWrite,
  };
}

export { runChatTurn };
