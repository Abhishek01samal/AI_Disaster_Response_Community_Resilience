import type { ChatIntent, IntentClassification } from "./types";

const CONFIDENCE_THRESHOLD = 0.55;

type Rule = {
  intent: ChatIntent;
  confidence: number;
  test: (q: string, raw: string) => boolean;
  reason: string;
};

const RULES: Rule[] = [
  {
    intent: "LOAD_REGION",
    confidence: 0.94,
    reason: "User asked for a place's current status — load live sources onto the console.",
    test: (q) =>
      /\b(nepal|napal|nepaal|rasuwa|nuwakot|dhading|chitwan|gorkha|trishuli|bhotekoshi|bhote koshi|kathmandu|nadipur)\b/.test(
        q
      ) ||
      /\b(current status|status of|situation in|what's happening in|whats happening in|live (picture|status) (in|for|of)|update (the )?(console|map) (for|to))\b/.test(
        q
      ),
  },
  {
    intent: "ESCALATE_TO_HUMAN",
    confidence: 0.95,
    reason: "User asked for a human operator.",
    test: (q) =>
      /\b(real (person|human|operator)|talk to (a )?(human|person|operator|someone)|escalate|call (an )?operator)\b/.test(
        q
      ),
  },
  {
    intent: "FILE_SOS",
    confidence: 0.92,
    reason: "Prompt requests emergency assistance.",
    test: (q) =>
      /\b(sos|send help|need (an )?ambulance|i('m| am) trapped|we are trapped|medical emergency|rescue (me|us)|send (an )?sos|file (an )?sos|i need help)\b/.test(
        q
      ) && !/\b(how (do|to)|what.*(sos|status)|where.*(sos)|status of (my )?sos)\b/.test(q),
  },
  {
    intent: "CHECK_SOS_STATUS",
    confidence: 0.9,
    reason: "User asking about an existing SOS.",
    test: (q) =>
      /\b(sos|ambulance).*(status|happening|update|where|assigned|eta)\b/.test(q) ||
      /\b(what('s| is) happening with (my )?sos|my sos|queue position)\b/.test(q),
  },
  {
    intent: "GET_ROUTE",
    confidence: 0.88,
    reason: "User wants a safe route.",
    test: (q) =>
      /\b(how (do|to) i (get|reach|go)|route to|safe(st)? (way|path|route)|directions to|navigate)\b/.test(
        q
      ),
  },
  {
    intent: "FIND_SAFE_LOCATION",
    confidence: 0.88,
    reason: "User asking where to go / nearest shelter.",
    test: (q) =>
      /\b(where (should|do|can) i go|nearest shelter|safe (place|location|spot)|where.*(shelter|camp)|evacuate to)\b/.test(
        q
      ),
  },
  {
    intent: "CHECK_SHELTER",
    confidence: 0.85,
    reason: "User asking about shelter capacity or a named camp.",
    test: (q) =>
      /\b(how full|capacity|occupancy|space (at|left)|needs? (at|for))\b/.test(q) &&
      /\b(shelter|camp|hall|school|depot|centre|center)\b/.test(q),
  },
  {
    intent: "REQUEST_RESOURCE",
    confidence: 0.85,
    reason: "User requesting relief supplies.",
    test: (q) =>
      /\b(we need|need blankets|need medicine|need water|request (resource|supplies|blankets|food)|send (blankets|medicine|water))\b/.test(
        q
      ),
  },
  {
    intent: "SUBMIT_REPORT",
    confidence: 0.84,
    reason: "Ground report of hazard conditions.",
    test: (q) =>
      /\b(water (is )?(coming|entering|rising)|road (is )?submerged|report that|file (a )?report|i (see|saw)|flooding (in|on)|fire in)\b/.test(
        q
      ),
  },
  {
    intent: "CHECK_RISK",
    confidence: 0.86,
    reason: "User asking about flood/risk/gauge conditions.",
    test: (q) =>
      /\b(is .+ flood|flooding|river|gauge|risk (index|level)|how (bad|dangerous)|warning|sector \d+)\b/.test(
        q
      ) &&
      (/\?/.test(q) ||
        /^(is |are |what|how|tell me|check)/.test(q) ||
        /\b(status|level|danger)\b/.test(q)),
  },
  {
    intent: "GENERAL_SAFETY_INFO",
    confidence: 0.8,
    reason: "General safety / do-now guidance.",
    test: (q) =>
      /\b(what should i do|how (do|to) (i )?stay safe|safety (tips|advice|info)|in (a |the )?flood|do'?s and don'?ts|preparedness)\b/.test(
        q
      ),
  },
  {
    intent: "MUTATE_SCENARIO",
    confidence: 0.82,
    reason: "Operator/demo asserting a new ground fact for the console.",
    test: (q, raw) => {
      const asking =
        /\?/.test(raw) ||
        /^(what|where|which|who|how|why|when|is |are |can |do |does )/i.test(raw.trim());
      if (asking) return false;
      return (
        /\b(set|update|change|make it|simulate|add |mark |raise|lower|increase|decrease|now at|rose to|dropped to|is now|has reached)\b/.test(
          q
        ) ||
        (/\b(river|gauge|level)\b/.test(q) && /\d+(\.\d+)?\s*m\b/.test(q)) ||
        (/\b(rain|rainfall)\b/.test(q) && /\d+\s*mm\b/.test(q))
      );
    },
  },
  {
    intent: "SMALL_TALK",
    confidence: 0.75,
    reason: "Out-of-scope or social small talk.",
    test: (q) =>
      /^(hi|hello|hey|thanks|thank you|how are you|good (morning|evening)|bye|who are you)\b/.test(
        q
      ) ||
      /\b(joke|weather in paris|recipe|stock market|legal advice|diagnose|prescription)\b/.test(q),
  },
];

/**
 * Map free text → one of the fixed intent set.
 * Low-confidence matches become CLARIFY instead of guessing.
 */
export function classifyChatIntent(raw: string): IntentClassification {
  const text = raw.trim();
  const q = text.toLowerCase();
  if (!text) {
    return { intent: "CLARIFY", confidence: 0, reason: "Empty prompt." };
  }

  const hits: IntentClassification[] = [];
  for (const rule of RULES) {
    if (rule.test(q, text)) {
      hits.push({ intent: rule.intent, confidence: rule.confidence, reason: rule.reason });
    }
  }

  if (hits.length === 0) {
    // Soft heuristics before clarifying
    if (/\b(shelter|camp|safe)\b/.test(q)) {
      return {
        intent: "FIND_SAFE_LOCATION",
        confidence: 0.6,
        reason: "Mentions shelter/safe without a clear verb — ranking locations.",
      };
    }
    if (/\b(flood|river|rain|risk|incident|status)\b/.test(q)) {
      return {
        intent: "LOAD_REGION",
        confidence: 0.62,
        reason: "Status/hazard ask — load live picture onto the console.",
      };
    }
    return {
      intent: "LOAD_REGION",
      confidence: 0.55,
      reason: "Treat as a region/status load onto the console, not a chat dump.",
    };
  }

  hits.sort((a, b) => b.confidence - a.confidence);
  const top = hits[0]!;

  // Dual-intent: report language + SOS urgency (spec example dialogue)
  const hasReport = hits.some((h) => h.intent === "SUBMIT_REPORT");
  const hasSos = hits.some((h) => h.intent === "FILE_SOS");
  if (hasReport && hasSos) {
    return {
      intent: "FILE_SOS",
      secondary: "SUBMIT_REPORT",
      confidence: Math.max(top.confidence, 0.9),
      reason: "Urgent ground report — treating as emergency intake with report signal.",
    };
  }

  if (top.confidence < CONFIDENCE_THRESHOLD) {
    return {
      intent: "CLARIFY",
      confidence: top.confidence,
      reason: `Best guess ${top.intent} below threshold — asking to clarify.`,
    };
  }

  return top;
}

/** Legacy 3-way intent for older console wiring. */
export type LegacyIntent = "QUERY" | "MUTATE" | "SOS";

export function toLegacyIntent(intent: ChatIntent): LegacyIntent {
  if (intent === "FILE_SOS") return "SOS";
  if (
    intent === "MUTATE_SCENARIO" ||
    intent === "SUBMIT_REPORT" ||
    intent === "REQUEST_RESOURCE" ||
    intent === "LOAD_REGION"
  ) {
    return "MUTATE";
  }
  return "QUERY";
}
