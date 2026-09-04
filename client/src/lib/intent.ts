export type Intent = "QUERY" | "MUTATE" | "SOS";

export type IntentResult = { intent: Intent; reason: string };

/**
 * Decide whether the user is asking for information or asserting a change.
 * Safety: questions never silently mutate the operating picture.
 */
export function classifyIntent(raw: string): IntentResult {
  const text = raw.trim();
  const q = text.toLowerCase();
  if (!text) {
    return { intent: "QUERY", reason: "Empty prompt — no change." };
  }

  const asking =
    /\?/.test(text) ||
    /^(what|where|which|who|how|why|when|is |are |can |do |does |did |tell me|explain|show me|status|nearest|list|summar)/i.test(
      text.trim()
    );

  const sosAsk = /\b(how (do|to) (i )?sos|where.*(sos|help)|what.*(sos|shelter))\b/i.test(q);
  const sosNeed =
    !sosAsk &&
    /\b(sos|send help|need (an )?ambulance|i('m| am) trapped|we are trapped|medical emergency|rescue (me|us))\b/i.test(
      q
    );

  if (sosNeed) {
    return {
      intent: "SOS",
      reason: "Prompt requests emergency assistance, not just information.",
    };
  }

  const factChange =
    /\b(set|update|change|make it|simulate|add |report that|mark |raise|lower|increase|decrease|redirect|now at|rose to|dropped to|is now|has reached|cross(ed)?|overflow)\b/i.test(
      q
    ) ||
    (/\b(river|gauge|level)\b/i.test(q) && /\d+(\.\d+)?\s*m\b/i.test(q) && !asking) ||
    (/\b(rain|rainfall)\b/i.test(q) && /\d+\s*mm\b/i.test(q) && !asking) ||
    /\b(new incident|water (has )?entered|road (is )?submerged|fire in|camp (is )?full)\b/i.test(q);

  if (factChange && asking) {
    return {
      intent: "QUERY",
      reason: "Question form — treating as a data request, not a scenario change.",
    };
  }

  if (factChange) {
    return {
      intent: "MUTATE",
      reason: "Prompt asserts a new ground fact or asks to update the operating picture.",
    };
  }

  return {
    intent: "QUERY",
    reason: "Prompt is asking about current data, not instructing a change.",
  };
}
